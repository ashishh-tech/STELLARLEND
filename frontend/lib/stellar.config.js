/**
 * Stellar / Soroban network configuration.
 * All values are read from environment variables so they are never hardcoded.
 * Update .env.local to switch between testnet and mainnet without touching component code.
 */

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
export const SERVER_URL  = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL;
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL;
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE;
