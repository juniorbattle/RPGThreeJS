# T3 production authoring

Status: **COMPLETE / PASS**, queue item 7, 2026-10-02 UTC. Contract set v1 applies. The candidate has source authoring and real checkpoint media; **T3 is intentionally registered and enabled in production after real GameApp/V6 and built-production acceptance**. T1 is complete in `1eb3f86` and must not be repeated.

## Canonical scope and owners

Existing relation only: `lion-second-refuge` → mandatory `lion-lancer-recruit` → mandatory `lion-witnesses` → strict fork `lion-final-trial-event` / `lion-final-trial-combat` → `lion-shadow-signs`. Arrival does not visit or resolve Shadow Signs. Retired T4 remains a direct Journey continuation to the final refuge. No new narrative node, choice, consequence, video, combat resolver, durable ID or save migration.

The narrow `TraversalT3Scene` uses the shared `TraversalRoadScene`. Five roads retain the T1/T0 authoring grammar: 12/15/12/15/20 seconds, two lanes, shared forest/caravan/foreground/fork, Risk/Reward/Pursuit templates 1/2/4/5/6. T3 mechanic IDs are isolated; +5 pickups go only through temporary loot. The HUD's nominal 4 km scale is inherited presentation authoring, not a new campaign fact or save field.

RunSystem resolves available adaptive nodes and persists their existing mystery assignments. Contact actors are explicit rather than guessed from cast order: lancer, survivor, young dragon, oracle, and the existing `shrine_apparition` presentation entity. Combat formations come from existing combat configs (`ruins_guardians` / `serpent_hunters`). Legacy `mystery_lancer_recruit` assignments on the final event are retained. An unknown selected content fails closed.

`createT3RoadAuthoring(getState)` gives the world renderer a scene-local read of the owner-resolved selected node. It does not select an adaptive variant, persist a world ID or change the shared world interface. Dragon roost, shrine/informant, legacy lancer and both combats each resolve the appropriate existing environment family after the canonical fork. The renderer's pre-fork `main` sentinel remains valid.

## Media provenance

Pipeline: baked raster checkpoint plates, separate runtime interactive entities, scene-local two-lane collision, project-native renderer, modern pixel-art / HD-2D. Three real built-in image-generator paintings are copied byte-identically under `public/assets/generated/lion-phase/traversal/t3/world-v1/`: Witness Road, Shadow Ruins and Dragon Roost. Each is 1536×1024, horizontal road with clear ground bands at 65/81 percent. Original generated files remain in Codex's generated-images directory.

Prompts under `tools/traversal/t3-production/` distinguish the protected T0 camera/ground reference from canonical location/material/lighting references. Source location PNGs and the forest PNG remain untouched. Witness daylight, moonlit ruins/shrine and moonlit open roost match their existing tableau families. Actors, enemies and vehicles are separate. The asset manifest records exact new/source hashes and prompt paths. `TraversalSpriteBounds.json` adds measured alpha bounds for the existing 640×768 shrine entity, without altering its protected PNG or promoting a new V2 character.

## Checkpoint verification

240 focused Traversal/GameApp/RunSystem/Journey/campaign tests across 35 files pass, including 12 T3 tests: canonical stage audit, both scene handoff/arrival paths, +5 temporary loot, all four event assignments (including legacy), both combat formations, live world selection and fail-closed unknown content. TypeScript, the eight-contract/eight-video validator and Vite build pass. Only the inherited chunk-size advisory remains.

DEV candidate browser driver: `tools/traversal-t3-browser-qa.mjs`. It mounts T3 in an isolated context with real GameApp node/arrival callbacks, TraversalPreviewSaves, persisted assignment fixtures and the existing DEV combat victory fixture. It deliberately calls the existing temporary-loot owner directly because production rejects an unregistered leg. This is source/visual candidate proof, not real V6 resume or production activation acceptance. It follows the first available authored dialogue choices; other dialogue outcomes and defeat remain outstanding. The first attempt exposed the renderer's `main` sentinel and is not acceptance evidence.

