import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-bone pt-16 pb-8 px-6 md:px-12 mt-20 border-t border-ink/80">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <span className="font-display text-2xl font-bold tracking-tight text-bone">VESTRA</span>
          <p className="text-xs text-bone/60 leading-relaxed max-w-xs">
            Clean design, premium materials, and structured silhouettes. VESTRA is a direct-to-consumer label focused on quiet luxury.
          </p>
        </div>

        {/* Links */}
        <div>
          <span className="font-display text-xs tracking-widest text-brass block uppercase mb-4 font-semibold">Shop Categories</span>
          <ul className="space-y-2.5 text-xs text-bone/70">
            <li><Link to="/shop?category=New In" className="hover:text-brass transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop?category=Men" className="hover:text-brass transition-colors">Men\'s Essentials</Link></li>
            <li><Link to="/shop?category=Women" className="hover:text-brass transition-colors">Women\'s Capsule</Link></li>
            <li><Link to="/shop?category=Accessories" className="hover:text-brass transition-colors">Accessories</Link></li>
          </ul>
        </div>

        {/* Brand values */}
        <div>
          <span className="font-display text-xs tracking-widest text-brass block uppercase mb-4 font-semibold">Our Policy</span>
          <ul className="space-y-2.5 text-xs text-bone/70">
            <li><span className="block">14-Day Hassle Free Returns</span></li>
            <li><span className="block">Free Domestic Shipping above ₹2,999</span></li>
            <li><span className="block">GST-inclusive transparent checkout</span></li>
            <li><span className="block">100% Secured SSL Payments</span></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-3.5 text-xs text-bone/70">
          <span className="font-display text-xs tracking-widest text-brass block uppercase mb-4 font-semibold">Connect</span>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brass" />
            <a href="mailto:support@vestra.com" className="hover:text-brass transition-colors">support@vestra.com</a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brass" />
            <a href="tel:+919876543210" className="hover:text-brass transition-colors">+91 98765 43210</a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-brass mt-0.5" />
            <span>VESTRA Headquarter, Ahmedabad, Gujarat, India</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-bone/10 pt-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-bone/45 gap-4">
        <span>© {new Date().getFullYear()} VESTRA Apparel Ltd. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
          <Link to="/admin" className="hover:text-brass font-medium">Admin Portal Login</Link>
        </div>
      </div>
    </footer>
  );
}
