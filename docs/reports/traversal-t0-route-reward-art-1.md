# TRAVERSAL-T0-ROUTE-REWARD-ART-1

Baseline: `main` at `f96290f0d848a83f4fa8cb3f15987123e332b84a`

Branch: `traversal-t0-route-reward-art-1`

## Contract

| Item | Result |
|---|---|
| ROUTE REWARD PRODUCTION DEFAULT | NO |
| ROUTE REWARD DEV FLAG | `traversalReward=1` |
| APPROVED COLLECTIBLE FAMILY | Variant A coin pouch |
| DIRECT STATE.GOLD MUTATION | NO |
| TEMPORARY LOOT AUTHORITY | `RunSystem.addTemporaryLoot` |
| MAX T0 ROUTE REWARD PER PATH | 45 GOLD gross collectible |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK CHANGED | NO |
| PURSUIT ADDED | NO |

## Approved art and asset contract

The only new runtime asset is `public/assets/generated/lion-phase/traversal/t0/reward/coin-pouch.png`: a transparent, tightly trimmed 512×459 RGBA PNG with SHA-256 `a1bd020956384015043eb58c43461441337e7d57b5b7605c07fc38d6bbd92113`. It follows the approved Variant A pouch with a few coins at its base, warm edge light, and a small contact shadow. No chest, pile, cache, or legacy reward asset is used. The T0 `asset-manifest.json` records its current runtime path, dimensions, and hash. `reward/README.md` documents the family and the retained DEV gate.

The production cutout was derived from the supplied Variant A concept sheet and the canonical forest-road painting with built-in `image_gen`. Final prompt: “Edit this game sprite into the final production cutout for the approved Variant A coin pouch. Preserve the same single brown drawstring coin pouch, painterly fantasy surface, and a few gold coins at its base. Keep the natural side/three-quarter view suitable for a horizontal side-on road. Make the silhouette more compact and grounded: the pouch and coins occupy most of the canvas with only narrow transparent margin. Reduce the huge amber halo to a very restrained warm rim glow tight to the pouch and coins; no large atmospheric cloud or broad ground-light pool. Small contact shadow immediately underneath. Genuine transparent RGBA everywhere else, with clean edges. No forest, road tile, text, UI, decorative emblem, chest, obstacle, extra objects, or floating particles.” The generated RGBA was mechanically trimmed and resized for runtime use.

## Renderer integration

`TraversalRouteRewardRenderer` remains the only Reward presentation owner. Every authored pickup uses `coin-pouch.png` in its existing road-distance and lane placement. The geometric DEV disc and label are removed. The existing 450 ms `+5 route` label remains, with a restrained local CSS gold pulse at collection. A missed pickup still disappears normally. No authored pickup, resolver, economy, save, route clock, checkpoint, Risk, or activation-policy behavior changed.

The pickup renders at 48–72 CSS pixels depending on viewport width, below the size and height of the existing obstacle art. Its lower edge is anchored to the existing lane position. The source resolution leaves substantial detail at mobile scale without adding more variants or FX assets.

## Browser QA and evidence

The canonical `tools/traversal-t0-browser-qa.mjs --reward-qa --reward-art-qa` flow records Reward OFF/Risk ON, Reward ON/Risk OFF, and Reward ON/Risk ON. It drives both full branches in the Reward modes and a separate Route 1 miss. The [machine-readable QA](./traversal-t0-route-reward-art-1-browser/browser-qa.json) and [small screenshot gallery](./traversal-t0-route-reward-art-1-browser/index.html) cover 1440×810, 620×780, and 390×844 pickup approach, collection, miss, Route 3 and Route 5B Risk coexistence, Route 6, and Journey arrival with temporary gold. The QA checks successful pouch loading, single-asset use, lane grounding, size bounds, mobile pulse and HUD, no overflow or control clipping, exact 45 gold gross value on both paths, and unchanged state authority at every collection.

The six-run browser pass produced ten screenshots and zero QA errors. The 390 px approach and contact captures show a compact, readable pouch and `+5 route` feedback without covering the HUD or lane controls; the 620 px and 1440 px captures retain the same grounded lane position. All five pouch requests returned HTTP 200 in Reward-enabled runs, with none in Reward-off mode. The missed Route 1 pickup granted no gold or feedback. In each isolated and combined full-path run, both branches generated nine accepted pickups worth 45 gross gold. The combined Route 5B run recorded one Risk collision before a later collected pouch, with no road-space discontinuity; the other combined path dodged Risk. Temporary route gold remained present at physical arrival and Journey destination agency.

The built production-default canonical QA completed both branches with Risk on and no errors in its [final JSON-only pass](./traversal-t0-route-reward-art-1-browser/production-off/browser-qa.json). Two preceding unchanged passes completed both branches but the existing frame sampler intermittently reported an uncovered checkpoint-to-route swap (both branches, then Path A); the third pass had zero frame issues. None of the three passes reported Risk, route-world, checkpoint, coast, asset, or arrival failures. A separate [built-app activation check](./traversal-t0-route-reward-art-1-browser/production-off/reward-activation.json) inspected the mounted scene with both the default URL and an explicit `traversalReward=1` query. Both had one Risk renderer, zero Reward renderers or pickups, zero pouch requests, and zero errors.

## Validation

| Check | Result |
|---|---|
| Focused Reward, asset, Risk, RouteRun, GameApp, and HUD tests | 28 passed |
| Campaign/Journey/cinematic authority guards and RunSystem | 86 passed |
| Full Vitest | 2,585 passed; one pre-existing CIN-6E-A protected-file guard failure, detailed below |
| `tsc --noEmit` | Passed |
| Vite production build | Passed |
| `git diff --check` | Passed |
| Reward browser QA | Six runs passed; 10 screenshots; zero errors |
| Production-default canonical browser QA | Both branches passed on third unchanged pass; first two had intermittent frame-sampler warnings |
| Built production Reward-off activation QA | Default and DEV-flag URLs passed; no Reward renderer, pickup, or pouch request |

The single full-suite failure is `tools/cinematics/cin6ea_preproduction.test.mjs` → “keeps protected game systems and visual assets unchanged outside authorized presentation-only runtime proofs.” That legacy guard compares `src/game` to `57ba69cf718ea630cc9306c4122666fd6b58420f` and does not allow `src/game/GameAppRouteReward.test.ts`, which is already present in this task's `main` baseline. The art branch does not modify that file or any protected gameplay source. Its guard list is outside this art-only scope.
