export default function DeveloperPage() {
  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Developer SDK</h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Add Proof-of-Intelligence verification to any ERC-7857/iNFT-style
          agent with adapters for chain, storage, compute, optional DA, and
          optional ENS.
        </p>
        <div className="mt-8 grid gap-6">
          {[
            ["Install", "pnpm add @poi/sdk"],
            [
              "Verify",
              "const report = await createVerifier().verify('codeguardian')",
            ],
            ["CLI", "poi verify codeguardian && poi export-proof codeguardian"],
            [
              "Manifest",
              "hashManifestForProof(manifest) hashes canonical JSON with storage.manifestRoot excluded",
            ],
          ].map(([title, code]) => (
            <div key={title} className="border-t border-white/10 pt-5">
              <h2 className="font-semibold">{title}</h2>
              <pre className="mt-3 overflow-auto rounded-md bg-black/25 p-4 text-sm text-emerald-200">
                {code}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
