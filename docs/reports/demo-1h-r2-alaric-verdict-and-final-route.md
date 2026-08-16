# R2 — Alaric cumulative verdict and final route repair

## 1. Baseline

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and actual HEAD before editing: `2cdc8cf7d6c1345474eebf7c86d6d45e04b2b15d`
- Baseline worktree: clean
- Baseline commit: `R1 NARRATIVE TRUTH FOUNDATION`
- Commit/push performed: no

R1 remains the historical-truth layer. R2 consumes its pure Conduct, witness, Shadow knowledge, and Shadow disclosure results; it does not replace them.

## 2. Previous final-gate forensic

The previous `lion_finale_judgement` made the recognition path depend directly on:

```text
missionSuccess == true
missionGreed != true
reputation >= 45
```

The same choice then ran an extreme social contest. Success added 8 reputation and started `serpent_captain`; failure removed 10 reputation, set `alaricDoubt`, and started `lion_chief`. The voluntary trial button removed another 6 reputation, while victory over `lion_chief` removed 10 more. Consequently, a last audience interaction could dominate the preceding run and a legitimate trial behaved like failure.

The old finale also:

- interpreted raw witness flags instead of relying exclusively on the R1 witness state;
- asked about Shadow disclosure during judgement, aftermath, and epilogue;
- granted or removed additional public reputation at each disclosure;
- sent both bosses to one aftermath that declared the Serpent General dead;
- sent both routes to one epilogue that assumed the General carried the recovered artifact.

All final-route raw gates and the shared aftermath have been removed.

## 3. Verdict data model

`src/game/lionVerdict.ts` adds a pure, deterministic `resolveLionVerdict({ flags, reputation })` resolver. Its output contains:

- R1 `conductScore` and `conductTier`;
- clamped public `reputation` as social context;
- authoritative R1 `witnessState`, `shadowKnowledge`, and `shadowDisclosure`;
- semantic `majorMerits`, `majorBreaches`, `minorStains`, and `context` facts;
- `stance`;
- `finalRoute`;
- stable reason IDs suitable for tests and a future simulator.

The result is not persisted. No trust, karma, verdict score, stance, or final-route property was added to `GameState`.

`src/game/lionFinale.ts` is the focused R2 presentation/execution layer. It consumes the verdict, builds contextual French dialogue, resolves the final player intent, maps the route to one boss, and builds route-aware aftermaths and epilogues. It does not recalculate moral rules.

## 4. Fact severity model

### Decisive merit

- `saved_bois_clair` from `missionSuccess`

### Important supporting merits

- helped refugees;
- accepted the Lion mandate without an advance;
- helped the merchant;
- returned lost cargo;
- prioritized the village;
- preserved/rested at the shrine;
- supportive witnesses, derived from `LionWitnessState`;
- protected the informant;
- revealed definitive Shadow evidence.

Shadow knowledge alone is not a merit. `revealed_shadow_evidence` requires both definitive knowledge and a revealed disclosure state.

### Decisive breaches

- sacrificed Bois-Clair for reserves (`missionGreed`);
- silenced witnesses, derived from `LionWitnessState`;
- betrayed the informant.

### Important breaches

- exploited refugees;
- desecrated a shrine;
- lied directly to Alaric.

The lie is serious and downgrades stance, but one lie does not automatically make a strongly heroic run hostile or invalidate recognition.

### Minor stains

- requested the advance;
- claimed lost cargo;
- abandoned the merchant;
- looted the old shrine;
- prioritized loot on the reserve road;
- broke the Shadow altar for fragments.

Minor stains remain visible in Alaric's dialogue but cannot by themselves erase the decisive merit of saving Bois-Clair.

## 5. Exact stance rules

Rules are evaluated in this order:

1. `hostile` when greed, silenced witnesses, and Conduct infamy coexist, or when at least three decisive breaches coexist.
2. `distrust` when Bois-Clair was not saved, greed occurred, witnesses were silenced, the informant was betrayed, or Conduct is infamy.
3. For a saved village and honour Conduct:
   - `respect` requires no major breach, no minor stain, and strong corroboration from supportive witnesses, a protected informant, or revealed Shadow evidence;
   - otherwise `respect_with_reservations`.
4. Remaining non-catastrophic mixed cases are `uncertain`.

`alaricDoubt` is not read by the verdict and remains an historical reaction only.

## 6. Exact final-route rules

Rules are evaluated in this order:

