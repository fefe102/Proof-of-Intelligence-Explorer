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
- Certificate registry record: `2`
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

**0G Storage:** encrypted intelligence bundle, memory checkpoint/current-state artifacts, and immutable run trace roots. The hosted demo currently labels this evidence as hybrid because the roots are deterministic public artifacts and the live storage adapter remains guarded/config-dependent.

**0G Compute:** CodeGuardian analysis and critic/self-review records, including provider/model/run metadata. The hosted demo currently labels compute as hybrid unless live compute credentials are configured server-side.

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

- manifest root: `sha256:15bfe045aec1946544e2c00a1df2cf5c982c641f823c101d0558bca9337ade43`
- encrypted intelligence bundle root: `sha256:1c47d70c2c89e0d843c1b8501e98f5bd2354f7b03b994e1b819b2fbc54b87fd4`
- memory root: `sha256:bd27bb774163cdfc375d5bcc22d55da8626002b0a209848d1f3687035bb90798`
- latest run root: `sha256:39d592c08a628ca34dc7b83ca6fe52584c3c56fade299fc0e274f1081c351909`
- certificate ID: `poi-cert-codeguardian-001` with on-chain registry record `2`

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
