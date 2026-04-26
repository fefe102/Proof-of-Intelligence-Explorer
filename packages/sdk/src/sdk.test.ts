import { describe, expect, it } from "vitest";
import codeguardianBundle from "../fixtures/codeguardian.intelligence.encrypted.json";
import codeguardianManifest from "../fixtures/codeguardian.manifest.json";
import codeguardianMemory from "../fixtures/codeguardian.memory.json";
import codeguardianRun from "../fixtures/codeguardian.run.json";
import {
  ManifestSchema,
  MockComputeAdapter,
  MockStorageAdapter,
  canonicalizeJson,
  createVerifier,
  exportDaBundle,
  hashManifestForProof,
  hashCanonicalJson,
  verifyComputeHistory,
  verifyIntelligenceBundle,
  verifyManifest,
  verifyMemory,
  type ComputeRuns,
  type Manifest,
  type RunTrace,
} from "./index";

describe("Proof-of-Intelligence SDK", () => {
  it("accepts a valid manifest", () => {
    const manifest = verifyManifest(codeguardianManifest);
    expect(manifest.schema).toBe("poi/v0.1");
    expect(hashManifestForProof(manifest)).toBe(manifest.storage.manifestRoot);
  });

  it("rejects an invalid manifest", () => {
    expect(ManifestSchema.safeParse({ schema: "poi/v0.1" }).success).toBe(
      false,
    );
  });

  it("keeps canonical JSON hashing stable regardless of key order", () => {
    const left = { b: 2, a: { d: true, c: ["x"] } };
    const right = { a: { c: ["x"], d: true }, b: 2 };
    expect(canonicalizeJson(left)).toEqual(canonicalizeJson(right));
    expect(hashCanonicalJson(left)).toEqual(hashCanonicalJson(right));
  });

  it("verifies CodeGuardian at the certified tier", async () => {
    const report = await createVerifier().verify("codeguardian");
    expect(report.tier).toBe(6);
    expect(report.status).toBe("verified");
    expect(report.checks.every((check) => check.ok)).toBe(true);
  });

  it("keeps FakeAgent at a low failing tier", async () => {
    const report = await createVerifier().verify("fakeagent");
    expect(report.tier).toBeLessThanOrEqual(1);
    expect(report.status).toBe("failed");
    expect(report.missing).toContain("Proof-of-Intelligence manifest");
  });

  it("detects an intelligence root mismatch", () => {
    const check = verifyIntelligenceBundle(
      codeguardianBundle,
      "sha256:9999999999999999999999999999999999999999999999999999999999999999",
    );
    expect(check.ok).toBe(false);
  });

  it("detects a memory root mismatch", () => {
    const check = verifyMemory(
      codeguardianMemory,
      "sha256:9999999999999999999999999999999999999999999999999999999999999999",
    );
    expect(check.ok).toBe(false);
  });

  it("reduces tier when compute runs are missing", async () => {
    class EmptyComputeAdapter extends MockComputeAdapter {
      override async getRuns(): Promise<ComputeRuns | null> {
        return null;
      }
    }

    const report = await createVerifier({
      compute: new EmptyComputeAdapter(),
    }).verify("codeguardian");
    expect(report.tier).toBe(4);
    expect(report.missing).toContain("0G Compute run history");
  });

  it("reduces tier when the run trace is missing", async () => {
    class MissingTraceStorage extends MockStorageAdapter {
      override async getJsonByRoot<T>(root: string): Promise<T | null> {
        if (root === (codeguardianManifest as Manifest).storage.latestRunRoot) {
          return null;
        }
        return super.getJsonByRoot<T>(root);
      }
    }

    const report = await createVerifier({
      storage: new MissingTraceStorage(),
    }).verify("codeguardian");
    expect(report.tier).toBe(4);
    expect(report.missing).toContain("Executable behavior trace");
  });

  it("does not fail when optional ENS is absent", async () => {
    const manifest = structuredClone(codeguardianManifest) as Manifest;
    delete manifest.identity.ens;
    manifest.storage.manifestRoot = hashManifestForProof(manifest);
    const report = await createVerifier().verify({ manifest });
    expect(report.tier).toBe(6);
    expect(report.checks.find((check) => check.id === "ens")?.ok).toBe(true);
  });

  it("does not require DA evidence for verification", async () => {
    const report = await createVerifier().verify("codeguardian");
    const bundle = await exportDaBundle(report);
    expect(report.tier).toBe(6);
    expect(bundle.schema).toBe("poi-da-bundle/v0.1");
    expect(bundle.roots.length).toBeGreaterThan(0);
  });

  it("reports missing compute ids", () => {
    const check = verifyComputeHistory(
      {
        schema: "poi-compute-runs/v0.1",
        provider: "mock",
        model: "mock",
        runs: [],
      },
      ["missing"],
    );
    expect(check.ok).toBe(false);
  });

  it("validates the bundled run trace root", () => {
    expect(hashCanonicalJson(codeguardianRun as RunTrace)).toBe(
      (codeguardianManifest as Manifest).storage.latestRunRoot,
    );
  });
});
