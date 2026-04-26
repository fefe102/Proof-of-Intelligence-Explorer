# Deployment

Deployment has two goals: keep the public read-only explorer always available, and make live writes possible only through guarded server-side paths.

## Local Setup

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the local app:

```bash
pnpm dev
```

## Environment

Copy `.env.example` to an ignored local env file. Fill only values needed for the mode you are testing.

Public browser-display values:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_POI_PUBLIC_MODE`
- `NEXT_PUBLIC_0G_CHAIN_ID`
- `NEXT_PUBLIC_0G_RPC_URL`
- `NEXT_PUBLIC_POI_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS`

Server-only values:

- `POI_ADMIN_TOKEN`
- `POI_ENABLE_LIVE_WRITES`
- `POI_MAX_TX_PER_OPERATION`
- `0G_RPC_URL`
- `0G_PRIVATE_KEY`
- `0G_WALLET_ADDRESS`
- `0G_STORAGE_INDEXER_RPC`
- `0G_COMPUTE_PROVIDER`
- `0G_COMPUTE_MODEL`
- `0G_COMPUTE_SERVICE_URL`
- `0G_COMPUTE_BEARER_TOKEN`
- `POI_DEMO_ENCRYPTION_KEY`

Never commit local env files, private keys, bearer tokens, admin tokens, encryption material, generated wallets, local databases, or logs containing secrets.

## Live 0G Deployment Flow

1. Verify `0G_CHAIN_ID` is `16602`.
2. Verify the RPC reports the same chain ID.
3. Verify the configured wallet address matches the private key.
4. Verify the wallet has enough Galileo testnet balance.
5. Run contract deployment.
6. Seed CodeGuardian and FakeAgent.
7. Upload or record storage evidence.
8. Run CodeGuardian and write the trace.
9. Issue the certificate.
10. Write non-secret deployment metadata to safe artifacts.

Commands:

```bash
pnpm contracts:deploy:live
pnpm demo:live:seed
pnpm demo:live:run-agent
```

If live storage, compute, or DA services are unavailable, keep those adapters in hybrid/mock mode and label them honestly in the public explorer.

## Vercel Project

Project name: `proof-of-intelligence-explorer`

```bash
vercel link
```

If prompted, create or select the Vercel project with that name.

## Vercel Environment Variables

Set public values directly:

```bash
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_POI_PUBLIC_MODE production
vercel env add NEXT_PUBLIC_0G_CHAIN_ID production
vercel env add NEXT_PUBLIC_0G_RPC_URL production
vercel env add NEXT_PUBLIC_POI_REGISTRY_ADDRESS production
vercel env add NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS production
```

Set server-only values through Vercel sensitive env workflows or stdin/temp-file methods that do not print values. Delete any temp files immediately after use.

Server-only variables to configure when live writes are enabled:

- `POI_ADMIN_TOKEN`
- `POI_ENABLE_LIVE_WRITES`
- `POI_MAX_TX_PER_OPERATION`
- `0G_RPC_URL`
- `0G_PRIVATE_KEY`
- `0G_WALLET_ADDRESS`
- `0G_STORAGE_INDEXER_RPC`
- `0G_COMPUTE_PROVIDER`
- `0G_COMPUTE_MODEL`
- `0G_COMPUTE_SERVICE_URL`
- `0G_COMPUTE_BEARER_TOKEN`
- `POI_DEMO_ENCRYPTION_KEY`

## Production Deploy

Run final checks before deployment:

```bash
pnpm final:check
```

Deploy:

```bash
vercel --prod
```

After deployment:

1. Record the production URL in `SUBMISSION.md`.
2. Update `NEXT_PUBLIC_APP_URL` in Vercel production env.
3. Redeploy if the URL changed.
4. Record safe deployment metadata only; never record secrets.

## If Vercel Prompts Block Automation

Complete the deployment manually with:

```bash
vercel login
vercel link
pnpm final:check
vercel --prod
```

Then add the production URL and safe deployment metadata to the docs.

## Current Deployment Attempt

Automated production deployment was attempted after `pnpm final:check` passed. The Vercel CLI could start, but the configured local Vercel token was rejected:

```text
Error: The specified token is not valid. Use `vercel login` to generate a new token.
```

Retry after refreshing Vercel auth:

```bash
pnpm exec vercel login
pnpm exec vercel link --yes --project proof-of-intelligence-explorer
pnpm exec tsx scripts/sync-vercel-env.ts
pnpm final:check
pnpm exec vercel --prod --yes
```

## Rotation

To rotate secrets:

1. Generate the replacement outside the repository.
2. Update Vercel production env.
3. Update local ignored env files.
4. Redeploy.
5. Re-run public verification and admin route protection checks.
6. Revoke or stop using the old value.

Never commit old or new secret values during rotation.
