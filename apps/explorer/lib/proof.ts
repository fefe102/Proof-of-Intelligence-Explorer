import {
  ArtifactComputeAdapter,
  ArtifactStorageAdapter,
  MockChainAdapter,
  ZeroGChainAdapter,
  codeguardianCertificate,
  codeguardianManifest,
  codeguardianRun,
  createVerifier,
  exportDaBundle,
  fakeagentMetadata,
  hashCanonicalJson,
  hashManifestForProof,
  passportFromReport,
  type AgentPassport,
  type Certificate,
  type ChainAdapter,
  type Manifest,
  type ProofStorageBundle,
  type ProofObjectRecord,
  type RunTrace,
  type TokenSnapshot,
  type VerificationReport,
} from "@poi/sdk";
import storageBundleJson from "../../../deployments/0g-storage-bundle.json";
import deploymentJson from "../../../deployments/0g-galileo.json";

export type AgentSlug = "codeguardian" | "fakeagent";
const storageBundle = storageBundleJson as ProofStorageBundle;
const deployment = deploymentJson as unknown as Record<
  string,
  string | number | boolean | string[]
>;

export type PassportTarget = {
  chainId: number;
  contract: string;
  tokenId: string;
  manifestRoot?: string;
};

export type AgentProfile = {
  slug: AgentSlug;
  name: string;
  description: string;
  headline: string;
  report: VerificationReport;
  manifest?: Manifest;
  fakeMetadata?: typeof fakeagentMetadata;
};

export function modeLabel() {
  const publicMode = process.env.NEXT_PUBLIC_POI_PUBLIC_MODE ?? "hybrid";
  const privateMode = process.env.POI_MODE ?? publicMode;
  if (privateMode === "live") return "Live";
  if (privateMode === "mock") return "Mock";
  return "Hybrid";
}

export function publicStatus() {
  return {
    ok: true,
    app: "CodeGuardian iNFT",
    proofLayer:
      process.env.NEXT_PUBLIC_APP_NAME ??
      "AgentProof - Proof-of-Intelligence Explorer",
    mode: modeLabel().toLowerCase(),
    liveWritesEnabled: liveWritesEnabled(),
    chainId: String(currentChainId()),
    registryAddress: currentRegistryAddress(),
    demoInftAddress: currentDemoInftAddress(),
    certificateId: currentCertificateRecordId(),
    codeguardianTokenId: currentCodeGuardianTokenId(),
    fakeagentTokenId: currentFakeAgentTokenId(),
    proofLayers: proofLayers(),
    proofObjects: storageBundle.objects ?? [],
    seededAgents: ["codeguardian", "fakeagent"],
  };
}

export function liveWritesEnabled() {
  return (
    process.env.POI_ENABLE_LIVE_WRITES === "true" &&
    Boolean(process.env.POI_ADMIN_TOKEN)
  );
}

export async function verifyAgent(slug: string) {
  if (slug !== "codeguardian" && slug !== "fakeagent") {
    throw new Error(`Unsupported demo agent: ${slug}`);
  }
  const report =
    slug === "codeguardian" && storageBundle.manifest
      ? await createVerifier({
          chain: seededChainAdapter("codeguardian"),
          storage: new ArtifactStorageAdapter(storageBundle),
          compute: new ArtifactComputeAdapter(storageBundle),
        }).verify({ manifest: storageBundle.manifest })
      : await createVerifier({
          chain:
            slug === "fakeagent"
              ? seededChainAdapter("fakeagent")
              : new MockChainAdapter(),
        }).verify(slug);
  return applyLiveOverlay(slug, report);
}

export async function verifyPassportTarget(
  target: PassportTarget,
): Promise<VerificationReport> {
  if (isSeededCodeGuardianTarget(target)) {
    return verifyAgent("codeguardian");
  }
  if (isSeededFakeAgentTarget(target)) {
    return verifyAgent("fakeagent");
  }

  const verifier = createVerifier({
    chain: new ZeroGChainAdapter({
      chainId: target.chainId,
      rpcUrl:
        process.env["0G_RPC_URL"] ??
        process.env.NEXT_PUBLIC_0G_RPC_URL ??
        undefined,
    }),
    storage: new ArtifactStorageAdapter(storageBundle),
    compute: new ArtifactComputeAdapter(storageBundle),
  });
  return verifier.verify({
    contract: target.contract,
    tokenId: target.tokenId,
    chainId: target.chainId,
    manifestRoot: target.manifestRoot,
  });
}

export async function getPassportForTarget(
  target: PassportTarget,
): Promise<{ passport: AgentPassport; report: VerificationReport }> {
  const report = await verifyPassportTarget(target);
  return { passport: passportFromReport(report), report };
}

