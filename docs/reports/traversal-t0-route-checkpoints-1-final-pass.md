# TRAVERSAL-T0-ROUTE-CHECKPOINTS-1 — forest continuity final pass

## Scope and changed files

This pass stays on `traversal-t0-route-checkpoints-1`, based on `main`
`0c47f3a154f4bbea4b69a8012052a287d2a09b42`. It changes fast-route art,
covered transitions, decode readiness, and review evidence. The approved Lot A route
sequence, six durations (12/15/15/12/15/20 seconds), speed curves, two lane positions,
checkpoint content, and campaign authority remain intact.

| Area | Files |
|---|---|
| Forest fast route | `src/traversal/TraversalRouteRenderer.ts`, `src/styles/traversal.css` |
| Covered handoff and image readiness | `src/traversal/TraversalT0Scene.ts`, `src/traversal/TraversalWorldRenderer.ts`, `src/traversal/TraversalDepth.ts`, `src/game/GameApp.ts`, `src/styles/app.css` |
| Narrow regressions | `src/traversal/TraversalT0Scene.test.ts`, `src/traversal/TraversalT0World.test.ts` |
| Reproducible review | `tools/traversal-t0-route-checkpoints-1-final-browser.mjs`, `tools/traversal-t0-route-checkpoints-1-final-video.mjs`, this report, and `docs/reports/traversal-t0-route-checkpoints-1-final-browser/` |

The previous active route used
`/assets/generated/lion-phase/traversal/t0/background/t0-far-panorama-loop.png`
and `/assets/generated/lion-phase/traversal/t0/road/t0-wide-road-loop.png`.
Their repeating castle, bright sky, and ochre plain made each road feel outside
the canonical woodland checkpoints. Those files remain on disk but are inactive
in the fast-route renderer.

The active route now reuses the existing `forest-v4` art: `far.png`,
`trees-loop.png`, `road-loop.png`, and `foreground-loop.png`. The authored
`world-v1` checkpoint compositions and their `depth-v1` plants remain in place.
No new bitmap or rendering framework was introduced.

## Visual treatment

The far woodland is a non-tiled painting with a bounded, slow drift of at most
20 px. Tree trunks and canopy tile at 0.28 times road displacement. Earthy dirt
and wheel texture move at road speed. A narrow foliage median moves at 0.86 times
road displacement; near vegetation moves at 1.15 times. A faint earthy rush wash
increases near segment end. Route 6 uses this same forest stack with its existing
stronger speed curve.

The road retains lane 0 at about 65% and lane 1 at about 81% of the viewport.
Both have clear packed-earth driving space. A masked, irregular low-vegetation
strip separates them; forest verge frames the lower edge. There are no painted
lines, lane labels, grid, or HUD lane bands. The route stays more open and faster
than its tighter authored checkpoints while sharing their trees, soil, moss,
foliage, and blue-green atmosphere. The route's dedicated foreground replaces
the checkpoint-only occluders while the route is active.

## Covered lifecycle and readiness

On route completion, the existing frame-driven `focus` transition fades fully
to black. At the black midpoint, `TraversalT0Scene` switches to checkpoint view,
updates the existing `TraversalWorldRenderer`, and waits for visible world and
foreground images to decode. The cover holds a short beat before the checkpoint
reveals. Route motion and lane input stay blocked during the cover. The previous
35%-opacity focus exception was removed.

After canonical combat or dialogue, `GameApp` already calls `resumeNode` under
its global Traversal cover. That cover is now plain black with a 120 ms hold;
the next route initializes while covered and reveals once its four CSS background
URLs have decoded. Refugees Passer and fork choice use the local full-black
midpoint for their direct checkpoint-to-route swap. The route renderer accumulates
motion during the frame and writes parallax offsets once per rendered frame.
The hidden checkpoint world does not receive per-frame transform updates while
the route runs; the selected branch mounts once under cover.

Decode failure logs a browser error and releases the cover so the player is not
stuck indefinitely. The browser validation below recorded no decode or page error.

## Browser and motion evidence

