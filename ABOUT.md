# About StellarLend Protocol

## 🎯 Mission

To build a high-performance, trustless, and mathematically sound decentralized lending and liquidity protocol on the Stellar blockchain, empowering global users with fair access to non-custodial credit, algorithmic yield, and instant borrowing.

---

## 📖 Overview

**StellarLend** is a next-generation decentralized liquidity market on Stellar Soroban that enables:

- **Lenders**: Supply multi-asset crypto collateral (XLM, USDC, EURC, WBTC) to earn continuous, compounding algorithmic yields.
- **Borrowers**: Unlock instant liquidity against deposited collateral with deterministic LTV safety ratios and zero credit checks.
- **Keepers / Liquidators**: Protect protocol solvency by liquidating undercollateralized accounts (Health Factor < 1.0) for an immediate **5.0% keeper bounty**.

---

## 🔐 Why Stellar & Soroban?

- ⚡ **Sub-Second Finality**: Fast execution times with ultra-low deterministic network fees.
- 💾 **Persistent State Scaling**: Isolated per-user ledger entries with automatic TTL renewal.
- 🌐 **Native Asset Integration**: Direct interoperability with Stellar Asset Contracts (SAC) and SEP-41 tokens.
- 🔒 **Rust Type Safety**: Provably secure `#![no_std]` smart contracts running on WebAssembly (Wasm).

---

## 🏗️ Protocol Architecture

```
                               ┌────────────────────────────────┐
                               │     Freighter Wallet / Web3    │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Next.js 16 Glassmorphism UI   │
                               │   (Portfolio/Markets/Keepers)  │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Stellar Soroban Contract     │
                               │   (Persistent TTL Storage)     │
                               └───────┬───────────────┬────────┘
                                       │               │
                     ┌─────────────────┴─┐           ┌─┴───────────────────┐
                     ▼                   ▼           ▼                     ▼
             ┌───────────────┐   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
             │  XLM Reserve  │   │ USDC Reserve  │ │ EURC Reserve  │ │ WBTC Reserve  │
             │  (75% LTV)    │   │  (85% LTV)    │ │  (80% LTV)    │ │  (70% LTV)    │
             └───────────────┘   └───────────────┘ └───────────────┘ └───────────────┘
```

### Storage Scaling Model:
1. **Global Configuration & Reserves**: Stored in `instance()` storage with active TTL renewals.
2. **User Positions & Balances**: Stored in dedicated `persistent()` storage (`DataKey::UserPosition(User, Token)`) with `extend_ttl()`. This eliminates the 64KB single-ledger footprint bottleneck.

---

## 💡 Core Features

1. **Persistent Multi-User Scalability**: Infinite account capacity with automatic TTL management.
2. **Dynamic Kink Interest Rate Model**: Supply and borrow APYs mathematically adjust based on real-time capital utilization.
3. **Liquidation Engine & Keeper Bounties**: 5% liquidation bonuses for automated protocol solvency.
4. **Interactive SVG Health Factor Meter**: Visual arc gauge classifying positions as Safe, Moderate, Risky, or Liquidatable.
5. **Yield & Volatility Shock Simulator**: Scenario forecasting for price crashes, compounding returns, and liquidation limits.
6. **Built-in Testnet Faucet**: Direct Friendbot integration for testnet onboarding.

---

## 📊 Contract Deployment

- **Network**: Stellar Testnet
- **Contract ID**: `CAFIUXARRNE45E3ZWSKSR3B3G5ZJYR3YMBRJJXTOFFFUN6CHRR3SLQSU`
- **Explorer**: [Stellar Expert Contract Explorer](https://stellar.expert/explorer/testnet/contract/CAFIUXARRNE45E3ZWSKSR3B3G5ZJYR3YMBRJJXTOFFFUN6CHRR3SLQSU)
- **Status**: ✅ Scalable, Tested & Verified

---

## 👥 Contributors

- **Ashish Chaurasia** — Founder & Protocol Architect

## 📜 License

MIT License. Built with ❤️ on the Stellar Soroban Ecosystem.
