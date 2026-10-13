# T0-CAMPAIGN-GRAMMAR-CONSOLIDATION-1

Implementation and verification, 2026-09-22. Consolidation and follow-up presentation polish are committed and pushed on the review branch. The branch remains **unmerged** pending operator validation.

## 1. Starting state and revalidated baseline

Started on `t0-campaign-grammar-consolidation-1`, clean, at `99157cdcea57431cc9bba3156e7d67d5e08beb10`. The actual source already enabled production T0 (`enabled=true`, `designAssetsReady=true`, rollout `['T0']`). Older preview-only notes were not used as current authority. T1–T4 remain excluded.

The audience facade mounted T0 before presenting the existing reviewed `edge:lion-audience>lion-opening-ambush` departure. Ordinary Journey Continue would commit its sole available node. The existing final ARRIVING/covered completion/disposal/explicit-refuge contract was retained.

One material content mismatch required a narrow semantic change: the selected adaptive event was mandatory in the relation, so its requested pre-dialogue ignore path was unreachable. A per-node participation override now permits `lion-first-trial-event` to be bypassed. The combat branch remains mandatory. Cedric remains the existing mandatory interrupt, with neutral refusal inside his dialogue. No links, node membership, fork alternatives, stage order, physical positions or lane geometry changed.

## 2. Five objectives and resulting grammar

| Objective | Result |
|---|---|
| A — departure | Reviewed static company tableau with local Continue before one T0 mount |
| B — shared status | One app-owned read-only HUD used by Journey, NarrativeStage and Traversal |
| C — authored ignore | Two content-sensitive social penalties, only after canonical bypass succeeds |
| D — interaction grammar | Explicit world/local narrative/canonical classes; real healthy-peddler dialogue |
| E — clan anchor | Existing arrival, secure loot, new dynamic gathering, management, separate later ATE |

Before: audience → T0 → thin local merchant panel/canonical interrupts → covered arrival → explicit refuge → arrival media → secure loot → management → later narrative.

After: audience → reviewed departure/visible status → local Continue → covered T0 mount → world/local narrative/canonical encounters → physical arrival → covered completion/disposal → explicit refuge agency → existing arrival media → secure loot once → clan gathering → management → existing watch ATE/reputation events → Journey. T1 does not mount.

## 3. Departure boundary lifecycle and canonical proof

`JourneyCampaignBoundary.present({presentationOnly:{continueLabel}})` is a presentation seam, returning `presentation-continue` with `id:null`. It cannot return a canonical node from that local Continue. The reviewed resolver context and `AUDIENCE_ROAD_DEPARTURE_TABLEAU` supply the environment and cast; no new node, media or replacement illustration was invented. The local static-only boundary uses the existing tableau as `STATIC_TABLEAU` with stage-owned cast instead of an empty travel still.

GameApp holds `traversalEntryInFlight` across both the departure and mount. It saves the resolved audience before departure, awaits surface readiness under the shared transition, waits for local agency, and mounts T0 under the next cover. Departure disposal occurs under that cover. Repeated facade calls cannot duplicate the boundary or scene. ARRIVING uses the existing completion path and never restarts departure.

Tests verify no `commitRunNodeChoice`, node entry or resolution from departure, the current node stays `lion-audience`, one mount follows Continue, zero TravelView, repeated-call protection, and replay from the durable audience snapshot. There is no watched-departure persistence. Browser evidence records the audience autosave and no mid-route writes.

## 4. Status HUD architecture and semantics

`selectCampaignStatus(GameState)` returns secured gold, route gold, reputation and `getReputationRule()` label. Red gems are intentionally excluded from the campaign HUD because they are primarily a hero-upgrade/combat-progression resource rather than an on-route campaign signal. `CampaignStatusHud` only renders that snapshot. GameApp creates one instance; surfaces receive it by injection. Moving the same element between owners prevents duplicates. Owner-aware hide prevents stale disposal from removing the successor's HUD.

