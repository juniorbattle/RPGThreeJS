# CIN-1 — Cinematic Journey Runtime Foundation

**Date:** 2026-09-03
**Status:** Implemented, tested, validated in a real browser. **Not committed. Not pushed.**
**Scope:** Presentation foundation only. No campaign, gameplay, narrative, combat or save change.

---

## 1. Baseline

| Item | Value |
|---|---|
| Branch | `main` |
| Baseline HEAD | `7bcf0b289806a3ece30fcbf6b07adc17cc5772a2` |
| Baseline commit | `R2C-VFX V2.7.1 — Remove startTime from CasterMotion, Beat.startDelay is sole timing abstraction` |
| Worktree at start | Clean (no modified, no untracked) |

### Baseline correction

The mission originally required HEAD `e43d2ca0af10dc7f9ace2ae08fc4c76edf3c054b`. At that HEAD the worktree
carried 10 uncommitted combat-VFX files (+430/−108) plus two untracked directories
(`public/assets/combat-stage/`, `tools/combat-stage/`). Work was **stopped and reported** per the pre-flight
rule rather than proceeding on a dirty tree. The operator then committed that work as `7bcf0b2` and authorised
it as the new baseline. `e43d2ca` is **not** the CIN-1 baseline. CIN-1 touched none of that committed
combat-VFX/Combat Stage work.

Baseline gate before any edit: `npm test` → **73 files / 1800 tests passed**.

---

## 2. Pre-existing cinematic architecture (audited before editing)

| File | Role at baseline |
|---|---|
| `src/cinematics/CinematicTypes.ts` | Descriptor/manifest/result/option types, 10 result reasons, 4 trigger hooks |
| `src/cinematics/CinematicRegistry.ts` | Zod-validated manifest, load-once, empty-on-failure, `parseVideoCinematicManifest` |
| `src/cinematics/CinematicPlayer.ts` | Single-owner playback: skip, mute toggle, autoplay rejection, stall/global timeout, abort, reduced-motion bypass, placeholder path, busy guard |
| `src/cinematics/CinematicOverlay.ts` | Overlay DOM, video element, fallback card, controls, focus restore, media teardown |
| `src/cinematics/CinematicTriggers.ts` | `VIDEO_CINEMATIC_TRIGGERS` (all four maps empty) + resolver |
| `src/cinematics/CinematicPlayer.test.ts` | 8 tests |
| `src/cinematics/CinematicRegistry.test.ts` | 4 tests |
| `src/game/GameApp.ts` | Owns registry + player; DEV QA lab at `?qa=1&cinematic=1` with 5 standalone scenarios; `cinematicInterlude` / `playStandaloneCinematic` |
| `src/ui/SceneTransition.ts` | Covered interlude window (`interlude()` runs while the screen is covered) |
| `public/assets/cinematics/manifest.json` | Only `qa-placeholder` (placeholderOnly) |

Every one of those semantics is preserved. CIN-1 is strictly additive on top of it.

---

## 3. Files changed

### Modified (7 files, +245 / −9)

| File | +/− | Change |
|---|---|---|
| `src/cinematics/CinematicTypes.ts` | +6/−0 | Added `HeldVideoCinematic` |
| `src/cinematics/CinematicOverlay.ts` | +46/−1 | Added poster surface, frame-watch, `freeze()`, `isFrozen`, idempotent `dispose()` |
| `src/cinematics/CinematicPlayer.ts` | +29/−7 | Added `playHeld()`; `play()` now delegates to a private `run(id, options, hold)` |
| `src/cinematics/CinematicPlayer.test.ts` | +97/−0 | Added a `cinematic player hold` describe (7 tests) + a poster descriptor |
| `src/cinematics/CinematicRegistry.test.ts` | +19/−1 | Added 2 production-data guard tests |
| `src/game/GameApp.ts` | +18/−0 | DEV cinematic QA lab only: one import, scenario buttons, one delegating branch |
| `src/styles/app.css` | +30/−0 | Purely additive rules (no existing declaration changed) |

All 9 deleted lines are in-place rewrites of the same statement — verified individually in §11.

### Added (9 files, 1482 lines)

