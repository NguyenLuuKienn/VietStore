import React from 'react';
import { Tag, ArrowRight } from 'lucide-react';

interface PromoBannerProps {
  title: string;
  discount: string;
  code: string;
  image: string;
  bgColor?: string;
  customStyle?: React.CSSProperties;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ title, discount, code, image, bgColor = 'bg-dark', customStyle }) => {
  return (
    <div 
      className={`${bgColor} rounded-[2rem] overflow-hidden mb-14 relative group shadow-lg`}
      style={customStyle}
    >
      <div className="flex flex-col md:flex-row items-center border border-white/10">
        <div className="p-6 md:p-8 flex-1 z-10 text-white">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Tag className="w-3 h-3" /> Khuyến mãi đặc biệt
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-sm opacity-80 font-medium mb-6 max-w-md">
            Nhập mã <span className="text-white font-black bg-white/20 px-2 py-0.5 rounded">{code}</span> giảm {discount}.
          </p>
          <button className="bg-white text-dark px-6 py-2.5 rounded-full font-black text-xs border-none cursor-pointer flex items-center gap-2 hover:gap-3 transition-all shadow-xl active:scale-95">
            Sử dụng ngay <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative w-full md:w-1/3 h-[120px] md:h-[220px] overflow-hidden">
          <img 
            src={image} 
            alt="Promotion" 
            className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark md:from-dark via-dark/40 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
