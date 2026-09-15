# Demo Presentation + Cinematic Scope Matrix

Status: **Phase 4C-GLM.3 - Narrative Presentation Doctrine Lock**
Authority: `docs/art-direction/option-c/narrative-presentation-doctrine.md`
Machine contract: `src/cinematics/NarrativePresentationDoctrine.ts`

This matrix replaces the former "Demo Cinematic Scope" census with a compositional model. Beats are NOT classified by a single mutually-exclusive Type column. Each beat has a `primaryInteractiveMode`, `mainEvent` flag, `cinematicRequirement`, `cinematicTier`, `cinematicPlacement`, and `combatOutcome`.

Use `TBD` where intentionally unresolved. Do not invent missing narrative decisions.

---

## Summary

| Metric | Count |
|---|---|
| Total doctrine beats | 96 |
| Main events | 17 |
| Cinematic REQUIRED | 17 |
| Cinematic OPTIONAL | 18 |
| Cinematic NONE | 61 |
| Combat REQUIRED | 10 |
| Combat CONDITIONAL | 7 |
| Combat NONE | 79 |
| Cinematic MAJOR | 10 |
| Cinematic QUICK | 12 |
| Cinematic TBD | 13 |
| Cinematic NONE (tier) | 61 |

---

## Prologue / Opening

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:camp_departure` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Prologue opening - company leaves the fallen camp |
| `dialogue:acte_ouverture` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Opening camp dialogue |
| `dialogue:camp_departure` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Camp departure dialogue |

## Alaric Audience

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:alaric_audience_arrival` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Major court entrance and Audience ceremony |
| `dialogue:lion_briefing` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Alaric briefing - mission choice. Main event dialogue |

## Forest Road / Opening Ambush

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:forest_journey_tension` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Atmospheric forest tension before opening combat |
| `combat:forest_ambush` | NONE | NO | NONE | NONE | TBD | REQUIRED | Opening ambush combat node |
| `combat:wolf_pack` | NONE | NO | NONE | NONE | TBD | REQUIRED | Wolf pack combat node |
| `dialogue:post_opening_trail` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post-opening-ambush dialogue |

## Cedric Recruitment

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:cedric_encounter` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Cedric encounter reveal before recruitment dialogue |
| `dialogue:mystery_recruit` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Cedric recruitment - character moment with choice |

## Refugees

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:refugees_approach` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Refugee arrival reveal |
| `dialogue:refugee_trial` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Refugee moral choice - major story moment |

## First Trial (Event / Combat Branch)

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:mystery_help` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | NONE | Injured merchant - aid decision |
| `media:injured_merchant_encounter` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Injured merchant reveal |
| `dialogue:mystery_treasure` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | NONE | Abandoned cart - inspection dialogue |
| `media:abandoned_cart_reveal` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Abandoned cart reveal |
| `combat:forest_patrol` | NONE | NO | NONE | NONE | TBD | REQUIRED | Forest patrol combat node |
| `combat:spider_nest` | NONE | NO | NONE | NONE | TBD | REQUIRED | Spider nest combat node |
| `media:spider_nest_reveal` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Spider nest reveal - combat-owned |
| `dialogue:post_spider_nest` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post spider nest dialogue |
| `combat:serpent_reprisals` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Serpent reprisals - triggered by dialogue startCombat |
| `dialogue:post_serpent_reprisals` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post serpent reprisals dialogue |
| `dialogue:post_serpent_patrol` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post serpent patrol dialogue |

## First Refuge

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:first_refuge_arrival` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | First refuge arrival |
| `media:first_refuge_departure` | NONE | NO | NONE | NONE | TBD | NONE | Converted to travel still |
| `dialogue:forest_refuge` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | First refuge management dialogue |

## Valmir Road

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:valmir_route_fork` | NONE | NO | NONE | NONE | TBD | NONE | Converted to travel still |
| `combat:marsh_crossing` | NONE | NO | NONE | NONE | TBD | REQUIRED | Marsh crossing combat node |
| `combat:road_to_valmir` | NONE | NO | NONE | NONE | TBD | REQUIRED | Road to Valmir combat node |

