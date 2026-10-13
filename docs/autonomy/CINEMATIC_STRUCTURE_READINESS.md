# Cinematic structure readiness

CURRENT FACT, 2026-10-02 UTC. Queue item 8 structure is implemented and verified against existing media. This is separate from the incomplete **EXTERNAL_MANUAL_WORKSTREAM** for artistic remaster. Authority: [active scope decision](CINEMATIC_STRUCTURE_OPERATOR_DECISION_2026-10-01.md), contract set v1 / `PRODUCTION-CONTRACTS-LOCK-1`, current `dev` source. Items 1–7 remain complete; independent demo QA is item 9; audio remains DEFERRED.

## Eight-slot integration map

| Approved slot | Existing canonical trigger | Exit and retained truth/agency |
| --- | --- | --- |
| `camp_departure` | New chronicle after existing prologue and `acte_ouverture`; `GameApp.startNewChronicle` | Prelude to camp tableau/dialogue, then campaign departure. |
| `alaric_audience_arrival` | Before `lion_briefing`; `Cin6aPresentation` | Audience tableau, existing mission choices, Journey. |
| `bois_clair_arrival` | Before `village_choice`; `Cin6aPresentation` | Village tableau, existing rescue/reserves choice and authored combat. |
| `bois_clair_saved` | Victorious `village_defense`, `missionSuccess=true`, `missionGreed!=true` | Already-applied combat truth, consequence media, existing aftermath dialogue, direct refuge handoff. |
| `bois_clair_sacrificed` | Victorious `village_raid`, `missionGreed=true` | Already-applied sacrifice truth, consequence media, existing aftermath dialogue, direct refuge handoff. |
| `lion_judgement` | Before `lion_finale_judgement`; `CinematicTriggers` | Judgement tableau and existing authoritative route/boss decision. |
| `serpent_route_ending` | Victorious `serpent_captain`, `serpentGeneralDefeated=true`, resolved `serpent_pursuit` route | Completed boss facts, existing aftermath dialogue, ending media, `epilogue`, campaign. |
| `lion_trial_route_ending` | Victorious `lion_chief`, `lionTrialWon=true`, resolved `lion_trial` route | Completed trial facts, existing aftermath dialogue, ending media, `epilogue`, campaign. |

Source owners: `src/game/GameApp.ts`, `src/cinematics/Cin6aPresentation.ts`, `CinematicTriggers.ts`, `ApprovedProductionVideos.ts`, and `src/journey/JourneyCampaignBoundary.ts`. Historical trigger names for retired videos remain gated; they do not grant production authority.

## Ownership and recovery

- `CinematicPlayer`/overlay owns playback and integrated video actors. `NarrativeStage` records `VIDEO_OWNS_CAST` during video; the normal dialogue entry releases the frozen surface and activates `STATIC_TABLEAU` with `STAGE_OWNS_CAST`. Interactive compositions retain one primary surface and 1–4 actors; dialogue and choices do not run on video holds.
- Player settlement releases timers/listeners and its surface once. Startup/stall recovery is bounded (default stall timeout 4 seconds); a missing descriptor, abort or reduced-motion request settles without video. Failed loading uses existing fallback and returns agency. Outcome stages dispose in `finally` before the next activity.
- Preloading deduplicates requests, is nonfatal and retains at most three entries by default. No new media or provider requests are needed for this structure.
- V6 saves persist campaign facts and pending/resolved nodes through their existing owners. Resolved-node reload does not replay media or combat. No playback clock, canvas or visual state is serialized. Arbitrary interruption points throughout every video are not claimed by the resolved-node proof; targeted interruption QA is recorded separately as item 9.

## Observed correction and acceptance

The previous `options.reducedMotion ?? OSPreference` expression let an explicit `false` from normal graphics suppress the OS request. The shared `src/ui/ReducedMotion.ts` resolver now ORs both requests. `CinematicPlayer`, `NarrativeStage`, `TravelStillSurface` and dialogue text reveal use it. Existing fallback and choice semantics are retained.

