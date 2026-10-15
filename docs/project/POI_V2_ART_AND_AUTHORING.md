# POI V2 art and content authoring

Authority: [OD-2026-10-15-B](../autonomy/LOT_E_OPERATOR_DECISION_2026-10-15.md), set1.4.0. **CURRENT FACT:** 21 preserved canonical nodes plus the12 approved Lot E nodes, six active chests and two separate mobile elites. The exact [Lot E contract](RPGThreeJS_LOT_E_CONTRAT_AUTHORING_FINAL_2026-10-15.md) and [annex](RPGThreeJS_LOT_E_MANIFEST_AUTHORING_FINAL_2026-10-15.json) supersede the inactive V2 proposals below. **UNDECIDED:** operator artistic acceptance and final felt balance.

The three Lot E map revisions are versioned in `public/assets/generated/lion-phase/poi-lot-e/`; original V2 art remains intact. Built-in image-generation edits use the inspected V2 maps as references and add the approved destination clearings, loop paths and crossing approaches. [Exact prompts, outputs and hashes](LOT_E_ATLAS_PROVENANCE_2026-10-15.json) record the reproducible art handoff. Native overlays remain the authority for paths, accessibility, temporary occupation and intentions. Technical geometry and capture review must precede the separate operator art decision.

## Art specification

Pipeline: `baked_raster` + runtime object model `none` + collision model `none` + project-native DOM/SVG overlay. The background establishes geography; RunSystem-owned edges and states establish movement. No physical navigation/collision/simulation is derived from pixels. Labels, markers, availability, status and focus remain code-owned. No art state is serialized.

The built-in image generation tool produces three new backgrounds, without replacing approved environment art. The art direction derives from the inspected production-approved `demo-environment-pack-v1/travel/forest-road-travel.png` and `first-refuge-travel.png`: dense intentional pixel clusters, sculptural forest canopy, slate cliffs/masonry, canvas/palisade camps, navy shadows and controlled warm highlights. These are style references, never pasted screenshots or new canon. No video/keyframe generation is involved.

| Region | Composition and prompt specification | Existing anchor identities |
| --- | --- | --- |
| Opening forest | Overhead three-quarter16:9 forest diorama. Mandatory western camp/stone-audience/forest-battle corridor reaches a central crossroads. Northern optional refugee clearing, northeast traveler path and southeast contested track converge toward eastern canvas refuge. Layered slate ridges, varied canopy and narrow eastern waterway. Spacious anchor ground; no characters, extra settlements, chests, labels or baked UI. | Camp, audience, opening combat, nomad crossroads, refugees, first-trial alternatives, first refuge |
| Bois-Clair valley | Distinct river-valley composition: western refuge/supply track, bridge/marsh battle approach, northern stone shrine and southern hostile track, convergence on eastern Bois-Clair and northeast refuge. Controlled olive/emerald/navy/gold palette, deliberate masonry, forest and water masses. No outcome depicted by generated fire or characters. | First refuge, reserves, Valmir, second trial, Bois-Clair, second refuge |
| Witness and judgement ridge | Cooler diagonal stone-terrace/ruin composition: western refuge/volunteer/witness clearings, separated northern narrative and southern combat approaches, shadow-signs masonry, small preparation camp then eastern judgement hall. Existing place identities only; no invented dragon/symbol/lore. | Second refuge, lancer, witnesses, final trial, shadow signs, preparation, judgement |

All prompts request modern Option C / Pixel Diorama Fantasy, crisp intentional high-density pixels and coherent miniature scale. They forbid photorealism, smooth3D, watercolor, generic anime, repeated triangle trees, texture noise, horizon, parchment, compass, grid, text, markers, enemies, loot and extra named locations. Exact creative prompts are retained in the image-generation calls of the operator mission. The map is a geographical atlas; live campaign outcome/status is encoded by authoritative markers/detail rather than invented landscape effects.

Acceptance requires before/after comparison, current captures of all three regions, readable overlay routes and labels,1366×768/620/390 geometry, keyboard/touch scrolling and focus, OS/game reduction, plus operator artistic inspection. A generated asset is a candidate integrated for review, never automatically `PRODUCTION_APPROVED` art.

## Historical V2 authoring proposals — superseded by Lot E

The following table preserves the old **PROPOSED FUTURE DESIGN** as historical context. It no longer describes the approved Lot E payloads or live topology; use the signed contract and annex above.

| Proposed durable ID | Proposed connection | Exact candidate payload and provenance | Economy / decision |
| --- | --- | --- | --- |
| `lion-poi-opening-supplies` | Reversible dead end from `lion-nomad-crossroads`; cannot connect to refuge | 0gold,1`potion`; existing `catalog.ts` Potion légère, price15, heals55HP | New once-only temporary consumable worth15catalog gold; placement and grant need explicit author approval. No production node/assignment created. |
| `lion-poi-opening-patrol` | Separate reversible dead end from crossroads; trial still required | Existing normal `forest_patrol`, existing eligible roster; unchanged existing rewards85gold,+1reputation,1red_gem,1iron_ore | New reward opportunity and durable ID need explicit placement/economy approval. Not silently activated by permission to use ordinary configurations. |
| No opening elite proposed | None | Existing `troll_crossing` and `serpent_duelist_trial` are genuinely ranked elite but authored for later phases; no eligible opening elite placement is approved | Preserve their current canonical availability; do not move them into the tutorial or label a normal fight elite. |

Lot E authoring is explicitly approved by OD-2026-10-15-B. The active adapter and additive V6 migration implement its exact payloads; the historical candidates above are not a second catalogue. Any further content still requires explicit authoring approval.
