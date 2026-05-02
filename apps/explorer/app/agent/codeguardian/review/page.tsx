import Link from "next/link";
import { CopyButton } from "../../../../components/copy-button";
import { Badge } from "../../../../components/proof-ui";
import { hashCanonicalJson } from "@poi/sdk";

const sampleDiff = `diff --git a/api/admin.ts b/api/admin.ts
@@
 export async function getPrivateRecord(req: Request) {
+  const id = new URL(req.url).searchParams.get("id");
+  return db.records.findUnique({ where: { id } });
 }
`;

export default async function CodeGuardianReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ diff?: string }>;
}) {
  const params = await searchParams;
  const diff = normalizeDiff(params.diff);
  const review = createReviewPreview(diff);
  const proofRows: Array<[string, string]> = [
    ["Input hash", review.inputHash],
    ["Analysis root", review.analysisRoot],
    ["Memory delta root", review.memoryDeltaRoot],
    ["Certificate preview", review.certificatePreviewRoot],
  ];

  return (
    <main className="min-h-screen bg-ink text-white">
      <section className="border-b border-white/10 bg-[#171917] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="good">CodeGuardian iNFT</Badge>
            <Badge>Safe pasted-diff review</Badge>
            <Badge>hybrid preview</Badge>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
            Review a diff without executing it.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Paste a PR-style diff and CodeGuardian produces a constrained
            security review preview: input hash, issue, patch direction,
            critic reflection, memory delta, and certificate preview root. The
            public path never runs code, shells out, sends calldata, or exposes
            write credentials.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
              href="/agent/codeguardian/console"
            >
              Back to Agent Console
            </Link>
            <Link
              className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
              href="/judge"
            >
              Judge Mode
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_380px]">
        <form className="space-y-4" method="get">
          <div>
            <label
              className="text-sm uppercase text-slate-500"
              htmlFor="diff"
            >
              Pasted diff
            </label>
            <textarea
              className="mt-3 min-h-[360px] w-full resize-y rounded-md border border-white/10 bg-black/30 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-emerald-300/60"
              defaultValue={diff}
              id="diff"
              maxLength={8000}
              name="diff"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-emerald-300 px-5 py-3 font-semibold text-[#121412]"
              type="submit"
            >
              Review diff
            </button>
            <Link
              className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white"
              href="/agent/codeguardian/review"
            >
              Reset sample
            </Link>
          </div>
          <p className="text-sm leading-6 text-slate-400">
            Inputs are capped at 8,000 characters and reduced to deterministic
            hashes for the proof preview. Live 0G Compute review remains a
            server/admin-controlled path.
          </p>
        </form>

        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-black/20 p-5">
            <div className="text-sm uppercase text-slate-500">
              Review result
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm text-slate-500">Issue</div>
                <p className="mt-1 text-slate-100">{review.issue}</p>
              </div>
              <div>
                <div className="text-sm text-slate-500">Patch direction</div>
                <p className="mt-1 text-slate-300">{review.patch}</p>
              </div>
              <div>
                <div className="text-sm text-slate-500">Critic reflection</div>
                <p className="mt-1 text-slate-300">{review.critique}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-white/10 bg-black/20 p-5">
            <div className="text-sm uppercase text-slate-500">
              Proof preview
            </div>
            <dl className="mt-4 space-y-4 text-sm">
              {proofRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-1 flex flex-wrap items-start gap-2">
                    <code className="min-w-0 flex-1 break-all text-xs text-emerald-200">
                      {value}
                    </code>
                    <CopyButton value={value} label="Copy" />
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-md border border-white/10 bg-black/20 p-5">
            <div className="text-sm uppercase text-slate-500">
              Safety boundary
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <li>No arbitrary code execution.</li>
              <li>No shell, package install, or repository checkout.</li>
              <li>No browser-exposed private keys or admin tokens.</li>
              <li>No arbitrary contract calls or calldata.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}

function normalizeDiff(value: string | undefined) {
  const trimmed = (value ?? sampleDiff).slice(0, 8000);
  return trimmed.length > 0 ? trimmed : sampleDiff;
}

function createReviewPreview(diff: string) {
  const inputHash = hashCanonicalJson({ kind: "pasted-diff", diff });
  const pattern = classifyDiff(diff);
  const analysisRoot = hashCanonicalJson({
    inputHash,
    issue: pattern.issue,
    patch: pattern.patch,
    source: "hybrid",
  });
  const memoryDeltaRoot = hashCanonicalJson({
    inputHash,
    learnedPattern: pattern.learnedPattern,
    source: "hybrid",
  });
  const certificatePreviewRoot = hashCanonicalJson({
    analysisRoot,
    memoryDeltaRoot,
    accepted: true,
    source: "hybrid",
  });
  return {
    ...pattern,
    inputHash,
    analysisRoot,
    memoryDeltaRoot,
    certificatePreviewRoot,
  };
}

function classifyDiff(diff: string) {
  if (/auth|owner|admin|private|permission/i.test(diff)) {
    return {
      issue:
        "The diff returns sensitive records without an obvious authorization guard.",
      patch:
        "Check the caller's authorization before reading or returning private data, and fail closed on missing identity.",
      critique:
        "The patch is bounded because it adds a precondition before data access without changing storage semantics.",
      learnedPattern:
        "Verify authorization before returning private records from request-derived identifiers.",
    };
  }
  if (/JSON\.parse|parse\(/.test(diff)) {
    return {
      issue:
        "The diff parses untrusted input without validating the resulting shape.",
      patch:
        "Parse into unknown, validate required fields, and return a typed error when validation fails.",
      critique:
        "The patch reduces trust in parser output while preserving the existing call boundary.",
      learnedPattern:
        "Validate JSON parse failures and parsed payload shape before using request data.",
    };
  }
  if (/await|fetch|promise|async/i.test(diff)) {
    return {
      issue:
        "The diff adds an awaited side effect without explicit error handling.",
      patch:
        "Wrap the side effect in a try/catch path and return a deterministic failure state.",
      critique:
        "The patch keeps the async boundary explicit and prevents partial success from being treated as success.",
      learnedPattern:
        "Wrap awaited side effects in explicit error handling before updating state.",
    };
  }
  return {
    issue:
      "The diff changes an input boundary without a visible validation or failure policy.",
    patch:
      "Add validation at the boundary and document the expected failure behavior before downstream use.",
    critique:
      "The patch is intentionally narrow and avoids changing unrelated behavior.",
    learnedPattern:
      "Treat new request and data boundaries as proof points for validation, authorization, and error handling.",
  };
}
