import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User as UserIcon, MapPin, Heart, ShoppingBag, Plus, Trash2, Edit2, FileText, ExternalLink, Calendar, Truck, AlertCircle, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const { user, wishlist, deleteAddress, saveAddress, toggleWishlist, loadProfile } = useAuthStore();
  const { addToCart } = useCartStore();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Address edit modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressId, setAddressId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Return request form state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returningOrderId, setReturningOrderId] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);

  // Reload profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Fetch orders when activeTab becomes 'orders'
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchCustomerOrders();
    }
  }, [activeTab]);

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_URL}/orders/my-orders`);
      if (res.data.success) {
        setOrders(res.data.list);
      }
    } catch (err) {
      console.error('Failed to load customer orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePincodeLookup = async (pin) => {
    if (pin.length === 6) {
      try {
        const res = await axios.get(`${API_URL}/pincodes/check/${pin}`);
        if (res.data.success) {
          setCity(res.data.city);
          setState(res.data.state);
          setAddressError('');
        }
      } catch (err) {
        setAddressError('Invalid or unserviceable pincode.');
        setCity('');
        setState('');
      }
    }
  };

  const handleOpenAddressModal = (addr = null) => {
    setAddressError('');
    if (addr) {
      setAddressId(addr._id);
      setFullName(addr.fullName);
      setPhone(addr.phone);
      setAddressLine1(addr.addressLine1);
      setAddressLine2(addr.addressLine2 || '');
      setLandmark(addr.landmark || '');
      setPincode(addr.pincode);
      setCity(addr.city);
      setState(addr.state);
      setIsDefault(addr.isDefault);
    } else {
      setAddressId('');
      setFullName(user?.name || '');
      setPhone('');
      setAddressLine1('');
      setAddressLine2('');
      setLandmark('');
      setPincode('');
      setCity('');
      setState('');
      setIsDefault(user?.savedAddresses?.length === 0);
    }
    setAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!city || !state) {
      setAddressError('Please provide a valid serviceable pincode.');
      return;
    }

    const payload = {
      addressId: addressId || undefined,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      isDefault
    };

    const res = await saveAddress(payload);
    if (res && res.success) {
      setAddressModalOpen(false);
    } else {
      setAddressError(res?.message || 'Failed to save address.');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/orders/${returningOrderId}/return`, { reason: returnReason });
      if (res.data.success) {
        setReturnSuccess(true);
        fetchCustomerOrders();
        // Refresh selected details modal if open
        if (selectedOrder && selectedOrder._id === returningOrderId) {
          setSelectedOrder(res.data.order);
        }
        setTimeout(() => {
          setReturnModalOpen(false);
          setReturnSuccess(false);
          setReturnReason('');
        }, 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Return request failed.');
    }
  };

  const handleWishlistAddToCart = (prod) => {
    // Select first variant
    if (prod.variants && prod.variants.length > 0) {
      addToCart(prod, prod.variants[0], 1);
    } else {
      // Fetch details first (or fallback)
      alert('Variant parameters missing.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-mist text-ink/70';
      case 'paid':
      case 'processing': return 'bg-pine/10 text-pine';
      case 'shipped': return 'bg-brass/10 text-brass';
      case 'delivered': return 'bg-pine text-bone';
      case 'refunded': return 'bg-brass text-bone';
      case 'cancelled': return 'bg-signal/10 text-signal';
      default: return 'bg-mist';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bone flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-signal animate-bounce" />
        <p className="text-sm font-semibold">Please authenticate to access your profile.</p>
        <Link to="/login" className="px-6 py-2 bg-pine text-bone rounded-full text-xs font-semibold">Login Now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Navigation Tabs menu */}
      <aside className="lg:col-span-3 space-y-3 bg-bone border border-mist p-5 rounded-2xl">
        <div className="flex items-center gap-3 pb-4 border-b border-mist">
          <div className="p-2.5 bg-pine/5 border border-pine/10 rounded-full text-pine">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm text-ink block">{user.name}</h2>
            <span className="text-[10px] text-ink/40 font-semibold">{user.email}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2">
          {[
            { label: 'Profile Summary', tab: 'profile', icon: UserIcon },
            { label: 'Saved Addresses', tab: 'addresses', icon: MapPin },
            { label: 'Wishlist Capsule', tab: 'wishlist', icon: Heart },
            { label: 'Order History', tab: 'orders', icon: ShoppingBag }
          ].map(t => {
            const isActive = activeTab === t.tab;
            return (
              <button
                key={t.tab}
                onClick={() => setSearchParams({ tab: t.tab })}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left uppercase tracking-wide ${
                  isActive 
                    ? 'bg-pine text-bone shadow-sm' 
                    : 'text-ink/60 hover:bg-mist/30 hover:text-ink'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Content area */}
      <main className="lg:col-span-9 bg-bone border border-mist rounded-3xl p-6 md:p-8 min-h-[50vh]">
        {/* TAB 1: Profile Summary */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="font-display font-bold text-xl text-ink uppercase tracking-tight pb-3 border-b border-mist">
              Account Overview
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-ink/40 uppercase font-bold tracking-widest block">Account Name</span>
                <span className="font-semibold text-ink text-sm block">{user.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink/40 uppercase font-bold tracking-widest block">Email Address</span>
                <span className="font-semibold text-ink text-sm block">{user.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink/40 uppercase font-bold tracking-widest block">Customer ID</span>
                <span className="font-mono text-ink/60 block">{user._id}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink/40 uppercase font-bold tracking-widest block">Joined Vestra</span>
                <span className="font-semibold text-ink block">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Address book */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-mist">
              <h3 className="font-display font-bold text-xl text-ink uppercase tracking-tight">
                Saved Addresses
              </h3>
              <button 
                onClick={() => handleOpenAddressModal()}
                className="py-2 px-4 bg-pine text-bone text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5 hover:bg-pine/90"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.savedAddresses?.length === 0 ? (
                <div className="sm:col-span-2 py-12 text-center text-xs text-ink/40 font-semibold">
                  No saved addresses found. Add one to speed up checkouts!
                </div>
              ) : (
                user.savedAddresses?.map((addr) => (
                  <div key={addr._id} className="p-4 bg-bone border border-mist rounded-2xl space-y-3 relative font-medium text-xs">
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 bg-pine/10 text-pine text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Default
                      </span>
                    )}
                    <div className="text-ink space-y-1">
                      <p className="font-bold text-sm">{addr.fullName}</p>
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p>Phone: {addr.phone}</p>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-mist/50 text-[10px] uppercase font-bold">
                      <button 
                        onClick={() => handleOpenAddressModal(addr)}
                        className="text-pine flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => deleteAddress(addr._id)}
                        className="text-signal flex items-center gap-1 hover:underline"
                        disabled={addr.isDefault && user.savedAddresses.length > 1}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Wishlist capsule */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            <h3 className="font-display font-bold text-xl text-ink uppercase tracking-tight pb-3 border-b border-mist">
              My Wishlist Capsule
            </h3>

            {user.wishlist?.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink/40 font-semibold">
                Your wishlist capsule is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.wishlist?.map((prod) => (
                  <div key={prod._id} className="group border border-mist bg-bone rounded-2xl overflow-hidden relative text-xs flex flex-col justify-between">
                    <button 
                      onClick={() => toggleWishlist(prod._id)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-bone/90 hover:bg-bone border border-mist rounded-full text-signal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link to={`/products/${prod.slug}`}>
                      <div className="aspect-square bg-mist/20 overflow-hidden border-b border-mist/40">
                        <img src={prod.images?.[0]} alt="" className="object-cover w-full h-full" />
                      </div>
                      <div className="p-3">
                        <span className="text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">{prod.category}</span>
                        <h4 className="font-display font-semibold text-ink block leading-snug line-clamp-1 group-hover:text-pine">{prod.name}</h4>
                      </div>
                    </Link>

                    <div className="px-3 pb-3">
                      <button
                        onClick={() => handleWishlistAddToCart(prod)}
                        className="w-full py-2 bg-pine text-bone font-bold text-[10px] uppercase rounded-full hover:bg-pine/90 transition-all flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="font-display font-bold text-xl text-ink uppercase tracking-tight pb-3 border-b border-mist">
              Purchase History
            </h3>

            {loadingOrders ? (
              <div className="py-12 text-center text-xs text-ink/50">
                Loading orders list...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink/40 font-semibold">
                You have not placed any orders yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-mist/80 rounded-2xl p-4 md:p-5 space-y-4 bg-bone hover:border-mist transition-colors">
                    {/* Item header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[10px] text-ink/40 uppercase block">Order Number</span>
                        <span className="font-mono text-ink text-sm block">{order.orderNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-ink/40 uppercase block">Date Placed</span>
                        <span className="text-ink flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-ink/40" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-ink/40 uppercase block">Order Total</span>
                        <span className="text-pine font-display font-bold text-sm block">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order summary products thumbnail lists */}
                    <div className="flex gap-2 items-center overflow-x-auto py-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="w-10 h-10 rounded-lg overflow-hidden border border-mist/60 shrink-0 bg-mist/10" title={item.name}>
                          <img src={item.image} alt="" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-3 border-t border-mist/40 text-[10px] uppercase font-bold">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-pine hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Order details & Track
                      </button>

                      {order.invoiceUrl && (
                        <a 
                          href={`${BASE_URL}${order.invoiceUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brass hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Download Invoice
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 1. Address Create / Edit Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-lg w-full shadow-xl relative animate-[scale-up_0.3s_ease-out]">
            <h4 className="font-display font-bold text-lg text-ink uppercase tracking-tight mb-4">
              {addressId ? 'Edit Address' : 'New Address'}
            </h4>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  required 
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
                />
                <input 
                  type="tel" 
                  required 
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  required 
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPincode(pin);
                    handlePincodeLookup(pin);
                  }}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
                />
                <input type="text" readOnly disabled placeholder="City" value={city} className="w-full bg-mist/40 border border-mist rounded-full py-2 px-4 text-xs text-ink/50" />
                <input type="text" readOnly disabled placeholder="State" value={state} className="w-full bg-mist/40 border border-mist rounded-full py-2 px-4 text-xs text-ink/50" />
              </div>

              <input 
                type="text" 
                required 
                placeholder="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
              />
              <input 
                type="text" 
                placeholder="Address Line 2 (Optional)"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
              />
              <input 
                type="text" 
                placeholder="Landmark (Optional)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="defaultAddr" 
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-pine" 
                />
                <label htmlFor="defaultAddr" className="text-xs text-ink/70">Set as default address</label>
              </div>

              {addressError && <p className="text-xs text-signal font-semibold">{addressError}</p>}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setAddressModalOpen(false)}
                  className="w-1/2 py-2.5 border border-mist bg-bone text-ink font-bold text-xs uppercase rounded-full"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-pine text-bone font-bold text-xs uppercase rounded-full"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Expanded Order Tracking Modal Details Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-2xl w-full shadow-xl max-h-[85vh] overflow-y-auto relative animate-[scale-up_0.3s_ease-out]">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-mist text-ink"
            >
              <Trash2 className="w-5 h-5 hidden" /> {/* dummy */}
              <span className="font-bold text-sm py-1 px-2.5 border border-mist rounded-full bg-bone hover:bg-mist transition-colors cursor-pointer block">Close</span>
            </button>

            <h4 className="font-display font-extrabold text-lg text-ink uppercase tracking-wide border-b border-mist pb-3 mb-4">
              Track Order Details
            </h4>

            {/* Stepper tracking */}
            <div className="bg-mist/10 border border-mist/40 p-4 rounded-2xl mb-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-ink/50 block mb-3">Order Status Pipeline</span>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                <div className="text-center space-y-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    selectedOrder.status !== 'cancelled' ? 'bg-pine text-bone' : 'bg-mist text-ink/30'
                  }`}>✓</span>
                  <span>Placed</span>
                </div>
                <div className="flex-1 h-0.5 bg-mist" />
                <div className="text-center space-y-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    ['paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-pine text-bone' : 'bg-mist text-ink/30'
                  }`}>
                    {['paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status) ? '✓' : '2'}
                  </span>
                  <span>Paid</span>
                </div>
                <div className="flex-1 h-0.5 bg-mist" />
                <div className="text-center space-y-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    ['shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-pine text-bone' : 'bg-mist text-ink/30'
                  }`}>
                    {['shipped', 'delivered'].includes(selectedOrder.status) ? '✓' : '3'}
                  </span>
                  <span>Shipped</span>
                </div>
                <div className="flex-1 h-0.5 bg-mist" />
                <div className="text-center space-y-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    selectedOrder.status === 'delivered' ? 'bg-pine text-bone' : 'bg-mist text-ink/30'
                  }`}>
                    {selectedOrder.status === 'delivered' ? '✓' : '4'}
                  </span>
                  <span>Delivered</span>
                </div>
              </div>
            </div>

            {/* Order info details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold mb-6">
              <div>
                <span className="text-[10px] text-ink/40 uppercase block mb-1">Shipping Snapshot Address</span>
                <div className="text-ink/80 leading-relaxed font-medium">
                  <p className="font-bold">{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-ink/40 uppercase block mb-1">Pricing Breakdown</span>
                <div className="space-y-1 text-ink/80 font-medium">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{selectedOrder.pricing.subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-brass"><span>Discount:</span><span>-₹{selectedOrder.pricing.discount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Shipping:</span><span>₹{selectedOrder.pricing.shipping.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>GST:</span><span>₹{selectedOrder.pricing.tax.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold text-pine text-sm pt-1 border-t border-mist/30">
                    <span>Grand Total:</span><span>₹{selectedOrder.pricing.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table list */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] text-ink/40 uppercase font-bold block mb-1">Items Ordered</span>
              <div className="border border-mist rounded-2xl overflow-hidden divide-y divide-mist bg-bone">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 items-center text-xs">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-mist bg-mist/20">
                      <img src={item.image} alt="" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-grow">
                      <span className="font-semibold text-ink block">{item.name}</span>
                      <span className="text-[10px] text-ink/50 uppercase font-bold tracking-wider">
                        Color: {item.color} | Size: {item.size}
                      </span>
                    </div>
                    <div className="text-right font-semibold">
                      <span className="text-ink/65 block">{item.quantity} x ₹{item.price.toLocaleString('en-IN')}</span>
                      <span className="font-display font-bold text-pine block">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return processing trigger */}
            <div className="flex justify-between items-center border-t border-mist pt-4">
              {selectedOrder.status === 'delivered' && selectedOrder.returnRequest.status === 'none' && (
                <button
                  onClick={() => {
                    setReturningOrderId(selectedOrder._id);
                    setReturnModalOpen(true);
                  }}
                  className="py-2.5 px-6 bg-brass text-bone text-[10px] font-bold uppercase rounded-full hover:bg-brass/90 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Request return
                </button>
              )}
              {selectedOrder.returnRequest.status !== 'none' && (
                <div className="text-xs">
                  <span className="text-[10px] uppercase font-bold text-ink/40 block">Return Status</span>
                  <span className="font-bold text-brass uppercase tracking-wide">
                    Return {selectedOrder.returnRequest.status}
                    {selectedOrder.returnRequest.adminComment && ` (Note: "${selectedOrder.returnRequest.adminComment}")`}
                  </span>
                </div>
              )}

              {selectedOrder.invoiceUrl && (
                <a 
                  href={`${BASE_URL}${selectedOrder.invoiceUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-6 bg-pine text-bone text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5 hover:bg-pine/90"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Invoice PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Return Request Form Modal Overlay */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-sm w-full shadow-2xl relative animate-[scale-up_0.3s_ease-out]">
            <button 
              onClick={() => setReturnModalOpen(false)}
              className="absolute top-4 right-4 text-ink/50 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wide mb-2">
              Request Order Return
            </h4>
            <p className="text-xs text-ink/60 mb-4 leading-relaxed font-medium">
              Returns are allowed within 14 days of delivery. Tags must be intact.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Reason for Return</label>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Incorrect sizing/fit">Incorrect sizing/fit</option>
                  <option value="Item damaged on arrival">Item damaged on arrival</option>
                  <option value="Color mismatch from picture">Color mismatch from picture</option>
                  <option value="Changed mind / Not satisfied">Changed mind / Not satisfied</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-pine text-bone text-xs font-bold rounded-full uppercase flex items-center justify-center gap-1.5"
              >
                Submit Return Request
              </button>
            </form>

            {returnSuccess && (
              <p className="text-xs text-pine font-semibold text-center mt-3 animate-pulse">✓ Return request logged.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
