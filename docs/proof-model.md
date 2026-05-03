# Proof Model

CodeGuardian iNFT is the autonomous 0G Agentic ID / ERC-7857-style agent. AgentProof verifies its evidence stack.

## Evidence Stack

1. The CodeGuardian iNFT token exists and ownership is readable on 0G Galileo.
2. A `poi/v0.1` manifest exists and binds to the same contract/token ID.
3. The AES-256-GCM encrypted intelligence artifact hashes to `intelligenceBundleRoot`.
4. The memory/current-state artifact hashes to `memoryRoot`.
5. The memory history shows sequential roots across autonomous runs.
6. Compute run IDs exist for analysis and critic passes.
7. Replay trace events include the concrete proposed patch diff and recompute to the documented trace root.
8. A certificate binds the iNFT, roots, and compute run IDs.

## Root Rules

- `manifestRoot = hashManifestForRoot(manifest)`.
- `hashManifestForRoot` canonicalizes JSON and omits `storage.manifestRoot` before hashing.
- `intelligenceBundleRoot = hashCanonicalJson(encryptedIntelligenceBundle)`.
- `memoryRoot = hashCanonicalJson(latestMemoryState)`.
- `trace_committed.detail.traceRoot = hashCanonicalJson(eventsBeforeTraceCommitted)`.
- `latestRunRoot = hashCanonicalJson(fullRunTraceIncludingTraceCommittedAndCertificateIssued)`.
- `certificateRoot = hashCanonicalJson(certificate)`.

All roots use canonical JSON and SHA-256 with `sha256:<hex>` formatting.

## Memory Evolution

CodeGuardian has three memory versions:

- v1: learned to validate JSON parse failures before using parsed payloads.
- v2: learned to verify authorization before returning private records.
- v3: learned to wrap awaited side effects in explicit error handling.

The latest memory root must equal the memory root in the manifest, certificate, report, API, and proof export.

## Dynamic Upgrade

After Run 002, CodeGuardian upgrades `critic-loop v0.1.0 -> v0.1.1`. The upgrade stores old/new policy hashes, reason, and the run that caused the upgrade. Skill hashes are SHA-256 hashes of files under `examples/codeguardian/skills`.

## Source Labels

- `live`: fetched from live 0G chain, storage, compute, or registry evidence.
- `hybrid`: live chain plus deterministic hosted evidence, or partially live evidence through the same adapter interface.
- `mock`: deterministic fixture only.

Hybrid/mock evidence must never be described as live.

## Negative Control

FakeAgent must never pass high-tier verification. Arbitrary tokens without manifests must return low-tier or unsupported reports and must never be substituted with CodeGuardian evidence.
