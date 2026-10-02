# Refuge autosave durability and earned first-refuge checkpoint

| Field | Value |
| --- | --- |
| TASK | DEMO-QA-POLISH / REFUGE-AUTOSAVE-DURABILITY-1 |
| DOMAIN | GameApp lifecycle, V6 save boundaries, keyboard service and earned campaign QA |
| BASELINE | dev @ c861f903c12283e6d89fad53d1b9bf7d0a2633af; coherent interrupted run0723 work retained |
| BRANCH | dev |
| HEAD | 8bec0c58703ab77d965b9e9b59b517083cee9c23 (implementation); evidence/state delivery follows |
| STATUS | Implemented checkpoint; scoped PASS; full demo IN_PROGRESS |
| MERGED_IN | Direct dev checkpoint; no main merge |
| SUPERSEDES | NONE; extends management-keyboard-services-1 and refuge-keyboard-focus-1 |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Arrival consolidation and successful refuge rest become durable before hub agency returns |
| CANONICAL_DOCS_UPDATED | docs/project/CURRENT_STATUS.md; autonomy state pair |
| EVIDENCE | [Compact final proof](refuge-autosave-durability-1-browser/browser-qa.json), nine inspected captures; full raw proofs retained in ignored tmp |

2026-10-02 CURRENT FACT: the first and second refuges now autosave the existing owner state after arrival consolidation and before opening the hub. A successful rest autosaves before the hub reopens. Rejected rests do not add a save or change owner truth. The V6 schema, securing/rest rules, dialogue, durable IDs and final-refuge story-only behavior remain unchanged.

## Recovery and implementation

Run0723 failed on quota before closeout. Read-only app status confirmed its turn failed; its heartbeat was more than105 minutes old; no project build/QA/Git process or QA listener remained. The old lock was archived and a canonical exclusive1153 lock acquired. The source/docs/evidence work was preserved in a pushed temporary-index recovery snapshot before state updates. Snapshot payload paths and the operator repository destination were checked explicitly after automatic review requested stronger safeguards.

The inherited GameApp fix was retained. Seven refuge continuity tests exercise both consolidation/rest save boundaries, healthy/insufficient-gold rejection, management returns and the final refuge. Five neighbouring migration tests initially failed because they called `completeTraversalT0`, removed by `d1bd2ac`. Their harness/calls now use `completeTraversalArrival`; assertions and production Traversal behavior are unchanged.

The refuge driver now tests immediate entry and rest reloads without using management close as an incidental save. Optional `REFUGE_QA_USE_CONSUMABLE=1` additionally selects a wounded unit with native Home/ArrowDown/Enter, activates Potion with Space, compares health/inventory against `useConsumable` on an isolated owner-state copy, checks focus and verifies the existing management-close save. Its second wounded unit is declared in the initial preparation fixture so the subsequent rest remains meaningful; live game state is never injected.

## Verification and limits

- 94/94 tests across five suites PASS: refuge continuity7, campaign migration7, RunSystem16, management56, ManagementView8. TypeScript, direct eight-contract validator, production build and exactly eight MP4s PASS. Direct installed binaries avoided the host's missing npm CLI wrapper.
- 12/12 built-production immediate entry/rest cases PASS: both refuges at1366x768,620x780,390x844 with normal/OS-only reduced motion. Existing native details, preview focus, buy/sell/craft/equip/upgrades and V6 truth remain verified.
- 12/12 additional potion cases PASS over the same matrix; both failed-background cases PASS (first mobileOS and second620OS). All26 cases preserve immediate entry/rest resume, owner results and zero unexpected browser diagnostics. A preliminary potion smoke incorrectly expected a SELECT to be a BUTTON; the QA helper was corrected without runtime changes. Concurrent model-server startup printed one WebSocket-port advisory; the final potion matrix ran sequentially and browser diagnostics remained empty.
- A fresh production chronicle PASS traverses seven canonical nodes from Camp through Audience, Opening Ambush, Nomad Crossroads, Refugees, First Trial and First Refuge. Actual opening victory takes five rounds/31 actions: attack7,move9,potion2,wait13. Four units deploy; no outcome, teleport, fixture state or game-truth mutation is injected. The built bootstrap exposes the GameApp instance for read-only observation. Video skip and authored choices use normal controls. First-refuge consolidation empties temporary loot; immediate V6 reload restores exactly the same owner state without replaying combat or securing twice.
- Final accepted earned evidence is a fresh chronicle, not the prior recovery chain. Earlier ignored recovery artifacts are retained as history. Full later campaign routes, defeat, tactical balance, mobile combat, final authored VFX and complete demo accessibility remain open; this checkpoint does not accept them.

