import mongoose from 'mongoose';

const homepageSectionSchema = new mongoose.Schema({
  sectionType: { 
    type: String, 
    required: true,
    enum: [
      'Hero Banner', 'Featured Collection', 'New Arrivals', 
      'Best Sellers', 'Promotional Banner', 'Testimonials', 'Newsletter'
    ]
  },
  title: { type: String },
  subtitle: { type: String },
  image: { type: String }, // Banner background image URL
  products: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  displayOrder: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);
export default HomepageSection;
