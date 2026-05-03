import Link from "next/link";
import type {
  Certificate,
  ProofObjectRecord,
  RunTrace,
  VerificationReport,
} from "@poi/sdk";
import { CopyButton } from "./copy-button";
import { certificateRoot, type ChainTransactionRecord } from "../lib/proof";

const tierLabels = [
  "Unsupported",
  "Ownership",
  "Manifest",
  "Intelligence",
  "Memory",
  "Compute + replay",
  "Certified"
];

const eventLabels: Record<string, string> = {
  task_received: "Task received",
  context_loaded: "Context loaded",
  compute_started: "Analysis started",
  compute_completed: "Analysis completed",
  issue_found: "Issue found",
  patch_proposed: "Patch proposed",
  critic_started: "Critic loop started",
  critic_completed: "Critic completed",
  memory_delta_created: "Memory delta created",
  memory_written: "Memory written",
  skill_upgrade_checked: "Policy upgrade checked",
  trace_committed: "Trace committed",
  certificate_issued: "Certificate issued"
};

const eventFieldKeys: Record<string, string[]> = {
  task_received: ["goal", "target"],
  context_loaded: ["sourceHash", "byteLength"],
  compute_started: ["runId", "provider", "model"],
  compute_completed: ["runId", "outputHash"],
  issue_found: ["issue"],
  patch_proposed: ["patch"],
  critic_started: ["runId", "provider", "model"],
  critic_completed: ["accepted", "critique"],
  memory_delta_created: ["learnedPattern", "memoryDelta"],
  memory_written: ["version", "memoryRoot"],
  skill_upgrade_checked: ["upgraded"],
  trace_committed: ["traceRoot"],
  certificate_issued: ["certificateId"]
};

