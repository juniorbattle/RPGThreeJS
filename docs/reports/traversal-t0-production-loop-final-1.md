# T0 production route loop final hardening

Baseline: `main` at `4b4aad2e3b482a2b1b956f71f108c0731dc714b9`

Branch: `traversal-t0-production-loop-final-1`

## Production contract

```text
T0 ROUTE MOTION: PRODUCTION
T0 RISK: PRODUCTION
T0 REWARD: PRODUCTION
T0 PURSUIT: PRODUCTION
ROAD COMBAT: NOT ADDED
SAVE SCHEMA CHANGED: NO
GAMEAPP AUTHORITY CHANGED: NO
RUNSYSTEM AUTHORITY CHANGED: NO
```

Risk, Reward, and Pursuit are on by default. Exact `?traversalRisk=0`, `?traversalReward=0`, and `?traversalPursuit=0` remain DEV-only disable flags. A built production URL carrying all three flags completed both paths with all three systems enabled; its [machine-readable QA](traversal-t0-production-loop-final-1-browser/production-disable-url/browser-qa.json) has no failures.

No authored route duration, acceleration, lane, hazard, pickup, gold, Pursuit window, pressure, checkpoint, fork, or arrival constant changed. No art was regenerated. `TraversalRouteRisk`, `TraversalRouteReward`, and `TraversalRoutePursuit` retain their mechanics; `TraversalT0Scene` orchestrates them. `GameApp` retains the campaign boundary and `RunSystem` retains run authority. No `TraversalRoadEncounter`, `LOCAL_INTERACTION`, `CombatBridge` call from Pursuit, road battle, pursuit `combatId`, or save mutation was introduced.

## Source and QA changes

- The production T0 node return now waits until the global transition is visually opaque before `GameApp` resumes the Route. Under load, the prior return could swap checkpoint to Route 4 while the cover was at 98.8% opacity. The final built-browser run recorded no uncovered swaps.
- Corrected the obsolete DEV-only Reward authoring comment.
- Extended the canonical T0 browser driver to observe all three production systems on the same Path A/B run. It checks exactly-once collection and temporary loot, Pursuit windows, Risk pressure impulses, visible-object road continuity, checkpoint isolation, renderer and DOM lifecycle, production telemetry, assets, Route 6 ordering, and responsive captures. Historical reports were left intact. The existing Pursuit driver is reused for deliberate CAUGHT and clean ESCAPED proofs; its report metadata now reflects the current Git baseline and branch.

## Built production paths

The [integrated gallery](traversal-t0-production-loop-final-1-browser/production/index.html), [QA result](traversal-t0-production-loop-final-1-browser/production/browser-qa.json), and [motion data](traversal-t0-production-loop-final-1-browser/production/motion-flow.json) come from Vite production preview and the real `GameApp` T0 entry, scene clock, lane controls, checkpoint handoffs, and Journey agency. Playwright exposes the app only inside its local page and supplies the existing QA combat-result fixture for canonical checkpoint combat.

| Path | Route sequence | Checkpoints | Pursuit windows | Risk contacts | Route pouches | Arrival |
| --- | --- | ---: | --- | ---: | ---: | --- |
| A, Aider, 5A consequence | R1 → R2 → R3 → R4 → R5A → R6 | 5 entries / 5 exits | 3 STARTED, 3 ESCAPED | 4 | 5 | One physical exit; Journey agency visible |
| B, Passer, 5B consequence | R1 → R2 → R3 → R4 → R5B → R6 | 5 entries / 5 exits | 3 STARTED, 2 ESCAPED, 1 CAUGHT | 4 | 6 | One physical exit; Journey agency visible |

Both paths passed opening ambush, Cédric, the Refugees Aider/Passer choice, the fork, the selected 5A/5B consequence, and final Journey agency. The checkpoint paintings, fork choice, route-state reset, route-world ownership, arrival coast, and no-TravelView-flash checks also passed. At checkpoints Risk, Reward, and Pursuit were invisible and their resolution counters stayed fixed. No duplicate caravan, stale Route sprite, exposed production diagnostic dataset, or accumulated Pursuit outcome array was observed.

### Combined pressure and collection

Path B Route 5B exercised two separate Risk contacts during Pursuit. Each incremented the collision count by one, left core campaign and temporary loot unchanged, and reset speed once to the authored Route 5B minimum of `1.05`. Pressure rose `0.286967 → 0.514293` and `0.739780 → 0.968943`: the authored `+0.22` impulse plus ordinary same-lane pressure during those frames. Pursuit continued; it later resolved CAUGHT locally. [Risk with Pursuit](traversal-t0-production-loop-final-1-browser/production/integrated-route-5b.png) and the [later pouch with Pursuit](traversal-t0-production-loop-final-1-browser/production/integrated-route-5b-reward.png) show the three distinct systems in that Route.

