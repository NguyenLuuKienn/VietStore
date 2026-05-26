import { AuthService } from './authService';
import { http } from './httpClient';

const STORAGE_KEYS = {
  WISHLIST: 'shop_wishlist'
};

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '{}');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const AccountService = {
  getWishlistIds: (uid?: string): string[] => {
    const user = AuthService.getUser();
    const userId = uid || user?.id;
    if (!userId) return [];
    const wishlistMap = getLocal(STORAGE_KEYS.WISHLIST);
    return wishlistMap[userId] || [];
  },

  isWishlisted: (productId: string, uid?: string): boolean => {
    return AccountService.getWishlistIds(uid).includes(productId);
  },

  getProfile: async (uid?: string) => {
    const user = AuthService.getUser();
    const userId = uid || user?.id;
    if (!userId) return null;

    const data = await http.get<any>(`/api/users/${userId}`);
    return {
      name: data.hoTen || data.HoTen,
      email: data.email || data.Email,
      phone: data.soDienThoai || data.SoDienThoai || '',
      address: data.diaChi || data.DiaChi || '',
      avatar: 'https://picsum.photos/seed/user1/150/150'
    };
  },

  updateProfile: async (data: { fullName: string; phone: string; address: string }) => {
    const user = AuthService.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    await http.put(`/api/users/${user.id}`, {
      HoTen: data.fullName,
      SoDienThoai: data.phone,
      DiaChi: data.address || ''
    });

    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    localUser.fullName = data.fullName;
    localStorage.setItem('user', JSON.stringify(localUser));
    return true;
  },

  getMyOrders: async () => {
    const user = AuthService.getUser();
    if (!user) return [];

    const allOrders = await http.get<any[]>('/api/orders');
    return allOrders
      .filter((o: any) => (o.maNguoiDung || o.MaNguoiDung) === user.id)
      .map((o: any) => ({
        id: o.maDonHang || o.MaDonHang,
        status: o.trangThai || o.TrangThai,
        total: o.tongTien || o.TongTien,
        paymentMethod: o.phuongThucThanhToan || o.PhuongThucThanhToan || 'COD',
        date: new Date(o.ngayDatHang || o.NgayDatHang).toLocaleDateString('vi-VN'),
        itemsCount: 0
      }));
  },

  getOrderById: async (orderId: string) => {
    const data = await http.get<any>(`/api/orders/${orderId}`);
    return {
      ...data,
      date: new Date(data.order?.NgayDatHang || data.order?.ngayDatHang || Date.now()).toLocaleString('vi-VN')
    };
  },

  getWishlist: async () => {
    const user = AuthService.getUser();
    if (!user) return [];
    const userWishlist = AccountService.getWishlistIds(user.id);

    const productsResp = await http.get<any>('/api/products?limit=200');
    const allProducts = (productsResp.items || []).map((p: any) => ({
      id: p.maSanPham || p.MaSanPham,
      name: p.tenSanPham || p.TenSanPham,
      price: `${p.giaBan || p.GiaBan || 0}`,
      images: [p.anhDaiDien || p.AnhDaiDien || '']
    }));

    return allProducts.filter((p: any) => userWishlist.includes(p.id));
  },

  toggleWishlist: async (productId: string) => {
    const user = AuthService.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const wishlistMap = getLocal(STORAGE_KEYS.WISHLIST);
    const userWishlist = wishlistMap[user.id] || [];

    const index = userWishlist.indexOf(productId);
    let added = false;
    if (index !== -1) {
      userWishlist.splice(index, 1);
    } else {
      userWishlist.push(productId);
      added = true;
    }

    wishlistMap[user.id] = userWishlist;
    setLocal(STORAGE_KEYS.WISHLIST, wishlistMap);
    window.dispatchEvent(new Event('wishlist-changed'));
    return added;
  }
};
