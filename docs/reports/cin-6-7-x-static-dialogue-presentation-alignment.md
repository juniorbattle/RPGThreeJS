# CIN-6.7.x — Static Dialogue Presentation Alignment

Date: 2026-09-10  
Status: **READY — ALL STATIC DIALOGUE PRESENTATION GATES PASS**

## BASELINE

- Required baseline: `HEAD == origin/main == dcf990e81e5a65fec71ffe493e0b4c5f9e277814`.
- Branch: `main`.
- The worktree was clean before implementation.
- The baseline already contained CIN-6.7.3 dialogue spatial coherence and static tableau cast presence.
- No commit or push was requested or performed.

## PRE-FLIGHT

- `git fetch origin main` completed before implementation.
- The active still presentation, moving-video presentation, dialogue adapter, stage lifecycle, approved choice geometry, and generated staging audit were inspected before modification.
- The operator's two course corrections replaced the earlier small full-body target with large canonical full sprites, intentional runtime bottom crop, and a larger upper-middle static dialogue card.
- Source sprites and production cinematic media were treated as protected inputs.

## FILES CHANGED

Runtime presentation:

- `src/cinematics/NarrativeTableau.ts`
- `src/cinematics/DialogueStagingDirector.ts`
- `src/cinematics/NarrativeDialogueAdapter.ts`
- `src/cinematics/NarrativeSceneSurface.ts`
- `src/cinematics/NarrativeStage.ts`
- `src/ui/DialogueView.ts`
- `src/game/GameApp.ts` — one presentation-mode argument only
- `src/styles/app.css`

Audit and browser QA:

- `src/cinematics/NarrativeStagingAudit.ts`
- `tools/cinematics/specs/narrative_dialogue_staging.json`
- `tools/cinematics/run_cin671_browser_qa.mjs`
- `tools/cinematics/run_cin67_browser_qa.mjs`
- `tools/cinematics/run_cin67x_static_dialogue_qa.mjs`
- `tools/cinematics/run_cin67x_video_regression_qa.mjs`
- `tools/cinematics/validate_cin67x_choice_geometry.mjs`

Focused tests:

- `src/cinematics/Cin673SpatialCoherence.test.ts`
- `src/cinematics/DialogueStagingDirector.test.ts`
- `src/cinematics/NarrativeDialogueAdapter.test.ts`
- `src/cinematics/NarrativeSceneSurface.test.ts`
- `src/cinematics/NarrativeStage.test.ts`
- `src/cinematics/NarrativeStagingAudit.test.ts`
- `src/ui/DialogueView.test.ts`

Mission report:

- `docs/reports/cin-6-7-x-static-dialogue-presentation-alignment.md`

## STATIC CHARACTER PRESENTATION

Canonical `full` sprite files remain the runtime inputs and remain byte-for-byte untouched. The new presentation scales their existing transparent canvases by cast count, anchors each canvas below the viewport, and lets the viewport crop the lower body. The source PNG is never cropped or rewritten.

The browser QA now derives geometry from the ready-manifest alpha bounds and the actual `object-fit: contain; object-position: center bottom` rendering. This corrects the previous measurement error that vertically centered image content inside the taller figure element. Every sampled actor records these player-visible fields:

- `scaledBodyHeightBeforeViewportCrop`
- `visibleBodyHeightOnScreen`
- `cropPixelsBottom`
- `cropRatioBottom`
- `visibleHeadY`
- `visibleCenterX`

Observed body geometry across both viewports:

| Cast count | Alpha-visible body before crop | Visible body on screen | Bottom crop ratio |
| ---: | ---: | ---: | ---: |
| 2 | 73.68%–73.91% vh | 60.68%–60.79% vh | 17.65%–17.75% |
| 3 | 66.39%–68.89% vh | 54.49%–56.79% vh | 17.57%–18.03% |
| 4 | 64.80%–64.83% vh | 54.20%–54.23% vh | 16.35%–16.36% |
| 6 | 59.69%–61.23% vh | 50.99%–52.44% vh | 14.24%–14.57% |

Representative operator-gate measurements:

