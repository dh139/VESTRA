import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }] // User-submitted review photo URLs
}, { timestamps: true });

// Index by product for quick PDP loading
reviewSchema.index({ productId: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
