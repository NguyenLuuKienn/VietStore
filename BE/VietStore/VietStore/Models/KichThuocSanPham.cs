namespace VietStore.Models;

public class KichThuocSanPham
{
    public int MaKichThuoc { get; set; }
    public string MaSanPham { get; set; } = null!;
    public string TenKichThuoc { get; set; } = null!;

    public SanPham SanPham { get; set; } = null!;
}
