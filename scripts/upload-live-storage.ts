import {
  codeguardianCertificate,
  codeguardianManifest,
  codeguardianRun,
  createVerifier,
  hashManifestForProof,
  type Certificate,
  type Manifest,
} from "@poi/sdk";
import {
  loadLocalEnv,
  liveConfig,
  printSanitizedPlan,
  readJson,
  writeSafeJson,
  zeroGEnv,
} from "./live-helpers";

loadLocalEnv();
const operation = "upload-storage-bundle";
const config = liveConfig();
printSanitizedPlan(operation, config);

const report = await createVerifier().verify("codeguardian");
const deployment = readJson<Record<string, string>>(
  "deployments/0g-galileo.json",
);
const manifest =
  deployment?.demoInftAddress && deployment.codeguardianTokenId
    ? bindManifestToInft(codeguardianManifest, {
        chainId: config.expectedChainId,
        contract: deployment.demoInftAddress,
        tokenId: deployment.codeguardianTokenId,
        standard: "ERC-7857-like live demo iNFT",
      })
    : codeguardianManifest;
const certificate = bindCertificateToInft(
  codeguardianCertificate,
  manifest.inft,
);

writeSafeJson("deployments/0g-storage-bundle.json", {
  mode: zeroGEnv("STORAGE_MODE") ?? "hybrid",
  chainId: config.expectedChainId,
  agent: "CodeGuardian",
  roots: { ...report.evidence, manifestRoot: manifest.storage.manifestRoot },
  manifest,
  run: codeguardianRun,
  certificate,
  storageIndexerConfigured: Boolean(zeroGEnv("STORAGE_INDEXER_RPC")),
  message:
    "Hybrid artifact prepared for 0G Storage upload. Mock roots remain deterministic when live storage is unavailable.",
});

function bindManifestToInft(
  manifest: Manifest,
  inft: Manifest["inft"],
): Manifest {
  const bound = { ...manifest, inft, storage: { ...manifest.storage } };
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
