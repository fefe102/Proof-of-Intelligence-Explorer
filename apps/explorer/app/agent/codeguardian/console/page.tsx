import Link from "next/link";
import { CopyButton } from "../../../../components/copy-button";
import {
  Badge,
  EvidenceObjects,
  TierLadder,
} from "../../../../components/proof-ui";
import {
  getCodeGuardianConsole,
  passportPath,
  seededCodeGuardianTarget,
  storageScanSearchUrl,
} from "../../../../lib/proof";

export default async function CodeGuardianConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const params = await searchParams;
  const consoleState = await getCodeGuardianConsole();
  const report = consoleState.profile.report;
  const latestRun = consoleState.latestRun;
  const minted = consoleState.mintedInft;
  const passportUrl = passportPath(seededCodeGuardianTarget());
  const previewActive = params.preview === "allowlisted-demo";

  return (
    <main className="min-h-screen bg-ink text-white">
      <section className="border-b border-white/10 bg-[#171917] px-5 py-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">CodeGuardian iNFT</Badge>
              {report.sources.map((source) => (
                <Badge key={source}>{source}</Badge>
              ))}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Autonomous code-review agent console
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              CodeGuardian is a minted 0G Agentic ID / ERC-7857-style iNFT. It
              audits allowlisted TypeScript fixtures, proposes a patch, runs a
              critic loop, writes memory, checks policy upgrades, commits a
              trace, and emits a certificate.
            </p>
          </div>
          <div className="border-l border-white/10 pl-6">
            <div className="text-sm uppercase text-slate-500">Current status</div>
            <div className="mt-2 text-3xl font-semibold">Certified</div>
            <div className="mt-5">
              <TierLadder tier={report.tier} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-8">
          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">Current goal</div>
            <p className="mt-2 text-slate-200">
              Find one concrete correctness or security risk, propose a bounded
              patch, self-review it, and persist the learned pattern.
            </p>
          </div>

          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">
              Minted Agentic ID / iNFT
            </div>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Chain", `${minted.chain} (${minted.chainId})`],
                ["Contract", minted.contract],
                ["Token", minted.tokenId],
                ["Owner", minted.owner ?? "unknown"],
                ["Registry", minted.registry],
                ["Certificate", minted.certificateRecordId ?? "missing"],
              ].map(([label, value]) => {
                const stringValue = value ?? "missing";
                return (
                  <div key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="mt-1 flex flex-wrap items-start gap-2">
                      <span className="min-w-0 flex-1 break-all text-slate-200">
                        {stringValue}
                      </span>
                      {label === "Contract" || label === "Owner" || label === "Registry" ? (
                        <CopyButton value={stringValue} label="Copy" />
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="grid gap-3">
            <Link
              className="rounded-md bg-emerald-300 px-4 py-3 text-center text-sm font-semibold text-[#121412]"
              href="/agent/codeguardian/console?preview=allowlisted-demo"
            >
              Run CodeGuardian on demo file
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
              href="/agent/codeguardian/review"
            >
              Review a pasted diff
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
              href="#memory-evolution"
            >
              View memory evolution
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
              href={`/run/${latestRun?.runId ?? "codeguardian-run-003"}`}
            >
              Replay latest run
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
              href={`/certificate/${report.certificate?.certificateId ?? "poi-cert-codeguardian-001"}`}
            >
              View certificate
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
              href={passportUrl}
            >
              Verify Proof-of-Intelligence
            </Link>
            {minted.chainUrl ? (
              <Link
                className="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
                href={minted.chainUrl}
              >
                Open minted iNFT on 0G explorer
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="space-y-10">
          {previewActive ? (
            <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 p-4">
              <div className="font-semibold text-emerald-100">
                Hybrid preview generated
              </div>
              <p className="mt-2 text-sm text-emerald-50/80">
                This button runs only the allowlisted deterministic demo task.
                It does not accept user code, execute shell commands, send
                transactions, or expose write credentials.
              </p>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Run count", String(consoleState.runs.length)],
              [
                "Memory version",
                String(consoleState.memoryEvolution.at(-1)?.version ?? 0),
              ],
              ["Latest run", latestRun?.runId ?? "missing"],
              [
                "Latest memory root",
                report.evidence.memoryRoot ?? "missing",
              ],
              [
                "Latest analysis",
                consoleState.latestAnalysis?.id ?? "missing",
              ],
              ["Latest critic", consoleState.latestCritic?.id ?? "missing"],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-white/10 pt-4">
                <div className="text-sm uppercase text-slate-500">{label}</div>
                <div className="mt-2 break-all text-sm text-slate-200">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <section className="border-y border-white/10 py-5">
            <div className="text-sm uppercase text-slate-500">Task queue</div>
            <div className="mt-4 divide-y divide-white/10">
              {consoleState.runs.map((run, index) => (
                <Link
                  key={run.runId}
                  className="grid gap-3 py-4 md:grid-cols-[90px_1fr_100px]"
                  href={`/run/${run.runId}`}
                >
                  <span className="text-slate-500">#{index + 1}</span>
                  <span>
                    <span className="block font-medium text-white">
                      {run.runId}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {run.task}
                    </span>
                  </span>
                  <Badge>{run.source}</Badge>
                </Link>
              ))}
            </div>
          </section>

          <section id="memory-evolution" className="border-y border-white/10 py-5">
            <div className="text-sm uppercase text-slate-500">
              Memory evolution
            </div>
            <div className="mt-4 grid gap-4">
              {consoleState.memoryEvolution.map((item) => (
                <div
                  key={item.runId}
                  className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[100px_1fr]"
                >
                  <div>
                    <Badge tone="warn">v{item.version}</Badge>
                  </div>
                  <div>
                    <Link
                      className="font-semibold text-white"
                      href={`/run/${item.runId}`}
                    >
                      {item.runId}
                    </Link>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.learnedPattern}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.memoryDelta}
                    </p>
                    <div className="mt-3 flex flex-wrap items-start gap-2">
                      <code className="block min-w-0 flex-1 break-all text-xs text-emerald-200">
                        memory {item.memoryRoot}
                      </code>
                      <CopyButton value={item.memoryRoot} label="Copy memory" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-start gap-2">
                      <code className="block min-w-0 flex-1 break-all text-xs text-slate-400">
                        trace {item.traceRoot}
                      </code>
                      <CopyButton value={item.traceRoot} label="Copy trace" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">
                Latest compute analysis
              </div>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                {consoleState.latestAnalysis?.id ?? "missing"}
              </code>
              <p className="mt-3 text-sm text-slate-400">
                {latestRun?.result.issue}
              </p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">
                Latest critic reflection
              </div>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                {consoleState.latestCritic?.id ?? "missing"}
              </code>
              <p className="mt-3 text-sm text-slate-400">
                {latestRun?.result.critique}
              </p>
            </div>
          </section>

          {consoleState.policyUpgrade ? (
            <section className="border-y border-white/10 py-5">
              <div className="text-sm uppercase text-slate-500">
                Dynamic skill / policy upgrade
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                {consoleState.policyUpgrade.skill}{" "}
                {consoleState.policyUpgrade.oldVersion} {"->"}{" "}
                {consoleState.policyUpgrade.newVersion}
              </h2>
              <p className="mt-3 text-slate-300">
                {consoleState.policyUpgrade.reason}
              </p>
              <div className="mt-4 flex flex-wrap items-start gap-2">
                <code className="block min-w-0 flex-1 break-all text-xs text-slate-400">
                  old {consoleState.policyUpgrade.oldHash}
                </code>
                <CopyButton value={consoleState.policyUpgrade.oldHash} label="Copy old" />
              </div>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <code className="block min-w-0 flex-1 break-all text-xs text-emerald-200">
                  new {consoleState.policyUpgrade.newHash}
                </code>
                <CopyButton value={consoleState.policyUpgrade.newHash} label="Copy new" />
              </div>
            </section>
          ) : null}

          <EvidenceObjects
            objects={consoleState.proofObjects}
            storageScanUrl={storageScanSearchUrl()}
          />
        </div>
      </section>
    </main>
  );
}
