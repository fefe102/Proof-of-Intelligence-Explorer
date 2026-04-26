export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">0G iNFT proof layer</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight">Proof-of-Intelligence Explorer</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          Verify that a 0G iNFT agent actually contains encrypted intelligence, persistent memory,
          compute-backed runs, and replayable behavior.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-md bg-signal px-5 py-3 font-semibold text-ink" href="/agent/codeguardian">
            Verify CodeGuardian
          </a>
          <a className="rounded-md border border-slate-600 px-5 py-3 font-semibold text-slate-100" href="/agent/fakeagent">
            Try FakeAgent
          </a>
        </div>
      </section>
    </main>
  );
}
