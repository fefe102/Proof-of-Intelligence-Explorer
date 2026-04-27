# ETHGlobal Submission

## Project

**Proof-of-Intelligence Explorer**

Proof-of-Intelligence Explorer is a 0G-backed proof layer for iNFT-style agents. It lets judges verify whether an agent token contains encrypted intelligence, persistent memory, 0G Compute history, and replayable behavior instead of only NFT metadata.

## Links

- Live demo URL: https://proof-of-intelligence-explorer.vercel.app
- Demo video: `<add ETHGlobal demo video URL>`
- Public GitHub: https://github.com/fefe102/Proof-of-Intelligence-Explorer
- Minted iNFT explorer link: https://chainscan-galileo.0g.ai/address/0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9

## Contract Deployments

- 0G Chain ID: `16602` Galileo testnet
- Demo iNFT contract: `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`
- Proof-of-Intelligence registry: `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`
- Certificate registry record: `3`
- CodeGuardian token ID: `1`
- FakeAgent token ID: `2`

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

**0G Chain:** live demo iNFT minting, proof registry, root updates, and certificate issuance on Galileo testnet.

**0G Storage:** encrypted intelligence bundle, memory checkpoint/current-state artifacts, immutable run trace, compute run bundle, and certificate object uploaded through the 0G Storage SDK. The explorer shows each 0G root hash, tx hash, and tx sequence.

**0G Compute:** CodeGuardian analysis and critic/self-review records generated through the configured 0G Compute provider path, including provider/model/run IDs and canonical prompt/output hashes.

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

- manifest root: `sha256:44d69c5206fad0ce2fc238fb11c50ae1f4b1ba63176a134236e3b91c2c96fe0a`
- encrypted intelligence bundle root: `sha256:1c47d70c2c89e0d843c1b8501e98f5bd2354f7b03b994e1b819b2fbc54b87fd4`
- memory root: `sha256:dc1e2df935e0db426cf1e0d3014142ebec59b2b917efdec5a5188d80a6774cdf`
- latest run root: `sha256:b8524cf76c1dadae7405d7fec813c4c43c84f588a42f0ceff2a5e5a1345c2e30`
- certificate ID: `poi-cert-codeguardian-001` with on-chain registry record `3`

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
