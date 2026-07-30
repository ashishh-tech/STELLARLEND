'use client';

import { useState } from 'react';
import { getAddress, isConnected } from '@stellar/freighter-api';
import { deposit, withdraw, borrow, repay } from '@/lib/contract';

const ACTION_FN = {
  supply: deposit,
  withdraw: withdraw,
  borrow: borrow,
  repay: repay,
};

export default function AssetModal({ asset, type, onClose, onConfirm, balance = 0, position = { supplied: 0, borrowed: 0 } }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate max available for current action
  let maxAmount = 0;
  if (type === 'supply') maxAmount = balance;
  else if (type === 'withdraw') maxAmount = position.supplied;
  else if (type === 'borrow') maxAmount = Math.max(0, (position.supplied * 0.75) - position.borrowed);
  else if (type === 'repay') maxAmount = position.borrowed;

  const handlePreset = (percent) => {
    if (maxAmount > 0) {
      const calculated = (maxAmount * percent).toFixed(4);
      setAmount(calculated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      setTxStatus('signing');

      const connResult = await isConnected();
      if (!(connResult?.isConnected ?? connResult)) {
        throw new Error("Please connect your Freighter wallet first.");
      }
      const addrResult = await getAddress();
      const userAddress = addrResult?.address ?? addrResult;
      if (!userAddress || typeof userAddress !== 'string') {
        throw new Error("Could not get wallet address. Please reconnect Freighter.");
      }

      const contractFn = ACTION_FN[type];
      if (!contractFn) throw new Error(`Unknown action type: ${type}`);

      await contractFn(userAddress, parseFloat(amount), (status) => {
        setTxStatus(status);
      });

      setTxStatus('success');
      setTimeout(() => {
        onConfirm();
      }, 1500);

    } catch (err) {
      console.error("Transaction Error:", err);
      setErrorMsg(err.message);
      setTxStatus('error');
      setLoading(false);
    }
  };

  const isSupply = type === 'supply';
  const isWithdraw = type === 'withdraw';
  const isGreenAction = isSupply || isWithdraw;
  const accentColor = isGreenAction ? 'text-brand-emerald' : 'text-cyan-400';
  const accentBorder = isGreenAction ? 'border-brand-emerald/50 focus:border-brand-emerald' : 'border-cyan-400/50 focus:border-cyan-400';

  const apyLabel = (isSupply || isWithdraw) ? 'Supply' : 'Borrow';
  const apyValue = (isSupply || isWithdraw) ? asset.supplyApy : asset.borrowApy;

  const statusLabel = {
    signing: '🔑 Waiting for Freighter signature...',
    sending: '📡 Broadcasting to Stellar network...',
    polling: '⏳ Waiting for on-chain confirmation...',
    success: '✅ Transaction confirmed on Stellar Testnet!',
    error: '❌ Transaction failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="glass-card rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.7)] w-full max-w-md overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-navy-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
            <h3 className={`text-xl font-bold font-headline capitalize ${accentColor}`}>
              {type} {asset.symbol}
            </h3>
          </div>
          <button onClick={onClose} disabled={loading && txStatus !== 'error'} className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10 disabled:opacity-30">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          {/* APY info card */}
          <div className="flex justify-between items-center mb-6 p-4 bg-navy-900/90 rounded-xl border border-white/10 shadow-inner">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">{apyLabel} Rate</span>
              <span className="text-xs text-slate-500 font-mono">Algorithmic</span>
            </div>
            <span className={`font-mono font-bold text-2xl ${accentColor}`}>
              {apyValue}% <span className="text-xs text-slate-400 font-normal">APY</span>
            </span>
          </div>

          {/* Status banner */}
          {txStatus && (
            <div className={`mb-6 p-4 rounded-xl text-xs md:text-sm font-medium flex items-center gap-3 font-mono
              ${txStatus === 'success' ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/40' :
                txStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/40' :
                'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40'}`}>
              {txStatus === 'success' && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
              {txStatus === 'error' && <span className="material-symbols-outlined text-[20px]">error</span>}
              {txStatus !== 'success' && txStatus !== 'error' && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
              <span>{statusLabel[txStatus]}</span>
            </div>
          )}

          {/* Error detail */}
          {txStatus === 'error' && errorMsg && (
            <div className="mb-6 p-4 bg-navy-900/90 rounded-xl border border-red-500/30 text-xs text-red-300 font-mono overflow-auto max-h-32 shadow-inner">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          {txStatus !== 'success' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Amount ({asset.symbol})</label>
                  {maxAmount > 0 && (
                    <span className="text-xs font-mono text-slate-400">
                      Available: <span className="text-white font-bold">{maxAmount.toFixed(2)}</span>
                    </span>
                  )}
                </div>

                <div className="relative mb-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className={`w-full bg-navy-900/90 border rounded-xl p-4 pr-20 text-2xl font-mono text-white outline-none ${accentBorder} transition-colors disabled:opacity-50`}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-navy-950 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-slate-200 font-bold font-headline text-sm">{asset.symbol}</span>
                  </div>
                </div>

                {/* Percentage Quick Selector Chips */}
                {maxAmount > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {[0.25, 0.50, 0.75, 1.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePreset(pct)}
                        className="py-1.5 bg-navy-900 hover:bg-white/10 border border-white/10 hover:border-brand-emerald/40 rounded-lg font-mono text-xs text-slate-300 font-bold transition-all"
                      >
                        {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 rounded-xl font-bold font-headline flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg text-base uppercase tracking-wider
                  ${isGreenAction ? 'bg-gradient-to-r from-brand-emerald to-cyan-400 text-navy-950 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <span>{type} {amount ? `${parseFloat(amount).toFixed(2)} ${asset.symbol}` : ''}</span>
                )}
              </button>

              {txStatus === 'error' && (
                <button
                  type="button"
                  onClick={() => { setTxStatus(null); setErrorMsg(''); setLoading(false); }}
                  className="w-full mt-3 py-3 rounded-xl font-semibold font-headline border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Try Again
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
