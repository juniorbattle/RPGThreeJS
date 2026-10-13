# Autonomous work protocol

Status: **LOCKED**.

## Start of each run

1. Read the automation memory and `docs/autonomy/AUTONOMOUS_WORK_STATE.md`. Resume the active task before taking a new queue item. Preserve coherent uncommitted work.
2. Run `git fetch --prune`, inspect branch/status and `dev` against `origin/dev` and `origin/main`. Work only on `dev` or a temporary branch created from it. If main advanced, integrate it non-destructively into `dev` before new production work; document an ambiguous conflict and leave main untouched.
3. Before implementation, read `GAME_CONSTITUTION.md`, this directory's README and manifest, this protocol, and all affected contracts. Record conflict with a locked contract; continue with another unblocked task instead of editing the lock.

## Work and checkpoints

Keep one durable truth in `docs/autonomy/AUTONOMOUS_WORK_STATE.md` (optionally JSON). It must state active task, phase, last valid commit, remaining work, tests, blockers, next action, and ordered queue. Decompose tasks; carry a completed subtask into the next one without a routine approval stop. Inspect source before editing, preserve durable IDs and art, run focused tests and relevant build/browser QA, and fix introduced regressions. Mark a task complete only after recording relevant contract conformance and remaining limitations.

Commit coherent checkpoints and push regularly to `origin/dev`, including before a run ends. Never push to `main`, merge `dev` into `main`, or force push `main`. Do not open a PR to main automatically. If credits or development tools become unavailable, record `PAUSED_FOR_CREDITS`, commit/push any coherent checkpoint possible, and retry availability first on the next run without dropping or narrowing the task.

## Ordered initial queue

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