| State | Shared HUD |
|---|---|
| Static tableau / travel still without dialogue | Visible |
| Active cinematic playback | Hidden |
| Finished cinematic held behind agency | Visible |
| Active dialogue, including merchant and gathering | Hidden |
| Traversal driving, decisions, fork and world panels | Visible |
| Canonical handoff/resolution or local dialogue | Hidden; refreshed on return |
| Combat | Hidden; no combat HUD integration |
| Refuge management | Removed; existing management resources retained |

Refresh is deterministic at surface/session ownership changes and accepted ignore consequences; no economy polling was added. Dialogue effects remain authoritative and the next agency/route refresh reflects their in-memory state. Local preview pickups remain session-local. Route loot is never added into secured totals for display. Desktop HUD spacing clears the route header; narrow presentation was inspected at 540×800 as well as 1366×768.

## 5. Optional consequence architecture and exact policy

Traversal emits `onOptionalIgnore(nodeId)`. GameApp rejects an absent owner, visited/bypassed node, invalid phase, unavailable node or node outside the active route. It asks RunSystem to bypass first. Only an accepted bypass resolves the authored content policy, changes reputation, sets the flag and refreshes the HUD. The scene then advances its physical stage and displays compact `Réputation -2` feedback. Bypassed actors retain the existing physical pass-by behavior.

| Node / actual content | Pre-interaction consequence | Historical flag |
|---|---|---|
| `lion-refugees` / `refugee_trial` | Reputation −2 | `ignoredRefugees=true` |
| `lion-first-trial-event` / `mystery_help` | Reputation −2 | `abandonedMerchant=true` |
| `lion-first-trial-event` / `mystery_treasure` | None | None |
| Cedric / recruit | None; mandatory encounter unchanged | None added |
| Healthy local peddler | None | None |
| Local/random combat avoidance | None | None |
| Pickups, ward, obstacle | None | None |
| Other legs/content | None registered | None |

No ignore autosave, reward, visit or resolution is added. The existing bypass ledger is the once-only guard. Once a node is entered, dialogue effects are the sole consequence source. Tests execute the actual existing wounded-merchant abandonment effects and confirm the ignore seam refuses a second penalty. Refused bypass tests confirm no consequence. Refugee exploitation/help and treasure choices are unchanged.

## 6. T0 content/interaction matrix

| Beat | Authority | Grammar class | Dialogue | Ignore policy | Consequence owner | Return behavior | Status |
|---|---|---|---|---|---|---|---|
| Audience-road departure | GameApp + presentation | Presentation-only boundary | None | N/A | None | One T0 after Continue | Complete |
| Roadside merchant | Local registry + GameApp | LOCAL_MICRO_NARRATIVE | `roadside_peddler`, 3 steps | Neutral | Existing dialogue effects; currently none | Same scene, no node/save | Complete |
| Wolf scouts | Local road combat | LOCAL_COMBAT | Existing encounter content | Neutral | Existing local combat seam | Same Traversal | Preserved |
| Road cache | Traversal session | WORLD | None | Neutral | Existing preview-local pickup | Driving | Preserved |
| Gold pickup | Traversal session | WORLD | None | Neutral | Existing preview-local pickup | Driving | Preserved |
| Lion ward | Traversal session | WORLD | None | Neutral | Existing local booster | Driving | Preserved |
| Obstacle category | Traversal session | WORLD | None | Neutral | Existing movement/session handling | Driving | No new obstacle authored |
| Opening ambush | RunSystem | CANONICAL_INTERRUPT | Existing pre/post combat | Mandatory | Existing canonical combat/effects | Same scene | Preserved |
| Cedric crossroads | RunSystem | CANONICAL_INTERRUPT | `mystery_recruit` | No moral penalty | Existing dialogue | Same scene | Mandatory source relation preserved |
| Refugees | RunSystem | CANONICAL_INTERRUPT | `refugee_trial` if entered | Authored −2 before interaction | GameApp after accepted bypass | Same scene | Complete |
| Route fork | RunSystem branch choice | ROUTE_FORK | None | N/A | RunSystem | Live mounted road/choice rail | Preserved |
| Adaptive wounded merchant | RunSystem | CANONICAL_INTERRUPT | `mystery_help` if entered | Authored −2 before interaction | GameApp or entered dialogue, exclusively | Same scene | Complete |
| Adaptive abandoned cart | RunSystem | CANONICAL_INTERRUPT | `mystery_treasure` if entered | Neutral | Existing dialogue if entered | Same scene | Complete |
| Selected combat branch | RunSystem | CANONICAL_INTERRUPT | Existing combat content | Mandatory | Existing combat authority | Same scene | Preserved |
| First refuge | RunSystem + GameApp | Location/clan anchor | New gathering, then existing later watch | N/A | Existing secure-loot/management | Journey, no T1 | Complete |

