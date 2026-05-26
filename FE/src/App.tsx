import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRoot from './pages/admin/AdminRoot';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import SizeGuidePage from './pages/SizeGuidePage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import FaqPage from './pages/FaqPage';
import OrderTrackingGuidePage from './pages/OrderTrackingGuidePage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { Product, User } from './types';
import { ApiService } from './services/apiService';
import { AuthService } from './services/authService';

export type ViewState = 'home' | 'list' | 'detail' | 'cart' | 'profile' | 'orders' | 'wishlist' | 'checkout' | 'payment-result' | 'login' | 'register' | 'admin' | 'size-guide' | 'return-policy' | 'faq' | 'order-tracking-guide' | 'terms' | 'privacy';

const toPath = (view: ViewState, opts?: { category?: string | null; productId?: string | null }) => {
  if (view === 'home') return '/';
  if (view === 'list') return opts?.category ? `/products?category=${encodeURIComponent(opts.category)}` : '/products';
  if (view === 'detail') return opts?.productId ? `/product/${encodeURIComponent(opts.productId)}` : '/products';
  if (view === 'cart') return '/cart';
  if (view === 'profile') return '/profile';
  if (view === 'orders') return '/orders';
  if (view === 'wishlist') return '/wishlist';
  if (view === 'checkout') return '/checkout';
  if (view === 'payment-result') return '/payment-result';
  if (view === 'login') return '/login';
  if (view === 'register') return '/register';
  if (view === 'admin') return '/admin';
  if (view === 'size-guide') return '/huong-dan-size';
  if (view === 'return-policy') return '/chinh-sach-doi-tra';
  if (view === 'faq') return '/cau-hoi-thuong-gap';
  if (view === 'order-tracking-guide') return '/tra-cuu-don-hang';
  if (view === 'terms') return '/dieu-khoan-dich-vu';
  if (view === 'privacy') return '/chinh-sach-bao-mat';
  return '/';
};

