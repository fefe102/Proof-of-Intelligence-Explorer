# Architecture

```mermaid
flowchart LR
  CodeGuardian["CodeGuardian iNFT"] --> Runtime["Agent Runtime"]
  Runtime --> Tasks["Allowlisted Demo Tasks"]
  Runtime --> Memory["Evolving Memory"]
  Runtime --> Upgrade["Critic Policy Upgrade"]
  Runtime --> Trace["Replayable Trace"]
  Runtime --> Compute["0G Compute / Hybrid Adapter"]
  Runtime --> Storage["0G Storage / Hybrid Bundle"]

  AgentProof["AgentProof Verifier"] --> Chain["0G Chain"]
  AgentProof --> Storage
  AgentProof --> Compute
  AgentProof --> Registry["Proof Registry"]
  AgentProof --> Certificate["Certificate"]
  AgentProof --> Badge["API + Badge"]

  Judge["Judge"] --> Console["Agent Console"]
  Console --> AgentProof
  Builder["0G Builder"] --> SDK["SDK / CLI / Create Passport"]
  SDK --> AgentProof
```

## Packages

- `apps/explorer`: hosted Agent Console, verifier, passport, certificate, replay, APIs, badge, admin.
- `packages/agent-runtime`: deterministic CodeGuardian autonomous runs, memory evolution, replay.
- `packages/sdk`: schemas, canonical hashing, verifier, adapters, encryption helpers, recorder.
- `packages/cli`: demo, verify, run, replay, export, live script wrappers.
- `contracts`: ERC-7857-style demo iNFT and Proof-of-Intelligence registry.
- `examples/codeguardian`: fixtures and skill/policy files used for deterministic hashes.

## Trust Boundaries

- Public pages and APIs are read-only.
- Browser input never becomes calldata, shell commands, or untrusted code execution.
- Admin writes require server-only token and remain disabled unless configured.
- Source labels are attached per evidence layer.
