import React, { useEffect, useState } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../types';
import { CartService } from '../../services/cartService';
import { AccountService } from '../../services/accountService';
import { AuthService } from '../../services/authService';
import { toast } from '../../lib/toast';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onWishlistToggle?: (added: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onWishlistToggle }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const stock = Number(product.stockQuantity ?? 0);
  const inStock = stock > 0;

  useEffect(() => {
    const syncWishlist = () => setIsWishlisted(AccountService.isWishlisted(product.id.toString()));
    syncWishlist();
    window.addEventListener('wishlist-changed', syncWishlist);
    return () => window.removeEventListener('wishlist-changed', syncWishlist);
  }, [product.id]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!AuthService.isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để thực hiện tính năng này');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
      return;
    }
    try {
      const added = await AccountService.toggleWishlist(product.id.toString());
      setIsWishlisted(added);
      if (onWishlistToggle) onWishlistToggle(added);
      if (added) {
        toast.success(`Đã thêm ${product.name} vào yêu thích`);
      } else {
        toast.info(`Đã bỏ ${product.name} khỏi yêu thích`);
      }
    } catch {
      toast.error('Vui lòng đăng nhập để thực hiện tính năng này');
    }
  };

  return (
    <div className="bg-white rounded-[16px] p-[10px] sm:p-[15px] shadow-[0_4px_12px_rgba(100,197,227,0.1)] group flex flex-col h-full border hover:border-primary/30 transition-all hover:shadow-[0_8px_24px_rgba(100,197,227,0.2)] hover:-translate-y-1">
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#f7f7f7] rounded-[12px] mb-3 cursor-pointer p-2" onClick={onClick}>
        <img
          src={product.images?.[0] || 'https://placehold.co/400x400'}
          alt={product.name}
          className="w-full h-full object-contain object-center rounded-[10px] transition-transform duration-300"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-[8px] z-10 shadow-sm">HOT</div>
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all border-none cursor-pointer ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col flex-1 px-1 cursor-pointer" onClick={onClick}>
        <h3 className="font-bold text-dark text-[14px] sm:text-[15px] leading-snug line-clamp-2 h-[42px] mb-1 group-hover:text-primary transition-colors">{product.name}</h3>

        <div className="mb-2">
          <span className={`text-[12px] font-bold px-2 py-1 rounded-md ${inStock ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {inStock ? `Còn hàng: ${stock}` : 'Hết hàng'}
          </span>
        </div>

        <div className="text-primary font-[800] text-[16px] sm:text-[18px] mb-3 mt-auto">{CartService.formatPrice(product.price)}</div>

        <button
          disabled={!inStock}
          className={`w-full py-2.5 rounded-[10px] font-bold transition-all border-none flex items-center justify-center gap-2 group/btn ${inStock ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          onClick={async (e) => {
            e.stopPropagation();
            if (!inStock) return;
            if (!AuthService.isAuthenticated()) {
              toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
              window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
              return;
            }
            try {
              await CartService.addItem(product, 'M', 1);
              toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
            } catch {
              toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
            }
          }}
        >
          <ShoppingCart className="w-[18px] h-[18px] transition-transform group-hover/btn:-rotate-12" />
          <span className="text-[14px]">{inStock ? 'Thêm vào giỏ' : 'Hết hàng'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
