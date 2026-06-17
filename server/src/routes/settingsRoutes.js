import express from 'express';
import Settings from '../models/Settings.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';

const router = express.Router();

/**
 * Helper to fetch or create the single Settings document
 */
const getOrCreateSettings = async () => {
  let record = await Settings.findOne();
  if (!record) {
    record = await Settings.create({});
  }
  return record;
};

/**
 * @route   GET /api/settings
 * @desc    Get public storefront configurations (GST rate, shipping thresholds, SEO, maintenance mode)
 */
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/settings/admin
 * @desc    Get all configurations (Admin only)
 */
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/settings/admin
 * @desc    Update system configurations (Admin only)
 */
router.put('/admin', protect, adminOnly, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const previousValue = settings.toObject();

    const editableFields = [
      'storeName', 'storeLogo', 'supportEmail', 'supportPhone',
      'freeShippingThreshold', 'shippingCharges', 'codEnabled',
      'returnWindowDays', 'exchangeWindowDays', 'gstPercentage',
      'maintenanceMode', 'defaultMetaTitle', 'defaultMetaDescription'
    ];

    editableFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (
          f === 'freeShippingThreshold' || 
          f === 'shippingCharges' || 
          f === 'returnWindowDays' || 
          f === 'exchangeWindowDays' || 
          f === 'gstPercentage'
        ) {
          settings[f] = Number(req.body[f]);
        } else if (f === 'codEnabled' || f === 'maintenanceMode') {
          settings[f] = Boolean(req.body[f]);
        } else {
          settings[f] = req.body[f];
        }
      }
    });

    await settings.save();

    await logAdminAction({
      req,
      action: 'UPDATE_SETTINGS',
      entityType: 'Settings',
      entityId: settings._id,
      previousValue,
      newValue: settings.toObject()
    });

    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
