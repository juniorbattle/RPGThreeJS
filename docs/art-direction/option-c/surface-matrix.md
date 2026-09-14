# Phase 1 — official presentation-surface matrix

| Surface | Runtime purpose and owner | Source assets today | Option C production target | Hard constraints | Primary regression gates |
|---|---|---|---|---|---|
| `TRAVEL_STILL` / Travel View | Narrative transition and route agency. `GameApp` + `TravelView` or `JourneyCampaignBoundary`; route meaning remains in `runSystem`/`RunNodePresentation`. | Three generic travel backdrops; 14 planned family-role stills; optional existing cinematic endpoint lineage. | Character-free 16:9 family plate with destination geography, one lower-third destination card, and only the authoritative route options. Atmosphere may move subtly but the surface must remain semantically still. | No controllable avatar, no free-movement cues, no baked arrows/text, no cast overlay unless a manifest explicitly requires integrated cast, no choice meaning in image. | Available node IDs unchanged; disabled routes remain disabled; same commit path; 1920×1080 and 1366×768 crop-safe; reduced motion uses the static source. |
| `STATIC_TABLEAU` / Dialogue | Primary spoken narrative. `NarrativeDialogueAdapter` -> `DialogueStagingDirector` -> `NarrativeStage`/`NarrativeSceneSurface`; `DialogueView` owns interaction. | 16 current Lion dialogue plates; 71 contexts and 78 staged visual segments; canonical 640×768 actors. | Character-free family plate with five possible lanes, 1–4 canonical actors, readable contact plane, theatrical depth, controlled listener dimming, dynamic facing, and clear text/choice zones. | Speaker visible before line; no dialogue on video/HOLD; max four actors; no baked party/state actors; no effect execution in presentation code. | 71/71 dialogues, 247/247 steps, 28/28 choices; zero hidden speaker, overlap, choice-geometry, effect-owner, route, or narrative-fact violations. |
| `CINEMATIC_VIDEO` | Short main-event spectacle. `CinematicRegistry` + `CinematicPlayer`, optionally orchestrated by Journey/NarrativeStage. | 31 protected MP4s; eight approved main-event video candidates; three GOLD references and approved pilot lineage. | 8–12 s continuous, silent, 1920×1080, 24 fps, one physical shot, stable cast, family-consistent world, HOLD-safe endpoint. | Main events only; no routine talking; no internal cut, cast reset, identity drift, mask loss, baked UI/text, or runtime AI dependency. | Technical media profile; zero cuts/identity breaks/cast additions/removals/world resets; nonblank endpoint; explicit human approval. |
| `CINEMATIC_HOLD` | Dialogue-free punctuation or transition. `NarrativeStage.enterCinematicHold()`. | Exact final frames or context still fallback; one current scenic conversion requirement plus legacy endpoint records. | Stable scenic image that inherits the immediately preceding family, camera, light, and time. Prefer character-free unless continuity demands an exact approved endpoint. | No dialogue, no choice, no theatrical runtime cast layer, no new event information. | `dialogueStepsOnHold=0`; `choiceStepsOnHold=0`; correct release rule; no surface flash; exact endpoint provenance. |
| `COMBAT` / Strategic View | Authoritative tactical play. `CombatBridge` -> isolated Three.js legacy runtime. | Three tactical Lion backgrounds, canonical unit sprites, perspective camera, grid/pathfinding/UI/VFX. | Premium isometric/perspective HD-2D arena with legible walkable plane, preserved tile projection, strong team rings, restrained foliage occlusion, and family continuity with the matching stage plate. | No changes to grid, placement, camera semantics, AP, initiative, target selection, resolution, UI center, protocol, or VFX. | Existing combat suites; deployment and pathfinding snapshots; all units remain selectable; UI clear zones; team/target readability; paired environment ID. |
| `COMBAT_STAGE` | Presentation-only attack/skill shot. `CombatStage` dedicated orthographic scene. | Three frontal stage backgrounds; 25 four-pose sets/100 PNGs; existing VFX anchors and aftermath. | Wide frontal family plate with two clean actor lanes, impact corridor, foreground depth, dramatic light, pose-scale consistency, and a compact action title. | No damage/effect resolution; same environment ID; same canonical identities; existing VFX anchors/presets; guaranteed tactical restore. | Enter/exit restore; pose/pivot/baseline checks; attacker/target never cropped at production viewports; VFX anchor parity; aftermath and reduced-graphics behavior. |

## Cross-surface family contract

Every visual family must ship as a small coherent set, never as unrelated one-off images:

| Family master output | Role derivative | Required relationship |
|---|---|---|
| Landmark/palette/light/ground bible | Travel still | destination geography and UI-safe negative space |
| Same master | Tableau plate | character-free actor lanes and contact plane |
| Same master | Tactical arena | current camera/grid projection and readable cells |
| Same master | Combat Stage plate | frontal axis, large silhouettes, impact corridor |
| Approved main-event keyframe, when applicable | Video/HOLD | stable cast and exact endpoint continuity |

The environment must be recognizable across roles through at least three invariant cues: one landmark, the dominant warm/cool relationship, and the ground/material language.

## Global technical frame

- Master aspect: 16:9.
- Production review sizes: 1920×1080 and 1366×768.
- Background delivery: character-free unless the role manifest explicitly says integrated cast.
- UI/text: never baked into art.
- Actor source: `public/assets/characters/pixel/full/*.png` by exact actor ID.
- Color: preserve faction colors; one dominant warm/cool relationship per family.
- Depth: foreground frame, playable/staging midground, atmospheric background.
- Pixel treatment: modern HD-2D with readable clusters and controlled texture; never nearest-neighbor enlargement of a low-resolution mockup and never a smooth painterly plate unrelated to actor rendering.
- Runtime AI: forbidden.
