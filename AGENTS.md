# AGENTS.md

## Core Rules

- Solve only the stated problem. Do not add speculative features, hooks, configurability, or abstractions.
- Keep code as small as practical. If a simple solution is available, use it.
- Make surgical diffs. Every changed line must trace directly to the request.
- Match existing project style exactly: naming, layout, indentation, imports, and formatting.
- Prefer deleting code over adding code when that fully solves the problem.
- Do not refactor adjacent working code unless the task requires it.
- Clean up only orphans created by your own changes.
- Use pnpm for installs, scripts, tests, and builds.
- Do not build unrelated finance/trading features, generic NFT marketplace flows, or generic chat app features.

## Execution

- State verifiable success criteria before writing code.
- Prefer tests, scripts, benchmarks, screenshots, or type checks over reasoning from the diff.
- Run the relevant verification before saying the task is done.
- Run lint, typecheck, test, and build before commits when practical; otherwise run the relevant narrower check and explain why.
- If verification fails, fix the root cause, not the test.
- For UI changes, verify visually with before/after screenshots when practical.
- Read full errors, logs, and stack traces before changing code.

## Tools

- Prefer running the code over guessing about it.
- Use subagents for broad exploration that would otherwise flood the main context.
- Prefer gh, rg, fd, jq, git, curl, and project CLIs over MCPs when possible.

## Session Hygiene

- After two failed corrections on the same issue, stop and summarize what was learned before continuing.
- Keep commits focused and descriptive. Use a subject under 72 characters and explain the why in the body when useful.
- Do not add `Co-Authored-By` attribution unless the project explicitly asks for it.

## Proof-of-Intelligence Rules

- Keep secrets out of git: never commit `.env`, private keys, tokens, mnemonics, generated wallets, local DBs, keystores, or logs containing secrets.
- Never expose server secrets through `NEXT_PUBLIC_` variables or browser code.
- Prefer deterministic mock fallback for 0G chain, storage, compute, DA, and ENS paths so demos remain reliable.
- Prioritize 0G integration evidence, hosted product reliability, and honest live/hybrid/mock labeling.
- Hosted write APIs must stay server-only, admin-token protected, allowlisted, idempotent where possible, and testnet-only.

## Project Learnings

- Keep this file short. Add concrete rules only when a mistake shows they are needed.
- Prune rules that no longer prevent real mistakes.