Path B Route 3 collected `t0:r3:reward-2` while Pursuit was active: one pickup event, `+5` temporary loot, visible `+5 route` feedback, no concurrent Risk contact, and Pursuit pressure `0.051326 → 0.057466` from ordinary elapsed driving. The [capture](traversal-t0-production-loop-final-1-browser/production/integrated-route-3-reward.png) shows collection feedback above the caravan while Risk remains ahead and Pursuit behind. Each collected pouch across both paths had one distinct ID, one `+5` temporary-loot increment, and unchanged core campaign state.

On-screen Risk/Reward marks followed road distance through speed resets. At sampled visible contacts, horizontal movement matched visual road distance within 1 px; the one longer CAUGHT interval differed by 9.3 px over 1.6 s. Reforecast shifts of unseen marks occurred beyond the right viewport edge, before those marks entered view.

### Deliberate outcomes

- [Clean ESCAPED QA](traversal-t0-production-loop-final-1-browser/escape/browser-qa.json): one STARTED, one ESCAPED, zero CAUGHT and zero Risk contacts in the tested window. Pressure reached zero, the pursuer retreated, and the campaign signature was unchanged. Pursuit itself awarded no loot. [ESCAPED capture](traversal-t0-production-loop-final-1-browser/escape/route-3-escaped.png).
- [Deliberate CAUGHT QA](traversal-t0-production-loop-final-1-browser/caught/browser-qa.json): one STARTED, one CAUGHT. Speed reset `1.900544 → 1.000000`; temporary loot stayed `45 → 45`, campaign signature stayed identical, and a future road obstacle moved continuously by 39.4 px. The contact had no HP, gold, inventory, reputation, flag, combat, save, or node-resolution path. [CAUGHT capture](traversal-t0-production-loop-final-1-browser/caught/route-3-caught.png).

### Route 6 and responsive presentation

The authored Route 6 duration remains 20 s, Pursuit ends at `.84`, and the pouch remains at `.88`. Both browser paths observed Pursuit resolution before the final pouch collection, then 197 sampled coast frames, physical caravan exit, ARRIVING, and Journey agency. [Pouch before collection](traversal-t0-production-loop-final-1-browser/production/integrated-route-6-pouch.png) and [mobile collection feedback](traversal-t0-production-loop-final-1-browser/production/integrated-route-6-pouch-390.png) show the boundary without an abrupt stop.

The production gallery covers `1440×810`, `620×780`, and `390×844`. Visual inspection and measurements found one readable caravan, two lane positions near 65% and 81%, distinct obstacle/pouch/pursuer placement, clear HUD and lane controls, no third-lane implication, no horizontal overflow, and no clipped controls. Captured Risk and Reward sprites loaded, with Pursuit behind the caravan. The separate ESCAPED start capture also spans all three viewports.

## T0 lifecycle and performance

Each Route maintained one Risk, one Reward, and one Pursuit renderer. Route DOM counts stayed between 449 and 493 nodes across both paths, reflecting bounded world and authored mark changes rather than growth by Route. Pursuit production event arrays remained empty; no Route mechanic resolved during checkpoints. The pouch and pursuer images each received two HTTP 200 requests across two page runs, with no repeated-request pattern. No broad engine work was done.

## Validation

- Focused RouteRun, Risk, Reward, Pursuit, T0 scene/flow, GameApp traversal and Reward authority, RunSystem, Journey boundary, and CampaignStatusHud: **91/91 passed**. After the covered-return change, the affected GameApp and T0 flow rerun passed **23/23**.
- Full Vitest: **2608 passed, 1 inherited CIN-6E-A guard failure** across 2609 tests. The guard in `tools/cinematics/cin6ea_preproduction.test.mjs` names `src/game/GameAppRouteReward.test.ts` in its protected-file diff. That file already differs between the guard's `57ba69cf` baseline and requested `main` at `4b4aad2e`; this branch does not change it. No new test failure was observed.
- `tsc --noEmit`: passed. Production Vite build: passed. `git diff --check`: passed.
- Built production Path A/B, responsive, clean ESCAPED, deliberate CAUGHT, and all-three-disable-flags URL: passed with zero browser errors. The integrated QA recorded no frame, transition, world, checkpoint, coast, Risk, or three-system assertion failures.

Stop at pushed branch for operator review. No merge or road combat work.
