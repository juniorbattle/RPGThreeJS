# Native rejection telemetry and recovery QA

TASK: DEMO-QA-POLISH / native rejection and novice support pilot
DOMAIN: Tooling, tactical combat QA, campaign QA
BASELINE: e547e316a79e08f37a4d1987cb7506ba889acc7e on dev
BRANCH: dev
HEAD: Pilot 770ec706fd5ffb9b2cb49cfa9259a6f41b9d783f; evidence/state checkpoint recorded in closeout state
STATUS: Scoped recovery accepted; full demo IN_PROGRESS
MERGED_IN: NONE; direct dev checkpoints
SUPERSEDES: NONE; previous accepted and failed proofs retain their scope
SUPERSEDED_BY: NONE
PRODUCTION_IMPACT: NONE; native-input pilot and read-only observations only
CANONICAL_DOCS_UPDATED: Paired autonomy state and 2026-10-03T0350Z handoff
EVIDENCE: native-rejection-recovery-1/proof.json and seven selected captures; raw jobs under tmp/demo/0350-recovery-crosier and tmp/demo/0350-recovery-mobile-os

CURRENT FACT: the runtime already heals allies selected by a crosier basic attack. The old pilot excluded ally targets; potion-first actions also consumed attack AP in the previous failed run. This pilot uses the lowest enabled charge for wounded allies, follows native reachable cells, and uses half-health potion priority outside the Champion. Champion Salvation preferences are retained. All actions use native controls; no damage, AP, resources or outcome is written or predicted by the pilot. This does not certify balance or a general winning strategy.

Read-only telemetry records active AP/status/weapons, button and charge availability, native pending centers/spec, projected pointer position, iframe geometry, DOM hit/hover and skip reasons. Rejected native targets remain rejected. Crosier assertions check selected-ally HP gain and AP reduction or actor transition. The reviewer independently matched each observed heal's AP debit to its native spec; no second AP formula was added.

Both 25-minute jobs use only the successful continuous-1153-fresh-final first-refuge V6 and exact successful proof. Historical ancestry stays explicit; this is not a new opening-to-ending build proof. Failed 0228 outputs never become seeds. Original trial acceptance remains on 726bb75/acfda8ec. Runtime tree 7f7b49e9 and all nine production artifacts match the prior 0228 build receipt; no new build claimed. Source, driver, helper and build were frozen throughout both workers.

| Production scenario | Native Marais victory | Requested village defeat | Recovery |
| --- | --- | --- | --- |
| 620×780 normal motion | 6 rounds, 47 actions, 6 crosier heals; 3 survivors | 9 rounds, 22 native Waits; 4 deployed heroes KO | ACCEPTED_SCOPED |
| 390×844 OS-only reduction | 9 rounds, 50 actions, 5 crosier heals; Alistair sole survivor | 5 rounds, 9 native Waits; 2 deployed heroes KO | ACCEPTED_SCOPED |

Each result has errors=[], mutation flags false, exact expected/recovered/resumed whole V6 equality, matching exported save, empty temporary loot, cleared T1/T3 branches and retained T0 branch. The recovered T1 departure is visible and focused before and after reload. Mobile records actual OS query true and game setting false. This verifies the recovery scenario with OS reduction requested; it does not exhaustively certify every animation.

All 30 intermediate and 32 mobile pointer attempts hit the native canvas/hover. At 620 px, 14 attack attempts lacked an eligible native target, 3 had a disabled attack button and 16 resolved. No pointer rejection was observed in these runs; this is not a general obstruction finding. Compact proof includes canonical owner hashes, raw result hashes, provenance and selected rejected attempts; full states remain in ignored raw results.

Seven selected captures were inspected: intermediate Marais victory, both native village return controls, both recovered departures and their reloads. Departure has visible blue focus and safe viewport bounds. The intermediate victory retains the final attack overlay, so settled VFX remains open. One reused read-only guardian made three focused passes: launch, 620 recovery and mobile recovery. Both receipts and all driver/seed/helper/runtime/build hashes were independently checked. Workers 11028/37092 exited; ports 5273/5274 have no listeners.

Verification: 101 focused tests in five suites, 16 receipt tests, TypeScript, driver syntax, whitespace/LOCKED gates and eight-contract/eight-slot validator PASS. Broken Roaming npx/npm wrappers required direct local Node CLIs; esbuild ancestor metadata denial required elevated test execution. No automatic approval rejection remained. Tests/build were reused only with unchanged relevant provenance. Two registered jobs, two scoped recoveries, zero failed seeds; quota savings not measured.

## Orchestrator compliance matrix

Contract set PRODUCTION-CONTRACTS-LOCK-1/v1. Read constitution, index/manifest, AUTONOMOUS_WORK_PROTOCOL, CAMPAIGN_AND_STATE, COMBAT_AND_VFX, UI_AND_ACCESSIBILITY, AUTHORING_AND_QA and PRESENTATION_AND_MEDIA. No LOCKED rule changed; both Git gates silent. This matrix covers the pilot and these recovery scenarios; full item9 remains incomplete.

| Row | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Native tactical and campaign owners retained |
| ART_DIRECTION | PASS for preservation | No assets changed |
| CHARACTERS | PASS for preservation | No cast or canon changed |
| ENVIRONMENTS | PASS for preservation | No environment changed |
| NARRATIVE / CAMPAIGN | PASS scoped | Authored village/checkpoint outcome unchanged and verified |
| NARRATIVE_PRESENTATION | PASS for preservation | Eight slots; no generation, polling, replacement or audio work |
| TRAVERSAL | PASS for preservation | No route/scene changes; visible T1 departure verified |
| COMBAT | PASS scoped | Actual native resolution, support and defeat |
| SAVE | PASS scoped | Whole V6 cleanup/persistence/reload equality |
| UI / ACCESSIBILITY | PASS scoped | Intermediate/mobile controls, departure focus and OS-only parameters |
| QA_EVIDENCE | PASS scoped | Matching receipts/provenance, exact lineage and inspected captures |
| REPOSITORY_GOVERNANCE | PASS | Owned lock, explicit snapshots, dev push; main untouched |

Full demo remains IN_PROGRESS: battlefield keyboard, sacrifice, fallback, settled VFX, balance, one corrected-build earned campaign and exact 2AP-start Salvation are open. Keyboard preparation is read-only: onClick/bindInput currently own pointer activation and shortcuts; the next change must share cell activation, preserve native legality, add Tab/focus/arrow/Enter/Escape and a live cell announcement, and keep cursor state out of V6. A new runtime/build needs matching production evidence. Artistic videos remain external; audio DEFERRED.
