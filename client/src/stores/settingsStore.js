import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSettingsStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data.success) {
        set({ settings: res.data.settings, loading: false });
        
        // Dynamically update document title from DB configurations
        if (res.data.settings) {
          document.title = res.data.settings.defaultMetaTitle || 'VESTRA | Premium Fashion';
          
          // Inject SEO meta description dynamically
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.getElementsByTagName('head')[0].appendChild(metaDesc);
          }
          metaDesc.content = res.data.settings.defaultMetaDescription || '';
        }
      }
    } catch (err) {
      console.error('Failed to load global configurations', err);
      set({ error: err.message, loading: false });
    }
  }
}));
