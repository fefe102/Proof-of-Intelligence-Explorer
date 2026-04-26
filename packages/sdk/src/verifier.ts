import { hashCanonicalJson, hashManifestForProof } from "./canonical";
import {
  CertificateSchema,
  ComputeRunsSchema,
  IntelligenceBundleSchema,
  ManifestSchema,
  MemoryStateSchema,
  RunTraceSchema,
  type Certificate,
  type ComputeRuns,
  type IntelligenceBundle,
  type Manifest,
  type MemoryState,
  type RunTrace,
} from "./schema";
import {
  MockChainAdapter,
  MockComputeAdapter,
  MockDAAdapter,
  MockEnsAdapter,
  MockStorageAdapter,
  type ChainAdapter,
  type ComputeAdapter,
  type DAAdapter,
  type EnsAdapter,
  type EvidenceSource,
  type StorageAdapter,
  type TokenSnapshot,
} from "./adapters";

export type VerificationTier = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type VerificationStatus =
  | "verified"
  | "partial"
  | "failed"
  | "unsupported";

export type CheckResult = {
  id: string;
  label: string;
  ok: boolean;
  tier: VerificationTier;
  source: EvidenceSource;
  detail: string;
  root?: string;
};

export type VerificationReport = {
  agent: string;
  tier: VerificationTier;
  status: VerificationStatus;
  summary: string;
  checks: CheckResult[];
  evidence: Record<string, string>;
  missing: string[];
  sources: EvidenceSource[];
  token?: TokenSnapshot;
  manifest?: Manifest;
  certificate?: Certificate;
  run?: RunTrace;
  computeRuns?: ComputeRuns;
  da?: { available: boolean; bundleRoot?: string; source?: EvidenceSource };
  issuedAt: string;
};

export type VerifyTarget =
  | { alias: string }
  | { contract: string; tokenId: string }
  | { manifest: Manifest }
  | { manifestRoot: string }
  | { ens: string };

export type VerifierOptions = {
  chain?: ChainAdapter;
  storage?: StorageAdapter;
  compute?: ComputeAdapter;
  da?: DAAdapter;
  ens?: EnsAdapter;
};

export function verifyIntelligenceBundle(
  bundle: unknown,
  expectedRoot: string,
): CheckResult {
  const parsed = IntelligenceBundleSchema.safeParse(bundle);
  const root = parsed.success ? hashCanonicalJson(parsed.data) : undefined;
  const ok = parsed.success && root === expectedRoot && parsed.data.encrypted;
  return {
    id: "intelligence_bundle",
    label: "Encrypted intelligence bundle",
    ok,
    tier: 3,
    source: "mock",
    root,
    detail: ok
      ? "Encrypted bundle exists and root matches"
      : "Bundle missing, invalid, unencrypted, or root mismatch",
  };
}

export function verifyMemory(
  memory: unknown,
  expectedRoot: string,
): CheckResult {
  const parsed = MemoryStateSchema.safeParse(memory);
  const root = parsed.success ? hashCanonicalJson(parsed.data) : undefined;
  const ok =
    parsed.success && root === expectedRoot && parsed.data.history.length > 0;
  return {
    id: "memory",
    label: "Persistent memory",
    ok,
    tier: 4,
    source: "mock",
    root,
    detail: ok
      ? "Memory checkpoint and history root match"
      : "Memory state missing, invalid, empty, or root mismatch",
  };
}

export function verifyComputeHistory(
  computeRuns: unknown,
  expectedRunIds: string[],
): CheckResult {
  const parsed = ComputeRunsSchema.safeParse(computeRuns);
  const actual = new Set(
    parsed.success ? parsed.data.runs.map((run) => run.id) : [],
  );
  const ok =
    parsed.success &&
    expectedRunIds.length > 0 &&
    expectedRunIds.every((id) => actual.has(id));
  return {
    id: "compute_history",
    label: "0G Compute run history",
    ok,
    tier: 5,
    source: parsed.success ? (parsed.data.runs[0]?.source ?? "mock") : "mock",
    root: parsed.success ? hashCanonicalJson(parsed.data) : undefined,
    detail: ok
      ? "Analysis and critic run records are present"
      : "Compute run history is missing required run ids",
  };
}

export function verifyRunTrace(
  trace: unknown,
  expectedRoot: string,
): CheckResult {
  const parsed = RunTraceSchema.safeParse(trace);
  const root = parsed.success ? hashCanonicalJson(parsed.data) : undefined;
  const eventTypes = new Set(
    parsed.success ? parsed.data.events.map((event) => event.type) : [],
  );
  const required = [
    "task_received",
    "compute_completed",
    "issue_found",
    "patch_proposed",
    "critic_completed",
    "memory_written",
  ];
  const ok =
    parsed.success &&
    root === expectedRoot &&
    required.every((event) => eventTypes.has(event));
  return {
    id: "run_trace",
    label: "Executable behavior trace",
    ok,
    tier: 5,
    source: parsed.success ? parsed.data.source : "mock",
    root,
    detail: ok
      ? "Replayable trace includes analysis, patch, critic, and memory events"
      : "Run trace is missing required executable events",
  };
}

