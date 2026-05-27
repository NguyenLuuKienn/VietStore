import { Product, hotCategories } from '../types';
import { http } from './httpClient';
const CACHE_TTL_MS = 15000;
const now = () => Date.now();
const LS_CACHE_PREFIX = 'api_cache_v1:';
const cache = {
  products: new Map<string, { at: number; data: Product[] }>(),
  categories: null as null | { at: number; data: any[] },
  suppliers: null as null | { at: number; data: any[] },
  orders: null as null | { at: number; data: any[] }
};
const inflight = {
  products: new Map<string, Promise<Product[]>>(),
  categories: null as null | Promise<any[]>,
  suppliers: null as null | Promise<any[]>,
  orders: null as null | Promise<any[]>
};
const isFresh = (at: number) => now() - at < CACHE_TTL_MS;
const lsKey = (key: string) => `${LS_CACHE_PREFIX}${key}`;
const readLsCache = <T = any>(key: string, ttlMs = CACHE_TTL_MS): T | null => {
  try {
    const raw = localStorage.getItem(lsKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (!parsed?.at || now() - parsed.at >= ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
};
const writeLsCache = (key: string, data: any) => {
  try {
    localStorage.setItem(lsKey(key), JSON.stringify({ at: now(), data }));
  } catch {}
};
const removeLsCache = (key: string) => {
  try {
    localStorage.removeItem(lsKey(key));
  } catch {}
};
const removeLsByPrefix = (prefix: string) => {
  try {
    const fullPrefix = lsKey(prefix);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) localStorage.removeItem(k);
    }
  } catch {}
};

const toNumberPrice = (value: any): number => {
  if (typeof value === 'number') return value;
  const normalized = String(value ?? '').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asArray = <T = any>(value: any): T[] => Array.isArray(value) ? value : [];
const normalizeImageUrls = (value: any): string[] =>
  asArray<string>(value)
    .map(x => String(x ?? '').trim())
    .filter(Boolean)
    .slice(0, 6);

const mapProduct = (item: any): Product => ({
  id: item.maSanPham || item.MaSanPham,
  name: item.tenSanPham || item.TenSanPham,
  price: `${Math.round(item.giaBan || item.GiaBan || 0)}`,
  isDiscounted: Boolean(item.isGiamGia ?? item.IsGiamGia ?? item.isDiscounted ?? item.IsDiscounted),
  discountAmount: Number(item.soTienGiam ?? item.SoTienGiam ?? item.discountAmount ?? 0),
  category: item.maDanhMuc || item.MaDanhMuc || '',
  images:
    normalizeImageUrls(item.images || item.Images).length > 0
      ? normalizeImageUrls(item.images || item.Images)
      : [item.anhDaiDien || item.AnhDaiDien || ''].filter(Boolean),
  description: item.moTa || item.MoTa || '',
  detailedInfo: item.thongTinChiTiet || item.ThongTinChiTiet || '',
  isFeaturedNew: Boolean(item.isFeaturedNew ?? item.IsFeaturedNew),
  isFeaturedBestseller: Boolean(item.isFeaturedBestseller ?? item.IsFeaturedBestseller),
  stockQuantity: Number(item.soLuongTon ?? item.SoLuongTon ?? item.stockQuantity ?? 0),
  soldCount: item.soLuotBan || item.SoLuotBan || 0,
  supplier: item.maNhaCungCap || item.MaNhaCungCap || '',
  isVisible: Boolean(item.isVisible ?? item.IsVisible ?? true)
});

const mapSupplierToUi = (s: any) => ({
  id: s.maNhaCungCap || s.MaNhaCungCap,
  name: s.tenCongTy || s.TenCongTy || '',
  contact: s.nguoiLienHe || s.NguoiLienHe || '',
  phone: s.soDienThoai || s.SoDienThoai || '',
  email: s.email || s.Email || '',
  address: s.diaChi || s.DiaChi || '',
  status: s.trangThai || s.TrangThai || ''
});

export const ApiService = {
  getSuppliers: async () => {
    if (cache.suppliers && isFresh(cache.suppliers.at)) return cache.suppliers.data;
    const lsData = readLsCache<any[]>('suppliers');
    if (lsData) {
      cache.suppliers = { at: now(), data: lsData };
      return lsData;
    }
    if (inflight.suppliers) return inflight.suppliers;
    inflight.suppliers = (async () => {
      const data = await http.get<any[]>('/api/suppliers');
      const mapped = asArray(data).map(mapSupplierToUi);
      cache.suppliers = { at: now(), data: mapped };
      writeLsCache('suppliers', mapped);
      return mapped;
    })();
    try {
      return await inflight.suppliers;
    } finally {
      inflight.suppliers = null;
    }
  },

  createSupplier: async (data: any) => {
    const res = await http.post('/api/suppliers', {
      MaNhaCungCap: data.MaNhaCungCap || `NCC${Date.now()}`,
      TenCongTy: data.TenCongTy || data.tenCongTy || data.name || '',
      NguoiLienHe: data.NguoiLienHe || data.nguoiLienHe || data.contact || '',
      SoDienThoai: data.SoDienThoai || data.soDienThoai || data.phone || '',
      Email: data.Email || data.email || '',
      DiaChi: data.DiaChi || data.diaChi || data.address || '',
      TrangThai: data.TrangThai || data.trangThai || data.status || 'Hoat dong'
    });
    cache.suppliers = null;
    removeLsCache('suppliers');
    return res;
  },

  updateSupplier: async (id: string, data: any) => {
    const res = await http.put(`/api/suppliers/${id}`, {
      TenCongTy: data.TenCongTy || data.tenCongTy || data.name || '',
      NguoiLienHe: data.NguoiLienHe || data.nguoiLienHe || data.contact || '',
      SoDienThoai: data.SoDienThoai || data.soDienThoai || data.phone || '',
      Email: data.Email || data.email || '',
      DiaChi: data.DiaChi || data.diaChi || data.address || '',
      TrangThai: data.TrangThai || data.trangThai || data.status || 'Hoat dong'
    });
    cache.suppliers = null;
    removeLsCache('suppliers');
    return res;
  },

  deleteSupplier: async (id: string) => {
    await http.delete(`/api/suppliers/${id}`);
    cache.suppliers = null;
    removeLsCache('suppliers');
    return { success: true };
  },

  getCustomers: async () => {
    const data = await http.get<any>('/api/users');
    return data.items || [];
  },

  getStaffs: async () => {
    const data = await http.get<any[]>('/api/users/staff');
    return asArray(data);
  },

  createStaff: async (data: any) => {
    return http.post('/api/users/staff', {
      HoTen: data.HoTen || data.fullName || '',
      Email: data.Email || data.email || '',
      MatKhau: data.MatKhau || data.password || '123456',
      SoDienThoai: data.SoDienThoai || data.phone || '',
      DiaChi: data.DiaChi || data.address || '',
      TrangThai: data.TrangThai || data.status || 'active'
    });
  },

  updateStaff: async (id: string, data: any) => {
    return http.put(`/api/users/staff/${id}`, {
      HoTen: data.HoTen || data.fullName || '',
      SoDienThoai: data.SoDienThoai || data.phone || '',
      DiaChi: data.DiaChi || data.address || '',
      TrangThai: data.TrangThai || data.status || 'active'
    });
  },

  deleteStaff: async (id: string) => {
    await http.delete(`/api/users/staff/${id}`);
    return { success: true };
  },

  updateCustomerStatus: async (id: string, status: 'active' | 'inactive' | 'locked') => {
    await http.put(`/api/users/${id}/status`, { TrangThai: status });
    return true;
  },

  getProducts: async (pageSize = 20, includeImages = false, includeHidden = false): Promise<Product[]> => {
    const key = `${pageSize}:${includeImages ? 1 : 0}:${includeHidden ? 1 : 0}`;
    const cached = cache.products.get(key);
    if (cached && isFresh(cached.at)) return cached.data;
    if (inflight.products.has(key)) return inflight.products.get(key)!;
    const req = (async () => {
      const data = await http.get<any>(`/api/products?limit=${pageSize}&includeImages=${includeImages}&includeHidden=${includeHidden}`);
      const mapped = (data.items || []).map(mapProduct);
      cache.products.set(key, { at: now(), data: mapped });
      return mapped;
    })();
    inflight.products.set(key, req);
    try {
      return await req;
    } finally {
      inflight.products.delete(key);
    }
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const data = await http.get<any>(`/api/products/${id}`);
    if (!data?.product) return undefined;
    return {
      ...mapProduct(data.product),
      images: normalizeImageUrls((data.images || []).map((x: any) => x.urlHinhAnh || x.URLHinhAnh))
    };
  },

  getHotProducts: async (): Promise<Product[]> => (await ApiService.getProducts(8)).slice(0, 8),
  getNewArrivals: async () => (await ApiService.getProducts(8)).slice(0, 8),
  getProductsByCategory: async (category: string) => {
    let categoryId = category;
    const categories = await ApiService.getCategories();
    const match = categories.find((c: any) => c.id === category || c.name === category);
    if (match) categoryId = match.id;
    const data = await http.get<any>(`/api/products?maDanhMuc=${encodeURIComponent(categoryId)}&limit=8`);
    return (data.items || []).map(mapProduct);
  },
  getBestSellers: async (): Promise<Product[]> => (await ApiService.getProducts(8)).slice(0, 8),
  getRelatedProducts: async (currentId: string): Promise<Product[]> => (await ApiService.getProducts(20)).filter(p => p.id !== currentId).slice(0, 4),

  getHotCategories: (): string[] => hotCategories,

  getCategories: async () => {
    if (cache.categories && isFresh(cache.categories.at)) return cache.categories.data;
    const lsData = readLsCache<any[]>('categories');
    if (lsData) {
      cache.categories = { at: now(), data: lsData };
      return lsData;
    }
    if (inflight.categories) return inflight.categories;
    inflight.categories = (async () => {
      const data = await http.get<any[]>('/api/categories');
      const mapped = data.map(x => ({
        id: x.maDanhMuc || x.MaDanhMuc,
        name: x.tenDanhMuc || x.TenDanhMuc,
        parentId: x.maDanhMucCha || x.MaDanhMucCha || null,
        ...x
      }));
      cache.categories = { at: now(), data: mapped };
      writeLsCache('categories', mapped);
      return mapped;
    })();
    try {
      return await inflight.categories;
    } finally {
      inflight.categories = null;
    }
  },

  createCategory: async (categoryData: any) => {
    const res = await http.post('/api/categories', {
      MaDanhMuc: categoryData.MaDanhMuc || categoryData.id || `DM${Date.now()}`,
      TenDanhMuc: categoryData.TenDanhMuc || categoryData.name,
      MaDanhMucCha: categoryData.MaDanhMucCha || categoryData.parentId || null
    });
    cache.categories = null;
    removeLsCache('categories');
    return res;
  },

  updateCategory: async (id: string, categoryData: any) => {
    const res = await http.put(`/api/categories/${id}`, {
      TenDanhMuc: categoryData.TenDanhMuc || categoryData.name,
      MaDanhMucCha: categoryData.MaDanhMucCha || categoryData.parentId || null
    });
    cache.categories = null;
    removeLsCache('categories');
    return res;
  },

  deleteCategory: async (id: string) => {
    await http.delete(`/api/categories/${id}`);
    cache.categories = null;
    removeLsCache('categories');
    return { success: true };
  },

  createProduct: async (productData: any) => {
    const images = asArray<string>(productData.images).map(x => String(x).trim()).filter(Boolean).slice(0, 6);
    const payload = {
      MaSanPham: productData.MaSanPham || productData.id || `SP${Date.now()}`,
      TenSanPham: productData.TenSanPham || productData.name,
      MaDanhMuc: productData.MaDanhMuc || productData.category,
      MaNhaCungCap: productData.MaNhaCungCap || productData.supplier || null,
      GiaBan: toNumberPrice(productData.GiaBan ?? productData.price),
      MoTa: productData.MoTa || productData.description || '',
      ThongTinChiTiet: productData.ThongTinChiTiet ?? productData.detailedInfo ?? '',
      SoLuongTon: Number(productData.SoLuongTon ?? productData.stockQuantity ?? 0),
      IsVisible: Boolean(productData.IsVisible ?? productData.isVisible ?? true),
      IsFeaturedNew: Boolean(productData.IsFeaturedNew ?? productData.isFeaturedNew),
      IsFeaturedBestseller: Boolean(productData.IsFeaturedBestseller ?? productData.isFeaturedBestseller),
      IsGiamGia: Boolean(productData.IsGiamGia ?? productData.isDiscounted),
      SoTienGiam: Number(productData.SoTienGiam ?? productData.discountAmount ?? 0),
      AnhDaiDien: images[0] || null
    };

    const created = await http.post<any>('/api/products', payload);

    const maSanPham = created?.maSanPham || created?.MaSanPham || payload.MaSanPham;
    if (images.length > 0) {
      await http.post(`/api/products/${encodeURIComponent(maSanPham)}/images/bulk`, { URLHinhAnhs: images });
    }

    cache.products.clear();
    removeLsByPrefix('products:');
    return created;
  },

  updateProduct: async (id: string, productData: any) => {
    const nextImages = asArray<string>(productData.images).map(String).map(x => x.trim()).filter(Boolean).slice(0, 6);
    const updated = await http.put(`/api/products/${id}`, {
      TenSanPham: productData.TenSanPham || productData.name,
      MaDanhMuc: productData.MaDanhMuc || productData.category,
      MaNhaCungCap: productData.MaNhaCungCap || productData.supplier || null,
      GiaBan: toNumberPrice(productData.GiaBan ?? productData.price),
      MoTa: productData.MoTa || productData.description || '',
      ThongTinChiTiet: productData.ThongTinChiTiet ?? productData.detailedInfo ?? '',
      SoLuongTon: Number(productData.SoLuongTon ?? productData.stockQuantity ?? 0),
      IsVisible: Boolean(productData.IsVisible ?? productData.isVisible ?? true),
      IsFeaturedNew: Boolean(productData.IsFeaturedNew ?? productData.isFeaturedNew),
      IsFeaturedBestseller: Boolean(productData.IsFeaturedBestseller ?? productData.isFeaturedBestseller),
      IsGiamGia: Boolean(productData.IsGiamGia ?? productData.isDiscounted),
      SoTienGiam: Number(productData.SoTienGiam ?? productData.discountAmount ?? 0),
      AnhDaiDien: nextImages[0] || null
    });

    // Sync images exactly as current form list (including order for primary image).
    const detail = await http.get<any>(`/api/products/${encodeURIComponent(id)}`);
    const current = asArray<any>(detail?.images).map((x: any) => ({
      id: x.maHinhAnh || x.MaHinhAnh,
      url: String(x.urlHinhAnh || x.URLHinhAnh || '').trim()
    })).filter((x: any) => x.url);

    // Always rewrite image rows to preserve selected order (primary image = first).
    for (const img of current) {
      if (img.id != null) {
        await http.delete(`/api/products/${encodeURIComponent(id)}/images/${img.id}`);
      }
    }

    if (nextImages.length > 0) {
      await http.post(`/api/products/${encodeURIComponent(id)}/images/bulk`, { URLHinhAnhs: nextImages });
    }

    cache.products.clear();
    removeLsByPrefix('products:');
    return updated;
  },

  deleteProduct: async (id: string) => {
    await http.delete(`/api/products/${id}`);
    cache.products.clear();
    removeLsByPrefix('products:');
    return { success: true };
  },

  getOrders: async () => {
    if (cache.orders && isFresh(cache.orders.at)) return cache.orders.data;
    const lsData = readLsCache<any[]>('orders');
    if (lsData) {
      cache.orders = { at: now(), data: lsData };
      return lsData;
    }
    if (inflight.orders) return inflight.orders;
    inflight.orders = (async () => {
      const data = await http.get<any[]>('/api/orders');
      const mapped = asArray(data).map((o: any) => {
        const id = o.maDonHang || o.MaDonHang;
        const customerName = o.tenKhachHang || o.TenKhachHang;
        const phone = o.soDienThoai || o.SoDienThoai;
        const address = o.diaChiGiaoHang || o.DiaChiGiaoHang;
        return {
          id,
          userId: o.maNguoiDung || o.MaNguoiDung,
          customerName,
          phone,
          address,
          customerInfo: { fullName: customerName, phone, address },
          total: o.tongTien || o.TongTien,
          paymentMethod: o.phuongThucThanhToan || o.PhuongThucThanhToan,
          status: o.trangThai || o.TrangThai,
          createdAt: o.ngayDatHang || o.NgayDatHang,
          items: []
        };
      });
      cache.orders = { at: now(), data: mapped };
      writeLsCache('orders', mapped);
      return mapped;
    })();
    try {
      return await inflight.orders;
    } finally {
      inflight.orders = null;
    }
  },

  getOrderById: async (orderId: string) => {
    return http.get<any>(`/api/orders/${encodeURIComponent(orderId)}?_=${Date.now()}`);
  },

  createOrder: async (orderData: any) => {
    const customerName = orderData.customerName || orderData.customerInfo?.fullName || '';
    const phone = orderData.phone || orderData.customerInfo?.phone || '';
    const address = orderData.address || orderData.customerInfo?.address || '';
    const payload = {
      NgayDatHang: new Date().toISOString(),
      MaNguoiDung: orderData.userId || null,
      TenKhachHang: customerName,
      SoDienThoai: phone,
      DiaChiGiaoHang: address,
      MaCode: orderData.voucherCode || null,
      PhuongThucThanhToan: orderData.paymentMethod || 'COD',
      TongTien: orderData.total,
      CartItems: (orderData.items || []).map((i: any) => ({
        MaSanPham: i.productId,
        TenSanPham: i.name,
        URLHinhAnh: i.image,
        KichThuoc: i.size,
        SoLuong: i.quantity,
        DonGia: i.price
      }))
    };
    const res = await http.post('/api/orders', payload);
    cache.orders = null;
    removeLsCache('orders');
    return res;
  },

  createVnpayPayment: async (data: { orderId: string; amount: number; orderInfo?: string }) => {
    return http.post<{ paymentUrl: string }>('/api/payments/vnpay/create', {
      OrderId: data.orderId,
      Amount: data.amount,
      OrderInfo: data.orderInfo || `Thanh toan don hang ${data.orderId}`
    });
  },

  updateOrder: async (id: string, orderData: any) => {
    const res = await http.put(`/api/orders/${id}/status`, { TrangThai: orderData.status });
    cache.orders = null;
    removeLsCache('orders');
    return res;
  },

  getDashboardStats: async () => {
    const s = await http.get<any>('/api/stats/dashboard-summary');
    return {
      revenue: s.tongDoanhThu ?? s.TongDoanhThu ?? 0,
      orders: s.tongDonHang ?? s.TongDonHang ?? 0,
      customers: s.khachHangMoi ?? s.KhachHangMoi ?? 0,
      products: s.sanPhamDangBan ?? s.SanPhamDangBan ?? 0,
      revenueGrowth: 0,
      orderGrowth: 0
    };
  },

  getTopProducts: async (limit = 10) => {
    return http.get<any[]>(`/api/stats/top-products?limit=${limit}`);
  },

  getVouchers: async (all = false) => {
    return http.get<any[]>(`/api/vouchers?all=${all}`);
  },

  applyVoucher: async (code: string, tongTienHienTai: number) => {
    return http.post<any>('/api/vouchers/apply', { MaCode: code, TongTienHienTai: tongTienHienTai });
  },

  createVoucher: async (data: any) => {
    return http.post('/api/vouchers', {
      MaKhuyenMai: data.MaKhuyenMai || `KM${Date.now()}`,
      MaCode: data.MaCode,
      LoaiGiamGia: data.LoaiGiamGia,
      GiaTriGiam: data.GiaTriGiam,
      GiamToiDa: data.GiamToiDa ?? null,
      GiaTriDonToiThieu: data.GiaTriDonToiThieu ?? 0,
      SoLuong: data.SoLuong ?? 0,
      NgayBatDau: data.NgayBatDau,
      NgayKetThuc: data.NgayKetThuc,
      TrangThai: data.TrangThai ?? true
    });
  },

  updateVoucher: async (maKhuyenMai: string, data: any) => {
    return http.put(`/api/vouchers/${maKhuyenMai}`, {
      SoLuong: data.SoLuong,
      TrangThai: data.TrangThai
    });
  },

  deleteVoucher: async (maKhuyenMai: string) => {
    await http.delete(`/api/vouchers/${maKhuyenMai}`);
    return { success: true };
  },

  getNotifications: async (maNguoiDung?: string) => {
    const q = maNguoiDung ? `?maNguoiDung=${encodeURIComponent(maNguoiDung)}` : '';
    return http.get<any[]>(`/api/notifications${q}`);
  },

  createNotification: async (data: any) => {
    return http.post('/api/notifications', data);
  },

  markNotificationRead: async (maThongBao: number) => {
    return http.put(`/api/notifications/${maThongBao}/read`, {});
  },

  markAllNotificationsRead: async (maNguoiDung?: string) => {
    const q = maNguoiDung ? `?maNguoiDung=${encodeURIComponent(maNguoiDung)}` : '';
    return http.put(`/api/notifications/read-all${q}`, {});
  },

  deleteOrder: async (_id: string) => ({ success: false }),
  incrementProductSoldCount: async (productId: string, amount: number) => {
    if (!productId || !amount) return;
    await http.post(`/api/products/${encodeURIComponent(productId)}/sold-count`, { Amount: amount });
    cache.products.clear();
    removeLsByPrefix('products:');
  },

  testConnection: async () => {
    await http.get('/api/health/db');
  },

  getProductCrudHistory: async (limit = 100) => {
    return http.get<any[]>(`/api/products/history?limit=${limit}`);
  },

  getOrderCrudHistory: async (limit = 100) => {
    return http.get<any[]>(`/api/orders/history?limit=${limit}`);
  },

  getCart: async () => {
    return http.get<any>('/api/cart');
  },

  addCartItem: async (data: { productId: string; size: string; quantity: number }) => {
    return http.post('/api/cart/items', {
      ProductId: data.productId,
      Size: data.size,
      Quantity: data.quantity
    });
  },

  updateCartItem: async (id: number, quantity: number) => {
    return http.put(`/api/cart/items/${id}`, { Quantity: quantity });
  },

  removeCartItem: async (id: number) => {
    await http.delete(`/api/cart/items/${id}`);
    return { success: true };
  },

  clearCart: async () => {
    await http.delete('/api/cart');
    return { success: true };
  }
};
