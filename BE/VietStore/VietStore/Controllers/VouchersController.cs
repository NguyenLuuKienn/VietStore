using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Models;

namespace VietStore.Controllers;

[ApiController]
[Route("api/vouchers")]
public class VouchersController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public VouchersController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetVouchers([FromQuery] bool all = false)
    {
        var today = DateTime.UtcNow.Date;
        var query = _dbContext.KhuyenMai.AsQueryable();
        if (!all)
        {
            query = query.Where(x => x.TrangThai && x.NgayBatDau <= today && x.NgayKetThuc >= today);
        }

        var items = await query.OrderByDescending(x => x.NgayBatDau).ToListAsync();
        return Ok(items);
    }

    [HttpPost("apply")]
    public async Task<IActionResult> ApplyVoucher([FromBody] ApplyVoucherRequest request)
    {
        var today = DateTime.UtcNow.Date;
        var voucher = await _dbContext.KhuyenMai.FirstOrDefaultAsync(x => x.MaCode == request.MaCode);
        if (voucher is null)
            return Ok(new { IsValid = false, SoTienDuocApDung = 0m, Message = "Ma khong ton tai" });

        if (!voucher.TrangThai || voucher.NgayBatDau > today || voucher.NgayKetThuc < today)
            return Ok(new { IsValid = false, SoTienDuocApDung = 0m, Message = "Ma het han hoac khong hoat dong" });

        if (voucher.SoLuong <= voucher.DaSuDung)
            return Ok(new { IsValid = false, SoTienDuocApDung = 0m, Message = "Ma da het luot su dung" });

        if (request.TongTienHienTai < voucher.GiaTriDonToiThieu)
            return Ok(new { IsValid = false, SoTienDuocApDung = 0m, Message = "Don hang chua dat gia tri toi thieu" });

        decimal discount = voucher.LoaiGiamGia == "percent"
            ? request.TongTienHienTai * voucher.GiaTriGiam / 100m
            : voucher.GiaTriGiam;

        if (voucher.LoaiGiamGia == "percent" && voucher.GiamToiDa.HasValue)
        {
            discount = Math.Min(discount, voucher.GiamToiDa.Value);
        }

        return Ok(new { IsValid = true, SoTienDuocApDung = discount, Message = "Ap dung thanh cong" });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherRequest request)
    {
        var item = new KhuyenMai
        {
            MaKhuyenMai = request.MaKhuyenMai,
            MaCode = request.MaCode,
            LoaiGiamGia = request.LoaiGiamGia,
            GiaTriGiam = request.GiaTriGiam,
            GiamToiDa = request.GiamToiDa,
            GiaTriDonToiThieu = request.GiaTriDonToiThieu,
            SoLuong = request.SoLuong,
            DaSuDung = 0,
            NgayBatDau = request.NgayBatDau.Date,
            NgayKetThuc = request.NgayKetThuc.Date,
            TrangThai = request.TrangThai
        };
        _dbContext.KhuyenMai.Add(item);
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{maKhuyenMai}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateVoucher(string maKhuyenMai, [FromBody] UpdateVoucherRequest request)
    {
        var item = await _dbContext.KhuyenMai.FirstOrDefaultAsync(x => x.MaKhuyenMai == maKhuyenMai);
        if (item is null) return NotFound();
        item.SoLuong = request.SoLuong;
        item.TrangThai = request.TrangThai;
        await _dbContext.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{maKhuyenMai}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteVoucher(string maKhuyenMai)
    {
        var item = await _dbContext.KhuyenMai.FirstOrDefaultAsync(x => x.MaKhuyenMai == maKhuyenMai);
        if (item is null) return NotFound();
        _dbContext.KhuyenMai.Remove(item);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record ApplyVoucherRequest(string MaCode, decimal TongTienHienTai);
public record CreateVoucherRequest(string MaKhuyenMai, string MaCode, string LoaiGiamGia, decimal GiaTriGiam, decimal? GiamToiDa, decimal GiaTriDonToiThieu, int SoLuong, DateTime NgayBatDau, DateTime NgayKetThuc, bool TrangThai);
public record UpdateVoucherRequest(int SoLuong, bool TrangThai);

