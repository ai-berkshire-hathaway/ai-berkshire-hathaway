"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.circleCctp = void 0;
exports.approveArcUsdcIfNeeded = approveArcUsdcIfNeeded;
exports.burnUsdcOnArc = burnUsdcOnArc;
exports.retrieveCctpAttestation = retrieveCctpAttestation;
exports.mintUsdcOnBaseSepolia = mintUsdcOnBaseSepolia;
exports.bridgeUsdcArcToBaseSepolia = bridgeUsdcArcToBaseSepolia;
// backend/src/services/circleCctp.ts
require("dotenv/config");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const axios_1 = __importDefault(require("axios"));
const chains_1 = require("../config/chains");
/**
 * 环境变量：
 * - PRIVATE_KEY: Arc & Base 上同一个 EOA，用于发 burn/mint 的交易（测试环境用）
 * - DESTINATION_ADDRESS: Base 上接收 USDC 的地址（后续再用这笔 USDC 去买 BTC）
 * - IRIS_BASE_URL: CCTP Iris API base (sandbox) 默认 https://iris-api-sandbox.circle.com
 */
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS || "0xYourBaseWalletAddressHere";
const IRIS_BASE_URL = process.env.IRIS_BASE_URL || "https://iris-api-sandbox.circle.com";
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required in environment for CCTP");
}
const account = (0, accounts_1.privateKeyToAccount)(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
// Arc Testnet wallet client
const arcClient = (0, viem_1.createWalletClient)({
    account,
    chain: {
        id: chains_1.ARC_TESTNET.id,
        name: chains_1.ARC_TESTNET.name,
        nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
        rpcUrls: { default: { http: [chains_1.ARC_TESTNET.rpcUrl] } },
    },
    transport: (0, viem_1.http)(),
});
// Base Sepolia wallet client
const baseSepoliaClient = (0, viem_1.createWalletClient)({
    account,
    chain: {
        id: chains_1.BASE_SEPOLIA.id,
        name: chains_1.BASE_SEPOLIA.name,
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [chains_1.BASE_SEPOLIA.rpcUrl] } },
    },
    transport: (0, viem_1.http)(),
});
// Bytes32 helpers
const DESTINATION_ADDRESS_BYTES32 = `0x${"0".repeat(24 * 2)}${DESTINATION_ADDRESS.replace(/^0x/, "")}`;
const DESTINATION_CALLER_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
// 允许的 fast transfer fee，单位是 10^6 USDC 子单位（这里 0.0005 USDC） [oai_citation:11‡Circle Developer Docs](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche)
const DEFAULT_MAX_FEE = 500n;
// 1. Approve USDC on Arc Testnet to TokenMessengerV2
async function approveArcUsdcIfNeeded(allowanceAmount = 10000000000n // 10,000 USDC
) {
    console.log("[CCTP] Approving USDC on Arc...");
    const approveTxHash = await arcClient.sendTransaction({
        to: chains_1.ARC_TESTNET.usdcErc20,
        data: (0, viem_1.encodeFunctionData)({
            abi: [
                {
                    type: "function",
                    name: "approve",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" },
                    ],
                    outputs: [{ name: "", type: "bool" }],
                },
            ],
            functionName: "approve",
            args: [chains_1.ARC_TESTNET.cctp.tokenMessenger, allowanceAmount],
        }),
    });
    console.log(`[CCTP] Arc USDC approve tx: ${approveTxHash}`);
    return approveTxHash;
}
// 2. Burn USDC on Arc using TokenMessengerV2.depositForBurn
async function burnUsdcOnArc(amount, maxFee = DEFAULT_MAX_FEE) {
    console.log("[CCTP] Burning USDC on Arc via TokenMessengerV2...");
    const burnTxHash = await arcClient.sendTransaction({
        to: chains_1.ARC_TESTNET.cctp.tokenMessenger,
        data: (0, viem_1.encodeFunctionData)({
            abi: [
                {
                    type: "function",
                    name: "depositForBurn",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "amount", type: "uint256" },
                        { name: "destinationDomain", type: "uint32" },
                        { name: "mintRecipient", type: "bytes32" },
                        { name: "burnToken", type: "address" },
                        { name: "destinationCaller", type: "bytes32" },
                        { name: "maxFee", type: "uint256" },
                        { name: "minFinalityThreshold", type: "uint32" },
                    ],
                    outputs: [],
                },
            ],
            functionName: "depositForBurn",
            args: [
                amount,
                chains_1.BASE_SEPOLIA.cctp.domain, // destinationDomain
                DESTINATION_ADDRESS_BYTES32,
                chains_1.ARC_TESTNET.usdcErc20,
                DESTINATION_CALLER_BYTES32,
                maxFee,
                1000, // minFinalityThreshold (<=1000 => Fast Transfer)  [oai_citation:12‡Circle Developer Docs](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche)
            ],
        }),
    });
    console.log(`[CCTP] Burn tx (Arc): ${burnTxHash}`);
    return burnTxHash;
}
// 3. Poll Circle Iris API until attestation is ready
async function retrieveCctpAttestation(burnTxHash) {
    console.log("[CCTP] Polling Iris for attestation...");
    const url = `${IRIS_BASE_URL}/v2/messages/${chains_1.ARC_TESTNET.cctp.domain}?transactionHash=${burnTxHash}`;
    while (true) {
        try {
            const res = await axios_1.default.get(url);
            if (res.status === 404) {
                console.log("[CCTP] Attestation not found yet, waiting...");
            }
            else if (res.data?.messages?.[0]?.status === "complete") {
                console.log("[CCTP] Attestation retrieved!");
                const msg = res.data.messages[0];
                return {
                    message: msg.message,
                    attestation: msg.attestation,
                };
            }
            else {
                console.log("[CCTP] Attestation status:", res.data?.messages?.[0]?.status);
            }
        }
        catch (err) {
            console.error("[CCTP] Error fetching attestation:", err?.message || err);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}
// 4. Mint USDC on Base Sepolia via MessageTransmitterV2.receiveMessage
async function mintUsdcOnBaseSepolia(att) {
    console.log("[CCTP] Minting USDC on Base Sepolia via receiveMessage...");
    const mintTxHash = await baseSepoliaClient.sendTransaction({
        to: chains_1.BASE_SEPOLIA.cctp.messageTransmitter,
        data: (0, viem_1.encodeFunctionData)({
            abi: [
                {
                    type: "function",
                    name: "receiveMessage",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "message", type: "bytes" },
                        { name: "attestation", type: "bytes" },
                    ],
                    outputs: [],
                },
            ],
            functionName: "receiveMessage",
            args: [att.message, att.attestation],
        }),
    });
    console.log(`[CCTP] Mint tx (Base Sepolia): ${mintTxHash}`);
    return mintTxHash;
}
/**
 * 高层封装：从 Arc 把 amount USDC 桥到 Base Sepolia
 *
 * @param amountUsdc 以 10^6 子单位为单位的 USDC 数量 (例如 5 USDC => 5_000_000n)
 */
async function bridgeUsdcArcToBaseSepolia(amountUsdc) {
    // 1) approve
    await approveArcUsdcIfNeeded();
    // 2) burn
    const burnTxHash = await burnUsdcOnArc(amountUsdc);
    // 3) poll attestation
    const att = await retrieveCctpAttestation(burnTxHash);
    // 4) mint on Base Sepolia
    const mintTxHash = await mintUsdcOnBaseSepolia(att);
    return { burnTxHash, mintTxHash };
}
exports.circleCctp = {
    async bridgeUsdcFromArcToBase(params) {
        console.log("[circleCctp] Bridge USDC from Arc to Base:", {
            usdcAmount: params.usdcAmount.toString(),
            arcTxHash: params.arcTxHash
        });
        // TODO:
        // - Call Circle SDK / Web3 APIs / BridgeKit
        // - Wait for attestation + Base mint
        // - Return the Base transaction hash where USDC is minted
        // For now, return a fake tx hash
        return {
            baseTxHash: "0xFAKE_BASE_CCTP_TX_HASH"
        };
    }
};
