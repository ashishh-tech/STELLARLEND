'use client';

import { useState } from 'react';

const INITIAL_BORROWER_POSITIONS = [
  {
    id: 'pos-1',
    borrower: 'GA7Q...3K9L',
    fullAddress: 'GA7Q92MVKH84NJ2KLPOIE849302KDLS948293021',
    collateralAsset: 'XLM',
    collateralAmount: 8500,
    collateralPrice: 0.115,
    debtAsset: 'USDC',
    debtAmount: 820,
    debtPrice: 1.00,
    liquidationThreshold: 80,
    liquidationBonus: 5,
    isTarget: true,
  },
  {
    id: 'pos-2',
    borrower: 'GB9X...7V2P',
    fullAddress: 'GB9XPQLO38947291048291049281048291048291',
    collateralAsset: 'USDC',
    collateralAmount: 3200,
    collateralPrice: 1.00,
    debtAsset: 'EURC',
    debtAmount: 2400,
    debtPrice: 1.08,
    liquidationThreshold: 90,
    liquidationBonus: 5,
    isTarget: false,
  },
  {
    id: 'pos-3',
    borrower: 'GC4M...1Y8N',
    fullAddress: 'GC4M1Y8NWPOEIRTY748392018472910482910482',
    collateralAsset: 'WBTC',
    collateralAmount: 0.15,
    collateralPrice: 68450.0,
    debtAsset: 'USDC',
    debtAmount: 9800,
    debtPrice: 1.00,
    liquidationThreshold: 75,
    liquidationBonus: 5,
    isTarget: true,
  },
  {
    id: 'pos-4',
    borrower: 'GD6K...5T3R',
    fullAddress: 'GD6KPQLA93847291048291048291048291048291',
    collateralAsset: 'XLM',
    collateralAmount: 25000,
    collateralPrice: 0.115,
    debtAsset: 'USDC',
    debtAmount: 1200,
    debtPrice: 1.00,
    liquidationThreshold: 80,
    liquidationBonus: 5,
    isTarget: false,
  },
];

