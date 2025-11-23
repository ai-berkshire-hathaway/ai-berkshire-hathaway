// backend/src/services/proofOfReserve.ts
import { Contract } from "ethers";
import { BaseDcaAbi, BASE_SEPOLIA, BASE_MAINNET, baseTraderWallet } from "../config/chains";
import { fetchChainlinkBtcPrice } from "./chainlink";

export interface ReserveProof {
  timestamp: bigint;
  usdcBalance: bigint;
  totalInvested: bigint;
  btcPrice: bigint;
  portfolioValueUsd: bigint;
}

export interface PortfolioSummary {
  totalUsdcBalance: string; // Formatted USDC balance
  totalInvestedUsd: string; // Total amount invested in BTC (USD)
  currentBtcPrice: string; // Current BTC price
  totalPortfolioValueUsd: string; // Total portfolio value
  lastUpdated: Date;
  proofId: number;
}

export class ProofOfReserveService {
  private contract: Contract;
  private network: 'mainnet' | 'sepolia';

  constructor(network: 'mainnet' | 'sepolia' = 'sepolia') {
    this.network = network;
    const config = network === 'mainnet' ? BASE_MAINNET : BASE_SEPOLIA;
    this.contract = new Contract(config.dcaController, BaseDcaAbi, baseTraderWallet);
  }

  /**
   * Generate a new proof of reserves on-chain
   * @param totalInvestedUsd Total amount invested in BTC (in USD with 6 decimals)
   */
  async generateProofOfReserve(totalInvestedUsd: bigint): Promise<string> {
    try {
      console.log(`[PoR] Generating proof of reserve for ${totalInvestedUsd} USD invested...`);
      
      const tx = await this.contract.generateReserveProof(totalInvestedUsd);
      console.log(`[PoR] Proof generation tx sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`[PoR] Proof generation tx confirmed`);
      
      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to generate proof of reserve: ${error}`);
    }
  }

  /**
   * Get the latest proof of reserves from the contract
   */
  async getLatestReserveProof(): Promise<ReserveProof> {
    try {
      const proof = await this.contract.getLatestReserveProof();
      
      return {
        timestamp: BigInt(proof.timestamp.toString()),
        usdcBalance: BigInt(proof.usdcBalance.toString()),
        totalInvested: BigInt(proof.totalInvested.toString()),
        btcPrice: BigInt(proof.btcPrice.toString()),
        portfolioValueUsd: BigInt(proof.portfolioValueUsd.toString())
      };
    } catch (error) {
      throw new Error(`Failed to get latest reserve proof: ${error}`);
    }
  }

  /**
   * Get a specific proof by index
   */
  async getReserveProof(index: number): Promise<ReserveProof> {
    try {
      const proof = await this.contract.getReserveProof(index);
      
      return {
        timestamp: BigInt(proof.timestamp.toString()),
        usdcBalance: BigInt(proof.usdcBalance.toString()),
        totalInvested: BigInt(proof.totalInvested.toString()),
        btcPrice: BigInt(proof.btcPrice.toString()),
        portfolioValueUsd: BigInt(proof.portfolioValueUsd.toString())
      };
    } catch (error) {
      throw new Error(`Failed to get reserve proof at index ${index}: ${error}`);
    }
  }

  /**
   * Get total number of proofs
   */
  async getReserveProofCount(): Promise<number> {
    try {
      const count = await this.contract.getReserveProofCount();
      return Number(count.toString());
    } catch (error) {
      throw new Error(`Failed to get reserve proof count: ${error}`);
    }
  }

