import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Clock, Eye, X, UserMinus, Lock, Plus, Edit2, Trash2, Phone } from 'lucide-react';
import { CartService } from '../../services/cartService';
import Modal from '../../components/common/Modal';
import { ApiService } from '../../services/apiService';
import { toast } from '../../lib/toast';

const ViewWrapper = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-[900] text-dark mb-2">{title}</h1>
          <p className="text-gray-500 font-medium">{subtitle}</p>
        </div>
        <button 
          onClick={async () => {
             toast.info('Bắt đầu tải xuống dữ liệu JSON...');
             const data = {
               products: JSON.parse(localStorage.getItem('shop_products') || '[]'),
               categories: JSON.parse(localStorage.getItem('shop_categories') || '[]'),
               orders: JSON.parse(localStorage.getItem('shop_orders') || '[]'),
               users_extended: JSON.parse(localStorage.getItem('shop_users_extended') || '{}'),
             };
             const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
             a.click();
             URL.revokeObjectURL(url);
          }}
          className="bg-white border border-gray-200 text-dark px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" /> Xuất báo cáo (JSON Backup)
        </button>
      </div>
      <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminOrders: React.FC = () => {
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isViewOrderLoading, setIsViewOrderLoading] = useState(false);

  const loadOrders = async () => {
    const data = await ApiService.getOrders();
    setOrders(data);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'orders' } }));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const closeModal = () => setViewOrder(null);

  const openViewOrder = async (order: any) => {
    setViewOrder(order);
    setIsViewOrderLoading(true);
    try {
      const detail = await ApiService.getOrderById(order.id);
      const orderRaw = detail?.order || {};
      const itemsRaw = detail?.details || detail?.items || [];
      const items = itemsRaw.map((x: any) => ({
        productId: x.maSanPham || x.MaSanPham || x.productId || '',
        name: x.tenSanPham || x.TenSanPham || x.name || '',
        image: x.urlHinhAnh || x.URLHinhAnh || x.image || '',
        quantity: Number(x.soLuong || x.SoLuong || x.quantity || 0),
        price: Number(x.donGia || x.DonGia || x.price || 0),
        size: x.kichThuoc || x.KichThuoc || x.size || ''
      }));

      setViewOrder({
        ...order,
        ...detail,
        status: orderRaw.trangThai || orderRaw.TrangThai || order.status,
        paymentMethod: orderRaw.phuongThucThanhToan || orderRaw.PhuongThucThanhToan || order.paymentMethod || 'COD',
        total: orderRaw.tongTien || orderRaw.TongTien || order.total || 0,
        createdAt: orderRaw.ngayDatHang || orderRaw.NgayDatHang || order.createdAt,
        customerInfo: {
          fullName: orderRaw.tenKhachHang || orderRaw.TenKhachHang || order.customerInfo?.fullName || '',
          phone: orderRaw.soDienThoai || orderRaw.SoDienThoai || order.customerInfo?.phone || '',
          address: orderRaw.diaChiGiaoHang || orderRaw.DiaChiGiaoHang || order.customerInfo?.address || ''
        },
        items
      });
    } catch {
      toast.error('Khong tai duoc chi tiet don hang');
    } finally {
      setIsViewOrderLoading(false);
    }
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      const prevStatus = viewOrder.status;
      await ApiService.updateOrder(id, { status: nextStatus });
      
      // Update sold count logic... (omitted for brevity if needed but keeping for UI consistency)
      if (nextStatus === 'HoanThanh' && prevStatus !== 'HoanThanh') {
        for (const item of viewOrder.items) {
          if (item.productId) await ApiService.incrementProductSoldCount(item.productId, item.quantity || 1);
        }
      } else if (prevStatus === 'HoanThanh' && nextStatus !== 'HoanThanh') {
        for (const item of viewOrder.items) {
          if (item.productId) await ApiService.incrementProductSoldCount(item.productId, -(item.quantity || 1));
        }
      }

      setViewOrder(null);
      loadOrders();
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'HoanThanh': 
      case 'Completed': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs border border-green-100 font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Hoàn thành</span>;
      case 'DangGiao':
      case 'Shipping': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs border border-blue-100 font-bold w-fit"><Clock className="w-3.5 h-3.5"/> Đang giao</span>;
      case 'ChoXacNhan':
      case 'Pending': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full text-xs border border-orange-100 font-bold w-fit"><Clock className="w-3.5 h-3.5"/> Chờ xử lý</span>;
      case 'DaHuy':
      case 'Cancelled': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs border border-red-100 font-bold w-fit"><X className="w-3.5 h-3.5"/> Đã hủy</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold border border-gray-200">{status}</span>;
    }
  };

  return (
    <ViewWrapper title="Quản lý Đơn hàng" subtitle="Theo dõi và xử lý các đơn hàng hệ thống.">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã đơn</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày đặt</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thanh toán</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Tổng tiền</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map(order => {
             const date = order.createdAt ? new Date(order.createdAt) : new Date();
             return (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-dark text-sm">#{order.id.substring(0, 8).toUpperCase()}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-dark text-sm">{order.customerInfo?.fullName || 'Khách Vãng Lai'}</div>
                  <div className="text-gray-500 text-xs">{order.customerInfo?.phone || ''}</div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-500 text-sm">{date.toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold border border-gray-200">{order.paymentMethod || 'COD'}</span>
                </td>
                <td className="px-6 py-4">
                  {getStatusDisplay(order.status)}
                </td>
                <td className="px-6 py-4 font-[800] text-primary text-sm text-right">{CartService.formatPrice(order.total)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openViewOrder(order)} className="p-2 text-primary hover:bg-primary/10 rounded-lg border-none bg-transparent cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
             );
          })}
        </tbody>
      </table>

      <Modal isOpen={viewOrder !== null} onClose={closeModal} title={`Chi Tiết Đơn Hàng #${viewOrder?.id?.substring(0, 8).toUpperCase()}`}>
        {isViewOrderLoading ? (
          <div className="min-h-[260px] flex items-center justify-center">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-bold text-dark text-sm mb-2">Thông tin khách hàng</h4>
                <p className="text-[13px] font-medium text-gray-600 mb-1">Tên: {viewOrder.customerInfo?.fullName}</p>
                <p className="text-[13px] font-medium text-gray-600 mb-1">SĐT: {viewOrder.customerInfo?.phone}</p>
                <p className="text-[13px] font-medium text-gray-600">Địa chỉ: {viewOrder.customerInfo?.address}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-bold text-dark text-sm mb-2">Thông tin đơn hàng</h4>
                <p className="text-[13px] font-medium text-gray-600 mb-1">Ngày đặt: {viewOrder.createdAt ? new Date(viewOrder.createdAt).toLocaleString('vi-VN') : ''}</p>
                <p className="text-[13px] font-medium text-gray-600 mb-1">Phương thức: {viewOrder.paymentMethod || 'COD'}</p>
                <div className="text-[13px] font-medium text-gray-600 mb-1 flex items-center gap-2">
                  Trạng thái: {getStatusDisplay(viewOrder.status)}
                </div>
                <p className="text-[13px] font-medium text-gray-600">Tổng tiền: <span className="font-bold text-primary text-base">{CartService.formatPrice(viewOrder.total)}</span></p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-dark text-sm mb-3">Danh sách sản phẩm</h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {(viewOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-50">
                      <img src={item.image || 'https://placehold.co/100x100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark truncate leading-tight mb-1">{item.name}</p>
                      <p className="text-[11px] font-semibold text-gray-500">SL: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{CartService.formatPrice((item.price || 0) * (item.quantity || 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
               <h4 className="font-bold text-dark text-sm mb-3">Cập nhật trạng thái</h4>
               <div className="flex flex-wrap gap-2">
                  {(() => {
                    const currentStatus = viewOrder.status;
                    let nextPossible: {id: string, label: string, color: string}[] = [];
                    
                    if (currentStatus === 'ChoXacNhan') {
                      nextPossible = [
                        { id: 'DangGiao', label: 'Giao hàng', color: 'bg-blue-600' },
                        { id: 'DaHuy', label: 'Hủy đơn', color: 'bg-red-500' }
                      ];
                    } else if (currentStatus === 'DangGiao') {
                      nextPossible = [
                        { id: 'HoanThanh', label: 'Hoàn thành', color: 'bg-green-600' },
                        { id: 'DaHuy', label: 'Hủy đơn', color: 'bg-red-500' }
                      ];
                    }

                    if (nextPossible.length === 0) {
                      return <p className="text-gray-400 text-xs italic font-medium">Đơn hàng này đã kết thúc (Hoàn thành hoặc Đã hủy), không thể chuyển trạng thái.</p>;
                    }

                    return nextPossible.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => updateStatus(viewOrder.id, s.id)} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white border-none transition-all cursor-pointer ${s.color} hover:brightness-95 shadow-sm active:scale-95`}
                      >
                        Chuyển sang: {s.label}
                      </button>
                    ));
                  })()}
               </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-6 py-2 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </ViewWrapper>
  );
};

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [viewCustomer, setViewCustomer] = useState<any>(null);

  const isAdminUser = (u: any) => {
    const roleValue = String(u.role ?? u.Role ?? u.quyen ?? u.Quyen ?? u.maQuyen ?? u.MaQuyen ?? '').trim().toLowerCase();
    return roleValue === 'admin' || roleValue === '1';
  };

  const normalizeStatus = (value: any): 'active' | 'inactive' | 'locked' => {
    const s = String(value ?? '').trim().toLowerCase();
    if (s === 'locked' || s === 'khoa' || s === 'da khoa') return 'locked';
    if (s === 'inactive' || s === 'inactivate' || s === 'nghi' || s === 'tam ngung') return 'inactive';
    return 'active';
  };

  const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value?.toDate && typeof value.toDate === 'function') return value.toDate();
    if (value?._seconds) return new Date(value._seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const loadCustomers = async () => {
    const [users, orders] = await Promise.all([
      ApiService.getCustomers(),
      ApiService.getOrders()
    ]);

    const mapped = (users || [])
      .filter((u: any) => !isAdminUser(u))
      .map((u: any) => {
        const id = String(u.id ?? u.maNguoiDung ?? u.MaNguoiDung ?? '');
        const userOrders = (orders || []).filter((o: any) => String(o.userId ?? '') === id);
        const totalSpent = userOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
        const orderPhones = userOrders.map((o: any) => o.customerInfo?.phone).filter(Boolean);
        const firstOrderDate = userOrders
          .map((o: any) => toDate(o.createdAt))
          .filter(Boolean)
          .sort((a: any, b: any) => a.getTime() - b.getTime())[0] || null;
        const joinedRaw = u.ngayTao || u.NgayTao || u.createdAt || u.CreatedAt || u.ngayDangKy || u.NgayDangKy;
        const joinedDate = toDate(joinedRaw) || firstOrderDate;
        return {
          id,
          fullName: u.fullName || u.hoTen || u.HoTen || 'Khách hàng',
          email: u.email || u.Email || '',
          phone: u.soDienThoai || u.SoDienThoai || orderPhones[0] || '',
          joinedDate: joinedDate ? joinedDate.toLocaleDateString('vi-VN') : '--',
          ordersCount: userOrders.length,
          totalSpent,
          status: normalizeStatus(u.trangThai || u.TrangThai || u.status || u.Status)
        };
      });

    setCustomers(mapped);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'customers' } }));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'locked') => {
    await ApiService.updateCustomerStatus(id, status);
    toast.success(`Đã cập nhật trạng thái: ${status}`);
    loadCustomers();
    if (viewCustomer?.id === id) setViewCustomer(null);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded text-xs font-bold border border-green-200">Hoạt động</span>;
      case 'inactive': return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold border border-gray-200">Nghỉ</span>;
      case 'locked': return <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded text-xs font-bold border border-red-200">Đã khóa</span>;
      default: return null;
    }
  };

  return (
    <ViewWrapper title="Quản lý Khách hàng" subtitle="Danh sách người dùng và điểm thành viên.">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Số Đơn</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Đã chi tiêu</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map(c => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-dark text-sm">{c.fullName}</div>
                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-tight">Joined: {c.joinedDate}</div>
              </td>
              <td className="px-6 py-4 text-gray-500 text-sm">{c.email}</td>
              <td className="px-6 py-4 font-bold text-dark text-sm">{c.ordersCount}</td>
              <td className="px-6 py-4 font-bold text-primary text-sm">{CartService.formatPrice(c.totalSpent)}</td>
              <td className="px-6 py-4">
                {getStatusBadge(c.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setViewCustomer(c)} className="p-2 text-primary hover:bg-primary/5 rounded-lg border-none bg-transparent cursor-pointer transition-colors" title="Xem chi tiết">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(c.id, c.status === 'active' ? 'inactive' : 'active')} 
                    className={`p-2 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${c.status === 'active' ? 'text-gray-400 hover:bg-gray-100' : 'text-green-500 hover:bg-green-50'}`}
                    title={c.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(c.id, c.status === 'locked' ? 'active' : 'locked')}
                    className={`p-2 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${c.status === 'locked' ? 'text-blue-500 hover:bg-blue-50' : 'text-red-500 hover:bg-red-50'}`}
                    title={c.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewCustomer && (
        <Modal isOpen={true} onClose={() => setViewCustomer(null)} title="Thông tin chi tiết khách hàng">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
                    {viewCustomer.fullName.charAt(0)}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-dark tracking-tight">{viewCustomer.fullName}</h3>
                    <p className="text-gray-500 font-medium">{viewCustomer.email}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                       <Phone className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Số điện thoại</span>
                    </div>
                    <p className="font-bold text-dark">{viewCustomer.phone || 'Chưa cập nhật'}</p>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                       <Clock className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Ngày tham gia</span>
                    </div>
                    <p className="font-bold text-dark">{viewCustomer.joinedDate}</p>
                 </div>
              </div>

              <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 flex items-center justify-between">
                 <div className="text-center flex-1 border-r border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Tổng đơn hàng</p>
                    <p className="text-2xl font-black text-primary">{viewCustomer.ordersCount}</p>
                 </div>
                 <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Tổng chi tiêu</p>
                    <p className="text-2xl font-black text-primary">{CartService.formatPrice(viewCustomer.totalSpent)}</p>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                 <button onClick={() => setViewCustomer(null)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Đóng</button>
              </div>
           </div>
        </Modal>
      )}
    </ViewWrapper>
  );
};

export const AdminStaffs: React.FC = () => {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const loadStaffs = async () => {
    const data = await ApiService.getStaffs();
    const mapped = (data || []).map((x: any) => ({
      id: x.id || x.maNguoiDung || x.MaNguoiDung,
      fullName: x.fullName || x.hoTen || x.HoTen || '',
      email: x.email || x.Email || '',
      phone: x.phone || x.soDienThoai || x.SoDienThoai || '',
      address: x.address || x.diaChi || x.DiaChi || '',
      status: x.status || x.trangThai || x.TrangThai || 'active',
      joinedAt: x.joinedAt || x.ngayThamGia || x.NgayThamGia
    }));
    setStaffs(mapped);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'staff' } }));
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  const openAdd = () => {
    setEditingStaff({ fullName: '', email: '', phone: '', address: '', password: '123456', status: 'active' });
    setIsModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingStaff({ ...s, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff.id) {
      await ApiService.updateStaff(editingStaff.id, editingStaff);
      toast.success('Đã cập nhật nhân viên');
    } else {
      await ApiService.createStaff(editingStaff);
      toast.success('Đã thêm nhân viên');
    }
    setIsModalOpen(false);
    setEditingStaff(null);
    await loadStaffs();
  };

  const handleDelete = async (id: string) => {
    await ApiService.deleteStaff(id);
    toast.success('Đã xóa nhân viên');
    if (viewStaff?.id === id) setViewStaff(null);
    await loadStaffs();
  };

  return (
    <ViewWrapper title="Quản lý Nhân viên" subtitle="Tạo và quản trị tài khoản nhân viên hệ thống.">
      <div className="px-6 py-4 flex justify-end bg-gray-50/50 border-b border-gray-100">
        <button onClick={openAdd} className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 border-none cursor-pointer hover:bg-opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nhân viên</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Liên hệ</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staffs.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Chưa có nhân viên</td></tr>
          ) : staffs.map(s => (
            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-dark text-sm">{s.fullName}</div>
                <div className="text-gray-400 text-xs">{s.email}</div>
              </td>
              <td className="px-6 py-4 text-gray-600 text-sm">
                <div>{s.phone || '--'}</div>
                <div>{s.address || '--'}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${String(s.status).toLowerCase() === 'active' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {String(s.status).toLowerCase() === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setViewStaff(s)} className="p-2 text-primary hover:bg-primary/10 rounded-lg border-none bg-transparent cursor-pointer" title="Xem chi tiết">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg border-none bg-transparent cursor-pointer" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && editingStaff && (
        <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title={editingStaff.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Họ tên *</label>
                <input type="text" value={editingStaff.fullName} onChange={e => setEditingStaff({ ...editingStaff, fullName: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Email *</label>
                <input type="email" value={editingStaff.email} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} required disabled={!!editingStaff.id} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 disabled:opacity-70" />
              </div>
              {!editingStaff.id && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mật khẩu *</label>
                  <input type="text" value={editingStaff.password} onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50" />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Số điện thoại</label>
                <input type="text" value={editingStaff.phone || ''} onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Địa chỉ</label>
                <textarea rows={2} value={editingStaff.address || ''} onChange={e => setEditingStaff({ ...editingStaff, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50"></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Trạng thái</label>
                <select value={editingStaff.status || 'active'} onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Hủy</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white border-none cursor-pointer">Xác nhận</button>
            </div>
          </form>
        </Modal>
      )}

      {viewStaff && (
        <Modal isOpen={true} onClose={() => setViewStaff(null)} title="Chi tiết nhân viên">
          <div className="space-y-4">
            <p><span className="font-bold">Họ tên:</span> {viewStaff.fullName}</p>
            <p><span className="font-bold">Email:</span> {viewStaff.email}</p>
            <p><span className="font-bold">Số điện thoại:</span> {viewStaff.phone || '--'}</p>
            <p><span className="font-bold">Địa chỉ:</span> {viewStaff.address || '--'}</p>
            <p><span className="font-bold">Trạng thái:</span> {viewStaff.status}</p>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => setViewStaff(null)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Đóng</button>
            </div>
          </div>
        </Modal>
      )}
    </ViewWrapper>
  );
};

export const AdminSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewSupplier, setViewSupplier] = useState<any>(null);

  const loadSuppliers = async () => {
    const data = await ApiService.getSuppliers();
    setSuppliers(data);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'suppliers' } }));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleAdd = () => {
    setEditingItem({ name: '', contact: '', phone: '', address: '', email: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xác nhận xóa nhà cung cấp này?')) {
      await ApiService.deleteSupplier(id);
      toast.success('Đã xóa nhà cung cấp');
      loadSuppliers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
      await ApiService.updateSupplier(editingItem.id, editingItem);
      toast.success('Đã cập nhật');
    } else {
      await ApiService.createSupplier(editingItem);
      toast.success('Đã thêm nhà cung cấp');
    }
    setIsModalOpen(false);
    loadSuppliers();
  };

  return (
    <ViewWrapper title="Nhà cung cấp" subtitle="Danh sách đối tác cung ứng hàng hoá.">
      <div className="px-6 py-4 flex justify-end bg-gray-50/50 border-b border-gray-100">
        <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 border-none cursor-pointer hover:bg-opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Thêm nhà cung cấp
        </button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nhà cung cấp</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Người liên hệ</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Liên hệ</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suppliers.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Chưa có dữ liệu</td></tr>
          ) : (
            suppliers.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-dark text-sm">{s.name}</div>
                  <div className="text-gray-400 text-xs">{s.address}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-medium text-sm">{s.contact}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  <div>{s.phone}</div>
                  <div>{s.email}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setViewSupplier(s)} className="p-2 text-primary hover:bg-primary/10 rounded-lg border-none bg-transparent cursor-pointer" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg border-none bg-transparent cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tên công ty *</label>
                  <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all" />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Người liên hệ *</label>
                  <input type="text" value={editingItem.contact} onChange={e => setEditingItem({...editingItem, contact: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all" />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Số điện thoại *</label>
                  <input type="text" value={editingItem.phone} onChange={e => setEditingItem({...editingItem, phone: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all" />
               </div>
               <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Email</label>
                  <input type="email" value={editingItem.email} onChange={e => setEditingItem({...editingItem, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all" />
               </div>
               <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Địa chỉ</label>
                  <textarea rows={2} value={editingItem.address} onChange={e => setEditingItem({...editingItem, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all"></textarea>
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Hủy</button>
               <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white border-none cursor-pointer hover:bg-opacity-90 shadow-md">Xác nhận</button>
            </div>
          </form>
        </Modal>
      )}

      {viewSupplier && (
        <Modal isOpen={true} onClose={() => setViewSupplier(null)} title="Chi tiết nhà cung cấp">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
                {(viewSupplier.name || 'N').charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-dark tracking-tight">{viewSupplier.name || 'Nhà cung cấp'}</h3>
                <p className="text-gray-500 font-medium">{viewSupplier.email || 'Chưa cập nhật email'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Người liên hệ</p>
                <p className="font-bold text-dark">{viewSupplier.contact || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Số điện thoại</p>
                <p className="font-bold text-dark">{viewSupplier.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Địa chỉ</p>
                <p className="font-bold text-dark">{viewSupplier.address || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => setViewSupplier(null)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">Đóng</button>
            </div>
          </div>
        </Modal>
      )}
    </ViewWrapper>
  );
};

export const AdminFinance: React.FC = () => {
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<{
    orders: any[];
    customers: any[];
    staffs: any[];
    vouchers: any[];
  }>({ orders: [], customers: [], staffs: [], vouchers: [] });

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const getRange = () => {
    const base = new Date(anchorDate || new Date().toISOString().slice(0, 10));
    if (periodType === 'day') return { from: startOfDay(base), to: endOfDay(base), label: `Ngày ${base.toLocaleDateString('vi-VN')}` };
    if (periodType === 'week') {
      const day = base.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const from = startOfDay(new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday));
      const to = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6));
      return { from, to, label: `Tuần ${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}` };
    }
    if (periodType === 'month') {
      const from = new Date(base.getFullYear(), base.getMonth(), 1);
      const to = endOfDay(new Date(base.getFullYear(), base.getMonth() + 1, 0));
      return { from, to, label: `Tháng ${base.getMonth() + 1}/${base.getFullYear()}` };
    }
    const from = new Date(base.getFullYear(), 0, 1);
    const to = endOfDay(new Date(base.getFullYear(), 11, 31));
    return { from, to, label: `Năm ${base.getFullYear()}` };
  };

  const inRange = (raw: any, from: Date, to: Date) => {
    const d = raw ? new Date(raw) : null;
    if (!d || Number.isNaN(d.getTime())) return false;
    return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [orders, customers, staffs, vouchers] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getCustomers(),
        ApiService.getStaffs(),
        ApiService.getVouchers(true)
      ]);
      setDataset({ orders: orders || [], customers: customers || [], staffs: staffs || [], vouchers: vouchers || [] });
    } catch {
      toast.error('Không tải được dữ liệu báo cáo');
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'finance' } }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const range = getRange();
  const filteredOrders = dataset.orders.filter((o: any) => inRange(o.createdAt, range.from, range.to));
  const revenue = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const filteredCustomers = dataset.customers.filter((u: any) =>
    inRange(u.ngayThamGia || u.NgayThamGia || u.createdAt || u.CreatedAt, range.from, range.to)
  );
  const filteredStaffs = dataset.staffs.filter((u: any) =>
    inRange(u.ngayThamGia || u.NgayThamGia || u.createdAt || u.CreatedAt, range.from, range.to)
  );
  const filteredVouchers = dataset.vouchers.filter((v: any) =>
    inRange(v.ngayBatDau || v.NgayBatDau, range.from, range.to) ||
    inRange(v.ngayKetThuc || v.NgayKetThuc, range.from, range.to)
  );
  const voucherUsed = filteredVouchers.reduce((sum: number, v: any) => sum + Number(v.daSuDung || v.DaSuDung || 0), 0);

  const reportRows = [
    { metric: 'Đơn hàng', value: filteredOrders.length },
    { metric: 'Doanh thu', value: CartService.formatPrice(revenue) },
    { metric: 'Khách hàng mới', value: filteredCustomers.length },
    { metric: 'Nhân viên tham gia', value: filteredStaffs.length },
    { metric: 'Mã giảm giá hiệu lực', value: filteredVouchers.length },
    { metric: 'Lượt dùng mã giảm giá', value: voucherUsed }
  ];

  const exportExcel = () => {
    const generatedAt = new Date().toLocaleString('vi-VN');
    const reportHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
          .title { font-size: 22px; font-weight: 700; color: #0f172a; }
          .sub { font-size: 12px; color: #64748b; }
          .kpi { border: 1px solid #dbeafe; background: #f8fbff; border-radius: 8px; padding: 10px; min-width: 220px; }
          .kpi-name { font-size: 12px; color: #64748b; }
          .kpi-value { font-size: 16px; font-weight: 700; color: #0284c7; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; font-size: 13px; }
          th { background: #f3f4f6; text-align: left; }
          tr:nth-child(even) td { background: #fafafa; }
          .sign { margin-top: 28px; width: 100%; }
          .sign td { border: none; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="title">VIETSTORE - BÁO CÁO THỐNG KÊ DOANH THU</div>
        <div class="sub">Kỳ báo cáo: ${range.label}</div>
        <div class="sub">Thời gian lập: ${generatedAt}</div>

        <table style="border:none; margin-top: 14px;">
          <tr style="border:none;">
            ${reportRows
              .map(
                (r) => `<td style="border:none; padding:6px;">
                    <div class="kpi">
                      <div class="kpi-name">${r.metric}</div>
                      <div class="kpi-value">${String(r.value)}</div>
                    </div>
                  </td>`
              )
              .join('')}
          </tr>
        </table>

        <table>
          <thead><tr><th>STT</th><th>Hạng mục</th><th>Giá trị</th></tr></thead>
          <tbody>
            ${reportRows
              .map((r, idx) => `<tr><td>${idx + 1}</td><td>${r.metric}</td><td>${String(r.value)}</td></tr>`)
              .join('')}
          </tbody>
        </table>

        <table class="sign">
          <tr>
            <td>Người lập báo cáo<br/><i>(Ký, ghi rõ họ tên)</i></td>
            <td>Quản lý duyệt<br/><i>(Ký, ghi rõ họ tên)</i></td>
          </tr>
        </table>
      </body></html>`;

    const blob = new Blob(['\uFEFF', reportHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-doanh-thu-${periodType}-${anchorDate}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file Excel');
  };

  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Không thể mở cửa sổ in PDF');
      return;
    }
    const generatedAt = new Date().toLocaleString('vi-VN');
    w.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Báo cáo doanh thu</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 26px; color: #1f2937; }
            .title { font-size: 24px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
            .subtitle { color: #6b7280; margin-bottom: 6px; font-size: 13px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0 18px; }
            .kpi { border: 1px solid #dbeafe; background: #f8fbff; border-radius: 8px; padding: 10px 12px; }
            .kpi-name { font-size: 12px; color: #64748b; margin-bottom: 4px; }
            .kpi-value { font-size: 18px; font-weight: 700; color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background: #f3f4f6; font-weight: 700; }
            tr:nth-child(even) td { background: #fafafa; }
            .sign-wrap { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: center; }
            .sign-note { margin-top: 6px; color: #6b7280; font-size: 12px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="title">VIETSTORE - BÁO CÁO THỐNG KÊ DOANH THU</div>
          <div class="subtitle">Khoảng thời gian: ${range.label}</div>
          <div class="subtitle">Thời gian lập: ${generatedAt}</div>
          <div class="kpi-grid">
            ${reportRows
              .map(
                (r) => `
                  <div class="kpi">
                    <div class="kpi-name">${r.metric}</div>
                    <div class="kpi-value">${String(r.value)}</div>
                  </div>
                `
              )
              .join('')}
          </div>
          <table>
            <thead><tr><th>STT</th><th>Chỉ số</th><th>Giá trị</th></tr></thead>
            <tbody>
              ${reportRows.map((r, idx) => `<tr><td>${idx + 1}</td><td>${r.metric}</td><td>${String(r.value)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="sign-wrap">
            <div>
              <div>Người lập báo cáo</div>
              <div class="sign-note">(Ký, ghi rõ họ tên)</div>
            </div>
            <div>
              <div>Quản lý duyệt</div>
              <div class="sign-note">(Ký, ghi rõ họ tên)</div>
            </div>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
    toast.success('Đã mở hộp thoại in PDF');
  };

  return (
    <ViewWrapper title="Thống kê báo cáo" subtitle="Báo cáo đơn hàng / khách hàng / nhân viên / mã giảm giá theo mốc thời gian.">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mốc thời gian</label>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chọn ngày gốc</label>
          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          />
        </div>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-primary text-white font-bold border-none cursor-pointer">Làm mới</button>
        <button onClick={exportExcel} className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold border-none cursor-pointer">Xuất Excel</button>
        <button onClick={exportPdf} className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold border-none cursor-pointer">Xuất PDF</button>
      </div>

      <div className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100">Khoảng lọc: <span className="font-bold text-dark">{range.label}</span></div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Hạng mục</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Giá trị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reportRows.map((r) => (
              <tr key={r.metric} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-semibold text-dark">{r.metric}</td>
                <td className="px-6 py-4 font-bold text-primary">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ViewWrapper>
  );
};


