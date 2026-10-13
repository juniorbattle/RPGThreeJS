# CIN-6D — Final cinematic remaster queue for CIN-6E

## Planning status

This is a plan only. CIN-6D generated no image or video and modified no production media. Current hashes, durations, source metadata, state conditions, and recommendations are machine-readable in `tools/cinematics/specs/final_cinematic_remaster_queue.json`.

The queue classifies all 31 production masters plus one newly identified required beat:

| Disposition | Count |
|---|---:|
| `KEEP_AS_IS` | 14 |
| `REMASTER_VISUAL` | 12 |
| `REPLACE_BY_REUSE` | 5 |
| `NEW_MEDIA_REQUIRED` | 1 |
| `TRIM_OR_REASSEMBLE` | 0 |
| `PRESENTATION_FIX_ONLY` | 0 |
| `REMOVE_FROM_RUNTIME` | 0 |
| `REVIEW` | 0 |

Gold references for CIN-6E are `alaric_audience_arrival`, `camp_departure`, and `valmir_route_fork`.

## Keep as is — 14 production masters

| Runtime id | Beat and purpose | Cast and location | Entry → exit | Current status, disposition, CIN-6E action |
|---|---|---|---|---|
| `camp_departure` | Company leaves the fallen camp; establishes travel toward Alaric. | Alistair, Seraphine; integrated camp departure. | opening complete → dialogue/journey | Production master; `KEEP_AS_IS`; retain integrated V3 departure grammar and reviewed company cast. |
| `alaric_audience_arrival` | Approach to Alaric's Audience; establishes authority and chamber geography. | Alaric, Lion champion; Audience chamber. | before mandate → `lion_briefing` | Production master; `KEEP_AS_IS`; preserve accepted four-person Audience staging and semantic lanes. |
| `valmir_route_fork` | Road cleared; establishes two spatially distinct routes. | Kestrel with guaranteed company context; forest fork. | road combat resolved → route choice | Production master; `KEEP_AS_IS`; preserve left sanctuary/right roadblock geography. |
| `cedric_encounter` | Cedric at the crossroads before recruitment truth exists. | Cedric, Kestrel; forest crossroads. | pre-recruitment → `mystery_recruit` | Production master; `KEEP_AS_IS`; retain unresolved recruitment staging. |
| `garen_encounter` | Garen offers his lance before recruitment truth exists. | Garen; road beyond Bois-Clair. | pre-recruitment → `mystery_lancer_recruit` | Production master; `KEEP_AS_IS`; retain restrained recruitment focus. |
| `serpent_road_tension` | Neutral Serpent pressure before a road combat. | Threat-family staging; forest road. | pre-combat → combat | Production master; `KEEP_AS_IS`; retain for its approved four combat mappings. |
| `shrine_reveal_context` | Reveals an intact shrine before preserve/search agency. | Seraphine/contextual company; old shrine. | undecided shrine → `old_shrine_event` | Production master; `KEEP_AS_IS`; retain outcome-neutral shrine truth. |
| `injured_merchant_encounter` | Reveals the injured merchant and broken cart before aid agency. | Survivor; forest road. | before help/abandon → `mystery_help` | Production master; `KEEP_AS_IS`; retain living subject and unresolved choice. |
| `abandoned_cart_reveal` | Reveals the refugee cart before ownership is decided. | Maelor; abandoned convoy. | before return/claim → `mystery_treasure` | Production master; `KEEP_AS_IS`; retain current-truth cart composition. |
| `spider_nest_reveal` | Establishes the venomous nest before combat. | Forest spider; forest route. | pre-combat → `spider_nest` | Production master; `KEEP_AS_IS`; retain grounded unique threat reveal. |
| `troll_crossing_reveal` | Establishes the troll roadblock and stolen supplies. | Elite forest troll; bridge/forest route. | pre-combat → `troll_crossing` | Production master; `KEEP_AS_IS`; retain unique roadblock reveal. |
| `serpent_duelist_reveal` | Establishes the duelist and personal challenge. | Elite Serpent duelist; forest route. | before duel → dialogue/combat | Production master; `KEEP_AS_IS`; retain the unique reveal ahead of family reuse. |
| `young_dragon_encounter` | Reveals a living young dragon before challenge/spare agency. | Young dragon; ancient roost. | before decision → `mystery_dragon_roost` | Production master; `KEEP_AS_IS`; retain neutral creature state. |
| `serpent_informant_encounter` | Reveals a hunted informant before protection/betrayal. | Serpent oracle; hidden road camp. | before decision → `serpent_informant` | Production master; `KEEP_AS_IS`; retain the approved restrained candidate. |

## Remaster visual — 12 production masters