## Bois-Clair Siege (Major World Event)

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:bois_clair_arrival` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Bois-Clair burning - major world-state reveal |
| `dialogue:village_choice` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | CONDITIONAL | Bois-Clair siege choice - leads to conditional combat |
| `combat:village_defense` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Village defense - triggered by village_choice |
| `combat:village_raid` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Village raid - triggered by village_choice |
| `media:bois_clair_saved` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Bois-Clair saved - major rescue outcome |
| `media:bois_clair_sacrificed` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Bois-Clair sacrificed - major failure outcome |

## Second Trial Combat

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `combat:serpent_checkpoint` | NONE | NO | NONE | NONE | TBD | REQUIRED | Serpent checkpoint combat node |
| `dialogue:post_serpent_checkpoint` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post serpent checkpoint dialogue |
| `combat:serpent_duelist_trial` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Serpent duelist - triggered by dialogue choice |
| `media:serpent_duelist_reveal` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Serpent duelist reveal - combat-owned |
| `dialogue:post_serpent_duelist_trial` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post serpent duelist dialogue |
| `combat:troll_crossing` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Troll crossing - triggered by dialogue choice |
| `media:troll_crossing_reveal` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Troll crossing reveal - combat-owned |
| `dialogue:mystery_troll_crossing` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | CONDITIONAL | Troll crossing dialogue with combat choice |

## Garen Recruitment

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:garen_encounter` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Garen encounter reveal before recruitment dialogue |
| `dialogue:mystery_lancer_recruit` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Garen recruitment - character moment with contest |

## Final Trial

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:mystery_shrine` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | NONE | Shrine choice dialogue |
| `media:shrine_reveal_context` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Shrine reveal context |
| `dialogue:old_shrine_event` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | NONE | Old shrine event dialogue |
| `dialogue:mystery_dragon_roost` | STATIC_TABLEAU | NO | OPTIONAL | TBD | TBD | CONDITIONAL | Dragon roost dialogue with combat choice |
| `media:young_dragon_encounter` | NONE | NO | OPTIONAL | QUICK | TBD | NONE | Young dragon encounter reveal |
| `combat:young_dragon_roost` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Young dragon roost - triggered by dialogue choice |
| `combat:ruins_guardians` | NONE | NO | NONE | NONE | TBD | REQUIRED | Ruins guardians combat node |
| `dialogue:post_ruins_guardians` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post ruins guardians dialogue |
| `combat:serpent_hunters` | NONE | NO | NONE | NONE | TBD | CONDITIONAL | Serpent hunters - triggered by dialogue choice |
| `dialogue:post_serpent_hunters` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Post serpent hunters dialogue |

## Shadow Signs / Witnesses

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:shadow_signs` | NONE | NO | NONE | NONE | TBD | NONE | Converted to static tableau |
| `media:witnesses_encounter` | NONE | NO | NONE | NONE | TBD | NONE | Converted to static tableau |
| `media:ruins_approach_context` | NONE | NO | NONE | NONE | TBD | NONE | Converted to hold still |
| `media:final_refuge_dossier` | NONE | NO | NONE | NONE | TBD | NONE | Converted to static tableau |

## Final Refuge

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:final_refuge` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Final refuge dossier - major pre-finale discussion |

## Finale / Judgement

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:lion_judgement` | NONE | YES | REQUIRED | MAJOR | BEFORE | NONE | Lion judgement - major climax video |
| `dialogue:lion_finale_judgement` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Lion finale judgement dialogue with choice |
| `media:serpent_general_reveal` | NONE | YES | REQUIRED | MAJOR | BEFORE | NONE | Serpent general reveal - combat-owned boss entrance |
| `media:lion_champion_reveal` | NONE | YES | REQUIRED | MAJOR | BEFORE | NONE | Lion champion reveal - combat-owned boss entrance |
| `combat:serpent_captain` | NONE | YES | REQUIRED | MAJOR | BEFORE | REQUIRED | Serpent Pursuit boss combat. Cinematic layer is serpent_general_reveal |
| `combat:lion_chief` | NONE | YES | REQUIRED | MAJOR | BEFORE | REQUIRED | Lion Trial boss combat. Cinematic layer is lion_champion_reveal |

