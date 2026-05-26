using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public CartController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var cart = await EnsureCart(userId);
        var items = await _dbContext.ChiTietGioHang
            .AsNoTracking()
            .Where(x => x.MaGioHang == cart.MaGioHang)
            .Select(x => new
            {
                id = x.MaChiTietGioHang,
                productId = x.MaSanPham,
                size = x.KichThuoc,
                quantity = x.SoLuong,
                name = x.SanPham.TenSanPham,
                price = x.SanPham.GiaBan,
                image = _dbContext.HinhAnhSanPham
                    .Where(i => i.MaSanPham == x.MaSanPham)
                    .OrderBy(i => i.MaHinhAnh)
                    .Select(i => i.URLHinhAnh)
                    .FirstOrDefault() ?? ""
            })
            .ToListAsync();

        return Ok(new { items });
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.ProductId) || request.Quantity <= 0)
            return BadRequest(new { message = "Invalid cart item" });

        var product = await _dbContext.SanPham.FirstOrDefaultAsync(x => x.MaSanPham == request.ProductId);
        if (product is null) return NotFound(new { message = "Product not found" });

        var cart = await EnsureCart(userId);
        var size = string.IsNullOrWhiteSpace(request.Size) ? "M" : request.Size.Trim().ToUpperInvariant();
        var existing = await _dbContext.ChiTietGioHang
            .FirstOrDefaultAsync(x => x.MaGioHang == cart.MaGioHang && x.MaSanPham == request.ProductId && x.KichThuoc == size);

        if (existing is null)
        {
            existing = new ChiTietGioHang
            {
                MaGioHang = cart.MaGioHang,
                MaSanPham = request.ProductId,
                KichThuoc = size,
                SoLuong = request.Quantity,
                NgayCapNhat = DateTime.UtcNow
            };
            _dbContext.ChiTietGioHang.Add(existing);
        }
        else
        {
            existing.SoLuong += request.Quantity;
            existing.NgayCapNhat = DateTime.UtcNow;
        }

        cart.NgayCapNhat = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return Ok(new { id = existing.MaChiTietGioHang });
    }

    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateCartItemRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        if (request.Quantity <= 0) return BadRequest(new { message = "Quantity must be greater than 0" });

        var item = await _dbContext.ChiTietGioHang
            .Include(x => x.GioHang)
            .FirstOrDefaultAsync(x => x.MaChiTietGioHang == id && x.GioHang.MaNguoiDung == userId);
        if (item is null) return NotFound();

        item.SoLuong = request.Quantity;
        item.NgayCapNhat = DateTime.UtcNow;
        item.GioHang.NgayCapNhat = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return Ok(new { id = item.MaChiTietGioHang, quantity = item.SoLuong });
    }

    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var item = await _dbContext.ChiTietGioHang
            .Include(x => x.GioHang)
            .FirstOrDefaultAsync(x => x.MaChiTietGioHang == id && x.GioHang.MaNguoiDung == userId);
        if (item is null) return NotFound();

        _dbContext.ChiTietGioHang.Remove(item);
        item.GioHang.NgayCapNhat = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var cart = await _dbContext.GioHang.FirstOrDefaultAsync(x => x.MaNguoiDung == userId);
        if (cart is null) return NoContent();

        var items = await _dbContext.ChiTietGioHang.Where(x => x.MaGioHang == cart.MaGioHang).ToListAsync();
        _dbContext.ChiTietGioHang.RemoveRange(items);
        cart.NgayCapNhat = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task<GioHang> EnsureCart(string userId)
    {
        var cart = await _dbContext.GioHang.FirstOrDefaultAsync(x => x.MaNguoiDung == userId);
        if (cart is not null) return cart;

        cart = new GioHang
        {
            MaGioHang = $"GH{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            MaNguoiDung = userId,
            NgayCapNhat = DateTime.UtcNow
        };
        _dbContext.GioHang.Add(cart);
        await _dbContext.SaveChangesAsync();
        return cart;
    }
}

public record AddCartItemRequest(string ProductId, string? Size, int Quantity);
public record UpdateCartItemRequest(int Quantity);

