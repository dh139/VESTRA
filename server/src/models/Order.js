import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String },
  sku: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true }, // Price at checkout time
  quantity: { type: Number, required: true }
}, { _id: false });

const shippingAddressSnapshotSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: { type: shippingAddressSnapshotSchema, required: true },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 }, // GST amount
    total: { type: Number, required: true }
  },
  payment: {
    method: { type: String, required: true, enum: ['Razorpay', 'COD'] },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  returnRequest: {
    reason: { type: String },
    status: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
    requestedAt: { type: Date },
    resolvedAt: { type: Date },
    adminComment: { type: String }
  },
  invoiceUrl: { type: String } // Stored file/Cloudinary invoice URL
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
