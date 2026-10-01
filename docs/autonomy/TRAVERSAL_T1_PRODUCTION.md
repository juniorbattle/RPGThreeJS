# T1 production authoring

Status: **COMPLETE**, queue item 6, 2026-10-01. Contract set v1 applies. T1 is registered and enabled in production alongside T0. T3 remains disabled.

## Canonical scope

Existing relation only: `lion-first-refuge` → mandatory `lion-reserve-trail` → mandatory `lion-valmir-road` → strict fork `lion-second-trial-event` / `lion-second-trial-combat` → `lion-village-choice`. The event branch remains `old_shrine_event`; combat content still follows RunSystem's seeded/adaptive node authority. No new dialogue, choice, node, consequence, enemy reveal video, combat resolver or save schema is introduced.

The new scene consumes the shared `TraversalRoadScene`. `TraversalT1CheckpointRoute` authors five roads (12/15/12/15/20 seconds; branch road variants 4A/4B). `TraversalT1Route` presents canonical actors/formation assets and delegates available adaptive-node resolution to RunSystem. Its geography uses explicit T1 checkpoint IDs, shared T0 forest Route painting, caravan, foreground and fork language. Arrival coasts physically before the existing Journey Bois-Clair agency; it must never silently consume `lion-village-choice` or bypass its approved cinematic/dialogue boundary.

Risk/Reward/Pursuit reuse T0's bounded road templates: routes 1/2/fork/branch/arrival map to T0 1/2/4/5/6, with isolated T1 IDs and unchanged pure resolvers. Pickups retain the existing +5 temporary-loot mechanic (seven possible pouches on either T1 path); CAUGHT remains speed reset only. No secured gold, HP, reputation or narrative effect is introduced by the road mechanics. The production reward callback continues to require enabled rollout plus authored registration.

## Media and provenance

Pipeline: baked raster checkpoint paintings; runtime actors/props separate; scene-local two-lane mechanics; project-native renderer; modern pixel-art / HD-2D.

Two missing checkpoint paintings were made with the built-in image generator and copied byte-identically to `public/assets/generated/lion-phase/traversal/t1/world-v1/`: `valmir-road.png` and `old-shrine.png`, each 1536×1024. Their hashes, canonical source-reference hashes, lane ground lines (65/81 percent), generation prompts and DEV candidate acceptance are recorded in the T1 asset manifest. Both source location plates and the T0 forest painting remain unchanged. The original generated files remain in the Codex generated-images directory; duplicate workspace candidates were hash-checked against the promoted copies and moved under ignored `tmp/traversal/t1-generation-candidates/`.

Prompts are under `tools/traversal/t1-production/`. Image 1 controls the side-on road, edge joins, pixel language and scale; the canonical Valmir/shrine plate controls location family. The shrine uses its existing arches/altar/sun motif, above the clear road. No actor or vehicle is baked into either painting. The forest combat checkpoint and fork reuse appropriate existing T0 environment-only art. The checkpoint binaries pass built-production acceptance; none replaces protected media.

## Verification and production acceptance

163 focused Traversal/campaign/RunSystem tests passed across 28 files, including T1's two real node/branch handoff paths, all three persisted adaptive combat formations, temporary-loot ownership, no destination entry, canonical route audit, exact media dimensions/hashes and source-reference integrity. TypeScript, contract validation and production build passed. T0's shared-scene DEV/production browser proofs are recorded in `TRAVERSAL_GENERALIZATION.md`.

`tools/traversal-t1-browser-qa.mjs` mounts the unregistered candidate in an isolated DEV browser, uses real GameApp node/arrival and RunSystem temporary-loot callbacks, and keeps the production gate unchanged. It checks desktop/intermediate/mobile compositions, local and global world-swap cover, assets/controls, both strict branches, and mobile reduced motion. It uses the existing DEV combat victory fixture and isolated TraversalPreviewSaves. Its first attempts exposed driver-selector/fixture setup errors; an earlier completed run also measured only the road veil and incorrectly flagged returns covered by GameApp's global veil. Those attempts are not acceptance results. The final run `tmp/traversal/t1-candidate-qa-final/results.json` passes three complete paths (both branches on desktop, shrine branch on mobile with reduced motion), 38 captures at 1440×810, 620×780 and 390×844, zero errors/failures/frame issues. Each path has exactly three canonical handoffs, one arrival and no destination entry. Stable Valmir desktop, shrine mobile, combat desktop, mobile fork and reduced-motion mobile arrival captures were inspected. Ordinary reruns and earlier failed driver attempts remain ignored; no historical evidence was overwritten.

Production integration: [accepted report and eight selected captures](../reports/traversal-t1-production-1.md). The resumed production driver uses real refuge UI/GameApp/V6/RunSystem and an iframe victory-result fixture after combat boot. Both desktop branches plus reduced-motion mobile pass 59 captures with zero issues. Origin/reserve/fork reloads restore the saved first refuge; arrival and destination reload retain branch/assignment/temporary loot and do not visit Bois-Clair until Continue. Normal entry uses the approved arrival video; reduced motion preserves village_choice dialogue agency. All five road mechanic lifecycles, once-only +5 temporary pickup acceptance, keyboard lanes/fork and T0 production regression (23 captures, zero issues) pass. 228 focused tests across 34 files pass after correcting a new test HUD fixture; TypeScript/contracts/build pass. No migration or durable ID change is needed.

| Contract area | Status | Final evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing campaign and RunSystem owners retained. |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS | Canonical references/V2 preserved; new side-on art passed DEV candidate runtime acceptance. |
| NARRATIVE / CAMPAIGN | PASS | Only existing T1 stages, dialogue/content IDs and strict fork. |
| NARRATIVE_PRESENTATION | PASS | Shared physical scene; Journey and Bois-Clair agency/cinematic boundary retained. |
| TRAVERSAL | PASS | Shared T0 grammar; intentional registered T1 production rollout; T3 remains closed. |
| COMBAT | PASS | Existing canonical combat handoff and actors; no road combat. |
| SAVE | PASS | No durable ID/schema changes; real V6 origin/interrupt/fork/destination reloads pass. |
| UI / ACCESSIBILITY | PASS | Existing controls/CSS; production responsive/reduced-motion and keyboard lane/fork QA passed. |
| QA_EVIDENCE | PASS | 228 focused tests, TypeScript/contracts/build; T1 production 59 captures/zero issues and T0 23/zero; eight new captures promoted. |
| REPOSITORY_GOVERNANCE | PASS | dev only; new candidate media with provenance; no LOCKED or historical evidence edited. |

Contracts read: GAME_CONSTITUTION, v1 contract index/manifest, all eight LOCKED contracts, T0_PRODUCTION_CONTRACT and the full 2026-09-30 design-authority audit. No LOCKED rule changed. Item 6 is COMPLETE.
