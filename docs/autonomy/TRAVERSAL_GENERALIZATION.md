# Traversal generalization checkpoint

Status: **COMPLETE**, queue item 5, 2026-10-01. Contract set v1 and the 2026-09-30 design locks audit apply. No LOCKED contract changed. Earlier checkpoints below are dated implementation history; the final verification governs current readiness.

`GameApp` now selects any playable relation that has both the explicit production gate and an authored scene registration. `TraversalPresentation.ts` is the shared mount contract and fail-closed factory. T0 is the only registered scene; T1 and T3 remain outside rollout. T2 and T4 remain direct Journey handoffs. The current T0 scene, its six route segments, world, hazards, pickups, pursuit windows, fork branch, and campaign handoff behavior remain authored exactly as before this checkpoint.

`TraversalRunRuntime` and `TraversalRunController` support a `LionTraversalLeg` without owning campaign truth. `TraversalRouteModel`, `TraversalCheckpointRoute`, and `TraversalWorldModel` now hold reusable types and pure progress/world functions. `TraversalRoadAuthoring` bundles per-leg scene inputs, and T0 is the only populated package. Its source values and six Route timings remain unchanged. The route authoring audit rejects mismatched campaign stages, branch beats, checkpoint locations and stray beats before the scene opens. `TraversalWorldRenderer` and `TraversalForegroundRenderer` receive authored inputs rather than importing T0 art; the T0 scene consumes its package for route, world, occluders, Risk, Reward and Pursuit. The scene itself still has a T0-only guard and T0-specific event interaction. Keep `RunSystem` as the sole branch, node, and temporary loot authority. T1/T3 need complete approved art, transitions and QA before registration or rollout.

## Verification at this checkpoint

- `TraversalPresentation.test.ts`: only T0 is registered; missing T1/T3 factories throw before accessing scene state. `TraversalFeaturePolicy.test.ts` confirms only T0 is rolled out.
- Focused T0 flow and scene tests: 14/14 passed across four files, including confirmation, skip, lane bypass, both existing fork routes and scene behavior.
- TypeScript and Vite production build passed.
- Chromium opening flow passed dialogue, audience choice, opening combat and T0 mount. `tmp/traversal/presentation-seam-opening/results.json` records clean console/page diagnostics and no black or TravelView flashes. The approved `camp_departure.mp4` request was aborted when skipped, as expected.

| Contract area | Status | Evidence / remaining limit |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | `GameApp` remains presentation only; RunSystem node/choice authority unchanged. |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS | No art bytes changed; T0 world stays intact. T1/T3 art is later work. |
| NARRATIVE / CAMPAIGN | PASS | Relation IDs, stages, forks and callbacks unchanged; browser reached T0 after combat. |
| NARRATIVE_PRESENTATION | PASS | New registry only selects authored scenes after the rollout gate; no Journey flow changed. |
| TRAVERSAL | PASS for checkpoint | T0 remains sole registration and rollout; T1/T3 scene data is pending. |
| COMBAT | PASS | Combat handoff uses the same RunSystem callback; opening combat passed in browser. |
| SAVE | PASS | No save schema or durable ID changes. |
| UI / ACCESSIBILITY | PASS for checkpoint | Responsive 620×780 and 390×844 route controls stayed reachable; no navigation or reduced-motion rule changed. |
| QA_EVIDENCE | PASS for checkpoint | Focused tests, build and ignored browser result recorded. Full T1/T3 QA awaits authored scenes. |
| REPOSITORY_GOVERNANCE | PASS after push | `dev` only; no LOCKED source or historical evidence edited. |

## 2026-10-01 route/world authoring checkpoint

- T0's authored route and checkpoint values, world assets, Risk/Reward/Pursuit lists, and occluder placements were not changed. T0 compatibility exports remain available.
- The 113 focused Traversal and rollout tests passed across 22 files. TypeScript, eight-contract validator and Vite production build passed. The DEV browser driver was updated to the current arrival method after its old hook failed; its production mode also expects DEV-only Risk and is not an acceptance result for this checkpoint.
- The final DEV browser rerun under ignored `tmp/traversal/generalization-authoring-qa-dev/` passed two branches at 1440×810, 620×780 and 390×844 with 23 captures. `browser-qa.json` reports no missing screenshots, black frames, simultaneous worlds, duplicate caravans, stale art, checkpoint/canonical/coast/Risk/Reward/Pursuit failures, unreachable controls or console/page errors. Compact mobile route 1 and route 5B captures were inspected after the final authoring change; desktop destination was inspected in the preceding rerun.
- No gameplay authority, canonical ID, save schema, protected art or LOCKED contract changed. Contract matrix above remains PASS for this checkpoint; `QA_EVIDENCE` now includes the new ignored browser run. Item 5 remains IN_PROGRESS.

