import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Điều khoản dịch vụ</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 text-gray-700">
          <p>Khi sử dụng website, bạn đồng ý với các điều khoản mua bán và thanh toán của VietStore.</p>
          <p>Thông tin sản phẩm, giá bán có thể được cập nhật mà không cần báo trước.</p>
          <p>VietStore có quyền từ chối hoặc hủy đơn hàng trong các trường hợp bất thường.</p>
        </div>
      </div>
    </main>
  );
};

export default TermsPage;
