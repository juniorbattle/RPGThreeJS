# R3 — Conditional dialogues and contextual ATE foundation

## 1. Baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and actual HEAD before editing: `78cb76791ba1e73250dc09deb500ea96de776c62`
- Baseline worktree: clean
- R1 authority: Narrative Truth Foundation
- R2 authority: Alaric cumulative verdict and final route repair
- Commit/push performed: no

R3 is an additive narrative-resolution pass. It does not change campaign length, route topology, combat content, Combat Stage, VFX, skills, balance, equipment, crafting, or assets.

## 2. Architecture

The runtime path is now:

```text
GameState + dialogue id
  -> R2 contextual builder when the id belongs to the finale
  -> immutable base DialogueSequence
  -> pure R3 condition/variant/optional-step resolver
  -> resolved DialogueSequence
  -> DialogueView
```

`src/game/contextualDialogue.ts` is the reusable pure foundation. It owns condition evaluation, precedence, deterministic equivalent-variant selection, step patches, optional-step insertion, ATE eligibility, ATE ordering, and once-only flag naming.

`src/game/contextualDialogueContent.ts` owns the small R3 content registry. It composes existing `dialogues`, R2's `buildLionContextualDialogue`, focused R3 definitions, and the existing post-node ATE trigger table.

`GameApp.playDialogue` resolves the sequence before presentation. `DialogueView` is unchanged and still only handles rendering, local choice availability, player input, and effect dispatch.

No campaign morality, Lion fact decoding, or contextual decision tree was moved into `DialogueView`.

## 3. Condition model

`DialogueCondition` supports:

- boolean historical flags, including an explicit expected `false` value;
- public reputation ranges;
- reputation-history matches by exact source or source prefix, delta range, and minimum count;
- resolved nodes and visited nodes;
- seen unique events;
- units currently in the clan;
- R1 Lion Conduct tiers;
- R1 Lion witness states;
- R1 Shadow knowledge states;
- R1 Shadow disclosure states;
- R2 verdict reason IDs;
- R2 verdict stances;
- R2 final-route results;
- nested `all`, `any`, and `not` expressions.

Missing legacy boolean facts normalize to `false`. Conditions read the existing `GameState`; they do not write state and do not add a new meter.

Public reputation and reputation history are available for socially appropriate future content, but the R3 pilots do not use reputation as a substitute for Conduct or historical truth.

## 4. R1 and R2 semantic reuse

The contextual resolver calls:

- `resolveLionNarrativeState(state.flags)` for Conduct, witness, Shadow knowledge, and Shadow disclosure;
- `resolveLionVerdict({ flags, reputation })` for Bois-Clair reason IDs, stance, and final-route facts.

It contains no raw interpretation of the decisive R1 witness or Shadow flags. Bois-Clair pilots use R2's `saved_bois_clair` and `sacrificed_bois_clair` reason IDs instead of recreating the R2 verdict.

Contradictory facts therefore keep authoritative precedence:

- silenced witnesses outrank protected witnesses;
- definitive Shadow evidence outranks fragments;
- revealed disclosure outranks concealed disclosure;
- the R2 route still sends a `missionSuccess + missionGreed` legacy record to the Lion Trial.

R3 adds an explicit highest-priority contextual line for the contradictory saved-and-sacrificed Bois-Clair record; it does not reinterpret or repair the stored facts.

## 5. Dialogue definition model

A contextual definition is composed of a base `DialogueSequence` plus two optional collections:

- `variants`: a condition, priority, optional equivalence group, and targeted step patches;
- `optionalSteps`: a condition, priority, linear anchor, and one new step.

Only one exclusive variant is selected. All eligible optional steps are inserted. The resolver deep-clones the base before changing it, validates the final result with `dialogueSequenceSchema`, and leaves the registered source sequence immutable.

The optional-step implementation rewires a simple linear anchor:

```text
anchor -> original next

becomes

anchor -> eligible optional step(s) -> original next
```

Invalid anchors, choice-bearing anchors, duplicate step IDs, and mismatched optional IDs fail with explicit errors instead of producing a corrupt dialogue graph.

## 6. Precedence rules

Variant precedence is exact and deterministic:

1. discard ineligible variants;
2. keep only the highest numeric priority;
3. if one remains, select it;
4. if tied variants do not all share the same non-empty equivalence group, the first declaration wins;
5. if every tied variant shares the same equivalence group, sort by stable variant ID and select with the deterministic hash.

This makes decisive facts easy to protect with a higher priority. The Bois-Clair pilot uses:

```text
400 contradictory saved + sacrificed legacy record
300 sacrificed Bois-Clair
200 saved Bois-Clair + honour Conduct
100 other saved Bois-Clair
  0 unchanged base fallback
```

