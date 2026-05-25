import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Heart, ShoppingCart, Loader2 } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { ApiService } from '../services/apiService';
import { CartService } from '../services/cartService';
import { Product } from '../types';
import { toast } from '../lib/toast';
import { AccountService } from '../services/accountService';
import { AuthService } from '../services/authService';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onProductClick: (p: Product) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onBack, onProductClick }) => {
  const [fullProduct, setFullProduct] = useState<Product>(product);
  const [mainImg, setMainImg] = useState(product.images?.[0] || 'https://placehold.co/400x533');
  const [size, setSize] = useState('M');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const stock = Number(fullProduct.stockQuantity ?? 0);
  const inStock = stock > 0;

  useEffect(() => {
    setFullProduct(product);
    setMainImg(product.images?.[0] || 'https://placehold.co/400x533');
    setIsDetailLoading(true);
    window.scrollTo(0, 0);
  }, [product]);

  useEffect(() => {
    let cancelled = false;
    const preloadImages = async (urls: string[]) => {
      await Promise.all(
        urls.map((url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          })
        )
      );
    };

    const loadDetail = async () => {
      try {
        const p = await ApiService.getProductById(product.id);
        if (!p || cancelled) return;
        setFullProduct(p);
        setMainImg(p.images?.[0] || 'https://placehold.co/400x533');
        await preloadImages(p.images || []);
      } finally {
        if (!cancelled) setIsDetailLoading(false);
      }
    };

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  useEffect(() => {
    ApiService.getRelatedProducts(product.id).then(setRelatedProducts);
    const syncWishlist = () => setIsWishlisted(AccountService.isWishlisted(product.id.toString()));
    syncWishlist();
    window.addEventListener('wishlist-changed', syncWishlist);
    return () => window.removeEventListener('wishlist-changed', syncWishlist);
  }, [product.id]);

  const handleAddToCart = async () => {
    if (!AuthService.isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
      return;
    }
    try {
      await CartService.addItem(fullProduct, size, 1);
      toast.success(`Đã thêm ${fullProduct.name} vào giỏ hàng`);
    } catch {
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const handleToggleWishlist = async () => {
    if (!AuthService.isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để thực hiện tính năng này');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
      return;
    }
    try {
      const added = await AccountService.toggleWishlist(fullProduct.id.toString());
      setIsWishlisted(added);
      if (added) toast.success(`Đã thêm ${fullProduct.name} vào yêu thích`);
      else toast.info(`Đã bỏ ${fullProduct.name} khỏi yêu thích`);
    } catch {
      toast.error('Vui lòng đăng nhập để thực hiện tính năng này');
    }
  };

  if (isDetailLoading) {
    return (
      <main className="flex-1 container mx-auto px-4 sm:px-10 py-6 sm:py-8 bg-bg min-h-screen">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-dark hover:text-primary text-[15px] font-semibold bg-transparent border-none cursor-pointer transition-colors w-fit">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
        </div>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 sm:px-10 py-6 sm:py-8 bg-bg min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-dark hover:text-primary text-[15px] font-semibold bg-transparent border-none cursor-pointer transition-colors w-fit">
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>
        <span className="text-sm font-medium text-gray-500 hidden sm:block">Trang chủ / Sản phẩm / {fullProduct.name}</span>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 lg:p-10 flex flex-col md:flex-row gap-8 lg:gap-14 mb-14">
        <div className="w-full md:w-[45%] flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col gap-3 order-2 sm:order-1 overflow-x-auto no-scrollbar sm:overflow-visible pb-2 sm:pb-0">
            {fullProduct.images?.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setMainImg(img)}
                className={`flex-shrink-0 w-16 sm:w-[72px] aspect-square rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer bg-white ${mainImg === img ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
          <div className="flex-1 aspect-square bg-[#f7f7f7] rounded-[16px] overflow-hidden order-1 sm:order-2 border border-gray-100 flex items-center justify-center">
            <img src={mainImg} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="w-full md:w-[55%] flex flex-col py-2">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="bg-primary/10 text-primary text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">{fullProduct.category}</span>
            <span className="bg-red-50 text-red-500 text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Nổi bật</span>
          </div>
          <h1 className="text-[26px] lg:text-[34px] font-[800] text-dark leading-[1.2] mb-3 tracking-tight">{fullProduct.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-amber-400">
              <Star className="w-[18px] h-[18px] fill-current" />
              <Star className="w-[18px] h-[18px] fill-current" />
              <Star className="w-[18px] h-[18px] fill-current" />
              <Star className="w-[18px] h-[18px] fill-current" />
              <Star className="w-[18px] h-[18px] fill-current" />
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span className="text-gray-500 text-[14px] font-medium">Đã bán {fullProduct.soldCount || 0}</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span className={`text-[13px] font-bold px-2 py-1 rounded-md ${inStock ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {inStock ? `Còn hàng: ${stock}` : 'Hết hàng'}
            </span>
          </div>

          <div className="text-[36px] font-[900] text-primary mb-6 border-b border-gray-100 pb-6">{CartService.formatPrice(fullProduct.price)}</div>

          <div className="mb-8">
            <h3 className="font-bold text-dark text-[16px] mb-3">Mô tả sản phẩm</h3>
            <p className="text-gray-600 text-[15px] leading-[1.8]">{fullProduct.description}</p>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-dark text-[16px]">Chọn kích thước:</h3>
              <button className="text-primary text-[14px] font-semibold border-none bg-transparent hover:underline cursor-pointer">Hướng dẫn chọn size</button>
            </div>
            <div className="flex gap-3">
              {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-12 h-12 rounded-[10px] font-bold text-[15px] border-2 transition-all cursor-pointer ${size === s ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-dark'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 h-[56px] focus:outline-none font-bold text-[16px] rounded-[14px] transition-all border-none flex items-center justify-center gap-2 ${inStock ? 'bg-primary text-white hover:bg-opacity-90 hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(100,197,227,0.3)] cursor-pointer' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              <ShoppingCart className="w-5 h-5" /> {inStock ? 'THÊM VÀO GIỎ HÀNG' : 'HẾT HÀNG'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`w-full sm:w-[56px] h-[56px] focus:outline-none rounded-[14px] border-none flex items-center justify-center transition-all cursor-pointer group ${isWishlisted ? 'bg-red-500 text-white shadow-md' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
            >
              <Heart className={`w-6 h-6 transition-transform group-hover:scale-110 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] sm:text-[28px] font-[800] text-dark flex items-center gap-3">
            <span className="w-2.5 h-8 bg-primary rounded-full"></span>
            Sản Phẩm Tương Tự
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {relatedProducts.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