| Scene | Viewport | `scaledBodyHeightBeforeViewportCrop` | `visibleBodyHeightOnScreen` | `cropPixelsBottom` | `cropRatioBottom` | `visibleHeadY` | `visibleCenterX` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Six-character opening, active Séraphine | 1920×1080 | 660.96 px | 566.04 px | 94.91 px | 14.36% | 513.96 px | 270.91 px |
| Four-character Audience, active Alistair | 1920×1080 | 699.83 px | 585.36 px | 114.47 px | 16.36% | 494.64 px | 326.78 px |
| Six-character opening, active Séraphine | 1366×768 | 470.24 px | 402.76 px | 67.48 px | 14.35% | 365.24 px | 192.73 px |
| Four-character Audience, active Alistair | 1366×768 | 497.90 px | 416.51 px | 81.39 px | 16.35% | 351.49 px | 232.48 px |

The opening keeps all six characters and uses silhouette overlap instead of shrinking them into a complete-body lineup. The four-character Audience places heads at roughly 45.8% of viewport height and continues each body below the viewport. Weapons, faces, shoulders, and upper torsos remain readable.

## SPEAKER EMPHASIS

- Active speaker: opacity `1`, z-index `6`, full brightness and contrast.
- Listener: opacity `0.5`, z-index `2`, readable but subdued.
- Background-only actor: opacity `0.26`.
- Every staged actor retains `physicalScale: 1`.
- Speaker rules contain no scale or translation override.
- The browser QA compares alpha-visible body height for every Audience actor across Alaric, Alistair, Séraphine, Maelor, and active-choice handoffs. Maximum allowed difference is `0.1 px`; all handoffs pass.
- Actor DOM nodes remain stable through opening speaker changes.
- Under-sprite name labels: `0` across every sampled tableau.

## STATIC DIALOGUE BOX AND POSITIONING

Static and video dialogue now carry an explicit presentation mode. Only `STATIC_TABLEAU` resolves the three upper speaker associations:

| Speaker lane | Static placement | Association |
| --- | --- | --- |
| Left side | `LEFT_UPPER` | `SPEAKER_LEFT_UPPER` |
| Center | `CENTER_UPPER` | `SPEAKER_CENTER_UPPER` |
| Right side | `RIGHT_UPPER` | `SPEAKER_RIGHT_UPPER` |

Static dialogue cards use a `14vh` top anchor, `42vw` target width, and stronger minimum height. Actual browser geometry is:

| Viewport | Top | Bottom | Width |
| --- | ---: | ---: | ---: |
| 1920×1080 | 151.19 px / 14.00% | 341.19 px / 31.59% | 806.39 px / 42.00% |
| 1366×768 | 107.52 px / 14.00% | 277.52 px / 36.13% | 573.72 px / 42.00% |

This puts the card in the requested upper-middle band with moderate headroom and enough visual weight for title, subtitle, body, and CTA. The browser gate rejects any static card outside 12%–18% top, 27%–37% bottom, or 38%–48% width. It also rejects overlap with the active actor's alpha-visible upper silhouette. All sampled cards pass with no content clipping, card scrolling, face obstruction, or page overflow.

Progressive text reveal retains its final card geometry. Observed card movement is `0 px`, content overflow is `0`, and reveal completion passes at both viewports.

## VIDEO REGRESSION

Actual moving and held video remains under `VIDEO_CUTSCENE` ownership and keeps the accepted lower speaker relationship:

- Moving Audience / Alaric: `RIGHT` + `SPEAKER_RIGHT_LOWER`.
- Held Audience / Alistair: `LEFT` + `SPEAKER_LEFT_LOWER`.
- Held Audience / Alaric: `RIGHT` + `SPEAKER_RIGHT_LOWER`.
- Video choice setup / Maelor: `RIGHT` + `SPEAKER_RIGHT_LOWER`.
- Video pre-combat threat: `BOTTOM_CENTER`.
- Static actor duplication during moving or held video: `0`.
- Automatic DialogueView portrait duplication: `0`.

Opening and post-combat scenes have no moving media for those beats, so they correctly use the static upper grammar even when the run requests video authoring mode. Production video files, cinematic IDs, playback, held frames, skip/release behavior, media startup, and the cinematic manifest are unchanged.

Both viewports report moving video-frame deltas above `0.90`, zero black-exposure samples, zero no-stage samples, zero dialogue-during-loading samples, zero choice-during-loading samples, and zero failed media requests.

## CHOICE AND ROUTE GEOMETRY

Choice logic, availability, text, callbacks, effects, order, and positioning remain unchanged. The baseline comparator checks 18 rectangles across both viewports:

- 12 dialogue-choice cards
- 2 single-route controls
- 4 route-fork controls

Result: `18/18` exact comparisons, maximum horizontal delta `0 px`, identical width and height, and no changed choice-geometry declaration in the CSS diff.

