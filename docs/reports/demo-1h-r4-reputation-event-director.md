# R4 — Reputation / Conduct Event Director

## 1. Baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and actual HEAD before editing: `0a2db1f93faf20126628a651e7dbf374322aa0a7`
- Baseline worktree: clean
- R1 authority: Narrative Truth Foundation
- R2 authority: Alaric cumulative verdict and final route repair
- R3 authority: conditional dialogues and contextual ATE foundation
- Commit/push performed: no

R4 is a system-foundation pass with four short social pilots. It does not perform the R5 one-hour content expansion and does not change campaign topology, combat content, Combat Stage, VFX, skills, balance, equipment, crafting, or assets.

## 2. Audit result

The existing save already provides stable scheduling facts: run seed, current node, visited and resolved node IDs, `stepCounter`, `seenUniqueEvents`, `reputationHistory`, historical flags, and R3 ATE completion flags.

`combatCooldowns` is not used by the director. It remains combat-specific.

`getReputationRule` already owns the five public-reputation bands and supplies `eventWeightModifiers` plus `ambushWeightMultiplier`. Before R4 these weight fields had no runtime consumer outside `reputation.ts`. R4 consumes them without introducing parallel thresholds.

## 3. Architecture

The pure selection path is:

```text
GameState + ReputationEventOpportunity + event definitions
  -> stable scoped candidate collection
  -> R3 DialogueCondition eligibility
  -> unique / family cooldown / frequency / budget filters
  -> canonical ReputationRule social weights
  -> stable FNV-1a roll
  -> ReputationEventSelection + complete trace
```

The presentation path remains:

```text
selected dialogue ID
  -> R3 contextual dialogue resolver
  -> resolved DialogueSequence
  -> GameApp.playDialogue
  -> DialogueView
  -> record occurrence after successful playback
```

Responsibilities are separated as follows:

- `src/game/reputationEventDirector.ts`: pure reusable descriptors, filtering, weighting, deterministic selection, trace, and persisted occurrence encoding.
- `src/game/reputationEventContent.ts`: the small campaign-specific pilot catalog, three opportunity windows, and contextual pilot variants.
- `src/game/contextualDialogueContent.ts`: composes pilot contextual definitions into the existing R3 dialogue-resolution path.
- `src/game/GameApp.ts`: requests a selection after authored post-node ATEs, presents the selected sequence, then records completion.
- `src/game/content.ts`: four short backward-compatible `DialogueSequence` pilots.

`DialogueView` was not edited. It contains no event selection, reputation interpretation, Conduct logic, or Lion fact interpretation.

## 4. Event descriptor model

`ReputationEventDefinition` supports:

- stable event ID and tags;
- base weight;
- opportunity key, trigger-node, and required-tag scope;
- an R3 `DialogueCondition` eligibility expression;
- unique behavior;
- family ID and cooldown steps;
- dialogue ID;
- `hostile`, `helpful`, or `neutral` social category;
- optional ambush weighting;
- deterministic priority used in stable candidate ordering;
- explicit authored conditional weight modifiers;
- consequence hints and content tags for future tooling.

Campaign prose and raw Lion flag decoding do not live in the generic director.

## 5. Opportunity model and frequency

`ReputationEventOpportunity` contains a stable key, trigger node, saved step identity, tags, a no-event weight, an optional per-run event budget, and optional global minimum spacing.

Only three campaign windows are registered:

| Opportunity | Trigger | No-event weight | Run budget | Minimum spacing |
| --- | --- | ---: | ---: | ---: |
| `lion-social-window-1` | first Lion refuge | 12 | 2 | 3 steps |
| `lion-social-window-2` | Bois-Clair choice aftermath | 12 | 2 | 3 steps |
| `lion-social-window-3` | final refuge | 14 | 2 | 3 steps |

The director is therefore not called as an unrestricted event-after-every-node pool. A deterministic no-event outcome is legitimate. At most two R4 reputation events can play during the run, the authored windows are widely separated, unique events cannot repeat, and event families can impose their own step cooldown.

## 6. R3 condition reuse and eligibility

The director calls `evaluateDialogueCondition`; it does not add another condition language. Definitions may therefore use the existing R3 model for flags, public reputation, reputation history, visited/resolved nodes, seen events, clan membership, nested conditions, R1 Lion semantics, and R2 verdict semantics.

The Bois-Clair denunciation pilot demonstrates concrete historical eligibility. It enters the pool only for an authoritative serious negative fact:

- R1 Conduct is `infamy`;
- R1 witness state is `silenced`;
- R2 includes `sacrificed_bois_clair`; or
- R2 includes `betrayed_informant`.

The content definition contains none of the decisive raw Lion flags. Contradictory legacy facts retain R1/R2 precedence through the R3 evaluator. Public reputation can alter the event's social weight, but cannot make the accusation false or suppress its eligibility.