export function verifyCertificate(
  certificate: unknown,
  manifest: Manifest,
): CheckResult {
  const parsed = CertificateSchema.safeParse(certificate);
  const computeRunIds = new Set(
    parsed.success ? parsed.data.evidence.computeRunIds : [],
  );
  const ok =
    parsed.success &&
    parsed.data.agent === manifest.name &&
    parsed.data.evidence.inft.chainId === manifest.inft.chainId &&
    parsed.data.evidence.inft.contract.toLowerCase() ===
      manifest.inft.contract.toLowerCase() &&
    parsed.data.evidence.inft.tokenId === manifest.inft.tokenId &&
    parsed.data.evidence.intelligenceBundleRoot ===
      manifest.storage.intelligenceBundleRoot &&
    parsed.data.evidence.memoryRoot === manifest.storage.memoryRoot &&
    parsed.data.evidence.latestRunRoot === manifest.storage.latestRunRoot &&
    manifest.compute.latestRunIds.every((runId) => computeRunIds.has(runId)) &&
    manifest.proof.certificateId === parsed.data.certificateId;
  return {
    id: "certificate",
    label: "Certificate/export bundle",
    ok,
    tier: 6,
    source: "mock",
    root: parsed.success ? hashCanonicalJson(parsed.data) : undefined,
    detail: ok
      ? "Certificate binds iNFT, roots, and compute run ids"
      : "Certificate is missing or does not match manifest evidence",
  };
}

export async function verifyOptionalEns(
  adapter: EnsAdapter,
  name?: string,
): Promise<CheckResult> {
  if (!name) {
    return {
      id: "ens",
      label: "Optional ENS",
      ok: true,
      tier: 2,
      source: adapter.source,
      detail: "ENS is optional and was not configured",
    };
  }

  const resolved = await adapter.resolveName(name);
  return {
    id: "ens",
    label: "Optional ENS",
    ok: Boolean(resolved),
    tier: 2,
    source: adapter.source,
    detail: resolved
      ? "ENS resolved to an agent token"
      : "ENS name did not resolve, but ENS is optional",
  };
}

export function exportProofJson(report: VerificationReport): string {
  return JSON.stringify(report, null, 2);
}

export async function exportDaBundle(
  report: VerificationReport,
  da = new MockDAAdapter(),
) {
  return da.exportBundle({
    agent: report.agent,
    roots: Object.values(report.evidence).filter((value) =>
      value.startsWith("sha256:"),
    ),
  });
}

export class ProofOfIntelligenceVerifier {
  private readonly chain: ChainAdapter;
  private readonly storage: StorageAdapter;
  private readonly compute: ComputeAdapter;
  private readonly da: DAAdapter;
  private readonly ens: EnsAdapter;

  constructor(options: VerifierOptions = {}) {
    this.chain = options.chain ?? new MockChainAdapter();
    this.storage = options.storage ?? new MockStorageAdapter();
    this.compute = options.compute ?? new MockComputeAdapter();
    this.da = options.da ?? new MockDAAdapter();
    this.ens = options.ens ?? new MockEnsAdapter();
  }

