import express from 'express';
import Coupon from '../models/Coupon.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';

const router = express.Router();

/**
 * @route   GET /api/coupons/validate/:code
 * @desc    Validate coupon details against purchase criteria
 */
router.get('/validate/:code', async (req, res) => {
  const { code } = req.params;
  const { subtotal } = req.query; // Send subtotal to check min order limits
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    const now = new Date();
    if (coupon.expiryDate && coupon.expiryDate < now) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired.' });
    }

    if (subtotal && Number(subtotal) < coupon.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `This coupon requires a minimum purchase of ₹${coupon.minOrderValue.toFixed(2)}.` 
      });
    }

    return res.json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/coupons/admin/all
 * @desc    Get all coupons (Admin only)
 */
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/coupons/admin
 * @desc    Create a coupon (Admin only)
 */
router.post('/admin', protect, adminOnly, async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, isActive } = req.body;
  try {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      isActive: isActive !== undefined ? isActive : true
    });

    await coupon.save();

    await logAdminAction({
      req,
      action: 'CREATE_COUPON',
      entityType: 'Coupon',
      entityId: coupon._id,
      newValue: coupon.toObject()
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/coupons/admin/:id
 * @desc    Update a coupon (Admin only)
 */
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const previousValue = coupon.toObject();
    
    const fields = ['code', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscount', 'expiryDate', 'isActive'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'code') {
          coupon.code = req.body[f].toUpperCase();
        } else if (f === 'discountValue' || f === 'minOrderValue' || f === 'maxDiscount') {
          coupon[f] = req.body[f] !== '' ? Number(req.body[f]) : undefined;
        } else if (f === 'expiryDate') {
          coupon[f] = req.body[f] ? new Date(req.body[f]) : undefined;
        } else {
          coupon[f] = req.body[f];
        }
      }
    });

    await coupon.save();

    await logAdminAction({
      req,
      action: 'UPDATE_COUPON',
      entityType: 'Coupon',
      entityId: coupon._id,
      previousValue,
      newValue: coupon.toObject()
    });

    return res.json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/coupons/admin/:id
 * @desc    Delete a coupon (Admin only)
 */
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const previousValue = coupon.toObject();
    await Coupon.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: 'DELETE_COUPON',
      entityType: 'Coupon',
      entityId: req.params.id,
      previousValue
    });

    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
