import React, { useEffect, useState } from 'react';
import { Ticket, Plus, ToggleLeft, ToggleRight, Eye, Edit2, Trash2 } from 'lucide-react';
import { ApiService } from '../../services/apiService';
import Modal from '../../components/common/Modal';
import { toast } from '../../lib/toast';

interface Voucher {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrder: number;
  quantity: number;
  used: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const mapVoucher = (v: any): Voucher => ({
  id: v.maKhuyenMai || v.MaKhuyenMai,
  code: v.maCode || v.MaCode,
  type: (v.loaiGiamGia || v.LoaiGiamGia) === 'fixed' ? 'fixed' : 'percent',
  value: Number(v.giaTriGiam || v.GiaTriGiam || 0),
  maxDiscount: v.giamToiDa || v.GiamToiDa || undefined,
  minOrder: Number(v.giaTriDonToiThieu || v.GiaTriDonToiThieu || 0),
  quantity: Number(v.soLuong || v.SoLuong || 0),
  used: Number(v.daSuDung || v.DaSuDung || 0),
  startDate: (v.ngayBatDau || v.NgayBatDau || '').toString().slice(0, 10),
  endDate: (v.ngayKetThuc || v.NgayKetThuc || '').toString().slice(0, 10),
  isActive: Boolean(v.trangThai ?? v.TrangThai)
});

export const AdminDiscounts: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewVoucher, setViewVoucher] = useState<Voucher | null>(null);
  const [deleteVoucher, setDeleteVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrder: '0',
    quantity: '100',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const loadData = async () => {
    const rs = await ApiService.getVouchers(true);
    setVouchers(rs.map(mapVoucher));
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'discounts' } }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatus = async (id: string) => {
    const current = vouchers.find(v => v.id === id);
    if (!current) return;
    try {
      await ApiService.updateVoucher(id, { SoLuong: current.quantity, TrangThai: !current.isActive });
      await loadData();
      toast.success('Cập nhật trạng thái mã giảm giá thành công');
    } catch {
      toast.error('Cập nhật trạng thái mã giảm giá thất bại');
    }
  };

  const openEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code,
      type: voucher.type,
      value: String(voucher.value),
      maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : '',
      minOrder: String(voucher.minOrder),
      quantity: String(voucher.quantity),
      startDate: voucher.startDate,
      endDate: voucher.endDate
    });
    setIsModalOpen(true);
  };

  const closeEdit = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      maxDiscount: '',
      minOrder: '0',
      quantity: '100',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await ApiService.updateVoucher(editingId, {
          SoLuong: Number(formData.quantity),
          TrangThai: true
        });
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await ApiService.createVoucher({
          MaCode: formData.code.toUpperCase(),
          LoaiGiamGia: formData.type,
          GiaTriGiam: Number(formData.value),
          GiamToiDa: formData.maxDiscount ? Number(formData.maxDiscount) : null,
          GiaTriDonToiThieu: Number(formData.minOrder),
          SoLuong: Number(formData.quantity),
          NgayBatDau: formData.startDate,
          NgayKetThuc: formData.endDate,
          TrangThai: true
        });
        toast.success('Tạo mã giảm giá thành công');
      }

      closeEdit();
      await loadData();
    } catch {
      toast.error('Lưu mã giảm giá thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deleteVoucher) return;
    try {
      await ApiService.deleteVoucher(deleteVoucher.id);
      setDeleteVoucher(null);
      await loadData();
      toast.success('Xóa mã giảm giá thành công');
    } catch {
      toast.error('Xóa mã giảm giá thất bại');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-[900] text-dark">Quản lý mã giảm giá</h2>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-[12px] font-bold border-none cursor-pointer">
          <Plus className="w-5 h-5" /> Tạo mã mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mức giảm</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lượt dùng</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {vouchers.map(v => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-[900] text-dark flex items-center gap-2"><Ticket className="w-4 h-4 text-primary" /> {v.code}</td>
                <td className="px-6 py-4">{v.type === 'percent' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')}đ`}</td>
                <td className="px-6 py-4">{v.used}/{v.quantity}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(v.id)} className={`flex items-center gap-2 border-none bg-transparent cursor-pointer p-0 ${v.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                    {v.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setViewVoucher(v)} className="p-2 text-primary hover:bg-primary/10 rounded-lg border-none bg-transparent cursor-pointer" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(v)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg border-none bg-transparent cursor-pointer" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteVoucher(v)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeEdit} title={editingId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Mã giảm giá *</label>
              <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: GIAM20" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Loại giảm *</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'percent' | 'fixed' })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none">
                <option value="percent">Theo phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Giá trị giảm *</label>
              <input value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder={formData.type === 'percent' ? 'VD: 20' : 'VD: 50000'} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Giảm tối đa</label>
              <input value={formData.maxDiscount} onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="VD: 100000" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Đơn tối thiểu</label>
              <input value={formData.minOrder} onChange={e => setFormData({ ...formData, minOrder: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Số lượng *</label>
              <input value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Ngày bắt đầu *</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Ngày kết thúc *</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all outline-none" required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={closeEdit} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer hover:bg-gray-200 transition-colors">Hủy</button>
            <button type="submit" className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white border-none cursor-pointer hover:bg-opacity-90 shadow-md shadow-primary/20 transition-all">
              {editingId ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewVoucher !== null} onClose={() => setViewVoucher(null)} title="Chi tiết mã giảm giá" maxWidth="max-w-xl">
        {viewVoucher && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Mã</p>
                <p className="font-bold text-dark">{viewVoucher.code}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Trạng thái</p>
                <p className={`font-bold ${viewVoucher.isActive ? 'text-green-600' : 'text-gray-500'}`}>{viewVoucher.isActive ? 'Đang bật' : 'Đang tắt'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Mức giảm</p>
                <p className="font-bold text-dark">{viewVoucher.type === 'percent' ? `${viewVoucher.value}%` : `${viewVoucher.value.toLocaleString('vi-VN')}đ`}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Đơn tối thiểu</p>
                <p className="font-bold text-dark">{viewVoucher.minOrder.toLocaleString('vi-VN')}đ</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Lượt dùng</p>
                <p className="font-bold text-dark">{viewVoucher.used}/{viewVoucher.quantity}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Giảm tối đa</p>
                <p className="font-bold text-dark">{viewVoucher.maxDiscount ? `${Number(viewVoucher.maxDiscount).toLocaleString('vi-VN')}đ` : 'Không giới hạn'}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Hiệu lực</p>
              <p className="font-bold text-dark">{viewVoucher.startDate} - {viewVoucher.endDate}</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => setViewVoucher(null)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Đóng</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteVoucher !== null} onClose={() => setDeleteVoucher(null)} title="Xác nhận xóa">
        {deleteVoucher && (
          <div className="space-y-4">
            <p className="text-gray-600">Xóa mã <span className="font-bold text-dark">{deleteVoucher.code}</span>?</p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDeleteVoucher(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold cursor-pointer border-none">Hủy</button>
              <button type="button" onClick={handleDelete} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer border-none">Xóa</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDiscounts;
