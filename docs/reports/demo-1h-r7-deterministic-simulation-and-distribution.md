# Demo 1h — R7 Deterministic Simulation and Distribution Audit

## Status

R7 is complete at the requested stop-before-commit state. It adds QA-only simulation tooling, focused regression tests, and aggregate snapshots. It does not alter campaign runtime behavior, story content, combat, route topology, VFX, or cinematics.

## Baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and verified baseline HEAD: `098b774136e6e6aee33dc532aa67eb31febc54ee`
- Initial worktree: clean
- R1–R6 were audited from the implementation at that baseline before R7 changes.
- Commit: no
- Push: no

## Simulation architecture

The reusable pure harness is `src/qa/r7LionSimulation.ts`. It imports and calls the production resolvers directly, but is not imported by `GameApp`, `DialogueView`, or any runtime campaign path.

The harness provides:

- `simulateLionRunProfile(profile, seed)` for a browser-free narrative/system run;
- `simulateLionSeedRange(profile, seeds)` for fixed reproducible sweeps;
- `aggregateLionSimulation(results)` for compact distribution summaries;
- coherent canonical and controlled-matrix profile generation;
- isolated legacy-contradiction profiles;
- explicit impossible-outcome detection;
- R3 contextual/ATE audit helpers;
- R4 opportunity, trace, distribution, cooldown, spacing, uniqueness, budget, and registration-order audits;
- R6 persisted-selection, pending-combat, completed-victory, voluntary-trial, ending, and reload audits.

The simulator follows the 21-node Lion route without rendering or tactical combat. It applies authored profile facts at their relevant milestones, asks the production run system for adaptive nodes, resolves production dialogues and ATEs, invokes the production R4 director at its three real opportunity windows, and uses the production R2/R6 finale APIs. Boss victory is represented by the authoritative narrative victory facts; battle AI is not simulated.

`npm run test:r7-simulation` runs the heavy audit separately from normal Vitest. Per-seed raw records are never written. The committed-style artifacts are aggregates only:

- `src/qa/r7FastRegressionSnapshot.json`: small normal-suite regression snapshot;
- `docs/reports/demo-1h-r7-distribution-snapshot.json`: full compact audit aggregate.

## Fact-determined versus seed-variable contract

| System/output | Classification | Authoritative input/ordering |
|---|---|---|
| Lion Conduct score/tier | FACT_DETERMINED | R1 weighted historical flags |
| witness semantic state | FACT_DETERMINED | R1 precedence: silenced, supportive, unprotected, none |
| Shadow knowledge | FACT_DETERMINED | R1 precedence: evidence, fragments, none |
| Shadow disclosure | FACT_DETERMINED | R1 precedence: revealed, concealed, undecided |
| decisive historical facts and R2 reason eligibility | FACT_DETERMINED | saved/sacrificed Bois-Clair, coercion, informant, lie, etc. |
| Alaric stance and verdict | FACT_DETERMINED | R2 cumulative verdict resolver |
| pre-selection final route | FACT_DETERMINED | R2 verdict plus explicit final player intent |
| persisted R6 finale selection | FACT_DETERMINED | saved selection flags; Lion Trial is the existing safe legacy precedence |
| completed victory, Seal, and ending | FACT_DETERMINED | selected boss victory facts and route-aware epilogue |
| fixed route graph topology | FACT_DETERMINED | current 21-node Lion template |
| adaptive trial substitutions | FACT_DETERMINED | Conduct, mandate, completed elite, and saved mystery assignment |
| seeded creature presentation at opening/Valmir road | SEED_VARIABLE | run seed plus node depth |
| decisive R3 variants and optional steps | FACT_DETERMINED | conditions, priority, then authored order |
| R3 equivalent variant group | SEED_VARIABLE when authored | stable hash over seed/sequence/group and ID-sorted candidates |
| ATE eligibility, order, and once-only suppression | FACT_DETERMINED | trigger, condition, priority, seen flag |
| R4 candidate eligibility and weights | FACT_DETERMINED | facts, reputation band, history, opportunity, cooldown/budget state |
| R4 selected event or no-event | SEED_VARIABLE | stable opportunity hash and eligible weighted pool |

