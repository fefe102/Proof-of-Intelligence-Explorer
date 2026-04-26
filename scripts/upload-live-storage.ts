import { codeguardianCertificate, codeguardianManifest, codeguardianRun, createVerifier } from "@poi/sdk";
import { loadLocalEnv, liveConfig, printSanitizedPlan, writeSafeJson } from "./live-helpers";

loadLocalEnv();
const operation = "upload-storage-bundle";
const config = liveConfig();
printSanitizedPlan(operation, config);

const report = await createVerifier().verify("codeguardian");

writeSafeJson("deployments/0g-storage-bundle.json", {
  mode: process.env["0G_STORAGE_MODE"] ?? "hybrid",
  chainId: config.expectedChainId,
  agent: "CodeGuardian",
  roots: report.evidence,
  manifest: codeguardianManifest,
  run: codeguardianRun,
  certificate: codeguardianCertificate,
  storageIndexerConfigured: Boolean(process.env["0G_STORAGE_INDEXER_RPC"]),
  message: "Hybrid artifact prepared for 0G Storage upload. Mock roots remain deterministic when live storage is unavailable."
});
