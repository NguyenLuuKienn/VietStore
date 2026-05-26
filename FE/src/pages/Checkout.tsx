import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { CartService } from '../services/cartService';
import { AuthService } from '../services/authService';
import { ApiService } from '../services/apiService';
import { AccountService } from '../services/accountService';
import { HttpError } from '../services/httpClient';
import { SystemConfigService } from '../services/systemConfigService';
import { toast } from '../lib/toast';

interface CheckoutProps {
  onBack: () => void;
  navigateToHome: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, navigateToHome }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; amount: number } | null>(null);
  const [shipping, setShipping] = useState(SystemConfigService.getShippingFee());

  useEffect(() => {
    const user = AuthService.getUser();
    if (user?.id) {
      AccountService.getProfile().then((profile) => {
        if (profile) {
          setFullName(profile.name || '');
          setPhone(profile.phone || '');
          setAddress(profile.address || '');
        }
      });
    }
  }, []);

  useEffect(() => {
    const updateShipping = () => setShipping(SystemConfigService.getShippingFee());
    window.addEventListener('shipping-fee-updated', updateShipping);
    return () => window.removeEventListener('shipping-fee-updated', updateShipping);
  }, []);

  const allItems = CartService.getCartItems();
  const userId = AuthService.getUser()?.id || 'guest';
  const selectionKey = `checkout_selection:${userId}`;

  const selectedIds = (() => {
    try {
      const raw = localStorage.getItem(selectionKey);
      if (!raw) return allItems.map((x) => x.id);
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return allItems.map((x) => x.id);
      return ids.map((x) => Number(x)).filter((x) => Number.isFinite(x));
    } catch {
      return allItems.map((x) => x.id);
    }
  })();

  const items = allItems.filter((item) => selectedIds.includes(item.id));
  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleApplyVoucher = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    const code = voucherCode.toUpperCase();
    try {
      const rs = await ApiService.applyVoucher(code, subTotal);
      if (rs?.IsValid || rs?.isValid) {
        const amount = Number(rs.SoTienDuocApDung ?? rs.soTienDuocApDung ?? 0);
        setDiscount(amount);
        setAppliedVoucher({ code, amount });
        setVoucherError('');
      } else {
        setVoucherError(rs?.Message || rs?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
    } catch {
      setVoucherError('Không thể kiểm tra mã giảm giá lúc này');
    }
  };

  const handleRemoveVoucher = () => {
    setDiscount(0);
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const total = items.length > 0 ? subTotal + shipping - discount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm từ giỏ hàng để thanh toán');
      return;
    }

    setIsSubmitting(true);

    const user = AuthService.getUser();
    const orderData = {
      userId: user?.id || 'anonymous',
      customerName: fullName,
      phone,
      address,
      items: items.map((item) => ({
        productId: item.productId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image
      })),
      total: total,
      paymentMethod,
      voucherCode: appliedVoucher?.code || null,
      status: 'ChoXacNhan',
      date: new Date().toLocaleDateString('vi-VN'),
      itemsCount: items.length
    };

    try {
      if (paymentMethod === 'vnpay') {
        const created: any = await ApiService.createOrder(orderData);
        const orderId = created?.id || created?.maDonHang || created?.MaDonHang;
        if (!orderId) throw new Error('Không tạo được đơn hàng trước khi thanh toán VNPAY');
        const rs = await ApiService.createVnpayPayment({
          orderId,
          amount: total,
          orderInfo: `Thanh toan don hang ${orderId}`
        });
        if (!rs?.paymentUrl) throw new Error('Không tạo được liên kết thanh toán VNPAY');
        localStorage.removeItem(selectionKey);
        window.location.href = rs.paymentUrl;
        return;
      }

      await ApiService.createOrder(orderData);

      const remaining = allItems.filter((x) => !selectedIds.includes(x.id));
      await CartService.clearCart();
      for (const r of remaining) {
        await CartService.addItem(
          {
            id: r.productId,
            name: r.name,
            price: r.price,
            images: [r.image]
          },
          r.size,
          r.quantity
        );
      }

      localStorage.removeItem(selectionKey);
      toast.success('Đơn hàng của bạn đã được đặt thành công!');
      navigateToHome();
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        const data = err.data || {};
        const stock = data.soLuongTon ?? data.SoLuongTon;
        const reqQty = data.soLuongDat ?? data.SoLuongDat;
        const product = data.tenSanPham || data.TenSanPham || data.maSanPham || data.MaSanPham;
        if (stock !== undefined && reqQty !== undefined) {
          toast.error(`Sản phẩm ${product || ''} không đủ tồn kho (${stock}/${reqQty}).`);
        } else {
          toast.error(err.message || 'Có lỗi xảy ra khi xử lý đơn hàng');
        }
      } else if (err instanceof Error) {
        toast.error(err.message || 'Có lỗi xảy ra khi xử lý đơn hàng');
      } else {
        toast.error('Có lỗi xảy ra khi xử lý đơn hàng');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="flex-1 bg-bg py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium mb-4">Bạn chưa chọn sản phẩm nào để thanh toán</p>
          <button onClick={navigateToHome} className="bg-primary text-white font-bold px-6 py-2 rounded-lg cursor-pointer border-none">
            Quay lại cửa hàng
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-bg py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-dark hover:text-primary transition-colors bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-gray-100 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[24px] sm:text-[28px] font-[900] text-dark m-0">Tiến hành thanh toán</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-[800] text-dark mb-6 flex items-center gap-2">
                <MapPin className="text-primary w-6 h-6" /> Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label htmlFor="checkout-full-name" className="block text-sm font-bold text-gray-700 mb-2">Họ và tên *</label>
                  <input id="checkout-full-name" name="fullName" autoComplete="name" required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="Nhập họ và tên" />
                </div>
                <div>
                  <label htmlFor="checkout-phone" className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại *</label>
                  <input id="checkout-phone" name="phone" autoComplete="tel" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="Nhập số điện thoại" />
                </div>
              </div>
              <div>
                <label htmlFor="checkout-address" className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ nhận hàng *</label>
                <input id="checkout-address" name="address" autoComplete="street-address" required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-all font-medium" placeholder="Số nhà, tên đường..." />
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-[800] text-dark mb-6 flex items-center gap-2">
                <CreditCard className="text-primary w-6 h-6" /> Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                <label className={`block cursor-pointer border-2 rounded-xl p-4 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <input id="payment-cod" type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-primary" />
                    <Truck className="w-6 h-6 text-gray-600" />
                    <div>
                      <h4 className="font-bold text-dark text-[15px]">Thanh toán khi nhận hàng (COD)</h4>
                      <p className="text-sm text-gray-500 font-medium">Thanh toán bằng tiền mặt khi giao hàng tận nơi</p>
                    </div>
                  </div>
                </label>
                <label className={`block cursor-pointer border-2 rounded-xl p-4 transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <input id="payment-vnpay" type="radio" name="payment" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-5 h-5 accent-primary" />
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <div>
                      <h4 className="font-bold text-dark text-[15px]">Thanh toán VNPAY</h4>
                      <p className="text-sm text-gray-500 font-medium">Chuyển sang cổng VNPAY Sandbox để thanh toán online</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[380px]">
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-primary/20 sticky top-[140px]">
              <h3 className="text-[18px] font-[800] text-dark mb-6 pb-4 border-b border-gray-100">
                Đơn hàng của bạn ({items.length} sản phẩm)
              </h3>
              <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <img src={item.image} alt={item.name} className="w-16 h-20 bg-gray-100 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-dark line-clamp-2 leading-tight mb-1">{item.name}</h4>
                      <div className="text-primary font-bold text-sm mb-1">{CartService.formatPrice(item.price)}</div>
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">Size: {item.size} x {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      id="checkout-voucher-code"
                      name="voucherCode"
                      autoComplete="off"
                      type="text"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value)}
                      placeholder="Mã giảm giá"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-sm uppercase transition-all"
                      disabled={appliedVoucher !== null}
                    />
                  </div>
                  <button
                    onClick={handleApplyVoucher}
                    disabled={appliedVoucher !== null || !voucherCode.trim()}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-dark font-bold rounded-xl text-sm transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
                {voucherError && <p className="text-red-500 text-[13px] font-medium mt-1">{voucherError}</p>}
                {appliedVoucher && (
                  <div className="flex items-center justify-between mt-3 bg-green-50 p-3 rounded-xl border border-green-100">
                    <div>
                      <p className="text-[13px] font-bold text-green-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Đã áp dụng mã: {appliedVoucher.code}
                      </p>
                      <p className="text-[12px] font-medium text-green-600 mt-0.5">- {CartService.formatPrice(appliedVoucher.amount)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); handleRemoveVoucher(); }}
                      className="text-red-500 hover:text-red-600 text-[13px] font-bold border-none bg-transparent cursor-pointer underline p-0"
                    >
                      Bỏ dùng
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6 text-[15px] border-t border-gray-100 pt-6">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Tạm tính</span>
                  <span className="font-bold text-dark">{CartService.formatPrice(subTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Phí giao hàng</span>
                  <span className="font-bold text-dark">{CartService.formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Giảm giá</span>
                    <span className="font-bold">- {CartService.formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center bg-gray-50 -mx-6 px-6 pb-6 rounded-b-[20px] mt-4">
                  <span className="font-bold text-dark">Tổng thanh toán</span>
                  <span className="font-[900] text-[24px] text-primary">{CartService.formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 bg-primary text-white font-bold text-[16px] rounded-[12px] hover:bg-opacity-90 shadow-lg transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