const fromLocation = () => {
  const url = new URL(window.location.href);
  const path = url.pathname.toLowerCase();
  if (path === '/' || path === '/home') return { view: 'home' as ViewState };
  if (path === '/products') return { view: 'list' as ViewState, category: url.searchParams.get('category') };
  if (path.startsWith('/product/')) return { view: 'detail' as ViewState, productId: decodeURIComponent(path.replace('/product/', '')) };
  if (path === '/cart') return { view: 'cart' as ViewState };
  if (path === '/profile') return { view: 'profile' as ViewState };
  if (path === '/orders') return { view: 'orders' as ViewState };
  if (path === '/wishlist') return { view: 'wishlist' as ViewState };
  if (path === '/checkout') return { view: 'checkout' as ViewState };
  if (path === '/payment-result') return { view: 'payment-result' as ViewState };
  if (path === '/login') return { view: 'login' as ViewState };
  if (path === '/register') return { view: 'register' as ViewState };
  if (path === '/admin') return { view: 'admin' as ViewState };
  if (path === '/huong-dan-size') return { view: 'size-guide' as ViewState };
  if (path === '/chinh-sach-doi-tra') return { view: 'return-policy' as ViewState };
  if (path === '/cau-hoi-thuong-gap') return { view: 'faq' as ViewState };
  if (path === '/tra-cuu-don-hang') return { view: 'order-tracking-guide' as ViewState };
  if (path === '/dieu-khoan-dich-vu') return { view: 'terms' as ViewState };
  if (path === '/chinh-sach-bao-mat') return { view: 'privacy' as ViewState };
  return { view: 'home' as ViewState };
};

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(AuthService.getUser());

  useEffect(() => {
    const boot = async () => {
      const parsed = fromLocation();
      if (parsed.view === 'detail' && parsed.productId) {
        const p = await ApiService.getProductById(parsed.productId);
        if (p) {
          setSelectedProduct(p as any);
          setView('detail');
          return;
        }
      }
      setSelectedCategory((parsed as any).category || null);
      navigateTo(parsed.view, (parsed as any).category || null, true);
    };

    const unsubscribe = AuthService.initAuth((updatedUser) => {
      setUser(updatedUser);
    });

    const handleNavigate = (e: any) => {
      const { detail } = e;
      if (detail) navigateTo(detail);
    };
    const handlePopState = async () => {
      const parsed = fromLocation();
      if (parsed.view === 'detail' && (parsed as any).productId) {
        const p = await ApiService.getProductById((parsed as any).productId);
        if (p) {
          setSelectedProduct(p as any);
          setView('detail');
          return;
        }
      }
      setSelectedCategory((parsed as any).category || null);
      navigateTo(parsed.view, (parsed as any).category || null, true);
    };
    const handleSessionExpired = () => {
      const protectedViews: ViewState[] = ['cart', 'profile', 'orders', 'wishlist', 'checkout', 'payment-result', 'admin'];
      if (protectedViews.includes(view)) {
        navigateTo('login');
      }
    };
    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('session-expired', handleSessionExpired);
    
    boot();

    return () => {
      unsubscribe();
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [view]);

  useEffect(() => {
    if (user) return;
    const protectedViews: ViewState[] = ['cart', 'profile', 'orders', 'wishlist', 'checkout', 'payment-result', 'admin'];
    if (protectedViews.includes(view)) {
      navigateTo('login');
    }
  }, [user, view]);

  const navigateTo = (newView: ViewState, category: string | null = null, replaceState = false) => {
    if (newView === 'admin' && !AuthService.canAccessAdmin()) {
      setView('login');
      if (!replaceState) window.history.pushState({}, '', toPath('login'));
      return;
    }
    if (['cart', 'profile', 'orders', 'wishlist', 'checkout', 'payment-result'].includes(newView) && !AuthService.isAuthenticated()) {
      setView('login');
      if (!replaceState) window.history.pushState({}, '', toPath('login'));
      return;
    }
    setView(newView);
    setSelectedCategory(category);
    if (newView !== 'detail') setSelectedProduct(null);
    const nextPath =
      newView === 'payment-result'
        ? `${toPath(newView, { category })}${window.location.search || ''}`
        : toPath(newView, { category });
    if (window.location.pathname + window.location.search !== nextPath) {
      if (replaceState) window.history.replaceState({}, '', nextPath);
      else window.history.pushState({}, '', nextPath);
    }
    window.scrollTo(0, 0);
  };

  const navigateToDetail = (product: Product) => {
    setView('detail');
    setSelectedProduct(product);
    const nextPath = toPath('detail', { productId: product.id });
    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo(0, 0);
  };
  
  const navigateToDetailById = async (id: string) => {
    const p = await ApiService.getProductById(id);
    if (p) navigateToDetail(p as any);
  };

  if (view === 'login') {
    return <Login navigateToHome={() => navigateTo('home')} navigateToRegister={() => navigateTo('register')} onLoginSuccess={() => navigateTo('home')} />;
  }

  if (view === 'register') {
    return <Register navigateToHome={() => navigateTo('home')} navigateToLogin={() => navigateTo('login')} onRegisterSuccess={() => navigateTo('home')} />;
  }

  if (view === 'admin') {
    return <AdminRoot navigateToHome={() => navigateTo('home')} />;
  }

  return (
    <MainLayout 
      user={user}
      selectedCategory={selectedCategory}
      navigateToHome={() => navigateTo('home')} 
      navigateToList={(cat) => navigateTo('list', typeof cat === 'string' ? cat : null)}
      navigateToCart={() => navigateTo('cart')}
      navigateToProfile={() => navigateTo('profile')}
      navigateToOrders={() => navigateTo('orders')}
      navigateToWishlist={() => navigateTo('wishlist')}
      navigateToLogin={() => navigateTo('login')}
      navigateToAdmin={() => navigateTo('admin')}
      navigateToDetailById={navigateToDetailById}
      navigateToSizeGuide={() => navigateTo('size-guide')}
      navigateToReturnPolicy={() => navigateTo('return-policy')}
      navigateToFaq={() => navigateTo('faq')}
      navigateToOrderTrackingGuide={() => navigateTo('order-tracking-guide')}
      navigateToTerms={() => navigateTo('terms')}
      navigateToPrivacy={() => navigateTo('privacy')}
    >
      {view === 'home' && (
        <Home navigateToList={() => navigateTo('list', null)} navigateToDetail={navigateToDetail} />
      )}
      
      {view === 'list' && (
        <ProductList 
          onBack={() => navigateTo('home')} 
          onProductClick={navigateToDetail} 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )}
      
      {view === 'detail' && selectedProduct && (
        <ProductDetails product={selectedProduct} onBack={() => navigateTo('home')} onProductClick={navigateToDetail} />
      )}

      {view === 'cart' && (
        <Cart 
          onBack={() => navigateTo('home')} 
          navigateToHome={() => navigateTo('home')}
          navigateToCheckout={() => navigateTo('checkout')}
        />
      )}

      {view === 'checkout' && (
        <Checkout onBack={() => navigateTo('cart')} navigateToHome={() => navigateTo('home')} />
      )}

      {view === 'payment-result' && (
        <PaymentResult navigateToHome={() => navigateTo('home')} navigateToOrders={() => navigateTo('orders')} />
      )}

      {view === 'profile' && (
        <Profile />
      )}

      {view === 'orders' && (
        <Orders />
      )}

      {view === 'wishlist' && (
        <Wishlist navigateToProductDetail={(p) => navigateToDetailById(p.id)} navigateToHome={() => navigateTo('home')} />
      )}

      {view === 'size-guide' && <SizeGuidePage />}
      {view === 'return-policy' && <ReturnPolicyPage />}
      {view === 'faq' && <FaqPage />}
      {view === 'order-tracking-guide' && <OrderTrackingGuidePage />}
      {view === 'terms' && <TermsPage />}
      {view === 'privacy' && <PrivacyPolicyPage />}
    </MainLayout>
  );
}
