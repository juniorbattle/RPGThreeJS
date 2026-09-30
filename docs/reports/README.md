# Task reports are historical records

Production source and [canonical docs](../README.md) define the current contract. Every file here records a task at its own baseline. A report can retain obsolete statements as history; its status header and [index](INDEX.md) point to current authority. Browser captures prove only the scenario, build, and date recorded by their report.

## Required metadata for new task reports

| Field | Meaning |
| --- | --- |
| `TASK` | Stable task identifier. |
| `DOMAIN` | Campaign, Traversal, content, combat, UI, media, tooling, or another owner. |
| `BASELINE` | Exact starting commit and branch. |
| `BRANCH` | Work branch. |
| `HEAD` | Final commit of the report task. |
| `STATUS` | Draft, review, merged, superseded, or historical. |
| `MERGED_IN` | Merge commit, or `NONE` while unmerged. |
| `SUPERSEDES` | Earlier report IDs/paths, or `NONE`. |
| `SUPERSEDED_BY` | Later report or canonical doc, or `NONE`. |
| `PRODUCTION_IMPACT` | Exact runtime behavior affected, or `NONE`. |
| `CANONICAL_DOCS_UPDATED` | Paths updated, or `NONE` with a reason. |
| `EVIDENCE` | Machine result and selected visual evidence paths, plus scope and limitations. |

Use an explicit `CURRENT FACT`, `APPROVED DECISION`, `PROPOSED FUTURE DESIGN`, or `UNDECIDED` label for planning claims. Do not silently revise historical claims after a later rollout. Add a short supersession header and a new canonical doc instead.

## Retention policy

For new work, prefer one small machine-readable result, about 5–10 selected screenshots, and a final report. Keep additional video or comparisons only when they prove a unique contract. Intermediate, rejected, and rerun evidence should normally leave the active tree **after operator approval**, dependency/link repair, and a uniqueness review; Git history recovers retired tracked files. Never automatically delete `UNKNOWN_REVIEW` material.

Current Traversal QA drivers write by default under ignored `docs/reports/evidence/traversal-t0/`. Tracked evidence is an explicit, reviewed promotion using `--output=<explicit-path>` or a selected copy, never the ordinary rerun destination. A later run must not overwrite a historical task package. [Cleanup record](project-continuity-cleanup-1.md).
