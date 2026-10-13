# CIN-6.7 Narrative Stage

## Baseline and pre-flight

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Mission baseline: `537949d35d95217a1c1dd3a9f700633618db0249`
- Local HEAD at pre-flight: `537949d35d95217a1c1dd3a9f700633618db0249`
- `origin/main` at pre-flight: `537949d35d95217a1c1dd3a9f700633618db0249`
- Worktree at pre-flight: clean
- CIN-6.6 finalization: preserved
- Production default: TravelView
- DEV selectors: existing `?journey=cinematic` plus backward-compatible alias `?presentation=narrative`
- Runtime AI: none
- New MiniMax attempts: 0
- P1/P2 media: 0/0

The baseline full suite reproduced only the known concurrent VFX condition: 103 of 104 test files passed, 2,141 tests passed, and the 11 failures were all in `src/combat/vfx/CasterMotionBackCompat.test.ts` because the concurrently owned published registry is empty. No CIN blocker existed before implementation.

## Product result

When the DEV selector is active, normal campaign presentation remains inside one NarrativeStage. The intended visible loop is:

`NarrativeStage → NarrativeStage → CombatStage → NarrativeStage`

TravelView remains intact as production default, debug surface, recovery path, and catastrophic NarrativeStage fallback. It is not deleted or selected in the normal DEV NarrativeStage path.

## Architecture

```text
NarrativeStage
├── Media layer
│   ├── CinematicOverlay / hidden decoder
│   ├── authoritative live canvas
│   ├── held frame
│   ├── passive backdrop
│   └── painted fallback
├── NarrativeBeatDirector
├── Dialogue layer
│   ├── speaker card
│   ├── cinematic subtitle
│   ├── held dialogue
│   └── spatial choice
├── Agency layer
│   └── evolved JourneyOverlay
├── Transition layer
├── Utility layer
│   └── evolved Company / Save / Menu controls
└── focus and accessibility ownership
```

The implementation composes existing systems rather than creating parallel truth:

- `src/cinematics/NarrativeStage.ts` composes the existing JourneySession, CinematicPlayer, CinematicPreloader, and JourneyOverlay.
- `src/cinematics/NarrativeTableau.ts` defines reviewed presentation-only tableau, media, cast, anchor, beat, transition, and exit contracts.
- `src/cinematics/NarrativeBeatDirector.ts` sequences deterministic beats and blocks automatic advancement at input-owned beats.
- `src/cinematics/NarrativeDialogueAdapter.ts` maps authoritative DialogueStep IDs to visual modes and four reviewed display-only reductions.
- `src/cinematics/NarrativeUtilityDock.ts` separates secondary utilities from primary agency content.
- Existing CinematicOverlay, CinematicPlayer, JourneySession, JourneyCampaignBoundary, JourneyOverlay, DialogueView, and GameApp are evolved at their existing ownership seams.

## Lifecycle

### Narrative boundary

1. GameApp requests the current node and authoritative available nodes from RunSystem.
2. JourneyPresentationResolver selects reviewed local media when available.
3. JourneyCampaignBoundary selects a presentation-only NarrativeTableauSpec.
4. NarrativeStage mounts one media owner and plays the existing MP4.
5. CinematicOverlay draws every decoded frame into its one authoritative canvas.
6. Playback freezes to the same canvas, poster/fallback, or a carried passive surface.
7. JourneyRunNodeAdapter converts the already-resolved RunNodes to presentation objects.
8. Agency is mounted once and reports one semantic ID.
9. GameApp revalidates that ID through RouteCommitGuard and commits only through `commitRunNodeChoice`.
10. The stage, video callbacks, listeners, canvases, preload candidates, and utility owner are released.

### Cinematic dialogue

1. GameApp resolves the canonical DialogueSequence.
2. NarrativeStage starts the mapped existing media.
3. The media owner is passive rather than modal while DialogueView owns interaction.
4. DialogueView starts concurrently over the moving live canvas.
5. The adapter selects card/subtitle/held/spatial weight for each canonical step ID.
6. Existing DialogueView choice requirements, contest resolution, callbacks, and effects remain authoritative.
7. Media may settle to a held frame while dialogue continues.
8. A decoder-free backdrop may be copied for the next boundary, then the stage releases.

Exactly one modal interaction owner exists: cinematic playback when it is standalone, DialogueView during dialogue, JourneyOverlay during route agency, or CombatStage during combat.

## Tableau schema

`NarrativeTableauSpec` contains:

- a diagnostic tableau ID;
- a reusable Journey grammar;
- optional presentation/dialogue/combat lookup IDs;
- intro and optional reaction media references;
- presentation cast coverage and explicit justified-offscreen reasons;
- normalized semantic anchors;
- deterministic beat references;
- a presentation exit category;
- `RESOLVED_CAMPAIGN_TABLEAU` as the next target.

