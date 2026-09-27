# TRAVERSAL-T0-MOTION-HANDOFF-POLISH-1

Branch: `traversal-t0-route-checkpoints-1`
Approved visual baseline: `4b1a79f8e0e4a8a6eaee959dd29f971e05132b76`
Scope: Lot A motion and handoff presentation only. This report does not claim artistic approval.

## Problems corrected

- Route completion previously began a fade before the vehicle visibly slowed. A short presentation approach now advances the shared world for 280 ms, reduces rush, wheel motion, dust, and suspension, then starts the existing black fade. The authored checkpoint approach continues after reveal and stops at the interaction.
- Refugees Passer and fork selection previously began a black cover with a static caravan. One reusable checkpoint departure now locks the interaction, moves the checkpoint camera and vehicle, spins wheels, resumes suspension and dust, waits 280 ms, then fades. The next generic Route is mounted at the fully covered midpoint and uses its existing restart acceleration.
- A resolved canonical event now mounts the next Route under GameApp's single global cover. The checkpoint is not revealed again, and no second local fade or departure runs. Passer still applies RunSystem/GameApp bypass and reputation immediately on click. The fork still calls `selectTraversalBranch` once at the covered midpoint.
- Route 6 previously stopped its world as the canonical RouteRun completed, while the vehicle moved right independently. A separate visual coast keeps the generic forest moving at terminal speed, eases speed and dust down over about 2 seconds, and couples screen exit with world travel. Canonical route progress remains complete throughout.

## Motion timing from real browser frames

The [telemetry](traversal-t0-motion-handoff-polish-1-browser/telemetry.json) summarizes frame samples from two complete real time runs. [Aider frame samples](traversal-t0-motion-handoff-polish-1-browser/aider-branch-a-motion-frames.json) and [Passer frame samples](traversal-t0-motion-handoff-polish-1-browser/passer-branch-b-motion-frames.json) retain the underlying transition/coast frames.

| Handoff | First measured motion → fade | First measured motion → full black | Full black → next Route reveal |
| --- | ---: | ---: | ---: |
| Refugees Passer, 390 px | 301 ms | 635 ms | 470 ms |
| Fork A selection, 620 px | 335 ms | 671 ms | 476 ms |

Canonical event returns use only the global cover: Aider → Route 4 reveals 512 ms after Route 4 mounts; branch A → Route 6 reveals after 506 ms; branch B → Route 6 reveals after 508 ms. All three mount while the global cover is active, with no checkpoint revisit, local transition, or departure revisit.

The Passer and fork departures show nonzero vehicle movement before the fade begins. Route 3's pre-fade approach moves the shared world about 196 world units in both runs before the checkpoint transition.

At Route 6 canonical completion, progress stays `1` while the shared world advances about 269 world units over the first 358 ms in the Passer run (269 over 361 ms in Aider). Visual speed is still about 2.54 at that point, falls to about 1.23 at 1.2 seconds, and approaches zero near 2 seconds. The caravan's right edge reaches about 1494 px on a 1440 px viewport by 2.01 seconds, before the final covered handoff. Arrival callback count is one in each run.

## WebM acceptance evidence

The [review gallery](traversal-t0-motion-handoff-polish-1-browser/index.html) links all five clips and screenshots.

| Clip | Sequence |
| --- | --- |
| [A](traversal-t0-motion-handoff-polish-1-browser/A-route3-refugees-aider-route4.webm) | Route 3 rush → Refugees checkpoint → Aider → one global cover → Route 4 |
| [B](traversal-t0-motion-handoff-polish-1-browser/B-refugees-passer-route4.webm) | Passer at 390 px → immediate caravan departure → black → Route 4 |
| [C](traversal-t0-motion-handoff-polish-1-browser/C-fork-route5a.webm) | Fork choice at 620 px → visible departure → black → Route 5A |
| [D](traversal-t0-motion-handoff-polish-1-browser/D-branch-checkpoint-route6.webm) | Route 5A branch checkpoint → resolution → one global cover → Route 6 |
| [E](traversal-t0-motion-handoff-polish-1-browser/E-route6-arrival-journey.webm) | Route 6 rush → moving world coast → right exit → Journey destination agency |

## Responsive and authority checks

- Inspected 1440×810, 620×780, and 390×844 screenshots at rush, departure, black, and arrival. The caravan remains within the painted world until its intended right exit, with no exposed world edge or stray dust visible in the captured frames. Full black screenshots at all three viewports have black pixel ratio `1.0`: [1440](traversal-t0-motion-handoff-polish-1-browser/aider-branch-a-route3-black-1440.png), [620](traversal-t0-motion-handoff-polish-1-browser/aider-branch-a-fork-black-620.png), [390](traversal-t0-motion-handoff-polish-1-browser/passer-branch-b-passer-black-390.png).
- Active Routes keep the shared Traversal world using `world-v1/forest-road.png`; the route renderer supplies motion and speed lines, not replacement scenery. The five current clips show that forest route.
- Passer applies its bypass once before departure and the panel hides immediately. Repeated skip and fork clicks do not repeat authority. Lane input is blocked during the approach, departure, and global cover; Escape retains its existing menu behavior.
- The full Aider and Passer browser runs each reach Journey destination agency, never open TravelView, and leave the destination node unvisited until the player chooses. One branch A and one branch B selection are observed. No gameplay, route duration, lane, campaign relation, reward, combat, dialogue, or save schema implementation was changed.

## Validation

- Focused Traversal/campaign/cinematic suites: **14 files, 90 tests passed**.
- Full Vitest: **161 files, 2,562 tests passed**.
- `tsc --noEmit`: passed.
- Vite production build: passed; existing large chunk advisory only.
- `git diff --check`: passed.
- Real browser QA: all telemetry checks passed, both journeys completed, five clips generated, no page errors. Run with `node tools/traversal-t0-motion-handoff-polish-1-browser.mjs` (requires the local ffmpeg toolchain).

The branch is left for operator review. Lot A is not merged, and Lot B/C and cleanup have not started.
