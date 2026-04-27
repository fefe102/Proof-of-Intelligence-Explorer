import { notFound } from "next/navigation";
import {
  AgentActions,
  Badge,
  Checklist,
  EvidencePanel,
  StatusHeader,
  TierLadder,
} from "../../../components/proof-ui";
import { getAgentProfile, publicStatus } from "../../../lib/proof";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = await params;
  if (agent !== "codeguardian" && agent !== "fakeagent") notFound();
  const profile = await getAgentProfile(agent);
  const report = profile.report;
  const status = publicStatus();

  return (
    <main className="min-h-screen bg-ink text-white">
      <StatusHeader report={report} />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[320px_1fr]">
        <aside>
          <h2 className="text-2xl font-semibold">{profile.name}</h2>
          <p className="mt-3 leading-7 text-slate-400">{profile.description}</p>
          <div className="mt-6">
            <TierLadder tier={report.tier} />
          </div>
          <div className="mt-6">
            <AgentActions
              agent={agent}
              certificateId={report.manifest?.proof.certificateId}
              runId={
                report.manifest?.storage.latestRunRoot
                  ? report.run?.runId
                  : undefined
              }
            />
          </div>
        </aside>
        <div className="space-y-10">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              [
                "Embedded intelligence",
                report.evidence.intelligenceBundleRoot ?? "missing",
              ],
              ["Persistent memory", report.evidence.memoryRoot ?? "missing"],
              [
                "0G Compute history",
                report.computeRuns?.runs.map((run) => run.id).join(", ") ??
                  "missing",
              ],
              ["Executable trace", report.evidence.latestRunRoot ?? "missing"],
              ["Ownership / permissions", report.token?.owner ?? "missing"],
              ["Certificate", report.certificate?.certificateId ?? "missing"],
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
          {agent === "codeguardian" ? (
            <div className="divide-y divide-white/10 border-y border-white/10">
              <div className="py-4">
                <div className="text-sm uppercase text-slate-500">
                  0G Storage proof objects
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  These uploaded object roots back the manifest, encrypted
                  intelligence bundle, memory, live run trace, compute history,
                  and certificate.
                </p>
              </div>
              {status.proofObjects.map((object) => (
                <div
                  key={object.name}
                  className="grid gap-3 py-4 md:grid-cols-[160px_1fr_90px] md:items-center"
                >
                  <div className="font-medium capitalize text-white">
                    {object.name}
                  </div>
                  <div>
                    <code className="block break-all text-xs text-emerald-200">
                      {object.poiRoot}
                    </code>
                    {object.zeroGRootHash ? (
                      <code className="mt-1 block break-all text-xs text-slate-500">
                        {object.zeroGRootHash}
                      </code>
                    ) : null}
                  </div>
                  <Badge tone={object.source === "live" ? "good" : "warn"}>
                    {object.source}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
          <EvidencePanel report={report} />
        </div>
      </section>
    </main>
  );
}
