# CIN-6.7.1 Future Media Remaster Plan

## Policy

This milestone plans future media and generates none. It made zero MiniMax attempts, created no AI video, modified no production MP4, and made no Git LFS or storage-policy change. The machine-readable queue is `tools/cinematics/specs/narrative_media_remaster_queue.json`.

## Current production media audit

All 20 non-placeholder production cinematics are classified exactly once.

### Drop-in ready (12)

`alaric_audience_arrival`, `bois_clair_saved`, `bois_clair_sacrificed`, `camp_departure`, `first_refuge_arrival`, `first_refuge_departure`, `lion_champion_reveal`, `lion_trial_route_ending`, `second_refuge_departure`, `serpent_general_reveal`, `serpent_route_ending`, `valmir_route_fork`.

These assets can replace their still visual layer without changing dialogue or agency. Runtime cards and choices still obey the tableau safe zones.

## MEDIA TRANSITION

Future video remains a drop-in visual replacement behind the shared NarrativeStage transition shield. The current tableau stays available until the shield covers it. The next decoder and authoritative canvas prepare behind the shield, and the video surface is revealed only after its first successful canvas draw. Narrative-to-Narrative, Narrative-to-Combat, and Combat-to-Narrative handoffs use the same coverage and input-lock contract.

## BLACK-SCREEN FIX

The transition owns the entire decoder-start interval, so an unpainted video element or canvas cannot become the visible scene. Metadata, loaded data, `play()` resolution, and `playing` are retained as diagnostics but cannot dismiss the shield. A five-second startup timeout or media failure selects the prepared static form of the same tableau while the shield remains in place.

## VIDEO READINESS GATE

The authoritative readiness chain is `FIRST_VIDEO_FRAME -> FIRST_CANVAS_DRAW -> MEDIA_VISIBLE_READY -> TRANSITION_REVEAL`. `FIRST_CANVAS_DRAW` is recorded only after the decoded frame is successfully copied to the cinematic canvas. Every future remaster must work with this gate and provide usable first-frame composition and dialogue-safe space.

## DIALOGUE START GATE

The first live NarrativeCard, choice, subtitle, or agency control waits for the surface to become visible. A failed video reveals the ready static fallback before dialogue begins. Media startup cannot change or advance the canonical DialogueSequence.

## LOADING INDICATOR

A restrained three-rune indicator may appear inside the transition after 450 ms. It does not take focus or expose scene agency, and fast media cancels it before it becomes visible.

## STATIC CAST OWNERSHIP

Every replacement preserves the explicit `VIDEO_OWNS_CAST`, `STAGE_OWNS_CAST`, or `ENVIRONMENT_ONLY` contract. Healthy video owns its photographed cast and receives no automatic full-body overlay. A missing, failed, or timed-out video switches to the prepared stage-owned environment and canonical full-body cast for that same tableau.

## OPENING CLAN INTRO

The opening company scene intentionally remains a stage-owned six-member still tableau until a dedicated cinematic can cover the complete introduction without losing listeners or competing with the NarrativeCard. No video is required for operator acceptance of that scene.

## VISUAL PHASE GRANULARITY

The queue is based on 75 distinct visual compositions rather than the 247 per-step staging records. A remaster targets meaningful camera and cast compositions; it does not require one new shot for every dialogue step.

### Usable with offscreen staging (4)

`refugees_approach`, `ruins_approach_context`, `shadow_signs`, `witnesses_encounter`.

These remain usable when canonical speakers outside the shot use explicit compact contextual staging. Runtime cast injection is forbidden.

### Needs future remaster (4)

| Priority | Cinematic | Current gap | Future role |
|---|---|---|---|
| P0 | `forest_journey_tension` | Current shot concentrates on Séraphine while Kestrel and Alistair own earlier threat beats. | `THREAT` |
| P1 | `bois_clair_arrival` | The full multi-speaker exchange and both adviser positions are not visually covered. | `DIALOGUE_PHASE` |
| P1 | `lion_judgement` | Alaric and the Champion dominate without a readable receiving company/adviser pair. | `REACTION` |
| P2 | `final_refuge_dossier` | Marian speaks in the canonical dossier exchange without current visual coverage. | `DIALOGUE_PHASE` |

### Replace with family later (0)

No current production media requires wholesale family replacement.

## Queue contract

Each queued item records its cinematic and tableau IDs, dialogue ID, current composition problem, missing actor coverage, required media subjects, recommended shot count and camera angles, negative-space target, dialogue-safe region, choice-safe regions, future video role, transition/readiness compatibility, hold continuity, cleanup expectations, and priority.

The first remaster should be `forest_journey_tension`. Its two-shot target is a wide company/threat composition followed by a three-quarter reaction, with Kestrel, Alistair, Séraphine, and the unresolved forest threat readable. The upper/central threat area stays open and the compact dialogue lane remains at lower right.

Future production must use the fixed tableau as its shot specification. Required subjects and speaking subjects must be present at the correct phase; dialogue and choice safe zones must remain clear; first and last frames must support transition/hold continuity; and the video must function with zero runtime full-body overlays. DialogueSequence, DialogueStagingDirector semantics, effects, choices, RunSystem routes, saves, and combat rules cannot change to accommodate the media.

## Authorization boundary

The queue is ready for operator review. It does not authorize media generation. Video remaster work and CIN-6C remain pending explicit operator acceptance of the still-first NarrativeStage.
