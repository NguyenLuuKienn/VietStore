namespace VietStore.Models;

public class NhatKyDonHang
{
    public int MaNhatKy { get; set; }
    public string MaDonHang { get; set; } = string.Empty;
    public string HanhDong { get; set; } = string.Empty;
    public string NoiDung { get; set; } = string.Empty;
    public string NguoiThucHien { get; set; } = string.Empty;
    public string VaiTro { get; set; } = string.Empty;
    public DateTime ThoiGian { get; set; }
}