Optional steps are ordered by descending priority and then declaration order.

## 7. Deterministic behaviour

The resolver never calls `Math.random`.

Equivalent tied variants use a stable FNV-1a hash of:

```text
run seed + dialogue sequence id + equivalence group
```

Candidates are sorted by stable variant ID before indexing. The same serialized save therefore resolves to the same variant after load, independent of map insertion order or process lifetime.

Hash selection is available only when every highest-priority tied candidate explicitly names the same equivalence group. The group is a content-author assertion that the candidates express the same narrative facts. Factually distinct variants use priority and conditions, never hash variation.

The current pilots intentionally prefer exact fact variants; the deterministic equivalent-selection mechanism is covered with synthetic tests for future use.

## 8. ATE model

`ContextualAteRule` contains:

- stable rule ID;
- trigger node ID;
- dialogue ID;
- priority;
- optional eligibility condition;
- optional once-only behaviour.

`resolveEligibleAteRules` is pure. It filters by trigger, prior once-only completion, and semantic eligibility, then orders by priority and declaration order. The selected dialogue goes through the same contextual dialogue resolver as every non-ATE sequence, so ATE eligibility and dialogue variant selection share one fact model.

All pre-R3 trigger/dialogue pairs remain present:

- opening ambush -> Alaric report;
- nomad crossroads -> Serpent scout report;
- refugees -> village fear;
- Valmir road -> Serpent warning;
- Bois-Clair choice -> Maelor Seal analysis;
- witnesses -> Lion council doubt;
- Shadow signs -> ruins awaken and Serpent retreat order.

The two Shadow ATEs now require authoritative Shadow knowledge of fragments or evidence. In normal play this is established by the immediately preceding choice. A contradictory legacy state with no Shadow knowledge no longer receives an ATE that invents knowledge.

All current ATE rules remain once-only. Completion still uses the established save-compatible key `ate:<dialogue-id>`, is written only after successful playback, and is now handled through the reusable rule API. No broad reputation-driven pool or event director was added.

## 9. Pilot scenes

### Cedric continuity

- The first Serpent scout report no longer invents a recruited ranger when Cedric was declined.
- The later Serpent warning names Cedric and his knowledge only when he was recruited; otherwise it explicitly notes that the company learned without a ranger.
- `final_refuge` conditionally inserts one Cedric continuity step after Maelor's preparation line. The step is absent when Cedric was not recruited.

### Post-Bois-Clair

`ate_maelor_seal_analysis` patches one existing line for:

- honourable saved Bois-Clair;
- mixed saved Bois-Clair;
- sacrificed Bois-Clair;
- contradictory saved-and-sacrificed legacy facts.

The ATE retains its perspective, title, art, surrounding lines, and place in the campaign spine.

### Witness consequences

`ate_lion_council_doubt` has focused Alaric/Champion reactions for:

- supportive witnesses;
- silenced witnesses;
- unprotected witnesses;
- no decisive witness testimony.

The variant is driven solely by the R1 witness state.

### Shadow knowledge and disclosure

- `ate_serpent_retreat_order` distinguishes preserved definitive evidence from broken fragments via R1 Shadow knowledge.
- `serpent_pursuit_pre_combat` distinguishes definitive evidence revealed to Alaric from evidence concealed from him.
- `pre_lion_chief` carries the same disclosure distinction into the Lion Trial route without changing trial cause or eligibility.

These are presentation differences only. R2 remains the authority for the single disclosure decision, route, aftermath, and epilogue.

## 10. Backward compatibility

The `DialogueSequence` Zod schema was not changed. Existing content does not need conditional metadata.

When a dialogue has no R3 definition:

- the existing static sequence or R2-generated sequence is selected;
- it is cloned and schema-validated;
- no variant is selected;
- no optional step is inserted;
- the rendered structure and content are unchanged.

R3 definitions live beside content rather than inside every existing sequence. The implementation therefore avoids duplicating full sequences to alter one or two lines.

## 11. Save impact

- Save version: 6, unchanged
- Schema migration: none
- New persisted morality/trust/reputation meter: none
- Persisted contextual variant ID: none
- Persisted deterministic random roll: none
- Existing historical flags reused: yes
- Existing reputation history reused: supported, not duplicated
- Existing ATE once-only keys reused: yes

Resolution is derived every time from the loaded `GameState`. A save made before R3 remains valid; absent boolean facts resolve as false, and contradictory R1/R2 facts retain their authoritative precedence.

## 12. R1/R2 preservation

