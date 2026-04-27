# ETHGlobal Submission

## Project

**CodeGuardian iNFT**

CodeGuardian iNFT is an autonomous 0G code-review agent with embedded encrypted intelligence, evolving persistent memory, compute-backed self-critique, replayable behavior traces, dynamic skill/policy upgrades, and a Proof-of-Intelligence certificate.

Supporting product/proof layer: **AgentProof - Proof-of-Intelligence Explorer for 0G iNFT agents**.

Winning frame: **CodeGuardian is the autonomous iNFT agent. AgentProof is how judges verify it is real.**

## Links

- Live demo URL: https://proof-of-intelligence-explorer.vercel.app
- Agent Console: https://proof-of-intelligence-explorer.vercel.app/agent/codeguardian/console
- Public GitHub: https://github.com/fefe102/Proof-of-Intelligence-Explorer
- Demo video: added in ETHGlobal dashboard
- Minted iNFT explorer link: https://chainscan-galileo.0g.ai/address/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9
- CodeGuardian Passport: https://proof-of-intelligence-explorer.vercel.app/passport/16602/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9/1
- Certificate: https://proof-of-intelligence-explorer.vercel.app/certificate/poi-cert-codeguardian-001
- Badge SVG: https://proof-of-intelligence-explorer.vercel.app/badge/16602/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9/1.svg

## Contract Deployments

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

- Manifest root: `sha256:5704511de453c1a85d9ade4cf1b1c409f052a7556e184400070acc07900096b9`
- Encrypted intelligence bundle root: `sha256:6289903e00f2e42448eb3cad30d322fcd4e1b3e3af54dd37f35a863a864f0bcd`
- Latest memory root: `sha256:cb8cffe9ff8d50f66a4b6fe30f0ba334fec4636b45f976f40360fe4afe405fce`
- Latest run root: `sha256:5eea73e8098964c75c6da1aba8d37e7f677b491e0c8a229818eef3f0a4069dad`
- Certificate ID: `poi-cert-codeguardian-001`
- Compute run IDs: `zg-hybrid-analysis-001`, `zg-hybrid-critic-001`, `zg-hybrid-analysis-002`, `zg-hybrid-critic-002`, `zg-hybrid-analysis-003`, `zg-hybrid-critic-003`

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

**0G Chain:** live CodeGuardian iNFT mint, ERC-7857-style root accessors, registry, passport, and certificate records on Galileo testnet.

**0G Storage:** encrypted intelligence, memory, run trace, compute bundle, and certificate artifacts are represented by canonical roots. The current regenerated public bundle is labeled `hybrid` until the storage upload script is rerun with live 0G Storage env; previous live deployment metadata remains recorded separately.

**0G Compute:** analysis and critic records use 0G Compute-compatible run records and adapter paths. The current regenerated deterministic runs are labeled `hybrid` unless live compute is rerun.

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
