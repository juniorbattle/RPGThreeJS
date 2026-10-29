# Autonomous work protocol

Status: **LOCKED**.

## Start of each run

1. Read the automation memory and `docs/autonomy/AUTONOMOUS_WORK_STATE.md`. Resume the active task before taking a new queue item. Preserve coherent uncommitted work.
2. Run `git fetch --prune`, inspect branch/status and `dev` against `origin/dev` and `origin/main`. Work only on `dev` or a temporary branch created from it. If main advanced, integrate it non-destructively into `dev` before new production work; document an ambiguous conflict and leave main untouched.
3. Before implementation, read `GAME_CONSTITUTION.md`, this directory's README and manifest, this protocol, and all affected contracts. Record conflict with a locked contract; continue with another unblocked task instead of editing the lock.

## Work and checkpoints

Keep one durable truth in `docs/autonomy/AUTONOMOUS_WORK_STATE.md` (optionally JSON). It must state active task, phase, last valid commit, remaining work, tests, blockers, next action, and ordered queue. Decompose tasks; carry a completed subtask into the next one without a routine approval stop. Inspect source before editing, preserve durable IDs and art, run focused tests and relevant build/browser QA, and fix introduced regressions. Mark a task complete only after recording relevant contract conformance and remaining limitations.

Commit coherent checkpoints and push regularly to `origin/dev`, including before a run ends. Never push to `main`, merge `dev` into `main`, or force push `main`. Do not open a PR to main automatically. If credits or development tools become unavailable, record `PAUSED_FOR_CREDITS`, commit/push any coherent checkpoint possible, and retry availability first on the next run without dropping or narrowing the task.

## Current navigation amendment — OD-2026-10-13-D

Dedicated `PRODUCTION-CONTRACTS-POI-NAVIGATION-1` / [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md), set 1.2.0 supersedes the physical Traversal production queue below on navigation only. Execute the dedicated amendment and committed baseline first, then the real Audience→first-refuge POI slice; generalize remaining Lion continuity/branches/endings, then retire old road code/media/tools only after verified replacement and reference inventory. Keep gameplay/combat/keyboard work and non-navigation acceptance. Audio remains DEFERRED until narrative/presentation/cinematics/POI navigation are stable. Do not reactivate the scheduler.

## Exceptional POI V2 mission — OD-2026-10-15-A

Dedicated `PRODUCTION-CONTRACTS-POI-V2-RETIREMENT-1`, set 1.3.0. The explicitly requested exceptional manual mission proceeds through playable A/B, artistic C and definitive physical retirement D, with coherent normal dev checkpoints and preserved WIP. Its operator-specified absence of a time/work limit applies to this mission only; scheduled configuration and paused status stay unchanged. Independent guardian review precedes the amended LOCKED baseline and guards sensitive runtime milestones. No new authoring/reward or art acceptance is inferred from execution authorization. Main remains protected.

## Cinematic retirement continuation — OD-2026-10-24-A

Dedicated `PRODUCTION-CONTRACTS-CINEMATIC-RETIREMENT-1` / [OD-2026-10-24-A](../autonomy/CINEMATIC_RETIREMENT_OPERATOR_DECISION_2026-10-24.md), set1.10.0 supersedes the historical cinematic production queue and offline illustrated pilot/generalization authorizations. Retire runtime videos through existing static dialogues/tableaux, preserve archives/evidence and gameplay/save authority, then address bounded demonstrated static dialogue/NarrativeStage presentation issues. Do not generate/poll video, keyframes or illustrated cinematic candidates, replace MP4s, or infer artistic acceptance. Dedicated reviewed amendment and committed baseline precede runtime. Preserve the saved scheduler status/cadence/settings; no activation inferred. The historical queue below is not an instruction to restart retired work.

## Preserved historical ordered initial queue

