import { Contract } from "ethers";
import { ArcDcaAbi, ARC_DCA_CONTROLLER_ADDRESS, arcWallet } from "../config/chains";
import { bridgeUsdcArcToBaseSepolia } from "../services/circleCctp";
import { fetchPythPriceUpdateData } from "../services/pyth";

// 假设这里已经从 Arc 合约/事件里知道要定投 5 USDC
const FIVE_USDC = 5_000_000n; // 5 * 10^6

/**
 * Simple cron-like loop that calls updatePriceAndMaybeInvest every 10 minutes.
 * In a production environment you might use node-cron or another scheduler.
 */
export async function startDcaCron() {
  const contract = new Contract(ARC_DCA_CONTROLLER_ADDRESS, ArcDcaAbi, arcWallet);

  const loop = async () => {
    try {
      console.log("[DCA Cron] Fetching Pyth price update data...");
      const priceUpdateData = await fetchPythPriceUpdateData();
      console.log("[DCA Cron] Sending updatePriceAndMaybeInvest tx...");

      const tx = await contract.updatePriceAndMaybeInvest(priceUpdateData, {
        value: 0n // TODO: Pyth may require a fee, set msg.value accordingly
      });
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
  // 1. 先拉一份最新的 BTC/USD priceUpdateData（用于上链喂价）
  const priceUpdateData = await fetchPythPriceUpdateData();
  // -> 这里你可以：
  //    a) 在 backend 里直接喂 Arc 上的 Pyth 合约
  //    b) 或者把 priceUpdateData 作为参数传到 Arc strategy 合约的某个函数里
  // 具体看你之前合约的设计

  // 2. 满足 DCA 条件后，从 Arc 桥 5 USDC 到 Base Sepolia
  const { burnTxHash, mintTxHash } = await bridgeUsdcArcToBaseSepolia(FIVE_USDC);

  console.log("[DCA] CCTP bridge finished", { burnTxHash, mintTxHash });

  // 3. 后续你可以在 Base (Sepolia/Mainnet) 上用 baseTrader.ts 去 USDC -> cbBTC
}