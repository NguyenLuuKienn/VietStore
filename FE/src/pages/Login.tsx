import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, Shirt, LogIn } from 'lucide-react';
import { AuthService } from '../services/authService';
import { toast } from '../lib/toast';

interface LoginProps {
  navigateToHome: () => void;
  navigateToRegister: () => void;
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ navigateToHome, navigateToRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await AuthService.login(email, password);
      toast.success('Đăng nhập thành công');
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại';
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
          Đăng nhập vào VietStore
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Chưa có tài khoản?{' '}
          <button onClick={navigateToRegister} className="text-primary hover:text-primary/80 font-bold border-none bg-transparent cursor-pointer">
            Đăng ký ngay
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_8px_24px_rgba(100,197,227,0.15)] sm:rounded-[24px] sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[15px] font-medium focus:ring-[4px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all" placeholder="vd: admin@vietstore.vn" />
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-600 cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-primary hover:text-primary/80">Quên mật khẩu?</a>
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-[12px] shadow-[0_4px_12px_rgba(100,197,227,0.3)] text-[16px] font-bold text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all cursor-pointer border-none">
                <LogIn className="w-5 h-5" />
                Đăng nhập
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button onClick={navigateToHome} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-[12px] text-[15px] font-bold text-dark bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border-none">
              <ArrowLeft className="w-4 h-4" />
              Trở về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;


