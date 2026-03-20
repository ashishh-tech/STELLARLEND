'use client';

import { useState, useEffect } from 'react';
import { Wallet, Activity } from 'lucide-react';
import { connectWallet } from '@/lib/freighter';

export default function Navbar() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally check if already connected on mount
    const checkConnection = async () => {
      // Freighter's isAllowed/getAddress doesn't require prompting if already approved
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    const userAddress = await connectWallet();
    if (userAddress) {
      setAddress(userAddress);
    }
    setLoading(false);
  };

  const truncateAddress = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="w-full h-20 border-b border-brand-slate-border bg-brand-slate/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Activity size={24} className="text-brand-slate" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">StellarLend</span>
        </div>

        {/* Connect Button */}
        <div>
          {address ? (
            <div className="flex items-center gap-3 bg-brand-slate-light px-4 py-2 opacity-90 rounded-lg border border-brand-slate-border text-sm font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {truncateAddress(address)}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-hover text-brand-slate px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              <Wallet size={18} />
              {loading ? 'Connecting...' : 'Connect Freighter'}
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
