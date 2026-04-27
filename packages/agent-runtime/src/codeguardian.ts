import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import {
  encryptIntelligenceBundle,
  hashCanonicalJson,
  hashManifestForRoot,
  type Certificate,
  type ComputeRuns,
  type IntelligenceBundle,
  type Manifest,
  type MemoryState,
  type RunTrace,
} from "@poi/sdk";

export type CodeGuardianEvent = RunTrace["events"][number];

export type CodeGuardianRunResult = {
  run: RunTrace;
  memory: MemoryState;
  computeRuns: ComputeRuns;
  certificate: Certificate;
  memoryRootBefore: string;
  memoryRootAfter: string;
};

export type CodeGuardianMemoryEvolution = {
  runId: string;
  version: number;
  learnedPattern: string;
  memoryDelta: string;
  memoryRoot: string;
  traceRoot: string;
  source: "live" | "hybrid" | "mock";
};

export type CodeGuardianPolicyUpgrade = {
  skill: "critic-loop";
  oldVersion: string;
  newVersion: string;
  oldHash: string;
  newHash: string;
  reason: string;
  runId: string;
};

export type CodeGuardianProofArtifacts = {
  manifest: Manifest;
  intelligenceBundle: IntelligenceBundle;
  memory: MemoryState;
  memories: MemoryState[];
  run: RunTrace;
  runs: RunTrace[];
  computeRuns: ComputeRuns;
  certificate: Certificate;
  memoryEvolution: CodeGuardianMemoryEvolution[];
  policyUpgrade: CodeGuardianPolicyUpgrade;
  skillHashes: Record<string, string>;
  roots: Record<string, string>;
};

type CodeGuardianTask = {
  runId: string;
  targetPath: string;
  task: string;
  issue: string;
  patch: string;
  critique: string;
  learnedPattern: string;
  memoryDelta: string;
  analysisRunId: string;
  criticRunId: string;
};

export type CodeGuardianOptions = {
  source?: "live" | "hybrid" | "mock";
  runId?: string;
  targetPath?: string;
  targetSource?: string;
  model?: string;
  provider?: string;
};

export const CODEGUARDIAN_INFT = {
  chainId: 16602,
  contract: "0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9",
  tokenId: "1",
  owner: "0x053b860f329c9e4549d23dc8aadf1116b99f1233",
  standard: "ERC-7857-like live demo iNFT",
} as const;

const certificateId = "poi-cert-codeguardian-001";
const model = "qwen/qwen-2.5-7b-instruct";
const provider = "0G Compute hybrid broker";

const tasks: CodeGuardianTask[] = [
  {
    runId: "codeguardian-run-001",
    targetPath: "examples/codeguardian/fixtures/unsafe-parser.ts",
    task: "Audit unsafe JSON parsing in the demo TypeScript file.",
    issue:
      "Unsafe JSON.parse path returns unvalidated data as a trusted Result.",
    patch:
      "Parse JSON as unknown, validate the object shape, and return null for invalid payloads before constructing Result.",
    critique:
      "The patch is bounded, keeps the public API stable, and converts an unsafe cast into explicit validation.",
    learnedPattern:
      "Validate JSON parse failures before using parsed payloads.",
    memoryDelta:
      "Added a JSON-shape validation heuristic to future reviews.",
    analysisRunId: "zg-hybrid-analysis-001",
    criticRunId: "zg-hybrid-critic-001",
  },
  {
    runId: "codeguardian-run-002",
    targetPath: "examples/codeguardian/fixtures/missing-auth-guard.ts",
    task: "Audit access control before returning private records.",
    issue:
      "Private records can be returned before verifying the caller owns the account.",
    patch:
      "Check authorization before reading or returning private records, and fail closed when ownership cannot be proven.",
    critique:
      "The fix moves authorization ahead of disclosure and preserves the function's narrow data access boundary.",
    learnedPattern:
      "Verify authorization before returning private records.",
    memoryDelta:
      "Added an authorization-check heuristic to critic reviews.",
    analysisRunId: "zg-hybrid-analysis-002",
    criticRunId: "zg-hybrid-critic-002",
  },
  {
    runId: "codeguardian-run-003",
    targetPath: "examples/codeguardian/fixtures/unchecked-async-side-effect.ts",
    task: "Audit async side effects for unchecked failures.",
    issue:
      "A failed awaited side effect can escape without explicit classification or recovery.",
    patch:
      "Wrap the awaited side effect in explicit error handling and return a typed failure result.",
    critique:
      "The patch turns an implicit runtime rejection into a deterministic failure branch that callers can test.",
    learnedPattern:
      "Wrap awaited side effects in explicit error handling.",
    memoryDelta:
      "Added an async side-effect handling pattern to persistent review memory.",
    analysisRunId: "zg-hybrid-analysis-003",
    criticRunId: "zg-hybrid-critic-003",
  },
];

