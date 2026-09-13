# CIN-6E-A.4R — Cinematic reduction audit

No existing media is deleted or rewritten. This classification determines presentation ownership under the static-tableau-first doctrine.

| Scope metric | Result |
| --- | --- |
| CURRENT_VIDEO_SLOT_COUNT | 31 |
| PROPOSED_CIN6EB_VIDEO_COUNT | 13 |
| Runtime video slots including combat-owned | 19 |
| STATIC_TABLEAU background contexts | 71 |
| HOLD still conversion slots | 1 |
| TRAVEL still conversion slots | 4 |
| Reusable environment plates | acte_ouverture_tableau_bg, post_opening_trail_tableau_bg |

| Classification | Slots |
| --- | --- |
| LEGACY_UNUSED | 1 |
| KEEP_MAJOR_VIDEO | 8 |
| COMBAT_OWNED | 6 |
| CONVERT_TO_TRAVEL_STILL | 4 |
| OPTIONAL_VIDEO | 5 |
| CONVERT_TO_STATIC_TABLEAU | 7 |
| CONVERT_TO_HOLD_STILL | 1 |

## Major cinematic whitelist

| KEEP_MAJOR_VIDEO | Story / visual justification |
| --- | --- |
| lion_judgement | Major judgement and route-climax ceremony. |
| camp_departure | Opening departure establishes the company and begins the Lion chapter. |
| alaric_audience_arrival | Major court entrance and Audience ceremony; all dialogue starts afterward. |
| bois_clair_arrival | Bois-Clair burning is a major physical event and world-state reveal. |
| bois_clair_saved | Major rescue outcome visibly changes the village state. |
| bois_clair_sacrificed | Major failure outcome visibly changes the village and refugee state. |
| serpent_route_ending | Route climax and ending-state spectacle. |
| lion_trial_route_ending | Route climax and Lion recognition ceremony. |

## Complete slot classification

| Cinematic slot | Classification | Criterion | Justification |
| --- | --- | --- | --- |
| qa-placeholder | LEGACY_UNUSED | LEGACY | Manifest-only QA placeholder with no production video source. |
| lion_judgement | KEEP_MAJOR_VIDEO | CLIMAX | Major judgement and route-climax ceremony. |
| serpent_general_reveal | COMBAT_OWNED | IMPORTANT_ENTRANCE | Boss entrance belongs to the combat handoff, never to dialogue. |
| lion_champion_reveal | COMBAT_OWNED | IMPORTANT_ENTRANCE | Champion entrance belongs to the combat handoff, never to dialogue. |
| forest_journey_tension | CONVERT_TO_TRAVEL_STILL | TRAVEL | Atmospheric movement is route texture rather than a major story action. |
| camp_departure | KEEP_MAJOR_VIDEO | IMPORTANT_ENTRANCE | Opening departure establishes the company and begins the Lion chapter. |
| alaric_audience_arrival | KEEP_MAJOR_VIDEO | IMPORTANT_ENTRANCE | Major court entrance and Audience ceremony; all dialogue starts afterward. |
| refugees_approach | OPTIONAL_VIDEO | IMPORTANT_ENTRANCE | The refugee arrival can retain motion as a brief encounter reveal before tableau dialogue. |
| first_refuge_arrival | OPTIONAL_VIDEO | WORLD_CHANGE | Arrival establishes a new refuge location before management and dialogue. |
| first_refuge_departure | CONVERT_TO_TRAVEL_STILL | TRAVEL | Route departure is travel continuity, not a dramatic action beat. |
| valmir_route_fork | CONVERT_TO_TRAVEL_STILL | TRAVEL | The fork is persistent route geography best held as a travel still. |
| bois_clair_arrival | KEEP_MAJOR_VIDEO | WORLD_CHANGE | Bois-Clair burning is a major physical event and world-state reveal. |
| bois_clair_saved | KEEP_MAJOR_VIDEO | MAJOR_RESCUE_FAILURE | Major rescue outcome visibly changes the village state. |
| bois_clair_sacrificed | KEEP_MAJOR_VIDEO | MAJOR_RESCUE_FAILURE | Major failure outcome visibly changes the village and refugee state. |
| second_refuge_departure | CONVERT_TO_TRAVEL_STILL | TRAVEL | Route departure is travel continuity, not a major dramatic action. |
| witnesses_encounter | CONVERT_TO_STATIC_TABLEAU | TALKING | The beat is witness testimony and decision context. |
| ruins_approach_context | CONVERT_TO_HOLD_STILL | SCENIC_PUNCTUATION | The ruins approach is dialogue-free environmental punctuation before danger. |
| shadow_signs | CONVERT_TO_STATIC_TABLEAU | TALKING | The core content is Seraphine and Elara interpreting evidence. |
| final_refuge_dossier | CONVERT_TO_STATIC_TABLEAU | TALKING | The dossier is a sustained company discussion and evidence review. |
| serpent_route_ending | KEEP_MAJOR_VIDEO | CLIMAX | Route climax and ending-state spectacle. |
| lion_trial_route_ending | KEEP_MAJOR_VIDEO | CLIMAX | Route climax and Lion recognition ceremony. |
| cedric_encounter | CONVERT_TO_STATIC_TABLEAU | TALKING | Recruitment negotiation is character dialogue. |
| garen_encounter | CONVERT_TO_STATIC_TABLEAU | TALKING | Recruitment negotiation is character dialogue. |
| serpent_road_tension | COMBAT_OWNED | IMPORTANT_ENTRANCE | Enemy reveal belongs to the following tactical-combat handoff. |
| shrine_reveal_context | OPTIONAL_VIDEO | MAJOR_REVEAL | The intact shrine is a compact environmental reveal before a tableau choice. |
| injured_merchant_encounter | CONVERT_TO_STATIC_TABLEAU | TALKING | The player-facing content is a conversation and aid decision. |
| abandoned_cart_reveal | OPTIONAL_VIDEO | MAJOR_REVEAL | The marked cart is a compact physical clue reveal before inspection dialogue. |
| spider_nest_reveal | COMBAT_OWNED | SPECTACLE | Creature reveal belongs to the tactical-combat setup. |
| troll_crossing_reveal | COMBAT_OWNED | IMPORTANT_ENTRANCE | Blocking creature entrance belongs to the tactical-combat setup. |
| serpent_duelist_reveal | COMBAT_OWNED | IMPORTANT_ENTRANCE | Duelist entrance belongs to the tactical-combat setup. |
| young_dragon_encounter | OPTIONAL_VIDEO | MAJOR_REVEAL | The living dragon and nest are an important reveal before the choice tableau. |
| serpent_informant_encounter | CONVERT_TO_STATIC_TABLEAU | TALKING | The informant beat is interrogation and protection/betrayal dialogue. |