Machine result: [choice-geometry.json](../../tmp/cinematics/cin67x/after/choice-geometry.json)

## REAL-BROWSER QA

Static QA passes 1920×1080 and 1366×768 across opening, single route, four-character Audience handoffs, Audience choice, normal multi-speaker choice, opposing-group choice, route fork, pre-combat, combat isolation, immediate post-combat, and contextual after-the-event dialogue.

Reduced-motion also runs in real Chromium at both viewports. In both runs:

- `(prefers-reduced-motion: reduce)` matches.
- Environment animation: `none`.
- Atmosphere animation: `none`.
- Actor transition duration: `0s`.
- Dialogue-card transition duration: `0s`.
- The same foreground, crop, card band, card weight, no-obstruction, and overflow gates pass.

Visual evidence:

| Review case | Baseline | Aligned result |
| --- | --- | --- |
| Six-character opening | [1920×1080 baseline](../../tmp/cinematics/cin673/after/stills/1920x1080-00-opening-company-cast.png) | [1920×1080 aligned](../../tmp/cinematics/cin67x/after/stills/1920x1080-00-opening-company-cast.png) |
| Four-character Audience, Alistair | [1920×1080 baseline](../../tmp/cinematics/cin673/after/stills/1920x1080-02-audience-alistair.png) | [1920×1080 aligned](../../tmp/cinematics/cin67x/after/stills/1920x1080-02-audience-alistair.png) |
| Four-character Audience, Alaric | [1366×768 baseline](../../tmp/cinematics/cin673/after/stills/1366x768-01-audience-alaric.png) | [1366×768 aligned](../../tmp/cinematics/cin67x/after/stills/1366x768-01-audience-alaric.png) |
| Six-character opposing group | [1366×768 baseline](../../tmp/cinematics/cin673/after/stills/1366x768-07-refugee-choice.png) | [1366×768 aligned](../../tmp/cinematics/cin67x/after/stills/1366x768-07-refugee-choice.png) |
| Static pre-combat | [1366×768 baseline](../../tmp/cinematics/cin673/after/stills/1366x768-10-pre-combat-threat.png) | [1366×768 aligned](../../tmp/cinematics/cin67x/after/stills/1366x768-10-pre-combat-threat.png) |
| Reduced-motion opening | — | [1920×1080 aligned](../../tmp/cinematics/cin67x/after/stills/1920x1080-16-reduced-motion-opening.png) |
| Moving-video Audience | — | [1920×1080 regression](../../tmp/cinematics/cin67x/after/video/1920x1080-01-audience-moving-speaker.png) |
| Held-video left speaker | — | [1920×1080 regression](../../tmp/cinematics/cin67x/after/video/1920x1080-02a-audience-held-left-speaker.png) |

The final evidence set contains 34 static screenshots, 18 video screenshots, both machine result files, and the choice comparator result.

Machine results:

- [Static and reduced-motion QA](../../tmp/cinematics/cin67x/after/stills/results.json)
- [Video regression QA](../../tmp/cinematics/cin67x/after/video/results.json)

## DETERMINISTIC STAGING AUDIT

The regenerated schema-v3 audit records static and video placements separately and rejects upper-card leakage into actual video:

| Audit gate | Result |
| --- | ---: |
| Reachable dialogues staged | 71/71 |
| Dialogue steps staged | 247/247 |
| Approved profiles | 9 |
| Choice steps | 28 |
| Unmapped dialogues or steps | 0 |
| Choice-purity violations | 0 |
| Text-capacity violations | 0 |
| Normal dialogue scroll violations | 0 |
| Accidental full-width fallbacks | 0 |
| Arbitrary center fallbacks | 0 |
| Unresolved media/speaker conflicts | 0 |
| Unresolved static scale outliers | 0 |
| Unresolved dialogue/speaker associations | 0 |
| Static upper-placement violations | 0 |
| Video-placement regressions | 0 |

Machine result: [narrative_dialogue_staging.json](../../tools/cinematics/specs/narrative_dialogue_staging.json)

## TESTS

| Gate | Result |
| --- | --- |
| Focused NarrativeStage regression | PASS — 12 files, 81 tests |
| Full Vitest suite | 115/116 files and 2220/2231 tests pass |
| Known full-suite exception | Exactly 11 established failures in `src/combat/vfx/CasterMotionBackCompat.test.ts`; the protected published registry contains 0 actions while that compatibility suite expects 33 |
| New regressions | 0 |
| TypeScript | PASS — `npx.cmd tsc --noEmit` |
| Production build | PASS — 123 modules transformed |
| `git diff --check` | PASS |
| Static browser QA | PASS — both viewports |
| Reduced-motion browser QA | PASS — both viewports |
| Video browser QA | PASS — both viewports |
| Choice geometry comparator | PASS — 18/18 exact comparisons |

