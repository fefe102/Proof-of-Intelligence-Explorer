# Demo Guide

This guide supports the ETHGlobal judging flow for **CodeGuardian iNFT**.

## Goal

Show that CodeGuardian is an autonomous 0G Agentic ID / ERC-7857-style iNFT code-review agent with embedded encrypted intelligence, evolving memory, compute/hybrid critic evidence, replayable behavior, dynamic policy upgrade evidence, authorized execution semantics, and a Proof-of-Intelligence certificate. AgentProof verifies it. FakeAgent fails.

## Hosted Walkthrough

1. Open https://proof-of-intelligence-explorer.vercel.app.
2. Open **Agent Console**.
3. Open `/judge` and show minted 0G Galileo Agentic ID/iNFT details: contract `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`, token ID `1`.
4. Click **Run CodeGuardian on demo file** and explain it is an allowlisted deterministic/hybrid preview.
5. Open **Review a pasted diff** and explain the public path hashes/reviews text without executing code, shelling out, sending calldata, or exposing write credentials.
6. Show memory evolution across `codeguardian-run-001`, `codeguardian-run-002`, and `codeguardian-run-003`.
7. Replay the latest run.
8. Open the certificate.
9. Open FakeAgent and show low-tier failure.
10. Show API/badge/SDK/CLI on the developer page.

## Local Demo

```bash
pnpm install
pnpm dev
```

Run the seeded proof flow:

```bash
pnpm demo:generate-artifacts
pnpm seed:demo
pnpm demo:verify
pnpm demo:run-agent
pnpm demo:replay
pnpm demo:export-proof
```

## Live / Hybrid Notes

- 0G Chain proof is live on Galileo.
- 0G Storage proof objects are live uploaded and recorded with root hashes, tx hashes, and tx sequences.
- 0G Compute is hybrid: Runs 001-002 use deterministic records and Run 003 includes live 0G Compute analysis and critic records.
- Admin actions are disabled unless `POI_ENABLE_LIVE_WRITES=true` and `POI_ADMIN_TOKEN` are configured server-side.
- Live writes spend only 0G Galileo testnet funds and preflight chain ID, wallet address, and balance.

For the exact sub-3-minute narration, use [docs/demo-script.md](docs/demo-script.md).
