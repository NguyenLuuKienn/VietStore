using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;

namespace VietStore.Controllers;

[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public StatsController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("dashboard-summary")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DashboardSummary()
    {
        var completedStatuses = new[] { "HoanThanh", "Completed" };
        var revenue = await _dbContext.DonHang
            .Where(x => completedStatuses.Contains(x.TrangThai))
            .SumAsync(x => (decimal?)x.TongTien) ?? 0m;
        var totalOrders = await _dbContext.DonHang.CountAsync();
        var newCustomers = await _dbContext.NguoiDung.CountAsync();
        var products = await _dbContext.SanPham.CountAsync();

        return Ok(new
        {
            TongDoanhThu = revenue,
            TongDonHang = totalOrders,
            KhachHangMoi = newCustomers,
            SanPhamDangBan = products
        });
    }

    [HttpGet("revenue")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Revenue([FromQuery] string? groupBy, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var completedStatuses = new[] { "HoanThanh", "Completed" };
        var query = _dbContext.DonHang.Where(x => completedStatuses.Contains(x.TrangThai));
        if (from.HasValue) query = query.Where(x => x.NgayDatHang >= from.Value);
        if (to.HasValue) query = query.Where(x => x.NgayDatHang <= to.Value);

        var data = await query.ToListAsync();
        var mode = (groupBy ?? "month").ToLowerInvariant();
        var points = mode switch
        {
            "week" => data.GroupBy(x => $"{x.NgayDatHang:yyyy}-W{System.Globalization.ISOWeek.GetWeekOfYear(x.NgayDatHang)}")
                .Select(g => new { Label = g.Key, Value = g.Sum(x => x.TongTien) })
                .OrderBy(x => x.Label)
                .ToList(),
            _ => data.GroupBy(x => x.NgayDatHang.ToString("yyyy-MM"))
                .Select(g => new { Label = g.Key, Value = g.Sum(x => x.TongTien) })
                .OrderBy(x => x.Label)
                .ToList()
        };

        return Ok(new
        {
            groupBy = mode,
            from,
            to,
            points
        });
    }

    [HttpGet("top-products")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> TopProducts([FromQuery] int limit = 10)
    {
        var query = from ct in _dbContext.ChiTietDonHang
                    group ct by new { ct.MaSanPham, ct.TenSanPham } into g
                    orderby g.Sum(x => x.SoLuong) descending
                    select new
                    {
                        MaSanPham = g.Key.MaSanPham,
                        TenSanPham = g.Key.TenSanPham,
                        SoLuongDaBan = g.Sum(x => x.SoLuong),
                        DoanhThu = g.Sum(x => x.DonGia * x.SoLuong)
                    };

        var data = await query.Take(limit).ToListAsync();
        return Ok(data);
    }
}

