# TRAVERSAL-T0-ROUTE-REWARD-PRODUCTION-1

> **Historical evidence retired in PROJECT-CONTINUITY-CLEANUP-1.** This task's browser folder was removed from the active tree after integrated production coverage. Git history preserves its original files and measurements. For current behavior use the [T0 production contract](../traversal/T0_PRODUCTION_CONTRACT.md) and [final integrated report](traversal-t0-production-loop-final-1.md). Evidence paths below are historical references, not live links.

Baseline: `main` at `f4bb94226f1f67120a44692e66cc7e46c38c5548`

Branch: `traversal-t0-route-reward-production-1`

## Production contract

| Item | Result |
|---|---|
| ROUTE REWARD PRODUCTION DEFAULT | YES |
| DEV REWARD-OFF OVERRIDE | YES: `?traversalReward=0` |
| PRODUCTION REWARD-OFF OVERRIDE | NO |
| APPROVED COLLECTIBLE | Variant A coin pouch |
| MAX T0 ROUTE REWARD PER PATH | 45 GOLD GROSS (9 × 5) |
| DIRECT STATE.GOLD MUTATION | NO |
| TEMPORARY LOOT AUTHORITY | `RunSystem.addTemporaryLoot` |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK CHANGED | NO |
| PURSUIT ADDED | NO |

`resolveTraversalRewardEnabled({ dev, search })` returns false only when `dev` is true and the query value of `traversalReward` is exactly `0`; it returns true in every other case. The T0 scene remains the only consumer. The six policy combinations and independence from `traversalRisk=0/1` have unit coverage. The resolver, authored pickup definitions, renderer, art, route clock, Risk system, campaign state, and refuge flow were not modified.

## Built production browser proof

The **production QA JSON** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/production/browser-qa.json`) and **nine-image gallery** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/production/index.html`) come from `node tools/traversal-t0-browser-qa.mjs --reward-qa --production` against Vite preview of the built `dist` bundle. Playwright exposes `GameApp` only in its local response to drive the built scene; the built feature policy is unchanged. Root Reward diagnostics were absent in every production sample.

| Run | Result |
|---|---|
| Production default, Path A | Full Route 1 → CP1 → Route 2 → Cédric → Route 3 → Aider → Route 4 → Route 5A → Route 6 → Journey agency. Nine accepted callbacks, 45 gross Reward gold. |
| Production default, Path B | Full Route 1 → CP1 → Route 2 → Cédric → Route 3 → Passer → Route 4 → Route 5B → Route 6 → Journey agency. Nine accepted callbacks, 45 gross Reward gold. |
| Production `?traversalReward=0`, Path A | Reward renderer and pouch remained present; full path still accepted nine callbacks worth 45 gross gold. |
| Production miss | Route 1 pouch appeared in lane 1 while the caravan stayed in lane 0. It disappeared after crossing, with zero callbacks, zero temporary gold, unchanged secured gold, and no collection feedback. |

Every accepted callback had amount 5, increased `run.temporaryLoot.gold` by exactly 5, left secured `state.gold` unchanged, left visited/resolved campaign IDs unchanged, and refreshed the HUD with the new route-gold value. The gross sum is the Reward contribution; canonical checkpoint and node effects may change the shared temporary balance. At Path A physical arrival and Journey agency, temporary gold was 5 in this run; at Path B it was 160. Neither boundary secured it.

Risk and Reward were both active by default. Path A dodged Route 3 hazards and collected its pouches. Path B recorded one Route 5B collision at progress 0.53; that contact changed neither secured nor temporary gold and accepted no Reward callback. After momentum recovery, the later Route 5B pouch at progress 0.82 was collected. The browser driver checked no visible pouch position jump on collision, no duplicate renderer, the authored mark count on each segment, no marks during checkpoints/transitions/arrival, and no Reward diagnostic datasets in production. The keyboard moved the caravan for the first production pickup; later moves used lane buttons. Both paths reached Journey agency.

The built `dist` contains only the approved `coin-pouch.png` in the Reward art directory. It is 512×459 RGBA and its SHA-256 is `a1bd020956384015043eb58c43461441337e7d57b5b7605c07fc38d6bbd92113`, matching the production manifest. All four pouch requests in the production runs returned HTTP 200, including the `traversalReward=0` run; the image decoded in the scene. No asset request failed.

At 1440×810, 620×780, and 390×844, captured pouch approach, collection, miss, Route 3 Risk coexistence, Route 5B after collision, Route 6, and Journey agency had zero horizontal overflow or clipped lane controls. The 390 px collection capture shows the `+5 route` pulse and refreshed HUD. Visual review found the pouch grounded in the selected lane, with HUD and controls readable. The Reward renderer is `aria-hidden=true`, its images have empty alt text, and it provides no focusable controls.

The separate **canonical built-flow summary** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/canonical/browser-qa.json`) completed both production T0 paths with zero route-world, checkpoint, Route 6 coast, Risk, frame, duplicate-caravan, or general QA failures. It also found no inaccessible lane controls or overflow. This JSON-only pass supplies the unchanged route-timing, transition-lock, and arrival regression proof without adding screenshots.

## Refuge boundary

The separate **built refuge QA** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/refuge/browser-qa.json`) drove Path A through arrival and Journey destination agency into `lion-first-refuge`. Before entry, secured gold was 150 and temporary gold was 5. The existing `secureRunLoot()` boundary produced secured gold 155 and temporary gold 0. The **refuge capture** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/refuge/index.html`) records the reached hub. No Reward-specific refuge code was added.

## DEV QA and validation

The **DEV QA JSON** (retired evidence: `docs/reports/traversal-t0-route-reward-production-1-browser/dev/browser-qa.json`) covers Reward off/Risk on via `?traversalReward=0`, Reward on/Risk off via `?traversalRisk=0`, and both on by default. Both branches of the enabled modes completed with nine accepted callbacks and 45 gross gold each. The Reward-off run had no Reward renderer, pouch, or callback. The isolated Risk-off runs had Reward marks and callbacks with no Risk renderer. The combined Route 5B run collided once and collected the later pouch. All runs had zero QA errors.

| Validation | Result |
|---|---|
| Focused Reward policy/resolver, T0 assets/scene, Risk, RouteRun, GameApp authority, and HUD | 45 passed |
| Full Vitest suite | 2,591 passed; one inherited CIN-6E-A guard failure described below |
| `tsc --noEmit` | Passed |
| Vite production build | Passed; `npm run build` launcher failed because local `npm-cli.js` is missing, so its exact TypeScript and Vite steps were run directly |
| Built production Reward QA | Four runs, nine captures, zero errors |
| Canonical built production Traversal QA | Both paths complete; checkpoint, coast, Risk, frame, and input checks passed |
| Built refuge QA | Full Path A plus secure boundary, one capture, zero errors |
| DEV Reward QA | Six runs, zero errors |

The full-suite failure is `tools/cinematics/cin6ea_preproduction.test.mjs` → “keeps protected game systems and visual assets unchanged outside authorized presentation-only runtime proofs.” Its historical allowlist rejects `src/game/GameAppRouteReward.test.ts`, which is present in the locked `main` baseline. `git diff main -- src/game/GameAppRouteReward.test.ts` is empty. The guard and protected game source were not changed in this branch.

`tools/traversal-t0-reward-art-production-qa.mjs` was removed because its former production-off assertion is obsolete. The specialized `tools/traversal-t0-reward-qa.mjs` remains as the canonical Reward collection/economy driver behind `tools/traversal-t0-browser-qa.mjs --reward-qa`. Historical DEV-only reports were left intact.
