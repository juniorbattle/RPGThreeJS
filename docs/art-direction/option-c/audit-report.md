# Phase 1 — runtime art-direction audit

## Executive finding

The repository is structurally ready for an Option C refactor. It is not visually empty: it already has a coherent dark navy/gold UI, painted environment slots, canonical full-body character art, a static-tableau staging director, a Three.js tactical battlefield, and a separate frontal Combat Stage. The largest problem is not missing architecture; it is uneven art-family integration and incomplete production coverage.

The safest strategy is an asset-family refactor with strict runtime contracts. Rewriting gameplay or presentation ownership would create regression risk without improving the art.

## Audited baseline

- Branch and remote: `main == origin/main` at `678a37ac6f1b9320a94e4c4571ab2e069d6e237b`.
- Worktree before this mission: clean.
- Canonical full-character authority: 52 tracked 640×768 PNGs under `public/assets/characters/pixel/full/`.
- Production cinematics: 31 tracked MP4s under `public/assets/cinematics/`.
- Current Lion-phase backgrounds: 22 tracked WebPs: 16 dialogue, 3 tactical combat, 3 Combat Stage.
- Combat Stage pose library: 100 tracked PNGs: 25 four-pose sets across heroes, enemies, and bosses.
- Current published VFX registry: schema 1, zero published actions, SHA-256 `4951b2d22f5fce42131bf46aad6d2422aa098b5881bbaccee33291c01eda1e3e`.
- Narrative presentation census: 144 player-facing beats across 13 visual families.
- Static-tableau staging plan: 71 dialogues, 247 steps, 78 visual segments, 1–4 actors per segment.

## Runtime ownership map

### Travel

`GameApp.showTravel()` mounts `TravelView`. Route truth comes from `runSystem` and `RunNodePresentation`; the view selects a presentation-only background slot from `assetManifest`. The screen currently adds a full party plus two advisors, random decorative particles, route cards, resources, roadmap, and character tooltips.

What is good and must remain:

- every route click converges on the authoritative `GameApp.commitRunNodeChoice()` path;
- risk, reward, difficulty, and availability are not inferred from art;
- named background slots already exist;
- the UI makes route consequences legible.

What must change visually:

- remove the travel-party parade from the production transition composition; it reads as a traversable/exploration party scene;
- reduce the screen to one destination card or an explicit two-route decision, depending on authoritative availability;
- replace generic backdrop selection by a resolved visual-family role;
- replace nondeterministic particle placement with deterministic or CSS-only ambience if ambience is retained;
- treat TravelView and Journey as two clients of one presentation contract, not two competing meanings.

### Dialogue / static tableau

`src/game` owns dialogue truth. `NarrativeDialogueAdapter` and `DialogueStagingDirector` convert the selected sequence into presentation decisions. `NarrativeStage` and `NarrativeSceneSurface` own the environment and canonical actor composition; `DialogueView` owns text and choice interaction.

What is good and must remain:

- `CINEMATIC_VIDEO -> STATIC_TABLEAU -> dialogue` is already the canonical handoff;
- HOLD is dialogue-free;
- the active speaker is visible before the line;
- actors support facing, look target, mirroring, entry, and exit;
- choice geometry is separated from effect execution;
- the runtime enforces a maximum of four visible actors in generated plans.

What must change visually:

- current listener dimming and fixed actor widths can make a valid four-person scene read as a translucent cluster;
- backgrounds are mostly painted plates while actors are high-detail transparent illustrations, so contact, scale, and value integration vary;
- the existing 16 reusable dialogue backgrounds do not cover the 71 dialogue contexts/78 visual segments at final quality;
- tableau plates need explicit actor lanes, contact ground, light direction, foreground occluders, and dialogue/choice safe zones per family.

Live browser evidence: the `lion_briefing` tableau correctly mounted four canonical actors, `STATIC_TABLEAU`, and a `RIGHT_UPPER` dialogue card. Alistair, Séraphine, and Maelor were compressed into the left third while Alaric read clearly on the right. The contract is sound; the composition needs family-specific spacing and depth tuning.

### Cinematic video and hold

