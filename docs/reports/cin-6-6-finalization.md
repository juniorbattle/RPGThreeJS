# CIN-6.6 Finalization

## Baseline and scope

- Baseline, local `HEAD`, and `origin/main`: `61568fa6fb837170df7f84e27c3ba1a05038340b`.
- Branch: `main`.
- Pre-flight worktree: clean.
- Production manifest: 21 unique descriptors, comprising 20 local production MP4s and one QA placeholder.
- Production default: `TravelView`; Journey remains selected only by the DEV query `?journey=cinematic`.
- Runtime MiniMax/AI: none. MiniMax was used only by offline production tooling.
- Concurrent VFX registry baseline SHA-256: `4951b2d22f5fce42131bf46aad6d2422aa098b5881bbaccee33291c01eda1e3e`.

The mission changed exactly three production masters and no runtime ID: `alaric_audience_arrival`, `camp_departure`, and `valmir_route_fork`. No P1, P2, CIN-6C, combat, save-schema, campaign-truth, or VFX publication work was performed.

## Final cinematic doctrine

The locked pipeline is:

`environment reference + canonical character references + dialogue/event-derived cast + canonical scale + staging + lighting/ground/depth intent -> unified integrated keyframe -> source QA -> MiniMax H3 I2V -> local mastered MP4`.

The seven V3 shot sources were generated with the OpenAI built-in image-generation tool as unified 16:9 keyframes, then mechanically normalized to 1920x1080 for the existing CIN-4/MiniMax pipeline. The tool did not expose itemized usage or cost. It was not added to game runtime. Every source retained canonical character references in its structured shot spec and declared `NO_COLLAGE_LOOK`, `WORLD_INTEGRATION`, grounding, safe-zone, and continuity gates.

Structured doctrine is now recorded in:

- `tools/cinematics/specs/journey_cinematic_grammar.json`
- `tools/cinematics/specs/cinematic_dialogue_cast_audit.json`
- `tools/cinematics/specs/cinematic_continuity_bible.json`
- the three V3 specs under `tools/cinematics/specs/cin6a/`

## Dialogue and cast

The deterministic audit covers six cinematic-linked dialogues. Three are aligned today and three have documented future presentation mismatches. Two previously identified presentation mismatches are corrected by the authorized V3 work. No dialogue line, choice, requirement, effect, flag, route, reputation rule, or combat trigger changed.

The Audience V3 uses repository truth from `lion_briefing`: Alaric and Alistair are required speakers; Sage Seraphine and Maelor are the two primary player/company advisers. The Lion Champion is deliberately offscreen because this is the early mandate, not final judgement. Camp Departure uses the actual `camp_departure` speakers Marian, Maelor, and Alistair. Valmir uses the guaranteed pre-recruitment company only: Seraphine, Alistair, and Maelor.

Text classification summary:

| Classification | Count |
| --- | ---: |
| `AGENCY_DIALOGUE` | 3 |
| `CINEMATIC_DIALOGUE` | 3 |
| `VISUAL_REPLACEABLE` proposals | 1 |
| `REDUNDANT_EXPOSITION` proposals | 1 |

The last two are review proposals only; nothing was automatically deleted.

## Journey grammar and UI V2

All five reusable grammar families validate: `JOURNEY_SINGLE_ROUTE`, `JOURNEY_TWO_PATH_FORK`, `JOURNEY_APPROACH`, `JOURNEY_DEPARTURE`, and `JOURNEY_THREAT`.

The Journey overlay remains presentation-only. For exactly two choices it derives left/right display geography from the authoritative option order without importing or mutating RunSystem. Single-route agency is a compact lower-right unit. Branch agency places the two real cards at the lower left and lower right, visually hides the redundant center heading while preserving it for assistive technology, leaves the company and fork center open, and keeps Company/Save/Menu secondary.

## V3 production results

| Runtime ID | Old SHA-256 | New SHA-256 | Duration | Bytes | Shots / MiniMax attempts |
| --- | --- | --- | ---: | ---: | ---: |
| `alaric_audience_arrival` | `958d5e9a8f6b52a9defb1d3ebfd39af49c71cf84a90c50753b829adf5db82715` | `b823180582228dc2dd08592926efeb8ec58bc40bc102e238577361eac1dcb629` | 12s | 12,340,443 | 3 / 3 |
| `camp_departure` | `fedff433adaa69d15f10b40bd5ae8be0a52fd3f3eeabf35db6a035e25f1af279` | `a56678969bfb319d503be1f3f406ca2a3bef1a11bebc07db78c6fb22e6b9c0f3` | 12s | 14,245,824 | 2 / 2 |
| `valmir_route_fork` | `1a2f0a5f5eb02cec0fd12ce660b7ecfcb94bef9da264d4682880649b6f76438c` | `63a4a0c3793d6e29ce8fd94b1478dfab59e40f856d53a01915e47fb9a6343261` | 10s | 13,094,926 | 2 / 4 |

