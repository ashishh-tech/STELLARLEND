'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Coins, TrendingUp, RefreshCw } from 'lucide-react';
import AssetModal from './AssetModal';
import * as StellarSdk from 'stellar-sdk';

const CONTRACT_ID = 'CAQWXHETDAG33F33A54SWQQFS2UQTIGPLSVKKKLVUJLH42A7V6MXQL2B';
const SERVER_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

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
      const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${userAddress}`);
      if (horizonRes.ok) {
        const data = await horizonRes.json();
        const xlm = data.balances?.find(b => b.asset_type === 'native')?.balance;
        if (xlm) setXlmBalance(parseFloat(xlm));
      }

      // 2. Soroban — read-only simulate get_account_data
      // Use sequence '0' for pure read simulations — no ledger write needed.
      const server = new StellarSdk.SorobanRpc.Server(SERVER_URL);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      const userScv = new StellarSdk.Address(userAddress).toScVal();

      const readTx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(userAddress, '0'),
        { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(contract.call('get_account_data', userScv))
        .setTimeout(30)
        .build();

      const simRes = await server.simulateTransaction(readTx);
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simRes)) {
        const raw = StellarSdk.scValToNative(simRes.result.retval);
        setPosition({
          supplied: Number(raw.supplied ?? 0) / 1e7,
          borrowed: Number(raw.borrowed ?? 0) / 1e7,
        });
      }
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
  const isDanger = healthPct <= 10;
  const healthColor = isHealthy ? 'text-brand-emerald' : isWarning ? 'text-yellow-400' : 'text-red-500';
  const barColor = isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500';

  const fmt = (n) => `$${n.toFixed(2)}`;
  const fmtXlm = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">

      {/* ── Overview Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Supplies */}
        <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-brand-emerald/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <ArrowUpCircle size={140} className="text-brand-emerald" />
          </div>
          <div className="flex items-center gap-3 text-brand-emerald mb-4 relative z-10">
            <div className="p-2 bg-brand-emerald/10 rounded-lg"><ArrowUpCircle size={24} /></div>
            <h3 className="text-xl font-bold text-white tracking-wide">Your Supplies</h3>
          </div>
          <div className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 mb-1">
            {fmt(totalSupplied)}
          </div>
          <div className="text-sm text-muted font-mono relative z-10 mb-2">
            {fmtXlm(position.supplied)} XLM
          </div>
          <p className="text-muted mt-1 text-sm relative z-10 font-medium tracking-wide">
            NET APY: <span className="text-brand-emerald font-bold bg-brand-emerald/10 px-2 py-1 rounded-md ml-1">{weightedSupplyApy.toFixed(2)}%</span>
          </p>
        </div>

        {/* Borrows */}
        <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-red-400/50 hover:shadow-[0_8px_30px_rgba(248,113,113,0.2)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <ArrowDownCircle size={140} className="text-red-400" />
          </div>
          <div className="flex items-center gap-3 text-red-400 mb-4 relative z-10">
            <div className="p-2 bg-red-400/10 rounded-lg"><ArrowDownCircle size={24} /></div>
            <h3 className="text-xl font-bold text-white tracking-wide">Your Borrows</h3>
          </div>
          <div className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 mb-1">
            {fmt(totalBorrowed)}
          </div>
          <div className="text-sm text-muted font-mono relative z-10 mb-2">
            {fmtXlm(position.borrowed)} XLM
          </div>
          <p className="text-muted mt-1 text-sm relative z-10 font-medium tracking-wide">
            BORROW LIMIT: <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded-md ml-1">{fmt(borrowLimit)}</span>
          </p>
        </div>
      </div>

      {/* ── Portfolio Health ────────────────────────────────────────────────── */}
      <div className="mb-12 p-6 bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl flex flex-col gap-4 shadow-2xl">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-opacity-10 ${isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500'}`}>
              <TrendingUp className={healthColor} size={24} />
            </div>
            <span className="text-white font-bold tracking-wide text-lg">Portfolio Health</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} disabled={refreshing} className="text-muted hover:text-white transition-colors disabled:opacity-50" title="Refresh data">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <span className={`text-xl font-extrabold font-mono drop-shadow-md ${healthColor}`}>
              {healthPct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full h-4 bg-[#0F172A]/80 rounded-full overflow-hidden shadow-inner border border-brand-slate-border/30">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1 font-mono uppercase tracking-widest font-semibold opacity-70">
          <span>Liquidated (0%)</span>
          {xlmPrice && (
            <span className="text-muted normal-case font-normal">
              XLM = <span className="text-white font-semibold">${xlmPrice.toFixed(4)}</span>
              <span className="ml-1 opacity-60 text-xs">(live)</span>
            </span>
          )}
          <span>Safe (100%)</span>
        </div>
      </div>

      {/* ── Contract info ───────────────────────────────────────────────────── */}
      <div className="bg-brand-emerald/10 backdrop-blur-xl border border-brand-emerald/30 rounded-2xl p-6 mb-12 shadow-[0_8px_30px_rgba(16,185,129,0.1)] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            Deployed Soroban Contract
          </h3>
          <p className="text-muted font-mono text-sm tracking-wide">
            Contract ID: <span className="text-brand-emerald bg-brand-emerald/10 px-2 py-1 rounded opacity-90">{CONTRACT_ID}</span>
          </p>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-brand-emerald hover:bg-brand-emerald-hover hover:scale-105 text-brand-slate rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          View on Stellar Expert
        </a>
      </div>

      {/* ── Markets Table ───────────────────────────────────────────────────── */}
      <h2 className="text-3xl font-bold text-white mb-6 tracking-wide drop-shadow-sm">
        Lending Markets
      </h2>
      <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl overflow-hidden shadow-2xl mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-border bg-black/20">
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Asset</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Wallet Balance</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Price</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Supply APY</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Borrow APY</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Your Position</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-brand-slate-border/30 transition-colors border-b border-brand-slate-border/30">
                {/* Asset */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-slate border border-brand-slate-border flex items-center justify-center">
                      <Coins size={20} className="text-brand-emerald" />
                    </div>
                    <div>
                      <div className="font-bold text-white">XLM</div>
                      <div className="text-xs text-muted">Stellar Lumens</div>
                    </div>
                  </div>
                </td>
                {/* Balance */}
                <td className="p-4 font-mono text-sm font-bold text-brand-emerald">
                  {xlmBalance !== null
                    ? `${xlmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`
                    : address ? <span className="text-muted animate-pulse">Loading…</span> : <span className="text-muted">—</span>}
                </td>
                {/* Price */}
                <td className="p-4 font-mono text-sm text-white">
                  {xlmPrice ? `$${xlmPrice.toFixed(4)}` : <span className="text-muted animate-pulse">…</span>}
                </td>
                {/* APYs */}
                <td className="p-4 text-brand-emerald font-mono font-bold">{ASSET_META.xlm.supplyApy}%</td>
                <td className="p-4 text-red-400 font-mono font-bold">{ASSET_META.xlm.borrowApy}%</td>
                {/* Position */}
                <td className="p-4 font-mono text-sm">
                  {(position.supplied > 0 || position.borrowed > 0) ? (
                    <div>
                      {position.supplied > 0 && <div className="text-brand-emerald">+{fmtXlm(position.supplied)} XLM</div>}
                      {position.borrowed > 0 && <div className="text-red-400">-{fmtXlm(position.borrowed)} XLM</div>}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('supply'); }}
                      disabled={!address}
                      className="px-5 py-2 bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 rounded-md text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Supply
                    </button>
                    <button
                      onClick={() => { setSelectedAsset(asset); setActionType('borrow'); }}
                      disabled={!address}
                      className="px-5 py-2 bg-brand-slate border border-brand-slate-border hover:border-muted text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Borrow
                    </button>
                  </div>
                  {!address && <div className="text-xs text-muted mt-1">Connect wallet to trade</div>}
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
