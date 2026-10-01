# Eight-slot cinematic conversion matrix

Source inventory: `dev @ 906fa99`, 2026-10-01. The historical manifest has 31 MP4 entries and one QA placeholder. The generated presentation registry has 29 `CINEMATIC_VIDEO` beats, 21 of them outside the [eight approved slots](../contracts/PRESENTATION_AND_MEDIA.md). This is the implementation map for the active cinematic task; it does not authorize new story content or claim the destination art is accepted.

| Proposed non-video surface | Retired production video IDs | Existing meaning to preserve |
| --- | --- | --- |
| Journey/travel still | `forest_journey_tension`, `first_refuge_arrival`, `first_refuge_departure`, `valmir_route_fork`, `second_refuge_departure`, `ruins_approach_context`, `shrine_reveal_context`, `abandoned_cart_reveal` | Route pacing, arrival, geography, environmental clue; preserve existing next-step agency. |
| Static tableau | `refugees_approach`, `witnesses_encounter`, `shadow_signs`, `final_refuge_dossier`, `cedric_encounter`, `garen_encounter`, `injured_merchant_encounter`, `young_dragon_encounter`, `serpent_informant_encounter` | Dialogue, NPC presence, choice and reactions; use canonical actors and dialogue IDs. |
| Combat-owned presentation | `serpent_general_reveal`, `lion_champion_reveal`, `serpent_road_tension`, `spider_nest_reveal`, `troll_crossing_reveal`, `serpent_duelist_reveal` | Encounter context belongs to canonical combat handoff/Combat Stage; no standalone video or added combat consequence. |

The `qa-placeholder` has no video source and belongs only to the isolated QA lab. It is not a ninth production video slot. The 23 retired MP4 assets above were moved byte-identically out of `public/` after their runtime, generated-registry, hold, test, tool and evidence dependencies were inventoried. Historical audits retain their original paths as dated facts; their files are in the archive documented below.

The historical `tools/cinematics/specs/final_presentation_mode_audit.json` has 147 beats and generates `src/cinematics/FinalPresentationRegistry.generated.ts` with the old 29-video doctrine. Do not regenerate directly from that historical source. Create a new production specification or explicit production overlay, then migrate the 17 hold references to 13 non-approved video IDs while retaining their dialogue beat identities. Validate the eight-ID manifest and fallback behavior only after the conversion paths work.

## Production checkpoint — 2026-10-01

`tools/cinematics/specs/production_presentation_modes.json` is the new production overlay. The generator reads it with the immutable 147-beat historical audit and rejects an unconverted video or hold. The generated registry now contains 8 video, 5 hold, 31 travel still, 77 tableau, 24 combat and 2 gameplay beats. All 21 retired video beats, 17 dependent dialogue holds and six route-choice holds retain their beat/dialogue/edge IDs. The eight video sources and four explicitly linked remaining holds reference approved IDs only; the route-specific epilogue hold follows its approved ending clip. The reduction policy and machine doctrine reflect the locked eight-slot rule; main-event status alone does not require video.

The shipped manifest has eight MP4 descriptors plus the source-free QA placeholder. The former 31-master manifest was copied byte-identically to `tools/cinematics/specs/historical_cinematic_manifest_31.json` (`git` blob `93d2c7d4b615829dd76b852eac78bc2853f0c4c0`) so dated audits can still reproduce their baseline. No MP4 binary was deleted or altered. The 23 retired binaries (221,023,313 bytes) now live under `tools/cinematics/archive/retired-video-masters/`, with [hash inventory](../../tools/cinematics/archive/retired-video-masters/inventory.json) checked against the pre-migration Git blobs. The Vite output contains exactly eight MP4s.