The new gallery preserves the original Lot A evidence separately. It contains
desktop route and CP1 frames; Route 1 at 390×844; Route 5A and 5B at 620×780;
Route 6 early and rush; responsive checkpoint, Refugees, fork, and arrival frames;
and black midpoint screenshots. `browser-qa.json` checks named captures, pixels
of black frames, viewport overflow and controls, active surface exclusivity,
and per-frame uncovered swaps. `motion-flow.json` measures route and transition
timings and both canonical paths. `clip-qa.json` verifies the high→low→high
lane sequence, CP1, and Route 2 in the 32.72-second WebM.

CP1's canonical combat/narrative content occupies the screen before the return
cover. Accordingly, the gallery includes the last visible CP1 checkpoint frame
before that content, a labeled canonical-content frame before return, the actual
full-black return frame, and Route 2 after reveal. Refugees Passer separately
shows a direct forest checkpoint → black → forest route return.

The final gallery has **33 screenshots** across the two real T0 paths. Its five
sampled black frames have a black-pixel ratio of **1.000** each. Per-frame checks
found no simultaneously visible route and checkpoint, uncovered world swap,
duplicate caravan, missing route art, or route progression error. Both paths
completed with five checkpoint entries and exits, at most one active Traversal
scene, and exactly one arrival callback. Branch A used Aider and
`lion-first-trial-event`; branch B used Passer and `lion-first-trial-combat`.

| Active route | Branch A observed | Branch B observed | Speed at 10% / 50% / 90% |
|---|---:|---:|---|
| Route 1 | 11.90 s | 11.94 s | 1.04 / 1.64 / 2.22× |
| Route 2 | 14.97 s | 14.98 s | 1.04 / 1.68 / 2.32× |
| Route 3 | 14.98 s | 14.99 s | 1.04 / 1.68 / 2.32× |
| Route 4 | 11.98 s | 11.60 s | 1.09 / 1.76 / 2.41× |
| Route 5A / 5B | 14.93 s | 14.93 s | 1.10 / 1.79 / 2.46× |
| Route 6 | 19.98 s | 19.96 s | 1.24 / 1.96 / 2.66× |

Speeds are sampled motion multipliers, rounded across the two paths. The Route 4
branch B active measurement reflects browser frame timing; its configured
duration remains 12 s.
Route progress never moved backward. The route-completion-to-checkpoint-ready
interval was **2.14–2.17 s**, including the authored 1.15 s braking approach.
Typical checkpoint-completion-to-route-visible return was **0.43–0.49 s**;
Refugees Passer used the direct local fade and took **0.95 s**. Sampled focus
covers took **0.96–1.00 s**, fork covers **0.94–0.95 s**, and local event covers
**0.94–0.99 s**. Canonical content and global covers have their own timing in
`motion-flow.json`; the CP1 combat/narrative interlude is not counted as a
checkpoint return cover.

Nine representative captures were measured at 620×780 or 390×844. They cover
route rush, checkpoint, Refugees choice, fork, Route 5A/5B, and arrival. The
responsive checks recorded zero horizontal overflow and zero unreachable lane
controls. The browser run recorded zero page errors. The short WebM shows actual
route motion, high→low→high lane switching, CP1, the covered return, and Route 2;
artistic acceptance still requires operator viewing.

Validation: focused Traversal/campaign/cinematic guards passed (**17 files,
109 tests**); full Vitest passed (**161 files, 2,560 tests**); `tsc --noEmit`,
production Vite build, and `git diff --check` passed. Vite emitted its existing
large-chunk advisory. No historical cinematic baseline, wildcard, or allowlist
was changed.

## Invariants and limits

- `TraversalRouteRun` remains pure, ephemeral, and unchanged.
- RunSystem, campaign relations, controller stage ownership, and GameApp node
  authority are unchanged. No new canonical node exists.
- There is no new reward, economy, combat, save schema, or Lot B/C gameplay.
  `resetRouteSpeed` remains dormant.
- T0 remains the only production-enabled Traversal leg.
- Route 5A/5B selection still uses the existing fork authority once; the two
  branches share the forest route base art.
- Arrival still yields explicit Journey destination agency.

The report and machine checks support operator merge review. Final artistic
acceptance of speed, forest density, and lane readability remains a runtime
judgment from the gallery and motion clip.
