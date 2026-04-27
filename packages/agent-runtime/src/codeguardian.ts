import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  hashCanonicalJson,
  type Certificate,
  type ComputeRuns,
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

type CodeGuardianAnalysis = {
  issue: string;
  patch: string;
  promptHash: string;
  outputHash: string;
  runId?: string;
};

type CodeGuardianCritic = {
  critique: string;
  promptHash: string;
  outputHash: string;
  accepted: boolean;
  runId?: string;
};

export type CodeGuardianOptions = {
  source?: "live" | "hybrid" | "mock";
  runId?: string;
  targetPath?: string;
  targetSource?: string;
  model?: string;
  provider?: string;
  analysis?: CodeGuardianAnalysis;
  critic?: CodeGuardianCritic;
};

export class MockCodeGuardianCompute {
  analyze(source: string): CodeGuardianAnalysis {
    const hasUnsafeParse =
      source.includes("JSON.parse") && source.includes("as Result");
    return {
      issue: hasUnsafeParse
        ? "Unsafe JSON.parse path returns unvalidated data as a trusted Result."
        : "No deterministic fixture issue found.",
      patch:
        "Parse JSON as unknown, validate that value is an object with ok:boolean and value:string, then return Result.",
      promptHash: hashCanonicalJson({ task: "analysis", source }),
      outputHash: hashCanonicalJson({
        issue: hasUnsafeParse,
        patch: "validate-result-shape",
      }),
    };
  }

  critique(issue: string, patch: string): CodeGuardianCritic {
    return {
      critique:
        "The patch is bounded, keeps the public API stable, and makes the unsafe cast explicit.",
      promptHash: hashCanonicalJson({ task: "critic", issue, patch }),
      outputHash: hashCanonicalJson({
        accepted: true,
        critique: "bounded-shape-validation",
      }),
      accepted: true,
    };
  }
}

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
  private readonly compute = new MockCodeGuardianCompute();
  readonly state = new InMemoryStateStore();
  readonly log = new InMemoryTraceLog();

  run(options: CodeGuardianOptions = {}): CodeGuardianRunResult {
    const runId = options.runId ?? "codeguardian-run-001";
    const source =
      options.targetSource ?? readFixtureSource(options.targetPath);
    const mode = options.source ?? "hybrid";
    const memoryRootBefore = this.state.root();
    const baseAt = Date.parse("2026-04-26T00:00:00.000Z");
    const at = (seconds: number) =>
      new Date(baseAt + seconds * 1000).toISOString();

    const analysis = options.analysis ?? this.compute.analyze(source);
    const critic =
      options.critic ?? this.compute.critique(analysis.issue, analysis.patch);
    const analysisRunId = analysis.runId ?? "zg-compute-analysis-001";
    const criticRunId = critic.runId ?? "zg-compute-critic-001";
    const model = options.model ?? "qwen/qwen-2.5-7b-instruct";
    const provider = options.provider ?? "0G Compute mock/hybrid";

    this.append("task_received", at(0), {
      target:
        options.targetPath ?? "examples/codeguardian/fixtures/unsafe-parser.ts",
    });
    this.append("compute_started", at(1), {
      runId: analysisRunId,
      model,
      provider,
    });
    this.append("compute_completed", at(4), {
      outputHash: analysis.outputHash,
    });
    this.append("issue_found", at(5), { issue: analysis.issue });
    this.append("patch_proposed", at(7), { patch: analysis.patch });
    this.append("critic_started", at(8), {
      runId: criticRunId,
      model,
      provider,
    });
    this.append("critic_completed", at(10), {
      critique: critic.critique,
      accepted: critic.accepted,
    });

    const memory: MemoryState = {
      schema: "poi-memory/v0.1",
      agent: "CodeGuardian",
      checkpoint: {
        runCount: 1,
        lastFinding: analysis.issue,
        stateRoot: hashCanonicalJson({
          issue: analysis.issue,
          patch: analysis.patch,
          critique: critic.critique,
        }),
      },
      history: [
        {
          runId,
          summary: "Found unsafe parsing and proposed shape validation.",
          root: hashCanonicalJson({ runId, issue: analysis.issue }),
        },
      ],
    };
    this.state.set("memory", memory);
    const memoryRootAfter = hashCanonicalJson(memory);
    this.append("memory_written", at(11), { memoryRoot: memoryRootAfter });
    this.append("trace_committed", at(12), { traceRoot: this.log.root() });
    this.append("certificate_issued", at(13), {
      certificateId: "poi-cert-codeguardian-001",
    });

    const run: RunTrace = {
      schema: "poi-run/v0.1",
      runId,
      agent: "CodeGuardian",
      source: mode,
      task: "Audit examples/codeguardian/fixtures/unsafe-parser.ts",
      events: this.log.events,
      result: {
        issue: analysis.issue,
        patch: analysis.patch,
        critique: critic.critique,
        accepted: critic.accepted,
      },
    };

    const computeRuns: ComputeRuns = {
      schema: "poi-compute-runs/v0.1",
      provider,
      model,
      runs: [
        {
          id: analysisRunId,
          type: "analysis",
          promptHash: analysis.promptHash,
          outputHash: analysis.outputHash,
          at: at(4),
          source: mode,
        },
        {
          id: criticRunId,
          type: "critic",
          promptHash: critic.promptHash,
          outputHash: critic.outputHash,
          at: at(10),
          source: mode,
        },
      ],
    };

    const certificate: Certificate = {
      schema: "poi-certificate/v0.1",
      certificateId: "poi-cert-codeguardian-001",
      agent: "CodeGuardian",
      tier: 6,
      issuedAt: at(13),
      issuer: "Proof-of-Intelligence Explorer",
      evidence: {
        inft: {
          chainId: 16602,
          contract: "0x1111111111111111111111111111111111117857",
          tokenId: "1",
        },
        intelligenceBundleRoot:
          "sha256:1c47d70c2c89e0d843c1b8501e98f5bd2354f7b03b994e1b819b2fbc54b87fd4",
        memoryRoot: memoryRootAfter,
        latestRunRoot: hashCanonicalJson(run),
        computeRunIds: computeRuns.runs.map((item) => item.id),
      },
    };

    return {
      run,
      memory,
      computeRuns,
      certificate,
      memoryRootBefore,
      memoryRootAfter,
    };
  }

  private append(type: string, at: string, detail: Record<string, unknown>) {
    const event: CodeGuardianEvent = {
      type,
      at,
      detail,
      root: hashCanonicalJson({ type, at, detail }),
    };
    this.log.append(event);
  }
}

export function runCodeGuardian(options: CodeGuardianOptions = {}) {
  return new CodeGuardian().run(options);
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
    root: hashCanonicalJson(run),
  };
}

export function writeCodeGuardianArtifacts(
  result: CodeGuardianRunResult,
  directory = "tmp/codeguardian",
) {
  mkdirSync(directory, { recursive: true });
  writeJson(`${directory}/run.json`, result.run);
  writeJson(`${directory}/memory.json`, result.memory);
  writeJson(`${directory}/compute-runs.json`, result.computeRuns);
  writeJson(`${directory}/certificate.json`, result.certificate);
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