| Runtime id | Beat and purpose | Cast and location | Entry → exit | Current status, disposition, CIN-6E action |
|---|---|---|---|---|
| `lion_judgement` | Alaric weighs the complete dossier before route selection. | Alaric plus guaranteed company side; Lion judgement hall. | before final choice → dialogue | Production master; `REMASTER_VISUAL`, P0; integrate Lion authority and visible company representation. |
| `serpent_general_reveal` | Reveals the Serpent General for the pursuit route. | Serpent General; Shadow ruins battlefield. | Serpent route selected → combat | Production master; `REMASTER_VISUAL`, P1; integrate ground, light, and atmosphere without changing boss truth. |
| `lion_champion_reveal` | Reveals the Lion champion for the Trial route. | Lion champion; Lion martial ground. | Lion Trial selected → combat | Production master; `REMASTER_VISUAL`, P1; rebuild from an integrated Lion keyframe. |
| `refugees_approach` | Establishes refugee need before help/exploit agency. | Refugee mother, Marian, company; refugee road. | before decision → route choice | Production master; `REMASTER_VISUAL`, P1; integrate company and refugees while preserving unresolved agency. |
| `bois_clair_arrival` | Reveals the besieged village and divided objectives. | Villager, Serpent raider, Alistair; Bois-Clair. | before saved/sacrificed truth → dialogue | Production master; `REMASTER_VISUAL`, P0; integrate civilians, company, and Serpent pressure across coherent shots. |
| `bois_clair_saved` | Shows the village damaged but alive after defense. | Guaranteed company and survivors; Bois-Clair aftermath. | `missionSuccess=true` → continue | Production master; `REMASTER_VISUAL`, P1; create an integrated saved-state counterpart to the loss version. |
| `bois_clair_sacrificed` | Shows the human price of taking the reserves. | Guaranteed company and survivors; Bois-Clair aftermath. | `missionGreed=true` → continue | Production master; `REMASTER_VISUAL`, P1; create an integrated loss composition paired with the saved version. |
| `witnesses_encounter` | Establishes the witness camp before protection/silencing agency. | Survivor, Marian, company; witness road. | before witness truth → route choice | Production master; `REMASTER_VISUAL`, P1; integrate both sides and keep the final frame unresolved. |
| `shadow_signs` | Reveals evidence of an older Shadow influence. | Seraphine, Elara; ancient ruins. | before evidence/fragments → dialogue | Production master; `REMASTER_VISUAL`, P1; integrate actors and artefact while remaining neutral to later disclosure. |
| `final_refuge_dossier` | Reviews the actual dossier and prepares the march to Alaric. | Maelor, Seraphine, Alistair; final road camp. | story-only final refuge → dialogue | Production master; `REMASTER_VISUAL`, P0; include Marian or justify her counter-shot; preserve story-only behavior. |
| `serpent_route_ending` | Establishes Serpent victory, recovered artefact, and chapter closure. | Seraphine, defeated General, company; final battlefield. | `serpentGeneralDefeated=true` → ending | Production master; `REMASTER_VISUAL`, P1; integrate the company aftermath and recovered-object truth. |
| `lion_trial_route_ending` | Establishes Lion recognition after the champion falls. | Alaric, defeated champion, company representative; Lion ground. | `lionTrialWon=true` → ending | Production master; `REMASTER_VISUAL`, P0; integrate the earned outcome and keep the General alive/off-route. |

## Replace by reuse — 5 production masters

| Runtime id | Beat and purpose | Cast and location | Entry → exit | Current status, disposition, CIN-6E action |
|---|---|---|---|---|
| `forest_journey_tension` | Establishes neutral forest pressure before the active threat. | Guaranteed company; forest road. | company travelling → continue/threat | Production master; `REPLACE_BY_REUSE`, P0; replace with an integrated creature-neutral forest-threat family. |
| `first_refuge_arrival` | Establishes the first refuge before management. | Marian, Alistair; Lion refuge. | road complete → refuge | Production master; `REPLACE_BY_REUSE`, P1; use an integrated refuge-arrival family while management stays authoritative. |
| `first_refuge_departure` | Returns the company to the reserve trail. | Kestrel, Maelor; forest departure. | refuge Continue → road dialogue | Production master; `REPLACE_BY_REUSE`, P0; use a guaranteed-core single-route family with no optional recruit assumptions. |
| `second_refuge_departure` | Leaves the Bois-Clair night refuge. | Marian, Alistair; night road. | refuge Continue → journey | Production master; `REPLACE_BY_REUSE`, P1; use a neutral family valid for saved and sacrificed outcomes. |
| `ruins_approach_context` | Establishes ancient unease before the final branch. | Guaranteed company; Shadow ruins approach. | journey → continue/threat | Production master; `REPLACE_BY_REUSE`, P1; use a reusable integrated ruins-approach family. |

## New media required — 1 beat

| Runtime id | Beat and purpose | Cast and location | Entry → exit | Current status, disposition, CIN-6E action |
|---|---|---|---|---|
| `audience_road_departure` | DEPARTURE/TRAVEL; visibly releases Alaric's chamber and resumes the mission before danger appears. | Seraphine, **Alistair as Hero**, Maelor; forest road outside the Audience. | Audience choice applied → company travelling, opening threat may begin | No production master; `NEW_MEDIA_REQUIRED`, P0. Produce one integrated road-departure cinematic. Until then, keep `AUDIENCE_ROAD_DEPARTURE_TABLEAU` as the authoritative current-context static fallback. |

## CIN-6E production order

1. Produce `audience_road_departure` from the current static tableau and validated cast truth.
2. Remaster P0 judgement, Bois-Clair arrival, final dossier, and Lion Trial ending.
3. Replace the two P0 reusable transition families: forest tension and first-refuge departure.
4. Complete P1 outcome, witness, ruin, boss, and ending integrations.
5. Preserve all `KEEP_AS_IS` masters and re-run media hash, cast, route, hold-release, and browser ownership validation after any authorized media update.
