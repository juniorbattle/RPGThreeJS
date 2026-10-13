# CIN-6D.6 Runtime Presentation Restructure

## Baseline

`c2d3322e2e4217daa204e4b33c6f8381c1d42592`

## Architecture before and after

Previously, NarrativeStage inferred its surface from the presence of a cinematic ID, a static authoring selector, or an existing Journey backdrop. The runtime now resolves authoritative content identity through one pure lookup into an explicit player-facing presentation beat. The semantic mode is separate from JourneySession lifecycle state and selects one primary surface.

Authoritative game truth remains in RunSystem and the existing dialogue, combat, route, save and finale systems. The new registry only describes presentation.

## Mode type

`NarrativePresentationMode` contains exactly CINEMATIC_VIDEO, CINEMATIC_HOLD, TRAVEL_STILL and STATIC_TABLEAU. `PlayerFacingSurfaceMode` adds COMBAT and GAMEPLAY_UI without treating them as narrative modes.

## Resolver

`NarrativePresentationResolver` is the single pure resolution path. It accepts already-resolved beat, dialogue, cinematic, edge, node/content or combat identity and returns immutable metadata generated from the committed CIN-6D.5 audit. Production code does not load planning JSON.

## Renderer ownership

CINEMATIC_VIDEO and CINEMATIC_HOLD have media-owned cast and empty static cast. TRAVEL_STILL owns the complete image frame and never mounts theatrical sprites. STATIC_TABLEAU retains independent canonical sprites. COMBAT and GAMEPLAY_UI release NarrativeStage ownership.

## Video behavior

CinematicPlayer remains the reviewed local-video player. Video playback resolves through explicit media beats, keeps skip/reduced-motion/failure behavior, and records presentation-only completion so the same Journey boundary does not replay a resolved presentation.

## Hold behavior

CINEMATIC_HOLD is promoted from the relevant frozen endpoint when available. Missing decoder/frame state reconstructs through the current visual-family static fallback without replaying an event. Context changes release the hold before Travel Still, tableau or combat. Current route-ending and epilogue identities do not match, so epilogue uses the explicit safe static fallback.

## Travel Still behavior

`TravelStillSurface` is a first-class, full-frame, 16:9-safe image surface with no dialogue, actor labels or sprite cast. Missing future assets use deterministic family/tableau fallbacks and expose a non-visual DEV data marker. A typed LIVING_STILL source degrades to its static fallback under reduced motion and does not invoke CinematicPlayer.

## Tableau behavior

STATIC_TABLEAU retains the existing large canonical full sprites, intentional bottom crop, speaker focus, listener dimming and choice geometry. Reveal cinematics release before extended dialogue tableaux mount.

## Asset-role separation

Every beat has an explicit role: VIDEO_MASTER, HOLD_STILL, TRAVEL_STILL, TABLEAU_BACKGROUND, COMBAT_SURFACE or GAMEPLAY_SURFACE. `tableauBackgroundId` is independent from dialogue identity, enabling CIN-6E replacement by metadata.

## Visual family integration

All 13 committed families are typed and attached to all 144 beats. They influence only source/fallback selection and diagnostics.

## Preload strategy

Journey preloads only currently authoritative successor candidates. Video references continue through CinematicPreloader; image references are deduplicated separately and released with NarrativeStage.

## Fallback strategy

Each mode preserves its semantics: video falls back to its context, hold never replays a resolved event, Travel Still falls back to its current family image, and tableau falls back to the existing dialogue background. No fallback changes game truth.

## Save and resume

No save field was added. Presentation is reconstructed from the authoritative current node/content/dialogue identities. Frames, decoder position, DOM, opacity and semantic mode are not persisted.

## Browser QA

Status: PASS.

- Required A–P flows: 16/16 PASS
- 1920×1080: PASS
- 1366×768: PASS
- Choice maximum horizontal delta: 0 px
- TravelView flashes: 0
- Black flashes: 0

## Regression results

- Runtime mapping: 144/144 match
- Choice ownership: 28/28 exact
- ATE ownership: 10/10 STATIC_TABLEAU
- Production media hashes: 31/31 unchanged

## Protected systems

RunSystem, save schema, dialogue truth, choice effects, route consequences, combat runtime and VFX remain unchanged. Production media remains untouched. TravelView remains production default.

## Remaining pending media work

No media was generated. Current runtime slots use the CIN-6D.5 temporary fallbacks until the visual pipeline supplies reviewed assets.

## READY FOR VISUAL PIPELINE

- CINEMATIC_VIDEO slots: 29
- HOLD_STILL assets missing: 25
- TRAVEL_STILL assets missing: 14
- TABLEAU_BACKGROUND assets requiring rework: 47
- TABLEAU_BACKGROUND assets reusable: 2
- LIVING_STILL candidates: 10
- Existing videos semantically reclassified: 2
