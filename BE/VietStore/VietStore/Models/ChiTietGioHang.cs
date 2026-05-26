namespace VietStore.Models;

public class ChiTietGioHang
{
    public int MaChiTietGioHang { get; set; }
    public string MaGioHang { get; set; } = null!;
    public string MaSanPham { get; set; } = null!;
    public string KichThuoc { get; set; } = "M";
    public int SoLuong { get; set; }
    public DateTime NgayCapNhat { get; set; }

    public GioHang GioHang { get; set; } = null!;
    public SanPham SanPham { get; set; } = null!;
}

