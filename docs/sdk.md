# SDK

The SDK exports schemas, root helpers, adapters, verifier, Passport builders, and recorder helpers.

```ts
import { createPoiRecorder } from "@poi/sdk";

const recorder = createPoiRecorder({
  chainId: 16602,
  contract: "0x...",
  tokenId: "1"
});

await recorder.startRun({ task: "Audit this repository" });
await recorder.recordComputeCall({ model: "0G Compute", inputHash, outputHash });
await recorder.recordMemoryWrite({ memoryRoot });
await recorder.finishRun({ resultRoot });
```

Important exports:

- `createVerifier`
- `createPassportManifest`
- `createIntelligenceBundle`
- `encryptIntelligenceBundle`
- `computeEvidenceRoots`
- `createRunTrace`
- `createPoiRecorder`
- `exportProofJson`
- `exportDaBundle`
- `hashManifestForRoot`
- `hashRunTrace`
