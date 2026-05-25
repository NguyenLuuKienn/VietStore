import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { ApiService } from '../../services/apiService';
import { toast } from '../../lib/toast';
import { HttpError } from '../../services/httpClient';

type ModalType = 'none' | 'add' | 'edit' | 'delete';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [modalConfig, setModalConfig] = useState<{ type: ModalType; category?: any }>({ type: 'none' });
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const loadCategories = async () => {
    const [data, products] = await Promise.all([ApiService.getCategories(), ApiService.getProducts(200)]);

    const enrichedData = data.map((cat: any) => ({
      ...cat,
      productCount: products.filter((p) => p.category === cat.id || p.category === cat.name).length
    }));

    setCategories(enrichedData);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'categories' } }));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const closeModal = () => {
    setModalConfig({ type: 'none' });
    setFormData({ name: '', parentId: '' });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createCategory({ name: formData.name, parentId: formData.parentId || null });
      closeModal();
      loadCategories();
      toast.success('Thêm danh mục thành công');
    } catch {
      toast.error('Thêm danh mục thất bại');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConfig.category?.id) return;
    try {
      await ApiService.updateCategory(modalConfig.category.id, { name: formData.name, parentId: formData.parentId || null });
      closeModal();
      loadCategories();
      toast.success('Cập nhật danh mục thành công');
    } catch {
      toast.error('Cập nhật danh mục thất bại');
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConfig.category?.id) return;
    try {
      await ApiService.deleteCategory(modalConfig.category.id);
      closeModal();
      loadCategories();
      toast.success('Xóa danh mục thành công');
    } catch (err) {
      const message = err instanceof HttpError ? (err.message || '') : '';
      const lower = message.toLowerCase();
      if (
        lower.includes('fk_sanpham_danhmuc_madanhmuc') ||
        lower.includes('reference constraint') ||
        lower.includes('conflicted')
      ) {
        toast.error('Không thể xóa danh mục vì đang có sản phẩm thuộc danh mục này.');
      } else {
        toast.error('Xóa danh mục thất bại. Vui lòng thử lại.');
      }
    }
  };

  const openAdd = () => {
    setFormData({ name: '', parentId: '' });
    setModalConfig({ type: 'add' });
  };

  const openEdit = (cat: any) => {
    setFormData({ name: cat.name, parentId: cat.parentId || '' });
    setModalConfig({ type: 'edit', category: cat });
  };

  const openDelete = (cat: any) => {
    setModalConfig({ type: 'delete', category: cat });
  };

  return (
    <div className="relative min-h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-[900] text-dark mb-2">Quản lý Danh mục</h1>
          <p className="text-gray-500 font-medium">Quản lý cấu trúc danh mục cha/con.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all border-none cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Mã / Tên Danh mục</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Danh mục cha</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Số Sản Phẩm</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-dark text-[14px]">{item.name}</div>
                  <div className="text-[12px] text-gray-500">ID: {item.id}</div>
                </td>
                <td className="px-6 py-4 text-[13px] font-semibold text-gray-600">{categoryNameById.get(item.parentId) || '--'}</td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">{item.productCount} sản phẩm</span>
                </td>
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

      <Modal isOpen={modalConfig.type === 'add'} onClose={closeModal} title="Thêm Danh mục">
        <form className="space-y-4" onSubmit={handleAddSubmit}>
          <div>
            <label className="block text-sm font-bold text-dark mb-2">Tên danh mục *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-dark mb-2">Danh mục cha</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50"
            >
              <option value="">-- Không có (danh mục gốc) --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">
              Hủy
            </button>
            <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold cursor-pointer border-none">
              Thêm
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalConfig.type === 'edit'} onClose={closeModal} title="Sửa Danh mục">
        {modalConfig.category && (
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Tên danh mục *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Danh mục cha</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50"
              >
                <option value="">-- Không có (danh mục gốc) --</option>
                {categories
                  .filter((cat) => cat.id !== modalConfig.category.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">
                Hủy
              </button>
              <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold cursor-pointer border-none">
                Lưu
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={modalConfig.type === 'delete'} onClose={closeModal} title="Xóa Danh mục">
        {modalConfig.category && (
          <form className="space-y-4" onSubmit={handleDeleteSubmit}>
            <div className="text-center py-4">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-bold">Xóa {modalConfig.category.name}?</h4>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">
                Hủy
              </button>
              <button type="submit" className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer border-none">
                Xóa
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Categories;

