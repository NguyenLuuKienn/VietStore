namespace VietStore.Models;

public class HinhAnhSanPham
{
    public int MaHinhAnh { get; set; }
    public string MaSanPham { get; set; } = null!;
    public string URLHinhAnh { get; set; } = null!;

    public SanPham SanPham { get; set; } = null!;
}
