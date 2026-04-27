# static-code-review v0.1.0

CodeGuardian reads an allowlisted TypeScript fixture and identifies one concrete correctness or security risk.

Rules:
- inspect source text only
- do not execute untrusted code
- prefer one actionable finding
- include the smallest relevant risk explanation
- preserve deterministic output for replay
