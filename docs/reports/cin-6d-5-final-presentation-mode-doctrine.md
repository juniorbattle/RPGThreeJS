# CIN-6D.5 — Final presentation mode doctrine

## Status and intent

This document is the authoritative semantic doctrine for the next runtime and visual-production missions. It changes no runtime, media, game truth, route, save, combat or VFX behavior. The target alternates deliberately between an immersive cinematic world and a theatrical NarrativeStage.

## Intended player experience

Video means that the world is advancing. A hold means that the player is still inside the exact moment the video established. A travel still gives the player a current-world pause between important events. A static tableau turns character interpretation, disagreement and agency into an authored stage scene. None of these roles is a fallback quality tier.

## The four semantic modes

### CINEMATIC_VIDEO

Use for a meaningful arrival, encounter, character or enemy reveal, environmental discovery, material aftermath, boss entrance, ending or narratively significant departure. Motion or reveal must add meaning. The video owns environment, integrated cast, lighting, depth, camera and action. **VIDEO_OWNS_CAST**: do not mount duplicate canonical sprites during playback.

### CINEMATIC_HOLD

Use the exact approved endpoint of an immediately preceding cinematic for dialogue, Continue or choice in the same place, time, encounter, situation and activity. Release it as soon as any of those facts changes. A hold belongs to the preceding cinematic; it is not an independent travel asset. If dynamic speaker focus is required, transition to STATIC_TABLEAU.

### TRAVEL_STILL

Use an independent 16:9 establishing frame for travel, route pacing, post-event breathing room or a next-step Continue when no dramatic event is occurring. It belongs to the current transition and must look like a paused cinematic establishing shot. An optional living-still implementation may animate only ambient foliage, smoke, fire, cloth, water, weather, light or subtle camera drift.

### STATIC_TABLEAU

Use a premium cinematic environment plate plus separately staged canonical actors for ATEs, adviser exchanges, exposition, reactions, refuge conversations, smaller encounters and post-event discussion. The tableau owns cast. The active speaker receives full emphasis; listeners are subdued; actor scale and composition remain stable during handoff.

## Cast and background ownership

- Field tableaux use one Hero as the company representative, one or two relevant advisers, and the external situation or NPC when required.
- Audience and authority compositions may treat the Hero as optional when the established frame already communicates company presence.
- A video or hold with baked/integrated cast never receives duplicate sprite layers.
- A tableau background is character-free and is authored for the declared horizon, ground plane, perspective, contact area, light direction, face lanes and UI safe zones.
- ATE defaults to STATIC_TABLEAU. Travel and next-step boundaries default to TRAVEL_STILL.

## Transition grammar

Supported common transitions are:

- TRAVEL_STILL → CINEMATIC_VIDEO
- CINEMATIC_VIDEO → CINEMATIC_HOLD → dialogue, Continue or decision
- CINEMATIC_VIDEO → STATIC_TABLEAU when an extended exchange needs speaker focus
- STATIC_TABLEAU → decision → TRAVEL_STILL
- TRAVEL_STILL → STATIC_TABLEAU
- CINEMATIC_VIDEO → COMBAT
- COMBAT → STATIC_TABLEAU or TRAVEL_STILL
- ENDING_VIDEO → CINEMATIC_HOLD or STATIC_TABLEAU → epilogue

Additional legitimate transitions are STATIC_TABLEAU → CINEMATIC_VIDEO for a newly revealed event, CINEMATIC_HOLD → COMBAT while the exact confrontation remains current, and GAMEPLAY_UI → TRAVEL_STILL after refuge management.

## Invalid or suspicious transitions

Flag a hold carried into another location or activity, a travel still hosting an extended baked-cast dialogue, static sprites layered over video-owned cast, a full video replay used only to provide Continue, an old generic plate after a premium video, or any loading transition that returns to an already-ended scene.

## Campaign examples

- Opening company conversation: STATIC_TABLEAU.
- Camp departure: CINEMATIC_VIDEO, then an exact hold only for same-moment Continue.
- Alaric arrival: CINEMATIC_VIDEO → CINEMATIC_HOLD for dialogue and choice.
- Audience completion: release the hold → TRAVEL_STILL on the forest road.
- Forest danger: CINEMATIC_VIDEO → CINEMATIC_HOLD for pre-combat dialogue → COMBAT → STATIC_TABLEAU aftermath.
- Extended Cedric, Garen, Shadow Signs and final-refuge discussions transfer from their reveal video to STATIC_TABLEAU.
- ATE reflection remains STATIC_TABLEAU.
- First and second refuge departure masters become TRAVEL_STILL roles because no action or reveal justifies a full cinematic.

## Visual families and living stills

The 13 families in the companion plan bind video, hold, travel still and tableau background through the same location identity, palette, lighting, camera height, lens character, environment landmarks and time progression. Living stills remain an implementation option for 10 of 14 travel roles; their semantic mode remains TRAVEL_STILL.

## REQUIREMENTS FOR RUNTIME RESTRUCTURE

- Add an explicit semantic presentationMode field with the six audited values.
- Resolve presentation by player-facing beat identity instead of inferring role from media availability.
- Add a first-class TRAVEL_STILL surface for single-route and route-choice pacing boundaries.
- Allow TRAVEL_STILL assets to select STATIC_IMAGE or optional LIVING_STILL implementations without changing semantics.
- Reference or extract an approved exact final frame for every required CINEMATIC_HOLD.
- Enforce hold continuity and release on place, time, encounter, situation, or activity changes.
- Enforce VIDEO_OWNS_CAST and TABLEAU_OWNS_CAST so static sprites never duplicate integrated video characters.
- Separate STATIC_TABLEAU background identity from dialogue text, cast layers, and speaker emphasis.
- Attach visual-family metadata to video, hold, travel-still, and tableau-background roles.
- Make preload and fallback mode-aware, preserving agency and using the target mode rather than an arbitrary old scene.

## REQUIREMENTS FOR VISUAL PRODUCTION PIPELINE

- CINEMATIC_VIDEO: silent 1920x1080 H.264/yuv420p masters with meaningful motion or reveal and integrated cast.
- CINEMATIC_HOLD: lossless approved final-frame extraction or exact runtime frame reference with matching composition.
- TRAVEL_STILL: 16:9 cinematic establishing image, with an optional lightweight living-still derivative for approved ambient motion only.
- STATIC_TABLEAU_BACKGROUND: 16:9 character-free environment plate with ground plane, perspective, contact area and protected UI/face zones.
- All roles in one visual family must share palette, light, camera height, lens character, landmarks, atmosphere and time continuity.
- Tableau backgrounds must contain no baked party member or state-dependent actor.
- Every asset brief must record dialogue and choice safe zones plus speaker staging lanes.
- Lighting direction, temperature, horizon and scale must support canonical sprites without source alteration.
