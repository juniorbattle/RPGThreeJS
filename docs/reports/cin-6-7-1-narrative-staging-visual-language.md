# CIN-6.7.1 Narrative Staging and Visual Language

## Baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Baseline HEAD and `origin/main`: `e57d311de299c523b69f257bf232b31a6fa85f9f`
- Pre-flight worktree: expected uncommitted CIN-6.7.1 implementation preserved and finalized in place
- Authoritative review URL: `http://127.0.0.1:5173/?presentation=narrative&media=stills`
- Video compatibility URL: `http://127.0.0.1:5173/?presentation=narrative&media=video`
- Legacy `?journey=cinematic`: preserved
- New MiniMax attempts: 0
- Production MP4 changes: 0
- Game, dialogue, RunSystem, save, combat, and VFX truth changes: 0

## Reference review

All three attached Storylight-inspired boards were reviewed as composition references. The implementation follows their scene-first hierarchy, compact dialogue cards, stable negative space, two-adviser agency, spatial route choices, tactical combat as the major visual break, and immediate return to narrative staging. Existing RPGThreeJS character art, environments, type, controls, and palette remain authoritative.

The supplied defect set was treated as six regression cases:

| Case | Defect | Result |
|---|---|---|
| A | Alistair with compact right card | Preserved as a valid pattern through explicit left/right profiles. |
| B | Séraphine with giant full-width panel | Removed from normal NarrativeStage; browser QA measured 28–34% viewport card widths. |
| C | Alaric with arbitrary centred panel | Removed; centre is used only by declared agency profiles. |
| D | Alaric with compact right card | Preserved as a diplomatic speaker-card profile. |
| E | Séraphine video competing with Kestrel/Alistair sprites | Resolved through explicit offscreen contextual strategy; moving video receives no runtime cast. |
| F | Alistair speaking while Séraphine dominates the video | Classified for remaster and staged contextually without a sprite patch. |

## Animated-book architecture

NarrativeStage now treats a fixed illustrated tableau as the authoring truth:

```text
canonical game state
  -> tableau family and declared visual phase
  -> environment + static cast + restrained atmosphere
  -> compact dialogue or spatial agency layer
  -> transition or clean CombatStage handoff
```

`NarrativeSceneSurface` composes existing scene art and canonical actor assets into environment, cast, atmosphere, and speaker-focus layers. `DialogueStagingDirector` resolves every canonical step to a declared visual state, media subjects, static cast, choice/effect ownership, layout profile, anchor, speaker strategy, and presentation-only text segments. `NarrativePresentationPolicy` selects still or video media without changing dialogue, agency, or campaign flow.

The visible campaign rhythm is:

`NarrativeStage -> NarrativeStage -> CombatStage -> NarrativeStage`

TravelView remains available for classic/debug/recovery paths and does not appear during the normal narrative campaign path.

## Visual language lock

- Normal dialogue uses compact 28–36vw speaker cards.
- Cards occupy explicit left or right safe lanes; centre is reserved for authored dual-choice agency.
- Choices use two lower spatial regions and keep canonical labels, requirements, outcomes, effects, and callbacks.
- High-stakes diplomatic scenes preserve Séraphine and Maelor when canonical content makes them relevant.
- Static cast is capped, positioned intentionally, and reuses existing character art.
- Speaker changes alter emphasis inside a declared phase; layout does not drift because text length changes.
- Long canonical text is paginated inside its original step. The step, effect, and choice owner remain singular.
- Reduced-motion disables tableau breathing and atmospheric motion while retaining the complete scene and interaction.
- Utility controls remain a small separate layer and preserve the current tableau.

## Media contract

Still mode creates the composed static scene and never mounts video or cinematic canvas surfaces. Video mode replaces only the visual layer. Moving and held video never receive automatic full-body portraits or the static cast layer. When current media lacks the canonical speaker, the director uses `OFFSCREEN_CONTEXTUAL` with a recorded reason and remaster flag.

Future media must accept the same metadata used by the still tableau: required subjects, speaking subject, camera intent, actor regions, dialogue and choice safe zones, negative-space target, phase boundaries, and first/last-frame continuity. A media replacement cannot require changes to dialogue, choices, effects, routes, or saves.

## MEDIA TRANSITION

`NarrativeSurfaceReadiness` now provides one presentation gate for `STILL`, `VIDEO`, `HELD_VIDEO`, `PASSIVE_BACKDROP`, and `FALLBACK`. NarrativeStage enters `PREPARING`, locks dialogue and agency, mounts a persistent campaign-styled shield, prepares the visual behind it, marks the surface `READY`, reveals it, and only then enters `VISIBLE`. The prior tableau stays mounted for shared Journey or Combat handoffs until the global transition covers it; stale input is inert before teardown.

## BLACK-SCREEN FIX

The decoder's black startup surface is never exposed as the new tableau. NarrativeStage builds its shield before the stage is mounted. In video mode the shield remains above the decoder and authoritative canvas until a successful canvas draw. In still mode it remains until the environment and canonical cast are renderable. Real-time Chromium sampling at 16 ms found zero uncovered preparation samples and zero uncovered Narrative-to-Combat or Combat-to-Narrative samples.

## VIDEO READINESS GATE

