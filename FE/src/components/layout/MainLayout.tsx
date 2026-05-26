import React from 'react';
import { Search, ShoppingCart, Menu, User, ChevronDown, MapPin, Phone, Mail } from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { AuthService } from '../../services/authService';
import { CartService } from '../../services/cartService';
import { User as AuthUser } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: AuthUser | null;
  selectedCategory?: string | null;
  navigateToHome: () => void;
  navigateToList: (category?: string) => void;
  navigateToCart: () => void;
  navigateToProfile: () => void;
  navigateToOrders: () => void;
  navigateToLogin: () => void;
  navigateToAdmin: () => void;
  navigateToWishlist: () => void;
  navigateToDetailById: (id: string) => void;
  navigateToSizeGuide: () => void;
  navigateToReturnPolicy: () => void;
  navigateToFaq: () => void;
  navigateToOrderTrackingGuide: () => void;
  navigateToTerms: () => void;
  navigateToPrivacy: () => void;
}

const MainLayout: React.FC<LayoutProps> = ({
  children,
  user,
  selectedCategory,
  navigateToHome,
  navigateToList,
  navigateToCart,
  navigateToProfile,
  navigateToOrders,
  navigateToLogin,
  navigateToAdmin,
  navigateToWishlist,
  navigateToDetailById,
  navigateToSizeGuide,
  navigateToReturnPolicy,
  navigateToFaq,
  navigateToOrderTrackingGuide,
  navigateToTerms,
  navigateToPrivacy
}) => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [cartCount, setCartCount] = React.useState(CartService.getCartCount());
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(user || AuthService.getUser());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchPool, setSearchPool] = React.useState<any[]>([]);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    Promise.all([ApiService.getCategories(), ApiService.getProducts(30)]).then(([cats, products]) => {
      setCategories(cats);
      setSearchPool(products);
    });

    const updateCount = () => setCartCount(CartService.getCartCount());
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };

    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('auth-changed', updateCount);
    window.addEventListener('storage', updateCount as EventListener);
    window.addEventListener('focus', updateCount);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('auth-changed', updateCount);
      window.removeEventListener('storage', updateCount as EventListener);
      window.removeEventListener('focus', updateCount);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    setCurrentUser(user || AuthService.getUser());
  }, [user]);

  React.useEffect(() => {
    const syncUser = () => setCurrentUser(AuthService.getUser());
    window.addEventListener('auth-changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  React.useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const t = window.setTimeout(() => {
      const filtered = searchPool.filter((p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
      setSearchResults(filtered.slice(0, 5));
      setIsSearchOpen(true);
    }, 200);
    return () => window.clearTimeout(t);
  }, [searchQuery, searchPool]);

  const handleLogout = () => {
    AuthService.logout();
    navigateToHome();
  };

  const normalizedCategories = React.useMemo(() => {
    return categories.map((c: any) => {
      const rawParentId = c.parentId || c.ParentId || c.maDanhMucCha || c.MaDanhMucCha || null;
      const name = String(c.name || '').trim();
      let parentName: string | null = null;
      let childName = name;
      if (!rawParentId && name.includes('>')) {
        const parts = name.split('>').map((x) => x.trim()).filter(Boolean);
        if (parts.length >= 2) {
          parentName = parts[0];
          childName = parts.slice(1).join(' > ');
        }
      }
      return {
        ...c,
        parentId: rawParentId ? String(rawParentId) : null,
        parentName,
        displayName: childName
      };
    });
  }, [categories]);

  const groupedCategories = React.useMemo(() => {
    const byId = new Map(normalizedCategories.map((c: any) => [c.id, c]));
    const roots: any[] = [];
    const rootMap = new Map<string, any>();

    normalizedCategories.forEach((cat: any) => {
      const parentById = cat.parentId ? byId.get(cat.parentId) : null;
      const rootKey = parentById?.id || cat.parentName || cat.id;
      const rootName = parentById?.name || cat.parentName || cat.name;

      if (!rootMap.has(rootKey)) {
        rootMap.set(rootKey, { id: rootKey, name: rootName, original: parentById || cat, children: [] as any[] });
      }

      if (parentById) {
        rootMap.get(rootKey).children.push(cat);
      } else if (cat.parentName) {
        rootMap.get(rootKey).children.push(cat);
      } else {
        roots.push(rootMap.get(rootKey));
      }
    });

    const seen = new Set<string>();
    const merged = [...roots, ...Array.from(rootMap.values())].filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
    return merged;
  }, [normalizedCategories]);

  const hotCategoriesFromDb = React.useMemo(() => {
    const flat: string[] = [];
    groupedCategories.forEach((g) => {
      if (g.children?.length > 0) {
        g.children.forEach((c: any) => flat.push(c.name));
      } else {
        flat.push(g.name);
      }
    });
    return flat.slice(0, 7);
  }, [groupedCategories]);

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">
      <header className="bg-secondary relative z-[60]">
        <div className="container mx-auto px-4 sm:px-10 py-4 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={navigateToHome}>
            <img src="/logo.png" alt="VietStore" className="w-11 h-11 object-contain" />
            <span className="text-[26px] font-[900] text-primary hidden lg:block tracking-[-1px]">VietStore</span>
          </div>

          <div className="flex-1 max-w-2xl px-2">
            <div className="relative w-full flex" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                }}
                placeholder="Tìm áo đấu, CLB, đội tuyển..."
                className="w-full pl-5 pr-12 py-[11px] rounded-[30px] border-2 border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/10 transition-all text-[15px] font-medium"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full bg-transparent border-none cursor-pointer transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <ul className="list-none m-0 p-2">
                      {searchResults.map((product) => (
                        (() => {
                          const basePrice = Number(product.price || 0);
                          const discountAmount = Number(product.discountAmount || 0);
                          const hasDiscount = Boolean(product.isDiscounted) && discountAmount > 0;
                          const finalPrice = Math.max(0, basePrice - discountAmount);
                          return (
                        <li key={product.id}>
                          <button
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              navigateToDetailById(product.id);
                            }}
                            className="w-full text-left flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-dark truncate leading-tight mb-1">{product.name}</p>
                              {hasDiscount && (
                                <p className="text-[11px] text-gray-400 line-through m-0">{CartService.formatPrice(basePrice)}</p>
                              )}
                              <p className="text-primary text-sm font-bold m-0">{CartService.formatPrice(finalPrice)}</p>
                            </div>
                          </button>
                        </li>
                          );
                        })()
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm font-medium text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-3 sm:gap-6">
            <button
              onClick={navigateToCart}
              className="relative text-dark hover:text-primary transition-colors cursor-pointer flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-50 border-none bg-transparent"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0 bg-red-500 text-white text-[11px] font-bold px-[5px] min-w-[18px] py-[2px] rounded-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative group flex items-center h-full">
              <div
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-[30px] border border-gray-100 group-hover:border-primary/50 group-hover:shadow-sm cursor-pointer transition-all bg-white z-10"
                onClick={navigateToProfile}
              >
                <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center overflow-hidden">
                  <User className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[14px] font-bold text-dark hidden sm:block">{currentUser?.fullName || 'Tài khoản'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block transition-transform group-hover:rotate-180" />
              </div>

              <div className="absolute right-0 top-full pt-2 w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white border border-gray-100 rounded-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="font-semibold text-dark text-sm">Xin chào, {currentUser.fullName}!</p>
                      </div>
                      <ul className="py-2 flex flex-col m-0 p-0 list-none">
                        <li onClick={navigateToProfile} className="px-4 py-2.5 hover:bg-primary/5 hover:text-primary cursor-pointer text-sm font-semibold transition-colors text-gray-600 block">Quản lý hồ sơ</li>
                        <li onClick={navigateToOrders} className="px-4 py-2.5 hover:bg-primary/5 hover:text-primary cursor-pointer text-sm font-semibold transition-colors text-gray-600 block">Đơn hàng của tôi</li>
                        <li onClick={navigateToWishlist} className="px-4 py-2.5 hover:bg-primary/5 hover:text-primary cursor-pointer text-sm font-semibold transition-colors text-gray-600 block">Sản phẩm yêu thích</li>
                        <div className="h-px bg-gray-100 my-1 mx-4"></div>
                        {AuthService.canAccessAdmin() && (
                          <>
                            <li onClick={navigateToAdmin} className="px-4 py-2.5 hover:bg-primary/5 hover:text-primary cursor-pointer text-sm font-semibold transition-colors text-gray-600 block flex items-center justify-between">
                              Trang Quản trị{' '}
                              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">{AuthService.isAdmin() ? 'Admin' : 'Staff'}</span>
                            </li>
                            <div className="h-px bg-gray-100 my-1 mx-4"></div>
                          </>
                        )}
                        <li onClick={handleLogout} className="px-4 py-2.5 hover:bg-red-50 text-red-500 cursor-pointer text-sm font-semibold transition-colors block">Đăng xuất</li>
                      </ul>
                    </>
                  ) : (
                    <div className="p-4 flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-500 mb-3 text-center text-balance">Đăng nhập để xem thông tin và mua hàng</p>
                      <button onClick={navigateToLogin} className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-colors border-none cursor-pointer mb-2">Đăng nhập</button>
                      <button onClick={navigateToLogin} className="w-full bg-gray-50 text-dark py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors border border-gray-100 cursor-pointer">Đăng ký ngay</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b-2 border-primary sticky top-0 z-[50] shadow-sm">
        <div className="container mx-auto px-4 sm:px-10 h-[56px] flex items-center gap-8">
          <div className="relative group h-full flex items-center">
            <button className="h-full flex items-center gap-2 text-[14px] font-bold text-white bg-primary px-6 hover:bg-opacity-95 transition-colors cursor-pointer border-none flex-shrink-0 z-10 w-full sm:w-auto justify-center">
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline">TẤT CẢ DANH MỤC</span>
              <span className="sm:hidden">DANH MỤC</span>
              <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
            </button>

            <div className="absolute top-full left-0 w-[260px] pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 rounded-b-[12px] overflow-visible py-2">
                {groupedCategories.map((group, idx) => (
                  <div key={group.id || idx} className="relative group/item border-b last:border-0 border-gray-50">
                    <div
                      className={`flex items-center justify-between px-5 py-3 text-[14px] font-semibold transition-colors select-none ${selectedCategory === group.name ? 'text-primary bg-primary/5' : 'text-gray-700 hover:text-primary hover:bg-primary/5'} ${group.children?.length > 0 ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!group.children?.length) {
                          navigateToList(group.original?.name || group.name);
                        }
                      }}
                    >
                      <span>{group.name}</span>
                      {group.children?.length > 0 && <ChevronDown className="w-4 h-4 -rotate-90" />}
                    </div>

                    {group.children?.length > 0 && (
                      <div className="absolute top-0 left-full min-w-[240px] bg-white border border-gray-100 rounded-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all z-[60] py-2">
                        {group.children.map((child: any) => (
                          <a
                            key={child.id}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToList(child.name);
                            }}
                            className={`block px-4 py-2.5 text-[14px] font-semibold transition-colors ${selectedCategory === child.name ? 'text-primary bg-primary/5' : 'text-gray-700 hover:text-primary hover:bg-primary/5'}`}
                          >
                            {child.displayName || child.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {groupedCategories.length === 0 && <div className="px-5 py-3 text-[14px] text-gray-400 italic">Đang tải danh mục...</div>}
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex flex-1 items-center gap-7 overflow-hidden h-full">
            {hotCategoriesFromDb.map((cat) => (
              <a
                key={cat}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToList(cat);
                }}
                className={`text-[14px] font-[700] whitespace-nowrap transition-colors flex items-center h-full border-b-[3px] mt-[3px] ${selectedCategory === cat ? 'text-primary border-primary' : 'text-dark border-transparent hover:text-primary hover:border-primary/30'}`}
              >
                {cat}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {children}

      <footer className="bg-dark text-white pt-10 pb-8 mt-auto px-4 sm:px-10 border-none shrink-0">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={navigateToHome}>
                <img src="/logo.png" alt="VietStore" className="w-9 h-9 object-contain" />
                <span className="text-[24px] font-[900] tracking-[-1px] text-primary">VietStore</span>
              </div>
              <p className="text-white/80 text-[14px] leading-relaxed mb-6 font-medium">
                VietStore tự hào mang đến những bộ áo đấu chất lượng nhất từ các giải bóng đá thế giới. Hãy cháy hết mình cùng đam mê sân cỏ.
              </p>
            </div>

            <div>
              <h3 className="font-[800] text-primary mb-5 uppercase tracking-wide text-[14px]">Liên hệ</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-[14px] text-white/90 font-medium"><MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><span>Chỗ này ngõ nọ</span></li>
                <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium"><Phone className="w-5 h-5 text-primary flex-shrink-0" /><span>0123 456 789</span></li>
                <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium"><Mail className="w-5 h-5 text-primary flex-shrink-0" /><span>support@vietstore.vn</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-[800] text-primary mb-5 uppercase tracking-wide text-[14px]">Hỗ trợ</h3>
              <ul className="space-y-3 text-[14px] font-medium text-white/90">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToSizeGuide(); }} className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span> Hướng dẫn kiểm tra size</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToReturnPolicy(); }} className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span> Chính sách đổi trả</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToFaq(); }} className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span> Câu hỏi thường gặp</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigateToOrderTrackingGuide(); }} className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span> Tra cứu đơn hàng</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-[800] text-primary mb-5 uppercase tracking-wide text-[14px]">Nhận Khuyến Mãi</h3>
              <p className="text-[14px] text-white/90 mb-4 font-medium">Đăng ký để nhận voucher giảm 20% cho đơn hàng đầu tiên của bạn.</p>
              <div className="flex">
                <input type="email" placeholder="Email của bạn..." className="w-full px-4 py-3 border-none rounded-l-[10px] focus:outline-none text-[14px] bg-white/10 text-white placeholder-white/50 font-medium" />
                <button className="bg-primary text-white px-5 py-3 rounded-r-[10px] font-bold text-[14px] hover:bg-opacity-90 transition-colors whitespace-nowrap border-none cursor-pointer">Đăng ký</button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 pb-2 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-white/60 font-medium">
            <p>&copy; {new Date().getFullYear()} VietStore. Sản phẩm đồ án tốt nghiệp.</p>
            <div className="flex gap-6">
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToTerms(); }} className="hover:text-primary transition-colors">Điều khoản dịch vụ</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateToPrivacy(); }} className="hover:text-primary transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
