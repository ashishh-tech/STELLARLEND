'use client';

import { useState } from 'react';

export default function OnboardingChecklist({
  address,
  xlmBalance,
  position,
  onOpenOnboarding,
  onOpenReferral,
  onOpenFeedback,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    {
      id: 'wallet',
      label: 'Connect Freighter Wallet',
      completed: !!address,
      actionText: 'Connect',
      icon: 'account_balance_wallet',
    },
    {
      id: 'faucet',
      label: 'Fund with Testnet XLM',
      completed: (xlmBalance || 0) > 0,
      actionText: 'Get Testnet XLM',
      actionUrl: 'https://laboratory.stellar.org/#account-creator?network=test',
      icon: 'water_drop',
    },
    {
      id: 'supply',
      label: 'Supply First Collateral (Deposit)',
      completed: (position?.supplied || 0) > 0,
      actionText: 'Deposit XLM',
      icon: 'savings',
    },
    {
      id: 'borrow',
      label: 'Execute Borrow & Maintain Health Factor',
      completed: (position?.borrowed || 0) > 0,
      actionText: 'Borrow Assets',
      icon: 'shield',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-navy-900/90 via-navy-900/60 to-navy-950/90 border border-brand-emerald/20 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-emerald/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-emerald/20 text-brand-emerald">
            <span className="material-symbols-outlined text-lg">flag</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-headline font-bold text-white">
                New User Onboarding & Activation Journey
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald font-mono font-bold text-[10px]">
                {progressPct}% Completed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Complete your activation checklist to unlock full Stellar testnet liquidity privileges.
            </p>
          </div>
        </div>

        {/* Quick Tools buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOnboarding}
            className="px-2.5 py-1.5 rounded-lg bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald text-xs font-headline font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            <span>Interactive Guide</span>
          </button>
          <button
            onClick={onOpenReferral}
            className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-xs font-headline font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">card_giftcard</span>
            <span>Referrals</span>
          </button>
          <button
            onClick={onOpenFeedback}
            className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-headline font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            <span>Feedback</span>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Progress bar */}
          <div className="w-full bg-navy-950 rounded-full h-1.5 mb-3 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-brand-emerald to-cyan-400 h-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Checklist Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                  s.completed
                    ? 'bg-brand-emerald/10 border-brand-emerald/30 text-slate-200'
                    : 'bg-navy-950/60 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`material-symbols-outlined text-base shrink-0 ${
                      s.completed ? 'text-brand-emerald' : 'text-slate-500'
                    }`}
                  >
                    {s.completed ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold truncate text-[11px]">
                      {idx + 1}. {s.label}
                    </div>
                  </div>
                </div>

                {!s.completed && s.actionUrl && (
                  <a
                    href={s.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[10px] rounded transition-colors"
                  >
                    Faucet ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
