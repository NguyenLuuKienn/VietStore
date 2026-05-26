import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import ProductCard from './ProductCard';

interface ProductSliderProps {
  title: string;
  products: Product[];
  isLoading?: boolean;
  onProductClick?: (product: Product) => void;
}

const ProductSlider: React.FC<ProductSliderProps> = ({ title, products, isLoading, onProductClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      let scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      
      const tolerance = 10;
      if (direction === 'left' && scrollLeft <= 0) {
        scrollTo = scrollWidth - clientWidth;
      } else if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - tolerance) {
        scrollTo = 0;
      }
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-5 overflow-hidden px-4 sm:px-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[250px] h-[360px] bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mb-14 group">
        <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight leading-none mb-2">{title}</h2>
            <div className="h-1.5 w-12 bg-primary rounded-full"></div>
          </div>
        </div>
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 mx-4 sm:mx-0">
          <p className="text-gray-500 font-medium">Chưa có sản phẩm nào trong mục này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-14 group">
      <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight leading-none mb-2">{title}</h2>
          <div className="h-1.5 w-12 bg-primary rounded-full"></div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2.5 rounded-full border border-gray-100 bg-white text-dark hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2.5 rounded-full border border-gray-100 bg-white text-dark hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-4 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-[250px] sm:w-[285px] flex-shrink-0 snap-start">
            <ProductCard product={product} onClick={() => onProductClick?.(product)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSlider;
