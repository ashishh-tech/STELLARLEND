'use client';

import { useState } from 'react';
import { X, Layers, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import * as StellarSdk from 'stellar-sdk';
import { isConnected, getAddress, signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = 'CAQWXHETDAG33F33A54SWQQFS2UQTIGPLSVKKKLVUJLH42A7V6MXQL2B';
const SERVER_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export default function AssetModal({ asset, type, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | 'signing' | 'sending' | 'polling' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // --- 1. Verify wallet connected ---
      setTxStatus('signing');
      const connResult = await isConnected();
      if (!(connResult?.isConnected ?? connResult)) {
        throw new Error("Please connect your Freighter wallet first.");
      }

      const addrResult = await getAddress();
      const userAddress = addrResult?.address ?? addrResult;
      if (!userAddress || typeof userAddress !== 'string') {
        throw new Error("Could not get wallet address. Please reconnect Freighter.");
      }

      // --- 2. Build the transaction ---
      const server = new StellarSdk.SorobanRpc.Server(SERVER_URL);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const functionName = type === 'supply' ? 'deposit' : 'borrow';
      // Contract uses 7 decimal places (Stellar stroop-like)
      const amountScv = StellarSdk.nativeToScVal(
        BigInt(Math.round(parseFloat(amount) * 10_000_000)),
        { type: 'i128' }
      );
      const userScv = new StellarSdk.Address(userAddress).toScVal();

      // Fetch real account sequence from Horizon
      const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${userAddress}`);
      if (!horizonRes.ok) throw new Error("Failed to fetch account info. Is your testnet account funded?");
      const accountData = await horizonRes.json();

      // TransactionBuilder increments sequence internally — pass current sequence as-is
      const account = new StellarSdk.Account(userAddress, accountData.sequence);

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(functionName, userScv, amountScv))
        .setTimeout(60)
        .build();

      // --- 3. Simulate ---
      const simResponse = await server.simulateTransaction(tx);
      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResponse)) {
        // Extract human-readable error from simulation diagnostics
        const simError = JSON.stringify(simResponse?.events ?? simResponse, null, 2);
        throw new Error("Simulation failed. The contract rejected this call.\n\nDetails: " + simError);
      }

      // Assemble (adds auth + soroban data)
      const assembledTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simResponse).build();

      // --- 4. Sign with Freighter ---
      // Freighter v6: signTransaction returns { signedTxXdr: string } | { error: string }
      const signResult = await signTransaction(assembledTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult?.error) {
        throw new Error("Signing rejected: " + signResult.error);
      }

      // v6 returns { signedTxXdr } — extract the string
      const signedXdr = signResult?.signedTxXdr ?? signResult;
      if (!signedXdr || typeof signedXdr !== 'string') {
        throw new Error("Unexpected response from Freighter. Got: " + JSON.stringify(signResult));
      }

      // --- 5. Send ---
      setTxStatus('sending');
      // sendTransaction needs a Transaction object, not a raw string — deserialize first
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResponse = await server.sendTransaction(signedTx);

      if (sendResponse.status === 'ERROR') {
        throw new Error("Network rejected transaction: " + JSON.stringify(sendResponse.errorResult ?? sendResponse));
      }

      // --- 6. Poll for confirmation via raw RPC ---
      // BYPASS server.getTransaction() entirely — SDK v12 throws "Bad union switch: 4"
      // on every response (SUCCESS included) due to XDR parse bugs.
      // Raw JSON-RPC returns a plain { status: "SUCCESS"|"FAILED"|"NOT_FOUND" } object.
      setTxStatus('polling');
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const rpcRes = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getTransaction',
              params: { hash: sendResponse.hash },
            }),
          });
          const rpcData = await rpcRes.json();
          const status = rpcData?.result?.status;
          if (status === 'SUCCESS') { confirmed = true; break; }
          if (status === 'FAILED') throw new Error('Transaction was included but FAILED on-chain.');
          // NOT_FOUND → still pending, keep polling
        } catch (pollErr) {
          if (pollErr.message?.includes('FAILED')) throw pollErr;
          // network hiccup or NOT_FOUND — continue
        }
      }

      if (!confirmed) throw new Error('Transaction timed out. Check Stellar Expert for tx: ' + sendResponse.hash);

      setTxStatus('success');
      setTimeout(() => {
        onConfirm(); // triggers parent refresh
      }, 1500);

    } catch (err) {
      console.error("Transaction Error:", err);
      setErrorMsg(err.message);
      setTxStatus('error');
      setLoading(false);
    }
  };

  const isSupply = type === 'supply';
  const accentColor = isSupply ? 'text-brand-emerald' : 'text-red-400';
  const accentBg = isSupply ? 'bg-brand-emerald' : 'bg-red-400';
  const accentBorder = isSupply ? 'border-brand-emerald/50' : 'border-red-400/50';

  const statusLabel = {
    signing: '🔑 Waiting for Freighter signature...',
    sending: '📡 Broadcasting to Stellar network...',
    polling: '⏳ Waiting for on-chain confirmation...',
    success: '✅ Transaction confirmed!',
    error: '❌ Transaction failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-brand-slate-light border border-brand-slate-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-slate-border flex justify-between items-center bg-brand-slate/60">
          <h3 className={`text-lg font-bold text-white capitalize flex items-center gap-2 ${accentColor}`}>
            <Activity size={20} />
            {type} {asset.symbol}
          </h3>
          <button onClick={onClose} disabled={loading && txStatus !== 'error'} className="text-muted hover:text-white transition-colors p-1 rounded-full hover:bg-brand-slate disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* APY info */}
          <div className="flex justify-between items-center mb-6 p-4 bg-brand-slate rounded-lg border border-brand-slate-border/50">
            <span className="text-muted text-sm">{isSupply ? 'Supply' : 'Borrow'} APY</span>
            <span className={`font-mono font-bold text-lg ${accentColor}`}>
              {isSupply ? asset.supplyApy : asset.borrowApy}%
            </span>
          </div>

          {/* Borrow collateral hint */}
          {!isSupply && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs">
              ⚠️ Max borrow = 75% of your supplied amount. Supply XLM first if you haven't.
            </div>
          )}

          {/* Status banner */}
          {txStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2
              ${txStatus === 'success' ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30' :
                txStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
              {txStatus === 'success' && <CheckCircle size={16} />}
              {txStatus === 'error' && <AlertCircle size={16} />}
              {txStatus !== 'success' && txStatus !== 'error' && <Layers size={16} className="animate-spin" />}
              <span>{statusLabel[txStatus]}</span>
            </div>
          )}

          {/* Error detail */}
          {txStatus === 'error' && errorMsg && (
            <div className="mb-4 p-3 bg-brand-slate rounded-lg border border-red-500/20 text-xs text-muted font-mono overflow-auto max-h-28">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          {txStatus !== 'success' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm text-muted mb-2">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className={`w-full bg-brand-slate border rounded-lg p-4 pr-20 text-2xl font-mono text-white outline-none focus:${accentBorder} ${accentBorder} transition-colors disabled:opacity-50`}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-muted font-bold">{asset.symbol}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50
                  ${isSupply ? 'bg-brand-emerald hover:bg-brand-emerald-hover text-brand-slate' : 'bg-white hover:bg-gray-200 text-brand-slate'}`}
              >
                {loading ? (
                  <>
                    <Layers className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span className="uppercase tracking-widest">
                    {type} {amount ? `${parseFloat(amount).toFixed(2)} ${asset.symbol}` : ''}
                  </span>
                )}
              </button>

              {txStatus === 'error' && (
                <button
                  type="button"
                  onClick={() => { setTxStatus(null); setErrorMsg(''); setLoading(false); }}
                  className="w-full mt-3 py-3 rounded-xl font-semibold border border-brand-slate-border text-muted hover:text-white transition-colors"
                >
                  Try Again
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
