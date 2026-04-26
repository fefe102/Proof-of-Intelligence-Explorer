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

When live storage is unavailable, the app keeps deterministic mock artifacts and labels the evidence `mock` or `hybrid`.

## Compute

0G Compute is the target for CodeGuardian's two-stage behavior:

1. analysis run that finds a code bug or risk
2. critic/self-review run that evaluates the proposed patch

Run records should include provider, model, run ID, input root, output root, status, and timestamp. Mock compute returns deterministic records for reliable judging.

## Optional DA

The optional DA module exports a bundle containing:

- manifest root
- intelligence bundle root
- memory root
- latest run root
- certificate ID
- source mode labels

The verifier does not fail if DA is missing.

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

## Troubleshooting

- If writes are disabled, check `POI_ENABLE_LIVE_WRITES` and the admin token.
- If a transaction is refused, check chain ID, wallet address, and testnet balance.
- If verification drops tiers, compare manifest, intelligence, memory, run, and certificate roots.
- If compute is unavailable, switch compute mode to `hybrid` and label the output.
- If storage is unavailable, use deterministic mock storage and export the proof JSON.
