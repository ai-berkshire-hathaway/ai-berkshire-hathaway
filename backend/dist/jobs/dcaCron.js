"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDcaCron = startDcaCron;
exports.runDcaOnce = runDcaOnce;
const ethers_1 = require("ethers");
const chains_1 = require("../config/chains");
const circleCctp_1 = require("../services/circleCctp");
// 假设这里已经从 Arc 合约/事件里知道要定投 5 USDC
const FIVE_USDC = 5000000n; // 5 * 10^6
/**
 * Simple cron-like loop that calls updatePriceAndMaybeInvest every 10 minutes.
 * In a production environment you might use node-cron or another scheduler.
 */
async function startDcaCron() {
    const contract = new ethers_1.Contract(chains_1.ARC_DCA_CONTROLLER_ADDRESS, chains_1.ArcDcaAbi, chains_1.arcWallet);
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
        }
        catch (err) {
            console.error("[DCA Cron] Error:", err);
        }
        finally {
            setTimeout(loop, 10 * 60 * 1000); // 10 minutes
        }
    };
    loop();
}
/**
 * Placeholder for getting Pyth price update data.
 * Replace with real Pyth SDK / HTTP call.
 */
async function fetchPythPriceUpdateData() {
    // Example: call a Pyth "price updates" endpoint and get serialized priceFeedUpdateData
    // For now, return an empty array so the contract just reads cached price.
    // You can add real logic here later.
    try {
        // const res = await axios.get("https://your-pyth-endpoint");
        // return res.data.priceUpdateData;
        return [];
    }
    catch (err) {
        console.error("[DCA Cron] Failed to fetch Pyth data, using []:", err);
        return [];
    }
}
async function runDcaOnce() {
    // 1. 先拉一份最新的 BTC/USD priceUpdateData（用于上链喂价）
    const priceUpdateData = await fetchPythPriceUpdateData();
    // -> 这里你可以：
    //    a) 在 backend 里直接喂 Arc 上的 Pyth 合约
    //    b) 或者把 priceUpdateData 作为参数传到 Arc strategy 合约的某个函数里
    // 具体看你之前合约的设计
    // 2. 满足 DCA 条件后，从 Arc 桥 5 USDC 到 Base Sepolia
    const { burnTxHash, mintTxHash } = await (0, circleCctp_1.bridgeUsdcArcToBaseSepolia)(FIVE_USDC);
    console.log("[DCA] CCTP bridge finished", { burnTxHash, mintTxHash });
    // 3. 后续你可以在 Base (Sepolia/Mainnet) 上用 baseTrader.ts 去 USDC -> cbBTC
}
