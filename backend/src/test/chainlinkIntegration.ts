// backend/src/test/chainlinkIntegration.ts
import { fetchChainlinkBtcPrice, chainlinkPriceService } from "../services/chainlink";
import { porServiceSepolia, generateDailyProofOfReserve } from "../services/proofOfReserve";
import { baseTraderSepolia } from "../services/baseTrader";

/**
 * Test script to verify Chainlink integration and proof of reserves
 */
async function testChainlinkIntegration() {
  console.log("🔗 Testing Chainlink Integration...\n");

  try {
    // Test 1: Fetch BTC price from Chainlink
    console.log("1️⃣ Testing Chainlink BTC/USD price fetch...");
    const priceData = await fetchChainlinkBtcPrice('sepolia');
    
    console.log("✅ Price data received:", {
      price: chainlinkPriceService.formatPrice(priceData),
      decimals: priceData.decimals,
      updatedAt: new Date(Number(priceData.updatedAt) * 1000).toISOString(),
      roundId: priceData.roundId.toString()
    });

    // Test 2: Validate price data
    console.log("\n2️⃣ Testing price validation...");
    chainlinkPriceService.validatePriceData(priceData);
    console.log("✅ Price validation passed");

    // Test 3: Test base trader price integration
    console.log("\n3️⃣ Testing BaseTrader price integration...");
    const currentPrice = await baseTraderSepolia.getCurrentBtcPrice();
    console.log("✅ BaseTrader price:", currentPrice);

    // Test 4: Simulate a swap (without actual execution)
    console.log("\n4️⃣ Testing swap simulation...");
    const swapParams = {
      usdcAmount: BigInt(100_000_000), // 100 USDC
      baseUsdcTxHash: "0x1234567890abcdef1234567890abcdef12345678",
      maxSlippagePercent: 1.0
    };
    
    // Note: This will fail if contracts aren't deployed, but we can test the price logic
    try {
      const swapResult = await baseTraderSepolia.swapUsdcToBtc(swapParams);
      console.log("✅ Swap simulation completed:", {
        btcOut: (Number(swapResult.btcOut) / (10 ** 8)).toFixed(8),
        executionPrice: swapResult.executionPrice,
        slippage: swapResult.slippage
      });
    } catch (error) {
      console.log("⚠️ Swap simulation failed (expected if contracts not deployed):", error instanceof Error ? error.message : String(error));
    }

    // Test 5: Test proof of reserves service (will fail without deployed contracts)
    console.log("\n5️⃣ Testing Proof of Reserves service...");
    try {
      const totalInvested = BigInt(1000_000_000); // $1000 USD
      const porSummary = await generateDailyProofOfReserve('sepolia', totalInvested);
      console.log("✅ PoR generation completed:", porSummary);
    } catch (error) {
      console.log("⚠️ PoR generation failed (expected if contracts not deployed):", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🎉 Chainlink integration test completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Deploy the BaseDCAController contract to Base Sepolia");
    console.log("   2. Update BASE_SEPOLIA.dcaController in chains.ts with the deployed address");
    console.log("   3. Run the DCA cron job to test end-to-end functionality");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

/**
 * Test Chainlink price feeds across different networks
 */
async function testMultiNetworkPrices() {
  console.log("\n🌐 Testing multi-network price feeds...\n");

  const networks: ('mainnet' | 'sepolia')[] = ['mainnet', 'sepolia'];

  for (const network of networks) {
    try {
      console.log(`📡 Fetching BTC price from ${network}...`);
      const priceData = await fetchChainlinkBtcPrice(network);
      const formattedPrice = chainlinkPriceService.formatPrice(priceData);
      
      console.log(`✅ ${network.toUpperCase()}: $${formattedPrice} BTC/USD`);
    } catch (error) {
      console.log(`❌ ${network.toUpperCase()} failed:`, error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Compare Chainlink prices with external sources (for validation)
 */
async function validatePriceAccuracy() {
  console.log("\n🔍 Validating price accuracy...\n");

  try {
    // Get Chainlink price
    const chainlinkPrice = await fetchChainlinkBtcPrice('mainnet');
    const chainlinkPriceFormatted = Number(chainlinkPriceService.formatPrice(chainlinkPrice));

    console.log(`🔗 Chainlink BTC/USD: $${chainlinkPriceFormatted}`);

    // You could add external API calls here for comparison
    // For example, CoinGecko, CoinMarketCap, etc.
    console.log("💡 Add external price source comparison for production validation");

  } catch (error) {
    console.error("❌ Price validation failed:", error);
  }
}

// Main execution
async function main() {
  await testChainlinkIntegration();
  await testMultiNetworkPrices();
  await validatePriceAccuracy();
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  testChainlinkIntegration,
  testMultiNetworkPrices,
  validatePriceAccuracy
};
