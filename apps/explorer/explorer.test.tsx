import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import AdminPage from "./app/admin/page";
import CodeGuardianConsolePage from "./app/agent/codeguardian/console/page";
import AgentPage from "./app/agent/[agent]/page";
import { GET as BadgeGET } from "./app/badge/[chainId]/[contract]/[tokenId].svg/route";
import CertificatePage from "./app/certificate/[certificateId]/page";
import CreatePage from "./app/create/page";
import HomePage from "./app/page";
import PassportPage from "./app/passport/[chainId]/[contract]/[tokenId]/page";
import RunPage from "./app/run/[runId]/page";
import VerifyPage from "./app/verify/page";
import { GET as VerifyGET } from "./app/api/verify/route";
import { adminJson } from "./app/api/admin/_shared";
import { adminOperationBody, validateAdminRequest } from "./lib/admin";
import { publicStatus, seededCodeGuardianTarget } from "./lib/proof";

const originalEnv = { ...process.env };
const adminTokenName = "POI_ADMIN_TOKEN";
const privateKeyName = "0G_PRIVATE_KEY";
const bearerName = "0G_COMPUTE_BEARER_TOKEN";

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("explorer app smoke tests", () => {
  it("home page renders", async () => {
    const html = renderToString(await HomePage());
    expect(html).toContain("CodeGuardian iNFT");
    expect(html).toContain("Autonomous 0G code-review iNFT");
    expect(html).toContain("Open Agent Console");
  });

  it("verify page has arbitrary token form", async () => {
    const html = renderToString(
      await VerifyPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Contract");
    expect(html).toContain("Token ID");
    expect(html).toContain("Open Passport");
  });

  it("create page renders Passport wizard", async () => {
    const html = renderToString(
      await CreatePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Create Passport");
    expect(html).toContain("Manifest root");
    expect(html).toContain("Badge embed");
  });

  it("CodeGuardian page renders high-tier verification", async () => {
    const html = renderToString(
      await AgentPage({ params: Promise.resolve({ agent: "codeguardian" }) }),
    );
    expect(html).toContain("CodeGuardian");
    expect(html).toContain("Certified");
    expect(html).toContain("Encrypted intelligence bundle");
  });

  it("Agent Console renders memory evolution and upgrade", async () => {
    const html = renderToString(
      await CodeGuardianConsolePage({
        searchParams: Promise.resolve({ preview: "allowlisted-demo" }),
      }),
    );
    expect(html).toContain("Autonomous code-review agent console");
    expect(html).toContain("Memory evolution");
    expect(html).toContain("critic-loop");
    expect(html).toContain("Hybrid preview generated");
  });

  it("FakeAgent page renders failures", async () => {
    const html = renderToString(
      await AgentPage({ params: Promise.resolve({ agent: "fakeagent" }) }),
    );
    expect(html).toContain("FakeAgent");
    expect(html).toContain("Proof-of-Intelligence manifest");
    expect(html).toContain("fail");
  });

  it("replay page renders the timeline", async () => {
    const html = renderToString(
      await RunPage({
        params: Promise.resolve({ runId: "codeguardian-run-001" }),
      }),
    );
    expect(html).toContain("task_received");
    expect(html).toContain("Task received");
    expect(html).toContain("CodeGuardian accepted the allowlisted audit task");
    expect(html).toContain("Raw event JSON");
    expect(html).toContain("certificate_issued");
  });

  it("all CodeGuardian demo run pages render", async () => {
    for (const runId of [
      "codeguardian-run-001",
      "codeguardian-run-002",
      "codeguardian-run-003",
    ]) {
      const html = renderToString(
        await RunPage({
          params: Promise.resolve({ runId }),
        }),
      );
      expect(html).toContain(runId);
      expect(html).toContain("memory_delta_created");
    }
  });

  it("certificate page renders certificate", async () => {
    const html = renderToString(
      await CertificatePage({
        params: Promise.resolve({ certificateId: "poi-cert-codeguardian-001" }),
      }),
    );
    expect(html).toContain("Proof-of-Intelligence Certificate");
    expect(html).toContain("CodeGuardian");
  });

  it("dynamic passport page works", async () => {
    const target = seededCodeGuardianTarget();
    const html = renderToString(
      await PassportPage({
        params: Promise.resolve({
          chainId: String(target.chainId),
          contract: target.contract,
          tokenId: target.tokenId,
        }),
      }),
    );
    expect(html).toContain("Passport #");
    expect(html).toContain("Badge embed");
    expect(html).toContain(target.contract);
  });

  it("admin page does not expose secrets", () => {
    process.env[adminTokenName] = "fixture-admin-token-alpha";
    process.env[privateKeyName] = "fixture-wallet-material";
    const html = renderToString(<AdminPage />);
    expect(html).not.toContain("fixture-admin-token-alpha");
    expect(html).not.toContain("fixture-wallet-material");
  });
});

describe("public API and badge routes", () => {
  it("verify API supports aliases", async () => {
    const response = await VerifyGET(
      new NextRequest("https://example.test/api/verify?agent=codeguardian"),
    );
    const json = await response.json();
    expect(json.tier).toBeGreaterThanOrEqual(5);
  });

  it("verify API supports arbitrary contract/token input", async () => {
    const target = seededCodeGuardianTarget();
    const response = await VerifyGET(
      new NextRequest(
        `https://example.test/api/verify?chainId=${target.chainId}&contract=${target.contract}&tokenId=${target.tokenId}`,
      ),
    );
    const json = await response.json();
    expect(json.tier).toBe(6);
    expect(json.token.contract).toBe(target.contract);
  });

  it("badge SVG endpoint works", async () => {
    const target = seededCodeGuardianTarget();
    const response = await BadgeGET(new Request("https://example.test") as never, {
      params: Promise.resolve({
        chainId: String(target.chainId),
        contract: target.contract,
        tokenId: target.tokenId,
      }),
    });
    const svg = await response.text();
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(svg).toContain("Proof of Intelligence");
    expect(svg).toContain("Tier 6");
  });
});

describe("admin route security", () => {
  it("rejects a missing token", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env.POI_ENABLE_LIVE_WRITES = "true";
    const result = validateAdminRequest({ headers: new Headers() });
    expect(result?.status).toBe(401);
  });

  it("rejects an invalid token", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env.POI_ENABLE_LIVE_WRITES = "true";
    const result = validateAdminRequest({
      headers: new Headers({ authorization: "Bearer wrong" }),
    });
    expect(result?.status).toBe(401);
  });

  it("accepts a valid token only when live writes are enabled", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env.POI_ENABLE_LIVE_WRITES = "true";
    const result = validateAdminRequest({
      headers: new Headers({ authorization: "Bearer fixture-admin-token" }),
    });
    expect(result).toBeNull();
  });

  it("accepts x-poi-admin-token and rejects valid token when writes are disabled", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env.POI_ENABLE_LIVE_WRITES = "true";
    expect(
      validateAdminRequest({
        headers: new Headers({ "x-poi-admin-token": "fixture-admin-token" }),
      }),
    ).toBeNull();

    process.env.POI_ENABLE_LIVE_WRITES = "false";
    const result = validateAdminRequest({
      headers: new Headers({ authorization: "Bearer fixture-admin-token" }),
    });
    expect(result?.status).toBe(403);
  });

  it("marks admin responses as non-cacheable", () => {
    const response = adminJson({ ok: false }, 403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not return secrets from admin operation bodies", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env[privateKeyName] = "fixture-wallet-material";
    const body = JSON.stringify(adminOperationBody("deploy"));
    expect(body).not.toContain("fixture-admin-token");
    expect(body).not.toContain("fixture-wallet-material");
  });

  it("public status does not expose private env values", () => {
    process.env[adminTokenName] = "fixture-admin-token";
    process.env[privateKeyName] = "fixture-wallet-material";
    process.env[bearerName] = "fixture-bearer";
    const body = JSON.stringify(publicStatus());
    expect(body).not.toContain("fixture-admin-token");
    expect(body).not.toContain("fixture-wallet-material");
    expect(body).not.toContain("fixture-bearer");
  });
});
