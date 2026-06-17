import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/layout/CartDrawer';
import Footer from './components/layout/Footer';

// Storefront Pages
import Home from './pages/storefront/Home';
import PLP from './pages/storefront/PLP';
import PDP from './pages/storefront/PDP';
import Checkout from './pages/storefront/Checkout';
import UserProfile from './pages/storefront/UserProfile';
import Login from './pages/storefront/Login';
import MaintenancePage from './pages/storefront/MaintenancePage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CatalogManager from './pages/admin/CatalogManager';
import OrderManager from './pages/admin/OrderManager';
import HomepageBuilder from './pages/admin/HomepageBuilder';
import SettingsManager from './pages/admin/SettingsManager';
import AuditLogs from './pages/admin/AuditLogs';

// Zustand Stores
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore';

// Scroll to top on navigation change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Storefront Layout Wrapper (Navbar and Footer included)
function StorefrontLayout() {
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();

  if (settings?.maintenanceMode && user?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<PLP />} />
          <Route path="/products/:slug" element={<PDP />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/wishlist" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <CartDrawer />
      <Footer />
    </div>
  );
}

export default function App() {
  const { fetchSettings } = useSettingsStore();
  const { loadProfile } = useAuthStore();

  // Load configuration and authentication profile on mount
  useEffect(() => {
    fetchSettings();
    loadProfile();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin Dashboard Routes Group */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="catalog" element={<CatalogManager />} />
          <Route path="orders" element={<OrderManager />} />
          <Route path="cms" element={<HomepageBuilder />} />
          <Route path="settings" element={<SettingsManager />} />
          <Route path="logs" element={<AuditLogs />} />
        </Route>

        {/* Storefront Layout Routes Group */}
        <Route path="/*" element={<StorefrontLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
