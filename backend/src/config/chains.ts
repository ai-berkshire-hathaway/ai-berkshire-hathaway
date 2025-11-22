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
  "event DCARequested(uint256 indexed planId, uint256 indexed thresholdIndex, uint256 usdcAmount, int64 price, int32 expo, uint64 publishTime)",
  "function updatePriceAndMaybeInvest(bytes[] priceUpdateData) external payable",
  "function lastPrice() view returns (int64)",
  "function lastExpo() view returns (int32)",
  "function lastPublishTime() view returns (uint64)"
];