# 🚀 Stellar Soroban P2P Lending Smart Contract
[![CI/CD Pipeline](https://github.com/ashishh-tech/Stellar-Peer-to-Peer-Lending/actions/workflows/ci.yml/badge.svg)](https://github.com/ashishh-tech/Stellar-Peer-to-Peer-Lending/actions/workflows/ci.yml)

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
https://stellar.expert/explorer/testnet/contract/CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ
### **Contract ID**
```
CDSYUIDUTWYYPT37MH274AGVGVUR6H3IVUQGWUWYX6A6B3U55I37TJKJ
```

---

## 🎬 Live Demo, Presentation & Video

*   **Live Application**: [STELLARLEND Live on Netlify](https://stellarlendmastery-demo.netlify.app)
*   **Pitch Deck / Presentation**: [StellarLend Pitch Deck (PPTX)](./StellarLend_Pitch_Deck.pptx)
*   **Demo Video**: [StellarLend Demo Video on YouTube](https://youtu.be/OrPAJ9Ojqe0)

---

## 📸 Project Showcase

### **1. Premium Lending Dashboard**
The frontend features a high-end glassmorphism design with animated background orbs, real-time Stellar balance fetching, and a dynamic portfolio health tracker.

<img width="1918" height="893" alt="image" src="https://github.com/user-attachments/assets/334eebb9-77c0-4f08-ac03-2559ba6ad2be" />


### **2. On-Chain Contract Verification**
Proof of deployment on the Stellar Testnet as seen on Stellar Expert.
<img width="1907" height="921" alt="image" src="https://github.com/user-attachments/assets/6a01f7c9-4787-46c7-a07a-f4a879821236" />


### **3. Smart Contract Test Verification**
Proof of passing local unit tests for the Soroban smart contract operations.

![Test Verification](screenshots/test_output.png)

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

## 🔌 Frontend-Contract Integration

The frontend communicates with the deployed Soroban smart contract through a dedicated integration layer in `frontend/lib/`. These files are the bridge between the Next.js UI and the on-chain contract:

| File | Purpose |
|------|---------|
| `frontend/lib/contract.js` | **Core integration** — imports `stellar-sdk` (`@stellar/stellar-sdk`) and exposes `initialize()`, `deposit()`, `withdraw()`, `borrow()`, `repay()`, and `getAccountData()`. Each function builds a Soroban transaction, simulates it, signs via Freighter wallet, submits, and polls for on-chain confirmation. Function names and parameters match the Rust contract in `contracts/stellarlend/src/lib.rs` exactly. |
| `frontend/lib/stellar.config.js` | Network configuration — reads `CONTRACT_ID`, Soroban RPC URL, Horizon URL, and network passphrase from environment variables (`.env.local`). |
| `frontend/lib/freighter.js` | Wallet connection helper — wraps the `@stellar/freighter-api` to detect and connect to the Freighter browser wallet. |

### How the UI uses these files

* **`Dashboard.jsx`** calls `getAccountData(userAddress)` from `contract.js` to read the user's supplied/borrowed position from the contract (read-only simulation, no signing needed).
* **`AssetModal.jsx`** calls `deposit()`, `withdraw()`, `borrow()`, or `repay()` from `contract.js` when the user confirms a Supply, Withdraw, Borrow, or Repay action. Each call triggers a Freighter signing popup and submits the signed transaction to the Stellar testnet.

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
Overall reception is highly positive with an average UI/UX 
score of 4.8/5. Minor UX improvements identified around 
transaction confirmation visibility and modal navigation.

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
* Multi-asset lending support
