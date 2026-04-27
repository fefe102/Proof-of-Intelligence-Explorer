import Link from "next/link";
import type { Certificate, RunTrace, VerificationReport } from "@poi/sdk";
import { certificateRoot } from "../lib/proof";

const tierLabels = [
  "Unsupported",
  "Ownership",
  "Manifest",
  "Intelligence",
  "Memory",
  "Compute + replay",
  "Certified"
];

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "bad" | "neutral" }) {
  const tones = {
    good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    warn: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    bad: "border-red-400/40 bg-red-400/10 text-red-200",
    neutral: "border-white/15 bg-white/5 text-slate-200"
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function StatusHeader({ report }: { report: VerificationReport }) {
  const tone = report.status === "verified" ? "good" : report.status === "failed" ? "bad" : "warn";
  const sourceLabels = report.sources.map((source) =>
    source === "mock" && report.status === "verified"
      ? "mock optional DA/ENS"
      : source
  );
  return (
    <section className="border-b border-white/10 bg-[#171917] px-5 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <Badge tone={tone}>Tier {report.tier}: {tierLabels[report.tier]}</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            Is this iNFT actually intelligent?
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{report.summary}</p>
        </div>
        <div className="border-l border-white/10 pl-6">
          <div className="text-sm uppercase text-slate-500">Verification status</div>
          <div className="mt-2 text-3xl font-semibold capitalize text-white">{report.status}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sourceLabels.map((source) => (
              <Badge key={source}>{source}</Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TierLadder({ tier }: { tier: number }) {
  return (
    <div className="grid gap-2">
      {tierLabels.map((label, index) => (
        <div key={label} className="grid grid-cols-[34px_1fr] items-center gap-3">
          <div className={`h-8 w-8 rounded-full border text-center text-sm leading-8 ${index <= tier ? "border-emerald-300 bg-emerald-300 text-[#121412]" : "border-white/15 text-slate-500"}`}>
            {index}
          </div>
          <div className={index <= tier ? "text-slate-100" : "text-slate-500"}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export function Checklist({ report }: { report: VerificationReport }) {
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {report.checks.map((check) => (
        <div key={check.id} className="grid gap-3 py-4 md:grid-cols-[170px_1fr_120px] md:items-center">
          <div>
            <Badge tone={check.ok ? "good" : "bad"}>{check.ok ? "pass" : "fail"}</Badge>
          </div>
          <div>
            <div className="font-medium text-white">{check.label}</div>
            <div className="mt-1 text-sm text-slate-400">{check.detail}</div>
            {check.root ? <code className="mt-2 block break-all text-xs text-emerald-200">{check.root}</code> : null}
          </div>
          <div className="text-sm capitalize text-slate-400">{check.source}</div>
        </div>
      ))}
    </div>
  );
}

export function EvidencePanel({ report }: { report: VerificationReport }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <div className="mb-3 text-sm font-semibold text-white">Raw JSON evidence</div>
      <pre className="max-h-[520px] overflow-auto text-xs leading-6 text-slate-300">{JSON.stringify(report, null, 2)}</pre>
    </div>
  );
}

export function AgentActions({ agent, certificateId, runId }: { agent: string; certificateId?: string; runId?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#121412]" href={`/api/verify?agent=${agent}`}>
        Export proof
      </Link>
      {certificateId ? (
        <Link className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white" href={`/certificate/${certificateId}`}>
          Certificate
        </Link>
      ) : null}
      {runId ? (
        <Link className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white" href={`/run/${runId}`}>
          Replay
        </Link>
      ) : null}
    </div>
  );
}

export function RunTimeline({ run }: { run: RunTrace }) {
  return (
    <div className="border-l border-white/15">
      {run.events.map((event, index) => (
        <div key={`${event.type}-${event.at}`} className="relative pb-7 pl-7">
          <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-emerald-300" />
          <div className="text-xs text-slate-500">#{index + 1} · {event.at}</div>
          <div className="mt-1 font-semibold text-white">{event.type}</div>
          <pre className="mt-2 overflow-auto rounded-md bg-black/25 p-3 text-xs text-slate-300">{JSON.stringify(event.detail, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

export function CertificateView({ certificate }: { certificate: Certificate }) {
  return (
    <article className="bg-white p-8 text-[#121412] shadow-2xl print:shadow-none md:p-12">
      <div className="border-4 border-[#121412] p-8">
        <p className="text-sm font-semibold uppercase">Proof-of-Intelligence Certificate</p>
        <h1 className="mt-4 text-4xl font-semibold">{certificate.agent}</h1>
        <p className="mt-4 max-w-2xl text-lg">
          Certified as a Tier {certificate.tier} iNFT-style agent with encrypted intelligence, persistent memory,
          compute-backed run history, and replayable behavior evidence.
        </p>
        <dl className="mt-8 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold">Certificate ID</dt>
            <dd>{certificate.certificateId}</dd>
          </div>
          <div>
            <dt className="font-semibold">Issued</dt>
            <dd>{certificate.issuedAt}</dd>
          </div>
          <div>
            <dt className="font-semibold">0G Chain</dt>
            <dd>{certificate.evidence.inft.chainId}</dd>
          </div>
          <div>
            <dt className="font-semibold">Token</dt>
            <dd>{certificate.evidence.inft.contract} #{certificate.evidence.inft.tokenId}</dd>
          </div>
        </dl>
        <div className="mt-8 break-all border-t border-[#121412]/20 pt-5 text-xs">
          <div className="font-semibold">Certificate root</div>
          {certificateRoot(certificate)}
        </div>
      </div>
    </article>
  );
}
