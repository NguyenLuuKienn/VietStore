import React, { useState, useEffect } from 'react';
import { Filter, ChevronRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { ApiService } from '../services/apiService';
import { Product } from '../types';

interface ProductListProps {
  onBack: () => void;
  onProductClick: (p: Product) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  onBack, 
  onProductClick, 
  selectedCategory, 
  setSelectedCategory 
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    ApiService.getCategories().then(setCategories);
    ApiService.getProducts().then(products => {
      setAllProducts(products);
      setIsLoading(false);
    });
  }, []);

  const handleApplyPrice = () => {
    setAppliedMinPrice(minPrice ? parseInt(minPrice) : null);
    setAppliedMaxPrice(maxPrice ? parseInt(maxPrice) : null);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setSelectedSizes([]);
  };

  const filteredProducts = allProducts.filter(p => {
    const price = typeof p.price === 'string' ? parseInt(p.price.replace(/\D/g, '')) : p.price;
    const selectedCategoryId = selectedCategory
      ? (categories.find((c: any) => c.id === selectedCategory || c.name === selectedCategory)?.id || selectedCategory)
      : null;
    const matchesCategory = !selectedCategoryId || p.category === selectedCategoryId;
    const matchesMinPrice = appliedMinPrice === null || price >= appliedMinPrice;
    const matchesMaxPrice = appliedMaxPrice === null || price <= appliedMaxPrice;
    
    const itemSizes = (p as any).sizes || ['S', 'M', 'L', 'XL', 'XXL'];
    const matchesSize = selectedSizes.length === 0 || itemSizes.some((s: string) => selectedSizes.includes(s));
    
    return matchesCategory && matchesMinPrice && matchesMaxPrice && matchesSize;
  }).sort((a, b) => {
    const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/\D/g, '')) : a.price;
    const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/\D/g, '')) : b.price;
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    return 0;
  });

  return (
    <main className="flex-1 bg-bg py-8">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
          <button onClick={onBack} className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0 font-medium text-gray-500">Trang chủ</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-dark font-bold">{selectedCategory || 'Tất cả sản phẩm'}</span>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-[260px] flex-shrink-0">
            <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100/50 sticky top-[140px]">
              <div className="flex items-center justify-between gap-2 mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-[18px] font-bold text-dark flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary"/> Bộ lọc
                </h3>
                <span 
                  onClick={handleResetFilters}
                  className="text-sm text-primary font-semibold hover:underline cursor-pointer"
                >
                  Xóa lọc
                </span>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold text-dark mb-4 text-[15px]">Danh mục</h4>
                <div className="flex flex-col gap-3">
                  {categories.map((cat, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={selectedCategory === cat.id || selectedCategory === cat.name}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategory === cat.id || selectedCategory === cat.name ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                        {(selectedCategory === cat.id || selectedCategory === cat.name) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className={`text-[15px] transition-colors ${selectedCategory === cat.id || selectedCategory === cat.name ? 'text-primary font-bold' : 'text-gray-600 group-hover:text-primary'}`}>
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6 border-t border-gray-100 pt-6">
                <h4 className="font-bold text-dark mb-4 text-[15px]">Khoảng giá</h4>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Tối thiểu" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Tối đa" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
                <button 
                  onClick={handleApplyPrice}
                  className="w-full mt-3 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-colors border-none cursor-pointer text-sm"
                >
                  Áp dụng
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-bold text-dark mb-4 text-[15px]">Kích thước</h4>
                <div className="flex flex-wrap gap-2">
                   {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                     <button 
                       key={s} 
                       onClick={() => toggleSize(s)}
                       className={`w-10 h-10 border rounded-lg flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${selectedSizes.includes(s) ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white'}`}
                     >
                       {s}
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </aside>
          
          <div className="flex-1">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 bg-white p-4 rounded-[16px] shadow-sm border border-gray-100/50">
               <h1 className="text-[20px] font-[800] text-dark">{selectedCategory || 'Tất Cả Sản Phẩm'} <span className="text-gray-400 text-[15px] font-medium ml-2">({filteredProducts.length} kết quả)</span></h1>
               
               <div className="flex items-center gap-3">
                 <span className="text-sm font-semibold text-gray-500">Sắp xếp:</span>
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="bg-gray-50 border border-gray-200 text-dark text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none font-medium cursor-pointer"
                 >
                   <option value="newest">Mới nhất</option>
                   <option value="price-asc">Giá tăng dần</option>
                   <option value="price-desc">Giá giảm dần</option>
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-6">
               {isLoading ? (
                 <div className="col-span-full py-20 flex justify-center">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                 </div>
               ) : filteredProducts.map(product => (
                 <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
               ))}
            </div>
             
             <div className="mt-12 flex justify-center">
               <button className="px-8 py-3 bg-white border-2 border-primary text-primary font-bold rounded-[12px] hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm">
                 Tải thêm sản phẩm
               </button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductList;
