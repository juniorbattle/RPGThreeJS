# Phase 3 — progressive art refactor plan

## Production doctrine

Produce by **visual family**, then by role inside the family. A family is not complete when one attractive image exists; it is complete when travel, tableau, tactical combat, Combat Stage, and any authorized video/HOLD share landmarks, palette, light, ground, scale, and material language.

Every candidate lives outside production paths until machine QA and operator review pass. Production manifests change only in a later, explicitly authorized integration mission.

## Priority order

### P0 — reconcile the current staging blocker

Before a global visual lock, regenerate or reconcile the `lion_finale_judgement` presentation plan against every reachable dynamic step ID from `buildLionFinaleJudgement()`.

Required proof:

- all conditional IDs covered (`open`, optional record/merit/breach/stain/shadow variants, `outcome`, `witnesses`, `intent`);
- canonical speaker visible before every line;
- choice IDs/effects and resolver behavior byte/semantic equivalent;
- full narrative staging validator, focused tests, full suite, build, and two-viewport browser QA pass.

This is a presentation-plan repair, not a narrative rewrite.

### P1 — controlled cross-surface pilot

Family: `FOREST_ROAD`

Hero: `kestrel`

Reason: it exercises travel geography, common dialogue, tactical combat, Combat Stage, canonical mask/weapon fidelity, and the strongest supplied motion reference.

Candidate-only deliverables:

1. `forest_road_family_master` — landmark, palette, light, material, horizon, and ground bible.
2. `forest_road_travel_still` — no cast, no fake exploration, destination-card safe zone.
3. `forest_road_tableau_bg` — character-free, five actor lanes, dialogue/choice safe zones.
4. `forest_road_tactical_bg` — current camera/grid compatible.
5. `forest_road_stage_bg` — paired frontal plate with attacker/target/impact lanes.
6. `kestrel_idle`, `kestrel_dash`, `kestrel_attack`, `kestrel_cast_skill` — isolated reference poses or animation frames.
7. DEV-only composite review at 1920×1080 and 1366×768. No production `assetManifest` switch.

Pilot acceptance:

- same-family recognition across all four backgrounds;
- Kestrel mask, hood, bow, string, quiver, palette, proportions, and accessories unchanged;
- no actor/UI/edge collision;
- tactical cells and teams readable;
- stage impact corridor clear with existing VFX anchors;
- no gameplay, narrative, save, media, or VFX diff;
- operator approves contact sheets and runtime composites.

### P2 — core heroes

| Character | Canonical source | Option C target | Production mode | Main risk |
|---|---|---|---|---|
| Kestrel | `full/kestrel.png` | masked green scout, bow-led motion | pilot four-action set, then sheet | lost cloth mask; bow/string deformation |
| Alistair | `full/alistair.png` | black-steel/red vanguard | four-action set | mistaken “Marian” reference label; oversized sword crop |
| Marian | `full/marian.png` | masked white/gold/blue lightcaster | four-action set | mistaken “Séraphine” label; mask/halo/staff drift |
| Elara | `full/elara.png` | blue-violet arcane silhouette | four-action set | uncontrolled glow erases body/hat/weapon |

Recommended process: canonical card -> one action candidate -> defect list -> at most the mission-defined retry ceiling -> normalized candidate set -> contact sheets -> operator gate -> runtime sheet integration.

### P3 — story NPCs and recruits

Use the 52-file canonical directory and `assetManifest.visualProfiles` as the inventory authority. Separate:

- unique speakers/recruits: exact identity, full four-action set only if combat-playable;
- story NPCs: idle/dialogue poses first, no invented combat sheet;
- future placeholders: remain future and cannot silently become canon;
- aliases such as `seraphine.png`/`sage_seraphine.png`: resolve by manifest ID, not filename guesswork.

Risk: mass-generation will homogenize faces, masks, age, and costume details. Mitigation: one-character gates and identity-difference checklists.

### P4 — enemies and bosses

Order:

1. common Forest Road enemies used by the pilot;
2. Serpent generics;
3. elites;
4. bosses and 2×2 silhouettes;
5. non-humanoid families.

Preserve current footprint, target size, and unit-role readability. Enemy animation sets may share cadence conventions, never a visual identity that changes species or faction.

### P5 — environment rollout

Recommended family order by reuse and story criticality:

1. `FOREST_ROAD`
2. `LION_CAMP`
3. `ALARIC_AUDIENCE`
4. `BOIS_CLAIR`
5. `FIRST_REFUGE`
6. `SECOND_REFUGE`
7. `VALMIR_ROAD`
8. `SHADOW_RUINS`
9. `WITNESS_ROAD`
10. `FINAL_REFUGE`
11. `LION_JUDGEMENT`
12. `SERPENT_FINALE`
13. `LION_TRIAL`

For each family, produce the minimum roles actually referenced by the presentation manifest. Reuse a family master; do not duplicate near-identical backgrounds per dialogue step.

### P6 — main-event cinematics and holds

Only after static surfaces are accepted:

- keep the approved main-event whitelist as the maximum default video scope;
- generate from an operator-approved integrated keyframe;
- one continuous shot, sequential generation, no cut, stable cast;
- inspect one candidate before any defect-based retry;
- derive HOLD only after video approval;
- preserve existing MP4s until an explicit replacement and rollback plan is approved.

### P7 — production integration

Integrate one family at a time:

1. copy approved outputs to new versioned production paths;
2. update presentation asset roles, never game truth;
3. run structural/image QA and runtime composites;
4. run focused surface tests, typecheck/build, full suite, and browser QA;
5. compare protected media, canonical sprites, saves, VFX, routes, and narrative owners;
6. obtain operator visual approval;
7. only then retire superseded art in a separate authorized cleanup.

## Category plan

| Category | Canonical source | Target | Recommended production | Principal risks |
|---|---|---|---|---|
| Heroes | full canonical PNG + profile | four consistent Option C actions | per-character gated generation/paintover + deterministic normalization | identity/weapon drift |
| Enemies | canonical PNG + footprint | role-readable action set | archetype batches after one approved specimen | species homogenization |
| NPCs | canonical PNG + dialogue usage | tableau-ready idle/gesture | dialogue-first, no unnecessary combat frames | invented role/costume |
| Travel backgrounds | family plan + route truth | non-explorable destination still | character-free family derivative | fake exploration, ambiguous branch |
| Tableau backgrounds | family plan + staging zones | actor-ready theatrical plate | character-free family derivative | baked cast, collage look |
| Tactical backgrounds | current camera/grid + family plan | readable premium arena | camera-projected derivative + runtime overlay QA | broken cell readability |
| Combat Stage backgrounds | paired tactical ID + stage camera | dramatic frontal arena | separately framed family derivative | crop/VFX collision |
| Main-event video | approved keyframe + cast manifest | short continuous event | MiniMax only when explicitly authorized | cuts, cast/reset drift |
| Holds | approved endpoint/family plate | dialogue-free pause | deterministic extraction or static plate | accidental dialogue/cast ownership |
| Animation sheets | approved action frames | runtime sheet with stable pivot | deterministic packing after pose approval | baseline jitter, duplicate frames |

## Stop conditions

Stop and request operator direction if any of these occurs:

- canonical identity cannot be preserved after the allowed retry ceiling;
- a background needs a camera/gameplay change to look acceptable;
- tactical readability worsens;
- the VFX registry, preset files, or anchors would need modification;
- an existing production video or canonical sprite would be overwritten;
- a candidate passes machine QA but its visual family does not clearly match at human review.