| File | Lines | Role |
|---|---|---|
| `src/cinematics/JourneyTypes.ts` | 76 | State enum, transition table, presentation/commit contracts |
| `src/cinematics/JourneySession.ts` | 168 | The Journey state machine |
| `src/cinematics/JourneyOverlay.ts` | 143 | Generic player-agency overlay |
| `src/cinematics/CinematicPreloader.ts` | 122 | Candidate clip preloader |
| `src/cinematics/JourneyQaScenarios.ts` | 340 | The 10 QA scenarios (shared by browser lab and tests) |
| `src/cinematics/JourneySession.test.ts` | 224 | 16 tests |
| `src/cinematics/JourneyOverlay.test.ts` | 138 | 11 tests |
| `src/cinematics/CinematicPreloader.test.ts` | 123 | 10 tests |
| `src/cinematics/JourneyQaScenarios.test.ts` | 148 | 13 tests |

No binaries. No generated artifacts. No production data.

---

## 4. Final architecture

```
GameApp (DEV QA lab only in CIN-1)
    │
    └── JourneyQaScenarios ────── builds its own in-memory registry/player/session per scenario
                │
                ▼
        JourneySession ── presentation-only state machine
            ├── CinematicPlayer.playHeld()  → HeldVideoCinematic { result, surface, release }
            │       └── CinematicOverlay.freeze()   (keeps the settled surface mounted)
            ├── neutral surface              (when nothing was mounted at all)
            ├── JourneyOverlay               (agency; single-commit latch)
            └── CinematicPreloader           (candidate clips; dedupe/release/clear)
```

Authority direction is unchanged: **game truth → cinematic presentation**. `JourneySession`,
`JourneyOverlay`, `JourneyTypes`, `CinematicPreloader` and `JourneyQaScenarios` import from `./` only —
enforced by an automated import-scan test.

---

## 5. State machine

```
IDLE ─────────► PLAYING ─────► FREEZE ─────► AGENCY ─────► TRANSITIONING
  │                                │            │                │
  │                                ├────────────┴────────────────┤
  │                                ▼                             ▼
  └──────────────────────────── DISPOSED ◄──────────────── (any state)
```

| From | Legal targets |
|---|---|
| `IDLE` | `PLAYING`, `AGENCY`, `DISPOSED` |
| `PLAYING` | `FREEZE`, `DISPOSED` |
| `FREEZE` | `AGENCY`, `TRANSITIONING`, `PLAYING`, `IDLE`, `DISPOSED` |
| `AGENCY` | `TRANSITIONING`, `DISPOSED` |
| `TRANSITIONING` | `PLAYING`, `IDLE`, `DISPOSED` |
| `DISPOSED` | *(terminal)* |

- No self-transitions. `presentCinematic` while `PLAYING` therefore returns `busy` — the same vocabulary
  `CinematicPlayer` already uses — instead of starting a second presentation.
- `AGENCY → PLAYING` is illegal: a new clip can only follow a commit (`TRANSITIONING`) or a `FREEZE`.
- Public API: `presentCinematic`, `requestAgency`, `beginTransition`, `releaseFreeze`,
  `preloadCandidates`, `releaseCandidates`, `dispose`; observers `state`, `stateTrace`, `frozenSurface`,
  `agencyOverlay`, `candidatePreloader`, plus an `onStateChange` callback.
- `stateTrace` (capped at 64) is what the QA lab prints, so the lifecycle is visible in the browser.
- The session **never** imports or mutates `GameState`, never calls `enterRunNode()`, never resolves
  dialogue, never starts combat.

---

## 6. Backward compatibility strategy

`CinematicPlayer.play()` keeps its exact signature and semantics. Both entry points funnel into one private
`run(id, options, hold)`:

```ts
play(id, options = {})     → run(id, options, false).then((held) => held.result)
playHeld(id, options = {}) → run(id, options, true)
```

- Every early return (`busy`, `unavailable`, `aborted`, `reduced-motion`) yields the identical
  `{ id, reason, played: false }` result.
- `this.active` is still assigned synchronously, and the overlay is still mounted synchronously inside the
  promise executor — so `busy` guarding and "click the skip button right after calling play" both still work.
