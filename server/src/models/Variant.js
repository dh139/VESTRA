import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  color: { type: String, required: true },
  colorHex: { type: String, required: true }, // Hex code for color swatches, e.g. '#1F3D2B'
  size: { 
    type: String, 
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'] // OS = One Size
  },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number }, // Original price (if on sale)
  stock: { type: Number, required: true, default: 0 }
}, { timestamps: true });

// Create compound index for fast variant lookup by product
variantSchema.index({ productId: 1 });

const Variant = mongoose.model('Variant', variantSchema);
export default Variant;
