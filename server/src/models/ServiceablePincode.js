import mongoose from 'mongoose';

const serviceablePincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index pincode for fast lookups
serviceablePincodeSchema.index({ pincode: 1 });

const ServiceablePincode = mongoose.model('ServiceablePincode', serviceablePincodeSchema);
export default ServiceablePincode;