The classifier is independent of sprite identity and placement. Local merchant is not the wounded moral event; recruitment is not a moral request; combat avoidance and pickups are not social decisions.

## 7. Local merchant before/after and lifecycle

Before: wounded-merchant sprite and descriptive `LOCAL_INTERACTION` shell. After: a healthy travelling colporteuse using the existing CharacterVisualRegistry `villageoise` profile, two practical road lines and Alistair's reply with a neutral farewell. No trade economy or rewards were invented. The healthy civilian is an explicit temporary identity fallback pending future art.

The registered local beat requests GameApp's borrowed NarrativeStage while keeping the physical scene mounted. GameApp validates the pending local beat, covers the presentation handoff, awaits readiness and dialogue, then covers disposal and restores the same route owner. The scene consumes the local beat and resumes. Tests preserve the entire GameState, current canonical node, step counter and save-call count. Browser DOM identity remains the same and no TravelView mounts.

Canonical interrupts retain their separate route gateway: GameApp revalidates RunSystem availability, enters the node once, resolves its existing content, and resumes the same physical owner. Local narrative never uses that gateway.

## 8. First-refuge flow and dynamic clan staging

Existing `first_refuge_arrival` still runs first. The existing `refugeSecured:<node>` flag guards `secureRunLoot`; the new registered gathering follows it and precedes management. `clanArrival:<node>` uses the existing boolean flag map, not a schema extension. It prevents duplicate gathering on the same resolution path.

The new three-step `first_refuge_gathering` discusses arrival, secured supplies, rest and preparation. It is distinct from `ate_first_refuge_watch`. Management Continue still marks the refuge resolved and calls existing post-node ATE/reputation handling. The later watch content and registration are untouched.

