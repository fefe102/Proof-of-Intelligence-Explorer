import { codeguardianCertificate, createVerifier, hashCanonicalJson } from "@poi/sdk";
import { decodeEventLog, type Abi, type Address, type Hex, type Log } from "viem";
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
  writeSafeJson
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

loadLocalEnv();
const operation = "seed-live-demo";
const config = liveConfig();
printSanitizedPlan(operation, config);

const [codeguardian, fakeagent] = await Promise.all([createVerifier().verify("codeguardian"), createVerifier().verify("fakeagent")]);
const deployment = readJson<Deployment>("deployments/0g-galileo.json");
let preflight: Awaited<ReturnType<typeof preflightLiveWrite>> | undefined;

if (liveWritesAvailable(config)) {
  preflight = await preflightLiveWrite(config);
}

if (preflight && (!deployment?.demoInftAddress || !deployment.registryAddress)) {
  throw new Error("Missing live contract addresses. Run pnpm contracts:deploy:live first.");
}

const demo = readArtifact("artifacts/contracts/DemoINFT.sol/DemoINFT.json");
const registry = readArtifact("artifacts/contracts/ProofOfIntelligenceRegistry.sol/ProofOfIntelligenceRegistry.json");
const txHashes = [...(deployment?.txHashes ?? [])];
let codeguardianTokenId = deployment?.codeguardianTokenId;
let fakeagentTokenId = deployment?.fakeagentTokenId;
let passportId = deployment?.codeguardianPassportId;
let certificateId = deployment?.codeguardianCertificateId;

if (preflight && deployment?.demoInftAddress && deployment.registryAddress) {
  const { publicClient, walletClient, account } = liveClients(config);
  let txCount = 0;
  const spendTx = () => {
    txCount += 1;
    if (txCount > config.maxTxPerOperation) {
      throw new Error(`Refusing to exceed POI_MAX_TX_PER_OPERATION=${config.maxTxPerOperation}`);
    }
  };

  if (!codeguardianTokenId) {
    spendTx();
    const hash = await walletClient.writeContract({
      address: deployment.demoInftAddress,
      abi: demo.abi,
      functionName: "mintDemo",
      args: [account.address, `${publicAppUrl()}/api/agent/codeguardian`, rootToBytes32(requiredRoot("manifestRoot"))]
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
      args: [account.address, `${publicAppUrl()}/api/agent/fakeagent`, "0x0000000000000000000000000000000000000000000000000000000000000000"]
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    txHashes.push(hash);
    fakeagentTokenId = readDemoMintedTokenId(receipt.logs, demo.abi);
  }

  if (!passportId && codeguardianTokenId) {
    passportId = (await publicClient.readContract({
      address: deployment.registryAddress,
      abi: registry.abi,
      functionName: "passportId",
      args: [deployment.demoInftAddress, BigInt(codeguardianTokenId)]
    })) as Hex;

    const registered = await publicClient
      .readContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "getPassport",
        args: [deployment.demoInftAddress, BigInt(codeguardianTokenId)]
      })
      .then(() => true)
      .catch(() => false);

    if (!registered) {
      spendTx();
      const hash = await walletClient.writeContract({
        address: deployment.registryAddress,
        abi: registry.abi,
        functionName: "registerPassport",
        args: [
          deployment.demoInftAddress,
          BigInt(codeguardianTokenId),
          BigInt(config.expectedChainId),
          rootToBytes32(requiredRoot("manifestRoot")),
          rootToBytes32(requiredRoot("intelligenceBundleRoot")),
          rootToBytes32(requiredRoot("memoryRoot")),
          rootToBytes32(requiredRoot("latestRunRoot")),
          `${publicAppUrl()}/api/agent/codeguardian`
        ]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    }
  }

  if (!certificateId && codeguardianTokenId) {
    spendTx();
    const hash = await walletClient.writeContract({
      address: deployment.registryAddress,
      abi: registry.abi,
      functionName: "issueCertificate",
      args: [
        deployment.demoInftAddress,
        BigInt(codeguardianTokenId),
        rootToBytes32(hashCanonicalJson(codeguardianCertificate)),
        `${publicAppUrl()}/certificate/${codeguardianCertificate.certificateId}`
      ]
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    txHashes.push(hash);
    certificateId = readCertificateId(receipt.logs, registry.abi);
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
    updatedAt: new Date().toISOString()
  });
}

writeSafeJson("deployments/demo-seed.json", {
  mode: preflight ? "live" : "hybrid",
  chainId: config.expectedChainId,
  operator: preflight?.address ?? "mock-operator",
  contracts: {
    registryAddress: process.env.POI_REGISTRY_ADDRESS ?? deployment?.registryAddress ?? "",
    demoInftAddress: process.env.POI_DEMO_INFT_ADDRESS ?? deployment?.demoInftAddress ?? ""
  },
  tokenIds: { codeguardian: codeguardianTokenId ?? "", fakeagent: fakeagentTokenId ?? "" },
  passportId: passportId ?? "",
  certificateId: certificateId ?? "",
  agents: {
    codeguardian: { tier: codeguardian.tier, status: codeguardian.status, roots: codeguardian.evidence },
    fakeagent: { tier: fakeagent.tier, status: fakeagent.status, missing: fakeagent.missing }
  },
  message: "Seed artifact is public and contains no private keys or tokens."
});

function requiredRoot(key: keyof typeof codeguardian.evidence) {
  const root = codeguardian.evidence[key];
  if (!root) {
    throw new Error(`Missing CodeGuardian evidence root: ${key}`);
  }
  return root;
}

function readDemoMintedTokenId(logs: readonly Log[], abi: Abi) {
  for (const log of logs) {
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics, eventName: "DemoMinted" });
      return ((event.args as unknown) as { tokenId: bigint }).tokenId.toString();
    } catch {
      continue;
    }
  }
  throw new Error("DemoMinted event not found");
}

function readCertificateId(logs: readonly Log[], abi: Abi) {
  for (const log of logs) {
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics, eventName: "CertificateIssued" });
      return ((event.args as unknown) as { certificateId: bigint }).certificateId.toString();
    } catch {
      continue;
    }
  }
  throw new Error("CertificateIssued event not found");
}
