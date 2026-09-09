# CIN-6.7.2 — NarrativeStage UI / Visual Language Hardening

Date: 2026-09-09  
Status: **READY FOR OPERATOR REVIEW**

## Baseline and pre-flight

- Repository baseline: `HEAD == origin/main == e57d311de299c523b69f257bf232b31a6fa85f9f`.
- The existing uncommitted CIN-6.7.1 implementation was preserved and refined in place.
- The task remained presentation-only. Dialogue content, branch truth, `RunSystem`, save schema, combat behavior, VFX registries, and production MP4 files were not changed.
- No media was regenerated and no MiniMax credits were used.
- The protected user-owned VFX registry remained untouched.

## Visual language now enforced

NarrativeStage now selects from nine named profiles with a separate deterministic placement value. Profile choice owns card capacity and intent; placement owns the safe-zone lane.

| Profile | Purpose | Placement rule |
| --- | --- | --- |
| `DIALOGUE_SIDE_COMPACT` | Ordinary scene-aware dialogue | Opposite side from the speaking actor |
| `DIALOGUE_TOP_CENTER` | Dense ensemble scenes with occupied lower composition | Upper center |
| `DIALOGUE_BOTTOM_BAND_RESERVED` | Curated threat and pre-combat holds | Reserved lower center band |
| `DIALOGUE_SPEAKER_FOCUS` | Dominant authority or premium single-speaker beat | Authored left/right lane |
| `INTRO_CAST_PRESENTATION` | Opening clan introduction with the complete cast retained | Upper center |
| `ADVISER_EXCHANGE` | Seraphine/Maelor political argument | Authored opposing lane |
| `CHOICE_TWO_PATH_SPATIAL` | Two choices tied to sides or geography | Two lower spatial cards |
| `CHOICE_SINGLE_ROUTE_CONTINUE` | Compact next-step journey state | Lower right |
| `HELD_VIDEO_DIALOGUE` | Dialogue over a held final video frame | Composition-aware side lane |

The same profile and placement data flows through `NarrativeTableau`, `DialogueStagingDirector`, `NarrativeDialogueAdapter`, `DialogueView`, `NarrativeSceneSurface`, and `NarrativeStage`. Still and video modes therefore consume one staging grammar.

## Corrected behaviors

### Choice purity

A choice step begins with an optional spoken setup state. Activating agency then removes the speaker card, marks the state `ACTIVE`, creates the authoritative choices, and focuses the first enabled option. The active state never renders the former central speaker card beside the two choices. Legacy painted dialogue keeps its established immediate-choice behavior; the setup transition applies to NarrativeStage.

### Stable progressive text

Each profile declares a maximum character capacity and maximum line intent. Long canonical text is split at sentence or word boundaries into presentation-only segments. The canonical step and its effects remain unchanged. Before typing begins, the final segment is written to an invisible layout-reservation layer; the visible reveal occupies the same grid cell. The card therefore has its final geometry from the first reveal frame.

Normal NarrativeStage cards use hidden overflow. The browser audit checks the actual speaker, text, and outcome element bounds throughout reveal, so decorative border elements do not create false scrollbar results.

### Composition and cast readability

- The opening clan card moved from the lower right to upper center. All six full-body cast members remain present, one speaker is active, five listeners remain visible, and actor DOM nodes remain stable between speaker changes.
- Audience authority, company, adviser, and choice setup states use authored right, left, right, and spatial placements respectively.
- Pre-combat dialogue uses a curated bottom band rather than making wide bottom cards the default.
- Post-combat dialogue immediately returns to a compact side card over the narrative tableau.
- Static scenes retain stage-owned full-character art. Moving and held-video scenes retain video-owned cast without automatic portrait duplication.

## Before and after evidence

| Defect | Before | After | Result |
| --- | --- | --- | --- |
| Opening card masked the lower-right company cast | [1366×768 before](../../tmp/cinematics/cin672/before/stills/1366x768-00-opening-company-cast.png) | [1366×768 after](../../tmp/cinematics/cin672/after/stills/1366x768-00-opening-company-cast.png) | Card moved to upper center; all six actors remain readable |
| Audience choice retained Maelor's central speaker card | [1366×768 before](../../tmp/cinematics/cin672/before/stills/1366x768-05-audience-choice.png) | [1366×768 after](../../tmp/cinematics/cin672/after/stills/1366x768-05-audience-choice.png) | Active agency contains only the two choices |
| Same choice grammar over a held video frame | Prior still defect above | [1366×768 video after](../../tmp/cinematics/cin672/after/video/1366x768-02-audience-held-interactive.png) | The speaker card is absent and video owns the cast |
| Adviser exchange needed an intentional safe-zone lane | — | [1366×768 adviser after](../../tmp/cinematics/cin672/after/stills/1366x768-03-audience-seraphine.png) | Adviser remains readable with a compact right-lane card |
| Pre-combat needed a curated wide treatment | — | [1366×768 pre-combat after](../../tmp/cinematics/cin672/after/stills/1366x768-10-pre-combat-threat.png) | Reserved lower band leaves the threat composition readable |
| Post-combat needed immediate narrative grammar | — | [1366×768 aftermath after](../../tmp/cinematics/cin672/after/stills/1366x768-12-post-combat-aftermath.png) | Compact side card returns without an intermediate travel screen |

The archived evidence contains 30 before stills, 30 after stills, and 16 after video screenshots across 1920×1080 and 1366×768.

## Browser validation

Both target viewports passed in still and video modes.

- Opening progressive reveal: 0 px width delta, 0 px height delta, zero content-bound violations, completed reveal.
- Active choices: speaker card hidden, `agencyState=ACTIVE`, both choices visible and reachable.
- Normal cards: `overflow-x:hidden`, `overflow-y:hidden`, no content-bound overflow, no page overflow.
- Still mode: no video/canvas leakage and no automatic dialogue portraits.
- Video mode: no static-cast or automatic-portrait duplication over moving or held video.
- Transition readiness: zero black-exposure samples, zero dialogue or choice activation during media preparation.
- Combat handoffs: zero uncovered samples and zero stale-interaction samples.
- Browser console errors, page errors, and request failures: zero.

Machine results:

- [Still 1920×1080](../../tmp/cinematics/cin672/after/stills/results-1920x1080.json)
- [Still 1366×768](../../tmp/cinematics/cin672/after/stills/results-1366x768.json)
- [Video, both viewports](../../tmp/cinematics/cin672/after/video/results.json)

## Validation status

| Gate | Result |
| --- | --- |
| Deterministic staging audit | PASS — 71/71 dialogues, 247/247 steps |
| Focused CIN-6.7.2 tests | PASS — 8 files, 56 tests |
| TypeScript | PASS — `npx.cmd tsc --noEmit` through the production build |
| Production build | PASS — 123 modules transformed |
| Full test suite | 114/115 files and 2212/2223 tests pass |
| Known full-suite exception | 11 failures in `CasterMotionBackCompat.test.ts`; the protected published registry contains 0 entries while that suite expects 33 |
| `git diff --check` | PASS |
| Protected-path audit | PASS — no dialogue truth, run system, Lion narrative, MP4, combat VFX, or registry diff |
| Commit/push | Not performed |

The full-suite exception is unchanged from the CIN-6.7.1 baseline and is outside this mission. CIN-6.7.2 introduces no failing NarrativeStage test.

## Operator review gate

The implementation is ready for operator review. Review the opening, audience setup-to-choice transition, held-video choice, adviser exchange, pre-combat band, and immediate post-combat screenshots at both target resolutions. CIN-6C and future media remaster work remain outside this gate.
