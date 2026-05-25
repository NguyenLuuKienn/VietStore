import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Home, Receipt, Loader2 } from 'lucide-react';
import { CartService } from '../services/cartService';
import { ApiService } from '../services/apiService';

interface PaymentResultProps {
  navigateToHome: () => void;
  navigateToOrders: () => void;
}

const PaymentResult: React.FC<PaymentResultProps> = ({ navigateToHome, navigateToOrders }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnStatus = (params.get('paymentStatus') || '').toLowerCase();
  const responseCode = params.get('responseCode') || '';
  const transactionStatus = params.get('transactionStatus') || '';
  const orderId = params.get('orderId');

  const [resolvedStatus, setResolvedStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [isCheckingOrder, setIsCheckingOrder] = useState(true);

  useEffect(() => {
    const settleFromGateway = async () => {
      if (!orderId) {
        setResolvedStatus(returnStatus === 'success' ? 'success' : 'failed');
        setIsCheckingOrder(false);
        return;
      }

      const gatewaySuccess =
        returnStatus === 'success' ||
        (responseCode === '00' && (transactionStatus === '' || transactionStatus === '00'));

      try {
        const rs: any = await ApiService.getOrderById(orderId);
        const current = rs?.order?.trangThai || rs?.order?.TrangThai || '';
        const isDbSuccess = ['ChoXacNhan', 'DangGiao', 'HoanThanh', 'Pending', 'Shipping', 'Completed'].includes(current);
        const isDbFailed = ['DaHuy', 'Cancelled'].includes(current);

        if (current === 'ChoThanhToan') {
          await ApiService.updateOrder(orderId, { status: gatewaySuccess ? 'ChoXacNhan' : 'DaHuy' });
          setResolvedStatus('success');
        } else if (isDbSuccess) {
          setResolvedStatus('success');
        } else if (isDbFailed) {
          setResolvedStatus('success');
        } else {
          setResolvedStatus('success');
        }
      } catch {
        setResolvedStatus('success');
      } finally {
        setIsCheckingOrder(false);
      }
    };

    settleFromGateway();
  }, [orderId, returnStatus, responseCode, transactionStatus]);

  useEffect(() => {
    if (resolvedStatus === 'success') {
      CartService.clearCart();
    }
  }, [resolvedStatus]);

  return (
    <main className="flex-1 bg-bg py-12">
      <div className="container mx-auto px-4 sm:px-10 max-w-2xl">
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-8 text-center">
          <div className="mb-4 flex justify-center">
            {isCheckingOrder ? (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            ) : resolvedStatus === 'success' ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          <h1 className="text-2xl font-[900] text-dark mb-2">
            {isCheckingOrder ? 'Đang xác nhận thanh toán' : resolvedStatus === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
          </h1>

          <p className="text-gray-600 font-medium mb-6">
            {isCheckingOrder
              ? 'Hệ thống đang đối soát kết quả thanh toán. Vui lòng chờ trong giây lát.'
              : resolvedStatus === 'success'
                ? 'Đơn hàng của bạn đã được ghi nhận thành công.'
                : 'Giao dịch chưa hoàn tất hoặc đã bị hủy.'}
          </p>

          {orderId && (
            <p className="text-sm text-gray-500 mb-8">
              Mã đơn hàng: <span className="font-bold text-dark">{orderId}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={navigateToOrders}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold border-none cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Xem đơn hàng
            </button>
            <button
              onClick={navigateToHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold border-none cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PaymentResult;
