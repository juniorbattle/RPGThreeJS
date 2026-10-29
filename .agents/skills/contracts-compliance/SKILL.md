---
name: contracts-compliance
description: "Use before implementing and before declaring any RPGThreeJS task complete. Maps the task to the LOCKED contracts, runs the LOCKED-document gate and the contract validator, reviews authority boundaries (presentation versus game truth), and produces the PASS/BLOCKED compliance matrix."
---

# Contracts compliance

Read first: `docs/game/GAME_CONSTITUTION.md`, `docs/contracts/README.md`, `docs/contracts/contracts.manifest.json`, `docs/contracts/AUTONOMOUS_WORK_PROTOCOL.md`, then every contract the task touches. Lock `PRODUCTION-CONTRACTS-LOCK-1`, commit `a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa`. These documents are authoritative: cite them, never paraphrase them into new doctrine.

## Orchestration (OD-2026-10-02-C)

The orchestrator applies this skill before implementation and task completion. Independent contracts-guardian review is required at major milestones or sensitive truth/save/combat/presentation/validator changes, including their QA assertions; it is not mandatory for every run or small checkpoint. Brief the actual diff, claims, relevant contract sections and selected proof. Reports/captures are allowed for a specific claim. Keep the matrix and the LOCKED gates; do not duplicate global readings without an unresolved question.

## Gates (run them, do not assume)

```
git --no-optional-locks diff --exit-code a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md   # must print nothing
git --no-optional-locks status --short -- docs/contracts docs/game/GAME_CONSTITUTION.md                  # must print nothing
npm run contracts:validate                                                                              # 8 contracts, 8 historical IDs, 0 active videos
```

The validator checks the manifest identity and LOCKED status, each contract path, its `Status: **LOCKED**` marker and README link, the eight required contract IDs, the eight historical IDs listed in `PRESENTATION_AND_MEDIA.md`, zero approved videos in `production_presentation_modes.json`, an empty runtime cinematic manifest, 147 unique generated beats with no video, hold or preload, no video file under `public/`, and the SHA-256 of the production-videos archive. It does not hash contract content, so the Git gate is the real protection. There is no CI.

## Route the task to contracts

| If the change touches | Read |
| --- | --- |
| art direction, V2 characters, environment families, asset promotion or deletion | WORLD_AND_CHARACTERS |
| campaign, dialogue, nodes, choices, saves, progression, refuges, loot | CAMPAIGN_AND_STATE |
| tableau, NarrativeStage, retired cinematic identities, Journey, fallback, audio | PRESENTATION_AND_MEDIA |
| POI map navigation, expedition state, mobile elites, Combat or retreat, refuge reuse | TRAVERSAL (historical contract ID; POI map doctrine). `docs/traversal/` and physical road criteria are historical; persisted expedition state also CAMPAIGN_AND_STATE (Lot E), elite combat COMBAT_AND_VFX (Lot E) |
| tactical combat, arena presentation (Combat Stage retired), VFX | COMBAT_AND_VFX |
| UI, layout, focus, keyboard, reduced motion | UI_AND_ACCESSIBILITY |
| tests, QA evidence, content authoring, branches, `main` | AUTHORING_AND_QA and AUTONOMOUS_WORK_PROTOCOL |

## Authority-boundary review

For every changed file ask:

1. Which layer owns it: truth (campaign, `RunSystem`, saves, tactical combat), coordinator (`GameApp`), or presentation (tableau, Journey, POI atlas, Combat Stage, VFX, UI, audio)?
2. Does any presentation code gain a new write path to truth (route, outcome, resource, holdings, save) other than the existing handoff callbacks?
3. Does any save field carry visual or transient state (animation frame or clock, camera, layout, map focus, threat preview)?
4. Are durable IDs, V6 compatibility and migrations preserved? A changed durable schema needs an explicit migration and resume tests.
5. Does Combat Stage or VFX compute, duplicate or change damage, AP, status or outcome?
6. Do gameplay owners credit gains and restore the selected last actual save as approved under set1.5.0? Audio/presentation must never credit, debit or secure holdings; physical Traversal stays retired.