Current production route QA covers every approved slot at 1366×768, 620×780 and 390×844 with **OS reduce on and saved reducedGraphics=false**. All three runs pass 8/8 scenarios, twelve choice groups per run, one primary tableau, bounded fallback, canonical saved outcomes, and unchanged resolved-node reload without media/combat replay. Normal desktop, unavailable-media mobile and combined game/OS reduced mobile controls pass 8/8 each. The driver adds a full-run eight-ID coverage assertion and captures focused choice buttons for visual inspection. Evidence and exact totals are in [the current report](../reports/cinematic-structure-readiness-1.md).

Focused player/stage/runtime/dialogue/session tests: 92/92; adjacent overlay/registry/preloader/triggers/approved IDs/scene/continuity/Journey tests: 74/74. TypeScript, eight-contract validator, production build and exactly eight shipped MP4s pass. Narrative staging validator covers 75/75 dialogues, 257/257 dialogue steps and 282/282 runtime presentation steps, with zero choice/text/ownership violations; two explicitly recorded dead/unreachable historical steps remain outside runtime reachability.

## Contract compliance

Contracts read: GAME_CONSTITUTION, README/manifest, AUTONOMOUS_WORK_PROTOCOL, WORLD_AND_CHARACTERS, CAMPAIGN_AND_STATE, PRESENTATION_AND_MEDIA, UI_AND_ACCESSIBILITY and AUTHORING_AND_QA. Set v1. LOCKED rules impacted: presentation/truth authority, eight-slot limit, cast/surface ownership, agency, reduced motion, durable save compatibility, evidence and repository governance.

| Area | Status | Evidence |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Existing authored game and authority boundaries preserved. |
| ART_DIRECTION | PASS | No artwork or MP4 changes; accepted visual language retained. |
| CHARACTERS | PASS | V2 assets untouched; cast remains presentation-owned. |
| ENVIRONMENTS | PASS | Existing surfaces/assets retained. |
| NARRATIVE / CAMPAIGN | PASS | No canon, choice, stage or outcome changes; real saved-choice QA. |
| NARRATIVE_PRESENTATION | PASS | Exactly eight slots; one interactive tableau; no dialogue/choices on holds. |
| TRAVERSAL | PASS | No Traversal implementation change; T0/T1/T3 and retired durable T2/T4 IDs retained. |
| COMBAT | PASS | Existing tactical resolver untouched; result fixtures prove lifecycle only. |
| SAVE | PASS | No durable schema/ID change; resolved-node V6 truth/replay checks pass. |
| UI / ACCESSIBILITY | PASS | OS preference respected with normal graphics; three viewport/keyboard-choice checks pass. Full Tab navigation remains demo QA. |
| QA_EVIDENCE | PASS | Current machine results, inspected selected captures, types/contracts/build; ignored ordinary output paths. |
| REPOSITORY_GOVERNANCE | PASS | One exclusive writer on dev, temporary-index WIP backups, coherent checkpoints and verified remote push; protected-path Git gates unchanged. |

No LOCKED rule is changed. Gate: `git --no-optional-locks diff --exit-code b1e8858 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md`, plus protected-path status, must remain silent at closeout. Reviewer profiles were used read-only; the lock holder retains all edits and Git/state writes.

## Remaining decisions and next work

The eight existing clips are structurally supported, not newly artistically accepted. Six unaccepted candidate artifacts and provenance remain preserved. No recurring generation/polling, new video keyframes, or MP4 replacement. [Extension planning](CINEMATIC_EXTENSION_PLANNING.md) records prologue/refuge boundaries without activating a slot. Alistair design/origin remains undecided. Item 9 continues production demo continuity, keyboard navigation, interrupted saves, responsive UI and authored VFX debt; audio remains DEFERRED.
