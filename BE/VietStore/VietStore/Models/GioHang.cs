namespace VietStore.Models;

public class GioHang
{
    public string MaGioHang { get; set; } = null!;
    public string MaNguoiDung { get; set; } = null!;
    public DateTime NgayCapNhat { get; set; }

    public NguoiDung NguoiDung { get; set; } = null!;
    public ICollection<ChiTietGioHang> ChiTietGioHangs { get; set; } = new List<ChiTietGioHang>();
}

