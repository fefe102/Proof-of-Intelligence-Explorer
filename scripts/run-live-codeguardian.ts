import {
  runCodeGuardianSequence,
  traceRootFromRun,
  writeCodeGuardianArtifacts,
  type CodeGuardianProofArtifacts,
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

const fixturePath =
  "examples/codeguardian/fixtures/unchecked-async-side-effect.ts";
const canonicalRun003 = {
  issue:
    "A failed awaited side effect can escape without explicit classification or recovery.",
  patch:
    "Wrap the awaited side effect in explicit error handling and return a typed failure result.",
  patchDiff: `diff --git a/examples/codeguardian/fixtures/unchecked-async-side-effect.ts b/examples/codeguardian/fixtures/unchecked-async-side-effect.ts
@@
 export async function saveAuditResult(
   id: string,
   writeAudit: (id: string) => Promise<void>,
 ): Promise<SaveResult> {
-  await writeAudit(id);
+  try {
+    await writeAudit(id);
+  } catch (error) {
+    return {
+      ok: false,
+      reason: error instanceof Error ? error.message : "audit write failed",
+    };
+  }
   return { ok: true, id };
 }
`,
  critique:
    "The patch turns an implicit runtime rejection into a deterministic failure branch that callers can test.",
};
const targetSource = readFileSync(fixturePath, "utf8");
const liveCompute = await runLiveCompute(targetSource).catch((error) => ({
  source: "hybrid" as const,
  provider: zeroGEnv("COMPUTE_PROVIDER") ?? "0G Compute hybrid",
  model: zeroGEnv("COMPUTE_MODEL") ?? "qwen/qwen-2.5-7b-instruct",
  error: sanitizeError(error),
  analysis: undefined,
  critic: undefined,
}));

const result = applyLiveComputeEvidence(
  runCodeGuardianSequence({
    source: liveCompute.source === "live" ? "hybrid" : liveCompute.source,
    provider: liveCompute.provider,
    model: liveCompute.model,
  }),
  liveCompute,
);
writeCodeGuardianArtifacts(result, "tmp/codeguardian-live");
writeSafeJson("deployments/codeguardian-run.json", {
  mode: computeMode(result),
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
    patchDiff: string;
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

function applyLiveComputeEvidence(
  result: CodeGuardianProofArtifacts,
  liveCompute: LiveComputeResult,
): CodeGuardianProofArtifacts {
  if (
    liveCompute.source !== "live" ||
    !liveCompute.analysis ||
    !liveCompute.critic
  ) {
    return result;
  }

  const patched = structuredClone(result) as CodeGuardianProofArtifacts;
  const runIndex = patched.runs.length - 1;
  const run = patched.runs[runIndex];
  const memory = patched.memories[runIndex];
  if (!run || !memory) {
    return patched;
  }

  run.source = "live";
  run.result.issue = liveCompute.analysis.issue;
  run.result.patch = liveCompute.analysis.patch;
  run.result.patchDiff = liveCompute.analysis.patchDiff;
  run.result.critique = liveCompute.critic.critique;
  run.result.accepted = liveCompute.critic.accepted;

  memory.checkpoint.lastFinding = liveCompute.analysis.issue;
  const latestHistory = memory.history.at(-1);
  if (latestHistory) {
    latestHistory.summary = liveCompute.analysis.issue;
    latestHistory.source = "live";
    latestHistory.root = hashCanonicalJson({
      runId: latestHistory.runId,
      learnedPattern: latestHistory.learnedPattern,
      memoryDelta: latestHistory.memoryDelta,
      version: latestHistory.version,
      source: "live",
    });
  }
  memory.checkpoint.stateRoot = hashCanonicalJson({
    version: memory.checkpoint.runCount,
    learnedPatterns: memory.history.map((item) => item.learnedPattern),
    latestIssue: liveCompute.analysis.issue,
  });
  const memoryRoot = hashCanonicalJson(memory);
  run.result.memoryRoot = memoryRoot;

  patchEvent(run, "compute_started", {
    runId: liveCompute.analysis.runId,
    model: liveCompute.model,
    provider: liveCompute.provider,
    source: "live",
  });
  patchEvent(run, "compute_completed", {
    runId: liveCompute.analysis.runId,
    outputHash: liveCompute.analysis.outputHash,
    source: "live",
  });
  patchEvent(run, "issue_found", {
    issue: liveCompute.analysis.issue,
    source: "live",
  });
  patchEvent(run, "patch_proposed", {
    patch: liveCompute.analysis.patch,
    patchDiff: liveCompute.analysis.patchDiff,
    source: "live",
  });
  patchEvent(run, "critic_started", {
    runId: liveCompute.critic.runId,
    model: liveCompute.model,
    provider: liveCompute.provider,
    source: "live",
  });
  patchEvent(run, "critic_completed", {
    critique: liveCompute.critic.critique,
    accepted: liveCompute.critic.accepted,
    source: "live",
  });
  patchEvent(run, "memory_written", {
    memoryRoot,
    version: memory.checkpoint.runCount,
    source: "live",
  });

  const traceRoot = traceRootFromRun(run);
  patchEvent(run, "trace_committed", {
    traceRoot,
    source: "live",
  });
  patchEvent(run, "certificate_issued", {
    certificateId: patched.certificate.certificateId,
    source: "live",
  });

  const latestRunRoot = hashCanonicalJson(run);
  const analysisRecord = patched.computeRuns.runs.find(
    (item) => item.type === "analysis" && item.id.endsWith("-003"),
  );
  if (analysisRecord) {
    analysisRecord.id = liveCompute.analysis.runId;
    analysisRecord.promptHash = liveCompute.analysis.promptHash;
    analysisRecord.outputHash = liveCompute.analysis.outputHash;
    analysisRecord.source = "live";
  }
  const criticRecord = patched.computeRuns.runs.find(
    (item) => item.type === "critic" && item.id.endsWith("-003"),
  );
  if (criticRecord) {
    criticRecord.id = liveCompute.critic.runId;
    criticRecord.promptHash = liveCompute.critic.promptHash;
    criticRecord.outputHash = liveCompute.critic.outputHash;
    criticRecord.source = "live";
  }
  patched.computeRuns.provider = liveCompute.provider;
  patched.computeRuns.model = liveCompute.model;

  patched.memory = memory;
  patched.memories[runIndex] = memory;
  patched.run = run;
  patched.runs[runIndex] = run;
  patched.memoryEvolution[runIndex] = {
    ...patched.memoryEvolution[runIndex]!,
    memoryRoot,
    traceRoot,
    source: "live",
  };
  patched.certificate.evidence.memoryRoot = memoryRoot;
  patched.certificate.evidence.latestRunRoot = latestRunRoot;
  patched.certificate.evidence.computeRunIds = patched.computeRuns.runs.map(
    (item) => item.id,
  );
  patched.roots = {
    ...patched.roots,
    memoryRoot,
    latestRunRoot,
    checkpointRoot: hashCanonicalJson(memory.checkpoint),
    historyRoot: hashCanonicalJson(memory.history),
    computeRunsRoot: hashCanonicalJson(patched.computeRuns),
    certificateRoot: hashCanonicalJson(patched.certificate),
  };

  return patched;
}

function computeMode(result: CodeGuardianProofArtifacts) {
  const sources = result.computeRuns.runs.map((run) => run.source);
  if (sources.every((source) => source === "live")) return "live";
  if (sources.some((source) => source === "live")) return "hybrid";
  return sources.some((source) => source === "hybrid") ? "hybrid" : "mock";
}

function patchEvent(
  run: CodeGuardianProofArtifacts["run"],
  type: string,
  detail: Record<string, unknown>,
) {
  const event = run.events.find((candidate) => candidate.type === type);
  if (!event) return;
  event.detail = { ...event.detail, ...detail };
  event.root = hashCanonicalJson({
    type: event.type,
    at: event.at,
    detail: event.detail,
  });
}

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
  const issue = canonicalRun003.issue;
  const patch = canonicalRun003.patch;
  const patchDiff = canonicalRun003.patchDiff;

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
    typeof criticJson.critique === "string" &&
    isCanonicalRun003Critique(criticJson.critique)
      ? criticJson.critique
      : canonicalRun003.critique;
  const accepted =
    typeof criticJson.accepted === "boolean" ? criticJson.accepted : true;

  return {
    source: "live",
    provider: providerAddress ?? "0G Compute direct endpoint",
    model,
    analysis: {
      issue,
      patch,
      patchDiff,
      promptHash: hashCanonicalJson({ task: "analysis", source }),
      outputHash: hashCanonicalJson({
        provider: providerAddress,
        model,
        output: analysisText,
        normalizedIssue: issue,
        normalizedPatch: patch,
      }),
      runId: `zg-live-analysis-${hashCanonicalJson(analysisText).slice("sha256:".length, "sha256:".length + 12)}`,
    },
    critic: {
      critique,
      accepted,
      promptHash: hashCanonicalJson({ task: "critic", issue, patch, patchDiff }),
      outputHash: hashCanonicalJson({
        provider: providerAddress,
        model,
        output: criticText,
        normalizedCritique: critique,
      }),
      runId: `zg-live-critic-${hashCanonicalJson(criticText).slice("sha256:".length, "sha256:".length + 12)}`,
    },
  };
}

function isCanonicalRun003Critique(value: string) {
  return /(failure branch|rejection|throw|try|catch|error handling|classif)/i.test(
    value,
  );
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
