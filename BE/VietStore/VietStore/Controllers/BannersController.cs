using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public BannersController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetBanners([FromQuery] string? type)
    {
        var query = _dbContext.Banner.AsQueryable();
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.LoaiBanner == type);
        var items = await query.OrderBy(x => x.ThuTu).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBanner([FromBody] CreateBannerRequest request)
    {
        var item = new Banner
        {
            MaBanner = request.MaBanner,
            TieuDe = request.TieuDe,
            PhuDe = request.PhuDe,
            MucGiam = request.MucGiam,
            MaCode = request.MaCode,
            URLHinhAnh = request.URLHinhAnh,
            DuongDan = request.DuongDan,
            ThuTu = request.ThuTu,
            LoaiBanner = request.LoaiBanner
        };
        _dbContext.Banner.Add(item);
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{maBanner}")]
    public async Task<IActionResult> UpdateBanner(string maBanner, [FromBody] UpdateBannerRequest request)
    {
        var item = await _dbContext.Banner.FirstOrDefaultAsync(x => x.MaBanner == maBanner);
        if (item is null) return NotFound();

        item.TieuDe = request.TieuDe;
        item.PhuDe = request.PhuDe;
        item.MucGiam = request.MucGiam;
        item.MaCode = request.MaCode;
        item.URLHinhAnh = request.URLHinhAnh;
        item.DuongDan = request.DuongDan;
        item.ThuTu = request.ThuTu;
        item.LoaiBanner = request.LoaiBanner;

        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{maBanner}")]
    public async Task<IActionResult> DeleteBanner(string maBanner)
    {
        var item = await _dbContext.Banner.FirstOrDefaultAsync(x => x.MaBanner == maBanner);
        if (item is null) return NotFound();
        _dbContext.Banner.Remove(item);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateBannerRequest(string MaBanner, string TieuDe, string? PhuDe, string? MucGiam, string? MaCode, string URLHinhAnh, string? DuongDan, int ThuTu, string LoaiBanner);
public record UpdateBannerRequest(string TieuDe, string? PhuDe, string? MucGiam, string? MaCode, string URLHinhAnh, string? DuongDan, int ThuTu, string LoaiBanner);
