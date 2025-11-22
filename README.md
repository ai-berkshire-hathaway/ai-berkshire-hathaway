# ai-berkshire-hathaway

A cross-chain, AI-driven dollar-cost-averaging (DCA) vault that lives on **Circle Arc** and trades BTC on **Base** using **USDC**, **Pyth price feeds**, and **Circle CCTP**.

## 1. What This Project Is

### Goal

Automate BTC accumulation with a transparent, onchain-first strategy:

* **Strategy logic** and the USDC vault live on **Arc**.
* Real **BTC purchases** happen on **Base** via a backend "executor bot".
* **Pyth** provides BTC/USD prices on Arc every ~10 minutes.
* When BTC price falls below specific thresholds (for example: 85k / 82k / 79k USD), the vault:
  * Marks a DCA tranche as triggered on Arc.
  * Emits an event that the backend listens to.
  * Backend uses **Circle CCTP / Gateway** to bridge USDC from Arc to Base.
  * Backend trades USDC → BTC (e.g. WBTC / tBTC / cbBTC) on a Base DEX.

### What the frontend shows

* Live Pyth prices.
* Current strategy status and DCA thresholds.
* Historical DCA events and Base swap transactions.

## 2. Architecture Overview

### 2.1 Main Components

* **contracts/**
  * `ArcDCAController.sol`
    * Holds USDC on **Arc**.
    * Reads BTC/USD price from **Pyth** on Arc.
    * Evaluates thresholds and emits `DCARequested` events.
    * Keeps an onchain record of the latest price and which bands have been executed.

* **backend/**
  * Tech stack: TypeScript + Node.js + Express.
  * Responsibilities:
    * Every ~10 minutes: call Arc contract `updatePriceAndMaybeInvest` with Pyth price update data.
    * Subscribe to `DCARequested` events on Arc.
    * Use **Circle CCTP / Gateway / Web3 API** to bridge USDC from Arc → Base.
    * Trade bridged USDC to BTC on a Base DEX (Uniswap / Aerodrome / etc.).
    * Store history in a database (Postgres placeholder in the repo).
    * Expose REST API endpoints for the frontend.

* **frontend/**
  * Tech stack: Vite + React.
  * Responsibilities:
    * Show real-time BTC price chart (from backend or directly from Pyth API).
    * Show current thresholds and execution status.
    * Show DCA history, including Base transaction hashes.

### 2.2 End-to-End Flow

1. **Users deposit USDC on Arc**
   * Users approve and deposit USDC into `ArcDCAController` on Arc.

2. **Scheduled price update (every ~10 minutes)**
   * Backend cron job prepares Pyth price update payload.
   * Backend calls `ArcDCAController.updatePriceAndMaybeInvest(priceUpdateData)` on Arc.
   * The contract:
     * Updates onchain BTC/USD price from Pyth.
     * Emits a `PriceUpdated` event.
     * Checks thresholds and, for any band that should trigger and has not yet triggered in this cycle:
       * Marks it as executed.
       * Emits `DCARequested(bandIndex, usdcAmount, price, publishTime, ...)`.

3. **Executor bot performs DCA on Base**
   * Backend listener sees `DCARequested` on Arc.
   * Uses Circle CCTP / Gateway to bridge `usdcAmount` from Arc → Base.
   * When USDC arrives on Base, backend:
     * Executes a swap USDC → BTC on a chosen DEX.
     * Stores the result in the database (amount in, amount out, Base tx hash, etc.).

4. **Frontend reads everything from backend**
   * Frontend polls backend APIs to render:
     * Latest price and contract state on Arc.
     * Historical DCA events.
     * Base swap transactions and current aggregated BTC position.

## 3. Repository Layout

```text
ai-berkshire-hathaway/
  README.md
  contracts/
  backend/
    package.json
    tsconfig.json
    src/
      index.ts
      api/
        server.ts
      config/
        chains.ts
      jobs/
        dcaCron.ts
      listeners/
        dcaEvents.ts
      services/
        circleCctp.ts
        baseTrader.ts
        db.ts
  frontend/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      components/
        Dashboard.tsx
```

## 4. Smart Contract (Arc)

The main contract is `ArcDCAController.sol`. It:

* Tracks DCA thresholds (for example 85k, 82k, 79k) and corresponding USDC amounts.
* Holds USDC deposits.
* Reads BTC/USD price from Pyth.
* Emits events instead of directly bridging or swapping.

**Key functions**

* `deposit(uint256 amount)`
  * User deposits USDC into the vault.
* `resetExecuted()`
  * Resets which thresholds have triggered in the current cycle.
* `updatePriceAndMaybeInvest(bytes[] priceUpdateData)`
  * Called every ~10 minutes.
  * Updates the Pyth price, stores it onchain, emits `PriceUpdated`.
  * Checks thresholds and emits `DCARequested` for any triggered band.

**Deployment notes**

You must fill in real values for the target deployment network:

* Pyth contract addresses.
* BTC/USD price feed IDs.
* USDC token address on Arc.
* CCTP-related configuration (Circle contracts, domains, etc.).

## 5. Backend Service

### 5.1 Stack

* Node.js + TypeScript.
* Express for HTTP API.
* Ethers.js for onchain calls.
* Placeholders for:
  * Circle CCTP / BridgeKit integration.
  * Base DEX trading.
  * Database (for example Postgres).

### 5.2 Responsibilities

* **Cron job** (`src/jobs/dcaCron.ts`)
  * Runs every ~10 minutes.
  * Fetches Pyth price update data (via Pyth off-chain API/SDK).
  * Sends a transaction to Arc with `updatePriceAndMaybeInvest`.

* **Event listener** (`src/listeners/dcaEvents.ts`)
  * Subscribes to `DCARequested` on Arc.
  * Initiates CCTP bridging Arc → Base.
  * Executes swap on Base DEX.
  * Writes DCA records to the database.

* **HTTP API** (`src/api/server.ts`)
  * Exposes endpoints:
    * `GET /api/health` – health check.
    * `GET /api/dca/history` – past DCA events.
    * `GET /api/dca/summary` – aggregated position info.

## 6. Frontend App

### 6.1 Stack

* Vite + React + TypeScript.

### 6.2 Features

* Dashboard that shows:
  * Latest BTC price.
  * Threshold configuration and execution status.
  * Table of historical DCA events.

The frontend talks to the backend via `/api/*` endpoints.

## 7. Getting Started

### 7.1 Prerequisites

* Node.js ≥ 18.
* `pnpm` / `yarn` / `npm` (choose one).
* Docker + Postgres (if you want a real DB).
* Access to:
  * Arc RPC endpoint.
  * Base RPC endpoint.
  * Pyth price update API or SDK.
  * Circle CCTP / Gateway credentials.

### 7.2 Smart Contracts

1. Install contract tooling dependencies (for example Foundry or Hardhat; not included in this repo).
2. Configure:
   * USDC address on Arc.
   * Pyth contract and BTC/USD price feed ID.
   * Thresholds and amounts (for example in USD * 10^2 format as in the sample).
3. Deploy `ArcDCAController` to Arc.

### 7.3 Backend

```bash
cd backend
pnpm install   # or npm install / yarn
pnpm dev       # or npm run dev
```

Set environment variables:

* `ARC_RPC_URL`
* `BASE_RPC_URL`
* `ARC_DCA_CONTROLLER_ADDRESS`
* `ARC_PRIVATE_KEY` – key to send tx on Arc.
* `BASE_TRADER_PRIVATE_KEY` – key to send tx on Base.
* `DATABASE_URL`
* `CIRCLE_API_KEY` / `CCTP_CONFIG` (depending on integration).

### 7.4 Frontend

```bash
cd frontend
pnpm install   # or npm install / yarn
pnpm dev       # or npm run dev
```

## 8. TODO / Open Points

* Fill in real addresses and IDs:
  * USDC on Arc.
  * Pyth BTC/USD price feed ID and contract addresses on Arc.
  * CCTP / Gateway endpoints and configs.
  * Base DEX router addresses (Uniswap / Aerodrome / others).
* Implement real Pyth off-chain price update fetch in `dcaCron.ts`.
* Implement real CCTP flow in `circleCctp.ts`.
* Implement real Base swap logic in `baseTrader.ts`.
* Connect backend to a live Postgres instance in `db.ts`.
* Harden error handling and retries around cross-chain execution.
