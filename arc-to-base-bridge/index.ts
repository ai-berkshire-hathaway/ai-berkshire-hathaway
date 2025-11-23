// index.ts
import "dotenv/config";
import { BridgeKit, type ChainDefinition } from "@circle-fin/bridge-kit";
import { createAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { inspect } from "util";

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  // 1. Create a universal EVM Adapter using private key (can connect to Arc / Base and other EVM chains)
  const evmAdapter = createAdapterFromPrivateKey({
    privateKey: pk,
  });

  // 2. Read all supported chain configurations from BridgeKit
  const kit = new BridgeKit();
  const chains: ChainDefinition[] = kit.getSupportedChains();

  // 3. Find Arc Testnet & Base Sepolia
  //    Note: only use string/boolean fields like name/isTestnet here, avoid directly touching Blockchain enum literals
  const arcTestnet = chains.find(
    (c) => c.isTestnet && c.name.toLowerCase().includes("arc")
  );

  const baseSepolia = chains.find(
    (c) =>
      c.isTestnet &&
      (c.name === "Base Sepolia" ||
        c.name.toLowerCase().includes("base sepolia"))
  );

  if (!arcTestnet) {
    console.error(
      "Arc testnet not found in BridgeKit.getSupportedChains(). Available chains:",
      chains.map((c) => ({ name: c.name, chain: c.chain, isTestnet: c.isTestnet }))
    );
    throw new Error("Arc Testnet not found");
  }

  if (!baseSepolia) {
    console.error(
      "Base Sepolia not found in BridgeKit.getSupportedChains(). Available chains:",
      chains.map((c) => ({ name: c.name, chain: c.chain, isTestnet: c.isTestnet }))
    );
    throw new Error("Base Sepolia not found");
  }

  console.log("From (Arc testnet):", {
    name: arcTestnet.name,
    chain: arcTestnet.chain,
  });
  console.log("To   (Base Sepolia):", {
    name: baseSepolia.name,
    chain: baseSepolia.chain,
  });

  // Amount of USDC to transfer (human readable, BridgeKit handles decimals internally)
  const amount = "10.00";

  console.log("----------- Start bridging Arc → Base USDC -----------");

  try {
    const result = await kit.bridge({
      from: {
        adapter: evmAdapter,
        chain: arcTestnet.chain, // Type is Blockchain enum, use directly
      },
      to: {
        adapter: evmAdapter,
        chain: baseSepolia.chain,
      },
      amount,
      // token: "USDC", // Default is USDC, can be omitted
    });

    console.log("Bridge state:", result.state);
    console.log("Full result:");
    console.log(inspect(result, false, null, true));

    // If you want to print explorer links for each step, you can add:
    // for (const step of result.steps ?? []) {
    //   console.log(
    //     `Step: ${step.name} - ${step.state} - ${step.data?.explorerUrl ?? ""}`
    //   );
    // }
  } catch (err) {
    console.error("Bridge failed:");
    console.error(inspect(err, false, null, true));
  }
}

void main();