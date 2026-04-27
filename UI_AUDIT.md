# CodeGuardian iNFT UI Audit

Audit date: 2026-04-27  
Scope: production-style UI pass for the hosted Next.js explorer, using the current CodeGuardian iNFT / AgentProof framing.

## Summary Verdict

The product is usable and substantially complete, but the UI still reads more like a dense proof dashboard than a polished startup-grade autonomous-agent product. The strongest surface is the CodeGuardian Agent Console: it proves the product can show an actual agent state, memory evolution, proof roots, runs, and certificates. The weakest surface is the first impression: the homepage and verifier lead with text and data rather than a clear visual proof of "this is a live autonomous iNFT agent."

Submission risk is moderate, not because the product is broken, but because judges may need too much reading before they understand the agent-first story. The most important UI work is to make CodeGuardian feel operational within the first viewport, reduce raw JSON exposure, and remove stale copy that overstates 0G Storage or mentions ENS as a live product feature.

Browser console check: no warnings or errors found in the audited session.

## Audited Routes

- `/`
- `/verify`
- `/create`
- `/agent/codeguardian/console`
- `/agent/fakeagent`
- `/run/codeguardian-run-003`
- `/certificate/poi-cert-codeguardian-001`
- `/developer`

## What Works Well

- The information architecture covers the required judge flows: agent console, proof report, verifier, create-passport flow, replay, certificate, developer docs, admin, API, and badge.
- The Agent Console is the clearest product surface. It shows current goal, status, minted iNFT details, run queue, memory evolution, compute/critic evidence, dynamic policy upgrade, proof objects, and links to replay/certificate/passport.
- Proof consistency is visible in the positive CodeGuardian path. The certificate page and console show the live 0G Galileo iNFT address `0xa390c79f21a3b4f62f4797308f50f8ff9ea4f4c9` and token `1`.
- The verifier form supports arbitrary token input and the negative FakeAgent path communicates failure clearly.
- Source labels are present across the product, which is essential for honest live/hybrid/mock positioning.
- The product has semantic links/buttons and mostly stable responsive layouts.

## Priority Findings

### P1 - Homepage first viewport does not immediately sell the autonomous iNFT

Evidence: `apps/explorer/app/page.tsx:21` and `apps/explorer/app/page.tsx:67`

At a common desktop-ish viewport, the first screen is mostly navigation, headline, paragraph copy, and buttons. The live verifier readout is not strongly visible, and there is no visual object that says "autonomous agent running with memory, compute, and certificate evidence." This weakens the agent-first framing required for the 0G Autonomous/iNFT prize.

Recommended fix:
- Make the first viewport an agent operating console preview, not a marketing text block.
- Pull the tier, minted iNFT, latest run, memory root, and certificate status into the hero.
- Add a simple proof pipeline visual: iNFT token -> encrypted intelligence -> memory -> compute run -> replay trace -> certificate.
- Keep the primary CTA as `Open Agent Console`; make `Verify any iNFT` secondary.

### P1 - Homepage copy overclaims 0G Storage

Evidence: `apps/explorer/app/page.tsx:131`

The homepage says public proof objects are "uploaded to 0G Storage." Current product status is live 0G Chain with hybrid Storage/Compute evidence. That copy can be read as claiming live 0G Storage when the artifacts are not fully live.

Recommended fix:
- Replace with wording like: "Public proof objects are canonicalized and hashed; live 0G Storage roots appear when configured, while this hosted demo labels hybrid evidence explicitly."
- Keep live/hybrid/mock language near every evidence section.

### P1 - Developer page still presents ENS as part of the current integration surface

Evidence: `apps/explorer/app/developer/page.tsx:6`

ENS prize targeting has been explicitly deferred. The developer page still says "optional DA, and optional ENS," which makes ENS sound like an active product claim rather than mock compatibility.

Recommended fix:
- Change this to "optional DA, plus ENS-compatible adapter interfaces kept as mock/future-work metadata."
- Avoid mentioning ENS in the main product pitch unless a real functional ENS integration is added.

### P2 - Raw JSON is exposed too early and too often

Evidence:
- `apps/explorer/components/proof-ui.tsx:96`
- `apps/explorer/components/proof-ui.tsx:179`
- `apps/explorer/app/run/[runId]/page.tsx:28`
- `apps/explorer/app/certificate/[certificateId]/page.tsx:59`

The verify, replay, and certificate pages are technically useful but too JSON-led. Large raw JSON blocks dominate the page and make the product feel like a debug tool instead of a polished verification product.

Recommended fix:
- Default raw JSON sections to collapsed `<details>`.
- Add a compact "Evidence summary" above raw data.
- On run replay, show event summaries first, with expandable details per event.
- Keep JSON export available, but make it an auditor/developer layer.

### P2 - Replay timeline should be more narrative

Evidence: `apps/explorer/components/proof-ui.tsx:179`

The timeline is correct, but every event currently renders raw detail. Judges should see the autonomous loop at a glance: task received, context loaded, compute analysis, issue found, patch proposed, critic completed, memory written, trace committed, certificate issued.