export class InMemoryStateStore {
  private readonly values = new Map<string, unknown>();

  set(key: string, value: unknown) {
    this.values.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined;
  }

  root() {
    return hashCanonicalJson(
      Object.fromEntries(
        [...this.values.entries()].sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    );
  }
}

export class InMemoryTraceLog {
  readonly events: CodeGuardianEvent[] = [];

  append(event: CodeGuardianEvent) {
    this.events.push(event);
  }

  root() {
    return hashCanonicalJson(this.events);
  }
}

export class CodeGuardian {
  readonly state = new InMemoryStateStore();
  readonly log = new InMemoryTraceLog();

  run(options: CodeGuardianOptions = {}): CodeGuardianRunResult {
    const sequence = this.runSequence({ ...options, limit: 1 });
    const run = sequence.runs[0];
    const memory = sequence.memories[0];
    if (!run || !memory) {
      throw new Error("CodeGuardian run did not produce artifacts");
    }
    this.state.set("memory", memory);
    run.events.forEach((event) => this.log.append(event));
    return {
      run,
      memory,
      computeRuns: {
        ...sequence.computeRuns,
        runs: sequence.computeRuns.runs.slice(0, 2),
      },
      certificate: sequence.certificate,
      memoryRootBefore: hashCanonicalJson({
        schema: "poi-memory/v0.1",
        agent: "CodeGuardian",
        checkpoint: {
          runCount: 0,
          lastFinding: "No finding yet",
          stateRoot: hashCanonicalJson({ empty: true }),
        },
        history: [],
      }),
      memoryRootAfter: hashCanonicalJson(memory),
    };
  }

