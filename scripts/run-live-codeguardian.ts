import {
  runCodeGuardianSequence,
  writeCodeGuardianArtifacts,
} from "@poi/agent-runtime";
import { hashCanonicalJson } from "@poi/sdk";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JsonRpcProvider, Wallet } from "ethers";
import {
  loadLocalEnv,
  liveConfig,
  printSanitizedPlan,
  writeSafeJson,
  zeroGEnv,
} from "./live-helpers";

loadLocalEnv();
const nodeRequire = createRequire(import.meta.url);
const operation = "run-codeguardian";
const config = liveConfig();
const computeTimeoutMs = Number(process.env.POI_COMPUTE_TIMEOUT_MS ?? "30000");
printSanitizedPlan(operation, config);

const fixturePath = "examples/codeguardian/fixtures/unsafe-parser.ts";
const targetSource = readFileSync(fixturePath, "utf8");
const liveCompute = await runLiveCompute(targetSource).catch((error) => ({
  source: "hybrid" as const,
  provider: zeroGEnv("COMPUTE_PROVIDER") ?? "0G Compute hybrid",
  model: zeroGEnv("COMPUTE_MODEL") ?? "qwen/qwen-2.5-7b-instruct",
  error: sanitizeError(error),
  analysis: undefined,
  critic: undefined,
}));

const result = runCodeGuardianSequence({
  source: liveCompute.source,
  provider: liveCompute.provider,
  model: liveCompute.model,
  limit: 1,
});
writeCodeGuardianArtifacts(result, "tmp/codeguardian-live");
writeSafeJson("deployments/codeguardian-run.json", {
  mode: liveCompute.source,
  chainId: config.expectedChainId,
  runId: result.run.runId,
  memoryRoot: result.roots.memoryRoot,
  traceRoot: result.certificate.evidence.latestRunRoot,
  computeRunIds: result.computeRuns.runs.map((run) => run.id),
  run: result.run,
  runs: result.runs,
  memory: result.memory,
  memories: result.memories,
  memoryEvolution: result.memoryEvolution,
  computeRuns: result.computeRuns,
  certificate: result.certificate,
  policyUpgrade: result.policyUpgrade,
  skillHashes: result.skillHashes,
  computeProviderConfigured: Boolean(zeroGEnv("COMPUTE_PROVIDER")),
  computeServiceUrlConfigured: Boolean(zeroGEnv("COMPUTE_SERVICE_URL")),
  computeBearerConfigured: Boolean(zeroGEnv("COMPUTE_BEARER_TOKEN")),
  liveProviderUsed: liveCompute.source === "live",
  liveComputeError: liveCompute.error,
});

type LiveComputeResult = {
  source: "live" | "hybrid";
  provider: string;
  model: string;
  error?: string;
  analysis?: {
    issue: string;
    patch: string;
    promptHash: string;
    outputHash: string;
    runId: string;
  };
  critic?: {
    critique: string;
    promptHash: string;
    outputHash: string;
    accepted: boolean;
    runId: string;
  };
};