GameApp reads current `state.clan.members`, resolves definition IDs through CharacterVisualRegistry and supplies them to generic tableau composition. Required speakers remain visible alongside up to seven represented actors. Browser composition contained Alistair, Maelor, white mage, dark mage, archer and rogue (Cedric's registry identity). No character paths or fixed roster are baked into the new orchestration.

`clan_anchor_environment` is a semantic alias using the existing reviewed refuge environment behind the watch context. It reuses only that painted environment, not the ATE sequence. A future camp painting or animated characters can replace presentation assets without changing progression, secure-loot timing or narrative effects.

## 9. Authority matrix

| Owner | Responsibility retained |
|---|---|
| RunSystem | Graph, availability, branch choice, canonical entry, accepted bypass and loot transfer |
| LionCampaignTravelRelations | Leg endpoints/stages/fork relation and narrow per-node participation metadata |
| GameApp | Scene orchestration, commit gateway, consequences and save lifecycle |
| Journey boundary / NarrativeStage | Readiness, tableau/media/dialogue and local or canonical agency reporting |
| Traversal | Physical route, contact/decision detection, semantic requests and local lifetime |
| CharacterVisualRegistry | Character identity and existing assets |
| CampaignStatusHud | Pure read model and shared rendered view |
| TravelView | Existing exceptional recovery/legacy/debug use |

## 10. Modified files and rationale

| Files | Rationale |
|---|---|
| `src/game/GameApp.ts` | Departure orchestration, shared HUD injection, accepted-ignore seam, borrowed local dialogue, gathering order |
| `src/game/TraversalOptionalConsequencePolicy.ts` | Two narrow authored policies |
| `src/game/campaignGrammarContent.ts`, `content.ts` | Additive local/gathering content and presentation registries |
| `src/ui/CampaignStatusHud.ts` | One read-only component/selector |
| `src/journey/JourneyCampaignBoundary.ts` | Explicit local Continue without canonical node identity |
| `src/cinematics/NarrativeStage.ts` | HUD visibility at actual media/dialogue/session lifecycle |
| `src/cinematics/NarrativeTableau.ts`, `NarrativeSceneSurface.ts` | Additional current-clan cast; registry-first identity resolution |
| `src/cinematics/NarrativePresentationPlans.ts`, `DialoguePresentationSegments.ts`, `RuntimePresentationStepCensus.ts` | Two additive static plans and live census; existing generated lock unchanged |
| `src/traversal/TraversalInteractionGrammar.ts`, `TraversalT0Scene.ts`, `TraversalT0Route.ts` | Explicit semantic classes, healthy merchant, shared HUD, ignore/local requests |
| `src/campaign/LionCampaignTravelRelations.ts`, `src/game/runSystem.ts` | Necessary event-only participation override; no topology change |
| `src/styles/app.css` | Shared compact HUD; departure actors clear the agency region |
| Affected game, Journey, cinematic, route/flow/UI tests | New contracts and precise updated expectations |
| Two historical CIN-6 audit tests | Explicit post-lock authorized source paths; protected media checks retained |
| `tools/traversal/qa-campaign-grammar*.mjs` | Production UI driver, visible combat input companion, checkpoint and final presentation replay |
| This report, symbol audit, compact validation and targeted browser artifacts | Review evidence |

Historical fixed cinematic evidence continues to cover its original 73-dialogue/251-step corpus. The two named additions are separately counted in live coverage: 75 dialogues, 257 canonical steps, 29 choice states, 134 runtime variants and 282 runtime steps. No generated cinematic lock or source media was regenerated.

## 11. Validation

Focused: **95 passing tests in 10 files** covering JourneyCampaignBoundary, NarrativeStage, HUD, consequence/refuge/local orchestration, route, scene, flow, route authority, production rollout and campaign presentation migration. Relevant full-route, content/cinematic census, local combat, fallback and production gate regressions run in the full suite.

Commands use the repository's installed binaries because this machine's `npx` shim points at a missing roaming npm installation:

```text
node node_modules/typescript/bin/tsc --noEmit
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run build
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1
git diff --check
```

TypeScript and production build pass. The build retains its existing large-chunk advisory. No lint script is configured. Full-suite result and final extension verification are recorded in `t0-campaign-grammar-validation.json`. An earlier concurrent browser/full-suite run hit two 5000ms asset-validation timeouts; the bounded-worker run passed **2508/2508 tests, 149 files**, without exclusions or assertion relaxation. There are no known VFX baseline failures in this checkout's verified result.

## 12. Browser QA and evidence

Built Vite production preview, 1366×768 and 540×800. The initial fixture is the ordinary initial save before audience, with only already-seen prologue/tutorial presentation flags. Campaign progression uses normal dialogue, movement, fork, combat deployment/attack and management controls. No production game variables, QA victories, forced route completion or debug progression hooks were used.

The uninterrupted run reached management from before Alaric: reviewed departure before one T0; same HUD language; real local merchant and same road; opening combat played normally; wolves avoided neutrally; Cedric entered; refugees bypassed; event fork selected; wounded merchant bypassed; physical arrival; explicit refuge; existing arrival; gathering; management. The DOM observer recorded one Traversal mount, zero TravelView mounts, maximum one HUD and exactly one removal at phase COMPLETE with opaque transition cover 1. Autosave writes during that road were only the durable audience and final arrival boundaries.

Observed route reputation: 34 before/after wolf avoidance; 37 after Cedric's existing choices; 35 after refugees; 33 after wounded merchant. At physical arrival both ignore flags were saved, while the current node was still `lion-nomad-crossroads`, not refuge. This is expected bypass semantics, not a fabricated visit.

The initial QA driver used an incorrect management selector and its first gathering screenshot caught a transition. The selector/readiness capture were corrected. A companion validated management; the original first-response policy entered the existing later Serpent retaliation combat. Final settled refuge screenshots and onward Journey were verified by loading that run's **unmodified durable arrival checkpoint**, entering refuge again normally, and choosing the existing pay-20-gold option. This replay is explicitly recorded, not represented as an uninterrupted second full-road run. It ended at resolved first refuge with 160 secured gold, one secured gem, zero route gold, gathering/watch flags, and no Traversal T1. No browser page errors were recorded in the final replay.

The final bundle's departure/merchant prefix was separately repeated after the cast/HUD spacing fixes. It verifies three departure actors, local Continue, one T0, hidden HUD in merchant dialogue and HUD return on the same scene. `completion.json` and `final-presentation/result.json` contain the machine assertions.

Targeted screenshots live in `t0-campaign-grammar-browser/`: final desktop/narrow departure, final merchant/return, fork desktop/narrow, ignore state, explicit arrival, clan arrival desktop/narrow, management and post-refuge Journey. The superseded departure/merchant captures were removed; `final-presentation/` is authoritative for their final layout. Fork/ignore captures document the original complete road run before the final HUD header-spacing adjustment.

## 13. Repository-wide symbol audit and protected scope

`t0-campaign-grammar-symbol-audit.json` indexes the requested 23 symbols repository-wide, respecting normal ignore rules and excluding this pass's output to avoid self-reference. The final index contains 208 files and 1693 matching lines. Every matching file/line is classified: runtime state/orchestration, campaign relation, presentation, physical route, UI/recovery, content/registry, verification, tooling or historical documentation. Long generated text previews are capped; file and line references are retained.

Runtime review: economy mutations remain in RunSystem/GameApp/management/reputation; HUD only reads. Dialogue affordability legitimately reads both wallets. Existing verdict/context/reputation-event consumers of `abandonedMerchant` remain intentional. Generated presentation/media references and asset aliases are content lookup, not new progression authority. Simulation/reachability state mutations are QA only. `TraversalPreviewSaves` remains DEV-fixture-only. `enterTravel`/`showTravel` remain legacy/recovery/explicit debug or Travel management callbacks; the successful production road records none. Existing ATE references remain later narrative; the new gathering uses only its environment alias.

No public art, canonical PNG, cinematic video, audio, VFX, save schema, campaign graph, T1–T4 gate, camera, vehicle, road geometry/speed/positions, encounter formation or reward balance changes were made. The sole relation change is the documented event participation override. A later explicit operator request also authorizes the presentation-only CombatStage adjustment below.

## 14. Operator-requested CombatStage visibility extension

The operator supplied a screenshot and requested a smaller opaque combat border. Three stacked edge treatments caused the obstruction. The action vignette's clear center is wider and edge alpha drops from .66 to .18; the global CSS edge layer fades to .3 opacity only while stage focus is active; stage grading uses .5 instead of 1.36 vignette strength. Tactical grading remains 1.04 outside stage focus. Files: `src/styles/combat.css`, `src/combat/combatPresentationConfig.js`, `src/combat/legacyCombatRuntime.js`. No combat rules, damage, VFX assets, actors or camera changes are involved. A fresh built-production normal attack provides `combat-stage-lighter.png` and computed-style evidence.

## 15. Remaining visual/content debt and final status

The healthy civilian is a reused reviewed profile, not dedicated peddler art. The refuge uses a reviewed environment alias; its final gathering/camp painting remains future art. Dense clan staging at narrow sizes represents the party compactly; future spritesheet staging can refine it through the same registry/composition seam. No new images, remasters, animation, music, ambience or SFX were produced. T1–T4 remain future rollout work.

All changes remain on the requested branch and baseline commit. The exact modified/untracked inventory is in `t0-campaign-grammar-final-status.json`; staged paths and the protected diff are empty. The final suite including the CombatStage request passes 2508/2508 tests in 149 files (82.71 seconds), with no failures. **No commit, push or merge was performed.**


## 16. Follow-up presentation polish

Operator-reviewed presentation changes were added on the same branch after the original consolidation validation:

- CampaignStatusHud now exposes only **Or** and **Réputation**. Gemmes remain in management/hero-upgrade surfaces.
- The shared HUD keeps one read-only owner but receives a more Journey-native dark/gold frame, clearer hierarchy and tighter placement.
- In Traversal the campaign HUD sits in the upper-left safe zone; the route-context block is offset beneath it so the two surfaces do not compete.
- The departure agency copy is destination-led: **Départ → Vers [destination] → Prendre la route**.
- Persistent **Voie haute / Voie basse** text is removed from normal play. Lane changing remains functional through discreet up/down controls and the existing keyboard/lane logic.
- TraversalOptionalConsequencePolicy is intentionally unchanged.

These follow-up edits require a final local TypeScript/build/test/browser pass before merge; the original 2508/2508 suite result predates this presentation-only follow-up.

## Presentation polish 2

- Removed the standalone decorative crest column. The shared CampaignStatusHud now has two compact segments, Or and Réputation, with route gold shown only when non-zero. Gemmes remain absent.
- In Journey, the smaller dark/navy HUD stays in the upper-left safe zone and clears the departure agency panel and the staged cast in the 1366×768 capture.
- In Traversal, the HUD and route context share a 310 px left alignment, related navy/gold treatment and an 8 px vertical gap. The route context is less opaque. The next-stop readout stays on the right.
- The temporary encounter panel is narrower, has less vertical padding and a softer surface/border. The merchant encounter capture retains readable text and clear Rencontrer/Ignorer actions. Lane controls and selectors remain unchanged.
- TraversalOptionalConsequencePolicy and all consequence semantics are intentionally unchanged. The browser smoke confirmed one Traversal mount, no TravelView mount, maximum one HUD, and the HUD hidden during merchant dialogue and restored afterward.

Validation: focused CampaignStatusHud/TraversalT0Scene/TraversalT0Flow suites **15/15 pass**; `node node_modules/typescript/bin/tsc --noEmit` **pass**; `npm run build` **pass** (existing large-chunk advisory); `git diff --check` **pass**. Full Vitest suite: **2507/2508 pass, 148/149 files pass**. Its sole failure is `tools/cinematics/cin6ea_preproduction.test.mjs`'s protected-runtime diff assertion: relative to its fixed baseline `57ba69c`, it flags four files already committed before this pass (`NarrativePresentationPlans.ts`, `TraversalOptionalConsequencePolicy.ts`, `campaignGrammarConsolidation.test.ts`, `campaignGrammarContent.ts`). This polish changes none of those paths; the guard was not weakened.

Browser QA (built preview): [departure 1366×768](t0-campaign-grammar-browser/presentation-polish-2/departure-1366.png), [normal Traversal 1366×768](t0-campaign-grammar-browser/presentation-polish-2/traversal-1366.png), [optional merchant encounter 1366×768](t0-campaign-grammar-browser/presentation-polish-2/merchant-encounter-1366.png), [normal Traversal 540×800](t0-campaign-grammar-browser/presentation-polish-2/traversal-540.png). The four captures show no HUD/encounter collision; the world remains the dominant surface. Machine smoke evidence: `presentation-polish-2/result.json`.

Final git status after the polish commit and branch push: clean working tree on `t0-campaign-grammar-consolidation-1`; no merge.
