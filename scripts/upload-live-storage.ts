import {
  codeguardianCertificate,
  codeguardianComputeRuns,
  codeguardianBundle,
  codeguardianManifest,
  codeguardianMemory,
  codeguardianRun,
  createVerifier,
  hashManifestForProof,
  hashCanonicalJson,
  type Certificate,
  type ComputeRuns,
  type IntelligenceBundle,
  type Manifest,
  type MemoryState,
  type ProofObjectRecord,
  type ProofStorageBundle,
  type RunTrace,
} from "@poi/sdk";
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { JsonRpcProvider, Wallet } from "ethers";
import {
  loadLocalEnv,
  liveConfig,
  liveWritesAvailable,
  preflightLiveWrite,
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
const previousStorageBundle = readJson<ProofStorageBundle>(
  "deployments/0g-storage-bundle.json",
);
const runArtifact = readJson<
  ProofStorageBundle & {
    mode?: "live" | "hybrid" | "mock";
    run?: RunTrace;
    memory?: MemoryState;
    computeRuns?: ComputeRuns;
    certificate?: Certificate;
    liveComputeError?: string;
  }
>("deployments/codeguardian-run.json");

const intelligenceBundle = codeguardianBundle as IntelligenceBundle;
const memory = runArtifact?.memory ?? (codeguardianMemory as MemoryState);
const run = runArtifact?.run ?? (codeguardianRun as RunTrace);
const computeRuns =
  runArtifact?.computeRuns ?? (codeguardianComputeRuns as ComputeRuns);
const runRoot = hashCanonicalJson(run);
const memoryRoot = hashCanonicalJson(memory);

const manifest =
  deployment?.demoInftAddress && deployment.codeguardianTokenId
    ? bindManifestToInft(
        {
          ...(codeguardianManifest as Manifest),
          storage: {
            ...(codeguardianManifest as Manifest).storage,
            intelligenceBundleRoot: hashCanonicalJson(intelligenceBundle),
            memoryRoot,
            latestRunRoot: runRoot,
          },
          compute: {
            ...(codeguardianManifest as Manifest).compute,
            provider: computeRuns.provider,
            models: [computeRuns.model],
            latestRunIds: computeRuns.runs.map((item) => item.id),
          },
        },
        {
          chainId: config.expectedChainId,
          contract: deployment.demoInftAddress,
          tokenId: deployment.codeguardianTokenId,
          standard: "ERC-7857-like live demo iNFT",
        },
      )
    : codeguardianManifest;
const certificate = bindCertificateToInft(
  runArtifact?.certificate ?? codeguardianCertificate,
  manifest.inft,
  manifest,
  computeRuns,
);
const proofObjects = createProofObjects(
  { manifest, intelligenceBundle, memory, run, computeRuns, certificate },
  "hybrid",
);
const uploadResult = await maybeUploadProofObjects(proofObjects);
const objects = uploadResult.objects;
const mode = objects.every((object) => object.source === "live")
  ? "live"
  : objects.some((object) => object.source === "live")
    ? "hybrid"
    : "hybrid";

writeSafeJson("deployments/0g-storage-bundle.json", {
  mode,
  chainId: config.expectedChainId,
  agent: "CodeGuardian",
  roots: {
    ...report.evidence,
    manifestRoot: manifest.storage.manifestRoot,
    intelligenceBundleRoot: manifest.storage.intelligenceBundleRoot,
    memoryRoot: manifest.storage.memoryRoot,
    latestRunRoot: manifest.storage.latestRunRoot,
  },
  objects,
  manifest,
  intelligenceBundle,
  memory,
  memories: runArtifact?.memories ?? [memory],
  run,
  runs: runArtifact?.runs ?? [run],
  computeRuns,
  certificate,
  memoryEvolution: runArtifact?.memoryEvolution ?? [],
  policyUpgrade: runArtifact?.policyUpgrade,
  skillHashes: runArtifact?.skillHashes ?? {},
  storageIndexerConfigured: Boolean(zeroGEnv("STORAGE_INDEXER_RPC")),
  storageUploadAttempted:
    uploadResult.attempted ||
    Boolean(
      (previousStorageBundle as { storageUploadAttempted?: boolean } | null)
        ?.storageUploadAttempted,
    ) ||
    objects.some((object) => Boolean(object.txHash)),
  storageUploadError: uploadResult.error,
  liveComputeSource: runArtifact?.mode ?? "fixture",
  liveComputeError: runArtifact?.liveComputeError,
  message:
    mode === "live"
      ? "Proof artifacts were uploaded through the 0G Storage SDK. The public bundle keeps non-secret copies for fast hosted verification."
      : "Hybrid artifact prepared for 0G Storage upload. Public copies remain deterministic when live storage is unavailable.",
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
  manifest: Manifest,
  computeRuns: ComputeRuns,
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
      intelligenceBundleRoot: manifest.storage.intelligenceBundleRoot,
      memoryRoot: manifest.storage.memoryRoot,
      latestRunRoot: manifest.storage.latestRunRoot,
      computeRunIds: computeRuns.runs.map((item) => item.id),
    },
  };
}