- `finish()` differs only by `if (hold) overlay.freeze(); else overlay.dispose();`.
- `beforeDialogue` / `beforeCombat` / `afterCombat` / `chapterBeat` go through
  `cinematicInterlude()` → `play()`, which is untouched. No existing call site was converted to a
  held/freeze session.
- The 8 pre-existing `CinematicPlayer` tests pass **unmodified**.

Only observable difference: `play()` resolves one extra microtask later. No test, timer or DOM
interaction depends on that.

---

## 7. Freeze strategy

Aim: no canvas extraction. A `<video>` that has rendered at least one frame keeps displaying that frame once
paused/ended, so freezing means *not tearing the element down*.

`CinematicOverlay` tracks `renderedFrame` from `loadeddata` / `playing` / `timeupdate` / `ended` (own
`AbortController`, released by `dispose()`). `freeze()` then:

1. adds `cinematic-overlay--frozen`, hides + disables skip and mute;
2. if a frame was rendered → keeps the video element exactly as it is (final frame held by the browser);
3. else if the descriptor has a `poster` → shows the new `.cinematic-overlay__poster` surface;
4. else → shows the existing text fallback;
5. pauses the video. It does **not** clear `src`, children or call `load()` — that is `dispose()`'s job.

`freeze()` and `dispose()` are both idempotent, and `dispose()` after `freeze()` performs the full teardown
including focus restore. Offline last-frame chaining is **not** implemented here; it belongs to the CIN-4
production pipeline.

---

## 8. Fallback strategy

`presentCinematic` reaches `FREEZE` for **every** outcome. There is no path where a cinematic problem
prevents agency:

| Playback outcome | Surface held at `FREEZE` |
|---|---|
| `ended` | Video element on its final frame |
| `skipped` | Video element on its current frame |
| `placeholder` | Descriptor fallback card |
| `unavailable` (no playable source) | Poster if present, else fallback card |
| `autoplay-rejected` | Poster if present, else fallback card |
| `error` | Poster if present, else fallback card |
| `timeout` / stall | Poster if present, else fallback card |
| `aborted` | Nothing is retained (the session is being torn down) |
| `unavailable` (unknown ID) | Neutral `journey-surface--neutral` created by the session |
| `reduced-motion` | Neutral `journey-surface--neutral` created by the session |

The neutral surface is tagged `data-journey-fallback="<reason>"`, which is how QA and tests prove which
degradation path was taken. When no surface exists at all, `JourneyOverlay` is mounted with
`journey-overlay--standalone`, which supplies its own opaque backdrop.

---

## 9. Preload ownership and cleanup

`CinematicPreloader(registry, { maxEntries = 3, createVideoElement })`:

- `preload(ids)`, `release(ids)`, `clear()`; observers `size`, `retainedCount`, `has`, `statusOf`.
- Statuses: `preloading` → `ready`, or non-fatal `skipped` / `failed`.
- Dedupe: an ID already tracked is never re-requested, including after it `failed`.
- Local media only — descriptors come from `CinematicRegistry`; unknown IDs, `placeholderOnly` descriptors
  and unsupported codecs resolve to `skipped`.
- **Never** calls `play()`; elements are created with `autoplay = false`, `muted = true`, `preload = 'auto'`
  and are never attached to the document.
- `maxEntries` evicts the oldest retained element, so a Journey cannot preload the whole campaign and
  cannot retain video elements unboundedly.
- Release/eviction/error all run the same teardown: abort listeners, pause, remove `src`, clear children,
  `load()`.
- Ownership: a `JourneySession` creates its own preloader unless one is injected, and `dispose()` always
  calls `clear()`. An injected preloader is therefore also cleared by the owning session — deliberate,
  since the session is what populated it.

---

## 10. Journey overlay contract

```ts
JourneyChoicePresentation          { id, label, category?, difficulty?, hint?, risk?, reward?, disabled? }
JourneySecondaryActionPresentation { id, label, disabled? }
JourneyAgencyPresentation          { title?, caption?, choices, secondary?, continueLabel? }
JourneyCommit                      { kind: 'choice' | 'continue' | 'secondary' | 'aborted', id: string | null }
```

