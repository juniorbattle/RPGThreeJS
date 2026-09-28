# TRAVERSAL-T0-ROUTE-RISK-ART-1

## Scope and baseline

- Baseline: `main` at `0dcf8348d62addf849c1be2b87931c1c32602f90`.
- Branch: `traversal-t0-route-risk-art-1`.
- Visual integration only. `TraversalRouteRisk` resolution, all authored hazard IDs/progress/lanes, six route durations, 2400 ms recovery, route clock, checkpoints, fork, arrival, and campaign/save ownership remain unchanged.
- **Route Risk remains DEV-only:** it requires `import.meta.env.DEV` and `traversalRisk=1`. Production activation is a separate task.

## Production art

All six assets are transparent RGBA PNGs in [`public/assets/generated/lion-phase/traversal/t0/risk/`](../../public/assets/generated/lion-phase/traversal/t0/risk/), registered with dimensions and SHA-256 values in the [T0 asset manifest](../../public/assets/generated/lion-phase/traversal/t0/asset-manifest.json). They contain only the obstacle, a small contact area, and local debris. The attached preview set the forest palette and material direction; runtime scaling preserves one-lane gameplay readability even where the preview composition was broader.

| Asset | Dimensions | Direction |
| --- | ---: | --- |
| `fallen-branch-a.png` | 500 × 248 | Low mossy fallen timber and pale snapped ends |
| `fallen-branch-b.png` | 554 × 256 | Distinct root-heavy fallen tangle |
| `boulder-a.png` | 524 × 257 | Chunky low gray-green mossy stone cluster |
| `boulder-b.png` | 496 × 281 | Taller rooted boulder cluster |
| `roadblock-a.png` | 501 × 254 | Broken timber, moss, roots, and stones |
| `roadblock-b.png` | 537 × 226 | Low rustic log-and-stone obstruction |

No legacy obstacle assets were restored. The route risk renderer does not use the mystery-treasure cart, forest-v4, old-road scenery, or painted world sections.

## Renderer and deterministic mapping

`TraversalRouteRiskVisual` keeps the two existing gameplay hazard kinds. Authored roadblock IDs `t0:r3:block-2` and `t0:r4:block-1` display the boulder family; every other roadblock displays timber. A stable FNV-1a hash of hazard ID selects variant A or B. The authored `t0:r5b:block-1` override selects roadblock A so Route 5B uses both timber variants. No runtime randomness is used.

`TraversalRouteRiskRenderer` owns only obstacle DOM, the lane-specific warning, and physical impact. `TraversalWorldRenderer` continues to own forest painting; `TraversalRouteRenderer` continues to own route distance and rush. Existing route-space positions and lane anchors (`65%` upper, `81%` lower) are retained. Obstacle width is calibrated to the caravan and limited to one lane; the opposite lane remains open in the live captures. The warning is a small subdued gold diamond, stays at the approaching lane's edge, and retires when the obstacle becomes visible. Impact retains its 520 ms timing, now with earthy dust and a small bark/pebble read; the struck obstacle remains visible only during that impact window.

## Focused browser evidence

- [Curated gallery](traversal-t0-route-risk-art-1-browser/index.html) and [machine-readable browser QA](traversal-t0-route-risk-art-1-browser/browser-qa.json).
- [Compact art metrics](traversal-t0-route-risk-art-1-browser/art-metrics.json) and [motion/collision data](traversal-t0-route-risk-art-1-browser/motion-flow.json).
- Route 1: [approach at 1440](traversal-t0-route-risk-art-1-browser/risk-r1-before.png), [620](traversal-t0-route-risk-art-1-browser/risk-r1-before-620.png), [390](traversal-t0-route-risk-art-1-browser/risk-r1-before-390.png), [collision](traversal-t0-route-risk-art-1-browser/risk-r1-impact.png), [recovery](traversal-t0-route-risk-art-1-browser/risk-r1-recovered.png), [successful dodge](traversal-t0-route-risk-art-1-browser/risk-r1-dodge-after.png).
- Route 3: [boulder at 1440](traversal-t0-route-risk-art-1-browser/risk-r3-boulder.png) and [390](traversal-t0-route-risk-art-1-browser/risk-r3-boulder-390.png).
- Route 5B: [timber roadblock at 1440](traversal-t0-route-risk-art-1-browser/risk-r5b-roadblock.png) and [390](traversal-t0-route-risk-art-1-browser/risk-r5b-roadblock-390.png).
- Route 6: high-speed warning at [1440](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph.png), [620](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph-620.png), and [390](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph-390.png); [first visible obstacle](traversal-t0-route-risk-art-1-browser/risk-r6-visible.png); [successful dodge](traversal-t0-route-risk-art-1-browser/risk-r6-dodged.png).

The risk-on live run completed both canonical branches with no missing images, browser errors, scene lifecycle failures, duplicate caravans, or lane control failures. Sixteen focused captures are retained. Across 12 retained obstacle samples, every PNG loaded. The maximum obstacle/caravan width ratio was **0.815**, the minimum clearance to the opposite lane was **28.15 px**, and the largest road-contact alignment error was **6.71 px**. The Route 6 warning appeared **2684 ms** before contact; Route 1 contact reduced speed from **1.405** to **1.000**, followed by recovery and a separate safe dodge. These values are recorded in the linked JSON, not inferred from the concept preview.

## Validation

- Focused Traversal/Route Risk/Journey/cinematic/campaign authority guards: **30 files, 235 tests passed**. The first run exposed missing T0 manifest entries for the six new PNGs; the entries were added and the complete focused set passed.
- Full Vitest: **161 files, 2,571 tests passed**.
- `tsc --noEmit`: passed. `npm.cmd run build` (typecheck and Vite production build): passed; Vite emitted its existing large-chunk advisory.
- Risk-on Chromium: [browser QA](traversal-t0-route-risk-art-1-browser/browser-qa.json) passed both canonical branches with no risk, geometry, route-world, or browser failures.
- Risk-off Chromium: [browser QA](traversal-t0-route-risk-art-1-browser/off/browser-qa.json) passed both canonical branches; the captured route has **zero risk obstacle markup**. An earlier run recorded one transient uncovered checkpoint-to-route frame; a complete repeat passed with no code change.
- `git diff --check`: passed.

## Stop condition

Commit and push this branch for operator review. Do not merge, activate production risk, or start Route Reward or Pursuit.
