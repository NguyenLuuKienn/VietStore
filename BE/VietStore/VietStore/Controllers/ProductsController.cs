using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public ProductsController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("history")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetProductCrudHistory([FromQuery] int limit = 100)
    {
        if (limit <= 0) limit = 20;
        if (limit > 500) limit = 500;

        var items = await _dbContext.NhatKySanPham
            .AsNoTracking()
            .OrderByDescending(x => x.ThoiGian)
            .Take(limit)
            .Select(x => new
            {
                x.MaNhatKy,
                x.MaSanPham,
                x.HanhDong,
                x.NoiDung,
                x.NguoiThucHien,
                x.VaiTro,
                x.ThoiGian
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? maDanhMuc, [FromQuery] string? tenSanPham, [FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] bool includeImages = false, [FromQuery] bool includeHidden = false)
    {
        var canSeeHidden = User?.Identity?.IsAuthenticated == true &&
                           (User.IsInRole("admin") || User.IsInRole("staff"));
        if (!canSeeHidden) includeHidden = false;

        var query = _dbContext.SanPham.AsNoTracking().AsQueryable();
        if (!includeHidden) query = query.Where(x => x.IsVisible);
        if (!string.IsNullOrWhiteSpace(maDanhMuc)) query = query.Where(x => x.MaDanhMuc == maDanhMuc);
        if (!string.IsNullOrWhiteSpace(tenSanPham)) query = query.Where(x => x.TenSanPham.Contains(tenSanPham));

        var total = await query.CountAsync();
        object items;
        if (includeImages)
        {
            items = await query.OrderByDescending(x => x.NgayTao)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    x.MaSanPham,
                    x.TenSanPham,
                    x.GiaBan,
                    x.IsGiamGia,
                    x.SoTienGiam,
                    x.MoTa,
                    x.ThongTinChiTiet,
                    x.SoLuongTon,
                    x.MaDanhMuc,
                    TenDanhMuc = _dbContext.DanhMuc.Where(c => c.MaDanhMuc == x.MaDanhMuc).Select(c => c.TenDanhMuc).FirstOrDefault(),
                    x.MaNhaCungCap,
                    TenCongTy = _dbContext.NhaCungCap.Where(s => s.MaNhaCungCap == x.MaNhaCungCap).Select(s => s.TenCongTy).FirstOrDefault(),
                    x.SoLuotBan,
                    x.IsVisible,
                    x.IsFeaturedNew,
                    x.IsFeaturedBestseller,
                    x.NgayTao,
                    AnhDaiDien = _dbContext.HinhAnhSanPham.Where(i => i.MaSanPham == x.MaSanPham).Select(i => i.URLHinhAnh).FirstOrDefault(),
                    Images = _dbContext.HinhAnhSanPham
                        .Where(i => i.MaSanPham == x.MaSanPham)
                        .OrderBy(i => i.MaHinhAnh)
                        .Select(i => i.URLHinhAnh)
                        .Take(6)
                        .ToList()
                }).ToListAsync();
        }
        else
        {
            items = await query.OrderByDescending(x => x.NgayTao)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    x.MaSanPham,
                    x.TenSanPham,
                    x.GiaBan,
                    x.IsGiamGia,
                    x.SoTienGiam,
                    x.MoTa,
                    x.ThongTinChiTiet,
                    x.SoLuongTon,
                    x.MaDanhMuc,
                    TenDanhMuc = _dbContext.DanhMuc.Where(c => c.MaDanhMuc == x.MaDanhMuc).Select(c => c.TenDanhMuc).FirstOrDefault(),
                    x.MaNhaCungCap,
                    TenCongTy = _dbContext.NhaCungCap.Where(s => s.MaNhaCungCap == x.MaNhaCungCap).Select(s => s.TenCongTy).FirstOrDefault(),
                    x.SoLuotBan,
                    x.IsVisible,
                    x.IsFeaturedNew,
                    x.IsFeaturedBestseller,
                    x.NgayTao,
                    AnhDaiDien = _dbContext.HinhAnhSanPham
                        .Where(i => i.MaSanPham == x.MaSanPham)
                        .OrderBy(i => i.MaHinhAnh)
                        .Select(i => i.URLHinhAnh)
                        .FirstOrDefault()
                }).ToListAsync();
        }

        return Ok(new { page, limit, total, items });
    }

    [HttpGet("{maSanPham}")]
    public async Task<IActionResult> GetProduct(string maSanPham)
    {
        var sp = await _dbContext.SanPham
            .AsNoTracking()
            .Where(x => x.MaSanPham == maSanPham)
            .Select(x => new
            {
                x.MaSanPham,
                x.TenSanPham,
                x.MaDanhMuc,
                TenDanhMuc = _dbContext.DanhMuc.Where(c => c.MaDanhMuc == x.MaDanhMuc).Select(c => c.TenDanhMuc).FirstOrDefault(),
                x.MaNhaCungCap,
                TenCongTy = _dbContext.NhaCungCap.Where(s => s.MaNhaCungCap == x.MaNhaCungCap).Select(s => s.TenCongTy).FirstOrDefault(),
                x.GiaBan,
                x.IsGiamGia,
                x.SoTienGiam,
                x.MoTa,
                x.ThongTinChiTiet,
                x.SoLuongTon,
                x.SoLuotBan,
                x.IsVisible,
                x.IsFeaturedNew,
                x.IsFeaturedBestseller,
                x.NgayTao
            })
            .FirstOrDefaultAsync();
        if (sp is null) return NotFound();

        var images = await _dbContext.HinhAnhSanPham
            .AsNoTracking()
            .Where(x => x.MaSanPham == maSanPham)
            .Select(x => new { x.MaHinhAnh, x.MaSanPham, x.URLHinhAnh })
            .ToListAsync();
        var sizes = await _dbContext.KichThuocSanPham
            .AsNoTracking()
            .Where(x => x.MaSanPham == maSanPham)
            .Select(x => new { x.MaKichThuoc, x.MaSanPham, x.TenKichThuoc })
            .ToListAsync();

        return Ok(new { product = sp, images, sizes });
    }

    [HttpPost]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (request.SoLuongTon < 0)
            return BadRequest(new { message = "So luong ton khong duoc am" });

        var item = new SanPham
        {
            MaSanPham = request.MaSanPham,
            TenSanPham = request.TenSanPham,
            MaDanhMuc = request.MaDanhMuc,
            MaNhaCungCap = request.MaNhaCungCap,
            GiaBan = request.GiaBan,
            IsGiamGia = request.IsGiamGia,
            SoTienGiam = request.IsGiamGia ? Math.Max(0, request.SoTienGiam) : 0,
            MoTa = request.MoTa,
            ThongTinChiTiet = request.ThongTinChiTiet,
            SoLuongTon = request.SoLuongTon,
            IsVisible = request.IsVisible,
            IsFeaturedNew = request.IsFeaturedNew,
            IsFeaturedBestseller = request.IsFeaturedBestseller,
            NgayTao = DateTime.UtcNow
        };
        _dbContext.SanPham.Add(item);
        await _dbContext.SaveChangesAsync();
        await AddProductHistory(item.MaSanPham, "CREATE", $"Thêm sản phẩm: {item.TenSanPham}");
        return Ok(item);
    }

    [HttpPut("{maSanPham}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateProduct(string maSanPham, [FromBody] UpdateProductRequest request)
    {
        var item = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == maSanPham);
        if (item is null) return NotFound();
        if (request.SoLuongTon < 0)
            return BadRequest(new { message = "So luong ton khong duoc am" });

        item.TenSanPham = request.TenSanPham;
        item.MaDanhMuc = request.MaDanhMuc;
        item.MaNhaCungCap = request.MaNhaCungCap;
        item.GiaBan = request.GiaBan;
        item.IsGiamGia = request.IsGiamGia;
        item.SoTienGiam = request.IsGiamGia ? Math.Max(0, request.SoTienGiam) : 0;
        item.MoTa = request.MoTa;
        item.ThongTinChiTiet = request.ThongTinChiTiet;
        item.SoLuongTon = request.SoLuongTon;
        item.IsVisible = request.IsVisible;
        item.IsFeaturedNew = request.IsFeaturedNew;
        item.IsFeaturedBestseller = request.IsFeaturedBestseller;
        await _dbContext.SaveChangesAsync();
        await AddProductHistory(item.MaSanPham, "UPDATE", $"Cập nhật sản phẩm: {item.TenSanPham}");
        return Ok(item);
    }

    [HttpDelete("{maSanPham}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteProduct(string maSanPham)
    {
        var item = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == maSanPham);
        if (item is null) return NotFound();
        var oldName = item.TenSanPham;
        _dbContext.SanPham.Remove(item);
        await _dbContext.SaveChangesAsync();
        await AddProductHistory(maSanPham, "DELETE", $"Xóa sản phẩm: {oldName}");
        return NoContent();
    }

    [HttpPost("{maSanPham}/sold-count")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateSoldCount(string maSanPham, [FromBody] UpdateSoldCountRequest request)
    {
        var item = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == maSanPham);
        if (item is null) return NotFound();

        var next = item.SoLuotBan + request.Amount;
        item.SoLuotBan = next < 0 ? 0 : next;
        await _dbContext.SaveChangesAsync();
        return Ok(new { item.MaSanPham, item.SoLuotBan });
    }

    [HttpPost("{maSanPham}/images")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> AddProductImage(string maSanPham, [FromBody] AddProductImageRequest request)
    {
        var image = new HinhAnhSanPham { MaSanPham = maSanPham, URLHinhAnh = request.URLHinhAnh };
        _dbContext.HinhAnhSanPham.Add(image);
        await _dbContext.SaveChangesAsync();
        return Ok(image);
    }

    [HttpPost("{maSanPham}/images/bulk")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> AddProductImagesBulk(string maSanPham, [FromBody] AddProductImagesBulkRequest request)
    {
        var urls = request.URLHinhAnhs?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .ToList() ?? new List<string>();

        if (urls.Count == 0) return BadRequest(new { message = "URLHinhAnhs is empty" });
        if (urls.Count > 6) return BadRequest(new { message = "Toi da 6 anh moi lan tai len" });

        var currentCount = await _dbContext.HinhAnhSanPham.CountAsync(x => x.MaSanPham == maSanPham);
        if (currentCount + urls.Count > 6)
        {
            return BadRequest(new { message = "Moi san pham chi duoc toi da 6 anh" });
        }

        var images = urls.Select(url => new HinhAnhSanPham
        {
            MaSanPham = maSanPham,
            URLHinhAnh = url
        }).ToList();

        _dbContext.HinhAnhSanPham.AddRange(images);
        await _dbContext.SaveChangesAsync();
        return Ok(images);
    }

    [HttpDelete("{maSanPham}/images/{maHinhAnh:int}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteProductImage(string maSanPham, int maHinhAnh)
    {
        var image = await _dbContext.HinhAnhSanPham.FirstOrDefaultAsync(x => x.MaSanPham == maSanPham && x.MaHinhAnh == maHinhAnh);
        if (image is null) return NotFound();
        _dbContext.HinhAnhSanPham.Remove(image);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{maSanPham}/sizes")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> AddProductSize(string maSanPham, [FromBody] AddProductSizeRequest request)
    {
        var size = new KichThuocSanPham { MaSanPham = maSanPham, TenKichThuoc = request.TenKichThuoc };
        _dbContext.KichThuocSanPham.Add(size);
        await _dbContext.SaveChangesAsync();
        return Ok(size);
    }

    [HttpDelete("{maSanPham}/sizes/{maKichThuoc:int}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteProductSize(string maSanPham, int maKichThuoc)
    {
        var size = await _dbContext.KichThuocSanPham.FirstOrDefaultAsync(x => x.MaSanPham == maSanPham && x.MaKichThuoc == maKichThuoc);
        if (size is null) return NotFound();
        _dbContext.KichThuocSanPham.Remove(size);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task AddProductHistory(string? maSanPham, string action, string message)
    {
        var actorName = Request.Headers["X-User-Name"].FirstOrDefault();
        var actorRole = Request.Headers["X-User-Role"].FirstOrDefault();

        var log = new NhatKySanPham
        {
            MaSanPham = maSanPham,
            HanhDong = action,
            NoiDung = message,
            NguoiThucHien = string.IsNullOrWhiteSpace(actorName) ? "Hệ thống" : actorName.Trim(),
            VaiTro = string.IsNullOrWhiteSpace(actorRole) ? "Unknown" : actorRole.Trim(),
            ThoiGian = DateTime.UtcNow
        };

        _dbContext.NhatKySanPham.Add(log);
        await _dbContext.SaveChangesAsync();
    }
}

public record CreateProductRequest(string MaSanPham, string TenSanPham, string MaDanhMuc, string? MaNhaCungCap, decimal GiaBan, bool IsGiamGia, decimal SoTienGiam, string? MoTa, string? ThongTinChiTiet, int SoLuongTon, bool IsVisible, bool IsFeaturedNew, bool IsFeaturedBestseller);
public record UpdateProductRequest(string TenSanPham, string MaDanhMuc, string? MaNhaCungCap, decimal GiaBan, bool IsGiamGia, decimal SoTienGiam, string? MoTa, string? ThongTinChiTiet, int SoLuongTon, bool IsVisible, bool IsFeaturedNew, bool IsFeaturedBestseller);
public record AddProductImageRequest(string URLHinhAnh);
public record AddProductImagesBulkRequest(List<string> URLHinhAnhs);
public record AddProductSizeRequest(string TenKichThuoc);
public record UpdateSoldCountRequest(int Amount);


