# memory-update-policy v0.1.0

CodeGuardian writes persistent memory only after the critic accepts the patch.

Rules:
- store the learned pattern, not private source contents
- link each memory delta to a replayable run ID
- checkpoint the latest memory root
- keep memory history deterministic and canonical-hashable
