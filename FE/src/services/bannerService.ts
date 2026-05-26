import { Banner, PromoBannerData } from '../types';
import { http } from './httpClient';

const mapBanner = (b: any): Banner => ({
  id: b.maBanner || b.MaBanner,
  imageUrl: b.urlHinhAnh || b.URLHinhAnh,
  linkUrl: b.duongDan || b.DuongDan || '/',
  title: b.tieuDe || b.TieuDe,
  subtitle: b.phuDe || b.PhuDe,
  order: b.thuTu || b.ThuTu || 1,
  active: true
});

const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

export const BannerService = {
  getBanners: async (_onlyActive = true) => {
    const banners = await http.get<any[]>('/api/banners?type=Main');
    return banners.map(mapBanner).sort((a, b) => a.order - b.order);
  },

  addBanner: async (banner: Omit<Banner, 'id'>) => {
    const id = `BN${Date.now()}`;
    await http.post('/api/banners', {
      MaBanner: id,
      TieuDe: banner.title || 'Banner',
      PhuDe: banner.subtitle || '',
      MucGiam: null,
      MaCode: null,
      URLHinhAnh: banner.imageUrl,
      DuongDan: banner.linkUrl || '/',
      ThuTu: banner.order,
      LoaiBanner: 'Main'
    });
    return id;
  },

  updateBanner: async (id: string, banner: Partial<Banner>) => {
    const current = await http.get<any[]>(`/api/banners?type=Main`);
    const found = current.find(x => (x.maBanner || x.MaBanner) === id);
    if (!found) return;
    await http.put(`/api/banners/${id}`, {
      TieuDe: banner.title ?? pick(found, 'tieuDe', 'TieuDe') ?? '',
      PhuDe: banner.subtitle ?? pick(found, 'phuDe', 'PhuDe') ?? '',
      MucGiam: pick(found, 'mucGiam', 'MucGiam') ?? null,
      MaCode: pick(found, 'maCode', 'MaCode') ?? null,
      URLHinhAnh: banner.imageUrl ?? pick(found, 'urlHinhAnh', 'URLHinhAnh') ?? '',
      DuongDan: banner.linkUrl ?? pick(found, 'duongDan', 'DuongDan') ?? '/',
      ThuTu: Number(banner.order ?? pick(found, 'thuTu', 'ThuTu') ?? 1),
      LoaiBanner: pick(found, 'loaiBanner', 'LoaiBanner') ?? 'Main'
    });
  },

  deleteBanner: async (id: string) => {
    await http.delete(`/api/banners/${id}`);
  },

  getPromoBanners: async (_onlyActive = true) => {
    const banners = await http.get<any[]>('/api/banners?type=Promo');
    return banners.map((b): PromoBannerData => ({
      id: b.maBanner || b.MaBanner,
      title: b.tieuDe || b.TieuDe,
      discount: b.mucGiam || b.MucGiam || '',
      code: b.maCode || b.MaCode || '',
      image: b.urlHinhAnh || b.URLHinhAnh,
      active: true
    }));
  },

  updatePromoBanner: async (id: string, data: Partial<PromoBannerData>) => {
    const current = await http.get<any[]>(`/api/banners?type=Promo`);
    const found = current.find(x => (x.maBanner || x.MaBanner) === id);
    if (!found) return;
    await http.put(`/api/banners/${id}`, {
      TieuDe: data.title ?? pick(found, 'tieuDe', 'TieuDe') ?? '',
      PhuDe: pick(found, 'phuDe', 'PhuDe') ?? '',
      MucGiam: data.discount ?? pick(found, 'mucGiam', 'MucGiam') ?? '',
      MaCode: data.code ?? pick(found, 'maCode', 'MaCode') ?? '',
      URLHinhAnh: data.image ?? pick(found, 'urlHinhAnh', 'URLHinhAnh') ?? '',
      DuongDan: pick(found, 'duongDan', 'DuongDan') ?? '/',
      ThuTu: Number(pick(found, 'thuTu', 'ThuTu') ?? 1),
      LoaiBanner: 'Promo'
    });
  },

  addPromoBanner: async (data: Omit<PromoBannerData, 'id'>) => {
    const id = `BN${Date.now()}`;
    await http.post('/api/banners', {
      MaBanner: id,
      TieuDe: data.title,
      PhuDe: '',
      MucGiam: data.discount,
      MaCode: data.code,
      URLHinhAnh: data.image,
      DuongDan: '/',
      ThuTu: 1,
      LoaiBanner: 'Promo'
    });
    return id;
  },

  deletePromoBanner: async (id: string) => {
    await http.delete(`/api/banners/${id}`);
  }
};