  /**
   * Format proof data for display
   */
  formatProofForDisplay(proof: ReserveProof): PortfolioSummary {
    // Convert from wei/contract units to human readable
    const usdcBalance = Number(proof.usdcBalance) / (10 ** 6); // USDC has 6 decimals
    const totalInvested = Number(proof.totalInvested) / (10 ** 6); // USD with 6 decimals
    const btcPrice = Number(proof.btcPrice) / (10 ** 8); // Chainlink BTC/USD has 8 decimals
    const portfolioValue = Number(proof.portfolioValueUsd) / (10 ** 6); // USD with 6 decimals

    return {
      totalUsdcBalance: usdcBalance.toFixed(2),
      totalInvestedUsd: totalInvested.toFixed(2),
      currentBtcPrice: btcPrice.toFixed(2),
      totalPortfolioValueUsd: portfolioValue.toFixed(2),
      lastUpdated: new Date(Number(proof.timestamp) * 1000),
      proofId: 0 // Will be set by caller if needed
    };
  }

  /**
   * Generate comprehensive portfolio report
   */
  async generatePortfolioReport(): Promise<{
    summary: PortfolioSummary;
    proofHash: string;
    chainlinkPrice: string;
    proofCount: number;
  }> {
    try {
      // Get current BTC price from Chainlink
      const priceData = await fetchChainlinkBtcPrice(this.network);
      const currentPrice = Number(priceData.price) / (10 ** priceData.decimals);

      // Get current USDC balance
      const usdcBalance = BigInt("0"); // TODO: Get actual USDC balance from contract
      
      // Estimate total invested (this should come from your tracking system)
      const totalInvestedUsd = BigInt("1000000000"); // Example: $1000 with 6 decimals
      
      // Generate new proof
      const proofHash = await this.generateProofOfReserve(totalInvestedUsd);
      
      // Get the latest proof (the one we just generated)
      const latestProof = await this.getLatestReserveProof();
      const summary = this.formatProofForDisplay(latestProof);
      
      // Get total proof count
      const proofCount = await this.getReserveProofCount();
      
      return {
        summary,
        proofHash,
        chainlinkPrice: currentPrice.toFixed(2),
        proofCount
      };
    } catch (error) {
      throw new Error(`Failed to generate portfolio report: ${error}`);
    }
  }

  /**
   * Verify proof integrity by comparing with current Chainlink price
   */
  async verifyProofIntegrity(proof: ReserveProof, tolerancePercent: number = 5): Promise<boolean> {
    try {
      // Get current Chainlink price
      const currentPriceData = await fetchChainlinkBtcPrice(this.network);
      const currentPrice = Number(currentPriceData.price);
      const proofPrice = Number(proof.btcPrice);
      
      // Calculate price difference percentage
      const priceDiff = Math.abs(currentPrice - proofPrice) / currentPrice * 100;
      
      console.log(`[PoR Verification] Current price: ${currentPrice}, Proof price: ${proofPrice}, Diff: ${priceDiff.toFixed(2)}%`);
      
      return priceDiff <= tolerancePercent;
    } catch (error) {
      console.error(`[PoR Verification] Error verifying proof: ${error}`);
      return false;
    }
  }
}

// Export singleton instances for both networks
export const porServiceMainnet = new ProofOfReserveService('mainnet');
export const porServiceSepolia = new ProofOfReserveService('sepolia');

/**
 * Convenience function to generate daily proof of reserves
 */
export async function generateDailyProofOfReserve(
  network: 'mainnet' | 'sepolia' = 'sepolia',
  totalInvestedUsd: bigint
): Promise<PortfolioSummary> {
  const service = network === 'mainnet' ? porServiceMainnet : porServiceSepolia;
  
  console.log(`[Daily PoR] Generating daily proof of reserve on ${network}...`);
  
  const report = await service.generatePortfolioReport();
  
  console.log(`[Daily PoR] Portfolio Summary:`, {
    usdcBalance: report.summary.totalUsdcBalance,
    invested: report.summary.totalInvestedUsd,
    btcPrice: report.summary.currentBtcPrice,
    totalValue: report.summary.totalPortfolioValueUsd,
    proofHash: report.proofHash
  });
  
  return report.summary;
}