The audit found zero production R3 variants with an `equivalenceGroup`. R7 therefore did not invent equivalent prose content. It audited the generic production algorithm with a QA-only, factually equivalent three-candidate fixture.

## R6 finale persistence contract

The simulator distinguishes:

1. **Pre-selection:** R2 and the player's finale intent may select a route.
2. **Persisted final route:** `lionFinaleSerpentPursuitSelected` or `lionFinaleTrialSelected` owns the boss. No seed, dialogue, R4 event, reload, or later verdict call may replace it.
3. **Completed victory:** `serpentGeneralDefeated` or `lionTrialWon` suppresses resume for its selected boss; Seal and ending remain route-consistent.

The existing R6 safe precedence for a corrupt record with both selection flags remains Lion Trial. R7 introduces no new precedence.

## Profile generator

### Coherent authored profiles

All 24 required coherent profiles are present: the 20 historical/choice families and four persisted/completed finale states. They are authored scenario records, not random flag bags. Their fields model mandate, refugee handling, reserve choice, Bois-Clair, witnesses, Shadow knowledge/disclosure, Cedric, reputation, finale intent, and carefully scoped additional historical facts.

### Legacy contradiction profiles

Five contradiction profiles are isolated from coherent production profiles:

- saved plus sacrificed Bois-Clair;
- supportive/protected plus silenced witnesses;
- fragments plus definitive evidence;
- revealed plus concealed disclosure;
- both finale selection flags.

The simulator does not normalize or repair them.

### Controlled cross-product

The controlled matrix attempted 2,268 combinations across the requested meaningful dimensions. It accepted 588 coherent profiles and rejected 1,680 invalid or misclassified combinations.

| Validity reason | Rejection hits |
|---|---:|
| disclosure without definitive evidence | 1,008 |
| saved village plus R1 `unprotected` representation | 378 |
| supportive witnesses plus sacrificed village | 378 |
| conduct template did not derive the requested family | 252 |

Reason hits are not mutually exclusive; one attempted record may violate multiple rules. The Conduct-family rule always verifies the authoritative R1 resolver rather than trusting the generator label.

## Seeds, cases, and performance

| Batch | Fixed range | Cases |
|---|---:|---:|
| 24 coherent canonical profiles | 0..999 | 24,000 |
| 5 legacy contradiction profiles | 0..999 | 5,000 |
| controlled matrix | 200000..200587 | 588 |
| R4 distribution, seven reputation values | 0..9999 | 70,000 runs / 210,000 opportunities |
| R3 equivalent fixture | 0..9999 | 10,000 resolutions |
| **Total deterministic cases** | documented above | **109,588** |

Latest full materialization timing on the development machine:

- 1,000 narrative simulations: approximately 1.64 seconds;
- 10,000 R4 runs: approximately 2.23 seconds;
- complete 109,588-case audit: approximately 75.17 seconds.

Runtime fluctuated with local load; an earlier complete pass took about 55 seconds. Runtime is deliberately excluded from the deterministic JSON snapshot. The normal focused R7 test file runs in about 2.6–2.8 seconds and the heavy sweep remains opt-in.

## Verdict and route distribution

Every listed profile produced the same stance and route for all 1,000 seeds. Counts are therefore 1,000/1,000 for the shown outcome.

| profile | stance | route | seed invariant |
|---|---|---|---|
| PURE_HONOUR | RESPECT | SERPENT_PURSUIT | yes |
| REAL_MIXED_PROFILE | RESPECT_WITH_RESERVATIONS | SERPENT_PURSUIT | yes |
| UNCERTAIN | UNCERTAIN | LION_TRIAL | yes |
| INFAMY | HOSTILE | LION_TRIAL | yes |
| HIGH_REPUTATION_PLUS_INFAMY | HOSTILE | LION_TRIAL | yes |
| LOW_REPUTATION_PLUS_HONOUR | RESPECT | SERPENT_PURSUIT | yes |
| SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES | DISTRUST | LION_TRIAL | yes |
| SACRIFICED_BOIS_CLAIR_PLUS_HIGH_REPUTATION | HOSTILE | LION_TRIAL | yes |
| SHADOW_REVEALED | RESPECT | SERPENT_PURSUIT | yes |
| SHADOW_CONCEALED | RESPECT | SERPENT_PURSUIT | yes |
| VOLUNTARY_LION_TRIAL | RESPECT | LION_TRIAL | yes |

