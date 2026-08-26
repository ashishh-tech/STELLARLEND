'use client';

import { useMemo } from 'react';

export default function HealthFactorGauge({ healthFactor = 10, totalSuppliedUsd = 0, totalBorrowedUsd = 0, borrowLimitUsd = 0 }) {
  // Health factor display logic:
  // HF >= 2.0 -> Safe (Emerald)
  // HF 1.5 - 1.99 -> Good (Cyan)
  // HF 1.1 - 1.49 -> Moderate (Amber)
  // HF < 1.1 -> Critical / Liquidation Risk (Rose)

  const isZeroBorrow = totalBorrowedUsd === 0;
  const displayHf = isZeroBorrow ? '∞' : healthFactor >= 10 ? '> 10.0' : healthFactor.toFixed(2);

  const status = useMemo(() => {
    if (isZeroBorrow) {
      return {
        label: 'No Active Debt',
        color: 'text-brand-emerald',
        bgColor: 'bg-brand-emerald/10 border-brand-emerald/30',
        desc: 'Supplied assets are earning yield with zero liquidation risk.',
        needleAngle: 180,
      };
    }
    if (healthFactor >= 2.0) {
      return {
        label: 'Safe Position',
        color: 'text-brand-emerald',
        bgColor: 'bg-brand-emerald/10 border-brand-emerald/30',
        desc: 'Collateralization is strong. Liquidation risk is minimal.',
        needleAngle: Math.min(180, 120 + (healthFactor - 2) * 20),
      };
    }
    if (healthFactor >= 1.5) {
      return {
        label: 'Good Collateralization',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        desc: 'Healthy buffer against normal market volatility.',
        needleAngle: 90 + (healthFactor - 1.5) * 60,
      };
    }
    if (healthFactor >= 1.1) {
      return {
        label: 'Moderate Risk',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        desc: 'Monitor price fluctuations or supply more collateral.',
        needleAngle: 45 + (healthFactor - 1.1) * 112.5,
      };
    }
    return {
      label: 'Liquidation Imminent',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/15 border-rose-500/40',
      desc: 'Health factor below 1.0 allows liquidators to seize collateral.',
      needleAngle: Math.max(0, healthFactor * 45),
    };
  }, [healthFactor, isZeroBorrow]);

  // Gauge calculation for SVG semi-circle
  const radius = 70;
  const circumference = Math.PI * radius; // Half-circle
  const borrowUsagePct = borrowLimitUsd > 0 ? Math.min(100, (totalBorrowedUsd / borrowLimitUsd) * 100) : 0;
  const strokeDashoffset = circumference - (borrowUsagePct / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
          </div>
          <div>
            <h4 className="font-bold text-white font-headline text-base">Liquidation Risk Engine</h4>
            <p className="text-xs text-slate-400 font-mono">Real-time Solvency Meter</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative flex flex-col items-center justify-center my-3">
        <svg className="w-48 h-28" viewBox="0 0 160 90">
          {/* Background Track */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Risk Zones Gradient */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="url(#hfGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="hfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center HF Display */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className={`text-3xl font-extrabold font-mono tracking-tight ${status.color}`}>
            {displayHf}
          </div>
          <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Health Factor</div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 font-mono text-xs">
        <div>
          <span className="text-slate-400 block">Borrow Limit Used</span>
          <span className="text-white font-bold">{borrowUsagePct.toFixed(1)}%</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block">Liquidation Threshold</span>
          <span className="text-cyan-400 font-bold">80.0% LTV</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 font-mono italic">
        {status.desc}
      </p>
    </div>
  );
}