function createProofObjects(
  values: {
    manifest: Manifest;
    intelligenceBundle: IntelligenceBundle;
    memory: MemoryState;
    run: RunTrace;
    computeRuns: ComputeRuns;
    certificate: Certificate;
  },
  source: "hybrid" | "live",
) {
  return [
    {
      name: "manifest",
      poiRoot: values.manifest.storage.manifestRoot,
      value: values.manifest,
      source,
    },
    {
      name: "intelligenceBundle",
      poiRoot: values.manifest.storage.intelligenceBundleRoot,
      value: values.intelligenceBundle,
      source,
    },
    {
      name: "memory",
      poiRoot: values.manifest.storage.memoryRoot,
      value: values.memory,
      source,
    },
    {
      name: "run",
      poiRoot: values.manifest.storage.latestRunRoot,
      value: values.run,
      source,
    },
    {
      name: "computeRuns",
      poiRoot: hashCanonicalJson(values.computeRuns),
      value: values.computeRuns,
      source,
    },
    {
      name: "certificate",
      poiRoot: hashCanonicalJson(values.certificate),
      value: values.certificate,
      source,
    },
  ] as Array<ProofObjectRecord & { value: unknown }>;
}

async function maybeUploadProofObjects(
  objects: Array<ProofObjectRecord & { value: unknown }>,
) {
  const indexerRpc = zeroGEnv("STORAGE_INDEXER_RPC");
  if (!indexerRpc || !liveWritesAvailable(config)) {
    return {
      attempted: false,
      objects: objects.map((object) => mergeExistingUploadMetadata(object)),
    };
  }

  if (objects.length > config.maxTxPerOperation) {
    return {
      attempted: false,
      error: `Refusing to upload ${objects.length} proof objects with POI_MAX_TX_PER_OPERATION=${config.maxTxPerOperation}`,
      objects: objects.map((object) => mergeExistingUploadMetadata(object)),
    };
  }

  await preflightLiveWrite(config);
  const indexer = new Indexer(indexerRpc);
  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.privateKey!, provider);
  const uploaded: ProofObjectRecord[] = [];

  try {
    for (const object of objects) {
      const bytes = new TextEncoder().encode(
        JSON.stringify(object.value, null, 2),
      );
      const [result, error] = await indexer.upload(
        new MemData(bytes),
        config.rpcUrl,
        wallet,
        {
          expectedReplica: 1,
          finalityRequired: true,
        },
      );
      if (error) {
        throw error;
      }
      const upload = Array.isArray(
        (result as { rootHashes?: string[] }).rootHashes,
      )
        ? {
            zeroGRootHash: (
              result as {
                rootHashes: string[];
                txHashes: string[];
                txSeqs: number[];
              }
            ).rootHashes[0],
            txHash: (
              result as {
                rootHashes: string[];
                txHashes: string[];
                txSeqs: number[];
              }
            ).txHashes[0],
            txSeq: (
              result as {
                rootHashes: string[];
                txHashes: string[];
                txSeqs: number[];
              }
            ).txSeqs[0],
          }
        : {
            zeroGRootHash: (
              result as { rootHash: string; txHash: string; txSeq: number }
            ).rootHash,
            txHash: (
              result as { rootHash: string; txHash: string; txSeq: number }
            ).txHash,
            txSeq: (
              result as { rootHash: string; txHash: string; txSeq: number }
            ).txSeq,
          };
      const { value: _value, ...record } = object;
      uploaded.push({
        ...record,
        ...upload,
        source: "live",
        byteLength: bytes.byteLength,
      });
    }
    return { attempted: true, objects: uploaded };
  } catch (error) {
    return {
      attempted: true,
      error: sanitizeError(error),
      objects: objects.map((object) => mergeExistingUploadMetadata(object)),
    };
  }
}

function mergeExistingUploadMetadata(
  object: ProofObjectRecord & { value: unknown },
): ProofObjectRecord {
  const { value, ...record } = object;
  const existing = previousStorageBundle?.objects?.find(
    (candidate) =>
      candidate.name === record.name &&
      candidate.poiRoot === record.poiRoot &&
      candidate.source === "live",
  );
  return {
    ...record,
    ...existing,
    byteLength: byteLength(value),
  };
}

function byteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value, null, 2)).byteLength;
}

function sanitizeError(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/0x[a-fA-F0-9]{64}/g, "<redacted-hex>")
    : "unknown storage error";
}
