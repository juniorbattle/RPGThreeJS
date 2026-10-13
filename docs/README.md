# Documentation authority

The [game constitution](game/GAME_CONSTITUTION.md) and [locked production contracts](contracts/README.md) record the operator's approved target from `PRODUCTION-CONTRACTS-LOCK-1`. This index's older baseline, `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`, remains the source audit baseline. Read the contracts before using an older task report.

1. **Explicit operator decisions and locked contracts are the approved target.** Current source describes implementation and may still drift from that target.
2. **Production source and runtime are executable evidence.** Verify current behavior against checked-out source and a production run.
3. **Canonical docs describe the current implementation and intended target.** Update stale status after an approved change.
4. **Task reports are historical execution records.** Their baseline, branch, and claims describe the state at that task. Reports never silently override current canonical docs.
5. **Browser evidence is validation evidence.** Screenshots and QA JSON prove the scenarios recorded; they do not define campaign or gameplay rules.
6. **Git history is the recovery source for retired intermediate evidence.** Retirement needs dependency and unique-proof checks; preserve approved historical proof.

## Start here

- [Current project status](project/CURRENT_STATUS.md), [demo roadmap](project/DEMO_ROADMAP.md), [post-demo roadmap](project/POST_DEMO_ROADMAP.md), and [engineering rules](project/ENGINEERING_RULES.md).
- [Traversal authority](traversal/README.md), [T0 production contract](traversal/T0_PRODUCTION_CONTRACT.md), and [remaining legs](traversal/LEGS_ROADMAP.md).
- [Content map](content/README.md) and [demo content map](content/DEMO_CONTENT_MAP.md).
- [Historical reports](reports/README.md) and [report index](reports/INDEX.md).
- [Repository inventory and proposed cleanup](audits/project-continuity-audit-1.md). No deletion is authorized by the plan alone.
- [First physical cleanup record](reports/project-continuity-cleanup-1.md). Retired task evidence remains recoverable from Git history; current QA reruns use ignored local output.

The labels **CURRENT FACT**, **APPROVED DECISION**, **PROPOSED FUTURE DESIGN**, and **UNDECIDED** distinguish observed code, an explicit accepted contract, a plan, and an open decision. A proposal is not a rollout instruction.
