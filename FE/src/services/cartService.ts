import { CartItem } from '../types';
import { AuthService } from './authService';
import { ApiService } from './apiService';

let currentCart: CartItem[] = [];
let currentUserId: string | null = null;
let isLoading = false;
let tempCartItemId = -1;
let syncTimer: number | null = null;

const notifyCartChange = () => {
  window.dispatchEvent(new Event('cart-updated'));
};

const getUserId = () => AuthService.getUser()?.id || null;

const mapCartItems = (items: any[]): CartItem[] =>
  (items || []).map((x: any) => ({
    id: Number(x.id ?? x.maChiTietGioHang ?? 0),
    productId: String(x.productId ?? x.maSanPham ?? ''),
    name: String(x.name ?? x.tenSanPham ?? ''),
    price: Number(x.price ?? x.giaBan ?? 0),
    image: String(x.image ?? x.urlHinhAnh ?? ''),
    quantity: Number(x.quantity ?? x.soLuong ?? 0),
    size: String(x.size ?? x.kichThuoc ?? 'M')
  }));

const reloadFromApi = async () => {
  const userId = getUserId();
  currentUserId = userId;
  if (!userId) {
    currentCart = [];
    notifyCartChange();
    return;
  }
  if (isLoading) return;
  isLoading = true;
  try {
    const rs = await ApiService.getCart();
    currentCart = mapCartItems(rs?.items || []);
  } catch {
    currentCart = [];
  } finally {
    isLoading = false;
    notifyCartChange();
  }
};

const scheduleSyncFromApi = (delayMs = 300) => {
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    void reloadFromApi();
  }, delayMs);
};

const ensureActiveUserCart = async () => {
  const userId = getUserId();
  if (userId !== currentUserId) {
    await reloadFromApi();
  }
};

window.addEventListener('auth-changed', () => {
  reloadFromApi();
});

void reloadFromApi();

export const CartService = {
  getCartItems: (): CartItem[] => {
    return currentCart;
  },

  getCartTotal: (): number => {
    return currentCart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: (): number => {
    return currentCart.reduce((count, item) => count + item.quantity, 0);
  },

  clearCart: async (): Promise<void> => {
    await ensureActiveUserCart();
    await ApiService.clearCart();
    currentCart = [];
    notifyCartChange();
  },

  formatPrice: (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price.toString().replace(/\D/g, '')) : price;
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  },

  addItem: async (product: any, size: string, quantity: number = 1): Promise<void> => {
    await ensureActiveUserCart();
    const normalizedSize = size || 'M';
    const productId = String(product.id);
    const existingIndex = currentCart.findIndex(i => i.productId === productId && i.size === normalizedSize);
    if (existingIndex !== -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      const rawPrice = Number(product.price || 0);
      const discount = Number(product.discountAmount || 0);
      const hasDiscount = Boolean(product.isDiscounted) && discount > 0;
      const finalPrice = hasDiscount ? Math.max(0, rawPrice - discount) : rawPrice;
      currentCart.push({
        id: tempCartItemId--,
        productId,
        name: String(product.name || ''),
        price: Number.isFinite(finalPrice) ? finalPrice : 0,
        image: Array.isArray(product.images) ? (product.images[0] || '') : String(product.images || ''),
        quantity,
        size: normalizedSize
      });
    }
    notifyCartChange();

    ApiService.addCartItem({
      productId,
      size: normalizedSize,
      quantity
    })
      .then(() => scheduleSyncFromApi(120))
      .catch(() => scheduleSyncFromApi(120));
  },

  removeItem: async (id: number): Promise<void> => {
    await ensureActiveUserCart();
    const old = [...currentCart];
    currentCart = currentCart.filter(i => i.id !== id);
    notifyCartChange();
    if (id > 0) {
      ApiService.removeCartItem(id).catch(() => {
        currentCart = old;
        notifyCartChange();
        scheduleSyncFromApi(120);
      });
    }
  },

  updateQuantity: async (id: number, quantity: number): Promise<void> => {
    await ensureActiveUserCart();
    const index = currentCart.findIndex(i => i.id === id);
    if (index !== -1) {
      const oldQty = currentCart[index].quantity;
      currentCart[index].quantity = quantity;
      notifyCartChange();
      if (id > 0) {
        ApiService.updateCartItem(id, quantity).catch(() => {
          currentCart[index].quantity = oldQty;
          notifyCartChange();
          scheduleSyncFromApi(120);
        });
      } else {
        scheduleSyncFromApi(120);
      }
      return;
    }
    scheduleSyncFromApi(120);
  }
};
