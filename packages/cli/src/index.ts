#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  runCodeGuardianSequence,
  replayCodeGuardianRun,
  writeCodeGuardianArtifacts,
} from "@poi/agent-runtime";
import {
  ArtifactComputeAdapter,
  ArtifactStorageAdapter,
  MockChainAdapter,
  ZeroGChainAdapter,
  computeEvidenceRoots,
  createPassportManifest,
  createVerifier,
  exportDaBundle,
  exportProofJson,
  type PassportDraft,
  type ChainAdapter,
  type ProofStorageBundle,
  type RunTrace,
  type TokenSnapshot,
  type VerificationReport,
} from "@poi/sdk";
import { Command } from "commander";

const program = new Command();

program
  .name("poi")
  .description("Proof-of-Intelligence Explorer CLI")
  .version("0.1.0");

program.command("health").action(() => {
  console.log(
    JSON.stringify(
      { ok: true, service: "poi-cli", mode: process.env.POI_MODE ?? "hybrid" },
      null,
      2,
    ),
  );
});

program
  .command("seed-demo")
  .description("Write deterministic safe demo artifacts")
  .action(async () => {
    const codeguardian = await verifyDemoTarget("codeguardian");
    const fakeagent = await verifyDemoTarget("fakeagent");
    writeJson(
      repoPath("public/demo/codeguardian-proof.sample.json"),
      codeguardian,
    );
    writeJson(repoPath("public/demo/fakeagent-proof.sample.json"), fakeagent);
    writeJson(repoPath("public/demo/status.json"), {
      app: "Proof-of-Intelligence Explorer",
      mode: process.env.NEXT_PUBLIC_POI_PUBLIC_MODE ?? "hybrid",
      seededAt: "2026-04-26T00:00:00.000Z",
      agents: {
        codeguardian: { tier: codeguardian.tier, status: codeguardian.status },
        fakeagent: { tier: fakeagent.tier, status: fakeagent.status },
      },
    });
    console.log("seeded deterministic demo artifacts");
  });

program
  .command("verify")
  .argument("[target]", "codeguardian, fakeagent, or contract:tokenId")
  .option("--chain-id <chainId>", "0G chain id", "16602")
  .option("--contract <address>", "iNFT/token contract")
  .option("--token-id <tokenId>", "token id")
  .option("--manifest-root <root>", "optional Proof-of-Intelligence manifest root")
  .action(async (target: string | undefined, options: VerifyOptions) => {
    const report =
      options.contract && options.tokenId
        ? await verifyArbitraryTarget(options)
        : target?.includes(":")
          ? await verifyContractTarget(target, options)
          : await verifyDemoTarget(target ?? "codeguardian");
    console.log(
      JSON.stringify(
        {
          agent: report.agent,
          tier: report.tier,
          status: report.status,
          missing: report.missing,
          sources: report.sources,
          evidence: report.evidence,
        },
        null,
        2,
      ),
    );
    if (target?.toLowerCase() === "codeguardian" && report.tier < 5) {
      process.exitCode = 1;
    }
    if (target?.toLowerCase() === "fakeagent" && report.tier > 2) {
      process.exitCode = 1;
    }
  });

program
  .command("create-passport")
  .description("Create a deterministic Proof-of-Intelligence Passport draft")
  .option("--chain-id <chainId>", "0G chain id", "16602")
  .option("--contract <address>", "iNFT/token contract", demoAddress())
  .option("--token-id <tokenId>", "token id", "1")
  .option("--owner <address>", "token owner", demoOwner())
  .option("--name <name>", "agent name", "My 0G Agent")
  .option(
    "--description <description>",
    "agent description",
    "A testnet iNFT agent with packaged intelligence and memory evidence.",
  )
  .action((options: CreatePassportOptions) => {
    const draft: PassportDraft = {
      chainId: Number(options.chainId),
      contract: options.contract,
      tokenId: options.tokenId,
      owner: options.owner,
      name: options.name,
      description: options.description,
      skills: [{ name: "proof-recorder", permissions: ["verify", "replay"] }],
      allowedActions: ["verify", "replay", "export-proof"],
      memoryPolicy: "checkpointed-kv",
      intelligence: {
        name: options.name,
        goals: ["Publish verifiable Proof-of-Intelligence evidence"],
        behaviorPolicy: "Only execute allowlisted testnet actions.",
        toolPermissions: ["read-public-data", "write-proof-roots"],
        skills: ["proof-recorder"],
      },
    };
    const manifest = createPassportManifest(draft);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: process.env.POI_MODE ?? "hybrid",
          manifest,
          roots: computeEvidenceRoots({ manifest }),
          passportUrl: `/passport/${draft.chainId}/${draft.contract}/${draft.tokenId}`,
          badgeUrl: `/badge/${draft.chainId}/${draft.contract}/${draft.tokenId}.svg`,
        },
        null,
        2,
      ),
    );
  });