The full snapshot contains the remaining 13 coherent profiles and all five legacy profiles. No global 50/50 route target was applied. Outcomes were evaluated only against each profile's history.

The broad moral assertions all passed across the sweeps:

- high reputation did not override infamy or village sacrifice;
- low reputation did not erase honour;
- saved Bois-Clair remained a decisive merit;
- sacrificed Bois-Clair remained a decisive breach;
- silenced witnesses retained precedence;
- betrayed informant remained a major breach and route-forcing fact;
- exploited refugees and the Alaric lie remained visible verdict reasons;
- definitive evidence outranked fragments;
- revealed disclosure outranked a legacy concealed contradiction.

## R4 expanded-pool distribution

The R4 audit uses an equal split of coherent saved/honour and sacrificed/infamy histories at each reputation value. This exposes all nine R5-expanded definitions without constructing a contradictory all-events-eligible state. Percentages use all 30,000 opportunity results at each reputation value.

| reputation | hostile % | neutral % | helpful % | no-event % |
|---:|---:|---:|---:|---:|
| 5 | 29.19 | 19.20 | 13.45 | 38.16 |
| 15 | 29.19 | 19.20 | 13.45 | 38.16 |
| 30 | 24.55 | 18.63 | 18.92 | 37.89 |
| 50 | 21.04 | 18.50 | 22.74 | 37.72 |
| 70 | 16.70 | 18.37 | 27.26 | 37.67 |
| 90 | 11.85 | 18.31 | 32.26 | 37.59 |
| 95 | 11.85 | 18.31 | 32.26 | 37.59 |

Values inside the same canonical reputation band are identical by design: 5/15 share Hostile rules, and 90/95 share Renowned rules. The directional contract is clear without requiring point-by-point monotonicity: hostile output falls, helpful output rises, and neutral output stays comparatively stable.

### Event selection rates

Counts combine all seven reputation batches and all three windows. `Eligible` is a candidate-opportunity count, not a run count.

| event ID | eligible | selected | selected/eligible |
|---|---:|---:|---:|
| bois-clair-denunciation | 45,889 | 11,580 | 25.23% |
| brokered-information | 152,866 | 21,279 | 13.92% |
| displaced-family-demand | 46,678 | 5,995 | 12.84% |
| fallen-banner-claimant | 26,639 | 3,485 | 13.08% |
| public-petition | 148,424 | 26,399 | 17.79% |
| refuge-supply-offer | 70,000 | 9,946 | 14.21% |
| roadside-intimidation | 148,380 | 25,735 | 17.34% |
| serpent-rumour-market | 130,360 | 17,877 | 13.71% |
| village-memorial-request | 47,911 | 8,269 | 17.26% |

No event crossed either investigation threshold: none was selected below 1% or above 80% of eligible opportunities. All nine definitions were eligible and selected. The original R4 events were not starved by the R5 pool expansion, and no new R5 event dominated globally.

### No-event and events per run

There were 79,435 no-event opportunity outcomes out of 210,000 (37.83%). The final refuge window had a 71.27–72.02% no-event rate because most runs had already used the two-event budget; this is an explained budget effect, not evidence that the authored no-event weight is broken.

| events/run | count | percentage |
|---:|---:|---:|
| 0 | 581 | 0.83% |
| 1 | 8,273 | 11.82% |
| 2 | 61,146 | 87.35% |

Average events per run were 1.8652. Quiet zero-event runs remain reachable. No-event never created an occurrence, consumed uniqueness, or spent budget.