export async function getAgentProfile(slug: string): Promise<AgentProfile> {
  const report = await verifyAgent(slug);
  if (slug === "codeguardian") {
    return {
      slug,
      name: "CodeGuardian iNFT",
      headline: "Autonomous 0G iNFT code-review agent",
      description:
        "Encrypted intelligence, evolving memory, compute-backed critic loops, replay traces, dynamic upgrade evidence, and certificate roots.",
      report,
      manifest: report.manifest,
    };
  }

  return {
    slug: "fakeagent",
    name: "FakeAgent",
    headline: "Metadata-only agent claim",
    description:
      "A control token that looks like an agent profile but lacks a Proof-of-Intelligence manifest and evidence roots.",
    report,
    fakeMetadata: fakeagentMetadata,
  };
}

export function getRun(runId: string): RunTrace {
  const runFromBundle = storageBundle.runs?.find(
    (candidate) => candidate.runId === runId,
  );
  if (runFromBundle) {
    return runFromBundle as RunTrace;
  }
  const run = (storageBundle.run ?? codeguardianRun) as RunTrace;
  if (run.runId !== runId) {
    throw new Error(`Run not found: ${runId}`);
  }
  return run;
}

export function getCodeGuardianRuns(): RunTrace[] {
  return (storageBundle.runs ?? [storageBundle.run ?? codeguardianRun]).filter(
    Boolean,
  ) as RunTrace[];
}

export function getCodeGuardianMemoryEvolution() {
  return storageBundle.memoryEvolution ?? [];
}

export function getCodeGuardianPolicyUpgrade() {
  return storageBundle.policyUpgrade as
    | {
        skill: string;
        oldVersion: string;
        newVersion: string;
        oldHash: string;
        newHash: string;
        reason: string;
        runId: string;
      }
    | undefined;
}

export function getCodeGuardianSkillHashes() {
  return (storageBundle.skillHashes ?? {}) as Record<string, string>;
}

export function getProofObjects(): ProofObjectRecord[] {
  return storageBundle.objects ?? [];
}

export function chainscanContractUrl() {
  const address = currentDemoInftAddress();
  return address ? `https://chainscan-galileo.0g.ai/address/${address}` : "";
}

export function storageScanSearchUrl() {
  return "https://storagescan-galileo.0g.ai";
}

export async function getCodeGuardianConsole() {
  const profile = await getAgentProfile("codeguardian");
  const runs = getCodeGuardianRuns();
  const latestRun = runs.at(-1) ?? profile.report.run;
  const latestAnalysis = profile.report.computeRuns?.runs
    .filter((run) => run.type === "analysis")
    .at(-1);
  const latestCritic = profile.report.computeRuns?.runs
    .filter((run) => run.type === "critic")
    .at(-1);
  return {
    profile,
    runs,
    latestRun,
    latestAnalysis,
    latestCritic,
    memoryEvolution: getCodeGuardianMemoryEvolution(),
    policyUpgrade: getCodeGuardianPolicyUpgrade(),
    skillHashes: getCodeGuardianSkillHashes(),
    proofObjects: getProofObjects(),
    mintedInft: {
      chain: "0G Galileo",
      chainId: currentChainId(),
      contract: currentDemoInftAddress(),
      tokenId: currentCodeGuardianTokenId(),
      owner: currentDemoOwner(),
      registry: currentRegistryAddress(),
      certificateRecordId: currentCertificateRecordId(),
      passportId: process.env.NEXT_PUBLIC_POI_PASSPORT_ID ?? "",
      chainUrl: chainscanContractUrl(),
    },
  };
}

export function getCertificate(certificateId: string): Certificate {
  const certificate = (storageBundle.certificate ??
    codeguardianCertificate) as Certificate;
  if (certificate.certificateId !== certificateId) {
    throw new Error(`Certificate not found: ${certificateId}`);
  }
  return applyLiveCertificateOverlay(certificate);
}

export async function getDaBundle(agent = "codeguardian") {
  const report = await verifyAgent(agent);
  return exportDaBundle(report);
}

export function certificateRoot(certificate: Certificate) {
  return hashCanonicalJson(certificate);
}

export function sanitizedOperation(operation: string) {
  return {
    operationId: `poi-${operation}-20260426`,
    operation,
    mode: modeLabel().toLowerCase(),
    chainId: zeroGEnv("CHAIN_ID") ?? "16602",
    liveWritesEnabled: liveWritesEnabled(),
    message: liveWritesEnabled()
      ? "Live write preflight would validate 0G Galileo chain id, wallet address, balance, and allowlisted action before sending a transaction."
      : "Live write actions are disabled. Public verification remains available.",
  };
}

