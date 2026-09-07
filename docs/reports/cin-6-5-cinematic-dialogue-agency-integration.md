# CIN-6.5 — Cinematic Dialogue & Agency Integration

## Status

`READY_FOR_CIN_6C: YES`

This pass changes Journey presentation from `VIDEO → DISPOSE → DIALOGUE` to
`VIDEO → FREEZE → DIALOGUE/AGENCY → RELEASE`. Cinematics remain local,
reviewed presentation assets. Dialogue traversal, choices, effects, route
commits, combat, saves, and chapter truth remain owned by the existing game
systems.

## Baseline and pre-flight

| Gate | Result |
| --- | --- |
| Branch | `main` |
| Required `HEAD` | `ee41c01ca05d52ac4656c3d2e1342a5181dbfc6c` |
| `origin/main` | `ee41c01ca05d52ac4656c3d2e1342a5181dbfc6c` |
| Baseline worktree | clean |
| Manifest | 21 unique descriptors: one QA placeholder and 20 production masters |
| CIN-6A / CIN-6B media | present and manifest-backed |
| CIN-6B continuity hashes | unchanged (`bois_clair_sacrificed`: `db07031a3105fb31280abe3aca026cb74e4612e2aa44f7023b5401847322f1a4`; `lion_trial_route_ending`: `34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2`) |
| Production presentation | `TravelView` preserved |
| Journey policy | DEV-selected only through `?journey=cinematic` |
| Phase B Combat Pose / Unit Motion | present; runtime files untouched |
| Runtime AI / provider API | none |
| `MINIMAX_API_KEY` | present in ignored, untracked `.env.local`; value never printed or recorded |

## Architecture

`CinematicDialogueSession.presentCinematicDialogue()` owns exactly one
presentation lifecycle:

1. acquire one `CinematicPlayer.playHeld()` result;
2. keep a healthy naturally-ended or skipped surface;
3. freeze the existing video surface;
4. mount the existing `DialogueView` engine in `cinematic-overlay` mode;
5. let existing dialogue traversal and `GameApp.applyEffects()` remain authoritative;
6. release the held surface in `finally`;
7. use classic `DialogueView` without replaying the cinematic when media is unavailable or unhealthy.

The Journey branch is exclusive: a mapped `beforeDialogue` cinematic is not
also passed through `SceneTransition` as an interlude. Non-Journey and unmapped
dialogues retain the previous `SceneTransition → DialogueView` path.

## DialogueView cinematic mode

The new mode reuses the same dialogue sequence, step, choice, contest, effect,
and completion implementation. It only changes presentation:

- the painted dialogue backdrop and full-body portraits are suppressed;
- the held cinematic remains full viewport;
- a scoped lower-screen gradient and translucent dialogue/choice surfaces keep text readable;
- speaker, tag, text, outcomes, choices, and Continue remain unchanged;
- the first enabled choice or Continue surface receives focus;
- normal `DialogueView` retains its existing environment and portrait behavior.

No deterministic dialogue text, choices, speech, or lip sync were added to any
MP4.

## Modal, z-order, and focus ownership

On freeze, `CinematicOverlay` hides/disables its controls, blurs a focused
cinematic control, becomes `role=presentation`, receives `aria-hidden=true` and
`inert`, loses `aria-modal`, and cannot intercept pointer input. The held layer
is at z-index 9100; dialogue/agency is at 9200. Browser inspection found exactly
one `aria-modal=true` owner while dialogue or agency was interactive.

Release removes the overlay, media, controls, and associated listeners through
the existing overlay/player cleanup. Focus is transferred into dialogue/agency;
the released backdrop cannot steal it.

## Journey mappings and pilots

The existing reviewed mapping table remains unchanged:

| Dialogue | Cinematic | Result |
| --- | --- | --- |
| `lion_briefing` | `alaric_audience_arrival` | PASS: natural 9.000 s end, held dialogue, one modal, release on completion |
| `village_choice` | `bois_clair_arrival` | PASS: natural 20.000 s end, real choices over the held village, one selected combat, release before CombatStage |
| `shadow_signs` | `shadow_signs` | PASS: natural 20.000 s end, neutral held presentation, deterministic evidence choice, release on completion |
| `final_refuge` | `final_refuge_dossier` | Existing reviewed mapping preserved; regression coverage PASS |

The route-agency pilot used the real `refugees_approach` fork. It ended at
12.000 s, retained the passive held surface under the existing Journey agency
controls, displayed two real `RunSystem` successors, and committed exactly one
route. No route label, availability rule, or mutation path changed.

## Dialogue and game-truth safety

Focused tests prove that step effects, choice effects, `startCombat`, and
`finishChapter` are each forwarded exactly once through the existing
`DialogueView` effect callback. No new effect application path exists.

The real Bois-Clair flow was exercised as:

`bois_clair_arrival → held village_choice → Sauver les habitants → tactical combat → victory → bois_clair_saved → aftermath/refuge`.

There was one combat iframe, the cinematic overlay was absent before CombatStage
became interactive, and the existing deterministic saved-state selection
remained authoritative. Interactive refuge management also remained intact.

Source and diff audits confirm that cinematic presentation code does not set
flags, enter run nodes, start combat independently, resolve contests, grant
rewards, select finale routes, or mutate save state.

## Fallback matrix

