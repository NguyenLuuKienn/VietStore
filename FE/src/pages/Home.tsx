import React, { useState, useEffect } from 'react';
import BannerCarousel from '../components/home/BannerCarousel';
import ProductSlider from '../components/product/ProductSlider';
import PromoBanner from '../components/home/PromoBanner';
import { ApiService } from '../services/apiService';
import { Banner, Product, PromoBannerData } from '../types';
import { BannerService } from '../services/bannerService';

interface HomeProps {
  navigateToList: () => void;
  navigateToDetail: (p: Product) => void;
}

const Home: React.FC<HomeProps> = ({ navigateToList, navigateToDetail }) => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [kidsProducts, setKidsProducts] = useState<Product[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBannerData[]>([]);
  const [mainBanners, setMainBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BannerService.getBanners(true).then(setMainBanners).catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [allProducts, categories, promoB] = await Promise.all([
        ApiService.getProducts(24, false),
        ApiService.getCategories(),
        BannerService.getPromoBanners(true)
      ]);

      const kidsCategory = categories.find((c: any) => {
        const name = String(c.name || '').toLowerCase();
        return name.includes('tr') && name.includes('em');
      });
      const otherCategory = categories.find((c: any) => String(c.name || '').toLowerCase().includes('kh'));

      const kidsCategoryId = kidsCategory?.id;
      const otherCategoryId = otherCategory?.id;

      const newP = allProducts.filter(p => p.isFeaturedNew).slice(0, 8);
      const bestP = allProducts.filter(p => p.isFeaturedBestseller).slice(0, 8);
      const kidsP = kidsCategoryId ? allProducts.filter(p => p.category === kidsCategoryId).slice(0, 8) : [];
      const otherP = otherCategoryId ? allProducts.filter(p => p.category === otherCategoryId).slice(0, 8) : [];

      setNewArrivals(newP.length > 0 ? newP : allProducts.slice(0, 8));
      setBestSellers(bestP.length > 0 ? bestP : allProducts.slice(0, 8));
      setKidsProducts(kidsP);
      setOtherProducts(otherP);
      setPromoBanners(promoB);
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <main className="flex-1 bg-bg pb-8 lg:pb-12">
      <BannerCarousel banners={mainBanners} />

      <div className="container mx-auto px-4 sm:px-10">
        <ProductSlider 
          title="Sản phẩm mới nhất" 
          products={newArrivals} 
          isLoading={loading} 
          onProductClick={navigateToDetail}
        />

        <ProductSlider 
          title="Sản phẩm bán chạy" 
          products={bestSellers} 
          isLoading={loading} 
          onProductClick={navigateToDetail}
        />

        {promoBanners.length > 0 ? (
          <PromoBanner 
            title={promoBanners[0].title}
            discount={promoBanners[0].discount}
            code={promoBanners[0].code}
            image={promoBanners[0].image}
            bgColor={promoBanners[0].bgColor?.startsWith('bg-') ? promoBanners[0].bgColor : undefined}
            customStyle={!promoBanners[0].bgColor?.startsWith('bg-') ? { backgroundColor: promoBanners[0].bgColor } : undefined}
          />
        ) : (
          <PromoBanner 
            title="Mùa giải mới, diện mạo mới" 
            discount="20%" 
            code="NEWSEASON24"
            image="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80"
            bgColor="bg-indigo-900"
          />
        )}

        <ProductSlider 
          title="Sản phẩm dành cho trẻ em" 
          products={kidsProducts} 
          isLoading={loading} 
          onProductClick={navigateToDetail}
        />

        {promoBanners.length > 1 && (
          <div className="mt-12">
            <PromoBanner 
              title={promoBanners[1].title}
              discount={promoBanners[1].discount}
              code={promoBanners[1].code}
              image={promoBanners[1].image}
              bgColor={promoBanners[1].bgColor?.startsWith('bg-') ? promoBanners[1].bgColor : undefined}
              customStyle={!promoBanners[1].bgColor?.startsWith('bg-') ? { backgroundColor: promoBanners[1].bgColor } : undefined}
            />
          </div>
        )}

        <ProductSlider 
          title="Phụ kiện & Sản phẩm khác" 
          products={otherProducts} 
          isLoading={loading} 
          onProductClick={navigateToDetail}
        />

        <div className="flex justify-center mt-8">
          <button 
            onClick={() => navigateToList()}
            className="px-10 py-4 bg-white text-dark font-black rounded-full border-2 border-dark hover:bg-dark hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
