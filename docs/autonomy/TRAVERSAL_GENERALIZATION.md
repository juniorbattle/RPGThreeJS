# Traversal generalization checkpoint

Status: **IN_PROGRESS**, queue item 5, 2026-10-01. Contract set v1 and the 2026-09-30 design locks audit apply. No LOCKED contract changed.

`GameApp` now selects any playable relation that has both the explicit production gate and an authored scene registration. `TraversalPresentation.ts` is the shared mount contract and fail-closed factory. T0 is the only registered scene; T1 and T3 remain outside rollout. T2 and T4 remain direct Journey handoffs. The current T0 scene, its six route segments, world, hazards, pickups, pursuit windows, fork branch, and campaign handoff behavior remain authored exactly as before this checkpoint.

`TraversalRunRuntime` and `TraversalRunController` already support a `LionTraversalLeg` without owning campaign truth. The next generalization step is to extract the authored beat/route presentation schema from `TraversalT0Route.ts` into a neutral module, then parameterize the scene's route, world, checkpoint, Risk/Reward/Pursuit and branch presentation from per-leg sources. Keep T0's current values and timing as the regression fixture. T1/T3 must supply their own approved event/checkpoint data and art before registration or rollout. Keep `RunSystem` as the sole branch, node, and temporary loot authority. Do not make a T1/T3 scene by passing its relation into `TraversalT0Scene`.

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
| QA_EVIDENCE | PASS for checkpoint | Focused tests, build and ignored browser result recorded. Full T1/T3 QA awaits authored scenes. |
| REPOSITORY_GOVERNANCE | PASS after push | `dev` only; no LOCKED source or historical evidence edited. |

Next action: move reusable route beat types out of `TraversalT0Route.ts`, preserving the T0 resolver API and tests; then define per-leg authored route/checkpoint inputs so `TraversalT0Scene` can evolve into a shared renderer without loosening the T0 production gate. Do not enable T1/T3 during this extraction.
