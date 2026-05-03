import { badgeStatusForTier } from "@poi/sdk";
import { parsePassportTarget, verifyPassportTarget } from "../../../../../lib/proof";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      chainId?: string;
      contract?: string;
      tokenId?: string;
      "tokenId.svg"?: string;
    }>;
  },
) {
  let label = "Unknown";
  let color = "#64748b";
  try {
    const report = await verifyPassportTarget(
      parsePassportTarget(normalizeBadgeParams(await params)),
    );
    label = badgeStatusForTier(report.tier);
    color =
      report.tier >= 6 ? "#10b981" : report.tier >= 2 ? "#f59e0b" : "#ef4444";
  } catch {
    label = "Unknown";
  }

  const rightWidth = Math.max(78, label.length * 8 + 22);
  const width = 154 + rightWidth;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img" aria-label="Proof of Intelligence: ${escapeXml(label)}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-opacity=".08"/></linearGradient>
  <rect width="${width}" height="28" rx="4" fill="#111827"/>
  <rect x="154" width="${rightWidth}" height="28" fill="${color}"/>
  <rect width="${width}" height="28" rx="4" fill="url(#s)"/>
  <text x="77" y="18" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="12" text-anchor="middle">Proof of Intelligence</text>
  <text x="${154 + rightWidth / 2}" y="18" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="600" text-anchor="middle">${escapeXml(label)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function normalizeBadgeParams(params: {
  chainId?: string;
  contract?: string;
  tokenId?: string;
  "tokenId.svg"?: string;
}) {
  const rawTokenId = params.tokenId ?? params["tokenId.svg"] ?? "";
  return {
    chainId: params.chainId,
    contract: params.contract,
    tokenId: rawTokenId.endsWith(".svg")
      ? rawTokenId.slice(0, -".svg".length)
      : rawTokenId,
  };
}
