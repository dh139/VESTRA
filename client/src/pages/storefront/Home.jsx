import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Mail, ShieldCheck, Undo2, Truck } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../../components/ui/ProductCard';

const API_URL = 'http://localhost:5000/api';

export default function Home() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const res = await axios.get(`${API_URL}/cms/homepage`);
        if (res.data.success) {
          setSections(res.data.sections);
        }
      } catch (err) {
        console.error('Failed to load homepage sections', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        {/* Skeleton screen loader */}
        <div className="space-y-4 text-center animate-pulse">
          <div className="w-40 h-8 bg-mist rounded-full mx-auto" />
          <div className="w-80 h-4 bg-mist rounded-full mx-auto" />
          <div className="w-72 h-4 bg-mist rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20 pb-20">
      {/* Dynamic sections loaded from backend CMS */}
      {sections.map((section) => {
        if (!section.isActive) return null;

        switch (section.sectionType) {
          case 'Hero Banner':
            return (
              <section 
                key={section._id} 
                className="relative min-h-[90vh] flex items-center bg-mist/30 overflow-hidden"
              >
                {/* Visual Backdrop */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={section.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80'} 
                    alt="Vestra Hero Collection" 
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-bone via-bone/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full py-20 mt-16">
                  <div className="max-w-2xl space-y-6 animate-[slide-up_0.8s_ease-out]">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pine/5 rounded-full border border-pine/10 text-pine text-[10px] font-bold uppercase tracking-widest">
                     
                    
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-ink leading-[1.05] uppercase">
                      {section.title || 'SILHOUETTES OF MODERN GROTESK'}
                    </h1>
                    <p className="font-body text-base text-ink/75 leading-relaxed max-w-lg">
                      {section.subtitle || 'A quiet luxury approach to everyday dress codes. Restrained color palettes and bold modern cuts.'}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link 
                        to="/shop?category=Men" 
                        className="px-8 py-3.5 bg-pine text-bone font-semibold text-xs rounded-full flex items-center gap-2 hover:bg-pine/90 transition-all duration-300 hover:scale-[1.03]"
                      >
                        Shop Men <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link 
                        to="/shop?category=Women" 
                        className="px-8 py-3.5 bg-bone border border-mist text-ink font-semibold text-xs rounded-full hover:bg-mist/30 transition-all duration-300 hover:scale-[1.03]"
                      >
                        Shop Women
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'New Arrivals':
          case 'Best Sellers':
            return (
              <section key={section._id} className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-brass font-display font-bold tracking-widest uppercase block">
                      {section.sectionType}
                    </span>
                    <h2 className="font-display font-bold text-3xl text-ink uppercase tracking-tight">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs text-ink/60 max-w-xl font-medium leading-relaxed">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  <Link 
                    to="/shop" 
                    className="text-xs font-semibold text-pine hover:underline flex items-center gap-1.5 shrink-0"
                  >
                    View All Products <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {section.products?.slice(0, 4).map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            );

          case 'Featured Collection':
            return (
              <section key={section._id} className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-mist/20 rounded-3xl p-6 md:p-10 border border-mist/40">
                  {/* Banner Info */}
                  <div className="md:col-span-4 space-y-6">
                    <span className="text-[10px] text-brass font-display font-bold tracking-widest uppercase block">
                      Featured Gallery
                    </span>
                    <h3 className="font-display font-bold text-3xl md:text-4xl text-ink uppercase leading-tight tracking-tight">
                      {section.title || 'THE INK & GREEN PALETTE'}
                    </h3>
                    <p className="text-xs text-ink/70 leading-relaxed font-medium">
                      {section.subtitle || 'A curated selection of silhouettes. Premium linen shirts, cropped supima t-shirts, and cashmere wool scarf sets.'}
                    </p>
                    <Link 
                      to="/shop" 
                      className="inline-flex items-center gap-2 py-3 px-6 bg-pine text-bone font-semibold text-xs rounded-full hover:bg-pine/90 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Explore Capsule <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Connected Products */}
                  <div className="md:col-span-8 grid grid-cols-2 gap-4">
                    {section.products?.slice(0, 2).map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* Brand Trust badging Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 border-y border-mist grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="p-3 bg-pine/5 border border-pine/10 rounded-2xl text-pine">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wide">Secure Checkout</h4>
            <p className="text-xs text-ink/60 mt-1 leading-relaxed">
              Recalculated pricing on secure Mongoose APIs. Powered locally with Mock payment validation and webhooks.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="p-3 bg-pine/5 border border-pine/10 rounded-2xl text-pine">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wide">Pincode Verification</h4>
            <p className="text-xs text-ink/60 mt-1 leading-relaxed">
              Auto-filled billing locations on enter. Ensures deliverability check before proceeding to orders.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="p-3 bg-pine/5 border border-pine/10 rounded-2xl text-pine">
            <Undo2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wide">14-Day Returns</h4>
            <p className="text-xs text-ink/60 mt-1 leading-relaxed">
              Order return requests managed instantly from customer dashboards. Restocks inventory dynamically on approval.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-6 py-10 bg-bone border border-mist rounded-3xl">
        <Mail className="w-10 h-10 text-pine mx-auto" />
        <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-ink">
          JOIN THE VESTRA CLUB
        </h3>
        <p className="text-xs text-ink/60 max-w-md mx-auto leading-relaxed">
          Subscribe to receive private collection releases, designer notes, and 10% off your first checkout.
        </p>
        <form 
          onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
        >
          <input 
            type="email" 
            placeholder="Enter your email address" 
            required
            className="flex-grow bg-mist/30 border border-mist rounded-full py-2.5 px-5 text-xs font-body focus:outline-none focus:ring-1 focus:ring-pine"
          />
          <button 
            type="submit" 
            className="px-8 py-2.5 bg-pine text-bone text-xs font-semibold rounded-full hover:bg-pine/90 transition-all hover:scale-[1.02] shrink-0 uppercase tracking-wider"
          >
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
