import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ShoppingBag, CreditCard, ArrowRight, CheckCircle2, ChevronRight, FileText, Download, X } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cartItems, clearCart, checkoutAddress, appliedCouponCode } = useCartStore();

  const [step, setStep] = useState(1); // 1: Address, 2: Review, 3: Payment
  
  // Form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(checkoutAddress?.pincode || '');
  const [city, setCity] = useState(checkoutAddress?.city || '');
  const [state, setState] = useState(checkoutAddress?.state || '');
  const [country, setCountry] = useState('India');
  
  const [pincodeError, setPincodeError] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null); // Success screen details

  // Razorpay Overlay State
  const [showRzpModal, setShowRzpModal] = useState(false);
  const [rzpPayload, setRzpPayload] = useState(null);

  // Pricing summary
  const [serverPricing, setServerPricing] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    codEnabled: false
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !placedOrder) {
      navigate('/shop');
    }
  }, [cartItems, placedOrder]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFullName(user.name);
      const defaultAddr = user.savedAddresses?.find(a => a.isDefault);
      if (defaultAddr) {
        setFullName(defaultAddr.fullName);
        setPhone(defaultAddr.phone);
        setAddressLine1(defaultAddr.addressLine1);
        setAddressLine2(defaultAddr.addressLine2 || '');
        setLandmark(defaultAddr.landmark || '');
        setPincode(defaultAddr.pincode);
        setCity(defaultAddr.city);
        setState(defaultAddr.state);
      }
    }
  }, [user]);

  // Trigger pricing recalculation when cart checkout items load
  useEffect(() => {
    if (cartItems.length > 0) {
      fetchCheckoutSummary();
    }
  }, [step]);

  const fetchCheckoutSummary = async () => {
    try {
      const payload = {
        cartItems: cartItems.map(item => ({
          variantId: item.variant._id,
          quantity: item.quantity
        })),
        couponCode: appliedCouponCode || undefined,
        pincode: pincode.length === 6 ? pincode : undefined
      };

      const res = await axios.post(`${API_URL}/orders/checkout-summary`, payload);
      if (res.data.success) {
        setServerPricing({
          ...res.data.pricing,
          codEnabled: res.data.settings?.codEnabled || false
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-fill City & State on Pincode input
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);

    if (val.length === 6) {
      setCheckingPincode(true);
      setPincodeError('');
      try {
        const res = await axios.get(`${API_URL}/pincodes/check/${val}`);
        if (res.data.success) {
          setCity(res.data.city);
          setState(res.data.state);
        }
      } catch (err) {
        setPincodeError('Pincode is not serviceable.');
        setCity('');
        setState('');
      } finally {
        setCheckingPincode(false);
      }
    } else {
      setCity('');
      setState('');
      setPincodeError('');
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!city || !state) {
      setPincodeError('Enter a valid serviceable pincode.');
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const shippingAddress = {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        pincode,
        city,
        state,
        country
      };

      const payload = {
        cartItems: cartItems.map(item => ({
          variantId: item.variant._id,
          quantity: item.quantity
        })),
        couponCode: appliedCouponCode || undefined,
        shippingAddress,
        paymentMethod
      };

      const res = await axios.post(`${API_URL}/orders/create`, payload);

      if (res.data.success) {
        if (paymentMethod === 'COD') {
          setPlacedOrder(res.data.order);
          clearCart();
        } else if (paymentMethod === 'Razorpay') {
          setRzpPayload(res.data.razorpayConfig);
          setShowRzpModal(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Order creation failed.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Simulate Razorpay Overlay Pay Actions
  const handleSimulatePaymentSuccess = async () => {
    try {
      const payload = {
        razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 10)}`,
        razorpaySignature: `sig_${Math.random().toString(36).substring(2, 10)}`,
        status: 'success'
      };
      
      const res = await axios.post(`${API_URL}/orders/verify-razorpay`, {
        orderId: rzpPayload.order_id, 
        ...payload
      });

      if (res.data.success) {
        setPlacedOrder(res.data.order);
        setShowRzpModal(false);
        clearCart();
      }
    } catch (err) {
      console.error(err);
      alert('Payment simulation success tracking failed. Check console.');
      setShowRzpModal(false);
    }
  };

  const handleSimulatePaymentFailure = async () => {
    try {
      await axios.post(`${API_URL}/orders/verify-razorpay`, {
        orderId: rzpPayload.order_id,
        status: 'failed'
      });
      alert('Simulated payment failure. Order cancelled and items restocked.');
      setShowRzpModal(false);
    } catch (err) {
      console.error(err);
      setShowRzpModal(false);
    }
  };

  // Success Confirmation Screen
  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 text-center space-y-6 animate-[slide-up_0.5s_ease-out]">
        <CheckCircle2 className="w-16 h-16 text-pine mx-auto" />
        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-3xl text-ink uppercase tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-xs text-ink/60 font-semibold uppercase tracking-wider">
            Order Number: {placedOrder.orderNumber}
          </p>
        </div>

        <div className="p-6 bg-mist/20 border border-mist rounded-2xl max-w-md mx-auto text-left text-xs space-y-4 font-medium">
          <span className="font-display font-bold uppercase tracking-wider text-pine block">Delivery Details</span>
          <div className="text-ink/80 space-y-1">
            <p className="font-bold">{placedOrder.shippingAddress.fullName}</p>
            <p>{placedOrder.shippingAddress.addressLine1}</p>
            {placedOrder.shippingAddress.addressLine2 && <p>{placedOrder.shippingAddress.addressLine2}</p>}
            <p>{placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}</p>
            <p>Phone: {placedOrder.shippingAddress.phone}</p>
          </div>
          <div className="flex justify-between border-t border-mist/50 pt-3 text-sm font-bold text-pine">
            <span>Amount Paid</span>
            <span>₹{placedOrder.pricing.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <a 
            href={`${BASE_URL}${placedOrder.invoiceUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all duration-300 hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" /> Download PDF Invoice
          </a>
          
          <Link 
            to="/profile?tab=orders" 
            className="px-8 py-3.5 bg-bone border border-mist text-ink font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-mist/30 transition-all duration-300"
          >
            Track Order History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20">
      {/* Checkout Stepper Progress */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">
        <span className={`${step >= 1 ? 'text-pine font-bold' : ''}`}>1. Shipping Address</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className={`${step >= 2 ? 'text-pine font-bold' : ''}`}>2. Review Order</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className={`${step >= 3 ? 'text-pine font-bold' : ''}`}>3. Secure Payment</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Form Panel */}
        <main className="lg:col-span-8 bg-bone border border-mist rounded-3xl p-6 md:p-8">
          {/* STEP 1: Shipping Address Form */}
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="space-y-5">
              <h2 className="font-display font-bold text-xl text-ink uppercase tracking-tight mb-4">
                Delivery Address
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-pine" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-pine" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">Pincode</label>
                  <input 
                    type="text" 
                    required 
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="Enter 6-digit Pincode"
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-pine" 
                  />
                  {checkingPincode && <span className="text-[9px] text-ink/40 block">Verifying delivery...</span>}
                  {pincodeError && <span className="text-[9px] text-signal font-semibold block">{pincodeError}</span>}
                </div>
                
                {/* Auto-filled fields */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">City (Auto-filled)</label>
                  <input 
                    type="text" 
                    readOnly 
                    disabled
                    value={city}
                    className="w-full bg-mist/40 border border-mist rounded-full py-2.5 px-4 text-xs cursor-not-allowed text-ink/65" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">State (Auto-filled)</label>
                  <input 
                    type="text" 
                    readOnly 
                    disabled
                    value={state}
                    className="w-full bg-mist/40 border border-mist rounded-full py-2.5 px-4 text-xs cursor-not-allowed text-ink/65" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50">Address Line 1</label>
                <input 
                  type="text" 
                  required 
                  value={addressLine1}
                  placeholder="House No, Apartment, Suite, Building"
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50 font-normal">Address Line 2 (Optional)</label>
                  <input 
                    type="text" 
                    value={addressLine2}
                    placeholder="Floor, Street address"
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/50 font-normal">Landmark (Optional)</label>
                  <input 
                    type="text" 
                    value={landmark}
                    placeholder="e.g. Near petrol pump"
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none" 
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto py-3.5 px-8 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all ml-auto uppercase tracking-wider"
              >
                Continue to Review <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Review Order Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display font-bold text-xl text-ink uppercase tracking-tight">
                Review Your Order
              </h2>

              <div className="p-4 bg-mist/20 border border-mist rounded-2xl text-xs space-y-3 font-medium">
                <span className="font-display font-semibold uppercase tracking-wider text-pine block">Shipping Destination</span>
                <div className="text-ink/80 leading-relaxed">
                  <p className="font-bold">{fullName}</p>
                  <p>{addressLine1} {addressLine2 && `, ${addressLine2}`}</p>
                  {landmark && <p>Landmark: {landmark}</p>}
                  <p>{city}, {state} - {pincode}</p>
                  <p>Phone: {phone}</p>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-pine underline text-[10px] font-bold block"
                >
                  Edit Address
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="py-3 px-6 border border-mist bg-bone rounded-full text-xs font-semibold text-ink uppercase"
                >
                  Back
                </button>
                
                <button 
                  onClick={() => setStep(3)}
                  className="py-3.5 px-8 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all ml-auto uppercase tracking-wider"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Secure Payment Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display font-bold text-xl text-ink uppercase tracking-tight">
                Select Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay Option */}
                <button
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                    paymentMethod === 'Razorpay' 
                      ? 'border-pine bg-pine/5 ring-1 ring-pine' 
                      : 'border-mist hover:border-ink/50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-pine shrink-0 mt-0.5" />
                  <div>
                    <span className="font-display font-bold text-sm text-ink block uppercase tracking-wide">Razorpay Checkout</span>
                    <span className="text-[10px] text-ink/60 mt-1 block">Pay securely with Credit Cards, Debit Cards, UPI, or NetBanking.</span>
                  </div>
                </button>

                {/* COD Option */}
                {serverPricing.codEnabled && (
                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                      paymentMethod === 'COD' 
                        ? 'border-pine bg-pine/5 ring-1 ring-pine' 
                        : 'border-mist hover:border-ink/50'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 text-pine shrink-0 mt-0.5" />
                    <div>
                      <span className="font-display font-bold text-sm text-ink block uppercase tracking-wide">Cash On Delivery</span>
                      <span className="text-[10px] text-ink/60 mt-1 block">Pay with cash upon delivery of items.</span>
                    </div>
                  </button>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-mist">
                <button 
                  onClick={() => setStep(2)}
                  className="py-3 px-6 border border-mist bg-bone rounded-full text-xs font-semibold text-ink uppercase"
                >
                  Back
                </button>
                
                <button 
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="py-3.5 px-8 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all ml-auto uppercase tracking-wider disabled:opacity-40"
                >
                  {placingOrder 
                    ? 'Processing Order...' 
                    : paymentMethod === 'COD' 
                      ? 'Confirm COD Order' 
                      : 'Pay & Place Order'
                  }
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sticky Order Summary */}
        <aside className="lg:col-span-4 bg-bone border border-mist rounded-3xl p-6 sticky top-28 space-y-6">
          <span className="font-display font-bold text-xs tracking-widest text-ink block uppercase pb-2 border-b border-mist">
            Your Order Summary
          </span>

          {/* Cart items list */}
          <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.variant._id} className="flex gap-3 text-xs">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-mist bg-mist/20">
                  <img src={item.product.images[0]} alt="" className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <span className="font-body font-semibold text-ink block line-clamp-1 leading-tight">{item.product.name}</span>
                    <span className="text-[9px] text-ink/50 font-bold uppercase tracking-wider block mt-0.5">
                      Qty: {item.quantity} | Size: {item.variant.size}
                    </span>
                  </div>
                  <span className="font-display font-bold text-pine block">
                    ₹{(item.variant.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-mist" />

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-xs font-medium text-ink/70">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
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
              <span>GST Tax (12%)</span>
              <span>₹{serverPricing.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-pine pt-2 border-t border-mist/50">
              <span>Grand Total</span>
              <span className="text-base font-display">₹{serverPricing.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mock Razorpay Gateway Overlay Popup */}
      {showRzpModal && rzpPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-sm">
          <div className="bg-bone border border-mist rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-[scale-up_0.3s_ease-out]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-brass font-display font-bold uppercase tracking-widest block">Razorpay Simulator</span>
                <h3 className="font-display font-extrabold text-lg text-pine uppercase tracking-wide">Secure Checkout</h3>
              </div>
              <button 
                onClick={() => setShowRzpModal(false)}
                className="p-1 rounded-full hover:bg-mist text-ink/50 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-mist/20 p-4 rounded-xl border border-mist text-xs font-medium space-y-2">
              <div className="flex justify-between text-ink/60">
                <span>Merchant</span>
                <span className="text-ink font-bold">VESTRA</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Razorpay Order ID</span>
                <span className="text-ink font-mono">{rzpPayload.order_id}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Amount Payable</span>
                <span className="text-pine font-bold">INR {(rzpPayload.amount / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Currency</span>
                <span className="text-ink">{rzpPayload.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleSimulatePaymentFailure}
                className="py-3 bg-signal/10 text-signal border border-signal/20 font-bold text-xs rounded-full uppercase hover:bg-signal/20 transition-all"
              >
                Simulate Fail
              </button>
              
              <button
                onClick={handleSimulatePaymentSuccess}
                className="py-3 bg-pine text-bone font-bold text-xs rounded-full uppercase hover:bg-pine/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4" /> Simulate Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
