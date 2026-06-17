import { create } from 'zustand';

// Seed initial cart state from localStorage
const initialCart = JSON.parse(localStorage.getItem('vestra_cart')) || [];

export const useCartStore = create((set, get) => ({
  cartItems: initialCart,
  isDrawerOpen: false,
  checkoutAddress: null,
  appliedCouponCode: '',

  // Open/Close slide-in drawer
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  // Add item to cart
  addToCart: (product, variant, quantity = 1) => {
    const cartItems = get().cartItems;
    const existingIndex = cartItems.findIndex(item => item.variant._id === variant._id);

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [...cartItems, { product, variant, quantity }];
    }

    localStorage.setItem('vestra_cart', JSON.stringify(updatedCart));
    set({ cartItems: updatedCart, isDrawerOpen: true }); // Automatically open cart drawer on add
  },

  // Update quantity
  updateQuantity: (variantId, newQuantity) => {
    if (newQuantity < 1) return;
    const cartItems = get().cartItems;
    const updatedCart = cartItems.map(item => 
      item.variant._id === variantId 
        ? { ...item, quantity: newQuantity } 
        : item
    );

    localStorage.setItem('vestra_cart', JSON.stringify(updatedCart));
    set({ cartItems: updatedCart });
  },

  // Remove from cart
  removeFromCart: (variantId) => {
    const cartItems = get().cartItems;
    const updatedCart = cartItems.filter(item => item.variant._id !== variantId);

    localStorage.setItem('vestra_cart', JSON.stringify(updatedCart));
    set({ cartItems: updatedCart });
  },

  // Clear cart
  clearCart: () => {
    localStorage.removeItem('vestra_cart');
    set({ cartItems: [], appliedCouponCode: '', checkoutAddress: null });
  },

  // Dynamic client-side subtotal estimate
  getCartSubtotal: () => {
    return get().cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  },

  // Set checkout addresses and coupons
  setCheckoutAddress: (address) => set({ checkoutAddress: address }),
  setAppliedCouponCode: (code) => set({ appliedCouponCode: code })
}));
