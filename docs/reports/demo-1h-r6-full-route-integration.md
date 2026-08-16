# R6 — Full one-hour route integration

Date: 2026-08-16  
Repository: `juniorbattle/RPGThreeJS`  
Branch: `main`  
Required and verified baseline HEAD: `a68ff9e6955a9e1b116c66814fb7baf4079f9bb6`

## Outcome

R6 integrates and validates the existing R1–R5 Lion Seal campaign without adding a campaign engine, route node, combat, morality model, broad content, VFX, or cinematic production.

The authoritative 21-node/depth-17 braid remains unchanged. The integration pass adds validators and deterministic full-route fixtures, and repairs one finale save boundary: the chosen route is now persisted before combat and can be resumed without replaying Alaric's judgement or applying its reputation effect twice.

## Runtime ownership and end-to-end flow

The audited production path is:

```text
createInitialState / createRunState / generated 21-node run
  -> TravelView selection
  -> GameApp.chooseRunNode
  -> runSystem.enterRunNode
  -> GameApp.resolveRunNode
  -> resolveGameDialogue
       -> R2 finale builders where applicable
       -> R3 base + contextual variants/optional steps
  -> DialogueView presentation and choice input
  -> GameApp.applyEffects
  -> combat pre-dialogue
  -> CombatBridge / real legacy combat runtime
  -> CombatResult
  -> progress + reward + historical facts
  -> combat post-dialogue
  -> authored R3 ATE
  -> optional R4 opportunity/selection/playback
  -> mark resolved / reveal next nodes
  -> TravelView + V6 autosave
  -> final refuge
  -> cumulative Alaric judgement
  -> persisted Serpent Pursuit or Lion Trial selection
  -> route-specific final combat
  -> route-specific aftermath
  -> epilogue / finishChapter
  -> completed run and terminal map
```

Ownership remains `historical facts -> derived narrative state -> scene-specific presentation`. `DialogueView` is still a renderer/player-interaction layer. Lion conduct, witnesses, Shadow knowledge/disclosure, verdict, ATE selection, and R4 selection remain pure game-layer resolution.

## Post-node order

`GameApp.playPostNodeNarrative` is locked by a source-level regression test to:

1. `maybePlayATEs(nodeId)`;
2. `maybePlayReputationEvent(nodeId)`;
3. travel/autosave after both finish.

The two current dual-trigger moments are `lion-first-refuge` and `lion-village-choice`. Browser QA observed both doctrines in production order. Opening, crossroads, refugees, reserve trail, Valmir road, both refuges, witnesses, Shadow signs, and final refuge were also traversed without a post-node replay.

## Content reachability and reference integrity

| Registry | Count | Result |
|---|---:|---|
| Static `DialogueSequence` entries | 71 | 68 production-reachable normal/conditional; 3 legacy compatibility; 0 unexplained unreachable |
| R3 contextual dialogue definitions | 15 | All production-referenced; every patch target and optional-step anchor valid |
| Contextual ATE rules | 10 | Every trigger node and dialogue valid |
| R4 event definitions | 9 | Every opportunity/dialogue valid; all remain social-only |
| Combat configurations | 17 | Every configuration and declared pre/post hook valid |

The three preserved legacy-compatible dialogues are:

- `mystery_ambush`;
- `mystery_troll_crossing`;
- `serpent_duelist_trial`.

No registered production dialogue is left without an explanation. The validator also proves:

- all node `contentId` references resolve;
- every combat ID resolves to one `CombatConfig`;
- every combat pre/post dialogue resolves through the real dialogue resolver;
- every ATE and R4 dialogue resolves;
- all contextual patch targets exist in their base sequence;
- all optional anchors are valid linear anchors;
- R4 effects cannot start combat or manufacture Shadow knowledge;
- finale content resolves through the R2 builders;
- each epilogue exposes a valid `finishChapter` ending.

## Topology audit

The generated campaign remains exactly 21 nodes with maximum depth 17.

