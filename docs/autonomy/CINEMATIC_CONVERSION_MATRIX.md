# Eight-slot cinematic conversion matrix

Source inventory: `dev @ 906fa99`, 2026-10-01. The historical manifest has 31 MP4 entries and one QA placeholder. The generated presentation registry has 29 `CINEMATIC_VIDEO` beats, 21 of them outside the [eight approved slots](../contracts/PRESENTATION_AND_MEDIA.md). This is the implementation map for the active cinematic task; it does not authorize new story content or claim the destination art is accepted.

| Proposed non-video surface | Retired production video IDs | Existing meaning to preserve |
| --- | --- | --- |
| Journey/travel still | `forest_journey_tension`, `first_refuge_arrival`, `first_refuge_departure`, `valmir_route_fork`, `second_refuge_departure`, `ruins_approach_context`, `shrine_reveal_context`, `abandoned_cart_reveal` | Route pacing, arrival, geography, environmental clue; preserve existing next-step agency. |
| Static tableau | `refugees_approach`, `witnesses_encounter`, `shadow_signs`, `final_refuge_dossier`, `cedric_encounter`, `garen_encounter`, `injured_merchant_encounter`, `young_dragon_encounter`, `serpent_informant_encounter` | Dialogue, NPC presence, choice and reactions; use canonical actors and dialogue IDs. |
| Combat-owned presentation | `serpent_general_reveal`, `lion_champion_reveal`, `serpent_road_tension`, `spider_nest_reveal`, `troll_crossing_reveal`, `serpent_duelist_reveal` | Encounter context belongs to canonical combat handoff/Combat Stage; no standalone video or added combat consequence. |

The `qa-placeholder` has no video source and belongs only to the isolated QA lab. It is not a ninth production video slot. The 23 retired MP4 assets above must remain in place until runtime, generated registry, hold references, tests, tools and evidence dependencies have been inventoried and migrated. Do not delete them by name alone.

The historical `tools/cinematics/specs/final_presentation_mode_audit.json` has 147 beats and generates `src/cinematics/FinalPresentationRegistry.generated.ts` with the old 29-video doctrine. Do not regenerate directly from that historical source. Create a new production specification or explicit production overlay, then migrate the 17 hold references to 13 non-approved video IDs while retaining their dialogue beat identities. Validate the eight-ID manifest and fallback behavior only after the conversion paths work.
