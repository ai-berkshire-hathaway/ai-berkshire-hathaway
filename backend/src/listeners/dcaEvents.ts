import { Contract } from "ethers";
import { ArcDcaAbi, ARC_DCA_CONTROLLER_ADDRESS, arcProvider } from "../config/chains";
import { circleCctp } from "../services/circleCctp";
import { baseTrader } from "../services/baseTrader";
import { db } from "../services/db";

export async function startDcaEventListener() {
  const contract = new Contract(ARC_DCA_CONTROLLER_ADDRESS, ArcDcaAbi, arcProvider);

  console.log("[DCA Listener] Subscribing to DCARequested events...");
  contract.on(
    "DCARequested",
    async (
      planId: bigint,
      thresholdIndex: bigint,
      usdcAmount: bigint,
      price: bigint,
      expo: number,
      publishTime: bigint,
      event
    ) => {
      console.log("[DCA Listener] DCARequested:", {
        planId: planId.toString(),
        thresholdIndex: thresholdIndex.toString(),
        usdcAmount: usdcAmount.toString(),
        price: price.toString(),
        expo,
        publishTime: publishTime.toString()
      });

      try {
        // 1. Bridge USDC from Arc to Base via CCTP
        const bridgeResult = await circleCctp.bridgeUsdcFromArcToBase({
          usdcAmount,
          arcTxHash: event.transactionHash
        });

        // 2. Swap bridged USDC to BTC on Base
        const tradeResult = await baseTrader.swapUsdcToBtc({
          usdcAmount,
          baseUsdcTxHash: bridgeResult.baseTxHash
        });

        // 3. Persist to DB
        await db.insertDcaEvent({
          planId: Number(planId),
          thresholdIndex: Number(thresholdIndex),
          usdcAmount: usdcAmount.toString(),
          price: price.toString(),
          expo,
          publishTime: Number(publishTime),
          arcTxHash: event.transactionHash,
          bridgeTxHash: bridgeResult.baseTxHash,
          baseSwapTxHash: tradeResult.swapTxHash,
          btcReceived: tradeResult.btcOut.toString()
        });
      } catch (err) {
        console.error("[DCA Listener] Error handling DCARequested:", err);
      }
    }
  );
}