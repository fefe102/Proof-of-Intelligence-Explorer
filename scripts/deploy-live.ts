import { existsSync, readFileSync } from "node:fs";
import { loadLocalEnv, liveClients, liveConfig, liveWritesAvailable, preflightLiveWrite, printSanitizedPlan, writeSafeJson } from "./live-helpers";

type HardhatArtifact = {
  abi: unknown[];
  bytecode: `0x${string}`;
};

loadLocalEnv();

const operation = "deploy-contracts";
const config = liveConfig();
printSanitizedPlan(operation, config);

if (!liveWritesAvailable(config)) {
  writeSafeJson("deployments/0g-galileo.json", {
    mode: "hybrid",
    chainId: config.expectedChainId,
    liveWrites: false,
    message: "Live deployment skipped because POI_ENABLE_LIVE_WRITES or 0G_PRIVATE_KEY is missing."
  });
  process.exit(0);
}

const preflight = await preflightLiveWrite(config);
const { publicClient, walletClient } = liveClients(config);
const demo = readArtifact("artifacts/contracts/DemoINFT.sol/DemoINFT.json");
const registry = readArtifact("artifacts/contracts/ProofOfIntelligenceRegistry.sol/ProofOfIntelligenceRegistry.json");

const demoHash = await walletClient.deployContract({
  abi: demo.abi,
  bytecode: demo.bytecode,
  args: ["CodeGuardian iNFT", "CGI", preflight.address]
});
const demoReceipt = await publicClient.waitForTransactionReceipt({ hash: demoHash });

const registryHash = await walletClient.deployContract({
  abi: registry.abi,
  bytecode: registry.bytecode,
  args: [preflight.address]
});
const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });

writeSafeJson("deployments/0g-galileo.json", {
  mode: "live",
  chainId: preflight.chainId,
  deployer: preflight.address,
  demoInftAddress: demoReceipt.contractAddress,
  registryAddress: registryReceipt.contractAddress,
  txHashes: [demoHash, registryHash],
  updatedAt: new Date().toISOString()
});

function readArtifact(path: string): HardhatArtifact {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Run pnpm contracts:test before live deployment.`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as HardhatArtifact;
}
