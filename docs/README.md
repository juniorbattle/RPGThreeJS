# Documentation authority

Current baseline: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0` (PROJECT-CONTINUITY-AUDIT-1). Read this index before using an older task report.

1. **Production source and runtime are executable authority.** A discrepancy must be resolved against the checked-out source and a production run.
2. **Canonical docs are the current human-readable contract.** Update these when an approved change alters behavior or scope; they describe the baseline named above.
3. **Task reports are historical execution records.** Their baseline, branch, and claims describe the state at that task. Reports never silently override current canonical docs.
4. **Browser evidence is validation evidence.** Screenshots and QA JSON prove the scenarios recorded; they do not define campaign or gameplay rules.
5. **Git history is the recovery source for retired intermediate evidence.** No existing evidence is deleted by this audit. Retirement needs link repair, a unique-proof check, and operator approval.

## Start here

- [Current project status](project/CURRENT_STATUS.md), [demo roadmap](project/DEMO_ROADMAP.md), [post-demo roadmap](project/POST_DEMO_ROADMAP.md), and [engineering rules](project/ENGINEERING_RULES.md).
- [Traversal authority](traversal/README.md), [T0 production contract](traversal/T0_PRODUCTION_CONTRACT.md), and [remaining legs](traversal/LEGS_ROADMAP.md).
- [Content map](content/README.md) and [demo content map](content/DEMO_CONTENT_MAP.md).
- [Historical reports](reports/README.md) and [report index](reports/INDEX.md).
- [Repository inventory and proposed cleanup](audits/project-continuity-audit-1.md). No deletion is authorized by the plan alone.

The labels **CURRENT FACT**, **APPROVED DECISION**, **PROPOSED FUTURE DESIGN**, and **UNDECIDED** distinguish observed code, an explicit accepted contract, a plan, and an open decision. A proposal is not a rollout instruction.
