"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDcaEventListener = startDcaEventListener;
const ethers_1 = require("ethers");
const chains_1 = require("../config/chains");
const circleCctp_1 = require("../services/circleCctp");
const baseTrader_1 = require("../services/baseTrader");
const db_1 = require("../services/db");
async function startDcaEventListener() {
    const contract = new ethers_1.Contract(chains_1.ARC_DCA_CONTROLLER_ADDRESS, chains_1.ArcDcaAbi, chains_1.arcProvider);
    console.log("[DCA Listener] Subscribing to DCARequested events...");
    contract.on("DCARequested", async (planId, thresholdIndex, usdcAmount, price, expo, publishTime, event) => {
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
            const bridgeResult = await circleCctp_1.circleCctp.bridgeUsdcFromArcToBase({
                usdcAmount,
                arcTxHash: event.transactionHash
            });
            // 2. Swap bridged USDC to BTC on Base
            const tradeResult = await baseTrader_1.baseTrader.swapUsdcToBtc({
                usdcAmount,
                baseUsdcTxHash: bridgeResult.baseTxHash
            });
            // 3. Persist to DB
            await db_1.db.insertDcaEvent({
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
        }
        catch (err) {
            console.error("[DCA Listener] Error handling DCARequested:", err);
        }
    });
}