It contains no copied choice labels, route availability, route state, rewards, reputation rules, recruitment rules, combat outcome, or save state. Route labels and options continue to arrive from resolved RunNodes. Dialogue text continues to arrive from DialogueSequence.

`NarrativeMediaSpec` supports `INTRO_MEDIA` and optional `REACTION_MEDIA`. NarrativeStage can move from a held intro surface to a reaction media phase without adding a second simultaneous decoder.

## Beat director

Supported beat kinds are:

- `VISUAL`
- `SPEAKER_CARD`
- `CINEMATIC_SUBTITLE`
- `HELD_DIALOGUE`
- `SPATIAL_CHOICE`
- `ROUTE_CHOICE`
- `CONTEXT_ACTION`
- `TRANSITION`
- `COMBAT_HANDOFF`
- `WAIT_FOR_INPUT`

The director has deterministic `IDLE`, `RUNNING`, `WAITING`, `COMPLETE`, and `DISPOSED` states. Automatic completion cannot cross speaker, dialogue, choice, route, context-action, combat-handoff, or explicit wait beats. Skip crosses only presentation-safe beats and stops at the next input or canonical dialogue boundary.

## Media ownership

The CIN-6.5.1 pipeline remains authoritative:

`local MP4 → hidden decoder/timing/audio video → requestVideoFrameCallback → live canvas → held canvas`

CIN-6.7 adds a passive playback mode for live dialogue. It removes media-level modal ownership without changing the decoder, frame callback, canvas, mute, or presentation-only skip path. The live canvas remains visible; the video remains hidden and decoder-only after the first valid draw.

Fallback order is:

1. valid held or passive frame;
2. descriptor poster or current environment reference;
3. painted narrative surface;
4. lightweight semantic text presentation.

Cinematic errors, autoplay rejection, timeout, reduced motion, or a missing mapping cannot block progression. Disposal cancels requestVideoFrameCallback/RAF, removes listeners, unloads video sources, zeros held and passive canvas backing memory, releases preloads, and removes detached stage layers.

## Dialogue modes

### Speaker card

A compact contextual card displays speaker name, optional role/tag, and the canonical or reviewed display line. It shifts by speaker side/anchor and uses a short fade/seven-pixel settle. It does not cover the full lower screen and is not a comic speech bubble.

### Cinematic subtitle

A narrow low-weight strip presents short non-branching statements. It retains keyboard continuation and visible speaker semantics. It is not used for long strategy passages or choices.

### Held dialogue

Long or information-dense passages retain the established held presentation. The authoritative canvas remains behind the interaction, with no black swap or decoder leak.

### Spatial choice

Exactly two authoritative choices may occupy left and right safe regions. Their semantic IDs, availability, requirements, effects, and labels remain the existing DialogueChoice or RunNode values. Geography is presentation only.

DialogueView now latches a choice while its existing callback runs and applies each step effect at most once per play session. This prevents rapid duplicate clicks without changing any canonical effect.

## Dialogue-to-cast contract

The hard validator derives required speakers directly from every DialogueStep actor ID, then accepts only actors covered by current media, a current portrait beat, or an explicit justified-offscreen entry.

For `lion_briefing`:

- Required speakers: 4 (`alaric`, `alistair`, `sage_seraphine`, `maelor`)
- Visually covered: 4
- Justified offscreen: 0
- Unresolved: 0
- Result: `PASS`

The CIN-6.6 structured audit listed only Alaric and Alistair under `speakers`/`requiredSpeakers` while canonical steps 2 and 3 are spoken by Séraphine and Maelor. Its required cast and accepted V3 media already included both advisers, so this was an accounting mismatch rather than a remaining media omission. CIN-6.7 derives all four speakers from dialogue truth and validates all four as represented.

The Lion Champion does not speak in `lion_briefing`. He is not silently counted as a required speaker. His later canonical lines remain in `pre_lion_chief`, outside the Audience prototype.

## Two-adviser rule

The Audience and Valmir tableaux retain Séraphine and Maelor as the two primary player representatives. Audience beat sequencing gives Séraphine’s compassionate/mystical reading and Maelor’s pragmatic reading separate visual weight. The Valmir frame places Séraphine toward the left route and Maelor toward the right while authoritative option semantics remain in RunSystem. Scenes that do not require both advisers do not fabricate them.

## Presentation-only text reduction

Canonical source text, effects, and links are unchanged. Four exact adapter cases demonstrate reduced display weight:

| Dialogue | Step | Class | Display treatment |
| --- | --- | --- | --- |
| `village_choice` | `1a` | `VISUAL_REPLACEABLE` | Condenses the divided-place description while retaining captives north and reserves/wells south. |
| `village_choice` | `2a` | `VISUAL_REPLACEABLE` | Condenses repeated staging while retaining old bridge, low gate, and inability to hold both. |
| `final_refuge` | `1` | `REDUNDANT_EXPOSITION` | Removes repeated approach prose while retaining camp, risk, Sceau, and Alaric facts. |
| `final_refuge` | `3` | `REDUNDANT_EXPOSITION` | Compresses the dossier recap while retaining the complete evidence categories and reputation limit. |

