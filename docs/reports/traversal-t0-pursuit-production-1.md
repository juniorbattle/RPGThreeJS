# TRAVERSAL-T0-PURSUIT-PRODUCTION-1

> **Historical evidence retired in PROJECT-CONTINUITY-CLEANUP-1.** This task's browser folder was removed from the active tree after integrated production coverage. Git history preserves its original files and measurements. For current behavior use the [T0 production contract](../traversal/T0_PRODUCTION_CONTRACT.md) and [final integrated report](traversal-t0-production-loop-final-1.md). Evidence paths below are historical references, not live links.

Baseline: `main` at `e11e6875b51c009690038b15538238540396d28f`

Branch: `traversal-t0-pursuit-production-1`

## Production contract

| Item | Result |
| --- | --- |
| PURSUIT PRODUCTION DEFAULT | YES |
| DEV PURSUIT-OFF OVERRIDE | YES (`?traversalPursuit=0`) |
| PRODUCTION PURSUIT-OFF OVERRIDE | NO |
| APPROVED PURSUER FAMILY | GENERIC SHADOW MONSTER |
| PURSUER NARRATIVE IDENTITY | NONE / GENERIC |
| PURSUIT WINDOWS PER COMPLETE PATH | 3 |
| CAUGHT CAMPAIGN CONSEQUENCE | NONE |
| CAUGHT ROUTE CONSEQUENCE | existing `resetRouteSpeed` only |
| ROAD COMBAT ADDED | NO |
| OLD `TraversalRoadEncounter` RESTORED | NO |
| `LOCAL_INTERACTION` RESTORED | NO |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK AUTHORITY CHANGED | NO |
| ROUTE REWARD AUTHORITY CHANGED | NO |

`resolveTraversalPursuitEnabled({ dev, search })` returns false only when `dev` is true and the `traversalPursuit` parameter is exactly `0`. It returns true for production with no flag, `0`, or `1`, and for DEV with no flag or `1`. The six cases, all `traversalRisk=0/1` and `traversalReward=0/1` combinations, and an unrelated parameter are covered by the policy test. Scene tests verify one aria-hidden renderer, one caravan, no Pursuit controls, and the DEV-off renderer absence.

The activation remains within `TraversalT0Scene`. `TraversalRoutePursuit.ts`, `TraversalT0Pursuit.ts`, `GameApp`, `RunSystem`, save code, campaign relations, Risk, Reward, and route authoring were not edited. Pursuit mechanics remain +0.11 pressure per second in the same lane, -0.075 in the opposite lane, +0.22 for one Risk collision, clamped to 0–1. CAUGHT uses the existing speed reset, including the existing same-frame Risk protection. ESCAPED has no campaign reward. Pursuit state remains scene-local. No T1–T4 activation or road combat was added.

## Built production browser evidence

The **machine-readable main run** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production/browser-qa.json`) and **ten-image gallery** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production/index.html`) were generated from the built Vite preview through the real `GameApp` T0 flow. The driver observes scene internals in its Playwright page; it does not enable production root datasets. Every sampled production root had no Pursuit telemetry keys, and the scene's DEV outcome array remained empty. Each page had one Pursuit renderer, one image node, one caravan, no Pursuit focus target, and no horizontal overflow. The image received HTTP 200 once per page in the main run, with no page or asset errors.

| Run | Observed result |
| --- | --- |
| Route 3 clean escape | 1 STARTED, 1 ESCAPED, 0 CAUGHT; opposite-lane samples reduced pressure; campaign signature unchanged. |
| Route 3 deliberate catch | 1 STARTED, 1 CAUGHT; local contact visible, speed reset to Route 3 `vMin=1`, ordinary recovery resumed; campaign signature and temporary loot unchanged. |
| Full Path A | R1 → CP1 → R2 → Cédric → R3 → Aider → R4 → fork → R5A → branch consequence → R6 → arrival → Journey agency; 3 STARTED, 3 ESCAPED, 0 CAUGHT. |
| Full Path B | R1 → CP1 → R2 → Cédric → R3 → Passer → R4 → fork → R5B → branch consequence → R6 → arrival → Journey agency; 3 STARTED, 3 ESCAPED, 0 CAUGHT. |

