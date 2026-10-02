# Combat grid reachability and native card scrolling

| Field | Value |
| --- | --- |
| TASK | DEMO-QA-POLISH / combat-grid-hit-reachability-1 |
| DOMAIN | Combat UI and production QA |
| BASELINE | dev5455d067e45e8120c318453268ebc51143a46ad0 |
| BRANCH | dev |
| HEAD | 790dc26ad18bf1f6def706f91543298515a33d85; final state commit is HEAD/origin/dev |
| STATUS | Review; scoped dev checkpoint; demo item9 IN_PROGRESS |
| MERGED_IN | NONE; dev checkpoint |
| SUPERSEDES | NONE; complements native keyboard checkpoint |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Capped responsive inspection card leaves grid accessible; #panel native wheel scrolling |
| CANONICAL_DOCS_UPDATED | AUTONOMOUS_WORK_STATE.md/.json and current handoff |
| EVIDENCE | combat-grid-hit-reachability-1/proof.json and 9 selected captures; raw ignored tmp/demo/*-final-wheel |

CURRENT FACT: native baseline620×780 had six cell centers intercepted by #panel (gx0–2,gz2–3). Diagnostic390 expanded and560 cards also obstructed centers. The final CSS belongs after HUD anchors in combat-hud.css; it caps and moves the interactive card at narrow/intermediate widths and short heights. Deployment preview, pointer events, camera, actors and art retain their owners.

The inherited global wheel preventDefault blocked the card itself. The minimal predicate exempts only #panel descendants; five new tests keep canvas/body/outside controls/null targets blocked. No AP, damage, outcome or campaign write path was added. References to legacyCombatRuntime were inventoried before editing.

The grid driver uses native pointer motion at32cell centers in movement,expanded inspection and target modes; four6px offsets use batched DOM hit tests, not native offset raycasts. It compares listed tactical fields and exercises native move/Undo and actual attack AP spending. Standalone campaignAcceptance=false; OS emulation and graphics class are distinct observations. Full keyboard grid navigation, damage correctness, campaign motion/fallback and combat balance are not certified.

Card proof checks native wheel scrolling (57/57/99/71px), last-stat visibility and explicitly refocused toggle visibility. Opening stats still replaces the button and drops focus to BODY in all four cases. focusRetentionAccepted=false; nonempty status/aptitude content remains unverified. This is an exact next accessibility task.

Champion driver policy conserves the archer's last AP via existing Wait/Souffle so authored2AP precise shot can be used. No balance rule, owner assertion or earned lineage guard changed. Final Champion37actions include4conserve waits and10attacks but zero skill casts: conservation is observed, authored precise shot use is not certified. Successful1323second-refuge ancestry is mixed-build and does not prove one corrected opening-to-ending build. Failed/interrupted continuations never seed certified work.

## Terminal outcomes

| Job | Status | Acceptance |
| --- | --- | --- |
| 2122-grid-final-wheel | SUCCEEDED | ACCEPTED_SCOPED |
| 2122-card-final-wheel | SUCCEEDED | ACCEPTED_SCOPED |
| 2122-intermediate-final-wheel | FAILED | NOT_ACCEPTED |
| 2122-trial-final-wheel | FAILED | NOT_ACCEPTED |

95focused tests across5suites,16unchanged receipt-helper tests,TypeScript,8contracts/8slots,production build,syntax and both LOCKED/whitespace gates PASS. Direct repository binaries avoid inherited missing npm-cli.js. Vite chunk advisory remains inherited. All13 grid cases passed. All4native card scroll cases accepted. Recovery: NOT_ACCEPTED; Champion: NOT_ACCEPTED.

Earlier owned jobs retain ABORTED_HARNESS_DEFECT/COST/SOURCE_CORRECTION or FAILED: focused Undo shortcut misuse, costly offset sampling, misplaced CSS overridden by later HUD anchors,620early marais defeat and native card wheel blocking. None certifies final source. Owned trees were stopped before corrections. Historical1952reviewed jobs and their hashes are preserved; generic sync cannot revoke their acceptance. All receipts, inputs, source-diff, driver/helper/build and result hashes are retained in proof/ledger. Unchanged reviewed bytes are verified against committed Git blobs at checkpoint.

620final: marais native victory54actions8rounds; village bound22Wait,round9Alistair2HP alive,othersKO,no defeatRecovery. Champion final: round8,312/520HP,Alistair72HP/Kestrel90HP alive,Marian/CedricKO,no ending. Bounds are failures of acceptance, not proof of deadlock/balance defects.

## Contract compliance

Contract set PRODUCTION-CONTRACTS-LOCK-1/v1. Constitution,index,manifest,AUTONOMOUS_WORK_PROTOCOL,CAMPAIGN_AND_STATE,COMBAT_AND_VFX,UI_AND_ACCESSIBILITY,AUTHORING_AND_QA and relevant presentation/Traversal boundaries read. Both protected Git gates print nothing. LOCKED rules impacted: presentation ownership,responsive controls,evidence integrity. No LOCKED rule changed. Orchestrator matrix applies only to accepted scopes:

| Row | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Truth ownership unchanged |
| ART_DIRECTION | N/A | Protected art unchanged |
| CHARACTERS | N/A | Cast and identity unchanged |
| ENVIRONMENTS | N/A | Assets/camera unchanged |
| NARRATIVE / CAMPAIGN | BLOCKED | Required620recovery and Champion continuation boundaries not reached |
| NARRATIVE_PRESENTATION | N/A | Dialogue/choices/canon unchanged |
| TRAVERSAL | N/A | No source change; recovery acceptance withheld |
| COMBAT | PASS | Wheel input ownership only; native QA no injected outcome |
| SAVE | PASS scoped | V6/schema unchanged; recovery only as accepted above |
| UI / ACCESSIBILITY | PASS scoped | Card scrolling; grid only as accepted above; focus retention/full grid keyboard open |
| QA_EVIDENCE | PASS scoped | Matching terminal proofs required; failed/interrupted work excluded |
| REPOSITORY_GOVERNANCE | PASS | Single owned lock,temp-index snapshots,dev-only verified pushes |

Full demo completion remains BLOCKED by unaccepted ending/branches,focus retention/full keyboard/fallback,VFX and balance criteria. Audio DEFERRED; exactly8videos unchanged; remaster external/manual. Next exact action is in the current handoff/state.
