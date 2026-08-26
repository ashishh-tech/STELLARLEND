'use client';

import { useState } from 'react';

export default function TestnetFaucetModal({ isOpen, onClose, address, onFundSuccess }) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFriendbotFund = async () => {
    if (!address) {
      setErrorMsg('Please connect your Freighter wallet first.');
      return;
    }
    setLoading(true);
    setStatusMsg('Calling Stellar Friendbot on Testnet...');
    setErrorMsg('');

    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      if (res.ok) {
        setStatusMsg('10,000 Testnet XLM successfully funded to your wallet!');
        setTimeout(() => {
          onFundSuccess?.();
          setLoading(false);
        }, 1500);
      } else {
        const data = await res.json();
        throw new Error(data.detail || 'Friendbot funding request failed.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Funding failed. Make sure your address is a valid Stellar Testnet key.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-xl animate-in fade-in">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full border border-cyan-500/30 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="material-symbols-outlined text-[20px]">water_drop</span>
            </div>
            <div>
              <h4 className="font-bold text-white font-headline text-lg">Testnet Faucet & Quick Funding</h4>
              <p className="text-xs text-slate-400 font-mono">Instant Free Stellar Testnet XLM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Target Address */}
        <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5 font-mono text-xs space-y-1">
          <span className="text-slate-400 block">Connected Destination Address:</span>
          <span className="text-white font-semibold break-all">
            {address || 'No wallet connected (Connect Freighter)'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleFriendbotFund}
            disabled={loading || !address}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-brand-emerald text-navy-950 font-bold font-headline text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                <span>Requesting 10,000 XLM...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span>Get 10,000 Testnet XLM (Instant)</span>
              </>
            )}
          </button>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30 text-brand-emerald font-mono text-xs text-center animate-in fade-in">
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Testnet Explorer Links */}
        <div className="pt-3 border-t border-white/5 font-mono text-xs space-y-2">
          <div className="text-slate-400 text-[11px]">External Testnet Resources:</div>
          <div className="flex gap-2">
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-center flex items-center justify-center gap-1"
            >
              <span>Stellar Expert</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
            <a
              href="https://laboratory.stellar.org/#account-creator?network=test"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-center flex items-center justify-center gap-1"
            >
              <span>Stellar Lab</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