  async verify(input: VerifyTarget | string): Promise<VerificationReport> {
    const target = typeof input === "string" ? { alias: input } : input;
    const checks: CheckResult[] = [];
    const evidence: Record<string, string> = {};
    let token: TokenSnapshot | undefined;
    let manifest: Manifest | undefined;
    let agent = "unknown";

    if ("ens" in target) {
      const resolved = await this.ens.resolveName(target.ens);
      checks.push(await verifyOptionalEns(this.ens, target.ens));
      if (resolved) {
        token =
          (await this.chain.getToken(resolved.contract, resolved.tokenId)) ??
          undefined;
      }
    }

    if ("contract" in target) {
      token =
        (await this.chain.getToken(target.contract, target.tokenId)) ??
        undefined;
    }

    if ("alias" in target) {
      agent = target.alias.toLowerCase();
      manifest = (await this.storage.getManifestByAlias(agent)) ?? undefined;
      if (!manifest && agent === "fakeagent") {
        token =
          (await this.chain.getToken(
            "0x2222222222222222222222222222222222227857",
            "2",
          )) ?? undefined;
      }
    }

    if ("manifestRoot" in target) {
      manifest =
        (await this.storage.getManifestByRoot(target.manifestRoot)) ??
        undefined;
    }

    if ("manifest" in target) {
      manifest = target.manifest;
    }

    if (manifest) {
      agent = manifest.name.toLowerCase();
      token =
        token ??
        (await this.chain.getToken(
          manifest.inft.contract,
          manifest.inft.tokenId,
        )) ??
        undefined;
    }

    checks.push({
      id: "token",
      label: "iNFT token and ownership",
      ok: Boolean(token?.owner),
      tier: 1,
      source: token?.source ?? this.chain.source,
      detail: token?.owner
        ? "Token exists and owner can be read"
        : "Token is missing or ownership cannot be read",
    });

    const parsedManifest = manifest
      ? ManifestSchema.safeParse(manifest)
      : { success: false as const };
    const manifestRoot = parsedManifest.success
      ? hashManifestForProof(parsedManifest.data)
      : undefined;
    const manifestRootMatches =
      parsedManifest.success &&
      manifestRoot === parsedManifest.data.storage.manifestRoot;
    checks.push({
      id: "manifest",
      label: "Proof-of-Intelligence manifest",
      ok: manifestRootMatches,
      tier: 2,
      source: this.storage.source,
      root: manifestRoot,
      detail: manifestRootMatches
        ? "Manifest matches poi/v0.1 schema and manifest root rule"
        : parsedManifest.success
          ? "Manifest schema is valid, but manifest root does not match the canonical payload"
          : "No valid Proof-of-Intelligence manifest found",
    });

    let run: RunTrace | undefined;
    let computeRuns: ComputeRuns | undefined;
    let certificate: Certificate | undefined;

    if (manifestRootMatches) {
      manifest = parsedManifest.data;
      evidence.manifestRoot = manifest.storage.manifestRoot;
      evidence.intelligenceBundleRoot = manifest.storage.intelligenceBundleRoot;
      evidence.memoryRoot = manifest.storage.memoryRoot;
      evidence.latestRunRoot = manifest.storage.latestRunRoot;
      evidence.checkpointRoot = manifest.memory.checkpointRoot;
      evidence.historyRoot = manifest.memory.historyRoot;

      const [bundle, memory, trace, runs] = await Promise.all([
        this.storage.getJsonByRoot<IntelligenceBundle>(
          manifest.storage.intelligenceBundleRoot,
        ),
        this.storage.getJsonByRoot<MemoryState>(manifest.storage.memoryRoot),
        this.storage.getJsonByRoot<RunTrace>(manifest.storage.latestRunRoot),
        this.compute.getRuns(manifest.compute.latestRunIds),
      ]);

      run = trace ?? undefined;
      computeRuns = runs ?? undefined;
      checks.push(
        withSource(
          verifyIntelligenceBundle(
            bundle,
            manifest.storage.intelligenceBundleRoot,
          ),
          this.storage.source,
        ),
      );
      checks.push(
        withSource(
          verifyMemory(memory, manifest.storage.memoryRoot),
          this.storage.source,
        ),
      );
      checks.push(
        withSource(
          verifyComputeHistory(runs, manifest.compute.latestRunIds),
          this.compute.source,
        ),
      );
      checks.push(
        withSource(
          verifyRunTrace(trace, manifest.storage.latestRunRoot),
          this.storage.source,
        ),
      );
      checks.push(await verifyOptionalEns(this.ens, manifest.identity.ens));

      if (manifest.proof.certificateId) {
        certificate =
          (await this.storage.getCertificateById?.(
            manifest.proof.certificateId,
          )) ?? undefined;
        checks.push(
          withSource(
            verifyCertificate(certificate, manifest),
            this.storage.source,
          ),
        );
      }
    }

    const tier = calculateTier(checks);
    const missing = checks
      .filter((check) => !check.ok)
      .map((check) => check.label);
    const sources = Array.from(new Set(checks.map((check) => check.source)));
    const status = statusFor(agent, tier, missing.length);

    return {
      agent,
      tier,
      status,
      summary: summaryFor(tier, status),
      checks,
      evidence,
      missing,
      sources,
      token,
      manifest,
      certificate,
      run,
      computeRuns,
      da: { available: true, source: this.da.source },
      issuedAt: new Date("2026-04-26T00:00:00.000Z").toISOString(),
    };
  }
}

function withSource(check: CheckResult, source: EvidenceSource): CheckResult {
  return { ...check, source };
}

function calculateTier(checks: CheckResult[]): VerificationTier {
  const ok = (id: string) =>
    checks.some((check) => check.id === id && check.ok);
  if (!ok("token")) return 0;
  if (!ok("manifest")) return 1;
  if (!ok("intelligence_bundle")) return 2;
  if (!ok("memory")) return 3;
  if (!ok("compute_history") || !ok("run_trace")) return 4;
  if (!ok("certificate")) return 5;
  return 6;
}

function statusFor(
  agent: string,
  tier: VerificationTier,
  missingCount: number,
): VerificationStatus {
  if (tier === 0) {
    return "unsupported";
  }
  if (tier === 6 && missingCount === 0) {
    return "verified";
  }
  if (agent === "fakeagent" || tier <= 1) {
    return "failed";
  }
  return "partial";
}

function summaryFor(
  tier: VerificationTier,
  status: VerificationStatus,
): string {
  if (status === "verified") {
    return "This iNFT has verified encrypted intelligence, memory, compute history, replay trace, and certificate evidence.";
  }
  if (status === "unsupported") {
    return "This target is not recognized as an iNFT-style token with readable ownership.";
  }
  if (tier <= 1) {
    return "This token has metadata-like evidence only and does not prove embedded intelligence.";
  }
  return "This agent has partial Proof-of-Intelligence evidence, but some higher-tier checks are missing.";
}

export function createVerifier(options: VerifierOptions = {}) {
  return new ProofOfIntelligenceVerifier(options);
}
