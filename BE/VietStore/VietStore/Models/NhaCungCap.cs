namespace VietStore.Models;

public class NhaCungCap
{
    public string MaNhaCungCap { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string NguoiLienHe { get; set; } = null!;
    public string SoDienThoai { get; set; } = null!;
    public string? Email { get; set; }
    public string? DiaChi { get; set; }
    public string? TrangThai { get; set; }

    public ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
}