- `choices.length === 0` → one continuation affordance (`[data-journey-continue]`), commit `continue`.
- `choices.length >= 1` → route buttons (`[data-journey-choice="<id>"]`), commit `choice`.
- `secondary` → generic buttons (`[data-journey-secondary="<id>"]`), commit `secondary`.
  `JOURNEY_SECONDARY_ACTION_IDS` reserves `COMPANY`, `ROADMAP`, `SAVE`, `MENU`, `CAMP`. **None is wired to a
  production system in CIN-1**; the overlay only reports the ID.
- Single commit: the first press latches the overlay, disables every button and fires the callback once.
  Further presses — including on detached nodes — are ignored. The session promise also resolves once.
- `aborted` means *no player decision*: session disposed while agency was open, or agency requested from a
  state that does not allow it. It is never a route.
- All labels are rendered with `textContent`, never `innerHTML`.
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-label` from the title; first enabled affordance
  is focused on mount; previous focus restored on dispose; Escape is deliberately **not** bound, so it can
  never be mistaken for a decision.
- The overlay holds no route/game truth — it renders what it is given. The CIN-2 adapter will map real
  `RunNode` data into these objects.

---

## 11. Diff audit

Checked for accidental gameplay changes, TravelView replacement, trigger population, binaries, generated
artifacts and formatting churn.

- `src/game/GameApp.ts` (+18/−0) touches **only** `renderCinematicQa` (two headings, one lead paragraph, one
  scenario-button loop) and one `scenario.startsWith('journey-')` branch at the top of `runCinematicQa`,
  plus one import. No gameplay method, no `RunSystem`, no `TravelView`, no `enterRunNode`, no mode change.
- The 9 deleted lines are all in-place rewrites: 1 × `element.append(...)` (poster inserted), 4 × early
  returns (identical reason + `played: false`, now via `settledWithoutSurface`), 1 × promise generic,
  1 × `overlay.dispose()` → `hold ? freeze : dispose`, 1 × `resolve({...})` → same result inside
  `HeldVideoCinematic`, 1 × a test import line extended.
- `src/styles/app.css`: additive only — zero deleted declarations.
- `src/cinematics/CinematicTriggers.ts`: **not in the diff**. All four production maps remain empty.
- `public/assets/cinematics/manifest.json`: **not in the diff**. Still only `qa-placeholder`.
- No file added outside `src/cinematics/` and this report. No `.webm`/`.mp4`/image added. `dist/` is ignored
  and untracked.
- A temporary Playwright driver used for browser QA (`tmp-cin1-browser-qa.mjs`) was deleted; `git status`
  confirms it is gone.

---

## 12. QA scenarios (DEV lab)

The existing lab at `?qa=1&cinematic=1` was **extended**, not replaced. Its 5 standalone-player scenarios
are untouched; a second section, *Runtime Cinematic Journey (CIN-1)*, adds 10 buttons — 15 total.

Every scenario builds its own in-memory registry (`JOURNEY_QA_MANIFEST`: `journey-qa-hold`,
`journey-qa-candidate-a`, `journey-qa-candidate-b`), its own player and its own session, then disposes them.
Nothing reads or writes campaign state, saves, or the shipped manifest. **The same functions back the
browser lab and the automated tests**, so what is asserted is what is clicked.

| # | Scenario ID | Proves |
|---|---|---|
| 1 | `journey-lifecycle` | `IDLE → PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED` |
| 2 | `journey-multi-choice` | 3 route choices, 1 disabled |
| 3 | `journey-continue` | Zero choices → single continuation affordance |
| 4 | `journey-secondary` | 5 secondary action callbacks |
| 5 | `journey-skip` | Skip reaches the same agency boundary |
| 6 | `journey-unavailable` | Missing media → neutral fallback → agency |
| 7 | `journey-reduced-motion` | Reduced motion → agency, no player mounted |
| 8 | `journey-dispose` | Dispose mid-playback, zero DOM residue |
| 9 | `journey-preload-dedupe` | 6 requests → 2 resources, 4 tracked IDs |
| 10 | `journey-preload-release` | 2 → release → 1 → clear → 0 |

Each run prints the summary, the full state trace, scenario details and a DOM-residue count
(`cinematic=0 journey=0 surface=0`).

The candidate descriptors point at `/assets/cinematics/qa/…webm` paths that **intentionally do not exist**:
no real cinematic is integrated in CIN-1, and the preloader must stay non-fatal without local media. No
placeholder binary was added.

---

## 13. Automated tests

`npx vitest run src/cinematics` → **6 files / 71 tests passed**.

| File | Tests |
|---|---|
| `CinematicPlayer.test.ts` | 15 (8 pre-existing, unmodified + 7 new hold tests) |
| `CinematicRegistry.test.ts` | 6 (4 pre-existing + 2 production-data guards) |
| `JourneySession.test.ts` | 16 |
| `JourneyOverlay.test.ts` | 11 |
| `CinematicPreloader.test.ts` | 10 |
| `JourneyQaScenarios.test.ts` | 13 |

Mandated invariants and where they are proven:

| Invariant | Test |
|---|---|
| Existing `play` semantics unchanged | 8 pre-existing tests pass unmodified |
| Journey transitions valid | `declares a transition table with no self loops and a terminal DISPOSED state` |
| No duplicate completion from invalid transitions | `refuses a concurrent presentation instead of completing twice`, `reports no decision when agency cannot be presented` |
| Ended playback stays mounted for freeze | `keeps an ended presentation mounted on its final frame`, `keeps the ended presentation mounted and disposes it when the freeze is released` |
| Releasing freeze disposes it | same test + `releases a held presentation exactly once` |
| Skip reaches agency | `reaches the same agency boundary after a skipped clip`, `holds a skipped presentation at the same boundary as an ended one`, QA scenario 5 |
| Unavailable reaches agency | `reaches agency on a neutral surface when the cinematic is unavailable`, QA scenario 6 |
| Reduced motion reaches agency | `reaches agency under reduced motion without mounting a player`, QA scenario 7 |
| Error reaches safe agency/fallback | `reaches a safe agency surface after a media error`, `degrades a frameless hold to the descriptor poster`, `…to the text fallback`, `holds a timed-out presentation…` |
| No gameplay state dependency | `never depends on gameplay state` (comment-stripped import scan + identifier scan over all 5 Journey sources) |
| Choice callback at most once | `commits a route at most once even if buttons are clicked again`, `commits at most once and latches every affordance` |
| Secondary callback as intended | `commits secondary actions with their generic ID`, QA scenario 4 |
| Overlay cannot double-commit | same two latch tests + `is inert after disposal and disposes only once` |
| Preloader deduplicates IDs | `deduplicates repeated preload requests`, QA scenario 9 |
| Preloader never starts playback | `never starts playback` (spy on `HTMLMediaElement.play`) |
| Preload failure non-fatal | `marks a media error non-fatal and releases the element`, `skips unknown IDs and placeholder-only descriptors without failing` |
| Preloader releases resources | `releases named candidates and clears every retained resource`, `stops retaining media once the bound is exceeded`, QA scenario 10 |
| Dispose releases listeners/media/preloads | `releases DOM, media and preloads when disposed mid-playback`, `is inert after disposal`, QA scenario 8 |
| Legacy standalone calls cleanup-safe | pre-existing abort/autoplay/error/stall tests assert `.cinematic-overlay` is removed |
| Production triggers unpopulated | `ships no production trigger mappings yet` |
| Production manifest unpopulated | `ships a production manifest that still holds only the QA placeholder` |

No test mutates generated game state or the production manifest on disk (both are read-only reads).

---

## 14. Manual browser QA actually performed

Real Chromium (Playwright 1.62 browser at
`…/ms-playwright/chromium-1234/chrome-win64/chrome.exe`) against `npm run dev` on
`http://localhost:5173/?qa=1&cinematic=1`. This was a scripted drive of a real browser, not a headless DOM.

