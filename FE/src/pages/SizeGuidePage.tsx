import React from 'react';

const SizeGuidePage: React.FC = () => {
  return (
    <main className="flex-1 bg-bg py-10">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-3xl font-black text-dark mb-4">Hướng dẫn kiểm tra size</h1>
        <p className="text-gray-600 mb-6">Chọn đúng size giúp áo mặc đẹp và thoải mái hơn.</p>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <p><strong>1.</strong> Đo vòng ngực, vai và chiều dài áo bạn đang mặc vừa.</p>
          <p><strong>2.</strong> So sánh số đo với bảng size sản phẩm.</p>
          <p><strong>3.</strong> Nếu giữa 2 size, ưu tiên size lớn hơn nếu thích mặc thoải mái.</p>
          <p><strong>4.</strong> Với trẻ em, nên chọn dư 1 size để mặc được lâu hơn.</p>
        </div>
      </div>
    </main>
  );
};

export default SizeGuidePage;
