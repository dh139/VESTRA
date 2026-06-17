import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Variant from '../models/Variant.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import ServiceablePincode from '../models/ServiceablePincode.js';
import Settings from '../models/Settings.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';
import { notify } from '../utils/notificationDispatcher.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';

const router = express.Router();

// Helper to calculate pricing server-side
const calculateCartPricing = async (cartItems, couponCode, pincode) => {
  let subtotal = 0;
  const hydratedItems = [];

  // 1. Calculate items subtotal and verify stock
  for (const item of cartItems) {
    const variant = await Variant.findById(item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found.`);
    }
    
    const product = await Product.findById(variant.productId);
    if (!product) {
      throw new Error(`Product for variant ${variant.sku} not found.`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name} (${variant.color}/${variant.size}). Only ${variant.stock} left.`);
    }

    const itemPrice = variant.price;
    const itemSubtotal = itemPrice * item.quantity;
    subtotal += itemSubtotal;

    hydratedItems.push({
      productId: product._id,
      variantId: variant._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] || '',
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: itemPrice,
      quantity: item.quantity
    });
  }

  // 2. Load system configurations
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({}); // Seed default if not exists
  }

  // 3. Pincode deliverability check
  let deliverability = { serviceable: true, city: '', state: '' };
  if (pincode) {
    const pinDetails = await ServiceablePincode.findOne({ pincode, isActive: true });
    if (!pinDetails) {
      deliverability.serviceable = false;
    } else {
      deliverability.city = pinDetails.city;
      deliverability.state = pinDetails.state;
    }
  } else {
    deliverability.serviceable = false; // Cannot deliver without pincode
  }

  // 4. Calculate coupon discount
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      const now = new Date();
      if (!coupon.expiryDate || coupon.expiryDate > now) {
        if (subtotal >= coupon.minOrderValue) {
          appliedCoupon = coupon;
          if (coupon.discountType === 'percentage') {
            const calculatedDiscount = subtotal * (coupon.discountValue / 100);
            discount = coupon.maxDiscount 
              ? Math.min(calculatedDiscount, coupon.maxDiscount) 
              : calculatedDiscount;
          } else if (coupon.discountType === 'flat') {
            discount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }
  }

  // 5. Calculate shipping charges
  let shipping = 0;
  if (subtotal > 0 && subtotal < settings.freeShippingThreshold) {
    shipping = settings.shippingCharges;
  }

  // 6. Calculate GST (Tax)
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (settings.gstPercentage / 100);

  // 7. Calculate Grand Total
  const total = taxableAmount + shipping + tax;

  return {
    items: hydratedItems,
    pricing: {
      subtotal,
      discount,
      shipping,
      tax,
      total
    },
    deliverability,
    settings: {
      codEnabled: settings.codEnabled,
      freeShippingThreshold: settings.freeShippingThreshold,
      shippingCharges: settings.shippingCharges
    }
  };
};

/**
 * @route   POST /api/orders/checkout-summary
 * @desc    Get server-side pricing breakdown and service check
 */
