# ETHGlobal Submission

## Project

**CodeGuardian iNFT**

CodeGuardian iNFT is an autonomous 0G Agentic ID / ERC-7857-style code-review agent with embedded encrypted intelligence, evolving persistent memory, compute-backed self-critique, replayable behavior traces, dynamic skill/policy upgrades, authorized execution semantics, and a Proof-of-Intelligence certificate.

Supporting product/proof layer: **AgentProof - Proof-of-Intelligence Explorer for 0G iNFT agents**.

Winning frame: **CodeGuardian is the autonomous iNFT agent. AgentProof is how judges verify it is real.**

## Links

- Live demo URL: https://proof-of-intelligence-explorer.vercel.app
- Judge Mode: https://proof-of-intelligence-explorer.vercel.app/judge
- Agent Console: https://proof-of-intelligence-explorer.vercel.app/agent/codeguardian/console
- Safe diff review: https://proof-of-intelligence-explorer.vercel.app/agent/codeguardian/review
- Public GitHub: https://github.com/fefe102/Proof-of-Intelligence-Explorer
- Demo video: added in ETHGlobal dashboard
- Minted iNFT explorer link: https://chainscan-galileo.0g.ai/address/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9
- CodeGuardian Passport: https://proof-of-intelligence-explorer.vercel.app/passport/16602/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9/1
- Certificate: https://proof-of-intelligence-explorer.vercel.app/certificate/poi-cert-codeguardian-001
- Badge SVG: https://proof-of-intelligence-explorer.vercel.app/badge/16602/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9/1.svg

## Agentic ID / iNFT Deployment

- Chain: 0G Galileo
- Chain ID: `16602`
- CodeGuardian iNFT contract: `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`
- CodeGuardian token ID: `1`
- Owner: `0x053B860f329C9e4549D23dc8Aadf1116b99F1233`
- Proof registry: `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`
- Certificate registry record: `3`
- FakeAgent control token ID: `2`

ChainScan links to the contract page; token ID `1` is the CodeGuardian iNFT. Token-specific proof is available in the AgentProof passport page.

## Proof That Intelligence And Memory Are Embedded

- Manifest root: `sha256:098b7cc32da7fac1d514230617a404c59bfe80eaecac22c2ff612a8cc0089ba7`
- Encrypted intelligence bundle root: `sha256:6289903e00f2e42448eb3cad30d322fcd4e1b3e3af54dd37f35a863a864f0bcd`
- Latest memory root: `sha256:d559e2a8427d70dce884ecea72ae7678effa79e0d8b62178405495be9c57e5e1`
- Latest run root: `sha256:61aeab5b75456fa20b010ddf61d5c7e8077641368085168aa446aaf62b13fafb`
- Certificate ID: `poi-cert-codeguardian-001`
- Compute run IDs: `zg-hybrid-analysis-001`, `zg-hybrid-critic-001`, `zg-hybrid-analysis-002`, `zg-hybrid-critic-002`, `zg-live-analysis-95b970ef686e`, `zg-live-critic-69794555dda4`
- 0G Storage tx sequences: manifest `68674`, intelligence `68661`, memory `68677`, run `68678`, compute bundle `68679`, certificate `68681`

The public intelligence artifact is AES-256-GCM encrypted demo content. It contains only safe fixture plaintext before encryption and commits no real encryption key.

## Autonomous Agent Behavior

CodeGuardian has three sequential certified runs:

1. `codeguardian-run-001`: unsafe JSON parsing.
2. `codeguardian-run-002`: missing authorization guard.
3. `codeguardian-run-003`: unchecked async side effect.

Each run includes an allowlisted fixture, analysis, issue, patch, critic/self-review, memory delta, memory root, trace root, compute records, and certificate reference. The Agent Console shows memory root evolution from v1 to v3.

Dynamic upgrade:

- `critic-loop v0.1.0 -> v0.1.1`
- Reason: after detecting a missing authorization guard, CodeGuardian added an authorization-check heuristic to future critic reviews.
- Hashes are deterministic SHA-256 hashes of files under `examples/codeguardian/skills`.

## 0G Usage

**0G Chain:** live CodeGuardian Agentic ID / ERC-7857-style iNFT mint, root accessors, registry, passport, and certificate records on Galileo testnet.

**0G Storage:** encrypted intelligence, memory, run trace, compute bundle, and certificate artifacts are uploaded through 0G Storage SDK and recorded with root hashes, tx hashes, tx sequences, and byte lengths.

**0G Compute:** analysis and critic records use 0G Compute-compatible run records and adapter paths. Runs 001-002 are deterministic hybrid records; Run 003 includes live 0G Compute analysis and critic records.

**0G DA, optional:** AgentProof can export a proof bundle for DA workflows.

**ENS:** not targeted for this submission. Existing ENS fields are mock/compatibility hooks only; no live ENS identity, subname, gating, or discovery flow is claimed.

## AgentProof / Reusable Tooling

AgentProof includes:

- hosted explorer and Agent Console
- dynamic verifier for arbitrary 0G tokens
- SDK verifier, manifest builder, recorder, encryption helper, and proof exporter
- CLI for verify, run, replay, passport draft, proof export, live deploy, and env sync
- registry contracts and ERC-7857-style demo iNFT contract
- public API and badge endpoint
- safe pasted-diff review flow with no arbitrary code execution

FakeAgent is the negative control and remains low-tier because it lacks a valid manifest, encrypted intelligence, memory, compute, trace, and certificate evidence.

## Team / Contact

Provided in the ETHGlobal dashboard; omitted from the public repository.

## Setup

```bash
pnpm install
pnpm dev
pnpm final:check
```

See [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md), [docs/0g-integration.md](docs/0g-integration.md), and [docs/demo-script.md](docs/demo-script.md).
