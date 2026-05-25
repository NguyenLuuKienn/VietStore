import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { CartService } from '../../services/cartService';
import { TrendingUp, Package, Users, DollarSign, ArrowUpRight, Eye, User, Phone, MapPin, Calendar } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { toast } from '../../lib/toast';

interface DashboardProps {
  onTabChange?: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, revenueGrowth: 0, orderGrowth: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadData = async () => {
    const [summary, orders, products, topProducts] = await Promise.all([
      ApiService.getDashboardStats(),
      ApiService.getOrders(),
      ApiService.getProducts(8, false),
      ApiService.getTopProducts(3)
    ]);

    setStats(summary);
    setRecentOrders(orders.slice(0, 5));

    const topMap = new Map((topProducts || []).map((x: any) => [x.MaSanPham || x.maSanPham, x]));
    const mappedTop = products
      .map(p => ({ ...p, soldCount: topMap.get(p.id)?.SoLuongDaBan || topMap.get(p.id)?.soLuongDaBan || p.soldCount || 0 }))
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 3);

    setBestSellers(mappedTop);
    window.dispatchEvent(new CustomEvent('admin-tab-ready', { detail: { tab: 'dashboard' } }));
  };

  useEffect(() => {
    loadData();
    const onAdminDataChanged = () => loadData();
    window.addEventListener('admin-data-changed', onAdminDataChanged);
    return () => {
      window.removeEventListener('admin-data-changed', onAdminDataChanged);
    };
  }, []);

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      const prevStatus = selectedOrder?.status;
      await ApiService.updateOrder(id, { status: nextStatus });
      if (selectedOrder?.items?.length) {
        if ((nextStatus === 'HoanThanh' || nextStatus === 'Completed') && prevStatus !== 'HoanThanh' && prevStatus !== 'Completed') {
          for (const item of selectedOrder.items) {
            if (item.productId) await ApiService.incrementProductSoldCount(item.productId, item.quantity || 1);
          }
        } else if ((prevStatus === 'HoanThanh' || prevStatus === 'Completed') && nextStatus !== 'HoanThanh' && nextStatus !== 'Completed') {
          for (const item of selectedOrder.items) {
            if (item.productId) await ApiService.incrementProductSoldCount(item.productId, -(item.quantity || 1));
          }
        }
      }
      setIsDetailOpen(false);
      loadData();
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'HoanThanh':
      case 'Completed': return 'bg-green-100 text-green-600 border-green-200';
      case 'DangGiao':
      case 'Shipping': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'ChoXacNhan':
      case 'Pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'DaHuy':
      case 'Cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };


  const openOrderDetail = async (order: any) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    try {
      const detail = await ApiService.getOrderById(order.id);
      const orderRaw = detail?.order || {};
      const itemsRaw = detail?.details || detail?.items || [];
      const items = itemsRaw.map((x: any) => ({
        productId: x.maSanPham || x.MaSanPham || x.productId || '',
        name: x.tenSanPham || x.TenSanPham || x.name || '',
        image: x.urlHinhAnh || x.URLHinhAnh || x.image || '',
        quantity: x.soLuong || x.SoLuong || x.quantity || 0,
        price: Number(x.donGia || x.DonGia || x.price || 0),
        size: x.kichThuoc || x.KichThuoc || x.size || ''
      }));
      const createdAtRaw =
        orderRaw.ngayDatHang ||
        orderRaw.NgayDatHang ||
        detail?.ngayDatHang ||
        detail?.NgayDatHang ||
        order.createdAt;
      setSelectedOrder({
        ...order,
        ...detail,
        createdAt: createdAtRaw,
        customerInfo: {
          fullName: orderRaw.tenKhachHang || orderRaw.TenKhachHang || order.customerInfo?.fullName || '',
          phone: orderRaw.soDienThoai || orderRaw.SoDienThoai || order.customerInfo?.phone || '',
          address: orderRaw.diaChiGiaoHang || orderRaw.DiaChiGiaoHang || order.customerInfo?.address || ''
        },
        items
      });
    } catch {
      setSelectedOrder({ ...order, items: order.items || [] });
      toast.error('Không tải được chi tiết đơn hàng');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-[28px] font-[900] text-dark mb-2">Tổng quan thống kê</h1>
      <p className="text-gray-500 font-medium mb-8">Báo cáo hoạt động kinh doanh hôm nay.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[13px] font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-4 h-4" /> {stats.revenueGrowth}%
            </span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-500 mb-1">Tổng doanh thu</p>
            <h3 className="text-[26px] font-[900] text-dark">{CartService.formatPrice(stats.revenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#FF9F43]/10 text-[#FF9F43] flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[13px] font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-4 h-4" /> {stats.orderGrowth}%
            </span>
          </div>
          <div>
             <p className="text-[14px] font-bold text-gray-500 mb-1">Tổng đơn hàng</p>
             <h3 className="text-[26px] font-[900] text-dark">{stats.orders}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#EA5455]/10 text-[#EA5455] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
             <p className="text-[14px] font-bold text-gray-500 mb-1">Khách hàng mới</p>
             <h3 className="text-[26px] font-[900] text-dark">{stats.customers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#28C76F]/10 text-[#28C76F] flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
             <p className="text-[14px] font-bold text-gray-500 mb-1">Sản phẩm đang bán</p>
             <h3 className="text-[26px] font-[900] text-dark">{stats.products}</h3>
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-[800] text-dark text-[18px]">Đơn hàng gần đây</h3>
            <button 
              onClick={() => onTabChange && onTabChange('orders')}
              className="text-primary font-bold text-[14px] bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order, index) => {
                  const date = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt?._seconds ? new Date(order.createdAt._seconds * 1000) : new Date());
                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-dark text-sm">#{String(order.id || '').toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700 text-sm">{order.customerInfo?.fullName || 'Khách vãng lai'}</div>
                        <div className="text-gray-400 text-[11px]">{date.toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="px-6 py-4 font-[800] text-primary text-sm text-right">{CartService.formatPrice(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold inline-flex border ${getStatusColor(order.status)}`}>
                          {order.status === 'HoanThanh' || order.status === 'Completed'
                            ? 'Hoàn thành'
                            : order.status === 'DangGiao' || order.status === 'Shipping'
                              ? 'Đang giao'
                              : order.status === 'DaHuy' || order.status === 'Cancelled'
                                ? 'Đã hủy'
                                : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openOrderDetail(order)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
          <h3 className="font-[800] text-dark text-[18px] mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {bestSellers.map((item, i) => (
               <div key={item.id || i} className="flex items-center gap-4">
                 <img src={item.images?.[0] || `https://placehold.co/100x100`} className="w-14 h-14 rounded-[10px] object-cover bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
                 <div className="flex-1">
                   <h4 className="font-bold text-dark text-[14px] line-clamp-1 leading-tight">{item.name}</h4>
                   <p className="font-medium text-gray-500 text-[12px]">Đã bán: <span className="text-dark font-bold">{item.soldCount || 0}</span></p>
                 </div>
               </div>
            ))}
            {bestSellers.length === 0 && <p className="text-sm text-gray-500">Chưa có sản phẩm nào.</p>}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Chi tiết đơn hàng #${String(selectedOrder?.id || '').toUpperCase()}`}>
        {isDetailLoading ? (
          <div className="min-h-[280px] flex items-center justify-center">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-dark font-bold text-sm mb-1 uppercase tracking-wider">
                  <User className="w-4 h-4 text-primary" /> Khách hàng
                </div>
                <div className="space-y-1">
                  <p className="text-[14px] font-bold text-dark">{selectedOrder.customerInfo?.fullName}</p>
                  <p className="text-[13px] text-gray-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {selectedOrder.customerInfo?.phone}
                  </p>
                  <p className="text-[13px] text-gray-600 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5" /> {selectedOrder.customerInfo?.address}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-dark font-bold text-sm mb-1 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-primary" /> Đơn hàng
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] text-gray-600 flex items-center justify-between">
                    <span>Phương thức:</span>
                    <span className="font-bold text-dark">COD</span>
                  </p>
              <p className="text-[13px] text-gray-600 flex items-center justify-between">
                <span>Trạng thái:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-[900] bg-white border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status === 'HoanThanh' || selectedOrder.status === 'Completed' ? 'Hoàn thành' : 
                   selectedOrder.status === 'DangGiao' || selectedOrder.status === 'Shipping' ? 'Đang giao' : 
                   selectedOrder.status === 'DaHuy' ? 'Khách hủy' : 'Chờ xử lý'}
                </span>
              </p>
                  <p className="text-[13px] text-gray-600 flex items-center justify-between">
                    <span>Ngày đặt:</span>
                    <span className="font-bold text-dark">
                      {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString('vi-VN') : (selectedOrder.createdAt?._seconds ? new Date(selectedOrder.createdAt._seconds * 1000).toLocaleDateString('vi-VN') : '')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Danh sách sản phẩm
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-50">
                      <img src={item.image || item.product?.images?.[0] || 'https://placehold.co/100x100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark truncate leading-tight mb-1">{item.name || item.product?.name}</p>
                      <p className="text-[11px] font-semibold text-gray-500">SL: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{CartService.formatPrice((item.price || item.product?.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t border-b border-gray-100">
               <span className="text-[15px] font-bold text-dark">Tổng thanh toán:</span>
               <span className="text-[20px] font-[900] text-primary">{CartService.formatPrice(selectedOrder.total)}</span>
            </div>

            <div className="pt-2">
               <h4 className="font-bold text-dark text-sm mb-3">Cập nhật nhanh trạng thái</h4>
               <div className="flex flex-wrap gap-2">
                  {(() => {
                    const currentStatus = selectedOrder.status;
                    let nextPossible: {id: string, label: string, color: string}[] = [];
                    
                    if (currentStatus === 'ChoXacNhan' || currentStatus === 'Pending') {
                      nextPossible = [
                        { id: 'DangGiao', label: 'Giao hàng', color: 'bg-blue-600' },
                        { id: 'DaHuy', label: 'Hủy đơn', color: 'bg-red-500' }
                      ];
                    } else if (currentStatus === 'DangGiao' || currentStatus === 'Shipping') {
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
                        onClick={() => updateStatus(selectedOrder.id, s.id)} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white border-none transition-all cursor-pointer ${s.color} hover:brightness-95 shadow-sm active:scale-95`}
                      >
                        Chuyển sang: {s.label}
                      </button>
                    ));
                  })()}
               </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={() => setIsDetailOpen(false)} className="px-8 py-2.5 bg-dark text-white font-bold rounded-xl hover:bg-opacity-90 transition-all cursor-pointer border-none">Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;


