using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public OrdersController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        await using var tx = await _dbContext.Database.BeginTransactionAsync();

        // Validate stock before creating order
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

        // Reserve stock immediately when order is created
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

        await tx.CommitAsync();

        return Ok(new { id = orderId, status = order.TrangThai });
    }

    [HttpGet]
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
    public async Task<IActionResult> UpdateOrderStatus(string maDonHang, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _dbContext.DonHang.FirstOrDefaultAsync(x => x.MaDonHang == maDonHang);
        if (order is null) return NotFound();

        var oldStatus = order.TrangThai;
        order.TrangThai = request.TrangThai;

        // If cancelled, return stock. If re-opened from cancelled, reserve again.
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
        return Ok(order);
    }
}

public record OrderItemRequest(string MaSanPham, string TenSanPham, string? URLHinhAnh, string? KichThuoc, int SoLuong, decimal DonGia);
public record CreateOrderRequest(DateTime? NgayDatHang, string? MaNguoiDung, string TenKhachHang, string SoDienThoai, string DiaChiGiaoHang, string? MaCode, string PhuongThucThanhToan, decimal TongTien, List<OrderItemRequest> CartItems);
public record UpdateOrderStatusRequest(string TrangThai);
