# 0G Integration

CodeGuardian iNFT targets the 0G autonomous/iNFT track as a minted 0G Agentic ID / ERC-7857-style agent. AgentProof provides the reusable proof layer.

## Modes

- `live`: fetched from live 0G chain, storage, compute, or registry evidence.
- `hybrid`: live chain plus deterministic hosted evidence or partially live evidence.
- `mock`: deterministic fixture only.

Every page/API labels evidence honestly.

## 0G Chain

Live Galileo seed:

- Chain ID: `16602`
- CodeGuardian iNFT: `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`
- CodeGuardian token ID: `1`
- Registry: `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`
- Certificate record: `3`
- FakeAgent control token ID: `2`

The demo iNFT contract is ERC-7857-style and aligned with 0G Agentic ID proof semantics. It exposes manifest, intelligence, memory, latest run, usage, skill hash, authorized usage, and run certification semantics. It is not a marketplace.

Guardrails:

- expected chain ID is `16602`
- RPC chain ID must match before writes
- configured wallet address must match the private key
- balance is checked before transactions
- retries are bounded
- browser input never supplies arbitrary calldata

## 0G Storage

0G Storage is the target for:

- encrypted intelligence bundle
- memory/current-state artifact
- memory history/log artifact
- run traces
- compute run bundle
- certificate bundle

The current CodeGuardian proof bundle has live 0G Storage records for all six allowlisted artifacts. The UI shows roots, byte lengths, StorageScan search guidance, root hashes, tx hashes, and tx sequences.

Current tx sequences:

- manifest: `68674`
- encrypted intelligence: `68661`
- memory: `68677`
- latest run trace: `68678`
- compute bundle: `68679`
- certificate: `68681`

## 0G Compute

CodeGuardian uses two compute-shaped records for each run:

1. analysis run
2. critic/self-review run

The current compute evidence is hybrid by design: Runs 001-002 use deterministic records and Run 003 includes live 0G Compute analysis and critic calls. The adapter/interface is the same shape used by live 0G Compute scripts, and pages label the mixed compute layer as `hybrid`.

## Optional 0G DA

AgentProof can export a DA proof bundle containing the key roots. DA is optional and missing DA evidence does not reduce the verification tier.

## Optional ENS

ENS is not part of the current prize strategy. A missing ENS name does not fail verification. `codeguardian.poi-demo.eth` is a mock compatibility alias only, and the submission does not claim live ENS identity, subname discovery, access gating, or ENS text-record proofs.

## Environment

Server-only values:

- `POI_ADMIN_TOKEN`
- `POI_ENABLE_LIVE_WRITES`
- `0G_PRIVATE_KEY`
- `0G_WALLET_ADDRESS`
- `0G_COMPUTE_BEARER_TOKEN`
- `POI_DEMO_ENCRYPTION_KEY`

Public display values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_POI_PUBLIC_MODE`
- `NEXT_PUBLIC_0G_CHAIN_ID`
- `NEXT_PUBLIC_0G_RPC_URL`
- `NEXT_PUBLIC_POI_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS`

Never expose server-only values through `NEXT_PUBLIC_`.