The separate **production `traversalPursuit=0` run** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production-off-url/browser-qa.json`) still mounted the renderer, loaded the image with HTTP 200, evolved pressure, and produced STARTED then ESCAPED. The **production `traversalPursuit=1` compatibility run** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production-on-url/browser-qa.json`) produced the same outcome. The main production run used no positive Pursuit URL flag.

Route 5B Path B recorded exactly one Risk collision inside Pursuit. The measured pressure increase was the +0.22 collision impulse plus only normal frame integration; Risk collision count advanced once, while Reward IDs, collected state, and temporary loot stayed unchanged in that collision sample. The later `.82` pouch was collected, increased temporary loot, and showed readable `+5` feedback in the gallery. A separate **Path A collection run** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production-collect-all/browser-qa.json`) reached Journey agency with all nine distinct Reward pickups and all three Pursuit windows ESCAPED.

The final Path B sample measured pressure `0.277336 → 0.504673`: `+0.22` collision plus `+0.007337` same-lane integration. Risk count was `0 → 1`; collected IDs stayed `[t0:r5b:reward-1]` and temporary loot stayed `55` in that frame. At the separate clean CAUGHT sample, speed was `1.885519 → 1`, temporary loot was `45 → 45`, and progress `0.60664` matched elapsed `9099.6 / 15000`; later speed recovered above `1`.

The **Risk-on catch run** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/production-caught-risk-on/browser-qa.json`) observed the later Route 3 roadblock through the Pursuit speed reset with no discontinuity beyond the driver's 40-pixel frame bound. The existing Risk and Reward `reforecastUnseen` calls remained in place. Route 3 clock and progress remained tied to the fixed 15,000 ms segment duration at CAUGHT; the scene test also checks that the reset itself does not advance either value. The existing same-frame Risk-plus-CAUGHT scene test passed.

All four main production runs reported zero active-Pursuit transition leaks. Full paths reached Journey agency, and Route 6's authored Pursuit end `.84` preceded the final collectable pouch at `.88`. Segment start reset Pursuit state. The gallery covers 1440×810, 620×780, and 390×844, including low and high pressure, CAUGHT contact, ESCAPED retreat, Route 5B Risk/Reward coexistence, Route 6, and Journey agency. The capture checks reported clear HUD and lane controls, one caravan, no overlap or horizontal overflow, and the approved side-on image behind the caravan.

## Asset lock

`public/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png` and its built `dist` copy are byte-identical. Both are 640×336 PNG color type 6 (RGBA), SHA-256 `55dfad9b50076ab3cd3b30f5245d6701ef2eea03bb6707959618276b155b9fc1`. The T0 `asset-manifest.json` records the same path, dimensions, and hash. No Pursuit asset was changed or added.

## DEV QA and validation

The **DEV matrix** (retired evidence: `docs/reports/traversal-t0-pursuit-production-1-browser/dev/browser-qa.json`) passed: default Risk/Reward/Pursuit on, Pursuit off with `traversalPursuit=0`, Risk off with Pursuit on, Reward off with Pursuit on, and deliberate CAUGHT. DEV-only `?qa=1` diagnostics stayed available. The specialized driver now uses `--production` for built preview and `--production-pursuit-off-url` for the production URL guard. Obsolete `productionOff` and `--production-off` semantics were removed; `node tools/traversal-t0-browser-qa.mjs --pursuit-qa` remains the canonical entry.

Focused Pursuit tests, full Vitest, `tsc --noEmit`, production Vite build, and `git diff --check` were run. Full Vitest: 167 files and 2,608 tests passed; one inherited CIN-6E-A guard failed. `tools/cinematics/cin6ea_preproduction.test.mjs` rejects `src/game/GameAppRouteReward.test.ts` against its older `57ba69c` visual-lock baseline. That file already exists at this task's `e11e6875` baseline, and there is no diff for it or any `src/game`/`src/cinematics` file on this branch. The historical guard was not changed.
