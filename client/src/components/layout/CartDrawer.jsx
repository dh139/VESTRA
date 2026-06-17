import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, Tag, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    cartItems, 
    isDrawerOpen, 
    closeDrawer, 
    updateQuantity, 
    removeFromCart, 
    setCheckoutAddress,
    setAppliedCouponCode
  } = useCartStore();

  const [pincode, setPincode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [pincodeMessage, setPincodeMessage] = useState({ text: '', type: '' }); // 'success' or 'error'
  
  const [serverPricing, setServerPricing] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [isServiceable, setIsServiceable] = useState(false);
  const [cityState, setCityState] = useState({ city: '', state: '' });
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Auto-fill pincode if customer has a default address
  useEffect(() => {
    if (user && user.savedAddresses) {
      const defaultAddr = user.savedAddresses.find(a => a.isDefault);
      if (defaultAddr) {
        setPincode(defaultAddr.pincode);
      }
    }
  }, [user]);

  // Recalculate summary from server when cart, coupon, or pincode changes
  useEffect(() => {
    if (!isDrawerOpen || cartItems.length === 0) return;

    const delayDebounceFn = setTimeout(() => {
      fetchCheckoutSummary();
    }, 400); // Debounce typing

    return () => clearTimeout(delayDebounceFn);
  }, [cartItems, pincode, couponCode, isDrawerOpen]);

  const fetchCheckoutSummary = async () => {
    setLoadingPricing(true);
    try {
      const payload = {
        cartItems: cartItems.map(item => ({
          variantId: item.variant._id,
          quantity: item.quantity
        })),
        couponCode: couponCode || undefined,
        pincode: pincode.length === 6 ? pincode : undefined
      };

      const res = await axios.post(`${API_URL}/orders/checkout-summary`, payload);
      
      if (res.data.success) {
        setServerPricing(res.data.pricing);
        
        // Pincode deliverability check
        if (pincode.length === 6) {
          if (res.data.deliverability.serviceable) {
            setIsServiceable(true);
            const city = res.data.deliverability.city;
            const state = res.data.deliverability.state;
            setCityState({ city, state });
            setPincodeMessage({ 
              text: `✓ Serviceable: Delivers to ${city}, ${state}`, 
              type: 'success' 
            });

            // Store address defaults in cart store
            setCheckoutAddress({
              fullName: user?.name || '',
              phone: user?.phone || '',
              addressLine1: '',
              addressLine2: '',
              landmark: '',
              pincode,
              city,
              state,
              country: 'India'
            });
          } else {
            setIsServiceable(false);
            setPincodeMessage({ text: '✗ Out of serviceable area.', type: 'error' });
          }
        } else {
          setIsServiceable(false);
          setPincodeMessage({ text: '', type: '' });
        }

        // Coupon state
        if (couponCode) {
          if (res.data.pricing.discount > 0) {
            setCouponSuccess(`Coupon code applied! Saved ₹${res.data.pricing.discount}`);
            setCouponError('');
            setAppliedCouponCode(couponCode);
          } else {
            setCouponError('Coupon criteria not met.');
            setCouponSuccess('');
          }
        } else {
          setCouponError('');
          setCouponSuccess('');
        }
      }
    } catch (err) {
      console.error(err);
      if (couponCode) {
        setCouponError(err.response?.data?.message || 'Invalid coupon.');
        setCouponSuccess('');
      }
      if (pincode.length === 6) {
        setIsServiceable(false);
        setPincodeMessage({ text: '✗ Service checks failed.', type: 'error' });
      }
    } finally {
      setLoadingPricing(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    if (val.length < 6) {
      setIsServiceable(false);
      setPincodeMessage({ text: '', type: '' });
    }
  };

  const handleCheckoutClick = () => {
    if (!user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
    closeDrawer();
  };

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity" 
        onClick={closeDrawer}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-bone border-l border-mist flex flex-col shadow-xl animate-[slide-in_0.3s_ease-out]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-mist flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-ink">SHOPPING BAG</span>
              <span className="text-xs bg-mist/60 text-ink px-2 py-0.5 rounded-full font-semibold">
                {cartItems.length}
              </span>
            </div>
            <button 
              onClick={closeDrawer}
              className="p-1 rounded-full hover:bg-mist text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-center space-y-4">
                <Truck className="w-10 h-10 text-mist" />
                <p className="text-sm text-ink/50 font-medium">Your bag is empty.</p>
                <button 
                  onClick={closeDrawer}
                  className="px-6 py-2.5 bg-pine text-bone text-xs font-semibold rounded-full hover:bg-pine/90 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* List Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.variant._id} 
                      className="flex gap-4 p-3 bg-bone border border-mist rounded-2xl relative group"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-mist shrink-0 border border-mist">
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name} 
                          className="object-cover w-full h-full"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <span className="font-display font-semibold text-sm text-ink block leading-snug">
                            {item.product.name}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-ink/60 font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              Color: 
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-mist inline-block"
                                style={{ backgroundColor: item.variant.colorHex }}
                              />
                              {item.variant.color}
                            </span>
                            <span>Size: {item.variant.size}</span>
                          </div>
                        </div>

                        {/* Price & Quantity Stepper */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-display font-bold text-sm text-pine">
                            ₹{(item.variant.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                          
                          <div className="flex items-center border border-mist rounded-full bg-bone py-0.5 px-2">
                            <button 
                              onClick={() => updateQuantity(item.variant._id, item.quantity - 1)}
                              className="p-1 text-ink/60 hover:text-ink disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-body text-xs font-bold px-2.5">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.variant._id, item.quantity + 1)}
                              className="p-1 text-ink/60 hover:text-ink"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete */}
                      <button 
                        onClick={() => removeFromCart(item.variant._id)}
                        className="absolute top-2 right-2 p-1.5 text-ink/40 hover:text-signal opacity-0 group-hover:opacity-100 transition-all duration-200"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <hr className="border-mist" />

                {/* Deliverability Check Widget */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink block">
                    Deliverability Check
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit Pincode" 
                      value={pincode}
                      onChange={handlePincodeChange}
                      className="flex-1 bg-mist/40 border border-mist rounded-full py-2 px-4 text-xs font-body focus:outline-none focus:ring-1 focus:ring-pine"
                    />
                  </div>
                  {pincodeMessage.text && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                      pincodeMessage.type === 'success' ? 'text-pine' : 'text-signal'
                    }`}>
                      {pincodeMessage.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{pincodeMessage.text}</span>
                    </div>
                  )}
                </div>

                <hr className="border-mist" />

                {/* Promo Coupon Widget */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink block">
                    Apply Promotional Coupon
                  </label>
                  <div className="flex gap-2 relative">
                    <input 
                      type="text" 
                      placeholder="e.g. LAUNCH20" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-mist/40 border border-mist rounded-full py-2 px-4 text-xs font-body focus:outline-none focus:ring-1 focus:ring-pine uppercase"
                    />
                    <Tag className="w-4 h-4 text-ink/30 absolute right-4 top-2.5" />
                  </div>
                  {couponError && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-signal">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{couponError}</span>
                    </div>
                  )}
                  {couponSuccess && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-pine">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{couponSuccess}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sticky Drawer Summary Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-mist bg-bone/90 backdrop-blur-sm space-y-4">
              <div className="space-y-2 text-xs font-medium text-ink/70">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-ink">₹{serverPricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {serverPricing.discount > 0 && (
                  <div className="flex justify-between text-brass">
                    <span>Coupon Discount</span>
                    <span>-₹{serverPricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <span>{serverPricing.shipping === 0 ? 'FREE' : `₹${serverPricing.shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (12%)</span>
                  <span>₹{serverPricing.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-pine pt-2 border-t border-mist/50">
                  <span>Total Payable</span>
                  <span className="text-base font-display">₹{serverPricing.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={handleCheckoutClick}
                disabled={!isServiceable || loadingPricing}
                className="w-full py-3.5 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all duration-300 disabled:bg-mist disabled:text-ink/40 disabled:cursor-not-allowed uppercase tracking-wider hover:scale-[1.01]"
              >
                {loadingPricing ? (
                  <span>Recalculating...</span>
                ) : !isServiceable ? (
                  <span>Enter Serviceable Pincode</span>
                ) : (
                  <span>Proceed to Checkout</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