There were 43,361 runs where the third window encountered budget-rejected candidates after two prior events. These are blocked attempts, not actual third events: actual runs above two events were zero.

### Rejections and hard invariants

Candidate-level rejection totals across the real windows:

| reason | count |
|---|---:|
| condition ineligible | 210,000 |
| unique already consumed | 128,077 |
| family cooldown | 0 |
| global spacing | 0 |
| run budget exhausted | 303,527 |
| non-positive weight | 0 |

The real opportunity steps are 6, 10, and 16, so family cooldown and global-spacing rejections are correctly zero on the normal route. Focused tests also inject valid close-step histories and prove both rejection paths activate. Across the full sweep there were zero duplicate unique events, zero spacing violations, zero family cooldown violations, zero registration-order changes, zero same-state determinism mismatches, and zero runs above the two-event cap.

## R3 contextual distribution

All production decisive variants, optional steps, Cedric branches, and Shadow disclosure branches were seed-invariant over their profile sweeps. Fact/priority selection was explicitly checked for:

- Bois-Clair saved honour;
- Bois-Clair saved mixed;
- Bois-Clair sacrificed;
- contradictory legacy Bois-Clair;
- supportive/silenced witness output;
- Shadow revealed/concealed output;
- Cedric recruited/absent output.

The production authored equivalent-group candidate count is zero. The QA-only equivalent fixture measured the production stable-hash algorithm over seeds 0..9999:

| equivalent variant | count | percentage |
|---|---:|---:|
| equivalent-a | 3,326 | 33.26% |
| equivalent-b | 3,317 | 33.17% |
| equivalent-c | 3,357 | 33.57% |

Same state plus seed, JSON reload, and reversed declaration order all selected the same equivalent candidate. Perfect uniformity was not required.

## ATE audit

All 10 production ATE rules were simulated. Every eligible rule resolved a real dialogue, every once-only rule was suppressed after its seen flag, and ordering remained priority/declaration based rather than random.

The audit specifically verified:

- first-refuge watch and Bois-Clair night watch resolve;
- Cedric-dependent first-watch output appears only with Cedric;
- Cedric absent/recruited Serpent reports remain fact-driven;
- Maelor's saved/mixed/sacrificed/legacy Bois-Clair analysis uses priority semantics;
- council witness output respects silenced precedence;
- both Shadow ATEs are suppressed when knowledge is absent;
- fragments and evidence choose their correct Serpent-retreat variants.

ATEs remain contextual authored beats, not an R4 weighted pool.

## Finale persistence and voluntary trial

| state | expected route | seeds tested | reload invariant |
|---|---|---:|---|
| pre-selection honour claim | Serpent Pursuit | 1,000 | yes |
| pre-selection infamy claim | Lion Trial, rejected claim | 1,000 | yes |
| Serpent selected, incomplete | Serpent Pursuit | 1,000 | yes |
| Lion Trial selected, incomplete | Lion Trial | 1,000 | yes |
| Serpent completed | Serpent Pursuit, no pending boss | 1,000 | yes |
| Lion Trial completed | Lion Trial, no pending boss | 1,000 | yes |
| legacy both selection flags | Lion Trial safe precedence | 1,000 | yes |

Selected routes remained selected across seed changes, resolver ordering, and serialization. Completed victories never resumed a boss. Victory facts produced one boolean Seal acknowledgement and one route-consistent ending; no duplicated Seal state or simultaneous completion was observed.

The voluntary-trial profile applied the existing `-2` reputation consequence once (65 to 63). Its persisted resume profile begins at 63, remains Lion Trial with cause `voluntary`, and remains 63 after resume. It completes with the Lion Trial ending and never reapplies the consequence.

## Legacy contradiction stress

| contradiction | authoritative precedence | seeds tested | invariant |
|---|---|---:|---|
| saved + sacrificed Bois-Clair | retain both reasons; sacrifice forces Lion Trial | 1,000 | yes |
| supportive + silenced witnesses | silenced | 1,000 | yes |
| fragments + definitive evidence | evidence | 1,000 | yes |
| revealed + concealed disclosure | revealed | 1,000 | yes |
| both R6 selection flags | Lion Trial safe precedence | 1,000 | yes |

