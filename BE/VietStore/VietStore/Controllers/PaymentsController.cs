using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;
using VietStore.Services;

namespace VietStore.Controllers;

[ApiController]
[Route("api/payments/vnpay")]
public class PaymentsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly VietStoreDbContext _dbContext;
    private readonly ILogger<PaymentsController> _logger;
    private readonly IEmailService _emailService;

    public PaymentsController(IConfiguration configuration, VietStoreDbContext dbContext, ILogger<PaymentsController> logger, IEmailService emailService)
    {
        _configuration = configuration;
        _dbContext = dbContext;
        _logger = logger;
        _emailService = emailService;
    }

    [HttpPost("create")]
    public IActionResult CreatePaymentUrl([FromBody] CreateVnpayPaymentRequest request)
    {
        var tmnCode = _configuration["Vnpay:TmnCode"];
        var hashSecret = _configuration["Vnpay:HashSecret"];
        var baseUrl = _configuration["Vnpay:BaseUrl"]
            ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        var returnUrl = _configuration["Vnpay:ReturnUrl"];

        if (string.IsNullOrWhiteSpace(tmnCode) ||
            string.IsNullOrWhiteSpace(hashSecret) ||
            string.IsNullOrWhiteSpace(returnUrl))
        {
            return BadRequest(new
            {
                message = "VNPAY config is missing. Please set Vnpay:TmnCode, Vnpay:HashSecret, Vnpay:ReturnUrl"
            });
        }

        if (request.Amount <= 0)
        {
            return BadRequest(new { message = "Amount must be greater than 0" });
        }

        if (string.IsNullOrWhiteSpace(request.OrderId))
        {
            return BadRequest(new { message = "OrderId is required" });
        }

        var txnRef = request.OrderId.Trim();

        var amount = ((long)Math.Round(
            request.Amount,
            0,
            MidpointRounding.AwayFromZero
        )) * 100;

        var now = DateTime.UtcNow.AddHours(7);
        var expire = now.AddMinutes(15);

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrWhiteSpace(clientIp) || clientIp == "::1")
        {
            clientIp = "127.0.0.1";
        }

        var data = new SortedDictionary<string, string>
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_Amount"] = amount.ToString(CultureInfo.InvariantCulture),
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = clientIp,
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = string.IsNullOrWhiteSpace(request.OrderInfo)
                ? $"Thanh toan don hang {txnRef}"
                : request.OrderInfo.Trim(),
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = returnUrl,
            ["vnp_TxnRef"] = txnRef,
            ["vnp_ExpireDate"] = expire.ToString("yyyyMMddHHmmss")
        };

        var signData = BuildQueryString(data, encode: true);
        var secureHash = HmacSha512(hashSecret, signData);

        var query = BuildQueryString(data, encode: true);
        var paymentUrl = $"{baseUrl}?{query}&vnp_SecureHash={secureHash}";

        return Ok(new { paymentUrl });
    }

    [HttpGet("return")]
    public async Task<IActionResult> PaymentReturn()
    {
        var hashSecret = _configuration["Vnpay:HashSecret"];
        var frontendReturnUrl = _configuration["Vnpay:FrontendReturnUrl"]
            ?? "http://localhost:3000/checkout";
        var skipSignatureOnReturn = string.Equals(
            _configuration["Vnpay:SkipSignatureValidationOnReturn"],
            "true",
            StringComparison.OrdinalIgnoreCase
        );

        if (string.IsNullOrWhiteSpace(hashSecret))
        {
            return Redirect($"{frontendReturnUrl}?paymentStatus=failed&message=Missing%20VNPAY%20secret");
        }

        var query = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());

        if (!query.TryGetValue("vnp_TxnRef", out var orderId))
        {
            return Redirect($"{frontendReturnUrl}?paymentStatus=failed&message=Missing%20order%20id");
        }

        var isValid = ValidateSignature(query, Request.QueryString.Value, hashSecret);

        var responseCode = query.TryGetValue("vnp_ResponseCode", out var rc) ? rc : "";
        var transactionStatus = query.TryGetValue("vnp_TransactionStatus", out var ts) ? ts : "";
        var isGatewaySuccess = responseCode == "00" && (string.IsNullOrWhiteSpace(transactionStatus) || transactionStatus == "00");
        _logger.LogInformation(
            "VNPAY RETURN orderId={OrderId}, responseCode={ResponseCode}, transactionStatus={TransactionStatus}, validSignature={ValidSignature}, rawQuery={RawQuery}",
            orderId, responseCode, transactionStatus, isValid, Request.QueryString.Value
        );

        var isSuccess = isGatewaySuccess && (isValid || skipSignatureOnReturn);

        if (isSuccess)
        {
            await MarkOrderPaid(orderId);
        }
        else
        {
            await CancelOrderAndRestock(orderId);
        }

        var order = await _dbContext.DonHang
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaDonHang == orderId);
        var finalStatus = order?.TrangThai ?? "";
        var finalSuccess = finalStatus == "ChoXacNhan" || finalStatus == "DangGiao" || finalStatus == "HoanThanh";

        var reason = finalSuccess
            ? "ok"
            : !isSuccess
                ? ((!isValid && !skipSignatureOnReturn)
                    ? "invalid_signature"
                    : $"gateway_failed_{responseCode}_{transactionStatus}")
                : $"order_status_{finalStatus}";

        var redirectUrl =
            $"{frontendReturnUrl}" +
            $"?paymentStatus={(finalSuccess ? "success" : "failed")}" +
            $"&orderId={Uri.EscapeDataString(orderId)}" +
            $"&orderStatus={Uri.EscapeDataString(finalStatus)}" +
            $"&responseCode={Uri.EscapeDataString(responseCode)}" +
            $"&transactionStatus={Uri.EscapeDataString(transactionStatus)}" +
            $"&reason={Uri.EscapeDataString(reason)}";

        _logger.LogInformation("VNPAY RETURN redirectUrl={RedirectUrl}", redirectUrl);

        return Redirect(redirectUrl);
    }

    [HttpGet("ipn")]
    public async Task<IActionResult> Ipn()
    {
        var hashSecret = _configuration["Vnpay:HashSecret"];

        if (string.IsNullOrWhiteSpace(hashSecret))
        {
            return Ok(new { RspCode = "99", Message = "Missing config" });
        }

        var query = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());

        if (!query.TryGetValue("vnp_TxnRef", out var orderId))
        {
            return Ok(new { RspCode = "01", Message = "Order not found" });
        }

        var validSignature = ValidateSignature(query, Request.QueryString.Value, hashSecret);
        if (!validSignature)
        {
            _logger.LogWarning("VNPAY IPN invalid signature. rawQuery={RawQuery}", Request.QueryString.Value);
            return Ok(new { RspCode = "97", Message = "Invalid signature" });
        }

        var responseCode = query.TryGetValue("vnp_ResponseCode", out var rc) ? rc : "";
        var transactionStatus = query.TryGetValue("vnp_TransactionStatus", out var ts) ? ts : "";
        _logger.LogInformation(
            "VNPAY IPN orderId={OrderId}, responseCode={ResponseCode}, transactionStatus={TransactionStatus}, validSignature={ValidSignature}, rawQuery={RawQuery}",
            orderId, responseCode, transactionStatus, validSignature, Request.QueryString.Value
        );

        var isSuccess = responseCode == "00" && (string.IsNullOrWhiteSpace(transactionStatus) || transactionStatus == "00");

        var order = await _dbContext.DonHang
            .FirstOrDefaultAsync(x => x.MaDonHang == orderId);

        if (order is null)
        {
            return Ok(new { RspCode = "01", Message = "Order not found" });
        }

        if (isSuccess)
        {
            await MarkOrderPaid(orderId);
        }
        else
        {
            await CancelOrderAndRestock(orderId);
        }

        return Ok(new { RspCode = "00", Message = "Confirm Success" });
    }

    private static string BuildQueryString(SortedDictionary<string, string> data, bool encode)
    {
        var parts = data
            .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
            .Select(kv =>
            {
                var key = encode ? WebUtility.UrlEncode(kv.Key) : kv.Key;
                var value = encode ? WebUtility.UrlEncode(kv.Value) : kv.Value;

                return $"{key}={value}";
            });

        return string.Join("&", parts);
    }

    private static string HmacSha512(string key, string input)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(input);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(inputBytes);

        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static bool ValidateSignature(Dictionary<string, string> query, string? rawQueryString, string hashSecret)
    {
        if (!query.TryGetValue("vnp_SecureHash", out var secureHash) ||
            string.IsNullOrWhiteSpace(secureHash))
        {
            return false;
        }

        var rawData = BuildSignDataFromRawQuery(rawQueryString);
        if (string.IsNullOrWhiteSpace(rawData))
        {
            var signData = new SortedDictionary<string, string>(
                query
                    .Where(kv => kv.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase))
                    .Where(kv => kv.Key != "vnp_SecureHash")
                    .Where(kv => kv.Key != "vnp_SecureHashType")
                    .ToDictionary(kv => kv.Key, kv => kv.Value)
            );
            rawData = BuildQueryString(signData, encode: true);
        }

        var expectedHash = HmacSha512(hashSecret, rawData);

        return string.Equals(expectedHash, secureHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildSignDataFromRawQuery(string? rawQueryString)
    {
        if (string.IsNullOrWhiteSpace(rawQueryString)) return string.Empty;
        var raw = rawQueryString.StartsWith("?") ? rawQueryString.Substring(1) : rawQueryString;
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

        var parts = raw.Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p =>
            {
                var idx = p.IndexOf('=');
                if (idx < 0) return (rawKey: p, rawValue: "", key: Uri.UnescapeDataString(p), pair: p);
                var rawKey = p.Substring(0, idx);
                var rawValue = p.Substring(idx + 1);
                var decodedKey = Uri.UnescapeDataString(rawKey);
                return (rawKey, rawValue, key: decodedKey, pair: $"{rawKey}={rawValue}");
            })
            .Where(x => x.key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase))
            .Where(x => !string.Equals(x.key, "vnp_SecureHash", StringComparison.OrdinalIgnoreCase))
            .Where(x => !string.Equals(x.key, "vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            .OrderBy(x => x.key, StringComparer.Ordinal)
            .ThenBy(x => x.rawKey, StringComparer.Ordinal)
            .Select(x => x.pair);

        return string.Join("&", parts);
    }

    private async Task CancelOrderAndRestock(string orderId)
    {
        var order = await _dbContext.DonHang
            .FirstOrDefaultAsync(x => x.MaDonHang == orderId);

        if (order is null || order.TrangThai == "DaHuy")
        {
            return;
        }

        var details = await _dbContext.ChiTietDonHang
            .Where(x => x.MaDonHang == orderId)
            .ToListAsync();

        var groups = details
            .GroupBy(x => x.MaSanPham)
            .Select(g => new
            {
                MaSanPham = g.Key,
                SoLuong = g.Sum(i => i.SoLuong)
            });

        foreach (var g in groups)
        {
            var product = await _dbContext.SanPham
                .FirstOrDefaultAsync(x => x.MaSanPham == g.MaSanPham);

            if (product is not null)
            {
                product.SoLuongTon += g.SoLuong;
            }
        }

        var paymentMethod = (order.PhuongThucThanhToan ?? "").Trim().ToUpperInvariant();
        if (paymentMethod == "VNPAY" && order.TrangThai == "ChoThanhToan")
        {
            _dbContext.ChiTietDonHang.RemoveRange(details);
            _dbContext.DonHang.Remove(order);
        }
        else
        {
            order.TrangThai = "DaHuy";
        }

        await _dbContext.SaveChangesAsync();

        if (!string.Equals((order.PhuongThucThanhToan ?? "").Trim(), "VNPAY", StringComparison.OrdinalIgnoreCase) ||
            order.TrangThai == "DaHuy")
        {
            await SendOrderCancelledEmail(order);
        }
    }

    private async Task MarkOrderPaid(string orderId)
    {
        var order = await _dbContext.DonHang
            .FirstOrDefaultAsync(x => x.MaDonHang == orderId);

        if (order is null) return;
        if (order.TrangThai == "DaHuy") return;

        if (order.TrangThai == "ChoThanhToan")
        {
            order.TrangThai = "ChoXacNhan";
            await _dbContext.SaveChangesAsync();
        }
    }

    private async Task SendOrderCancelledEmail(VietStore.Models.DonHang order)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(order.MaNguoiDung)) return;
            var email = await _dbContext.NguoiDung
                .Where(x => x.MaNguoiDung == order.MaNguoiDung)
                .Select(x => x.Email)
                .FirstOrDefaultAsync();
            if (string.IsNullOrWhiteSpace(email)) return;

            var html = EmailTemplates.OrderCancelledTemplate(order.TenKhachHang, order.MaDonHang);
            await _emailService.SendAsync(email, $"[VietStore] Đơn hàng đã hủy #{order.MaDonHang}", html);
        }
        catch
        {
            // Ignore email failure.
        }
    }
}

public record CreateVnpayPaymentRequest(
    string OrderId,
    decimal Amount,
    string? OrderInfo
);
