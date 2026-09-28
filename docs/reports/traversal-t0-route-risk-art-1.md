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
| `boulder-a.png` | 530 × 241 | Wide low cluster with exposed angular slate and gray-brown stone |
| `boulder-b.png` | 490 × 318 | Taller asymmetric fractured rock mass with restrained moss and roots |
| `roadblock-a.png` | 520 × 261 | Dense broken timber pile with rope, pale snapped ends, and stone anchors |
| `roadblock-b.png` | 550 × 209 | Lower collapsed log barrier with stout posts, rope, and stone anchors |

No legacy obstacle assets were restored. The route risk renderer does not use the mystery-treasure cart, forest-v4, old-road scenery, or painted world sections.

## Renderer and deterministic mapping

`TraversalRouteRiskVisual` keeps the two existing gameplay hazard kinds. Authored roadblock IDs `t0:r3:block-2` and `t0:r4:block-1` display the boulder family; every other roadblock displays timber. A stable FNV-1a hash of hazard ID selects variant A or B. The authored `t0:r5b:block-1` override selects roadblock A so Route 5B uses both timber variants. No runtime randomness is used.

`TraversalRouteRiskRenderer` owns only obstacle DOM, the lane-specific warning, and physical impact. `TraversalWorldRenderer` continues to own forest painting; `TraversalRouteRenderer` continues to own route distance and rush. Existing route-space positions and lane anchors (`65%` upper, `81%` lower) are retained. Obstacle width is calibrated to the caravan and limited to one lane; the opposite lane remains open in the live captures. The warning is a small subdued gold diamond, stays at the approaching lane's edge, and retires when the obstacle becomes visible. Impact retains its 520 ms timing, now with earthy dust and a small bark/pebble read; the struck obstacle remains visible only during that impact window.

## Original integration evidence

- [Curated gallery](traversal-t0-route-risk-art-1-browser/index.html) and [machine-readable browser QA](traversal-t0-route-risk-art-1-browser/browser-qa.json).
- [Compact art metrics](traversal-t0-route-risk-art-1-browser/art-metrics.json) and [motion/collision data](traversal-t0-route-risk-art-1-browser/motion-flow.json).
- Route 1: [approach at 1440](traversal-t0-route-risk-art-1-browser/risk-r1-before.png), [620](traversal-t0-route-risk-art-1-browser/risk-r1-before-620.png), [390](traversal-t0-route-risk-art-1-browser/risk-r1-before-390.png), [collision](traversal-t0-route-risk-art-1-browser/risk-r1-impact.png), [recovery](traversal-t0-route-risk-art-1-browser/risk-r1-recovered.png), [successful dodge](traversal-t0-route-risk-art-1-browser/risk-r1-dodge-after.png).
- Route 3: [boulder at 1440](traversal-t0-route-risk-art-1-browser/risk-r3-boulder.png) and [390](traversal-t0-route-risk-art-1-browser/risk-r3-boulder-390.png).
- Route 5B: [timber roadblock at 1440](traversal-t0-route-risk-art-1-browser/risk-r5b-roadblock.png) and [390](traversal-t0-route-risk-art-1-browser/risk-r5b-roadblock-390.png).
- Route 6: high-speed warning at [1440](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph.png), [620](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph-620.png), and [390](traversal-t0-route-risk-art-1-browser/risk-r6-telegraph-390.png); [first visible obstacle](traversal-t0-route-risk-art-1-browser/risk-r6-visible.png); [successful dodge](traversal-t0-route-risk-art-1-browser/risk-r6-dodged.png).

The original risk-on live run completed both canonical branches with no missing images, browser errors, scene lifecycle failures, duplicate caravans, or lane control failures. Its sixteen captures are retained, including the approved fallen branches and telegraph. Its geometry values and motion data are the pre-polish integration baseline; see the focused polish evidence below for measurements of the revised boulders and roadblocks. The Route 6 warning appeared **2684 ms** before contact; Route 1 contact reduced speed from **1.405** to **1.000**, followed by recovery and a separate safe dodge.

## Operator visual polish

