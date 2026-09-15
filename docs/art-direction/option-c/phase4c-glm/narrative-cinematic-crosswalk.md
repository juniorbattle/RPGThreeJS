# Narrative / Cinematic Crosswalk

Status: **CURRENT_TARGET_AUDIT**
Authority: `docs/art-direction/option-c/narrative-presentation-doctrine.md`

This crosswalk audits consistency between:
1. **NarrativePresentationDoctrine** (`src/cinematics/NarrativePresentationDoctrine.ts`) — the current planning authority.
2. **CinematicReductionPolicy** (`src/cinematics/CinematicReductionPolicy.ts`) — historical reduction classifications.
3. **Final presentation/runtime registry** (`FinalPresentationRegistry.generated.ts`, `FinalDialoguePresentation.generated.ts`).

The new doctrine is the **current planning authority**. Historical reduction
classifications describe **previous implementation decisions**. They are not
silently reinterpreted. Where the doctrine differs from historical policy,
the difference is classified as `CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY`.

No cinematics were generated. No validator is added — the differences are
intentional compositional model differences (a beat may have BOTH a cinematic
layer AND be combat-owned), not real contradictions. Forcing old historical
policy to override current doctrine would be incorrect.

---

## Mapping model

The CinematicReductionPolicy is keyed by media/cinematic id (e.g.
`camp_departure`). The doctrine is keyed by beatId (e.g. `media:camp_departure`).
The crosswalk maps `media:<key>` → `<key>` for each media beat.

| CinematicReductionPolicy classification | Doctrine equivalent |
|---|---|
| KEEP_MAJOR_VIDEO | cinematicRequirement=REQUIRED, cinematicTier=MAJOR |
| OPTIONAL_VIDEO | cinematicRequirement=OPTIONAL, cinematicTier=QUICK |
| CONVERT_TO_STATIC_TABLEAU | primaryInteractiveMode=STATIC_TABLEAU, cinematicRequirement=NONE (or OPTIONAL/QUICK if doctrine elevates) |
| CONVERT_TO_TRAVEL_STILL | primaryInteractiveMode=TRAVEL_STILL, cinematicRequirement=NONE (or OPTIONAL/QUICK if doctrine elevates) |
| CONVERT_TO_HOLD_STILL | cinematicRequirement=NONE |
| COMBAT_OWNED | combatOutcome=REQUIRED/CONDITIONAL; cinematic layer may still exist (compositional) |
| LEGACY_UNUSED | cinematicRequirement=NONE |

---

## Consistent beats (doctrine matches historical policy)

| Beat | Historical | Doctrine | Status |
|---|---|---|---|
| media:camp_departure | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:alaric_audience_arrival | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:refugees_approach | OPTIONAL_VIDEO | OPTIONAL/QUICK | CONSISTENT |
| media:abandoned_cart_reveal | OPTIONAL_VIDEO | OPTIONAL/QUICK | CONSISTENT |
| media:young_dragon_encounter | OPTIONAL_VIDEO | OPTIONAL/QUICK | CONSISTENT |
| media:first_refuge_arrival | OPTIONAL_VIDEO | OPTIONAL/QUICK | CONSISTENT |
| media:first_refuge_departure | CONVERT_TO_TRAVEL_STILL | NONE/NONE | CONSISTENT |
| media:valmir_route_fork | CONVERT_TO_TRAVEL_STILL | NONE/NONE | CONSISTENT |
| media:bois_clair_arrival | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:bois_clair_saved | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:bois_clair_sacrificed | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:second_refuge_departure | CONVERT_TO_TRAVEL_STILL | NONE/NONE | CONSISTENT |
| media:shadow_signs | CONVERT_TO_STATIC_TABLEAU | NONE/NONE | CONSISTENT |
| media:witnesses_encounter | CONVERT_TO_STATIC_TABLEAU | NONE/NONE | CONSISTENT |
| media:ruins_approach_context | CONVERT_TO_HOLD_STILL | NONE/NONE | CONSISTENT |
| media:final_refuge_dossier | CONVERT_TO_STATIC_TABLEAU | NONE/NONE | CONSISTENT |
| media:serpent_route_ending | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:lion_trial_route_ending | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:lion_judgement | KEEP_MAJOR_VIDEO | REQUIRED/MAJOR | CONSISTENT |
| media:shrine_reveal_context | OPTIONAL_VIDEO | OPTIONAL/QUICK | CONSISTENT |
| media:serpent_road_tension | COMBAT_OWNED | NONE/NONE | CONSISTENT |
| media:serpent_informant_encounter | CONVERT_TO_STATIC_TABLEAU | NONE/NONE | CONSISTENT |
| media:qa-placeholder | LEGACY_UNUSED | NONE/NONE | CONSISTENT |

---

## CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY

These differences are **intentional**. The doctrine is compositional: a beat
may carry a cinematic layer (OPTIONAL/REQUIRED) AND still be combat-owned or
converted to a still surface. The historical reduction policy assigned a
single mutually-exclusive classification; the doctrine does not. The doctrine
wins as the current planning authority.

| Beat | Historical | Doctrine | Classification |
|---|---|---|---|
| media:forest_journey_tension | CONVERT_TO_TRAVEL_STILL | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:cedric_encounter | CONVERT_TO_STATIC_TABLEAU | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:injured_merchant_encounter | CONVERT_TO_STATIC_TABLEAU | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:spider_nest_reveal | COMBAT_OWNED | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:serpent_duelist_reveal | COMBAT_OWNED | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:troll_crossing_reveal | COMBAT_OWNED | OPTIONAL/QUICK | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:serpent_general_reveal | COMBAT_OWNED | REQUIRED/MAJOR (main event) | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |
| media:lion_champion_reveal | COMBAT_OWNED | REQUIRED/MAJOR (main event) | CURRENT_TARGET_DIFFERS_FROM_HISTORICAL_POLICY |

### Notes on the combat-owned main events

`serpent_general_reveal` and `lion_champion_reveal` are classified by the
doctrine as main events with REQUIRED/MAJOR cinematics played BEFORE their
boss combats (see `combat:serpent_captain` and `combat:lion_chief` doctrine
entries). The historical reduction policy marked them COMBAT_OWNED, meaning
the video belonged to the combat handoff. The doctrine retains the
combat-owned relationship (the reveal precedes the boss combat) but elevates
the reveal itself to a main-event cinematic. This is intentional and not a
contradiction — the compositional model allows a cinematic layer to belong to
a combat beat while still being a main event.

---

## Runtime registry consistency

The final presentation/runtime registry (`FinalPresentationRegistry.generated.ts`)
and dialogue presentation plans (`FinalDialoguePresentation.generated.ts`)
remain the runtime execution layer. The doctrine is a planning-layer contract
that complements (not replaces) them. The runtime invariants
(`DIALOGUE_STEPS_ON_VIDEO=0`, `DIALOGUE_STEPS_ON_HOLD=0`, `CHOICE_STEPS_ON_HOLD=0`)
are restated by the doctrine as `DOCTRINE_INVARIANTS` and enforced by
`RuntimePresentationStepCensus` and `NarrativeStagingAudit`. No runtime
registry was modified in this mission.

---

## Validator decision

No new validator is added. The differences above are intentional
compositional-model differences, not real contradictions. The existing
`validateNarrativePresentationDoctrine` validator enforces the doctrine
invariants (main event → REQUIRED, prologue/epilogue → REQUIRED, no
duplicate beatIds). Adding a crosswalk validator that forced historical
reduction classifications to override current doctrine would be incorrect.
