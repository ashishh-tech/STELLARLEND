'use client';

import { useState, useEffect, useCallback } from 'react';
import AssetModal from './AssetModal';
import OnboardingChecklist from './OnboardingChecklist';
import { getAccountData } from '@/lib/contract';
import { CONTRACT_ID, HORIZON_URL } from '@/lib/stellar.config';

const ASSET_META = {
  xlm: { symbol: 'XLM', name: 'Stellar Lumens', supplyApy: 4.2, borrowApy: 6.8 },
};

export default function Dashboard({ onOpenOnboarding, onOpenReferral, onOpenFeedback }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [address, setAddress] = useState(null);
  const [xlmBalance, setXlmBalance] = useState(null);
  const [xlmPrice, setXlmPrice] = useState(null);
  const [position, setPosition] = useState({ supplied: 0, borrowed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch XLM price from CoinGecko
  const fetchXlmPrice = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
      );
      if (res.ok) {
        const data = await res.json();
        setXlmPrice(data?.stellar?.usd ?? null);
      }
    } catch (e) {
      console.warn("CoinGecko price fetch failed (using fallback):", e);
    }
  }, []);

  // Fetch blockchain data: balance + contract position
  const fetchBlockchainData = useCallback(async () => {
    try {
      const { isConnected, getAddress } = await import('@stellar/freighter-api');
      const connResult = await isConnected();
      const connected = connResult?.isConnected ?? connResult;
      if (!connected) return;

      const addrResult = await getAddress();
      const userAddress = addrResult?.address ?? addrResult;
      if (!userAddress || typeof userAddress !== 'string') return;

      setAddress(userAddress);

      // 1. Horizon — XLM balance
      const horizonRes = await fetch(`${HORIZON_URL}/accounts/${userAddress}`);
      if (horizonRes.ok) {
        const data = await horizonRes.json();
        const xlm = data.balances?.find(b => b.asset_type === 'native')?.balance;
        if (xlm) setXlmBalance(parseFloat(xlm));
      }

      // 2. Soroban — read contract position
      const accountData = await getAccountData(userAddress);
      setPosition(accountData);
    } catch (e) {
      console.error("Failed to fetch blockchain data:", e);
    }
  }, []);

  useEffect(() => {
    fetchBlockchainData();
    fetchXlmPrice();
    const dataInterval = setInterval(fetchBlockchainData, 12000);
    const priceInterval = setInterval(fetchXlmPrice, 60000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(priceInterval);
    };
  }, [fetchBlockchainData, fetchXlmPrice]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBlockchainData(), fetchXlmPrice()]);
    setRefreshing(false);
  };

  const handleConfirm = async () => {
    setSelectedAsset(null);
    await new Promise(r => setTimeout(r, 1500));
    await fetchBlockchainData();
  };

  const price = xlmPrice ?? 0.11;
  const asset = { ...ASSET_META.xlm, id: 'xlm', price };

  const totalSupplied = position.supplied * price;
  const totalBorrowed = position.borrowed * price;
  const borrowLimit = totalSupplied * 0.75;

  const weightedSupplyApy = position.supplied > 0 ? ASSET_META.xlm.supplyApy : 0;

  let healthPct = 100;
  if (borrowLimit > 0) {
    healthPct = Math.max(0, 100 - (totalBorrowed / borrowLimit) * 100);
  } else if (totalBorrowed > 0) {
    healthPct = 0;
  }

  const isHealthy = healthPct > 50;
  const isWarning = healthPct <= 50 && healthPct > 10;
  const healthColor = isHealthy ? 'text-brand-emerald' : isWarning ? 'text-yellow-400' : 'text-red-500';
  const barColor = isHealthy ? 'bg-gradient-to-r from-brand-emerald to-emerald-400' : isWarning ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-red-500 to-rose-600';

  const fmt = (n) => `$${n.toFixed(2)}`;
  const fmtXlm = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="container mx-auto px-4 md:px-6 py-24 md:py-28 max-w-6xl relative z-10">

      {/* Level 5 Onboarding & Activation Checklist */}
      <OnboardingChecklist
        address={address}
        xlmBalance={xlmBalance}
        position={position}
        onOpenOnboarding={onOpenOnboarding}
        onOpenReferral={onOpenReferral}
        onOpenFeedback={onOpenFeedback}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Supplies Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3 text-brand-emerald">
              <div className="p-2.5 bg-brand-emerald/10 rounded-xl border border-brand-emerald/20">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-wide font-headline">Your Supplies</h3>
            </div>
            <span className="text-xs font-mono text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full border border-brand-emerald/20">
              APY {weightedSupplyApy.toFixed(2)}%
            </span>
          </div>
          <div className="text-3xl md:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 relative z-10 mb-1 font-mono">
            {fmt(totalSupplied)}
          </div>
          <div className="text-sm text-slate-400 font-mono relative z-10">
            {fmtXlm(position.supplied)} XLM Collateral
          </div>
        </div>

        {/* Borrows Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <span className="material-symbols-outlined text-[24px]">credit_card</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-wide font-headline">Your Borrows</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Limit {fmt(borrowLimit)}
            </span>
          </div>
          <div className="text-3xl md:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 relative z-10 mb-1 font-mono">
            {fmt(totalBorrowed)}
          </div>
          <div className="text-sm text-slate-400 font-mono relative z-10">
            {fmtXlm(position.borrowed)} XLM Debt
          </div>
        </div>
      </div>

      {/* Portfolio Health Gauge */}
      <div className="mb-8 p-6 glass-card rounded-2xl flex flex-col gap-4 border border-white/10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-opacity-10 ${isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500'}`}>
              <span className={`material-symbols-outlined ${healthColor} text-[22px]`}>health_metrics</span>
            </div>
            <div>
              <span className="text-white font-bold tracking-wide text-lg font-headline block">Portfolio Health Factor</span>
              <span className="text-xs text-slate-400 font-mono">Liquidation threshold at 0%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} disabled={refreshing} className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 disabled:opacity-50" title="Refresh blockchain data">
              <span className={`material-symbols-outlined text-[20px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            </button>
            <span className={`text-2xl font-extrabold font-mono drop-shadow-md ${healthColor}`}>
              {healthPct.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="w-full h-3.5 bg-navy-950/90 rounded-full overflow-hidden shadow-inner border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
          <span>Risk Level: High</span>
          {xlmPrice && (
            <span className="normal-case">
              XLM Oracle: <span className="text-white font-bold">${xlmPrice.toFixed(4)}</span>
            </span>
          )}
          <span>Safe (100%)</span>
        </div>
      </div>

      {/* Contract Verification Banner */}
      <div className="bg-gradient-to-r from-brand-emerald/10 via-cyan-500/10 to-indigo-500/10 backdrop-blur-xl border border-brand-emerald/30 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2.5 font-headline">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
            Active Soroban Contract on Testnet
          </h3>
          <p className="text-slate-400 font-mono text-xs md:text-sm tracking-wide break-all">
            Contract ID: <span className="text-brand-emerald bg-brand-emerald/10 px-2.5 py-1 rounded-lg border border-brand-emerald/20 font-bold">{CONTRACT_ID}</span>
          </p>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-brand-emerald hover:bg-brand-emerald-hover text-navy-950 rounded-xl font-bold font-headline text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] whitespace-nowrap w-full md:w-auto text-center flex items-center justify-center gap-2"
        >
          <span>Verify on Explorer</span>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </a>
      </div>

      {/* Lending Markets Table */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-wide font-headline">
        Available Lending Markets
      </h2>
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40">
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs">Asset</th>
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs">Wallet Balance</th>
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs">Oracle Price</th>
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs hidden sm:table-cell">Supply APY</th>
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs hidden sm:table-cell">Borrow APY</th>
                <th className="p-4 md:p-6 text-slate-400 font-mono tracking-wider uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row-hover transition-colors border-b border-white/5">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center p-2">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-brand-emerald">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="8" />
                        <polygon points="50,20 62,40 85,50 62,60 50,80 38,60 15,50 38,40" fill="#10B981" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-white font-headline text-base">XLM</div>
                      <div className="text-xs text-slate-400 font-mono">Stellar Lumens</div>
                    </div>
                  </div>
                </td>
                
                <td className="p-4 font-mono text-sm font-bold text-brand-emerald">
                  {xlmBalance !== null
                    ? `${xlmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`
                    : address ? <span className="text-slate-400 animate-pulse">Loading…</span> : <span className="text-slate-400">—</span>}
                </td>
                
                <td className="p-4 font-mono text-sm text-white">
                  {xlmPrice ? `$${xlmPrice.toFixed(4)}` : <span className="text-slate-400 animate-pulse">…</span>}
                </td>
                
                <td className="p-4 text-brand-emerald font-mono font-bold text-sm hidden sm:table-cell">{ASSET_META.xlm.supplyApy}%</td>
                <td className="p-4 text-cyan-400 font-mono font-bold text-sm hidden sm:table-cell">{ASSET_META.xlm.borrowApy}%</td>
                
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('supply'); }}
                      disabled={!address}
                      className="px-4 py-2 bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 border border-brand-emerald/30 hover:border-brand-emerald rounded-xl text-xs font-bold font-headline transition-all disabled:opacity-40"
                    >
                      Supply
                    </button>
                    {position.supplied > 0 && (
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('withdraw'); }}
                        disabled={!address}
                        className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10 rounded-xl text-xs font-bold font-headline transition-all disabled:opacity-40"
                      >
                        Withdraw
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('borrow'); }}
                      disabled={!address}
                      className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-xs font-bold font-headline transition-all disabled:opacity-40"
                    >
                      Borrow
                    </button>
                    {position.borrowed > 0 && (
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('repay'); }}
                        disabled={!address}
                        className="px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-400 rounded-xl text-xs font-bold font-headline transition-all disabled:opacity-40"
                      >
                        Repay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          type={actionType}
          onClose={() => setSelectedAsset(null)}
          onConfirm={handleConfirm}
          balance={xlmBalance ?? 0}
          position={position}
        />
      )}
    </div>
  );
}
