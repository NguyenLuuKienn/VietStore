import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Chính sách bảo mật</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 text-gray-700">
          <p>VietStore cam kết bảo mật thông tin cá nhân và dữ liệu giao dịch của khách hàng.</p>
          <p>Thông tin được sử dụng để xử lý đơn hàng, chăm sóc khách hàng và nâng cao chất lượng dịch vụ.</p>
          <p>Chúng tôi không chia sẻ thông tin cá nhân cho bên thứ ba khi chưa có sự đồng ý.</p>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
