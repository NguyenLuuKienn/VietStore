const db_products = [
  { 
    id: "1",
    name: "Áo Real Madrid 23/24 Bản Player", 
    category: "Áo Câu Lạc Club Châu Âu", 
    price: 350000, 
    description: "Áo đấu sân nhà chất liệu cao cấp, công nghệ thấm hút mồ hôi tối ưu.", 
    images: [
      "https://images.unsplash.com/photo-1640693051010-09252c78d6b8?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1640693050017-f58c7e6c4644?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    soldCount: 156,
    isFeaturedNew: true
  },
  { 
    id: "2",
    name: "Áo đấu Argentina Sân Nhà 24/25 - 3 Sao", 
    category: "Áo Đội Tuyển Quốc Gia", 
    price: 380000, 
    description: "Mẫu áo của đội tuyển ĐKVĐ Thế giới với 3 sao vàng trên ngực.", 
    images: [
      "https://images.unsplash.com/photo-1671311576479-21411c2ddfb2?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1671311576479-21411c2ddfb2?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    soldCount: 890,
    isFeaturedBestseller: true
  },
  { 
    id: "3",
    name: "Giày Adidas F50 Elite FG", 
    category: "Giày Bóng Đá Đinh TF", 
    price: 1250000, 
    description: "Dòng giày tốc độ huyền thoại tái xuất với công nghệ hiện đại nhất.", 
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['39', '40', '41', '42', '43'],
    soldCount: 45,
    isFeaturedNew: true
  },
  { 
    id: "4",
    name: "Bóng Động Lực FIFA Quality Pro", 
    category: "Phụ Kiện Thể Thao", 
    price: 450000, 
    description: "Bóng thi đấu tiêu chuẩn FIFA, độ nảy và độ bền cực cao.", 
    images: [
      "https://images.unsplash.com/photo-1614632537190-23e414d40399?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['Size 5'],
    soldCount: 320,
    isFeaturedBestseller: true
  },
  { 
    id: "5",
    name: "Áo Khoác Training Manchester United", 
    category: "Áo Training - Luyện Tập", 
    price: 550000, 
    description: "Áo khoác gió cao cấp, phù hợp cho việc luyện tập và đi chơi.", 
    images: [
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    soldCount: 78
  },
  { 
    id: "6",
    name: "Túi Đựng Đồ Thể Thao Nike Air", 
    category: "Phụ Kiện Thể Thao", 
    price: 290000, 
    description: "Túi đựng giày và đồ tập tiện lợi, chống thấm nước tốt.", 
    images: [
      "https://plus.unsplash.com/premium_photo-1663100650997-28d821217088?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['Free Size'],
    soldCount: 215
  },
  { 
    id: "7",
    name: "Bộ Quần Áo Đấu Trẻ Em Arsenal 23/24", 
    category: "Trẻ em", 
    price: 250000, 
    description: "Trang phục thi đấu trẻ em thoáng mát, an toàn cho làn da nhạy cảm.", 
    images: [
      "https://images.unsplash.com/photo-1515233261775-68427f7f5022?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['110', '120', '130', '140'],
    soldCount: 412
  },
  { 
    id: "8",
    name: "Giày Đá Bóng Trẻ Em X Speedportal", 
    category: "Trẻ em", 
    price: 450000, 
    description: "Giày thiết kế đặc biệt nâng niu bàn chân trẻ em.", 
    images: [
      "https://images.unsplash.com/photo-1515152592750-cf00257e1bb9?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['35', '36', '37', '38'],
    soldCount: 153
  },
  { 
    id: "9",
    name: "Găng Tay Thủ Môn Predator Pro", 
    category: "Khác", 
    price: 520000, 
    description: "Găng tay cao cấp độ dính cực tốt, đai mút bảo vệ xương ngón tay.", 
    images: [
      "https://images.unsplash.com/photo-1616422285623-14ddfb76d9bf?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['Size 8', 'Size 9', 'Size 10'],
    soldCount: 312
  },
  { 
    id: "10",
    name: "Băng Đội Trưởng Cao Cấp", 
    category: "Khác", 
    price: 50000, 
    description: "Băng dán co giãn dùng làm đội trưởng trên sân.", 
    images: [
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=600&auto=format&fit=crop"
    ],
    sizes: ['Free Size'],
    soldCount: 541
  }
];

const db_categories = [
  { id: "c1", name: "Áo Câu Lạc Club Châu Âu" },
  { id: "c2", name: "Áo Câu Lạc Club Châu Mỹ" },
  { id: "c3", name: "Áo Đội Tuyển Quốc Gia" },
  { id: "c4", name: "Áo Bóng Đá Retro" },
  { id: "c5", name: "Áo Training - Luyện Tập" },
  { id: "c6", name: "Giày Bóng Đá Đinh TF" },
  { id: "c7", name: "Phụ Kiện Thể Thao" },
  { id: "c8", name: "Trẻ em" },
  { id: "c9", name: "Khác" }
];

const db_banners = [
  {
    id: "b1",
    imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&h=500&fit=crop',
    title: 'Ưu Đãi Hè Rực Rỡ',
    subtitle: 'Giảm giá lên đến 50% cho toàn bộ áo đấu mùa cũ. Mua ngay để sở hữu trang phục chất lượng!',
    bgColor: '#0f172a',
    textColor: '#ffffff',
    order: 1,
    active: true
  },
  {
    id: "b2",
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&h=500&fit=crop',
    title: 'Bộ Sưu Tập Đội Tuyển 2024',
    subtitle: 'Những mẫu áo đấu mới nhất của các đội tuyển quốc gia đã sẵn kệ. Thiết kế hiện đại, chất liệu thoáng khí.',
    bgColor: '#4f46e5',
    textColor: '#ffffff',
    order: 2,
    active: true
  }
];

export const seedDatabase = async () => {
    // Force refresh seed data for this update to fix broken images
    localStorage.setItem('shop_products', JSON.stringify(db_products));
    localStorage.setItem('shop_categories', JSON.stringify(db_categories));
    localStorage.setItem('shop_banners', JSON.stringify(db_banners));
    
    console.log('Local database re-seeded with fixed images');
};