1. `PRODUCTION-CONTRACTS-LOCK-1` and this protocol.
2. Contract drift audit and safe canonical-document correction.
3. Align cinematic runtime, registry, doctrine, and assets with exactly eight video slots.
4. Retire playable T2/T4 contracts/runtime while preserving durable IDs.
5. Generalize Traversal from T0 without T0 regression.
6. Produce T1 with approved route and event art, code and QA.
7. Produce T3 to the same standard.
8. Remaster the eight videos if suitable media tools can produce them; otherwise prepare specs/integration/QA and record the asset blocker.
9. Complete demo VFX, UI, narrative, responsive, accessibility, contract debt and end-to-end QA.
10. Begin a separate audio decision only after narrative/presentation/cinematics/Traversal are demonstrably locked and stable.

The current operator request authorizes normal implementation and integration on `dev` through this queue. It does not grant authority to alter a locked contract, invent campaign canon, or modify `main`.


## Bounded UI FX exception — OD-2026-10-18-F

Dedicated `PRODUCTION-CONTRACTS-UI-FX-1`, set1.6.0, [operator execution approval](../autonomy/UI_FX_INTEGRATION_OPERATOR_DECISION_2026-10-18.md), supersedes the general audio deferral solely for the eight operator-accepted UI FX files and audited native events. No global narrative/cinematic/PC acceptance is implied. Music, voices, ambience, combat-iframe sounds and cinematic/video audio remain DEFERRED. Default disabled; explicit accessible enable/mute and volume, real gesture unlock, preferences separate from GameState/V6/video mute. No sound on load/reload/restored preference/programmatic focus. One bounded cue per actual native action with keyboard/pointer deduplication, bounded voices/rate and hidden/disposed cleanup. Optional audio failure never blocks agency or writes gameplay truth. Only actual node changes emit travel-start; autosaves, repeated reward renders and failed/no-op actions do not emit success.


## Bounded combat FX exception — OD-2026-10-19-B

Dedicated PRODUCTION-CONTRACTS-COMBAT-FX-1, set1.7.0, [operator execution approval](../autonomy/COMBAT_FX_OPERATOR_DECISION_2026-10-19.md), extends OD-2026-10-18-F solely to audited tactical/remaining UI intentions, shared combat sound settings and the16short nonverbal combat families named in that decision. New files remain candidates pending operator artistic acceptance. Music, voices, ambience, Ultimates and cinematic/video audio remain deferred. One parent audio owner/mute/volume/preference outside V6, default off, real trusted gesture observed directly in current same-origin iframe (never MessageEvent.isTrusted), current frame/origin/session/allowlist validation and bounded identity deduplication. Sounds observe resolved truth and never recalculate RNG/damage/AP/status/outcomes or change resources/save. No cue on init/load/reload/preference/focus or failed/no-op success. Maximum4voices total/2UI, priority result/KO/critical, steps at least120ms apart and bounded UI cadence, maximum1second decoded combat asset, no delayed queue. Session close detaches gestures and stops voices; true hidden stops/suspends; unavailable audio fails silently without blocking agency. Existing unresolved native hidden/suspend evidence remains open until truly observed. Dedicated reviewed amendment baseline precedes runtime; targeted tests and one earned native campaign continuation use existing tooling; artistic/hardware/global acceptance stays separate.

## Code-generated music — OD-2026-10-29-B

Dedicated `PRODUCTION-CONTRACTS-MUSIC-AUDIO-1`, set 1.11.0, [operator decision](../autonomy/MUSIC_AUDIO_OPERATOR_DECISION_2026-10-29.md). For this scope only, it supersedes the music and ambience deferrals and the "locked and stable" audio precondition stated in this contract, including in its UI FX and combat FX sections. Agents may write, adapt and tune code-generated music, ambience and synthesized cues inside this scope. They never call an AI audio or music generation service, download or purchase tracks, or poll providers. The reviewed amendment baseline precedes runtime. Artistic acceptance stays with the operator.
