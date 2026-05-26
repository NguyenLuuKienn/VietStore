import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import Settings from './Settings';
import { AdminOrders, AdminCustomers, AdminStaffs, AdminSuppliers, AdminFinance } from './AdminViews';
import AdminDiscounts from './AdminDiscounts';
import { AuthService } from '../../services/authService';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'staff' | 'suppliers' | 'finance' | 'discounts' | 'settings';

interface AdminRootProps {
  navigateToHome: () => void;
}

const AdminRoot: React.FC<AdminRootProps> = ({ navigateToHome }) => {
  const isStaff = AuthService.isStaff();
  const staffAllowedTabs = useMemo(() => new Set<AdminTab>(['dashboard', 'products', 'orders', 'customers']), []);
  const allTabs = useMemo<AdminTab[]>(() => ['dashboard', 'products', 'categories', 'orders', 'customers', 'staff', 'suppliers', 'finance', 'discounts', 'settings'], []);
  const allowedTabs = useMemo(
    () => (isStaff ? allTabs.filter(t => staffAllowedTabs.has(t)) : allTabs),
    [isStaff, allTabs, staffAllowedTabs]
  );
  const getTabFromUrl = (): AdminTab => {
    const qp = new URLSearchParams(window.location.search).get('tab') as AdminTab | null;
    if (qp && allowedTabs.includes(qp)) return qp;
    return 'dashboard';
  };
  const [activeTab, setActiveTab] = useState<AdminTab>(getTabFromUrl);
  const [mountedTabs, setMountedTabs] = useState<Record<AdminTab, boolean>>({
    dashboard: true,
    products: false,
    categories: false,
    orders: false,
    customers: false,
    staff: false,
    suppliers: false,
    finance: false,
    discounts: false,
    settings: false
  });
  const [readyTabs, setReadyTabs] = useState<Record<AdminTab, boolean>>({
    dashboard: false,
    products: false,
    categories: false,
    orders: false,
    customers: false,
    staff: false,
    suppliers: false,
    finance: false,
    discounts: false,
    settings: false
  });

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
      return;
    }
    setMountedTabs(prev => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
  }, [activeTab, allowedTabs]);

  useEffect(() => {
    const onReady = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: AdminTab }>).detail?.tab;
      if (!tab) return;
      setReadyTabs(prev => ({ ...prev, [tab]: true }));
    };
    window.addEventListener('admin-tab-ready', onReady as EventListener);
    return () => window.removeEventListener('admin-tab-ready', onReady as EventListener);
  }, []);

  useEffect(() => {
    if (readyTabs[activeTab]) return;
    const t = window.setTimeout(() => {
      setReadyTabs(prev => ({ ...prev, [activeTab]: true }));
    }, 8000);
    return () => window.clearTimeout(t);
  }, [activeTab, readyTabs]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [allowedTabs]);

  return (
    <AdminLayout navigateToHome={navigateToHome} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)}>
      {!readyTabs[activeTab] ? (
        <div className="min-h-[55vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
      <>
        {mountedTabs.dashboard && <div className={activeTab === 'dashboard' ? '' : 'hidden'}><Dashboard onTabChange={setActiveTab} /></div>}
        {!isStaff && mountedTabs.categories && <div className={activeTab === 'categories' ? '' : 'hidden'}><Categories /></div>}
        {mountedTabs.products && <div className={activeTab === 'products' ? '' : 'hidden'}><Products /></div>}
        {mountedTabs.orders && <div className={activeTab === 'orders' ? '' : 'hidden'}><AdminOrders /></div>}
        {mountedTabs.customers && <div className={activeTab === 'customers' ? '' : 'hidden'}><AdminCustomers /></div>}
        {!isStaff && mountedTabs.staff && <div className={activeTab === 'staff' ? '' : 'hidden'}><AdminStaffs /></div>}
        {!isStaff && mountedTabs.suppliers && <div className={activeTab === 'suppliers' ? '' : 'hidden'}><AdminSuppliers /></div>}
        {!isStaff && mountedTabs.finance && <div className={activeTab === 'finance' ? '' : 'hidden'}><AdminFinance /></div>}
        {!isStaff && mountedTabs.discounts && <div className={activeTab === 'discounts' ? '' : 'hidden'}><AdminDiscounts /></div>}
        {!isStaff && mountedTabs.settings && <div className={activeTab === 'settings' ? '' : 'hidden'}><Settings /></div>}
      </>
      )}
    </AdminLayout>
  );
};

export default AdminRoot;
