import {
  createPublicClient,
  getContract,
  http,
  type Address,
  type PublicClient,
} from "viem";
import { defineChain } from "viem";
import codeguardianCertificate from "../fixtures/codeguardian.certificate.json";
import codeguardianComputeRuns from "../fixtures/codeguardian.compute-runs.json";
import codeguardianBundle from "../fixtures/codeguardian.intelligence.encrypted.json";
import codeguardianManifest from "../fixtures/codeguardian.manifest.json";
import codeguardianMemory from "../fixtures/codeguardian.memory.json";
import codeguardianRun from "../fixtures/codeguardian.run.json";
import fakeagentMetadata from "../fixtures/fakeagent.metadata.json";
import { hashCanonicalJson } from "./canonical";
import type {
  Certificate,
  ComputeRuns,
  IntelligenceBundle,
  Manifest,
  MemoryState,
  RunTrace,
} from "./schema";

export type EvidenceSource = "live" | "hybrid" | "mock";

export type TokenSnapshot = {
  chainId: number;
  contract: string;
  tokenId: string;
  owner?: string;
  standard?: string;
  metadataUri?: string;
  manifestRoot?: string;
  source: EvidenceSource;
};

export interface ChainAdapter {
  source: EvidenceSource;
  getToken(contract: string, tokenId: string): Promise<TokenSnapshot | null>;
}

export interface StorageAdapter {
  source: EvidenceSource;
  getManifestByAlias(alias: string): Promise<Manifest | null>;
  getManifestByRoot(root: string): Promise<Manifest | null>;
  getJsonByRoot<T>(root: string): Promise<T | null>;
  getCertificateById?(certificateId: string): Promise<Certificate | null>;
}

export interface ComputeAdapter {
  source: EvidenceSource;
  getRuns(runIds: string[]): Promise<ComputeRuns | null>;
}

export interface DAAdapter {
  source: EvidenceSource;
  exportBundle(input: { agent: string; roots: string[] }): Promise<DaBundle>;
}

export interface EnsAdapter {
  source: EvidenceSource;
  resolveName(
    name: string,
  ): Promise<{ contract: string; tokenId: string } | null>;
}

export type DaBundle = {
  schema: "poi-da-bundle/v0.1";
  agent: string;
  roots: string[];
  bundleRoot: string;
  source: EvidenceSource;
};

export type ProofArtifactName =
  | "manifest"
  | "intelligenceBundle"
  | "memory"
  | "run"
  | "computeRuns"
  | "certificate";

export type ProofObjectRecord = {
  name: ProofArtifactName;
  poiRoot: string;
  zeroGRootHash?: string;
  txHash?: string;
  txSeq?: number;
  source: EvidenceSource;
  byteLength?: number;
};

export type ProofStorageBundle = {
  mode?: EvidenceSource;
  agent?: string;
  roots?: Record<string, string>;
  objects?: ProofObjectRecord[];
  manifest?: Manifest;
  intelligenceBundle?: IntelligenceBundle;
  memory?: MemoryState;
  memories?: MemoryState[];
  run?: RunTrace;
  runs?: RunTrace[];
  computeRuns?: ComputeRuns;
  certificate?: Certificate;
  memoryEvolution?: Array<{
    runId: string;
    version: number;
    learnedPattern: string;
    memoryDelta: string;
    memoryRoot: string;
    traceRoot: string;
    source: EvidenceSource;
  }>;
  policyUpgrade?: Record<string, unknown>;
  skillHashes?: Record<string, string>;
};

const manifestFixture = codeguardianManifest as Manifest;
const bundleFixture = codeguardianBundle as IntelligenceBundle;
const memoryFixture = codeguardianMemory as MemoryState;
const runFixture = codeguardianRun as RunTrace;
const computeFixture = codeguardianComputeRuns as ComputeRuns;
const certificateFixture = codeguardianCertificate as Certificate;

export const demoContracts = {
  chainId: 16602,
  codeguardian: "0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9",
  fakeagent: "0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9",
  owner: "0x053b860f329c9e4549d23dc8aadf1116b99f1233",
} as const;

function rootMap(): Map<string, unknown> {
  return new Map<string, unknown>([
    [manifestFixture.storage.manifestRoot, manifestFixture],
    [manifestFixture.storage.intelligenceBundleRoot, bundleFixture],
    [manifestFixture.storage.memoryRoot, memoryFixture],
    [manifestFixture.storage.latestRunRoot, runFixture],
    [manifestFixture.memory.checkpointRoot, memoryFixture.checkpoint],
    [manifestFixture.memory.historyRoot, memoryFixture.history],
    [hashCanonicalJson(computeFixture), computeFixture],
    [hashCanonicalJson(certificateFixture), certificateFixture],
  ]);
}