## AUDIENCE SPEAKER AND CHOICE ALIGNMENT

The Audience tableau now keeps the delegation geography in the order `sage_seraphine | maelor | alistair | alaric`. Static speaker cards follow that rendered geometry: Maelor resolves to `CENTER_LEFT / LEFT_UPPER`, while Alaric remains `FAR_RIGHT / RIGHT_UPPER`.

The two canonical step-3 choices remain in their original source order with their original text, next step, and effects. Presentation anchors map choice index 0 (`Accepter la mission d’Alaric.`) to the right lane beside Alaric and choice index 1 (`Accepter, mais réclamer une avance.`) to the left lane beside Maelor. The UI adds lane metadata without reordering or copying the canonical choice objects.

Placement snapshot changes are deliberate and limited to the static Audience composition:

- Maelor: `CENTER_RIGHT / RIGHT_UPPER` → `CENTER_LEFT / LEFT_UPPER`.
- Alistair: `FAR_LEFT / LEFT_UPPER` → `CENTER_RIGHT / RIGHT_UPPER`, following the corrected cast order.
- Séraphine moves from `CENTER_LEFT` to `FAR_LEFT`; her card remains `LEFT_UPPER`.
- Alaric remains `FAR_RIGHT / RIGHT_UPPER`.
- Audience video cards retain their previous authored placements: Alaric `RIGHT`, Alistair `LEFT`, Maelor choice setup `RIGHT`.

The choice-geometry comparator reports 18/18 passing comparisons. It matches the two Audience cards by their new semantic lane and confirms zero size or coordinate drift; event choices, refugee choices, single-route controls, and route-fork controls remain unchanged.

Final targeted validation: 54/54 focused presentation tests pass, the final audit subset passes 40/40, static browser QA passes at 1920×1080 and 1366×768, video regression QA passes at both resolutions, and the regenerated 71-dialogue / 247-step staging audit reports zero violations.

## PROTECTED SYSTEMS

Baseline diff inspection reports no changes under:

- `public/assets` and all canonical full sprites
- production cinematic MP4s and cinematic manifest
- `src/game/runSystem.ts`
- `src/game/lionNarrative.ts`
- save schema and persistence logic
- combat logic, CombatStage, CasterMotion, Unit Motion/Pose, VFX, and published presets
- route pools, route truth, finale truth, reputation truth, or narrative consequences

`src/game/GameApp.ts` changes by one line that forwards `dialogueSurfaceMode` into the presentation stage. It does not change game truth, route selection, save state, or progression.

`TravelView` remains the production journey default. This mission generated no media, made no AI request, and added no runtime AI dependency.

## READINESS

| Required gate | Result |
| --- | --- |
| `STATIC_CHARACTER_FOREGROUND_DOMINANCE` | PASS |
| `STATIC_CHARACTER_UPPER_BODY_PRESENCE` | PASS |
| `STATIC_CHARACTER_INTENTIONAL_BOTTOM_CROP` | PASS |
| `VISIBLE_BODY_METRIC_AFTER_ALPHA_TRIM` | PASS |
| `FOUR_ACTOR_AUDIENCE_PRESENCE` | PASS |
| `SIX_ACTOR_CLAN_PRESENCE` | PASS |
| `SPEAKER_SCALE_STABLE` | PASS |
| `LISTENER_DIMMING_PRESERVED` | PASS |
| `STATIC_DIALOGUE_BOX_NOT_TOO_HIGH` | PASS |
| `STATIC_DIALOGUE_BOX_VISUAL_WEIGHT` | PASS |
| `STATIC_DIALOGUE_BOX_CONNECTED_TO_CAST` | PASS |
| `STATIC_SPEAKER_READABILITY` | PASS |
| `CANONICAL_SPRITES_MODIFIED` | NO |
| `VIDEO_SCENES_CHANGED` | NO |
| `GAME_TRUTH_CHANGED` | NO |

## BLOCKERS

No CIN-6.7.x blocker remains. The 11 full-suite `CasterMotionBackCompat` failures are the established protected-registry baseline exception and are unrelated to this presentation work.

## COMMIT / PUSH

- Commit performed: **NO**
- Push performed: **NO**
- CIN-6C started: **NO**
