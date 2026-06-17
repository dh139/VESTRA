import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Bell, Menu, X, User as UserIcon, Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

export default function Navbar() {
  const location = useLocation();
  const { user, logout, notifications, markNotificationsAsRead, loadNotifications } = useAuthStore();
  const { cartItems, openDrawer } = useCartStore();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const notifRef = useRef(null);

  // Monitor scroll height to shrink navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications periodically if logged in
  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notification drop-down
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadNotifCount > 0) {
      markNotificationsAsRead();
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop', hasMega: true },
    { label: 'Collections', path: '/shop?category=Collections' }
  ];

  return (
    <>
      <nav 
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'mt-2 px-3 sm:px-4 md:px-8' 
            : 'mt-4 px-4 sm:px-6 md:px-12'
        }`}
      >
        <div 
          className={`mx-auto max-w-7xl rounded-full border border-mist bg-bone/80 shadow-soft backdrop-blur-md transition-all duration-300 ${
            isScrolled 
              ? 'py-2 px-4 sm:px-6' 
              : 'py-3 sm:py-4 px-4 sm:px-8'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-pine hover:opacity-90 transition-opacity"
            >
              VESTRA
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <div 
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.hasMega && setIsMegaMenuOpen(true)}
                  onMouseLeave={() => link.hasMega && setIsMegaMenuOpen(false)}
                >
                  <Link
                    to={link.path}
                    className={`nav-link-underline font-body text-sm font-medium transition-colors duration-200 py-2 px-3 relative z-10 ${
                      location.pathname === link.path && !link.hasMega
                        ? 'text-bone'
                        : 'text-ink hover:text-pine'
                    }`}
                  >
                    {/* Background active pill highlight */}
                    {location.pathname === link.path && !link.hasMega && (
                      <span className="absolute inset-0 bg-pine rounded-full -z-10 transition-all duration-300" />
                    )}
                    {link.label}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {link.hasMega && isMegaMenuOpen && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[600px] transition-all duration-200"
                    >
                      <div className="bg-bone border border-mist rounded-2xl shadow-soft p-6 grid grid-cols-3 gap-6">
                        {/* Men Column */}
                        <div>
                          <Link 
                            to="/shop?category=Men" 
                            className="font-display font-semibold text-pine text-sm hover:underline block mb-2"
                            onClick={() => setIsMegaMenuOpen(false)}
                          >
                            MEN
                          </Link>
                          <ul className="space-y-1.5 text-xs text-ink/70">
                            <li><Link to="/shop?category=Men&subcategory=T-Shirts" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>T-Shirts</Link></li>
                            <li><Link to="/shop?category=Men&subcategory=Shirts" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Shirts</Link></li>
                            <li><Link to="/shop?category=Men&subcategory=Hoodies" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Hoodies</Link></li>
                            <li><Link to="/shop?category=Men&subcategory=Bottomwear" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Bottomwear</Link></li>
                            <li><Link to="/shop?category=Men&subcategory=Outerwear" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Outerwear</Link></li>
                          </ul>
                        </div>

                        {/* Women Column */}
                        <div>
                          <Link 
                            to="/shop?category=Women" 
                            className="font-display font-semibold text-pine text-sm hover:underline block mb-2"
                            onClick={() => setIsMegaMenuOpen(false)}
                          >
                            WOMEN
                          </Link>
                          <ul className="space-y-1.5 text-xs text-ink/70">
                            <li><Link to="/shop?category=Women&subcategory=T-Shirts" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>T-Shirts</Link></li>
                            <li><Link to="/shop?category=Women&subcategory=Shirts" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Shirts</Link></li>
                            <li><Link to="/shop?category=Women&subcategory=Hoodies" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Hoodies</Link></li>
                            <li><Link to="/shop?category=Women&subcategory=Bottomwear" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Bottomwear</Link></li>
                            <li><Link to="/shop?category=Women&subcategory=Outerwear" className="hover:text-pine" onClick={() => setIsMegaMenuOpen(false)}>Outerwear</Link></li>
                          </ul>
                        </div>

                        {/* Accessories & Editorial Tile */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <Link 
                              to="/shop?category=Accessories" 
                              className="font-display font-semibold text-pine text-sm hover:underline block mb-2"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              ACCESSORIES
                            </Link>
                            <Link 
                              to="/shop?category=Collections" 
                              className="font-display font-semibold text-pine text-sm hover:underline block mb-2"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              COLLECTIONS
                            </Link>
                          </div>
                          
                          <div className="mt-4 rounded-xl overflow-hidden relative group aspect-[4/3] bg-mist">
                            <img 
                              src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=300&auto=format&fit=crop&q=80" 
                              alt="Shop the look" 
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-ink/30 p-3 flex items-end">
                              <span className="text-[10px] uppercase tracking-widest text-bone font-medium">Shop the Look</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Utility Icons (Search, Notifications, Profile, Cart) */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Notifications bell dropdown */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={handleNotifClick}
                    className="p-2 rounded-full hover:bg-mist/40 text-ink transition-colors relative"
                    aria-label="Toggle notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1 right-1 bg-signal text-bone text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border border-bone">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Bell Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-bone border border-mist rounded-2xl shadow-soft py-3 z-50">
                      <div className="px-4 pb-2 border-b border-mist flex justify-between items-center">
                        <span className="font-display font-semibold text-xs text-ink">Notifications</span>
                        <span className="text-[10px] text-ink/50">{notifications.length} total</span>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-ink/50">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              className={`px-4 py-2.5 border-b border-mist/50 last:border-b-0 hover:bg-mist/20 transition-colors ${
                                !notif.isRead ? 'bg-pine/5' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-body font-semibold text-xs text-ink block">{notif.title}</span>
                                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-pine shrink-0 mt-1" />}
                              </div>
                              <p className="text-[10px] text-ink/70 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-ink/40 block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist */}
              {user && (
                <Link 
                  to="/wishlist" 
                  className="p-2 rounded-full hover:bg-mist/40 text-ink transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Profile dropdown */}
              {user ? (
                <div className="relative group">
                  <Link 
                    to={user.role === 'admin' ? '/admin' : '/profile'} 
                    className="flex items-center gap-1.5 p-2 sm:p-1.5 sm:pl-3 border border-mist rounded-full hover:bg-mist/30 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-pine" />
                    <span className="hidden sm:inline font-body text-xs font-semibold pr-1">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <div className="absolute right-0 top-full pt-2 w-40 hidden group-hover:block">
                    <div className="bg-bone border border-mist rounded-2xl shadow-soft py-2">
                      {user.role === 'admin' ? (
                        <Link to="/admin" className="block px-4 py-2 text-xs text-ink hover:bg-mist/30">Admin Panel</Link>
                      ) : (
                        <Link to="/profile" className="block px-4 py-2 text-xs text-ink hover:bg-mist/30">My Profile</Link>
                      )}
                      <Link to="/profile?tab=orders" className="block px-4 py-2 text-xs text-ink hover:bg-mist/30">My Orders</Link>
                      <button 
                        onClick={logout} 
                        className="w-full text-left flex items-center gap-1 px-4 py-2 text-xs text-signal hover:bg-mist/30 border-t border-mist/50 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="p-2 rounded-full hover:bg-mist/40 text-ink transition-colors"
                  aria-label="Login"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              )}

              {/* Cart Drawer Trigger */}
              <button 
                onClick={openDrawer}
                className="p-2 rounded-full bg-pine text-bone hover:bg-pine/90 transition-all duration-300 relative flex items-center justify-center hover:scale-[1.05]"
                aria-label="Open Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brass text-ink text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border border-bone animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger menu */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-mist/40 text-ink transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-bone border-l border-mist p-6 flex flex-col justify-between shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6 mt-16">
              <span className="font-display font-bold text-lg text-pine block border-b border-mist pb-2">Navigation</span>
              <ul className="space-y-4 font-body text-sm font-semibold">
                <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pine">Home</Link></li>
                <li>
                  <span className="text-ink/40 text-xs font-display tracking-widest block uppercase mt-2 mb-1">Men</span>
                  <div className="pl-4 space-y-2 text-sm text-ink/75 font-normal">
                    <Link to="/shop?category=Men" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">All Men</Link>
                    <Link to="/shop?category=Men&subcategory=T-Shirts" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">T-Shirts</Link>
                    <Link to="/shop?category=Men&subcategory=Shirts" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">Shirts</Link>
                    <Link to="/shop?category=Men&subcategory=Hoodies" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">Hoodies</Link>
                  </div>
                </li>
                <li>
                  <span className="text-ink/40 text-xs font-display tracking-widest block uppercase mt-2 mb-1">Women</span>
                  <div className="pl-4 space-y-2 text-sm text-ink/75 font-normal">
                    <Link to="/shop?category=Women" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">All Women</Link>
                    <Link to="/shop?category=Women&subcategory=T-Shirts" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">T-Shirts</Link>
                    <Link to="/shop?category=Women&subcategory=Shirts" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">Shirts</Link>
                    <Link to="/shop?category=Women&subcategory=Hoodies" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-pine">Hoodies</Link>
                  </div>
                </li>
                <li><Link to="/shop?category=Accessories" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pine">Accessories</Link></li>
                <li><Link to="/shop?category=Collections" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pine">Collections</Link></li>
              </ul>
            </div>

            <div className="border-t border-mist pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-pine" />
                    <span className="font-body text-xs font-bold text-ink">{user.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                    <Link 
                      to={user.role === 'admin' ? '/admin' : '/profile'} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2 bg-mist/50 rounded-xl"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }} 
                      className="py-2 bg-signal/10 text-signal rounded-xl"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-pine text-bone rounded-xl text-center text-sm font-semibold"
                >
                  <UserIcon className="w-4 h-4" /> Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
