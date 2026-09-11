# CIN-6D — Player-facing campaign timeline

This document describes what the player sees and decides. Each change of place or activity receives a new scene before the next dialogue, choice, or combat.

## A. Opening → Audience → opening combat

1. **Opening clan presentation — DIALOGUE.** The six-character company tableau introduces the fallen lineage and current companions.
2. **Camp departure — DEPARTURE/TRAVEL.** `camp_departure` shows the company leaving the Lion camp; Continue is the only agency.
3. **Alaric's Audience — ARRIVAL.** `alaric_audience_arrival` establishes Alaric, the company, and the Lion chamber.
4. **Audience exchange — DIALOGUE.** `lion_briefing` keeps Maelor associated with the left clan lane and Alaric with the right authority lane.
5. **Mandate — DECISION.** The player either accepts Alaric's mission on Alaric's right side or asks for an advance on Maelor's left side. Canonical effects remain unchanged.
6. **Company back on the road — DEPARTURE/TRAVEL.** The Audience hold releases. `AUDIENCE_ROAD_DEPARTURE_TABLEAU` shows Seraphine, Alistair, and Maelor in the forest, without Alaric or the throne room.
7. **Danger emerges — THREAT/PRE_COMBAT.** `forest_journey_tension` and `pre_opening_trail` establish the active forest danger.
8. **Opening battle — COMBAT.** The seeded encounter is `forest_ambush` or `wolf_pack`.
9. **Road reopened — POST_COMBAT/AFTERMATH.** `post_opening_trail` returns directly to NarrativeStage before the next journey boundary.

## B. First adaptive branch → first refuge

1. **Cedric at the crossroads — ENCOUNTER/DIALOGUE.** `cedric_encounter` leads to `mystery_recruit`; Cedric and Kestrel are staged before recruitment is decided.
2. **Recruitment — DECISION.** Recruit adds Cedric to the authoritative roster; decline leaves him outside the company. Both routes receive their own closing exchange.
3. **Refugees on the road — ENCOUNTER/DIALOGUE/DECISION.** `refugees_approach` and `refugee_trial` establish families in need, then record help or exploitation.
4. **First adaptive fork — DECISION.** The player selects the event route or combat route.
5. **Event-heavy route.** `mystery_help` or `mystery_treasure` establishes the current person/object, presents its moral choice, records the result, then releases the tableau.
6. **Combat-heavy route.** `spider_nest`, `forest_patrol`, or `serpent_reprisals` establishes a threat, plays the correct pre-combat dialogue, enters combat, and returns to its own aftermath.
7. **First refuge — REFUGE_ARRIVAL.** The current road scene releases before `first_refuge_arrival`.

## C. First refuge → Valmir fork

1. **Refuge management — REFUGE_MANAGEMENT.** Rest, shop, skills, and company management remain gameplay-owned.
2. **Leave the refuge — REFUGE_DEPARTURE.** `first_refuge_departure` establishes the company moving again.
3. **Reserve trail — TRAVEL/ENCOUNTER/DIALOGUE/DECISION.** `reserve_trail` presents the convoy decision and records village or loot priority.
4. **Road to Valmir — THREAT/PRE_COMBAT/COMBAT/POST_COMBAT.** `road_to_valmir` or `marsh_crossing` clears the immediate obstacle.
5. **Valmir fork — DECISION.** `valmir_route_fork` presents the old sanctuary on the left and the reinforced roadblock on the right. The selected screen lane enters the matching node.

## D. Second adaptive branch → Bois-Clair

1. **Event route — REVELATION/DIALOGUE/DECISION.** `old_shrine_event` presents the intact shrine before the player preserves or searches it.
2. **Combat route — THREAT/PRE_COMBAT/COMBAT/AFTERMATH.** `troll_crossing`, `serpent_checkpoint`, or `serpent_duelist_trial` receives the matching reveal, dialogue, battle, and result.
3. **Bois-Clair approach — ARRIVAL.** `bois_clair_arrival` replaces the selected road scene and establishes villagers, Serpent pressure, and the divided settlement.
4. **Village argument — DIALOGUE.** Villager, raider, advisers, and Alistair explain the two real objectives without resolving them in advance.
5. **Village order — DECISION.** Save the inhabitants or secure the reserves. Each choice starts its own combat and state history.

## E. Bois-Clair saved

1. **Save the inhabitants — DECISION.** `missionSuccess=true`; `missionGreed` remains false.
2. **Village defense — PRE_COMBAT/COMBAT.** `pre_village_defense` leads to `village_defense`.
3. **Saved aftermath — POST_COMBAT/AFTERMATH.** `bois_clair_saved` and `village_defense_aftermath` show a damaged but surviving village.
4. **Reactions.** ATE and reputation-event dialogue refer to the rescue. They never use the sacrificed-village version.
5. **Second refuge — REFUGE_ARRIVAL.** The saved aftermath releases before refuge activity.

## F. Bois-Clair sacrificed

1. **Secure the reserves — DECISION.** `missionSuccess=false`; `missionGreed=true`.
2. **Village raid — PRE_COMBAT/COMBAT.** `pre_village_raid` leads to `village_raid`.
3. **Sacrificed aftermath — POST_COMBAT/AFTERMATH.** `bois_clair_sacrificed` and `village_raid_aftermath` show the loss and its human cost.
4. **Reactions.** ATE and reputation-event dialogue preserve the sacrifice as a decisive fact. Public reputation cannot erase it.
5. **Second refuge — REFUGE_ARRIVAL.** The loss scene releases before refuge activity.

## G. Second refuge → Garen → witnesses

