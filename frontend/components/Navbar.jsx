'use client';

import { useState } from 'react';
import Logo from './Logo';
import { connectWallet } from '@/lib/freighter';

export default function Navbar({ address, onConnect, onDisconnect }) {
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
    <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-3.5 bg-navy-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
      <div className="container mx-auto flex justify-between items-center w-full max-w-6xl">
        
        {/* Brand Logo & Network Status */}
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-brand-emerald/10 border border-brand-emerald/25 rounded-full text-xs font-mono text-brand-emerald">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <span>Soroban Testnet</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Quick Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 mr-2 font-headline text-sm font-semibold">
            <a href="#markets" className="text-slate-300 hover:text-brand-emerald transition-colors">Markets</a>
            <a href="https://stellar.expert/explorer/testnet/contract/CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono">
              <span>Contract</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          {address ? (
            <div className="flex items-center gap-2 bg-navy-900/90 backdrop-blur-xl p-1.5 pl-3.5 rounded-xl border border-brand-emerald/40 text-xs md:text-sm font-mono text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
                <span className="font-bold text-white tracking-wide">{truncateAddress(address)}</span>
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect Wallet"
                className="ml-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all p-1.5 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="relative group overflow-hidden px-5 md:px-6 py-2.5 rounded-xl font-headline font-bold text-xs md:text-sm text-navy-950 bg-gradient-to-r from-brand-emerald via-cyan-400 to-brand-emerald bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              {loading ? 'Connecting...' : <span>Connect Wallet</span>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
