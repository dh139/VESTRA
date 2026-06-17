import { useState, useEffect } from 'react';
import { Settings, Truck, Undo2, ShieldCheck, MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SettingsManager() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('store'); // 'store', 'pricing', 'policy', 'seo', 'pincodes'
  
  // Settings Form States
  const [storeName, setStoreName] = useState('VESTRA');
  const [storeLogo, setStoreLogo] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@vestra.com');
  const [supportPhone, setSupportPhone] = useState('+919876543210');
  
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2999);
  const [shippingCharges, setShippingCharges] = useState(150);
  const [codEnabled, setCodEnabled] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(12);
  
  const [returnWindowDays, setReturnWindowDays] = useState(14);
  const [exchangeWindowDays, setExchangeWindowDays] = useState(14);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('VESTRA | Premium Apparel');
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Pincode management state
  const [pincodes, setPincodes] = useState([]);
  const [loadingPins, setLoadingPins] = useState(false);
  
  const [newPincode, setNewPincode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // CSV bulk import text box state
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  useEffect(() => {
    fetchSettingsData();
  }, []);

  useEffect(() => {
    if (activeSettingsTab === 'pincodes') {
      fetchAdminPincodes();
    }
  }, [activeSettingsTab]);

  const fetchSettingsData = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/admin`);
      if (res.data.success) {
        const s = res.data.settings;
        setStoreName(s.storeName);
        setStoreLogo(s.storeLogo || '');
        setSupportEmail(s.supportEmail);
        setSupportPhone(s.supportPhone);
        setFreeShippingThreshold(s.freeShippingThreshold);
        setShippingCharges(s.shippingCharges);
        setCodEnabled(s.codEnabled);
        setGstPercentage(s.gstPercentage);
        setReturnWindowDays(s.returnWindowDays);
        setExchangeWindowDays(s.exchangeWindowDays);
        setMaintenanceMode(s.maintenanceMode);
        setDefaultMetaTitle(s.defaultMetaTitle);
        setDefaultMetaDescription(s.defaultMetaDescription);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const fetchAdminPincodes = async () => {
    setLoadingPins(true);
    try {
      const res = await axios.get(`${API_URL}/pincodes/admin/all`);
      if (res.data.success) {
        setPincodes(res.data.pincodes);
      }
    } catch (err) {
      console.error('Failed to load pincodes', err);
    } finally {
      setLoadingPins(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    
    const payload = {
      storeName,
      storeLogo,
      supportEmail,
      supportPhone,
      freeShippingThreshold,
      shippingCharges,
      codEnabled,
      gstPercentage,
      returnWindowDays,
      exchangeWindowDays,
      maintenanceMode,
      defaultMetaTitle,
      defaultMetaDescription
    };

    try {
      const res = await axios.put(`${API_URL}/settings/admin`, payload);
      if (res.data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    
    try {
      const res = await axios.post(`${API_URL}/pincodes/admin`, {
        pincode: newPincode,
        city: newCity,
        state: newState
      });

      if (res.data.success) {
        setPinSuccess('Pincode added successfully.');
        setNewPincode('');
        setNewCity('');
        setNewState('');
        fetchAdminPincodes();
      }
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to add pincode.');
    }
  };

  const handleDeletePincode = async (id) => {
    if (!window.confirm('Remove this pincode from delivery list?')) return;
    try {
      const res = await axios.delete(`${API_URL}/pincodes/admin/${id}`);
      if (res.data.success) {
        fetchAdminPincodes();
      }
    } catch (err) {
      alert('Failed to remove pincode.');
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    setCsvError('');
    setCsvSuccess('');

    try {
      const res = await axios.post(`${API_URL}/pincodes/admin/import-csv`, { csvText });
      if (res.data.success) {
        setCsvSuccess(res.data.message);
        setCsvText('');
        fetchAdminPincodes();
      }
    } catch (err) {
      setCsvError(err.response?.data?.message || 'CSV Import failed.');
    }
  };

  return (
    <div className="space-y-6 animate-[slide-up_0.4s_ease-out]">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
          System Configuration Page
        </h1>
        <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
          Configure delivery availability, returns parameters, and SEO defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left tabs menu */}
        <aside className="lg:col-span-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 border-b lg:border-b-0 border-mist text-xs font-bold uppercase tracking-wider text-ink/60">
          {[
            { label: 'Store Profile', tab: 'store', icon: Settings },
            { label: 'Shipping & Taxes', tab: 'pricing', icon: Truck },
            { label: 'Return Policies', tab: 'policy', icon: Undo2 },
            { label: 'SEO Headers', tab: 'seo', icon: ShieldCheck },
            { label: 'Serviceable Pincodes', tab: 'pincodes', icon: MapPin }
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveSettingsTab(item.tab)}
              className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-left shrink-0 transition-all ${
                activeSettingsTab === item.tab
                  ? 'bg-pine text-bone shadow-sm font-bold'
                  : 'hover:bg-mist/30 hover:text-ink'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Tab Content form panels */}
        <main className="lg:col-span-9 bg-bone border border-mist rounded-3xl p-6 md:p-8">
          {activeSettingsTab !== 'pincodes' ? (
            <form onSubmit={handleSettingsSave} className="space-y-6">
              {/* STORE PROFILE TAB */}
              {activeSettingsTab === 'store' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider border-b border-mist pb-2 mb-2">Store General Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Store Brand Name</label>
                      <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Logo URL Link</label>
                      <input type="text" value={storeLogo} onChange={(e) => setStoreLogo(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Customer Support Email</label>
                      <input type="email" required value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Customer Support Phone</label>
                      <input type="text" required value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* SHIPPING & TAXES TAB */}
              {activeSettingsTab === 'pricing' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider border-b border-mist pb-2 mb-2">Checkout Shipping Charges & Taxes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Free Shipping Threshold Limit (₹)</label>
                      <input type="number" required value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Standard Shipping Charges (₹)</label>
                      <input type="number" required value={shippingCharges} onChange={(e) => setShippingCharges(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">GST Tax Rate Percentage (%)</label>
                      <input type="number" required value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="codCheck" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} className="accent-pine w-4 h-4 cursor-pointer" />
                      <label htmlFor="codCheck" className="text-xs text-ink/75 cursor-pointer select-none">Enable Cash on Delivery (COD) Option</label>
                    </div>
                  </div>
                </div>
              )}

              {/* RETURN POLICIES TAB */}
              {activeSettingsTab === 'policy' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider border-b border-mist pb-2 mb-2">Client Operations Policies</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Return Window Duration (Days)</label>
                      <input type="number" required value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Exchange Window Duration (Days)</label>
                      <input type="number" required value={exchangeWindowDays} onChange={(e) => setExchangeWindowDays(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="maintenanceCheck" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="accent-pine w-4 h-4 cursor-pointer" />
                      <label htmlFor="maintenanceCheck" className="text-xs text-ink/75 cursor-pointer select-none text-signal font-bold">Activate Storefront Maintenance Mode</label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO HEADERS TAB */}
              {activeSettingsTab === 'seo' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-ink uppercase tracking-wider border-b border-mist pb-2 mb-2">Default Store Search Tags</h3>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Search Meta Title Default</label>
                      <input type="text" required value={defaultMetaTitle} onChange={(e) => setDefaultMetaTitle(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-ink/50 uppercase tracking-wide">Search Meta Description Default</label>
                      <textarea rows="3" required value={defaultMetaDescription} onChange={(e) => setDefaultMetaDescription(e.target.value)} className="w-full bg-mist/20 border border-mist rounded-2xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-pine" />
                    </div>
                  </div>
                </div>
              )}

              {settingsSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pine animate-pulse">
                  <CheckCircle2 className="w-4 h-4" /> <span>Settings saved successfully and cached immediately.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="py-3 px-8 bg-pine text-bone font-bold text-xs uppercase rounded-full hover:bg-pine/90 flex items-center gap-2"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          ) : (
            /* SERVICEABLE PINCODES TAB */
            <div className="space-y-8">
              {/* Single Pincode Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <form onSubmit={handleAddPincode} className="space-y-4 bg-mist/10 p-5 border border-mist/30 rounded-2xl text-xs font-semibold">
                  <span className="font-display font-bold text-xs tracking-wider text-pine block uppercase mb-2">Register Single Service Pincode</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-ink/50 block">Pincode Number (6-digits)</label>
                    <input type="text" required placeholder="e.g. 380015" value={newPincode} onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full bg-bone border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-ink/50 block">City Name</label>
                    <input type="text" required placeholder="e.g. Ahmedabad" value={newCity} onChange={(e) => setNewCity(e.target.value)} className="w-full bg-bone border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-ink/50 block">State Name</label>
                    <input type="text" required placeholder="e.g. Gujarat" value={newState} onChange={(e) => setNewState(e.target.value)} className="w-full bg-bone border border-mist rounded-full py-2.5 px-4 focus:outline-none" />
                  </div>

                  {pinError && <p className="text-[10px] text-signal font-bold">{pinError}</p>}
                  {pinSuccess && <p className="text-[10px] text-pine font-bold">{pinSuccess}</p>}

                  <button type="submit" className="py-2 px-5 bg-pine text-bone text-[10px] font-bold uppercase rounded-full">Register Pincode</button>
                </form>

                {/* CSV text import */}
                <form onSubmit={handleCsvImport} className="space-y-4 bg-mist/10 p-5 border border-mist/30 rounded-2xl text-xs font-semibold">
                  <span className="font-display font-bold text-xs tracking-wider text-pine block uppercase mb-2">Batch CSV Import</span>
                  <p className="text-[10px] text-ink/50 leading-relaxed font-medium">Format: `pincode,city,state`. Do not include a headers row if possible, or skip header dynamically.</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-ink/50 block">CSV Raw Text Table</label>
                    <textarea 
                      rows="4" 
                      required 
                      placeholder="380015,Ahmedabad,Gujarat&#10;400001,Mumbai,Maharashtra" 
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full bg-bone border border-mist rounded-2xl py-2 px-4 focus:outline-none font-mono" 
                    />
                  </div>

                  {csvError && <p className="text-[10px] text-signal font-bold">{csvError}</p>}
                  {csvSuccess && <p className="text-[10px] text-pine font-bold">{csvSuccess}</p>}

                  <button type="submit" className="py-2 px-5 bg-pine text-bone text-[10px] font-bold uppercase rounded-full">Import Pincodes</button>
                </form>
              </div>

              {/* Service Pincode Data list */}
              <div className="space-y-3 pt-4 border-t border-mist/50">
                <span className="font-display font-bold text-xs tracking-wider text-ink block uppercase">Serviceable Pincodes List</span>
                {loadingPins ? (
                  <p className="text-xs animate-pulse font-semibold">Loading serviceable pincodes database...</p>
                ) : pincodes.length === 0 ? (
                  <p className="text-xs text-ink/40 font-semibold">No serviceable pincodes in database.</p>
                ) : (
                  <div className="border border-mist rounded-2xl overflow-hidden bg-bone divide-y divide-mist text-xs">
                    <div className="grid grid-cols-4 p-2.5 font-bold text-ink/50 bg-mist/15 uppercase text-[9px] tracking-wider text-center">
                      <span>Pincode</span>
                      <span>City</span>
                      <span>State</span>
                      <span>Action</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-mist">
                      {pincodes.map((pin) => (
                        <div key={pin._id} className="grid grid-cols-4 p-2.5 text-center font-medium items-center hover:bg-mist/5">
                          <span className="font-mono font-bold text-ink/80">{pin.pincode}</span>
                          <span>{pin.city}</span>
                          <span>{pin.state}</span>
                          <div className="flex justify-center">
                            <button onClick={() => handleDeletePincode(pin._id)} className="p-1 hover:bg-mist rounded text-signal" title="Remove Service">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
