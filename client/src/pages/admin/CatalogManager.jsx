import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Image, AlertCircle, Sparkles, Eye } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const buildImageUrl = (url, colorName, sizeName) => {
  if (!url) return '';
  
  let cleanUrl = url;
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('color');
    urlObj.searchParams.delete('size');
    cleanUrl = urlObj.toString();
  } catch (e) {
    cleanUrl = url.replace(/([?&])color=[^&]+&?/, '$1')
                  .replace(/([?&])size=[^&]+&?/, '$1')
                  .replace(/[?&]$/, '');
  }

  const params = [];
  if (colorName) {
    const slugColor = colorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    params.push(`color=${slugColor}`);
  }
  if (sizeName) {
    const slugSize = sizeName.toLowerCase().trim();
    params.push(`size=${slugSize}`);
  }

  if (params.length === 0) return cleanUrl;

  const separator = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${separator}${params.join('&')}`;
};

export default function CatalogManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Accordion state to track expanded product variant grids
  const [expandedProductId, setExpandedProductId] = useState('');

  // Product Modal Form States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Men');
  const [subcategory, setSubcategory] = useState('T-Shirts');
  const [imageRows, setImageRows] = useState([{ url: '', color: '', size: '' }]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [productError, setProductError] = useState('');

  // Variant Modal Form States
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProductId, setVariantProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#1F3D2B');
  const [size, setSize] = useState('M');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [variantError, setVariantError] = useState('');

  useEffect(() => {
    fetchAdminCatalog();
  }, []);

  const fetchAdminCatalog = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products/admin`);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load admin catalog', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Product Modal
  const handleOpenProductModal = (prod = null) => {
    setProductError('');
    if (prod) {
      setProductId(prod._id);
      setName(prod.name);
      setDescription(prod.description);
      setCategory(prod.category);
      setSubcategory(prod.subcategory);
      setSeoTitle(prod.seoTitle || '');
      setSeoDescription(prod.seoDescription || '');

      // Parse product.images into imageRows
      if (prod.images && prod.images.length > 0) {
        const rows = prod.images.map(img => {
          let color = '';
          let size = '';
          try {
            const urlObj = new URL(img);
            const colorParam = urlObj.searchParams.get('color');
            if (colorParam) {
              color = colorParam.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
            const sizeParam = urlObj.searchParams.get('size');
            if (sizeParam) {
              size = sizeParam.toUpperCase();
            }
          } catch (e) {
            const colorMatch = img.match(/[?&]color=([^&]+)/);
            if (colorMatch) {
              color = colorMatch[1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
            const sizeMatch = img.match(/[?&]size=([^&]+)/);
            if (sizeMatch) {
              size = sizeMatch[1].toUpperCase();
            }
          }
          return { url: img, color, size };
        });
        setImageRows(rows);
      } else {
        setImageRows([{ url: '', color: '', size: '' }]);
      }
    } else {
      setProductId('');
      setName('');
      setDescription('');
      setCategory('Men');
      setSubcategory('T-Shirts');
      setImageRows([{ url: '', color: '', size: '' }]);
      setSeoTitle('');
      setSeoDescription('');
    }
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    // Process and build images list with color and size suffixes
    const processedImages = imageRows
      .map(row => buildImageUrl(row.url.trim(), row.color.trim(), (row.size || '').trim()))
      .filter(url => url !== '');

    const payload = {
      name,
      description,
      category,
      subcategory,
      images: processedImages,
      seoTitle,
      seoDescription
    };

    try {
      let res;
      if (productId) {
        res = await axios.put(`${API_URL}/products/${productId}`, payload);
      } else {
        res = await axios.post(`${API_URL}/products`, payload);
      }

      if (res.data.success) {
        setProductModalOpen(false);
        fetchAdminCatalog();
      }
    } catch (err) {
      setProductError(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete product and all its inventory variants? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`${API_URL}/products/${id}`);
      if (res.data.success) {
        fetchAdminCatalog();
      }
    } catch (err) {
      alert('Delete product failed.');
    }
  };

  // Open Variant Modal
  const handleOpenVariantModal = (prodId, variant = null) => {
    setVariantError('');
    setVariantProductId(prodId);
    if (variant) {
      setVariantId(variant._id);
      setColor(variant.color);
      setColorHex(variant.colorHex);
      setSize(variant.size);
      setSku(variant.sku);
      setPrice(variant.price);
      setCompareAtPrice(variant.compareAtPrice || '');
      setStock(variant.stock);
    } else {
      setVariantId('');
      setColor('');
      setColorHex('#1F3D2B');
      setSize('M');
      // Auto-generate a helper SKU
      const matchingProduct = products.find(p => p._id === prodId);
      const prefix = matchingProduct ? matchingProduct.name.slice(0, 3).toUpperCase() : 'VES';
      setSku(`${prefix}-${Math.floor(100 + Math.random() * 900)}`);
      setPrice('');
      setCompareAtPrice('');
      setStock('');
    }
    setVariantModalOpen(true);
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      productId: variantProductId,
      color,
      colorHex,
      size,
      sku,
      price,
      compareAtPrice: compareAtPrice || undefined,
      stock
    };

    try {
      let res;
      if (variantId) {
        res = await axios.put(`${API_URL}/products/variants/${variantId}`, payload);
      } else {
        res = await axios.post(`${API_URL}/products/variants`, payload);
      }

      if (res.data.success) {
        setVariantModalOpen(false);
        fetchAdminCatalog();
      }
    } catch (err) {
      setVariantError(err.response?.data?.message || 'Failed to save variant.');
    }
  };

  const handleDeleteVariant = async (vId) => {
    if (!window.confirm('Delete this variant item from stock?')) return;
    try {
      const res = await axios.delete(`${API_URL}/products/variants/${vId}`);
      if (res.data.success) {
        fetchAdminCatalog();
      }
    } catch (err) {
      alert('Delete variant failed.');
    }
  };

  return (
    <div className="space-y-6 animate-[slide-up_0.4s_ease-out]">
      <div className="flex justify-between items-center pb-3 border-b border-mist">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
            Products Catalog Manager
          </h1>
          <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
            Create catalog silhouettes and configure size-color variations.
          </p>
        </div>
        <button
          onClick={() => handleOpenProductModal()}
          className="py-3 px-6 bg-pine text-bone text-xs font-bold uppercase rounded-full flex items-center gap-1.5 hover:bg-pine/90 hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product List Table grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-mist/30 border border-mist rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 bg-bone border border-mist rounded-3xl text-center text-xs text-ink/50 font-semibold">
          No products found in database. Seed data or create one above.
        </div>
      ) : (
        <div className="border border-mist rounded-3xl overflow-hidden bg-bone shadow-soft divide-y divide-mist">
          {products.map((prod) => {
            const isExpanded = expandedProductId === prod._id;
            const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

            return (
              <div key={prod._id} className="transition-colors hover:bg-mist/5">
                {/* Main Product row */}
                <div className="p-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl border border-mist/80 overflow-hidden shrink-0 bg-mist/20">
                      <img src={prod.images?.[0]} alt="" className="object-cover w-full h-full" />
                    </div>

                    <div>
                      <span className="text-[9px] text-brass uppercase font-bold tracking-wider">
                        {prod.category} • {prod.subcategory}
                      </span>
                      <h3 className="font-display font-bold text-sm text-ink uppercase">
                        {prod.name}
                      </h3>
                      <span className="text-[10px] text-ink/50 block font-semibold uppercase">
                        {prod.variants?.length || 0} variants • {totalStock} units total stock
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedProductId(isExpanded ? '' : prod._id)}
                      className="p-2 border border-mist hover:bg-mist/40 rounded-full text-ink"
                      title="Manage Variants"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleOpenProductModal(prod)}
                      className="p-2 border border-mist hover:bg-mist/40 rounded-full text-pine"
                      title="Edit Product Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="p-2 border border-mist hover:bg-mist/40 rounded-full text-signal"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Variants sub-table */}
                {isExpanded && (
                  <div className="px-5 pb-5 bg-mist/10 border-t border-mist/40 animate-[slide-down_0.2s_ease-out]">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">
                        Color-Size Inventory Grid
                      </span>
                      
                      <button
                        onClick={() => handleOpenVariantModal(prod._id)}
                        className="py-1.5 px-3 bg-pine text-bone text-[9px] font-bold uppercase rounded-full flex items-center gap-1 hover:bg-pine/90"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Variant
                      </button>
                    </div>

                    {prod.variants?.length === 0 ? (
                      <div className="py-6 text-center text-[10px] text-ink/40 font-semibold bg-bone border border-mist rounded-xl">
                        No variations created. Add a size-color variant above.
                      </div>
                    ) : (
                      <div className="border border-mist rounded-xl overflow-hidden divide-y divide-mist bg-bone text-xs">
                        <div className="grid grid-cols-6 p-2.5 font-bold text-ink/50 bg-mist/10 uppercase text-[9px] tracking-wider text-center">
                          <span>SKU</span>
                          <span>Color</span>
                          <span>Size</span>
                          <span>Price</span>
                          <span>Stock</span>
                          <span>Action</span>
                        </div>

                        {prod.variants.map((v) => (
                          <div key={v._id} className="grid grid-cols-6 p-2.5 items-center text-center font-medium">
                            <span className="font-mono text-ink/70">{v.sku}</span>
                            <span className="flex items-center justify-center gap-1.5">
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-mist" 
                                style={{ backgroundColor: v.colorHex }}
                              />
                              {v.color}
                            </span>
                            <span className="font-bold">{v.size}</span>
                            <span className="text-pine font-bold">₹{v.price}</span>
                            <span className={v.stock < 5 ? 'text-signal font-bold' : 'text-ink/65'}>
                              {v.stock} {v.stock < 5 && '⚠️'}
                            </span>
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleOpenVariantModal(prod._id, v)}
                                className="p-1 hover:bg-mist rounded text-pine"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteVariant(v._id)}
                                className="p-1 hover:bg-mist rounded text-signal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. PRODUCT ADD/EDIT MODAL OVERLAY */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-xl w-full shadow-2xl max-h-[85vh] overflow-y-auto relative animate-[scale-up_0.3s_ease-out]">
            <h4 className="font-display font-extrabold text-lg text-ink uppercase tracking-tight mb-4 border-b border-mist pb-2">
              {productId ? 'Update Silhouette details' : 'Create New Silhouette'}
            </h4>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Product Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== 'Men' && e.target.value !== 'Women') {
                        setSubcategory('None');
                      } else {
                        setSubcategory('T-Shirts');
                      }
                    }}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  >
                    <option value="New In">New In</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Collections">Collections</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Subcategory</label>
                  <select
                    value={subcategory}
                    disabled={category !== 'Men' && category !== 'Women'}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none disabled:bg-mist/40 disabled:cursor-not-allowed"
                  >
                    {category === 'Men' || category === 'Women' ? (
                      <>
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Shirts">Shirts</option>
                        <option value="Hoodies">Hoodies</option>
                        <option value="Bottomwear">Bottomwear</option>
                        <option value="Outerwear">Outerwear</option>
                      </>
                    ) : (
                      <option value="None">None</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Description Block</label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-2xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-pine"
                />
              </div>

              {/* Dynamic Image Rows Builder */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-ink/50 block flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Image className="w-3.5 h-3.5 text-ink/40" /> Product Images (WebP preferred)
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageRows([...imageRows, { url: '', color: '', size: '' }])}
                    className="text-[9px] font-bold uppercase tracking-wider text-pine hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Image Row
                  </button>
                </label>
                
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {imageRows.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center bg-mist/10 p-2.5 rounded-2xl border border-mist/30">
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text" 
                          required 
                          value={row.url}
                          onChange={(e) => {
                            const newRows = [...imageRows];
                            newRows[index].url = e.target.value;
                            setImageRows(newRows);
                          }}
                          placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                          className="w-full bg-bone border border-mist rounded-full py-1.5 px-3 text-[11px] focus:outline-none"
                        />
                        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                          <span className="text-[9px] text-ink/40 uppercase font-semibold shrink-0">Color:</span>
                          <input 
                            type="text" 
                            value={row.color || ''}
                            onChange={(e) => {
                              const newRows = [...imageRows];
                              newRows[index].color = e.target.value;
                              setImageRows(newRows);
                            }}
                            placeholder="e.g. Pine Green"
                            className="flex-1 min-w-[80px] bg-bone border border-mist rounded-full py-1 px-3 text-[10px] focus:outline-none"
                          />
                          <span className="text-[9px] text-ink/40 uppercase font-semibold shrink-0">Size:</span>
                          <input 
                            type="text" 
                            value={row.size || ''}
                            onChange={(e) => {
                              const newRows = [...imageRows];
                              newRows[index].size = e.target.value;
                              setImageRows(newRows);
                            }}
                            placeholder="e.g. S, M, L"
                            className="w-16 bg-bone border border-mist rounded-full py-1 px-3 text-[10px] focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (imageRows.length > 1) {
                            setImageRows(imageRows.filter((_, idx) => idx !== index));
                          } else {
                            setImageRows([{ url: '', color: '', size: '' }]);
                          }
                        }}
                        className="p-1.5 border border-mist hover:bg-mist/40 rounded-full text-signal"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-mist" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-pine block">SEO Customizations (Storefront Search)</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Meta Title</label>
                  <input 
                    type="text" 
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Meta Description</label>
                  <input 
                    type="text" 
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {productError && <p className="text-xs text-signal font-semibold">{productError}</p>}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="w-1/2 py-3 border border-mist bg-bone rounded-full text-xs font-bold uppercase text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-pine text-bone rounded-full text-xs font-bold uppercase hover:bg-pine/90"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. VARIANT ADD/EDIT MODAL OVERLAY */}
      {variantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-md w-full shadow-2xl relative animate-[scale-up_0.3s_ease-out]">
            <h4 className="font-display font-extrabold text-lg text-ink uppercase tracking-tight mb-4 border-b border-mist pb-2">
              {variantId ? 'Update Stock Variation' : 'Create Stock Variation'}
            </h4>

            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Color label</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Pine Green"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Swatch Color (Hex)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-10 h-10 border border-mist rounded-full p-0 bg-transparent cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      required
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="flex-grow bg-mist/20 border border-mist rounded-full py-2 px-4 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="OS">OS (One Size)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">SKU Code</label>
                  <input 
                    type="text" 
                    required 
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 1490"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Compare Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1990"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Inventory Stock Level</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 25"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                />
              </div>

              {variantError && <p className="text-xs text-signal font-semibold">{variantError}</p>}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setVariantModalOpen(false)}
                  className="w-1/2 py-3 border border-mist bg-bone rounded-full text-xs font-bold uppercase text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-pine text-bone rounded-full text-xs font-bold uppercase hover:bg-pine/90"
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
