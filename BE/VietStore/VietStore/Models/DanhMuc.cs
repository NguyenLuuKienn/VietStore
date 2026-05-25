namespace VietStore.Models;

public class DanhMuc
{
    public string MaDanhMuc { get; set; } = null!;
    public string TenDanhMuc { get; set; } = null!;
    public string? MaDanhMucCha { get; set; }

    public ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
}