No contradiction was repaired by the harness, and no seed changed its interpretation.

## Save/reload and registration order

The full audit compared direct simulation with a V6 schema serialization/reload after every route node for all 29 canonical/legacy profiles at seeds 0, 499, and 999: 87 representative reload comparisons, zero mismatches.

Compared fields include adaptive selections, contextual variants, optional steps, ATEs, R4 selections and trace summaries, Conduct, witnesses, Shadow semantics, verdict reasons, stance, route, persisted selection, pending boss, and ending.

R4 definitions were reversed at every audited opportunity without changing a selection. The R3 equivalent fixture also produced the same result with reversed declaration order because equivalent candidates are ID-sorted. Decisive non-equivalent R3 ties continue to use authored declaration order as designed.

## Impossible-outcome detector

Every run was checked for the required impossible combinations: respect with decisive unsupported infamy, Serpent despite route-forcing breach, reputation erasing moral truth, disclosure without knowledge, mismatched victory, trial completion without Seal, simultaneous completions, persisted-route reinterpretation, and ending/route mismatch.

Full result: zero impossible verdicts and zero impossible routes.

## Findings and defect classification

### Class A — logic defects

No production Class A defect was found.

During development, the QA result model initially reported Shadow knowledge after final victory. A Serpent victory authoritatively awards definitive evidence, so this obscured the knowledge state used by Alaric's decision for a fragments-only profile. The simulator was corrected to report decision-time verdict semantics while retaining final victory facts in its historical-fact output. This was a QA-only reporting defect; production logic was not changed.

### Class B — distribution questions

- The final opportunity's roughly 71–72% no-event rate is explained by the two-event cap reached earlier in most runs.
- Zero-event runs are uncommon (0.83%) but remain reachable.
- Same-band values produce identical results, as authored.

None contradict authored intent, so no weights, bands, cooldowns, spacing, or no-event values were changed.

### Class C — content/pacing

No R7 content or pacing change was made. If a future pass wants production seeded-equivalent prose, that is new authored content and remains deferred rather than inferred from this audit.

## Production and scope impact

- Production game logic modified: **no**
- Story scenes or dialogue content added: **no**
- R4 definitions or weights modified: **no**
- Save schema modified: **no**
- Combat: unchanged
- Route topology: unchanged
- VFX: unchanged
- Cinematic system: not started
- R5/R6 playtime baseline: preserved; timing regression not rerun because production behavior did not change

## Tests and validation

Focused R7 coverage includes 35 tests for profile generation/validity, deterministic reproduction, verdict and route invariance, reputation/morality separation, all semantic precedences, R3 equivalent and decisive variants, ATE eligibility/once behavior, R4 selection/order/directionality/no-event/budget/uniqueness/cooldown/spacing, R6 persistence, voluntary-trial idempotence, reload equality, impossible outcomes, and compact snapshot stability.

Final validation results are recorded after the report is complete:

- focused R7 Vitest: PASS — 35/35;
- full Vitest suite: PASS — 60 files, 1,331 tests;
- standalone TypeScript typecheck: PASS;
- production build: PASS;
- `git diff --check`: PASS.

## Deferred R8 work

- subjective pacing or repetition preferences;
- any deliberate change to event exposure or no-event frequency;
- any new authored R3 equivalent prose group;
- narrative/content expansion, combats, cinematics, or VFX.

No deferred item is required to make the R7 audit coherent or deterministic.

## Required summary verdict