  runSequence(
    options: CodeGuardianOptions & { limit?: number } = {},
  ): CodeGuardianProofArtifacts {
    return createCodeGuardianProofArtifacts({
      source: options.source,
      limit: options.limit,
      model: options.model,
      provider: options.provider,
    });
  }
}

export function runCodeGuardian(options: CodeGuardianOptions = {}) {
  return new CodeGuardian().run(options);
}

export function runCodeGuardianSequence(
  options: CodeGuardianOptions & { limit?: number } = {},
) {
  return new CodeGuardian().runSequence(options);
}

export function createCodeGuardianProofArtifacts(
  options: {
    source?: "live" | "hybrid" | "mock";
    limit?: number;
    model?: string;
    provider?: string;
    inft?: Manifest["inft"];
    owner?: string;
  } = {},
): CodeGuardianProofArtifacts {
  const source = options.source ?? "hybrid";
  const selectedTasks = tasks.slice(0, options.limit ?? tasks.length);
  const skillHashes = codeGuardianSkillHashes();
  const policyUpgrade: CodeGuardianPolicyUpgrade = {
    skill: "critic-loop",
    oldVersion: "0.1.0",
    newVersion: "0.1.1",
    oldHash: requireSkillHash(skillHashes, "critic-loop@0.1.0"),
    newHash: requireSkillHash(skillHashes, "critic-loop@0.1.1"),
    reason:
      "After detecting a missing authorization guard, CodeGuardian added an authorization-check heuristic to future critic reviews.",
    runId: "codeguardian-run-002",
  };

  const memories: MemoryState[] = [];
  const runs: RunTrace[] = [];
  const computeRecords: ComputeRuns["runs"] = [];
  const memoryEvolution: CodeGuardianMemoryEvolution[] = [];
  let memoryHistory: MemoryState["history"] = [];
  let memoryRootBefore = hashCanonicalJson({
    schema: "poi-memory/v0.1",
    agent: "CodeGuardian",
    checkpoint: {
      runCount: 0,
      lastFinding: "No finding yet",
      stateRoot: hashCanonicalJson({ empty: true }),
    },
    history: [],
  });

  selectedTasks.forEach((task, index) => {
    const timestamp = at(index, 0);
    const historyEntry = {
      runId: task.runId,
      version: index + 1,
      summary: task.issue,
      learnedPattern: task.learnedPattern,
      memoryDelta: task.memoryDelta,
      at: timestamp,
      source,
      root: hashCanonicalJson({
        runId: task.runId,
        learnedPattern: task.learnedPattern,
        memoryDelta: task.memoryDelta,
        version: index + 1,
      }),
    };
    const history = [...memoryHistory, historyEntry];
    const memory: MemoryState = {
      schema: "poi-memory/v0.1",
      agent: "CodeGuardian",
      checkpoint: {
        runCount: index + 1,
        lastFinding: task.issue,
        stateRoot: hashCanonicalJson({
          version: index + 1,
          learnedPatterns: history.map((item) => item.learnedPattern),
          previousRoot: memoryRootBefore,
        }),
      },
      history,
    };
    const memoryRoot = hashCanonicalJson(memory);
    const run = buildRunTrace(task, index, {
      source,
      memoryRoot,
      policyUpgrade:
        task.runId === policyUpgrade.runId ? policyUpgrade : undefined,
      model: options.model ?? model,
      provider: options.provider ?? provider,
    });
    const traceRoot = traceRootFromRun(run);
    memories.push(memory);
    runs.push(run);
    memoryEvolution.push({
      runId: task.runId,
      version: index + 1,
      learnedPattern: task.learnedPattern,
      memoryDelta: task.memoryDelta,
      memoryRoot,
      traceRoot,
      source,
    });
    computeRecords.push(
      {
        id: task.analysisRunId,
        type: "analysis",
        promptHash: hashCanonicalJson({
          task: "analysis",
          target: task.targetPath,
          source: readFixtureSource(task.targetPath),
        }),
        outputHash: hashCanonicalJson({
          issue: task.issue,
          patch: task.patch,
        }),
        at: at(index, 4),
        source,
      },
      {
        id: task.criticRunId,
        type: "critic",
        promptHash: hashCanonicalJson({
          task: "critic",
          issue: task.issue,
          patch: task.patch,
        }),
        outputHash: hashCanonicalJson({
          accepted: true,
          critique: task.critique,
        }),
        at: at(index, 10),
        source,
      },
    );
    memoryRootBefore = memoryRoot;
    memoryHistory = history;
  });

  const latestMemory = memories.at(-1);
  const latestRun = runs.at(-1);
  if (!latestMemory || !latestRun) {
    throw new Error("No CodeGuardian tasks selected");
  }

  const computeRuns: ComputeRuns = {
    schema: "poi-compute-runs/v0.1",
    provider: options.provider ?? provider,
    model: options.model ?? model,
    runs: computeRecords,
  };
  const intelligenceBundle = createCodeGuardianIntelligenceBundle(skillHashes);
  const inft = options.inft ?? {
    chainId: CODEGUARDIAN_INFT.chainId,
    contract: CODEGUARDIAN_INFT.contract,
    tokenId: CODEGUARDIAN_INFT.tokenId,
    standard: CODEGUARDIAN_INFT.standard,
  };
  const manifest: Manifest = {
    schema: "poi/v0.1",
    name: "CodeGuardian",
    description:
      "An autonomous 0G iNFT code-review agent with encrypted intelligence, evolving memory, compute-backed critic loops, replayable traces, and dynamic policy upgrades.",
    inft,
    identity: {
      owner: options.owner ?? CODEGUARDIAN_INFT.owner,
      ens: "codeguardian.poi-demo.eth",
    },
    storage: {
      manifestRoot:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      intelligenceBundleRoot: hashCanonicalJson(intelligenceBundle),
      memoryRoot: hashCanonicalJson(latestMemory),
      latestRunRoot: hashCanonicalJson(latestRun),
    },
    compute: {
      provider: computeRuns.provider,
      models: [computeRuns.model],
      latestRunIds: computeRuns.runs.map((item) => item.id),
    },
    skills: [
      {
        name: "static-code-review",
        version: "0.1.0",
        codeHash: requireSkillHash(skillHashes, "static-code-review@0.1.0"),
        permissions: ["read_fixture", "write_memory", "append_trace"],
      },
      {
        name: "patch-proposal",
        version: "0.1.0",
        codeHash: requireSkillHash(skillHashes, "patch-proposal@0.1.0"),
        permissions: ["propose_patch"],
      },
      {
        name: "critic-loop",
        version: "0.1.1",
        codeHash: requireSkillHash(skillHashes, "critic-loop@0.1.1"),
        permissions: ["self_review", "upgrade_policy"],
      },
      {
        name: "memory-update-policy",
        version: "0.1.0",
        codeHash: requireSkillHash(skillHashes, "memory-update-policy@0.1.0"),
        permissions: ["write_memory", "checkpoint_history"],
      },
    ],
    memory: {
      type: "checkpointed-kv-with-immutable-history",
      checkpointRoot: hashCanonicalJson(latestMemory.checkpoint),
      historyRoot: hashCanonicalJson(latestMemory.history),
    },
    proof: {
      status: "certified",
      certificateId,
      issuedAt: at(selectedTasks.length - 1, 13),
    },
    permissions: {
      publicProfile: true,
      ownerCanDecrypt: true,
      allowedActions: [
        "verify",
        "replay",
        "export-proof",
        "owner-decrypt-demo",
        "run-allowlisted-demo-task",
      ],
    },
  };
  manifest.storage.manifestRoot = hashManifestForRoot(manifest);

  const certificate: Certificate = {
    schema: "poi-certificate/v0.1",
    certificateId,
    agent: "CodeGuardian",
    tier: 6,
    issuedAt: manifest.proof.issuedAt!,
    issuer: "AgentProof - Proof-of-Intelligence Explorer",
    evidence: {
      inft: {
        chainId: manifest.inft.chainId,
        contract: manifest.inft.contract,
        tokenId: manifest.inft.tokenId,
      },
      intelligenceBundleRoot: manifest.storage.intelligenceBundleRoot,
      memoryRoot: manifest.storage.memoryRoot,
      latestRunRoot: manifest.storage.latestRunRoot,
      computeRunIds: manifest.compute.latestRunIds,
    },
  };

  return {
    manifest,
    intelligenceBundle,
    memory: latestMemory,
    memories,
    run: latestRun,
    runs,
    computeRuns,
    certificate,
    memoryEvolution,
    policyUpgrade,
    skillHashes,
    roots: {
      manifestRoot: manifest.storage.manifestRoot,
      intelligenceBundleRoot: manifest.storage.intelligenceBundleRoot,
      memoryRoot: manifest.storage.memoryRoot,
      latestRunRoot: manifest.storage.latestRunRoot,
      checkpointRoot: manifest.memory.checkpointRoot,
      historyRoot: manifest.memory.historyRoot,
      computeRunsRoot: hashCanonicalJson(computeRuns),
      certificateRoot: hashCanonicalJson(certificate),
    },
  };
}

export function replayCodeGuardianRun(run: RunTrace) {
  return {
    runId: run.runId,
    eventCount: run.events.length,
    timeline: run.events.map((event, index) => ({
      index,
      type: event.type,
      at: event.at,
      detail: event.detail,
    })),
    traceRoot: traceRootFromRun(run),
    root: hashCanonicalJson(run),
  };
}

export function writeCodeGuardianArtifacts(
  result: CodeGuardianRunResult | CodeGuardianProofArtifacts,
  directory = "tmp/codeguardian",
) {
  mkdirSync(directory, { recursive: true });
  if ("runs" in result) {
    writeJson(`${directory}/runs.json`, result.runs);
    writeJson(`${directory}/run.json`, result.run);
    writeJson(`${directory}/memory.json`, result.memory);
    writeJson(`${directory}/compute-runs.json`, result.computeRuns);
    writeJson(`${directory}/certificate.json`, result.certificate);
    writeJson(`${directory}/memory-evolution.json`, result.memoryEvolution);
    return;
  }
  writeJson(`${directory}/run.json`, result.run);
  writeJson(`${directory}/memory.json`, result.memory);
  writeJson(`${directory}/compute-runs.json`, result.computeRuns);
  writeJson(`${directory}/certificate.json`, result.certificate);
}

export function codeGuardianSkillHashes() {
  const files = {
    "static-code-review@0.1.0":
      "examples/codeguardian/skills/static-code-review.md",
    "patch-proposal@0.1.0": "examples/codeguardian/skills/patch-proposal.md",
    "critic-loop@0.1.0": "examples/codeguardian/skills/critic-loop-v0.1.0.md",
    "critic-loop@0.1.1": "examples/codeguardian/skills/critic-loop-v0.1.1.md",
    "memory-update-policy@0.1.0":
      "examples/codeguardian/skills/memory-update-policy.md",
  };
  return Object.fromEntries(
    Object.entries(files).map(([name, path]) => [
      name,
      hashFile(path),
    ]),
  );
}

function requireSkillHash(hashes: Record<string, string>, key: string) {
  const value = hashes[key];
  if (!value) {
    throw new Error(`Missing CodeGuardian skill hash: ${key}`);
  }
  return value;
}

export function traceRootFromRun(run: RunTrace) {
  const index = run.events.findIndex((event) => event.type === "trace_committed");
  if (index <= 0) {
    throw new Error(`Run ${run.runId} is missing trace_committed`);
  }
  return hashCanonicalJson(run.events.slice(0, index));
}

function buildRunTrace(
  task: CodeGuardianTask,
  taskIndex: number,
  input: {
    source: "live" | "hybrid" | "mock";
    memoryRoot: string;
    model: string;
    provider: string;
    policyUpgrade?: CodeGuardianPolicyUpgrade;
  },
): RunTrace {
  const targetSource = readFixtureSource(task.targetPath);
  const events: CodeGuardianEvent[] = [
    event("task_received", at(taskIndex, 0), {
      target: task.targetPath,
      goal: task.task,
      source: input.source,
    }),
    event("context_loaded", at(taskIndex, 1), {
      target: task.targetPath,
      sourceHash: hashCanonicalJson({ path: task.targetPath, targetSource }),
      byteLength: targetSource.length,
      source: input.source,
    }),
    event("compute_started", at(taskIndex, 2), {
      runId: task.analysisRunId,
      model: input.model,
      provider: input.provider,
      source: input.source,
    }),
    event("compute_completed", at(taskIndex, 4), {
      runId: task.analysisRunId,
      outputHash: hashCanonicalJson({ issue: task.issue, patch: task.patch }),
      source: input.source,
    }),
    event("issue_found", at(taskIndex, 5), {
      issue: task.issue,
      source: input.source,
    }),
    event("patch_proposed", at(taskIndex, 7), {
      patch: task.patch,
      source: input.source,
    }),
    event("critic_started", at(taskIndex, 8), {
      runId: task.criticRunId,
      model: input.model,
      provider: input.provider,
      source: input.source,
    }),
    event("critic_completed", at(taskIndex, 10), {
      critique: task.critique,
      accepted: true,
      source: input.source,
    }),
    event("memory_delta_created", at(taskIndex, 11), {
      learnedPattern: task.learnedPattern,
      memoryDelta: task.memoryDelta,
      source: input.source,
    }),
    event("memory_written", at(taskIndex, 12), {
      memoryRoot: input.memoryRoot,
      version: taskIndex + 1,
      source: input.source,
    }),
    event("skill_upgrade_checked", at(taskIndex, 13), {
      upgraded: Boolean(input.policyUpgrade),
      upgrade: input.policyUpgrade,
      source: input.source,
    }),
  ];
  const traceRoot = hashCanonicalJson(events);
  events.push(
    event("trace_committed", at(taskIndex, 14), {
      traceRoot,
      source: input.source,
    }),
    event("certificate_issued", at(taskIndex, 15), {
      certificateId,
      source: input.source,
    }),
  );

  return {
    schema: "poi-run/v0.1",
    runId: task.runId,
    agent: "CodeGuardian",
    source: input.source,
    task: task.task,
    events,
    result: {
      issue: task.issue,
      patch: task.patch,
      critique: task.critique,
      accepted: true,
      memoryRoot: input.memoryRoot,
      policyUpgrade: input.policyUpgrade,
    },
  };
}

function createCodeGuardianIntelligenceBundle(
  skillHashes: Record<string, string>,
) {
  return encryptIntelligenceBundle(
    {
      name: "CodeGuardian",
      version: "0.2.0",
      goals: [
        "Audit TypeScript code for correctness and security risks",
        "Propose bounded patches",
        "Self-review every recommendation",
        "Persist learned review patterns across runs",
      ],
      behaviorPolicy:
        "Only run allowlisted demo code-review tasks, never execute untrusted code, and record every analysis, critic, memory, and upgrade event.",
      critiquePolicy:
        "A recommendation is accepted only when the critic confirms it is bounded, testable, and does not expand permissions.",
      privateMemorySeed:
        "Prefer small patches, fail closed on authorization uncertainty, and classify async side-effect failures explicitly.",
      toolPermissions: ["read_fixture", "write_memory", "append_trace"],
      skills: Object.keys(skillHashes),
      capabilities: [
        "static code analysis",
        "patch synthesis",
        "critic self-review",
        "persistent memory update",
        "dynamic critic-policy upgrade",
      ],
      storage: "0G Storage artifact bundle or deterministic hybrid fallback",
      compute: "0G Compute broker path or deterministic hybrid adapter",
      skillHashes,
    },
    { agent: "CodeGuardian" },
  );
}

function event(
  type: string,
  at: string,
  detail: Record<string, unknown>,
): CodeGuardianEvent {
  return {
    type,
    at,
    detail,
    root: hashCanonicalJson({ type, at, detail }),
  };
}

function at(runIndex: number, seconds: number) {
  const baseAt = Date.parse("2026-04-26T00:00:00.000Z");
  return new Date(baseAt + runIndex * 600_000 + seconds * 1000).toISOString();
}

function hashFile(path: string) {
  const content = readFixtureSource(path);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readFixtureSource(
  path = "examples/codeguardian/fixtures/unsafe-parser.ts",
) {
  if (existsSync(path)) {
    return readFileSync(path, "utf8");
  }
  const repoRelative = new URL(`../../../${path}`, import.meta.url);
  if (existsSync(repoRelative)) {
    return readFileSync(repoRelative, "utf8");
  }
  return readFileSync(path, "utf8");
}
