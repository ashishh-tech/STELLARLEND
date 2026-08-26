'use client';

import { useState, useEffect, useCallback } from 'react';
import AssetModal from './AssetModal';
import OnboardingChecklist from './OnboardingChecklist';
import HealthFactorGauge from './HealthFactorGauge';
import MarketsTable, { PROTOCOL_MARKETS } from './MarketsTable';
import LiquidationTerminal from './LiquidationTerminal';
import YieldSimulator from './YieldSimulator';
import ProtocolAnalytics from './ProtocolAnalytics';
import TestnetFaucetModal from './TestnetFaucetModal';
import { getAccountData, getHealthFactor } from '@/lib/contract';
import { HORIZON_URL } from '@/lib/stellar.config';

export default function Dashboard({
  userAddress: propAddress,
  onConnectWallet,
  onOpenOnboarding,
  onOpenReferral,
  onOpenFeedback,
}) {
  // Navigation Tabs: 'portfolio', 'markets', 'liquidations', 'simulator', 'analytics'
  const [activeTab, setActiveTab] = useState('portfolio');

  // Modal controls
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);

  // Blockchain Data State
  const [address, setAddress] = useState(propAddress || null);
  const [xlmBalance, setXlmBalance] = useState(null);
  const [xlmPrice, setXlmPrice] = useState(0.115);
  const [position, setPosition] = useState({ supplied: 0, borrowed: 0 });
  const [healthFactor, setHealthFactor] = useState(10.0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (propAddress) setAddress(propAddress);
  }, [propAddress]);

  // Fetch XLM live price
  const fetchXlmPrice = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.stellar?.usd) {
          setXlmPrice(data.stellar.usd);
        }
      }
    } catch (e) {
      console.warn("CoinGecko price fetch fallback:", e);
    }
  }, []);

  // Fetch blockchain data: balance + contract position + on-chain health factor
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

      // 1. Horizon — Native XLM balance
      const horizonRes = await fetch(`${HORIZON_URL}/accounts/${userAddress}`);
      if (horizonRes.ok) {
        const data = await horizonRes.json();
        const xlm = data.balances?.find(b => b.asset_type === 'native')?.balance;
        if (xlm) setXlmBalance(parseFloat(xlm));
      }

      // 2. Soroban — Persistent storage position
      const accountData = await getAccountData(userAddress);
      setPosition(accountData);

      // 3. Soroban — Health Factor
      const hf = await getHealthFactor(userAddress);
      setHealthFactor(hf);

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

  const handleOpenAction = (asset, type) => {
    setSelectedAsset(asset);
    setActionType(type);
  };

  const handleConfirmAction = async () => {
    setSelectedAsset(null);
    await new Promise(r => setTimeout(r, 1500));
    await fetchBlockchainData();
  };

  // Calculations
  const price = xlmPrice || 0.115;
  const totalSuppliedUsd = position.supplied * price;
  const totalBorrowedUsd = position.borrowed * price;
  const borrowLimitUsd = totalSuppliedUsd * 0.75;
  const netApy = position.supplied > 0 ? 4.25 : 0;

  const fmt = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtXlm = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  const xlmAssetMeta = PROTOCOL_MARKETS.find(m => m.id === 'xlm') || {
    id: 'xlm',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    price,
    supplyApy: 4.25,
    borrowApy: 6.80,
    ltv: 75,
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-24 md:py-28 max-w-7xl relative z-10 space-y-8">

      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-headline">
              StellarLend Terminal
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs">
              Soroban v25 Scalable
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Algorithmic P2P Liquidity Protocol with Persistent Multi-User Storage
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <button
            onClick={() => setIsFaucetOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">water_drop</span>
            <span>Testnet Faucet</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{refreshing ? 'Syncing...' : 'Sync On-Chain'}</span>
          </button>
        </div>
      </div>

      {/* Level 5 Onboarding & Activation Checklist */}
      <OnboardingChecklist
        address={address}
        xlmBalance={xlmBalance}
        position={position}
        onOpenOnboarding={onOpenOnboarding}
        onOpenReferral={onOpenReferral}
        onOpenFeedback={onOpenFeedback}
      />

      {/* Main Tab Switcher Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 font-headline font-bold text-sm">
        {[
          { id: 'portfolio', label: 'My Portfolio', icon: 'account_balance_wallet' },
          { id: 'markets', label: 'Lending Markets', icon: 'storefront' },
          { id: 'liquidations', label: 'Liquidation Hub', icon: 'gavel', badge: '5% Bounty' },
          { id: 'simulator', label: 'Yield & Stress Simulator', icon: 'calculate' },
          { id: 'analytics', label: 'Protocol Analytics', icon: 'monitoring' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-emerald text-navy-950 shadow-lg shadow-brand-emerald/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                activeTab === tab.id ? 'bg-navy-950/30 text-navy-950' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PORTFOLIO OVERVIEW ────────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top 3 KPI Grid: Supplies, Borrows, and Health Factor Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Supplies Card */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5 text-brand-emerald">
                    <div className="p-2.5 bg-brand-emerald/10 rounded-xl border border-brand-emerald/20">
                      <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-headline">Total Supplied</h3>
                  </div>
                  <span className="text-xs font-mono text-brand-emerald bg-brand-emerald/10 px-2.5 py-1 rounded-full border border-brand-emerald/20">
                    APY {netApy.toFixed(2)}%
                  </span>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-white font-mono mb-1">
                  {fmt(totalSuppliedUsd)}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {fmtXlm(position.supplied)} XLM Collateral Deposited
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-white/5 mt-4">
                <button
                  onClick={() => handleOpenAction(xlmAssetMeta, 'supply')}
                  className="flex-1 py-2.5 rounded-xl bg-brand-emerald text-navy-950 font-bold font-headline text-xs hover:bg-brand-emerald/90 transition-all text-center shadow"
                >
                  Deposit Collateral
                </button>
                <button
                  onClick={() => handleOpenAction(xlmAssetMeta, 'withdraw')}
                  disabled={position.supplied <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-200 border border-white/10 font-bold font-headline text-xs transition-all text-center disabled:opacity-40"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Borrows Card */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5 text-cyan-400">
                    <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-headline">Total Borrowed</h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20">
                    Borrow APY 6.80%
                  </span>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-cyan-400 font-mono mb-1">
                  {fmt(totalBorrowedUsd)}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Max Safe Borrow Limit: {fmt(borrowLimitUsd)} (75% LTV)
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-white/5 mt-4">
                <button
                  onClick={() => handleOpenAction(xlmAssetMeta, 'borrow')}
                  disabled={position.supplied <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-navy-950 font-bold font-headline text-xs hover:bg-cyan-400 transition-all text-center shadow disabled:opacity-40"
                >
                  Borrow XLM
                </button>
                <button
                  onClick={() => handleOpenAction(xlmAssetMeta, 'repay')}
                  disabled={position.borrowed <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-200 border border-white/10 font-bold font-headline text-xs transition-all text-center disabled:opacity-40"
                >
                  Repay Debt
                </button>
              </div>
            </div>

            {/* Health Factor Semi-Circular Arc Gauge */}
            <HealthFactorGauge
              healthFactor={healthFactor}
              totalSuppliedUsd={totalSuppliedUsd}
              totalBorrowedUsd={totalBorrowedUsd}
              borrowLimitUsd={borrowLimitUsd}
            />

          </div>

          {/* User Active Positions Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-navy-900/60">
              <h4 className="font-bold text-white font-headline text-base">Your Active Reserve Positions</h4>
              <span className="text-xs text-slate-400 font-mono">Persistent Storage Account</span>
            </div>

            <div className="p-6">
              {position.supplied === 0 && position.borrowed === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[24px]">savings</span>
                  </div>
                  <p className="text-slate-300 font-headline font-semibold text-sm">No active positions yet</p>
                  <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
                    Deposit collateral into the lending pool to start earning algorithmic yield and unlock borrowing power.
                  </p>
                  <button
                    onClick={() => handleOpenAction(xlmAssetMeta, 'supply')}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-brand-emerald text-navy-950 font-bold font-headline text-xs hover:bg-brand-emerald/90 transition-all shadow"
                  >
                    Deposit Collateral Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 uppercase">
                        <th className="pb-3">Asset</th>
                        <th className="pb-3">Supplied</th>
                        <th className="pb-3">Borrowed</th>
                        <th className="pb-3">Net APY</th>
                        <th className="pb-3 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      <tr>
                        <td className="py-4 text-white font-bold flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                            XLM
                          </span>
                          <span>Stellar Lumens</span>
                        </td>
                        <td className="py-4 text-brand-emerald font-semibold">
                          {fmtXlm(position.supplied)} XLM (${(position.supplied * price).toFixed(2)})
                        </td>
                        <td className="py-4 text-cyan-400 font-semibold">
                          {fmtXlm(position.borrowed)} XLM (${(position.borrowed * price).toFixed(2)})
                        </td>
                        <td className="py-4 text-white font-bold">
                          +4.25% Supply / 6.80% Borrow
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenAction(xlmAssetMeta, 'supply')}
                            className="px-2.5 py-1 rounded-lg bg-brand-emerald/15 hover:bg-brand-emerald text-brand-emerald hover:text-navy-950 border border-brand-emerald/30 font-bold text-xs transition-all"
                          >
                            Supply
                          </button>
                          <button
                            onClick={() => handleOpenAction(xlmAssetMeta, 'borrow')}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-400 hover:text-navy-950 border border-cyan-500/30 font-bold text-xs transition-all"
                          >
                            Borrow
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: LENDING MARKETS ───────────────────────────────────────────── */}
      {activeTab === 'markets' && (
        <div className="animate-in fade-in duration-300">
          <MarketsTable
            onSelectAction={handleOpenAction}
            userBalances={{ xlm: xlmBalance }}
            userPositions={position}
          />
        </div>
      )}

      {/* ── TAB 3: LIQUIDATION TERMINAL ─────────────────────────────────────── */}
      {activeTab === 'liquidations' && (
        <div className="animate-in fade-in duration-300">
          <LiquidationTerminal userAddress={address} />
        </div>
      )}

      {/* ── TAB 4: YIELD & STRESS SIMULATOR ─────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div className="animate-in fade-in duration-300">
          <YieldSimulator />
        </div>
      )}

      {/* ── TAB 5: PROTOCOL ANALYTICS ───────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="animate-in fade-in duration-300">
          <ProtocolAnalytics />
        </div>
      )}

      {/* Action Modal (Deposit, Withdraw, Borrow, Repay) */}
      {selectedAsset && actionType && (
        <AssetModal
          asset={selectedAsset}
          type={actionType}
          onClose={() => setSelectedAsset(null)}
          onConfirm={handleConfirmAction}
          balance={selectedAsset.id === 'xlm' ? (xlmBalance || 0) : 5000}
          position={position}
        />
      )}

      {/* Testnet Faucet Modal */}
      <TestnetFaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        address={address}
        onFundSuccess={fetchBlockchainData}
      />

    </div>
  );
}
