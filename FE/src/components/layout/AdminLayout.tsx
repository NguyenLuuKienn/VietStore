import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Shirt,
  Bell,
  Search,
  PackageOpen,
  Truck,
  DollarSign,
  Layers,
  LucideIcon,
  Ticket,
  X,
  ChevronDown,
  User
} from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { AuthService } from '../../services/authService';

interface AdminLayoutProps {
  children: React.ReactNode;
  navigateToHome: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const LAST_SEEN_ORDERS_AT_KEY = 'admin_last_seen_orders_at';

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, navigateToHome, activeTab, onTabChange }) => {
  const isStaff = AuthService.isStaff();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const currentUser = AuthService.getUser();

  const parseOrderCreatedAt = (value: any): Date | null => {
    if (!value) return null;
    if (value?.toDate && typeof value.toDate === 'function') return value.toDate();
    if (value?._seconds) return new Date(value._seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getLastSeenOrdersAt = () => {
    const raw = localStorage.getItem(LAST_SEEN_ORDERS_AT_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const refreshNewOrdersCount = React.useCallback(async () => {
    try {
      const orders = await ApiService.getOrders();
      const lastSeenAt = getLastSeenOrdersAt();
      const unseen = (orders || []).filter((o: any) => (parseOrderCreatedAt(o.createdAt)?.getTime() || 0) > lastSeenAt).length;
      setNewOrdersCount(unseen);
    } catch {
      setNewOrdersCount(0);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'orders') {
      localStorage.setItem(LAST_SEEN_ORDERS_AT_KEY, Date.now().toString());
      setNewOrdersCount(0);
      return;
    }
    refreshNewOrdersCount();
  }, [activeTab, refreshNewOrdersCount]);

  React.useEffect(() => {
    refreshNewOrdersCount();
    const onAdminDataChanged = () => refreshNewOrdersCount();
    window.addEventListener('admin-data-changed', onAdminDataChanged);
    return () => window.removeEventListener('admin-data-changed', onAdminDataChanged);
  }, [refreshNewOrdersCount]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  React.useEffect(() => {
    const userId = AuthService.getUser()?.id;
    ApiService.getNotifications(userId)
      .then((items: any[]) => {
        setNotifications(
          items.map((n: any) => ({
            id: n.maThongBao || n.MaThongBao,
            title: n.tieuDe || n.TieuDe,
            content: n.noiDung || n.NoiDung,
            time: new Date(n.thoiGian || n.ThoiGian || Date.now()).toLocaleString('vi-VN'),
            read: n.daDoc ?? n.DaDoc ?? false
          }))
        );
      })
      .catch(() => {});
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    ApiService.markNotificationRead(id).catch(() => {});
  };

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'categories', label: 'Quản lý Danh mục', icon: Layers },
    { id: 'products', label: 'Quản lý Sản phẩm', icon: PackageOpen },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, badge: newOrdersCount > 0 ? newOrdersCount : undefined },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'staff', label: 'Nhân viên', icon: Users },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
    { id: 'finance', label: 'Thống kê báo cáo', icon: DollarSign },
    { id: 'discounts', label: 'Mã giảm giá', icon: Ticket }
  ];

  const staffAllowedTabs = new Set(['dashboard', 'products', 'orders', 'customers']);
  const navItems = isStaff ? allNavItems.filter((item) => staffAllowedTabs.has(item.id)) : allNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-50">
        <div className="h-20 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={navigateToHome}>
            <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
              <Shirt className="w-6 h-6" />
            </div>
            <span className="text-[22px] font-[900] text-dark tracking-[-0.5px]">
              VietStore <span className="text-primary text-[14px]">Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Menu chính</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-[12px] font-bold transition-all border-none cursor-pointer outline-none ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" /> {item.label}
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-8">Cài đặt</div>
          {!isStaff && (
            <button
              onClick={() => onTabChange('settings')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[12px] font-bold transition-all cursor-pointer border-none outline-none ${
                activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-dark'
              }`}
            >
              <Settings className="w-5 h-5" />
              Cấu hình hệ thống
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={navigateToHome}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[12px] text-red-500 hover:bg-red-50 font-bold transition-all cursor-pointer border-none bg-transparent"
          >
            <LogOut className="w-5 h-5" />
            Thoát về trang chủ
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trong admin..."
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-[14px] font-medium w-[300px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-500 hover:text-primary transition-colors cursor-pointer border-none bg-transparent p-0">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute top-10 right-0 w-[350px] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-dark">Thông báo</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-dark bg-transparent border-none p-1 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Không có thông báo nào</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${n.read ? 'text-gray-700' : 'text-dark'}`}>{n.title}</h4>
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-[13px] text-gray-600 line-clamp-2">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-sm font-bold text-primary hover:underline bg-transparent border-none cursor-pointer">Xem tất cả</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200"></div>
            <div className="relative">
              <button onClick={() => setShowUserMenu((v) => !v)} className="flex items-center gap-3 cursor-pointer border-none bg-transparent">
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[14px] font-[800] text-dark leading-none pb-1">{currentUser?.fullName || 'Tài khoản'}</p>
                  <p className="text-[12px] font-bold text-primary leading-none">
                    {AuthService.isAdmin() ? 'Admin' : AuthService.isStaff() ? 'Nhân viên' : 'Người dùng'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-[180px] bg-white rounded-xl border border-gray-100 shadow-xl p-2 z-50">
                  <button
                    onClick={() => {
                      AuthService.logout();
                      navigateToHome();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
