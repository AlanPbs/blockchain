# Tokenized Asset Management Platform

A decentralized platform for tokenizing Real-World Assets (RWAs) with built-in compliance (KYC), on-chain trading (DEX), and real-time indexing.

## Features

- **Real-World Asset Tokenization**: ERC20/ERC721 tokens representing assets (fungible and non-fungible).
- **Compliance (KYC)**: On-chain whitelist ensures only verified users can trade/hold tokens.
- **On-Chain Trading**: Simple Liquidity Pool / DEX integration for token swaps.
- **Oracle**: Simple on-chain oracle for real-time asset pricing.
- **Real-Time Indexer**: Node.js service syncing blockchain events to SQLite database.
- **Modern UI**: Next.js dashboard with wallet connection (MetaMask).
- **Admin Panel**: Web interface for managing KYC, minting NFTs, and updating oracle prices.

## Tech Stack

- **Blockchain**: EVM (Hardhat, Solidity).
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Ethers.js.
- **Indexer**: Node.js, Express, Ethers.js, SQLite.

## Justification of Blockchain Choice (EVM)

We chose an **EVM-compatible architecture** (Hardhat/Ethereum) for the following reasons:
1.  **Robust Tooling**: The availability of mature tools like Hardhat and Ethers.js accelerates development and testing compared to XRPL.
2.  **Smart Contract Flexibility**: Solidity allows for complex, custom logic (e.g., specific KYC constraints in `_beforeTokenTransfer`) that might be harder to implement with standard XRPL primitives.
3.  **Industry Standard**: EVM is the dominant standard in DeFi, making the skills and code more portable.

## Prerequisites

- Node.js (v18+)
- NPM
- MetaMask Wallet (for browser interaction)

## Getting Started

### 1. Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd blockchain

# Install dependencies for all services
cd contracts && npm install
cd ../indexer && npm install
cd ../frontend && npm install
cd ..
```

### 2. Generate Admin Wallet (Optional)

Before deploying contracts, you may want to generate a dedicated admin wallet:

```bash
cd contracts

# Generate a new wallet for admin operations
node scripts/generate_wallet.js
```

This will output:
- A new Ethereum address
- A private key (save this securely!)

**Important**: Add the private key to your environment variables or `.env` file:
```bash
# In contracts/.env or your deployment environment
PRIVATE_KEY=your_generated_private_key_here
```

### 3. Smart Contracts (Local / Hardhat)

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Option A: Deploy to local Hardhat Network (one command)
npx hardhat run scripts/deploy.ts --network localhost

# Option B: Start local node in one terminal, then deploy in another
# Terminal 1:
npx hardhat node

# Terminal 2:
npx hardhat run scripts/deploy.ts --network localhost
```

> **Note**: After deployment, copy the contract addresses from the console output. Update `frontend/src/lib/contracts-config.json` with the deployed addresses.

**Example deployment output:**
```
ComplianceRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
AssetOracle deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
AssetToken deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
AssetNFT deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
SimpleDEX deployed to: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

### 4. Indexer Service

```bash
cd indexer

# Start the indexer (ensure local Hardhat node is running)
npm run dev
```

The indexer runs on `http://localhost:3001` and syncs blockchain events to SQLite.

### 5. Frontend

```bash
cd frontend

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser and connect your MetaMask wallet.

### 6. Admin Panel

Access the admin panel at `http://localhost:3000/admin` to:
- **Manage KYC Compliance**: Whitelist/blacklist addresses for token trading
- **Mint NFTs**: Create new asset NFTs with custom metadata URIs
- **Update Oracle Prices**: Set asset prices for the DEX
- **Transfer Ownership**: Transfer admin rights to another address

> **Note**: Only the contract owner can access admin functions. Make sure you're connected with the deployer wallet.

## Usage

### Quick Start Workflow

1. **Start Hardhat Node** (Terminal 1):
   ```bash
   cd contracts
   npx hardhat node
   ```

2. **Deploy Contracts** (Terminal 2):
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **Update Contract Addresses**:
   - Copy deployed addresses from console output
   - Update `frontend/src/lib/contracts-config.json`

4. **Start Indexer** (Terminal 3):
   ```bash
   cd indexer
   npm run dev
   ```

5. **Start Frontend** (Terminal 4):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access Application**:
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin
   - Gallery: http://localhost:3000/gallery
   - Trading: http://localhost:3000/trade

### Common Operations

**Whitelist a user for trading:**
1. Go to `/admin`
2. Enter address in "Whitelist Address" field
3. Click "Whitelist"

**Mint an NFT:**
1. Go to `/admin`
2. Enter recipient address and metadata URI
3. Click "Mint NFT"

**Update asset price:**
1. Go to `/admin`
2. Enter asset symbol (e.g., "GLD") and new price
3. Click "Update Price"

## Project Structure

```
blockchain/
├── contracts/          # Smart contracts (Solidity + Hardhat)
│   ├── contracts/      # Solidity source files
│   └── scripts/        # Deployment and utility scripts
├── indexer/            # Node.js indexing service
│   └── src/            # Indexer source code
├── frontend/           # Next.js frontend application
│   └── src/
│       ├── app/        # Next.js app router pages
│       ├── components/ # React components
│       └── lib/        # Utilities and contract configs
└── deployment/         # Deployment scripts and configs
```

## Configuration

### Contract Addresses

After deployment, update `frontend/src/lib/contracts-config.json` with your deployed contract addresses:

```json
{
  "complianceAddress": "0x...",
  "oracleAddress": "0x...",
  "tokenAddress": "0x...",
  "nftAddress": "0x...",
  "dexAddress": "0x...",
  "networkId": "31337"
}
```

### Environment Variables

Create `.env` files in respective directories as needed:

**contracts/.env** (for deployment):
```bash
PRIVATE_KEY=your_private_key_here
```

**indexer/.env** (if needed):
```bash
RPC_URL=http://localhost:8545
```

## Architecture Decisions

- **ComplianceRegistry**: Separated logic for KYC to allow updating rules without redeploying token contracts.
- **Indexer**: Uses SQLite for lightweight, fast queries. Polls local node for events.
- **Monorepo**: Keeps all code in one place for easier development.
- **Admin Panel**: Centralized web interface for contract administration, reducing need for direct contract interactions.
