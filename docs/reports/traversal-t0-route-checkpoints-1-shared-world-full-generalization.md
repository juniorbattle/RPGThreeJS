# TRAVERSAL-T0-ROUTE-CHECKPOINTS-1 — shared-world full generalization

## Baseline and scope

The operator-approved Route 1 → opening ambush → Route 2 slice is commit `27010f60667225402b6bd3ff0984edb8c66e523b` on `traversal-t0-route-checkpoints-1`. This pass extends that exact visual grammar through all remaining T0 Routes. It does not start Lot B or C, change canonical content, or merge the branch.

| Active Route | Generic forest | Next authored presentation |
| --- | --- | --- |
| Route 1 | Shared | Opening ambush |
| Route 2 | Shared | Cedric / nomad waystation |
| Route 3 | Shared | Refugees / resting clearing |
| Route 4 | Shared | Forest junction fork |
| Route 5A | Shared | Wounded merchant / damaged caravan branch consequence |
| Route 5B | Shared | Ruined outpost combat branch consequence |
| Route 6 | Shared | Covered Journey arrival |

**No active T0 Route uses forest-v4 scenery.** Its historical files remain on disk. Every active Route uses `/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png` at the checkpoint world's section scale. Authored checkpoint paintings, location props, actors, markers, and canonical interaction subjects appear only in Checkpoint view. The single caravan, two lane positions (65% and 81%), foreground and roots/foliage depth remain the approved composition.

## Presentation implementation

`TraversalT0Scene` now applies one T0 Route policy: `data-route-world="shared"` for every active segment. `TraversalWorldRenderer` owns both the generic Route section surface and the authored Checkpoint surface. It repeats the same forest-road painting with the approved mirrored join geometry; two wrap sections cover the viewport at the loop boundary. Route camera distance wraps only for painted scenery and near-road foliage, so the approved Route 1/2 camera positions and caravan motion remain unchanged.

`TraversalRouteRenderer` now owns distance and the rush wash only. It mounts no independent road, trees, median, or forest-v4 art and loads no legacy scenery. The authored section surface remains hidden while travelling. Generic Route sections and event actors are hidden at checkpoints.

All Route → Checkpoint handoffs use visual braking, a local full-black fade, an under-cover world swap, image decoding/readiness, then reveal and authored approach. Checkpoint → Route handoffs initialize generic sections under black and use the existing restart ease. Arrival retains the existing covered Journey handoff. No route clock, speed curve, duration, or lane semantics changed.

## Canonical flow evidence

The [complete browser gallery](traversal-t0-route-checkpoints-1-shared-world-full-browser/index.html) was captured at 1440×810, with 620×780 and 390×844 representative states. The [approved-slice comparison](traversal-t0-route-checkpoints-1-shared-world-full-browser/regression-comparison.html) places Route 1 rush, CP1 authored ambush, and Route 2 against the approved evidence. I inspected those pairs and the Route 3/5A/5B/6 and mobile captures. Camera phase and checkpoint approach time vary between frames; forest art, road scale, caravan scale, lane placement, and transition language remain materially equivalent.

- Run A: Route 1 → CP1 combat → Route 2 → Cedric → Route 3 → Refugees **Aider** → Route 4 → fork A → Route 5A → `lion-first-trial-event` → Route 6 → Arrival → explicit Journey destination agency.
- Run B: Route 1 → CP1 combat → Route 2 → Cedric → Route 3 → Refugees **Passer** → Route 4 → fork B → Route 5B → `lion-first-trial-combat` → Route 6 → Arrival → explicit Journey destination agency.
- Both runs recorded five Checkpoint entries and five exits, one branch selection, one arrival callback, and at most one Traversal scene. Run B recorded exactly one Refugees bypass; Run A visited Refugees. Neither run visited `lion-first-refuge` at destination agency, and neither mounted TravelView.

The [motion-flow JSON](traversal-t0-route-checkpoints-1-shared-world-full-browser/motion-flow.json) records route progress, speeds at 10/50/90%, measured durations, transition times, Checkpoint entries/exits, branch and bypass outcomes. Representative measured Route durations in Run A were 11.9, 14.9, 14.9, 11.9, 14.9, and 19.9 seconds. Route 6 speed samples were 1.24 → 1.96 → 2.66. The source data and pure RouteRun timing remain unchanged.

## Visual-state and responsive QA

The [browser QA JSON](traversal-t0-route-checkpoints-1-shared-world-full-browser/browser-qa.json) records 63 gallery captures, including 24 responsive captures. All expected captures are present. Twelve black midpoint images, including one at 390×844, measured a **1.000 black-pixel ratio**. No frame-level uncovered swap, overlapping world surfaces, legacy scenery, duplicate caravan, missing generic image, visible Route location prop, horizontal overflow, unreachable lane control, or browser error was recorded.

For both branches and every active Route, the browser sampled `routeWorld=shared`, visible generic sections using the exact forest-road asset, hidden authored Checkpoint surface, zero generic location props, and one caravan. During every Checkpoint, the generic Route surface was hidden and the authored surface visible. The responsive screenshots show the caravan and controls in view, readable Checkpoint agency, and full-viewport black cover.

Motion review: [WebM A — Route 3 through Route 5A](traversal-t0-route-checkpoints-1-shared-world-full-browser/webm-a-route-3-refugees-fork-route-5a.webm) (56.0 s) and [WebM B — fork, Route 5B combat, Route 6, arrival](traversal-t0-route-checkpoints-1-shared-world-full-browser/webm-b-fork-route-5b-combat-route-6-arrival.webm) (59.7 s). Both are real-time browser recordings trimmed from the complete flows; [video metadata](traversal-t0-route-checkpoints-1-shared-world-full-browser/video-qa.json) and [contact previews](traversal-t0-route-checkpoints-1-shared-world-full-browser/webm-a-contact.png) / [B](traversal-t0-route-checkpoints-1-shared-world-full-browser/webm-b-contact.png) are supplied. Clip B's ending frame was visually checked with Journey destination agency visible.

## Validation and authority lock

- Focused Traversal/campaign/cinematic guards: **17 files, 104 tests passed**.
- Full Vitest: **161 files, 2,562 tests passed**.
- `tsc --noEmit`: passed.
- Production Vite build: passed. The existing large-chunk advisory remains.
- `git diff --check`: passed.
- Full browser paths A and B: passed with no recorded QA failures.

`TraversalRouteRun` remains unchanged and pure. `RunSystem`, campaign relations, route data, GameApp authority, save schema, combat, dialogue, rewards, economy, and T0 production gate were not edited. No canonical node, reward/economy behavior, combat, or save migration was added. T0 remains the only enabled Traversal leg. The operator's final Lot A visual review is the remaining acceptance step before any merge.
