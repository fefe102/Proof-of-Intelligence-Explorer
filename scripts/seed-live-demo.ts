import { createVerifier } from "@poi/sdk";
import { loadLocalEnv, liveConfig, liveWritesAvailable, preflightLiveWrite, printSanitizedPlan, readJson, writeSafeJson } from "./live-helpers";

loadLocalEnv();
const operation = "seed-live-demo";
const config = liveConfig();
printSanitizedPlan(operation, config);

const [codeguardian, fakeagent] = await Promise.all([createVerifier().verify("codeguardian"), createVerifier().verify("fakeagent")]);
const deployment = readJson<Record<string, unknown>>("deployments/0g-galileo.json");
let preflight: Awaited<ReturnType<typeof preflightLiveWrite>> | undefined;

if (liveWritesAvailable(config)) {
  preflight = await preflightLiveWrite(config);
}

writeSafeJson("deployments/demo-seed.json", {
  mode: preflight ? "live-ready" : "hybrid",
  chainId: config.expectedChainId,
  operator: preflight?.address ?? "mock-operator",
  contracts: {
    registryAddress: process.env.POI_REGISTRY_ADDRESS ?? deployment?.registryAddress ?? "",
    demoInftAddress: process.env.POI_DEMO_INFT_ADDRESS ?? deployment?.demoInftAddress ?? ""
  },
  agents: {
    codeguardian: { tier: codeguardian.tier, status: codeguardian.status, roots: codeguardian.evidence },
    fakeagent: { tier: fakeagent.tier, status: fakeagent.status, missing: fakeagent.missing }
  },
  message: "Seed artifact is public and contains no private keys or tokens."
});