## Contract checkpoint matrix

The [accepted candidate checkpoint](../reports/traversal-t3-candidate-1.md) passes all six retained assignments, 86 responsive captures, zero errors/failures/frame issues, exactly three handoffs and one unresolved-destination arrival per run. Desktop recruitment/dragon/informant/ruins and mobile witness/shrine/Serpent/legacy arrival captures were inspected. Eight captures and machine measurements were promoted into a new evidence directory; no historical proof was overwritten. The last full legacy path has reduced motion. This remains candidate proof with isolated saves and DEV combat result fixtures, not production acceptance.

| Contract area | Status | Evidence / remaining acceptance |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing campaign and RunSystem authority retained. |
| ART_DIRECTION | PASS | Three actual pixel-art plates; canonical references preserved. |
| CHARACTERS | PASS | Existing V2 masters and declared shrine presentation entity; no remaster. |
| ENVIRONMENTS | PASS | Witness Road / Shadow Ruins / Roost references and shared forest; runtime candidate review recorded separately. |
| NARRATIVE / CAMPAIGN | PASS | Existing mandatory stages, strict fork and assignments; no new doctrine. |
| NARRATIVE_PRESENTATION | PASS | Shared physical road; arrival retains unresolved Shadow Signs agency. |
| TRAVERSAL | PASS | Authored candidate; T3 registry and production gate remain closed. |
| COMBAT | PASS | Existing combat config and GameApp bridge; nested outcomes/defeat QA still required. |
| SAVE | PASS | No schema/ID changes; real V6 origin/interrupt/fork/arrival reload acceptance still required. |
| UI / ACCESSIBILITY | PASS | Existing shared controls and CSS; candidate responsive/reduced-motion proof only. |
| QA_EVIDENCE | PASS | Focused tests/build/contracts; ordinary reruns in ignored tmp; no historical evidence overwritten. |
| REPOSITORY_GOVERNANCE | PASS | dev only, provenance recorded, no LOCKED contract changed. |

This matrix covers the retained candidate checkpoint, **not completion of item 7**. Contracts read: GAME_CONSTITUTION, v1 README/manifest, all eight LOCKED contracts, T0_PRODUCTION_CONTRACT and the complete 2026-09-30 design-authority audit. Impacted locks: authored T0 grammar/T1/T3 scope, campaign truth ownership, existing actors/art, presentation-only combat, temporary loot, durable saves and QA evidence. No LOCKED rule changed.

## Required continuation before rollout

1. Review the six-assignment candidate browser report and selected runtime captures. Correct any source/media regression; do not regenerate accepted plates without evidence.
2. Build real GameApp/V6 integration QA from the accepted T1 production driver for the second refuge. Test origin, resolved recruitment/witness interrupts, selected adaptive fork and destination reload; temporary loot, branch cleanup and unresolved Shadow Signs agency must remain canonical.
3. Exercise accepted/refused recruitment and failed contest, protected/refused witnesses and `witness_road_clash`, dragon fight/spare, informant protection/sale, shrine reverence/profanation, both combat formations and defeat back to second refuge. Preserve the active Traversal across nested dialogue combats.
4. Only after acceptance, intentionally register/enable T3 and verify production reward acceptance, real built-production paths, mobile/reduced motion/keyboard, source asset integrity and T0/T1 regression. Item 7 remains ACTIVE until this is complete.

## Real integration checkpoint — 2026-10-02 UTC

`tools/traversal-t3-production-qa.mjs` follows a canonical unresolved second-refuge V6 fixture through the real refuge UI, securing, departure, every T3 handoff and destination reload. Before source activation, ten DEV candidate scenarios passed 275 captures with zero failures/errors/frame issues. Recruitment accepted/refused/failed contest, witnesses protection/refusal/silence and defeat, dragon fight/spare, shrine preserve/break, informant protect/sell, both combat formations and legacy lancer assignment are covered. Three interruptions restore the unchanged origin save and discard transient road progress/loot/choices. Arrival preserves the unresolved Shadow Signs confirmation boundary.

