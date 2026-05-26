using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;

namespace VietStore.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public UsersController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private static string MapRole(int quyen)
    {
        return quyen switch
        {
            1 => "admin",
            2 => "staff",
            _ => "user"
        };
    }

    [HttpGet]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var query = _dbContext.NguoiDung.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.HoTen.Contains(search) || x.Email.Contains(search));
        }

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.NgayThamGia)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(x => new
            {
                id = x.MaNguoiDung,
                fullName = x.HoTen,
                email = x.Email,
                phone = x.SoDienThoai,
                address = x.DiaChi,
                totalSpent = x.TongChiTieu,
                ordersCount = x.SoDonHang,
                status = x.TrangThai,
                role = MapRole(x.Quyen)
            }).ToListAsync();

        return Ok(new { page, limit, total, items });
    }

    [HttpGet("{maNguoiDung}")]
    [Authorize]
    public async Task<IActionResult> GetUser(string maNguoiDung)
    {
        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == maNguoiDung);
        if (user is null) return NotFound();
        return Ok(user);
    }

    [HttpPut("{maNguoiDung}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser(string maNguoiDung, [FromBody] UpdateUserRequest request)
    {
        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == maNguoiDung);
        if (user is null) return NotFound();

        user.HoTen = request.HoTen;
        user.SoDienThoai = request.SoDienThoai;
        user.DiaChi = request.DiaChi;
        await _dbContext.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPut("{maNguoiDung}/status")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateStatus(string maNguoiDung, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == maNguoiDung);
        if (user is null) return NotFound();

        user.TrangThai = request.TrangThai;
        await _dbContext.SaveChangesAsync();
        return Ok(new { id = user.MaNguoiDung, status = user.TrangThai });
    }

    [HttpGet("staff")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetStaff([FromQuery] string? search)
    {
        var query = _dbContext.NguoiDung.Where(x => x.Quyen == 2).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.HoTen.Contains(search) || x.Email.Contains(search));
        }

        var items = await query
            .OrderByDescending(x => x.NgayThamGia)
            .Select(x => new
            {
                id = x.MaNguoiDung,
                fullName = x.HoTen,
                email = x.Email,
                phone = x.SoDienThoai,
                address = x.DiaChi,
                status = x.TrangThai,
                joinedAt = x.NgayThamGia
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("staff")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
    {
        var exists = await _dbContext.NguoiDung.AnyAsync(x => x.Email == request.Email);
        if (exists) return BadRequest(new { message = "Email da ton tai" });

        var id = $"ND{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var item = new VietStore.Models.NguoiDung
        {
            MaNguoiDung = id,
            HoTen = request.HoTen,
            Email = request.Email,
            MatKhau = request.MatKhau,
            SoDienThoai = request.SoDienThoai,
            DiaChi = request.DiaChi,
            TongChiTieu = 0,
            SoDonHang = 0,
            TrangThai = string.IsNullOrWhiteSpace(request.TrangThai) ? "active" : request.TrangThai,
            NgayThamGia = DateTime.UtcNow,
            Quyen = 2
        };

        _dbContext.NguoiDung.Add(item);
        await _dbContext.SaveChangesAsync();
        return Ok(new { id = item.MaNguoiDung });
    }

    [HttpPut("staff/{maNguoiDung}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateStaff(string maNguoiDung, [FromBody] UpdateStaffRequest request)
    {
        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == maNguoiDung && x.Quyen == 2);
        if (user is null) return NotFound();

        user.HoTen = request.HoTen;
        user.SoDienThoai = request.SoDienThoai;
        user.DiaChi = request.DiaChi;
        user.TrangThai = request.TrangThai;
        await _dbContext.SaveChangesAsync();
        return Ok(new { id = user.MaNguoiDung });
    }

    [HttpDelete("staff/{maNguoiDung}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteStaff(string maNguoiDung)
    {
        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == maNguoiDung && x.Quyen == 2);
        if (user is null) return NotFound();
        _dbContext.NguoiDung.Remove(user);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record UpdateUserRequest(string HoTen, string SoDienThoai, string? DiaChi);
public record UpdateUserStatusRequest(string TrangThai);
public record CreateStaffRequest(string HoTen, string Email, string MatKhau, string? SoDienThoai, string? DiaChi, string? TrangThai);
public record UpdateStaffRequest(string HoTen, string? SoDienThoai, string? DiaChi, string TrangThai);
