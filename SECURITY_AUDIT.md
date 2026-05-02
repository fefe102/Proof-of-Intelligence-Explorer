# Security Audit

Audit date: 2026-04-27

## Scope

This audit covered:

- tracked repository files and deployment artifacts
- public and admin Next.js API routes
- browser/server environment boundaries
- Vercel production deployment posture
- 0G live write scripts and transaction guardrails
- demo contracts and authorization model
- dependency advisories for production and development tooling

## Current Audit Pass

Fresh pass: 2026-04-27T08:27:29Z

Commands and probes run in this pass:

```bash
git status --short --branch
pnpm lint
pnpm audit:prod
pnpm audit --audit-level moderate
git ls-files .env .env.local .env.production .vercel keys secrets .wallets tmp temp '*.pem' '*.key' '*.keystore' '*.sqlite' '*.db'
rg -n "<machine-local home path>|<personal email pattern>|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|mnemonic|seed phrase" .
rg -n "NEXT_PUBLIC_.*(PRIVATE|SECRET|TOKEN|KEY|BEARER|MNEMONIC)|0G_PRIVATE_KEY|POI_ADMIN_TOKEN|0G_COMPUTE_BEARER_TOKEN|POI_DEMO_ENCRYPTION_KEY" apps packages scripts docs README.md SUBMISSION.md SECURITY_AUDIT.md deployments .env.example
curl -I https://proof-of-intelligence-explorer.vercel.app
curl -i -X POST https://proof-of-intelligence-explorer.vercel.app/api/admin/seed-demo
curl https://proof-of-intelligence-explorer.vercel.app/api/health
curl https://proof-of-intelligence-explorer.vercel.app/api/verify?agent=codeguardian
curl https://proof-of-intelligence-explorer.vercel.app/api/verify?agent=fakeagent
```

Current pass result:

- no tracked `.env`, Vercel project metadata, private key, wallet, local DB, keystore, temp output, or generated secret file was found
- no tracked personal email address, machine-local home path, PEM private key header, mnemonic, or seed phrase was found
- secret lint passed across 133 tracked files
- production dependency audit passed the moderate gate; one low advisory remains documented below
- full dependency audit still fails on dev-only Hardhat/Vitest tooling advisories documented below
- hosted security headers are present: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`
- hosted admin write endpoint rejected unauthenticated access and returned `Cache-Control: private, no-store`
- hosted public health endpoint reports `liveWritesEnabled: false`
- CodeGuardian remains tier 6, FakeAgent remains tier 1, and ENS is labeled mock compatibility metadata only

## Result

Production posture is suitable for the hosted hackathon demo:

- no private keys, admin tokens, bearer tokens, encryption keys, mnemonics, or personal contact emails are tracked
- hosted public pages and public APIs are read-only
- hosted live write actions remain disabled unless server-only admin and wallet env vars are configured
- CodeGuardian uses live 0G Chain evidence, deterministic hybrid 0G Storage/Compute proof artifacts, optional DA labeled mock, and ENS compatibility explicitly deferred as mock-only future work
- `pnpm audit:prod` passes the moderate gate; `pnpm audit --prod` reports one low-severity advisory in a 0G broker transitive dependency path

## Fixes Applied

1. Hardened admin token validation.

Admin token checks now compare SHA-256 digests with `timingSafeEqual` instead of raw string equality. Missing or invalid tokens still return generic failures.

2. Disabled caching for admin responses.

All admin API responses now set `Cache-Control: private, no-store`.

3. Added browser security headers.

The explorer now sends a conservative CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a restrictive permissions policy.

4. Removed sensitive env presence metadata.

`deployments/vercel-env-plan.json` no longer records whether local sensitive env vars are configured. It records only public env values and the names of server-only env vars that operators must set manually.

5. Strengthened secret linting.

The secret linter now rejects tracked personal email addresses and tracked secret-presence metadata in addition to env files, non-empty sensitive assignments, and sensitive `NEXT_PUBLIC_*` names.

6. Reduced dependency audit surface.

The repo no longer pins the Vercel CLI as a dev dependency, and the unused React Vite plugin was removed from the test config. A PostCSS override clears the production audit advisory inherited through Next.js.

7. Overrode the vulnerable Axios production range.

The 0G SDK dependency tree pulled an Axios advisory through `open-jsonrpc-provider`. A `pnpm.overrides` pin upgrades Axios to the patched production range.

## Contracts

`DemoINFT` and `ProofOfIntelligenceRegistry` were reviewed for the hackathon threat model.

- `DemoINFT.mintDemo` is owner-only.
- Manifest root updates are restricted to the token owner or contract owner.
- Registry passport registration, root updates, and certificate issuance are restricted to the token owner or registry admin.
- Registry functions perform no arbitrary external calls beyond ERC-721 ownership reads.
- No contract custody, marketplace, payable, withdrawal, or arbitrary calldata execution paths exist.

Residual contract limitations:

- The registry is intentionally centralized around a configured admin for demo operations.
- Root correctness is application-verified; the contracts store roots and certificate records rather than proving off-chain content on-chain.

## Hosted API

Public routes:

- `/api/health`
- `/api/verify`
- `/api/passport/[chainId]/[contract]/[tokenId]`
- `/api/agent/[agent]`
- `/api/run/[runId]`
- `/api/certificate/[certificateId]`
- `/badge/[chainId]/[contract]/[tokenId].svg`

These routes return public proof data only.

Admin routes:

- `/api/admin/deploy`
- `/api/admin/seed-demo`
- `/api/admin/run-codeguardian`
- `/api/admin/issue-certificate`
- `/api/admin/export-da-bundle`

These routes require `POI_ADMIN_TOKEN`, remain disabled unless `POI_ENABLE_LIVE_WRITES=true`, and return sanitized operation bodies only.

Hosted verification:

- `POST /api/admin/seed-demo` without credentials returns `403`
- admin responses use `Cache-Control: private, no-store`
- write actions are currently disabled in production
- the admin token is held in browser React state only on the admin page and is not persisted by the app

## Dependency Audit

Production:

```bash
pnpm audit --prod --audit-level moderate
```

Result: exits successfully with no moderate-or-higher production vulnerabilities.

The broader production audit still reports one low-severity advisory:

- `elliptic <=6.6.1` through `@0glabs/0g-serving-broker > circomlibjs > ethers > @ethersproject/signing-key`. There is no patched version listed in the advisory, and this path is not exposed to browser code.

Development tooling:

```bash
pnpm audit --audit-level moderate
```

Residual advisories remain in dev-only tooling paths:

- Hardhat toolbox transitive packages: `undici`, `serialize-javascript`, `lodash`, `bn.js`, `uuid`
- Vitest transitive dev server tooling: `vite`/`esbuild`

These packages are not part of the hosted production runtime. They should be addressed in a future tooling upgrade, preferably by moving to newer Hardhat/Vitest major versions after contract tests are migrated and revalidated.

## Open Risks

No critical or high production-runtime issue was found in this pass. Remaining startup-grade risks:

1. Public API and badge routes do not have application-level rate limiting.

The current product is safe for the hackathon demo because public routes are read-only and write routes are disabled/token-gated, but a real free hosted product should add Vercel/edge/API rate limits, request size limits, and verification job quotas before broader launch.

2. CSP still permits inline scripts and styles.

The CSP blocks third-party script origins and framing, but `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'` remain to support Next.js/theme bootstrapping. A production hardening sprint should move to nonces or hashes where practical.

