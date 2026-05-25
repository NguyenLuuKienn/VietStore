namespace VietStore.Models;

public class ThongBao
{
    public int MaThongBao { get; set; }
    public string TieuDe { get; set; } = null!;
    public string NoiDung { get; set; } = null!;
    public DateTime ThoiGian { get; set; }
    public bool DaDoc { get; set; }
    public string? LoaiThongBao { get; set; }
    public string? MaNguoiDung { get; set; }

    public NguoiDung? NguoiDung { get; set; }
}
