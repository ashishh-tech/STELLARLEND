'use client';

import { useState } from 'react';

export default function GrowthReferralModal({ isOpen, onClose, address }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralCode = address ? `STL-${address.slice(0, 5)}${address.slice(-3)}` : 'STL-EARLYBIRD';
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : `https://stellarlendmastery-demo.netlify.app?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const TIERS = [
    { name: 'Bronze Explorer', invites: '1-5 Users', reward: '+0.25% Supply APY Boost', icon: 'military_tech', active: true },
    { name: 'Silver Guardian', invites: '6-20 Users', reward: '+0.50% APY Boost + 10% Fee Share', icon: 'workspace_premium', active: false },
    { name: 'Gold Luminary', invites: '21+ Users', reward: '+1.00% APY Boost + 25% Fee Share', icon: 'diamond', active: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-navy-900/95 border border-white/15 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-brand-emerald to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">card_giftcard</span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                User Growth & Rewards Engine
              </span>
              <h3 className="text-lg font-headline font-bold text-white leading-tight">
                Referral & Ecosystem Hub
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

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Invite fellow Stellar developers and DeFi liquidity providers to earn tiered APY boosts and algorithmic protocol fee-shares.
        </p>

        {/* Referral Link Copy Section */}
        <div className="p-3.5 rounded-xl bg-navy-950/90 border border-white/10 mb-5">
          <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between items-center">
            <span>YOUR PERSONAL REFERRAL LINK</span>
            <span className="text-brand-emerald font-bold">{referralCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none select-all"
            />
            <button
              onClick={copyToClipboard}
              className="px-3.5 py-2 rounded-lg bg-brand-emerald hover:bg-brand-emerald/90 text-navy-950 text-xs font-headline font-bold transition-all shrink-0 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Tier Roadmap */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-headline font-bold text-slate-200 mb-1">
            Community Retention & Growth Tiers
          </div>
          {TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                tier.active
                  ? 'bg-brand-emerald/10 border-brand-emerald/30 text-white'
                  : 'bg-navy-950/50 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-lg">{tier.icon}</span>
                <div>
                  <div className="font-semibold text-slate-200">{tier.name}</div>
                  <div className="text-[11px] text-slate-400">{tier.invites}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-brand-emerald">{tier.reward}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Growth Stats Preview */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-navy-950/80 border border-white/10 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">REFERRALS</div>
            <div className="text-sm font-headline font-bold text-white">0</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">ACTIVE DEPOSITS</div>
            <div className="text-sm font-headline font-bold text-brand-emerald">0.00 XLM</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">APY BONUS</div>
            <div className="text-sm font-headline font-bold text-amber-400">+0.25%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