The isolated Journey QA manifest now uses approved `camp_departure.mp4`. Dated CIN-6A/C planning JSON and reports retain their original references as historical evidence. Historical tests resolve their MP4 bytes from the verified archive. `run_cin6d6_browser_qa.mjs` now checks Valmir's two-choice travel still and no request for its retired video, and follows the opening dialogue/combat path into production T0. The old CIN-6A/C trigger maps still name retired beats as content cues, but `GameApp` blocks their playback and dialogue/combat handoffs use tableau or combat surfaces.

Focused source tests, TypeScript, contract validation and Vite build passed at this checkpoint. Chromium QA of the production manifest and missing-media fallback passed at 1366×768 and 390×844. The opening 1920×1080 browser flow passed through dialogue, choice, combat, postcombat tableau and T0 mount with zero black flashes; the Valmir saved-node flow passed precombat dialogue and two route choices without requesting its retired MP4. Results and compact captures are under ignored `tmp/cinematics/eight-slot-qa/`. The older full CIN-6D.6 runner's first-refuge saved-node setup no longer reaches its expected exploration surface; its remaining refuge/witness branches and reduced-motion campaign flow need a current-state driver. Keep queue item 3 active.

## Final item-3 verification — 2026-10-01

The saved-node browser driver now follows the first refuge's canonical `first_refuge_gathering` dialogue before entering its hub; the second refuge has no clan gathering dialogue. Both hubs, post-node narratives and departure stills passed. The first gathering shows four actors, preserving both speakers and the locked readable-composition limit. The production tableau source no longer advertises the retired forest-tension or Valmir MP4s, or future media work for the static audience-road and forest aftermath beats. Historical trigger maps, generated `sourceVideo` provenance and dated manifests still record old names; runtime playback requires an approved slot and these records do not ship their archived MP4s.

Chromium results under ignored `tmp/cinematics/eight-slot-qa/`: `campaign-final/results-1920x1080.json` passed opening dialogue/choice/combat/T0, first/second refuge, and Valmir; `witness-refresh/results.json` passed witness tableau and saved `protectedWitnesses` truth; `valmir-mobile-reduced/results-390x844.json` passed precombat/combat and both choices with reduced graphics and OS reduced motion. At 390×844 both choice rectangles stayed within x=10–380 and y=734–834. No page/console errors, missing media, TravelView flashes or black flashes occurred. A skipped approved opening video produced one expected `ERR_ABORTED` request, excluded from actionable failures. Compact screenshots were inspected at desktop and mobile. Focused Vitest: 56/56; TypeScript, contract validator (8 LOCKED contracts and 8 slots), Vite build and `dist` count of exactly eight MP4s passed.

| Contract area | Status | Item-3 evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Presentation remains downstream of campaign and combat authority. |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS | Approved V2 and location assets unchanged; no new media invented; existing family stills used. |
| NARRATIVE / CAMPAIGN | PASS | All 147 beat IDs, dialogue choices and route handoffs retained; witness saved truth verified. |
| NARRATIVE_PRESENTATION | PASS | Only eight video slots; retired tableau media cues removed; first refuge has four visible actors. |
| TRAVERSAL | PASS | Opening reaches one T0 mount after combat; no T0 logic changed. |
| COMBAT | PASS | Opening and mobile Valmir combat handoffs complete with canonical combat owner. |
| SAVE | PASS | No schema/ID changes; saved-node refuge and witness resume passed. |
| UI / ACCESSIBILITY | PASS | Valmir reduced-motion mobile route choices remain within viewport and actionable. |
| QA_EVIDENCE | PASS | Focused source tests, browser state JSON/screenshots, TypeScript, contracts and production build passed. |
| REPOSITORY_GOVERNANCE | PASS | `dev` only; no LOCKED document or historical evidence changed; retired masters remain byte-identical in archive. |

Contracts read for this item: `GAME_CONSTITUTION` and contract set v1 (`contracts.manifest.json`, eight LOCKED contracts). No LOCKED rule was edited. Item 3 is complete; the separate eight-video artistic remaster remains queue item 8 and does not authorize more video slots.
