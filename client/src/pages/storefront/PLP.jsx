import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../../components/ui/ProductCard';

const API_URL = 'http://localhost:5000/api';

const COLOR_SWATCHES = [
  { name: 'Pine Green', hex: '#1F3D2B' },
  { name: 'Bone White', hex: '#F6F3EE' },
  { name: 'Ink Black', hex: '#14110F' },
  { name: 'Brass Gold', hex: '#B08968' },
  { name: 'Brass Brown', hex: '#B08968' },
  { name: 'Mist Gray', hex: '#E4E1D8' }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];

export default function PLP() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters state from query parameters
  const categoryFilter = searchParams.get('category') || '';
  const subcategoryFilter = searchParams.get('subcategory') || '';
  const sortOption = searchParams.get('sort') || 'newest';

  // Local state for active filters
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [priceRange, setPriceRange] = useState(15000); // Max price slider
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync route queries with local states
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
  }, [categoryFilter, subcategoryFilter, sortOption, selectedSizes, selectedColors, priceRange]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [categoryFilter, subcategoryFilter, sortOption, selectedSizes, selectedColors, priceRange, currentPage]);

  const fetchProducts = async (pageToFetch) => {
    if (pageToFetch === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        page: pageToFetch,
        limit: 8,
        sort: sortOption
      };

      if (categoryFilter) params.category = categoryFilter;
      if (subcategoryFilter) params.subcategory = subcategoryFilter;
      if (selectedSizes.length > 0) params.sizes = selectedSizes.join(',');
      if (selectedColors.length > 0) params.colors = selectedColors.join(',');
      if (priceRange < 15000) params.maxPrice = priceRange;

      const res = await axios.get(`${API_URL}/products`, { params });

      if (res.data.success) {
        if (pageToFetch === 1) {
          setProducts(res.data.products);
        } else {
          setProducts(prev => [...prev, ...res.data.products]);
        }
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load products list', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(15000);
    setSearchParams(prev => {
      prev.delete('subcategory');
      return prev;
    });
  };

  const setCategory = (cat) => {
    setSearchParams(prev => {
      if (cat) {
        prev.set('category', cat);
      } else {
        prev.delete('category');
      }
      prev.delete('subcategory');
      return prev;
    });
  };

  const setSubcategory = (sub) => {
    setSearchParams(prev => {
      if (sub && sub !== 'All') {
        prev.set('subcategory', sub);
      } else {
        prev.delete('subcategory');
      }
      return prev;
    });
  };

  const handleSortChange = (e) => {
    setSearchParams(prev => {
      prev.set('sort', e.target.value);
      return prev;
    });
  };

  const getSubcategoriesList = () => {
    if (categoryFilter === 'Men' || categoryFilter === 'Women') {
      return ['All', 'T-Shirts', 'Shirts', 'Hoodies', 'Bottomwear', 'Outerwear'];
    }
    return [];
  };

  const subcategories = getSubcategoriesList();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20">
      {/* Title & Sort Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-5 border-b border-mist">
        <div>
          <h1 className="font-display font-bold text-3xl uppercase tracking-tight text-ink">
            {categoryFilter || 'Shop All'}
          </h1>
          <p className="text-xs text-ink/50 mt-1 font-semibold">
            Showing {products.length} of the finest silhouettes.
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-mist bg-bone rounded-full text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          
          <div className="relative flex-1 md:flex-none">
            <select 
              value={sortOption}
              onChange={handleSortChange}
              className="w-full md:w-48 appearance-none bg-bone border border-mist rounded-full py-2 pl-4 pr-10 text-xs font-body focus:outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-ink/40 absolute right-4 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid Pane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar Filters (Desktop) */}
        <aside className="hidden md:block md:col-span-3 space-y-6 sticky top-28 bg-bone p-5 border border-mist/50 rounded-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-2 border-b border-mist/50">
            <span className="font-display font-semibold text-xs text-ink">FILTERS</span>
            {(selectedSizes.length > 0 || selectedColors.length > 0 || priceRange < 15000 || subcategoryFilter) && (
              <button 
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-brass hover:underline uppercase"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Categories Grid list */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Collections</span>
            <div className="flex flex-col gap-1.5 text-xs">
              {['Shop All', 'New In', 'Men', 'Women', 'Accessories', 'Collections'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === 'Shop All' ? '' : cat)}
                  className={`text-left py-1 hover:text-pine transition-colors font-medium ${
                    (cat === 'Shop All' && !categoryFilter) || categoryFilter === cat
                      ? 'text-pine font-bold'
                      : 'text-ink/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (Conditional) */}
          {subcategories.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-mist/30">
              <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Subcategories</span>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubcategory(sub)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      (sub === 'All' && !subcategoryFilter) || subcategoryFilter === sub
                        ? 'bg-pine text-bone'
                        : 'bg-mist/30 text-ink/75 hover:bg-mist/60'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Pills */}
          <div className="space-y-2 pt-4 border-t border-mist/30">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Sizes</span>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`w-10 h-10 border rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                      isActive 
                        ? 'border-pine bg-pine text-bone shadow-sm scale-105' 
                        : 'border-mist hover:border-ink/50 bg-bone text-ink/75'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color swatches */}
          <div className="space-y-2 pt-4 border-t border-mist/30">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Colors</span>
            <div className="flex flex-wrap gap-3">
              {COLOR_SWATCHES.map((color) => {
                const isActive = selectedColors.includes(color.name);
                const isWhite = color.hex === '#F6F3EE';
                return (
                  <button
                    key={color.name}
                    onClick={() => handleColorToggle(color.name)}
                    title={color.name}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all relative ${
                      isActive 
                        ? 'ring-2 ring-pine ring-offset-2 scale-110' 
                        : 'border-mist hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isActive && (
                      <Check className={`w-3.5 h-3.5 ${isWhite ? 'text-ink' : 'text-bone'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div className="space-y-2 pt-4 border-t border-mist/30">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-ink">Max Price</span>
              <span className="text-xs font-bold text-pine">₹{priceRange.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="15000" 
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-pine bg-mist h-1 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="md:col-span-9 space-y-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="bg-bone border border-mist/30 rounded-2xl p-3 space-y-4 animate-pulse">
                  <div className="aspect-square bg-mist rounded-xl w-full" />
                  <div className="space-y-2">
                    <div className="w-12 h-3 bg-mist rounded-full" />
                    <div className="w-32 h-4 bg-mist rounded-full" />
                    <div className="w-20 h-4 bg-mist rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
              <SlidersHorizontal className="w-10 h-10 text-mist" />
              <p className="text-sm text-ink/50 font-medium">No products match your active filters.</p>
              <button 
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-pine text-bone text-xs font-semibold rounded-full hover:bg-pine/90 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Load More Affordance */}
              {currentPage < totalPages && (
                <div className="text-center pt-5">
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-bone border border-mist text-ink text-xs font-bold rounded-full hover:bg-mist/30 transition-all duration-300 disabled:opacity-45 hover:scale-[1.02]"
                  >
                    {loadingMore ? 'LOADING SILHOUETTES...' : 'LOAD MORE'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Overlay (Bottom Sheet) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm md:hidden flex items-end">
          <div className="bg-bone w-full border-t border-mist rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-xl animate-[slide-up_0.3s_ease-out]">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-mist/50 pb-3">
              <span className="font-display font-semibold text-sm text-ink">FILTER SILHOUETTES</span>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full hover:bg-mist text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filters */}
            <div className="space-y-5">
              {/* Subcategories (Conditional) */}
              {subcategories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Subcategories</span>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubcategory(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          (sub === 'All' && !subcategoryFilter) || subcategoryFilter === sub
                            ? 'bg-pine text-bone'
                            : 'bg-mist/30 text-ink/75 hover:bg-mist/60'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size pills */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Sizes</span>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => {
                    const isActive = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`w-9 h-9 border rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                          isActive 
                            ? 'border-pine bg-pine text-bone' 
                            : 'border-mist bg-bone text-ink/75'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color swatches */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-ink block">Colors</span>
                <div className="flex flex-wrap gap-3">
                  {COLOR_SWATCHES.map((color) => {
                    const isActive = selectedColors.includes(color.name);
                    const isWhite = color.hex === '#F6F3EE';
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all relative ${
                          isActive 
                            ? 'ring-2 ring-pine ring-offset-2 scale-105' 
                            : 'border-mist'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isActive && (
                          <Check className={`w-3.5 h-3.5 ${isWhite ? 'text-ink' : 'text-bone'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-ink">Max Price</span>
                  <span className="text-xs font-bold text-pine">₹{priceRange.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="15000" 
                  step="500"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-pine bg-mist h-1 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-mist/50">
              <button 
                onClick={clearAllFilters}
                className="py-3 border border-mist bg-bone rounded-full text-xs font-bold uppercase tracking-wider text-ink"
              >
                Clear All
              </button>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="py-3 bg-pine text-bone rounded-full text-xs font-bold uppercase tracking-wider hover:bg-pine/90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