program
  .command("run-codeguardian")
  .description("Run deterministic CodeGuardian fixture audit")
  .action(() => {
    const result = runCodeGuardianSequence();
    writeCodeGuardianArtifacts(result);
    console.log(
      JSON.stringify(
        {
          runId: result.run.runId,
          runCount: result.runs.length,
          events: result.run.events.length,
          issue: result.run.result.issue,
          memoryRoot: result.roots.memoryRoot,
          traceRoot: result.certificate.evidence.latestRunRoot,
          artifacts: "tmp/codeguardian",
        },
        null,
        2,
      ),
    );
  });

program
  .command("replay")
  .argument("<runId>", "run id")
  .action((runId: string) => {
    const run = readRun(runId);
    const replay = replayCodeGuardianRun(run);
    console.log(JSON.stringify(replay, null, 2));
  });

program
  .command("export-proof")
  .argument("<target>", "codeguardian or fakeagent")
  .option("--out <path>", "output path")
  .action(async (target: string, options: { out?: string }) => {
    const report = await verifyDemoTarget(target);
    const json = exportProofJson(report);
    if (options.out) {
      writeText(repoPath(options.out), `${json}\n`);
      console.log(`wrote ${options.out}`);
    } else {
      console.log(json);
    }
  });

program
  .command("export-da-bundle")
  .argument("<target>", "codeguardian or fakeagent")
  .action(async (target: string) => {
    const report = await verifyDemoTarget(target);
    const bundle = await exportDaBundle(report);
    console.log(JSON.stringify(bundle, null, 2));
  });

program
  .command("deploy-live")
  .action(() => explainScript("pnpm contracts:deploy:live"));
program
  .command("seed-live-demo")
  .action(() => explainScript("pnpm demo:live:seed"));
program
  .command("sync-vercel-env")
  .action(() => explainScript("tsx scripts/sync-vercel-env.ts"));

program.parse();

type VerifyOptions = {
  chainId: string;
  contract?: string;
  tokenId?: string;
  manifestRoot?: string;
};

type CreatePassportOptions = {
  chainId: string;
  contract: string;
  tokenId: string;
  owner: string;
  name: string;
  description: string;
};

async function verifyContractTarget(target: string, options: VerifyOptions) {
  const [contract, tokenId] = target.split(":");
  if (!contract || !tokenId) {
    throw new Error("Contract target must be contract:tokenId");
  }
  return verifyArbitraryTarget({ ...options, contract, tokenId });
}

async function verifyArbitraryTarget(options: VerifyOptions) {
  if (!options.contract || !options.tokenId) {
    throw new Error("Use --contract and --token-id for arbitrary verification");
  }
  const deployment =
    readJson<Record<string, string>>(repoPath("deployments/0g-galileo.json")) ??
    {};
  if (
    deployment.demoInftAddress &&
    options.contract.toLowerCase() ===
      deployment.demoInftAddress.toLowerCase() &&
    options.tokenId === (deployment.codeguardianTokenId ?? "1")
  ) {
    return verifyDemoTarget("codeguardian");
  }
  if (
    deployment.demoInftAddress &&
    options.contract.toLowerCase() ===
      deployment.demoInftAddress.toLowerCase() &&
    options.tokenId === (deployment.fakeagentTokenId ?? "2")
  ) {
    return verifyDemoTarget("fakeagent");
  }
  return createVerifier({
    chain: new ZeroGChainAdapter({
      chainId: Number(options.chainId),
      rpcUrl: process.env["0G_RPC_URL"] ?? process.env.NEXT_PUBLIC_0G_RPC_URL,
    }),
    storage: new ArtifactStorageAdapter(
      readJson<ProofStorageBundle>(
        repoPath("deployments/0g-storage-bundle.json"),
      ) ?? {},
    ),
  }).verify({
    contract: options.contract,
    tokenId: options.tokenId,
    chainId: Number(options.chainId),
    manifestRoot: options.manifestRoot,
  });
}

