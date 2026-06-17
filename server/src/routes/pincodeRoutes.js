import express from 'express';
import ServiceablePincode from '../models/ServiceablePincode.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';

const router = express.Router();

/**
 * @route   GET /api/pincodes/check/:pincode
 * @desc    Validate deliverability & retrieve City/State
 */
router.get('/check/:pincode', async (req, res) => {
  const { pincode } = req.params;
  try {
    const record = await ServiceablePincode.findOne({ pincode, isActive: true });
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery is not serviceable to this location.' 
      });
    }

    return res.json({ 
      success: true, 
      pincode: record.pincode,
      city: record.city,
      state: record.state
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/pincodes/admin/all
 * @desc    Get all serviceable pincodes (Admin only)
 */
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const list = await ServiceablePincode.find({}).sort({ pincode: 1 });
    return res.json({ success: true, pincodes: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/pincodes/admin
 * @desc    Add a single serviceable pincode (Admin only)
 */
router.post('/admin', protect, adminOnly, async (req, res) => {
  const { pincode, city, state, isActive } = req.body;
  try {
    const existing = await ServiceablePincode.findOne({ pincode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Pincode is already registered.' });
    }

    const record = new ServiceablePincode({
      pincode,
      city,
      state,
      isActive: isActive !== undefined ? isActive : true
    });

    await record.save();

    await logAdminAction({
      req,
      action: 'ADD_PINCODE',
      entityType: 'ServiceablePincode',
      entityId: record._id,
      newValue: record.toObject()
    });

    return res.status(201).json({ success: true, record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/pincodes/admin/:id
 * @desc    Remove a serviceable pincode (Admin only)
 */
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const record = await ServiceablePincode.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Pincode not found.' });
    }

    const previousValue = record.toObject();
    await ServiceablePincode.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: 'REMOVE_PINCODE',
      entityType: 'ServiceablePincode',
      entityId: req.params.id,
      previousValue
    });

    return res.json({ success: true, message: 'Pincode removed from database.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/pincodes/admin/import-csv
 * @desc    Import bulk pincodes using CSV raw text (Admin only)
 */
router.post('/admin/import-csv', protect, adminOnly, async (req, res) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ success: false, message: 'CSV raw text table is required.' });
  }

  try {
    const lines = csvText.split('\n');
    let importedCount = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 3) continue;

      const pincode = parts[0].trim();
      const city = parts[1].trim();
      const state = parts[2].trim();

      // Skip CSV header line
      if (pincode.toLowerCase() === 'pincode') continue;

      // Upsert record
      await ServiceablePincode.findOneAndUpdate(
        { pincode },
        { pincode, city, state, isActive: true },
        { upsert: true, new: true }
      );
      importedCount++;
    }

    await logAdminAction({
      req,
      action: 'IMPORT_PINCODES',
      entityType: 'ServiceablePincode',
      newValue: { count: importedCount }
    });

    return res.json({ success: true, message: `Successfully imported ${importedCount} serviceable pincodes.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
