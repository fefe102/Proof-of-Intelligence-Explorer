# critic-loop v0.1.1

CodeGuardian critic reviews each proposed patch before it can be persisted.

Checks:
- patch is scoped to the finding
- patch is testable
- patch does not add new permissions
- patch preserves existing behavior outside the risk
- authorization must be checked before private data is read or returned
