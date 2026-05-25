import React from 'react';

const ReturnPolicyPage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Chính sách đổi trả</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 text-gray-700">
          <p>Hỗ trợ đổi trả trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng.</p>
          <p>Sản phẩm cần còn tem mác, chưa qua sử dụng, không hư hỏng.</p>
          <p>Không áp dụng đổi trả với sản phẩm in ấn theo yêu cầu riêng.</p>
          <p>Phí vận chuyển đổi trả sẽ được thông báo tùy từng trường hợp.</p>
        </div>
      </div>
    </main>
  );
};

export default ReturnPolicyPage;
