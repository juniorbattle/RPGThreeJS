# CIN-5 Full Cinematic Census

## 1. Exact baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and audited HEAD: `c3074906bbf6882decf3d4ef482867a5af17ce3a`
- Audited `origin/main`: `c3074906bbf6882decf3d4ef482867a5af17ce3a`
- Starting worktree: clean
- CIN-5 constraint: planning metadata only; no commit, push, provider request, source-frame generation, video generation, mastering, or runtime mapping.

## 2. Source-of-truth files audited

Current repository truth was taken, in order, from:

1. `src/game/runSystem.ts` — the 21-node graph, seeded content, adaptive content, mandate overrides, and legacy assignment compatibility.
2. `src/game/GameApp.ts` — the authoritative route commit, node resolution, refuge loop, dialogue/combat ordering, ATE/reputation ordering, and boss/epilogue flow.
3. `src/game/content.ts` and `src/game/r5NarrativeContent.ts` — dialogue, 17 production combat configs, pre/post combat hooks, recruits, ATE content, and POST_NODE_ATE.
4. `src/game/contextualDialogueContent.ts` — contextual variants, optional steps, ATE conditions, knowledge/disclosure presentation.
5. `src/game/reputationEventContent.ts` and `src/game/reputationEventDirector.ts` — nine event definitions, three opportunity windows, weights, uniqueness, cooldowns, global cap and spacing.
6. `src/game/lionNarrative.ts`, `src/game/lionVerdict.ts`, and `src/game/lionFinale.ts` — derived conduct, witness, Shadow knowledge/disclosure, deterministic finale selection, aftermath, and ending IDs.
7. Current tests proving route and narrative behavior.
8. Current CIN-3/CIN-4 manifest, production triggers, Journey map, structured shot spec, compositor, validators, last-frame extractor, assembler, and generation tooling.

The census is deliberately offline and is not a runtime source of game truth.

## 3. Campaign topology

The current graph contains exactly 21 route-template nodes with maximum depth 17.

| Depth | Node | Type | Default content | Successor(s) | Boundary intent |
|---:|---|---|---|---|---|
| 0 | `lion-camp` | story | `camp_departure` | `lion-audience` | AUTO_CONTINUE_CANDIDATE |
| 1 | `lion-audience` | story | `lion_briefing` | `lion-opening-ambush` | AUTO_CONTINUE_CANDIDATE |
| 2 | `lion-opening-ambush` | combat | `forest_ambush` | `lion-nomad-crossroads` | AUTO_CONTINUE_CANDIDATE |
| 3 | `lion-nomad-crossroads` | event | `mystery_recruit` | `lion-refugees` | AUTO_CONTINUE_CANDIDATE |
| 4 | `lion-refugees` | event | `refugee_trial` | first event / first combat | ROUTE_CHOICE |
| 5 | `lion-first-trial-event` | event | `mystery_help` | `lion-first-refuge` | AUTO_CONTINUE_CANDIDATE |
| 5 | `lion-first-trial-combat` | combat | `forest_patrol` | `lion-first-refuge` | AUTO_CONTINUE_CANDIDATE |
| 6 | `lion-first-refuge` | refuge | `forest_refuge` | `lion-reserve-trail` | CONTINUE_BOUNDARY |
| 7 | `lion-reserve-trail` | event | `reserve_trail` | `lion-valmir-road` | AUTO_CONTINUE_CANDIDATE |
| 8 | `lion-valmir-road` | combat | `road_to_valmir` | second event / second combat | ROUTE_CHOICE |
| 9 | `lion-second-trial-event` | event | `old_shrine_event` | `lion-village-choice` | AUTO_CONTINUE_CANDIDATE |
| 9 | `lion-second-trial-combat` | combat | `serpent_checkpoint` | `lion-village-choice` | AUTO_CONTINUE_CANDIDATE |
| 10 | `lion-village-choice` | story | `village_choice` | `lion-second-refuge` | AUTO_CONTINUE_CANDIDATE |
| 11 | `lion-second-refuge` | refuge | `forest_refuge` | `lion-lancer-recruit` | CONTINUE_BOUNDARY |
| 12 | `lion-lancer-recruit` | event | `mystery_lancer_recruit` | `lion-witnesses` | AUTO_CONTINUE_CANDIDATE |
| 13 | `lion-witnesses` | event | `witnesses_on_road` | final event / final combat | ROUTE_CHOICE |
| 14 | `lion-final-trial-event` | event | `mystery_dragon_roost` | `lion-shadow-signs` | AUTO_CONTINUE_CANDIDATE |
| 14 | `lion-final-trial-combat` | combat | `ruins_guardians` | `lion-shadow-signs` | AUTO_CONTINUE_CANDIDATE |
| 15 | `lion-shadow-signs` | mystery | `shadow_signs` | `lion-final-refuge` | AUTO_CONTINUE_CANDIDATE |
| 16 | `lion-final-refuge` | story | `final_refuge` | `lion-final-judgement` | CONTINUE_BOUNDARY |
| 17 | `lion-final-judgement` | boss | `lion_finale_judgement` | none | TERMINAL_FINALE |

`lion-first-refuge` and `lion-second-refuge` are interactive refuges. `lion-final-refuge` is a story node and must never expose shop/rest/camp agency.

## 4. Route forks

Exactly three graph nodes have more than one successor:

