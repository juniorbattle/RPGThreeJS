# Storylight Narrative Presentation Reference

## Doctrine

Storylight is a primary structural reference for RPGThreeJS non-combat presentation. It is not an art-direction replacement, a content source, or a runtime dependency. Its value is the continuity of an interactive visual story: the world remains visible while narration, character focus, agency, and transitions change around it.

The RPGThreeJS equivalent of a Storylight “page” is a **Narrative Tableau**.

A Narrative Tableau is the fundamental non-combat presentation unit. It may combine existing visual media, cast, environment, deterministic narrative beats, authoritative dialogue, authoritative agency, a transition, and an exit condition. Tableau metadata controls presentation only. DialogueSequence, RunSystem, GameState, combat results, cinematic registry entries, and existing callbacks remain authoritative.

## Why Storylight matters

The campaign should read as a continuous sequence of composed scenes rather than a succession of unrelated application screens. The principal visible mode change is:

`NARRATIVE STAGE ↔ COMBAT STAGE`

Travel, audiences, dialogue, recruitment, refuges, route decisions, moral choices, aftermaths, introductions, and endings remain inside NarrativeStage. Tactical combat is the principal structural break.

The intended rhythm is:

`NarrativeStage → NarrativeStage → NarrativeStage → CombatStage → NarrativeStage`

not:

`TravelView → cinematic → dialogue screen → Journey menu → combat → TravelView`

TravelView remains available as a debug, recovery, and catastrophic-presentation fallback. It is not deleted and production defaults remain unchanged until operator approval.

## What RPGThreeJS adapts

- Continuous visual context between narrative moments.
- Short, visually composed beats rather than one permanently heavy dialogue panel.
- Text integrated into the scene through speaker cards, cinematic subtitles, and held dialogue when necessary.
- Spatial interaction for routes, advisers, destinations, people, and objects when current media honestly supports the relationship.
- Small contextual controls instead of a separate Journey screen.
- Animated but restrained transitions between visual states.
- Content-first composition in which media remains dominant.
- Interaction embedded in the visible world.
- Deterministic scene sequencing with explicit input holds.
- Visual continuity across dialogue, agency, transition, and campaign-boundary reconstruction.

## What RPGThreeJS rejects

- A literal physical book or page-turn metaphor.
- A children’s-book or toy aesthetic.
- Educational word-by-word narration.
- Karaoke highlighting or bouncing words.
- Mandatory voice narration.
- Comic speech bubbles attached to faces.
- Modern SaaS panels, dashboards, neon landing-page effects, or generic website transitions.
- Runtime AI or generated narrative decisions.
- Any presentation state that duplicates route, choice, reputation, recruitment, combat, or finale truth.

## Narrative Tableau mapping

A tableau contains presentation references rather than copied game state:

- `media`: one optional intro phase and one optional reaction phase.
- `cast`: visually covered actors, event actors, player representatives, optional actors, and explicit justified-offscreen reasons.
- `anchors`: normalized safe regions and semantic placements.
- `beats`: deterministic references such as `VISUAL`, `SPEAKER_CARD`, `CINEMATIC_SUBTITLE`, `HELD_DIALOGUE`, `SPATIAL_CHOICE`, `ROUTE_CHOICE`, `TRANSITION`, and `COMBAT_HANDOFF`.
- `exit`: a presentation description of the authoritative completion boundary.
- `next`: always the next tableau resolved from campaign truth.

The initial mappings prove Camp Departure, Alaric’s Audience, the first forest threat, its post-combat aftermath, and the Valmir Fork. They do not manually duplicate the full campaign.

## MiniMax as the living visual page

Storylight does not replace RPGThreeJS video. Existing production MiniMax MP4s remain the premium living visual surface.

The runtime contract remains:

`LOCAL MP4 → hidden decoder/timing video → requestVideoFrameCallback → authoritative live canvas → NarrativeStage → dialogue/agency layers`

The same authoritative canvas becomes the held frame. A passive decoder-free copy may carry context into the next tableau. Missing or broken media degrades through a valid held/passive frame, poster or environment reference, painted scene, then lightweight text presentation. Campaign progression must never depend on media success, and black is not an accepted fallback.

No new MiniMax media is generated for CIN-6.7.

## Dialogue beat philosophy

A speaker is represented when narratively relevant, not necessarily in every frame. Focus can move through sequential beats instead of overcrowding one composition.

- **Speaker Card**: a restrained contextual card for one or two concise sentences.
- **Cinematic Subtitle**: a subtle safe-zone line for a short non-interactive statement.
- **Held Dialogue**: the reliable mode for long passages, complex exchanges, branching choices, and high-information material.
- **Spatial Choice**: presentation geometry linked to what the player is choosing; semantics still come exclusively from authoritative callbacks.

The Audience demonstrates Alaric, Alistair, Séraphine, and Maelor through sequential focus. Dialogue truth is not rewritten. The Lion Champion has no line in `lion_briefing`; therefore he is not a required speaker in this tableau. The CIN-6.6 structured audit’s speaker accounting omitted Séraphine and Maelor even though canonical steps 2 and 3 are theirs. CIN-6.7 derives required speakers from DialogueSequence and resolves that accounting mismatch with four required and four represented speakers.

## Spatial agency

Spatial placement is enhancement, never semantics. Route labels, availability, risk, reward, and commit callbacks come from resolved RunNodes. Keyboard focus order and non-spatial text preserve complete meaning.

Camp Departure uses the existing single successor as a small “Prochaine étape” cue. Valmir uses the authoritative option order for left and right safe regions that were explicitly authored into the accepted V3 media. If future media does not truthfully support geography, the UI must remain semantically correct and the limitation must be recorded as `MEDIA_REMASTER_NEEDED` rather than faked.

## Combat-only break and immediate return

Pre-combat flow is:

`NarrativeStage threat/reveal → concise authoritative dialogue → restrained transition → clean interactive layers → CombatStage`

Victory flow is:

`CombatStage → authoritative result/reward bridge → aftermath NarrativeStage → next resolved tableau`

The first forest round trip uses existing `forest_journey_tension`, `pre_opening_trail`, real `forest_ambush`/`wolf_pack` combat, and `post_opening_trail`. No TravelView, Journey menu, generic result hub, duplicated effect, duplicated reward, or invented continuation is inserted. Defeat continues to use the authoritative checkpoint rule.

## ThreeUI relationship

ThreeUI is a secondary implementation-pattern study, not the narrative model. Storylight supplies the structural reference; ThreeUI contributes limited ideas for compact layered controls, responsive composition, focus parity, restrained state transitions, and depth.

CIN-6.7 independently reimplements those concepts in the existing TypeScript/DOM/CSS architecture. React, ReactDOM, the ThreeUI package, ThreeUI media, fonts, and copied component code are not added. The exact upstream study and license assessment are recorded in `docs/reports/cin-6-7-threeui-pattern-study.md`.

## Accessibility and motion

NarrativeStage preserves keyboard operation, logical focus, a single modal interaction owner, ARIA labels, passive `aria-hidden` media, semantic route text, skip safety, and reduced-motion behavior. Spatial position is never the only carrier of meaning. Motion is limited to fades, short slides, atmospheric dissolves, depth shifts, and restrained wipes; there is no word-by-word animation.

## Ownership and persistence

Only authoritative game/run state is saved. Media time, canvas pixels, active CSS transitions, focus targets, and transient beat animation are reconstructed after load. Every stage owns and releases its video callbacks, RAF fallback, listeners, canvases, passive snapshots, overlays, and preload candidates. Combat begins only after NarrativeStage interaction layers are disposed.