Each record declares its classification, rationale, `reviewed: true`, and `sourceTextPreserved: true`. No source DialogueSequence is modified. Valmir V3 genuinely supports its left/right geography; the older Bois-Clair composition still limits spatial certainty, so the text adapter remains semantic and `BOIS_CLAIR_MEDIA_REMASTER_NEEDED` remains a future limitation.

## Prototype mappings

| Tableau | Authoritative source | Existing media | Presentation proof |
| --- | --- | --- | --- |
| Camp Departure | current `lion-camp`, one RunSystem successor | `camp_departure` V3 | Moving scene, held canvas, small lower-right “Prochaine étape”, direct authoritative commit. |
| Alaric Audience | `lion_briefing` DialogueSequence | `alaric_audience_arrival` V3 | Moving canvas with speaker card, held information beat, four-speaker sequence, two-adviser agency, next boundary. |
| Forest Threat | `forest_ambush` or `wolf_pack`, `pre_opening_trail` | `forest_journey_tension` | Threat media and concise canonical dialogue in one stage, then clean CombatStage. |
| Forest Aftermath | authoritative victory result, `post_opening_trail` | existing forest painted environment | Immediate post-combat speaker sequence and next resolved boundary. |
| Valmir Fork | current `lion-valmir-road` successors | `valmir_route_fork` V3 | Left/right controls over reviewed safe regions; route commit remains exactly once. |

`VALMIR_FORK_MEDIA_REMASTER_NEEDED: NO` for the accepted V3 composition.

`MEDIA_REMASTER_NEEDED`: a dedicated first-forest aftermath clip would improve continuity, and the existing threat clip only depicts Séraphine while Kestrel and Alistair speak. CIN-6.7 uses canonical portraits and the painted forest environment rather than generating or misleadingly repurposing media.

## Journey replacement

JourneySession, JourneyOverlay, JourneyRunNodeAdapter, and JourneyCampaignBoundary remain reusable implementation primitives, but NarrativeStage is now the player-facing surface under the DEV selector. The route boundary body mode is `NARRATIVE`, not a visible Journey screen.

- Single route: compact continuation cue.
- Two-route fork: geographically aligned controls.
- Utility actions: separate compact dock.
- Route callback: unchanged and revalidated against RunSystem.
- Secondary action return: the held canvas is copied before Company/Save leaves the boundary, then reconstructed as a decoder-free passive backdrop with the same authoritative options.

## Combat handoff and post-combat return

The first real campaign combat path is:

`Audience tableau → next route cue → forest threat tableau + pre_opening_trail → CombatStage → result → post_opening_trail aftermath tableau → next route cue`

Before CombatBridge mounts, GameApp disposes JourneyCampaignBoundary and any active NarrativeStage again inside the covered transition task. Therefore no narrative card, route control, utility dock, held modal, video, or canvas remains over the combat iframe.

CombatBridge and combat rules are unchanged. The existing result path remains authoritative for unit progress, rewards, temporary loot, reputation, flags, node resolution, boss state, and defeat checkpoint restoration. The result is consumed once. Existing post-combat dialogue is adapted; no reward, effect, sequence completion, or result bridge is duplicated.

On normal victory, CombatBridge removes its iframe before the aftermath stage mounts. TravelView and a Journey menu are not called between combat and aftermath. On defeat, the existing auto-save/checkpoint restoration remains authoritative before NarrativeStage reconstructs the current boundary.

## TravelView fallback

TravelView remains production default and is still reached when:

- no DEV NarrativeStage selector is present;
- `?journey=travel` or `?presentation=travel` is explicit;
- the build is not DEV;
- JourneyCampaignBoundary/NarrativeStage fails catastrophically and the session fallback latch activates.

Media failure alone does not trigger TravelView because the NarrativeStage fallback surface remains functional.

## Utility dock

Company, Save, and Menu remain the existing secondary actions. NarrativeStage reparents their existing buttons into a separate compact utility layer; it does not enlarge primary route cards or duplicate callbacks. Company reconstructs the same unchanged boundary after management. Save writes only authoritative game state. Menu returns through the existing owner.

The dock uses no animation loop. It has keyboard focus parity, a labelled group, restrained transparency, and a static reduced-motion/narrow-screen layout.

## Save/load

The save schema is unchanged. NarrativeStage does not serialize active beat index, media time, canvas pixels, passive snapshots, CSS transition progress, or focus. Continue/load uses existing GameState and RunSystem resolution, then reconstructs the appropriate current tableau. A committed route is not replayed merely to rebuild presentation.