Raw output roots: `tmp/refuge/durability-1153-final`, `tmp/refuge/potion-1153-final`, `tmp/refuge/durability-1153-failed-first`, `tmp/refuge/durability-1153-failed-second`, `tmp/demo/continuous-1153-fresh-final`. The compact proof records their exact hashes and canonical earned/resumed owner fingerprints. Preview ports5250–5253 were started by this run and closed by the drivers.

## Selected captures

| State | Capture |
| --- | --- |
| First-refuge desktop focus after immediate reload | [Desktop](refuge-autosave-durability-1-browser/first-refuge-desktop.png) |
| Second-refuge mobile OS reduced motion | [Mobile](refuge-autosave-durability-1-browser/second-refuge-mobile-os.png) |
| Native equipment preview Retour focus | [Mobile](refuge-autosave-durability-1-browser/preview-return-mobile.png) |
| Failed second-refuge background preserves agency | [620](refuge-autosave-durability-1-browser/second-refuge-unavailable-620.png) |
| Potion owner result and focus | [MobileOS](refuge-autosave-durability-1-browser/potion-mobile-os.png), [620](refuge-autosave-durability-1-browser/potion-620.png) |
| Actual earned deployment and victory | [Deployment](refuge-autosave-durability-1-browser/earned-opening-deployment.png), [Victory](refuge-autosave-durability-1-browser/earned-opening-victory.png) |
| Earned refuge after V6 reload | [Resumed](refuge-autosave-durability-1-browser/earned-refuge-resumed.png) |

## Contract compliance

Read constitution, README/manifest, all eight contracts, T0 contract, active operator ledger/decisions and multi-agent protocol. Contract set v1, `PRODUCTION-CONTRACTS-LOCK-1`, baseline `b1e8858`. Read-only contracts-guardian independently inspected the diffs and all final browser JSON.

| Row | Result | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | GameApp persists existing owner truth at established lifecycle boundaries |
| ART_DIRECTION | PASS | No art/palette change |
| CHARACTERS | PASS | V2 assets untouched |
| ENVIRONMENTS | PASS | Existing backgrounds and failure agency verified |
| NARRATIVE / CAMPAIGN | PASS | IDs, choices, securing/rest rules and final-refuge type retained |
| NARRATIVE_PRESENTATION | PASS | Existing surfaces and exactly eight slots unchanged |
| TRAVERSAL | PASS | Test-name repair only; no route rules or transient save fields |
| COMBAT | PASS | Actual five-round opening victory; no injected outcome; full balance remains open |
| SAVE | PASS | Both V6 entry/rest boundaries and fresh earned resume equality |
| UI / ACCESSIBILITY | PASS | Three widths, native keyboard targets/actions/focus, OS motion and fallback |
| QA_EVIDENCE | PASS | 26 refuge cases plus fresh earned proof, nine inspected immutable captures |
| REPOSITORY_GOVERNANCE | PASS | Verified dev implementation push; temporary-index WIP; protected Git gates silent |

No LOCKED rule changed: committed comparison to `b1e8858` and protected working-tree status print nothing. Audio DEFERRED. Artistic remaster stays incomplete/external; no media generation, polling or MP4 replacement. Alistair and extra-slot decisions remain open.

Next action: reuse `tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json` with its exact `results.json` provenance; extend the bounded normal-input driver beyond first-refuge agency through T1/Bois-Clair to the second refuge, then both terminal routes. Retain separate mobile/OS-motion/defeat/VFX acceptance and normal owner management preparation; do not inject combat outcomes or fabricate state.
