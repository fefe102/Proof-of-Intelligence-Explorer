import { runCodeGuardian, writeCodeGuardianArtifacts } from "@poi/agent-runtime";
import { loadLocalEnv, liveConfig, printSanitizedPlan, writeSafeJson } from "./live-helpers";

loadLocalEnv();
const operation = "run-codeguardian";
const config = liveConfig();
printSanitizedPlan(operation, config);

const result = runCodeGuardian({ source: process.env["0G_COMPUTE_BEARER_TOKEN"] ? "hybrid" : "mock" });
writeCodeGuardianArtifacts(result, "tmp/codeguardian-live");
writeSafeJson("deployments/codeguardian-run.json", {
  mode: process.env["0G_COMPUTE_MODE"] ?? "hybrid",
  chainId: config.expectedChainId,
  runId: result.run.runId,
  memoryRoot: result.memoryRootAfter,
  traceRoot: result.certificate.evidence.latestRunRoot,
  computeRunIds: result.computeRuns.runs.map((run) => run.id),
  computeProviderConfigured: Boolean(process.env["0G_COMPUTE_PROVIDER"]),
  computeBearerConfigured: Boolean(process.env["0G_COMPUTE_BEARER_TOKEN"])
});
