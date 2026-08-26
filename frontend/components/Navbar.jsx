'use client';

import { useState } from 'react';
import Logo from './Logo';
import { connectWallet } from '@/lib/freighter';

export default function Navbar({
  address,
  viewMode = 'app',
  onToggleView,
  onConnect,
  onDisconnect,
  onOpenOnboarding,
  onOpenReferral,
  onOpenFeedback,
}) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const userAddress = await connectWallet();
    if (userAddress && onConnect) onConnect(userAddress);
    setLoading(false);
  };

  const truncateAddress = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-3.5 bg-navy-950/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
      <div className="container mx-auto flex justify-between items-center w-full max-w-7xl">
        
        {/* Brand Logo, View Switcher & Network Status */}
        <div className="flex items-center gap-3 md:gap-5">
          <button onClick={() => onToggleView?.('landing')} className="cursor-pointer text-left">
            <Logo size="md" />
          </button>

          {/* View Mode Toggle Pill */}
          <div className="hidden sm:flex items-center p-1 bg-navy-900/90 rounded-xl border border-white/10 font-headline text-xs font-bold">
            <button
              onClick={() => onToggleView?.('app')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'app'
                  ? 'bg-brand-emerald text-navy-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">dashboard</span>
              <span>DeFi App</span>
            </button>
            <button
              onClick={() => onToggleView?.('landing')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'landing'
                  ? 'bg-brand-emerald text-navy-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">web</span>
              <span>Overview</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-brand-emerald/10 border border-brand-emerald/25 rounded-full text-xs font-mono text-brand-emerald">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <span>Soroban Testnet v25</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Quick Action Guides & Modals */}
          <div className="flex items-center gap-1.5 font-headline text-xs font-semibold">
            {onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                className="px-2.5 py-1.5 rounded-lg bg-navy-900/80 hover:bg-navy-800 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                title="Quick Onboarding Guide"
              >
                <span className="material-symbols-outlined text-sm text-brand-emerald">menu_book</span>
                <span className="hidden md:inline">Guide</span>
              </button>
            )}

            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                className="px-2.5 py-1.5 rounded-lg bg-navy-900/80 hover:bg-navy-800 border border-white/10 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1"
                title="Referral & Rewards Hub"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">card_giftcard</span>
                <span className="hidden md:inline">Rewards</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                onClick={onOpenFeedback}
                className="px-2.5 py-1.5 rounded-lg bg-navy-900/80 hover:bg-navy-800 border border-white/10 text-slate-300 hover:text-purple-300 transition-all flex items-center gap-1"
                title="Product Feedback"
              >
                <span className="material-symbols-outlined text-sm text-purple-400">rate_review</span>
                <span className="hidden md:inline">Feedback</span>
              </button>
            )}

            <a
              href="https://stellar.expert/explorer/testnet/contract/CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS"
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-mono px-2 py-1.5"
            >
              <span>Contract</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          {/* Wallet Button */}
          {address ? (
            <div className="flex items-center gap-2 bg-navy-900/90 backdrop-blur-xl p-1.5 pl-3 rounded-xl border border-brand-emerald/40 text-xs md:text-sm font-mono text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
                <span className="font-bold text-white tracking-wide">{truncateAddress(address)}</span>
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect Wallet"
                className="ml-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all p-1.5 rounded-lg"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="relative group overflow-hidden px-4 md:px-5 py-2 rounded-xl font-headline font-bold text-xs md:text-sm text-navy-950 bg-gradient-to-r from-brand-emerald via-cyan-400 to-brand-emerald bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              {loading ? 'Connecting...' : <span>Connect Wallet</span>}
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}
