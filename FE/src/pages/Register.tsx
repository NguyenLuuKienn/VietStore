import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, Shirt, UserPlus } from 'lucide-react';
import { AuthService } from '../services/authService';
import { toast } from '../lib/toast';

interface RegisterProps {
  navigateToHome: () => void;
  navigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ navigateToHome, navigateToLogin, onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await AuthService.register(fullName, email, password);
      toast.success('Dang ky thanh cong');
      onRegisterSuccess();
    } catch (err: any) {
      const msg = err.message || 'Dang ky that bai';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6 cursor-pointer" onClick={navigateToHome}>
          <div className="bg-primary text-white p-3 rounded-xl shadow-lg">
            <Shirt className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-[28px] font-[900] text-dark tracking-tight">
          Tạo tài khoản mới
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Đã có tài khoản?{' '}
          <button onClick={navigateToLogin} className="text-primary hover:text-primary/80 font-bold border-none bg-transparent cursor-pointer">
            Đăng nhập
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_8px_24px_rgba(100,197,227,0.15)] sm:rounded-[24px] sm:px-10 border border-white">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[15px] font-medium focus:ring-[4px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" placeholder="Nguyễn Văn A" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[15px] font-medium focus:ring-[4px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" placeholder="vd: nguyenvan@gmail.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[15px] font-medium focus:ring-[4px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Thêm số điện thoại (Tùy chọn)</label>
              <div className="relative">
                <input type="tel" className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[15px] font-medium focus:ring-[4px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" placeholder="09xxxxxxx" />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-[12px] shadow-[0_4px_12px_rgba(100,197,227,0.3)] text-[16px] font-bold text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all cursor-pointer border-none">
                <UserPlus className="w-5 h-5" />
                Đăng ký tài khoản
              </button>
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm font-medium">
                <span className="px-3 bg-white text-gray-500">Hoặc đăng ký nhanh với</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await AuthService.loginWithGoogle();
                    onRegisterSuccess();
                  } catch (err: any) {
                    setError(err.message);
                  }
                }}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-[12px] bg-white text-[15px] font-bold text-dark hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Đăng ký bằng Google
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 font-medium">Bằng việc đăng ký, bạn đồng ý với Điều khoản và chính sách của chúng tôi.</p>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Register;

