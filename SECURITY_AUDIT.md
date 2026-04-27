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
