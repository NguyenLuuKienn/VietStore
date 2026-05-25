import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../../types';
import { BannerService } from '../../services/bannerService';

interface BannerCarouselProps {
  banners?: Banner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners: externalBanners }) => {
  const [banners, setBanners] = useState<Banner[]>(externalBanners || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (externalBanners && externalBanners.length > 0) {
      setBanners(externalBanners);
      return;
    }
    BannerService.getBanners(true).then(setBanners);
  }, [externalBanners]);

  useEffect(() => {
    if (!banners.length || currentIndex !== 0) return;
    const src = banners[0]?.imageUrl;
    if (!src) return;
    const img = new Image();
    img.src = src;
  }, [banners, currentIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      move(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, currentIndex]);

  const move = (dir: number) => {
    setDirection(dir);
    setCurrentIndex((prev) => (prev + dir + banners.length) % banners.length);
  };

  if (banners.length === 0) {
    return (
      <div className="relative h-[250px] sm:h-[400px] lg:h-[500px] w-full overflow-hidden bg-gray-100 mb-8 sm:mb-12">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 sm:px-10">
            <div className="max-w-2xl space-y-4">
              <div className="h-10 sm:h-14 lg:h-20 w-3/4 bg-white/60 rounded-xl" />
              <div className="h-4 sm:h-6 w-2/3 bg-white/60 rounded-lg" />
              <div className="h-4 sm:h-6 w-1/2 bg-white/60 rounded-lg" />
              <div className="h-10 sm:h-12 w-40 bg-white/70 rounded-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const currentBanner = banners[currentIndex];
  const currentImageLoaded = Boolean(loadedImages[currentBanner.imageUrl || '']);

  return (
    <div className="relative h-[250px] sm:h-[400px] lg:h-[500px] w-full overflow-hidden bg-gray-100 mb-8 sm:mb-12">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: currentBanner.bgColor }}
        >
          <div className={`absolute inset-0 transition-opacity duration-500 ${currentImageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />
          </div>
          <div className="absolute inset-0 overflow-hidden">
             <img 
                src={currentBanner.imageUrl} 
                alt={currentBanner.title} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${currentImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                onLoad={() => {
                  const key = currentBanner.imageUrl || '';
                  if (!key) return;
                  setLoadedImages((prev) => ({ ...prev, [key]: true }));
                }}
             />
          </div>
          
          {(currentBanner.title || currentBanner.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="container mx-auto px-4 sm:px-10">
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className="max-w-2xl"
                   style={{ color: currentBanner.textColor || 'white' }}
                >
                  {currentBanner.title && (
                    <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 leading-tight tracking-tight">
                      {currentBanner.title}
                    </h2>
                  )}
                  {currentBanner.subtitle && (
                    <p className="text-sm sm:text-lg lg:text-2xl font-medium opacity-90 max-w-lg mb-8 leading-relaxed">
                      {currentBanner.subtitle}
                    </p>
                  )}
                  <button className="bg-white text-dark px-6 sm:px-10 py-3 sm:py-4 rounded-full font-black text-sm sm:text-base border-none cursor-pointer shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Khám phá ngay
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button 
            onClick={() => move(-1)}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all cursor-pointer hidden sm:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => move(1)}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all cursor-pointer hidden sm:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 border-none cursor-pointer h-1.5 sm:h-2 rounded-full ${
                  idx === currentIndex ? 'bg-white w-8 sm:w-12' : 'bg-white/30 w-1.5 sm:w-2 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
