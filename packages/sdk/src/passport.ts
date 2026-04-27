import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import {
  canonicalizeJson,
  hashCanonicalJson,
  hashCertificate,
  hashIntelligenceBundle,
  hashManifestForRoot,
  hashMemoryEvidence,
  hashRunTrace,
} from "./canonical";
import type {
  Certificate,
  ComputeRuns,
  IntelligenceBundle,
  Manifest,
  MemoryState,
  RunTrace,
} from "./schema";
import type { EvidenceSource } from "./adapters";
import type { VerificationReport, VerificationTier } from "./verifier";

const demoKeyMaterial =
  "CodeGuardian iNFT deterministic demo encryption key - not a production secret";

export type AgentPassport = {
  chainId: number;
  contract: string;
  tokenId: string;
  owner?: string;
  manifestRoot?: string;
  intelligenceRoot?: string;
  memoryRoot?: string;
  latestRunRoot?: string;
  computeRunIds: string[];
  certificateId?: string;
  verificationTier: VerificationTier;
  source: EvidenceSource;
  updatedAt: string;
};

export type PassportDraft = {
  chainId: number;
  contract: string;
  tokenId: string;
  owner: string;
  name: string;
  description: string;
  skills: Array<{ name: string; version?: string; permissions?: string[] }>;
  allowedActions: string[];
  memoryPolicy: string;
  intelligence: Record<string, unknown>;
  memory?: Partial<MemoryState>;
  run?: RunTrace;
  computeRuns?: ComputeRuns;
};

export function createIntelligenceBundle(input: {
  agent: string;
  goals: string[];
  behaviorPolicy: string;
  toolPermissions: string[];
  skills: string[];
  capabilities?: string[];
  storage?: string;
  compute?: string;
  version?: string;
  ciphertext?: string;
  iv?: string;
  authTag?: string;
}): IntelligenceBundle {
  return {
    schema: "poi-intelligence/v0.1",
    agent: input.agent,
    encrypted: true,
    algorithm: "aes-256-gcm",
    ciphertext: input.ciphertext ?? "",
    iv: input.iv ?? "",
    authTag: input.authTag ?? "",
    publicSummary: {
      agent: input.agent,
      goals: input.goals,
      behaviorPolicy: input.behaviorPolicy,
      toolPermissions: input.toolPermissions,
      skills: input.skills,
      capabilities: input.capabilities,
      storage: input.storage,
      compute: input.compute,
      version: input.version ?? "0.1.0",
    },
  };
}

