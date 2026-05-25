import { CartItem } from '../types';
import { AuthService } from './authService';

let currentCart: CartItem[] = [];
let currentUserId: string | null = null;

const notifyCartChange = () => {
  window.dispatchEvent(new Event('cart-updated'));
};

const getUserId = () => AuthService.getUser()?.id;

const loadCartFromStorage = () => {
    const userId = getUserId();
    currentUserId = userId || null;
    if (userId) {
        const carts = JSON.parse(localStorage.getItem('shop_carts') || '{}');
        currentCart = carts[userId] || [];
    } else {
        currentCart = [];
    }
    notifyCartChange();
};

const ensureActiveUserCart = () => {
  const userId = getUserId() || null;
  if (userId !== currentUserId) {
    loadCartFromStorage();
  }
};

const saveCartToStorage = () => {
    const userId = getUserId();
    if (userId) {
        const carts = JSON.parse(localStorage.getItem('shop_carts') || '{}');
        carts[userId] = currentCart;
        localStorage.setItem('shop_carts', JSON.stringify(carts));
    }
    notifyCartChange();
};

// Listen for auth changes to reload cart
window.addEventListener('storage', (e) => {
    if (e.key === 'user') loadCartFromStorage();
});
window.addEventListener('auth-changed', loadCartFromStorage);

// Initial load
loadCartFromStorage();

export const CartService = {
  getCartItems: (): CartItem[] => {
    ensureActiveUserCart();
    return currentCart;
  },
  
  getCartTotal: (): number => {
    ensureActiveUserCart();
    return currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getCartCount: (): number => {
    ensureActiveUserCart();
    return currentCart.reduce((count, item) => count + item.quantity, 0);
  },

  clearCart: async (): Promise<void> => {
    ensureActiveUserCart();
    currentCart = [];
    saveCartToStorage();
  },
  
  formatPrice: (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price.toString().replace(/\D/g, '')) : price;
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  },

  addItem: async (product: any, size: string, quantity: number = 1): Promise<void> => {
    ensureActiveUserCart();
    const existingIndex = currentCart.findIndex(i => i.productId === product.id && i.size === size);
    
    if (existingIndex !== -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: parseInt(product.price.toString().replace(/\D/g, '')),
        image: typeof product.images === 'string' ? product.images : (product.images?.[0] || ''),
        quantity,
        size
      };
      currentCart.push(newItem);
    }
    saveCartToStorage();
  },

  removeItem: async (id: number): Promise<void> => {
    ensureActiveUserCart();
    currentCart = currentCart.filter(i => i.id !== id);
    saveCartToStorage();
  },

  updateQuantity: async (id: number, quantity: number): Promise<void> => {
    ensureActiveUserCart();
    const index = currentCart.findIndex(i => i.id === id);
    if (index !== -1) {
      currentCart[index].quantity = quantity;
      saveCartToStorage();
    }
  }
};