All three are H.264 High, yuv420p, 1920x1080, 24 fps, silent, unrotated, browser-decodable, and finish on nonblack/nonblank frames. Nine MiniMax attempts were made in total. The complete 20-production-file footprint is 311,337,476 bytes, an increase of 11,858,579 bytes over the three replaced baseline files.

Audience V3 passes two-adviser representation, dialogue/cast alignment, contact/ground/light integration, no-collage, stable identity, and held-dialogue safe-zone review. Camp Departure V3 passes group identity, one-route direction, foot contact, constant scale, no sliding, coherent formation, environmental motion, and compact next-step safe-zone review. Valmir Fork V3 passes neutral two-path geography, stable guaranteed cast/equipment, left/right safe zones, no route selection in media, and geographically matched agency UI.

## Real Chromium QA

The manual Chrome run used `http://127.0.0.1:5173/?journey=cinematic` and exercised the live campaign from Camp Departure V3 through the compact single-route agency, Audience V3, held `lion_briefing` dialogue and its real deterministic mission choice, the next Journey boundary, the forest threat cinematic, and entry into the real tactical combat stage. A separate ignored browser save was constructed by calling the repository's real `createInitialState` and `enterRunNode` functions through the exact canonical path to the resolved Valmir node. Loading that save in the real game played Fork V3, produced the two authoritative RunSystem options, and one click on the left choice reached the real `Vieux sanctuaire` dialogue.

An automated real-Chrome complement ran the same Camp/Audience and Valmir surfaces at exactly 1920x1080 and 1366x768. Evidence is ignored under `tmp/cinematics/cin66_finalization/browser-qa/`.

| Check | 1920x1080 | 1366x768 |
| --- | --- | --- |
| single-route panel | 440x216, lower right | 440x169, lower right |
| branch route cards | 340px left + 340px right | 340px left + 340px right |
| horizontal/vertical overflow | none | none |
| modal owners | one | one |
| Audience hold surface | one 1920x1080 canvas | one 1920x1080 canvas |
| real left-route commit | `Vieux sanctuaire` | `Vieux sanctuaire` |

Live playback, continuous canvas motion, same-canvas final hold, passive backdrop, dialogue interaction, branch interaction, and cleanup all passed. A browser-console resource message was traced separately: it has no HTTP response or source location and is the existing missing-favicon-style browser message; no application request failed and no page error occurred.

## Validation

- Focused CIN-6.6/CIN-6.5/CIN-6A/CIN-6B, CinematicPlayer, CinematicOverlay, Journey, boundary, resolver, route guard, census, scale, spec, and audit suite: 25 files, 286 tests, all passed.
- Campaign census validator: PASS; 64 entries, prioritized primary P0/P1/P2 = 17/9/0 and ordered targets including reuse = 20/11/0.
- Character scale validator: PASS; 52 profiles.
- Dialogue/cast validator: PASS; 6 linked dialogues.
- Journey grammar validator: PASS; 5 families.
- Continuity validator: PASS; 18 characters and 7 environments.
- Visual re-audit validator: PASS; 20 masters.
- Three V3 shot validators, including sources and prompts: PASS.
- Three V3 sequence validators: PASS.
- ffprobe/hash sweep: 20/20 production MP4s passed.
- Typecheck: PASS.
- Production build: PASS; 114 modules transformed.
- Full suite: `CONCURRENT_VFX_EXCEPTION`; 104 files, 103 passed and the single known `CasterMotionBackCompat` file failed; 2,141 tests passed and the same 11 tests failed because the concurrent published registry is intentionally empty.

## Scope and readiness

The final diff contains no changes to RunSystem, GameState/save schema, dialogue truth, finale resolution, CombatStage, CasterMotion, unit motion/pose runtime, rewards, or the VFX publication registry. `TravelView` remains the production default. No runtime AI was added. No P1/P2 ID or media was created.

`READY_FOR_OPERATOR_FINAL_VISUAL_ACCEPTANCE: YES`

`READY_FOR_CIN_6C: NO — PENDING OPERATOR FINAL VISUAL ACCEPTANCE`

Commit: NO. Push: NO.
