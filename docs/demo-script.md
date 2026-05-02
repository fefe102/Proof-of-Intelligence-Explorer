# 3-Minute Demo Script

## 0:00-0:20

Many iNFTs are just metadata pointers. 0G asks builders to prove intelligence and memory are actually embedded. CodeGuardian is the minted 0G Agentic ID / ERC-7857-style iNFT; AgentProof is how we verify it is real.

## 0:20-0:45

Open `/judge`. Show CodeGuardian minted on 0G Galileo as an Agentic ID/iNFT: contract `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9`, token ID `1`, registry `0x90d7f68cbf2a860f7b2c54548095fcb72d61b9af`. Then open the Agent Console.

## 0:45-1:20

Click **Run CodeGuardian on demo file**. Explain this is an allowlisted preview: no arbitrary code execution, no calldata, no shell, no private key exposure. Then open **Review a pasted diff** to show a real useful workflow where public user input is hashed and reviewed safely, while live writes remain server/admin-controlled. Show analysis, patch proposal, critic loop, memory write, and certificate event.

## 1:20-1:45

Show Memory Evolution: v1 unsafe JSON parsing, v2 authorization guard, v3 async error handling. Point out that memory roots change across runs.

## 1:45-2:10

Replay the latest run. Walk through `task_received`, `context_loaded`, `compute_started`, `compute_completed`, `issue_found`, `patch_proposed`, `critic_completed`, `memory_delta_created`, `memory_written`, `skill_upgrade_checked`, `trace_committed`, and `certificate_issued`.

## 2:10-2:35

Open the Proof-of-Intelligence certificate. Show the iNFT token, intelligence root, memory root, run root, compute IDs, source labels, and certificate binding.

## 2:35-2:55

Open FakeAgent. It has token-like metadata but fails the same checks because it has no valid manifest, intelligence bundle, memory, compute history, trace, or certificate.

## 2:55-3:00

Close with: CodeGuardian is the autonomous iNFT agent. AgentProof is reusable proof infrastructure for every 0G iNFT agent.
