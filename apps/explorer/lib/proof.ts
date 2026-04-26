import {
  codeguardianCertificate,
  codeguardianManifest,
  codeguardianRun,
  createVerifier,
  exportDaBundle,
  fakeagentMetadata,
  hashCanonicalJson,
  type Certificate,
  type RunTrace,
  type VerificationReport
} from "@poi/sdk";

export type AgentSlug = "codeguardian" | "fakeagent";

export type AgentProfile = {
  slug: AgentSlug;
  name: string;
  description: string;
  headline: string;
  report: VerificationReport;
  manifest?: typeof codeguardianManifest;
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
    app: process.env.NEXT_PUBLIC_APP_NAME ?? "Proof-of-Intelligence Explorer",
    mode: modeLabel().toLowerCase(),
    liveWritesEnabled: liveWritesEnabled(),
    chainId: process.env.NEXT_PUBLIC_0G_CHAIN_ID ?? "16602",
    registryAddress: process.env.NEXT_PUBLIC_POI_REGISTRY_ADDRESS ?? "",
    demoInftAddress: process.env.NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS ?? "",
    certificateId: process.env.NEXT_PUBLIC_POI_CERTIFICATE_ID ?? "",
    codeguardianTokenId: process.env.NEXT_PUBLIC_CODEGUARDIAN_INFT_ID ?? "",
    fakeagentTokenId: process.env.NEXT_PUBLIC_FAKEAGENT_INFT_ID ?? "",
    seededAgents: ["codeguardian", "fakeagent"]
  };
}

export function liveWritesEnabled() {
  return process.env.POI_ENABLE_LIVE_WRITES === "true" && Boolean(process.env.POI_ADMIN_TOKEN);
}

export async function verifyAgent(slug: string) {
  if (slug !== "codeguardian" && slug !== "fakeagent") {
    throw new Error(`Unsupported demo agent: ${slug}`);
  }
  const report = await createVerifier().verify(slug);
  return applyLiveOverlay(slug, report);
}

export async function getAgentProfile(slug: string): Promise<AgentProfile> {
  const report = await verifyAgent(slug);
  if (slug === "codeguardian") {
    return {
      slug,
      name: "CodeGuardian",
      headline: "Certified iNFT-style code review agent",
      description: "Encrypted intelligence, persistent memory, hybrid 0G Compute run history, replay trace, and certificate evidence.",
      report,
      manifest: codeguardianManifest
    };
  }

  return {
    slug: "fakeagent",
    name: "FakeAgent",
    headline: "Metadata-only agent claim",
    description: "A control token that looks like an agent profile but lacks a Proof-of-Intelligence manifest and evidence roots.",
    report,
    fakeMetadata: fakeagentMetadata
  };
}

export function getRun(runId: string): RunTrace {
  const run = codeguardianRun as RunTrace;
  if (run.runId !== runId) {
    throw new Error(`Run not found: ${runId}`);
  }
  return run;
}

export function getCertificate(certificateId: string): Certificate {
  const certificate = codeguardianCertificate as Certificate;
  if (certificate.certificateId !== certificateId) {
    throw new Error(`Certificate not found: ${certificateId}`);
  }
  return certificate;
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
      : "Live write actions are disabled. Public verification remains available."
  };
}

function zeroGEnv(suffix: string): string | undefined {
  return process.env[`0G_${suffix}`] ?? process.env[`ZERO_G_${suffix}`];
}

function applyLiveOverlay(slug: "codeguardian" | "fakeagent", report: VerificationReport): VerificationReport {
  const registryAddress = process.env.NEXT_PUBLIC_POI_REGISTRY_ADDRESS ?? "";
  const demoInftAddress = process.env.NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS ?? "";
  if (!registryAddress || !demoInftAddress) {
    return report;
  }

  const tokenId =
    slug === "codeguardian"
      ? process.env.NEXT_PUBLIC_CODEGUARDIAN_INFT_ID ?? "1"
      : process.env.NEXT_PUBLIC_FAKEAGENT_INFT_ID ?? "2";
  const owner = process.env.NEXT_PUBLIC_POI_DEMO_OWNER ?? report.token?.owner;
  const certificateId = process.env.NEXT_PUBLIC_POI_CERTIFICATE_ID ?? "";
  const passportId = process.env.NEXT_PUBLIC_POI_PASSPORT_ID ?? "";
  const sourceSet = new Set<VerificationReport["sources"][number]>(slug === "codeguardian" ? ["live", "hybrid"] : ["live", "mock"]);

  const token = {
    ...report.token,
    chainId: Number(process.env.NEXT_PUBLIC_0G_CHAIN_ID ?? "16602"),
    contract: demoInftAddress,
    tokenId,
    owner,
    metadataUri: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://proof-of-intelligence-explorer.vercel.app"}/api/agent/${slug}`,
    standard: slug === "codeguardian" ? "ERC-7857-like live demo iNFT" : "ERC-721 metadata-only live control token",
    manifestRoot: slug === "codeguardian" ? report.evidence.manifestRoot : undefined,
    source: "live" as const
  };

  return {
    ...report,
    sources: Array.from(sourceSet),
    token,
    evidence: {
      ...report.evidence,
      liveRegistryAddress: registryAddress,
      liveDemoInftAddress: demoInftAddress,
      ...(passportId ? { livePassportId: passportId } : {}),
      ...(certificateId ? { liveCertificateId: certificateId } : {})
    },
    checks: report.checks.map((check) => {
      if (check.id === "token") {
        return {
          ...check,
          ok: true,
          source: "live" as const,
          detail: "Live 0G Galileo demo token is seeded and publicly referenced"
        };
      }
      if (slug === "codeguardian" && (check.id === "manifest" || check.id === "certificate")) {
        return {
          ...check,
          source: "live" as const,
          detail:
            check.id === "manifest"
              ? "Manifest root is registered in the live Proof-of-Intelligence registry"
              : "Certificate id is issued in the live Proof-of-Intelligence registry"
        };
      }
      if (slug === "codeguardian" && ["intelligence_bundle", "memory", "compute_history", "run_trace"].includes(check.id)) {
        return { ...check, source: "hybrid" as const };
      }
      if (slug === "codeguardian" && check.id === "ens") {
        return { ...check, source: "hybrid" as const };
      }
      return check;
    })
  };
}
