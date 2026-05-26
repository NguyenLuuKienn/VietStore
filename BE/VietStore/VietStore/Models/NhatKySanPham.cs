namespace VietStore.Models;

public class NhatKySanPham
{
    public int MaNhatKy { get; set; }
    public string? MaSanPham { get; set; }
    public string HanhDong { get; set; } = string.Empty;
    public string NoiDung { get; set; } = string.Empty;
    public string NguoiThucHien { get; set; } = string.Empty;
    public string VaiTro { get; set; } = string.Empty;
    public DateTime ThoiGian { get; set; }
}

