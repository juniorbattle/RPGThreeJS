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
git --no-optional-locks diff --exit-code d7ca28aed5c377ffedb03202f6364b7a947d1096 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md
```

Also read `docs/autonomy/AUTONOMOUS_WORK_STATE.md` and `.json`, the newest file in `docs/autonomy/handoffs/`, and the Codex automation memory (`~/.codex/automations/rpgthreejs-auto-dev-90m/memory.md`). Compare the state with `git status`: live state is refreshed at snapshots, but a cutoff can leave it stale. Examine unlisted work and live.qaJobs receipts/provenance before rerunning QA.

## 2. Classify

| Situation | Action |
| --- | --- |
| no lock, clean tree, `dev` equals `origin/dev` | proceed under a new lock |
| lock heartbeat recent | stop, report `SKIPPED_ACTIVE_RUN`, stay read-only |
| lock older than 105 min, `pid` dead, no agent activity, no long process | confirm activity checks, archive/acquire, then snapshot reviewed WIP under the owned lock |
| lock younger than 105 min, `pid` dead, no activity | ambiguous: stay read-only and report `BLOCKED_BY_EXECUTION_LOCK`; a takeover needs an explicit operator order and confirmation that the other turn is stopped (a turn stalled on an approval or a quota limit looks like a dead run) |
| uncommitted work and no lock | acquire an exclusive lock, snapshot reviewed interrupted work, then continue |
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
LOCKED docs: <unchanged since d7ca28aed5c377ffedb03202f6364b7a947d1096 | CHANGED: ...>
Coherence of the work found: <what it does; what was verified; what was not>
Decision: <READ-ONLY | SNAPSHOT | TAKEOVER (operator order needed if under 105 min)>
Next action: <precise>
```

## 4. WIP snapshot (when ordered)

Plumbing only: the checked-out branch, the real index and the working tree are not touched, and untracked files are included.

Use an explicit reviewed path list, including intended deletions; never git add -A or an entire evidence directory. Deny secrets and paths outside the repository. Acquire/verify the execution lock before generating a snapshot. Temporary-index staging leaves the real index unchanged.

```powershell
$ErrorActionPreference = 'Stop'
$taskRepoRoot = (git rev-parse --show-toplevel).Trim()
$taskRunId = '<owned-runId>'
$taskPaths = @('<reviewed-relative-path-1>', '<reviewed-relative-path-2>')
$taskOwner = Get-Content -LiteralPath (Join-Path $taskRepoRoot '.git/codex-autonomy.lock') -Raw | ConvertFrom-Json
if ($taskOwner.runId -ne $taskRunId) { throw 'Lock not owned' }
if ((git remote get-url origin) -notmatch 'github\.com[:/]juniorbattle/RPGThreeJS(?:\.git)?$') { throw 'Unexpected remote' }
foreach ($taskPath in $taskPaths) {
  $taskAbsolute = [IO.Path]::GetFullPath((Join-Path $taskRepoRoot $taskPath))
  if (-not $taskAbsolute.StartsWith($taskRepoRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Path escaped repository' }
  if ($taskPath -match '(^|[/\\])(\.env[^/\\]*|auth\.json|credentials[^/\\]*|[^/\\]*\.pem)$') { throw 'Secret path refused' }
}
$taskBase = (git rev-parse HEAD).Trim()
$taskParent = $taskBase # existing owned WIP sha may be used for later snapshots
$taskIndex = Join-Path $env:TEMP ('wip-index-' + [guid]::NewGuid().ToString('N'))
$taskMessage = Join-Path $env:TEMP ('wip-message-' + [guid]::NewGuid().ToString('N') + '.txt')
try {
  $env:GIT_INDEX_FILE = $taskIndex
  git read-tree HEAD
  if ($LASTEXITCODE -ne 0) { throw 'read-tree failed' }
  git --literal-pathspecs add -- $taskPaths
  if ($LASTEXITCODE -ne 0) { throw 'explicit stage failed' }
  $taskTree = (git write-tree).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'write-tree failed' }
  [IO.File]::WriteAllText($taskMessage,"WIP snapshot of reviewed work

Agent: codex; Run: $taskRunId
",[Text.UTF8Encoding]::new($false))
  $taskSha = (git commit-tree $taskTree -p $taskParent -F $taskMessage).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'commit-tree failed' }
} finally {
  Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $taskIndex,$taskMessage -ErrorAction SilentlyContinue
}
$taskChanged = @(git diff --name-only $taskBase $taskSha)
if (@(Compare-Object $taskPaths $taskChanged).Count) { throw 'Unexpected snapshot paths' }
foreach ($taskPath in $taskPaths) {
  if (Test-Path -LiteralPath (Join-Path $taskRepoRoot $taskPath)) {
    if ((git hash-object -- $taskPath) -ne (git rev-parse "${taskSha}:$taskPath")) { throw 'Snapshot content mismatch' }
  }
}
git update-ref "refs/heads/wip/$taskRunId" $taskSha
if ($LASTEXITCODE -ne 0) { throw 'update-ref failed' }
git push origin "refs/heads/wip/${taskRunId}:refs/heads/wip/${taskRunId}"
if ($LASTEXITCODE -ne 0) { throw 'push failed' }
```

Review the exact diff and deletions before push. Record the SHA in lock/live state and verify remote parity. A WIP snapshot is not acceptance. No broad staging, secrets, tracked evidence overwrite or force-push.

## 5. Takeover and closeout

Takeover: confirm all conditions; archive the old lock to `.git/codex-autonomy.abandoned-<YYYYMMDDTHHmm>.json`; write a new lock with `runId`, `agent`, `runStartedAt`, `heartbeat`, `branch`, `activeTask` (set `pid` to the long-lived agent process if known, else omit it); acquire atomically before snapshotting reviewed WIP; refresh the heartbeat about every 10 minutes by rewriting the same JSON; never `reset`, `clean` or `checkout` over uncommitted work.

Closeout: update the state files including the live block, run the quick checks, commit coherent work with the `Agent:` trailer, push `origin/dev`, set `runEndedAt`, release the lock, delete the `wip/<runId>` branch once its content is on `dev`.

## Hazards

- `git status` without `--no-optional-locks` can rewrite the index and collide with another agent's Git command.
- The lock schema varied between runs (`pid` or `processId`, `heartbeat` or `lastHeartbeat`): accept both.
- `pid` may name a short-lived child rather than the run. Judge liveness from heartbeat age plus other-agent activity.
- `core.autocrlf=true` on this host prints LF/CRLF warnings. They are not errors.
- Never take a lock younger than 105 minutes without an explicit operator order.
- Do not edit the other agent's state files while it may resume: leave a note in `docs/autonomy/handoffs/` instead.
