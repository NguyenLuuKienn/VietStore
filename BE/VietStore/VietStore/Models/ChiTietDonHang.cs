namespace VietStore.Models;

public class ChiTietDonHang
{
    public int MaChiTiet { get; set; }
    public string MaDonHang { get; set; } = null!;
    public string MaSanPham { get; set; } = null!;
    public string TenSanPham { get; set; } = null!;
    public string? URLHinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public decimal DonGia { get; set; }
    public int SoLuong { get; set; }

    public DonHang DonHang { get; set; } = null!;
    public SanPham SanPham { get; set; } = null!;
}
