/**
 * StellarLend — Soroban Contract Integration
 *
 * This module is the single integration point between the Next.js frontend and
 * the deployed StellarLend Soroban smart contract. Supports scalable persistent
 * storage, multi-asset markets (XLM, USDC, EURC, BTC), dynamic interest rates,
 * health factor monitoring, and liquidation execution.
 */

import * as StellarSdk from "stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import {
  CONTRACT_ID as ENV_CONTRACT_ID,
  SERVER_URL as ENV_SERVER_URL,
  HORIZON_URL as ENV_HORIZON_URL,
  NETWORK_PASSPHRASE as ENV_NETWORK_PASSPHRASE,
} from "./stellar.config";

// ── Configuration Fallbacks ──────────────────────────────────────────────────
export const CONTRACT_ID =
  ENV_CONTRACT_ID || "CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS";

export const SERVER_URL =
  ENV_SERVER_URL || "https://soroban-testnet.stellar.org";

export const HORIZON_URL =
  ENV_HORIZON_URL || "https://horizon-testnet.stellar.org";

export const NETWORK_PASSPHRASE =
  ENV_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getServer() {
  return new StellarSdk.SorobanRpc.Server(SERVER_URL);
}

export function getContract() {
  return new StellarSdk.Contract(CONTRACT_ID);
}

/**
 * Convert an asset amount to the i128 stroops ScVal (1 unit = 10_000_000 stroops).
 */
export function amountToScVal(amount) {
  return StellarSdk.nativeToScVal(
    BigInt(Math.round(parseFloat(amount) * 1e7)),
    { type: "i128" }
  );
}

export async function requireWallet() {
  const connResult = await isConnected();
  if (!(connResult?.isConnected ?? connResult)) {
    throw new Error("Freighter wallet is not installed or not connected.");
  }
  const addrResult = await getAddress();
  const address = addrResult?.address ?? addrResult;
  if (!address || typeof address !== "string") {
    throw new Error("Could not retrieve wallet address. Please reconnect Freighter.");
  }
  return address;
}

export async function fetchAccount(address) {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!res.ok) {
    throw new Error("Failed to fetch account from Horizon. Is your testnet account funded?");
  }
  const data = await res.json();
  return new StellarSdk.Account(address, data.sequence);
}

/**
 * Full lifecycle for a mutating contract call
 */
async function submitContractTx(userAddress, fnName, args, onStatus) {
  const server = getServer();
  const contract = getContract();

  onStatus?.("signing");

  const account = await fetchAccount(userAddress);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(60)
    .build();

  const simResponse = await server.simulateTransaction(tx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResponse)) {
    const detail = JSON.stringify(simResponse?.events ?? simResponse, null, 2);
    throw new Error(`Simulation failed for "${fnName}".\n\nDetails: ${detail}`);
  }

  const assembled = StellarSdk.SorobanRpc.assembleTransaction(tx, simResponse).build();
  const xdrToSign = assembled.toXDR();

  let signResult;
  try {
    signResult = await Promise.race([
      signTransaction(xdrToSign, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: userAddress,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Freighter signing timed out (45s). Please check your wallet extension."
              )
            ),
          45000
        )
      ),
    ]);
  } catch (freighterErr) {
    throw new Error(
      freighterErr.message ||
        "Freighter signing failed. Please update your Freighter wallet extension."
    );
  }

  if (signResult?.error) {
    throw new Error("Signing rejected: " + signResult.error);
  }
  const signedXdr = signResult?.signedTxXdr ?? signResult;
  if (!signedXdr || typeof signedXdr !== "string") {
    throw new Error("Unexpected Freighter response: " + JSON.stringify(signResult));
  }

  onStatus?.("sending");
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResponse = await server.sendTransaction(signedTx);
  if (sendResponse.status === "ERROR") {
    throw new Error(
      "Network rejected transaction: " +
        JSON.stringify(sendResponse.errorResult ?? sendResponse)
    );
  }

  onStatus?.("polling");
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const rpcRes = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: { hash: sendResponse.hash },
        }),
      });
      const rpcData = await rpcRes.json();
      const status = rpcData?.result?.status;
      if (status === "SUCCESS") return rpcData.result;
      if (status === "FAILED") {
        throw new Error("Transaction was included but FAILED on-chain.");
      }
    } catch (pollErr) {
      if (pollErr.message?.includes("FAILED")) throw pollErr;
    }
  }

  throw new Error(
    "Transaction timed out. Check Stellar Expert for tx: " + sendResponse.hash
  );
}

// ── Standard Primary Pool API ────────────────────────────────────────────────

export async function deposit(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "deposit", [userScv, amountScv], onStatus);
}

export async function withdraw(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "withdraw", [userScv, amountScv], onStatus);
}

export async function borrow(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "borrow", [userScv, amountScv], onStatus);
}

export async function repay(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "repay", [userScv, amountScv], onStatus);
}

export async function getAccountData(userAddress) {
  try {
    const server = getServer();
    const contract = getContract();
    const userScv = new StellarSdk.Address(userAddress).toScVal();

    const readTx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(userAddress, "0"),
      { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_account_data", userScv))
      .setTimeout(30)
      .build();

    const simRes = await server.simulateTransaction(readTx);
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simRes)) {
      const raw = StellarSdk.scValToNative(simRes.result.retval);
      return {
        supplied: Number(raw.supplied ?? 0) / 1e7,
        borrowed: Number(raw.borrowed ?? 0) / 1e7,
      };
    }
  } catch (e) {
    console.warn("getAccountData fallback:", e);
  }
  return { supplied: 0, borrowed: 0 };
}

// ── Multi-Asset Scalable & Liquidation API ────────────────────────────────────

export async function liquidatePosition(liquidatorAddress, borrowerAddress, debtToken, collateralToken, debtAmount, onStatus) {
  const liquidatorScv = new StellarSdk.Address(liquidatorAddress).toScVal();
  const borrowerScv = new StellarSdk.Address(borrowerAddress).toScVal();
  const debtTokenScv = new StellarSdk.Address(debtToken).toScVal();
  const collateralTokenScv = new StellarSdk.Address(collateralToken).toScVal();
  const debtAmountScv = amountToScVal(debtAmount);

  return submitContractTx(
    liquidatorAddress,
    "liquidate",
    [liquidatorScv, borrowerScv, debtTokenScv, collateralTokenScv, debtAmountScv],
    onStatus
  );
}

/**
 * Read-only: calculate user Health Factor from on-chain logic
 */
export async function getHealthFactor(userAddress) {
  try {
    const server = getServer();
    const contract = getContract();
    const userScv = new StellarSdk.Address(userAddress).toScVal();

    const readTx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(userAddress, "0"),
      { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_health_factor", userScv))
      .setTimeout(30)
      .build();

    const simRes = await server.simulateTransaction(readTx);
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simRes)) {
      const raw = StellarSdk.scValToNative(simRes.result.retval);
      return Number(raw) / 10000; // Return float HF (e.g. 1.25)
    }
  } catch (e) {
    // fallback
  }
  return 10.0;
}
