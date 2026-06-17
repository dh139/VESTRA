import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sync token with axios header helper
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Seed initial token
const initialToken = localStorage.getItem('vestra_token');
if (initialToken) {
  setAuthHeader(initialToken);
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: initialToken,
  wishlist: [],
  notifications: [],
  loading: false,
  error: null,

  // Load profile details
  loadProfile: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true, error: null });
    try {
      setAuthHeader(token);
      const res = await axios.get(`${API_URL}/auth/profile`);
      if (res.data.success) {
        set({ 
          user: res.data.user, 
          wishlist: res.data.user.wishlist.map(p => p._id || p),
          loading: false 
        });
        // Check notifications on profile load
        get().loadNotifications();
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      // If unauthorized, clear session
      if (err.response && err.response.status === 401) {
        get().logout();
      }
      set({ loading: false, error: err.response?.data?.message || err.message });
    }
  },

  // Register
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('vestra_token', token);
        setAuthHeader(token);
        set({ token, user, loading: false });
        await get().loadProfile();
        return { success: true };
      }
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || err.message });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Login
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('vestra_token', token);
        setAuthHeader(token);
        set({ token, user, loading: false });
        await get().loadProfile();
        return { success: true };
      }
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || err.message });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Google OAuth Login
  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('vestra_token', token);
        setAuthHeader(token);
        set({ token, user, loading: false });
        await get().loadProfile();
        return { success: true };
      }
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || err.message });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('vestra_token');
    setAuthHeader(null);
    set({ user: null, token: null, wishlist: [], notifications: [] });
  },

  // Add / Edit address
  saveAddress: async (addressData) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/profile/address`, addressData);
      if (res.data.success) {
        set(state => ({
          user: { ...state.user, savedAddresses: res.data.savedAddresses },
          loading: false
        }));
        return { success: true };
      }
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || err.message });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Delete address
  deleteAddress: async (addressId) => {
    try {
      const res = await axios.delete(`${API_URL}/auth/profile/address/${addressId}`);
      if (res.data.success) {
        set(state => ({
          user: { ...state.user, savedAddresses: res.data.savedAddresses }
        }));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Wishlist toggle
  toggleWishlist: async (productId) => {
    if (!get().token) {
      return { success: false, message: 'Please sign in to save items to your wishlist.' };
    }
    try {
      const res = await axios.post(`${API_URL}/auth/wishlist`, { productId });
      if (res.data.success) {
        set({ wishlist: res.data.wishlist });
        // Refresh profile to populate populated wishlist items if necessary
        get().loadProfile();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Load customer notifications
  loadNotifications: async () => {
    if (!get().token) return;
    try {
      const res = await axios.get(`${API_URL}/auth/notifications`);
      if (res.data.success) {
        set({ notifications: res.data.list });
      }
    } catch (err) {
      console.error('Failed to load user notifications', err);
    }
  },

  // Mark all notifications read
  markNotificationsAsRead: async () => {
    if (!get().token) return;
    try {
      const res = await axios.put(`${API_URL}/auth/notifications/read`);
      if (res.data.success) {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }));
      }
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  }
}));
