# 📜 Changelog — StellarLend Protocol

All notable changes and product iterations to this project are documented in this file.

---

## [v2.0.1] - August 28, 2026 — Soroban Testnet Contract Deployment & Verification

### 🚀 On-Chain Deployment & Verification
- **Smart Contract Deployed**: Freshly deployed to Stellar Testnet (Contract ID: `CAFIUXARRNE45E3ZWSKSR3B3G5ZJYR3YMBRJJXTOFFFUN6CHRR3SLQSU`).
- **Contract Initialized**: Initialized on Testnet with verified persistent storage and admin controls.
- **Frontend & Environment Sync**: Synchronized all client fallbacks, environment configurations, and explorer verification links.

---

## [v2.0.0] - August 26, 2026 — Level 5 Blue Belt Scalability & Liquidation Engine Release

### 🏗️ Smart Contract Architecture Scalability Overhaul
- **Persistent Storage Migration**: Migrated per-user records from instance storage to isolated `persistent()` storage keys (`DataKey::UserPosition(User, Token)`) with automatic TTL extension (`extend_ttl`). Completely resolves single-ledger entry limits and enables infinite multi-user scale.
- **Multi-Reserve Token Ecosystem**: Added native multi-asset market support (XLM, USDC, EURC, WBTC) with individual risk parameters (LTV, Liquidation Threshold, Liquidation Bonus, Base Rate, Slope Rate).
- **Algorithmic Kink Interest Rate Model**: Implemented dynamic interest rate accrual with real-time utilization curves and linear/compounding interest indices.
- **Automated Liquidation Engine**: Added `liquidate()` function enabling community keepers to liquidate unhealthy accounts ($\text{HF} < 1.0$) and receive seized collateral with a **5.0% keeper bounty**.
- **Admin Risk Controls & Emergency Pause**: Added emergency circuit breakers (`set_paused`) and dynamic price feed updating (`set_asset_price`).
- **Comprehensive Test Suite**: Expanded unit and integration test suite to 9 tests covering multi-user isolation, token transfers, cross-asset borrowing, liquidations, and access control.

### 🎨 Frontend UI/UX Next-Gen DeFi Mastery
- **Multi-Tab Terminal Architecture**: Added 5 dedicated dashboard modules (`My Portfolio`, `Lending Markets`, `Liquidation Hub`, `Yield & Stress Simulator`, `Protocol Analytics`).
- **Interactive SVG Health Factor Arc Gauge**: Added real-time visual solvency meter classifying positions (Safe > 2.0, Good 1.5-2.0, Moderate 1.1-1.5, Liquidation < 1.0).
- **Liquidation Terminal & Keeper Auction House**: Real-time borrower risk matrix with 1-click keeper liquidation execution and bounty calculator.
- **Yield & Volatility Shock Simulator**: Interactive compound interest sliders with customizable time horizons (30D to 5Y) and $\pm 50\%$ asset price volatility crash simulations.
- **Protocol Analytics Terminal**: Visual algorithmic kink curve visualizer, reserve composition charts, and on-chain storage diagnostics.
- **Instant Testnet Faucet & Quick Funding**: Built-in Friendbot integration for testnet XLM funding.

---

## [v1.5.0] - August 14, 2026 — Level 5 Product Iteration & User Growth Release

### 🚀 Scaled User Onboarding
- **Interactive Onboarding Walkthrough (`OnboardingModal.jsx`)**: 4-step guided wizard for new users.
- **Gamified Onboarding Checklist (`OnboardingChecklist.jsx`)**: Integrated real-time activation tracker directly on the Dashboard.

### 📈 Growth & Retention Mechanisms
- **Referral & Rewards Hub (`GrowthReferralModal.jsx`)**: Viral growth engine providing unique referral URLs and invite tiers.

### 🔄 Product Iteration & Feedback Loop
- **In-App Feedback & Rating Widget (`FeedbackWidget.jsx`)**: Built-in mechanism allowing testers and liquidity providers to submit feedback.

---

## [v1.4.0] - July 31, 2026 — Soroban Testnet Contract Deployment
- Smart contract redeployed and verified on Stellar Testnet.
- Integrated Freighter wallet signing with Soroban SDK.

---

## [v1.3.0] - July 30, 2026 — UI Overhaul & Pitch Deck
- Upgraded glassmorphism visual styling, dark mode accents, and vector branding.
- Added comprehensive Pitch Deck presentation (`StellarLend_Pitch_Deck.pptx`).