export default function LiquidationTerminal({ userAddress }) {
  const [positions, setPositions] = useState(INITIAL_BORROWER_POSITIONS);
  const [liquidatingId, setLiquidatingId] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  const calculatePositionMetrics = (pos) => {
    const colValueUsd = pos.collateralAmount * pos.collateralPrice;
    const debtValueUsd = pos.debtAmount * pos.debtPrice;
    const thresholdValueUsd = colValueUsd * (pos.liquidationThreshold / 100);
    const healthFactor = debtValueUsd > 0 ? thresholdValueUsd / debtValueUsd : 10;
    const isLiquidatable = healthFactor < 1.0;

    // Seize calculations
    const maxRepayAmount = pos.debtAmount * 0.5; // Max 50% close factor
    const seizeValueUsd = maxRepayAmount * pos.debtPrice * (1 + pos.liquidationBonus / 100);
    const seizeCollateralAmount = seizeValueUsd / pos.collateralPrice;
    const bonusEarnedUsd = (maxRepayAmount * pos.debtPrice * pos.liquidationBonus) / 100;

    return {
      colValueUsd,
      debtValueUsd,
      healthFactor,
      isLiquidatable,
      maxRepayAmount,
      seizeCollateralAmount,
      bonusEarnedUsd,
    };
  };

  const handleLiquidate = async (pos) => {
    const metrics = calculatePositionMetrics(pos);
    if (!metrics.isLiquidatable) return;

    setLiquidatingId(pos.id);
    // Simulate smart contract liquidation call
    await new Promise((r) => setTimeout(r, 2000));

    // Update positions state
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === pos.id) {
          return {
            ...p,
            debtAmount: p.debtAmount - metrics.maxRepayAmount,
            collateralAmount: p.collateralAmount - metrics.seizeCollateralAmount,
          };
        }
        return p;
      })
    );

    setLiquidatingId(null);
    setSuccessModal({
      borrower: pos.borrower,
      repaid: `${metrics.maxRepayAmount.toFixed(2)} ${pos.debtAsset}`,
      seized: `${metrics.seizeCollateralAmount.toFixed(4)} ${pos.collateralAsset}`,
      bonus: `$${metrics.bonusEarnedUsd.toFixed(2)}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-card rounded-2xl p-6 border border-rose-500/20 bg-gradient-to-r from-rose-950/20 via-navy-900/60 to-navy-950/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400">
              <span className="material-symbols-outlined text-[26px]">gavel</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white font-headline">Liquidation Engine & Auction Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                  5% Keeper Bounty
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1 max-w-2xl">
                Keep the StellarLend protocol 100% solvent. When borrower health factors drop below 1.0, liquidators can repay bad debt in exchange for seized collateral plus an immediate 5.0% bonus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5 text-center">
              <span className="text-slate-400 block text-[10px]">Close Factor</span>
              <span className="text-cyan-400 font-bold text-sm">50.0%</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5 text-center">
              <span className="text-slate-400 block text-[10px]">Protocol Solvency</span>
              <span className="text-brand-emerald font-bold text-sm">100.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position List */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-navy-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h4 className="font-bold text-white font-headline">Active Protocol Borrowers & Risk Matrix</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">{positions.length} Live Accounts Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Borrower</th>
                <th className="py-3.5 px-4">Collateral Backing</th>
                <th className="py-3.5 px-4">Debt Position</th>
                <th className="py-3.5 px-4 text-center">Health Factor</th>
                <th className="py-3.5 px-4">Liquidator Bounty</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-body">
              {positions.map((pos) => {
                const metrics = calculatePositionMetrics(pos);
                const hfColor = metrics.isLiquidatable
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : metrics.healthFactor < 1.5
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-brand-emerald bg-brand-emerald/10 border-brand-emerald/30';

                return (
                  <tr key={pos.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Borrower */}
                    <td className="py-4 px-6 font-mono">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                        <span>{pos.borrower}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Stellar Testnet Account</div>
                    </td>

                    {/* Collateral */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-white font-semibold">
                        {pos.collateralAmount.toLocaleString()} {pos.collateralAsset}
                      </div>
                      <div className="text-xs text-slate-400">${metrics.colValueUsd.toFixed(2)}</div>
                    </td>

                    {/* Debt */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-white font-semibold">
                        {pos.debtAmount.toLocaleString()} {pos.debtAsset}
                      </div>
                      <div className="text-xs text-slate-400">${metrics.debtValueUsd.toFixed(2)}</div>
                    </td>

                    {/* Health Factor */}
                    <td className="py-4 px-4 text-center font-mono">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${hfColor}`}>
                        {metrics.healthFactor.toFixed(2)} HF
                      </span>
                    </td>

                    {/* Bounty */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-brand-emerald font-semibold">
                        +${metrics.bonusEarnedUsd.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">5.0% Seize Premium</div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right font-mono">
                      {metrics.isLiquidatable ? (
                        <button
                          onClick={() => handleLiquidate(pos)}
                          disabled={liquidatingId === pos.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          {liquidatingId === pos.id ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Executing...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">bolt</span>
                              <span>Liquidate 50%</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Position Solvent</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full border border-brand-emerald/40 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-brand-emerald flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">verified</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white font-headline">Liquidation Completed!</h4>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Successfully seized collateral and earned keeper bonus.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Borrower:</span>
                <span className="text-white font-semibold">{successModal.borrower}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repaid Debt:</span>
                <span className="text-rose-400 font-semibold">{successModal.repaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seized Collateral:</span>
                <span className="text-brand-emerald font-semibold">{successModal.seized}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-slate-400">Net Bounty Yield:</span>
                <span className="text-cyan-400 font-bold">{successModal.bonus}</span>
              </div>
            </div>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-brand-emerald text-navy-950 font-bold font-headline text-sm hover:bg-brand-emerald/90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
