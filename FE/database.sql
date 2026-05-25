-- Script tạo cơ sở dữ liệu SQL Server cho hệ thống cửa hàng thể thao
-- Database Name: DB_CuaHangTheThao

CREATE DATABASE VietStore;
GO

USE VietStore;
GO

-- 1. Bảng Người Dùng (Khách hàng & Admin)
CREATE TABLE NguoiDung (
    MaNguoiDung VARCHAR(50) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    SoDienThoai VARCHAR(20),
    TongChiTieu DECIMAL(18, 2) DEFAULT 0,
    SoDonHang INT DEFAULT 0,
    TrangThai VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'locked'
    NgayThamGia DATETIME DEFAULT GETDATE(),
    Quyen INT DEFAULT 0 -- 0: Khách hàng, 1: Admin
);
GO

-- 2. Bảng Danh Mục
CREATE TABLE DanhMuc (
    MaDanhMuc VARCHAR(50) PRIMARY KEY,
    TenDanhMuc NVARCHAR(100) NOT NULL
);
GO

-- 3. Bảng Nhà Cung Cấp
CREATE TABLE NhaCungCap (
    MaNhaCungCap VARCHAR(50) PRIMARY KEY,
    TenCongTy NVARCHAR(255) NOT NULL,
    NguoiLienHe NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    DiaChi NVARCHAR(500),
    TrangThai NVARCHAR(50) DEFAULT N'Hoạt động'
);
GO

-- 4. Bảng Sản Phẩm
CREATE TABLE SanPham (
    MaSanPham VARCHAR(50) PRIMARY KEY,
    MaDanhMuc VARCHAR(50) FOREIGN KEY REFERENCES DanhMuc(MaDanhMuc),
    MaNhaCungCap VARCHAR(50) NULL FOREIGN KEY REFERENCES NhaCungCap(MaNhaCungCap),
    TenSanPham NVARCHAR(255) NOT NULL,
    GiaBan DECIMAL(18, 2) NOT NULL,
    MoTa NVARCHAR(MAX),
    SoLuotBan INT DEFAULT 0,
    NgayTao DATETIME DEFAULT GETDATE()
);
GO

-- 5. Bảng Hình Ảnh Sản Phẩm (Lưu danh sách URL hình ảnh)
CREATE TABLE HinhAnhSanPham (
    MaHinhAnh INT IDENTITY(1,1) PRIMARY KEY,
    MaSanPham VARCHAR(50) FOREIGN KEY REFERENCES SanPham(MaSanPham) ON DELETE CASCADE,
    URLHinhAnh VARCHAR(MAX) NOT NULL
);
GO

-- 6. Bảng Kích Thước Sản Phẩm (Lưu các size của mỗi sản phẩm)
CREATE TABLE KichThuocSanPham (
    MaKichThuoc INT IDENTITY(1,1) PRIMARY KEY,
    MaSanPham VARCHAR(50) FOREIGN KEY REFERENCES SanPham(MaSanPham) ON DELETE CASCADE,
    TenKichThuoc VARCHAR(20) NOT NULL -- VD: 'M', 'L', 'XL', 'Free Size', '36', '40'
);
GO

-- 7. Bảng Đơn Hàng
CREATE TABLE DonHang (
    MaDonHang VARCHAR(50) PRIMARY KEY,
    MaNguoiDung VARCHAR(50) NULL FOREIGN KEY REFERENCES NguoiDung(MaNguoiDung),
    TenKhachHang NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    DiaChiGiaoHang NVARCHAR(500) NOT NULL,
    TongTien DECIMAL(18, 2) NOT NULL,
    PhuongThucThanhToan NVARCHAR(50) NOT NULL, -- VD: 'COD', 'Thẻ Tín Dụng'
    TrangThai VARCHAR(50) NOT NULL, -- 'ChoXacNhan', 'DangGiao', 'HoanThanh', 'DaHuy'
    NgayDatHang DATETIME DEFAULT GETDATE()
);
GO

-- 8. Bảng Chi Tiết Đơn Hàng
CREATE TABLE ChiTietDonHang (
    MaChiTiet INT IDENTITY(1,1) PRIMARY KEY,
    MaDonHang VARCHAR(50) FOREIGN KEY REFERENCES DonHang(MaDonHang) ON DELETE CASCADE,
    MaSanPham VARCHAR(50) FOREIGN KEY REFERENCES SanPham(MaSanPham),
    TenSanPham NVARCHAR(255) NOT NULL,
    URLHinhAnh VARCHAR(MAX),
    KichThuoc VARCHAR(20),
    DonGia DECIMAL(18, 2) NOT NULL,
    SoLuong INT NOT NULL
);
GO

-- 9. Bảng Banner (Chứa cả Main Banner và Promo Banner)
CREATE TABLE Banner (
    MaBanner VARCHAR(50) PRIMARY KEY,
    TieuDe NVARCHAR(255) NOT NULL,
    PhuDe NVARCHAR(255),
    MucGiam NVARCHAR(100), -- Dành cho banner khuyến mãi (VD: GIẢM 50%)
    MaCode VARCHAR(50), -- Mã code hiển thị trên banner (VD: TET2024)
    URLHinhAnh VARCHAR(MAX) NOT NULL,
    DuongDan VARCHAR(MAX),
    ThuTu INT DEFAULT 1,
    LoaiBanner VARCHAR(50) NOT NULL -- 'Main' (Banner chính), 'Promo' (Khuyến mãi)
);
GO

-- 10. Bảng Mã Giảm Giá (Khuyến Mãi)
CREATE TABLE KhuyenMai (
    MaKhuyenMai VARCHAR(50) PRIMARY KEY,
    MaCode VARCHAR(50) UNIQUE NOT NULL,
    LoaiGiamGia VARCHAR(20) NOT NULL, -- 'percent' (Theo %), 'fixed' (Số tiền cố định)
    GiaTriGiam DECIMAL(18, 2) NOT NULL,
    GiamToiDa DECIMAL(18, 2), -- Tùy chọn, chỉ áp dụng cho 'percent'
    GiaTriDonToiThieu DECIMAL(18, 2) DEFAULT 0,
    SoLuong INT NOT NULL,
    DaSuDung INT DEFAULT 0,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    TrangThai BIT DEFAULT 1 -- 1: Đang hoạt động, 0: Đã tắt
);
GO

-- 11. Bảng Thông Báo
CREATE TABLE ThongBao (
    MaThongBao INT IDENTITY(1,1) PRIMARY KEY,
    TieuDe NVARCHAR(255) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    ThoiGian DATETIME DEFAULT GETDATE(),
    DaDoc BIT DEFAULT 0, -- 0: Chưa đọc, 1: Đã đọc
    LoaiThongBao VARCHAR(50), -- 'DonHang', 'HeThong', 'KhoHang'
    MaNguoiDung VARCHAR(50) NULL FOREIGN KEY REFERENCES NguoiDung(MaNguoiDung) -- NULL nếu là thông báo chung cho admin
);
GO
