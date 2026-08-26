'use client';

import { useState } from 'react';

export default function YieldSimulator() {
  const [supplyUsd, setSupplyUsd] = useState(5000);
  const [borrowUsd, setBorrowUsd] = useState(2000);
  const [supplyApy, setSupplyApy] = useState(5.8);
  const [borrowApy, setBorrowApy] = useState(7.5);
  const [priceShockPct, setPriceShockPct] = useState(0); // -50% to +50%
  const [timeHorizonDays, setTimeHorizonDays] = useState(365); // 30, 90, 180, 365, 1095

  // Calculations
  const years = timeHorizonDays / 365;
  const earnedInterestUsd = supplyUsd * (Math.pow(1 + supplyApy / 100, years) - 1);
  const debtInterestUsd = borrowUsd * (Math.pow(1 + borrowApy / 100, years) - 1);
  const netEarningsUsd = earnedInterestUsd - debtInterestUsd;

  // Stressed Collateral & Health Factor
  const stressedCollateralUsd = supplyUsd * (1 + priceShockPct / 100);
  const maxBorrowLimit = stressedCollateralUsd * 0.75;
  const stressedHf = borrowUsd > 0 ? (stressedCollateralUsd * 0.80) / borrowUsd : 10;
  const isLiquidation = stressedHf < 1.0;

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="material-symbols-outlined text-[22px]">calculate</span>
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white font-headline">
              Interactive Yield & Stress Test Simulator
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-1">
            Simulate compound interest yields, borrowing cost differentials, and asset price volatility scenarios
          </p>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1 p-1 bg-navy-950/80 rounded-xl border border-white/5 font-mono text-xs self-start md:self-auto">
          {[
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
            { label: '180D', days: 180 },
            { label: '1 Year', days: 365 },
            { label: '3 Years', days: 1095 },
          ].map((t) => (
            <button
              key={t.days}
              onClick={() => setTimeHorizonDays(t.days)}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeHorizonDays === t.days ? 'bg-cyan-500 text-navy-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Sliders (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Supply Slider */}
          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-emerald" />
                Supplied Collateral Deposit:
              </span>
              <span className="text-brand-emerald font-bold text-base">${supplyUsd.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={supplyUsd}
              onChange={(e) => setSupplyUsd(parseFloat(e.target.value))}
              className="w-full accent-brand-emerald cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>$100</span>
              <span>Supply APY: {supplyApy}%</span>
              <span>$50,000</span>
            </div>
          </div>

          {/* Borrow Slider */}
          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Borrowed Capital:
              </span>
              <span className="text-cyan-400 font-bold text-base">${borrowUsd.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.floor(supplyUsd * 0.75)}
              step="50"
              value={Math.min(borrowUsd, Math.floor(supplyUsd * 0.75))}
              onChange={(e) => setBorrowUsd(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>$0</span>
              <span>Max Safe Borrow (75% LTV): ${(supplyUsd * 0.75).toLocaleString()}</span>
              <span>Borrow APY: {borrowApy}%</span>
            </div>
          </div>

          {/* Price Volatility Shock Simulator */}
          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400">trending_down</span>
                Collateral Price Volatility Shock:
              </span>
              <span className={`font-bold text-base ${priceShockPct < 0 ? 'text-rose-400' : priceShockPct > 0 ? 'text-brand-emerald' : 'text-slate-300'}`}>
                {priceShockPct > 0 ? `+${priceShockPct}%` : `${priceShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={priceShockPct}
              onChange={(e) => setPriceShockPct(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="text-rose-400">-50% (Market Crash)</span>
              <span>Baseline (0%)</span>
              <span className="text-brand-emerald">+50% (Bull Market)</span>
            </div>
          </div>

        </div>

        {/* Right Column: Projected Results (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-navy-900/90 to-navy-950 border border-white/10 shadow-inner space-y-6 font-mono">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Projected Net Yield ({timeHorizonDays} Days)
            </div>
            <div className={`text-3xl md:text-4xl font-extrabold ${netEarningsUsd >= 0 ? 'text-brand-emerald' : 'text-rose-400'}`}>
              {netEarningsUsd >= 0 ? `+$${netEarningsUsd.toFixed(2)}` : `-$${Math.abs(netEarningsUsd).toFixed(2)}`}
            </div>
          </div>

          <div className="space-y-3 text-xs border-y border-white/5 py-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Supply Earnings:</span>
              <span className="text-brand-emerald font-semibold">+${earnedInterestUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Borrow Interest Cost:</span>
              <span className="text-rose-400 font-semibold">-${debtInterestUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Collateral Value after Shock:</span>
              <span className="text-white font-semibold">${stressedCollateralUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* Stressed Solvency Alert */}
          <div className={`p-4 rounded-xl border ${isLiquidation ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : stressedHf < 1.3 ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald'}`}>
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="material-symbols-outlined text-[18px]">
                {isLiquidation ? 'warning' : stressedHf < 1.3 ? 'info' : 'verified_user'}
              </span>
              <span>{isLiquidation ? 'Liquidation Alert!' : stressedHf < 1.3 ? 'Moderate Margin Buffer' : 'Strong Solvency Buffer'}</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {isLiquidation
                ? `Health factor drops to ${stressedHf.toFixed(2)} under this price shock. Position would be liquidatable.`
                : `Health factor remains stable at ${stressedHf.toFixed(2)} with ${(maxBorrowLimit - borrowUsd).toFixed(0)} USD safety cushion.`}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
