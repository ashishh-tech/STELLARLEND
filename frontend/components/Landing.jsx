'use client';

import { connectWallet } from '@/lib/freighter';

export default function Landing({ onConnect }) {
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address && onConnect) {
      onConnect(address);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background ambient elements specifically for Landing */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-emerald/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 md:px-6 relative z-10 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="inline-block mb-4 md:mb-6 px-3 md:px-4 py-1.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald font-mono text-xs md:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          Built on Stellar Soroban
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-6 md:mb-8 font-headline leading-tight max-w-4xl drop-shadow-lg">
          Unlock the Future of <br className="hidden md:block" /> Decentralized Finance
        </h1>
        
        <p className="text-base sm:text-xl md:text-2xl text-slate-400 mb-8 md:mb-12 max-w-2xl font-body leading-relaxed">
          Supply assets, earn premium yields, and borrow instantly. Experience the speed and security of the Stellar network.
        </p>

        <button
          onClick={handleConnect}
          className="group relative inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-brand-emerald hover:bg-brand-emerald-hover text-navy-950 rounded-2xl font-bold font-headline text-base md:text-xl transition-all hover:scale-105 glow-green glow-green-hover"
        >
          <span>Connect Wallet to Enter</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16 md:mt-32 w-full max-w-5xl">
          <div className="glass-card rounded-2xl p-8 text-left hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-brand-emerald/10 flex items-center justify-center mb-6 border border-brand-emerald/20">
              <span className="material-symbols-outlined text-[28px] text-brand-emerald">bolt</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Lightning Fast</h3>
            <p className="text-slate-400 font-body leading-relaxed">
              Experience instant settlement times and negligible fees powered by the Stellar consensus protocol.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 text-left hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
              <span className="material-symbols-outlined text-[28px] text-blue-400">shield</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Secure Smart Contracts</h3>
            <p className="text-slate-400 font-body leading-relaxed">
              Audited Soroban smart contracts ensure your funds are always protected and transparent.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 text-left hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
              <span className="material-symbols-outlined text-[28px] text-purple-400">monetization_on</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Premium Yields</h3>
            <p className="text-slate-400 font-body leading-relaxed">
              Maximize your capital efficiency with algorithmic interest rates that react to market demand.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm font-mono relative z-10">
        © 2026 StellarLend DeFi. All rights reserved.
      </footer>
    </div>
  );
}
