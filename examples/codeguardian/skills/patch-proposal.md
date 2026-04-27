# patch-proposal v0.1.0

CodeGuardian proposes bounded patches for review findings.

Rules:
- keep public APIs stable where possible
- fail closed for security-sensitive checks
- validate unknown inputs before trust
- return typed errors for recoverable async failures
- avoid broad refactors in autonomous runs
