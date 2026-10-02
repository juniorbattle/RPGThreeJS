---
name: contracts-compliance
description: "Use before implementing and before declaring any RPGThreeJS task complete. Maps the task to the LOCKED contracts, runs the LOCKED-document gate and the contract validator, reviews authority boundaries (presentation versus game truth), and produces the PASS/BLOCKED compliance matrix."
---

# Contracts compliance

Read first: `docs/game/GAME_CONSTITUTION.md`, `docs/contracts/README.md`, `docs/contracts/contracts.manifest.json`, `docs/contracts/AUTONOMOUS_WORK_PROTOCOL.md`, then every contract the task touches. Lock `PRODUCTION-CONTRACTS-LOCK-1`, commit `b1e8858`. These documents are authoritative: cite them, never paraphrase them into new doctrine.

## Gates (run them, do not assume)

```
git --no-optional-locks diff --exit-code b1e8858 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md   # must print nothing
git --no-optional-locks status --short -- docs/contracts docs/game/GAME_CONSTITUTION.md                  # must print nothing
npm run contracts:validate                                                                              # 8 contracts, 8 slots
```

The validator checks the manifest identity and LOCKED status, each contract path, its `Status: **LOCKED**` marker and README link, the eight required contract IDs, and that `PRESENTATION_AND_MEDIA.md` lists exactly the eight approved video IDs in its numbered list. It does not hash contract content, so the Git gate is the real protection. There is no CI.

## Route the task to contracts

| If the change touches | Read |
| --- | --- |
| art direction, V2 characters, environment families, asset promotion or deletion | WORLD_AND_CHARACTERS |
| campaign, dialogue, nodes, choices, saves, progression, refuges, loot | CAMPAIGN_AND_STATE |
| tableau, NarrativeStage, cinematic slots, Journey, holds, fallback, audio | PRESENTATION_AND_MEDIA |
| Traversal legs, Risk, Reward, Pursuit, checkpoints | TRAVERSAL and `docs/traversal/T0_PRODUCTION_CONTRACT.md` |
| tactical combat, Combat Stage, VFX | COMBAT_AND_VFX |
| UI, layout, focus, keyboard, reduced motion | UI_AND_ACCESSIBILITY |
| tests, QA evidence, content authoring, branches, `main` | AUTHORING_AND_QA and AUTONOMOUS_WORK_PROTOCOL |

## Authority-boundary review

For every changed file ask:

1. Which layer owns it: truth (campaign, `RunSystem`, saves, tactical combat), coordinator (`GameApp`), or presentation (tableau, cinematics, Journey, Traversal scene, Combat Stage, VFX, UI, audio)?
2. Does any presentation code gain a new write path to truth (route, outcome, resource, secured gold, save) other than the existing handoff callbacks?
3. Does any save field carry visual or transient state (animation, camera, layout, Route Risk or Pursuit)?
4. Are durable IDs, V6 compatibility and migrations preserved? A changed durable schema needs an explicit migration and resume tests.
5. Does Combat Stage or VFX compute, duplicate or change damage, AP, status or outcome?
6. Does a Traversal pickup change secured gold directly? It must stay temporary loot until the existing securing boundary.

## Standing gates

- Exactly eight video slots. No ninth slot, no enemy reveal or routine video. Fallback preserves agency and never replays resolved content.
- No invented canon: dialogue, choices, stages, outcomes, rewards. Presentation briefs may not mint canon.
- Recurring runs: no MiniMax or other video or keyframe generation, no MP4 replacement (OD-2026-10-01-B in `docs/autonomy/OPERATOR_DECISIONS.md`).
- Audio DEFERRED. T2 and T4 are retired as playable legs with durable IDs kept; T3 is not renumbered.
- A `legacy*` name is not deletion authority: first list every reference (runtime, registry, manifest, styles, tools, tests, docs, evidence).
- Autonomous writes go to `dev` or to a temporary branch created from it.

## Open operator decisions (never decide them)

The Alistair emblem or origin; the prologue cinematic; the first-refuge first scene (a contract task must precede any slot); ultimates; audio; any extension of the eight-slot list.

## Compliance matrix (return this)

Rows: GAME_CONSTITUTION; ART_DIRECTION; CHARACTERS; ENVIRONMENTS; NARRATIVE / CAMPAIGN; NARRATIVE_PRESENTATION; TRAVERSAL; COMBAT; SAVE; UI / ACCESSIBILITY; QA_EVIDENCE; REPOSITORY_GOVERNANCE. Each row is PASS, BLOCKED or N/A with one line of evidence. BLOCKED forbids marking the task complete.

Then record: contracts read, contract set version, LOCKED rules impacted, and an explicit statement that no LOCKED rule changed, backed by the gate output. Use the vocabulary of `docs/contracts/README.md`: LOCKED, implemented, drift, deferred.