1. An explicit `lionTrialRequested` choice produces `lion_trial`.
2. A missing successful Bois-Clair outcome or `missionGreed` produces `lion_trial`.
3. Conduct infamy produces `lion_trial`.
4. Silenced witnesses or a betrayed informant produce `lion_trial`.
5. A saved-village honour run produces `serpent_pursuit`.
6. A saved-village uncertain run produces `serpent_pursuit` only with at least one credible support:
   - supportive witnesses; or
   - definitive Shadow evidence already revealed; or
   - public reputation of at least 45.
7. An unsupported uncertain run produces `lion_trial`.

For contradictory legacy facts, decisive negative eligibility wins: `missionSuccess + missionGreed` always produces `lion_trial`.

## 7. Public reputation role

Public reputation is political credibility, not morality.

- It is not part of Conduct.
- It cannot override greed, infamy, silenced witnesses, betrayal, or a failed Bois-Clair outcome.
- It cannot force an honourable saved-village run to trial merely because it is low.
- At 45 or above, it may corroborate an otherwise uncertain run that has no decisive breach.
- The verdict exposes `low_public_reputation`, `credible_public_reputation`, or `high_public_reputation` as context reason IDs.

## 8. Mixed-run behavior

The real playtest profile with an advance, claimed cargo and/or prioritized loot, a saved village, helped refugees, and supportive witnesses resolves to:

```text
Conduct: honour
Stance: respect_with_reservations
Route: serpent_pursuit
```

The generated judgement explicitly acknowledges:

- that Bois-Clair still stands;
- the refugees or other supporting conduct;
- the requested advance;
- claimed cargo and/or diverted reserves;
- the authoritative witness state.

Alaric states that the stains are real but do not equal the fate of Bois-Clair.

## 9. Voluntary versus rejected trial

The final audience retains two meaningful intents:

- assume the complete record and claim recognition;
- request the Lion Trial.

The `resolveLionFinale` narrative effect is the narrow execution seam. `GameApp` delegates it to pure `resolveLionFinaleExecution` and only applies the returned flags, modest reputation consequence, and combat ID.

- Voluntary trial sets `lionTrialRequested = true`, starts `lion_chief`, and uses cause-specific pre-combat dialogue.
- A rejected claim starts `lion_chief` without setting `lionTrialRequested`; the pre-combat builder therefore identifies `rejected_claim`.
- An accepted claim starts `serpent_captain` and records Alaric's recognition.

No combat implementation was duplicated.

## 10. Lion Trial reputation normalization

Chosen values:

- accepted recognition intent: `+2` reputation;
- voluntary trial request: `-2` reputation;
- rejected claim: `0` reputation;
- `lion_chief` victory reward: `0` reputation.

Gold, materials, enemy data, combat balance, AP, AI, movement, skills, targeting, equipment, crafting, Combat Stage, and VFX remain unchanged.

The former final `+8 / -10 / -6` audience swings and the automatic `-10` Lion boss reward are gone.

## 11. Final-refuge restoration

The runtime `LION_ROUTE_TEMPLATE` now contains:

```text
lion-shadow-signs (depth 15)
  -> lion-final-refuge (depth 16, contentId final_refuge)
  -> lion-final-judgement (depth 17)
```

The runtime graph now has 21 nodes. Save V6 route refresh detection was updated accordingly. The short refuge text now tells the player that Alaric will weigh Bois-Clair, conduct, witnesses, the convoy, and evidence; reputation may open ears but cannot rewrite facts.

## 12. Shadow disclosure consolidation

R1 knowledge/disclosure separation and precedence remain authoritative.

- If definitive evidence reaches Alaric while disclosure is undecided, the judgement offers the one reveal/conceal decision.
- Both choices set exclusive flags: the selected flag becomes true and the opposite flag becomes false.
- Reveal grants `+4` public reputation.
- Conceal grants `0`; the public is not punished for a secret it does not know.
- Legacy revealed or concealed states skip the question.
- If the Serpent General creates the first definitive evidence, victory records `shadowEvidence = true` and the Serpent aftermath offers the decision there.
- The epilogue never asks again.
- Legacy `shadowRevealed + shadowConcealed` remains safe because the R1 resolver prefers revealed.

## 13. Serpent aftermath

`serpent_captain` now uses:

- `serpent_pursuit_pre_combat`;
- `serpent_general_aftermath`.

The route records that the General was defeated, upgrades Shadow knowledge to definitive evidence, states that the artifact was recovered, and handles the one disclosure decision only when still undecided.

## 14. Lion aftermath

`lion_chief` now uses:

- contextual `pre_lion_chief`, with voluntary and rejected variants;
- `lion_trial_aftermath`.