- All nodes are reachable from `lion-camp`.
- `lion-final-judgement` is the only terminal node.
- Every non-terminal node has forward progress.
- Every link targets a valid node at greater depth, so there are no cycles.
- All branch joins are valid.
- Refuge checkpoints point to valid refuge nodes.
- Entering a node reveals that node and its forward links coherently.
- Adaptive event/combat substitutions change content, not topology.
- Final refuge and final judgement remain reachable for all tested seeds.

No node or route repair was required.

## Save/reload matrix

Both a pure-honour route and an infamy route are serialized through the real V6 schema at every required boundary. Each round-trip preserves current/revealed/visited/resolved nodes, reputation and history, flags, derived Lion state, ATE flags, R4 occurrences, temporary loot, roster, and final route.

| Boundary | Assertion |
|---|---|
| A — after opening combat | Combat progress/reward facts, current node, next reveal |
| B — first refuge | Secured loot/checkpoint and first-refuge narrative markers |
| C — before Bois-Clair | Reserve-trail facts and route history |
| D — after Bois-Clair | Saved/sacrificed fact and immediate aftermath |
| E — after witnesses | Supportive/silenced witness precedence |
| F — after Shadow signs | None/fragments/evidence knowledge without invented disclosure |
| G — final refuge | Full dossier, ATE/R4 history, roster, temporary loot |
| H — before judgement | Finale eligibility and cumulative verdict inputs |
| I — after route selection | Mutually exclusive selected route and pending boss |
| J — after final victory | Victory fact, Seal, completed run, route aftermath/ending inputs |

### Finale save-boundary repair

Previously, the selected boss lived only in the in-memory `pendingCombatId`. Reloading after the judgement choice could therefore return to the last autosave and replay judgement, including the voluntary-trial reputation penalty.

R6 keeps the existing V6 schema and records two mutually exclusive booleans in the existing `flags` record:

- `lionFinaleSerpentPursuitSelected`;
- `lionFinaleTrialSelected`.

The pure resolver distinguishes selected from still-pending by checking the authoritative victory facts (`serpentGeneralDefeated` or `lionTrialWon`). Trial wins contradictory legacy selection flags as the safe precedence because it grants no recognition before martial proof. `GameApp` saves immediately after first selection, reuses an existing selection instead of reapplying effects, and resumes a pending selected boss on Continue. A completed selected boss does not resume.

The browser reload proof was performed after imposed Lion Trial selection and before victory. Continue retained reputation at 5, did not replay judgement or Shadow disclosure, resumed the Lion-specific pre-combat sequence, and entered `lion_chief`.

## Once-only and duplication audit

- ATEs remain guarded by their existing once flags.
- R4 selections remain unique, budgeted, spaced, and recorded only after playback.
- The nine-event pool produced no duplicate family/event and never exceeded two events.
- Historical effects, recruitment, items, gold, and combat rewards are applied only on their existing resolution boundaries.
- The new finale selection is idempotent; its route/reputation effects cannot be applied again on resume.
- Shadow disclosure remains a single decision. Revealed overrides contradictory legacy conceal state.
- R2's recognized Serpent route still acknowledges the Seal before pursuit; final victory reasserts that acknowledgement with `serpentGeneralDefeated`. Lion Trial still grants acknowledgement only after defeating the champion.
- Completed victory suppresses pending-finale resolution, preventing a repeat final combat/Seal reward.
- Aftermath, epilogue, and `finishChapter` remain on the successful boss result path.

## Narrative continuity findings

No R5 prose rewrite was required. Production traversal confirmed:

- fallen-clan motivation precedes the Lion mandate;
- Alaric's opening expectations are paid off cumulatively at judgement;
- recruited Cedric appears in later reactions and the absent profile does not invent him;
- refugee and reserve decisions remain distinct historical beats;
- Bois-Clair immediate reaction precedes later witness consequences;
- Serpent escalation follows, rather than precedes, the relevant discoveries;
- Shadow knowledge is not referenced as known before the signs scene;
- reveal/conceal is distinct from acquiring evidence;
- final refuge assembles the dossier without deciding the route;
- the correct boss, aftermath, Serpent state, and epilogue are selected per route.

