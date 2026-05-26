import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, X, Edit, Plus, Trash2 } from 'lucide-react';
import { CartService } from '../../services/cartService';
import Modal from '../../components/common/Modal';
import RichTextEditor from '../../components/common/RichTextEditor';
import { ApiService } from '../../services/apiService';
import { Product } from '../../types';
import { toast } from '../../lib/toast';
import { HttpError } from '../../services/httpClient';

const mockHistory = [
  { id: 1, user: 'Nguyễn Tuấn', role: 'Super Admin', action: 'System started', date: '18/04/2026 14:30' },
];

type ProductHistoryItem = {
  id: number | string;
  user: string;
  role: string;
  action: string;
  date: string;
};

const Products: React.FC = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ProductHistoryItem[]>([]);
  const [modalConfig, setModalConfig] = useState<{type: 'none' | 'add' | 'edit' | 'delete', product?: Product}>({type: 'none'});
  const [products, setProducts] = useState<Product[]>([]);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    price: '', 
    isDiscounted: false,
    discountAmount: '',
    description: '', 
    detailedInfo: '',
    images: '',
    isFeaturedNew: false,
    isFeaturedBestseller: false,
    isVisible: true,
    stockQuantity: '0',
    supplier: ''
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isEditModalLoading, setIsEditModalLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await ApiService.getProductCrudHistory(200);
      const mapped = (data || []).map((x: any) => ({
        id: x.maNhatKy || x.MaNhatKy || Date.now(),
        user: x.nguoiThucHien || x.NguoiThucHien || 'Hệ thống',
        role: x.vaiTro || x.VaiTro || 'Unknown',
        action: x.noiDung || x.NoiDung || x.hanhDong || x.HanhDong || '',
        date: x.thoiGian || x.ThoiGian ? new Date(x.thoiGian || x.ThoiGian).toLocaleString('vi-VN') : ''
      }));
      setHistoryItems(mapped.length > 0 ? mapped : mockHistory);
    } catch {
      setHistoryItems(mockHistory);
    }
  };

  const loadProducts = async (size = pageSize) => {
    const data = await ApiService.getProducts(size, false, true);
    setProducts((data as Product[]).map((p) => ({
      ...p,
      images: p.images?.length ? [p.images[0]] : []
    })));
    setHasMore(data.length >= size);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'products' } }));
  };

  const loadMasterData = async () => {
    const [cats, sups] = await Promise.all([
      ApiService.getCategories(),
      ApiService.getSuppliers()
    ]);
    setCategories(cats);
    setSuppliers(sups);
    setFormData(prev => (prev.supplier || sups.length === 0 ? prev : { ...prev, supplier: sups[0].id || '' }));
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'products' } }));
  };

  useEffect(() => {
    loadProducts();
  }, [pageSize]);

  useEffect(() => {
    loadMasterData();
  }, []);

  const handleLoadMore = () => {
    setPageSize(prev => prev + 20);
  };

  const closeModal = () => {
    setModalConfig({type: 'none'});
    setFormData({ 
      name: '', 
      category: '', 
      price: '', 
      isDiscounted: false,
      discountAmount: '',
      description: '', 
      detailedInfo: '',
      images: '',
      isFeaturedNew: false,
      isFeaturedBestseller: false,
      isVisible: true,
      stockQuantity: '0',
      supplier: suppliers[0]?.id || suppliers[0]?.maNhaCungCap || suppliers[0]?.MaNhaCungCap || ''
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const currentImages = formData.images ? formData.images.split('|||').filter(Boolean) : [];
    const remainingSlots = Math.max(0, 6 - currentImages.length);
    if (remainingSlots <= 0) {
      toast.error('Toi da 6 anh cho moi san pham');
      e.target.value = '';
      return;
    }
    const filesToRead = files.slice(0, remainingSlots);
    if (filesToRead.length < files.length) {
      toast.info(`Chi nhan them ${remainingSlots} anh (toi da 6 anh)`);
    }
    
    Promise.all(filesToRead.map((file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })).then(base64Images => {
      setFormData(prev => ({
        ...prev,
        images: prev.images ? prev.images + '|||' + base64Images.join('|||') : base64Images.join('|||')
      }));
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const imgs = formData.images.split('|||');
    imgs.splice(index, 1);
    setFormData({ ...formData, images: imgs.join('|||') });
  };

  const setPrimaryImage = (index: number) => {
    const imgs = formData.images.split('|||').filter(Boolean);
    if (index < 0 || index >= imgs.length || index === 0) return;
    const [selected] = imgs.splice(index, 1);
    imgs.unshift(selected);
    setFormData({ ...formData, images: imgs.join('|||') });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      category: formData.category,
      price: formData.price,
      isDiscounted: formData.isDiscounted,
      discountAmount: Number(formData.discountAmount || 0),
      description: formData.description,
      detailedInfo: formData.detailedInfo,
      images: formData.images ? formData.images.split('|||').map(s => s.trim()).filter(Boolean).slice(0, 6) : [],
      isFeaturedNew: formData.isFeaturedNew,
      isFeaturedBestseller: formData.isFeaturedBestseller,
      isVisible: formData.isVisible,
      stockQuantity: parseInt(formData.stockQuantity),
      supplier: formData.supplier
    };
    try {
    await ApiService.createProduct(productData);
    window.dispatchEvent(new Event('admin-data-changed'));
    closeModal();
    loadProducts();
    if (isHistoryOpen) loadHistory();
    toast.success('Thêm sản phẩm thành công');
  } catch {
    toast.error('Thêm sản phẩm thất bại');
  }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConfig.product?.id) return;
    const productData = {
      name: formData.name,
      category: formData.category,
      price: formData.price,
      isDiscounted: formData.isDiscounted,
      discountAmount: Number(formData.discountAmount || 0),
      description: formData.description,
      detailedInfo: formData.detailedInfo,
      images: formData.images ? formData.images.split('|||').map(s => s.trim()).filter(Boolean).slice(0, 6) : [],
      isFeaturedNew: formData.isFeaturedNew,
      isFeaturedBestseller: formData.isFeaturedBestseller,
      isVisible: formData.isVisible,
      stockQuantity: parseInt(formData.stockQuantity),
      supplier: formData.supplier
    };
    try {
    await ApiService.updateProduct(modalConfig.product.id, productData);
    window.dispatchEvent(new Event('admin-data-changed'));
    closeModal();
    if (isHistoryOpen) loadHistory();
    toast.success('Cập nhật sản phẩm thành công');
  } catch {
    toast.error('Cập nhật sản phẩm thất bại');
    return;
  }
    setProducts(prev => prev.map(p => (
      p.id === modalConfig.product!.id
        ? { ...p, ...productData, images: productData.images as any, stockQuantity: productData.stockQuantity }
        : p
    )));
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConfig.product?.id) return;
    try {
      await ApiService.deleteProduct(modalConfig.product.id);
      window.dispatchEvent(new Event('admin-data-changed'));
      setProducts(prev => prev.filter(p => p.id !== modalConfig.product!.id));
      if (isHistoryOpen) loadHistory();
      closeModal();
      toast.success('Xóa sản phẩm thành công');
    } catch (err) {
      const message = err instanceof HttpError ? (err.message || '') : '';
      const lower = message.toLowerCase();
      if (
        lower.includes('fk_chitietdonhang_sanpham_masanpham') ||
        lower.includes('reference constraint') ||
        lower.includes('conflicted')
      ) {
        toast.error('Không thể xóa sản phẩm vì đã phát sinh trong đơn hàng.');
      } else {
        toast.error('Xóa sản phẩm thất bại. Vui lòng thử lại.');
      }
    }
  };

  const openEdit = async (p: Product) => {
    setIsEditModalLoading(true);
    setModalConfig({type: 'edit', product: p});
    try {
      const detail = await ApiService.getProductById(p.id);
      const source = detail || p;
      const rawPrice = source.price.toString().replace(/\D/g, '');
      setFormData({
        name: source.name,
        category: source.category,
        price: rawPrice,
        isDiscounted: Boolean((source as any).isDiscounted ?? (source as any).IsGiamGia) || Number((source as any).discountAmount || (source as any).SoTienGiam || 0) > 0,
        discountAmount: String((source as any).discountAmount || (source as any).SoTienGiam || ''),
        description: source.description || '',
        detailedInfo: (source as any).detailedInfo || (source as any).thongTinChiTiet || '',
        images: (source.images || []).join('|||'),
        isFeaturedNew: source.isFeaturedNew || false,
        isFeaturedBestseller: source.isFeaturedBestseller || false,
        isVisible: (source as any).isVisible ?? true,
        stockQuantity: (source.stockQuantity || 0).toString(),
        supplier: source.supplier || suppliers[0]?.id || suppliers[0]?.maNhaCungCap || suppliers[0]?.MaNhaCungCap || ''
      });
    } finally {
      setIsEditModalLoading(false);
    }
  };

  const openDelete = (p: Product) => {
    setModalConfig({type: 'delete', product: p});
  };

  return (
    <div className="relative min-h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-[900] text-dark mb-2">Quản lý Sản phẩm</h1>
          <p className="text-gray-500 font-medium">Danh sách các sản phẩm đang được bán.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsHistoryOpen(true);
              loadHistory();
            }}
            className="bg-white border border-gray-200 text-dark px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
          >
            <History className="w-5 h-5" /> History
          </button>
          <button 
            onClick={() => setModalConfig({type: 'add'})}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all border-none cursor-pointer shadow-sm"
          >
            <Plus className="w-5 h-5" /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nhà cung cấp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Kho</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn giá</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={item.images?.[0] || `https://placehold.co/100x100`} className="w-12 h-12 rounded-[10px] object-cover bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-bold text-dark text-[14px]">{item.name}</h4>
                        <div className="flex gap-1.5 mt-1">
                          <span className="text-[12px] text-gray-500">Mã: {item.id}</span>
                          {item.isFeaturedNew && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-600 rounded-full">New</span>
                          )}
                          {item.isFeaturedBestseller && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">Best</span>
                          )}
                          {item.isVisible === false && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">Ẩn</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600 text-sm">
                    {categories.find((c: any) => c.id === item.category)?.name || item.category}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600 text-sm">
                    {suppliers.find((s: any) => s.id === item.supplier)?.name || item.supplier || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ (item.stockQuantity || 0) > 10 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100' }`}>
                        {item.stockQuantity || 0} SP
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{CartService.formatPrice(item.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="p-6 border-t border-gray-50 flex justify-center">
            <button onClick={handleLoadMore} className="bg-primary/10 text-primary font-bold px-8 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all border-none cursor-pointer">
              Xem thêm sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal 
        isOpen={modalConfig.type === 'add' || modalConfig.type === 'edit'} 
        onClose={closeModal} 
        title={modalConfig.type === 'add' ? "Thêm Sản Phẩm Mới" : "Chỉnh sửa Sản Phẩm"} 
        maxWidth="max-w-3xl"
      >
        {modalConfig.type === 'edit' && isEditModalLoading ? (
          <div className="min-h-[320px] flex items-center justify-center">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
        <form className="space-y-4" onSubmit={modalConfig.type === 'add' ? handleAddSubmit : handleEditSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-dark mb-2">Tên sản phẩm *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Danh mục *</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none">
                <option value="">Chọn danh mục</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Nhà cung cấp *</label>
              <select value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none">
                {suppliers.map((s: any) => {
                  const id = s.id || s.maNhaCungCap || s.MaNhaCungCap;
                  const name = s.name || s.tenCongTy || s.TenCongTy || id;
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Đơn giá (VNĐ) *</label>
              <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Giảm giá</label>
              <label className="flex items-center gap-2 cursor-pointer h-[44px]">
                <input
                  type="checkbox"
                  checked={formData.isDiscounted}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      isDiscounted: e.target.checked,
                      discountAmount: e.target.checked ? formData.discountAmount : ''
                    })
                  }
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-sm font-bold text-dark">Bật giảm giá cho sản phẩm này</span>
              </label>
            </div>

            {formData.isDiscounted && (
              <div>
                <label className="block text-sm font-bold text-dark mb-2">Số tiền giảm (VNĐ) *</label>
                <input
                  type="number"
                  min={0}
                  max={Number(formData.price || 0)}
                  value={formData.discountAmount}
                  onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                  required={formData.isDiscounted}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Số lượng trong kho *</label>
              <input type="number" min={0} value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-dark mb-2">Mô tả sản phẩm</label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Nhập mô tả sản phẩm..."
                minHeight={140}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-dark mb-2">Thông tin chi tiết sản phẩm</label>
              <RichTextEditor
                value={formData.detailedInfo}
                onChange={(html) => setFormData({ ...formData, detailedInfo: html })}
                placeholder="Nhập thông tin chi tiết, bảng thông số, chất liệu, hướng dẫn sử dụng..."
                minHeight={220}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-dark mb-2">Ảnh sản phẩm (Tải lên từ máy)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-all text-center cursor-pointer relative">
                 <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                 <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                 <p className="text-gray-500 text-sm font-bold">Kéo thả hoặc nhấp để tải ảnh lên</p>
              </div>
              
              {formData.images && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
                  {formData.images.split('|||').map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                      <img src={img} className="w-full h-full object-cover" />
                      {idx === 0 ? (
                        <span className="absolute top-1 left-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                          Ảnh chính
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="absolute top-1 left-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-primary border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Đặt ảnh chính
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer shadow-md">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isVisible} onChange={e => setFormData({...formData, isVisible: e.target.checked})} className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-bold text-dark text-nowrap">Hiển thị sản phẩm</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeaturedNew} onChange={e => setFormData({...formData, isFeaturedNew: e.target.checked})} className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-bold text-dark text-nowrap">Sản phẩm mới</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeaturedBestseller} onChange={e => setFormData({...formData, isFeaturedBestseller: e.target.checked})} className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-bold text-dark text-nowrap">Bán chạy</span>
               </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer hover:bg-gray-200 transition-colors">Hủy</button>
            <button type="submit" className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white border-none cursor-pointer hover:bg-opacity-90 shadow-md shadow-primary/20 transition-all">
                {modalConfig.type === 'add' ? 'Thêm mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
        )}
      </Modal>

      <Modal isOpen={modalConfig.type === 'delete'} onClose={closeModal} title="Xác nhận Xóa">
        {modalConfig.product && (
          <form className="space-y-4" onSubmit={handleDeleteSubmit}>
            <div className="text-center py-4">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-bold">Xóa {modalConfig.product.name}?</h4>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">Hủy</button>
              <button type="submit" className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer border-none">Xóa</button>
            </div>
          </form>
        )}
      </Modal>

      {isHistoryOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsHistoryOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-[380px] max-w-[92vw] bg-white border-l border-gray-200 shadow-2xl z-[70] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-[900] text-dark">Lịch sử CRUD sản phẩm</h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyItems.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có lịch sử thao tác.</p>
              ) : (
                historyItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-dark">{item.user}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{item.role}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  );
};

export default Products;