| Incoming node | Real candidates | Freeze cinematic | Candidate preload group |
|---|---|---|---|
| `lion-refugees` | `lion-first-trial-event`, `lion-first-trial-combat` | `refugees_approach` final frame | `fork_1_candidates` |
| `lion-valmir-road` | `lion-second-trial-event`, `lion-second-trial-combat` | `valmir_route_fork` final frame | `fork_2_candidates` |
| `lion-witnesses` | `lion-final-trial-event`, `lion-final-trial-combat` | `witnesses_encounter` final frame | `fork_3_candidates` |

Adaptive content selection is not a route choice. The final Alaric intent is player agency in DialogueView and finale logic, not a map fork.

## 5. Adaptive variants

There are 14 actively selected adaptive content IDs and one legacy-compatible assignment, for 15 repository-recognized adaptive IDs.

| Adaptive node | Current content | Overrides / compatibility |
|---|---|---|
| first event | `mystery_help`, `mystery_treasure` | both mandates select `mystery_help` |
| first combat | `spider_nest`, `forest_patrol`, `serpent_reprisals` | honour mandate -> spider; advance mandate -> reprisals |
| second event | `old_shrine_event` | fixed adaptive result |
| second combat | `troll_crossing`, `serpent_checkpoint`, `serpent_duelist_trial` | advance mandate -> checkpoint |
| final event | `mystery_dragon_roost`, `serpent_informant`, `mystery_shrine` | non-infamy after a resolved elite -> shrine; legacy assignments may still resolve `mystery_lancer_recruit` |
| final combat | `ruins_guardians`, `serpent_hunters` | conduct-derived |

The census gives materially distinct recruits, merchants, treasure, spiders, named elites, dragon, and informant their own P1 encounter/reveal. Ordinary Serpent opposition, seeded creatures, shrines, and ruins use explicit families.

## 6. Seeded variants

| Node | Seeded content IDs | Decision |
|---|---|---|
| `lion-opening-ambush` | `forest_ambush`, `wolf_pack` | one neutral `forest_journey_tension` family; tactical combat reveals the exact composition |
| `lion-valmir-road` | `road_to_valmir`, `marsh_crossing` | one urgent `bois_clair_road_tension` family; no content-specific video |

Both pairs already share their respective pre/post dialogue IDs, supporting the shared-family decision.

## 7. Narrative dialogue, combat and ATE relationships

All 17 current production combat configs have both `preCombatDialogueId` and `postCombatDialogueId`. Video does not duplicate every hook:

- Routine combats use journey/reveal context before combat and no post-combat video.
- Named P1 elites receive a single reveal; the following pre-combat dialogue must not replay it.
- Bois-Clair uses neutral HERO approach footage before `village_choice`, then a deterministic saved/sacrificed visible aftermath after the selected combat.
- Bosses keep their approved MICRO reveal after route-correct pre-combat dialogue and gain route-specific HERO endings.
- Tactical combat remains the action system.

All ten ATE rules are audited. Every ATE is `REUSE_CONTEXT`; none receives a unique movie. `ate_first_refuge_watch` holds `first_refuge_arrival`, and `ate_bois_clair_night_watch` holds the matching Bois-Clair aftermath variant. Evidence/fragments, witness, Cedric, conduct, and legacy contradictions remain contextual dialogue truth.

## 8. Existing production videos

`ffprobe`, byte size and SHA-256 were checked without modifying media.

| Runtime ID | Tier/status | Duration | Bytes | Codec/profile | Resolution/fps | Pixel/audio | SHA-256 |
|---|---|---:|---:|---|---|---|---|
| `lion_judgement` | HERO / APPROVED_EXISTING | 17s | 21,565,194 | H.264 High | 1920x1080 / 24 | yuv420p / none | `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9` |
| `serpent_general_reveal` | MICRO / APPROVED_EXISTING | 8s | 9,331,600 | H.264 High | 1920x1080 / 24 | yuv420p / none | `e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682` |
| `lion_champion_reveal` | MICRO / APPROVED_EXISTING | 8s | 10,692,772 | H.264 High | 1920x1080 / 24 | yuv420p / none | `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c` |

Total: 33 seconds, 41,589,566 bytes. Aggregate empirical rate: 1,260,289.8788 bytes/second. These clips are verification-only in CIN-6, not routine regeneration targets.

## 9. Cinematic identity doctrine

Primary semantic identities are stable `node:`, `edge:`, `content:`, or `state:` keys. Runtime IDs are lowercase snake_case and contain no authoring version. Production sequence IDs may add revisions later. State and content relationships can be attached to an identity, but they do not replace its primary meaning.

## 10. Coverage modes

| Mode | Count | Meaning |
|---|---:|---|
| NONE | 1 | deterministic presentation is sufficient |
| REUSE | 37 | explicit family or held context |
| UNIQUE | 22 | unique planned media |
| STATE_VARIANT | 1 | two deterministic visible-state outputs |
| APPROVED_EXISTING | 3 | current approved production media |

## 11. Tier definitions

- MICRO: 3–6 seconds and normally one shot; short reveal or transition. Existing approved eight-second boss reveals remain MICRO by production role.
- JOURNEY: 6–15 seconds and one to three shots; travel, approach, route freeze, refuge transition.
- HERO: 15–35 seconds and two to five shots; major story, consequence, judgement, climax or ending.

Entry counts: MICRO 35, JOURNEY 21, HERO 7. Reuse-family production assets are additional shared resources rather than duplicate census entries.

## 12. Priority definitions

- P0: end-to-end representative Cinematic Journey coverage and both finales.
- P1: adaptive identity, recruitment and named-encounter differentiation.
- P2: optional polish only; no standalone P2 video is currently justified.

PRIORITIZED PRIMARY MEDIA ENTRIES:

- P0: 17
- P1: 9
- P2: 0

