import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, ChevronDown, Check, AlertCircle, Plus, Minus, Camera } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PDP() {
  const { slug } = useParams();
  const { user, wishlist, toggleWishlist } = useAuthStore();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ totalReviews: 0, avgRating: 0, distribution: {} });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [activeVariant, setActiveVariant] = useState(null);
  
  // Hover zoom coordinate states
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  // Accordion drawer states
  const [openAccordion, setOpenAccordion] = useState('description'); // 'description', 'shipping', 'returns'

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Notify Me state
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTargetSize, setNotifyTargetSize] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products/slug/${slug}`);
      if (res.data.success) {
        const prod = res.data.product;
        setProduct(prod);
        setVariants(res.data.variants);
        setReviewsSummary(res.data.reviewsSummary);
        setReviews(res.data.reviews);

        // Pre-select first color/variant on load
        if (res.data.variants.length > 0) {
          const firstVariant = res.data.variants[0];
          setSelectedColor(firstVariant.color);
          
          // Select first available size or default
          const sameColorVars = res.data.variants.filter(v => v.color === firstVariant.color);
          const inStockVar = sameColorVars.find(v => v.stock > 0) || sameColorVars[0];
          setSelectedSize(inStockVar.size);
          setActiveVariant(inStockVar);

        }
        
        if (prod.images?.length > 0) {
          setActiveImage(prod.images[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load product details', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync active variant when color/size selection shifts
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const match = variants.find(v => v.color === selectedColor && v.size === selectedSize);
      setActiveVariant(match || null);
    }
  }, [selectedColor, selectedSize, variants]);

  // Sync active image when color/size selection shifts
  useEffect(() => {
    if (!product || !product.images || product.images.length === 0) return;

    const colorSlug = selectedColor ? selectedColor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
    const sizeSlug = selectedSize ? selectedSize.toLowerCase().trim() : '';

    // 1. Try to match BOTH color and size
    if (colorSlug && sizeSlug) {
      const matchBoth = product.images.find(img => {
        const imgLower = img.toLowerCase();
        return (imgLower.includes(`color=${colorSlug}`) || imgLower.includes(selectedColor.toLowerCase())) &&
               (imgLower.includes(`size=${sizeSlug}`) || imgLower.includes(`size=${selectedSize.toLowerCase()}`));
      });
      if (matchBoth) {
        setActiveImage(matchBoth);
        return;
      }
    }

    // 2. Try to match just color
    if (colorSlug) {
      const matchColor = product.images.find(img => {
        const imgLower = img.toLowerCase();
        return imgLower.includes(`color=${colorSlug}`) || imgLower.includes(selectedColor.toLowerCase());
      });
      if (matchColor) {
        setActiveImage(matchColor);
        return;
      }
    }

    // 3. Try to match just size
    if (sizeSlug) {
      const matchSize = product.images.find(img => {
        const imgLower = img.toLowerCase();
        return imgLower.includes(`size=${sizeSlug}`) || imgLower.includes(`size=${selectedSize.toLowerCase()}`);
      });
      if (matchSize) {
        setActiveImage(matchSize);
        return;
      }
    }

    // 4. Default fallback
    setActiveImage(product.images[0]);
  }, [selectedColor, selectedSize, product]);

  // Handle Zoom-on-Hover Mouse Move
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    
    // Auto-select size in stock for the newly selected color
    const sameColorVars = variants.filter(v => v.color === color);
    const inStockSize = sameColorVars.find(v => v.stock > 0);
    if (inStockSize) {
      setSelectedSize(inStockSize.size);
    } else if (sameColorVars.length > 0) {
      setSelectedSize(sameColorVars[0].size);
    }
  };

  const handleAddToCartClick = () => {
    if (!activeVariant) return;
    addToCart(product, activeVariant, 1);
  };

  const handleWishlistClick = async () => {
    const res = await toggleWishlist(product._id);
    if (res && !res.success) {
      alert(res.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to write a review.');
      return;
    }

    try {
      const payload = {
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImages ? reviewImages.split(',').map(img => img.trim()) : []
      };
      
      const res = await axios.post(`${API_URL}/products/${product._id}/reviews`, payload);
      if (res.data.success) {
        setSubmitSuccess(true);
        setReviewComment('');
        setReviewImages('');
        fetchProductDetails(); // Reload reviews list
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      alert('Review submission failed.');
    }
  };

  const handleNotifyMeClick = (size) => {
    setNotifyTargetSize(size);
    setShowNotifyModal(true);
  };

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySuccess(false);
      setShowNotifyModal(false);
      setNotifyEmail('');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="space-y-4 text-center animate-pulse">
          <div className="w-40 h-8 bg-mist rounded-full mx-auto" />
          <div className="w-80 h-4 bg-mist rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bone flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-signal" />
        <p className="text-sm text-ink/50 font-medium">Silhouette not found.</p>
        <Link to="/shop" className="px-6 py-2.5 bg-pine text-bone text-xs font-semibold rounded-full">Back to Shop</Link>
      </div>
    );
  }

  // Extract unique colors for selectors
  const uniqueColors = [];
  const colorTracker = new Set();
  variants.forEach(v => {
    if (!colorTracker.has(v.color)) {
      colorTracker.add(v.color);
      uniqueColors.push({ color: v.color, hex: v.colorHex });
    }
  });

  const isWishlisted = wishlist.includes(product._id);

  // Reviews photo list extraction
  const reviewPhotos = reviews.reduce((list, r) => {
    if (r.images && r.images.length > 0) {
      list.push(...r.images);
    }
    return list;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20 space-y-16">
      {/* Top Details & Gallery Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left: Sticky Image Gallery */}
        <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4 sticky top-28">
          {/* Thumbnails rail (Desktop) */}
          <div className="hidden md:flex md:col-span-2 flex-col gap-3">
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`aspect-square w-full rounded-xl overflow-hidden border bg-mist/20 transition-all ${
                  activeImage === img ? 'border-pine ring-1 ring-pine' : 'border-mist'
                }`}
              >
                <img src={img} alt="" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>

          {/* Main Zoomable Image Canvas */}
          <div className="md:col-span-10 aspect-square w-full bg-mist/20 border border-mist/50 rounded-3xl overflow-hidden relative">
            <div 
              className="w-full h-full relative cursor-zoom-in group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                src={activeImage} 
                alt={product.name} 
                className="object-cover w-full h-full pointer-events-none transition-transform duration-300"
              />
              
              {/* Zoom Panel Overlay */}
              <div 
                className="absolute inset-0 bg-no-repeat pointer-events-none transition-opacity duration-200"
                style={zoomStyle}
              />
            </div>

            {/* Mobile Swipe selector indicator dots */}
            <div className="flex md:hidden justify-center gap-2 mt-4 absolute bottom-4 inset-x-0">
              {product.images?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-2 h-2 rounded-full ${activeImage === img ? 'bg-pine' : 'bg-mist'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sticky Details Pane */}
        <div className="md:col-span-5 space-y-6">
          {/* Product Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-brass font-display font-bold tracking-widest uppercase block">
                {product.category}
              </span>
              
              {/* Wishlist toggle */}
              <button 
                onClick={handleWishlistClick}
                className="p-2 bg-bone border border-mist hover:bg-mist/30 rounded-full text-ink hover:text-signal transition-all shadow-sm"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-signal text-signal' : 'text-ink'}`} />
              </button>
            </div>
            
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-ink uppercase tracking-tight leading-none">
              {product.name}
            </h1>

            {/* Price tag */}
            <div className="flex items-center gap-3 font-display pt-1">
              {activeVariant ? (
                <>
                  <span className="text-xl font-bold text-pine">
                    ₹{activeVariant.price.toLocaleString('en-IN')}
                  </span>
                  {activeVariant.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price && (
                    <span className="text-sm font-medium text-ink/40 line-through">
                      ₹{activeVariant.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl font-bold text-pine">
                  ₹{product.priceMin?.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Stars summary */}
            {reviewsSummary.totalReviews > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-ink/70">
                <div className="flex text-brass">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(reviewsSummary.avgRating) ? 'fill-brass' : 'text-mist'
                      }`} 
                    />
                  ))}
                </div>
                <span>{reviewsSummary.avgRating} ({reviewsSummary.totalReviews} reviews)</span>
              </div>
            )}
          </div>

          <hr className="border-mist" />

          {/* Color Selector */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">
              Color: <span className="font-medium text-ink/60">{selectedColor}</span>
            </span>
            <div className="flex items-center gap-3">
              {uniqueColors.map((color) => {
                const isActive = selectedColor === color.color;
                const isWhite = color.hex === '#F6F3EE';
                return (
                  <button
                    key={color.color}
                    onClick={() => handleColorChange(color.color)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all relative ${
                      isActive 
                        ? 'ring-2 ring-pine ring-offset-2 scale-110' 
                        : 'border-mist hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isActive && (
                      <Check className={`w-4 h-4 ${isWhite ? 'text-ink' : 'text-bone'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">
              Size
            </span>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'].map((size) => {
                // Find variant for selected color and size
                const sizeVariant = variants.find(v => v.color === selectedColor && v.size === size);
                const isAvailable = sizeVariant && sizeVariant.stock > 0;
                const isSelected = selectedSize === size;

                if (!sizeVariant) return null; // Sizing does not exist for color

                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedSize(size);
                      } else {
                        handleNotifyMeClick(size);
                      }
                    }}
                    className={`h-11 px-5 border rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-pine bg-pine text-bone shadow-sm scale-102' 
                        : isAvailable
                          ? 'border-mist hover:border-ink/50 bg-bone text-ink'
                          : 'border-mist bg-mist/20 text-ink/30 cursor-pointer line-through'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Notification Tag */}
          {activeVariant && (
            <div className="text-xs font-semibold">
              {activeVariant.stock === 0 ? (
                <span className="text-signal flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Out of Stock (Click size to notify)
                </span>
              ) : activeVariant.stock < 5 ? (
                <span className="text-brass flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-4 h-4" /> Only {activeVariant.stock} units left!
                </span>
              ) : (
                <span className="text-pine flex items-center gap-1">
                  ✓ In Stock (Ships in 24 hours)
                </span>
              )}
            </div>
          )}

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCartClick}
            disabled={!activeVariant || activeVariant.stock === 0}
            className="w-full py-4 bg-pine text-bone font-semibold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-pine/90 transition-all duration-300 disabled:bg-mist disabled:text-ink/40 disabled:cursor-not-allowed uppercase tracking-wider hover:scale-[1.01]"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Cart
          </button>

          {/* Accordion drawers */}
          <div className="border border-mist rounded-2xl overflow-hidden mt-6 text-xs bg-bone">
            {/* Description Tab */}
            <div className="border-b border-mist last:border-b-0">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'description' ? '' : 'description')}
                className="w-full py-3 px-4 flex justify-between items-center font-bold text-ink uppercase tracking-wider"
              >
                <span>Description</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'description' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'description' && (
                <div className="p-4 pt-0 text-ink/75 leading-relaxed">
                  {product.description}
                </div>
              )}
            </div>

            {/* Shipping Tab */}
            <div className="border-b border-mist last:border-b-0">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'shipping' ? '' : 'shipping')}
                className="w-full py-3 px-4 flex justify-between items-center font-bold text-ink uppercase tracking-wider"
              >
                <span>Shipping Info</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'shipping' && (
                <div className="p-4 pt-0 text-ink/75 leading-relaxed space-y-1">
                  <p>• Free standard delivery for orders above ₹2,999.</p>
                  <p>• flat ₹150 delivery fees applied under threshold.</p>
                  <p>• Dispatched locally from Ahmedabad warehouse within 24 hours.</p>
                </div>
              )}
            </div>

            {/* Returns Tab */}
            <div className="border-b border-mist last:border-b-0">
              <button 
                onClick={() => setOpenAccordion(openAccordion === 'returns' ? '' : 'returns')}
                className="w-full py-3 px-4 flex justify-between items-center font-bold text-ink uppercase tracking-wider"
              >
                <span>Returns & Exchanges</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'returns' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'returns' && (
                <div className="p-4 pt-0 text-ink/75 leading-relaxed space-y-1">
                  <p>• Returns accepted within 14 days of delivery.</p>
                  <p>• Items must be unused, unwashed, with tags intact.</p>
                  <p>• Returns requested directly from your customer order dashboard.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-mist" />

      {/* Reviews Summary Section */}
      <section className="space-y-10">
        <h2 className="font-display font-bold text-2xl text-ink uppercase tracking-tight">
          Customer Reviews
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left rating summary details */}
          <div className="md:col-span-4 bg-mist/20 border border-mist/40 p-6 rounded-3xl space-y-5">
            <div className="text-center">
              <span className="font-display text-5xl font-extrabold text-pine">
                {reviewsSummary.avgRating || '0.0'}
              </span>
              <div className="flex justify-center text-brass mt-1.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.round(reviewsSummary.avgRating) ? 'fill-brass' : 'text-mist'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-[10px] text-ink/50 font-bold uppercase tracking-wider">
                Based on {reviewsSummary.totalReviews} reviews
              </span>
            </div>

            {/* Star Distribution Bars */}
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsSummary.distribution?.[stars] || 0;
                const pct = reviewsSummary.totalReviews > 0 ? (count / reviewsSummary.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-3 text-ink/70 font-semibold">{stars}</span>
                    <Star className="w-3 h-3 text-brass fill-brass shrink-0" />
                    <div className="flex-1 h-2 bg-mist rounded-full overflow-hidden">
                      <div className="h-full bg-brass rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-ink/50 font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right reviews logs list */}
          <div className="md:col-span-8 space-y-6">
            {/* User Submitted Photos row */}
            {reviewPhotos.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Review Photos</span>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {reviewPhotos.map((photo, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-mist bg-mist/20">
                      <img src={photo} alt="" className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink/40 font-semibold">
                  No reviews submitted yet. Be the first to share your thoughts!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="p-4 bg-bone border border-mist/50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-body font-semibold text-xs text-ink">{rev.userName}</span>
                      <span className="text-[10px] text-ink/40">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex text-brass">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-brass' : 'text-mist'}`} />
                      ))}
                    </div>

                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      {rev.comment}
                    </p>

                    {rev.images?.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {rev.images.map((img, idx) => (
                          <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-mist">
                            <img src={img} alt="" className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <hr className="border-mist" />

            {/* Write a review form */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 bg-mist/10 p-5 border border-mist/40 rounded-2xl">
                <span className="font-display font-semibold text-sm text-ink block uppercase tracking-wide">Write a Review</span>
                
                {/* Rating selection stars */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-brass focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-brass' : 'text-mist'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Review Comment</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Tell us what you think of this piece..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-bone border border-mist rounded-xl py-2 px-4 text-xs font-body focus:outline-none focus:ring-1 focus:ring-pine"
                  />
                </div>

                {/* Optional Review Image url */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-ink/40" /> Review Photo URLs (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://image1.jpg, https://image2.jpg"
                    value={reviewImages}
                    onChange={(e) => setReviewImages(e.target.value)}
                    className="w-full bg-bone border border-mist rounded-full py-2 px-4 text-xs font-body focus:outline-none focus:ring-1 focus:ring-pine"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-pine text-bone text-xs font-semibold rounded-full hover:bg-pine/90"
                >
                  Submit Review
                </button>

                {submitSuccess && (
                  <p className="text-xs text-pine font-semibold">✓ Review submitted successfully!</p>
                )}
              </form>
            ) : (
              <div className="p-4 bg-mist/20 rounded-2xl text-center text-xs font-semibold text-ink/60">
                Please <Link to="/login" className="text-pine underline">login</Link> to write a customer review.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notify Me Modal Panel */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone p-6 rounded-2xl border border-mist max-w-sm w-full shadow-lg relative">
            <button 
              onClick={() => setShowNotifyModal(false)}
              className="absolute top-4 right-4 text-ink/60 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-semibold text-sm text-ink uppercase tracking-wide mb-2">
              Back in Stock Notification
            </h3>
            <p className="text-xs text-ink/60 mb-4 leading-relaxed font-medium">
              We will email you once {product.name} ({selectedColor} / Size {notifyTargetSize}) is restocked.
            </p>

            <form onSubmit={handleNotifySubmit} className="space-y-3">
              <input 
                type="email" 
                required
                placeholder="Enter your email address"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="w-full bg-mist/30 border border-mist rounded-full py-2 px-4 text-xs font-body focus:outline-none"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-pine text-bone text-xs font-bold rounded-full uppercase"
              >
                Notify Me
              </button>
            </form>

            {notifySuccess && (
              <p className="text-xs text-pine font-semibold text-center mt-3">✓ Success! Alert created.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
