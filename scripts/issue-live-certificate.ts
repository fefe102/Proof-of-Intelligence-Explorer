import { codeguardianCertificate, createVerifier } from "@poi/sdk";
import { loadLocalEnv, liveConfig, liveWritesAvailable, preflightLiveWrite, printSanitizedPlan, writeSafeJson } from "./live-helpers";

loadLocalEnv();
const operation = "issue-certificate";
const config = liveConfig();
printSanitizedPlan(operation, config);

const report = await createVerifier().verify("codeguardian");
let preflight: Awaited<ReturnType<typeof preflightLiveWrite>> | undefined;

if (liveWritesAvailable(config)) {
  preflight = await preflightLiveWrite(config);
}

writeSafeJson("deployments/codeguardian-certificate.json", {
  mode: preflight ? "live-ready" : "hybrid",
  chainId: config.expectedChainId,
  issuer: preflight?.address ?? "mock-registry",
  certificate: codeguardianCertificate,
  evidence: report.evidence,
  message: preflight
    ? "Preflight passed. Registry certificate write is allowlisted and ready for live implementation."
    : "Certificate artifact exported in deterministic hybrid mode."
});