The video lifecycle records element creation, metadata, loaded data, `play()` resolution, `playing`, the first video-frame callback, the first successful canvas draw, media readiness, reveal, and first dialogue activation. Metadata, loaded data, playback promises, and `playing` are diagnostic events only. `FIRST_CANVAS_DRAW` is the sole normal video readiness signal because it is emitted only after `drawImage` succeeds on the authoritative canvas.

## DIALOGUE START GATE

`presentCinematicDialogue` waits for `awaitMediaVisibleReady()` before opening the live NarrativeCard. Dialogue and agency layers stay inert through preparation and reveal. Stage-level guards reject stale agency and ignore premature step activation. Browser evidence records first dialogue activation after both the first successful canvas draw and transition reveal; no active dialogue or enabled choice was sampled during loading.

## LOADING INDICATOR

A restrained three-rune indicator appears inside the transition shield after 450 ms. The timer is cancelled as soon as a surface becomes ready, so fast local clips do not flash it. The indicator is non-modal, takes no focus, inherits the stage's `aria-busy` state, and respects reduced-motion styling.

## STATIC CAST OWNERSHIP

Every staged step resolves `VIDEO_OWNS_CAST`, `STAGE_OWNS_CAST`, or `ENVIRONMENT_ONLY`. Healthy moving and held video own their visible cast and receive no automatic full-body sprite overlay. Still scenes and failed/unavailable video use stage-owned canonical full-body assets. A startup timeout after 5 seconds, media error, or skip during preparation keeps the shield covered, selects the prepared static version of the same tableau, reveals it, and only then enables dialogue.

## OPENING CLAN INTRO

`acte_ouverture` has no required video and now renders a stable six-member tableau: Séraphine, Maelor, Alistair, Marian, Kestrel, and Elara. The active speaker receives a restrained focus lift while five listeners remain present. Browser and DOM-identity tests confirm the same actor elements survive speaker changes instead of rebuilding the scene.

## VISUAL PHASE GRANULARITY

The audit distinguishes 247 per-step staging records from 75 distinct visual compositions. Generic dialogue now shares one stable composition across its exchange; card lane and speaker emphasis may change without creating a new visual phase. Bespoke phases remain only where camera, group, authority, agency, or scene geography meaningfully changes.

## Real campaign QA

The ignored evidence package is under `tmp/cinematics/cin671/browser-qa/`. The harness executed production campaign controllers at both 1920x1080 and 1366x768 and captured:

- all five Audience states: Alaric, Alistair, Séraphine, Maelor, and agency;
- Cedric multi-speaker recruitment and refugee choices;
- camp single-route and Valmir two-route geography;
- forest pre-combat, isolated tactical combat, and immediate aftermath;
- Serpent scout and village-fear contextual ATEs.

Both viewports passed with no page or console errors, no overflow, no inaccessible choices, no automatic portraits, and no duplicate modal owners. Combat contained one combat frame and zero NarrativeStage, dialogue, or Journey overlays. The aftermath returned directly to NarrativeStage with no TravelView.

The video regression evidence remains under `tmp/cinematics/cin67/browser-qa/`. Both viewports passed moving-frame, held-frame, route, combat, aftermath, and Valmir checks. The timestamped audience and forest timelines prove `FIRST_CANVAS_DRAW < TRANSITION_REVEAL < FIRST_DIALOGUE_ACTIVATION`. Audience moving and held surfaces and the forest mismatch each reported zero static-cast and zero automatic-portrait overlays.

The final audience startup timestamps below are run-local `performance.now()` milliseconds recorded by real Chrome:

| Viewport | Metadata | First video frame | First canvas draw / media visible | Transition reveal | First dialogue |
|---|---:|---:|---:|---:|---:|
| 1920×1080 | 10517.9 | 10548.2 | 10601.5 | 10887.1 | 10887.6 |
| 1366×768 | 8307.4 | 8343.8 | 8383.3 | 8674.1 | 8674.5 |

The later forest cinematic repeated the same ordering at both viewports. Across both scenes and both sizes, 16 ms sampling found zero black-exposure, missing-stage, dialogue-during-loading, or choice-during-loading samples. Narrative-to-Combat and Combat-to-Narrative sampling also found zero uncovered or stale-interaction samples.

## Validation

- Narrative staging validator: PASS — 71/71 reachable dialogues, 247/247 dialogue steps, 247 staging records, 75 distinct visual compositions, 9 used dialogue layout profiles, and 0 unmapped items.
- Focused Vitest suite: PASS — 17 files and 134 tests.
- Full Vitest suite: CONCURRENT_VFX_EXCEPTION — 114/115 files and 2,209/2,220 tests passed. The 11 failures are confined to the pre-existing concurrent `CasterMotionBackCompat.test.ts` expectation for 33 generated preset actions while the untouched generated registry is empty.
- TypeScript `--noEmit`: PASS.
- Production build: PASS, with the existing Vite chunk-size advisory only.
- Static real-campaign browser QA: PASS at 1920x1080 and 1366x768, with 30 captured frames.
- Video compatibility browser QA: PASS at 1920x1080 and 1366x768.
- `git diff --check`: PASS.
- Protected-boundary audit: PASS — no MP4, combat VFX, canonical content, RunSystem, or Lion narrative truth files changed.

## Review boundary

The implementation is ready for operator review in still-first mode. Future video generation and CIN-6C remain pending operator acceptance. No commit or push was made.
