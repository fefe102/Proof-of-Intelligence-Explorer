# ETHGlobal Submission

## Project

**Proof-of-Intelligence Explorer**

Proof-of-Intelligence Explorer is a 0G-backed proof layer for iNFT-style agents. It lets judges verify whether an agent token contains encrypted intelligence, persistent memory, 0G Compute history, and replayable behavior instead of only NFT metadata.

## Links

- Live demo URL: https://proof-of-intelligence-explorer.vercel.app
- Demo video: `<add ETHGlobal demo video URL>`
- Public GitHub: `<add public GitHub repository URL>`
- Minted iNFT explorer link: `<add 0G Galileo explorer token URL>`

## Contract Deployments

- 0G Chain ID: `16602` Galileo testnet
- Demo iNFT contract: `<POI_DEMO_INFT_ADDRESS>`
- Proof-of-Intelligence registry: `<POI_REGISTRY_ADDRESS>`
- Certificate contract or registry record: `<POI_CERTIFICATE_ADDRESS or registry certificate ID>`
- CodeGuardian token ID: `<token ID>`
- FakeAgent token ID: `<token ID>`

## What It Proves

The explorer verifies a tiered Proof-of-Intelligence passport:

- token existence and ownership
- schema-valid `poi/v0.1` manifest
- encrypted intelligence bundle root
- persistent memory checkpoint and current state root
- 0G Compute analysis and critic/self-review run records
- replayable behavior trace
- JSON proof export and printable certificate

CodeGuardian is the positive demo agent. FakeAgent is the negative control that looks token-like but lacks the required intelligence, memory, compute, and trace evidence.

## 0G Usage

**0G Chain:** demo iNFT minting, proof registry, root updates, and certificate issuance on Galileo testnet.

**0G Storage:** encrypted intelligence bundle, memory checkpoint/current-state artifacts, and immutable run trace roots. Hybrid/mock mode is labeled when live storage is unavailable.

**0G Compute:** CodeGuardian analysis and critic/self-review records, including provider/model/run metadata. Hybrid/mock mode is labeled when live compute is unavailable.

**0G DA, optional:** exportable proof bundle for teams that want an additional availability artifact.

**ENS, optional:** light alias resolution support; this submission does not require a live ENS name.

## Architecture

The product has five parts:

1. Explorer UI for public verification, replay, certificates, developer docs, and guarded admin actions.
2. SDK with manifest schema validation, canonical JSON hashing, adapters, and tiered verification.
3. CLI for demo seeding, verification, replay, proof export, live deploy, and Vercel sync workflows.
4. CodeGuardian runtime with analysis, patch proposal, critic loop, memory writes, trace events, and certificates.
5. Contracts for demo iNFT registration, root updates, and certificate issuance.

## Embedded Intelligence Evidence

CodeGuardian's proof links these roots:

- manifest root: `<manifest root>`
- encrypted intelligence bundle root: `<intelligence bundle root>`
- memory root: `<memory root>`
- latest run root: `<latest run root>`
- certificate ID: `<certificate ID>`

The public explorer displays the roots, source mode labels, verification checklist, raw JSON details, replay timeline, and certificate view.

## Team / Contact

Provided in the ETHGlobal dashboard; omitted from the public repository.

## Setup

```bash
pnpm install
pnpm dev
pnpm final:check
```

See [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md), and [docs/0g-integration.md](docs/0g-integration.md) for local, live, and Vercel setup.