## Bois-Clair end-to-end gate

The integration matrix covers:

| Profile | Derived meaning | Witness/finale result |
|---|---|---|
| Saved | Decisive merit | Eligible for Serpent route with credible support |
| Sacrificed | Decisive breach | Lion Trial |
| Legacy saved + sacrificed | Sacrifice breach remains decisive | Lion Trial |
| Saved + minor stains | Merit with reservations | Route follows full cumulative support |
| Saved + silenced witnesses | Decisive witness breach | Lion Trial |
| Sacrificed + high reputation | Public reputation cannot erase the historical breach | Lion Trial |

Each profile is traced through R3 aftermath, witness state, applicable R4 history, final refuge, cumulative verdict, and final route. No intermediate layer reinterprets R1/R2 semantics.

## Shadow end-to-end gate

The matrix validates `none -> fragments -> definitive evidence -> revealed/concealed -> route-aware pre-combat -> aftermath -> epilogue`.

- Knowledge and disclosure remain separate axes.
- Evidence outranks fragments.
- Reveal outranks contradictory legacy conceal.
- Disclosure is offered once at judgement when still undecided.
- R4 cannot create knowledge.
- Serpent aftermath can recover the route's artifact without duplicating disclosure.
- Lion Trial aftermath states that the carried evidence remains with the clan and that the Serpent General remains in flight.

## Finale traces

### Serpent Pursuit

Honourable continuous browser route: honour mandate, Cedric recruited, refugees aided, village prioritized, Bois-Clair saved, reward refused, witnesses protected, Shadow evidence preserved and revealed, recognition claimed, `serpent_captain` selected, Serpent General defeated, Seal acknowledged, Serpent-specific aftermath, matching epilogue, completed terminal map.

### Imposed Lion Trial

Continuous infamy browser route: advance demanded, Cedric absent, refugees/merchant abandoned, reserves seized, shrine looted, Bois-Clair sacrificed, witnesses silenced, informant betrayed, definitive Shadow evidence preserved but concealed, honest deposition, recognition rejected, `lion_chief` selected, reload/resume boundary passed, champion defeated, Seal awarded, General explicitly still free, Lion-specific epilogue, completed terminal map.

### Voluntary Lion Trial

The deterministic full-route fixture completes a high-honour voluntary trial through `lion_chief`, victory, Seal, Lion aftermath, and `lion_trial_voluntary` ending. Additional browser inspection used a final-checkpoint seed and confirmed the distinct lines:

- Alaric honours the requested trial as a deliberate choice;
- the trial is explicitly “not a punishment” because the player chose it;
- the route selects the Lion champion despite Serpent eligibility.

## Deterministic golden runs

Eleven deterministic fixtures execute twice and compare equal:

1. pure honour;
2. real mixed profile;
3. uncertain;
4. infamy;
5. high reputation + infamy;
6. low reputation + honour;
7. saved Bois-Clair + silenced witnesses;
8. Cedric absent;
9. Shadow revealed;
10. Shadow concealed;
11. voluntary trial.

Every fixture asserts selected adaptive content, important ATEs, R4 event/no-event outcomes, Conduct, witness state, Shadow knowledge/disclosure, Alaric stance, route/cause, boss and pre/post dialogue, ending ID, roster continuity, Seal, and completed run. Lion Trial fixtures also assert that `serpentGeneralDefeated` is not invented.

## Real browser QA

The two principal profiles were played continuously from a new chronicle through the completed-map state using the production `GameApp`, `TravelView`, `DialogueView`, contextual resolver, ATE scheduler, R4 director, `CombatBridge`, combat iframe, R2 finale, aftermath, and epilogue.

For practical browser automation, each production combat was loaded through its real configuration/prelude/bridge/result path and completed with a temporary development-only QA victory control. That control and the temporary inspection/seed pages were removed before validation. A first opening-battle attempt also exercised normal tactical turns and defeat/fail-forward; reload returned atomically to the prior autosave without corrupting route state.

