namespace VietStore.Models;

public class DonHang
{
    public string MaDonHang { get; set; } = null!;
    public string? MaNguoiDung { get; set; }
    public string TenKhachHang { get; set; } = null!;
    public string SoDienThoai { get; set; } = null!;
    public string DiaChiGiaoHang { get; set; } = null!;
    public decimal TongTien { get; set; }
    public string PhuongThucThanhToan { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public DateTime NgayDatHang { get; set; }

    public NguoiDung? NguoiDung { get; set; }
    public ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();
}
