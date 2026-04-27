import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AgentActions,
  Checklist,
  EvidenceObjects,
  EvidencePanel,
  StatusHeader,
  TierLadder,
} from "../../../../../components/proof-ui";
import {
  badgePath,
  getPassportForTarget,
  getProofObjects,
  parsePassportTarget,
  passportPath,
  storageScanSearchUrl,
} from "../../../../../lib/proof";

export default async function PassportPage({
  params,
}: {
  params: Promise<{ chainId: string; contract: string; tokenId: string }>;
}) {
  let result: Awaited<ReturnType<typeof getPassportForTarget>>;
  let target: ReturnType<typeof parsePassportTarget>;
  try {
    target = parsePassportTarget(await params);
    result = await getPassportForTarget(target);
  } catch {
    notFound();
  }
  const { passport, report } = result;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://proof-of-intelligence-explorer.vercel.app";
  const badgeUrl = `${origin}${badgePath(target)}`;
  const pageUrl = `${origin}${passportPath(target)}`;
  const apiUrl = `${origin}/api/passport/${target.chainId}/${target.contract}/${target.tokenId}`;

  return (
    <main className="min-h-screen bg-ink text-white">
      <StatusHeader report={report} />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[320px_1fr]">
        <aside>
          <h2 className="break-all text-2xl font-semibold">
            Passport #{passport.tokenId}
          </h2>
          <p className="mt-3 break-all leading-7 text-slate-400">
            {passport.contract}
          </p>
          <div className="mt-6">
            <TierLadder tier={passport.verificationTier} />
          </div>
          <div className="mt-6">
            <AgentActions
              agent={report.agent}
              certificateId={report.manifest?.proof.certificateId}
              runId={report.run?.runId}
            />
          </div>
        </aside>
        <div className="space-y-10">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["Owner", passport.owner ?? "missing"],
              ["Manifest root", passport.manifestRoot ?? "missing"],
              ["Intelligence root", passport.intelligenceRoot ?? "missing"],
              ["Memory root", passport.memoryRoot ?? "missing"],
              ["Latest run root", passport.latestRunRoot ?? "missing"],
              [
                "Compute run IDs",
                passport.computeRunIds.length
                  ? passport.computeRunIds.join(", ")
                  : "missing",
              ],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-white/10 pt-4">
                <div className="text-sm uppercase text-slate-500">{label}</div>
                <div className="mt-2 break-all text-sm text-slate-200">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <Checklist report={report} />

          {report.agent === "codeguardian" ? (
            <EvidenceObjects
              objects={getProofObjects()}
              storageScanUrl={storageScanSearchUrl()}
            />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">
                Public API
              </div>
              <code className="mt-3 block break-all text-xs text-emerald-200">
                {apiUrl}
              </code>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">
                Badge embed
              </div>
              <code className="mt-3 block break-all text-xs text-emerald-200">
                {`[![Proof of Intelligence](${badgeUrl})](${pageUrl})`}
              </code>
              <div className="mt-4">
                <img alt="Proof of Intelligence badge" src={badgeUrl} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#121412]"
              href={`/api/verify?chainId=${target.chainId}&contract=${target.contract}&tokenId=${target.tokenId}`}
            >
              Export JSON proof
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              href={badgePath(target)}
            >
              Open badge SVG
            </Link>
          </div>

          <EvidencePanel report={report} />
        </div>
      </section>
    </main>
  );
}
