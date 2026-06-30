'use client';

import { useState } from 'react';
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
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-navy-950/40 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all">
      <div className="container mx-auto flex justify-between items-center w-full">
        {/* Brand */}
        <div className="flex items-center gap-3 md:gap-6 cursor-pointer group">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-emerald flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
              <span className="material-symbols-outlined text-navy-950 text-[20px] md:text-[24px]">monitoring</span>
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-white font-headline">StellarLend</span>
            <span className="hidden sm:inline text-xs text-brand-emerald font-mono px-2 py-0.5 bg-brand-emerald/10 rounded-full border border-brand-emerald/20">Testnet</span>
          </div>
        </div>

        {/* Wallet */}
        <div>
          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-navy-900/60 backdrop-blur-md px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg border border-brand-emerald/30 text-xs md:text-sm font-mono text-brand-emerald shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                {truncateAddress(address)}
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect wallet"
                className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-hover text-navy-950 px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-bold text-sm md:text-base transition-all disabled:opacity-50 glow-green glow-green-hover"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              {loading ? 'Connecting...' : <><span className="hidden sm:inline">Connect Freighter</span><span className="sm:hidden">Connect</span></>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
