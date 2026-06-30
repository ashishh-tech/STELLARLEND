/**
 * StellarLend — Soroban Contract Integration
 *
 * This module is the single integration point between the Next.js frontend and
 * the deployed StellarLend Soroban smart contract. Every contract function
 * exposed in contracts/stellarlend/src/lib.rs has a matching JavaScript wrapper
 * here that builds, simulates, signs (via Freighter), submits, and polls the
 * transaction.
 *
 * Runtime values come from environment variables (see .env.example).
 * The hardcoded CONTRACT_ID below is only used as a fallback.
 */

import * as StellarSdk from "stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import {
  CONTRACT_ID as ENV_CONTRACT_ID,
  SERVER_URL,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
} from "./stellar.config";

// ── Contract ID (fallback when env var is unset) ─────────────────────────────
const CONTRACT_ID =
  ENV_CONTRACT_ID ||
  "CAEHJM2NVDC7IPHICCPAVSNFF3MN4SK4F5K5O6V5T3MSDQBULBLNLUCB";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a connected SorobanRpc.Server instance. */
function getServer() {
  return new StellarSdk.SorobanRpc.Server(SERVER_URL);
}

/** Return a Contract handle bound to our deployed contract. */
function getContract() {
  return new StellarSdk.Contract(CONTRACT_ID);
}

/**
 * Convert an XLM-denominated amount (e.g. 1.5) to the i128 stroops ScVal
 * expected by the contract (1 XLM = 10_000_000 stroops).
 */
function amountToScVal(xlmAmount) {
  return StellarSdk.nativeToScVal(
    BigInt(Math.round(parseFloat(xlmAmount) * 1e7)),
    { type: "i128" }
  );
}

/**
 * Ensure Freighter is connected and return the user's public key.
 * Throws if the wallet is unavailable or access was denied.
 */
async function requireWallet() {
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

/**
 * Fetch the current sequence number for an account from Horizon.
 */
async function fetchAccount(address) {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!res.ok) {
    throw new Error("Failed to fetch account from Horizon. Is your testnet account funded?");
  }
  const data = await res.json();
  return new StellarSdk.Account(address, data.sequence);
}

/**
 * Full lifecycle for a mutating contract call:
 *   build tx → simulate → assemble → sign (Freighter) → send → poll
 *
 * @param {string}   userAddress  Stellar public key
 * @param {string}   fnName       Contract function name
 * @param {ScVal[]}  args         Soroban ScVal arguments
 * @param {function} [onStatus]   Optional (status: string) => void callback
 * @returns {object} The successful getTransaction RPC result
 */
async function submitContractTx(userAddress, fnName, args, onStatus) {
  const server = getServer();
  const contract = getContract();

  onStatus?.("signing");

  // 1. Build the transaction
  const account = await fetchAccount(userAddress);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(60)
    .build();

  // 2. Simulate
  const simResponse = await server.simulateTransaction(tx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResponse)) {
    const detail = JSON.stringify(simResponse?.events ?? simResponse, null, 2);
    throw new Error(`Simulation failed for "${fnName}".\n\nDetails: ${detail}`);
  }

  // 3. Assemble with resource estimates from simulation
  const assembled = StellarSdk.SorobanRpc.assembleTransaction(tx, simResponse).build();

  // 4. Sign via Freighter
  const signResult = await signTransaction(assembled.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (signResult?.error) {
    throw new Error("Signing rejected: " + signResult.error);
  }
  const signedXdr = signResult?.signedTxXdr ?? signResult;
  if (!signedXdr || typeof signedXdr !== "string") {
    throw new Error("Unexpected Freighter response: " + JSON.stringify(signResult));
  }

  // 5. Submit
  onStatus?.("sending");
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResponse = await server.sendTransaction(signedTx);
  if (sendResponse.status === "ERROR") {
    throw new Error(
      "Network rejected transaction: " +
        JSON.stringify(sendResponse.errorResult ?? sendResponse)
    );
  }

  // 6. Poll for confirmation
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

// ── Public Contract Functions ────────────────────────────────────────────────
// Each function below maps 1-to-1 with the Rust contract in
// contracts/stellarlend/src/lib.rs

/**
 * Initialize the contract with an admin address.
 * Calls: `initialize(admin: Address)`
 *
 * @param {string}   adminAddress  Stellar public key of the admin
 * @param {function} [onStatus]    Optional status callback
 */
export async function initialize(adminAddress, onStatus) {
  const userAddress = await requireWallet();
  const adminScv = new StellarSdk.Address(adminAddress).toScVal();
  return submitContractTx(userAddress, "initialize", [adminScv], onStatus);
}

/**
 * Deposit (supply) XLM into the lending pool.
 * Calls: `deposit(user: Address, amount: i128)`
 *
 * @param {string}   userAddress  Stellar public key
 * @param {number}   amount       Amount in XLM (e.g. 10.5)
 * @param {function} [onStatus]   Optional status callback
 */
export async function deposit(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "deposit", [userScv, amountScv], onStatus);
}

/**
 * Withdraw XLM from the lending pool.
 * Calls: `withdraw(user: Address, amount: i128)`
 *
 * @param {string}   userAddress  Stellar public key
 * @param {number}   amount       Amount in XLM
 * @param {function} [onStatus]   Optional status callback
 */
export async function withdraw(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "withdraw", [userScv, amountScv], onStatus);
}

/**
 * Borrow XLM against supplied collateral.
 * Calls: `borrow(user: Address, amount: i128)`
 * Max borrow = 75% of supplied amount (enforced on-chain).
 *
 * @param {string}   userAddress  Stellar public key
 * @param {number}   amount       Amount in XLM
 * @param {function} [onStatus]   Optional status callback
 */
export async function borrow(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "borrow", [userScv, amountScv], onStatus);
}

/**
 * Repay borrowed XLM.
 * Calls: `repay(user: Address, amount: i128)`
 *
 * @param {string}   userAddress  Stellar public key
 * @param {number}   amount       Amount in XLM
 * @param {function} [onStatus]   Optional status callback
 */
export async function repay(userAddress, amount, onStatus) {
  const userScv = new StellarSdk.Address(userAddress).toScVal();
  const amountScv = amountToScVal(amount);
  return submitContractTx(userAddress, "repay", [userScv, amountScv], onStatus);
}

/**
 * Read-only: fetch a user's account data from the contract.
 * Calls: `get_account_data(user: Address)` via simulation (no signing).
 *
 * @param {string} userAddress  Stellar public key
 * @returns {{ supplied: number, borrowed: number }}  Balances in XLM
 */
export async function getAccountData(userAddress) {
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

  // If simulation fails (e.g. account never interacted), return zeroes
  return { supplied: 0, borrowed: 0 };
}
