import express from 'express';
import Order from '../models/Order.js';
import Variant from '../models/Variant.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get metrics cards data & sales chart (Admin only)
 */
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    // 1. Core counters
    const totalOrdersCount = await Order.countDocuments({});
    
    // Revenue sum (paid, shipped, delivered, processing, refunded)
    const ordersForStats = await Order.find({ 
      status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } 
    });
    const totalRevenue = ordersForStats.reduce((sum, ord) => sum + ord.pricing.total, 0);

    const lowStockCount = await Variant.countDocuments({ stock: { $lt: 5 } });
    const customersCount = await User.countDocuments({ role: 'customer' });

    // 2. Aggregate Top Selling Products
    const productStats = {};
    ordersForStats.forEach(order => {
      order.items.forEach(item => {
        const pId = item.productId.toString();
        if (!productStats[pId]) {
          productStats[pId] = {
            productId: item.productId,
            name: item.name,
            image: item.image || '',
            qtySold: 0,
            revenue: 0
          };
        }
        productStats[pId].qtySold += item.quantity;
        productStats[pId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 3);

    // 3. Status Pipeline breakdown
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusBreakdown = {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0
    };
    statusCounts.forEach(c => {
      if (statusBreakdown[c._id] !== undefined) {
        statusBreakdown[c._id] = c.count;
      }
    });

    // 4. Payment Method breakdown
    const paymentCounts = await Order.aggregate([
      { $group: { _id: '$payment.method', count: { $sum: 1 } } }
    ]);
    const paymentBreakdown = {
      COD: 0,
      Razorpay: 0
    };
    paymentCounts.forEach(c => {
      if (paymentBreakdown[c._id] !== undefined) {
        paymentBreakdown[c._id] = c.count;
      }
    });

    // 5. Analytical sales chart data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
    }).sort({ createdAt: 1 });

    // Group sales by date
    const salesGroup = {};
    recentOrders.forEach(ord => {
      const dateStr = new Date(ord.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!salesGroup[dateStr]) {
        salesGroup[dateStr] = { sales: 0, count: 0 };
      }
      salesGroup[dateStr].sales += ord.pricing.total;
      salesGroup[dateStr].count += 1;
    });

    const chartData = Object.keys(salesGroup).map(date => ({
      date,
      sales: Number(salesGroup[date].sales.toFixed(2)),
      orders: salesGroup[date].count
    }));

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrdersCount,
        lowStockCount,
        customersCount,
        statusBreakdown,
        paymentBreakdown
      },
      topProducts,
      chartData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get paginated, filterable admin audit logs (Admin only)
 */
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
  const { action, entityType, limit = 50, page = 1 } = req.query;
  try {
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const pg = Math.max(1, parseInt(page));
    const lm = Math.max(1, parseInt(limit));
    const skip = (pg - 1) * lm;

    const logs = await AuditLog.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lm);

    const totalLogs = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / lm);

    return res.json({
      success: true,
      logs,
      pagination: {
        page: pg,
        limit: lm,
        totalLogs,
        totalPages
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/admin/customers
 * @desc    Get customer list (Admin only)
 */
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const list = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, customers: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/admin/notifications
 * @desc    Get admin-facing notifications (Low stock, returns etc) (Admin only)
 */
router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const list = await Notification.find({ userId: null }).sort({ createdAt: -1 }).limit(30);
    return res.json({ success: true, list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/admin/notifications/read
 * @desc    Mark all admin notifications as read (Admin only)
 */
router.put('/notifications/read', protect, adminOnly, async (req, res) => {
  try {
    await Notification.updateMany({ userId: null, isRead: false }, { isRead: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
