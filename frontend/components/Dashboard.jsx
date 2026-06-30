'use client';

import { useState, useEffect, useCallback } from 'react';
import AssetModal from './AssetModal';
import { getAccountData } from '@/lib/contract';
import { CONTRACT_ID, HORIZON_URL } from '@/lib/stellar.config';

// Base APY rates — representative for demo purposes
const ASSET_META = {
  xlm: { symbol: 'XLM', name: 'Stellar Lumens', supplyApy: 4.2, borrowApy: 6.8 },
};

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [address, setAddress] = useState(null);
  const [xlmBalance, setXlmBalance] = useState(null);
  const [xlmPrice, setXlmPrice] = useState(null);
  const [position, setPosition] = useState({ supplied: 0, borrowed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch XLM price from CoinGecko ───────────────────────────────────────
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

  // ─── Fetch blockchain data: balance + contract position ───────────────────
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

      // 2. Soroban — read contract position via contract.js
      const accountData = await getAccountData(userAddress);
      setPosition(accountData);
    } catch (e) {
      console.error("Failed to fetch blockchain data:", e);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────────────────────────
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

  // ─── Manual refresh ────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBlockchainData(), fetchXlmPrice()]);
    setRefreshing(false);
  };

  // ─── After supply/borrow modal confirms ────────────────────────────────────
  const handleConfirm = async () => {
    setSelectedAsset(null);
    // Wait a moment for ledger to settle then refresh
    await new Promise(r => setTimeout(r, 1500));
    await fetchBlockchainData();
  };

  const price = xlmPrice ?? 0.11; // fallback price if CoinGecko unavailable
  const asset = { ...ASSET_META.xlm, id: 'xlm', price };

  // ─── Portfolio calculations ────────────────────────────────────────────────
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
  // const isDanger = healthPct <= 10;
  const healthColor = isHealthy ? 'text-brand-emerald' : isWarning ? 'text-yellow-400' : 'text-red-500';
  const barColor = isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500';

  const fmt = (n) => `$${n.toFixed(2)}`;
  const fmtXlm = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="container mx-auto px-4 md:px-6 py-24 md:py-28 max-w-6xl relative z-10">

      {/* ── Overview Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Supplies */}
        <div className="glass-card rounded-2xl p-5 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <span className="material-symbols-outlined text-[140px] text-brand-emerald">account_balance_wallet</span>
          </div>
          <div className="flex items-center gap-3 text-brand-emerald mb-4 relative z-10">
            <div className="p-2 bg-brand-emerald/10 rounded-lg"><span className="material-symbols-outlined">arrow_upward</span></div>
            <h3 className="text-xl font-bold text-white tracking-wide font-headline">Your Supplies</h3>
          </div>
          <div className="text-3xl md:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 relative z-10 mb-1">
            {fmt(totalSupplied)}
          </div>
          <div className="text-sm text-slate-400 font-mono relative z-10 mb-2">
            {fmtXlm(position.supplied)} XLM
          </div>
          <div className="text-brand-emerald mt-1 text-sm relative z-10 font-bold tracking-wide">
            <span className="bg-brand-emerald/10 px-2 py-1 rounded-md">NET APY: {weightedSupplyApy.toFixed(2)}%</span>
          </div>
        </div>

        {/* Borrows */}
        <div className="glass-card rounded-2xl p-5 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <span className="material-symbols-outlined text-[140px] text-red-500">credit_card</span>
          </div>
          <div className="flex items-center gap-3 text-red-400 mb-4 relative z-10">
            <div className="p-2 bg-red-500/10 rounded-lg"><span className="material-symbols-outlined">arrow_downward</span></div>
            <h3 className="text-xl font-bold text-white tracking-wide font-headline">Your Borrows</h3>
          </div>
          <div className="text-3xl md:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 relative z-10 mb-1">
            {fmt(totalBorrowed)}
          </div>
          <div className="text-sm text-slate-400 font-mono relative z-10 mb-2">
            {fmtXlm(position.borrowed)} XLM
          </div>
          <div className="text-yellow-400 mt-1 text-sm relative z-10 font-bold tracking-wide">
            <span className="bg-yellow-500/10 px-2 py-1 rounded-md">BORROW LIMIT: {fmt(borrowLimit)}</span>
          </div>
        </div>
      </div>

      {/* ── Portfolio Health ────────────────────────────────────────────────── */}
      <div className="mb-8 md:mb-12 p-4 md:p-6 glass-card rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-opacity-10 ${isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500'}`}>
              <span className={`material-symbols-outlined ${healthColor}`}>trending_up</span>
            </div>
            <span className="text-white font-bold tracking-wide text-lg font-headline">Portfolio Health</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} disabled={refreshing} className="text-slate-400 hover:text-white transition-colors disabled:opacity-50" title="Refresh data">
              <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            </button>
            <span className={`text-xl font-extrabold font-mono drop-shadow-md ${healthColor}`}>
              {healthPct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full h-4 bg-navy-950/80 rounded-full overflow-hidden shadow-inner border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between text-[10px] sm:text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest font-semibold opacity-70 gap-1">
          <span>Liquidated (0%)</span>
          {xlmPrice && (
            <span className="text-slate-400 normal-case font-normal">
              XLM = <span className="text-white font-semibold">${xlmPrice.toFixed(4)}</span>
              <span className="ml-1 opacity-60 text-xs">(live)</span>
            </span>
          )}
          <span>Safe (100%)</span>
        </div>
      </div>

      {/* ── Contract info ───────────────────────────────────────────────────── */}
      <div className="bg-brand-emerald/10 backdrop-blur-xl border border-brand-emerald/30 rounded-2xl p-4 md:p-6 mb-8 md:mb-12 shadow-[0_8px_30px_rgba(16,185,129,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3 font-headline">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            Deployed Soroban Contract
          </h3>
          <p className="text-slate-400 font-mono text-xs md:text-sm tracking-wide break-all">
            Contract ID: <span className="text-brand-emerald bg-brand-emerald/10 px-2 py-1 rounded opacity-90 break-all">{CONTRACT_ID}</span>
          </p>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 md:px-6 py-2.5 md:py-3 bg-brand-emerald hover:bg-brand-emerald-hover hover:scale-105 text-navy-950 rounded-xl font-bold text-sm md:text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] whitespace-nowrap w-full md:w-auto text-center"
        >
          View on Stellar Expert
        </a>
      </div>

      {/* ── Markets Table ───────────────────────────────────────────────────── */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 tracking-wide drop-shadow-sm font-headline">
        Lending Markets
      </h2>
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl mb-8 md:mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs">Asset</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs">Balance</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs">Price</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs hidden sm:table-cell">Supply APY</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs hidden sm:table-cell">Borrow APY</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs hidden md:table-cell">Position</th>
                <th className="p-3 md:p-6 text-slate-400 font-semibold tracking-wider uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row-hover transition-colors border-b border-white/5">
                {/* Asset */}
                <td className="p-3 md:p-4 pl-3 md:pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center glow-green">
                      <span className="material-symbols-outlined text-brand-emerald text-[20px]">monetization_on</span>
                    </div>
                    <div>
                      <div className="font-bold text-white font-headline">XLM</div>
                      <div className="text-xs text-slate-400">Stellar Lumens</div>
                    </div>
                  </div>
                </td>
                {/* Balance */}
                <td className="p-3 md:p-4 font-mono text-xs md:text-sm font-bold text-brand-emerald">
                  {xlmBalance !== null
                    ? `${xlmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`
                    : address ? <span className="text-slate-400 animate-pulse">Loading…</span> : <span className="text-slate-400">—</span>}
                </td>
                {/* Price */}
                <td className="p-3 md:p-4 font-mono text-xs md:text-sm text-white">
                  {xlmPrice ? `$${xlmPrice.toFixed(4)}` : <span className="text-slate-400 animate-pulse">…</span>}
                </td>
                {/* APYs */}
                <td className="p-3 md:p-4 text-brand-emerald font-mono font-bold text-xs md:text-sm hidden sm:table-cell">{ASSET_META.xlm.supplyApy}%</td>
                <td className="p-3 md:p-4 text-red-400 font-mono font-bold text-xs md:text-sm hidden sm:table-cell">{ASSET_META.xlm.borrowApy}%</td>
                {/* Position */}
                <td className="p-3 md:p-4 font-mono text-xs md:text-sm hidden md:table-cell">
                  {(position.supplied > 0 || position.borrowed > 0) ? (
                    <div>
                      {position.supplied > 0 && <div className="text-brand-emerald">+{fmtXlm(position.supplied)} XLM</div>}
                      {position.borrowed > 0 && <div className="text-red-400">-{fmtXlm(position.borrowed)} XLM</div>}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                {/* Actions */}
                <td className="p-3 md:p-4 pr-3 md:pr-6 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('supply'); }}
                      disabled={!address}
                      className="px-3 md:px-4 py-2 md:py-2.5 bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 border border-brand-emerald/20 hover:border-brand-emerald/50 rounded-lg text-xs md:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Supply
                    </button>
                    {position.supplied > 0 && (
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('withdraw'); }}
                        disabled={!address}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-brand-emerald/5 text-brand-emerald/80 hover:bg-brand-emerald/15 border border-brand-emerald/10 hover:border-brand-emerald/40 rounded-lg text-xs md:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Withdraw
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('borrow'); }}
                      disabled={!address}
                      className="px-3 md:px-4 py-2 md:py-2.5 bg-navy-900 border border-white/10 hover:border-slate-400 hover:bg-navy-900/80 text-white rounded-lg text-xs md:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Borrow
                    </button>
                    {position.borrowed > 0 && (
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('repay'); }}
                        disabled={!address}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/50 rounded-lg text-xs md:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Repay
                      </button>
                    )}
                  </div>
                  {!address && <div className="text-xs text-slate-500 mt-2">Connect wallet to trade</div>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          type={actionType}
          onClose={() => setSelectedAsset(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
