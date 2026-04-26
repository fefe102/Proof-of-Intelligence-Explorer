# Security

The repository is public. Treat every tracked file as public.

## Never Commit

- `.env`, `.env.local`, `.env.production`
- private keys or mnemonics
- wallet files or generated wallets
- bearer tokens or API tokens
- admin tokens
- encryption keys
- Vercel project secrets
- local databases
- keystores
- screenshots or logs containing secrets

## Browser Boundary

Browser code may receive public display values only, such as chain ID, public RPC URL, public contract addresses, app name, app URL, and source mode.

Browser code must never receive:

- `0G_PRIVATE_KEY`
- `POI_ADMIN_TOKEN`
- `0G_COMPUTE_BEARER_TOKEN`
- `POI_DEMO_ENCRYPTION_KEY`
- wallet mnemonics or keystores

## Admin Routes

Hosted write APIs must:

- run server-side only
- require `POI_ADMIN_TOKEN`
- reject missing or invalid tokens
- stay disabled unless `POI_ENABLE_LIVE_WRITES` is enabled
- execute only allowlisted operations
- never accept arbitrary calldata or raw transaction signing payloads
- preflight chain ID, wallet address, balance, and retry limit
- write only on 0G Galileo testnet unless an explicit safe override is implemented
- return sanitized operation IDs and public metadata only

## Public Routes

Public routes are read-only. They can return verification reports, evidence roots, source labels, run traces, and certificate metadata. They must not return local env values or server-only configuration.

## Demo Encryption

Mock encryption fixtures contain safe demo content only. In live/admin mode, decrypt previews should remain server-gated. A future wallet-based decrypt flow can move decryption client-side only if the secret is derived from the owner's wallet and never stored by the app.

## Secret Checks

Before committing:

```bash
git status --short
pnpm lint
rg -n "PRIVATE_KEY|MNEMONIC|BEARER_TOKEN|API_KEY|ADMIN_TOKEN|ENCRYPTION_KEY|SECRET" README.md SUBMISSION.md DEMO.md DEPLOYMENT.md docs public/demo
```

The `rg` command is expected to find policy references in docs; inspect each match and confirm no real value is present.
