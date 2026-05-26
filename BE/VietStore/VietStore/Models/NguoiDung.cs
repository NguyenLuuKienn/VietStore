namespace VietStore.Models;

public class NguoiDung
{
    public string MaNguoiDung { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public string? DiaChi { get; set; }
    public decimal TongChiTieu { get; set; }
    public int SoDonHang { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayThamGia { get; set; }
    public int Quyen { get; set; }
    public bool EmailDaXacThuc { get; set; } = true;
    public string? MaXacThucEmail { get; set; }
    public DateTime? HanXacThucEmail { get; set; }

    public ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();
    public ICollection<ThongBao> ThongBaos { get; set; } = new List<ThongBao>();
    public ICollection<GioHang> GioHangs { get; set; } = new List<GioHang>();
}
