'use client';

export default function Logo({ size = 'md', showSubtitle = true, className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const markSize = isSm ? 'w-7 h-7' : isLg ? 'w-12 h-12' : 'w-9 h-9';
  const titleSize = isSm ? 'text-lg' : isLg ? 'text-3xl' : 'text-xl';
  const subSize = isSm ? 'text-[9px]' : isLg ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Mark */}
      <div className={`relative ${markSize} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-emerald via-cyan-500 to-indigo-500 rounded-xl blur-sm opacity-75 animate-pulse" />
        <div className="relative w-full h-full bg-navy-950/90 border border-brand-emerald/40 rounded-xl flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-brand-emerald">
            <defs>
              <linearGradient id="logoStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stop-color="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M 18 50 A 32 32 0 1 1 75 72" fill="none" stroke="url(#logoStarGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 50 16 Q 50 50 16 50 Q 50 50 50 84 Q 50 50 84 50 Q 50 50 50 16 Z" fill="url(#logoStarGrad)" />
            <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className={`font-headline font-extrabold tracking-tight ${titleSize} flex items-center gap-0.5 leading-none`}>
          <span className="text-white">Stellar</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-cyan-400">Lend</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-ping ml-0.5" />
        </div>
        {showSubtitle && (
          <span className={`font-mono ${subSize} text-slate-400 tracking-[0.25em] uppercase font-semibold mt-1 opacity-80`}>
            DeFi Protocol
          </span>
        )}
      </div>
    </div>
  );
}