router.post('/checkout-summary', async (req, res) => {
  const { cartItems, couponCode, pincode } = req.body;
  try {
    // Check maintenance mode
    const settings = await Settings.findOne() || {};
    if (settings.maintenanceMode) {
      // Check if requester is an admin
      let userRole = '';
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const secret = process.env.JWT_SECRET;
          if (!secret) {
            throw new Error('JWT_SECRET environment variable is missing.');
          }
          const decoded = jwt.verify(token, secret);
          const user = await User.findById(decoded.id);
          if (user) userRole = user.role;
        } catch (err) {
          // Token failed verification, treat as guest/customer
        }
      }
      if (userRole !== 'admin') {
        return res.status(503).json({ success: false, message: 'Storefront is currently under maintenance.' });
      }
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const summary = await calculateCartPricing(cartItems, couponCode, pincode);
    return res.json({ success: true, ...summary });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/orders/create
 * @desc    Checkout and place order (COD / Razorpay)
 */
router.post('/create', protect, async (req, res) => {
  const { cartItems, couponCode, shippingAddress, paymentMethod } = req.body;
  try {
    // Check maintenance mode
    const settings = await Settings.findOne() || {};
    if (settings.maintenanceMode && req.user.role !== 'admin') {
      return res.status(503).json({ success: false, message: 'Storefront is currently under maintenance. Orders are temporarily disabled.' });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }
    if (!shippingAddress || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    // 1. Recalculate everything server-side for integrity
    const summary = await calculateCartPricing(cartItems, couponCode, shippingAddress.pincode);
    
    if (!summary.deliverability.serviceable) {
      return res.status(400).json({ success: false, message: 'Pincode is not serviceable for delivery.' });
    }

    // Auto-fill city and state from DB verification
    const addressSnapshot = {
      ...shippingAddress,
      city: summary.deliverability.city,
      state: summary.deliverability.state,
      country: 'India'
    };

    // 2. Safe inventory decrement
    for (const item of summary.items) {
      const variant = await Variant.findById(item.variantId);
      if (variant.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Stock depletion during check out for item: ${item.name}` });
      }
    }

    // Decrement stock
    for (const item of summary.items) {
      const updatedVariant = await Variant.findByIdAndUpdate(
        item.variantId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      // Low stock alert trigger
      if (updatedVariant.stock < 5) {
        await notify(
          null,
          'Low Stock Alert',
          'Low Stock Warning',
          `Variant SKU ${updatedVariant.sku} is low on stock (${updatedVariant.stock} left).`
        );
      }
    }

    // 3. Generate Order Number
    const orderNumber = `VES${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    const order = new Order({
      orderNumber,
      userId: req.user._id,
      items: summary.items,
      shippingAddress: addressSnapshot,
      pricing: summary.pricing,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      status: 'pending'
    });

    if (paymentMethod === 'COD') {
      order.status = 'processing';
      order.payment.status = 'pending';
      
      // Save order
      await order.save();
      
      // Generate PDF Invoice
      const invoiceUrl = await generateInvoice(order);
      order.invoiceUrl = invoiceUrl;
      await order.save();

      // Trigger user notification
      await notify(
        req.user._id,
        'Order Placed',
        'Order Placed Successfully',
        `Your order ${orderNumber} is processing. Total amount is ₹${order.pricing.total.toFixed(2)}.`
      );

      return res.status(201).json({ success: true, order });
    } else if (paymentMethod === 'Razorpay') {
      // Simulate Razorpay order parameters
      order.payment.razorpayOrderId = `rzp_order_${Math.random().toString(36).substring(2, 12)}`;
      await order.save();

      if (!process.env.RAZORPAY_KEY_ID) {
        throw new Error('RAZORPAY_KEY_ID environment variable is missing.');
      }

      return res.status(201).json({ 
        success: true, 
        order,
        razorpayConfig: {
          key: process.env.RAZORPAY_KEY_ID,
          amount: Math.round(order.pricing.total * 100), // in paise
          currency: 'INR',
          name: 'VESTRA',
          description: `Order ${orderNumber}`,
          order_id: order.payment.razorpayOrderId
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/orders/verify-razorpay
 * @desc    Simulated payment signature check and invoice output trigger
 */
router.post('/verify-razorpay', protect, async (req, res) => {
  const { orderId, razorpayPaymentId, razorpaySignature, status = 'success' } = req.body;
  try {
    let order;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ 'payment.razorpayOrderId': orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (status === 'success') {
      order.payment.status = 'paid';
      order.payment.razorpayPaymentId = razorpayPaymentId || `pay_${Math.random().toString(36).substring(2, 10)}`;
      order.payment.razorpaySignature = razorpaySignature || `sig_${Math.random().toString(36).substring(2, 10)}`;
      order.status = 'paid';
      
      await order.save();

      // Generate invoice
      const invoiceUrl = await generateInvoice(order);
      order.invoiceUrl = invoiceUrl;
      await order.save();

      // Dispatch notifications
      await notify(
        order.userId,
        'Payment Received',
        'Payment Verified',
        `Payment of ₹${order.pricing.total.toFixed(2)} for Order ${order.orderNumber} is confirmed.`
      );

      return res.json({ success: true, order });
    } else {
      order.payment.status = 'failed';
      order.status = 'cancelled';
      await order.save();

      // Restock items since payment failed
      for (const item of order.items) {
        await Variant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } });
      }

      await notify(
        order.userId,
        'Failed Payment Alert',
        'Payment Failed',
        `Payment for order ${order.orderNumber} failed. Order cancelled and items restocked.`
      );

      return res.status(400).json({ success: false, message: 'Payment failed validation.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    List customer orders
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const list = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    
    // Check permission
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/orders/:id/return
 * @desc    Request a return on delivered order
 */
router.post('/:id/return', protect, async (req, res) => {
  const { reason } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Returns are only permitted on delivered orders.' });
    }

    // Verify returns window
    const settings = await Settings.findOne() || {};
    const returnLimitDays = settings.returnWindowDays || 14;
    const orderDate = new Date(order.updatedAt);
    const timeDiff = Date.now() - orderDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff > returnLimitDays) {
      return res.status(400).json({ success: false, message: `Return window of ${returnLimitDays} days has expired.` });
    }

    order.returnRequest = {
      reason,
      status: 'requested',
      requestedAt: new Date()
    };

    await order.save();

    // Notify admin
    await notify(
      null,
      'New Return Request',
      'New Return Initiated',
      `Order ${order.orderNumber} requested return for: "${reason}".`
    );

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/orders/admin/all
 * @desc    Admin order listing (Admin only)
 */
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/orders/admin/:id/status
 * @desc    Update order status (Admin only)
 */
router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousValue = { status: order.status };
    order.status = status;
    await order.save();

    // Log admin action
    await logAdminAction({
      req,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'Order',
      entityId: order._id,
      previousValue,
      newValue: { status }
    });

    // Notify customer
    let notifyTitle = '';
    let notifyMessage = '';
    if (status === 'shipped') {
      notifyTitle = 'Order Shipped';
      notifyMessage = `Your order ${order.orderNumber} is shipped and on the way!`;
    } else if (status === 'delivered') {
      notifyTitle = 'Order Delivered';
      notifyMessage = `Your order ${order.orderNumber} has been delivered successfully.`;
    }

    if (notifyTitle) {
      await notify(order.userId, status === 'shipped' ? 'Order Shipped' : 'Order Delivered', notifyTitle, notifyMessage);
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/orders/admin/:id/return
 * @desc    Approve/Reject Return (Admin only)
 */
router.put('/admin/:id/return', protect, adminOnly, async (req, res) => {
  const { status, adminComment } = req.body; // 'approved' or 'rejected'
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.returnRequest.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'No active return request for this order.' });
    }

    const previousValue = { returnRequest: order.returnRequest, status: order.status };

    order.returnRequest.status = status;
    order.returnRequest.resolvedAt = new Date();
    order.returnRequest.adminComment = adminComment || '';

    if (status === 'approved') {
      order.status = 'refunded';
      
      // Restock items
      for (const item of order.items) {
        await Variant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } });
      }

      await notify(
        order.userId,
        'Refund Processed',
        'Return Approved & Refunded',
        `Your return request for order ${order.orderNumber} was approved. Item restocked and refund initiated.`
      );
    } else if (status === 'rejected') {
      await notify(
        order.userId,
        'Refund Processed',
        'Return Request Rejected',
        `Your return request for order ${order.orderNumber} was declined. Reason: ${adminComment || 'N/A'}`
      );
    }

    await order.save();

    await logAdminAction({
      req,
      action: 'RESOLVE_RETURN',
      entityType: 'Order',
      entityId: order._id,
      previousValue,
      newValue: { returnRequest: order.returnRequest, status: order.status }
    });

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
