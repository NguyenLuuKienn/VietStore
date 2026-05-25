import React from 'react';

const OrderTrackingGuidePage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Tra cứu đơn hàng</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 text-gray-700">
          <p>Để tra cứu đơn hàng, bạn có thể:</p>
          <p><strong>1.</strong> Đăng nhập và vào mục <strong>Đơn hàng của tôi</strong>.</p>
          <p><strong>2.</strong> Kiểm tra trạng thái: Chờ xác nhận, Đang giao, Hoàn thành hoặc Đã hủy.</p>
          <p><strong>3.</strong> Nếu cần hỗ trợ, liên hệ CSKH và cung cấp mã đơn hàng.</p>
        </div>
      </div>
    </main>
  );
};

export default OrderTrackingGuidePage;