## 7. Weighting formula

For an otherwise eligible event:

```text
effectiveWeight
  = baseWeight
  x getReputationRule(state.reputation).eventWeightModifiers[category]
  x ambushWeightMultiplier when the event explicitly opts into ambush weighting
  x eligible authored event-specific modifiers
```

Missing category modifiers normalize to `1`. Weights are rounded to six decimal places for inspectable stable traces.

Public reputation remains social perception:

- at reputation 10, the pilot weights are intimidation `16`, information `8`, petition `5.5`;
- at reputation 50, they are `10`, `8`, `10`;
- at reputation 90, they are `5`, `8`, `15.5`.

Conduct is not a hidden global multiplier. It affects eligibility or contextual prose, except for explicit narratively justified modifiers on the serious Bois-Clair accusation. Ambush weighting is implemented and tested with a synthetic definition; no social pilot is falsely described as an ambush.

## 8. Deterministic selection

The director never calls `Math.random`.

Candidates are stable-sorted by descending authored priority and then event ID. Registration or map insertion order cannot affect the candidate order or result.

The FNV-1a input is:

```text
reputation-event-director-v1
| run seed
| stable opportunity key
| trigger node ID
| saved step identity
```

The unsigned hash maps to `[0, 1)` and then into the total of eligible event weights plus the opportunity's no-event weight. The same serialized save at the same opportunity therefore produces the same selected event and identical trace. Different run seeds can legitimately select different eligible outcomes.

## 9. Selection trace

Every pure selection returns a non-persisted `ReputationEventSelectionTrace` containing:

- opportunity key, trigger, step, and tags;
- public reputation and canonical rule band;
- registered, scoped, eligible, and rejected event IDs;
- rejection reasons per candidate;
- base weight, category, reputation modifier, ambush modifier, explicit modifiers, and effective weight;
- previous occurrence count and last event step;
- event, no-event, and total weight;
- exact hash input, unsigned hash, unit roll, and weighted roll;
- selected event ID or explicit no-event result.

This trace is returned to tests and future QA/simulation tooling. It is not written to `GameState`.

## 10. Save/load behavior

- Save version: 6, unchanged
- Schema migration: none
- New meter or score: none
- Persisted random roll: none
- Persisted trace: none
- `combatCooldowns` reused: no

Completed R4 events use the semantically appropriate existing `seenUniqueEvents` history. A marker records step, opportunity, event ID, and family:

```text
reputation-director-event|<step>|<opportunity>|<event>|<family>
```

This is sufficient for unique consumption, global spacing, budgets, and family cooldowns after save/load. The marker is added only after `DialogueView` playback resolves; failed or interrupted presentation cannot consume the event. Existing v1–v6 migrations already preserve `seenUniqueEvents`, so no schema field or migration is required.

## 11. Relationship to R3 ATEs

R3 ATEs remain authored, fixed-trigger, conditionally resolved narrative beats with their existing `ate:<id>` once-only flags.

R4 events remain optional weighted-pool results with occurrence markers. The schedulers share `DialogueCondition`, contextual dialogue resolution, and `DialogueView`, but remain separate methods and registries.

At a completed node, `GameApp` plays eligible R3 ATEs first and then asks for the R4 opportunity. All existing R3 ATE trigger pairs, priorities, ordering, and once-only handling are unchanged.

## 12. Pilot events

| Event | Social direction | Proof supplied |
| --- | --- | --- |
| `roadside-intimidation` | hostile / lower reputation | public hostility; honour and infamy contextual lines prevent low reputation from rewriting Conduct |
| `brokered-information` | neutral | pragmatic information purchase or refusal with no moral reinterpretation |
| `public-petition` | helpful / higher reputation | reputation creates a costly public expectation; an infamy variant refuses to call fame moral trust |
| `bois-clair-denunciation` | hostile + historical eligibility | serious Conduct/witness/verdict fact controls eligibility and exact accusation even at very high reputation |

All four are short dialogue choices using existing effect types: gold, reputation, and concrete historical booleans. They add no combat and no asset.

## 13. Focused tests

`src/game/reputationEventDirector.test.ts` adds 21 tests covering:

- R3 condition evaluation and R1/R2 semantic boundary reuse;
- canonical reputation-rule weighting;
- hostile/helpful/neutral band changes;
- aggregate low/neutral/high weighted outcomes;
- ambush and explicit history modifiers;
- high reputation with decisive negative history;
- low reputation with honourable history;
- band-safe fallback prose outside each event's favored social band;
- contradictory legacy fact precedence;
- deterministic save/load resolution;
- stable candidate order and registration-order independence;
- different seeds;
- legitimate no-event and no-eligible-event results;
- duplicate identity rejection;
- unique consumption and persisted occurrence parsing;
- family cooldown, global spacing, and run budget;
- three explicit opportunity windows;
- R3 ATE/director separation;
- non-combat pilots and consequence metadata;
- unchanged save schema and unused `combatCooldowns`.