export function encryptIntelligenceBundle(
  bundle: Record<string, unknown>,
  options: { agent?: string; key?: string | Buffer; iv?: Buffer } = {},
): IntelligenceBundle {
  const agent = options.agent ?? String(bundle.name ?? "Agent");
  const key = encryptionKey(options.key);
  const iv =
    options.iv ??
    createHash("sha256")
      .update(canonicalPlaintext(bundle))
      .digest()
      .subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(canonicalPlaintext(bundle), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return createIntelligenceBundle({
    agent,
    goals: Array.isArray(bundle.goals)
      ? bundle.goals.map(String)
      : ["Verify agent behavior"],
    behaviorPolicy: String(bundle.behaviorPolicy ?? "No policy supplied"),
    toolPermissions: Array.isArray(bundle.toolPermissions)
      ? bundle.toolPermissions.map(String)
      : [],
    skills: Array.isArray(bundle.skills) ? bundle.skills.map(String) : [],
    capabilities: Array.isArray(bundle.capabilities)
      ? bundle.capabilities.map(String)
      : undefined,
    storage: typeof bundle.storage === "string" ? bundle.storage : undefined,
    compute: typeof bundle.compute === "string" ? bundle.compute : undefined,
    version: typeof bundle.version === "string" ? bundle.version : undefined,
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  });
}

export function decryptIntelligenceBundleForTest(
  bundle: IntelligenceBundle,
  key?: string | Buffer,
) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(key),
    Buffer.from(bundle.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(bundle.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(bundle.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as Record<string, unknown>;
}

export function createRandomEncryptionIv() {
  return randomBytes(12);
}

function encryptionKey(key?: string | Buffer) {
  if (Buffer.isBuffer(key)) {
    if (key.length !== 32) throw new Error("AES-256-GCM key must be 32 bytes");
    return key;
  }
  return createHash("sha256").update(key ?? demoKeyMaterial).digest();
}

function canonicalPlaintext(value: unknown) {
  return canonicalizeJson(value);
}

export function createRunTrace(input: {
  runId: string;
  agent: string;
  task: string;
  events?: RunTrace["events"];
  result?: RunTrace["result"];
  source?: EvidenceSource;
}): RunTrace {
  return {
    schema: "poi-run/v0.1",
    runId: input.runId,
    agent: input.agent,
    source: input.source ?? "hybrid",
    task: input.task,
    events: input.events ?? [],
    result:
      input.result ??
      {
        issue: "No issue recorded",
        patch: "No patch recorded",
        critique: "No critique recorded",
        accepted: false,
      },
  };
}

export function computeEvidenceRoots(input: {
  manifest?: Manifest;
  intelligenceBundle?: IntelligenceBundle;
  memory?: MemoryState;
  run?: RunTrace;
  computeRuns?: ComputeRuns;
  certificate?: Certificate;
}) {
  return {
    manifestRoot: input.manifest
      ? hashManifestForRoot(input.manifest)
      : undefined,
    intelligenceBundleRoot: input.intelligenceBundle
      ? hashIntelligenceBundle(input.intelligenceBundle)
      : undefined,
    memoryRoot: input.memory ? hashMemoryEvidence(input.memory) : undefined,
    latestRunRoot: input.run ? hashRunTrace(input.run) : undefined,
    computeRunsRoot: input.computeRuns
      ? hashCanonicalJson(input.computeRuns)
      : undefined,
    certificateRoot: input.certificate
      ? hashCertificate(input.certificate)
      : undefined,
  };
}

export function createPassportManifest(draft: PassportDraft): Manifest {
  const intelligenceBundle = encryptIntelligenceBundle(draft.intelligence, {
    agent: draft.name,
  });
  const memory: MemoryState = {
    schema: "poi-memory/v0.1",
    agent: draft.name,
    checkpoint: {
      runCount: draft.memory?.checkpoint?.runCount ?? 0,
      lastFinding: draft.memory?.checkpoint?.lastFinding ?? "No run yet",
      stateRoot:
        draft.memory?.checkpoint?.stateRoot ??
        hashCanonicalJson({ agent: draft.name, memoryPolicy: draft.memoryPolicy }),
    },
    history: draft.memory?.history ?? [],
  };
  const run =
    draft.run ??
    createRunTrace({
      runId: `${draft.name.toLowerCase().replaceAll(/\s+/g, "-")}-draft-run`,
      agent: draft.name,
      task: "Initial Passport draft",
      source: "hybrid",
    });
  const computeRunIds = draft.computeRuns?.runs.map((runRecord) => runRecord.id) ?? [];
  const manifest: Manifest = {
    schema: "poi/v0.1",
    name: draft.name,
    description: draft.description,
    inft: {
      chainId: draft.chainId,
      contract: draft.contract,
      tokenId: draft.tokenId,
      standard: "ERC-7857/iNFT-style",
    },
    identity: { owner: draft.owner },
    storage: {
      manifestRoot:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      intelligenceBundleRoot: hashIntelligenceBundle(intelligenceBundle),
      memoryRoot: hashMemoryEvidence(memory),
      latestRunRoot: hashRunTrace(run),
    },
    compute: {
      provider: draft.computeRuns?.provider ?? "hybrid-recorder",
      models: draft.computeRuns ? [draft.computeRuns.model] : ["not-recorded"],
      latestRunIds: computeRunIds,
    },
    skills: draft.skills.map((skill) => ({
      name: skill.name,
      version: skill.version ?? "0.1.0",
      codeHash: hashCanonicalJson(skill),
      permissions: skill.permissions ?? [],
    })),
    memory: {
      type: draft.memoryPolicy,
      checkpointRoot: hashCanonicalJson(memory.checkpoint),
      historyRoot: hashCanonicalJson(memory.history),
    },
    proof: { status: "draft" },
    permissions: {
      publicProfile: true,
      ownerCanDecrypt: true,
      allowedActions: draft.allowedActions,
    },
  };
  manifest.storage.manifestRoot = hashManifestForRoot(manifest);
  return manifest;
}

export function passportFromReport(report: VerificationReport): AgentPassport {
  return {
    chainId: report.token?.chainId ?? report.manifest?.inft.chainId ?? 0,
    contract: report.token?.contract ?? report.manifest?.inft.contract ?? "",
    tokenId: report.token?.tokenId ?? report.manifest?.inft.tokenId ?? "",
    owner: report.token?.owner ?? report.manifest?.identity.owner,
    manifestRoot: report.evidence.manifestRoot,
    intelligenceRoot: report.evidence.intelligenceBundleRoot,
    memoryRoot: report.evidence.memoryRoot,
    latestRunRoot: report.evidence.latestRunRoot,
    computeRunIds:
      report.computeRuns?.runs.map((run) => run.id) ??
      report.manifest?.compute.latestRunIds ??
      [],
    certificateId: report.certificate?.certificateId,
    verificationTier: report.tier,
    source: report.sources.includes("live")
      ? "live"
      : report.sources.includes("hybrid")
        ? "hybrid"
        : "mock",
    updatedAt: report.issuedAt,
  };
}

export type PoiRecorder = {
  startRun(input: { task: string }): Promise<RunTrace>;
  recordComputeCall(input: {
    model: string;
    inputHash: string;
    outputHash: string;
  }): Promise<void>;
  recordMemoryWrite(input: { memoryRoot: string }): Promise<void>;
  finishRun(input: { resultRoot: string }): Promise<RunTrace>;
};

export function createPoiRecorder(input: {
  chainId: number;
  contract: string;
  tokenId: string;
  agent?: string;
  source?: EvidenceSource;
}): PoiRecorder {
  const agent = input.agent ?? "Agent";
  let run = createRunTrace({
    runId: `poi-run-${input.chainId}-${input.tokenId}-${Date.now()}`,
    agent,
    task: "",
    source: input.source ?? "hybrid",
  });

  return {
    async startRun(start) {
      run = {
        ...run,
        task: start.task,
        events: [
          {
            type: "task_received",
            at: new Date().toISOString(),
            detail: {
              chainId: input.chainId,
              contract: input.contract,
              tokenId: input.tokenId,
              task: start.task,
            },
          },
        ],
      };
      return run;
    },
    async recordComputeCall(call) {
      run.events.push({
        type: "compute_completed",
        at: new Date().toISOString(),
        detail: call,
      });
    },
    async recordMemoryWrite(memory) {
      run.events.push({
        type: "memory_written",
        at: new Date().toISOString(),
        detail: memory,
      });
    },
    async finishRun(result) {
      run.events.push({
        type: "trace_committed",
        at: new Date().toISOString(),
        detail: result,
      });
      return run;
    },
  };
}

export function badgeStatusForTier(tier: number) {
  if (tier >= 6) return "Tier 6";
  if (tier >= 2) return "Partial";
  if (tier >= 1) return "Failed";
  return "Unknown";
}