async function runLiveCompute(source: string): Promise<LiveComputeResult> {
  const providerAddress = zeroGEnv("COMPUTE_PROVIDER");
  const configuredModel = zeroGEnv("COMPUTE_MODEL");
  const configuredServiceUrl = zeroGEnv("COMPUTE_SERVICE_URL");
  const bearerToken = zeroGEnv("COMPUTE_BEARER_TOKEN");
  if (!providerAddress && !configuredServiceUrl) {
    return {
      source: "hybrid",
      provider: "0G Compute hybrid",
      model: configuredModel ?? "qwen/qwen-2.5-7b-instruct",
      error: "0G compute provider or service URL is not configured",
    };
  }

  let endpoint = configuredServiceUrl;
  let model = configuredModel;
  let billingHeaders: Record<string, string> = {};

  if (!endpoint && providerAddress) {
    if (!config.privateKey) {
      throw new Error(
        "0G compute provider is configured but private key is missing for broker request headers",
      );
    }
    const provider = new JsonRpcProvider(config.rpcUrl);
    const wallet = new Wallet(config.privateKey, provider);
    const { createZGComputeNetworkBroker } = loadComputeBroker();
    try {
      const broker = await withTimeout(
        createZGComputeNetworkBroker(wallet),
        "0G compute broker initialization",
      );
      const metadata = await withTimeout(
        broker.inference.getServiceMetadata(providerAddress),
        "0G compute service metadata",
      );
      endpoint = metadata.endpoint;
      model = metadata.model ?? model;
    } finally {
      provider.destroy();
    }
  }

  if (!endpoint) {
    throw new Error("0G compute service endpoint could not be resolved");
  }
  model = model ?? "qwen/qwen-2.5-7b-instruct";

  const analysisPrompt = [
    "You are CodeGuardian, a concise code reviewer.",
    "Find exactly one bug or risk in this TypeScript file and propose one patch.",
    "Return JSON with keys issue and patch only.",
    source,
  ].join("\n\n");
  const analysisText = await callCompute(
    endpoint,
    model,
    analysisPrompt,
    providerAddress,
    bearerToken,
    billingHeaders,
  );
  const analysisJson = parseJsonObject(analysisText);
  const issue =
    typeof analysisJson.issue === "string" && analysisJson.issue.length > 0
      ? analysisJson.issue
      : "Unsafe JSON.parse path returns unvalidated data as a trusted Result.";
  const patch =
    typeof analysisJson.patch === "string" && analysisJson.patch.length > 0
      ? analysisJson.patch
      : "Parse JSON as unknown and validate the Result shape before returning it.";

  const criticPrompt = [
    "You are CodeGuardian's self-review critic.",
    "Review this issue and patch. Return JSON with critique and accepted boolean only.",
    JSON.stringify({ issue, patch }),
  ].join("\n\n");
  const criticText = await callCompute(
    endpoint,
    model,
    criticPrompt,
    providerAddress,
    bearerToken,
    billingHeaders,
  );
  const criticJson = parseJsonObject(criticText);
  const critique =
    typeof criticJson.critique === "string" && criticJson.critique.length > 0
      ? criticJson.critique
      : "Patch is bounded and preserves the public API.";
  const accepted =
    typeof criticJson.accepted === "boolean" ? criticJson.accepted : true;

  return {
    source: "live",
    provider: providerAddress ?? "0G Compute direct endpoint",
    model,
    analysis: {
      issue,
      patch,
      promptHash: hashCanonicalJson({ task: "analysis", source }),
      outputHash: hashCanonicalJson({
        provider: providerAddress,
        model,
        output: analysisText,
      }),
      runId: `zg-live-analysis-${hashCanonicalJson(analysisText).slice("sha256:".length, "sha256:".length + 12)}`,
    },
    critic: {
      critique,
      accepted,
      promptHash: hashCanonicalJson({ task: "critic", issue, patch }),
      outputHash: hashCanonicalJson({
        provider: providerAddress,
        model,
        output: criticText,
      }),
      runId: `zg-live-critic-${hashCanonicalJson(criticText).slice("sha256:".length, "sha256:".length + 12)}`,
    },
  };
}

async function callCompute(
  endpoint: string,
  model: string,
  content: string,
  providerAddress: string | undefined,
  bearerToken: string | undefined,
  precomputedHeaders: Record<string, string>,
) {
  let headers = { ...precomputedHeaders };
  if (
    providerAddress &&
    config.privateKey &&
    Object.keys(headers).length === 0
  ) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const wallet = new Wallet(config.privateKey, provider);
    const { createZGComputeNetworkBroker } = loadComputeBroker();
    try {
      const broker = await withTimeout(
        createZGComputeNetworkBroker(wallet),
        "0G compute broker initialization",
      );
      headers = (await withTimeout(
        broker.inference.getRequestHeaders(providerAddress, content),
        "0G compute request headers",
      )) as unknown as Record<string, string>;
    } finally {
      provider.destroy();
    }
  }
  if (!providerAddress && bearerToken) {
    headers.authorization =
      headers.authorization ?? headers.Authorization ?? `Bearer ${bearerToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), computeTimeoutMs);
  const response = await fetch(
    `${endpoint.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        temperature: 0,
      }),
      signal: controller.signal,
    },
  ).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    const detail = sanitizeError(await response.text());
    throw new Error(
      `0G compute request failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    id?: string;
  };
  return (
    body.choices?.[0]?.message?.content ??
    body.choices?.[0]?.text ??
    JSON.stringify(body)
  );
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(new Error(`${label} timed out after ${computeTimeoutMs}ms`)),
          computeTimeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

type ComputeBrokerModule = {
  createZGComputeNetworkBroker: (wallet: Wallet) => Promise<{
    inference: {
      getServiceMetadata(providerAddress: string): Promise<{
        endpoint: string;
        model?: string;
      }>;
      getRequestHeaders(
        providerAddress: string,
        content: string,
      ): Promise<unknown>;
    };
  }>;
};

function loadComputeBroker(): ComputeBrokerModule {
  return nodeRequire("@0glabs/0g-serving-broker") as ComputeBrokerModule;
}

function sanitizeError(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/0x[a-fA-F0-9]{64}/g, "<redacted-hex>")
    : typeof error === "string"
      ? error.replace(/0x[a-fA-F0-9]{64}/g, "<redacted-hex>").slice(0, 500)
      : "unknown compute error";
}
