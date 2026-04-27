# Proof Model

The Proof-of-Intelligence model is a tiered evidence stack:

1. iNFT token ownership is readable.
2. A `poi/v0.1` manifest exists.
3. The encrypted intelligence bundle root matches.
4. The memory/current-state root matches.
5. Compute run IDs and replayable trace match.
6. A certificate binds the iNFT, roots, and compute run IDs.

`manifestRoot` is the canonical SHA-256 hash of the manifest with `storage.manifestRoot` omitted before hashing. This prevents self-referential hashing while keeping the root deterministic.

The run root is the canonical SHA-256 hash of the full run trace object. Trace events may include precommit roots, but all-zero placeholders are invalid fixture data and should not be used.

FakeAgent must never pass high-tier verification. Arbitrary tokens without manifests must return low-tier or unsupported reports and must never be substituted with CodeGuardian evidence.
