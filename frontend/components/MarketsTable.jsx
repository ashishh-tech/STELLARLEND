'use client';

import { useState } from 'react';

export const PROTOCOL_MARKETS = [
  {
    id: 'xlm',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    price: 0.115,
    supplyApy: 4.25,
    borrowApy: 6.80,
    totalSupplied: '18,450,000',
    totalBorrowed: '9,210,000',
    utilization: 49.9,
    ltv: 75,
    liquidationThreshold: 80,
    collateralEnabled: true,
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin (Centre)',
    price: 1.00,
    supplyApy: 7.80,
    borrowApy: 10.25,
    totalSupplied: '14,200,000',
    totalBorrowed: '11,050,000',
    utilization: 77.8,
    ltv: 85,
    liquidationThreshold: 90,
    collateralEnabled: true,
    iconBg: 'bg-emerald-500/10 text-brand-emerald border-emerald-500/30',
  },
  {
    id: 'eurc',
    symbol: 'EURC',
    name: 'Euro Coin (Circle)',
    price: 1.08,
    supplyApy: 5.90,
    borrowApy: 8.15,
    totalSupplied: '6,800,000',
    totalBorrowed: '3,940,000',
    utilization: 57.9,
    ltv: 80,
    liquidationThreshold: 85,
    collateralEnabled: true,
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'btc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    price: 68450.00,
    supplyApy: 2.10,
    borrowApy: 4.40,
    totalSupplied: '84.50',
    totalBorrowed: '42.10',
    utilization: 49.8,
    ltv: 70,
    liquidationThreshold: 75,
    collateralEnabled: true,
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
];

export default function MarketsTable({ onSelectAction, userBalances = {}, userPositions = {} }) {
  const [filter, setFilter] = useState('all'); // 'all', 'collateral', 'stable'

  const filteredMarkets = PROTOCOL_MARKETS.filter(m => {
    if (filter === 'collateral') return m.collateralEnabled;
    if (filter === 'stable') return ['USDC', 'EURC'].includes(m.symbol);
    return true;
  });

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header with Filter Controls */}
      <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-900/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse" />
            <h3 className="text-xl font-bold text-white font-headline">Soroban Lending Reserves</h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Scalable multi-reserve liquidity pools backed by dynamic algorithmic interest curves
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-navy-950/80 rounded-xl border border-white/5 font-mono text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-brand-emerald text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            All Markets
          </button>
          <button
            onClick={() => setFilter('stable')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'stable' ? 'bg-brand-emerald text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Stablecoins
          </button>
          <button
            onClick={() => setFilter('collateral')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'collateral' ? 'bg-brand-emerald text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Collateral
          </button>
        </div>
      </div>

      {/* Markets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Asset</th>
              <th className="py-3.5 px-4">Market Size</th>
              <th className="py-3.5 px-4 text-right">Supply APY</th>
              <th className="py-3.5 px-4">Total Borrowed</th>
              <th className="py-3.5 px-4 text-right">Borrow APY</th>
              <th className="py-3.5 px-4 text-center">Utilization</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-body">
            {filteredMarkets.map((m) => {
              return (
                <tr key={m.id} className="hover:bg-white/[0.03] transition-colors group">
                  {/* Asset Icon & Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold font-mono text-sm ${m.iconBg}`}>
                        {m.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white font-headline flex items-center gap-1.5">
                          <span>{m.symbol}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            Max LTV {m.ltv}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {m.name} • ${m.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Market Size */}
                  <td className="py-4 px-4 font-mono">
                    <div className="text-white font-semibold">{m.totalSupplied} {m.symbol}</div>
                    <div className="text-xs text-slate-400">
                      ${(parseFloat(m.totalSupplied.replace(/,/g, '')) * m.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>

                  {/* Supply APY */}
                  <td className="py-4 px-4 text-right font-mono">
                    <span className="text-brand-emerald font-bold text-base px-2 py-1 rounded-md bg-brand-emerald/10 border border-brand-emerald/20">
                      {m.supplyApy.toFixed(2)}%
                    </span>
                  </td>

                  {/* Total Borrowed */}
                  <td className="py-4 px-4 font-mono">
                    <div className="text-white font-semibold">{m.totalBorrowed} {m.symbol}</div>
                    <div className="text-xs text-slate-400">
                      ${(parseFloat(m.totalBorrowed.replace(/,/g, '')) * m.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>

                  {/* Borrow APY */}
                  <td className="py-4 px-4 text-right font-mono">
                    <span className="text-cyan-400 font-bold text-base px-2 py-1 rounded-md bg-cyan-400/10 border border-cyan-400/20">
                      {m.borrowApy.toFixed(2)}%
                    </span>
                  </td>

                  {/* Utilization Meter */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex flex-col items-center w-24">
                      <div className="text-xs font-mono text-slate-300 font-semibold mb-1">
                        {m.utilization}%
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${m.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectAction(m, 'supply')}
                        className="px-3 py-1.5 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald text-brand-emerald hover:text-navy-950 border border-brand-emerald/30 font-headline font-bold text-xs transition-all shadow hover:shadow-brand-emerald/20"
                      >
                        Supply
                      </button>
                      <button
                        onClick={() => onSelectAction(m, 'borrow')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-400 text-cyan-400 hover:text-navy-950 border border-cyan-500/30 font-headline font-bold text-xs transition-all shadow hover:shadow-cyan-400/20"
                      >
                        Borrow
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
