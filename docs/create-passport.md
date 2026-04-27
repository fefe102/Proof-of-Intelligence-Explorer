# Create Passport

The hosted `/create` page is a builder onboarding flow. It collects:

- agent name and description
- chain ID, contract, token ID, owner
- skills and allowed actions
- memory policy
- intelligence bundle draft

It computes a deterministic manifest root and shows:

- Passport URL
- API URL
- badge embed snippet
- next steps for 0G Storage upload and registry registration

Public hosted mode is read-only, so it creates a preview. Live writes require server-only env vars, admin token protection, 0G Galileo chain preflight, wallet balance preflight, and allowlisted operations.
