# CodeGuardian iNFT Spec

## 1. Product Identity

- ETHGlobal submission name: **CodeGuardian iNFT**
- Supporting proof layer: **AgentProof - Proof-of-Intelligence Explorer for 0G iNFT agents**
- One-line pitch: CodeGuardian iNFT is an autonomous 0G Agentic ID / ERC-7857-style code-review agent with embedded encrypted intelligence, evolving persistent memory, compute-backed self-critique, replayable behavior traces, dynamic skill/policy upgrades, authorized execution semantics, and a public Proof-of-Intelligence certificate.
- Winning frame: **CodeGuardian is the autonomous iNFT agent. AgentProof is how judges verify it is real.**
- Primary sponsor target: 0G - Best Autonomous Agents, Swarms & iNFT Innovations
- Secondary compatible target: 0G - Best Agent Framework, Tooling & Core Extensions

## 2. Core Problem

Many iNFTs can be only metadata pointers. 0G builders, users, marketplaces, and judges need to verify whether an agent token actually has embedded intelligence, persistent memory, compute-backed behavior, and replayable evidence. CodeGuardian demonstrates the autonomous iNFT; AgentProof supplies the reusable verification, certificate, SDK, CLI, API, registry, and badge layer.

## 3. Core Users

- 0G hackathon judges evaluating iNFT intelligence claims
- iNFT buyers and users
- 0G autonomous-agent builders
- marketplaces and agent registries
- agent frameworks
- developers using the AgentProof SDK, CLI, API, and badge

## 4. Core Product Flows

- Open `/judge` and inspect the minted 0G Agentic ID / iNFT proof checklist.
- Open CodeGuardian iNFT and inspect minted 0G iNFT details.
- Use the Agent Console to see current goal, status, queue, latest run, memory version, compute analysis, critic reflection, policy upgrade, certificate, and roots.
- Run or preview CodeGuardian on an allowlisted demo task.
- View memory evolution across at least three autonomous runs.
- Replay certified runs.
- View and export the Proof-of-Intelligence certificate.
- Verify CodeGuardian or any 0G iNFT/token with AgentProof.
- Compare FakeAgent as a negative metadata-only control.
- Create a Passport draft for another 0G iNFT agent.
- Use public API, SVG badge, SDK, and CLI.

## 5. Architecture

- `apps/explorer`: hosted Next.js product, CodeGuardian pages, Agent Console, AgentProof verifier, APIs, admin UI, badge endpoint.
- `packages/sdk`: manifest schemas, canonical hashing, real demo encryption helpers, adapters, verifier, passport builder, recorder helpers.
- `packages/cli`: builder CLI for verification, CodeGuardian run/replay, passport creation, proof export, live scripts.
- `packages/agent-runtime`: CodeGuardian autonomous runtime, deterministic safe tasks, trace generation, memory evolution, replay.
- `contracts`: ERC-7857-style demo iNFT and Proof-of-Intelligence registry contracts.
- `examples/codeguardian`: deterministic task fixtures and skill/policy files.
- `docs`: product, proof model, API, SDK, create-passport, security, 0G integration, demo script.
- `scripts`: guarded live deployment, storage, compute, seed, hash, and Vercel sync helpers.
- Vercel: production hosting.
- 0G adapters: Chain, Storage, Compute, optional DA, and ENS-compatible adapter interfaces kept for future work.

## 6. Proof Model

The proof model is anchored by the CodeGuardian iNFT token and a Proof-of-Intelligence manifest. The manifest points to an encrypted intelligence bundle, memory/current-state evidence, memory history, immutable run traces, compute run history, dynamic policy/skill upgrade evidence, certificate, and optional DA bundle. ENS is not part of the current prize strategy; any ENS fields are mock/compatibility metadata only until a real live ENS name or subname is configured.

## 7. Verification Tiers

- Tier 0: unsupported / not an iNFT
- Tier 1: token exists and ownership readable
- Tier 2: valid Proof-of-Intelligence manifest
- Tier 3: intelligence bundle exists and root matches
- Tier 4: memory/current state verified
- Tier 5: compute history and executable behavior trace verified
- Tier 6: replayable certified agent

## 8. Source Labels