## Skip

Skip remains presentation-only. CinematicPlayer resolves a safe skipped media result and freezes the current canvas. NarrativeBeatDirector refuses to cross speaker, held-dialogue, choice, route, context-action, combat-handoff, or explicit input beats. Skip cannot commit a route, select a choice, apply an effect, recruit, start/resolve combat, grant a reward, or complete dialogue truth.

## Accessibility

- Keyboard buttons and authoritative text labels remain available.
- Spatial position is never the sole semantic carrier.
- The live cinematic is passive while DialogueView owns `aria-modal`.
- Frozen/passive media is inert and `aria-hidden`.
- Route agency has one modal owner and logical DOM option order.
- The utility dock is a labelled group.
- Focus-visible styles remain.
- Reduced motion disables video playback through existing policy and removes NarrativeStage transition/card animation.
- Dialogue text appears immediately under reduced motion.

## Performance and cleanup

- One visible authoritative cinematic canvas.
- One decoder for active media; no duplicate playback loop.
- Optional reaction media replaces rather than overlaps the intro owner.
- requestVideoFrameCallback preferred; one RAF fallback only.
- Frame callbacks, RAF, media listeners, keyboard listeners, observers, preloads, video sources, and DOM owners are released.
- Held and passive canvas backing dimensions are reset to zero on release.
- Utility motion is CSS-only and no high-frequency layout animation was added.
- No persistent hidden NarrativeStage survives a boundary, utility, dialogue, or combat handoff.

## ThreeUI relationship

ThreeUI upstream `68802d5428071ada5c20db8094b1649e6bb770ed` was inspected. CIN-6.7 independently reimplements only compact layered dock, state-attribute, responsive composition, focus parity, restrained card transition, and cleanup concepts. React, ReactDOM, ThreeUI code, assets, fonts, and shader loops are not added. Full attribution and license analysis are in `docs/reports/cin-6-7-threeui-pattern-study.md`.

## Validation

- Focused NarrativeStage/cinematic/Journey/dialogue/combat-handoff suite: PASS; 18 files, 172 tests.
- Full suite: `CONCURRENT_VFX_EXCEPTION`; 108 of 109 files passed, 2,188 tests passed, and exactly the existing 11 `CasterMotionBackCompat` tests failed because the concurrently owned published registry is empty. No new failure occurred.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS; 119 modules transformed. The existing chunk-size advisory remains non-blocking.
- `git diff --check`: PASS.
- VFX/media diff audit: PASS; no `src/combat/vfx`, `src/combat/stage`, `src/combat/CombatBridge.ts`, or `public/assets/cinematics` file is changed by CIN-6.7.
- Real Chromium automation: PASS at 1920×1080 and 1366×768 through `tools/cinematics/run_cin67_browser_qa.mjs`.
- Local ignored evidence: `tmp/cinematics/cin67/browser-qa/`.
- Motion checks: Camp Departure, Audience, and Valmir each advanced by approximately 0.91 seconds under `requestVideoFrameCallback`, with one authoritative canvas per active media surface.
- Screenshot/state checks: Audience moving speaker UI, Audience held spatial choice, Camp single route, Valmir fork, clean CombatStage, and immediate post-combat NarrativeStage were captured at both resolutions.
- Responsive checks: no document overflow and no hidden essential enabled control at either resolution.
- Isolation checks: Audience held canvas with one modal owner; CombatStage with zero NarrativeStage/cinematic/dialogue/Journey overlay; aftermath with zero TravelView/Journey/combat intermediary and one NarrativeStage.
- Browser errors: zero console errors, zero page errors, and zero failed requests in both runs.

Automation establishes technical browser evidence. Media dominance, dialogue rhythm, and overall immersion remain operator acceptance gates.

## Human QA matrix

The required operator-review captures are:

1. Audience moving media with lightweight speaker UI.
2. Audience held/interactive state.
3. Camp Departure single-route tableau.
4. Valmir Fork spatial choices.
5. CombatStage with zero NarrativeStage overlay.
6. Immediate post-combat NarrativeStage.

Audience, Camp Departure, and Valmir Fork also require real-motion review. Audience, single route, fork, and post-combat require 1920×1080 and 1366×768 review for overflow, essential controls, safe zones, and actor occlusion. Each image must first read as a cinematic scene rather than a UI screen with video behind it.

## Limitations and gate

- Production presentation remains unchanged pending operator acceptance.
- Dedicated first-forest aftermath media does not exist; the painted forest fallback is used.
- Bois-Clair’s older media is not declared sufficient proof of objective geography.
- Human immersion, rhythm, media dominance, and motion remain operator gates.
- CIN-6C is not authorized or started.

`READY_FOR_CIN_6C: NO — PENDING OPERATOR NARRATIVE STAGE ACCEPTANCE`