Console audit:

- errors: 0;
- existing warnings: unresolved deleted legacy VFX sheets are skipped by `VfxSystem` as designed;
- no R6 runtime, resolver, save, dialogue, combat-transition, or finale error appeared.

## R4 integration

Existing opportunity windows, deterministic weighted selection, family uniqueness, global budget, and spacing are unchanged. Automated fixtures and browser routes observed both selected-event and no-event outcomes. Authored ATEs always played first when both systems were eligible. No R4 event played after chapter completion.

## Combat integration

All 17 production configurations retain their gameplay data. Validators cover pre-dialogue, load, result, reward facts, post-dialogue, and map continuation. Adaptive variants resolve to the correct framing. Defeat restores the last safe autosave/checkpoint. Final bosses select the correct route presentation and aftermath. Combat mechanics and VFX files have no final diff.

## Playtime regression

R6 adds no route content and does not change the R5 timing model or combat allowances. The R5 resolved-content regression remains:

| Mode | Result |
|---|---:|
| Fast legitimate | 46.789 minutes |
| Normal | 58–66 minutes |
| Content-rich | 72–84 minutes |

The fast-route model remains covered by the existing R5 regression test.

## Tests and validation

New `r6FullRouteIntegration.test.ts` coverage includes runtime order, selection/resume idempotency, reachability, all reference families, topology, 11 goldens, A–J save boundaries, ATE/R4 duplication, Bois-Clair, Shadow, finale, Seal, and all combat hooks.

Final command results are recorded after the clean production run:

- full Vitest suite: PASS — 59 files, 1,296 tests;
- TypeScript `npx.cmd tsc --noEmit`: PASS;
- production build: PASS — 94 modules transformed;
- `git diff --check`: PASS.

## Deferred

- R7: broad statistical route/state simulation and distribution analysis.
- R8: cinematic production, if authorized.
- Existing skipped legacy-VFX warning cleanup remains outside R6 because combat/VFX changes were prohibited.

## Final gates

| Gate | Result |
|---|---|
| FULL_ROUTE_OPENING_TO_END | PASS |
| POST_NODE_ORDERING | PASS |
| CONTENT_REACHABILITY | PASS |
| REFERENCE_INTEGRITY | PASS |
| TOPOLOGY_INTEGRITY | PASS |
| SAVE_RELOAD_BOUNDARIES | PASS |
| NO_DUPLICATE_EFFECTS | PASS |
| ATE_ONCE_ONLY | PASS |
| R4_EVENT_FREQUENCY | PASS |
| R4_DETERMINISM | PASS |
| CEDRIC_CONTINUITY | PASS |
| BOIS_CLAIR_END_TO_END | PASS |
| WITNESS_END_TO_END | PASS |
| SHADOW_END_TO_END | PASS |
| SERPENT_PURSUIT_FULL_ROUTE | PASS |
| LION_TRIAL_FULL_ROUTE | PASS |
| VOLUNTARY_TRIAL_FULL_ROUTE | PASS |
| SEAL_GUARANTEED_AFTER_FINAL_VICTORY | PASS |
| CHAPTER_FINISH | PASS |
| FAST_ROUTE_45_MIN_MINIMUM | PASS — 46.789 min |
| NORMAL_ROUTE_55_70_MIN | PASS — 58–66 min |
| SAVE_V6_COMPATIBLE | PASS |
| R1 / R2 / R3 / R4 / R5 | PRESERVED |
| COMBAT_GAMEPLAY | UNCHANGED |
| VFX | UNCHANGED |
| CINEMATIC_SYSTEM | NOT STARTED |
| FULL_TEST_SUITE | PASS — 59 files / 1,296 tests |
| TYPECHECK | PASS |
| BUILD | PASS |
| GIT_DIFF_CHECK | PASS |
| READY_FOR_R7 | YES |

R6 stops before commit. Nothing is committed or pushed.
