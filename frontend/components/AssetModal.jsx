'use client';

import { useState } from 'react';
import { X, Layers, Activity } from 'lucide-react';

export default function AssetModal({ asset, type, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);

    // Simulate a blockchain round-trip delay
    setTimeout(() => {
      setLoading(false);
      onConfirm(asset.id, type, amount); // update parent state
    }, 1200);
  };

  const isSupply = type === 'supply';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-brand-slate-light border border-brand-slate-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-brand-slate-border flex justify-between items-center bg-brand-slate/50">
          <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
            {type === 'supply' ? (
              <Activity className="text-brand-emerald" size={20} />
            ) : (
              <Activity className="text-red-400" size={20} />
            )}
            {type} {asset.symbol}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1 rounded-full hover:bg-brand-slate">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 p-4 bg-brand-slate rounded-lg border border-brand-slate-border/50">
            <span className="text-muted text-sm">{isSupply ? 'Supply' : 'Borrow'} APY</span>
            <span className={`font-mono font-bold ${isSupply ? 'text-brand-emerald' : 'text-red-400'}`}>
              {isSupply ? asset.supplyApy : asset.borrowApy}%
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-muted mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-brand-slate border border-brand-slate-border rounded-lg p-4 pr-20 text-2xl font-mono text-white outline-none focus:border-brand-emerald transition-colors"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-muted font-bold">{asset.symbol}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50
                ${isSupply ? 'bg-brand-emerald hover:bg-brand-emerald-hover text-brand-slate' : 'bg-white hover:bg-gray-200 text-brand-slate'}`}
            >
              {loading ? (
                <Layers className="animate-spin" size={20} />
              ) : (
                <span className="uppercase tracking-widest">{type} {amount ? `${parseFloat(amount).toFixed(2)} ${asset.symbol}` : ''}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
