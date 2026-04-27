import codeguardianCertificateFixture from "../fixtures/codeguardian.certificate.json";
import codeguardianComputeRunsFixture from "../fixtures/codeguardian.compute-runs.json";
import codeguardianBundleFixture from "../fixtures/codeguardian.intelligence.encrypted.json";
import codeguardianManifestFixture from "../fixtures/codeguardian.manifest.json";
import codeguardianMemoryFixture from "../fixtures/codeguardian.memory.json";
import codeguardianMemoryEvolutionFixture from "../fixtures/codeguardian.memory-evolution.json";
import codeguardianRunFixture from "../fixtures/codeguardian.run.json";
import codeguardianRunsFixture from "../fixtures/codeguardian.runs.json";
import codeguardianPolicyUpgradeFixture from "../fixtures/codeguardian.policy-upgrade.json";
import codeguardianSkillHashesFixture from "../fixtures/codeguardian.skill-hashes.json";
import fakeagentMetadataFixture from "../fixtures/fakeagent.metadata.json";
import type {
  Certificate,
  ComputeRuns,
  IntelligenceBundle,
  Manifest,
  MemoryState,
  RunTrace,
} from "./schema";

export const codeguardianManifest = codeguardianManifestFixture as Manifest;
export const codeguardianRun = codeguardianRunFixture as RunTrace;
export const codeguardianRuns = codeguardianRunsFixture as RunTrace[];
export const codeguardianCertificate =
  codeguardianCertificateFixture as Certificate;
export const codeguardianComputeRuns =
  codeguardianComputeRunsFixture as ComputeRuns;
export const codeguardianBundle =
  codeguardianBundleFixture as IntelligenceBundle;
export const codeguardianMemory = codeguardianMemoryFixture as MemoryState;
export const codeguardianMemoryEvolution = codeguardianMemoryEvolutionFixture;
export const codeguardianPolicyUpgrade = codeguardianPolicyUpgradeFixture;
export const codeguardianSkillHashes = codeguardianSkillHashesFixture as Record<
  string,
  string
>;
export const fakeagentMetadata = fakeagentMetadataFixture;
