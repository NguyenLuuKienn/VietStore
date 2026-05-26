using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using VietStore.Data;
using VietStore.Models;
using VietStore.Services;

namespace VietStore.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthController(VietStoreDbContext dbContext, IConfiguration configuration, IEmailService emailService)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _emailService = emailService;
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

    private static bool IsBlockedStatus(string? status)
    {
        var s = (status ?? "").Trim().ToLowerInvariant();
        return s == "locked" || s == "inactive" || s == "khoa" || s == "tam ngung";
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var exists = await _dbContext.NguoiDung.AnyAsync(x => x.Email == request.Email);
        if (exists) return BadRequest(new { message = "Email already exists" });

        var verifyToken = Guid.NewGuid().ToString("N");
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
            NgayThamGia = DateTime.UtcNow,
            EmailDaXacThuc = false,
            MaXacThucEmail = verifyToken,
            HanXacThucEmail = DateTime.UtcNow.AddHours(24)
        };

        _dbContext.NguoiDung.Add(user);
        await _dbContext.SaveChangesAsync();

        var backendBaseUrl = _configuration["App:BackendBaseUrl"] ?? "http://localhost:5195";
        var verifyUrl = $"{backendBaseUrl}/api/auth/verify-email?token={Uri.EscapeDataString(verifyToken)}";
        await _emailService.SendAsync(
            user.Email,
            "Xác thực tài khoản VietStore",
            EmailTemplates.VerifyEmailTemplate(user.HoTen, verifyUrl)
        );

        return Ok(new
        {
            MaNguoiDung = user.MaNguoiDung,
            user.HoTen,
            user.Email,
            user.SoDienThoai,
            message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _dbContext.NguoiDung
            .FirstOrDefaultAsync(x => x.Email == request.Email && x.MatKhau == request.MatKhau);

        if (user is null) return Unauthorized(new { message = "Invalid credentials" });
        if (IsBlockedStatus(user.TrangThai))
        {
            var blockedMsg = user.TrangThai?.ToLowerInvariant() == "locked"
                ? "Tài khoản đã bị khóa"
                : "Tài khoản đang bị tạm ngưng";
            return Unauthorized(new { message = blockedMsg });
        }
        if (!user.EmailDaXacThuc)
        {
            return Unauthorized(new { message = "Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư." });
        }

        var role = MapRole(user.Quyen);
        var token = GenerateJwtToken(user.MaNguoiDung, user.Email, user.HoTen, role);

        return Ok(new
        {
            token,
            tokenType = "Bearer",
            expiresIn = int.TryParse(_configuration["Jwt:ExpireMinutes"], out var m) ? m * 60 : 28800,
            user = new { id = user.MaNguoiDung, email = user.Email, fullName = user.HoTen, role }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaNguoiDung == userId);
        if (user is null) return NotFound();
        if (IsBlockedStatus(user.TrangThai)) return Unauthorized(new { message = "Tai khoan khong con hoat dong" });

        return Ok(new { id = user.MaNguoiDung, email = user.Email, fullName = user.HoTen, role = MapRole(user.Quyen) });
    }

    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Content(EmailTemplates.VerifyEmailResultPage(false, "Liên kết xác thực không hợp lệ."), "text/html; charset=utf-8");
        }

        var user = await _dbContext.NguoiDung.FirstOrDefaultAsync(x => x.MaXacThucEmail == token);
        if (user is null)
        {
            return Content(EmailTemplates.VerifyEmailResultPage(false, "Không tìm thấy yêu cầu xác thực."), "text/html; charset=utf-8");
        }
        if (user.EmailDaXacThuc)
        {
            return Content(EmailTemplates.VerifyEmailResultPage(true, "Email đã được xác thực trước đó."), "text/html; charset=utf-8");
        }
        if (!user.HanXacThucEmail.HasValue || user.HanXacThucEmail.Value < DateTime.UtcNow)
        {
            return Content(EmailTemplates.VerifyEmailResultPage(false, "Liên kết xác thực đã hết hạn."), "text/html; charset=utf-8");
        }

        user.EmailDaXacThuc = true;
        user.MaXacThucEmail = null;
        user.HanXacThucEmail = null;
        await _dbContext.SaveChangesAsync();
        return Content(EmailTemplates.VerifyEmailResultPage(true, "Xác thực email thành công. Bạn có thể đăng nhập ngay."), "text/html; charset=utf-8");
    }

    private string GenerateJwtToken(string userId, string email, string fullName, string role)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "VietStore_Local_Dev_Secret_Key_2026_ChangeMe";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "VietStore";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "VietStoreClient";
        var expireMinutes = int.TryParse(_configuration["Jwt:ExpireMinutes"], out var m) ? m : 480;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(expireMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record RegisterRequest(string HoTen, string Email, string MatKhau, string SoDienThoai);
public record LoginRequest(string Email, string MatKhau);

