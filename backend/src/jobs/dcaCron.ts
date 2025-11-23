import { Contract } from "ethers";
import { BaseDcaAbi, BASE_SEPOLIA, baseTraderWallet } from "../config/chains";
import { bridgeUsdcArcToBaseSepolia } from "../services/circleCctp";
import { fetchChainlinkBtcPrice } from "../services/chainlink";
import { executeLocalDCACron } from "./localDcaCron";

// 假设这里已经从 Arc 合约/事件里知道要定投 5 USDC
const FIVE_USDC = 5_000_000n; // 5 * 10^6

/**
 * Simple cron-like loop that calls updatePriceAndMaybeInvest every 10 minutes.
 * Now uses Chainlink price feeds instead of Pyth.
 * In a production environment you might use node-cron or another scheduler.
 */
export async function startDcaCron() {
  const contract = new Contract(BASE_SEPOLIA.dcaController, BaseDcaAbi, baseTraderWallet);

  const loop = async () => {
    try {
      console.log("[DCA Cron] Fetching Chainlink BTC price...");
      const priceData = await fetchChainlinkBtcPrice('sepolia');
      console.log(`[DCA Cron] Current BTC price: $${Number(priceData.price) / (10 ** priceData.decimals)}`);
      
      console.log("[DCA Cron] Sending updatePriceAndMaybeInvest tx...");
      const tx = await contract.updatePriceAndMaybeInvest();
      console.log("[DCA Cron] Tx sent:", tx.hash);
      await tx.wait();
      console.log("[DCA Cron] Tx confirmed");
    } catch (err) {
      console.error("[DCA Cron] Error:", err);
    } finally {
      setTimeout(loop, 10 * 60 * 1000); // 10 minutes
    }
  };

  loop();
}

export async function runDcaOnce() {
  // 1. 检查当前 BTC 价格并触发 DCA 检查
  const priceData = await fetchChainlinkBtcPrice('sepolia');
  console.log(`[DCA] Current BTC price: $${Number(priceData.price) / (10 ** priceData.decimals)}`);
  
  // 直接调用 Base 上的 DCA 合约检查价格和执行 DCA
  const contract = new Contract(BASE_SEPOLIA.dcaController, BaseDcaAbi, baseTraderWallet);
  const tx = await contract.updatePriceAndMaybeInvest();
  console.log("[DCA] Price check tx sent:", tx.hash);
  await tx.wait();
  console.log("[DCA] Price check tx confirmed");

  // 2. 如果需要从 Arc 桥接 USDC，可以在这里执行
  // const { burnTxHash, mintTxHash } = await bridgeUsdcArcToBaseSepolia(FIVE_USDC);
  // console.log("[DCA] CCTP bridge finished", { burnTxHash, mintTxHash });

  // 3. 后续你可以在 Base (Sepolia/Mainnet) 上用 baseTrader.ts 去 USDC -> cbBTC
}

/**
 * 启动本地 DCA Cron 任务
 * 使用 CRE 工作流本地模拟，无需部署到 Chainlink DON
 */
export async function startLocalDcaCron() {
  console.log("[Local DCA Cron] Starting local DCA execution loop...");
  
  const loop = async () => {
    try {
      console.log("[Local DCA Cron] Executing local DCA workflow...");
      const result = await executeLocalDCACron();
      
      if (result?.success) {
        console.log("[Local DCA Cron] Local DCA execution successful");
      } else {
        console.error("[Local DCA Cron] Local DCA execution failed:", result?.error || 'Unknown error');
      }
    } catch (err) {
      console.error("[Local DCA Cron] Unexpected error:", err);
    } finally {
      // 每10分钟执行一次
      setTimeout(loop, 10 * 60 * 1000);
    }
  };

  // 立即执行一次，然后开始循环
  loop();
}