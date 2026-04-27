import {
  codeguardianCertificate,
  createVerifier,
  hashCanonicalJson,
  hashManifestForProof,
  type Certificate,
  type Manifest,
  type ProofStorageBundle,
} from "@poi/sdk";
import {
  decodeEventLog,
  type Abi,
  type Address,
  type Hex,
  type Log,
} from "viem";
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
  mode?: string;
  chainId?: number;
  demoInftAddress?: Address;
  registryAddress?: Address;
  codeguardianTokenId?: string;
  fakeagentTokenId?: string;
  codeguardianPassportId?: Hex;
  codeguardianCertificateId?: string;
  txHashes?: string[];
};

type PassportRecord = {
  manifestRoot: Hex;
  intelligenceBundleRoot: Hex;
  memoryRoot: Hex;
  latestRunRoot: Hex;
};

loadLocalEnv();
const operation = "seed-live-demo";
const config = liveConfig();
printSanitizedPlan(operation, config);

const [codeguardian, fakeagent] = await Promise.all([
  createVerifier().verify("codeguardian"),
  createVerifier().verify("fakeagent"),
]);
const deployment = readJson<Deployment>("deployments/0g-galileo.json");
const storageBundle = readJson<ProofStorageBundle>(
  "deployments/0g-storage-bundle.json",
);
const evidenceRoots = {
  ...codeguardian.evidence,
  ...(storageBundle?.roots ?? {}),
};
let preflight: Awaited<ReturnType<typeof preflightLiveWrite>> | undefined;

if (liveWritesAvailable(config)) {
  preflight = await preflightLiveWrite(config);
}

if (
  preflight &&
  (!deployment?.demoInftAddress || !deployment.registryAddress)
) {
  throw new Error(
    "Missing live contract addresses. Run pnpm contracts:deploy:live first.",
  );
}

const demo = readArtifact("artifacts/contracts/DemoINFT.sol/DemoINFT.json");
const registry = readArtifact(
  "artifacts/contracts/ProofOfIntelligenceRegistry.sol/ProofOfIntelligenceRegistry.json",
);
const txHashes = [...(deployment?.txHashes ?? [])];
let codeguardianTokenId = deployment?.codeguardianTokenId;
let fakeagentTokenId = deployment?.fakeagentTokenId;
let passportId = deployment?.codeguardianPassportId;
let certificateId = deployment?.codeguardianCertificateId;
let liveManifest: Manifest | undefined;
let liveCertificate: Certificate | undefined;