## Route Endings (Major)

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:serpent_route_ending` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Serpent route climax and ending-state spectacle |
| `media:lion_trial_route_ending` | NONE | YES | REQUIRED | MAJOR | TBD | NONE | Lion Trial route climax and recognition ceremony |
| `dialogue:lion_trial_aftermath` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Lion trial aftermath dialogue |
| `dialogue:serpent_general_aftermath` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Serpent general aftermath dialogue |

## Epilogue

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:epilogue` | STATIC_TABLEAU | YES | REQUIRED | TBD | TBD | NONE | Epilogue - Sage Seraphine closing. Cinematic required |

## ATE (Adversarial Tale Events)

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:ate_alaric_reports` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_bois_clair_night_watch` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_first_refuge_watch` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_lion_council_doubt` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_maelor_seal_analysis` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_ruins_awaken` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_serpent_general_warning` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_serpent_retreat_order` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_serpent_scout_report` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |
| `dialogue:ate_village_fear` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | ATE |

## Reputation Events

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:rep_event_bois_clair_denunciation` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_brokered_information` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_displaced_family_demand` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_fallen_banner_claimant` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_public_petition` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_refuge_supply_offer` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_roadside_intimidation` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_serpent_rumour_market` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |
| `dialogue:rep_event_village_memorial_request` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Reputation event |

## Travel Boundaries (Edges)

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `edge:lion-camp>lion-audience` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-audience>lion-opening-ambush` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-opening-ambush>lion-nomad-crossroads` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-nomad-crossroads>lion-refugees` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-refugees>lion-first-trial-event` | NONE | NO | NONE | NONE | TBD | NONE | Route decision boundary - hold |
| `edge:lion-refugees>lion-first-trial-combat` | NONE | NO | NONE | NONE | TBD | NONE | Route decision boundary - hold |
| `edge:lion-first-trial-event>lion-first-refuge` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-first-trial-combat>lion-first-refuge` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-first-refuge>lion-reserve-trail` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |
| `edge:lion-reserve-trail>lion-valmir-road` | TRAVEL_STILL | NO | NONE | NONE | TBD | NONE | Travel boundary |

## Remaining Media Beats

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `media:serpent_road_tension` | NONE | NO | NONE | NONE | TBD | NONE | Combat-owned enemy reveal |
| `media:second_refuge_departure` | NONE | NO | NONE | NONE | TBD | NONE | Converted to travel still |
| `media:serpent_informant_encounter` | NONE | NO | NONE | NONE | TBD | NONE | Converted to static tableau |
| `media:qa-placeholder` | NONE | NO | NONE | NONE | TBD | NONE | Legacy unused |

## Remaining Dialogue Beats

| Beat | Primary Interactive Mode | Main Event | Cinematic Requirement | Cinematic Tier | Cinematic Placement | Combat Outcome | Notes |
|---|---|---|---|---|---|---|---|
| `dialogue:mystery_ambush` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Legacy compatibility dialogue |
| `dialogue:mystery_troll_crossing_legacy` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Legacy compatibility dialogue |
| `dialogue:serpent_duelist_trial_legacy` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Legacy compatibility dialogue |
| `dialogue:witnesses_on_road` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Witnesses on road dialogue |
| `dialogue:shadow_signs` | STATIC_TABLEAU | NO | NONE | NONE | TBD | NONE | Shadow signs dialogue |

---

## Doctrine Invariants

```
DIALOGUE_STEPS_ON_VIDEO = 0
DIALOGUE_STEPS_ON_HOLD = 0
CHOICE_STEPS_ON_HOLD = 0
```

These are enforced by the existing runtime:
- `RuntimePresentationStepCensus.ts`
- `NarrativeStagingAudit.ts`

The doctrine contract (`NarrativePresentationDoctrine.ts`) restates these as `DOCTRINE_INVARIANTS` for reference and validates the planning-layer rules.