export class MockChainAdapter implements ChainAdapter {
  readonly source: EvidenceSource = "mock";

  async getToken(
    contract: string,
    tokenId: string,
  ): Promise<TokenSnapshot | null> {
    const normalized = contract.toLowerCase();

    if (
      normalized === demoContracts.codeguardian.toLowerCase() &&
      tokenId === "1"
    ) {
      return {
        chainId: demoContracts.chainId,
        contract: demoContracts.codeguardian,
        tokenId,
        owner: demoContracts.owner,
        standard: "ERC-7857-like",
        metadataUri: "mock://codeguardian",
        manifestRoot: manifestFixture.storage.manifestRoot,
        source: this.source,
      };
    }

    if (
      normalized === demoContracts.fakeagent.toLowerCase() &&
      tokenId === "2"
    ) {
      return {
        chainId: demoContracts.chainId,
        contract: demoContracts.fakeagent,
        tokenId,
        owner: demoContracts.owner,
        standard: "ERC-721 metadata-only",
        metadataUri: (fakeagentMetadata as { image: string }).image,
        source: this.source,
      };
    }

    return null;
  }
}

export class MockStorageAdapter implements StorageAdapter {
  readonly source: EvidenceSource = "mock";

  async getManifestByAlias(alias: string): Promise<Manifest | null> {
    if (alias.toLowerCase() === "codeguardian") {
      return manifestFixture;
    }
    return null;
  }

  async getManifestByRoot(root: string): Promise<Manifest | null> {
    const value = rootMap().get(root);
    return value === manifestFixture ? manifestFixture : null;
  }

  async getJsonByRoot<T>(root: string): Promise<T | null> {
    return (rootMap().get(root) as T | undefined) ?? null;
  }

  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    if (certificateFixture.certificateId === certificateId) {
      return certificateFixture;
    }
    return null;
  }
}

export class ArtifactStorageAdapter implements StorageAdapter {
  readonly source: EvidenceSource;
  private readonly byRoot = new Map<string, unknown>();
  private readonly certificateById = new Map<string, Certificate>();
  private readonly alias: string;

  constructor(bundle: ProofStorageBundle, options: { alias?: string } = {}) {
    this.source = bundle.mode ?? sourceFromObjects(bundle.objects);
    this.alias = (
      options.alias ??
      bundle.agent ??
      "codeguardian"
    ).toLowerCase();

    if (bundle.manifest) {
      this.byRoot.set(bundle.manifest.storage.manifestRoot, bundle.manifest);
    }
    if (bundle.intelligenceBundle && bundle.roots?.intelligenceBundleRoot) {
      this.byRoot.set(
        bundle.roots.intelligenceBundleRoot,
        bundle.intelligenceBundle,
      );
    }
    if (bundle.memory && bundle.roots?.memoryRoot) {
      this.byRoot.set(bundle.roots.memoryRoot, bundle.memory);
    }
    for (const memory of bundle.memories ?? []) {
      this.byRoot.set(hashCanonicalJson(memory), memory);
    }
    if (bundle.run && bundle.roots?.latestRunRoot) {
      this.byRoot.set(bundle.roots.latestRunRoot, bundle.run);
    }
    for (const run of bundle.runs ?? []) {
      this.byRoot.set(hashCanonicalJson(run), run);
    }
    if (bundle.computeRuns) {
      this.byRoot.set(
        hashCanonicalJson(bundle.computeRuns),
        bundle.computeRuns,
      );
    }
    if (bundle.certificate) {
      this.byRoot.set(
        hashCanonicalJson(bundle.certificate),
        bundle.certificate,
      );
      this.certificateById.set(
        bundle.certificate.certificateId,
        bundle.certificate,
      );
    }
  }

  async getManifestByAlias(alias: string): Promise<Manifest | null> {
    if (alias.toLowerCase() !== this.alias) {
      return null;
    }
    const manifest = [...this.byRoot.values()].find(isManifest);
    return manifest ?? null;
  }

  async getManifestByRoot(root: string): Promise<Manifest | null> {
    const value = this.byRoot.get(root);
    return isManifest(value) ? value : null;
  }

  async getJsonByRoot<T>(root: string): Promise<T | null> {
    return (this.byRoot.get(root) as T | undefined) ?? null;
  }

  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    return this.certificateById.get(certificateId) ?? null;
  }
}

export class ArtifactComputeAdapter implements ComputeAdapter {
  readonly source: EvidenceSource;
  private readonly computeRuns?: ComputeRuns;

