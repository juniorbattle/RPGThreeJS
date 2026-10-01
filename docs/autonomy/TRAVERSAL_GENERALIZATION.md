# Traversal generalization checkpoint

Status: **IN_PROGRESS**, queue item 5, 2026-10-01. Contract set v1 and the 2026-09-30 design locks audit apply. No LOCKED contract changed.

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

Next action: extract the remaining T0-only scene interactions into a shared road-scene core with a narrow T0 adapter. Preserve the existing optional refugee choice and RunSystem fork/loot callbacks exactly. Add authored per-leg branch and arrival presentation inputs, then validate the shared core against T0 flow before beginning T1/T3 authored scenes. Do not register T1/T3 or widen reward acceptance until their own assets and browser QA pass.
