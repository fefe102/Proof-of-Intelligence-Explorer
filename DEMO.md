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

Run the seeded proof flow. With the checked-in deployment artifacts present, the CLI verifies the live CodeGuardian proof bundle and the FakeAgent control:

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
- The hosted demo is seeded on 0G Galileo with Demo iNFT `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`, registry `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`, CodeGuardian token `1`, and FakeAgent token `2`.
- Admin actions are hidden or disabled unless live writes and `POI_ADMIN_TOKEN` are configured.
- Live writes spend only 0G Galileo testnet funds and must preflight chain ID, wallet address, and balance.
- The public UI labels 0G Chain, Storage, Compute, DA, and ENS evidence separately. CodeGuardian is seeded with live Chain, Storage, and Compute evidence; DA/ENS remain optional.

## Fallback

If the live deployment, wallet, or 0G service is unavailable during judging:

1. Use the hosted public seeded demo if available.
2. Use the deterministic local mock flow.
3. Show `public/demo/codeguardian-proof.sample.json` and `public/demo/fakeagent-proof.sample.json` as safe proof fixtures.
4. Explain which components are live, hybrid, or mock in the status panel.

For the exact 3-minute narration, use [docs/demo-script.md](docs/demo-script.md).
