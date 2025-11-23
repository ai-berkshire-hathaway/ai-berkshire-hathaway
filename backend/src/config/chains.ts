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

// Chainlink BTC/USD price feeds on different networks
export const CHAINLINK = {
  // Base Mainnet BTC/USD price feed
  BASE_MAINNET_BTC_USD: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F",
  // Base Sepolia BTC/USD price feed (testnet)
  BASE_SEPOLIA_BTC_USD: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1",
};

export const arcProvider = new ethers.JsonRpcProvider(ARC_RPC_URL);
export const baseProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);

export const arcWallet = new ethers.Wallet(ARC_PRIVATE_KEY, arcProvider);
export const baseTraderWallet = new ethers.Wallet(BASE_TRADER_PRIVATE_KEY, baseProvider);

// Minimal ABI fragments for the events/methods we use
export const BaseDcaAbi = [
  "event DCARequested(uint256 indexed planId, uint256 indexed thresholdIndex, uint256 usdcAmount, int256 price, uint256 updatedAt)",
  "event PriceUpdated(int256 price, uint256 updatedAt, uint80 roundId)",
  "event ReserveProofGenerated(uint256 indexed proofId, uint256 timestamp, uint256 usdcBalance, uint256 totalInvested, int256 btcPrice, uint256 portfolioValueUsd)",
  "function updatePriceAndMaybeInvest() external",
  "function generateReserveProof(uint256 totalInvestedUsd) external",
  "function getCurrentPrice() external view returns (int256 price, uint256 updatedAt)",
  "function lastPrice() view returns (int256)",
  "function lastUpdatedAt() view returns (uint256)",
  "function getLatestReserveProof() external view returns (tuple(uint256 timestamp, uint256 usdcBalance, uint256 totalInvested, int256 btcPrice, uint256 portfolioValueUsd))",
];

// Legacy ABI for Arc-based controller (deprecated)
export const ArcDcaAbi = [
  "event DCARequested(uint256 indexed planId, uint256 indexed thresholdIndex, uint256 usdcAmount, int64 price int32 expo, uint64 publishTime)",
  "function updatePriceAndMaybeInvest(bytes[] priceUpdateData) external payable",
  "function lastPrice() view returns (int64)",
  "function lastExpo() view returns (int32)",
  "function lastPublishTime() view returns (uint64)",
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
  // Chainlink BTC/USD price feed (testnet)
  chainlinkBtcUsd: CHAINLINK.BASE_SEPOLIA_BTC_USD,
  // DCA Controller contract (to be deployed)
  dcaController: process.env.BASE_SEPOLIA_DCA_CONTROLLER_ADDRESS || "0xYourBaseSepoliaDcaController",
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
  // Chainlink BTC/USD price feed
  chainlinkBtcUsd: CHAINLINK.BASE_MAINNET_BTC_USD,
  // DCA Controller contract (to be deployed)
  dcaController: process.env.BASE_DCA_CONTROLLER_ADDRESS || "0xYourBaseDcaController",
};