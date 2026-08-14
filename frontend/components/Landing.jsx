'use client';

import { connectWallet } from '@/lib/freighter';
import Logo from './Logo';

export default function Landing({ onConnect, onOpenOnboarding, onOpenReferral, onOpenFeedback }) {
  const handleConnect = async () => {
    const address = await connectWallet();
    if (address && onConnect) {
      onConnect(address);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-to-tr from-brand-emerald/15 via-cyan-500/10 to-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 md:px-6 relative z-10 pt-28 md:pt-36 pb-16">
        
        {/* Brand Emblem Hero Badge */}
        <div className="inline-flex items-center gap-2 mb-6 md:mb-8 px-4 py-2 rounded-full border border-brand-emerald/40 bg-brand-emerald/10 text-brand-emerald font-mono text-xs md:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
          <span className="w-2 h-2 rounded-full bg-brand-emerald" />
          <span>Powered by Stellar Soroban Smart Contracts</span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 mb-6 md:mb-8 font-headline leading-tight max-w-5xl tracking-tight drop-shadow-2xl">
          Next-Generation Peer-to-Peer <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald via-cyan-400 to-indigo-400">
            DeFi Lending Protocol
          </span>
        </h1>
        
        <p className="text-base sm:text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl font-body leading-relaxed opacity-90">
          Supply crypto assets, earn algorithmic yield, and borrow XLM instantly with zero intermediaries on the Stellar blockchain network.
        </p>

        {/* Level 5 Quick Access Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-1.5 rounded-full bg-brand-emerald/15 hover:bg-brand-emerald/25 border border-brand-emerald/30 text-brand-emerald text-xs font-semibold font-headline transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            <span>Beginner&apos;s Quickstart Guide</span>
          </button>
          <button
            onClick={onOpenReferral}
            className="px-3.5 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-semibold font-headline transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">card_giftcard</span>
            <span>Referral & Rewards Hub</span>
          </button>
          <button
            onClick={onOpenFeedback}
            className="px-3.5 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-300 text-xs font-semibold font-headline transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">rate_review</span>
            <span>Product Feedback</span>
          </button>
        </div>

        {/* Call to Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full max-w-md">
          <button
            onClick={handleConnect}
            className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-emerald via-cyan-400 to-brand-emerald bg-[length:200%_auto] hover:bg-[position:right_center] text-navy-950 rounded-2xl font-bold font-headline text-lg transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
          >
            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            <span>Connect Wallet to Launch</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          
          <a
            href="https://stellar.expert/explorer/testnet/contract/CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 bg-navy-900/80 hover:bg-navy-900 border border-white/10 hover:border-brand-emerald/40 text-slate-200 rounded-2xl font-bold font-headline text-base transition-all flex items-center justify-center gap-2"
          >
            <span>View Explorer</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        </div>

        {/* Live Protocol Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl mb-20">
          <div className="glass-card rounded-2xl p-4 md:p-6 text-center border border-white/5">
            <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">$42.8M+</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">Total Value Locked</div>
          </div>
          <div className="glass-card rounded-2xl p-4 md:p-6 text-center border border-white/5">
            <div className="text-2xl md:text-3xl font-extrabold text-brand-emerald font-mono">4.20%</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">Supply APY</div>
          </div>
          <div className="glass-card rounded-2xl p-4 md:p-6 text-center border border-white/5">
            <div className="text-2xl md:text-3xl font-extrabold text-cyan-400 font-mono">75.0%</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">Max LTV Limit</div>
          </div>
          <div className="glass-card rounded-2xl p-4 md:p-6 text-center border border-white/5">
            <div className="text-2xl md:text-3xl font-extrabold text-indigo-400 font-mono">&lt; 3 sec</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">Settlement Speed</div>
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="w-full max-w-5xl mb-24 text-left">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-headline">How StellarLend Works</h2>
            <p className="text-slate-400 text-sm md:text-base mt-2">Start lending and borrowing in 3 effortless steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card glass-card-hover rounded-2xl p-8 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald flex items-center justify-center font-extrabold text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-headline">Connect Wallet</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your Freighter browser wallet with one click to sign transactions securely on the Stellar network.
              </p>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-8 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-extrabold text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-headline">Deposit Collateral</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Supply XLM into the decentralized liquidity pool to start earning passive yield immediately.
              </p>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-8 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-extrabold text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-headline">Borrow Instantly</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Borrow against your supplied collateral up to 75% LTV with transparent on-chain health monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div id="markets" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
          <div className="glass-card glass-card-hover rounded-2xl p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-brand-emerald/10 flex items-center justify-center mb-6 border border-brand-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-[30px] text-brand-emerald">bolt</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Soroban Engine</h3>
            <p className="text-slate-400 font-body leading-relaxed text-sm">
              Engineered with Rust-based Soroban smart contracts for sub-second execution speeds and micro transaction fees.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <span className="material-symbols-outlined text-[30px] text-blue-400">shield_lock</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Non-Custodial</h3>
            <p className="text-slate-400 font-body leading-relaxed text-sm">
              You maintain 100% control of your private keys. All loans and collateral remain locked strictly inside smart contract storage.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <span className="material-symbols-outlined text-[30px] text-purple-400">trending_up</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-headline">Optimized Yields</h3>
            <p className="text-slate-400 font-body leading-relaxed text-sm">
              Algorithmic interest rates dynamically adjust based on liquidity demand to ensure maximum capital efficiency for lenders.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-slate-400 text-xs font-mono relative z-10 flex flex-col sm:flex-row justify-between items-center container mx-auto max-w-6xl gap-4">
        <Logo size="sm" showSubtitle={false} />
        <div>© 2026 StellarLend Protocol. Built on Stellar Soroban.</div>
        <div className="flex gap-4">
          <a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-brand-emerald transition-colors">Stellar Network</a>
          <a href="https://freighter.app" target="_blank" rel="noreferrer" className="hover:text-brand-emerald transition-colors">Freighter Wallet</a>
        </div>
      </footer>
    </div>
  );
}
