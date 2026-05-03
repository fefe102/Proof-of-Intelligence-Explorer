import { describe, expect, it } from "vitest";
import {
  CodeGuardian,
  codeGuardianSkillHashes,
  replayCodeGuardianRun,
  runCodeGuardian,
  runCodeGuardianSequence,
  traceRootFromRun,
} from "./index";

describe("CodeGuardian runtime", () => {
  it("creates a run trace", () => {
    const result = runCodeGuardian();
    expect(result.run.runId).toBe("codeguardian-run-001");
    expect(result.run.events.map((event) => event.type)).toContain("issue_found");
  });

  it("writes mutable state", () => {
    const agent = new CodeGuardian();
    const result = agent.run();
    expect(agent.state.get("memory")).toEqual(result.memory);
  });

  it("appends immutable log events", () => {
    const agent = new CodeGuardian();
    agent.run();
    expect(agent.log.events.length).toBeGreaterThanOrEqual(13);
    expect(agent.log.events[0]?.type).toBe("task_received");
  });

  it("appends a critic loop event", () => {
    const result = runCodeGuardian();
    expect(result.run.events.some((event) => event.type === "critic_completed")).toBe(true);
    expect(result.run.result.accepted).toBe(true);
  });

  it("changes the memory root after a run", () => {
    const result = runCodeGuardian();
    expect(result.memoryRootAfter).not.toEqual(result.memoryRootBefore);
  });

  it("replays events from the trace", () => {
    const result = runCodeGuardian();
    const replay = replayCodeGuardianRun(result.run);
    expect(replay.eventCount).toBe(result.run.events.length);
    expect(replay.timeline.at(-1)?.type).toBe("certificate_issued");
  });

  it("creates three autonomous runs with evolving memory roots", () => {
    const result = runCodeGuardianSequence();
    expect(result.runs.map((run) => run.runId)).toEqual([
      "codeguardian-run-001",
      "codeguardian-run-002",
      "codeguardian-run-003",
    ]);
    const roots = result.memoryEvolution.map((item) => item.memoryRoot);
    expect(new Set(roots).size).toBe(3);
    expect(result.roots.memoryRoot).toBe(roots.at(-1));
  });

  it("keeps the latest run coherent with the async side-effect task", () => {
    const result = runCodeGuardianSequence();
    const latest = result.runs.at(-1);
    expect(latest?.runId).toBe("codeguardian-run-003");
    expect(latest?.task).toContain("async side effects");
    expect(latest?.result.issue).toContain("awaited side effect");
    expect(latest?.result.patch).toContain("typed failure result");
    expect(latest?.result.patchDiff).toContain("saveAuditResult");
    expect(latest?.result.patchDiff).toContain("try");
    expect(latest?.result.patchDiff).toContain("catch");
    expect(latest?.result.issue).not.toContain("JSON.parse");
  });

  it("records dynamic critic policy upgrade evidence", () => {
    const result = runCodeGuardianSequence();
    expect(result.policyUpgrade.oldVersion).toBe("0.1.0");
    expect(result.policyUpgrade.newVersion).toBe("0.1.1");
    expect(result.policyUpgrade.oldHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.policyUpgrade.newHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.policyUpgrade.oldHash).not.toBe(result.policyUpgrade.newHash);
    expect(
      result.runs
        .find((run) => run.runId === "codeguardian-run-002")
        ?.events.some((event) => event.type === "skill_upgrade_checked"),
    ).toBe(true);
  });

  it("recomputes trace roots for every run", () => {
    const result = runCodeGuardianSequence();
    for (const run of result.runs) {
      const committed = run.events.find(
        (event) => event.type === "trace_committed",
      );
      expect(committed?.detail.traceRoot).toBe(traceRootFromRun(run));
      expect(String(committed?.detail.traceRoot)).not.toContain(
        "0000000000000000000000000000000000000000000000000000000000000000",
      );
    }
  });

  it("hashes real skill policy files", () => {
    const hashes = codeGuardianSkillHashes();
    expect(hashes["static-code-review@0.1.0"]).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(Object.values(hashes).join("\n")).not.toContain("888888");
  });
});