Validation results:

- Focused R4 suite: 21 passed, 0 failed.
- Full Vitest suite: 57 files passed, 1,247 tests passed, 0 failed.
- Standalone TypeScript: `npx.cmd tsc --noEmit` passed.
- Production build: passed; 93 modules transformed. Vite retained its existing non-blocking large-chunk advisory.
- `git diff --check`: passed.

The full suite includes the existing R1 Lion semantics, R2 verdict/finale golden profiles and routes, R3 contextual dialogue/ATE tests, and DialogueView boundary regressions.

## 14. Browser QA

QA used the actual local Vite app and the real path:

```text
serialized profile -> GameApp.maybePlayReputationEvent
-> director -> GameApp.playDialogue -> R3 resolver -> DialogueView
```

A development-only bootstrap was used to load exact profiles and was removed after QA. No debug route remains in the production diff.

| Profile | Saved inputs | Rendered result | Verification |
| --- | --- | --- | --- |
| A. low reputation | reputation 10, seed 2, first refuge | `roadside-intimidation` | Hostile band; weights `16 / 8 / 5.5`; coherent public intimidation |
| B. neutral reputation | reputation 50, seed 1, first refuge | `brokered-information` | Neutral band; weights `10 / 8 / 10`; pragmatic information offer |
| C. high reputation | reputation 90, seed 1, first refuge | `public-petition` | Renowned band; weights `5 / 8 / 15.5`; costly public expectation |
| D. high + serious negative | reputation 95, saved + sacrificed contradictory Bois-Clair history | `bois-clair-denunciation` | Rendered the sacrifice fact and explicitly said fame cannot erase it; effective event weight `7.2` |
| E. low + honourable | reputation 5, saved Bois-Clair + helped refugees | honour variant of `roadside-intimidation` | Rendered “Vos actes sur la route sont honorables”; no impossible infamy claim |
| F. deterministic reload | JSON-round-tripped reputation 50, seed 1, first refuge | `brokered-information` | Identical trace; hash input ended in `lion-social-window-1|lion-first-refuge|6`, hash `1745574928` |

Each played sequence exposed the normal DialogueView choice/consequence UI. After completing a choice, a second request at the same saved opportunity rendered no second dialogue and reported the event consumed. Browser console errors: none.

## 15. Preservation

- R1 `lionNarrative.ts`: unchanged.
- R2 `lionVerdict.ts` and `lionFinale.ts`: unchanged.
- R3 `contextualDialogue.ts`: unchanged.
- `DialogueView.ts`: unchanged.
- Save schemas and migrations: unchanged.
- Serpent pursuit and Lion Trial eligibility: unchanged.
- Single Shadow disclosure and route-aware aftermath/epilogue behavior: unchanged.
- Combat gameplay, Combat Stage, VFX, skills, balance, equipment, crafting, and assets: unchanged.

No R1/R2/R3 regression was discovered.

## 16. Deferred R5 work

R5 still owns the 55–70 minute campaign expansion, the broad authored event/content pool, additional opportunity coverage, expanded social consequences, and any new production encounters. R4 intentionally supplies the deterministic director, trace, persistence policy, and four small pilots only.

## 17. Stop state

| Gate | Result |
| --- | --- |
| `REPUTATION_EVENT_DIRECTOR` | PASS |
| `R3_CONDITION_REUSE` | PASS |
| `R3_ATE_PRESERVED` | PASS |
| `PUBLIC_REPUTATION_REMAINS_SOCIAL` | PASS |
| `NO_NEW_MORALITY_METER` | PASS |
| `DETERMINISTIC_WEIGHTED_SELECTION` | PASS |
| `SAVE_LOAD_REPRODUCIBLE` | PASS |
| `EVENT_TRACE_AVAILABLE` | PASS |
| `LOW_REPUTATION_PROFILE` | PASS |
| `NEUTRAL_REPUTATION_PROFILE` | PASS |
| `HIGH_REPUTATION_PROFILE` | PASS |
| `HIGH_REP_CANNOT_REWRITE_INFAMY` | PASS |
| `LOW_REP_CANNOT_REWRITE_HONOUR` | PASS |
| `R1_PRESERVED` | PASS |
| `R2_PRESERVED` | PASS |
| `R3_PRESERVED` | PASS |
| `COMBAT_GAMEPLAY` | UNCHANGED |
| `VFX` | UNCHANGED |
| `FULL_TEST_SUITE` | PASS |
| `TYPECHECK` | PASS |
| `BUILD` | PASS |
| `GIT_DIFF_CHECK` | PASS |
| `READY_FOR_R5` | YES |

STOP before commit. No commit or push was performed.
