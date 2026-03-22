# 🚀 Stellar Soroban P2P Lending Smart Contract

## 📌 Project Description

This project is a decentralized Peer-to-Peer (P2P) lending platform built on the Stellar blockchain using Soroban smart contracts. It allows users to lend and borrow funds directly without intermediaries, ensuring transparency, security, and low transaction costs.

---

## ⚙️ What it does

The smart contract enables:

* Lenders to create loan offers
* Borrowers to accept loans
* Borrowers to repay loans
* Public access to loan details

All operations are executed on-chain using Soroban smart contracts, ensuring trustless transactions.

---

## ✨ Features

* 🔗 Fully decentralized lending system
* 👛 Wallet-based authentication (no login required)
* 💸 Loan creation and acceptance
* 🔄 Loan repayment tracking
* 📊 Transparent loan data stored on-chain
* ⚡ Fast and low-cost transactions using Stellar

---

## 🛠️ Tech Stack

* Stellar Blockchain
* Soroban Smart Contracts (Rust)
* Stellar CLI
* Freighter Wallet

---

## 🚀 How to Run Locally

1. Install Stellar CLI
2. Clone this repository
3. Build the contract:

   ```
   cargo build --target wasm32-unknown-unknown --release
   ```
4. Deploy using Stellar CLI

---

## 🌐 Deployed Smart Contract (Testnet)

### 🔗 **Contract Explorer (Stellar Expert)**
https://stellar.expert/explorer/testnet/contract/CAM2KFCN7W6AEMO7EAIO3CZ7CXEOPE3XNM3SNFXJFPS2KDDX4554AQWJ

### **Contract ID**
```
CAM2KFCN7W6AEMO7EAIO3CZ7CXEOPE3XNM3SNFXJFPS2KDDX4554AQWJ
```

---

## 📸 Project Showcase

### **1. Premium Lending Dashboard**
The frontend features a high-end glassmorphism design with animated background orbs, real-time Stellar balance fetching, and a dynamic portfolio health tracker.

![StellarLend Dashboard](screenshots/dashboard.png)

### **2. On-Chain Contract Verification**
Proof of deployment on the Stellar Testnet as seen on Stellar Expert.

![Stellar Expert Verification](screenshots/stellar_expert.png)

---

## 🎨 UI/UX Features (Frontend)

*   **Next.js 14 App Router** for speed and SEO.
*   **Glassmorphism Aesthetic** with `backdrop-blur` and glowing ambient orbs.
*   **Freighter Wallet Integration** for secure transaction signing.
*   **Real-time Data** fetching via Horizon Testnet API.
*   **Responsive Health Bar** calculating borrow limits on-the-fly.

---

## 📁 Project Structure

```text
.
├── frontend/             # Next.js 14 Web Application
├── contracts/            # Soroban Smart Contracts (Rust)
├── screenshots/          # Project visual showcases
├── Cargo.toml            # Workspace configuration
└── README.md             # Project documentation
```

---

## 🛠️ How to Run Locally

### **Frontend**
1. Enter the directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - `cp .env.example .env.local`
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### **Smart Contract**
1. Build the contract: `cargo build --target wasm32-unknown-unknown --release`
2. Deploy using Stellar CLI.

---

## 👨‍💻 Author

**Ashish Chaurasia**  
[GitHub Profile](https://github.com/ashishh-tech)

---

## 📜 License

MIT License

- New Soroban contracts can be put in `contracts`, each in their own directory.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well.

---

## 📌 Future Improvements

* Interest rate mechanism
* Collateral support
* Default penalties
* UI Dashboard (React + Web3 integration)
* Multi-asset lending support

---

## 👨‍💻 Author

Ashish Chaurasia

---

## 📜 License

MIT License
