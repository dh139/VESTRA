import { ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col justify-between p-8 md:p-16 text-ink selection:bg-pine selection:text-bone animate-[fade-in_0.6s_ease-out]">
      {/* Top Brand Name */}
      <header className="max-w-7xl mx-auto w-full">
        <span className="font-display text-2xl font-bold tracking-tight text-pine">VESTRA</span>
      </header>

      {/* Center Message */}
      <main className="max-w-xl mx-auto w-full text-center space-y-6 my-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pine/5 rounded-full border border-pine/10 text-pine text-[10px] font-bold uppercase tracking-widest mx-auto">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Scheduled Perfecting</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-none uppercase text-ink">
          Perfecting the Canvas
        </h1>
        <p className="font-body text-xs md:text-sm text-ink/75 leading-relaxed font-medium">
          We are currently performing scheduled maintenance to enhance your VESTRA shopping experience. 
          Our digital atelier will be back shortly with new collections and refined features.
        </p>
        <div className="h-[1px] w-24 bg-mist mx-auto" />
      </main>

      {/* Footer support details */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] font-semibold uppercase tracking-wider text-ink/40">
        <span>For inquiries, contact us at </span>
        <a href="mailto:support@vestra.com" className="text-pine underline hover:text-pine/80 transition-colors">
          support@vestra.com
        </a>
      </footer>
    </div>
  );
}