function detailValue(event: RunTrace["events"][number], key: string) {
  const value = event.detail[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function shortValue(value: string, maxLength = 160) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function eventLabel(type: string) {
  return eventLabels[type] ?? type.split("_").join(" ");
}

function eventSummary(event: RunTrace["events"][number]) {
  const target = detailValue(event, "target");
  const goal = detailValue(event, "goal");
  const runId = detailValue(event, "runId");
  const provider = detailValue(event, "provider");
  const model = detailValue(event, "model");
  const issue = detailValue(event, "issue");
  const patch = detailValue(event, "patch");
  const critique = detailValue(event, "critique");
  const learnedPattern = detailValue(event, "learnedPattern");
  const memoryDelta = detailValue(event, "memoryDelta");
  const version = detailValue(event, "version");
  const traceRoot = detailValue(event, "traceRoot");
  const certificateId = detailValue(event, "certificateId");
  const accepted = detailValue(event, "accepted");
  const upgraded = detailValue(event, "upgraded");

  switch (event.type) {
    case "task_received":
      return `CodeGuardian accepted the allowlisted audit task${goal ? `: ${goal}` : target ? ` for ${target}` : "."}`;
    case "context_loaded":
      return target
        ? `Loaded the demo source fixture and hashed the context for ${target}.`
        : "Loaded and hashed the review context.";
    case "compute_started":
      return `Started the compute-backed analysis${runId ? ` run ${runId}` : ""}${provider ? ` through ${provider}` : model ? ` on ${model}` : ""}.`;
    case "compute_completed":
      return runId ? `Completed analysis run ${runId} and recorded its output hash.` : "Completed analysis and recorded its output hash.";
    case "issue_found":
      return issue ? shortValue(issue) : "Identified the primary code risk for this run.";
    case "patch_proposed":
      return patch ? shortValue(patch) : "Proposed a patch for the detected issue.";
    case "critic_started":
      return `Started the self-review critic loop${runId ? ` run ${runId}` : ""}.`;
    case "critic_completed":
      return critique
        ? `${accepted === "true" ? "Accepted" : "Reviewed"} the patch after critique: ${shortValue(critique)}`
        : "Completed the critic loop and recorded the verdict.";
    case "memory_delta_created":
      return learnedPattern ?? memoryDelta ?? "Created a persistent-memory delta from the review.";
    case "memory_written":
      return version ? `Advanced persistent memory to version ${version}.` : "Committed the updated memory root.";
    case "skill_upgrade_checked":
      return upgraded === "true"
        ? "Recorded a dynamic policy upgrade for future reviews."
        : "Checked dynamic upgrade rules; no policy upgrade was needed.";
    case "trace_committed":
      return traceRoot ? "Committed the replay trace root for verification." : "Committed the replay trace.";
    case "certificate_issued":
      return certificateId ? `Issued Proof-of-Intelligence certificate ${certificateId}.` : "Issued the Proof-of-Intelligence certificate.";
    default:
      return "Recorded a replayable agent event.";
  }
}

function eventFields(event: RunTrace["events"][number]) {
  return (eventFieldKeys[event.type] ?? [])
    .map((key) => ({ key, value: detailValue(event, key) }))
    .filter((field): field is { key: string; value: string } => Boolean(field.value));
}

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
      ? "mock optional layers"
      : source
  );
  return (
    <section className="border-b border-white/10 bg-[#171917] px-5 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <Badge tone={tone}>Tier {report.tier}: {tierLabels[report.tier]}</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            Is this Agentic ID actually intelligent?
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

export function RawJsonDetails({
  title,
  summary,
  value,
  className = "",
}: {
  title: string;
  summary?: string;
  value: unknown;
  className?: string;
}) {
  return (
    <details className={`rounded-md border border-white/10 bg-black/20 p-4 ${className}`}>
      <summary className="cursor-pointer text-sm font-semibold text-white">
        {title}
        {summary ? <span className="ml-2 font-normal text-slate-400">{summary}</span> : null}
      </summary>
      <pre className="mt-4 max-h-[520px] overflow-auto text-xs leading-6 text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export function PatchDiffBlock({
  diff,
  title = "Patch diff",
  className = "",
}: {
  diff?: string;
  title?: string;
  className?: string;
}) {
  if (!diff) return null;

  return (
    <div className={`rounded-md border border-emerald-300/20 bg-emerald-300/[0.04] p-4 ${className}`}>
      <div className="text-sm font-semibold text-emerald-100">{title}</div>
      <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
        {diff}
      </pre>
    </div>
  );
}

export function EvidencePanel({ report }: { report: VerificationReport }) {
  const passingChecks = report.checks.filter((check) => check.ok).length;
  const failingChecks = report.checks.length - passingChecks;
  const sources = report.sources.join(" + ");

  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white">Evidence summary</div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs uppercase text-slate-500">Status</div>
          <div className="mt-1 capitalize text-slate-200">{report.status}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">Tier</div>
          <div className="mt-1 text-slate-200">Tier {report.tier}: {tierLabels[report.tier]}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">Checks</div>
          <div className="mt-1 text-slate-200">{passingChecks} pass / {failingChecks} fail</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">Sources</div>
          <div className="mt-1 capitalize text-slate-200">{sources}</div>
        </div>
      </div>
      <RawJsonDetails
        title="Raw JSON evidence"
        summary="Full verifier response"
        value={report}
        className="mt-4 bg-black/10"
      />
    </div>
  );
}

export function AgentActions({ agent, certificateId, runId }: { agent: string; certificateId?: string; runId?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {agent === "codeguardian" ? (
        <Link className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white" href="/agent/codeguardian/console">
          Agent Console
        </Link>
      ) : null}
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

export function EvidenceObjects({
  objects,
  storageScanUrl,
}: {
  objects: ProofObjectRecord[];
  storageScanUrl: string;
}) {
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      <div className="py-4">
        <div className="text-sm uppercase text-slate-500">0G evidence objects</div>
        <p className="mt-2 text-sm text-slate-400">
          Copy roots and tx identifiers into StorageScan when a direct deep link is unavailable.
        </p>
      </div>
      {objects.map((object) => (
        <div
          key={object.name}
          className="grid gap-3 py-4 md:grid-cols-[150px_1fr_110px] md:items-center"
        >
          <div>
            <div className="font-medium capitalize text-white">{object.name}</div>
            <Badge tone={object.source === "live" ? "good" : object.source === "hybrid" ? "warn" : "neutral"}>
              {object.source}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-start gap-2">
              <code className="block min-w-0 flex-1 break-all text-xs text-emerald-200">{object.poiRoot}</code>
              <CopyButton value={object.poiRoot} label="Copy root" />
            </div>
            {object.zeroGRootHash ? (
              <div className="flex flex-wrap items-start gap-2">
                <code className="block min-w-0 flex-1 break-all text-xs text-slate-400">{object.zeroGRootHash}</code>
                <CopyButton value={object.zeroGRootHash} label="Copy 0G" />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {object.txHash ? (
                <span className="inline-flex max-w-full items-center gap-2">
                  <span className="break-all">tx {object.txHash}</span>
                  <CopyButton value={object.txHash} label="Copy tx" className="text-slate-200" />
                </span>
              ) : null}
              {object.txSeq ? (
                <span className="inline-flex items-center gap-2">
                  <span>seq {object.txSeq}</span>
                  <CopyButton value={String(object.txSeq)} label="Copy seq" className="text-slate-200" />
                </span>
              ) : null}
              {object.byteLength ? <span>{object.byteLength} bytes</span> : null}
            </div>
          </div>
          <Link
            className="rounded-md border border-white/15 px-3 py-2 text-center text-xs font-semibold text-white"
            href={storageScanUrl}
          >
            StorageScan
          </Link>
        </div>
      ))}
    </div>
  );
}

export function ChainTransactions({
  transactions,
}: {
  transactions: ChainTransactionRecord[];
}) {
  if (!transactions.length) return null;

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      <div className="py-4">
        <div className="text-sm uppercase text-slate-500">
          0G Chain transaction proofs
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Live Galileo writes recorded during contract deployment, demo iNFT
          seeding, registry updates, and certificate issuance.
        </p>
      </div>
      {transactions.map((transaction) => (
        <div
          key={transaction.txHash}
          className="grid gap-3 py-4 md:grid-cols-[190px_1fr_130px] md:items-center"
        >
          <div>
            <div className="font-medium text-white">{transaction.label}</div>
            <Badge tone="good">{transaction.source}</Badge>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <code className="block min-w-0 flex-1 break-all text-xs text-emerald-200">
              {transaction.txHash}
            </code>
            <CopyButton value={transaction.txHash} label="Copy tx" />
          </div>
          <Link
            className="rounded-md border border-white/15 px-3 py-2 text-center text-xs font-semibold text-white"
            href={transaction.explorerUrl}
          >
            ChainScan tx
          </Link>
        </div>
      ))}
    </div>
  );
}

export function RunTimeline({ run }: { run: RunTrace }) {
  return (
    <div className="border-l border-white/15">
      {run.events.map((event, index) => {
        const fields = eventFields(event);
        const source = detailValue(event, "source");
        const patchDiff =
          event.type === "patch_proposed"
            ? detailValue(event, "patchDiff")
            : undefined;

        return (
          <div key={`${event.type}-${event.at}`} className="relative pb-7 pl-7">
            <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-emerald-300" />
            <div className="text-xs text-slate-500">#{index + 1} · {event.at}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="font-semibold text-white">{eventLabel(event.type)}</div>
              <code className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-400">{event.type}</code>
              {source ? <Badge tone={source === "live" ? "good" : source === "hybrid" ? "warn" : "neutral"}>{source}</Badge> : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{eventSummary(event)}</p>
            {fields.length ? (
              <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div className="uppercase text-slate-500">{field.key}</div>
                    <code className="mt-1 block break-all text-slate-300">{shortValue(field.value, 180)}</code>
                  </div>
                ))}
              </div>
            ) : null}
            <PatchDiffBlock diff={patchDiff} className="mt-3" />
            <RawJsonDetails
              title="Raw event JSON"
              summary="Full canonical event detail"
              value={event.detail}
              className="mt-3 bg-black/10"
            />
          </div>
        );
      })}
    </div>
  );
}

export function CertificateView({ certificate }: { certificate: Certificate }) {
  const root = certificateRoot(certificate);

  return (
    <article className="bg-white p-8 text-[#121412] shadow-2xl print:shadow-none md:p-12">
      <div className="border-4 border-[#121412] p-8">
        <p className="text-sm font-semibold uppercase">Proof-of-Intelligence Certificate</p>
        <h1 className="mt-4 text-4xl font-semibold">{certificate.agent}</h1>
        <p className="mt-4 max-w-2xl text-lg">
          Certified as a Tier {certificate.tier} Agentic ID / iNFT-style agent with encrypted intelligence, persistent memory,
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
          <div className="mt-2 flex flex-wrap items-start gap-2">
            <code className="min-w-0 flex-1 break-all">{root}</code>
            <CopyButton
              value={root}
              label="Copy root"
              className="no-print border-[#121412]/20 text-[#121412] hover:border-[#121412]/60"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
