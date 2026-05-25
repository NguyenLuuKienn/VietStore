import React, { useState, useEffect } from 'react';
import { AccountService } from '../services/accountService';
import ProductCard from '../components/product/ProductCard';
import { Heart, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { toast } from '../lib/toast';

interface WishlistProps {
  navigateToProductDetail: (p: Product) => void;
  navigateToHome: () => void;
}

const Wishlist: React.FC<WishlistProps> = ({ navigateToProductDetail, navigateToHome }) => {
  const [wishlistedProducts, setWishlistedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = () => {
    AccountService.getWishlist().then(products => {
      setWishlistedProducts(products as any);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <main className="flex-1 bg-bg py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-50 p-3 rounded-full text-red-500">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-[28px] font-[900] text-dark m-0">Sản phẩm yêu thích</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 text-center shadow-sm border border-gray-100">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-dark mb-2">Chưa có sản phẩm yêu thích</h3>
            <p className="text-gray-500 mb-6">Bạn chưa lưu bất kỳ sản phẩm nào vào danh sách yêu thích.</p>
            <button 
              onClick={navigateToHome} 
              className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-opacity-90 transition-colors border-none cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigateToProductDetail(product)}
                onWishlistToggle={(added) => {
                  if (!added) fetchWishlist();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
