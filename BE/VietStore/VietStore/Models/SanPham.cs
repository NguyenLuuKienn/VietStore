namespace VietStore.Models;

public class SanPham
{
    public string MaSanPham { get; set; } = null!;
    public string MaDanhMuc { get; set; } = null!;
    public string? MaNhaCungCap { get; set; }
    public string TenSanPham { get; set; } = null!;
    public decimal GiaBan { get; set; }
    public string? MoTa { get; set; }
    public int SoLuongTon { get; set; }
    public int SoLuotBan { get; set; }
    public bool IsFeaturedNew { get; set; }
    public bool IsFeaturedBestseller { get; set; }
    public DateTime NgayTao { get; set; }

    public DanhMuc DanhMuc { get; set; } = null!;
    public NhaCungCap? NhaCungCap { get; set; }
    public ICollection<HinhAnhSanPham> HinhAnhSanPhams { get; set; } = new List<HinhAnhSanPham>();
    public ICollection<KichThuocSanPham> KichThuocSanPhams { get; set; } = new List<KichThuocSanPham>();
    public ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();
}
