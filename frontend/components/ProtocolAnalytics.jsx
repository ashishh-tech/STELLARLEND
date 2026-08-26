'use client';

export default function ProtocolAnalytics() {
  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Total Value Locked (TVL)</span>
            <span className="p-1.5 rounded-lg bg-brand-emerald/10 text-brand-emerald">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">$42,850,420</div>
          <div className="text-xs text-brand-emerald font-mono mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+14.2% (30-Day Growth)</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Active Borrows</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-cyan-400 font-mono">$24,200,000</div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Pool Utilization: <span className="text-white font-bold">56.4%</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Protocol Solvency</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <span className="material-symbols-outlined text-[18px]">shield</span>
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-indigo-400 font-mono">100.0%</div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Zero Unbacked Bad Debt
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Soroban Storage Mode</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <span className="material-symbols-outlined text-[18px]">memory</span>
            </span>
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-purple-300 font-mono">Persistent TTL</div>
          <div className="text-xs text-purple-400 font-mono mt-1">
            Infinite Multi-User Scale
          </div>
        </div>
      </div>

      {/* Main Visuals: Interest Rate Kink Model Curve & Reserve Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Algorithmic Kink Interest Rate Model */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30">
                  <span className="material-symbols-outlined text-[20px]">show_chart</span>
                </span>
                <div>
                  <h4 className="font-bold text-white font-headline">Algorithmic Interest Rate Kink Curve</h4>
                  <p className="text-xs text-slate-400 font-mono">Dynamic rate adjustment based on capital utilization (U)</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Optimal U = 80%
              </span>
            </div>

            {/* SVG Visual Curve */}
            <div className="relative h-44 w-full my-4 bg-navy-950/60 rounded-xl p-4 border border-white/5 flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
                {/* Grid Lines */}
                <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                <line x1="320" y1="0" x2="320" y2="120" stroke="rgba(6,182,212,0.2)" strokeDasharray="3" />

                {/* Optimal Kink Point */}
                <circle cx="320" cy="70" r="5" fill="#06b6d4" />
                <text x="310" y="55" fill="#06b6d4" fontSize="10" fontFamily="monospace">Kink (80%)</text>

                {/* Borrow Curve Path (Kink at 80%) */}
                <path
                  d="M 0 110 Q 160 100 320 70 T 400 10"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                />

                {/* Supply Curve Path */}
                <path
                  d="M 0 118 Q 160 112 320 85 T 400 45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Borrow APY Curve</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-emerald" />
              <span className="text-slate-300">Supply APY Curve</span>
            </div>
            <div className="text-slate-400">
              Formula: <code className="text-white">R = Base + U × Slope</code>
            </div>
          </div>
        </div>

        {/* Reserve Asset Composition */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <span className="material-symbols-outlined text-[20px]">pie_chart</span>
              </span>
              <div>
                <h4 className="font-bold text-white font-headline">Reserve Pool Liquidity Breakdown</h4>
                <p className="text-xs text-slate-400 font-mono">Asset distribution across Stellar reserves</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white font-semibold">Stellar Lumens (XLM)</span>
                  <span className="text-indigo-400 font-bold">$22.3M (52.0%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '52%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white font-semibold">USD Coin (USDC)</span>
                  <span className="text-brand-emerald font-bold">$14.2M (33.1%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-brand-emerald h-2 rounded-full" style={{ width: '33.1%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white font-semibold">Euro Coin (EURC)</span>
                  <span className="text-cyan-400 font-bold">$4.8M (11.2%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '11.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white font-semibold">Wrapped Bitcoin (WBTC)</span>
                  <span className="text-amber-400 font-bold">$1.55M (3.7%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '3.7%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-emerald text-sm">lock</span>
            <span>All reserve deposits secured by on-chain SEP-41 smart contracts.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