- `DialogueView` was not edited.
- R1 source-boundary tests still prohibit Lion flag interpretation in `DialogueView`.
- R1 `lionNarrative` tests pass unchanged.
- R2 `lionVerdict` and `lionFinale` tests, including golden profiles and route-aware aftermath/epilogue assertions, pass unchanged.
- R3 wraps the R2-built finale sequences before rendering; it does not change `resolveLionVerdict`, `resolveLionFinaleExecution`, boss IDs, route flags, aftermath builders, ending IDs, or disclosure effects.
- Serpent pursuit and Lion Trial routes remain available.
- The R2 single Shadow disclosure remains single.

No R1 or R2 regression was discovered.

## 13. Focused tests

`src/game/contextualDialogue.test.ts` adds 17 tests covering:

- generic condition evaluation;
- public reputation and reputation-history conditions;
- previous-choice flags and missing legacy flags;
- completed/visited encounter facts, seen events, and clan membership;
- R1/R2 contradictory semantic precedence;
- a source boundary proving the pure resolver delegates decisive Lion semantics;
- variant priority;
- non-equivalent tie declaration order;
- deterministic equivalent selection across serialized save/load;
- optional-step insertion, ordering, omission, and path rewiring;
- unchanged legacy dialogue sequences;
- honourable, mixed, sacrificed, and contradictory Bois-Clair variants;
- supportive and silenced witness variants;
- revealed and concealed definitive Shadow evidence;
- Cedric recruited and absent variants;
- ATE eligibility, order, trigger preservation, and once-only behaviour.

## 14. Full validation

- Full Vitest suite: 56 files passed, 1,226 tests passed, 0 skipped, 0 failed.
- TypeScript typecheck: passed.
- Production build: passed; 91 modules transformed.
- `git diff --check`: passed.
- R1 `DialogueView` narrative-boundary tests: passed.
- R1 narrative semantic tests: passed.
- R2 verdict/finale golden tests: passed.

The expected test-only warnings remain limited to deliberate fail-forward fixtures for a failed cinematic interlude and missing cinematic manifest. The production build retains the pre-existing large-chunk advisory.

## 15. Browser QA

The in-app browser exercised the real `DialogueView`, real content map, R2 builders, and R3 pure resolver through a transient Vite QA entrypoint. The entrypoint and `main.ts` branch were removed immediately after QA; no debug route remains.

| Required/profile check | Selected variant | Visible result |
| --- | --- | --- |
| A — honourable saved Bois-Clair | `bois-clair-saved-honour` | Séraphine stated that the company carried Bois-Clair's inhabitants before itself and that conduct aligned with the rescue. |
| B — mixed saved Bois-Clair | `bois-clair-saved-mixed` | Séraphine kept the saved village decisive while naming the compromises around it. |
| C — infamy / sacrificed Bois-Clair | `bois-clair-sacrificed` | Séraphine stated that reserves were chosen while inhabitants paid the price. |
| D — definitive Shadow evidence revealed | `shadow-revealed` | Séraphine stated that Alaric knows the deposited evidence and can act on a real target. |
| E — definitive Shadow evidence concealed | `shadow-concealed` | Séraphine stated that the proof remains hidden and the company carries the truth alone. |
| F1 — Cedric recruited | optional `r3-cedric-continuity` | Cedric appeared at the final refuge and answered for the paths he opened. |
| F2 — Cedric absent | no optional step | The sequence advanced directly from Maelor to Séraphine; Cedric did not appear. |
| Cedric-aware Serpent report | `cedric-recruited` / `cedric-absent` | The General either named Cedric's route knowledge or explicitly noted that no ranger opened the path. |
| Supportive witnesses | `witnesses-supportive` | Alaric described survivors speaking freely and bringing facts. |
| Silenced witnesses | `witnesses-silenced` | Alaric identified testimony suppressed by coercion and refused to treat silence as acquittal. |

Browser console warnings/errors: none.

## 16. Scope guard results

- New combats: none
- Combat gameplay or balance changes: none
- Combat Stage changes: none
- VFX changes: none
- Skill/equipment/crafting changes: none
- Asset changes: none
- Route topology changes: none
- Finale eligibility changes: none
- Campaign-duration expansion: none
- Reputation Event Director: not added
- Broad reputation event pool: not added

## 17. Deferred R4 and R5 work

R4 remains responsible for a Reputation Event Director or broad reputation-driven contextual event pool. The R3 rule and condition APIs can support that work, but R3 does not schedule arbitrary events, weight a pool, or create a new reputation subsystem.

R5 remains responsible for the 55–70 minute narrative expansion, additional campaign content, and broader scene coverage. R3 pilots only the highest-value seams needed to prove the architecture while preserving the current campaign spine.

## 18. Stop state

Implementation, tests, build, browser QA, and this report are complete. The worktree is intentionally left uncommitted. No commit and no push were performed.
