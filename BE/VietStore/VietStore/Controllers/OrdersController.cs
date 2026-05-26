using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update;
using System.Security.Claims;
using VietStore.Data;
using VietStore.Models;
using VietStore.Services;

namespace VietStore.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;
    private readonly IEmailService _emailService;
    private const int LowStockThreshold = 5;

    public OrdersController(VietStoreDbContext dbContext, IEmailService emailService)
    {
        _dbContext = dbContext;
        _emailService = emailService;
    }

    private static bool IsBlockedStatus(string? status)
    {
        var s = (status ?? "").Trim().ToLowerInvariant();
        return s == "locked" || s == "inactive" || s == "khoa" || s == "tam ngung";
    }

    [HttpGet("history")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetOrderCrudHistory([FromQuery] int limit = 100)
    {
        if (limit <= 0) limit = 20;
        if (limit > 500) limit = 500;

        List<object> items;
        try
        {
            items = await _dbContext.NhatKyDonHang
                .AsNoTracking()
                .OrderByDescending(x => x.ThoiGian)
                .Take(limit)
                .Select(x => new
                {
                    x.MaNhatKy,
                    x.MaDonHang,
                    x.HanhDong,
                    x.NoiDung,
                    x.NguoiThucHien,
                    x.VaiTro,
                    x.ThoiGian
                })
                .Cast<object>()
                .ToListAsync();
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            items = [];
        }

        return Ok(items);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userIdFromToken = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdFromToken))
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

        if (!string.IsNullOrWhiteSpace(request.MaNguoiDung) &&
            !string.Equals(request.MaNguoiDung, userIdFromToken, StringComparison.Ordinal))
        {
            return Forbid();
        }

        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == userIdFromToken);
        if (user is null) return Unauthorized(new { message = "User not found" });
        if (IsBlockedStatus(user.TrangThai))
        {
            return Forbid();
        }

        request = request with { MaNguoiDung = userIdFromToken };

        await using var tx = await _dbContext.Database.BeginTransactionAsync();

        var requestedItems = request.CartItems
            .Where(x => !string.IsNullOrWhiteSpace(x.MaSanPham))
            .GroupBy(x => x.MaSanPham)
            .Select(g => new { MaSanPham = g.Key, SoLuong = g.Sum(i => i.SoLuong) })
            .ToList();

        var productIds = requestedItems.Select(x => x.MaSanPham).ToList();
        var products = await _dbContext.SanPham
            .Where(x => productIds.Contains(x.MaSanPham))
            .ToDictionaryAsync(x => x.MaSanPham, x => x);

        foreach (var item in requestedItems)
        {
            if (!products.TryGetValue(item.MaSanPham, out var product))
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = $"San pham khong ton tai: {item.MaSanPham}" });
            }

            if (item.SoLuong <= 0)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = $"So luong khong hop le cho san pham: {item.MaSanPham}" });
            }

            if (product.SoLuongTon < item.SoLuong)
            {
                await tx.RollbackAsync();
                return BadRequest(new
                {
                    message = $"San pham {product.TenSanPham} khong du ton kho",
                    maSanPham = product.MaSanPham,
                    soLuongTon = product.SoLuongTon,
                    soLuongDat = item.SoLuong
                });
            }
        }

        var orderId = $"DH{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var paymentMethod = (request.PhuongThucThanhToan ?? "COD").Trim().ToUpperInvariant();
        var order = new DonHang
        {
            MaDonHang = orderId,
            MaNguoiDung = request.MaNguoiDung,
            TenKhachHang = request.TenKhachHang,
            SoDienThoai = request.SoDienThoai,
            DiaChiGiaoHang = request.DiaChiGiaoHang,
            TongTien = request.TongTien,
            PhuongThucThanhToan = paymentMethod,
            TrangThai = paymentMethod == "VNPAY" ? "ChoThanhToan" : "ChoXacNhan",
            NgayDatHang = request.NgayDatHang ?? DateTime.UtcNow
        };

        _dbContext.DonHang.Add(order);
        await _dbContext.SaveChangesAsync();

        var details = request.CartItems.Select(x => new ChiTietDonHang
        {
            MaDonHang = orderId,
            MaSanPham = x.MaSanPham,
            TenSanPham = x.TenSanPham,
            URLHinhAnh = x.URLHinhAnh,
            KichThuoc = x.KichThuoc,
            DonGia = x.DonGia,
            SoLuong = x.SoLuong
        }).ToList();

        _dbContext.ChiTietDonHang.AddRange(details);
        await _dbContext.SaveChangesAsync();

        foreach (var item in requestedItems)
        {
            products[item.MaSanPham].SoLuongTon -= item.SoLuong;
        }
        await _dbContext.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(request.MaCode))
        {
            var code = request.MaCode.Trim();
            var today = DateTime.UtcNow.Date;
            var voucher = await _dbContext.KhuyenMai.FirstOrDefaultAsync(x => x.MaCode == code);
            if (voucher is null)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Ma giam gia khong ton tai" });
            }

            if (!voucher.TrangThai || voucher.NgayBatDau > today || voucher.NgayKetThuc < today)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Ma giam gia het han hoac khong hoat dong" });
            }

            if (voucher.SoLuong <= voucher.DaSuDung)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Ma giam gia da het luot su dung" });
            }

            voucher.DaSuDung += 1;
            await _dbContext.SaveChangesAsync();
        }

        await AddAdminNotification(
            "Đơn hàng mới",
            $"Đơn {orderId} vừa được tạo bởi {order.TenKhachHang}.",
            "ORDER_CREATED"
        );

        foreach (var item in requestedItems)
        {
            if (!products.TryGetValue(item.MaSanPham, out var p)) continue;
            if (p.SoLuongTon <= LowStockThreshold)
            {
                await AddAdminNotification(
                    "Cảnh báo tồn kho thấp",
                    $"Sản phẩm {p.TenSanPham} chỉ còn {p.SoLuongTon} trong kho.",
                    "LOW_STOCK"
                );
            }
        }

        await AddOrderHistory(orderId, "CREATE", $"Tạo đơn hàng: {orderId} ({order.TrangThai})");
        await tx.CommitAsync();
        await SendOrderCreatedEmail(order);

        return Ok(new { id = orderId, status = order.TrangThai });
    }

    [HttpGet]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetOrders()
    {
        var orders = await _dbContext.DonHang
            .AsNoTracking()
            .OrderByDescending(x => x.NgayDatHang)
            .Select(x => new
            {
                x.MaDonHang,
                x.MaNguoiDung,
                x.TenKhachHang,
                x.SoDienThoai,
                x.DiaChiGiaoHang,
                x.TongTien,
                x.PhuongThucThanhToan,
                x.TrangThai,
                x.NgayDatHang
            })
            .ToListAsync();
        return Ok(orders);
    }

    [HttpGet("{maDonHang}")]
    [Authorize]
    public async Task<IActionResult> GetOrder(string maDonHang)
    {
        var order = await _dbContext.DonHang
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaDonHang == maDonHang);
        if (order is null) return NotFound();

        var details = await _dbContext.ChiTietDonHang
            .AsNoTracking()
            .Where(x => x.MaDonHang == maDonHang)
            .ToListAsync();
        return Ok(new { order, details });
    }

    [HttpPut("{maDonHang}/status")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateOrderStatus(string maDonHang, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _dbContext.DonHang.FirstOrDefaultAsync(x => x.MaDonHang == maDonHang);
        if (order is null) return NotFound();

        var oldStatus = order.TrangThai;
        order.TrangThai = request.TrangThai;

        if (oldStatus != "DaHuy" && request.TrangThai == "DaHuy")
        {
            var details = await _dbContext.ChiTietDonHang.Where(x => x.MaDonHang == maDonHang).ToListAsync();
            var groups = details.GroupBy(x => x.MaSanPham).Select(g => new { MaSanPham = g.Key, SoLuong = g.Sum(i => i.SoLuong) });
            foreach (var g in groups)
            {
                var p = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == g.MaSanPham);
                if (p != null) p.SoLuongTon += g.SoLuong;
            }
        }
        else if (oldStatus == "DaHuy" && request.TrangThai != "DaHuy")
        {
            var details = await _dbContext.ChiTietDonHang.Where(x => x.MaDonHang == maDonHang).ToListAsync();
            var groups = details.GroupBy(x => x.MaSanPham).Select(g => new { MaSanPham = g.Key, SoLuong = g.Sum(i => i.SoLuong) });
            foreach (var g in groups)
            {
                var p = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == g.MaSanPham);
                if (p is null || p.SoLuongTon < g.SoLuong)
                {
                    return BadRequest(new { message = $"Khong du ton kho de mo lai don {maDonHang}" });
                }
                p.SoLuongTon -= g.SoLuong;
            }
        }

        await _dbContext.SaveChangesAsync();
        await AddOrderHistory(maDonHang, "UPDATE_STATUS", $"Cập nhật trạng thái đơn {maDonHang}: {oldStatus} -> {request.TrangThai}");

        if (request.TrangThai == "DaHuy" && oldStatus != "DaHuy")
        {
            await SendOrderCancelledEmail(order);
        }
        else if (request.TrangThai == "HoanThanh" && oldStatus != "HoanThanh")
        {
            await SendOrderCompletedEmail(order);
        }

        return Ok(order);
    }

    private async Task AddOrderHistory(string maDonHang, string action, string message)
    {
        var actorName = Request.Headers["X-User-Name"].FirstOrDefault();
        var actorRole = Request.Headers["X-User-Role"].FirstOrDefault();

        var log = new NhatKyDonHang
        {
            MaDonHang = maDonHang,
            HanhDong = action,
            NoiDung = message,
            NguoiThucHien = string.IsNullOrWhiteSpace(actorName) ? "Hệ thống" : actorName.Trim(),
            VaiTro = string.IsNullOrWhiteSpace(actorRole) ? "Unknown" : actorRole.Trim(),
            ThoiGian = DateTime.UtcNow
        };

        try
        {
            _dbContext.NhatKyDonHang.Add(log);
            await _dbContext.SaveChangesAsync();
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            // Table NhatKyDonHang not created yet, skip logging.
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx && sqlEx.Number == 208)
        {
            // Table NhatKyDonHang not created yet, skip logging.
        }
    }

    private async Task AddAdminNotification(string title, string content, string type)
    {
        try
        {
            _dbContext.ThongBao.Add(new ThongBao
            {
                MaNguoiDung = null, // Global for admin/staff
                TieuDe = title,
                NoiDung = content,
                LoaiThongBao = type,
                DaDoc = false,
                ThoiGian = DateTime.UtcNow
            });
            await _dbContext.SaveChangesAsync();
        }
        catch
        {
            // Do not block checkout/order flow because of notification failure.
        }
    }

    private async Task<string?> ResolveUserEmail(string? maNguoiDung)
    {
        if (string.IsNullOrWhiteSpace(maNguoiDung)) return null;
        return await _dbContext.NguoiDung
            .Where(x => x.MaNguoiDung == maNguoiDung)
            .Select(x => x.Email)
            .FirstOrDefaultAsync();
    }

    private async Task SendOrderCreatedEmail(DonHang order)
    {
        try
        {
            var email = await ResolveUserEmail(order.MaNguoiDung);
            if (string.IsNullOrWhiteSpace(email)) return;
            var html = EmailTemplates.OrderCreatedTemplate(order.TenKhachHang, order.MaDonHang, order.TongTien, order.PhuongThucThanhToan);
            await _emailService.SendAsync(email, $"[VietStore] Đặt hàng thành công #{order.MaDonHang}", html);
        }
        catch
        {
            // Do not block main order flow.
        }
    }

    private async Task SendOrderCancelledEmail(DonHang order)
    {
        try
        {
            var email = await ResolveUserEmail(order.MaNguoiDung);
            if (string.IsNullOrWhiteSpace(email)) return;
            var html = EmailTemplates.OrderCancelledTemplate(order.TenKhachHang, order.MaDonHang);
            await _emailService.SendAsync(email, $"[VietStore] Đơn hàng đã hủy #{order.MaDonHang}", html);
        }
        catch
        {
            // Do not block status update flow.
        }
    }

    private async Task SendOrderCompletedEmail(DonHang order)
    {
        try
        {
            var email = await ResolveUserEmail(order.MaNguoiDung);
            if (string.IsNullOrWhiteSpace(email)) return;
            var html = EmailTemplates.OrderCompletedTemplate(order.TenKhachHang, order.MaDonHang);
            await _emailService.SendAsync(email, $"[VietStore] Đơn hàng hoàn thành #{order.MaDonHang}", html);
        }
        catch
        {
            // Do not block status update flow.
        }
    }
}

public record OrderItemRequest(string MaSanPham, string TenSanPham, string? URLHinhAnh, string? KichThuoc, int SoLuong, decimal DonGia);
public record CreateOrderRequest(DateTime? NgayDatHang, string? MaNguoiDung, string TenKhachHang, string SoDienThoai, string DiaChiGiaoHang, string? MaCode, string PhuongThucThanhToan, decimal TongTien, List<OrderItemRequest> CartItems);
public record UpdateOrderStatusRequest(string TrangThai);






