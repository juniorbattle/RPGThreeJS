# Multi-agent operating protocol

Status: operational protocol, **not** a contract. Adopted by the operator's default decision of 2026-10-02 (OD-2026-10-02-A in the [operator decisions](OPERATOR_DECISIONS.md)). Effective on `dev` once merged and referenced by the recurring run instruction (Appendix A).

This file extends the LOCKED [autonomous work protocol](../contracts/AUTONOMOUS_WORK_PROTOCOL.md) and never relaxes it. Sections 2 to 7 and 10 restate stable rules that lived only in the recurring Codex prompt (`rpgthreejs-auto-dev-90m`), so that the prompt can stay short and Devin sessions follow the same rules. Items marked **NEW** are multi-agent additions. Precedence: explicit current operator decision, then the LOCKED protocol and contracts, then this file.

## 1. Principles

- One writer per working tree. The repository is the memory: Git, `dev`, the contracts, `AUTONOMOUS_WORK_STATE.md` and `.json`, and the execution lock.
- **NEW** Specialist subagents are reviewers or runners and read-only by default. The orchestrator, the agent holding the lock, is the only writer. A parallel writer works only in a separate worktree on a temporary branch from `dev`, and the lock holder integrates it.
- Uncommitted work found at the start of a run may be coherent work from an interrupted run: never discard it.

## 2. Execution lock

File: `.git/codex-autonomy.lock` (untracked, local to the machine). Acquire it before any checkout, edit, commit or file generation, as atomically as the OS allows. Minimum content: start time, last heartbeat, active task, branch, process id if available.

**NEW** canonical schema (readers must also accept the legacy spellings `lastHeartbeat` and `processId` seen on 2026-10-01):

```json
{
  "runId": "rpgthreejs-auto-dev-90m-20261002T0338",
  "agent": "codex",
  "runStartedAt": "2026-10-02T03:38:51Z",
  "heartbeat": "2026-10-02T03:47:09Z",
  "pid": 19168,
  "threadId": "<Codex thread or Devin session id>",
  "branch": "dev",
  "activeTask": "CINEMATIC-STRUCTURE-READINESS: ...",
  "wip": { "branch": "wip/<runId>", "sha": "<last snapshot sha>" }
}
```

New fields: `runId`, `agent`, `threadId`, `wip`.

Rules:

1. If the lock exists, read it and assume another run may be active. If its heartbeat is recent, stop without modifying the repository and report `SKIPPED_ACTIVE_RUN`.
2. A new scheduled run never deletes a lock merely because it started.
3. A lock may be treated as abandoned only if all hold: the heartbeat is older than **105 minutes**; no matching agent run appears active; no long Git operation or build or QA process appears active.
4. If staleness is ambiguous, do not modify the repository and report `BLOCKED_BY_EXECUTION_LOCK`.
5. If clearly stale, remove it cleanly and take a new lock, then resume from the persisted state and the working tree. **NEW** "Remove" means archive: rename to `.git/codex-autonomy.abandoned-<YYYYMMDDTHHmm>.json`, as on 2026-10-01 17:12.
6. Update the heartbeat about every 10 minutes and before and after any long operation.
7. Release the lock only after the state files are updated, a coherent checkpoint exists, any appropriate commit is made, and `origin/dev` is pushed.

**NEW** caveats. `pid` must identify a long-lived process of the run, because a short-lived child makes a live run look dead. A dead `pid` is evidence, not proof: a run waiting on an approval prompt or a quota limit looks the same. Before an early takeover the operator confirms that the previous turn is stopped.

### Operator-ordered takeover (**NEW**)

Before the 105-minute threshold, another agent may take over only on an explicit operator order, after the heartbeat age and `pid` are checked and the previous turn and associated jobs are confirmed stopped. Then archive the old lock and acquire a new one atomically with `agent` set; take the reviewed WIP snapshot under the new lock before implementation (section 5). Fresh heartbeats make scheduled Codex runs report `SKIPPED_ACTIVE_RUN` by rule 1. Release it at closeout like any run.

## 3. Run budget

The recurring task fires every 90 minutes and each run has a target budget of 75 minutes. Work normally until about 60 minutes. After that, start no heavy refactor, long generation, large migration, new major subtask or long full QA. From 65 to 75 minutes the priority is checkpoint and handoff. Do not pad the time. An operation that cannot be interrupted safely is brought to a safe state, then checkpointed.

## 4. Checkpoint and state files

Before a run ends: finish the atomic operation, leave no deliberately inconsistent repository, run the relevant quick checks, update `AUTONOMOUS_WORK_STATE.md` and `.json`, commit coherent work, push `origin/dev`, set `runEndedAt`, release the lock. Work intentionally left uncommitted must be explained precisely in the state.

