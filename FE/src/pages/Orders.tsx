import React, { useState, useEffect } from 'react';
import { Package, Eye, Loader2, MapPin, Phone, User as UserIcon, Calendar, CreditCard } from 'lucide-react';
import { AccountService } from '../services/accountService';
import { CartService } from '../services/cartService';
import Modal from '../components/common/Modal';
import { ApiService } from '../services/apiService';
import { toast } from '../lib/toast';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const getPaymentMethodText = (method?: string) => {
    const m = String(method || '').toUpperCase();
    if (m === 'VNPAY') return 'VNPAY';
    if (m === 'COD') return 'COD';
    return method || 'COD';
  };

  const openOrderDetail = async (order: any) => {
    try {
      const detail = await AccountService.getOrderById(order.id);
      const orderRaw = detail?.order || {};
      const itemsRaw = detail?.details || detail?.items || [];
      const items = itemsRaw.map((x: any) => ({
        name: x.tenSanPham || x.TenSanPham || x.name || '',
        image: x.urlHinhAnh || x.URLHinhAnh || x.image || '',
        quantity: x.soLuong || x.SoLuong || x.quantity || 0,
        price: Number(x.donGia || x.DonGia || x.price || 0),
        size: x.kichThuoc || x.KichThuoc || x.size || ''
      }));
      setSelectedOrder({
        ...order,
        ...detail,
        paymentMethod: orderRaw.phuongThucThanhToan || orderRaw.PhuongThucThanhToan || order.paymentMethod || 'COD',
        customerInfo: {
          fullName: orderRaw.tenKhachHang || orderRaw.TenKhachHang || order.customerInfo?.fullName || '',
          phone: orderRaw.soDienThoai || orderRaw.SoDienThoai || order.customerInfo?.phone || '',
          address: orderRaw.diaChiGiaoHang || orderRaw.DiaChiGiaoHang || order.customerInfo?.address || ''
        },
        items,
        itemsCount: items.length || order.itemsCount || 0
      });
    } catch {
      setSelectedOrder({ ...order, items: order.items || [] });
    }
    setIsDetailOpen(true);
  };

  const loadOrders = async () => {
    const data = await AccountService.getMyOrders();
    setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const canCancel = (status: string) => status === 'ChoXacNhan' || status === 'Pending';

  const cancelOrder = async (orderId: string) => {
    if (!orderId || cancellingOrderId === orderId) return;
    setCancellingOrderId(orderId);
    try {
      await ApiService.updateOrder(orderId, { status: 'DaHuy' });
      try {
        await loadOrders();
      } catch {
        // Do not treat refresh failure as cancel failure.
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'DaHuy' } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'DaHuy' }));
      }
      toast.success('Đã hủy đơn hàng');
    } catch {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setCancellingOrderId(null);
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
      case 'ChoThanhToan': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'DaHuy':
      case 'Cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'HoanThanh':
      case 'Completed': return 'Giao thành công';
      case 'DangGiao':
      case 'Shipping': return 'Đang vận chuyển';
      case 'ChoXacNhan':
      case 'Pending': return 'Chờ xác nhận';
      case 'ChoThanhToan': return 'Chờ thanh toán';
      case 'DaHuy':
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Chờ thanh toán') return order.status === 'ChoThanhToan';
    if (activeTab === 'Chờ xác nhận') return order.status === 'ChoXacNhan' || order.status === 'Pending';
    if (activeTab === 'Đang vận chuyển') return order.status === 'DangGiao' || order.status === 'Shipping';
    if (activeTab === 'Hoàn thành') return order.status === 'HoanThanh' || order.status === 'Completed';
    if (activeTab === 'Đã hủy') return order.status === 'DaHuy' || order.status === 'Cancelled';
    return true;
  });

  return (
    <main className="flex-1 bg-bg py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-10 max-w-5xl">
        <h1 className="text-[24px] sm:text-[28px] font-[800] text-dark flex items-center gap-3 mb-8">
          <span className="w-2.5 h-8 bg-primary rounded-full"></span>
          Đơn Hàng Của Tôi
        </h1>

        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {['Tất cả', 'Chờ thanh toán', 'Chờ xác nhận', 'Đang vận chuyển', 'Hoàn thành', 'Đã hủy'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-bold text-[15px] whitespace-nowrap border-b-[3px] border-t-0 border-l-0 border-r-0 cursor-pointer transition-colors bg-white ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Bạn chưa có đơn hàng nào trong mục này</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="border border-gray-100 rounded-[16px] p-5 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-[12px] flex items-center justify-center text-primary shrink-0">
                      <Package className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col justify-center h-14">
                      <h3 className="font-[800] text-dark text-[14px] sm:text-[17px] m-0 mb-1 leading-none">#{order.id.substring(0, 8).toUpperCase()}</h3>
                      <div className="text-[14px] font-medium text-gray-500 flex items-center gap-2">
                        <span>Ngày đặt: {order.date}</span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                        <span>{order.itemsCount} sản phẩm</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 w-full md:w-auto">
                    <div className={`px-3 py-1 rounded-[8px] border text-[13px] font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                    <div className="font-[900] text-primary text-[20px]">
                      {CartService.formatPrice(order.total)}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => openOrderDetail(order)}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-50 hover:bg-primary/10 hover:text-primary text-dark font-bold rounded-[8px] border border-gray-200 hover:border-primary/30 transition-colors cursor-pointer text-sm w-full md:w-auto justify-center"
                      >
                        <Eye className="w-4 h-4" /> Chi tiết
                      </button>
                      {canCancel(order.status) && (
                        <button
                          disabled={cancellingOrderId === order.id}
                          onClick={() => cancelOrder(order.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-[8px] border border-red-200 transition-colors cursor-pointer text-sm w-full md:w-auto justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {cancellingOrderId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Chi tiết đơn hàng #${selectedOrder?.id?.substring(0, 8).toUpperCase()}`}
          maxWidth="max-w-2xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-dark font-bold text-sm mb-1 uppercase tracking-wider">
                    <UserIcon className="w-4 h-4 text-primary" /> Thông tin nhận hàng
                  </div>
                  <div className="space-y-2">
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
                    <Calendar className="w-4 h-4 text-primary" /> Thông tin đơn hàng
                  </div>
                  <div className="space-y-2">
                    <p className="text-[13px] text-gray-600 flex items-center justify-between">
                      <span>Ngày đặt:</span>
                      <span className="font-bold text-dark">{selectedOrder.date}</span>
                    </p>
                    <p className="text-[13px] text-gray-600 flex items-center justify-between">
                      <span>Trạng thái:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-[900] ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </p>
                    <p className="text-[13px] text-gray-600 flex items-center justify-between">
                      <span>Thanh toán:</span>
                      <span className="font-bold text-dark flex items-center gap-1 italic">
                        <CreditCard className="w-3.5 h-3.5" /> {getPaymentMethodText(selectedOrder.paymentMethod)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Danh sách sản phẩm ({selectedOrder.itemsCount})
                </h4>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                          <img src={item.image || item.product?.images?.[0] || 'https://placehold.co/100x100'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-dark truncate leading-tight mb-1">{item.name || item.product?.name}</p>
                          <p className="text-xs font-semibold text-gray-500">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{CartService.formatPrice((item.price || item.product?.price) * item.quantity)}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{CartService.formatPrice(item.price || item.product?.price)} / sp</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>Tạm tính:</span>
                    <span>{CartService.formatPrice(selectedOrder.total - 30000)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>Phí vận chuyển:</span>
                    <span>30.000đ</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[16px] font-bold text-dark">Tổng tiền:</span>
                    <span className="text-[22px] font-[900] text-primary">{CartService.formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <div className="flex gap-3">
                  {canCancel(selectedOrder.status) && (
                    <button
                      disabled={cancellingOrderId === selectedOrder.id}
                      onClick={() => cancelOrder(selectedOrder.id)}
                      className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {cancellingOrderId === selectedOrder.id ? 'Đang hủy...' : 'Hủy đơn'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-8 py-2.5 bg-dark text-white font-bold rounded-xl hover:bg-opacity-90 transition-all cursor-pointer border-none"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
};

export default Orders;
