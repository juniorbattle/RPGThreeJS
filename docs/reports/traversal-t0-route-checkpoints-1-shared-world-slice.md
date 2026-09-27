# T0 shared-world route vertical slice

Scope: Route 1 → CP1 `lion-opening-ambush` → Route 2 on
`traversal-t0-route-checkpoints-1`. This is a presentation correction to the
reviewed `6df766d` branch. Routes 3–6 were **not generalized** in this pass.

## Visual source and ownership

The attached current Traversal screenshot is the visual target. Route 1 and
Route 2 now use the exact existing `world-v1/forest-road.png` painting that
fills generic sections around authored checkpoints. `TraversalWorldRenderer`
builds both its generic route sections and checkpoint sections with the same
section markup, overlap, image scale, and camera transform. The generic route
sequence repeats that forest painting with alternating mirrored joins and
contains no authored prop or branch variant. Its visible sections are culled
against the moving route camera. This retains the checkpoint canopy, trunks,
roots, blue-green depth, leaf-strewn soil, broad single road, and caravan scale.
The two unchanged lane positions remain near 65% and 81% within that one road.

During Route 1/2, the authored checkpoint sections, their location props,
actors, markers, and the old `forest-v4` road/median stack are hidden. The
same caravan, route HUD, two lane controls, checkpoint foreground foliage,
and depth occluders remain. `TraversalRouteRenderer` supplies motion distance
and the subtle rush wash for this slice; it retains the prior `forest-v4`
scenery only for untouched Routes 3–6. Route 3–6 presentation is therefore a
known, intentionally unconverted area for a later decision.

## Handoff

The route runner, six durations, speed curves, checkpoint order, CP1 content,
RunSystem, controller, GameApp, saves, branch rules, and arrival agency are
unchanged. A Route 1 focus starts with a short visual brake while the pure
route state is already complete, fades to black, swaps surfaces under full
cover, waits for the visible checkpoint images to decode, and reveals the
authored 1.15-second CP1 approach. After canonical CP1 combat and dialogue,
the existing global black cover resumes Route 2; the generic route art is
decoded before reveal, and visual motion eases in over the first 0.4 seconds.
Escape still exits during a cover. No canonical node is resolved by scenery.

## Review evidence

The [side-by-side comparison](traversal-t0-route-checkpoints-1-shared-world-browser/comparison.html)
shows Route 1 rush, CP1, and Route 2 at the same 1440×810 viewport.
The [gallery](traversal-t0-route-checkpoints-1-shared-world-browser/index.html)
contains the 17 requested desktop/responsive states plus one separately
labeled canonical-content frame before return. In the real browser run,
Route 1 took **11.95 s** of active motion; high→low→high lane moves occurred
at route progress 0.26 and 0.54. Both black midpoint screenshots have a
black-pixel ratio of **1.000**. The frame monitor found no uncovered swap,
overlapping route/checkpoint worlds, missing generic art, or duplicate
caravan. All route captures used the same `world-v1/forest-road.png` image,
with no visible event props or old route scenery. At 620×780 and 390×844,
the checks found no horizontal overflow or unreachable lane controls.

The [WebM](traversal-t0-route-checkpoints-1-shared-world-browser/shared-world-route-1-cp1-route-2.webm)
is an uncut 31.8-second run. Its [clip QA](traversal-t0-route-checkpoints-1-shared-world-browser/clip-qa.json)
records both lane moves, CP1, canonical combat, the two black handoffs, and
resumed Route 2. [Browser QA](traversal-t0-route-checkpoints-1-shared-world-browser/browser-qa.json)
contains the capture states and frame checks. CP1's canonical combat/dialogue
temporarily replaces the physical forest view, as it did before this pass.

Validation: focused Traversal/campaign/cinematic guards passed (17 files,
110 tests); full Vitest passed (161 files, 2,561 tests); `tsc --noEmit`,
production Vite build, and `git diff --check` passed. Vite emitted the existing
large-chunk advisory. No historical cinematic baseline or allowlist changed.

Automated evidence proves asset source, covered swaps, and progression.
Operator motion and visual review remains the artistic acceptance gate.