Required state fields: `status`, `runStartedAt`, `runEndedAt`, `activeTask`, `activePhase`, `activeSubtask`, `workingBranch`, `lastKnownGoodCommit`, `lastPushedCommit`, `completedThisRun`, `filesChanged`, `testsRun`, `testsPassed`, `testsRemaining`, `blockers`, `remainingWork`, `nextAction`, `taskQueue`, `creditStatus`, `contractComplianceStatus`.

`nextAction` must let a fresh agent start immediately. Bad: "Continue T1." Good: "Resume T1 at the Valmir Road checkpoint: route config exists and the shared renderer is validated; add the authored checkpoint from the canonical relation, then run the targeted Traversal tests."

**NEW** live block. Update the state at every WIP snapshot, not only at the start and the end of a run: `runId`, `agent`, `lastHeartbeat`, `wip` (`branch`, `sha`, `dirtyFiles`, `status` GREEN, UNKNOWN or RED, `lastGreenCheck`), and a current `nextAction`. On 2026-10-02 the state still said the fix was to do while the lock said "production QA" and the working tree held the fix, because the state is written at run start.

Non-owners (an agent that does not hold the lock) leave notes in [handoffs/](handoffs/) instead of editing the state files. The lock holder folds them into the state.

## 5. WIP snapshots (**NEW**)

Cadence: after each green atomic subtask and at least every 10 minutes, the heartbeat rhythm. Coherent work is also committed on `dev`, as the LOCKED protocol requires.

A snapshot is a commit built by plumbing from a temporary index. The checked-out branch, the real index and the working tree are untouched, and untracked files are included (`git stash create` would miss them). Destination: the temporary branch `wip/<runId>`, created from `dev` (allowed by the LOCKED protocol) and pushed to `origin`; delete it once the coherent commit has landed on `dev`. Exact commands: `.agents/skills/autonomy-handoff/SKILL.md`. A snapshot is a recovery net, never a checkpoint or an acceptance.

## 6. Branches

Work on `dev`. Temporary branches from `dev` are allowed when they bring a real advantage to an important or risky operation (`wip/<runId>`, `codex/<topic>`, `devin/<topic>`). `main` is off limits: no push, no merge from `dev`, no force-push and no automatic PR.

At the start of a run, after acquiring the lock: `git fetch --prune`; inspect the branch, status, `origin/dev`, `origin/main` and the state; keep any coherent uncommitted work; if `main` advanced, preserve current work first and integrate `main` into `dev` non-destructively; on an ambiguous conflict document the blocker, leave `main` untouched and continue with an independent task.

## 7. Credits and quota

If quota or credit is exhausted or temporarily unavailable: do not abandon or narrow the task and do not skip to the next one; reach a safe point; set `status = PAUSED_FOR_CREDITS` in the state; commit and push any coherent checkpoint; release the lock; end. The next run retests availability and resumes the same task. **NEW** An abrupt cut cannot write this status, so the next agent reconstructs the situation from the lock, the snapshot branch and the working tree (section 8).

## 8. Takeover procedure (**NEW**, agent-agnostic)

1. Preflight, read-only (skill `autonomy-handoff`): lock and `pid`, heartbeat age, latest activity of the other agent, state files against `git status`, remote parity, stash, LOCKED-document gate.
2. Classify: CLEAN; ACTIVE_LOCK (stop); STALE_LOCK with uncommitted work; AMBIGUOUS (stop, `BLOCKED_BY_EXECUTION_LOCK`).
3. Snapshot any uncommitted work (section 5).
4. Take the lock, archiving the old one, only if rule 3 of section 2 holds or the operator ordered the takeover.
5. Continue from the working tree. Never `reset`, `clean` or `checkout` over it.
6. Close out like any run and delete the `wip/<runId>` branch once the coherent commit is on `dev`.

## 9. Specialists and orchestration (OD-2026-10-02-C)

Roles and skills: see AGENTS.md. The lock holder applies autonomy-handoff and contracts-compliance at their required boundaries; skill use does not require a separate agent each time. Do not spawn the six specialists routinely. Produce coherent work, verify the affected boundary, and continue the active task without routine human approval. The operator performs final demo testing; this never waives production acceptance or open operator decisions.

Independent contracts-guardian review is triggered by a major milestone or sensitive campaign truth, V6/migration, tactical resolution, presentation-authority or validator change, including the QA assertions that certify those behaviors. Request review before implementation for ambiguous architecture; otherwise provide the actual diff, claims and ready proof together. Reuse the reviewer within the run. Additional passes need a substantive correction, unresolved blocker or new risk. Domain reviewers and the QA runner answer distinct scoped questions; avoid duplicating their exploration.

