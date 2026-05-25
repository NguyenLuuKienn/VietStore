import React from 'react';

const FaqPage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Câu hỏi thường gặp</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 text-gray-700">
          <div><h3 className="font-bold text-dark">Bao lâu nhận được hàng?</h3><p>Thông thường từ 2-5 ngày làm việc tùy khu vực.</p></div>
          <div><h3 className="font-bold text-dark">Có kiểm tra hàng trước khi thanh toán không?</h3><p>Bạn có thể kiểm tra ngoại quan gói hàng trước khi nhận.</p></div>
          <div><h3 className="font-bold text-dark">Làm sao đổi size?</h3><p>Liên hệ hỗ trợ và cung cấp mã đơn hàng để được hướng dẫn.</p></div>
        </div>
      </div>
    </main>
  );
};

export default FaqPage;
