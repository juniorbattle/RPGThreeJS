# T2/T4 playable Traversal retirement

Status: complete on `dev`, 2026-10-01. Contract set v1 (`contracts.manifest.json`) and the 2026-09-30 design locks audit govern this change. No LOCKED document was modified.

`LION_TRAVERSAL_LEGS` now contains T0, T1 and T3. `LION_NARRATIVE_HANDOFFS` retains historical T2 (`lion-village-choice` → `lion-second-refuge`) and T4 (`lion-shadow-signs` → `lion-final-refuge`) as direct narrative continuations. The durable `LionTraversalLegId` union still includes T2/T4 and T3 was not renumbered. `LionCampaignStructure` describes those two departures as location continuations. `RunSystem` links, dialogue IDs, refuge types, outcomes, save schema, and T0 production selection are unchanged. The gate explicitly rejects T2/T4 as retired playable IDs.

## Verification

- Focused campaign/Traversal/RunSystem/T0 rollout Vitest: 7 files, 51 tests passed. TypeScript and the production build passed.
- Browser saved-node resume: `tmp/traversal/retired-handoffs/t2/results.json` verifies Bois-Clair choice, the sole Journey successor `lion-second-refuge`, and its interactive refuge hub. `tmp/traversal/retired-handoffs/t4/results.json` verifies Shadow evidence, the sole Journey successor `lion-final-refuge`, and the existing `final_refuge` dialogue. Both have zero Traversal mounts and clean diagnostics. Results and compact screenshots are ignored QA outputs; the arrival screenshots were inspected.
- Structural audit checks direct links and anchor roles for both handoffs. No campaign topology or authored content was created.

| Contract area | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | RunSystem and campaign remain truth owners; handoffs are presentation relations. |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS | No media, identity or environment files changed. |
| NARRATIVE / CAMPAIGN | PASS | Direct successors, dialogue, route choice and refuge semantics preserved in browser. |
| NARRATIVE_PRESENTATION | PASS | Journey carries both direct continuations; final refuge remains a story dialogue. |
| TRAVERSAL | PASS | Only T0/T1/T3 remain playable declarations; T0 rollout tests pass and T2/T4 mount no scene. |
| COMBAT | PASS | Combat source and handoffs unchanged; T0 rollout and RunSystem tests pass. |
| SAVE | PASS | Durable IDs and V6 schema unchanged; saved-node resume reaches both destinations. |
| QA_EVIDENCE | PASS | Focused tests, TypeScript, build, browser JSON and screenshots recorded under ignored paths. |
| REPOSITORY_GOVERNANCE | PASS | `dev` only, historical reports untouched, no LOCKED rule changed. |

Next queue item: generalize T0's playable scene for T1/T3 behind the existing production gate, preserving T0 behavior and campaign/save authority. T1/T3 remain disabled until their authored assets and QA are ready.
