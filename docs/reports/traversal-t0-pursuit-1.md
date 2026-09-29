# TRAVERSAL-T0-PURSUIT-1

Baseline: `main` at `ff4c48ee1a1c6ced6b918361187218653add342b`

Branch: `traversal-t0-pursuit-1`

## Production and authority contract

| Item | Result |
|---|---|
| PURSUIT PRODUCTION DEFAULT | NO |
| PURSUIT DEV FLAG | `?traversalPursuit=1` |
| PURSUIT WINDOWS PER COMPLETE PATH | 3 |
| CAUGHT CAMPAIGN CONSEQUENCE | NONE |
| CAUGHT ROUTE CONSEQUENCE | Existing `resetRouteSpeed` only |
| ROAD COMBAT ADDED | NO |
| OLD `TraversalRoadEncounter` RESTORED | NO |
| `LOCAL_INTERACTION` RESTORED | NO |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK AUTHORITY CHANGED | NO |
| ROUTE REWARD AUTHORITY CHANGED | NO |

`resolveTraversalPursuitEnabled({ dev, search })` returns true only for DEV with the exact query value `traversalPursuit=1`. Production with the same URL remains off. No `GameApp`, `RunSystem`, combat, or save source changed.

## Pure state and pressure

`TraversalRoutePursuit.ts` owns an immutable, scene-local state with the current segment, active window, pressure, resolved/escaped/caught IDs, and caught count. `TraversalT0Pursuit.ts` owns fixed T0 windows. The resolver imports no campaign, Risk, Reward, save, or combat module. The scene passes Risk's collision count as a number after Reward and Risk have resolved; Pursuit never mutates their states.

Inside a window, the resolver integrates the portion of the frame between `startProgress01` and `endProgress01`, splitting at every pursuer lane change. Same lane adds **0.11 pressure/second**; opposite lane subtracts **0.075 pressure/second**; each Risk collision adds **0.22 pressure**. Pressure clamps to `[0, 1]`. One `STARTED` is emitted on crossing the start, one `CAUGHT` at 1 or one `ESCAPED` at the end. Resolved windows cannot emit again. Inactive driving and segment mismatches leave state unchanged.

| Route | Window ID | Start | End | Initial pressure | Lane phases |
|---|---|---:|---:|---:|---|
| 3 | `t0:r3:pursuit-1` | .22 | .78 | .24 | .22 → 0; .50 → 1 |
| 5A | `t0:r5a:pursuit-1` | .20 | .78 | .28 | .20 → 0; .50 → 1 |
| 5B | `t0:r5b:pursuit-1` | .18 | .80 | .32 | .18 → 1; .40 → 0; .61 → 1 |
| 6 | `t0:r6:pursuit-1` | .18 | .84 | .34 | .18 → 0; .36 → 1; .62 → 0 |

Routes 1, 2, and 4 have no pursuit. Tests compare every window with `T0_ROUTE_HAZARDS`: pursuer and hazard lanes match at Route 3 `.32/.68`, Route 5A `.30/.66`, Route 5B `.27/.53/.68`, and Route 6 `.24/.49/.75`. Moving opposite the pursuer is therefore also the obvious safe lane at each first-pass hazard. Route 6 pursuit ends at `.84` before the unchanged pouch at `.88` in lane 1.

## Scene and presentation

`TraversalT0Scene` creates fresh pursuit state on `startRoute()`, resolves pressure only while actively driving on a Route, and mounts the CSS/DOM `TraversalRoutePursuitRenderer` only when DEV opt-in is active. The rear proxy stays left of the side-on caravan. Pressure changes its screen-space gap; the caravan is not moved to simulate pursuit. Lane changes use the existing keyboard and two lane buttons. The renderer has `aria-hidden=true`, no controls, no meter, and no campaign authority. It clears at segment changes and hides outside active driving; catch and escape use short local feedback.

At `CAUGHT`, the scene shows an impact and calls `resetRouteSpeed` once unless Risk has already reset speed in that animation step. The route clock (`elapsedMs`, `progress01`, configured duration) is unchanged. When Pursuit itself resets speed, the scene calls both Risk and Reward `reforecastUnseen` seams so future unseen contacts remain coherent while visible contacts stay fixed. Catch changes no HP, secured or temporary gold, inventory, reputation, campaign node, or save. At `ESCAPED`, the proxy retreats without a reward or campaign flag. Reward pickup code, IDs, values, lanes, renderer, and temporary-loot authority remain unchanged.

Only DEV + `?qa=1` + enabled Pursuit exposes root datasets for pressure, lane, window, outcomes, catch count, and catch speed/clock diagnostics. These datasets do not drive gameplay. A normal DEV page without `traversalPursuit=1` mounts no pursuit renderer and exposes no pursuit datasets.

