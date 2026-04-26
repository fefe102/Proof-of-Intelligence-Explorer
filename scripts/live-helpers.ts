import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createPublicClient, createWalletClient, defineChain, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export type LiveConfig = {
  mode: string;
  enableLiveWrites: boolean;
  expectedChainId: number;
  rpcUrl: string;
  privateKey?: Hex;
  walletAddress?: Address;
  maxTxPerOperation: number;
};

export type LivePreflight = {
  chainId: number;
  address?: Address;
  balanceWei?: string;
};

export function loadLocalEnv(path = ".env") {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rest] = trimmed.split("=");
    if (!rawKey) continue;
    const key = rawKey.trim();
    if (process.env[key]) continue;
    const rawValue = rest.join("=").trim();
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

export function liveConfig(): LiveConfig {
  return {
    mode: process.env.POI_MODE ?? "hybrid",
    enableLiveWrites: process.env.POI_ENABLE_LIVE_WRITES === "true",
    expectedChainId: Number(process.env["0G_CHAIN_ID"] ?? "16602"),
    rpcUrl: process.env["0G_RPC_URL"] ?? "https://evmrpc-testnet.0g.ai",
    privateKey: normalizePrivateKey(process.env["0G_PRIVATE_KEY"]),
    walletAddress: normalizeAddress(process.env["0G_WALLET_ADDRESS"]),
    maxTxPerOperation: Number(process.env.POI_MAX_TX_PER_OPERATION ?? "5")
  };
}

export function liveWritesAvailable(config = liveConfig()) {
  return config.enableLiveWrites && Boolean(config.privateKey);
}

export function printSanitizedPlan(operation: string, config = liveConfig()) {
  console.log(
    JSON.stringify(
      {
        operationId: `poi-${operation}-20260426`,
        operation,
        mode: config.mode,
        chainId: config.expectedChainId,
        rpcUrlConfigured: Boolean(config.rpcUrl),
        walletConfigured: Boolean(config.privateKey),
        addressConfigured: Boolean(config.walletAddress),
        liveWritesEnabled: config.enableLiveWrites,
        maxTxPerOperation: config.maxTxPerOperation
      },
      null,
      2
    )
  );
}

export async function preflightLiveWrite(config = liveConfig()): Promise<LivePreflight> {
  if (config.expectedChainId !== 16602 && process.env.POI_ALLOW_NON_GALILEO !== "true") {
    throw new Error(`Refusing live write on non-0G Galileo chain ${config.expectedChainId}`);
  }
  if (!config.privateKey) {
    throw new Error("Missing 0G_PRIVATE_KEY for live write");
  }
  if (config.maxTxPerOperation < 1 || config.maxTxPerOperation > 5) {
    throw new Error("POI_MAX_TX_PER_OPERATION must be between 1 and 5");
  }

  const chain = zeroGChain(config.expectedChainId, config.rpcUrl);
  const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== config.expectedChainId) {
    throw new Error(`0G chain preflight failed: expected ${config.expectedChainId}, got ${actualChainId}`);
  }

  const account = privateKeyToAccount(config.privateKey);
  if (config.walletAddress && account.address.toLowerCase() !== config.walletAddress.toLowerCase()) {
    throw new Error("0G_WALLET_ADDRESS does not match 0G_PRIVATE_KEY");
  }

  const balance = await publicClient.getBalance({ address: account.address });
  if (balance <= 0n) {
    throw new Error("0G wallet balance is zero");
  }

  return { chainId: actualChainId, address: account.address, balanceWei: balance.toString() };
}

export function liveClients(config = liveConfig()) {
  if (!config.privateKey) throw new Error("Missing 0G_PRIVATE_KEY");
  const chain = zeroGChain(config.expectedChainId, config.rpcUrl);
  const account = privateKeyToAccount(config.privateKey);
  return {
    account,
    publicClient: createPublicClient({ chain, transport: http(config.rpcUrl) }),
    walletClient: createWalletClient({ account, chain, transport: http(config.rpcUrl) })
  };
}

export function writeSafeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function zeroGChain(chainId: number, rpcUrl: string) {
  return defineChain({
    id: chainId,
    name: chainId === 16602 ? "0G Galileo" : `Configured 0G testnet ${chainId}`,
    nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
    rpcUrls: { default: { http: [rpcUrl] } }
  });
}

function normalizePrivateKey(value: string | undefined): Hex | undefined {
  if (!value) return undefined;
  return value.startsWith("0x") ? (value as Hex) : (`0x${value}` as Hex);
}

function normalizeAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  return value as Address;
}