1. **Second refuge — REFUGE_MANAGEMENT.** Gameplay remains separate from the narrative route.
2. **Departure — REFUGE_DEPARTURE/TRAVEL.** `second_refuge_departure` returns the company to the road with a neutral composition valid for either Bois-Clair outcome.
3. **Garen — ENCOUNTER/DIALOGUE/DECISION.** `garen_encounter` leads to `mystery_lancer_recruit`. Recruiting adds the lancer only after the authoritative choice; asking him to remain at Bois-Clair does not.
4. **Witness camp — ARRIVAL/ENCOUNTER.** `witnesses_encounter` establishes survivors watching the company.
5. **Witness response — DIALOGUE/DECISION.** `witnesses_on_road` reflects the real Bois-Clair history. Protection, refusal, or silencing keeps its own consequence.
6. **Final adaptive fork — DEPARTURE/DECISION.** The witness tableau releases before the selected event-heavy or combat-heavy route.

## H. Final event-heavy branch

1. **Current encounter — ARRIVAL.** The selected event receives its own visual subject.
2. **Dragon route.** `young_dragon_encounter` and `mystery_dragon_roost` keep challenge/spare agency unresolved until the choice.
3. **Shrine route.** `mystery_shrine` presents its ancient site and current moral decision.
4. **Informant route.** `serpent_informant_encounter` and `serpent_informant` keep protection/betrayal unresolved; protection may hand off to `serpent_hunters` combat.
5. **Result — AFTERMATH/DEPARTURE.** The selected fact is recorded before the encounter scene releases.

## I. Final combat-heavy branch

1. **Ruins approach — ARRIVAL/THREAT.** `ruins_approach_context` establishes ancient pressure and the current enemy.
2. **Correct pre-combat exchange — PRE_COMBAT.** `ruins_guardians` or `serpent_hunters` receives its matching dialogue and cast ownership.
3. **Battle — COMBAT.** NarrativeStage fully releases before the tactical frame mounts.
4. **Result — POST_COMBAT/AFTERMATH.** The combat frame releases before the route-specific narrative returns.
5. **Continue to Shadow Signs — DEPARTURE.** The defeated-threat scene does not remain behind the revelation.

## J. Shadow Signs → final refuge

1. **Shadow Signs — ARRIVAL/REVELATION.** `shadow_signs` establishes the ruin marks as distinct from ordinary Serpent signs.
2. **Evidence choice — DECISION.** Preserve whole evidence or recover fragments. The display never upgrades fragments into definitive proof.
3. **Leave the ruins — DEPARTURE.** The revelation tableau releases.
4. **Final dossier — REFUGE_ARRIVAL/DIALOGUE.** `final_refuge_dossier` and `final_refuge` review the actual historical facts. This is a story scene, with no rest/shop refuge loop.
5. **March to judgement — REFUGE_DEPARTURE.** The dossier closes before Alaric's chamber appears.

## K. Serpent finale

1. **Alaric's judgement — ARRIVAL/JUDGEMENT/DIALOGUE.** `lion_judgement` weighs Bois-Clair, witnesses, conduct, and Shadow knowledge.
2. **Claim recognition — DECISION.** An accepted claim selects `serpent_pursuit` without changing the historical record.
3. **Serpent General — PRE_COMBAT/COMBAT.** `serpent_general_reveal` and `serpent_pursuit_pre_combat` lead to `serpent_captain`.
4. **Recovered truth — POST_COMBAT/ENDING.** `serpent_general_aftermath` and `serpent_route_ending` establish the defeated General and recovered evidence.
5. **Epilogue.** The route ends as `lion-seal-serpent` or `lion-seal-serpent-truth`, depending on disclosure truth.

## L. Voluntary Lion Trial

1. **Alaric's judgement — JUDGEMENT.** An honourable or otherwise acceptable dossier is presented accurately.
2. **Request the trial — DECISION.** The player explicitly selects the Lion's martial test; `lionTrialRequested=true`.
3. **Champion reveal — PRE_COMBAT.** `lion_champion_reveal` and `pre_lion_chief` state that the trial was requested.
4. **Lion Trial — COMBAT.** `lion_chief` resolves the martial claim.
5. **Recognition — POST_COMBAT/ENDING.** `lion_trial_aftermath` and `lion_trial_route_ending` honor the voluntary cause without claiming the Serpent General died.
6. **Epilogue.** The route ends as the appropriate `lion-seal-trial*` outcome.

## M. Non-voluntary Lion Trial

1. **Alaric's judgement — JUDGEMENT.** A decisive breach, unsupported record, or rejected claim is stated from the complete dossier.
2. **Claim recognition — DECISION.** The player asks for recognition, but the verdict rejects it; `lionTrialRequested` remains false.
3. **Imposed route — PRE_COMBAT.** `pre_lion_chief` states that recognition was refused and the martial path is the remaining route.
4. **Lion Trial — COMBAT.** `lion_chief` resolves the fail-forward path.
5. **Recognition by law — POST_COMBAT/ENDING.** The aftermath distinguishes an imposed trial from a requested one and keeps the Serpent General alive and at large.
6. **Epilogue.** The route ends as the appropriate `lion-seal-trial*` outcome.

## N. Epilogue

1. **Route-specific ending frame — ENDING.** Serpent and Lion Trial presentations remain exclusive.
2. **Final dialogue — EPILOGUE.** `epilogue` reflects the boss victory, Shadow evidence/disclosure, and trial cause.
3. **Chapter closure.** Exactly one `finishChapter` effect writes the matching ending id.
4. **Terminal boundary.** The final narrative surface releases cleanly; no combat frame, held dialogue, route choice, or prior scene remains active.
