# CIN-6.7.3 — Dialogue Spatial Coherence and Static Tableau Character Presence

Date: 2026-09-09
Status: **READY FOR CIN-6C**

## Baseline and pre-flight

- Required baseline: `HEAD == origin/main == 54c6b6a345b8d05c4760a6c654ea5085e9dc06b7`.
- The branch was `main` and the worktree was clean before implementation.
- The CIN-6.7.2 guarantees were verified before modification: nine approved profiles, 71 reachable dialogues, 247 dialogue steps, 28 choice states, active-choice card purity, stable progressive reveal, both target viewports, `TravelView` as the production default, and DEV-selected `NarrativeStage`.
- This remained a presentation-only change. No media was generated, no MiniMax request was made, and production MP4 files were not changed.

## Operator feedback and design doctrine

The previous deterministic profiles were correct but ordinary dialogue cards could appear in visually unrelated lanes, forcing the eye to search after a speaker handoff. Static tableaux also left too much empty environment around comparatively small full-body actors.

CIN-6.7.3 keeps the existing nine-profile system and makes rendered actor geometry authoritative. Ordinary dialogue now uses one of three speaker-relative associations:

| Actor position | Card placement | Association |
| --- | --- | --- |
| Far left, left, or center-left | `LEFT` | `SPEAKER_LEFT_LOWER` |
| Center | `CENTER_LOWER` | `SPEAKER_CENTER_LOWER` |
| Center-right, right, or far right | `RIGHT` | `SPEAKER_RIGHT_LOWER` |

`CENTER_LOWER` is the only new placement token. `DialogueStagingDirector` resolves every spoken step from the staged actor specification and rejects a speaker without authored geometry. That decision flows through `NarrativeDialogueAdapter`, `DialogueView`, `NarrativeSceneSurface`, and `NarrativeStage`, so the surface and dialogue card change together during a speaker handoff.

Static tableaux use larger cast-count-aware bounds. Every staged actor retains `physicalScale: 1` across speaker changes; focus, contrast, role, and depth provide emphasis without enlarging the active speaker. Existing actor DOM nodes are retained during handoffs. The generic tableau supports the full seven-character event cast, preventing cast loss when an additional speaker becomes active.

## Deliberate special cases

- The six-character opening retains `SPECIAL_TOP_CENTER`. Its upper-center card protects the ensemble and prevents the earlier lower-right cast mask.
- Curated pre-combat dialogue retains `SPECIAL_BOTTOM_BAND`. The reserved threat band remains exceptional rather than becoming an ordinary full-width fallback.
- Single-route journey agency retains its approved lower-edge card.
- Moving and held video keep video-owned cast. Their dialogue uses deterministic speaker associations without adding static actors or portraits.

## Choice visual lock

Choice behavior, labels, callbacks, order, availability, and effects were not changed. A choice setup line now follows its speaker, then the setup card disappears when agency becomes active. Existing two-path cards remain at the left and right screen extremities, and the single-route control remains in its approved lower-edge position.

The geometry comparator checked 18 before/after rectangles across both viewports: 12 two-choice cards, two single-route controls, and four route-fork controls. Every comparison passed with a maximum horizontal delta of `0 px`. The CSS diff contains no changed choice-card geometry declaration.

Machine result: [choice-geometry.json](../../tmp/cinematics/cin673/after/choice-geometry.json)

## Before and after evidence

| Review case | Before | After | Result |
| --- | --- | --- | --- |
| Opening six-character tableau | [1366×768 before](../../tmp/cinematics/cin673/before/stills/1366x768-00-opening-company-cast.png) | [1366×768 after](../../tmp/cinematics/cin673/after/stills/1366x768-00-opening-company-cast.png) | Stronger cast presence; all six remain readable; special upper-center card preserved |
| Audience left speaker | [1920×1080 before](../../tmp/cinematics/cin673/before/stills/1920x1080-02-audience-alistair.png) | [1920×1080 after](../../tmp/cinematics/cin673/after/stills/1920x1080-02-audience-alistair.png) | Compact lower-left card follows Alistair |
| Adviser handoff | [1366×768 before](../../tmp/cinematics/cin673/before/stills/1366x768-03-audience-seraphine.png) | [1366×768 after](../../tmp/cinematics/cin673/after/stills/1366x768-04-audience-maelor-setup.png) | Seraphine resolves left and Maelor resolves right from their staged positions |
| Center speaker | — | [1920×1080 after](../../tmp/cinematics/cin673/after/stills/1920x1080-15-post-combat-center-speaker.png) | `SPEAKER_CENTER_LOWER` is centered below the authority actor |
| Held-video left speaker | — | [1920×1080 after](../../tmp/cinematics/cin673/after/video/1920x1080-02a-audience-held-left-speaker.png) | Lower-left association with zero duplicated static actors |
| Held-video right speaker | [1920×1080 before](../../tmp/cinematics/cin673/before/video/1920x1080-02-audience-held-interactive.png) | [1920×1080 after](../../tmp/cinematics/cin673/after/video/1920x1080-02-audience-held-interactive.png) | Right association and active-choice purity preserved |
| Pre-combat band | [1366×768 before](../../tmp/cinematics/cin673/before/stills/1366x768-10-pre-combat-threat.png) | [1366×768 after](../../tmp/cinematics/cin673/after/stills/1366x768-10-pre-combat-threat.png) | Intentional reserved band remains readable |
| Immediate post-combat dialogue | [1366×768 before](../../tmp/cinematics/cin673/before/stills/1366x768-12-post-combat-aftermath.png) | [1366×768 after](../../tmp/cinematics/cin673/after/stills/1366x768-12-post-combat-aftermath.png) | NarrativeStage returns immediately with a speaker-relative card |
| Approved two-choice geometry | [1366×768 before](../../tmp/cinematics/cin673/before/stills/1366x768-05-audience-choice.png) | [1366×768 after](../../tmp/cinematics/cin673/after/stills/1366x768-05-audience-choice.png) | Left/right card dimensions and screen-edge positions are identical |