**Observed — pass 1 (all 10 scenarios):**

- Lab loaded with **15** scenario buttons and both section headings.
- Scenarios 1–5: `frozenCinematicSurfaces=1`, `neutralSurfaces=0`, agency panel visible over the frozen
  surface, first enabled affordance focused, trace
  `IDLE → PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED`.
- Scenario 5 (`journey-skip`): skip clicked while the presentation was still playing →
  `skip → placeholder · FREEZE → AGENCY`, `reachedFreeze=true reachedAgency=true`.
- Scenario 6: `frozenCinematicSurfaces=0`, `neutralSurfaces=1`, `neutralFallback=unavailable`, agency reached.
- Scenario 7: `cinematicOverlaysDuringFreeze=0`, `neutralSurfaces=1`, agency reached.
- Scenario 8: `dispose pendant PLAYING → aborted`, trace `IDLE → PLAYING → DISPOSED`.
- Scenario 9: `videoElementsCreated=2 trackedIds=4 placeholderStatus=skipped unknownStatus=skipped`.
- Scenario 10: `afterPreload=2 afterRelease=1 afterClear=0 retained=0`.
- Double-clicking a committed choice through real browser events produced exactly one commit.
- Keyboard only: focus started on the first choice, `Tab` moved to the second, `Enter` committed
  `choice:qa-route-pass`.
