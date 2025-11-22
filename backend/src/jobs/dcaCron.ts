import { Contract } from "ethers";
import { ArcDcaAbi, ARC_DCA_CONTROLLER_ADDRESS, arcWallet } from "../config/chains";
import axios from "axios";

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

/**
 * Placeholder for getting Pyth price update data.
 * Replace with real Pyth SDK / HTTP call.
 */
async function fetchPythPriceUpdateData(): Promise<string[]> {
  // Example: call a Pyth "price updates" endpoint and get serialized priceFeedUpdateData
  // For now, return an empty array so the contract just reads cached price.
  // You can add real logic here later.
  try {
    // const res = await axios.get("https://your-pyth-endpoint");
    // return res.data.priceUpdateData;
    return [];
  } catch (err) {
    console.error("[DCA Cron] Failed to fetch Pyth data, using []:", err);
    return [];
  }
}