3. Vercel emits `Access-Control-Allow-Origin: *`.

Public APIs are intentionally read-only, and admin writes require an unknown bearer/admin token with live writes disabled. If admin writes become regularly enabled, add explicit CORS handling for admin routes and avoid any credentialed cross-origin flow.

4. Admin and live-write paths are centralized.

The registry/demo contracts allow a configured admin to update roots and issue certificates. This is acceptable for a hackathon demo and seeded agent, but a startup product should move routine Passport creation to wallet-owned transactions and reserve admin powers for emergency/demo operations.

5. 0G Storage and 0G Compute are currently hybrid proof artifacts.

The UI labels this honestly. For startup-grade credibility, rerun the live storage upload and live compute flow so the public report can show Chain, Storage, and Compute as live.

## Verification Commands

Security-specific checks:

```bash
pnpm lint
pnpm audit:prod
```

A targeted local-path and personal-email scan also completed with no tracked matches.

Full product checks and production deploy verification:

```bash
pnpm contracts:test
pnpm final:check
```

The latest production deployment was made from a gitless source copy and completed cleanly through Vercel. Hosted checks returned `CodeGuardian iNFT` from `/api/health`, tier 6 for CodeGuardian, tier 1 for FakeAgent, HTTP 200 for the Agent Console, replay, passport, certificate pages, and `image/svg+xml` for the public badge. ENS is explicitly labeled mock compatibility metadata and is not targeted for this submission.

## Operational Guidance

- Keep production writes disabled unless actively running an admin operation.
- Store private keys, admin tokens, 0G bearer tokens, and encryption keys only in ignored local env files or Vercel sensitive env vars.
- Rotate the 0G testnet wallet and admin token after demos that expose operator machines or logs.
- Do not commit screenshots, logs, deployment transcripts, or copied terminal output that include secret-bearing env values.
