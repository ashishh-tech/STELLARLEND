'use client';

import { useState, useEffect } from 'react';
import { Wallet, Activity, LogOut } from 'lucide-react';
import { connectWallet } from '@/lib/freighter';

export default function Navbar() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-reconnect if Freighter was already approved on a previous visit
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api');
        const connResult = await isConnected();
        const connected = connResult?.isConnected ?? connResult;
        if (!connected) return;

        const addrResult = await getAddress();
        const addr = addrResult?.address ?? addrResult;
        if (addr && typeof addr === 'string') {
          setAddress(addr);
        }
      } catch (e) {
        // Freighter not installed or not approved yet — silent fail
      }
    };
    tryAutoConnect();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    const userAddress = await connectWallet();
    if (userAddress) setAddress(userAddress);
    setLoading(false);
  };

  const handleDisconnect = () => {
    setAddress(null);
  };

  const truncateAddress = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-brand-slate/80 border-b border-brand-slate-border shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
            <Activity size={24} className="text-brand-slate" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">StellarLend</span>
          <span className="text-xs text-muted font-mono px-2 py-0.5 bg-brand-slate-light rounded-full border border-brand-slate-border">Testnet</span>
        </div>

        {/* Wallet */}
        <div>
          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-brand-slate-light px-4 py-2 rounded-lg border border-brand-emerald/30 text-sm font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {truncateAddress(address)}
              </div>
              <button
                onClick={handleDisconnect}
                title="Disconnect wallet"
                className="text-muted hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-hover text-brand-slate px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
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
