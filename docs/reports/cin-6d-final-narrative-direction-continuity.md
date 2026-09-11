# CIN-6D — Final narrative direction and continuity lock

## Status

- Baseline: `84eb25a19fc1fad4ad77f4db5a1ac85d3fd0cb5a`
- Branch: `main`
- Scope: presentation, staging metadata, deterministic audits, browser QA, and reports only.
- Narrative lock: **READY**
- Media production: **none**
- Protected systems: RunSystem, save schema, combat runtime, and VFX unchanged.

## Method

The audit starts from the runtime graph and canonical content registries. `RunSystem` remains the route authority; dialogue definitions remain the text, choice, effect, and speaker authority; derived Lion state remains computed from historical facts. The generated specifications describe presentation without copying route selection or changing saved truth.

The audit covers all 21 runtime nodes, all 23 reachable edges, 71 dialogues, 247 dialogue steps, 28 actionable choice states, and 31 production cinematic masters. It combines deterministic source-derived specifications, focused Vitest suites, the campaign census validator, the NarrativeStage validator, the exact choice-geometry comparator, and real Chromium playthroughs at 1920×1080.

## Scene continuity doctrine

Every change of place, time, activity, objective, or encounter releases the previous held scene and establishes a current presentation before dialogue, agency, or combat. A held frame may remain only when the next beat is still in the same scene. Dialogue backdrops are therefore preserved only through explicit opt-in.

The player-facing field composition is one Hero representing the company, one or two relevant advisers, and the external person, place, or threat. Advisers carry most interpretation; the Hero communicates the player's physical presence. Accepted exceptions remain valid for the opening cast presentation, the Audience, recruitment focus, refuge scenes, intimate exchanges, finales, and video shots that already own their cast.

Moving or held video owns the visible cast. Static tableaux own canonical foreground sprites. The two modes never mount duplicate character layers.

## Beat taxonomy

`ARRIVAL`, `ENCOUNTER`, `DIALOGUE`, `DECISION`, `DEPARTURE`, `TRAVEL`, `THREAT`, `PRE_COMBAT`, `COMBAT`, `POST_COMBAT`, `AFTERMATH`, `REFUGE_ARRIVAL`, `REFUGE_MANAGEMENT`, `REFUGE_DEPARTURE`, `REVELATION`, `JUDGEMENT`, `ENDING`, and `EPILOGUE`.

## Topology and node audit

| Depth | Node | Type | Reachable content | Entry → exit | Next |
|---:|---|---|---|---|---|
| 0 | `lion-camp` | story | `camp_departure` | DEPARTURE → TRAVEL | `lion-audience` |
| 1 | `lion-audience` | story | `lion_briefing` | ARRIVAL → TRAVEL | `lion-opening-ambush` |
| 2 | `lion-opening-ambush` | combat | `forest_ambush`, `wolf_pack` | THREAT → DEPARTURE | `lion-nomad-crossroads` |
| 3 | `lion-nomad-crossroads` | event | `mystery_recruit` | ARRIVAL → DEPARTURE | `lion-refugees` |
| 4 | `lion-refugees` | event | `refugee_trial` | ARRIVAL → DEPARTURE | first event/combat fork |
| 5 | `lion-first-trial-event` | event | `mystery_help`, `mystery_treasure` | ARRIVAL → DEPARTURE | `lion-first-refuge` |
| 5 | `lion-first-trial-combat` | combat | `spider_nest`, `forest_patrol`, `serpent_reprisals` | ARRIVAL → DEPARTURE | `lion-first-refuge` |
| 6 | `lion-first-refuge` | refuge | `forest_refuge` | REFUGE_ARRIVAL → REFUGE_DEPARTURE | `lion-reserve-trail` |
| 7 | `lion-reserve-trail` | event | `reserve_trail` | TRAVEL → DEPARTURE | `lion-valmir-road` |
| 8 | `lion-valmir-road` | combat | `road_to_valmir`, `marsh_crossing` | TRAVEL → DECISION | second event/combat fork |
| 9 | `lion-second-trial-event` | event | `old_shrine_event` | ARRIVAL → DEPARTURE | `lion-village-choice` |
| 9 | `lion-second-trial-combat` | combat | `troll_crossing`, `serpent_checkpoint`, `serpent_duelist_trial` | ARRIVAL → DEPARTURE | `lion-village-choice` |
| 10 | `lion-village-choice` | story | `village_choice` | ARRIVAL → AFTERMATH | `lion-second-refuge` |
| 11 | `lion-second-refuge` | refuge | `forest_refuge` | REFUGE_ARRIVAL → REFUGE_DEPARTURE | `lion-lancer-recruit` |
| 12 | `lion-lancer-recruit` | event | `mystery_lancer_recruit` | ARRIVAL → DEPARTURE | `lion-witnesses` |
| 13 | `lion-witnesses` | event | `witnesses_on_road` | ARRIVAL → DEPARTURE | final event/combat fork |
| 14 | `lion-final-trial-event` | event | `mystery_dragon_roost`, `mystery_shrine`, `serpent_informant` | ARRIVAL → DEPARTURE | `lion-shadow-signs` |
| 14 | `lion-final-trial-combat` | combat | `ruins_guardians`, `serpent_hunters` | ARRIVAL → DEPARTURE | `lion-shadow-signs` |
| 15 | `lion-shadow-signs` | mystery | `shadow_signs` | ARRIVAL → DEPARTURE | `lion-final-refuge` |
| 16 | `lion-final-refuge` | story | `final_refuge` | REFUGE_ARRIVAL → REFUGE_DEPARTURE | `lion-final-judgement` |
| 17 | `lion-final-judgement` | boss | `lion_finale_judgement` | ARRIVAL → EPILOGUE | terminal |