## 2026-10-01 shared scene completion

`TraversalRoadScene` now consumes `TraversalRoadAuthoring` for the complete Route/Checkpoint lifecycle, painted geography, mechanics, covered transitions, canonical node return and physical arrival. It derives return/arrival indices and the rail from authored route count. `TraversalT0Scene` is a narrow compatibility adapter: T0 guard, refugee decision copy and RunSystem branch callback. The established T0 CSS selectors remain shared visual grammar; no stylesheet or asset bytes changed. Unused private fields/imports/contact-toast code were removed after reference inspection.

RunSystem branch selection/bypass now use the declared playable relation instead of a T0-only guard, retaining availability, strict fork, mandatory encounter, no fake visit, save and checkpoint authority. T2/T4/unknown IDs still fail without mutation. GameApp reward acceptance requires both enabled rollout and authored registration in RUNNING; T0 remains the only accepted production leg, and loot remains temporary. No save schema or durable ID changed.

Validation: 155/155 focused tests across 27 files (Traversal, GameApp rollout, RunSystem and campaign), TypeScript, eight-contract/eight-slot validator and production build passed. New isolated five-road T3 fixtures complete both existing branch handoffs and arrival once, without consuming the destination or registering T3. They are lifecycle tests, not T3 production content.

DEV `tmp/traversal/generalization-scene-qa-dev/` and built-production `tmp/traversal/generalization-scene-qa-production/` each passed both T0 branches at 1440×810, 620×780 and 390×844, with 23 compact captures. Machine reports contain zero missing captures, black/frame/world/checkpoint/canonical/coast/mechanic/control/asset/console/page issues. Mobile Route 1 and Route 5B captures were inspected, including the production pouch/Pursuit/reward frame. Production QA also checks every Route mechanic lifecycle, single collection through temporary loot, three Pursuit windows, Risk impulse, absence of production diagnostic telemetry and the later `+5 route` feedback.

| Contract area | Status | Final item-5 evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Campaign/RunSystem/GameApp remain truth and handoff owners. |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS | Existing T0 and V2 media unchanged; shared world consumes explicit authoring. |
| NARRATIVE / CAMPAIGN | PASS | Canonical stages/choices retained; both future branch IDs tested through RunSystem. |
| NARRATIVE_PRESENTATION | PASS | Journey departure/destination agency and canonical content handoffs preserved. |
| TRAVERSAL | PASS | Shared core and per-leg seams complete; full T0 regression passes; only T0 registered/enabled. |
| COMBAT | PASS | Same canonical node callbacks; no road combat or second resolver added. |
| SAVE | PASS | Existing schema round-trips future branch selections; selection does not visit/enter or grant loot. |
| UI / ACCESSIBILITY | PASS | Existing CSS/controls retained; desktop/intermediate/mobile bounds and keyboard/lock tests pass. |
| QA_EVIDENCE | PASS | 155 tests, TypeScript, contracts, build, ignored DEV/production JSON and inspected captures. |
| REPOSITORY_GOVERNANCE | PASS | dev only; no LOCKED contract, protected media or historical evidence edited. |

Contracts read: GAME_CONSTITUTION, contract index/manifest and all eight v1 LOCKED contracts, plus T0_PRODUCTION_CONTRACT and the complete archived design-authority source (baseline main `00b96f1` verified). No LOCKED rule was changed. Item 5 is complete. T1/T3 production authoring and artistic acceptance remain queue items 6/7.

Next action: produce T1's existing reserve-trail, Valmir-road, strict shrine/combat fork and Bois-Clair arrival authoring with the shared T0 forest Route base. Generate only the missing checkpoint art using the canonical Valmir/shrine location plates as references; keep T1 unregistered and outside rollout until authored media, transitions, real handoffs, save/resume and responsive browser QA pass.
