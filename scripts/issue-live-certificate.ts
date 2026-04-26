import {
  codeguardianCertificate,
  createVerifier,
  hashCanonicalJson,
  hashManifestForProof,
  type Certificate,
  type Manifest,
} from "@poi/sdk";
import { decodeEventLog, type Abi, type Address, type Log } from "viem";
import {
  loadLocalEnv,
  liveClients,
  liveConfig,
  liveWritesAvailable,
  preflightLiveWrite,
  printSanitizedPlan,
  publicAppUrl,
  readArtifact,
  readJson,
  rootToBytes32,
  writeSafeJson,
} from "./live-helpers";

type Deployment = {
  demoInftAddress?: Address;
  registryAddress?: Address;
  codeguardianTokenId?: string;
  codeguardianCertificateId?: string;
  txHashes?: string[];
};

loadLocalEnv();
const operation = "issue-certificate";
const config = liveConfig();
printSanitizedPlan(operation, config);

const report = await createVerifier().verify("codeguardian");
const deployment = readJson<Deployment>("deployments/0g-galileo.json");
let preflight: Awaited<ReturnType<typeof preflightLiveWrite>> | undefined;
let certificateId = deployment?.codeguardianCertificateId;
const txHashes = [...(deployment?.txHashes ?? [])];
const liveManifest =
  report.manifest &&
  deployment?.demoInftAddress &&
  deployment.codeguardianTokenId
    ? bindManifestToInft(report.manifest, {
        chainId: config.expectedChainId,
        contract: deployment.demoInftAddress,
        tokenId: deployment.codeguardianTokenId,
        standard: "ERC-7857-like live demo iNFT",
      })
    : report.manifest;
const certificate = liveManifest
  ? bindCertificateToInft(codeguardianCertificate, liveManifest.inft)
  : codeguardianCertificate;

if (liveWritesAvailable(config)) {
  preflight = await preflightLiveWrite(config);
}

if (
  preflight &&
  deployment?.registryAddress &&
  deployment.demoInftAddress &&
  deployment.codeguardianTokenId &&
  !certificateId
) {
  const registry = readArtifact(
    "artifacts/contracts/ProofOfIntelligenceRegistry.sol/ProofOfIntelligenceRegistry.json",
  );
  const { publicClient, walletClient } = liveClients(config);
  const hash = await walletClient.writeContract({
    address: deployment.registryAddress,
    abi: registry.abi,
    functionName: "issueCertificate",
    args: [
      deployment.demoInftAddress,
      BigInt(deployment.codeguardianTokenId),
      rootToBytes32(hashCanonicalJson(certificate)),
      `${publicAppUrl()}/certificate/${codeguardianCertificate.certificateId}`,
    ],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  txHashes.push(hash);
  certificateId = readCertificateId(receipt.logs, registry.abi);
  writeSafeJson("deployments/0g-galileo.json", {
    ...deployment,
    codeguardianCertificateId: certificateId,
    txHashes,
    updatedAt: new Date().toISOString(),
  });
}

writeSafeJson("deployments/codeguardian-certificate.json", {
  mode: preflight ? "live" : "hybrid",
  chainId: config.expectedChainId,
  issuer: preflight?.address ?? "mock-registry",
  registryAddress: deployment?.registryAddress ?? "",
  demoInftAddress: deployment?.demoInftAddress ?? "",
  tokenId: deployment?.codeguardianTokenId ?? "",
  onChainCertificateId: certificateId ?? "",
  certificate,
  evidence: liveManifest
    ? { ...report.evidence, manifestRoot: liveManifest.storage.manifestRoot }
    : report.evidence,
  message: preflight
    ? "Certificate artifact exported and registry certificate write is live or already recorded."
    : "Certificate artifact exported in deterministic hybrid mode.",
});

function readCertificateId(logs: readonly Log[], abi: Abi) {
  for (const log of logs) {
    try {
      const event = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
        eventName: "CertificateIssued",
      });
      return (
        event.args as unknown as { certificateId: bigint }
      ).certificateId.toString();
    } catch {
      continue;
    }
  }
  throw new Error("CertificateIssued event not found");
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

function bindManifestToInft(
  manifest: Manifest,
  inft: Manifest["inft"],
): Manifest {
  const bound = { ...manifest, inft, storage: { ...manifest.storage } };
  bound.storage.manifestRoot = hashManifestForProof(bound);
  return bound;
}
