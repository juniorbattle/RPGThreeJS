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