The evidence archive contains 30 before stills, 16 before video frames, 32 after stills, and 18 after video frames. It covers the required opening, ordinary left/right/center speaker, adviser, held-video, pre-combat, post-combat, choice setup/active, and multiple-listener cases at 1920×1080 and 1366×768.

## Viewport and scale audit

Both browser QA modes passed at both target viewports.

| Check | 1920×1080 | 1366×768 |
| --- | ---: | ---: |
| Opening active visible-body ratio | 0.3281 | 0.3422 |
| Audience active visible-body ratio | 0.3938 | 0.3962 |
| Post-combat active visible-body ratio | 0.4219 | 0.4322 |
| Progressive reveal card movement | 0 px | 0 px |
| Progressive reveal content violations | 0 | 0 |
| Page or card overflow | 0 | 0 |
| Choice geometry maximum delta | 0 px | 0 px |
| Moving/held-video static cast | 0 | 0 |

Rendered transparent-body bounds, physical scale, role, viewport ratio, and ground baseline are recorded for every sampled static actor. All physical scales are `1`, no primary actor falls below the audited minimum presence ratio, no actor is clipped, and each sampled tableau stays within the `3 px` ground-baseline tolerance. Adjacent speaker handoffs reuse the same cast nodes and physical scales.

The held-video samples resolve `SPEAKER_LEFT_LOWER` and `SPEAKER_RIGHT_LOWER` while reporting zero static cast and zero automatic portraits. Combat handoffs report zero uncovered samples and zero stale-interaction samples. The post-combat sample contains one `NarrativeStage`, zero `TravelView` instances, and zero `JourneyOverlay` instances.

Machine results:

- [Still browser QA](../../tmp/cinematics/cin673/after/stills/results.json)
- [Video browser QA](../../tmp/cinematics/cin673/after/video/results.json)

## Deterministic staging audit

The regenerated schema-v2 artifact records speaker position, association, physical scale, media ownership, and scale/association violations for every reachable step.

| Audit gate | Result |
| --- | ---: |
| Reachable dialogues staged | 71/71 |
| Dialogue steps staged | 247/247 |
| Approved profiles | 9 |
| Choice steps | 28 |
| Unmapped dialogues or steps | 0 |
| Arbitrary center fallbacks | 0 |
| Accidental full-width fallbacks | 0 |
| Choice-purity violations | 0 |
| Text-capacity violations | 0 |
| Normal dialogue scroll violations | 0 |
| Unresolved media/speaker conflicts | 0 |
| Unresolved static scale outliers | 0 |
| Unresolved dialogue/speaker associations | 0 |

Machine result: [narrative_dialogue_staging.json](../../tools/cinematics/specs/narrative_dialogue_staging.json)

## Validation

| Gate | Result |
| --- | --- |
| Focused NarrativeStage suite | PASS — 14 files, 96 tests |
| Full Vitest suite | 115/116 files and 2219/2230 tests pass |
| Known full-suite exception | Exactly 11 unchanged failures in `CasterMotionBackCompat.test.ts`; the protected published registry contains 0 actions while that compatibility suite expects 33 |
| New regressions | 0 |
| TypeScript | PASS — `npx.cmd tsc --noEmit` |
| Production build | PASS — 123 modules transformed |
| `git diff --check` | PASS |
| Still browser QA | PASS — both target viewports |
| Video browser QA | PASS — both target viewports |
| Choice geometry comparator | PASS — 18/18 exact comparisons |

## Protected-path audit

The baseline diff contains no changes under production cinematic media, `RunSystem`, Lion narrative truth, combat, CombatStage, CasterMotion, Unit Motion/Pose, VFX, published presets, save-schema logic, finale logic, reputation logic, or route logic. The cinematic manifest and all production MP4s are unchanged. No runtime AI dependency or request path was added. `TravelView` remains the production journey default and `NarrativeStage` remains DEV-selected.

## Known limitations and readiness

- The pre-existing protected-registry condition leaves exactly 11 `CasterMotionBackCompat.test.ts` failures in the full suite.
- Static and video actor pixel heights are intentionally not numerically identical; the gate is related visual hierarchy, stable physical scale, and composition safety.
- The opening and pre-combat layouts remain deliberate documented exceptions to the ordinary three-anchor lower grammar.

All CIN-6.7.3 hard gates pass. The result is ready for CIN-6C, which was not started. No commit or push was performed.
