import { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Edit2, Trash2, CheckCircle2, XCircle, Eye, EyeOff, Move } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HomepageBuilder() {
  const [sections, setSections] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag and Drop native tracker
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [sectionId, setSectionId] = useState('');
  const [sectionType, setSectionType] = useState('Featured Collection');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCmsData();
  }, []);

  const fetchCmsData = async () => {
    setLoading(true);
    try {
      const cmsRes = await axios.get(`${API_URL}/cms/admin/sections`);
      const prodRes = await axios.get(`${API_URL}/products/admin`);
      
      if (cmsRes.data.success) {
        setSections(cmsRes.data.sections);
      }
      if (prodRes.data.success) {
        setProductsList(prodRes.data.products);
      }
    } catch (err) {
      console.error('Failed to load CMS data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentVal) => {
    try {
      const res = await axios.put(`${API_URL}/cms/admin/sections/${id}`, { isActive: !currentVal });
      if (res.data.success) {
        setSections(prev => prev.map(s => s._id === id ? { ...s, isActive: !currentVal } : s));
      }
    } catch (err) {
      alert('Failed to toggle visibility status.');
    }
  };

  const handleOpenModal = (sec = null) => {
    setFormError('');
    if (sec) {
      setSectionId(sec._id);
      setSectionType(sec.sectionType);
      setTitle(sec.title || '');
      setSubtitle(sec.subtitle || '');
      setImage(sec.image || '');
      setSelectedProductIds(sec.products?.map(p => p._id || p) || []);
      setDisplayOrder(sec.displayOrder);
      setIsActive(sec.isActive);
    } else {
      setSectionId('');
      setSectionType('Featured Collection');
      setTitle('');
      setSubtitle('');
      setImage('');
      setSelectedProductIds([]);
      setDisplayOrder(sections.length);
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleProductSelectionChange = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      sectionType,
      title,
      subtitle,
      image,
      products: selectedProductIds,
      displayOrder,
      isActive
    };

    try {
      let res;
      if (sectionId) {
        res = await axios.put(`${API_URL}/cms/admin/sections/${sectionId}`, payload);
      } else {
        res = await axios.post(`${API_URL}/cms/admin/sections`, payload);
      }

      if (res.data.success) {
        setModalOpen(false);
        fetchCmsData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save CMS section.');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Delete this homepage section?')) return;
    try {
      const res = await axios.delete(`${API_URL}/cms/admin/sections/${id}`);
      if (res.data.success) {
        fetchCmsData();
      }
    } catch (err) {
      alert('Delete section failed.');
    }
  };

  // NATIVE HTML5 DRAG & DROP HANDLERS
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Rearrange locally in array
    const rearranged = [...sections];
    const draggedItem = rearranged[draggedIndex];
    rearranged.splice(draggedIndex, 1);
    rearranged.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setSections(rearranged);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    
    // Save new displayOrder ranks to DB in bulk
    try {
      const sectionIds = sections.map(s => s._id);
      await axios.post(`${API_URL}/cms/admin/sections/reorder`, { sectionIds });
    } catch (err) {
      alert('Failed to save reorder ranks. Reloading...');
      fetchCmsData();
    }
  };

  return (
    <div className="space-y-6 animate-[slide-up_0.4s_ease-out]">
      <div className="flex justify-between items-center pb-3 border-b border-mist">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
            Homepage CMS Builder
          </h1>
          <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
            Drag to reorder widgets, toggle visibility, and edit homepage content.
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="py-3 px-6 bg-pine text-bone text-xs font-bold uppercase rounded-full flex items-center gap-1.5 hover:bg-pine/90"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* Grid of section layouts */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-mist/30 border border-mist rounded-2xl" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="py-12 bg-bone border border-mist rounded-3xl text-center text-xs text-ink/50 font-semibold">
          No homepage sections found. Add one above.
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-ink/40 block">
            Drag rows using handle to rearrange order:
          </span>

          <div className="space-y-3">
            {sections.map((sec, idx) => {
              const isDragged = draggedIndex === idx;
              return (
                <div
                  key={sec._id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 bg-bone border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                    isDragged 
                      ? 'border-pine bg-pine/5 scale-95 opacity-50 shadow-inner' 
                      : 'border-mist hover:border-ink/50 shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle icon */}
                    <div className="cursor-grab text-ink/30 hover:text-ink active:cursor-grabbing p-1">
                      <Move className="w-4 h-4" />
                    </div>

                    {/* Thumbnail banner background preview */}
                    {sec.image && (
                      <div className="w-14 h-10 rounded-lg overflow-hidden border border-mist shrink-0 bg-mist/20">
                        <img src={sec.image} alt="" className="object-cover w-full h-full" />
                      </div>
                    )}

                    <div>
                      <span className="text-[9px] text-brass uppercase font-bold tracking-wider">
                        {sec.sectionType} (Display Order: {idx})
                      </span>
                      <h3 className="font-display font-bold text-sm text-ink uppercase">
                        {sec.title || 'Untitled Section'}
                      </h3>
                      {sec.products?.length > 0 && (
                        <span className="text-[10px] text-ink/50 block font-semibold uppercase">
                          {sec.products.length} products linked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Toggle visibility, Edit, Delete) */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(sec._id, sec.isActive)}
                      className={`p-2 rounded-full border transition-all ${
                        sec.isActive 
                          ? 'border-pine/30 bg-pine/5 text-pine' 
                          : 'border-mist bg-bone text-ink/40'
                      }`}
                      title={sec.isActive ? 'Hide from homepage' : 'Show on homepage'}
                    >
                      {sec.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenModal(sec)}
                      className="p-2 border border-mist hover:bg-mist/30 rounded-full text-pine"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteSection(sec._id)}
                      className="p-2 border border-mist hover:bg-mist/30 rounded-full text-signal"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION CREATE/EDIT MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto relative animate-[scale-up_0.3s_ease-out]">
            <h4 className="font-display font-extrabold text-lg text-ink uppercase tracking-tight mb-4 border-b border-mist pb-2">
              {sectionId ? 'Update Section' : 'Create Section'}
            </h4>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Section Type</label>
                <select
                  value={sectionType}
                  onChange={(e) => setSectionType(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                >
                  <option value="Hero Banner">Hero Banner</option>
                  <option value="New Arrivals">New Arrivals</option>
                  <option value="Best Sellers">Best Sellers</option>
                  <option value="Featured Collection">Featured Collection</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Title Headline</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Subtitle/Summary</label>
                <input 
                  type="text" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                />
              </div>

              {sectionType !== 'New Arrivals' && sectionType !== 'Best Sellers' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-ink/50 block">Background Image URL</label>
                  <input 
                    type="text" 
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Products selector checkboxes list */}
              {sectionType !== 'Hero Banner' && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-ink/50 block">Select Products to Display</span>
                  <div className="border border-mist rounded-2xl max-h-40 overflow-y-auto p-3 bg-bone space-y-2 text-xs font-semibold">
                    {productsList.map(prod => {
                      const isChecked = selectedProductIds.includes(prod._id);
                      return (
                        <div key={prod._id} className="flex items-center gap-2.5">
                          <input 
                            type="checkbox"
                            id={`prod_chk_${prod._id}`}
                            checked={isChecked}
                            onChange={() => handleProductSelectionChange(prod._id)}
                            className="accent-pine w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor={`prod_chk_${prod._id}`} className="cursor-pointer text-ink/85">
                            {prod.name} <span className="text-[10px] text-ink/40 font-mono">({prod.category})</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sectionActive" 
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-pine" 
                />
                <label htmlFor="sectionActive" className="text-xs text-ink/75">Show on storefront homepage</label>
              </div>

              {formError && <p className="text-xs text-signal font-semibold">{formError}</p>}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-3 border border-mist bg-bone rounded-full text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-pine text-bone rounded-full text-xs font-bold uppercase hover:bg-pine/90"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
