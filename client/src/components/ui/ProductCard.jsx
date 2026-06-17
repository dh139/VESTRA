import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist } = useAuthStore();
  const [hovered, setHovered] = useState(false);

  const isWishlisted = wishlist.includes(product._id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleWishlist(product._id);
    if (res && !res.success) {
      alert(res.message);
    }
  };

  // Determine pricing display
  const priceMin = product.priceMin || 0;
  const priceMax = product.priceMax || 0;
  const showRange = priceMin !== priceMax;

  // Check if any variant is on sale
  const saleVariant = product.variants?.find(v => v.compareAtPrice && v.compareAtPrice > v.price);
  const discountPercent = saleVariant
    ? Math.round(((saleVariant.compareAtPrice - saleVariant.price) / saleVariant.compareAtPrice) * 100)
    : 0;

  return (
    <Link 
      to={`/products/${product.slug}`}
      className="group bg-bone border border-mist/50 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-soft transition-all duration-300 flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Gallery Container */}
      <div className="aspect-square w-full bg-mist/30 relative overflow-hidden shrink-0 border-b border-mist/30">
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 p-2 bg-bone/90 hover:bg-bone border border-mist/50 rounded-full text-ink hover:text-signal shadow-sm transition-all duration-300 hover:scale-105"
          aria-label="Add to wishlist"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-signal text-signal' : 'text-ink'
            }`} 
          />
        </button>

        {/* Sale Tag */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 z-10 bg-brass text-bone text-[9px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
            {discountPercent}% OFF
          </span>
        )}

        {/* Hover Cross-fade Images */}
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className={`object-cover w-full h-full absolute inset-0 transition-opacity duration-500 ${
            hovered && product.images[1] ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {product.images[1] && (
          <img 
            src={product.images[1]} 
            alt={`${product.name} alternate view`} 
            className={`object-cover w-full h-full absolute inset-0 transition-opacity duration-500 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Details Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-ink/40 font-display font-semibold tracking-widest uppercase block mb-1">
            {product.category}
          </span>
          <h3 className="font-display font-semibold text-sm text-ink leading-tight group-hover:text-pine transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Prices & Buy Now CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-mist/20">
          <div className="flex items-baseline gap-1.5 font-display">
            {showRange ? (
              <span className="text-xs font-bold text-pine">
                ₹{priceMin.toLocaleString('en-IN')} - ₹{priceMax.toLocaleString('en-IN')}
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-pine">
                  ₹{priceMin.toLocaleString('en-IN')}
                </span>
                {saleVariant && (
                  <span className="text-[10px] font-medium text-ink/40 line-through">
                    ₹{saleVariant.compareAtPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="w-full sm:w-auto text-center px-2.5 py-1 bg-pine text-bone text-[9px] font-bold rounded-full uppercase tracking-wider transition-all duration-300 group-hover:bg-pine/90 group-hover:scale-[1.03] select-none shrink-0">
            Buy Now
          </span>
        </div>
      </div>
    </Link>
  );
}
