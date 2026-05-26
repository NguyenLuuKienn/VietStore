using Microsoft.EntityFrameworkCore;
using VietStore.Models;

namespace VietStore.Data;

public class VietStoreDbContext : DbContext
{
    public VietStoreDbContext(DbContextOptions<VietStoreDbContext> options) : base(options)
    {
    }

    public DbSet<NguoiDung> NguoiDung => Set<NguoiDung>();
    public DbSet<DanhMuc> DanhMuc => Set<DanhMuc>();
    public DbSet<NhaCungCap> NhaCungCap => Set<NhaCungCap>();
    public DbSet<SanPham> SanPham => Set<SanPham>();
    public DbSet<HinhAnhSanPham> HinhAnhSanPham => Set<HinhAnhSanPham>();
    public DbSet<KichThuocSanPham> KichThuocSanPham => Set<KichThuocSanPham>();
    public DbSet<DonHang> DonHang => Set<DonHang>();
    public DbSet<ChiTietDonHang> ChiTietDonHang => Set<ChiTietDonHang>();
    public DbSet<GioHang> GioHang => Set<GioHang>();
    public DbSet<ChiTietGioHang> ChiTietGioHang => Set<ChiTietGioHang>();
    public DbSet<Banner> Banner => Set<Banner>();
    public DbSet<KhuyenMai> KhuyenMai => Set<KhuyenMai>();
    public DbSet<ThongBao> ThongBao => Set<ThongBao>();
    public DbSet<NhatKySanPham> NhatKySanPham => Set<NhatKySanPham>();
    public DbSet<NhatKyDonHang> NhatKyDonHang => Set<NhatKyDonHang>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.ToTable("NguoiDung");
            entity.HasKey(x => x.MaNguoiDung);
            entity.Property(x => x.MaNguoiDung).HasMaxLength(50);
            entity.Property(x => x.HoTen).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.MatKhau).HasMaxLength(255).IsRequired();
            entity.Property(x => x.SoDienThoai).HasMaxLength(20);
            entity.Property(x => x.DiaChi).HasMaxLength(500);
            entity.Property(x => x.TongChiTieu).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(x => x.SoDonHang).HasDefaultValue(0);
            entity.Property(x => x.TrangThai).HasMaxLength(20).HasDefaultValue("active");
            entity.Property(x => x.NgayThamGia).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.Quyen).HasDefaultValue(0);
            entity.Property(x => x.EmailDaXacThuc).HasDefaultValue(true);
            entity.Property(x => x.MaXacThucEmail).HasMaxLength(128);
        });

        modelBuilder.Entity<DanhMuc>(entity =>
        {
            entity.ToTable("DanhMuc");
            entity.HasKey(x => x.MaDanhMuc);
            entity.Property(x => x.MaDanhMuc).HasMaxLength(50);
            entity.Property(x => x.TenDanhMuc).HasMaxLength(100).IsRequired();
            entity.Property(x => x.MaDanhMucCha).HasMaxLength(50);
        });

        modelBuilder.Entity<NhaCungCap>(entity =>
        {
            entity.ToTable("NhaCungCap");
            entity.HasKey(x => x.MaNhaCungCap);
            entity.Property(x => x.MaNhaCungCap).HasMaxLength(50);
            entity.Property(x => x.TenCongTy).HasMaxLength(255).IsRequired();
            entity.Property(x => x.NguoiLienHe).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SoDienThoai).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(100);
            entity.Property(x => x.DiaChi).HasMaxLength(500);
            entity.Property(x => x.TrangThai).HasMaxLength(50).HasDefaultValue("Hoat dong");
        });

        modelBuilder.Entity<SanPham>(entity =>
        {
            entity.ToTable("SanPham");
            entity.HasKey(x => x.MaSanPham);
            entity.Property(x => x.MaSanPham).HasMaxLength(50);
            entity.Property(x => x.MaDanhMuc).HasMaxLength(50).IsRequired();
            entity.Property(x => x.MaNhaCungCap).HasMaxLength(50);
            entity.Property(x => x.TenSanPham).HasMaxLength(255).IsRequired();
            entity.Property(x => x.GiaBan).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(x => x.IsGiamGia).HasDefaultValue(false);
            entity.Property(x => x.SoTienGiam).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(x => x.ThongTinChiTiet).HasColumnType("nvarchar(max)");
            entity.Property(x => x.SoLuongTon).HasDefaultValue(0);
            entity.Property(x => x.SoLuotBan).HasDefaultValue(0);
            entity.Property(x => x.IsVisible).HasDefaultValue(true);
            entity.Property(x => x.IsFeaturedNew).HasDefaultValue(false);
            entity.Property(x => x.IsFeaturedBestseller).HasDefaultValue(false);
            entity.Property(x => x.NgayTao).HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.DanhMuc)
                .WithMany(x => x.SanPhams)
                .HasForeignKey(x => x.MaDanhMuc)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(x => x.NhaCungCap)
                .WithMany(x => x.SanPhams)
                .HasForeignKey(x => x.MaNhaCungCap)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<HinhAnhSanPham>(entity =>
        {
            entity.ToTable("HinhAnhSanPham");
            entity.HasKey(x => x.MaHinhAnh);
            entity.Property(x => x.MaHinhAnh).UseIdentityColumn();
            entity.Property(x => x.MaSanPham).HasMaxLength(50).IsRequired();
            entity.Property(x => x.URLHinhAnh).IsRequired();

            entity.HasOne(x => x.SanPham)
                .WithMany(x => x.HinhAnhSanPhams)
                .HasForeignKey(x => x.MaSanPham)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KichThuocSanPham>(entity =>
        {
            entity.ToTable("KichThuocSanPham");
            entity.HasKey(x => x.MaKichThuoc);
            entity.Property(x => x.MaKichThuoc).UseIdentityColumn();
            entity.Property(x => x.MaSanPham).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TenKichThuoc).HasMaxLength(20).IsRequired();

            entity.HasOne(x => x.SanPham)
                .WithMany(x => x.KichThuocSanPhams)
                .HasForeignKey(x => x.MaSanPham)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DonHang>(entity =>
        {
            entity.ToTable("DonHang");
            entity.HasKey(x => x.MaDonHang);
            entity.Property(x => x.MaDonHang).HasMaxLength(50);
            entity.Property(x => x.MaNguoiDung).HasMaxLength(50);
            entity.Property(x => x.TenKhachHang).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SoDienThoai).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DiaChiGiaoHang).HasMaxLength(500).IsRequired();
            entity.Property(x => x.TongTien).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(x => x.PhuongThucThanhToan).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TrangThai).HasMaxLength(50).IsRequired();
            entity.Property(x => x.NgayDatHang).HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.DonHangs)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChiTietDonHang>(entity =>
        {
            entity.ToTable("ChiTietDonHang");
            entity.HasKey(x => x.MaChiTiet);
            entity.Property(x => x.MaChiTiet).UseIdentityColumn();
            entity.Property(x => x.MaDonHang).HasMaxLength(50).IsRequired();
            entity.Property(x => x.MaSanPham).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TenSanPham).HasMaxLength(255).IsRequired();
            entity.Property(x => x.KichThuoc).HasMaxLength(20);
            entity.Property(x => x.DonGia).HasColumnType("decimal(18,2)").IsRequired();

            entity.HasOne(x => x.DonHang)
                .WithMany(x => x.ChiTietDonHangs)
                .HasForeignKey(x => x.MaDonHang)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.SanPham)
                .WithMany(x => x.ChiTietDonHangs)
                .HasForeignKey(x => x.MaSanPham)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<GioHang>(entity =>
        {
            entity.ToTable("GioHang");
            entity.HasKey(x => x.MaGioHang);
            entity.Property(x => x.MaGioHang).HasMaxLength(50);
            entity.Property(x => x.MaNguoiDung).HasMaxLength(50).IsRequired();
            entity.Property(x => x.NgayCapNhat).HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.GioHangs)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChiTietGioHang>(entity =>
        {
            entity.ToTable("ChiTietGioHang");
            entity.HasKey(x => x.MaChiTietGioHang);
            entity.Property(x => x.MaChiTietGioHang).UseIdentityColumn();
            entity.Property(x => x.MaGioHang).HasMaxLength(50).IsRequired();
            entity.Property(x => x.MaSanPham).HasMaxLength(50).IsRequired();
            entity.Property(x => x.KichThuoc).HasMaxLength(20).HasDefaultValue("M");
            entity.Property(x => x.SoLuong).HasDefaultValue(1);
            entity.Property(x => x.NgayCapNhat).HasDefaultValueSql("GETDATE()");

            entity.HasOne(x => x.GioHang)
                .WithMany(x => x.ChiTietGioHangs)
                .HasForeignKey(x => x.MaGioHang)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.SanPham)
                .WithMany(x => x.ChiTietGioHangs)
                .HasForeignKey(x => x.MaSanPham)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(x => new { x.MaGioHang, x.MaSanPham, x.KichThuoc }).IsUnique();
        });

        modelBuilder.Entity<Banner>(entity =>
        {
            entity.ToTable("Banner");
            entity.HasKey(x => x.MaBanner);
            entity.Property(x => x.MaBanner).HasMaxLength(50);
            entity.Property(x => x.TieuDe).HasMaxLength(255).IsRequired();
            entity.Property(x => x.PhuDe).HasMaxLength(255);
            entity.Property(x => x.MucGiam).HasMaxLength(100);
            entity.Property(x => x.MaCode).HasMaxLength(50);
            entity.Property(x => x.URLHinhAnh).IsRequired();
            entity.Property(x => x.ThuTu).HasDefaultValue(1);
            entity.Property(x => x.LoaiBanner).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<KhuyenMai>(entity =>
        {
            entity.ToTable("KhuyenMai");
            entity.HasKey(x => x.MaKhuyenMai);
            entity.Property(x => x.MaKhuyenMai).HasMaxLength(50);
            entity.Property(x => x.MaCode).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.MaCode).IsUnique();
            entity.Property(x => x.LoaiGiamGia).HasMaxLength(20).IsRequired();
            entity.Property(x => x.GiaTriGiam).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(x => x.GiamToiDa).HasColumnType("decimal(18,2)");
            entity.Property(x => x.GiaTriDonToiThieu).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(x => x.DaSuDung).HasDefaultValue(0);
            entity.Property(x => x.TrangThai).HasDefaultValue(true);
            entity.Property(x => x.NgayBatDau).HasColumnType("date");
            entity.Property(x => x.NgayKetThuc).HasColumnType("date");
        });

        modelBuilder.Entity<ThongBao>(entity =>
        {
            entity.ToTable("ThongBao");
            entity.HasKey(x => x.MaThongBao);
            entity.Property(x => x.MaThongBao).UseIdentityColumn();
            entity.Property(x => x.TieuDe).HasMaxLength(255).IsRequired();
            entity.Property(x => x.NoiDung).IsRequired();
            entity.Property(x => x.ThoiGian).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.DaDoc).HasDefaultValue(false);
            entity.Property(x => x.LoaiThongBao).HasMaxLength(50);
            entity.Property(x => x.MaNguoiDung).HasMaxLength(50);

            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.ThongBaos)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<NhatKySanPham>(entity =>
        {
            entity.ToTable("NhatKySanPham");
            entity.HasKey(x => x.MaNhatKy);
            entity.Property(x => x.MaNhatKy).UseIdentityColumn();
            entity.Property(x => x.MaSanPham).HasMaxLength(50);
            entity.Property(x => x.HanhDong).HasMaxLength(50).IsRequired();
            entity.Property(x => x.NoiDung).HasMaxLength(500).IsRequired();
            entity.Property(x => x.NguoiThucHien).HasMaxLength(100).IsRequired();
            entity.Property(x => x.VaiTro).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ThoiGian).HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<NhatKyDonHang>(entity =>
        {
            entity.ToTable("NhatKyDonHang");
            entity.HasKey(x => x.MaNhatKy);
            entity.Property(x => x.MaNhatKy).UseIdentityColumn();
            entity.Property(x => x.MaDonHang).HasMaxLength(50).IsRequired();
            entity.Property(x => x.HanhDong).HasMaxLength(50).IsRequired();
            entity.Property(x => x.NoiDung).HasMaxLength(500).IsRequired();
            entity.Property(x => x.NguoiThucHien).HasMaxLength(100).IsRequired();
            entity.Property(x => x.VaiTro).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ThoiGian).HasDefaultValueSql("GETDATE()");
        });
    }
}