| Case | Result |
| --- | --- |
| mapped + natural end | held final frame, cinematic dialogue, deterministic release |
| mapped + Skip | current valid frame held; dialogue/agency begins immediately; dialogue itself is not skipped |
| mapped + reduced motion | moving surface bypassed; classic non-moving dialogue remains usable |
| mapped + unavailable | unusable surface released; classic dialogue executes once |
| mapped + autoplay/error/timeout | unusable surface released; classic dialogue executes once |
| unmapped | classic dialogue path |
| non-Journey | classic dialogue path |

Unit coverage exercises every row. Real Chromium Journey QA additionally
recorded:

- Skip: `PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED`, result `skipped`, zero residue;
- reduced motion: no video element, agency reachable, zero residue;
- unavailable media: neutral fallback, agency reachable, zero residue.

## Real Chromium QA

An actual DEV Journey campaign was driven from a fresh chronology through the
Shadow Signs pilot. It exercised the remastered camp departure, Alaric held
dialogue, real tactical combat, refugees route choice, both interactive refuge
loops, Bois-Clair held choice and combat, witnesses routing, ruins combat, and
Shadow Signs held dialogue.

Observed final-frame states:

| Asset | `currentTime / duration` | State | Decoded dimensions |
| --- | --- | --- | --- |
| `camp_departure` | `12 / 12` | ended, paused, readyState 4 | 1920×1080 |
| `alaric_audience_arrival` | `9 / 9` | ended, paused, readyState 4 | 1920×1080 |
| `refugees_approach` | `12 / 12` | ended, paused, readyState 4 | 1920×1080 |
| `bois_clair_arrival` | `20 / 20` | ended, paused, readyState 4 | 1920×1080 |
| `shadow_signs` | `20 / 20` | ended, paused, readyState 4 | 1920×1080 |

The attached Chrome viewport was 1463×690 and confirmed the narrower-desktop
layout and interactions. A second Playwright Chromium run used an exact
1920×1080 viewport and the real Alaric campaign pilot. It found a 1920×1080
decoded frame at natural end, one modal owner, no portrait, the painted backdrop
hidden, a transparent dialogue surface, the dialogue box fully within the
viewport (`left 445, top 884.61, right 1475, bottom 1047.61`), zero console
errors, and zero overlay residue after completion.

Accelerated video surfaces can appear black in an attached-browser screenshot
even when video health is valid. The 1920×1080 headless Chromium capture rendered
the decoded final frame correctly; offline frame extraction and ffprobe were
used as the authoritative visual/media checks where the attached capture plane
was unavailable.

## Camp departure polish

`camp_departure` was the only authorized remaster. Shot 1 was preserved
byte-for-byte. Shot 2 used one MiniMax-H3 I2V attempt with a revised deterministic
source and lateral-track prompt. The cross-shot scale defect is corrected; see
`cin-6-5-camp-departure-remaster.md` for complete provenance and QA.

No P1 media or new manifest ID was produced.

## Validation

| Gate | Result |
| --- | --- |
| Focused CIN-6.5/Journey/dialogue/CIN-6A/CIN-6B/finale/census/media/Phase B tests | PASS — 24 files, 346 tests |
| Full `npm test` | PASS — 98 files, 2,112 tests |
| Campaign census validator | PASS — 64 entries; prioritized primary P0 17/P1 9; ordered targets including reuse P0 20/P1 11 |
| Camp shot/staging validator | PASS — 2 shots, 12 s, zero warnings/errors |
| Camp technical media validator | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — 113 modules transformed |
| `git diff --check` | PASS (only Windows line-ending notices) |
| Secret audit | PASS |

The build retains the existing Rollup large-chunk advisory; it is not caused by
this presentation integration.

## Scope and invariants

Tracked runtime changes are limited to cinematic presentation ownership,
`DialogueView`'s optional presentation mode, scoped CSS, and focused tests.
There are no changes to `runSystem.ts`, campaign topology, narrative facts,
combat configuration/runtime, Unit Motion/Pose, save schema, rewards, or AI.

Exact changed files:

- `public/assets/cinematics/camp_departure.mp4`
- `src/cinematics/CinematicDialogueSession.ts`
- `src/cinematics/CinematicDialogueSession.test.ts`
- `src/cinematics/CinematicOverlay.ts`
- `src/cinematics/CinematicPlayer.test.ts`
- `src/game/GameApp.ts`
- `src/game/cin65CinematicDialogueIntegration.test.ts`
- `src/styles/app.css`
- `src/ui/DialogueView.ts`
- `src/ui/DialogueView.test.ts`
- `tools/cinematics/specs/cin6a/camp_departure.json`
- `docs/reports/cin-6-5-cinematic-dialogue-agency-integration.md`
- `docs/reports/cin-6-5-camp-departure-remaster.md`

| Invariant | Result |
| --- | --- |
| Manifest IDs changed | NO (21 total) |
| New media IDs | 0 |
| P1 production started | NO |
| TravelView preserved | YES |
| Journey production default | NO |
| Runtime AI added | NO |
| Game truth changed | NO |
| Save schema changed | NO |
| Combat runtime changed | NO |
| Commit | NO |
| Push | NO |

## Known limitations

- Attached-browser screenshots may omit accelerated video pixels; element
  health, natural-end state, offline decoded frames, and a 1920×1080 Playwright
  Chromium capture provide the evidence instead.
- Cinematic overlay mode intentionally applies only to reviewed Journey
  `beforeDialogue` mappings. Classic and unmapped dialogue screens remain
  unchanged.
- Audio architecture, P1 media, reference synthesis, and the Journey production
  default remain deferred.