The aftermath states that the Champion was defeated, the Seal was earned under Lion law, and Alaric accepts the result. It explicitly leaves the Serpent General alive/in flight and does not claim that an artifact was recovered from him.

Both routes obtain the Seal after boss victory.

## 15. Epilogue resolver and ending IDs

The contextual epilogue uses the completed boss as historical route evidence and the R1 Shadow state. It produces a small route/disclosure matrix rather than duplicated full campaigns.

Ending IDs are:

- `lion-seal-serpent`;
- `lion-seal-serpent-truth`;
- `lion-seal-trial`;
- `lion-seal-trial-truth`.

All variants have valid step targets and exactly one `finishChapter` effect. Serpent variants may state that the General fell and the artifact was recovered. Trial variants state that the General remains free and never invent a Serpent victory.

## 16. Save compatibility

- Save version: 6
- Schema migration: none
- New derived verdict persisted: no
- Existing historical flag record reused: yes
- R1 witness and Shadow precedence preserved: yes
- Stale V6 runtime graphs are refreshed to the restored 21-node route without changing save version.

Historical completion facts (`serpentGeneralDefeated` or `lionTrialWon`) are stored in the existing boolean flag record only after the corresponding boss victory. They are events that occurred, not a persisted verdict or morality score.

## 17. Golden-profile results

| Profile | Conduct | Stance | Route | Result |
| --- | --- | --- | --- | --- |
| A — pure honour | honour | respect | serpent pursuit | pass |
| B — honour + advance | honour | respect with reservations | serpent pursuit | pass |
| C — real mixed playtest | honour | respect with reservations | serpent pursuit | pass |
| D — unsupported mixed | uncertain | uncertain | Lion Trial | pass |
| E — high reputation + infamy | infamy | hostile | Lion Trial | pass |
| F — low reputation + honour | honour | respect | serpent pursuit | pass |
| G — saved village + silenced witnesses | honour in fixture | distrust | Lion Trial | pass |
| H — mission greed | infamy in minimal fixture | distrust | Lion Trial | pass |
| I — heroic + direct lie | honour | respect with reservations | serpent pursuit | pass |
| J — voluntary trial | honour | respect | Lion Trial | pass |

Additional legacy cases pass for success+greed, protected+silenced witnesses, and revealed+concealed Shadow flags.

## 18. Browser QA

The in-app browser ran the real `DialogueView`, contextual builders, player clicks, semantic finale resolver, aftermaths, and epilogues against the Vite development build. A transient local harness was removed immediately after QA; no save, screenshot, or debug route remains.

| QA | Browser result |
| --- | --- |
| Mixed positive: advance + cargo + saved village + good acts | Alaric displayed Bois-Clair, the advance, cargo/reserves, merits, and supportive witnesses; claim resolved to `serpent_pursuit` and reservations dialogue. |
| Infamy | Bois-Clair sacrifice and silenced witnesses were named; claim resolved to `lion_trial` with `rejected_claim`. |
| Voluntary trial | Honourable/mixed profile selected trial; pre-combat displayed `Épreuve demandée` and cause `voluntary`. |
| Serpent route | Serpent-specific recognition/pre-combat rendered; aftermath declared the General defeated and artifact recovered. |
| Lion route | Lion-specific aftermath awarded the Seal and stated that the General remained in flight; trial epilogue ended as `lion-seal-trial`. |
| Shadow reveal | Serpent aftermath offered one disclosure choice; reveal led to a choice-free epilogue ending `lion-seal-serpent-truth`. |

Browser console warnings/errors for the QA pass: none.

## 19. Regression and validation

- Full Vitest suite: 55 files passed, 1,209 tests passed, 0 skipped, 0 failed.
- R1 `lionNarrative` tests: passed.
- R1 `DialogueView` boundary tests: passed; it contains no Lion flag interpretation.
- TypeScript `npx.cmd tsc --noEmit`: passed.
- Production build: passed (89 modules transformed).
- `git diff --check`: passed.
- Package scripts contained no additional content/dialogue/run validator beyond the test/build paths. VFX synchronization/validation scripts were intentionally not run because R2 did not touch VFX.
- Browser QA: six representative flows passed with no console errors.
- Combat and VFX gameplay: unchanged.

## 20. Deferred R3/R4/R5 work

R2 does not add a general conditional dialogue system, broad campaign dialogue variants, Cedric fixes, a reputation event director, random content, new fights, topology consolidation beyond the required refuge restoration, social probability systems, cinematics, or VFX. The final-only builder and semantic effect are intentionally narrow seams for later passes.
