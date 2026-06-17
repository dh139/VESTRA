import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // null can indicate general/admin notifications
  },
  type: { 
    type: String, 
    required: true,
    enum: [
      'Order Placed', 'Payment Received', 'Order Shipped', 'Order Delivered', 
      'Refund Processed', 'Low Stock Alert', 'New Return Request', 
      'Failed Payment Alert', 'New Contact Message'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
