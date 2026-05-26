import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, MoveUp, MoveDown, Image as ImageIcon, Tag, Loader2, Scissors } from 'lucide-react';
import { Banner, PromoBannerData } from '../../types';
import { BannerService } from '../../services/bannerService';
import { SystemConfigService } from '../../services/systemConfigService';
import Modal from '../../components/common/Modal';
import { toast } from '../../lib/toast';

// Pintura
import { openDefaultEditor } from '@pqina/pintura';
import '@pqina/pintura/pintura.css';

const Settings: React.FC = () => {
  // ... existing state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBannerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoBannerData> | null>(null);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [shippingFeeInput, setShippingFeeInput] = useState<number>(SystemConfigService.getShippingFee());

  const handleEditImage = (url: string, onSave: (newUrl: string) => Promise<void>) => {
    const editor = openDefaultEditor({
        src: url,
    });

    editor.on('process', async (imageState) => {
        // In local mode, we'll just mock the upload of the edited image
        // and return the new base64 or a blob URL
        const reader = new FileReader();
        reader.readAsDataURL(imageState.dest);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            try {
              await onSave(base64data);
              toast.success('Đã chỉnh sửa ảnh thành công!');
            } catch {
              toast.error('Lưu ảnh sau chỉnh sửa thất bại');
            }
        };
    });
  };

  // ... existing methods (loadData, handleAdd, handleEdit, etc.)


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bannerData, promoData] = await Promise.all([
        BannerService.getBanners(false),
        BannerService.getPromoBanners(false)
      ]);
      setBanners(bannerData);
      setPromoBanners(promoData);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải cấu hình');
    } finally {
      setIsLoading(false);
      window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'settings' } }));
    }
  };

  const loadBanners = async () => {
    const data = await BannerService.getBanners(false);
    setBanners(data);
  };

  const loadPromoBanners = async () => {
    const data = await BannerService.getPromoBanners(false);
    setPromoBanners(data);
  };

  const handleAdd = () => {
    setEditingBanner({
      imageUrl: 'https://picsum.photos/seed/banner/1200/400',
      linkUrl: '/',
      title: 'Bộ sưu tập mới',
      subtitle: 'Giảm giá tới 50%',
      bgColor: '#f3f4f6',
      textColor: '#1f2937',
      order: banners.length + 1,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await BannerService.deleteBanner(id);
      toast.success('Đã xoá banner');
      await loadBanners();
    } catch (error) {
      toast.error('Lỗi khi xoá');
    }
  };

  const handleSave = async () => {
    if (!editingBanner || !editingBanner.imageUrl) return;

    try {
      if (editingBanner.id) {
        await BannerService.updateBanner(editingBanner.id, editingBanner);
        toast.success('Đã cập nhật banner');
      } else {
        await BannerService.addBanner(editingBanner as Omit<Banner, 'id'>);
        toast.success('Đã thêm banner mới');
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (error) {
      toast.error('Lỗi khi lưu');
    }
  };

  const handleAddPromo = () => {
    setEditingPromo({
      title: 'Mùa giải mới, diện mạo mới',
      discount: '20%',
      code: 'NEWSEASON24',
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80',
      bgColor: '#4f46e5',
      active: true
    });
    setIsPromoModalOpen(true);
  };

  const handleEditPromo = (promo: PromoBannerData) => {
    setEditingPromo(promo);
    setIsPromoModalOpen(true);
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await BannerService.deletePromoBanner(id);
      toast.success('Đã xoá banner khuyến mãi');
      await loadPromoBanners();
    } catch (error) {
      toast.error('Lỗi khi xoá');
    }
  };

  const handleSavePromo = async () => {
    if (!editingPromo || !editingPromo.image) return;

    try {
      if (editingPromo.id) {
        await BannerService.updatePromoBanner(editingPromo.id, editingPromo);
        toast.success('Đã cập nhật banner khuyến mãi');
      } else {
        await BannerService.addPromoBanner(editingPromo as Omit<PromoBannerData, 'id'>);
        toast.success('Đã thêm banner khuyến mãi mới');
      }
      setIsPromoModalOpen(false);
      loadPromoBanners();
    } catch (error) {
      toast.error('Lỗi khi lưu');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const temp = newBanners[index].order;
    newBanners[index].order = newBanners[targetIndex].order;
    newBanners[targetIndex].order = temp;

    try {
      await BannerService.updateBanner(newBanners[index].id!, { order: newBanners[index].order });
      await BannerService.updateBanner(newBanners[targetIndex].id!, { order: newBanners[targetIndex].order });
      loadBanners();
    } catch (error) {
      toast.error('Lỗi khi đổi vị trí');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-dark tracking-tight">Cấu hình hệ thống</h2>
          <p className="text-gray-500 font-medium">Quản lý banner và giao diện trang chủ</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-dark tracking-tight">Cấu hình vận chuyển</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Phí giao hàng mặc định</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phí giao hàng (VND)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={shippingFeeInput}
                onChange={(e) => setShippingFeeInput(Number(e.target.value || 0))}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="30000"
              />
            </div>
            <button
              onClick={() => {
                SystemConfigService.setShippingFee(shippingFeeInput);
                toast.success('Đã cập nhật phí giao hàng');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold border-none cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              Lưu phí giao hàng
            </button>
          </div>
        </div>
      </section>

      {/* MAIN BANNERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-black text-dark tracking-tight">Banner Carousel (Lớn)</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Trượt ở đầu trang chủ</p>
             </div>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all border-none cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Thêm Banner
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-50">
            {banners.map((banner, index) => (
              <div key={banner.id} className="p-6 flex items-center gap-6 hover:bg-gray-50/30 transition-colors">
                <div className="w-[180px] h-[60px] rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-dark truncate leading-none mb-1">{banner.title}</h3>
                  <p className="text-xs text-gray-400 font-medium truncate">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveOrder(index, 'up')} disabled={index === 0} className="p-1.5 rounded-lg border-none bg-gray-50 text-gray-400 hover:text-primary transition-colors cursor-pointer">
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveOrder(index, 'down')} disabled={index === banners.length - 1} className="p-1.5 rounded-lg border-none bg-gray-50 text-gray-400 hover:text-primary transition-colors cursor-pointer">
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEditImage(banner.imageUrl!, async (newUrl) => { await BannerService.updateBanner(banner.id!, { imageUrl: newUrl }); await loadBanners(); })} className="p-2 text-primary hover:bg-primary/5 rounded-lg border-none bg-transparent cursor-pointer transition-colors" title="Chỉnh sửa ảnh (Pintura)">
                    <Scissors className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEdit(banner)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg border-none bg-transparent cursor-pointer">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setDeletingBannerId(banner.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Tag className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-black text-dark tracking-tight">Banner Khuyến mãi (Nhỏ)</h3>
              </div>
          </div>
          <button onClick={handleAddPromo} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 border-none cursor-pointer">
            <Plus className="w-5 h-5" /> Thêm Banner KM
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-50">
            {promoBanners.map((promo) => (
              <div key={promo.id} className="p-6 flex items-center gap-6 hover:bg-gray-50/30 transition-colors">
                <div className="w-[180px] h-[60px] rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                  <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-dark truncate mb-1">{promo.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Mã: {promo.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditImage(promo.image, async (newUrl) => { await BannerService.updatePromoBanner(promo.id!, { image: newUrl }); await loadPromoBanners(); })} className="p-2 text-primary hover:bg-primary/5 rounded-lg border-none bg-transparent cursor-pointer transition-colors" title="Chỉnh sửa ảnh (Pintura)">
                    <Scissors className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEditPromo(promo)} className="p-2 text-blue-500 border-none bg-transparent cursor-pointer">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setDeletingPromoId(promo.id!)} className="p-2 text-red-500 border-none bg-transparent cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isModalOpen && editingBanner && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lưu banner">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề</label>
              <input type="text" value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="Nhập tiêu đề" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phụ đề</label>
              <input type="text" value={editingBanner.subtitle || ''} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="Nhập phụ đề" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URL liên kết</label>
              <input
                type="text"
                value={editingBanner.linkUrl || ''}
                onChange={e => setEditingBanner({ ...editingBanner, linkUrl: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="/products hoặc https://example.com"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">URL Ảnh</label>
                <input type="text" value={editingBanner.imageUrl || ''} onChange={e => setEditingBanner({...editingBanner, imageUrl: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="https://..." />
              </div>
              <div className="w-[120px]">
                 <label className="w-full flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-xl font-bold text-sm transition-colors text-gray-700 border border-gray-200">
                    Tải ảnh lên
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                             setEditingBanner({...editingBanner, imageUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                       }
                    }} />
                 </label>
              </div>
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-primary/90 transition-colors">Lưu thay đổi</button>
          </div>
        </Modal>
      )}

      {isPromoModalOpen && editingPromo && (
        <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Lưu banner khuyến mãi">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề</label>
              <input type="text" value={editingPromo.title || ''} onChange={e => setEditingPromo({...editingPromo, title: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="Nhập tiêu đề" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mức giảm</label>
                  <input type="text" value={editingPromo.discount || ''} onChange={e => setEditingPromo({...editingPromo, discount: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="VD: GIẢM 50%" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mã code</label>
                  <input type="text" value={editingPromo.code || ''} onChange={e => setEditingPromo({...editingPromo, code: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary uppercase" placeholder="VD: TET2024" />
               </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">URL Ảnh</label>
                <input type="text" value={editingPromo.image || ''} onChange={e => setEditingPromo({...editingPromo, image: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" placeholder="https://..." />
              </div>
              <div className="w-[120px]">
                 <label className="w-full flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-xl font-bold text-sm transition-colors text-gray-700 border border-gray-200">
                    Tải ảnh lên
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                             setEditingPromo({...editingPromo, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                       }
                    }} />
                 </label>
              </div>
            </div>
            <button onClick={handleSavePromo} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-indigo-700 transition-colors">Lưu thay đổi</button>
          </div>
        </Modal>
      )}

      <Modal isOpen={deletingBannerId !== null} onClose={() => setDeletingBannerId(null)} title="Xác nhận xoá banner">
        <div className="space-y-4">
          <p className="text-gray-600">Bạn có chắc chắn muốn xoá banner này?</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingBannerId(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">Huỷ</button>
            <button type="button" onClick={async () => { if (!deletingBannerId) return; await handleDelete(deletingBannerId); setDeletingBannerId(null); }} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer border-none">Xoá</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deletingPromoId !== null} onClose={() => setDeletingPromoId(null)} title="Xác nhận xoá banner khuyến mãi">
        <div className="space-y-4">
          <p className="text-gray-600">Bạn có chắc chắn muốn xoá banner khuyến mãi này?</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDeletingPromoId(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">Huỷ</button>
            <button type="button" onClick={async () => { if (!deletingPromoId) return; await handleDeletePromo(deletingPromoId); setDeletingPromoId(null); }} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer border-none">Xoá</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;