Only census entries classified `UNIQUE`, `STATE_VARIANT`, or `APPROVED_EXISTING` contribute to those primary-entry counts. A referenced `REUSE` census row does not become another primary entry.

P0 ORDERED TARGETS INCLUDING REUSE: 20

P1 ORDERED TARGETS INCLUDING REUSE: 11

P2 ORDERED TARGETS INCLUDING REUSE: 0

The ordered-target totals count actual production actions. P0 expands one `STATE_VARIANT` primary entry into two state targets (+1 target) and adds two `REUSE_FAMILY` own-video targets: 17 + 1 + 2 = 20. P1 adds two `REUSE_FAMILY` own-video targets to its nine primary entries: 9 + 0 + 2 = 11. These reuse families are shared resources, not additional unique story-video requirements. The JSON records this accounting explicitly and marks every CIN-6 batch target with `UNIQUE`, `STATE_VARIANT`, `APPROVED_EXISTING`, or `REUSE_FAMILY`.

## 13. Complete census table

`family/-` means the entry inherits shot/duration/source planning from its referenced reuse family. Full purpose, characters, staging, state rules, preload and fallback fields are in the JSON census.

| Identity | Runtime ID | Coverage | Tier | Pri | Trigger | State/condition | Shots | Duration | Characters | Environment | Source | Complexity | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `content:acte_ouverture:prologue` | - | NONE | - | - | NONE | - | - | - | - | - | - | - | NOT_PLANNED |
| `node:lion-camp:departure` | `camp_departure` | UNIQUE | JOURNEY | P0 | BEFORE_DIALOGUE | opening complete | 2–3 | 10–14s | Alistair, Séraphine | camp_departure | READY | CONTROLLED | PLANNED |
| `node:lion-audience:arrival` | `alaric_audience_arrival` | UNIQUE | JOURNEY | P0 | BEFORE_DIALOGUE | before mandate | 2 | 8–10s | Alaric, champion | lion_briefing | READY | CONTROLLED | PLANNED |
| `node:lion-opening-ambush:journey` | - | REUSE | JOURNEY | - | JOURNEY_NODE | - | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `node:lion-nomad-crossroads:encounter` | `cedric_encounter` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-recruit | 1 | 4–6s | Cedric, Kestrel | mystery_recruit | READY | STATIC_LOW | PLANNED |
| `node:lion-refugees:approach` | `refugees_approach` | UNIQUE | JOURNEY | P0 | JOURNEY_NODE | pre-decision | 2–3 | 10–14s | refugee mother, Marian | refugee_trial | READY | CONTROLLED | PLANNED |
| `node:lion-first-trial-event:context` | - | REUSE | MICRO | - | JOURNEY_EDGE | adaptive | family | family | - | refugee_trial | family | family | FAMILY_PLANNED |
| `node:lion-first-trial-combat:context` | - | REUSE | JOURNEY | - | JOURNEY_EDGE | adaptive | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `node:lion-first-refuge:arrival` | `first_refuge_arrival` | UNIQUE | JOURNEY | P0 | REFUGE_ARRIVAL | - | 2 | 8–12s | Marian, Alistair | lion_refuge | READY | CONTROLLED | PLANNED |
| `edge:lion-first-refuge>lion-reserve-trail` | `first_refuge_departure` | UNIQUE | JOURNEY | P0 | REFUGE_DEPARTURE | after continue | 2–3 | 9–13s | Kestrel, Maelor | reserve_trail | READY | CONTROLLED | PLANNED |
| `node:lion-valmir-road:route-choice-freeze` | `valmir_route_fork` | UNIQUE | JOURNEY | P0 | JOURNEY_NODE | road resolved | 2 | 8–12s | Kestrel | forest_fork | READY | CONTROLLED | PLANNED |
| `node:lion-second-trial-event:context` | - | REUSE | MICRO | - | JOURNEY_EDGE | pre-choice | family | family | - | mystery_shrine | family | family | FAMILY_PLANNED |
| `node:lion-second-trial-combat:context` | - | REUSE | JOURNEY | - | JOURNEY_EDGE | adaptive | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `node:lion-village-choice:arrival` | `bois_clair_arrival` | UNIQUE | HERO | P0 | BEFORE_DIALOGUE | pre-outcome | 3–5 | 17–23s | villager, raider, Alistair | bois_clair_stage | READY | ADVANCED | PLANNED |
| `node:lion-second-refuge:bois-clair-aftermath` | `bois_clair_saved` / `bois_clair_sacrificed` | STATE_VARIANT | HERO | P0 | STATE_AFTERMATH | mission state | 3–4 | 15–22s each | villager, refugee, Maelor | bois_clair_stage | READY | ADVANCED | PLANNED |
| `edge:lion-second-refuge>lion-lancer-recruit` | `second_refuge_departure` | UNIQUE | JOURNEY | P0 | REFUGE_DEPARTURE | after continue | 2 | 8–12s | Marian, Alistair | village_choice | READY | CONTROLLED | PLANNED |
| `node:lion-lancer-recruit:encounter` | `garen_encounter` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-recruit / legacy | 1 | 4–6s | lancer | witnesses_on_road | READY | STATIC_LOW | PLANNED |
| `node:lion-witnesses:encounter` | `witnesses_encounter` | UNIQUE | JOURNEY | P0 | JOURNEY_NODE | pre-witness choice | 2–3 | 10–14s | survivor, Marian | witnesses_on_road | READY | CONTROLLED | PLANNED |
| `node:lion-final-trial-event:context` | - | REUSE | MICRO | - | JOURNEY_EDGE | adaptive | family | family | - | shadow_signs | family | family | FAMILY_PLANNED |
| `node:lion-final-trial-combat:context` | - | REUSE | JOURNEY | - | JOURNEY_EDGE | adaptive | family | family | - | lion_sanctum_stage | family | family | FAMILY_PLANNED |
| `node:lion-shadow-signs:arrival` | `shadow_signs` | UNIQUE | HERO | P0 | BEFORE_DIALOGUE | knowledge/disclosure-neutral | 3–4 | 17–23s | Séraphine, Elara | shadow_signs | READY | ADVANCED | PLANNED |
| `node:lion-final-refuge:dossier` | `final_refuge_dossier` | UNIQUE | HERO | P0 | BEFORE_DIALOGUE | story-only | 3–4 | 15–21s | Maelor, Séraphine, Alistair | lion_finale | READY | ADVANCED | PLANNED |
| `node:lion-final-judgement:judgement` | `lion_judgement` | APPROVED_EXISTING | HERO | P0 | BEFORE_DIALOGUE | pre-route | 3 | 17s | Alaric | approved source | READY | ADVANCED | APPROVED_EXISTING |
| `content:forest_ambush:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | seeded | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:wolf_pack:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | seeded | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:road_to_valmir:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | seeded | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:marsh_crossing:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | seeded | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:mystery_help:reveal` | `injured_merchant_encounter` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-choice | 1 | 4–6s | survivor | mystery_help | READY | STATIC_LOW | PLANNED |
| `content:mystery_treasure:reveal` | `abandoned_cart_reveal` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-choice | 1 | 4–6s | Maelor | mystery_treasure | READY | STATIC_LOW | PLANNED |
| `content:spider_nest:reveal` | `spider_nest_reveal` | UNIQUE | MICRO | P1 | BEFORE_COMBAT | pre-combat | 1 | 4–6s | forest spider | forest_route_stage | READY | CONTROLLED | PLANNED |
| `content:forest_patrol:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | - | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:serpent_reprisals:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | conduct reason in dialogue | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:old_shrine_event:reveal` | - | REUSE | MICRO | - | BEFORE_DIALOGUE | untouched shrine | family | family | - | mystery_shrine | family | family | FAMILY_PLANNED |
| `content:troll_crossing:reveal` | `troll_crossing_reveal` | UNIQUE | MICRO | P1 | BEFORE_COMBAT | pre-combat | 1 | 4–6s | forest troll | forest_route_stage | READY | CONTROLLED | PLANNED |
| `content:serpent_checkpoint:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | - | family | family | - | forest_route_stage | family | family | FAMILY_PLANNED |
| `content:serpent_duelist_trial:reveal` | `serpent_duelist_reveal` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-resolution | 1 | 4–6s | duelist | forest_route_stage | READY | CONTROLLED | PLANNED |
| `content:mystery_dragon_roost:reveal` | `young_dragon_encounter` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-choice | 1 | 4–6s | young dragon | lion_sanctum_stage | READY | CONTROLLED | PLANNED |
| `content:serpent_informant:reveal` | `serpent_informant_encounter` | UNIQUE | MICRO | P1 | BEFORE_DIALOGUE | pre-choice | 1 | 4–6s | Serpent oracle | mystery_ambush | READY | STATIC_LOW | PLANNED |
| `content:mystery_shrine:reveal` | - | REUSE | MICRO | - | BEFORE_DIALOGUE | after elite, pre-choice | family | family | - | mystery_shrine | family | family | FAMILY_PLANNED |
| `content:ruins_guardians:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | - | family | family | - | lion_sanctum_stage | family | family | FAMILY_PLANNED |
| `content:serpent_hunters:reveal` | - | REUSE | JOURNEY | - | BEFORE_COMBAT | infamy/informant | family | family | - | lion_sanctum_stage | family | family | FAMILY_PLANNED |
| `content:serpent_captain:reveal` | `serpent_general_reveal` | APPROVED_EXISTING | MICRO | P0 | BEFORE_COMBAT | Serpent route selected | 1 | 8s | General | approved source | READY | CONTROLLED | APPROVED_EXISTING |
| `content:lion_chief:reveal` | `lion_champion_reveal` | APPROVED_EXISTING | MICRO | P0 | BEFORE_COMBAT | trial selected | 1 | 8s | champion | approved source | READY | CONTROLLED | APPROVED_EXISTING |
| `state:serpent_pursuit:ending` | `serpent_route_ending` | UNIQUE | HERO | P0 | ENDING | General defeated | 3–4 | 17–23s | Séraphine, General | epilogue | READY | ADVANCED | PLANNED |
| `state:lion_trial:ending` | `lion_trial_route_ending` | UNIQUE | HERO | P0 | ENDING | trial won | 3–4 | 17–23s | champion, Alaric | epilogue | READY | ADVANCED | PLANNED |
| `content:ate_alaric_reports:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | always | family | family | - | lion_briefing | family | family | HELD_CONTEXT |
| `content:ate_serpent_scout_report:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | Cedric patch | family | family | - | shadow_signs | family | family | HELD_CONTEXT |
| `content:ate_village_fear:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | always | family | family | - | refugee_trial | family | family | HELD_CONTEXT |
| `content:ate_first_refuge_watch:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | refugee/Cedric patches | family | family | - | lion_refuge | family | family | HELD_CONTEXT |
| `content:ate_serpent_general_warning:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | Cedric patch | family | family | - | shadow_signs | family | family | HELD_CONTEXT |
| `content:ate_maelor_seal_analysis:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | Bois-Clair/conduct | family | family | - | matching aftermath | family | family | HELD_CONTEXT |
| `content:ate_bois_clair_night_watch:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | Bois-Clair state | family | family | - | matching aftermath | family | family | HELD_CONTEXT |
| `content:ate_lion_council_doubt:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | witness state | family | family | - | lion_briefing | family | family | HELD_CONTEXT |
| `content:ate_ruins_awaken:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | fragments/evidence | family | family | - | shadow_signs | family | family | HELD_CONTEXT |
| `content:ate_serpent_retreat_order:context` | - | REUSE | MICRO | - | CHAPTER_BEAT | fragments/evidence | family | family | - | shadow_signs | family | family | HELD_CONTEXT |
| `content:reputation:roadside-intimidation` | - | REUSE | MICRO | - | CHAPTER_BEAT | weighted unique | family | family | - | social road | family | family | HELD_CONTEXT |
| `content:reputation:brokered-information` | - | REUSE | MICRO | - | CHAPTER_BEAT | weighted unique | family | family | - | social road | family | family | HELD_CONTEXT |
| `content:reputation:public-petition` | - | REUSE | MICRO | - | CHAPTER_BEAT | weighted unique | family | family | - | social road | family | family | HELD_CONTEXT |
| `content:reputation:bois-clair-denunciation` | - | REUSE | MICRO | - | CHAPTER_BEAT | negative history | family | family | - | neutral social road | family | family | HELD_CONTEXT |
| `content:reputation:refuge-supply-offer` | - | REUSE | MICRO | - | CHAPTER_BEAT | first window | family | family | - | first refuge | family | family | HELD_CONTEXT |
| `content:reputation:serpent-rumour-market` | - | REUSE | MICRO | - | CHAPTER_BEAT | first/second window | family | family | - | social road | family | family | HELD_CONTEXT |
| `content:reputation:fallen-banner-claimant` | - | REUSE | MICRO | - | CHAPTER_BEAT | final window | family | family | - | finale context | family | family | HELD_CONTEXT |
| `content:reputation:village-memorial-request` | - | REUSE | MICRO | - | CHAPTER_BEAT | saved only | family | family | - | neutral social road | family | family | HELD_CONTEXT |
| `content:reputation:displaced-family-demand` | - | REUSE | MICRO | - | CHAPTER_BEAT | negative facts | family | family | - | neutral social road | family | family | HELD_CONTEXT |

## 14. P0 ordered targets including reuse (20)

Ordered library targets (state variants and owned families are shown as actual media targets):

1. `forest_journey_tension` — **REUSE_FAMILY**
2. `camp_departure` — **UNIQUE**
3. `alaric_audience_arrival` — **UNIQUE**
4. `refugees_approach` — **UNIQUE**
5. `first_refuge_arrival` — **UNIQUE**
6. `first_refuge_departure` — **UNIQUE**
7. `valmir_route_fork` — **UNIQUE**
8. `bois_clair_arrival` — **UNIQUE**
9. `bois_clair_saved` — **STATE_VARIANT**
10. `bois_clair_sacrificed` — **STATE_VARIANT**
11. `second_refuge_departure` — **UNIQUE**
12. `witnesses_encounter` — **UNIQUE**
13. `ruins_approach_context` — **REUSE_FAMILY**
14. `shadow_signs` — **UNIQUE**
15. `final_refuge_dossier` — **UNIQUE**
16. `lion_judgement` — **APPROVED_EXISTING**; verify only
17. `serpent_general_reveal` — **APPROVED_EXISTING**; verify only
18. `lion_champion_reveal` — **APPROVED_EXISTING**; verify only
19. `serpent_route_ending` — **UNIQUE**
20. `lion_trial_route_ending` — **UNIQUE**

## 15. P1 ordered targets including reuse (11)

1. `cedric_encounter` — **UNIQUE**
2. `garen_encounter` — **UNIQUE**
3. `serpent_road_tension` — **REUSE_FAMILY**
4. `shrine_reveal_context` — **REUSE_FAMILY**
5. `injured_merchant_encounter` — **UNIQUE**
6. `abandoned_cart_reveal` — **UNIQUE**
7. `spider_nest_reveal` — **UNIQUE**
8. `troll_crossing_reveal` — **UNIQUE**
9. `serpent_duelist_reveal` — **UNIQUE**
10. `young_dragon_encounter` — **UNIQUE**
11. `serpent_informant_encounter` — **UNIQUE**

## 16. P2 ordered targets including reuse (0)

No standalone P2 media is authorized. CIN-6D remains empty pending human review of P0/P1 rhythm. Optional overlays and detail plates are asset polish, not additional cinematic beats.

## 17. Reuse families

| Family | Backing | Tier/priority | Safe use |
|---|---|---|---|
| `forest_journey_tension` | own future video | JOURNEY/P0 | neutral forest/creature pressure |
| `bois_clair_road_tension` | `first_refuge_departure` last frame | JOURNEY/P0 source | road/marsh urgency before village truth |
| `serpent_road_tension` | own future video | JOURNEY/P1 | unnamed patrol/checkpoint pressure |
| `shrine_reveal_context` | own future video | MICRO/P1 | untouched shrine before choice |
| `ruins_approach_context` | own future video | JOURNEY/P0 | neutral ruins before evidence choice |
| `first_refuge_context` | first-refuge last frame | JOURNEY | refuge UI/ATE |
| `bois_clair_aftermath_context` | matching state-variant last frame | HERO | village ATE/dialogue, strict state match |
| `lion_council_context` | ready held still | MICRO | Lion report/doubt ATEs |
| `serpent_command_context` | ready held still | MICRO | Serpent report/retreat ATEs |
| `social_road_context` | ready held still | MICRO | all random social events except state-safe refuge/finale holds |
| `shadow_ruins_context` | Shadow Signs last frame | HERO | knowledge-aware dialogue, disclosure-neutral |
| `lion_finale_context` | judgement last frame | HERO | dynamic verdict/disclosure dialogue |

No family crosses incompatible visible state.

## 18. Bois-Clair plan

The central sequence is two-stage:

1. `bois_clair_arrival` — neutral 3–5-shot, 17–23-second HERO: road approach, smoke, burning village, families/Serpent pressure, party reaction, stable transition to `village_choice`. It does not show a selected objective.
2. `bois_clair_aftermath` — deterministic state family after combat victory:
   - `bois_clair_saved`: `missionSuccess=true` and not `missionGreed`; rescued families remain, stores may burn.
   - `bois_clair_sacrificed`: `missionGreed=true`; stores are secured while families are displaced/absent and there is no rescue celebration.

There is no invented third abandonment state. Contradictory legacy flags select the sacrificed visual because the decisive breach must not be erased. `village_defense` and `village_raid` remain tactical combats, with their own deterministic aftermath dialogue.

## 19. Shadow Signs plan

`shadow_signs` is one 3–4-shot, 17–23-second neutral HERO before DialogueView. It may show disturbed ruins, marks, artifact fragments in place, Serpent traces, Séraphine and Elara observing. It must not show whether the player preserves evidence or breaks fragments, and must never show the evidence disclosed to Alaric. `shadowEvidence`/`shadowFragments` are knowledge; `shadowRevealed`/`shadowConcealed` are disclosure. Dialogue and finale logic retain both distinctions.

## 20. Final Refuge plan

`final_refuge_dossier` is a 3–4-shot, 15–21-second HERO because the six-step current dialogue is the chapter's consequence ledger and final march, not a routine rest. It uses stable core story characters and neutral camp-gate geography. It remains a story node: no shop, healing, secure-loot, or camp-management affordance is added.

## 21. Finale plan

The deterministic finale resolver first owns route selection:

- recognition -> `serpent_captain` unless the verdict refuses it;
- voluntary trial or rejected claim -> `lion_chief`;
- trial selection wins contradictory legacy selection flags as a fail-safe.

`lion_judgement` remains the approved neutral pre-dialogue HERO. The two approved MICRO reveals play only after the route-specific pre-combat dialogue. `serpent_route_ending` shows the defeated General and recovered artifact without disclosing it to Alaric; `lion_trial_route_ending` shows the champion yielding and explicitly leaves the General unresolved. Dynamic aftermath/epilogue dialogue owns revealed/concealed/undecided distinctions and ending IDs.

## 22. Refuge plan

- First refuge: unique arrival -> stable interactive UI -> held-frame ATE/social context -> unique departure into `reserve_trail`.
- Second refuge: Bois-Clair state-specific arrival/aftermath -> stable interactive UI/night ATE -> state-neutral dawn departure.
- Final refuge: story-only HERO dossier; no interactive refuge mechanics.

## 23. Recruitment plan

`cedric_encounter` and `garen_encounter` are P1 MICRO clips using canonical `cedric.png` and `lancer.png`. Both show an encounter/offer before DialogueView. Neither implies the recruit joined. Dynamic party composition is not rendered; post-recruit optional lines remain DialogueView. `garen_encounter` also covers legacy `mystery_lancer_recruit` assignment at the final-event node.

## 24. Route-freeze plan

For each of the three true forks: moving sequence -> stable final frame -> route overlay -> player selects a real currently available RunNode -> authoritative `commitRunNodeChoice` validates and enters it -> selected content resolves. The movie contains no fake labels or decisions. Single-successor nodes are either documented future auto-continue candidates or explicit continue boundaries where refuge/story pacing requires acknowledgment.

## 25. Character asset matrix

The canonical root contains 52 verified full PNGs. Every character referenced by planned unique/state/approved media is READY:

| Character ID | Canonical file | Planned role(s) | Status |
|---|---|---|---|
| `alaric` | `public/assets/characters/pixel/full/alaric.png` | audience, judgement, trial ending | READY |
| `alistair` | `.../alistair.png` | departure, village reaction, refuge transitions | READY |
| `cedric` | `.../cedric.png` | recruit encounter | READY |
| `elara` | `.../elara.png` | Shadow Signs observation | READY |
| `forest_spider` | `.../forest_spider.png` | spider reveal | READY |
| `forest_troll_elite` | `.../forest_troll_elite.png` | troll reveal | READY |
| `kestrel` | `.../kestrel.png` | recruit counterpoint, road/fork geography | READY |
| `lancer` | `.../lancer.png` | Garen encounter | READY |
| `lion_champion` | `.../lion_champion.png` | audience, reveal, trial ending | READY |
| `maelor` | `.../maelor.png` | convoy, Bois-Clair, dossier, treasure | READY |
| `marian` | `.../marian.png` | refugees, refuges, witnesses | READY |
| `refugee_mother` | `.../refugee_mother.png` | refugees and Bois-Clair state | READY |
| `sage_seraphine` | `.../sage_seraphine.png` | departure, Shadow, dossier, Serpent ending | READY |
| `serpent_duelist_elite` | `.../serpent_duelist_elite.png` | elite reveal | READY |
| `serpent_general_boss` | `.../serpent_general_boss.png` | approved reveal and ending | READY |
| `serpent_oracle` | `.../serpent_oracle.png` | informant reveal | READY |
| `serpent_raider` | `.../serpent_raider.png` | Bois-Clair threat | READY |
| `survivor` | `.../survivor.png` | witnesses and merchant | READY |
| `villageoise` | `.../villageoise.png` | Bois-Clair arrival/aftermath | READY |
| `young_dragon_elite` | `.../young_dragon_elite.png` | dragon reveal | READY |

The structured census inventories all 52 exact IDs and the validator resolves every `root/<id>.png` path. Missing planned character assets: 0.

## 26. Environment asset matrix

All 22 current Lion-phase painted files are verified. The six combat/combat-stage assets cover `bois_clair_burning`, `forest_route`, and `lion_sanctum`. The 16 dialogue assets are:

`camp_departure`, `epilogue`, `forest_fork`, `lion_briefing`, `lion_finale_judgement`, `lion_refuge`, `mystery_ambush`, `mystery_help`, `mystery_recruit`, `mystery_shrine`, `mystery_treasure`, `refugee_trial`, `reserve_trail`, `shadow_signs`, `village_choice`, and `witnesses_on_road`.

| Requirement class | Count | Result |
|---|---:|---|
| actual ready Lion-phase environment files | 22 | READY |
| planned media entries intentionally reusing a safe existing environment | 6 | REUSE |
| missing blocking environment requirements | 0 | MISSING |

No tailored `old_shrine_event`, `mystery_dragon_roost`, `mystery_lancer_recruit`, `serpent_duelist_trial`, or `mystery_troll_crossing` file exists; the plan explicitly uses semantically safe ready stages rather than inventing filenames.

## 27. Asset gaps

All are optional, not production blockers:

| Cinematic | Asset type | Desired subject | Severity |
|---|---|---|---|
| `bois_clair_arrival` | overlay | modular smoke, embers, distant crowd | OPTIONAL |
| `bois_clair_aftermath` | prop layers | rescued-family and secured-store dressing | OPTIONAL |
| `abandoned_cart_reveal` | prop cutout | refugee-marked cart and sacks | OPTIONAL |
| `shadow_signs` | detail plate | isolated Shadow mark / Serpent artifact insert | OPTIONAL |

Existing environments and characters are sufficient to begin CIN-6. These gaps may improve parallax and inserts but must not block or mutate source art.

## 28. Facing and staging rules

Canonical master facing remains `SCREEN_RIGHT`. Multi-character scenes deliberately turn counterparts:

- authority/arrival: Alaric left facing right; arriving counterpart or champion right facing left;
- refugees/witnesses: story witness right facing left; party listener left facing right;
- named threats: threat right facing left toward the offscreen party;
- Shadow Signs: Séraphine left/rightward toward the marks; Elara right/leftward toward the artifact;
- dynamic party members remain offscreen, silhouetted, or implied.

Every planned character has explicit side, facing, look target and role in the JSON. CIN-6 shot specs will add exact coordinates/depth/action/camera.

## 29. State-variant decisions

Only Bois-Clair becomes `STATE_VARIANT`, because saved versus sacrificed materially changes who is present and what remains. Shadow evidence/fragments, witness state, conduct, Cedric/Garen presence, finale disclosure, reputation and mandate interpretation remain neutral footage plus deterministic DialogueView. This prevents combinatorial media growth and avoids leaking concealed truth.

## 30. Duration and shot targets

All 26 media entries have explicit ranges. The Bois-Clair aftermath entry expands into two 18-second planning targets. Shared owned-video families add 9s (forest), 8s (Serpent road), 5s (shrine), and 10s (ruins). Routine held contexts add no video seconds.

## 31. Audio intent

- MICRO: `SILENT_GAME_MUSIC` or `AMBIENCE_SFX_GAME_MUSIC`.
- JOURNEY: ambience/SFX may be authored later; game music remains external.
- HERO: `HERO_SCORE_LATER` where a deliberate offline score/stinger may add value.

No generated speech, lip sync, or audio implementation belongs in CIN-5. Existing approved media remains silent.

## 32. Projected media duration

| Scope | New planned | Including current approved |
|---|---:|---:|
| P0 | 239s | 272s |
| P0+P1 | 297s | 330s |
| full P0+P1+P2 | 297s | 330s |

P2 adds no standalone video. Golden path playback is 216s (3.6m); the longest plausible content-heavy path is approximately 244s (4.1m). Mutually exclusive branches are never double-counted in path pacing.

## 33. Projected media size

Using the current approved aggregate rate of 1,260,289.8788 bytes/s:

| Scope | Current-quality estimate | Approx. MiB |
|---|---:|---:|
| P0 new | 301,209,281 bytes | 287.3 MiB |
| P0 total | 342,798,847 bytes | 326.9 MiB |
| P0+P1 / full | 415,895,660 bytes | 396.6 MiB |
| illustrative optimized ship (60% of full) | 249,537,396 bytes | 238.0 MiB |

This is an empirical planning model, not a size guarantee. Motion, texture detail, grain and encoder settings can shift results materially. CIN-5 performs no re-encode.

## 34. Generation-complexity matrix

| Burden | Targets |
|---|---|
| LOW | recruit/merchant/treasure/informant MICROs, shrine family, existing-media verification |
| MEDIUM | forest/Serpent/ruins families, refuge and route-freeze JOURNEY clips, named elite reveals |
| HIGH | Bois-Clair arrival and both aftermath variants, Shadow Signs, Final Refuge, two route endings |

CIN-6 should begin with P0 SOURCE_READY low/medium targets, while intentionally producing Bois-Clair arrival and Shadow Signs early as quality gates.

## 35. Golden path

Deterministic QA seed: 42. Sequence:

`lion-camp` -> `lion-audience` -> `lion-opening-ambush` (`forest_ambush`) -> `lion-nomad-crossroads` -> `lion-refugees` -> `lion-first-trial-combat` (`spider_nest` under honour mandate) -> `lion-first-refuge` -> `lion-reserve-trail` -> `lion-valmir-road` (`road_to_valmir`) -> `lion-second-trial-event` (`old_shrine_event`) -> `lion-village-choice` (`village_defense`) -> `lion-second-refuge` -> `lion-lancer-recruit` -> `lion-witnesses` -> `lion-final-trial-combat` (`ruins_guardians`) -> `lion-shadow-signs` -> `lion-final-refuge` -> `lion-final-judgement` -> `serpent_captain`.

State profile: honour mandate; help refugees; prioritize village; preserve shrine; save Bois-Clair; protect witnesses; preserve and reveal Shadow evidence; claim recognition. Current effects make this profile reachable from the normal initial state. The 17 P0 playback targets total approximately 216 seconds. P1 encounter clips are optional quality additions and are not needed for vertical-route completeness.

## 36. CIN-6 recommended production batches

- CIN-6A — representative P0: forest family, camp departure, audience arrival, refugee/fork, first refuge arrival/departure, Valmir fork, Bois-Clair arrival quality gate, saved aftermath, second departure, witnesses/fork, ruins family, Shadow Signs quality gate, Final Refuge, verify judgement and General reveal, Serpent ending.
- CIN-6B — remaining P0: sacrificed Bois-Clair aftermath, verify Champion reveal, Lion Trial ending.
- CIN-6C — P1: Cedric, Garen, Serpent road and shrine families, merchant, cart, spider, troll, duelist, dragon, informant.
- CIN-6D — empty; authorize only after P0/P1 human pacing review.

The structured file contains the exact ordered target/action list, distinguishing target kinds (`UNIQUE`, `STATE_VARIANT`, `APPROVED_EXISTING`, `REUSE_FAMILY`) as well as actions (`PRODUCE`, `QUALITY_GATE_PRODUCE`, `VERIFY_ONLY`).

## 37. Runtime trigger intent

Future intents are metadata only: `JOURNEY_NODE`, `JOURNEY_EDGE`, `BEFORE_DIALOGUE`, `BEFORE_COMBAT`, `CHAPTER_BEAT`, `STATE_AFTERMATH`, `REFUGE_ARRIVAL`, `REFUGE_DEPARTURE`, and `ENDING`. Existing approved triggers remain exactly:

- beforeDialogue: `lion_finale_judgement -> lion_judgement`
- beforeCombat: `serpent_captain -> serpent_general_reveal`, `lion_chief -> lion_champion_reveal`
- afterCombat: empty
- chapterBeat: empty

The Journey production map remains empty. Preloads are limited to plausible immediate candidates; the whole library is never loaded at once.

## 38. Systems explicitly unchanged

GameApp behavior, RunSystem graph/adaptive selection, CinematicTriggers, JourneyPresentationResolver production map, CinematicPlayer, combat, dialogue choices/effects, Lion conduct/verdict/finale, ATE/reputation semantics, rewards, AI, skills, damage, GameState/save schema and TravelView production default are unchanged.

Fallback remains: specific clip -> compatible reuse family -> existing Dialogue/Combat/Travel presentation -> progression continues.

## 39. Tests

- Pre-edit cinematic regression gate: 10 files passed, 102 tests passed.
- Added CIN-5 census suite: 1 file passed, 75 tests passed.
- Final full-suite result: 87 files passed, 2,014 tests passed.
- Census validator: PASS — 64 entries; prioritized primary media entries P0/P1/P2 = 17/9/0; ordered targets including reuse P0/P1/P2 = 20/11/0; 21 route nodes, 3 forks, 15 adaptive IDs including legacy compatibility, 4 seeded IDs.
- Existing production media probe/hash validation: PASS for all three approved MP4s.

## 40. Typecheck

PASS: `npx tsc --noEmit` completed with no diagnostics.

## 41. Build

PASS: `npm run build` completed. Vite transformed 109 modules and emitted the production build. The existing large-chunk advisory remains informational.

## 42. Diff check

PASS: `git diff --check` returned no errors. The final worktree contains only the four expected untracked CIN-5 planning files.

Secret/provider audit: PASS. `.env.local` is not staged or modified; the four files contain no credential assignment, MiniMax/FAL provider endpoint, or general URL; no production media/source frame/candidate/generation metadata was created; MiniMax was not called; cost is $0.

## 43. Known limitations

- This is production design, not runtime integration; trigger intents and preload groups are unimplemented.
- Duration/size values are midpoint estimates based on only three approved clips.
- Reused painted environments may benefit from four optional overlay/prop/detail assets.
- Dynamic player party membership is deliberately not reproduced in pre-generated video.
- Human visual review remains mandatory during CIN-6, especially for multi-shot HERO continuity and state-readable Bois-Clair variants.
- P2 is intentionally empty until P0/P1 pacing is observed in the actual Journey runtime.

## 44. READY_FOR_CIN_6 verdict

YES. The census defines identities, tiers, priorities, runtime intent, assets, state conditions, shot/duration ranges, fallbacks, preload groups, footprint and production ordering for every P0 target and both finale routes. There are no blocking source assets; all remaining gaps are optional polish.

## 45. Commit/push status

- Commit: NO
- Push: NO
- CIN-6 production started: NO
- New media generated: NO
- MiniMax API called: NO
- Video generation cost: $0