## Browser evidence

The [machine-readable QA](./traversal-t0-pursuit-1-browser/browser-qa.json) and [ten-image gallery](./traversal-t0-pursuit-1-browser/index.html) are produced by `node tools/traversal-t0-browser-qa.mjs --pursuit-qa`. The driver uses Vite DEV, real GameApp T0 mounting, real requestAnimationFrame route motion, lane controls, and canonical checkpoint/branch/arrival navigation. It records the campaign signature, pressure trend, catch speed, Risk contacts, Reward collection, lifecycle visibility, layout, and page errors.

| Mode | Result |
|---|---|
| Normal DEV, Risk/Reward on, Pursuit off | No Pursuit renderer or diagnostics. |
| DEV Pursuit on, Risk off, Reward on: Route 3 clean escape | One `STARTED`, one `ESCAPED`, zero catches; opposite-lane pressure falls and the route continues. |
| DEV Pursuit on, Risk off, Reward on: Route 3 deliberate catch | One `STARTED`, one `CAUGHT`; catch feedback, speed reset to `vMin`, unchanged campaign signature, then normal route recovery. |
| DEV Pursuit/Risk/Reward on: full Path A | R1 → CP1 → R2 → Cédric → R3 → Aider → R4 → R5A → R6 → arrival → Journey agency; three starts, three escapes, zero catches. |
| DEV Pursuit/Risk/Reward on: full Path B | R1 → CP1 → R2 → Cédric → R3 → Passer → R4 → R5B → R6 → arrival → Journey agency; three starts, three escapes, zero catches. One Route 5B Risk contact supplied the measured `+0.22` pressure impulse, and the later Route 5B pouch was collected. |

In the deliberate catch, the browser recorded speed `2.1339 → 1.0` at route elapsed `11,199.6 ms` and progress `.74664`. The campaign signature covering secured gold, reputation, flags, inventory, health, visited and resolved IDs was unchanged across catch. The pure and scene tests separately verify that `resetRouteSpeed` preserves elapsed time, progress, and configured duration. In the clean escape, the same campaign signature was unchanged and 32 sampled opposite-lane intervals showed falling pressure. The signature intentionally excludes temporary route loot, which the independent Reward system can collect during a chase.

On Route 5B, pressure moved from `.264423` to `.491760` across the Risk contact. The measured `+.227337` equals the `+.22` collision impulse plus `+.007337` same-lane integration during that sampled interval. Risk resolved one collision. Temporary route loot later rose from 55 to 60 when the `.82` pouch was collected. Both full paths also collected the unchanged Route 6 `.88` pouch after its chase ended.

The responsive gallery includes 1440×810, 620×780, and 390×844 Route 3 starts; desktop lane switch, high pressure, catch, escape, and Route 6 pursuit; a 620 px Route 5B Risk contact; and a 390 px later Reward collection. The browser driver checked the proxy stayed behind the caravan, one caravan existed, the pursuer lane was readable, the renderer was unfocusable, the proxy cleared the HUD and lane buttons, controls stayed inside the viewport, and horizontal overflow was zero. It sampled checkpoint approaches, checkpoints, departures, transitions, and arrival for active-proxy leaks. The final five scenarios and ten captures had zero browser errors.

## Validation

| Check | Result |
|---|---|
| Pursuit pure and scene tests | 15 passed in the full suite, including frame-rate equivalence, lane-phase integration, Risk collision, catch and segment lifecycle. |
| Risk, Reward, RouteRun, TraversalT0Scene, GameApp, HUD | Focused regression: 41 passed before the two final Pursuit guard additions; all listed suites passed in the full run. |
| RunSystem and Journey/cinematic authority guards | Passed in the full run (`runSystem`, traversal route authority, Journey campaign boundary/session/overlay and cinematic guards). |
| Full Vitest | 2,606 passed; one inherited CIN-6E-A protected-file guard failure below. |
| `tsc --noEmit` | Passed. |
| Vite production build | Passed, 187 modules transformed. |
| `git diff --check` | Passed. |
| Consolidated browser QA | Five modes passed, ten captures, zero errors. |

The full-suite failure is `tools/cinematics/cin6ea_preproduction.test.mjs` → “keeps protected game systems and visual assets unchanged outside authorized presentation-only runtime proofs.” Its historical allowlist rejects `src/game/GameAppRouteReward.test.ts`, which is present in the requested `main` baseline. `git diff main -- src/game/GameAppRouteReward.test.ts` is empty. Neither the guard nor that file changed in this branch.

No final Pursuit art was generated. Road combat and its deleted historical runtime were not restored.