After that acceptance, T3 was intentionally added to the scene registry and rollout. 204 focused tests across 30 files, TypeScript, eight-contract/eight-slot validation and Vite build pass. The shipped build still contains exactly eight MP4s. Production QA additionally checks unchanged Traversal instance during nested combat, full rendered dialogue text, visible-actor cap and defeat restoration/explicit departure agency. T0/T1 production regressions run in separate ignored output folders. Their final reports are still pending; item 7 remains active. Combat boot and bridge are real; results are matching iframe fixtures, not tactical balance proof.

## Final production acceptance — 2026-10-02 UTC

[Final machine proof and eight promoted captures](../reports/traversal-t3-production-1.md): all ten built-production scenarios pass 291 responsive captures, zero failures/errors/frame issues. T0 regression passes both paths/23 captures; T1 passes three paths/59 captures. 204 focused tests across 30 files, TypeScript/contracts/build pass; dist contains exactly eight MP4s. The new/source image hashes and design-trace copy remain exact. Ordinary attempts/reruns and nonselected captures stay ignored. Earlier candidate sections record their pre-activation baseline.

The production driver checks flags/assignment/secured gold, three V6 interruptions restoring flags/clan/reputation/resolved IDs, arrival/destination reload with unresolved Shadow Signs agency, once-only temporary pickup acceptance, every road mechanic lifecycle, mobile keyboard/reduced motion, same scene through nested witness/dragon/informant victory, and witness defeat restoring the saved second refuge with explicit departure agency and no road DOM. Matching iframe result fixtures delimit this as campaign/Traversal lifecycle acceptance, not tactical balance or full-demo QA. Desktop/mobile choices and checkpoint compositions were inspected; a read-only reviewer additionally verified complete informant text, mobile Shadow Signs continuation and canonical guardian formation. Screenshot readability and machine ownership assertions are complementary evidence.

| Contract area | Final status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | GameApp/RunSystem and combat remain truth owners. |
| ART_DIRECTION | PASS | Accepted modern pixel-art T3 plates reused byte-identically. |
| CHARACTERS | PASS | Existing V2 actors/poses and declared shrine entity; no remaster. |
| ENVIRONMENTS | PASS | Existing witnesses/ruins/roost families and shared T0 forest; protected hashes verified. |
| NARRATIVE / CAMPAIGN | PASS | Existing mandatory stages, strict fork, assignments and all dialogue alternatives retained. |
| NARRATIVE_PRESENTATION | PASS | Same scene across nested combats; unresolved Shadow Signs confirmation then canonical tableau, no enemy video. |
| TRAVERSAL | PASS | Intentional T3 registry/rollout; five-road mechanics and T0/T1 production regressions pass. |
| COMBAT | PASS | Existing combat owner; nested victories retain scene, defeat restores checkpoint; no road resolver. |
| SAVE | PASS | V6 origin/three interruptions/arrival/defeat accepted; no schema/ID mutation or transient fields. |
| UI / ACCESSIBILITY | PASS | Desktop/620/mobile bounds, visible cast cap, keyboard lanes/fork and reduced motion pass. |
| QA_EVIDENCE | PASS | 204 tests, TypeScript/contracts/build; 291 production captures/zero issues; new eight-image proof, historical evidence untouched. |
| REPOSITORY_GOVERNANCE | PASS | dev only; no LOCKED rule edited; archived design trace/index supplied and protected against line-ending conversion. |

Contracts read: constitution, README/manifest v1, all eight LOCKED contracts, T0 production contract and complete source audit sections 1–15. Impacted locks: T0 grammar/T1/T3 scope, authored campaign facts and IDs, existing V2/environment media, temporary loot, presentation-only combat, durable saves, accessible UI and QA provenance. No LOCKED rule changed. Item 7 is COMPLETE; item 8 is the next scope, and audio remains deferred.