  constructor(bundle: ProofStorageBundle) {
    this.source = computeSource(bundle.computeRuns, bundle.mode);
    this.computeRuns = bundle.computeRuns;
  }

  async getRuns(runIds: string[]): Promise<ComputeRuns | null> {
    if (!this.computeRuns) {
      return null;
    }
    const matches = this.computeRuns.runs.filter((run) =>
      runIds.includes(run.id),
    );
    if (matches.length === 0) {
      return null;
    }
    return { ...this.computeRuns, runs: matches };
  }
}

export class MockComputeAdapter implements ComputeAdapter {
  readonly source: EvidenceSource = "mock";

  async getRuns(runIds: string[]): Promise<ComputeRuns | null> {
    const matches = computeFixture.runs.filter((run) =>
      runIds.includes(run.id),
    );
    if (matches.length === 0) {
      return null;
    }
    return { ...computeFixture, runs: matches };
  }
}

export class MockDAAdapter implements DAAdapter {
  readonly source: EvidenceSource = "mock";

  async exportBundle(input: {
    agent: string;
    roots: string[];
  }): Promise<DaBundle> {
    return {
      schema: "poi-da-bundle/v0.1",
      agent: input.agent,
      roots: input.roots,
      bundleRoot: hashCanonicalJson({ agent: input.agent, roots: input.roots }),
      source: this.source,
    };
  }
}

export class MockEnsAdapter implements EnsAdapter {
  readonly source: EvidenceSource = "mock";

  async resolveName(
    name: string,
  ): Promise<{ contract: string; tokenId: string } | null> {
    if (name === "codeguardian.poi-demo.eth") {
      return { contract: demoContracts.codeguardian, tokenId: "1" };
    }
    return null;
  }
}

const galileo = defineChain({
  id: 16602,
  name: "0G Galileo",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
});

const erc721ReadAbi = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "owner", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "uri", type: "string" }],
  },
] as const;

export class ZeroGChainAdapter implements ChainAdapter {
  readonly source = "live" as const;
  private readonly client: PublicClient;
  private readonly chainId: number;

  constructor(options: { rpcUrl?: string; chainId?: number } = {}) {
    this.chainId = options.chainId ?? 16602;
    this.client = createPublicClient({
      chain: { ...galileo, id: this.chainId },
      transport: http(options.rpcUrl ?? "https://evmrpc-testnet.0g.ai"),
    });
  }

  async getToken(
    contract: string,
    tokenId: string,
  ): Promise<TokenSnapshot | null> {
    const chainId = await this.client.getChainId();
    if (chainId !== this.chainId) {
      throw new Error(
        `0G chain preflight failed: expected ${this.chainId}, got ${chainId}`,
      );
    }

    const tokenContract = getContract({
      address: contract as Address,
      abi: erc721ReadAbi,
      client: this.client,
    });

    try {
      const [owner, metadataUri] = await Promise.all([
        tokenContract.read.ownerOf([BigInt(tokenId)]),
        tokenContract.read.tokenURI([BigInt(tokenId)]).catch(() => undefined),
      ]);

      return {
        chainId,
        contract,
        tokenId,
        owner,
        standard: "ERC-721/ERC-7857-like",
        metadataUri,
        source: this.source,
      };
    } catch {
      return null;
    }
  }
}

export class ZeroGStorageAdapter extends MockStorageAdapter {
  override readonly source = "hybrid" as const;
}

export class ZeroGComputeAdapter extends MockComputeAdapter {
  override readonly source = "hybrid" as const;
}

export class ZeroGDAAdapter extends MockDAAdapter {
  override readonly source = "hybrid" as const;
}

function sourceFromObjects(
  objects: ProofObjectRecord[] | undefined,
): EvidenceSource {
  if (!objects?.length) {
    return "hybrid";
  }
  if (objects.every((object) => object.source === "live")) {
    return "live";
  }
  if (
    objects.some(
      (object) => object.source === "live" || object.source === "hybrid",
    )
  ) {
    return "hybrid";
  }
  return "mock";
}

function computeSource(
  computeRuns: ComputeRuns | undefined,
  fallback: EvidenceSource | undefined,
): EvidenceSource {
  const sources = computeRuns?.runs.map((run) => run.source) ?? [];
  if (!sources.length) return fallback ?? "hybrid";
  if (sources.every((source) => source === "live")) return "live";
  if (sources.some((source) => source === "live" || source === "hybrid")) {
    return "hybrid";
  }
  return "mock";
}

function isManifest(value: unknown): value is Manifest {
  return Boolean(
    value &&
    typeof value === "object" &&
    "schema" in value &&
    (value as { schema?: string }).schema === "poi/v0.1",
  );
}
