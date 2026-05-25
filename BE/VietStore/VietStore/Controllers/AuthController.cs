using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public AuthController(VietStoreDbContext dbContext)
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

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var exists = await _dbContext.NguoiDung.AnyAsync(x => x.Email == request.Email);
        if (exists) return BadRequest(new { message = "Email already exists" });

        var id = $"U{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var user = new NguoiDung
        {
            MaNguoiDung = id,
            HoTen = request.HoTen,
            Email = request.Email,
            MatKhau = request.MatKhau,
            SoDienThoai = request.SoDienThoai,
            Quyen = 0,
            TrangThai = "active",
            NgayThamGia = DateTime.UtcNow
        };

        _dbContext.NguoiDung.Add(user);
        await _dbContext.SaveChangesAsync();

        return Ok(new { MaNguoiDung = user.MaNguoiDung, user.HoTen, user.Email, user.SoDienThoai });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _dbContext.NguoiDung
            .FirstOrDefaultAsync(x => x.Email == request.Email && x.MatKhau == request.MatKhau);

        if (user is null) return Unauthorized(new { message = "Invalid credentials" });

        return Ok(new
        {
            token = user.MaNguoiDung,
            tokenType = "Bearer",
            expiresIn = 3600,
            user = new { id = user.MaNguoiDung, email = user.Email, fullName = user.HoTen, role = MapRole(user.Quyen) }
        });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me([FromHeader(Name = "Authorization")] string? authorization)
    {
        var userId = authorization?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)?.Trim();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == userId);
        if (user is null) return NotFound();

        return Ok(new { id = user.MaNguoiDung, email = user.Email, fullName = user.HoTen, role = MapRole(user.Quyen) });
    }
}

public record RegisterRequest(string HoTen, string Email, string MatKhau, string SoDienThoai);
public record LoginRequest(string Email, string MatKhau);
