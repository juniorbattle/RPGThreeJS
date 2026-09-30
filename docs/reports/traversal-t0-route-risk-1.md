# TRAVERSAL-T0-ROUTE-RISK-1

> **Historical evidence retired in PROJECT-CONTINUITY-CLEANUP-1.** This task's browser folder was removed from the active tree after integrated production coverage. Git history preserves its original files and measurements. For current behavior use the [T0 production contract](../traversal/T0_PRODUCTION_CONTRACT.md) and [final integrated report](traversal-t0-production-loop-final-1.md). Evidence paths below are historical references, not live links.

Baseline: `main` at `bacb7bcbc09996a30bc4b82fb74902e18418c13a`.
Branch: `traversal-t0-route-risk-1`.

## Architecture and authority

- `TraversalRouteRisk` is a pure, immutable Route-only resolver. It accepts authored hazard crossings, current lane, and an active-driving gate. It returns `COLLISION` or `PASSED` once per stable hazard ID. Its state is owned by `TraversalT0Scene` and recreated at each segment start; no save, GameApp, RunSystem, node, reward, or campaign fields are read or changed.
- `TraversalT0Risk` authors 14 deterministic contacts across Route 1–6, including distinct Route 5A and 5B IDs. Every obstacle occupies lane 0 or 1 and sits at progress 0.24–0.75, outside starts, checkpoint approaches, and Route 6 coast. Rhythm is 1, 1, 2, 2, 2/3, 3 obstacles by route.
- `TraversalRouteRiskRenderer` owns only DEV hazard marks, their road-space positions, warning, and short collision burst. `TraversalWorldRenderer` still owns the shared forest and checkpoint painting. `TraversalRouteRenderer` still owns route distance and rush; it contains no painted scenery or risk DOM.

## Collision and speed contract

An authored contact resolves when active Route progress crosses its progress value. The current lane determines pass or collision. The resolved ID prevents a later or duplicate hit. Driving is gated during checkpoint approach/view, departure, local and global covers, and arrival. Lane input continues to use the existing two-lane controller, with the same locks.

Collision resets visual speed to the segment's `vMin` immediately. `TraversalRouteRun` then blends from `vMin` to the normal crescendo at the **absolute** current route progress with a 2,400 ms smooth recovery. A second hit restarts recovery. The route clock, six configured durations (89,000 ms total), stage progress mapping, checkpoint order, and arrival authority remain unchanged. `forecastRouteDistance` places each DEV mark at a fixed visual road distance before it enters view; an unseen future mark is reforecast after a collision so its later contact stays aligned. A right-edge lane warning appears before the mark enters the viewport.

Impact presentation adds a 520 ms caravan jolt and dust burst. It is cleared on segment reset, checkpoint focus, and final coast. The loss of momentum is the only gameplay penalty.

## Activation and assets

Risk is enabled only when Vite is in DEV mode **and** the URL contains `traversalRisk=1`. Normal DEV navigation and the production build keep risk inactive. DEV telemetry on `.traversal-t0` exposes segment, progress, lane, authored/active/resolved hazard IDs, collision count, last collision ID, speed before/after the last hit, and recovery progress. It is absent when risk is disabled.

The current obstacles are deliberately labeled CSS `DEV` placeholders. The clean `t0/risk/` directory is reserved for separately approved production sprites. **No deleted obstacle, furniture, chest, pickup, forest-v4, ochre-road, castle, or old encounter asset was restored or reused.** `abandoned-cart.png` remains limited to its existing conditional mystery-treasure branch use.

## Validation and browser evidence

- Focused Traversal/Journey/cinematic guards: **23 files, 176 tests passed**.
- Full Vitest: **161 files, 2,567 tests passed**.
- `tsc --noEmit`: passed.
- Production Vite build: passed (existing large-chunk advisory only).
- `git diff --check`: passed.
- Canonical browser QA, risk OFF: **browser QA** (retired evidence: `docs/reports/traversal-t0-route-risk-1-browser/risk-off-browser-qa.json`), [canonical gallery](traversal-t0-cleanup-1-browser/index.html). Both branches retain the shared forest, authored checkpoints, Passer, fork departure, opaque handoffs, Route 6 coast, and destination agency. No TravelView, early first-refuge commitment, duplicate caravan, missing image, overflow, or browser error.
- DEV risk ON: **browser QA** (retired evidence: `docs/reports/traversal-t0-route-risk-1-browser/browser-qa.json`), **motion data** (retired evidence: `docs/reports/traversal-t0-route-risk-1-browser/motion-flow.json`), **indexed screenshot gallery** (retired evidence: `docs/reports/traversal-t0-route-risk-1-browser/index.html`). Scenarios cover Route 1 collision/drop/recovery, Route 1 dodge, high-speed Route 6 warning/dodge, alternating Route 5B hazards, second collision during recovery, and clean checkpoint/arrival transitions.
- Live Route 1 contact dropped speed from **1.405 to 1.000**. The Route 6 high-speed warning first appeared about **2.78 s** before contact in the successful-dodge run. Recorded contact gaps were **0.1–54.3 px** at 1440 px width; no checkpoint retained an active hazard or impact.
- The full QA run generated **57 risk captures**, including **28 responsive captures**, with machine-readable geometry coverage at **1440×810, 620×780, and 390×844**. To keep the working tree lean after the T0 cleanup, only **14 focused risk screenshots** are retained in this report directory; the complete run remains represented by `browser-qa.json` and `motion-flow.json`, while unchanged Lot A states remain in the canonical cleanup gallery. The QA checks warning visibility, lane ground alignment, contact proximity to caravan, reachable lane controls, absence of overflow and duplicate caravan, image loads, and page/console errors. Visual inspection found the marks on the road below the HUD and clear of the lane buttons.

The final risk-OFF run used `node tools/traversal-t0-browser-qa.mjs --risk-off-evidence` to avoid intermittent Windows writes to the older tracked gallery. One earlier repeat captured the return cover just below exact black; the unchanged exact-black criterion passed on the final run. Temporary fresh-directory screenshots were removed after preserving its QA JSON. The committed Route Risk gallery is intentionally a focused evidence subset rather than another complete copy of canonical T0 states.

## Deferred

Production obstacle art and operator visual approval remain pending; risk stays DEV-only until then. `TRAVERSAL-T0-ROUTE-REWARD-1` (collectibles, rewards, route economy) and `TRAVERSAL-T0-PURSUIT-1` (pursuer/chase pressure) are outside this branch.
