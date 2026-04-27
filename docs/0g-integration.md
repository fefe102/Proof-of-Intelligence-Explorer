# 0G Integration

Proof-of-Intelligence Explorer supports three modes:

- `live`: use configured 0G services for available evidence.
- `hybrid`: use live services where configured and deterministic mock adapters elsewhere.
- `mock`: use deterministic local fixtures only.

The public UI must show the mode for each evidence source.

## Chain

0G Chain is used for:

- demo iNFT deployment and minting
- ownership reads
- registry passport registration
- root updates
- certificate issuance

Current live Galileo seed:

- Demo iNFT: `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`
- Proof registry: `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`
- CodeGuardian token ID: `1`
- FakeAgent token ID: `2`
- CodeGuardian passport: `0x01212ca92791787ccb99c454d3b59c5596f90882c892c7fca3e63294a159430c`
- Registry certificate record: `3`

Guardrails:

- expected chain ID is `16602` for Galileo testnet
- RPC chain ID must match before writes
- configured wallet address must match the private key
- balance must be checked before transactions
- retries must be bounded
- no arbitrary calldata from browser input

## Storage

0G Storage is the target for:

- encrypted intelligence bundle
- mutable memory/current state
- immutable trace/log artifacts
- public roots/hashes used by the verifier

Current CodeGuardian proof objects are uploaded through the 0G Storage SDK. The public bundle records the verifier root, 0G storage root hash, transaction hash, tx sequence, source mode, and byte length for each object. When live storage is unavailable, the app keeps deterministic mock artifacts and labels the evidence `mock` or `hybrid`.

## Compute

0G Compute is the target for CodeGuardian's two-stage behavior:

1. analysis run that finds a code bug or risk
2. critic/self-review run that evaluates the proposed patch

Run records include provider, model, run ID, prompt hash, output hash, status, source mode, and timestamp. The current CodeGuardian seed uses live 0G Compute broker requests for both analysis and critic runs. Mock compute remains available for deterministic fallback.

## Optional DA

The optional DA module exports a bundle containing:

- manifest root
- intelligence bundle root
- memory root
- latest run root
- certificate ID
- source mode labels

The verifier does not fail if DA is missing.

## Manifest Root Rule

`storage.manifestRoot` hashes the canonical JSON manifest after removing
`storage.manifestRoot` from the payload. This avoids self-referential hashing
while keeping the manifest bound to the live iNFT contract, token ID, storage
roots, compute runs, skills, memory, proof, and permissions. The SDK verifier
uses the same `hashManifestForProof` rule and rejects a manifest whose declared
root does not match.

## Optional ENS

ENS support is light and optional. A missing ENS name does not fail verification. In mock mode, `codeguardian.poi-demo.eth` can resolve to the CodeGuardian fixture.

## Environment

Core vars:

- `POI_MODE`
- `0G_CHAIN_ID`
- `0G_RPC_URL`
- `POI_REGISTRY_ADDRESS`
- `POI_DEMO_INFT_ADDRESS`
- `0G_STORAGE_MODE`
- `0G_COMPUTE_MODE`
- `0G_DA_MODE`
- `ENS_MODE`

Server-only vars:

- `POI_ADMIN_TOKEN`
- `0G_PRIVATE_KEY`
- `0G_WALLET_ADDRESS`
- `0G_COMPUTE_BEARER_TOKEN`
- `POI_DEMO_ENCRYPTION_KEY`

Public display vars:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_POI_PUBLIC_MODE`
- `NEXT_PUBLIC_0G_CHAIN_ID`
- `NEXT_PUBLIC_0G_RPC_URL`
- `NEXT_PUBLIC_POI_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS`
- `NEXT_PUBLIC_POI_DEMO_OWNER`
- `NEXT_PUBLIC_CODEGUARDIAN_INFT_ID`
- `NEXT_PUBLIC_FAKEAGENT_INFT_ID`
- `NEXT_PUBLIC_POI_PASSPORT_ID`
- `NEXT_PUBLIC_POI_CERTIFICATE_ID`

## Troubleshooting

- If writes are disabled, check `POI_ENABLE_LIVE_WRITES` and the admin token.
- If a transaction is refused, check chain ID, wallet address, and testnet balance.
- If verification drops tiers, compare manifest, intelligence, memory, run, and certificate roots.
- If compute is unavailable, switch compute mode to `hybrid` and label the output.
- If storage is unavailable, use deterministic mock storage and export the proof JSON.