Every node records its authoritative conditions, cast direction, dialogue ids, combat ids, entry, exit, successors, hold-release rule, and CIN-6E media need in `tools/cinematics/specs/final_narrative_continuity.json`.

## Reachable transition matrix

All 23 edges change at least place or activity and therefore require an explicit current presentation. No edge permits a stale prior hold.

| From | To | Presentation result |
|---|---|---|
| `lion-camp` | `lion-audience` | mapped Audience arrival/current tableau |
| `lion-audience` | `lion-opening-ambush` | **`AUDIENCE_ROAD_DEPARTURE_TABLEAU`** |
| `lion-opening-ambush` | `lion-nomad-crossroads` | mapped/current-context boundary |
| `lion-nomad-crossroads` | `lion-refugees` | mapped/current-context boundary |
| `lion-refugees` | `lion-first-trial-event` | selected event boundary |
| `lion-refugees` | `lion-first-trial-combat` | selected threat boundary |
| `lion-first-trial-event` | `lion-first-refuge` | refuge arrival |
| `lion-first-trial-combat` | `lion-first-refuge` | refuge arrival |
| `lion-first-refuge` | `lion-reserve-trail` | refuge departure/current road |
| `lion-reserve-trail` | `lion-valmir-road` | Valmir approach |
| `lion-valmir-road` | `lion-second-trial-event` | left route selection |
| `lion-valmir-road` | `lion-second-trial-combat` | right route selection |
| `lion-second-trial-event` | `lion-village-choice` | Bois-Clair arrival |
| `lion-second-trial-combat` | `lion-village-choice` | Bois-Clair arrival |
| `lion-village-choice` | `lion-second-refuge` | outcome-specific aftermath, then refuge |
| `lion-second-refuge` | `lion-lancer-recruit` | refuge departure/current road |
| `lion-lancer-recruit` | `lion-witnesses` | witness approach |
| `lion-witnesses` | `lion-final-trial-event` | selected event route |
| `lion-witnesses` | `lion-final-trial-combat` | selected combat route |
| `lion-final-trial-event` | `lion-shadow-signs` | ruins revelation |
| `lion-final-trial-combat` | `lion-shadow-signs` | ruins revelation |
| `lion-shadow-signs` | `lion-final-refuge` | final dossier approach |
| `lion-final-refuge` | `lion-final-judgement` | judgement arrival |

## Corrected continuity defect

One systemic stale-hold risk was found. Narrative dialogue preserved its backdrop by default, which could carry the Audience chamber across the next campaign boundary. Preservation now requires `preserveBackdrop: true`. Existing callers that need a same-scene hold can opt in; ordinary context changes release it.

One explicit context change lacked a dedicated presentation: `lion-audience → lion-opening-ambush`. The edge now resolves to a static-only presentation key. `JourneyCampaignBoundary` presents `AUDIENCE_ROAD_DEPARTURE_TABLEAU` directly, bypassing any pending Audience surface. The tableau shows Seraphine, Alistair, and Maelor on the forest road, omits Alaric, offers only Continue, and hands off to the separate forest threat scene. It is marked `NEW_MEDIA_REQUIRED` for CIN-6E while remaining complete and coherent in CIN-6D.

