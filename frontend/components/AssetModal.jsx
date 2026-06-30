'use client';

import { useState } from 'react';
import { getAddress, isConnected } from '@stellar/freighter-api';
import { deposit, withdraw, borrow, repay } from '@/lib/contract';

/**
 * Mapping from UI action types to the contract function to invoke.
 */
const ACTION_FN = {
  supply: deposit,
  withdraw: withdraw,
  borrow: borrow,
  repay: repay,
};

export default function AssetModal({ asset, type, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      setTxStatus('signing');

      // Ensure wallet is connected
      const connResult = await isConnected();
      if (!(connResult?.isConnected ?? connResult)) {
        throw new Error("Please connect your Freighter wallet first.");
      }
      const addrResult = await getAddress();
      const userAddress = addrResult?.address ?? addrResult;
      if (!userAddress || typeof userAddress !== 'string') {
        throw new Error("Could not get wallet address. Please reconnect Freighter.");
      }

      // Call the appropriate contract function from contract.js
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
  const isRepay = type === 'repay';

  // Color theming: supply/withdraw = green, borrow/repay = red/orange
  const isGreenAction = isSupply || isWithdraw;
  const accentColor = isGreenAction ? 'text-brand-emerald' : 'text-red-400';
  const accentBorder = isGreenAction ? 'border-brand-emerald/50' : 'border-red-400/50';

  // APY label
  const apyLabel = (isSupply || isWithdraw) ? 'Supply' : 'Borrow';
  const apyValue = (isSupply || isWithdraw) ? asset.supplyApy : asset.borrowApy;

  const statusLabel = {
    signing: '🔑 Waiting for Freighter signature...',
    sending: '📡 Broadcasting to Stellar network...',
    polling: '⏳ Waiting for on-chain confirmation...',
    success: '✅ Transaction confirmed!',
    error: '❌ Transaction failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="glass-card rounded-t-2xl sm:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex justify-between items-center bg-navy-900/60">
          <h3 className={`text-lg md:text-xl font-bold font-headline capitalize flex items-center gap-2 ${accentColor}`}>
            <span className="material-symbols-outlined">monitoring</span>
            {type} {asset.symbol}
          </h3>
          <button onClick={onClose} disabled={loading && txStatus !== 'error'} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 disabled:opacity-30">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* APY info */}
          <div className="flex justify-between items-center mb-6 p-4 bg-navy-900/80 rounded-xl border border-white/5">
            <span className="text-slate-400 font-label">{apyLabel} APY</span>
            <span className={`font-mono font-bold text-xl ${accentColor}`}>
              {apyValue}%
            </span>
          </div>

          {/* Contextual hints */}
          {type === 'borrow' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm font-body">
              ⚠️ Max borrow = 75% of your supplied amount. Supply XLM first if you haven't.
            </div>
          )}
          {type === 'withdraw' && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-body">
              ℹ️ You can only withdraw up to your supplied balance minus collateral obligations.
            </div>
          )}
          {type === 'repay' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm font-body">
              💰 Repaying reduces your borrowed balance and improves your portfolio health.
            </div>
          )}

          {/* Status banner */}
          {txStatus && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 font-body
              ${txStatus === 'success' ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30' :
                txStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
              {txStatus === 'success' && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
              {txStatus === 'error' && <span className="material-symbols-outlined text-[20px]">error</span>}
              {txStatus !== 'success' && txStatus !== 'error' && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
              <span>{statusLabel[txStatus]}</span>
            </div>
          )}

          {/* Error detail */}
          {txStatus === 'error' && errorMsg && (
            <div className="mb-6 p-4 bg-navy-900/80 rounded-xl border border-red-500/20 text-xs text-red-300/80 font-mono overflow-auto max-h-32 shadow-inner">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          {txStatus !== 'success' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6 md:mb-8">
                <label className="block text-sm text-slate-400 mb-3 font-label">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className={`w-full bg-navy-900 border rounded-xl p-4 md:p-5 pr-16 md:pr-20 text-2xl md:text-3xl font-mono text-white outline-none focus:${accentBorder} ${accentBorder} transition-colors disabled:opacity-50`}
                    autoFocus
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <span className="text-slate-400 font-bold font-headline text-lg">{asset.symbol}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`w-full py-5 rounded-xl font-bold font-headline flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg text-lg
                  ${isGreenAction ? 'bg-brand-emerald hover:bg-brand-emerald-hover text-navy-950 glow-green' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span className="uppercase tracking-widest">
                    {type} {amount ? `${parseFloat(amount).toFixed(2)} ${asset.symbol}` : ''}
                  </span>
                )}
              </button>

              {txStatus === 'error' && (
                <button
                  type="button"
                  onClick={() => { setTxStatus(null); setErrorMsg(''); setLoading(false); }}
                  className="w-full mt-4 py-4 rounded-xl font-semibold font-headline border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
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
