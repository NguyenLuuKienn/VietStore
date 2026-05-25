namespace VietStore.Models;

public class Banner
{
    public string MaBanner { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string? PhuDe { get; set; }
    public string? MucGiam { get; set; }
    public string? MaCode { get; set; }
    public string URLHinhAnh { get; set; } = null!;
    public string? DuongDan { get; set; }
    public int ThuTu { get; set; }
    public string LoaiBanner { get; set; } = null!;
}
