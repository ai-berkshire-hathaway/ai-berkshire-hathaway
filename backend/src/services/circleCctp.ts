// backend/src/services/circleCctp.ts
import "dotenv/config";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";

import { ARC_TESTNET, BASE_SEPOLIA } from "../config/chains";

/**
 * 环境变量：
 * - PRIVATE_KEY: Arc & Base 上同一个 EOA，用于发 burn/mint 的交易（测试环境用）
 * - DESTINATION_ADDRESS: Base 上接收 USDC 的地址（后续再用这笔 USDC 去买 BTC）
 * - IRIS_BASE_URL: CCTP Iris API base (sandbox) 默认 https://iris-api-sandbox.circle.com
 */
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const DESTINATION_ADDRESS =
  process.env.DESTINATION_ADDRESS || "0xYourBaseWalletAddressHere";
const IRIS_BASE_URL =
  process.env.IRIS_BASE_URL || "https://iris-api-sandbox.circle.com";

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is required in environment for CCTP");
}

// Normalize PRIVATE_KEY into a 0x-prefixed hex string with the correct template literal type
const PRIVATE_KEY_HEX = (
  PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`
) as `0x${string}`;

const account = privateKeyToAccount(PRIVATE_KEY_HEX);

// Arc Testnet wallet client
const arcClient = createWalletClient({
  account,
  chain: {
    id: ARC_TESTNET.id,
    name: ARC_TESTNET.name,
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: { default: { http: [ARC_TESTNET.rpcUrl] } },
  },
  transport: http(),
});

// Base Sepolia wallet client
const baseSepoliaClient = createWalletClient({
  account,
  chain: {
    id: BASE_SEPOLIA.id,
    name: BASE_SEPOLIA.name,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [BASE_SEPOLIA.rpcUrl] } },
  },
  transport: http(),
});

// Bytes32 helpers
const DESTINATION_ADDRESS_BYTES32 = `0x${"0".repeat(
  24 * 2
)}${DESTINATION_ADDRESS.replace(/^0x/, "")}` as `0x${string}`;
const DESTINATION_CALLER_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

// 允许的 fast transfer fee，单位是 10^6 USDC 子单位（这里 0.0005 USDC） [oai_citation:11‡Circle Developer Docs](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche)
const DEFAULT_MAX_FEE = 500n;

// 1. Approve USDC on Arc Testnet to TokenMessengerV2
export async function approveArcUsdcIfNeeded(
  allowanceAmount: bigint = 10_000_000_000n // 10,000 USDC
) {
  console.log("[CCTP] Approving USDC on Arc...");

  const approveTxHash = await arcClient.sendTransaction({
    to: ARC_TESTNET.usdcErc20 as `0x${string}`,
    data: encodeFunctionData({
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
      args: [ARC_TESTNET.cctp.tokenMessenger as `0x${string}`, allowanceAmount],
    }),
  });

  console.log(`[CCTP] Arc USDC approve tx: ${approveTxHash}`);
  return approveTxHash;
}

// 2. Burn USDC on Arc using TokenMessengerV2.depositForBurn
export async function burnUsdcOnArc(
  amount: bigint,
  maxFee: bigint = DEFAULT_MAX_FEE
): Promise<`0x${string}`> {
  console.log("[CCTP] Burning USDC on Arc via TokenMessengerV2...");

  const burnTxHash = await arcClient.sendTransaction({
    to: ARC_TESTNET.cctp.tokenMessenger as `0x${string}`,
    data: encodeFunctionData({
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
        BASE_SEPOLIA.cctp.domain, // destinationDomain
        DESTINATION_ADDRESS_BYTES32,
        ARC_TESTNET.usdcErc20 as `0x${string}`,
        DESTINATION_CALLER_BYTES32,
        maxFee,
        1000, // minFinalityThreshold (<=1000 => Fast Transfer)  [oai_citation:12‡Circle Developer Docs](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche)
      ],
    }),
  });

  console.log(`[CCTP] Burn tx (Arc): ${burnTxHash}`);
  return burnTxHash as `0x${string}`;
}

// 3. Poll Circle Iris API until attestation is ready
export async function retrieveCctpAttestation(
  burnTxHash: string
): Promise<{ message: `0x${string}`; attestation: `0x${string}` }> {
  console.log("[CCTP] Polling Iris for attestation...");
  const url = `${IRIS_BASE_URL}/v2/messages/${ARC_TESTNET.cctp.domain}?transactionHash=${burnTxHash}`;

  while (true) {
    try {
      const res = await axios.get(url);
      if (res.status === 404) {
        console.log("[CCTP] Attestation not found yet, waiting...");
      } else if (res.data?.messages?.[0]?.status === "complete") {
        console.log("[CCTP] Attestation retrieved!");
        const msg = res.data.messages[0];
        return {
          message: msg.message as `0x${string}`,
          attestation: msg.attestation as `0x${string}`,
        };
      } else {
        console.log("[CCTP] Attestation status:", res.data?.messages?.[0]?.status);
      }
    } catch (err: any) {
      console.error("[CCTP] Error fetching attestation:", err?.message || err);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// 4. Mint USDC on Base Sepolia via MessageTransmitterV2.receiveMessage
export async function mintUsdcOnBaseSepolia(att: {
  message: `0x${string}`;
  attestation: `0x${string}`;
}): Promise<`0x${string}`> {
  console.log("[CCTP] Minting USDC on Base Sepolia via receiveMessage...");

  const mintTxHash = await baseSepoliaClient.sendTransaction({
    to: BASE_SEPOLIA.cctp.messageTransmitter as `0x${string}`,
    data: encodeFunctionData({
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
  return mintTxHash as `0x${string}`;
}

/**
 * 高层封装：从 Arc 把 amount USDC 桥到 Base Sepolia
 *
 * @param amountUsdc 以 10^6 子单位为单位的 USDC 数量 (例如 5 USDC => 5_000_000n)
 */
export async function bridgeUsdcArcToBaseSepolia(amountUsdc: bigint) {
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

export const circleCctp = {
  async bridgeUsdcFromArcToBase(params: { usdcAmount: bigint; arcTxHash: string }) {
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
}
