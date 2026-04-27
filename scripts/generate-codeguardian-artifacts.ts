import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  CODEGUARDIAN_INFT,
  createCodeGuardianProofArtifacts,
} from "@poi/agent-runtime";
import { type ProofObjectRecord } from "@poi/sdk";

const deployment = readJson<Record<string, string | number>>(
  "deployments/0g-galileo.json",
);
const inft = {
  chainId: Number(deployment?.chainId ?? CODEGUARDIAN_INFT.chainId),
  contract: String(
    deployment?.demoInftAddress ?? CODEGUARDIAN_INFT.contract,
  ),
  tokenId: String(
    deployment?.codeguardianTokenId ?? CODEGUARDIAN_INFT.tokenId,
  ),
  standard: CODEGUARDIAN_INFT.standard,
};
const owner = String(deployment?.deployer ?? CODEGUARDIAN_INFT.owner);
const artifacts = createCodeGuardianProofArtifacts({
  source: "hybrid",
  inft,
  owner,
});
const objects = createProofObjects(artifacts);

writeJson("packages/sdk/fixtures/codeguardian.manifest.json", artifacts.manifest);
writeJson(
  "packages/sdk/fixtures/codeguardian.intelligence.encrypted.json",
  artifacts.intelligenceBundle,
);
writeJson("packages/sdk/fixtures/codeguardian.memory.json", artifacts.memory);
writeJson("packages/sdk/fixtures/codeguardian.run.json", artifacts.run);
writeJson("packages/sdk/fixtures/codeguardian.runs.json", artifacts.runs);
writeJson(
  "packages/sdk/fixtures/codeguardian.memory-evolution.json",
  artifacts.memoryEvolution,
);
writeJson(
  "packages/sdk/fixtures/codeguardian.compute-runs.json",
  artifacts.computeRuns,
);
writeJson(
  "packages/sdk/fixtures/codeguardian.certificate.json",
  artifacts.certificate,
);
writeJson("packages/sdk/fixtures/codeguardian.skill-hashes.json", artifacts.skillHashes);
writeJson(
  "packages/sdk/fixtures/codeguardian.policy-upgrade.json",
  artifacts.policyUpgrade,
);
writeJson("deployments/codeguardian-certificate.json", artifacts.certificate);
writeJson("deployments/codeguardian-run.json", {
  mode: "hybrid",
  run: artifacts.run,
  runs: artifacts.runs,
  memory: artifacts.memory,
  memories: artifacts.memories,
  memoryEvolution: artifacts.memoryEvolution,
  computeRuns: artifacts.computeRuns,
  certificate: artifacts.certificate,
  policyUpgrade: artifacts.policyUpgrade,
  skillHashes: artifacts.skillHashes,
});
writeJson("deployments/0g-storage-bundle.json", {
  mode: "hybrid",
  chainId: inft.chainId,
  agent: "CodeGuardian",
  roots: artifacts.roots,
  objects,
  manifest: artifacts.manifest,
  intelligenceBundle: artifacts.intelligenceBundle,
  memory: artifacts.memory,
  memories: artifacts.memories,
  run: artifacts.run,
  runs: artifacts.runs,
  computeRuns: artifacts.computeRuns,
  certificate: artifacts.certificate,
  memoryEvolution: artifacts.memoryEvolution,
  policyUpgrade: artifacts.policyUpgrade,
  skillHashes: artifacts.skillHashes,
  storageIndexerConfigured: false,
  storageUploadAttempted: false,
  liveComputeSource: "hybrid",
  message:
    "Hybrid CodeGuardian proof artifacts are deterministic and safe to host. Re-run scripts/upload-live-storage.ts with live 0G Storage env to replace object records with live tx hashes.",
});

function createProofObjects(
  artifacts: ReturnType<typeof createCodeGuardianProofArtifacts>,
): ProofObjectRecord[] {
  const values: Array<ProofObjectRecord & { value: unknown }> = [
    {
      name: "manifest",
      poiRoot: requireRoot(artifacts.roots, "manifestRoot"),
      source: "hybrid",
      value: artifacts.manifest,
    },
    {
      name: "intelligenceBundle",
      poiRoot: requireRoot(artifacts.roots, "intelligenceBundleRoot"),
      source: "hybrid",
      value: artifacts.intelligenceBundle,
    },
    {
      name: "memory",
      poiRoot: requireRoot(artifacts.roots, "memoryRoot"),
      source: "hybrid",
      value: artifacts.memory,
    },
    {
      name: "run",
      poiRoot: requireRoot(artifacts.roots, "latestRunRoot"),
      source: "hybrid",
      value: artifacts.run,
    },
    {
      name: "computeRuns",
      poiRoot: requireRoot(artifacts.roots, "computeRunsRoot"),
      source: "hybrid",
      value: artifacts.computeRuns,
    },
    {
      name: "certificate",
      poiRoot: requireRoot(artifacts.roots, "certificateRoot"),
      source: "hybrid",
      value: artifacts.certificate,
    },
  ];
  return values.map(({ value, ...object }) => ({
    ...object,
    byteLength: new TextEncoder().encode(JSON.stringify(value, null, 2))
      .byteLength,
  }));
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function requireRoot(roots: Record<string, string>, key: string) {
  const value = roots[key];
  if (!value) {
    throw new Error(`Missing CodeGuardian root: ${key}`);
  }
  return value;
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
