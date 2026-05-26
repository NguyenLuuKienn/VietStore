const SHIPPING_FEE_KEY = 'shop_settings:shipping_fee';
const DEFAULT_SHIPPING_FEE = 30000;

export const SystemConfigService = {
  getShippingFee: (): number => {
    try {
      const raw = localStorage.getItem(SHIPPING_FEE_KEY);
      if (!raw) return DEFAULT_SHIPPING_FEE;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return DEFAULT_SHIPPING_FEE;
      return Math.round(n);
    } catch {
      return DEFAULT_SHIPPING_FEE;
    }
  },

  setShippingFee: (fee: number) => {
    const normalized = Math.max(0, Math.round(Number(fee) || 0));
    localStorage.setItem(SHIPPING_FEE_KEY, String(normalized));
    window.dispatchEvent(new Event('shipping-fee-updated'));
  }
};

