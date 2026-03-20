'use client';

import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Coins, TrendingUp } from 'lucide-react';
import AssetModal from './AssetModal';

const ASSETS = [
  { id: 'xlm', symbol: 'XLM', name: 'Stellar Lumens', supplyApy: 4.2, borrowApy: 6.8, available: '0', price: 0.11 },
];

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [realXlmBalance, setRealXlmBalance] = useState(null);

  const [positions, setPositions] = useState({});

  useEffect(() => {
    const fetchRealBalance = async () => {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api');
        const connResult = await isConnected();
        if (connResult?.isConnected ?? connResult) {
          const addrResult = await getAddress();
          const address = addrResult?.address ?? addrResult;
          if (address && typeof address === 'string') {
            const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
            if (res.ok) {
              const data = await res.json();
              const xlm = data.balances?.find(b => b.asset_type === 'native')?.balance;
              if (xlm) setRealXlmBalance(parseFloat(xlm));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch real balance from horizon:", e);
      }
    };
    
    fetchRealBalance();
    
    // Poll every 10 seconds to keep balance fresh
    const interval = setInterval(fetchRealBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (asset, type) => {
    setSelectedAsset(asset);
    setActionType(type);
  };

  const handleConfirm = (assetId, type, amount) => {
    const num = parseFloat(amount) || 0;
    setPositions(prev => {
      const current = prev[assetId] || { supplied: 0, borrowed: 0 };
      return {
        ...prev,
        [assetId]: {
          ...current,
          supplied: type === 'supply' ? current.supplied + num : current.supplied,
          borrowed: type === 'borrow' ? current.borrowed + num : current.borrowed,
        }
      };
    });
    setSelectedAsset(null);
  };

  const totalSupplied = ASSETS.reduce((sum, a) => {
    const pos = positions[a.id];
    return sum + (pos?.supplied || 0) * a.price;
  }, 0);

  const totalBorrowed = ASSETS.reduce((sum, a) => {
    const pos = positions[a.id];
    return sum + (pos?.borrowed || 0) * a.price;
  }, 0);

  const weightedSupplyApy = ASSETS.reduce((sum, a) => {
    const pos = positions[a.id];
    const value = (pos?.supplied || 0) * a.price;
    return sum + (totalSupplied > 0 ? (value / totalSupplied) * a.supplyApy : 0);
  }, 0);

  const fmt = (n) => `$${n.toFixed(2)}`;
  
  // Calculate Portfolio Health (100% = No risk, 0% = Liquidated)
  const borrowLimit = totalSupplied * 0.75;
  let healthPct = 100;
  if (borrowLimit > 0) {
    healthPct = Math.max(0, 100 - ((totalBorrowed / borrowLimit) * 100));
  } else if (totalBorrowed > 0) {
    healthPct = 0; // Borrowed with nothing supplied
  }
  
  // Health states
  const isHealthy = healthPct > 50;
  const isWarning = healthPct <= 50 && healthPct > 10;
  const isDanger = healthPct <= 10;
  
  const healthColor = isHealthy ? 'text-brand-emerald' : isWarning ? 'text-yellow-400' : 'text-red-500';
  const barColor = isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-brand-slate-light border border-brand-slate-border rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-brand-emerald/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ArrowUpCircle size={100} className="text-brand-emerald" />
          </div>
          <div className="flex items-center gap-3 text-brand-emerald mb-4 relative z-10">
            <ArrowUpCircle />
            <h3 className="text-lg font-semibold text-white">Your Supplies</h3>
          </div>
          <div className="text-5xl font-bold font-mono relative z-10 transition-all duration-500">{fmt(totalSupplied)}</div>
          <p className="text-muted mt-2 text-sm relative z-10">
            Net APY: <span className="text-brand-emerald font-bold">{weightedSupplyApy.toFixed(2)}%</span>
          </p>
        </div>

        <div className="bg-brand-slate-light border border-brand-slate-border rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-red-400/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ArrowDownCircle size={100} className="text-red-400" />
          </div>
          <div className="flex items-center gap-3 text-red-400 mb-4 relative z-10">
            <ArrowDownCircle />
            <h3 className="text-lg font-semibold text-white">Your Borrows</h3>
          </div>
          <div className="text-5xl font-bold font-mono relative z-10 transition-all duration-500">{fmt(totalBorrowed)}</div>
          <p className="text-muted mt-2 text-sm relative z-10">
            Borrow Limit: <span className="text-yellow-400 font-bold">{fmt(borrowLimit)}</span>
          </p>
        </div>
      </div>

      {/* Persistent Portfolio Health Bar */}
      <div className="mb-12 p-5 bg-brand-slate-light border border-brand-slate-border rounded-2xl flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
             <TrendingUp className={healthColor} size={20} />
             <span className="text-white font-bold">Portfolio Health</span>
          </div>
          <span className={`text-lg font-bold font-mono ${healthColor}`}>
             {healthPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-brand-slate rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${barColor}`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1 font-mono uppercase tracking-wider">
           <span>Liquidated (0%)</span>
           <span>Safe (100%)</span>
        </div>
      </div>

      <div className="bg-brand-emerald/10 border border-brand-emerald/30 rounded-2xl p-6 mb-12 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Deployed Soroban Contract</h3>
          <p className="text-muted font-mono text-sm">Contract ID: <span className="text-brand-emerald">CAM2KFCN7W6AEMO7EAIO3CZ7CXEOPE3XNM3SNFXJFPS2KDDX4554AQWJ</span></p>
        </div>
        <div className="flex gap-4">
          <a
            href="https://stellar.expert/explorer/testnet/contract/CAM2KFCN7W6AEMO7EAIO3CZ7CXEOPE3XNM3SNFXJFPS2KDDX4554AQWJ"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-brand-emerald hover:bg-brand-emerald-hover text-brand-slate rounded-xl font-bold transition-all"
          >
            View on Stellar Expert
          </a>
        </div>
      </div>

      {/* Markets Table */}
      <h2 className="text-2xl font-bold text-white mb-6">Lending Markets</h2>
      <div className="bg-brand-slate-light border border-brand-slate-border rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-border bg-brand-slate/50">
                <th className="p-4 text-muted font-medium">Asset</th>
                <th className="p-4 text-muted font-medium">Wallet Balance</th>
                <th className="p-4 text-muted font-medium">Supply APY</th>
                <th className="p-4 text-muted font-medium">Borrow APY</th>
                <th className="p-4 text-muted font-medium">Your Position</th>
                <th className="p-4 text-muted font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-border">
              {ASSETS.map(asset => {
                const pos = positions[asset.id];
                const displayBalance = realXlmBalance !== null && asset.id === 'xlm' 
                  ? `${realXlmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM` 
                  : `${asset.available} ${asset.symbol}`;
                  
                return (
                  <tr key={asset.id} className="hover:bg-brand-slate-border/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-slate border border-brand-slate-border flex items-center justify-center">
                          <Coins size={20} className="text-brand-emerald" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{asset.symbol}</div>
                          <div className="text-xs text-muted">{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-brand-emerald font-bold">
                      {displayBalance}
                    </td>
                    <td className="p-4 text-brand-emerald font-mono font-bold">{asset.supplyApy}%</td>
                    <td className="p-4 text-red-400 font-mono font-bold">{asset.borrowApy}%</td>
                    <td className="p-4 font-mono text-sm">
                      {pos ? (
                        <div>
                          {pos.supplied > 0 && <div className="text-brand-emerald">+{pos.supplied.toFixed(2)} {asset.symbol}</div>}
                          {pos.borrowed > 0 && <div className="text-red-400">-{pos.borrowed.toFixed(2)} {asset.symbol}</div>}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAction(asset, 'supply')} className="px-5 py-2 bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 rounded-md text-sm font-semibold transition-colors">
                          Supply
                        </button>
                        <button onClick={() => handleAction(asset, 'borrow')} className="px-5 py-2 bg-brand-slate border border-brand-slate-border hover:border-muted text-white rounded-md text-sm font-semibold transition-colors">
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