Recommended fix:
- Add event-specific labels and one-sentence summaries.
- Show roots and IDs as compact copyable fields.
- Put full JSON behind a disclosure control.

### P2 - Primary navigation wraps and exposes Admin too prominently

Evidence:
- `apps/explorer/app/layout.tsx:54`
- `apps/explorer/app/globals.css:273`

At medium/small widths the nav becomes a multi-row header. It remains usable, but it consumes too much vertical space and keeps `Admin` in the primary path even when public users cannot write.

Recommended fix:
- Move `Admin` to a footer/developer/admin-only secondary location, or visually de-emphasize it.
- Add a compact responsive nav pattern around 760px.
- Keep primary nav to: Agent Console, Verify, Create Passport, Developer.

### P2 - Certificate page is printable but not yet certificate-first

Evidence:
- `apps/explorer/app/certificate/[certificateId]/page.tsx:22`
- `apps/explorer/components/proof-ui.tsx:194`

The certificate is accurate, but the page chrome and raw JSON make it feel like a technical page that contains a certificate, rather than a polished certificate page. The page also has a top `Certificate` heading and the certificate itself has `CodeGuardian`, which can read as two competing titles.

Recommended fix:
- Make the certificate panel the first visible object.
- Use one primary page title and move secondary page controls into a toolbar.
- Add print-specific sizing so the certificate fits cleanly on one page.
- Collapse proof JSON below the certificate.

### P3 - Source label wording is inconsistent after ENS deferral

Evidence: `apps/explorer/components/proof-ui.tsx:34`

`StatusHeader` describes mock sources as "mock optional DA/ENS." Since ENS is not in scope for prizes or current product claims, this should not appear in the main status explanation.

Recommended fix:
- Use "mock optional layers" or "mock optional DA" instead.
- Reserve ENS language for docs explaining future adapter compatibility.

### P3 - Evidence objects claim copyability without copy buttons

Evidence: `apps/explorer/components/proof-ui.tsx:140`

The UI says roots are copyable, but the rendered evidence objects are plain code/text fields. This is minor, but proof products should make hashes and roots easy to copy.

Recommended fix:
- Add small icon copy buttons next to roots, tx hashes, and storage identifiers.
- Show a short copied state.

### P3 - Light theme is serviceable but less distinctive

Evidence:
- `apps/explorer/app/layout.tsx:14`
- `apps/explorer/app/globals.css:24`

The app follows system light mode by default. The light theme is readable, but it makes the first impression feel more generic than the darker security/proof aesthetic implied by the product.

Recommended fix:
- Consider defaulting first-time users to dark mode for demo/judging.
- Keep the theme toggle and persisted user preference.
- If light remains default, add stronger visual hierarchy and proof graphics to avoid a plain document feel.

## Route Notes

### Home

Good: clear title, correct agent-first copy, important CTAs.  
Needs work: first viewport needs an operational agent/proof visual, and 0G Storage copy needs to avoid overclaiming.

### Verify

Good: arbitrary token form exists and the report is structured.  
Needs work: collapse raw JSON by default and emphasize "summary -> checklist -> evidence -> raw export."

### Create Passport

Good: route exists and feels like a builder flow.  
Needs work: it should visually communicate steps/wizard progress. It currently reads closer to a form preview than a production onboarding flow.

### Agent Console

Good: strongest route. It makes CodeGuardian feel alive and shows the right proof primitives.  
Needs work: add copy buttons, make dynamic upgrade spacing more readable, and consider making this the homepage hero preview.

### Run Replay

Good: all required trace events are present and replayable.  
Needs work: make the event timeline narrative-first and raw-data-second.

### Certificate

Good: correct contract/token binding and certified roots are visible.  
Needs work: stronger printable certificate layout and collapsed raw JSON.

### Developer

Good: practical SDK/CLI/API entrypoint.  
Needs work: remove current-product ENS wording and keep the page aligned with the 0G-only prize strategy.

## Recommended Fix Order

1. Correct inaccurate copy: homepage 0G Storage wording, developer ENS wording, and source-label ENS wording.
2. Collapse raw JSON sections across verify, replay, and certificate pages.
3. Improve homepage hero so the Agent Console/proof pipeline is visible in the first viewport.
4. Add copy buttons for roots/hashes and improve evidence object affordances.
5. Tighten navigation, especially `Admin` visibility and medium-width wrapping.
6. Polish certificate print layout.

## Acceptance Criteria For UI Polish

- A judge understands within 10 seconds that CodeGuardian is the autonomous iNFT and AgentProof is the proof layer.
- The first viewport shows a live/hybrid proof state, not only marketing copy.
- No UI copy claims live 0G Storage/Compute where the artifact is hybrid.
- ENS does not appear as an active product claim.
- Raw JSON is available but collapsed by default.
- Agent Console, replay, certificate, and verifier all show the same proof story with consistent source labels.
- Roots/hashes have copy controls.
- Certificate prints cleanly and binds visibly to the live CodeGuardian iNFT.
