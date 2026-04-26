import { loadLocalEnv, liveClients, liveConfig, liveWritesAvailable, preflightLiveWrite, printSanitizedPlan, readArtifact, readJson, writeSafeJson } from "./live-helpers";

type Deployment = {
  mode?: string;
  chainId?: number;
  demoInftAddress?: string;
  registryAddress?: string;
  txHashes?: string[];
};

loadLocalEnv();

const operation = "deploy-contracts";
const config = liveConfig();
printSanitizedPlan(operation, config);
const existing = readJson<Deployment>("deployments/0g-galileo.json");

if (existing?.mode === "live" && existing.demoInftAddress && existing.registryAddress && process.env.POI_FORCE_DEPLOY !== "true") {
  writeSafeJson("deployments/0g-galileo.json", {
    ...existing,
    liveWrites: true,
    message: "Live deployment already exists. Set POI_FORCE_DEPLOY=true to redeploy."
  });
  process.exit(0);
}

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
