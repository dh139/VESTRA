import express from 'express';
import HomepageSection from '../models/HomepageSection.js';
import Variant from '../models/Variant.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';

const router = express.Router();

/**
 * @route   GET /api/cms/homepage
 * @desc    Get all active homepage sections in sorted order
 */
router.get('/homepage', async (req, res) => {
  try {
    const sections = await HomepageSection.find({ isActive: true })
      .populate({
        path: 'products',
        select: 'name slug images description category subcategory'
      })
      .sort({ displayOrder: 1 });

    // Hydrate each populated product with its variants and price range
    const hydratedSections = await Promise.all(sections.map(async (section) => {
      if (section.products && section.products.length > 0) {
        const hydratedProducts = await Promise.all(section.products.map(async (prod) => {
          const vars = await Variant.find({ productId: prod._id });
          
          let priceMin = 0;
          let priceMax = 0;
          if (vars.length > 0) {
            const prices = vars.map(v => v.price);
            priceMin = Math.min(...prices);
            priceMax = Math.max(...prices);
          }

          return {
            ...prod.toObject(),
            variants: vars,
            priceMin,
            priceMax,
            hasDiscount: vars.some(v => v.compareAtPrice && v.compareAtPrice > v.price)
          };
        }));

        const secObject = section.toObject();
        secObject.products = hydratedProducts;
        return secObject;
      }
      return section;
    }));

    return res.json({ success: true, sections: hydratedSections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/cms/admin/sections
 * @desc    Get all homepage sections (Admin only)
 */
router.get('/admin/sections', protect, adminOnly, async (req, res) => {
  try {
    const list = await HomepageSection.find({}).sort({ displayOrder: 1 }).populate('products', 'name slug');
    return res.json({ success: true, sections: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/cms/admin/sections
 * @desc    Create a homepage section (Admin only)
 */
router.post('/admin/sections', protect, adminOnly, async (req, res) => {
  const { sectionType, title, subtitle, image, products, displayOrder, isActive } = req.body;
  try {
    const section = new HomepageSection({
      sectionType,
      title,
      subtitle,
      image,
      products: products || [],
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await section.save();

    await logAdminAction({
      req,
      action: 'CREATE_CMS_SECTION',
      entityType: 'HomepageSection',
      entityId: section._id,
      newValue: section.toObject()
    });

    return res.status(201).json({ success: true, section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/cms/admin/sections/:id
 * @desc    Update a homepage section details (Admin only)
 */
router.put('/admin/sections/:id', protect, adminOnly, async (req, res) => {
  try {
    const section = await HomepageSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const previousValue = section.toObject();

    const fields = ['sectionType', 'title', 'subtitle', 'image', 'products', 'displayOrder', 'isActive'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'displayOrder') {
          section[f] = Number(req.body[f]);
        } else {
          section[f] = req.body[f];
        }
      }
    });

    await section.save();

    await logAdminAction({
      req,
      action: 'UPDATE_CMS_SECTION',
      entityType: 'HomepageSection',
      entityId: section._id,
      previousValue,
      newValue: section.toObject()
    });

    return res.json({ success: true, section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/cms/admin/sections/:id
 * @desc    Delete a homepage section (Admin only)
 */
router.delete('/admin/sections/:id', protect, adminOnly, async (req, res) => {
  try {
    const section = await HomepageSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const previousValue = section.toObject();
    await HomepageSection.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: 'DELETE_CMS_SECTION',
      entityType: 'HomepageSection',
      entityId: req.params.id,
      previousValue
    });

    return res.json({ success: true, message: 'Homepage section deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/cms/admin/sections/reorder
 * @desc    Reorder section display priority in bulk (Admin only)
 */
router.post('/admin/sections/reorder', protect, adminOnly, async (req, res) => {
  const { sectionIds } = req.body; // Array of IDs in display order
  if (!sectionIds || !Array.isArray(sectionIds)) {
    return res.status(400).json({ success: false, message: 'Array of section IDs is required.' });
  }

  try {
    const bulkOps = sectionIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index } }
      }
    }));

    await HomepageSection.bulkWrite(bulkOps);

    await logAdminAction({
      req,
      action: 'REORDER_CMS_SECTIONS',
      entityType: 'HomepageSection',
      newValue: { order: sectionIds }
    });

    return res.json({ success: true, message: 'Homepage sections reordered successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