- Final DOM residue `{cinematicOverlays:0, journeyOverlays:0, journeySurfaces:0}`; **0 console errors**.

**Bug found and fixed during browser QA:** the empty secondary bar still rendered its separator line,
because `.journey-overlay__secondary { display:flex }` overrides the `[hidden]` UA rule. Fixed with
`.journey-overlay__secondary[hidden] { display:none; }`.

**Observed — pass 2 (after the fix):**

- Empty secondary bar: `visible=false`, `boundingBox=null`. Populated bar: `visible=true`, 5 actions,
  `commit=secondary:CAMP`.
- OS-level reduced motion via Chromium emulation (`reducedMotion: 'reduce'`,
  `matchMedia('(prefers-reduced-motion: reduce)').matches === true`) with **no** explicit flag from the
  scenario: `cinematicOverlays=0`, `neutralSurfaces=1`, focus on the choice, `Enter` committed, full trace
  reached, residue `0`, 0 console errors.

Screenshots were written to `C:/Users/miche/AppData/Local/Temp/cin1-qa/` and deliberately **not** added to
the repository.

### Not observed — honest gap

**No real video clip exists in the repository**, so the actual browser proof that an `ended` `<video>` holds
its final frame on screen was **not** performed. `public/assets/cinematics/` contains only
`manifest.json` (QA placeholder) and two offline 1920×1080 source stills under `source/`. The freeze path
for a genuine clip is covered only by automated tests (`ended` + `loadeddata` → element stays mounted,
unhidden, frozen, fallback hidden). **Deferred to CIN-3 pilot media.** No placeholder binary was invented to
fake it.

---

## 15. Validation

| Gate | Result |
|---|---|
| `npm test` | **77 files / 1859 tests passed**, 0 failed (18.71 s) |
| `npx tsc --noEmit` | exit 0, no diagnostics |
| `npm run build` | success, `✓ built in 5.22s` |
| `git diff --check` | exit 0 |
| `npx vitest run src/cinematics` | **6 files / 71 tests passed** |

Baseline was 73 files / 1800 tests → **+4 files, +59 tests, 0 regressions**.

`npm run build` prints the pre-existing "chunks larger than 500 kB" warning for the `combat` chunk. It is
present at baseline and unrelated to CIN-1.

---

## 16. Confirmations

- **Campaign/gameplay truth untouched.** No change to `runSystem`, campaign topology, `RunNode` data,
  narrative content, dialogue semantics, combat, reputation, management or the save schema. The Journey
  runtime imports from `./` only, enforced by an automated test.
- **TravelView remains production/default.** `src/ui/TravelView.ts` is not in the diff. `GameApp.start()`
  still routes to `renderTitle()` (or the DEV cinematic QA lab when `?qa=1&cinematic=1`), and route choice
  still flows through `TravelView → chooseRunNode`. Nothing was replaced or bridged.
- **Production cinematic triggers remain unpopulated.** `VIDEO_CINEMATIC_TRIGGERS` still has four empty maps
  and is not in the diff; a test asserts it, including explicit `undefined` for `serpent_captain` and
  `lion_finale_judgement`. No `serpent_general_reveal`, `lion_judgement` or `lion_champion` mapping was
  added. `public/assets/cinematics/manifest.json` is unchanged and still holds only `qa-placeholder`.
- **No runtime AI, no external service, no API cost, no generation latency.** Only local descriptors and
  local media paths.
