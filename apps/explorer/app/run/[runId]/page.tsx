import { notFound } from "next/navigation";
import { Badge, RawJsonDetails, RunTimeline } from "../../../components/proof-ui";
import { getRun } from "../../../lib/proof";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  let run;
  try {
    run = getRun(runId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <section className="border-b border-white/10 bg-[#171917] px-5 py-10">
        <div className="mx-auto max-w-7xl">
          <Badge>{run.source}</Badge>
          <h1 className="mt-5 text-4xl font-semibold">Replay {run.runId}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">{run.task}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_360px]">
        <RunTimeline run={run} />
        <aside className="border-t border-white/10 pt-5">
          <div className="text-sm uppercase text-slate-500">Result</div>
          <p className="mt-3 text-slate-300">{run.result.issue}</p>
          <RawJsonDetails
            title="Raw result JSON"
            summary="Patch, critique, and roots"
            value={run.result}
            className="mt-5"
          />
        </aside>
      </section>
    </main>
  );
}