async function verifyDemoTarget(target: string): Promise<VerificationReport> {
  const slug = target.toLowerCase();
  const bundle = readJson<ProofStorageBundle>(
    repoPath("deployments/0g-storage-bundle.json"),
  );

  if (slug === "codeguardian" && bundle?.manifest) {
    return createVerifier({
      chain: seededChainAdapter("codeguardian", bundle),
      storage: new ArtifactStorageAdapter(bundle),
      compute: new ArtifactComputeAdapter(bundle),
    }).verify({ manifest: bundle.manifest });
  }

  if (slug === "fakeagent") {
    return createVerifier({
      chain: seededChainAdapter("fakeagent", bundle),
    }).verify("fakeagent");
  }

  return createVerifier().verify(target);
}

function seededChainAdapter(
  slug: "codeguardian" | "fakeagent",
  bundle: ProofStorageBundle | null,
): ChainAdapter {
  const deployment =
    readJson<Record<string, string>>(repoPath("deployments/0g-galileo.json")) ??
    {};
  const fallback = new MockChainAdapter();
  return {
    source: deployment.demoInftAddress ? "live" : fallback.source,
    async getToken(
      contract: string,
      tokenId: string,
    ): Promise<TokenSnapshot | null> {
      if (!deployment.demoInftAddress) {
        return fallback.getToken(contract, tokenId);
      }

      const expectedTokenId =
        slug === "codeguardian"
          ? (deployment.codeguardianTokenId ?? "1")
          : (deployment.fakeagentTokenId ?? "2");
      return {
        chainId: Number(deployment.chainId ?? "16602"),
        contract: deployment.demoInftAddress,
        tokenId: expectedTokenId,
        owner: deployment.deployer,
        standard:
          slug === "codeguardian"
            ? "ERC-7857-like live demo iNFT"
            : "ERC-721 metadata-only live control token",
        metadataUri: `https://proof-of-intelligence-explorer.vercel.app/api/agent/${slug}`,
        manifestRoot:
          slug === "codeguardian"
            ? bundle?.manifest?.storage.manifestRoot
            : undefined,
        source: "live",
      };
    },
  };
}

function readRun(runId: string): RunTrace {
  const bundle = readJson<ProofStorageBundle>(
    repoPath("deployments/0g-storage-bundle.json"),
  );
  const bundledRun = bundle?.runs?.find((run) => run.runId === runId);
  if (bundledRun) {
    return bundledRun;
  }
  if (bundle?.run?.runId === runId) {
    return bundle.run;
  }

  const artifact = repoPath("tmp/codeguardian/run.json");
  if (existsSync(artifact)) {
    const parsed = JSON.parse(readFileSync(artifact, "utf8")) as RunTrace;
    if (parsed.runId === runId) {
      return parsed;
    }
  }

  const fixture = JSON.parse(
    readFileSync(
      repoPath("packages/sdk/fixtures/codeguardian.run.json"),
      "utf8",
    ),
  ) as RunTrace;
  if (fixture.runId === runId) {
    return fixture;
  }
  const fixtures = readJson<RunTrace[]>(
    repoPath("packages/sdk/fixtures/codeguardian.runs.json"),
  );
  const fixtureRun = fixtures?.find((run) => run.runId === runId);
  if (fixtureRun) {
    return fixtureRun;
  }

  throw new Error(`Run not found: ${runId}`);
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path: string, value: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function explainScript(command: string) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: process.env.POI_MODE ?? "hybrid",
        message:
          "Use the guarded live script for this operation. It validates 0G Galileo chain id, wallet, and balance before writes.",
        command,
      },
      null,
      2,
    ),
  );
}

function demoAddress() {
  const deployment =
    readJson<Record<string, string>>(repoPath("deployments/0g-galileo.json")) ??
    {};
  return (
    deployment.demoInftAddress ?? "0x0000000000000000000000000000000000000000"
  );
}

function demoOwner() {
  const deployment =
    readJson<Record<string, string>>(repoPath("deployments/0g-galileo.json")) ??
    {};
  return deployment.deployer ?? "0x053b860f329c9e4549d23dc8aadf1116b99f1233";
}

function repoPath(path: string) {
  if (path.startsWith("/")) {
    return path;
  }
  return resolve(new URL("../../..", import.meta.url).pathname, path);
}
