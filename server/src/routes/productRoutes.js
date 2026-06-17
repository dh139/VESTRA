import express from 'express';
import Product from '../models/Product.js';
import Variant from '../models/Variant.js';
import Review from '../models/Review.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { logAdminAction } from '../middlewares/audit.js';

const router = express.Router();

// Helper to slugify product names
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * @route   GET /api/products
 * @desc    Get paginated products list with advanced filters
 */
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      search, 
      minPrice, 
      maxPrice, 
      sizes, 
      colors, 
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (subcategory && subcategory !== 'All') query.subcategory = subcategory;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by variant attributes (price, size, color)
    const variantQuery = {};
    let filterByVariant = false;

    if (minPrice || maxPrice) {
      filterByVariant = true;
      variantQuery.price = {};
      if (minPrice) variantQuery.price.$gte = Number(minPrice);
      if (maxPrice) variantQuery.price.$lte = Number(maxPrice);
    }

    if (sizes) {
      filterByVariant = true;
      variantQuery.size = { $in: sizes.split(',') };
    }

    if (colors) {
      filterByVariant = true;
      variantQuery.color = { $in: colors.split(',') };
    }

    if (filterByVariant) {
      const matchingVariants = await Variant.find(variantQuery).select('productId');
      const productIds = matchingVariants.map(v => v.productId);
      query._id = { $in: productIds };
    }

    // Setup pagination
    const pg = Math.max(1, parseInt(page));
    const lm = Math.max(1, parseInt(limit));
    const skip = (pg - 1) * lm;

    // Retrieve products
    let productsQuery = Product.find(query);

    // Apply Sorting
    if (sort === 'newest') {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    } else if (sort === 'name-asc') {
      productsQuery = productsQuery.sort({ name: 1 });
    } else if (sort === 'name-desc') {
      productsQuery = productsQuery.sort({ name: -1 });
    }

    // Fetch products
    let products = await productsQuery.skip(skip).limit(lm);

    // Hydrate each product with its variants and pricing summaries
    const hydratedProducts = await Promise.all(products.map(async (prod) => {
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

    // Perform sorting for price-based criteria (which requires variant hydration)
    let finalProducts = hydratedProducts;
    if (sort === 'price-asc') {
      finalProducts.sort((a, b) => a.priceMin - b.priceMin);
    } else if (sort === 'price-desc') {
      finalProducts.sort((a, b) => b.priceMin - a.priceMin);
    }

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / lm);

    return res.json({
      success: true,
      products: finalProducts,
      pagination: {
        page: pg,
        limit: lm,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get detailed product page (PDP) metadata
 */
router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const variants = await Variant.find({ productId: product._id });
    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: -1 });

    // Calculate stars distribution
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return res.json({
      success: true,
      product,
      variants,
      reviewsSummary: {
        totalReviews,
        avgRating,
        distribution
      },
      reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Submit a product review
 */
router.post('/:id/reviews', protect, async (req, res) => {
  const productId = req.params.id;
  const { rating, comment, images } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const review = new Review({
      productId,
      userId: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment,
      images: images || []
    });

    await review.save();
    return res.status(201).json({ success: true, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/products/admin
 * @desc    Admin raw products list
 */
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    const hydrated = await Promise.all(products.map(async (prod) => {
      const variants = await Variant.find({ productId: prod._id });
      return {
        ...prod.toObject(),
        variants
      };
    }));
    return res.json({ success: true, products: hydrated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a product (Admin only)
 */
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, description, category, subcategory, images, seoTitle, seoDescription } = req.body;
  try {
    let slug = slugify(name);
    
    // Ensure slug uniqueness
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = new Product({
      name,
      slug,
      description,
      category,
      subcategory,
      images: images || [],
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || description.slice(0, 150)
    });

    await product.save();

    // Log admin activity
    await logAdminAction({
      req,
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      newValue: product.toObject()
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product (Admin only)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousValue = product.toObject();
    
    // Assign fields
    const fields = ['name', 'description', 'category', 'subcategory', 'images', 'seoTitle', 'seoDescription'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        product[f] = req.body[f];
      }
    });

    // Update slug if name changes
    if (req.body.name && req.body.name !== previousValue.name) {
      product.slug = slugify(req.body.name);
    }

    await product.save();

    await logAdminAction({
      req,
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      previousValue,
      newValue: product.toObject()
    });

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product and its variants (Admin only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousValue = product.toObject();

    // Delete variants
    await Variant.deleteMany({ productId });
    await Product.findByIdAndDelete(productId);

    await logAdminAction({
      req,
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: productId,
      previousValue
    });

    return res.json({ success: true, message: 'Product and related variants deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/products/variants
 * @desc    Create a variant (Admin only)
 */
router.post('/variants', protect, adminOnly, async (req, res) => {
  const { productId, color, colorHex, size, sku, price, compareAtPrice, stock } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const variantExists = await Variant.findOne({ sku });
    if (variantExists) {
      return res.status(400).json({ success: false, message: 'Variant with this SKU already exists.' });
    }

    const variant = new Variant({
      productId,
      color,
      colorHex,
      size,
      sku,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock)
    });

    await variant.save();

    await logAdminAction({
      req,
      action: 'CREATE_VARIANT',
      entityType: 'Variant',
      entityId: variant._id,
      newValue: variant.toObject()
    });

    return res.status(201).json({ success: true, variant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/products/variants/:variantId
 * @desc    Update a variant (Admin only)
 */
router.put('/variants/:variantId', protect, adminOnly, async (req, res) => {
  const { variantId } = req.params;
  try {
    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    const previousValue = variant.toObject();

    const fields = ['color', 'colorHex', 'size', 'sku', 'price', 'compareAtPrice', 'stock'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'price' || f === 'compareAtPrice' || f === 'stock') {
          variant[f] = req.body[f] !== '' ? Number(req.body[f]) : undefined;
        } else {
          variant[f] = req.body[f];
        }
      }
    });

    await variant.save();

    await logAdminAction({
      req,
      action: 'UPDATE_VARIANT',
      entityType: 'Variant',
      entityId: variantId,
      previousValue,
      newValue: variant.toObject()
    });

    return res.json({ success: true, variant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/products/variants/:variantId
 * @desc    Delete a variant (Admin only)
 */
router.delete('/variants/:variantId', protect, adminOnly, async (req, res) => {
  const { variantId } = req.params;
  try {
    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    const previousValue = variant.toObject();

    await Variant.findByIdAndDelete(variantId);

    await logAdminAction({
      req,
      action: 'DELETE_VARIANT',
      entityType: 'Variant',
      entityId: variantId,
      previousValue
    });

    return res.json({ success: true, message: 'Variant deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
