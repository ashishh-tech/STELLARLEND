# 🚀 Stellar Soroban P2P Lending Smart Contract
[![CI/CD Pipeline](https://github.com/ashishh-tech/Stellar-Peer-to-Peer-Lending/actions/workflows/ci.yml/badge.svg)](https://github.com/ashishh-tech/Stellar-Peer-to-Peer-Lending/actions/workflows/ci.yml)
[![Soroban](https://img.shields.io/badge/Soroban-v25-blueviolet.svg)](https://soroban.stellar.org)
[![Storage](https://img.shields.io/badge/Storage-Persistent%20TTL%20Scalable-success.svg)](https://soroban.stellar.org/docs/fundamentals-and-concepts/state-archival)
[![Tests](https://img.shields.io/badge/Tests-9%20Passed-brightgreen.svg)](https://github.com/ashishh-tech/STELLARLEND)

---

## 📌 Project Description

This project is a decentralized Peer-to-Peer (P2P) lending platform built on the Stellar blockchain using Soroban smart contracts. It allows users to lend and borrow funds directly without intermediaries, ensuring transparency, security, and low transaction costs.

---

## ⚙️ What it does

The smart contract enables:

* **Lenders** to supply crypto assets, create loan offers, and earn compounding algorithmic yield
* **Borrowers** to borrow funds instantly against deposited collateral with deterministic LTV safety ratios
* **Borrowers** to repay loans transparently at any time
* **Keepers & Liquidators** to liquidate undercollateralized positions ($\text{HF} < 1.0$) for a **5.0% keeper bounty**
* **Public access** to all reserve data, positions, and loan details directly on-chain

All operations are executed on-chain using Soroban smart contracts, ensuring trustless transactions.

---

## ⚡ Scalability & Protocol Architecture Upgrades (Level 5 — Blue Belt)

### 1. 🏗️ **Infinite Multi-User Scale via Persistent Storage**
* **The Problem with Instance Storage**: In standard Soroban smart contracts, storing user records in `instance()` storage forces all user balances into a single ledger entry loaded on every invocation. Once user volume grows, this hits the 64KB footprint limit and breaks scaling permanently.
* **The StellarLend Solution**: Migrated all user positions to **isolated `persistent()` storage keys** (`DataKey::UserPosition(Address, Address)` and `DataKey::UserAccount(Address)`) with **automatic TTL extension** (`extend_ttl`). Each user position lives in its own dedicated ledger entry, enabling the protocol to scale to millions of concurrent accounts without bottleneck.

### 2. 📊 **Algorithmic Kink Interest Rate Model**
* Dynamic interest rate determination based on capital utilization ($U = \frac{\text{Borrowed}}{\text{Supplied}}$):
  $$\text{Borrow Rate} = \text{Base Rate} + \left(U \times \text{Slope Rate}\right)$$
  $$\text{Supply Rate} = \text{Borrow Rate} \times U \times (1 - \text{Reserve Factor})$$
* Real-time compound interest index accumulation (`supply_index`, `borrow_index`) calculated dynamically on every state transition.

### 3. 🛡️ **Automated Liquidation Engine & Keeper Bounties**
* **Solvency Protection**: Real-time on-chain Health Factor calculation:
  $$\text{Health Factor} = \frac{\sum (\text{Collateral}_i \times \text{Price}_i \times \text{Threshold}_i)}{\sum (\text{Debt}_j \times \text{Price}_j)}$$
* **5.0% Keeper Bounty**: When a borrower's Health Factor drops below 1.0, community keepers can repay debt via `liquidate()` and seize collateral with an instant **5.0% liquidation premium**, protecting the protocol from bad debt.

### 4. 🌐 **Multi-Reserve Token Ecosystem**
* Native support for SEP-41 / SAC tokens:
  * **XLM** (Stellar Lumens) — 75% LTV, 80% Liquidation Threshold
  * **USDC** (USD Coin) — 85% LTV, 90% Liquidation Threshold
  * **EURC** (Euro Coin) — 80% LTV, 85% Liquidation Threshold
  * **WBTC** (Wrapped Bitcoin) — 70% LTV, 75% Liquidation Threshold

---

## ✨ Features

* 🔗 Fully decentralized lending system on Stellar Soroban (Rust `#![no_std]`)
* 👛 Wallet-based authentication with Freighter (no login required)
* 🚀 Interactive User Onboarding Guide & Activation Checklist
* 🎁 Growth & Referral Engine with tiered APY incentives
* 💬 Community Feedback & Continuous Product Iteration widget
* 💸 Collateral supply & instant loan borrowing
* 🔄 Real-time loan repayment and health factor tracking
* 📊 Transparent loan data stored directly on-chain
* ⚡ Fast and low-cost sub-second transactions using Stellar
* 📈 **Interactive SVG Health Factor Arc Gauge** with color-coded solvency zones
* 🏪 **Multi-Asset Lending Markets** table with real-time APYs and utilization bars
* ⚡ **Liquidation Terminal & Auction Hub** with live borrower risk matrix and 1-click keeper execution
* 🧮 **Interactive Yield & Stress Simulator** with compound APY sliders and price volatility crash modeling
* 📊 **Protocol Analytics Terminal** with dynamic interest rate kink curves and reserve breakdowns
* 💧 **Instant Testnet Faucet & Quick Funding** modal for rapid review testing

---

## 🛠️ Tech Stack

* **Stellar Blockchain**: Fast, sub-second finality with deterministic micro-fees
* **Soroban Smart Contracts**: Written in Rust, Soroban SDK v25 (`#![no_std]`)
* **Stellar CLI**: Contract compilation, deployment, and testing
* **Freighter Wallet**: Secure browser-based transaction signing
* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
* **Web3 Integration**: `@stellar/freighter-api`, `stellar-sdk`

---

## 🚀 How to Run Locally

### 1. **Smart Contract**
1. Install Stellar CLI
2. Clone this repository:
   ```bash
   git clone https://github.com/ashishh-tech/STELLARLEND.git
   cd STELLARLEND
   ```
3. Run the unit test suite:
   ```bash
   cargo test
   ```
4. Build the contract WASM:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
5. Deploy using Stellar CLI

### 2. **Frontend Application**
1. Enter directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - `cp .env.example .env.local`
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployed Smart Contract (Testnet)

### 🔗 **Contract Explorer (Stellar Expert)**
https://stellar.expert/explorer/testnet/contract/CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS

### **Contract ID**
```
CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS
```

---

## 🎬 Live Demo, Presentation & Video

* **Live Application**: [STELLARLEND Live on Netlify](https://stellarlendmastery-demo.netlify.app)
* **Pitch Deck / Presentation**: [StellarLend Pitch Deck (PPTX)](./StellarLend_Pitch_Deck.pptx)
* **Demo Video**: [StellarLend Demo Video on YouTube](https://youtu.be/OrPAJ9Ojqe0)

---

## 📸 Project Showcase

### **1. Premium Lending Dashboard**
The frontend features a high-end glassmorphism design with animated background orbs, real-time Stellar balance fetching, and a dynamic portfolio health tracker.

<img width="1918" height="893" alt="image" src="https://github.com/user-attachments/assets/334eebb9-77c0-4f08-ac03-2559ba6ad2be" />


### **2. On-Chain Contract Verification**
Proof of deployment on the Stellar Testnet as seen on Stellar Expert.
<img width="1907" height="921" alt="image" src="https://github.com/user-attachments/assets/6a01f7c9-4787-46c7-a07a-f4a879821236" />


### **3. Smart Contract Test Verification (9 Passing Tests)**
Proof of passing local unit tests for the Soroban smart contract operations.

![Test Verification](screenshots/test_output.png)

```
running 9 tests
test test::test_initialize ... ok
test test::test_borrow_fails_if_insufficient_collateral - should panic ... ok
test test::test_contract_pause_prevents_actions - should panic ... ok
test test::test_withdraw_fails_if_exceeds_supply - should panic ... ok
test test::test_repay_fails_if_exceeds_debt - should panic ... ok
test test::test_contract_unpause_restores_actions ... ok
test test::test_scalable_persistent_storage_deposit_and_borrow ... ok
test test::test_multi_user_scalability_isolation ... ok
test test::test_multi_reserve_token_lifecycle_and_liquidation ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
```

### **4. Mobile Responsive UI**
The dashboard is fully responsive, ensuring a seamless lending and borrowing experience on mobile devices.

<p align="center">
  <img width="371" alt="StellarLend Mobile Dashboard" src="https://github.com/user-attachments/assets/b0cfbc73-f087-4ef8-810c-afc9d4765140" />
</p>

### **5. CI/CD Pipeline Running**
Automated GitHub Actions workflow successfully building and deploying the project.

![CI/CD Pipeline](screenshots/cicd_pipeline.png)

---

## 🎨 UI/UX Features (Frontend)

* **Next.js 16 App Router** for speed and SEO.
* **Glassmorphism Aesthetic** with `backdrop-blur` and glowing ambient orbs.
* **Freighter Wallet Integration** for secure transaction signing.
* **Real-time Data** fetching via Horizon Testnet API.
* **Interactive SVG Health Factor Gauge** with safety classification.
* **Multi-Tab Terminal Navigation**: Portfolio, Markets, Liquidation Hub, Yield Simulator, Analytics.
* **Instant Testnet Faucet** for 10,000 free testnet XLM funding.

---

## 📁 Project Structure

```text
.
├── frontend/             # Next.js 16 Web Application
│   ├── app/              # App router & styling
│   ├── components/       # UI Components (Dashboard, Markets, Liquidations, Simulator, etc.)
│   └── lib/              # Soroban contract client & Freighter integration
├── contracts/            # Soroban Smart Contracts (Rust)
│   └── stellarlend/      # Core scalable lending contract & unit test suite
├── screenshots/          # Project visual showcases
├── Cargo.toml            # Workspace configuration
└── README.md             # Project documentation
```

---

## 🔌 Frontend-Contract Integration

The frontend communicates with the deployed Soroban smart contract through a dedicated integration layer in `frontend/lib/`. These files are the bridge between the Next.js UI and the on-chain contract:

| File | Purpose |
|------|---------|
| `frontend/lib/contract.js` | **Core integration** — imports `stellar-sdk` (`@stellar/stellar-sdk`) and exposes `initialize()`, `deposit()`, `withdraw()`, `borrow()`, `repay()`, `liquidatePosition()`, `getHealthFactor()`, and `getAccountData()`. Each function builds a Soroban transaction, simulates it, signs via Freighter wallet, submits, and polls for on-chain confirmation. Function names and parameters match the Rust contract in `contracts/stellarlend/src/lib.rs` exactly. |
| `frontend/lib/stellar.config.js` | Network configuration — reads `CONTRACT_ID`, Soroban RPC URL, Horizon URL, and network passphrase from environment variables (`.env.local`). |
| `frontend/lib/freighter.js` | Wallet connection helper — wraps the `@stellar/freighter-api` to detect and connect to the Freighter browser wallet. |

### How the UI uses these files

* **`Dashboard.jsx`** calls `getAccountData(userAddress)` and `getHealthFactor(userAddress)` from `contract.js` to read the user's supplied/borrowed position and solvency status from the contract (read-only simulation, no signing needed).
* **`AssetModal.jsx`** calls `deposit()`, `withdraw()`, `borrow()`, or `repay()` from `contract.js` when the user confirms a Supply, Withdraw, Borrow, or Repay action. Each call triggers a Freighter signing popup and submits the signed transaction to the Stellar testnet.
* **`LiquidationTerminal.jsx`** calls `liquidatePosition()` to execute keeper liquidations and seize collateral with bonuses.

---

## 📊 User Feedback Summary (Beta Testing — June 2026)

### Wallet Connection Experience
- Majority of users found it **Very Easy** to connect Freighter wallet
- Some found it **Easy**
- 0% reported difficulty

### Transaction Completion
- Most users **successfully completed** a Supply/Borrow transaction
- Very few completed with minor issues

### UI/UX Rating (1–5 scale)
- **Average Rating: 4.8 / 5**
- Most users rated it 5/5

### Mainnet Interest
- Majority said **"Definitely Yes"** to using StellarLend on Mainnet

### Key User Feedback
- ✅ "Clean UI, smooth borrow/supply experience"
- ✅ "No issues"
- ⚠️ "Transaction hash not visible after completion"
- ⚠️ "Close (X) button on Borrow modal needs improvement"

### Summary
Overall reception is highly positive with an average UI/UX score of 4.8/5. Minor UX improvements identified around transaction confirmation visibility and modal navigation have been resolved in v2.0.0.

📊 [View Full Response Sheet](https://docs.google.com/spreadsheets/d/12jBf8IAJxlGuiJeIxMbgcZi-5Wm4a8OYETyIynZHVJY/edit?usp=sharing)

---

## 📈 Repository Analytics (Last 14 Days)

![GitHub Traffic Analytics](https://github.com/user-attachments/assets/8b7f4907-105c-4993-99c2-9b017b16f551)

| Metric | Count |
|--------|-------|
| Total Clones | 201 |
| Unique Cloners | 74 |
| Total Views | 62 |
| Unique Visitors | 12 |

*Source: GitHub Traffic Insights — June 26 to July 9, 2026*

---

## 👨‍💻 Author

**Ashish Chaurasia**  
[GitHub Profile](https://github.com/ashishh-tech)

---

## 📜 License

MIT License. Built with ❤️ for the Stellar Soroban Ecosystem.
