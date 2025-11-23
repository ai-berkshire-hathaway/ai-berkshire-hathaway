// backend/src/services/chainlink.ts
import { Contract } from "ethers";
import { baseProvider, BASE_MAINNET, BASE_SEPOLIA } from "../config/chains";

// Chainlink Aggregator V3 Interface ABI
const AGGREGATOR_V3_ABI = [
  "function decimals() external view returns (uint8)",
  "function description() external view returns (string memory)",
  "function version() external view returns (uint256)",
  "function latestRoundData() external view returns (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

export interface ChainlinkPriceData {
  roundId: bigint;
  price: bigint;
  startedAt: bigint;
  updatedAt: bigint;
  answeredInRound: bigint;
  decimals: number;
}

export class ChainlinkPriceService {
  private btcUsdFeedMainnet: Contract;
  private btcUsdFeedSepolia: Contract;

  constructor() {
    // Initialize Chainlink price feed contracts
    this.btcUsdFeedMainnet = new Contract(
      BASE_MAINNET.chainlinkBtcUsd,
      AGGREGATOR_V3_ABI,
      baseProvider
    );

    this.btcUsdFeedSepolia = new Contract(
      BASE_SEPOLIA.chainlinkBtcUsd,
      AGGREGATOR_V3_ABI,
      baseProvider
    );
  }

  /**
   * Get BTC/USD price from Chainlink on Base Mainnet
   */
  async getBtcUsdPriceMainnet(): Promise<ChainlinkPriceData> {
    try {
      const [roundId, price, startedAt, updatedAt, answeredInRound] = 
        await this.btcUsdFeedMainnet.latestRoundData();
      
      const decimals = await this.btcUsdFeedMainnet.decimals();

      return {
        roundId: BigInt(roundId.toString()),
        price: BigInt(price.toString()),
        startedAt: BigInt(startedAt.toString()),
        updatedAt: BigInt(updatedAt.toString()),
        answeredInRound: BigInt(answeredInRound.toString()),
        decimals: Number(decimals)
      };
    } catch (error) {
      throw new Error(`Failed to fetch BTC/USD price from Chainlink Mainnet: ${error}`);
    }
  }

  /**
   * Get BTC/USD price from Chainlink on Base Sepolia (testnet)
   */
  async getBtcUsdPriceSepolia(): Promise<ChainlinkPriceData> {
    try {
      const [roundId, price, startedAt, updatedAt, answeredInRound] = 
        await this.btcUsdFeedSepolia.latestRoundData();
      
      const decimals = await this.btcUsdFeedSepolia.decimals();

      return {
        roundId: BigInt(roundId.toString()),
        price: BigInt(price.toString()),
        startedAt: BigInt(startedAt.toString()),
        updatedAt: BigInt(updatedAt.toString()),
        answeredInRound: BigInt(answeredInRound.toString()),
        decimals: Number(decimals)
      };
    } catch (error) {
      throw new Error(`Failed to fetch BTC/USD price from Chainlink Sepolia: ${error}`);
    }
  }

  /**
   * Validate price data freshness and sanity
   */
  validatePriceData(priceData: ChainlinkPriceData, maxStalenessSeconds: number = 3600): void {
    const now = Math.floor(Date.now() / 1000);
    const updatedAt = Number(priceData.updatedAt);
    
    // Check staleness
    if (now - updatedAt > maxStalenessSeconds) {
      throw new Error(`Price data is stale. Updated ${now - updatedAt} seconds ago, max allowed: ${maxStalenessSeconds}`);
    }

    // Check price bounds (assuming 8 decimals)
    const price = Number(priceData.price);
    const minPrice = 10000 * (10 ** priceData.decimals); // $10,000
    const maxPrice = 500000 * (10 ** priceData.decimals); // $500,000

    if (price < minPrice || price > maxPrice) {
      throw new Error(`Price ${price} is outside reasonable bounds [${minPrice}, ${maxPrice}]`);
    }
  }

  /**
   * Format price for display (convert from Chainlink format to human readable)
   */
  formatPrice(priceData: ChainlinkPriceData): string {
    const price = Number(priceData.price) / (10 ** priceData.decimals);
    return price.toFixed(2);
  }

  /**
   * Get price with automatic network detection based on environment
   */
  async getBtcUsdPrice(network: 'mainnet' | 'sepolia' = 'mainnet'): Promise<ChainlinkPriceData> {
    if (network === 'mainnet') {
      return this.getBtcUsdPriceMainnet();
    } else {
      return this.getBtcUsdPriceSepolia();
    }
  }
}

// Export singleton instance
export const chainlinkPriceService = new ChainlinkPriceService();

/**
 * Convenience function to get current BTC/USD price
 * Replaces the old fetchPythPriceUpdateData function
 */
export async function fetchChainlinkBtcPrice(network: 'mainnet' | 'sepolia' = 'mainnet'): Promise<ChainlinkPriceData> {
  const priceData = await chainlinkPriceService.getBtcUsdPrice(network);
  
  // Validate the price data
  chainlinkPriceService.validatePriceData(priceData);
  
  console.log(`[Chainlink] BTC/USD price: $${chainlinkPriceService.formatPrice(priceData)} (${network})`);
  
  return priceData;
}
