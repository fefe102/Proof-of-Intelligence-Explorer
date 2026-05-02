import Link from "next/link";
import { CopyButton } from "../../components/copy-button";
import {
  Badge,
  EvidenceObjects,
  TierLadder,
} from "../../components/proof-ui";
import {
  badgePath,
  chainscanContractUrl,
  getAgentProfile,
  getCodeGuardianConsole,
  passportPath,
  publicStatus,
  seededCodeGuardianTarget,
  storageScanSearchUrl,
} from "../../lib/proof";

const demoScript = [
  ["0:00-0:15", "CodeGuardian is the minted 0G Agentic ID / iNFT."],
  ["0:15-0:35", "Open Agent Console: analysis, critic loop, memory, trace."],
  ["0:35-0:50", "Show memory roots evolving across three autonomous runs."],
  ["0:50-1:05", "Replay the latest run and point to compute/run evidence."],
  ["1:05-1:20", "Open the certificate bound to the live 0G token."],
  ["1:20-1:30", "Verify FakeAgent and show it fails the same checks."],
];

export default async function JudgePage() {
  const [consoleState, fakeagent] = await Promise.all([
    getCodeGuardianConsole(),
    getAgentProfile("fakeagent"),
  ]);
  const status = publicStatus();
  const target = seededCodeGuardianTarget();
  const passportUrl = passportPath(target);
  const badgeUrl = badgePath(target);
  const report = consoleState.profile.report;
  const latestRun = consoleState.latestRun;
  const latestRunId = latestRun?.runId ?? "codeguardian-run-003";
  const certificateId =
    report.certificate?.certificateId ?? "poi-cert-codeguardian-001";
  const badgeEmbed = `[![Proof of Intelligence](${badgeUrl})](${passportUrl})`;
  const proofRows = [
    ["Chain", status.proofLayers.chain, `0G Galileo (${status.chainId})`],
    ["Minted iNFT", "live", `${target.contract} #${target.tokenId}`],
    ["Registry", "live", status.registryAddress],
    [
      "Encrypted intelligence root",
      proofSource("intelligenceBundle", status.proofObjects),
      report.evidence.intelligenceBundleRoot ?? "missing",
    ],
    [
      "Memory root",
      proofSource("memory", status.proofObjects),
      report.evidence.memoryRoot ?? "missing",
    ],
    [
      "Latest run root",
      proofSource("run", status.proofObjects),
      report.evidence.latestRunRoot ?? "missing",
    ],
    [
      "Compute runs",
      status.proofLayers.compute,
      report.computeRuns?.runs.map((run) => run.id).join(", ") ?? "missing",
    ],
    ["Certificate", proofSource("certificate", status.proofObjects), certificateId],
  ];

  return (
    <main className="min-h-screen bg-ink text-white">
      <section className="border-b border-white/10 bg-[#171917] px-5 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">Judge Mode</Badge>
              <Badge>0G Galileo</Badge>
              <Badge>Agentic ID / ERC-7857-style iNFT</Badge>
            </div>
            <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-tight md:text-6xl">
              CodeGuardian is the autonomous iNFT. AgentProof proves it is real.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              This page compresses the full 0G prize proof into one checklist:
              minted Agentic ID/iNFT, encrypted intelligence, persistent
              memory, compute-backed critic loop, replay trace, dynamic policy
              upgrade, certificate, and a failing FakeAgent control.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-emerald-300 px-5 py-3 font-semibold text-[#121412]"
                href="/agent/codeguardian/console"
              >
                Open Agent Console
              </Link>
              <Link
                className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
                href={`/run/${latestRunId}`}
              >
                Replay Latest Run
              </Link>
              <Link
                className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
                href={`/certificate/${certificateId}`}
              >
                View Certificate
              </Link>
              <Link
                className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
                href="/agent/fakeagent"
              >
                Show FakeAgent Failing
              </Link>
            </div>
          </div>
          <aside className="border-l border-white/10 pl-6">
            <div className="text-sm uppercase text-slate-500">
              Verification status
            </div>
            <div className="mt-2 text-3xl font-semibold capitalize">
              {report.status}
            </div>
            <div className="mt-5">
              <TierLadder tier={report.tier} />
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-8">
          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">
              Minted iNFT proof
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Chain", "0G Galileo"],
                ["Chain ID", String(target.chainId)],
                ["Contract", target.contract],
                ["Token ID", target.tokenId],
                ["Owner", consoleState.mintedInft.owner ?? "unknown"],
                ["Registry", status.registryAddress],
                ["Certificate record", status.certificateId],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-1 flex flex-wrap items-start gap-2">
                    <span className="min-w-0 flex-1 break-all text-slate-200">
                      {value}
                    </span>
                    {value ? <CopyButton value={value} label="Copy" /> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              className="mt-4 inline-flex rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              href={chainscanContractUrl()}
            >
              Open on 0G ChainScan
            </Link>
          </div>

          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">
              90-second demo script
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {demoScript.map(([time, line]) => (
                <div key={time} className="grid grid-cols-[74px_1fr] gap-3">
                  <span className="text-slate-500">{time}</span>
                  <span className="text-slate-200">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-10">
          <section className="rounded-md border border-white/10 bg-black/20 p-5">
            <div className="text-sm uppercase text-slate-500">
              Prize checklist
            </div>
            <div className="mt-4 divide-y divide-white/10">
              {proofRows.map(([label, source, value]) => {
                const displayValue = value ?? "missing";
                return (
                  <div
                    key={label}
                    className="grid gap-3 py-4 md:grid-cols-[210px_120px_1fr] md:items-center"
                  >
                    <div className="font-medium text-white">{label}</div>
                    <Badge tone={source === "live" ? "good" : source === "hybrid" ? "warn" : "neutral"}>
                      {source}
                    </Badge>
                    <div className="flex flex-wrap items-start gap-2">
                      <code className="min-w-0 flex-1 break-all text-xs text-emerald-200">
                        {displayValue}
                      </code>
                      <CopyButton value={displayValue} label="Copy" />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Source labels are intentionally conservative. Live means fetched
              or recorded through configured 0G infrastructure; hybrid means
              deterministic hosted artifacts wired through the same verifier;
              mock means optional compatibility metadata.
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">Agent runs</div>
              <div className="mt-2 text-3xl font-semibold">
                {consoleState.runs.length}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Deterministic autonomous review runs with analysis, patch,
                critic, memory, trace, and certificate events.
              </p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">
                Memory version
              </div>
              <div className="mt-2 text-3xl font-semibold">
                {consoleState.memoryEvolution.at(-1)?.version ?? 0}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Memory roots evolve from run to run instead of staying static.
              </p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">
                Negative control
              </div>
              <div className="mt-2 text-3xl font-semibold">
                Tier {fakeagent.report.tier}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                FakeAgent has token-like metadata but fails the
                Proof-of-Intelligence checks.
              </p>
            </div>
          </section>

          <section id="memory" className="border-y border-white/10 py-5">
            <div className="text-sm uppercase text-slate-500">
              Memory evolution
            </div>
            <div className="mt-4 grid gap-4">
              {consoleState.memoryEvolution.map((item) => (
                <div
                  key={item.runId}
                  className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[90px_1fr]"
                >
                  <Badge tone="warn">v{item.version}</Badge>
                  <div>
                    <Link className="font-semibold" href={`/run/${item.runId}`}>
                      {item.runId}
                    </Link>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.learnedPattern}
                    </p>
                    <div className="mt-3 flex flex-wrap items-start gap-2">
                      <code className="min-w-0 flex-1 break-all text-xs text-emerald-200">
                        {item.memoryRoot}
                      </code>
                      <CopyButton value={item.memoryRoot} label="Copy memory" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <EvidenceObjects
            objects={consoleState.proofObjects}
            storageScanUrl={storageScanSearchUrl()}
          />

          <section className="grid gap-5 md:grid-cols-2">
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">API</div>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                /api/verify?agent=codeguardian
              </code>
              <code className="mt-2 block break-all text-xs text-emerald-200">
                /api/passport/{target.chainId}/{target.contract}/{target.tokenId}
              </code>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-sm uppercase text-slate-500">Badge</div>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <code className="min-w-0 flex-1 break-all text-xs text-emerald-200">
                  {badgeEmbed}
                </code>
                <CopyButton value={badgeEmbed} label="Copy badge" />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function proofSource(
  name: string,
  objects: ReturnType<typeof publicStatus>["proofObjects"],
) {
  return objects.find((object) => object.name === name)?.source ?? "hybrid";
}
