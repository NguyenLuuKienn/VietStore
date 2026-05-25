import { User } from '../types';
import { http } from './httpClient';

const emitAuthChanged = () => window.dispatchEvent(new Event('auth-changed'));
const isAdminValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'admin' || v === '1';
  }
  if (typeof value === 'number') return value === 1;
  return false;
};
const isStaffValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'staff' || v === '2';
  }
  if (typeof value === 'number') return value === 2;
  return false;
};

const normalizeUser = (raw: any): User | null => {
  if (!raw) return null;
  const role = (
    isAdminValue(raw.role) ||
    isAdminValue(raw.quyen) ||
    isAdminValue(raw.Quyen) ||
    isAdminValue(raw.maQuyen) ||
    isAdminValue(raw.MaQuyen)
  )
    ? 'admin'
    : (
      isStaffValue(raw.role) ||
      isStaffValue(raw.quyen) ||
      isStaffValue(raw.Quyen) ||
      isStaffValue(raw.maQuyen) ||
      isStaffValue(raw.MaQuyen)
    )
      ? 'staff'
      : 'user';

  return {
    id: String(raw.id ?? raw.maNguoiDung ?? raw.MaNguoiDung ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    fullName: String(raw.fullName ?? raw.hoTen ?? raw.HoTen ?? ''),
    role
  };
};

export const AuthService = {
  getUser: (): User | null => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const normalized = normalizeUser(JSON.parse(raw));
      if (normalized) localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => localStorage.getItem('token'),

  login: async (email: string, password: string): Promise<User> => {
    const data = await http.post<any>('/api/auth/login', { Email: email, MatKhau: password });
    const user = normalizeUser(data.user);
    if (!user) throw new Error('Du lieu nguoi dung khong hop le');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
    emitAuthChanged();
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
    throw new Error('Google login chua duoc noi backend');
  },

  register: async (fullName: string, email: string, password: string): Promise<User> => {
    await http.post('/api/auth/register', { HoTen: fullName, Email: email, MatKhau: password, SoDienThoai: '' });
    return AuthService.login(email, password);
  },

  logout: async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    emitAuthChanged();
  },

  isAdmin: (): boolean => AuthService.getUser()?.role === 'admin',
  isStaff: (): boolean => AuthService.getUser()?.role === 'staff',
  canAccessAdmin: (): boolean => {
    const role = AuthService.getUser()?.role;
    return role === 'admin' || role === 'staff';
  },
  isAuthenticated: (): boolean => !!AuthService.getUser(),

  initAuth: (onUserChange: (user: User | null) => void) => {
    const check = () => onUserChange(AuthService.getUser());
    check();
    window.addEventListener('storage', check);
    window.addEventListener('auth-changed', check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('auth-changed', check);
    };
  }
};
