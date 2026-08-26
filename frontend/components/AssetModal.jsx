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

export default function AssetModal({
  asset = { symbol: 'XLM', name: 'Stellar Lumens', price: 0.115, supplyApy: 4.25, borrowApy: 6.80, ltv: 75 },
  type = 'supply', // 'supply', 'withdraw', 'borrow', 'repay'
  onClose,
  onConfirm,
  balance = 0,
  position = { supplied: 0, borrowed: 0 },
}) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const assetPrice = asset.price || 0.115;
  const amountInUsd = numAmount * assetPrice;

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
      setErrorMsg(err.message || "Transaction failed on Stellar Testnet.");
      setTxStatus('error');
      setLoading(false);
    }
  };

  const isSupply = type === 'supply';
  const isWithdraw = type === 'withdraw';
  const isGreenAction = isSupply || isWithdraw;
  const accentColor = isGreenAction ? 'text-brand-emerald' : 'text-cyan-400';
  const accentBorder = isGreenAction ? 'border-brand-emerald/50 focus:border-brand-emerald' : 'border-cyan-400/50 focus:border-cyan-400';
  const accentBtn = isGreenAction
    ? 'bg-gradient-to-r from-brand-emerald to-emerald-400 text-navy-950 shadow-brand-emerald/30'
    : 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-navy-950 shadow-cyan-400/30';

  const apyLabel = (isSupply || isWithdraw) ? 'Supply APY' : 'Borrow APY';
  const apyValue = (isSupply || isWithdraw) ? asset.supplyApy : asset.borrowApy;

  const statusLabel = {
    signing: '🔑 Waiting for Freighter signature in wallet...',
    sending: '📡 Broadcasting transaction to Stellar network...',
    polling: '⏳ Waiting for on-chain Soroban confirmation...',
    success: '✅ Transaction confirmed on Stellar Testnet!',
    error: '❌ Transaction failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-card rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.7)] w-full max-w-md overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-navy-900/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold font-mono text-xs ${accentColor}`}>
              {asset.symbol?.slice(0, 3)}
            </div>
            <div>
              <h3 className={`text-xl font-bold font-headline capitalize ${accentColor}`}>
                {type} {asset.symbol}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {asset.name} • ${assetPrice.toLocaleString()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading && txStatus !== 'error'}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Rate & Asset Info Banner */}
          <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 block">{apyLabel}</span>
              <span className={`text-sm font-bold ${accentColor}`}>{apyValue?.toFixed(2)}%</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Available for {type}</span>
              <span className="text-sm font-bold text-white">
                {maxAmount.toFixed(4)} {asset.symbol}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Specify Amount:</span>
              <span className="text-slate-400">≈ ${amountInUsd.toFixed(2)} USD</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                max={maxAmount}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading && txStatus !== 'error'}
                className={`w-full bg-navy-950/90 border ${accentBorder} rounded-xl px-4 py-3.5 text-xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 transition-all`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-slate-400">
                {asset.symbol}
              </span>
            </div>

            {/* Quick Percentage Presets */}
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
              {[
                { label: '25%', val: 0.25 },
                { label: '50%', val: 0.50 },
                { label: '75%', val: 0.75 },
                { label: 'MAX', val: 1.00 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.val)}
                  className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-center"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Protocol Parameter Details */}
          <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5 font-mono text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Max Loan-to-Value:</span>
              <span className="text-slate-200">{asset.ltv || 75}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network Fee:</span>
              <span className="text-brand-emerald font-semibold">~0.0001 XLM (Stellar)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Architecture:</span>
              <span className="text-purple-400 font-semibold">Persistent TTL (Scalable)</span>
            </div>
          </div>

          {/* Live Status Display */}
          {txStatus && (
            <div className={`p-3.5 rounded-xl text-xs font-mono border text-center animate-in fade-in ${
              txStatus === 'success' 
                ? 'bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald font-semibold' 
                : txStatus === 'error'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 animate-pulse'
            }`}>
              {statusLabel[txStatus] || txStatus}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading && txStatus !== 'error'}
            className={`w-full py-4 rounded-xl font-headline font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && txStatus !== 'error' ? (
              <>
                <span className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                <span>Processing On-Chain...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  {isGreenAction ? 'check_circle' : 'trending_up'}
                </span>
                <span className="capitalize">{type} {asset.symbol}</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