`CinematicRegistry`, `CinematicPlayer`, `JourneyCampaignBoundary`, and `NarrativeStage` already isolate moving media from game truth. Existing production MP4s remain protected historical media.

What is good and must remain:

- bounded, silent 1920×1080 production clips;
- failure-safe fallback and skip paths;
- exact final-frame freeze support;
- main-event classification and a separate static-tableau conversation surface.

What must change visually:

- reduce production use toward the approved eight main-story video events;
- derive HOLDs from approved endpoints or character-free family plates;
- never solve routine conversation coverage by generating additional videos.

### Tactical combat

`CombatBridge` mounts the isolated `legacy-combat.html` runtime. The legacy renderer remains an imperative Three.js presentation client behind a typed protocol. It uses a perspective camera, painted tactical background, existing placements, turn order, objective/journal stack, selected-unit panel, and action bar.

What is good and must remain:

- grid logic, pathfinding, AP, initiative, target selection, deployment, combat resolution, and combat protocol;
- central action bar and selected-unit information architecture;
- environment-specific background routing;
- current VFX resolver and fallbacks.

What must change visually:

- unit silhouettes overlap heavily at the default deployment cluster;
- actor-to-ground integration and value separation vary by unit;
- the arena background is attractive but only weakly explains tactical cells at a glance;
- the three current tactical environments are not enough to represent all 13 narrative families;
- future background remasters must preserve the existing camera, projected ground plane, grid footprint, and screen-space UI clearances.

### Combat Stage

`CombatStage` swaps the render pass to a dedicated orthographic scene, loads a paired frontal background, stages pose proxies, and hands VFX the same semantic action context. It does not resolve gameplay.

What is good and must remain:

- clean separation from authoritative combat resolution;
- paired environment ID with the tactical scene;
- prepare/action/skill pose support and mirroring;
- existing impact timing, aftermath presentation, and VFX anchors;
- guaranteed restoration to the tactical scene on failure or exit.

What must change visually:

- stage framing should reserve actor and impact lanes instead of relying on generic contain-scale placement;
- the persistent tactical action bar during the stage weakens the “special shot” read and needs a presentation-only visibility decision, not a control rewrite;
- stage backgrounds need a foreground/midground/background construction that matches the tactical family while supporting large clean silhouettes;
- pose sets need a single body-height, baseline, pivot, weapon-tip, and effect-safe-box standard.

## Current blocker found by live QA

The isolated `Flux Lion réel` browser scenario currently throws:

`No declared NarrativeStage visual phase for dialogue step 'open'.`

Cause: `buildLionFinaleJudgement()` emits dynamic semantic step IDs such as `open`, `record`, `outcome`, and `intent`, while the generated `lion_finale_judgement` presentation record only declares step ID `1`. The runtime correctly refuses to invent a visual phase.

Impact:

- narrative truth is not corrupted;
- the affected dialogue cannot open on the NarrativeStage path;
- the previous global/browser PASS artifact is stale relative to the current committed baseline;
- no global art-direction lock may be claimed until the generated staging plan covers all reachable dynamic step shapes.

This mission records but does not repair the issue because the authorized scope is phases 1–3, and the fix must be a dedicated presentation-plan reconciliation with narrative invariants rerun.

## Keep / refactor / forbid

| Area | Keep | Refactor | Forbid |
|---|---|---|---|
| Game truth | `runSystem`, dialogue/effect owners, save shape | none | art-driven route/effect logic |
| Presentation | existing resolver/director/stage boundaries | family-role asset resolution | parallel narrative runtime |
| UI | navy/ink/gold tokens, Cinzel/Inter hierarchy | density, safe zones, surface-specific chrome | baked UI/text inside art |
| Characters | canonical silhouette, palette, gear, masks | controlled Option C render treatment and poses | rename, redesign, lost mask/weapon |
| Backgrounds | environment IDs and asset slots | paired family masters and role crops | one generic image stretched across every camera |
| Combat | placements, controls, resolution, camera semantics | art, ground readability, silhouette separation | new combat rules or camera system |
| VFX | presets, anchors, resolver, fallbacks | no work in this mission | preset or publication mutation |
| Media | all existing production hashes | future explicit replacement phase only | overwrite/delete during preproduction |
