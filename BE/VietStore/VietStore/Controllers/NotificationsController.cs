using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public NotificationsController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string? maNguoiDung)
    {
        var query = _dbContext.ThongBao.AsQueryable();
        if (!string.IsNullOrWhiteSpace(maNguoiDung))
        {
            query = query.Where(x => x.MaNguoiDung == maNguoiDung || x.MaNguoiDung == null);
        }

        var items = await query.OrderByDescending(x => x.ThoiGian).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
    {
        var item = new ThongBao
        {
            MaNguoiDung = request.MaNguoiDung,
            TieuDe = request.TieuDe,
            NoiDung = request.NoiDung,
            LoaiThongBao = request.LoaiThongBao,
            DaDoc = false,
            ThoiGian = DateTime.UtcNow
        };
        _dbContext.ThongBao.Add(item);
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{maThongBao:int}/read")]
    public async Task<IActionResult> MarkAsRead(int maThongBao)
    {
        var item = await _dbContext.ThongBao.FirstOrDefaultAsync(x => x.MaThongBao == maThongBao);
        if (item is null) return NotFound();
        item.DaDoc = true;
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] string? maNguoiDung)
    {
        var query = _dbContext.ThongBao.AsQueryable();
        if (!string.IsNullOrWhiteSpace(maNguoiDung))
        {
            query = query.Where(x => x.MaNguoiDung == maNguoiDung || x.MaNguoiDung == null);
        }

        var items = await query.Where(x => !x.DaDoc).ToListAsync();
        foreach (var item in items) item.DaDoc = true;
        await _dbContext.SaveChangesAsync();
        return Ok(new { DaDocTatCa = true, SoLuong = items.Count });
    }
}

public record CreateNotificationRequest(string? MaNguoiDung, string TieuDe, string NoiDung, string LoaiThongBao);
