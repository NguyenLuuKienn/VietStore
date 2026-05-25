namespace VietStore.Models;

public class KhuyenMai
{
    public string MaKhuyenMai { get; set; } = null!;
    public string MaCode { get; set; } = null!;
    public string LoaiGiamGia { get; set; } = null!;
    public decimal GiaTriGiam { get; set; }
    public decimal? GiamToiDa { get; set; }
    public decimal GiaTriDonToiThieu { get; set; }
    public int SoLuong { get; set; }
    public int DaSuDung { get; set; }
    public DateTime NgayBatDau { get; set; }
    public DateTime NgayKetThuc { get; set; }
    public bool TrangThai { get; set; }
}
