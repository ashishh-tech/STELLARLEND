'use client';

import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Coins, TrendingUp } from 'lucide-react';
import AssetModal from './AssetModal';
import * as StellarSdk from 'stellar-sdk';

const CONTRACT_ID = 'CAQWXHETDAG33F33A54SWQQFS2UQTIGPLSVKKKLVUJLH42A7V6MXQL2B';
const SERVER_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

const ASSETS = [
  { id: 'xlm', symbol: 'XLM', name: 'Stellar Lumens', supplyApy: 4.2, borrowApy: 6.8, available: '0', price: 0.11 },
];

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [realXlmBalance, setRealXlmBalance] = useState(null);
  const [address, setAddress] = useState(null);

  const [positions, setPositions] = useState({});

  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api');
        const connResult = await isConnected();
        if (connResult?.isConnected ?? connResult) {
          const addrResult = await getAddress();
          const userAddress = addrResult?.address ?? addrResult;
          if (userAddress && typeof userAddress === 'string') {
            setAddress(userAddress);
            
            // 1. Fetch XLM Balance from Horizon
            const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${userAddress}`);
            if (res.ok) {
              const data = await res.json();
              const xlm = data.balances?.find(b => b.asset_type === 'native')?.balance;
              if (xlm) setRealXlmBalance(parseFloat(xlm));
            }

            // 2. Fetch Account Data from Soroban Contract
            const server = new StellarSdk.SorobanRpc.Server(SERVER_URL);
            const contract = new StellarSdk.Contract(CONTRACT_ID);
            
            // Call get_account_data(user)
            const getAccountDataArgs = [new StellarSdk.Address(userAddress).toScVal()];
            const tx = new StellarSdk.TransactionBuilder(
              new StellarSdk.Account(userAddress, '0'),
              { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
            )
              .addOperation(contract.call('get_account_data', ...getAccountDataArgs))
              .setTimeout(30)
              .build();

            const simResponse = await server.simulateTransaction(tx);
            if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResponse)) {
              const resultXdr = simResponse.result.retval;
              // Parse ScVal from XDR string
              const resultScVal = StellarSdk.xdr.ScVal.fromXDR(resultXdr, 'base64');
              const accountData = StellarSdk.scValToNative(resultScVal);
              
              if (accountData) {
                setPositions({
                  xlm: {
                    supplied: Number(accountData.supplied) / 10**7,
                    borrowed: Number(accountData.borrowed) / 10**7,
                  }
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch blockchain data:", e);
      }
    };
    
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (asset, type) => {
    setSelectedAsset(asset);
    setActionType(type);
  };

  const handleConfirm = () => {
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
    <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-brand-emerald/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <ArrowUpCircle size={140} className="text-brand-emerald" />
          </div>
          <div className="flex items-center gap-3 text-brand-emerald mb-4 relative z-10">
            <div className="p-2 bg-brand-emerald/10 rounded-lg">
               <ArrowUpCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">Your Supplies</h3>
          </div>
          <div className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 transition-all duration-500 mb-2">{fmt(totalSupplied)}</div>
          <p className="text-muted mt-2 text-sm relative z-10 font-medium tracking-wide">
            NET APY: <span className="text-brand-emerald font-bold drop-shadow-md bg-brand-emerald/10 px-2 py-1 rounded-md ml-1">{weightedSupplyApy.toFixed(2)}%</span>
          </p>
        </div>

        <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-red-400/50 hover:shadow-[0_8px_30px_rgba(248,113,113,0.2)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <ArrowDownCircle size={140} className="text-red-400" />
          </div>
          <div className="flex items-center gap-3 text-red-400 mb-4 relative z-10">
            <div className="p-2 bg-red-400/10 rounded-lg">
               <ArrowDownCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">Your Borrows</h3>
          </div>
          <div className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 relative z-10 transition-all duration-500 mb-2">{fmt(totalBorrowed)}</div>
          <p className="text-muted mt-2 text-sm relative z-10 font-medium tracking-wide">
            BORROW LIMIT: <span className="text-yellow-400 font-bold drop-shadow-md bg-yellow-400/10 px-2 py-1 rounded-md ml-1">{fmt(borrowLimit)}</span>
          </p>
        </div>
      </div>

      {/* Persistent Portfolio Health Bar */}
      <div className="mb-12 p-6 bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl flex flex-col gap-4 shadow-2xl">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg bg-opacity-10 ${isHealthy ? 'bg-brand-emerald' : isWarning ? 'bg-yellow-400' : 'bg-red-500'}`}>
                <TrendingUp className={healthColor} size={24} />
             </div>
             <span className="text-white font-bold tracking-wide text-lg">Portfolio Health</span>
          </div>
          <span className={`text-xl font-extrabold font-mono drop-shadow-md ${healthColor}`}>
             {healthPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-4 bg-[#0F172A]/80 rounded-full overflow-hidden shadow-inner border border-brand-slate-border/30">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(0,0,0,0.6)] ${barColor}`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1 font-mono uppercase tracking-widest font-semibold opacity-70">
           <span>Liquidated (0%)</span>
           <span>Safe (100%)</span>
        </div>
      </div>

      <div className="bg-brand-emerald/10 backdrop-blur-xl border border-brand-emerald/30 rounded-2xl p-6 mb-12 shadow-[0_8px_30px_rgba(16,185,129,0.1)] flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span> Deployed Soroban Contract</h3>
          <p className="text-muted font-mono text-sm tracking-wide">Contract ID: <span className="text-brand-emerald bg-brand-emerald/10 px-2 py-1 rounded opacity-90">{CONTRACT_ID}</span></p>
        </div>
        <div className="flex gap-4">
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-brand-emerald hover:bg-brand-emerald-hover hover:scale-105 text-brand-slate rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            View on Stellar Expert
          </a>
        </div>
      </div>

      {/* Markets Table */}
      <h2 className="text-3xl font-bold text-white mb-6 tracking-wide drop-shadow-sm flex items-center gap-3">
         Lending Markets
      </h2>
      <div className="bg-brand-slate-light/40 backdrop-blur-xl border border-brand-slate-border/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-border bg-black/20">
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Asset</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Wallet Balance</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Supply APY</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Borrow APY</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs">Your Position</th>
                <th className="p-6 text-muted font-semibold tracking-wider uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-border/50">
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
