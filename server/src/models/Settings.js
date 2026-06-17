import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'VESTRA' },
  storeLogo: { type: String, default: '' },
  supportEmail: { type: String, default: 'support@vestra.com' },
  supportPhone: { type: String, default: '+919876543210' },
  freeShippingThreshold: { type: Number, default: 2999 }, // Free shipping for orders above 2999
  shippingCharges: { type: Number, default: 150 }, // Flat shipping charges below threshold
  codEnabled: { type: Boolean, default: true },
  returnWindowDays: { type: Number, default: 14 },
  exchangeWindowDays: { type: Number, default: 14 },
  gstPercentage: { type: Number, default: 12 }, // e.g. 12% GST
  maintenanceMode: { type: Boolean, default: false },
  defaultMetaTitle: { type: String, default: 'VESTRA | Modern Premium Apparel' },
  defaultMetaDescription: { type: String, default: 'Premium fashion brand focused on clean design, quality apparel, and a polished shopping experience.' }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