Briefs use fork_turns=none and name the question, paths/diff, relevant contract sections, expected result and selected proof. The reviewer reads required authorities and affected sections, then requests additional context only for an identified uncertainty. Reports and captures are allowed when they prove the claim; do not request global report/capture rereads. The orchestrator records the compliance matrix; independent reviewers verify relevant claims rather than repeating the whole matrix at every checkpoint.

At changed checkpoints run git diff --check, the LOCKED gates, contracts:validate, TypeScript and relevant focused tests. Reuse verified outcomes only while relevant sources/driver/build/parameters/assertions are unchanged. UI/runtime changes need the relevant built-production scenario; sensitive save/combat changes need full boundary proof, not merely a smoke. Broad QA belongs at major acceptance milestones or a concrete regression risk. Correct introduced regressions before advancing.

Specialists remain read-only for tracked source/state. QA workers may write their own ignored outputs, never the shared state; the single lock holder integrates results. Keep the current orchestrator and guardian high settings in lot1. No execpolicy change.

Waves: 1 is `handoff-governor`, `contracts-guardian`, `qa-evidence-runner`, `ui-accessibility`, `cinematics-journey`, `narrative-tableau`. Planned: 2 is `combat-stage-vfx`, `tactical-combat-authority`, `campaign-state-authority`, `narrative-canon-guard`; 3 is `traversal-engineer`, `world-art-continuity`.

## 10. Compliance matrix

Before declaring a task complete, record PASS or BLOCKED for each concerned row. Never complete a task with an unresolved contract conflict. Also record: contracts read, contract set version (`PRODUCTION-CONTRACTS-LOCK-1`), LOCKED rules impacted, and confirmation that no LOCKED rule changed.

| Row | Contract |
| --- | --- |
| GAME_CONSTITUTION | `docs/game/GAME_CONSTITUTION.md` |
| ART_DIRECTION, CHARACTERS, ENVIRONMENTS | WORLD_AND_CHARACTERS |
| NARRATIVE / CAMPAIGN, SAVE | CAMPAIGN_AND_STATE |
| NARRATIVE_PRESENTATION | PRESENTATION_AND_MEDIA |
| TRAVERSAL | TRAVERSAL and `docs/traversal/T0_PRODUCTION_CONTRACT.md` |
| COMBAT (including VFX) | COMBAT_AND_VFX |
| UI / ACCESSIBILITY | UI_AND_ACCESSIBILITY |
| QA_EVIDENCE, REPOSITORY_GOVERNANCE | AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL |

The mandatory list in the recurring prompt omits UI / ACCESSIBILITY, which the contract set contains and recent reports include: keep the row.

## 11. Commits

One imperative line, then the trailer `Agent: <codex|devin>; Run: <runId>`. Snapshot commits say so in the subject (`WIP snapshot of ...`).

## 12. QA jobs and recovery (OD-2026-10-02-C)

Before long QA, the lock holder registers live.qaJobs in both state files: jobId/runId, parameters/command, expected assertions, start time/PID/port, ignored output and receipt paths, driver/helper/source/build identity and status. Use [QA_JOB_CONTINUITY.md](QA_JOB_CONTINUITY.md). Workers write only their own ignored receipts/results, so a quota cutoff does not lose their outcome. The lock holder alone syncs the shared state.

At restart read terminal receipts before rerunning. Check result hash, assertions, exact save/proof lineage, viewport/motion parameters and current provenance; inspect selected captures. SUCCEEDED is an execution result, not acceptance. Unknown provenance or old assertions remain NOT_ACCEPTED. If the driver/source/build changes while QA runs, invalidate that proof rather than relabel it. Track unfinished workers/ports before considering a stale lock.

## Appendix A. Short recurring-run instruction (for the operator to adopt)

The operator adopted the current instruction in [RECURRING_RUN_PROMPT.md](RECURRING_RUN_PROMPT.md) through OD-2026-10-02-C. Store that text in the existing automation; preserve its model, cadence, reasoning, project, environment and notification settings. Do not append historical prompts.

## Appendix B. Open points

- Which process the lock `pid` identifies (the run itself or a short-lived child).
- Whether Codex loads project-scoped `.codex/agents` on the installed version (upstream issue openai/codex#26408 reports agents advertised but not spawnable); fallback: `~/.codex/agents/`.
- Devin custom subagents are marked experimental upstream; the skills remain usable without them.
- Concurrent writers conflict on the two state files: hence the handoff notes.
- There is no CI: every gate in this protocol is local.