- **Audio unchanged.** `CinematicPlayer` still defaults to muted playback with the same
  opt-in unmute-on-click behaviour; no music engine, no global unmuted autoplay, no audio redesign.

---

## 17. Deferred items

| Item | Owner |
|---|---|
| Real final-frame browser proof with an actual clip | CIN-3 pilot media |
| Poster freeze verified in a browser (no local poster file exists; unit-tested only) | CIN-3 |
| Mapping real `RunNode` data into `JourneyChoicePresentation` | CIN-2 adapter |
| Replacing TravelView as the default narrative presentation | CIN-2 |
| Populating `VIDEO_CINEMATIC_TRIGGERS` and the production manifest | CIN-3 |
| Offline last-frame chaining, encoding, review pipeline | CIN-4 |
| Journey audio doctrine (ambience/SFX vs RPG music, HERO mix) | later |
| Camp/preparation, COMPANY/ROADMAP/SAVE/MENU wiring behind secondary action IDs | CIN-2+ |

---

## 18. Known limitations

1. **Freeze depends on browser last-frame behaviour.** Deliberate — no canvas extraction. If a browser ever
   blanked an ended `<video>`, the frame would be lost (the poster/fallback degradation only triggers when
   *no* frame was ever rendered). Unverified against real media; see §14.
2. **`renderedFrame` is event-driven.** A frame decoded without ever firing `loadeddata`/`playing`/
   `timeupdate`/`ended` would be treated as frameless and degrade to poster/fallback. Safe direction.
3. **Chaining overlaps surfaces briefly.** `FREEZE → PLAYING` mounts the new overlay before releasing the
   previous surface (avoiding a black flash), so two surfaces coexist for the duration of one clip.
   `z-index` and DOM order make the new one win; tested to settle back to exactly one.
4. **The QA lab ships in the production bundle**, like the pre-existing combat QA lab, gated by
   `import.meta.env.DEV` + `?qa=1&cinematic=1`. Not tree-shaken.
5. **`maxEntries` defaults to 3** and evicts by insertion order, not by likelihood of being needed. CIN-2
   may want a smarter policy once real candidate sets exist.
6. **`stateTrace` is capped at 64** entries; a very long journey loses its earliest states. QA/diagnostic
   only.
7. **Reduced motion produces no cinematic at all**, matching pre-existing behaviour: the player early-returns
   and the session substitutes a neutral surface. There is no still-image substitute yet.
8. **QA candidate descriptors reference non-existent paths on purpose**, so scenarios 9/10 exercise the
   failure path in a real browser rather than a successful preload.

---

## 19. Commit / push status

**Nothing committed. Nothing pushed.**

```
 46   1  src/cinematics/CinematicOverlay.ts
 97   0  src/cinematics/CinematicPlayer.test.ts
 29   7  src/cinematics/CinematicPlayer.ts
 19   1  src/cinematics/CinematicRegistry.test.ts
  6   0  src/cinematics/CinematicTypes.ts
 18   0  src/game/GameApp.ts
 30   0  src/styles/app.css
--------------------------------------------------
245   9  7 files changed

untracked (new):
  src/cinematics/JourneyTypes.ts             76 lines
  src/cinematics/JourneySession.ts          168 lines
  src/cinematics/JourneyOverlay.ts          143 lines
  src/cinematics/CinematicPreloader.ts      122 lines
  src/cinematics/JourneyQaScenarios.ts      340 lines
  src/cinematics/JourneySession.test.ts     224 lines
  src/cinematics/JourneyOverlay.test.ts     138 lines
  src/cinematics/CinematicPreloader.test.ts 123 lines
  src/cinematics/JourneyQaScenarios.test.ts 148 lines
  docs/reports/cin-1-cinematic-journey-runtime.md  (this report)
```

**STOP at CIN-1.** No work started on CIN-2 (TravelView Replacement Bridge), CIN-3 (Pilot Integration) or
CIN-4 (Offline Production Pipeline).

**READY_FOR_CIN_2: YES** — no blockers. The only carry-over is that final-frame video behaviour with real
media remains unproven until CIN-3 supplies a reviewed clip; it does not block building the CIN-2 adapter,
which consumes `JourneyAgencyPresentation` / `JourneyCommit` and is independent of media.
