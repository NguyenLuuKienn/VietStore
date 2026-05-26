using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public SuppliersController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var data = await _dbContext.NhaCungCap.ToListAsync();
        return Ok(data);
    }

    [HttpGet("{maNhaCungCap}")]
    public async Task<IActionResult> GetSupplier(string maNhaCungCap)
    {
        var item = await _dbContext.NhaCungCap.FirstOrDefaultAsync(x => x.MaNhaCungCap == maNhaCungCap);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequest request)
    {
        var item = new NhaCungCap
        {
            MaNhaCungCap = request.MaNhaCungCap,
            TenCongTy = request.TenCongTy,
            NguoiLienHe = request.NguoiLienHe,
            SoDienThoai = request.SoDienThoai,
            Email = request.Email,
            DiaChi = request.DiaChi,
            TrangThai = request.TrangThai
        };
        _dbContext.NhaCungCap.Add(item);
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{maNhaCungCap}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateSupplier(string maNhaCungCap, [FromBody] UpdateSupplierRequest request)
    {
        var item = await _dbContext.NhaCungCap.FirstOrDefaultAsync(x => x.MaNhaCungCap == maNhaCungCap);
        if (item is null) return NotFound();

        item.TenCongTy = request.TenCongTy;
        item.NguoiLienHe = request.NguoiLienHe;
        item.SoDienThoai = request.SoDienThoai;
        item.Email = request.Email;
        item.DiaChi = request.DiaChi;
        item.TrangThai = request.TrangThai;

        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{maNhaCungCap}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteSupplier(string maNhaCungCap)
    {
        var item = await _dbContext.NhaCungCap.FirstOrDefaultAsync(x => x.MaNhaCungCap == maNhaCungCap);
        if (item is null) return NotFound();
        _dbContext.NhaCungCap.Remove(item);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateSupplierRequest(string MaNhaCungCap, string TenCongTy, string NguoiLienHe, string SoDienThoai, string Email, string DiaChi, string TrangThai);
public record UpdateSupplierRequest(string TenCongTy, string NguoiLienHe, string SoDienThoai, string Email, string DiaChi, string TrangThai);

