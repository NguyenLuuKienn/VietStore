using System.Globalization;

namespace VietStore.Services;

public static class EmailTemplates
{
    private static string BaseLayout(string title, string subtitle, string bodyHtml)
    {
        return $"""
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#eef4f8;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
          <tr>
            <td style="padding:24px 28px;background:linear-gradient(135deg,#64c5e3,#35a9cf);color:#fff;">
              <div style="font-size:28px;font-weight:900;letter-spacing:.2px;">VietStore</div>
              <div style="opacity:.95;margin-top:6px;font-size:14px;">{subtitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#111827;">{title}</h1>
              {bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px;">
              Email tự động từ hệ thống VietStore. Vui lòng không trả lời email này.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";
    }

    public static string VerifyEmailTemplate(string fullName, string verifyUrl)
    {
        var body = $"""
<p style="margin:0 0 10px 0;font-size:15px;">Xin chào <strong>{fullName}</strong>,</p>
<p style="margin:0 0 18px 0;font-size:15px;">Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác thực email để kích hoạt tài khoản.</p>
<p style="margin:0 0 20px 0;">
  <a href="{verifyUrl}" style="display:inline-block;background:#35a9cf;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Xác thực email</a>
</p>
<p style="margin:0;color:#64748b;font-size:13px;">Nếu nút không hoạt động, bạn có thể mở link này:</p>
<p style="margin:6px 0 0 0;word-break:break-all;font-size:13px;"><a href="{verifyUrl}" style="color:#0f766e;">{verifyUrl}</a></p>
""";
        return BaseLayout("Xác thực tài khoản VietStore", "Kích hoạt tài khoản nhanh chóng", body);
    }

    public static string OrderCreatedTemplate(string fullName, string orderId, decimal total, string paymentMethod)
    {
        var body = $"""
<p style="margin:0 0 10px 0;font-size:15px;">Xin chào <strong>{fullName}</strong>,</p>
<p style="margin:0 0 18px 0;font-size:15px;">Đơn hàng của bạn đã được tạo thành công.</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;">Mã đơn hàng</td><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">{orderId}</td></tr>
  <tr><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;">Phương thức thanh toán</td><td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">{paymentMethod}</td></tr>
  <tr><td style="padding:12px 14px;">Tổng tiền</td><td style="padding:12px 14px;text-align:right;font-size:18px;font-weight:800;color:#0891b2;">{FormatVnd(total)}</td></tr>
</table>
""";
        return BaseLayout("Đặt hàng thành công", "Đơn hàng mới đã được ghi nhận", body);
    }

    public static string OrderCancelledTemplate(string fullName, string orderId)
    {
        var body = $"""
<p style="margin:0 0 10px 0;font-size:15px;">Xin chào <strong>{fullName}</strong>,</p>
<p style="margin:0 0 10px 0;font-size:15px;">Đơn hàng <strong>{orderId}</strong> đã được hủy.</p>
<p style="margin:0;font-size:14px;color:#64748b;">Nếu đây không phải thao tác của bạn, vui lòng liên hệ bộ phận hỗ trợ ngay.</p>
""";
        return BaseLayout("Đơn hàng đã hủy", "Cập nhật trạng thái đơn hàng", body);
    }

    public static string OrderCompletedTemplate(string fullName, string orderId)
    {
        var body = $"""
<p style="margin:0 0 10px 0;font-size:15px;">Xin chào <strong>{fullName}</strong>,</p>
<p style="margin:0 0 10px 0;font-size:15px;">Đơn hàng <strong>{orderId}</strong> đã hoàn thành. Cảm ơn bạn đã mua sắm tại VietStore.</p>
<p style="margin:0;font-size:14px;color:#64748b;">Mong bạn sẽ tiếp tục ủng hộ trong những đơn hàng tiếp theo.</p>
""";
        return BaseLayout("Đơn hàng hoàn thành", "Cảm ơn bạn đã đồng hành cùng VietStore", body);
    }

    public static string VerifyEmailResultPage(bool success, string message)
    {
        var color = success ? "#0f766e" : "#b91c1c";
        var title = success ? "Xác thực thành công" : "Xác thực thất bại";
        return BaseLayout(
            title,
            "VietStore Account",
            $"<p style=\"margin:0;font-size:16px;color:{color};font-weight:700;\">{message}</p>"
        );
    }

    private static string FormatVnd(decimal amount)
    {
        return amount.ToString("#,0", CultureInfo.GetCultureInfo("vi-VN")) + " đ";
    }
}

