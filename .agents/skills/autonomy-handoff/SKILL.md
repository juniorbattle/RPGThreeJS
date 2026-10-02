---
name: autonomy-handoff
description: "Use at the start of any run or session on RPGThreeJS before touching the repository, when taking over from or handing off to another agent (Codex or Devin), and at closeout. Checks the execution lock, state files against Git, remote parity and uncommitted work; takes non-invasive WIP snapshots; produces the takeover brief."
---

# Autonomy handoff

Protocol: `docs/autonomy/MULTI_AGENT_PROTOCOL.md` (not a contract), extending the LOCKED `docs/contracts/AUTONOMOUS_WORK_PROTOCOL.md`. State: `docs/autonomy/AUTONOMOUS_WORK_STATE.md` and `.json`. Decisions: `docs/autonomy/OPERATOR_DECISIONS.md`. Lock: `.git/codex-autonomy.lock`.

Default mode is **read-only**. Snapshots, lock changes and commits happen only when the orchestrator or the operator orders them.

## 1. Preflight (read-only)

Use `--no-optional-locks` so Git does not rewrite the index while another agent may be working.

```powershell
$r = (git rev-parse --show-toplevel)
(Get-Date).ToUniversalTime().ToString('o')
Get-Content -Raw "$r/.git/codex-autonomy.lock"; (Get-Item "$r/.git/codex-autonomy.lock").LastWriteTime.ToString('o')
Get-Process -Id <pid from the lock> -ErrorAction SilentlyContinue
Get-ChildItem "$env:USERPROFILE/.codex/sessions" -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 2 -Property LastWriteTime,Name
git --no-optional-locks status --short --branch
git --no-optional-locks stash list
git --no-optional-locks diff --stat
git --no-optional-locks rev-parse HEAD origin/dev origin/main
git ls-remote --heads origin dev main "wip/*"
git --no-optional-locks diff --exit-code b1e8858 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md
```

Also read `docs/autonomy/AUTONOMOUS_WORK_STATE.md` and `.json`, the newest file in `docs/autonomy/handoffs/`, and the Codex automation memory (`~/.codex/automations/rpgthreejs-auto-dev-90m/memory.md`). Compare the state with `git status`: the state is usually written only at run start, so uncommitted files it does not list are normal and must be examined, not ignored.

## 2. Classify

| Situation | Action |
| --- | --- |
| no lock, clean tree, `dev` equals `origin/dev` | proceed under a new lock |
| lock heartbeat recent | stop, report `SKIPPED_ACTIVE_RUN`, stay read-only |
| lock older than 105 min, `pid` dead, no agent activity, no long process | stale: snapshot, archive the lock, take over |
| lock younger than 105 min, `pid` dead, no activity | ambiguous: stay read-only and report `BLOCKED_BY_EXECUTION_LOCK`; a takeover needs an explicit operator order and confirmation that the other turn is stopped (a turn stalled on an approval or a quota limit looks like a dead run) |
| uncommitted work and no lock | coherent work from an interrupted run: snapshot, then continue |
| the LOCKED-document gate prints a diff | stop: a contract was edited; report it to the operator |

## 3. Takeover brief (return at most 30 lines)

```
TAKEOVER BRIEF <UTC time>
Lock: <present|absent> agent=<> pid=<n> <alive|dead> heartbeat=<ts> (<age> min) -> <ACTIVE|STALE|AMBIGUOUS>
Other agent activity: <latest session write | none>
Git: branch <b> | HEAD <sha> | origin/dev <sha> | stash <n>
Working tree: <n modified, n untracked> <paths>
WIP snapshot: <branch@sha | none>
State files: status=<> task=<> vs lock -> <consistent | stale: ...>
LOCKED docs: <unchanged since b1e8858 | CHANGED: ...>
Coherence of the work found: <what it does; what was verified; what was not>
Decision: <READ-ONLY | SNAPSHOT | TAKEOVER (operator order needed if under 105 min)>
Next action: <precise>
```

## 4. WIP snapshot (when ordered)

Plumbing only: the checked-out branch, the real index and the working tree are not touched, and untracked files are included.

```powershell
$env:GIT_TERMINAL_PROMPT = '0'
$r = (git rev-parse --show-toplevel); $runId = '<runId>'; $branch = "wip/$runId"
$parent = (git -C $r rev-parse HEAD).Trim()      # for a later snapshot of the same run, use the previous snapshot sha
$idx = Join-Path $env:TEMP ("wip-index-" + [guid]::NewGuid().ToString('N'))
try { $env:GIT_INDEX_FILE = $idx
  git -C $r read-tree HEAD; git -C $r add -A 2>$null; $tree = (git -C $r write-tree).Trim()
} finally { Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue; Remove-Item $idx -ErrorAction SilentlyContinue }
$msg = Join-Path $env:TEMP 'wip-msg.txt'         # ASCII: subject, base, lock facts, what was verified, trailer "Agent: ...; Run: ..."
$sha = (git -C $r commit-tree $tree -p $parent -F $msg).Trim()
git -C $r update-ref "refs/heads/$branch" $sha
git -C $r push origin "refs/heads/${branch}:refs/heads/${branch}"
```

Verify: `git diff --name-status $parent $sha` lists exactly the dirty paths, and `git hash-object -- <path>` equals `git rev-parse ${sha}:<path>` for each. `git add -A` stats the whole tree and can take tens of seconds, so run it as a background command.

## 5. Takeover and closeout

Takeover: snapshot; archive the old lock to `.git/codex-autonomy.abandoned-<YYYYMMDDTHHmm>.json`; write a new lock with `runId`, `agent`, `runStartedAt`, `heartbeat`, `branch`, `activeTask` (set `pid` to the long-lived agent process if known, else omit it); refresh the heartbeat about every 10 minutes by rewriting the same JSON; never `reset`, `clean` or `checkout` over uncommitted work.

Closeout: update the state files including the live block, run the quick checks, commit coherent work with the `Agent:` trailer, push `origin/dev`, set `runEndedAt`, release the lock, delete the `wip/<runId>` branch once its content is on `dev`.

## Hazards

- `git status` without `--no-optional-locks` can rewrite the index and collide with another agent's Git command.
- The lock schema varied between runs (`pid` or `processId`, `heartbeat` or `lastHeartbeat`): accept both.
- `pid` may name a short-lived child rather than the run. Judge liveness from heartbeat age plus other-agent activity.
- `core.autocrlf=true` on this host prints LF/CRLF warnings. They are not errors.
- Never take a lock younger than 105 minutes without an explicit operator order.
- Do not edit the other agent's state files while it may resume: leave a note in `docs/autonomy/handoffs/` instead.
