# TRAVERSAL-T0-ROUTE-REWARD-1

Baseline: `main` at `300d126d2d608a4f4d3b6f30b4825cd6f9dc9fc6`

Branch: `traversal-t0-route-reward-1`

## Contract

| Item | Result |
|---|---|
| ROUTE REWARD PRODUCTION DEFAULT | NO |
| ROUTE REWARD DEV FLAG | `traversalReward=1` |
| MAX T0 ROUTE REWARD PER PATH | 45 GOLD gross collected |
| DIRECT STATE.GOLD MUTATION | NO |
| TEMPORARY LOOT AUTHORITY | `RunSystem.addTemporaryLoot` |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK CHANGED | NO |
| PURSUIT ADDED | NO |

## Architecture and authority

`TraversalRouteReward` resolves deterministic physical crossings in immutable, scene-owned state. It knows no campaign, save, DOM, or economy authority. `TraversalT0Reward` authors the T0 pickups separately from `RunNode.reward`. `TraversalRouteRewardRenderer` owns only DEV geometric pickup markers and a 450 ms collection label. The renderer uses the same road distance forecast as Risk; visible contact distances remain frozen through a slowdown, while unseen pickups can be reforecast after `resetRouteSpeed`.

The scene calls `onRouteRewardPickup({ id, gold })` only for a matching-lane crossing during active driving. `GameApp.acceptTraversalRouteReward` checks the active T0 session, calls `addTemporaryLoot(this.state.run, { gold })`, then calls `CampaignStatusHud.refresh()`. A missed pickup changes no resource. The scene starts a fresh resolver and renderer state for each segment. It does not persist pickup IDs or create an autosave.

The route clock, configured durations, checkpoint timing, Risk collision state, and speed recovery remain with the existing RouteRun/Risk systems. Reward never calls `resetRouteSpeed`. The authored gap to every same-segment hazard is at least 0.10 progress. Risk stays production-on, and DEV can isolate Reward with `?traversalReward=1&traversalRisk=0`.

## Authored pickups

| Segment | Pickup ID | Progress | Lane | Gold |
|---|---|---:|---:|---:|
| Route 1 | `t0:r1:reward-1` | .65 | 1 | 5 |
| Route 2 | `t0:r2:reward-1` | .22 | 0 | 5 |
| Route 3 | `t0:r3:reward-1` | .18 | 1 | 5 |
| Route 3 | `t0:r3:reward-2` | .50 | 0 | 5 |
| Route 4 | `t0:r4:reward-1` | .18 | 0 | 5 |
| Route 4 | `t0:r4:reward-2` | .50 | 1 | 5 |
| Route 5A | `t0:r5a:reward-1` | .18 | 1 | 5 |
| Route 5A | `t0:r5a:reward-2` | .48 | 0 | 5 |
| Route 5B | `t0:r5b:reward-1` | .15 | 0 | 5 |
| Route 5B | `t0:r5b:reward-2` | .82 | 0 | 5 |
| Route 6 | `t0:r6:reward-1` | .88 | 1 | 5 |

Either complete path contains nine pickups and offers 45 gold. This is gross collectible value. Canonical node rewards and costs also use the existing temporary-loot balance, so the final HUD balance need not equal the gross pickup value.

## Browser and responsive evidence

The canonical QA entry accepts `--reward-qa` and runs Reward OFF / Risk ON, Reward ON / Risk OFF, and Reward ON / Risk ON. It drives both Route 5 branches in each Reward-on mode, a separate Route 1 miss, real lane controls, checkpoints, combat/dialogue, arrival, and Journey destination agency. [Machine-readable results](./traversal-t0-route-reward-1-browser/browser-qa.json) and the [small screenshot gallery](./traversal-t0-route-reward-1-browser/index.html) record per-pickup callbacks, gold/HUD before and after, segment outcomes, collision counts, spatial continuity, and responsive captures at 1440×810, 620×780, and 390×844.

The three Route 1 approach captures show the lane-1 pickup grounded ahead of the caravan at all requested widths. Browser geometry checks found no horizontal overflow or clipped lane controls; visual inspection found no pickup overlap with the shared HUD or lane buttons. The contact screenshot shows a readable `+5 route` pulse above the caravan and the HUD's matching `+5 route` line. The miss screenshot shows neither pulse nor route-gold increase. The placeholder carries a DEV label and has a distinct circular silhouette from Risk obstacles.

The built production-default [canonical QA](./traversal-t0-route-reward-1-browser/production-off/browser-qa.json) completed both branches with Risk on and Reward off. Its first pass reported one uncovered checkpoint-to-route frame on branch B while all other checks passed; an unchanged rerun passed with zero frame issues. The final JSON-only pass has no missing captures, page errors, asset failures, world failures, coast failures, or Risk failures.

The pure resolver tests prove `COLLECTED` and `MISSED` are crossing-only and exactly once; authoring tests prove unique IDs, lane, value, branch parity, bounds, and hazard spacing. The GameApp authority test proves +5 temporary loot, unchanged secured gold and node state, and immediate HUD refresh.

### Full-path accounting

| Browser mode | Path | Pickup callbacks | Gross pickup gold | Temporary at arrival and Journey agency | Risk contacts |
|---|---|---:|---:|---:|---|
| Reward ON, Risk OFF | A | 9 | 45 | 5 | 0 |
| Reward ON, Risk OFF | B | 9 | 45 | 160 | 0 |
| Reward ON, Risk ON | A | 9 | 45 | 5 | 0 |
| Reward ON, Risk ON | B | 9 | 45 | 160 | 1 on Route 5B |

Each callback increased `temporaryLoot.gold` by exactly 5, refreshed the HUD's `+N route` display, and left `state.gold`, visited nodes, and resolved nodes unchanged at the moment of collection. The existing campaign's checkpoint effects alter the shared temporary-loot balance between pickups. Both branches keep their positive remaining temporary balance across physical arrival and Journey destination agency. The Route 5B collision precedes its later pickup without changing its authored crossing or causing a visible road-space jump. Reward OFF mounts no pickup renderer and grants no gold; the separate Route 1 opposite-lane run resolves a miss and grants none.

A follow-up [refuge browser run](./traversal-t0-route-reward-1-browser/refuge/browser-qa.json) took Path A from Journey agency into the existing `lion-first-refuge` resolution. Before entry, secured gold was 150 and temporary gold was 5. Once the existing refuge flow set `refugeSecured:lion-first-refuge`, secured gold was 155 and temporary gold was 0. The [visible refuge capture](./traversal-t0-route-reward-1-browser/refuge/reward-refuge-secured.png) shows 155 in the shared HUD. No Traversal arrival step secured loot.

## Validation

| Check | Result |
|---|---|
| Focused Reward, Risk, RouteRun, RunSystem, HUD, Journey/cinematic authority | 109 passed |
| Full Vitest | 165 files, 2585 tests passed |
| `tsc --noEmit` | Passed |
| Vite production build | Passed |
| `git diff --check` | Passed |
| Browser Reward QA | Six runs passed; 9 screenshots; zero QA errors |
| Production-default canonical browser QA | Both branches passed on rerun; Reward off, Risk on |
| Refuge entry browser QA | Passed; 1 additional screenshot; 150 secured + 5 temporary → 155 secured |

No production reward art was created. The CSS marker is DEV-only and labeled as a placeholder; `public/assets/generated/lion-phase/traversal/t0/reward/README.md` reserves the future review area.