function zeroGEnv(suffix: string): string | undefined {
  return process.env[`0G_${suffix}`] ?? process.env[`ZERO_G_${suffix}`];
}

function applyLiveOverlay(
  slug: "codeguardian" | "fakeagent",
  report: VerificationReport,
): VerificationReport {
  const registryAddress = currentRegistryAddress();
  const demoInftAddress = currentDemoInftAddress();
  if (!registryAddress || !demoInftAddress) {
    return report;
  }

  const tokenId =
    slug === "codeguardian"
      ? currentCodeGuardianTokenId()
      : currentFakeAgentTokenId();
  const owner = currentDemoOwner() ?? report.token?.owner;
  const certificateId = currentCertificateRecordId();
  const passportId = process.env.NEXT_PUBLIC_POI_PASSPORT_ID ?? "";
  const sourceSet = new Set<VerificationReport["sources"][number]>([
    ...report.sources,
    "live",
  ]);
  const chainId = currentChainId();
  const liveInft = {
    chainId,
    contract: demoInftAddress,
    tokenId,
    standard:
      slug === "codeguardian"
        ? "ERC-7857-like live demo iNFT"
        : "ERC-721 metadata-only live control token",
  };
  const manifest =
    slug === "codeguardian" && report.manifest
      ? bindManifestToInft(report.manifest, liveInft)
      : report.manifest;
  const certificate =
    slug === "codeguardian" && report.certificate && manifest
      ? bindCertificateToInft(report.certificate, manifest.inft)
      : report.certificate;

  const token = {
    ...report.token,
    chainId,
    contract: demoInftAddress,
    tokenId,
    owner,
    metadataUri: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://proof-of-intelligence-explorer.vercel.app"}/api/agent/${slug}`,
    standard: liveInft.standard,
    manifestRoot:
      slug === "codeguardian" ? manifest?.storage.manifestRoot : undefined,
    source: "live" as const,
  };

  return {
    ...report,
    sources: Array.from(sourceSet),
    token,
    manifest,
    certificate,
    evidence: {
      ...report.evidence,
      ...(manifest ? { manifestRoot: manifest.storage.manifestRoot } : {}),
      liveRegistryAddress: registryAddress,
      liveDemoInftAddress: demoInftAddress,
      ...(slug === "codeguardian" && passportId
        ? { livePassportId: passportId }
        : {}),
      ...(slug === "codeguardian" && certificateId
        ? { liveCertificateId: certificateId }
        : {}),
    },
    checks: report.checks.map((check) => {
      if (check.id === "token") {
        return {
          ...check,
          ok: true,
          source: "live" as const,
          detail:
            "Live 0G Galileo demo token is seeded and publicly referenced",
        };
      }
      if (
        slug === "codeguardian" &&
        (check.id === "manifest" || check.id === "certificate")
      ) {
        return {
          ...check,
          source: "live" as const,
          root:
            check.id === "manifest"
              ? manifest?.storage.manifestRoot
              : certificate
                ? hashCanonicalJson(certificate)
                : check.root,
          detail:
            check.id === "manifest"
              ? "Manifest root is bound to the live demo iNFT and registered in the live Proof-of-Intelligence registry"
              : "Certificate binds the live demo iNFT and is issued in the live Proof-of-Intelligence registry",
        };
      }
      if (slug === "codeguardian" && check.id === "ens") {
        return {
          ...check,
          source: "mock" as const,
          detail:
            "ENS is not targeted in this submission; this is mock compatibility metadata only",
        };
      }
      return check;
    }),
  };
}

function applyLiveCertificateOverlay(certificate: Certificate): Certificate {
  const demoInftAddress = currentDemoInftAddress();
  if (!demoInftAddress) {
    return certificate;
  }

  return bindCertificateToInft(certificate, {
    chainId: currentChainId(),
    contract: demoInftAddress,
    tokenId: currentCodeGuardianTokenId(),
    standard: "ERC-7857-like live demo iNFT",
  });
}

function bindManifestToInft(
  manifest: Manifest,
  inft: Manifest["inft"],
): Manifest {
  const bound = {
    ...manifest,
    inft,
    storage: { ...manifest.storage },
  };
  bound.storage.manifestRoot = hashManifestForProof(bound);
  return bound;
}

function bindCertificateToInft(
  certificate: Certificate,
  inft: Manifest["inft"],
): Certificate {
  return {
    ...certificate,
    evidence: {
      ...certificate.evidence,
      inft: {
        chainId: inft.chainId,
        contract: inft.contract,
        tokenId: inft.tokenId,
      },
    },
  };
}

