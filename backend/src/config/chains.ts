// backend/src/config/chains.ts
import { ethers } from "ethers";

export const ARC_RPC_URL = process.env.ARC_RPC_URL || "https://arc-testnet.example";
export const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://base-testnet.example";

export const ARC_PRIVATE_KEY =
  process.env.ARC_PRIVATE_KEY || "0xYOUR_ARC_PRIVATE_KEY_FOR_DEV_ONLY";
export const BASE_TRADER_PRIVATE_KEY =
  process.env.BASE_TRADER_PRIVATE_KEY || "0xYOUR_BASE_PRIVATE_KEY_FOR_DEV_ONLY";

export const ARC_DCA_CONTROLLER_ADDRESS =
  process.env.ARC_DCA_CONTROLLER_ADDRESS || "0xYourArcDcaController";

export const arcProvider = new ethers.JsonRpcProvider(ARC_RPC_URL);
export const baseProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);

export const arcWallet = new ethers.Wallet(ARC_PRIVATE_KEY, arcProvider);
export const baseTraderWallet = new ethers.Wallet(BASE_TRADER_PRIVATE_KEY, baseProvider);

// Minimal ABI fragments for the events/methods we use
export const ArcDcaAbi = [
  "event DCARequested(uint256 indexed planId, uint256 indexed thresholdIndex, uint256 usdcAmount, int64 price int32 expo, uint64 publishTime)",
  "function updatePriceAndMaybeInvest(bytes[] priceUpdateData) external payable",
  "function lastPrice() view returns (int64)",
  "function lastExpo() view returns (int32)",
  "function lastPublishTime() view returns (uint64)"
];

// Arc Testnet chain (USDC gas L1)
export const ARC_TESTNET = {
  id: 5042002, // Arc Testnet chain ID
  name: "Arc Testnet",
  rpcUrl: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
  // Circle docs: Arc Testnet USDC ERC-20 interface (6 decimals)  [oai_citation:0‡Arc Docs](https://docs.arc.network/arc/references/contract-addresses)
  usdcErc20: "0x3600000000000000000000000000000000000000",
  // CCTP contracts on Arc Testnet (domain 26)  [oai_citation:1‡Arc Docs](https://docs.arc.network/arc/references/contract-addresses)
  cctp: {
    domain: 26,
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    tokenMinter: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
  },
};

// Base Sepolia (CCTP docs中 Base domain 6 为 baseSepolia)  [oai_citation:2‡Circle Developer Docs](https://developers.circle.com/cctp/evm-smart-contracts)
export const BASE_SEPOLIA = {
  id: 84532,
  name: "Base Sepolia",
  rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  // Circle USDC docs: Base Sepolia USDC (6 decimals)  [oai_citation:3‡Circle Developer Docs](https://developers.circle.com/stablecoins/usdc-contract-addresses?utm_source=chatgpt.com)
  usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  cctp: {
    domain: 6,
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  },
};

// Base Mainnet 侧，用于真实买 BTC（cbBTC）
export const BASE_MAINNET = {
  id: 8453,
  name: "Base",
  rpcUrl: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
  // Circle USDC docs: Base mainnet USDC  [oai_citation:4‡Circle Developer Docs](https://developers.circle.com/stablecoins/usdc-contract-addresses?utm_source=chatgpt.com)
  usdc: "0x833589fCd6eDb6E08f4c7C32D4f71b54bdA02913",
  // Coinbase Wrapped BTC (cbBTC) on Base  [oai_citation:5‡Base Explorer](https://basescan.org/token/0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf)
  cbBtc: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  // Aerodrome Slipstream SwapRouter (Base) —— 用于 USDC -> cbBTC 交换  [oai_citation:6‡Base Explorer](https://basescan.org/address/0xbe6d8f0d05cc4be24d5167a3ef062215be6d18a5?utm_source=chatgpt.com)
  dexRouter: "0xbe6d8f0d05CC4BE24D5167a3EF062215BE6D18a5",
};

// Pyth BTC/USD price feed ID（所有 EVM 上共用的 priceId）  [oai_citation:7‡Pyth Network Docs](https://docs.pyth.network/price-feeds/core/fetch-price-updates?utm_source=chatgpt.com)
export const PYTH = {
  // BTC / USD price ID
  BTC_USD_PRICE_ID:
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  // Hermes API Endpoint  [oai_citation:8‡docs.euler.finance](https://docs.euler.finance/developers/evk/interacting-with-vaults?utm_source=chatgpt.com)
  HERMES_URL: "https://hermes.pyth.network/v2/updates/price/latest",
};