The accepted Audience geography is unchanged: Maelor and reserve on the left, Alaric and mission acceptance on the right, with canonical choice ids, source order, effects, and consequences intact.

## Dialogue quality

All 71 dialogues and 247 steps are classified: 243 `KEEP`, 4 `POLISH`, and zero `MOVE`, `CONDITIONALIZE`, `CHANGE_SPEAKER`, `REMOVE_REDUNDANT_LINE`, `ADD_TRANSITION_LINE`, `CONTENT_BUG`, or `REVIEW` items.

The four approved presentation reductions retain their canonical source text and truth:

- `village_choice:1a`: the display line keeps the divided-place geography and both objectives in a concise form.
- `village_choice:2a`: the display line keeps the two routes and the tactical limit without repeating staging prose.
- `final_refuge:1`: the display line keeps the approach, dossier stakes, Sceau, and Alaric consequence while the tableau carries the approach image.
- `final_refuge:3`: the display line keeps the complete evidence list and consequence while earlier scenes carry chronology.

No wrong speaker, contradiction, accidental repeated exposition, unresolved offscreen speaker, capacity overflow, scroll fallback, or choice/card overlap remains. Twelve video steps intentionally use documented offscreen contextual delivery; none lacks a reason.

## Cast and direction audit

- Field direction: PASS.
- Advisers as primary narrative interpreters: PASS.
- Hero as company representative where the current scene calls for it: PASS.
- Wrong cast: 0.
- Wrong speaker: 0.
- Unintentional offscreen speakers: 0.
- Video/static duplicate cast: 0.
- Optional recruits shown before recruitment: 0.
- Final refuge remains a story node; no refuge management was introduced.

## Browser and route QA

Real Chromium at 1920×1080 validated:

- new chronicle → camp → Audience → canonical Audience choice → explicit company road departure → forest threat → combat;
- moving and held Audience video, semantic left/right speaker association, and exact choice lanes;
- narrative→combat and combat→aftermath handoffs with zero uncovered or stale-interaction samples;
- Valmir's two real route choices and selected-route dialogue;
- Cedric recruited and declined, with saved roster truth checked;
- Bois-Clair saved and sacrificed through their distinct combat, aftermath, ATE, and reputation-event chains;
- Garen recruitment, protected witnesses, Shadow evidence, and the story-only final refuge;
- Serpent ending, voluntary Lion Trial, non-voluntary Lion Trial, and their route-correct epilogues;
- representative event and combat media for merchant, cart, shrine, dragon, informant, spider, patrol, troll, and duelist;
- reduced motion, skip, media failure, frozen final-frame release, and clean ownership teardown.

The complete route matrix remains locked by `r6FullRouteIntegration.test.ts`: saved/sacrificed outcomes never cross, Cedric presence is contextual, all adaptive pools remain reachable, the three final route semantics are exclusive, and epilogues preserve route and Shadow truth.

Representative evidence:

- `tmp/cinematics/cin6d/browser-qa/01-camp-to-audience.png`
- `tmp/cinematics/cin6d/browser-qa/02-audience-to-road.png`
- `tmp/cinematics/cin6d/browser-qa/03-road-to-opening-threat.png`
- `tmp/cinematics/cin6d/browser-qa-core/1920x1080-06-post-combat-narrative.png`
- `tmp/cinematics/cin6d/browser-qa-core/1920x1080-04-valmir-fork.png`
- `tmp/cinematics/cin6d/browser-qa-routes/bois-clair-saved.png`
- `tmp/cinematics/cin6d/browser-qa-routes/bois-clair-sacrificed.png`
- `tmp/cinematics/cin6d/browser-qa-routes/serpent-ending.png`
- `tmp/cinematics/cin6d/browser-qa-routes/voluntary-lion-trial-ending.png`
- `tmp/cinematics/cin6d/browser-qa-routes/non-voluntary-lion-trial-ending.png`

## Remaining media work

No narrative blocker remains. CIN-6E has one required new media beat, `audience_road_departure`, plus the classified visual remaster/reuse queue. CIN-6D already provides the current-context static fallback, so gameplay does not depend on future media.

## Lock decision

`NARRATIVE_LOCK_READY: YES`

`READY_FOR_CIN_6E: YES`

CIN-7 remains unauthorized.