if (preflight && deployment?.demoInftAddress && deployment.registryAddress) {
  const { publicClient, walletClient, account } = liveClients(config);
  let txCount = 0;
  const spendTx = () => {
    txCount += 1;
    if (txCount > config.maxTxPerOperation) {
      throw new Error(
        `Refusing to exceed POI_MAX_TX_PER_OPERATION=${config.maxTxPerOperation}`,
      );
    }
  };

  if (!codeguardianTokenId) {
    spendTx();
    const hash = await walletClient.writeContract({
      address: deployment.demoInftAddress,
      abi: demo.abi,
      functionName: "mintDemo",
      args: [
        account.address,
        `${publicAppUrl()}/api/agent/codeguardian`,
        rootToBytes32(requiredRoot("manifestRoot")),
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    txHashes.push(hash);
    codeguardianTokenId = readDemoMintedTokenId(receipt.logs, demo.abi);
  }

  if (!fakeagentTokenId) {
    spendTx();
    const hash = await walletClient.writeContract({
      address: deployment.demoInftAddress,
      abi: demo.abi,
      functionName: "mintDemo",
      args: [
        account.address,
        `${publicAppUrl()}/api/agent/fakeagent`,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    txHashes.push(hash);
    fakeagentTokenId = readDemoMintedTokenId(receipt.logs, demo.abi);
  }

  liveManifest =
    (storageBundle?.manifest ?? codeguardian.manifest) && codeguardianTokenId
      ? bindManifestToLiveInft(
          (storageBundle?.manifest ?? codeguardian.manifest)!,
          config.expectedChainId,
          deployment.demoInftAddress,
          codeguardianTokenId,
        )
      : undefined;
  liveCertificate = liveManifest
    ? bindCertificateToInft(
        storageBundle?.certificate ?? codeguardianCertificate,
        liveManifest.inft,
      )
    : undefined;

  if (liveManifest && codeguardianTokenId) {
    const expectedManifestRoot = rootToBytes32(
      liveManifest.storage.manifestRoot,
    );
    const currentManifestRoot = (await publicClient.readContract({
      address: deployment.demoInftAddress,
      abi: demo.abi,
      functionName: "manifestRootOf",
      args: [BigInt(codeguardianTokenId)],
    })) as Hex;

    if (
      currentManifestRoot.toLowerCase() !== expectedManifestRoot.toLowerCase()
    ) {
      spendTx();
      const hash = await walletClient.writeContract({
        address: deployment.demoInftAddress,
        abi: demo.abi,
        functionName: "setManifestRoot",
        args: [BigInt(codeguardianTokenId), expectedManifestRoot],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    }
  }

  if (codeguardianTokenId) {
    passportId = (await publicClient.readContract({
      address: deployment.registryAddress,
      abi: registry.abi,
      functionName: "passportId",
      args: [deployment.demoInftAddress, BigInt(codeguardianTokenId)],
    })) as Hex;

    const passport = await publicClient
      .readContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "getPassport",
        args: [deployment.demoInftAddress, BigInt(codeguardianTokenId)],
      })
      .then(readPassportRecord)
      .catch(() => null);

    if (!passport) {
      spendTx();
      const hash = await walletClient.writeContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "registerPassport",
        args: [
          deployment.demoInftAddress,
          BigInt(codeguardianTokenId),
          BigInt(config.expectedChainId),
          rootToBytes32(
            liveManifest?.storage.manifestRoot ?? requiredRoot("manifestRoot"),
          ),
          rootToBytes32(requiredRoot("intelligenceBundleRoot")),
          rootToBytes32(requiredRoot("memoryRoot")),
          rootToBytes32(requiredRoot("latestRunRoot")),
          `${publicAppUrl()}/api/agent/codeguardian`,
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    } else if (liveManifest && rootsNeedUpdate(passport, liveManifest)) {
      spendTx();
      const hash = await walletClient.writeContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "updateRoots",
        args: [
          deployment.demoInftAddress,
          BigInt(codeguardianTokenId),
          rootToBytes32(liveManifest.storage.manifestRoot),
          rootToBytes32(requiredRoot("intelligenceBundleRoot")),
          rootToBytes32(requiredRoot("memoryRoot")),
          rootToBytes32(requiredRoot("latestRunRoot")),
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    }
  }

  if (codeguardianTokenId && liveCertificate) {
    const proofRoot = rootToBytes32(hashCanonicalJson(liveCertificate));
    const currentCertificate = certificateId
      ? await publicClient
          .readContract({
            address: deployment.registryAddress,
            abi: registry.abi,
            functionName: "getCertificate",
            args: [BigInt(certificateId)],
          })
          .then(readCertificateProofRoot)
          .catch(() => null)
      : null;
    const needsCertificate =
      !currentCertificate ||
      currentCertificate.toLowerCase() !== proofRoot.toLowerCase();

    if (!needsCertificate) {
      // Keep the current certificate id.
    } else {
      spendTx();
      const hash = await walletClient.writeContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "issueCertificate",
        args: [
          deployment.demoInftAddress,
          BigInt(codeguardianTokenId),
          proofRoot,
          `${publicAppUrl()}/certificate/${codeguardianCertificate.certificateId}`,
        ],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
      certificateId = readCertificateId(receipt.logs, registry.abi);
    }
  }

  writeSafeJson("deployments/0g-galileo.json", {
    ...deployment,
    mode: "live",
    chainId: config.expectedChainId,
    liveWrites: true,
    deployer: preflight.address,
    codeguardianTokenId,
    fakeagentTokenId,
    codeguardianPassportId: passportId,
    codeguardianCertificateId: certificateId,
    txHashes,
    updatedAt: new Date().toISOString(),
  });
}

writeSafeJson("deployments/demo-seed.json", {
  mode: preflight ? "live" : "hybrid",
  chainId: config.expectedChainId,
  operator: preflight?.address ?? "mock-operator",
  contracts: {
    registryAddress:
      process.env.POI_REGISTRY_ADDRESS ?? deployment?.registryAddress ?? "",
    demoInftAddress:
      process.env.POI_DEMO_INFT_ADDRESS ?? deployment?.demoInftAddress ?? "",
  },
  tokenIds: {
    codeguardian: codeguardianTokenId ?? "",
    fakeagent: fakeagentTokenId ?? "",
  },
  passportId: passportId ?? "",
  certificateId: certificateId ?? "",
  agents: {
    codeguardian: {
      tier: codeguardian.tier,
      status: codeguardian.status,
      roots: liveManifest
        ? {
            ...evidenceRoots,
            manifestRoot: liveManifest.storage.manifestRoot,
          }
        : evidenceRoots,
    },
    fakeagent: {
      tier: fakeagent.tier,
      status: fakeagent.status,
      missing: fakeagent.missing,
    },
  },
  message: "Seed artifact is public and contains no private keys or tokens.",
});

function requiredRoot(key: keyof typeof codeguardian.evidence) {
  const root = evidenceRoots[key];
  if (!root) {
    throw new Error(`Missing CodeGuardian evidence root: ${key}`);
  }
  return root;
}

function bindManifestToLiveInft(
  manifest: Manifest,
  chainId: number,
  contract: Address,
  tokenId: string,
): Manifest {
  const bound = {
    ...manifest,
    inft: {
      chainId,
      contract,
      tokenId,
      standard: "ERC-7857-like live demo iNFT",
    },
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

function rootsNeedUpdate(passport: PassportRecord, manifest: Manifest) {
  return (
    passport.manifestRoot.toLowerCase() !==
      rootToBytes32(manifest.storage.manifestRoot).toLowerCase() ||
    passport.intelligenceBundleRoot.toLowerCase() !==
      rootToBytes32(requiredRoot("intelligenceBundleRoot")).toLowerCase() ||
    passport.memoryRoot.toLowerCase() !==
      rootToBytes32(requiredRoot("memoryRoot")).toLowerCase() ||
    passport.latestRunRoot.toLowerCase() !==
      rootToBytes32(requiredRoot("latestRunRoot")).toLowerCase()
  );
}

function readPassportRecord(value: unknown): PassportRecord {
  if (Array.isArray(value)) {
    return {
      manifestRoot: value[4] as Hex,
      intelligenceBundleRoot: value[5] as Hex,
      memoryRoot: value[6] as Hex,
      latestRunRoot: value[7] as Hex,
    };
  }
  return value as PassportRecord;
}

function readCertificateProofRoot(value: unknown): Hex {
  if (Array.isArray(value)) {
    return value[6] as Hex;
  }
  return (value as { proofRoot: Hex }).proofRoot;
}

function readDemoMintedTokenId(logs: readonly Log[], abi: Abi) {
  for (const log of logs) {
    try {
      const event = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
        eventName: "DemoMinted",
      });
      return (event.args as unknown as { tokenId: bigint }).tokenId.toString();
    } catch {
      continue;
    }
  }
  throw new Error("DemoMinted event not found");
}

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
