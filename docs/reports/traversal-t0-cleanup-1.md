# TRAVERSAL-T0-CLEANUP-1

> **HISTORICAL CLEANUP RECORD.** The removals and byte-preserving promotions below remain the record of this task. Its runtime and QA status predates production Risk, Reward, and Pursuit. Current authority is the [T0 production contract](../traversal/T0_PRODUCTION_CONTRACT.md), [architecture](../traversal/ARCHITECTURE.md), and source at `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`.

Baseline: `main` at `e1be7d0261d699aee27079e256291826b7b78f1e`

Branch: `traversal-t0-cleanup-1`

Scope: structure, assets, obsolete presentation and QA. No campaign rule, stage-order, save, or Lot B/C change.

## Phase A: dependency audit

The [initial inventory](traversal-t0-cleanup-1-initial-inventory.json) covers 1,434 tracked candidates in `src/traversal`, Traversal CSS, the T0 asset pack, `tools/traversal`, temporary T0 drivers, and `docs/reports/traversal-*`. It records file bytes, source/test/tool/document references, classification, planned action, and a reason. Dynamic asset roots in `TraversalT0World`, `TraversalDepth`, and `TraversalCaravan` were checked manually against the browser renderer and added to the inventory's runtime references. Searches also covered CSS URLs, the JSON manifest, sprite bounds, QA scripts, and campaign code. There was no unknown T0 asset dependency before deletion.

The initial classifications were: 39 active canonical files, 10 active images in legacy locations, 108 development files, and 1,277 historical or superseded files. The 10 promotions were byte preserving. The one non-obvious dependency is `entities/route-props-v3/abandoned-cart.png`: the approved branch A node can still resolve to `mystery_treasure`, and `TraversalT0Route` uses that cart for its checkpoint actor. It is retained as a current conditional branch prop, not as road furniture or a Lot B default. The `roadside_peddler` dialogue remains source content for compatibility; only its unreachable T0 local-beat mapping was removed.

Phase A proposed removal of the open ochre road/castle panorama, `forest-v4` route loops and rejected scenery, old pickup/obstacle/chest assets, unselected vehicle candidates, stale manifest/bounds entries, historical generators, temporary browser/video drivers, and superseded QA. T0 asset removals were expected to save about 78.6 MB; historical QA/tool/report removals about 2.10 GB. The accepted full-flow and motion reports and their linked evidence were kept for review.

## Canonical structure

Before: 62 files, 114,812,012 bytes in `t0/`; active images were mixed into `forest-v4`, `depth-v1`, `route-props-v3`, `reference-convergence`, and `closed-v1`. The manifest still described preview road and forest-loop assets as active.

After: 15 PNGs plus one manifest, 36,181,047 bytes:

```text
public/assets/generated/lion-phase/traversal/t0/
  asset-manifest.json
  world-v1/
    forest-road.png
    opening-ambush.png
    ambush-cleared.png
    nomad-waystation.png
    refugee-halt.png
    forest-junction.png
    damaged-caravan.png
    ruined-outpost.png
  foreground/
    ferns.png
    roots.png
    shared-loop.png
  props/
    fork-sign.png
    abandoned-cart.png
  vehicle/traversal-caravan/
    chassis.png
    wheel.png
```

`world-v1` stays because it is the current approved painting generation and renaming its root would add risk without improving the runtime contract. The rest of the pack is versionless and role based. `TRAVERSAL_T0_ASSETS` now lists only the fork sign, shared foreground, and conditional branch cart. `TRAVERSAL_WORLD_ASSETS`, `TraversalDepth`, and `TraversalCaravan` point to the promoted files. Every promoted PNG has the same SHA-256 as its former path. The [final inventory](traversal-t0-cleanup-1-final-inventory.json) records every remaining file and the old/new image mapping; the manifest covers every current PNG and no deleted path.

## Removed material

