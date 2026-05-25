import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartService } from '../services/cartService';

interface CartProps {
  onBack: () => void;
  navigateToHome: () => void;
  navigateToCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ onBack, navigateToHome, navigateToCheckout }) => {
  const [items, setItems] = React.useState(CartService.getCartItems());
  const subTotal = CartService.getCartTotal();
  const shipping = 30000;
  const total = items.length > 0 ? subTotal + shipping : 0;

  React.useEffect(() => {
    const updateItems = () => setItems([...CartService.getCartItems()]);
    window.addEventListener('cart-updated', updateItems);
    return () => window.removeEventListener('cart-updated', updateItems);
  }, []);

  const handleUpdateQuantity = async (id: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty > 0) {
      await CartService.updateQuantity(id, newQty);
    }
  };

  const handleRemoveItem = async (id: number) => {
    await CartService.removeItem(id);
  };

  return (
    <main className="flex-1 bg-bg py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-dark hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0 block">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[24px] sm:text-[28px] font-[800] text-dark m-0">Giỏ hàng của bạn</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white rounded-[20px] p-4 sm:p-6 shadow-sm border border-gray-100">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium mb-4">Giỏ hàng của bạn đang trống</p>
                <button onClick={navigateToHome} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors border-none cursor-pointer">
                  Tiếp tục mua hàng
                </button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 py-6 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
                  <img src={item.image} alt={item.name} className="w-24 h-32 object-cover rounded-[10px]" referrerPolicy="no-referrer" />
                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left w-full h-full">
                    <h3 className="font-bold text-dark text-[16px] mb-1 leading-snug">{item.name}</h3>
                    <span className="text-sm text-gray-500 mb-2 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">Size: {item.size}</span>
                    <div className="font-[800] text-primary text-[18px] sm:mt-auto">{CartService.formatPrice(item.price)}</div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto h-full gap-3 mt-4 sm:mt-0">
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-[10px] border border-gray-200 shadow-sm">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        className="bg-white rounded-md border border-gray-200 p-1 cursor-pointer text-gray-500 hover:text-primary hover:border-primary transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-[800] w-6 text-center text-dark text-[15px]">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        className="bg-white rounded-md border border-gray-200 p-1 cursor-pointer text-gray-500 hover:text-primary hover:border-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 text-sm font-semibold hover:bg-red-50 px-3 py-1.5 rounded-md flex items-center gap-1.5 border-none bg-transparent cursor-pointer transition-colors sm:mt-auto"
                    >
                      <Trash2 className="w-[18px] h-[18px]" /> Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <aside className="w-full lg:w-[350px]">
              <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(100,197,227,0.1)] border border-primary/20 sticky top-[140px]">
                <h3 className="text-[18px] font-[800] text-dark mb-6 flex items-center gap-2">
                  Tóm tắt đơn hàng
                </h3>
                
                <div className="space-y-4 mb-6 text-[15px]">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Tạm tính ({items.length} sp)</span>
                    <span className="font-bold text-dark">{CartService.formatPrice(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Phí giao hàng</span>
                    <span className="font-bold text-dark">{CartService.formatPrice(shipping)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                    <span className="font-bold text-dark">Tổng cộng</span>
                    <span className="font-[900] text-[22px] text-primary">{CartService.formatPrice(total)}</span>
                  </div>
                </div>

                <button onClick={navigateToCheckout} className="w-full py-4 bg-primary text-white font-bold text-[16px] rounded-[12px] hover:bg-opacity-90 shadow-[0_4px_12px_rgba(100,197,227,0.3)] transition-all cursor-pointer border-none mb-3">
                  Tiến Hành Thanh Toán
                </button>
                <button onClick={navigateToHome} className="w-full py-3 bg-primary/10 text-primary font-bold text-[15px] rounded-[12px] hover:bg-primary hover:text-white transition-all cursor-pointer border-none">
                  Tiếp tục mua hàng
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
};

export default Cart;
