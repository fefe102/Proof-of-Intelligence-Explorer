# Demo Guide

This guide supports the ETHGlobal judging flow for Proof-of-Intelligence Explorer.

## Goal

Show that CodeGuardian is a real iNFT-style agent with embedded intelligence, persistent memory, compute-backed runs, and replayable behavior, while FakeAgent fails those checks.

## Local Demo

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Run the deterministic mock flow:

```bash
pnpm seed:demo
pnpm demo:verify
pnpm demo:run-agent
pnpm demo:replay
pnpm demo:export-proof
```

## Browser Walkthrough

1. Open the landing page.
2. Click **Try FakeAgent** and point out the low tier, missing manifest/intelligence/memory/compute evidence, and failed checklist items.
3. Click **Verify CodeGuardian** and show the high tier, source mode badges, evidence roots, and raw JSON.
4. Open the replay page and walk through the timeline from `task_received` through `certificate_issued`.
5. Open the certificate page and show the printable proof with iNFT, owner, roots, and compute run IDs.
6. Open the developer page and show the SDK/CLI snippet for other 0G iNFT teams.

## Live Demo Notes

- Public pages work without admin access.
- Admin actions are hidden or disabled unless live writes and `POI_ADMIN_TOKEN` are configured.
- Live writes spend only 0G Galileo testnet funds and must preflight chain ID, wallet address, and balance.
- Hybrid/mock evidence is labeled honestly when a live 0G component is unavailable.

## Fallback

If the live deployment, wallet, or 0G service is unavailable during judging:

1. Use the hosted public seeded demo if available.
2. Use the deterministic local mock flow.
3. Show `public/demo/codeguardian-proof.sample.json` and `public/demo/fakeagent-proof.sample.json` as safe proof fixtures.
4. Explain which components are live, hybrid, or mock in the status panel.

For the exact 3-minute narration, use [docs/demo-script.md](docs/demo-script.md).
