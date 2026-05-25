export interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  images: string[];
  description: string;
  isFeaturedNew?: boolean;
  isFeaturedBestseller?: boolean;
  soldCount?: number;
  stockQuantity?: number;
  supplier?: string;
}

export const hotCategories = [
  'Áo Câu Lạc Bộ',
  'Áo Đội Tuyển',
  'Áo Retro',
  'Phụ Kiện',
  'Giày Bóng Đá',
  'Hàng Mới Về',
  'Khuyến Mãi'
];

export interface CartItem {
  id: number;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'staff' | 'user';
}

export interface Banner {
  id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
  order: number;
  active: boolean;
}

export interface PromoBannerData {
  id?: string;
  title: string;
  discount: string;
  code: string;
  image: string;
  bgColor?: string;
  active: boolean;
}

export enum OrderStatus {
  ChoXacNhan = 'ChoXacNhan',
  DangGiao = 'DangGiao',
  HoanThanh = 'HoanThanh',
  DaHuy = 'DaHuy'
}