- T0 pack: 46 superseded file contents (45 paths gone; an unused chassis at the canonical target path was replaced with the approved `closed-v1` chassis). This removed 78,626,651 bytes before the approved image promotions. The net pack reduction is 78,630,965 bytes after the manifest rewrite.
- Historical tooling and QA: 1,163 files, including 30 ignored logs, removed from `tools/traversal`, nine temporary `tools/traversal-t0-*` browser/video drivers, four superseded markdown reports, and three obsolete route gallery directories. Their [deletion log](traversal-t0-cleanup-1-deletions.json) records 2,100,963,814 removed bytes. The entire old `tools/traversal` tree is gone.
- Source: removed `TraversalRoadEncounter` and its test, the unreachable local road combat and merchant dialogue hooks in `GameApp`, the local interaction phase in `TraversalRunRuntime`/controller, dead beat categories and fields, chest/gold/obstacle entity rendering, and unused route constants. Canonical narrative dialogue content was retained.
- CSS: removed dead pickup, chest-open, gold, obstacle, booster, and assisted-bypass styling. Shared-world painting, foreground, caravan motion, lanes, transitions, checkpoint UI, and rush styling remain.

The removed directories include `background`, `road`, `forest-v4`, `entities`, `depth-v1`, discarded vehicle candidates, `world-v1/reference-convergence`, the historical QA folders, and the three older galleries: 73 directories in total. Git history retains their contents.

The accepted [shared-world full-flow report](traversal-t0-route-checkpoints-1-shared-world-full-generalization.md), its linked gallery, the [motion-handoff report](traversal-t0-motion-handoff-polish-1.md), and its linked clips/screenshots remain because the new focused browser run does not reproduce every accepted motion comparison. The independent remaining-legs audit also remains. `docs/TRAVERSAL_T0_FINAL_CONVERGENCE.md` remains as historical material cited by that independent audit; its pre-Lot-A runtime statements and old QA links are superseded by this report.

## Current runtime and regression contract

`TraversalWorldRenderer` owns all painted route and checkpoint scenery. `TraversalRouteRenderer` retains only distance and rush presentation. Every active Route 1–6 uses `world-v1/forest-road.png`; authored checkpoints appear only after the black cover. Stage order, Aider/Passer, fork authority, both selected consequences, Route 6 coast, and Journey destination agency are unchanged. The canonical regression workflow is one command: `node tools/traversal-t0-browser-qa.mjs`. The specialized inventory script is `tools/traversal-t0-cleanup-inventory.py`.

`TraversalT0Assets.test.ts` now fails if any runtime registry asset is missing, if a T0 PNG is absent from the manifest, if a manifest entry points to a missing or byte-changed image, if a current sprite lacks bounds, or if current Traversal source/manifest names forbidden legacy route scenery.

## Validation

- Focused Traversal, campaign, Journey, and cinematic suites: 51 files, 465 tests passed.
- Full Vitest: 160 files, 2,560 tests passed.
- After adding explicit sprite-bounds and conditional treasure-cart guards, the focused asset/route suites passed: 2 files, 9 tests.
- `tsc --noEmit`: passed.
- Production Vite build: passed (existing large-chunk advisory only).
- Canonical browser QA: Aider → branch A and Passer → branch B, 40 captures at 1440/620/390, all six shared forest routes, authored checkpoint paintings, black transitions, Passer departure, Route 6 coast/right exit, and destination agency. Zero missing captures, imperfect black frames, simultaneous worlds, duplicate caravans, frame errors, old route art, world/checkpoint/coast failures, 404s, or page errors. No frame-level TravelView flash or early `lion-first-refuge` commit. Final results and gallery: [browser QA](traversal-t0-cleanup-1-browser/browser-qa.json), [screenshots](traversal-t0-cleanup-1-browser/index.html), [motion data](traversal-t0-cleanup-1-browser/motion-flow.json).
- Runtime and manifest search found no old road/castle/`forest-v4` route path; the sole test-source occurrence is the explicit forbidden-path guard. `git diff --check` passed after trimming one test-file EOF blank line.

The new captures were visually inspected against accepted Route 1 evidence and at 390 px for Route 5A, Route 5B, Passer departure, and Route 6 coast. The source art and vehicle images are byte identical; timing-dependent wheel angle and camera phase vary between captures.
