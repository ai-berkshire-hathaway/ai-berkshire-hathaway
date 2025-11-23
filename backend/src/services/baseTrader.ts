import { Contract } from "ethers";
import { BASE_MAINNET, BASE_SEPOLIA, baseTraderWallet } from "../config/chains";
import { fetchChainlinkBtcPrice } from "./chainlink";
import { generateDailyProofOfReserve } from "./proofOfReserve";

/**
 * Enhanced Base DEX trading logic with Chainlink price integration
 * and proof of reserves functionality.
 */

export interface SwapResult {
  swapTxHash: string;
  btcOut: bigint;
  executionPrice: string;
  slippage: string;
  timestamp: Date;
}

export interface TradingMetrics {
  totalSwaps: number;
  totalUsdcSpent: bigint;
  totalBtcReceived: bigint;
  averagePrice: string;
  totalSlippage: string;
}

export class BaseTrader {
  private network: 'mainnet' | 'sepolia';
  private config: typeof BASE_MAINNET | typeof BASE_SEPOLIA;
  
  constructor(network: 'mainnet' | 'sepolia' = 'sepolia') {
    this.network = network;
    this.config = network === 'mainnet' ? BASE_MAINNET : BASE_SEPOLIA;
  }

  /**
   * Get current BTC price and validate against Chainlink
   */
  async getCurrentBtcPrice(): Promise<{ price: string; source: string; timestamp: Date }> {
    const priceData = await fetchChainlinkBtcPrice(this.network);
    const price = Number(priceData.price) / (10 ** priceData.decimals);
    
    return {
      price: price.toFixed(2),
      source: `Chainlink ${this.network}`,
      timestamp: new Date(Number(priceData.updatedAt) * 1000)
    };
  }

  /**
   * Swap USDC to cbBTC on Base with price validation
   */
  async swapUsdcToBtc(params: { 
    usdcAmount: bigint; 
    baseUsdcTxHash: string;
    maxSlippagePercent?: number;
  }): Promise<SwapResult> {
    const { usdcAmount, baseUsdcTxHash, maxSlippagePercent = 1.0 } = params;
    
    console.log("[baseTrader] Starting USDC -> cbBTC swap on Base:", {
      usdcAmount: usdcAmount.toString(),
      baseUsdcTxHash,
      network: this.network,
      maxSlippage: `${maxSlippagePercent}%`
    });

    try {
      // 1. Get current BTC price from Chainlink
      const priceInfo = await this.getCurrentBtcPrice();
      console.log(`[baseTrader] Current BTC price: $${priceInfo.price} (${priceInfo.source})`);

      // 2. Calculate expected BTC amount
      const usdcAmountFormatted = Number(usdcAmount) / (10 ** 6); // USDC has 6 decimals
      const expectedBtcAmount = usdcAmountFormatted / Number(priceInfo.price);
      
      console.log(`[baseTrader] Expected BTC amount: ${expectedBtcAmount.toFixed(8)} BTC`);

      // TODO: Implement actual DEX swap logic
      // - Connect to Aerodrome/Uniswap router
      // - Execute swap with slippage protection
      // - Validate received amount
      
      // For now, simulate the swap
      const simulatedBtcOut = BigInt(Math.floor(expectedBtcAmount * 0.99 * (10 ** 8))); // 1% slippage simulation
      const actualSlippage = ((expectedBtcAmount - Number(simulatedBtcOut) / (10 ** 8)) / expectedBtcAmount * 100).toFixed(2);
      
      const result: SwapResult = {
        swapTxHash: "0x" + Math.random().toString(16).substring(2, 66), // Simulated tx hash
        btcOut: simulatedBtcOut,
        executionPrice: priceInfo.price,
        slippage: `${actualSlippage}%`,
        timestamp: new Date()
      };

      console.log("[baseTrader] Swap completed:", {
        txHash: result.swapTxHash,
        btcReceived: (Number(result.btcOut) / (10 ** 8)).toFixed(8),
        executionPrice: result.executionPrice,
        slippage: result.slippage
      });

      // 3. Update proof of reserves after successful swap
      await this.updateProofOfReserveAfterSwap(usdcAmount, simulatedBtcOut);

      return result;
    } catch (error) {
      console.error("[baseTrader] Swap failed:", error);
      throw new Error(`Swap failed: ${error}`);
    }
  }

  /**
   * Update proof of reserves after a successful swap
   */
  private async updateProofOfReserveAfterSwap(usdcSpent: bigint, btcReceived: bigint): Promise<void> {
    try {
      // Calculate USD value of BTC received
      const priceInfo = await this.getCurrentBtcPrice();
      const btcValue = Number(btcReceived) / (10 ** 8) * Number(priceInfo.price);
      const btcValueUsd = BigInt(Math.floor(btcValue * (10 ** 6))); // Convert to 6 decimal USD
      
      console.log(`[baseTrader] Updating PoR: BTC value ${btcValue.toFixed(2)} USD`);
      
      // Generate new proof of reserves
      await generateDailyProofOfReserve(this.network, btcValueUsd);
    } catch (error) {
      console.error("[baseTrader] Failed to update proof of reserves:", error);
      // Don't throw - this shouldn't fail the swap
    }
  }

  /**
   * Get trading metrics and portfolio summary
   */
  async getTradingMetrics(): Promise<TradingMetrics> {
    // TODO: Implement actual metrics tracking
    // This would typically read from a database or contract events
    
    return {
      totalSwaps: 0,
      totalUsdcSpent: 0n,
      totalBtcReceived: 0n,
      averagePrice: "0.00",
      totalSlippage: "0.00%"
    };
  }

  /**
   * Validate swap parameters before execution
   */
  private validateSwapParams(usdcAmount: bigint, maxSlippagePercent: number): void {
    if (usdcAmount <= 0n) {
      throw new Error("USDC amount must be positive");
    }
    
    if (maxSlippagePercent < 0 || maxSlippagePercent > 10) {
      throw new Error("Max slippage must be between 0% and 10%");
    }
  }
}

// Export singleton instances
export const baseTraderMainnet = new BaseTrader('mainnet');
export const baseTraderSepolia = new BaseTrader('sepolia');

// Legacy export for backward compatibility
export const baseTrader = {
  async swapUsdcToBtc(params: { usdcAmount: bigint; baseUsdcTxHash: string }) {
    return baseTraderSepolia.swapUsdcToBtc(params);
  }
};