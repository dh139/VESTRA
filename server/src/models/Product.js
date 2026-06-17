import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['New In', 'Men', 'Women', 'Accessories', 'Collections'] 
  },
  subcategory: { 
    type: String, 
    required: true, 
    enum: ['T-Shirts', 'Shirts', 'Hoodies', 'Bottomwear', 'Outerwear', 'None']
  },
  images: [{ type: String }], // Cloudinary URLs or local path fallbacks
  seoTitle: { type: String },
  seoDescription: { type: String }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
