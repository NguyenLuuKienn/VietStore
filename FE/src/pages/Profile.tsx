import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import { AccountService } from '../services/accountService';
import { toast } from '../lib/toast';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    AccountService.getProfile().then(data => {
      if (data) {
        setProfile(data);
        setFormData({
          fullName: data.name,
          phone: data.phone,
          address: data.address
        });
      }
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await AccountService.updateProfile(formData);
      toast.success('Cập nhật hồ sơ thành công!');
      setProfile({ ...profile, ...formData, name: formData.fullName });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 mt-10">
        <h2 className="text-xl font-bold mb-4">Vui lòng đăng nhập để xem hồ sơ</h2>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-bg py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-10 max-w-4xl">
        <h1 className="text-[24px] sm:text-[28px] font-[800] text-dark flex items-center gap-3 mb-8">
          <span className="w-2.5 h-8 bg-primary rounded-full"></span>
          Quản Lý Hồ Sơ
        </h1>
        
        <div className="bg-white rounded-[20px] p-6 sm:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 lg:gap-14">
          <div className="flex flex-col items-center gap-4 border-r-0 md:border-r border-gray-100 pr-0 md:pr-14">
            <div className="relative group cursor-pointer mt-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-[800] text-dark text-[18px] mb-1">{profile.name}</h3>
              <span className="inline-block bg-primary/10 text-primary text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Thành viên thân thiết</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[16px] font-[800] text-dark mb-6 border-b border-gray-100 pb-4">Thông tin cá nhân</h3>
            
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-dark">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[15px] text-dark focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/10 focus:bg-white transition-all font-medium" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-dark">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[15px] text-dark focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/10 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-dark">Email</label>
                <input type="email" value={profile.email} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-[10px] text-[15px] text-gray-500 font-medium cursor-not-allowed" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-dark">Địa chỉ giao hàng mặc định</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[15px] text-dark focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/10 focus:bg-white transition-all font-medium" 
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-white font-bold text-[15px] rounded-[10px] hover:bg-opacity-90 shadow-[0_4px_12px_rgba(100,197,227,0.3)] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" />} 
                  {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Profile;
