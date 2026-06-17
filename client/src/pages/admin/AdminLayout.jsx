import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderKanban, Sliders, ShieldAlert, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuthStore();

  // Route security gate: restrict to admin users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login?redirect=admin');
      } else if (user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold animate-pulse">Authenticating Administrator...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Stats Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products Catalog', path: '/admin/catalog', icon: FolderKanban },
    { label: 'Orders & Returns', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Homepage Builder', path: '/admin/cms', icon: Sliders },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Activity', path: '/admin/logs', icon: ShieldAlert }
  ];

  return (
    <div className="min-h-screen flex bg-bone text-ink font-body">
      {/* Dark Sidebar Panel (Ink background) */}
      <aside className="w-64 bg-ink text-bone flex flex-col justify-between shrink-0 p-6 border-r border-ink/90">
        <div className="space-y-8">
          <div>
            <Link to="/" className="font-display text-2xl font-bold tracking-tight text-bone flex items-center gap-1">
              VESTRA <span className="text-[9px] bg-pine text-bone px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
            </Link>
            <span className="text-[10px] text-bone/40 block mt-1 uppercase font-display tracking-widest">Store Manager</span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${
                    isActive 
                      ? 'bg-pine text-bone shadow-sm' 
                      : 'text-bone/60 hover:bg-bone/10 hover:text-bone'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-6 border-t border-bone/10 text-xs">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-pine flex items-center justify-center font-bold text-bone">
              {user.name.slice(0, 1)}
            </div>
            <div>
              <span className="font-semibold block line-clamp-1">{user.name}</span>
              <span className="text-[9px] text-bone/45 block">Manager</span>
            </div>
          </div>

          <Link 
            to="/" 
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-bone/60 hover:bg-bone/10 hover:text-bone transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Storefront
          </Link>

          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-signal/95 hover:bg-bone/10 hover:text-signal transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="py-4 px-8 border-b border-mist bg-bone/80 backdrop-blur-sm flex justify-end items-center">
          <span className="text-xs text-ink/50 font-semibold uppercase tracking-wider">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>

        <main className="flex-grow p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
