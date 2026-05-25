using Microsoft.EntityFrameworkCore;
using VietStore.Models;

namespace VietStore.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(VietStoreDbContext dbContext)
    {
        if (!await dbContext.NguoiDung.AnyAsync())
        {
            dbContext.NguoiDung.AddRange(
                new NguoiDung
                {
                    MaNguoiDung = "U001",
                    HoTen = "Admin VietStore",
                    Email = "admin@vietstore.local",
                    MatKhau = "123456",
                    SoDienThoai = "0900000001",
                    TrangThai = "active",
                    Quyen = 1,
                    NgayThamGia = DateTime.UtcNow
                },
                new NguoiDung
                {
                    MaNguoiDung = "U002",
                    HoTen = "Nguyen Van A",
                    Email = "customer1@vietstore.local",
                    MatKhau = "123456",
                    SoDienThoai = "0900000002",
                    TrangThai = "active",
                    Quyen = 0,
                    NgayThamGia = DateTime.UtcNow
                }
            );
        }

        if (!await dbContext.DanhMuc.AnyAsync())
        {
            dbContext.DanhMuc.AddRange(
                new DanhMuc { MaDanhMuc = "DM001", TenDanhMuc = "Giay The Thao" },
                new DanhMuc { MaDanhMuc = "DM002", TenDanhMuc = "Ao The Thao" },
                new DanhMuc { MaDanhMuc = "DM003", TenDanhMuc = "Phu Kien" }
            );
        }

        if (!await dbContext.NhaCungCap.AnyAsync())
        {
            dbContext.NhaCungCap.Add(new NhaCungCap
            {
                MaNhaCungCap = "NCC001",
                TenCongTy = "VietSport Supplier",
                NguoiLienHe = "Le Thi B",
                SoDienThoai = "0900000003",
                Email = "supplier@vietstore.local",
                DiaChi = "HCM City",
                TrangThai = "Hoat dong"
            });
        }

        await dbContext.SaveChangesAsync();

        if (!await dbContext.SanPham.AnyAsync())
        {
            dbContext.SanPham.Add(new SanPham
            {
                MaSanPham = "SP001",
                MaDanhMuc = "DM001",
                MaNhaCungCap = "NCC001",
                TenSanPham = "Giay Chay Bo Pro",
                GiaBan = 1290000,
                MoTa = "San pham seed mau",
                SoLuotBan = 0,
                NgayTao = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync();

            dbContext.HinhAnhSanPham.Add(new HinhAnhSanPham
            {
                MaSanPham = "SP001",
                URLHinhAnh = "https://example.com/images/sp001.jpg"
            });

            dbContext.KichThuocSanPham.AddRange(
                new KichThuocSanPham { MaSanPham = "SP001", TenKichThuoc = "40" },
                new KichThuocSanPham { MaSanPham = "SP001", TenKichThuoc = "41" }
            );
        }

        if (!await dbContext.KhuyenMai.AnyAsync())
        {
            dbContext.KhuyenMai.Add(new KhuyenMai
            {
                MaKhuyenMai = "KM001",
                MaCode = "WELCOME10",
                LoaiGiamGia = "percent",
                GiaTriGiam = 10,
                GiamToiDa = 100000,
                GiaTriDonToiThieu = 500000,
                SoLuong = 100,
                DaSuDung = 0,
                NgayBatDau = DateTime.UtcNow.Date,
                NgayKetThuc = DateTime.UtcNow.Date.AddMonths(1),
                TrangThai = true
            });
        }

        if (!await dbContext.Banner.AnyAsync())
        {
            dbContext.Banner.Add(new Banner
            {
                MaBanner = "BN001",
                TieuDe = "Khuyen mai mua he",
                PhuDe = "Uu dai den 50%",
                MucGiam = "50%",
                MaCode = "WELCOME10",
                URLHinhAnh = "https://example.com/images/banner1.jpg",
                DuongDan = "/collections/summer",
                ThuTu = 1,
                LoaiBanner = "Main"
            });
        }

        if (!await dbContext.ThongBao.AnyAsync())
        {
            dbContext.ThongBao.Add(new ThongBao
            {
                TieuDe = "Chao mung",
                NoiDung = "Chao mung ban den voi VietStore",
                ThoiGian = DateTime.UtcNow,
                DaDoc = false,
                LoaiThongBao = "HeThong",
                MaNguoiDung = "U002"
            });
        }

        await dbContext.SaveChangesAsync();
    }
}
