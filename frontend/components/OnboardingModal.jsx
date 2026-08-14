'use client';

import { useState } from 'react';

const STEPS = [
  {
    title: '1. Connect Freighter Wallet',
    badge: 'Step 1 of 4',
    icon: 'account_balance_wallet',
    summary: 'Freighter is the leading secure non-custodial browser wallet for Stellar and Soroban dApps.',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          To interact with StellarLend, make sure you have the <strong>Freighter Wallet</strong> extension installed.
        </p>
        <div className="p-3.5 rounded-xl bg-navy-900/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-emerald">extension</span>
            <span className="font-semibold text-white">Freighter Extension</span>
          </div>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-brand-emerald/20 hover:bg-brand-emerald/30 text-brand-emerald font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Get Freighter</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
        <div className="text-xs text-slate-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-300">
          💡 Make sure network in Freighter Settings is toggled to <strong>TESTNET</strong>.
        </div>
      </div>
    ),
  },
  {
    title: '2. Claim Testnet XLM',
    badge: 'Step 2 of 4',
    icon: 'local_atm',
    summary: 'Use the official Stellar Friendbot to fund your test wallet with 10,000 free testnet XLM.',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          You don&apos;t need real funds to test StellarLend! Claim test tokens instantly using Stellar&apos;s Friendbot faucet.
        </p>
        <div className="p-3.5 rounded-xl bg-navy-900/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400">water_drop</span>
            <span className="font-semibold text-white">Stellar Laboratory Faucet</span>
          </div>
          <a
            href="https://laboratory.stellar.org/#account-creator?network=test"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Fund Test Account</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
        <p className="text-xs text-slate-400">
          Once funded, your XLM balance will update automatically on the StellarLend dashboard.
        </p>
      </div>
    ),
  },
  {
    title: '3. Supply Collateral & Earn APY',
    badge: 'Step 3 of 4',
    icon: 'savings',
    summary: 'Deposit XLM into the Soroban smart contract pool to begin earning dynamic supply interest.',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Supplying assets to StellarLend activates your collateral balance:
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs text-slate-300">
          <li><strong>Earn 4.2% APY</strong> compounded algorithmically on-chain.</li>
          <li><strong>Unlock 75% Borrow Capacity</strong> (Max LTV) against your deposited collateral.</li>
          <li>Withdraw your collateral whenever you want as long as your health factor permits.</li>
        </ul>
      </div>
    ),
  },
  {
    title: '4. Borrow & Manage Risk',
    badge: 'Step 4 of 4',
    icon: 'shield',
    summary: 'Borrow liquidity with sub-second Soroban finality while keeping your portfolio safe.',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Borrowing enables instant liquidity without needing to sell your underlying Stellar assets:
        </p>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1.5 text-xs text-slate-200">
          <div className="font-semibold text-brand-emerald flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">health_metrics</span>
            <span>Health Factor & Safety Rule</span>
          </div>
          <p>
            Always maintain a Health Factor above <strong>1.00</strong> (Green zone) to prevent automatic liquidation.
          </p>
        </div>
      </div>
    ),
  },
];

export default function OnboardingModal({ isOpen, onClose, onConnectWallet, isConnected }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-navy-900/95 border border-white/15 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-emerald via-cyan-400 to-brand-emerald" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-emerald/20 text-brand-emerald flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">{step.icon}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-brand-emerald font-semibold">
                {step.badge}
              </span>
              <h3 className="text-lg font-headline font-bold text-white leading-tight">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-navy-950 rounded-full h-1.5 mb-6 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-brand-emerald to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="min-h-[170px] mb-6">
          <p className="text-xs text-slate-400 mb-3 font-medium">{step.summary}</p>
          {step.content}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-headline transition-colors ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            {!isConnected && currentStep === 0 && onConnectWallet && (
              <button
                onClick={() => {
                  onConnectWallet();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold font-headline transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>Connect Now</span>
              </button>
            )}

            {isLast ? (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-emerald to-cyan-400 text-navy-950 font-headline font-bold text-xs hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emerald/90 text-navy-950 font-headline font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