Only the two boulder and two roadblock PNGs changed after reviewed HEAD `72757fc432a9819231fea33faff923428a4176bd`. The fallen-branch sprites, warning UI, renderer, variant mapping, timings, lane positions, and DEV activation gate are untouched. The new sprites preserve the forest's painterly material language while giving the boulders exposed rock faces and the roadblocks substantial crossed timbers. Alpha was trimmed and each sprite occupies **94–96%** of its own transparent canvas bounds.

| Asset | Before | After | Visual change |
| --- | ---: | ---: | --- |
| `boulder-a.png` | 524 × 257 | 530 × 241 | Wide low stone cluster; moss at crests and cracks |
| `boulder-b.png` | 496 × 281 | 490 × 318 | Taller angular mass; one thin root at the side |
| `roadblock-a.png` | 501 × 254 | 520 × 261 | Dense broken logs, pale ends, rope, and stone anchors |
| `roadblock-b.png` | 537 × 226 | 550 × 209 | Lower, longer structural log barrier with stout posts |

The [focused polish gallery](traversal-t0-route-risk-art-1-browser/polish/index.html) and [machine-readable geometry QA](traversal-t0-route-risk-art-1-browser/polish/browser-qa.json) show both updated families in the live route at 1440 × 810 and 390 × 844. Route 3 displays boulder B, Route 4 boulder A, and Route 5B both roadblock variants. Route 6's first visible obstacle is the unchanged fallen branch, so its original frame is retained.

The focused screenshots are [Route 3 boulder at 1440](traversal-t0-route-risk-art-1-browser/polish/route-3-boulder-b-1440.png) and [390](traversal-t0-route-risk-art-1-browser/polish/route-3-boulder-b-390.png), [Route 4 boulder A at 1440](traversal-t0-route-risk-art-1-browser/polish/route-4-boulder-a-1440.png) and [390](traversal-t0-route-risk-art-1-browser/polish/route-4-boulder-a-390.png), and Route 5B roadblocks [A at 1440](traversal-t0-route-risk-art-1-browser/polish/route-5b-roadblock-a-1440.png) / [390](traversal-t0-route-risk-art-1-browser/polish/route-5b-roadblock-a-390.png) and [B at 1440](traversal-t0-route-risk-art-1-browser/polish/route-5b-roadblock-b-1440.png) / [390](traversal-t0-route-risk-art-1-browser/polish/route-5b-roadblock-b-390.png). The exposed gray rock planes and warm snapped timber remain recognizable at route scale, with the upper lane visibly open.

Across the eight live captures, the maximum obstacle/caravan width ratio is **0.790**, minimum opposite-lane clearance at 390 is **87.07 px**, and maximum ground alignment error is **7.41 px**. All four final PNGs loaded in the live route, the forest background loaded, and there were zero browser or geometry failures. The focused browser driver samples real route motion and uses the QA fixture's normal UI path through Route 3, Route 4, and Route 5B; it does not modify mechanics or clock timing.

## Validation

The final polish passed focused Route Risk, scene, run, and asset/manifest guards (**4 files, 22 tests**); full Vitest (**161 files, 2,571 tests**); standalone `tsc --noEmit`; `npm.cmd run build`; `git diff --check`; and the focused live Chromium risk QA above. No mechanical test expectation was changed.

- Focused Traversal/Route Risk/Journey/cinematic/campaign authority guards: **30 files, 235 tests passed**. The first run exposed missing T0 manifest entries for the six new PNGs; the entries were added and the complete focused set passed.
- Full Vitest: **161 files, 2,571 tests passed**.
- `tsc --noEmit`: passed. `npm.cmd run build` (typecheck and Vite production build): passed; Vite emitted its existing large-chunk advisory.
- Risk-on Chromium: [browser QA](traversal-t0-route-risk-art-1-browser/browser-qa.json) passed both canonical branches with no risk, geometry, route-world, or browser failures.
- Risk-off Chromium: [browser QA](traversal-t0-route-risk-art-1-browser/off/browser-qa.json) passed both canonical branches; the captured route has **zero risk obstacle markup**. An earlier run recorded one transient uncovered checkpoint-to-route frame; a complete repeat passed with no code change.
- `git diff --check`: passed.

## Stop condition

Commit and push this branch for operator review. Do not merge, activate production risk, or start Route Reward or Pursuit.