## Standing gates

- Zero active video/hold/preload/shipped MP4; retain eight historical IDs and all authored moments through static dialogue/tableau. Fallback preserves agency and never replays resolved content.
- No invented canon: dialogue, choices, stages, outcomes, rewards. Presentation briefs may not mint canon.
- No run generates or polls video, keyframes or illustrated cinematic candidates (no MiniMax), and none replaces or restores an MP4 (OD-2026-10-24-A).
- Audio: the eight approved UI FX, the bounded 16-family combat candidates and audited events (OD-2026-10-19-B), and since OD-2026-10-29-B code-generated music in five contexts (on by default, silent until the first real gesture), one synthesized ambience per combat biome and synthesized sources for the sixteen families, all under the single parent owner. Voices, a distinct Ultimate audio identity and video audio stay DEFERRED. T2 and T4 are retired as playable legs with durable IDs kept; T3 is not renumbered.
- A `legacy*` name is not deletion authority: first list every reference (runtime, registry, manifest, styles, tools, tests, docs, evidence).
- Autonomous writes go to `dev` or to a temporary branch created from it.

## Open operator decisions (never decide them)

The Alistair emblem or origin; the prologue cinematic; the first-refuge first scene (a contract task must precede any slot); ultimates; remaining audio categories beyond the bounded UI/combat FX exception; any new video slot or return of cinematic production (retired by OD-2026-10-24-A); final art and felt-balance acceptance.

## Compliance matrix (return this)

Rows: GAME_CONSTITUTION; ART_DIRECTION; CHARACTERS; ENVIRONMENTS; NARRATIVE / CAMPAIGN; NARRATIVE_PRESENTATION; TRAVERSAL; COMBAT; SAVE; UI / ACCESSIBILITY; QA_EVIDENCE; REPOSITORY_GOVERNANCE. Each row is PASS, BLOCKED or N/A with one line of evidence. BLOCKED forbids marking the task complete.

Then record: contracts read, contract set version, LOCKED rules impacted, and an explicit statement that no LOCKED rule changed, backed by the gate output. Use the vocabulary of `docs/contracts/README.md`: LOCKED, implemented, drift, deferred.

## Approved contract amendment boundary

Current set1.11.0 derives from PRODUCTION-CONTRACTS-MUSIC-AUDIO-1 / OD-2026-10-29-B at the immutable baseline above (set1.10.0, PRODUCTION-CONTRACTS-CINEMATIC-RETIREMENT-1 / OD-2026-10-24-A at da69ec63, still governs cinematics); b1e8858 is the original historical lock. A dedicated operator-approved amendment records exact changed rules, task/decision and version, independent review, then establishes its committed baseline in a following operational commit. A normal task must not advance that baseline or edit a LOCKED contract. Its gate must remain empty. During an authorized amendment, inspect the exact approved diff rather than claim no rule changed. Read the current manifest version for every matrix. Manual visual findings reopen affected acceptance; an old PASS is historical, not a rebuttal.

## Current retirement — OD-2026-10-24-A

Set 1.10.0 supersedes earlier cinematic production directions, including the offline illustrated permissions of sets 1.8.0 (OD-2026-10-21-A) and 1.9.0 (OD-2026-10-23-B), whose candidates and evidence stay as history: zero active video, hold, preload or shipped MP4; eight historical IDs and archived media and proof preserved; no illustrated or video generation or pilot generalization. Follow the current static narrative plan and state; preserve scheduler settings. Immutable baseline a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa.

## Current direction — OD-2026-10-24-B

A local frame animation of an actor or a combat action is presentation: it observes resolved events, keeps a fallback to the Character V2 master or pose, stores nothing in V6 and never owns focus, lines, choices, turn timing or outcomes. See `docs/autonomy/PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md`; route detailed review to `combat-vfx-sprites`.