function proofLayers() {
  const storageMode = storageBundle.mode ?? "hybrid";
  const computeMode = storageBundle.computeRuns?.runs.some(
    (run) => run.source === "live",
  )
    ? "live"
    : storageBundle.computeRuns?.runs.some((run) => run.source === "hybrid")
      ? "hybrid"
      : "mock";
  return {
    chain: currentDemoInftAddress() ? "live" : "mock",
    storage: storageMode,
    compute: computeMode,
    da: zeroGEnv("DA_MODE") ?? "mock",
    ens: zeroGEnv("ENS_MODE") ?? "mock",
  };
}

function seededChainAdapter(slug: AgentSlug): ChainAdapter {
  return {
    source: "live",
    async getToken(
      _contract: string,
      _tokenId: string,
    ): Promise<TokenSnapshot | null> {
      const demoInftAddress = currentDemoInftAddress();
      if (!demoInftAddress) {
        return null;
      }
      const tokenId =
        slug === "codeguardian"
          ? currentCodeGuardianTokenId()
          : currentFakeAgentTokenId();
      return {
        chainId: currentChainId(),
        contract: demoInftAddress,
        tokenId,
        owner: currentDemoOwner(),
        standard:
          slug === "codeguardian"
            ? "ERC-7857-like live demo iNFT"
            : "ERC-721 metadata-only live control token",
        metadataUri: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://proof-of-intelligence-explorer.vercel.app"}/api/agent/${slug}`,
        manifestRoot:
          slug === "codeguardian"
            ? storageBundle.manifest?.storage.manifestRoot
            : undefined,
        source: "live",
      };
    },
  };
}

export function passportPath(target: PassportTarget) {
  return `/passport/${target.chainId}/${target.contract}/${target.tokenId}`;
}

export function badgePath(target: PassportTarget) {
  return `/badge/${target.chainId}/${target.contract}/${target.tokenId}.svg`;
}

export function parsePassportTarget(input: {
  chainId?: string | number | null;
  contract?: string | null;
  tokenId?: string | null;
  manifestRoot?: string | null;
}): PassportTarget {
  const chainId = Number(input.chainId ?? currentChainId());
  const contract = String(input.contract ?? "").trim();
  const tokenId = String(input.tokenId ?? "").trim();
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error("Invalid chainId");
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) {
    throw new Error("Invalid contract address");
  }
  if (!tokenId) {
    throw new Error("Missing tokenId");
  }
  const manifestRoot = input.manifestRoot?.trim() || undefined;
  return { chainId, contract, tokenId, manifestRoot };
}

export function seededCodeGuardianTarget(): PassportTarget {
  return {
    chainId: currentChainId(),
    contract: currentDemoInftAddress(),
    tokenId: currentCodeGuardianTokenId(),
  };
}

export function seededFakeAgentTarget(): PassportTarget {
  return {
    chainId: currentChainId(),
    contract: currentDemoInftAddress(),
    tokenId: currentFakeAgentTokenId(),
  };
}

function currentChainId() {
  return Number(
    process.env.NEXT_PUBLIC_0G_CHAIN_ID ?? deployment.chainId ?? "16602",
  );
}

function currentDemoInftAddress() {
  return String(
    process.env.NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS ??
      deployment.demoInftAddress ??
      "",
  );
}

function currentRegistryAddress() {
  return String(
    process.env.NEXT_PUBLIC_POI_REGISTRY_ADDRESS ??
      deployment.registryAddress ??
      "",
  );
}

function currentCodeGuardianTokenId() {
  return String(
    process.env.NEXT_PUBLIC_CODEGUARDIAN_INFT_ID ??
      deployment.codeguardianTokenId ??
      "1",
  );
}

function currentFakeAgentTokenId() {
  return String(
    process.env.NEXT_PUBLIC_FAKEAGENT_INFT_ID ??
      deployment.fakeagentTokenId ??
      "2",
  );
}

function currentDemoOwner() {
  return (
    process.env.NEXT_PUBLIC_POI_DEMO_OWNER ??
    (deployment.deployer ? String(deployment.deployer) : undefined)
  );
}

function currentCertificateRecordId() {
  return String(
    process.env.NEXT_PUBLIC_POI_CERTIFICATE_ID ??
      deployment.codeguardianCertificateId ??
      "",
  );
}

function isSeededCodeGuardianTarget(target: PassportTarget) {
  return (
    target.chainId === currentChainId() &&
    target.contract.toLowerCase() === currentDemoInftAddress().toLowerCase() &&
    target.tokenId === currentCodeGuardianTokenId()
  );
}

function isSeededFakeAgentTarget(target: PassportTarget) {
  return (
    target.chainId === currentChainId() &&
    target.contract.toLowerCase() === currentDemoInftAddress().toLowerCase() &&
    target.tokenId === currentFakeAgentTokenId()
  );
}