- **BASELINE:** `098b774136e6e6aee33dc532aa67eb31febc54ee`
- **SIMULATIONS:** 109,588 deterministic cases; zero silently excluded batches
- **PROFILE COUNTS:** 24 coherent, 5 legacy, 588 accepted controlled-matrix profiles
- **SEED COUNTS:** 0..999 canonical/legacy; 0..9999 R4 and R3-equivalent; 200000..200587 matrix
- **VERDICT INVARIANTS:** PASS; zero seed-dependent moral meanings
- **R4 DISTRIBUTION:** PASS; all nine events selected, intentional no-event reachable, zero hard violations
- **R3 DISTRIBUTION:** PASS; decisive facts invariant; QA equivalent fixture 33.26% / 33.17% / 33.57%
- **ATE:** PASS; 10/10 rules audited, dialogue-valid, deterministic, and once-only where authored
- **FINALE PERSISTENCE:** PASS; selection, resume, completion, Seal, and endings coherent
- **LEGACY CONTRADICTIONS:** PASS; all five existing precedences invariant
- **SAVE / RELOAD:** PASS; 87 full representative comparisons, zero mismatches
- **PERFORMANCE:** approximately 1.64s / 1,000 narrative, 2.23s / 10,000 R4, 75.17s full latest run
- **REGRESSIONS:** R1–R6 full regression suite PASS
- **FINAL GATES:** PASS; READY_FOR_R8 = YES

## Final gates

| Gate | Result |
|---|---|
| SIMULATION_HARNESS | PASS |
| CANONICAL_PROFILE_GENERATOR | PASS |
| PROFILE_VALIDITY | PASS |
| FACT_SEED_SEPARATION | PASS |
| VERDICT_SEED_INVARIANT | PASS |
| FINAL_ROUTE_SEED_INVARIANT | PASS |
| HIGH_REP_CANNOT_OVERRIDE_INFAMY | PASS |
| LOW_REP_CANNOT_OVERRIDE_HONOUR | PASS |
| BOIS_CLAIR_PRECEDENCE | PASS |
| WITNESS_PRECEDENCE | PASS |
| SHADOW_PRECEDENCE | PASS |
| R4_WEIGHTED_DISTRIBUTION_MEASURED | PASS |
| R4_MAX_TWO_EVENTS | PASS |
| R4_UNIQUENESS | PASS |
| R4_FAMILY_COOLDOWN | PASS |
| R4_GLOBAL_SPACING | PASS |
| R4_NO_EVENT | PASS |
| R4_SAVE_RELOAD_DETERMINISM | PASS |
| R4_REGISTRATION_ORDER_INDEPENDENT | PASS |
| R4_EXPANDED_POOL_NO_FATAL_STARVATION | PASS |
| R3_EQUIVALENT_VARIANT_DETERMINISM | PASS |
| R3_DECISIVE_VARIANT_SEED_INVARIANT | PASS |
| ATE_DETERMINISM | PASS |
| ATE_ONCE_ONLY | PASS |
| LEGACY_CONTRADICTION_STRESS | PASS |
| R6_SERPENT_SELECTION_PERSISTENCE | PASS |
| R6_LION_SELECTION_PERSISTENCE | PASS |
| R6_COMPLETED_FINALE_NO_RESUME | PASS |
| VOLUNTARY_TRIAL_NO_DOUBLE_PENALTY | PASS |
| SEAL_NO_DUPLICATION | PASS |
| ENDING_ROUTE_CONSISTENCY | PASS |
| DISTRIBUTION_SNAPSHOT | PASS |
| NO_IMPOSSIBLE_VERDICT | PASS |
| NO_IMPOSSIBLE_ROUTE | PASS |
| SAVE_RELOAD_REPRODUCIBLE | PASS |
| R1_PRESERVED | PASS |
| R2_PRESERVED | PASS |
| R3_PRESERVED | PASS |
| R4_PRESERVED | PASS |
| R5_PRESERVED | PASS |
| R6_PRESERVED | PASS |
| COMBAT | UNCHANGED |
| TOPOLOGY | UNCHANGED |
| VFX | UNCHANGED |
| CINEMATIC_SYSTEM | NOT_STARTED |
| FULL_TEST_SUITE | PASS |
| TYPECHECK | PASS |
| BUILD | PASS |
| GIT_DIFF_CHECK | PASS |
| READY_FOR_R8 | YES |
