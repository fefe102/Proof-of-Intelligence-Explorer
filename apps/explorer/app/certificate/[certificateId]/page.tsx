import { notFound } from "next/navigation";
import { CertificateView, EvidenceObjects } from "../../../components/proof-ui";
import {
  chainscanContractUrl,
  getCertificate,
  getProofObjects,
  storageScanSearchUrl,
} from "../../../lib/proof";

export default async function CertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  let certificate;
  try {
    certificate = getCertificate(certificateId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="no-print mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Certificate</h1>
          <span className="rounded-md border border-white/15 px-4 py-2 text-sm">Use browser print</span>
        </div>
        <CertificateView certificate={certificate} />
        <section className="no-print mt-8 grid gap-5 md:grid-cols-2">
          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">Minted iNFT</div>
            <div className="mt-2 break-all text-sm text-slate-200">
              {certificate.evidence.inft.contract} #
              {certificate.evidence.inft.tokenId}
            </div>
            <a
              className="mt-3 inline-block rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              href={chainscanContractUrl()}
            >
              Open on 0G ChainScan
            </a>
          </div>
          <div className="border-t border-white/10 pt-5">
            <div className="text-sm uppercase text-slate-500">
              Certified roots
            </div>
            <code className="mt-2 block break-all text-xs text-emerald-200">
              memory {certificate.evidence.memoryRoot}
            </code>
            <code className="mt-1 block break-all text-xs text-slate-400">
              run {certificate.evidence.latestRunRoot}
            </code>
          </div>
        </section>
        <div className="no-print mt-8">
          <EvidenceObjects
            objects={getProofObjects()}
            storageScanUrl={storageScanSearchUrl()}
          />
        </div>
        <pre className="no-print mt-6 overflow-auto rounded-md bg-black/25 p-4 text-xs text-slate-300">{JSON.stringify(certificate, null, 2)}</pre>
      </div>
    </main>
  );
}