- `live`: fetched from live 0G chain, storage, compute, or registry evidence.
- `hybrid`: live chain plus deterministic hosted evidence, or partially live evidence wired through the same verifier/adapters.
- `mock`: deterministic local/demo fixture only.

Labels must be shown honestly in UI, API, CLI, docs, and certificates. Hybrid or mock evidence must never be described as live.

## 9. Hard Invariants

- CodeGuardian positive proof paths use the live 0G Galileo iNFT contract `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9` and token ID `1`.
- Certificate token contract and token ID must match the manifest, report, API, certificate page, and proof export.
- `manifestRoot` is `hashManifestForRoot(manifest)`, the canonical SHA-256 hash of the manifest with `storage.manifestRoot` omitted before hashing.
- Intelligence root must match the encrypted intelligence bundle.
- The public intelligence artifact uses AES-256-GCM demo encryption with no committed real key.
- Memory root must match latest memory/current-state evidence.
- Memory roots must evolve across CodeGuardian runs.
- Trace root is computed over all events before `trace_committed`; final run root is the canonical hash of the full run trace including `trace_committed` and `certificate_issued`.
- Compute run IDs in the manifest must exist in compute evidence.
- Skill/policy hashes must be deterministic hashes of actual files under `examples/codeguardian/skills`.
- Dynamic upgrade evidence must include old/new policy versions, hashes, reason, and trace event.
- FakeAgent never reaches a high tier.
- Arbitrary token with no manifest returns a low-tier or unsupported report, never CodeGuardian fixture data.
- Browser code never receives private keys, admin tokens, bearer tokens, encryption keys, mnemonics, generated wallet secrets, or server-only write credentials.

## 10. Hosted Product Requirements

- Vercel production site works without local setup.
- Public pages work for CodeGuardian, FakeAgent, run replay, certificate, verify, create-passport, developer docs, passport pages, and badge.
- `/agent/codeguardian/console` makes CodeGuardian feel like a long-running autonomous iNFT agent.
- Public API works for seeded agents and arbitrary token verification.
- Public badge route works.
- Create Passport flow can compute/generate proof artifacts in hybrid/testnet mode.
- Admin writes are guarded and disabled unless configured.
- Live/hybrid/mock labels are explicit.

## 11. Security Invariants

- `.env` and secret-bearing local files are never committed.
- No secret uses a `NEXT_PUBLIC_` prefix.
- Private keys are server-only.
- Admin routes require `POI_ADMIN_TOKEN` and are disabled unless `POI_ENABLE_LIVE_WRITES=true`.
- No arbitrary calldata, raw transaction signing, shell execution, or untrusted code execution is accepted from the browser.
- Writes are 0G Galileo/testnet only.
- The product never hides mock evidence as live evidence.

## 12. Non-Goals

- No generic NFT marketplace.
- No generic chatbot.
- No finance or trading features.
- No Uniswap, Gensyn, or KeeperHub scope unless intentionally added later.
- No ENS prize claim unless a real live ENS name/subname is configured and used for agent identity, discovery, or access control.
- No overclaiming hybrid or mock evidence as live.

## 13. Acceptance Criteria

- CodeGuardian is clearly the autonomous 0G iNFT agent.
- AgentProof is clearly the reusable proof layer.
- CodeGuardian has a minted iNFT proof section.
- CodeGuardian has embedded encrypted intelligence evidence.
- CodeGuardian has evolving memory across at least three runs.
- CodeGuardian has a compute-backed or honestly hybrid critic loop.
- CodeGuardian has replayable run traces.
- CodeGuardian has a dynamic upgrade event.
- CodeGuardian has a Proof-of-Intelligence certificate.
- FakeAgent fails verification.
- Proof data is internally consistent.
- No positive CodeGuardian proof path uses the mock token address.
- No placeholder skill hashes remain in live/hybrid evidence.
- Manifest and trace root semantics are explicit and tested.
- Public pages work hosted and locally.
- Admin writes are guarded.
- No secrets are tracked or exposed.
- README, SUBMISSION, DEMO, docs, SPEC, and STATUS are accurate.
- `pnpm final:check` and contract tests pass.
- Vercel production deployment is attempted/completed.
