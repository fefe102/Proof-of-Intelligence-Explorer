import Link from "next/link";
import {
  badgePath,
  getAgentProfile,
  passportPath,
  publicStatus,
  seededCodeGuardianTarget,
} from "../lib/proof";
import { Badge, TierLadder } from "../components/proof-ui";

export default async function HomePage() {
  const [codeguardian, fakeagent] = await Promise.all([
    getAgentProfile("codeguardian"),
    getAgentProfile("fakeagent"),
  ]);
  const status = publicStatus();
  const demoTarget = seededCodeGuardianTarget();

  return (
    <main className="bg-ink text-white">
      <section className="min-h-[calc(100svh-64px)] border-b border-white/10 px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="good">{status.mode} 0G evidence mode</Badge>
            <p className="mt-5 text-sm uppercase text-slate-500">
              CodeGuardian iNFT + AgentProof
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
              Autonomous 0G code-review iNFT.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              CodeGuardian's encrypted intelligence bundle, evolving memory,
              compute-backed critic loop, replayable traces, and dynamic policy
              upgrade are certified through AgentProof - the
              Proof-of-Intelligence Explorer for 0G iNFT agents.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-emerald-300 px-5 py-3 font-semibold text-[#121412]"
                href="/agent/codeguardian/console"
              >
                Open Agent Console
              </Link>
              <Link
                className="rounded-md border border-white/15 px-5 py-3 font-semibold text-slate-100"
                href="/verify"
              >
                Verify Any iNFT
              </Link>
              <Link
                className="rounded-md border border-white/15 px-5 py-3 font-semibold text-slate-100"
                href="/agent/fakeagent"
              >
                Show FakeAgent Failing
              </Link>
            </div>
            <div className="mt-8 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="text-sm uppercase text-slate-500">
                Public badge
              </div>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                {`[![Proof of Intelligence](${badgePath(demoTarget)})](${passportPath(demoTarget)})`}
              </code>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-md border border-white/10 bg-[#171917] p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-amber-300 to-transparent" />
            <div className="text-sm uppercase text-slate-500">
              Live verifier readout
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
              <div className="text-3xl font-semibold">
                  CodeGuardian iNFT
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {codeguardian.headline}
                </p>
                <div className="mt-6">
                  <TierLadder tier={codeguardian.report.tier} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold">{fakeagent.name}</div>
                <p className="mt-2 text-sm text-slate-400">
                  {fakeagent.headline}
                </p>
                <div className="mt-6">
                  <TierLadder tier={fakeagent.report.tier} />
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                {Object.entries(status.proofLayers).map(([layer, mode]) => (
                  <div
                    key={layer}
                    className="flex items-center justify-between border-b border-white/10 pb-2"
                  >
                    <span className="capitalize text-slate-400">{layer}</span>
                    <Badge
                      tone={
                        mode === "live"
                          ? "good"
                          : mode === "hybrid"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {mode}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-sm uppercase text-slate-500">
                Latest run root
              </div>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                {codeguardian.report.evidence.latestRunRoot}
              </code>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <div>
              <h2 className="text-2xl font-semibold">0G evidence bundle</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Public proof objects are uploaded to 0G Storage and
                cross-checked against the manifest, registry, run trace, and
                certificate roots.
              </p>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {status.proofObjects.slice(0, 6).map((object) => (
                <div
                  key={object.name}
                  className="grid gap-3 py-4 md:grid-cols-[150px_1fr_80px] md:items-center"
                >
                  <div className="font-medium capitalize">{object.name}</div>
                  <div className="space-y-1">
                    <code className="block break-all text-xs text-emerald-200">
                      {object.poiRoot}
                    </code>
                    {object.zeroGRootHash ? (
                      <code className="block break-all text-xs text-slate-500">
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
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          {[
            [
              "Why Proof-of-Intelligence?",
              "Many agent NFTs are metadata pointers. CodeGuardian is the autonomous iNFT; AgentProof proves its intelligence, memory, compute history, and behavior traces.",
            ],
            [
              "0G full-stack evidence",
              "0G Chain anchors the minted iNFT, Storage carries encrypted proof artifacts or hybrid fallbacks, Compute records analysis and critic runs, and DA export is optional.",
            ],
            [
              "Developer SDK",
              "Any 0G iNFT team can reuse AgentProof's manifest schema, adapters, CLI, API, badge, and proof export to make intelligence claims verifiable.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="border-t border-white/10 pt-5">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
