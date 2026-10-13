# PROJECT-CONTINUITY-AUDIT-1

> **Historical plan executed in part.** The six `REMOVE_AFTER_LINK_REPAIR` evidence directories below were retired in [PROJECT-CONTINUITY-CLEANUP-1](../reports/project-continuity-cleanup-1.md). Counts and projected reduction below describe the pre-cleanup baseline. The linked generator is a frozen one-shot audit tool, not a current-tree auditor.

TASK: `PROJECT-CONTINUITY-AUDIT-1`
DOMAIN: repository continuity / documentation / cleanup planning
BASELINE: `main @ 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`
BRANCH: `project-continuity-audit-1`
STATUS: operator review; **no cleanup deletion**
PRODUCTION_IMPACT: none

The [machine-readable inventory](project-continuity-audit-1.json) lists every baseline tracked candidate in `src/traversal/**`, `tools/traversal*`, `public/assets/generated/lion-phase/traversal/**`, and `docs/**`. Each row has path, Git blob bytes, category, direct source/tool/report/document references found by the scan, historical status, recommended action, and reason. The [read-only generator](../../tools/project-continuity-audit-1.mjs) uses the exact baseline tree. It parses local Markdown/HTML links and Traversal file names from text files up to 2 MB. Dynamic asset roots and implicit references require source review; an empty reference list is **not** proof of safe removal.

## Exact baseline inventory

| Scope | Tracked files | Git blob bytes |
| --- | ---: | ---: |
| Entire baseline tree | **2,337** | **1,533,491,088** |
| `docs/reports/**` | **1,256** | **835,785,217** |
| Traversal reports and evidence, `docs/reports/traversal-*` | **476** | **594,511,165** |
| All candidate scopes, overlapping `docs` groups counted once | **1,414** | **909,578,390** |
| `src/traversal/**` | 52 | 264,879 |
| `tools/traversal*` | 8 | 188,176 |
| Traversal runtime asset tree | 27 | 38,116,664 |

The 1,414 candidate classifications are: 57 `RUNTIME_AUTHORITY`, 22 `ACTIVE_QA_TOOL`, 3 `CANONICAL_DOC`, 42 `CURRENT_GOLDEN_EVIDENCE`, 129 `HISTORICAL_REPORT`, 3 `SUPERSEDED_REPORT`, 414 `SUPERSEDED_EVIDENCE`, 5 `SUPERSEDED_TOOL`, and 739 `UNKNOWN_REVIEW`. The large unknown class includes unrelated docs/evidence, deliberately not declared obsolete by a Traversal-focused audit. **UNKNOWN_REVIEW must never be deleted automatically.** The new canonical documents are branch additions, not part of the measured baseline tree.

## Authority findings

1. [Final convergence](../TRAVERSAL_T0_FINAL_CONVERGENCE.md) is a pre-Lot-A historical record. It still contains production-disabled, optional road-combat, and old QA-path claims. A supersession header points to the [current T0 contract](../traversal/T0_PRODUCTION_CONTRACT.md); its historical body was not rewritten.
2. [Remaining-legs audit](../reports/traversal-remaining-legs-audit-1.md) correctly described its earlier branch but predates production Risk/Reward/Pursuit and removal of `TraversalRoadEncounter`/`LOCAL_INTERACTION`. Its generic scene, T2 handoff, T4 timing, and final-hub concepts are proposals. The [new leg audit](../traversal/LEGS_ROADMAP.md) rechecks current source and labels open decisions.
3. [T0 cleanup](../reports/traversal-t0-cleanup-1.md) is the removal/asset-promotion record, not the current production activation record. Its report remains intact with a historical header.
4. Individual [Risk](../reports/traversal-t0-route-risk-1.md), [Reward](../reports/traversal-t0-route-reward-1.md), and [Pursuit](../reports/traversal-t0-pursuit-1.md) DEV-only task reports are superseded for activation status. Component production and art reports remain historical evidence. The integrated [final T0 report](../reports/traversal-t0-production-loop-final-1.md) and current source establish production behavior.

Current T0: Route Motion, Risk, Reward, Pursuit, checkpoints, arrival, and Journey handoff are production-on. Road combat is absent; `TraversalRoadEncounter` and `LOCAL_INTERACTION` are removed. CAUGHT only calls `resetRouteSpeed`. The [documentation index](../README.md) defines source/runtime → canonical docs → historical reports → browser evidence → Git recovery authority order.

## Current demo and remaining legs

The [demo content map](../content/DEMO_CONTENT_MAP.md) records campaign, Traversal, refuges, Journey, dialogue, combat, cinematics, VFX, UI, and content gaps with explicit statuses. Existing campaign/Journey content is production source; a fresh full-demo validation pass remains required before a new release claim. The first and second refuge are interactive; final refuge is currently a story node.

| Leg | Current source | Production Traversal | Future design status |
| --- | --- | --- | --- |
| T1 | First refuge → village choice; reserve trail, Valmir road, strict event/combat fork | Disabled; Journey presents campaign | Side-on conversion proposed; art, route, timing, demo need undecided |
| T2 | Village choice → second refuge; zero stages | Disabled; Journey presents campaign | Direct handoff proposed; demo need undecided |
| T3 | Second refuge → Shadow signs; Lancer, witnesses, strict event/combat fork | Disabled; Journey presents campaign | Side-on conversion proposed; art, route, timing, demo need undecided |
| T4 | Shadow signs → final refuge; zero stages | Disabled; Journey presents campaign | Atmospheric route and final hub proposed; demo need undecided |

No T1–T4 presentation or final-hub conversion is promoted to **DEMO_REQUIRED** by this audit. The [demo roadmap](../project/DEMO_ROADMAP.md) separates required validation from proposed features; the [post-demo roadmap](../project/POST_DEMO_ROADMAP.md) separates `POST_DEMO` from `DEFERRED_UNDECIDED`.

## Evidence retention and cleanup groups

The integrated T0 production-loop [QA result](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json), responsive gallery, deliberate CAUGHT/ESCAPED results, and final report are the **current golden evidence**. Its folder currently has 42 files: 8 JSON, 4 HTML, and 30 PNG (47,319,394 bytes). It is retained whole in this audit. A later operator-approved curation can choose about 5–10 screenshots after checking the report's links and unique scenario coverage. Older evidence can retain a unique art, motion, or historical comparison: the checkpoint/full-world gallery, motion clips, and Risk/Reward/Pursuit art galleries remain `KEEP_HISTORICAL`. The remaining-legs gallery shows non-T0 campaign presentation and cannot be replaced by the T0 final gallery without review.

`SAFE_TO_REMOVE`: none verified without link or unique-proof work. `KEEP_CURRENT`: runtime source/assets, current QA drivers, canonical docs, and final integrated evidence. `KEEP_HISTORICAL`: task reports plus the distinctive checkpoint, motion, and art proofs. `MANUAL_REVIEW`: all `UNKNOWN_REVIEW` entries, remaining-legs gallery, cleanup gallery, task-specific inventory/gallery tools, and the small Pursuit-art production result.

The six directory candidates below are **REMOVE_AFTER_LINK_REPAIR** only after operator approval and a file-level uniqueness check. They contain earlier DEV placeholder or separate activation runs. The replacement for current behavior is the [T0 contract](../traversal/T0_PRODUCTION_CONTRACT.md), [integrated report](../reports/traversal-t0-production-loop-final-1.md), and its [golden evidence](../reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json). Git history would preserve the retired files.

| Proposed deletion path | Files | Bytes | Reason / link dependencies | Risk |
| --- | ---: | ---: | --- | --- |
| `docs/reports/traversal-t0-route-risk-1-browser/` | 18 | 24,286,570 | Earlier DEV placeholder proof; links in `traversal-t0-route-risk-1.md` | Medium |
| `docs/reports/traversal-t0-route-risk-production-1-browser/` | 26 | 16,470,452 | Separate activation run; links in production report and output path in `tools/traversal-t0-browser-qa.mjs` | Medium |
| `docs/reports/traversal-t0-route-reward-1-browser/` | 15 | 19,010,576 | Earlier DEV placeholder proof; links in `traversal-t0-route-reward-1.md` | Medium |
| `docs/reports/traversal-t0-route-reward-production-1-browser/` | 16 | 17,474,122 | Separate activation run; links in production report and output path in `tools/traversal-t0-reward-qa.mjs` | Medium |
| `docs/reports/traversal-t0-pursuit-1-browser/` | 12 | 16,897,604 | Earlier geometric proxy proof; links in `traversal-t0-pursuit-1.md` | Medium |
| `docs/reports/traversal-t0-pursuit-production-1-browser/` | 22 | 17,354,843 | Separate activation run; links in production report and output path in `tools/traversal-t0-pursuit-qa.mjs` | Medium |

**Projected active-tree reduction after approval and repairs: 109 files, 111,494,167 bytes (7.27% of baseline tracked bytes).** The hypothetical baseline tree would become 2,228 files / 1,421,996,921 bytes. The current branch deletes **zero** existing evidence files.

### Manual-review items with known sizes

- Remaining-legs gallery: 103 files / 171,236,238 bytes. It includes 97 indexed captures and non-T0 campaign states not in the final T0 evidence. Its gallery/inventory tooling totals 38,217 bytes across four files; both gallery and tools need a separate retention/reproducibility decision.
- T0 cleanup gallery: 44 files / 53,314,692 bytes. Compare its shared-world/checkpoint proof to the final set and repair links before any proposal to retire it. The cleanup inventory tool is 12,193 bytes and is cited by its report.
- Shared-world checkpoint gallery: 73 files / 115,614,073 bytes; motion handoff gallery: 23 files / 19,356,321 bytes. They retain distinct world and motion acceptance proof, so `KEEP_HISTORICAL` now.
- Risk art gallery: 36 files / 41,883,074 bytes; Reward art gallery: 14 files / 17,781,012 bytes; Pursuit art gallery: 12 files / 15,423,632 bytes. They document variants and visual comparisons beyond the final integrated selection; `KEEP_HISTORICAL` now.
- Unrelated `docs/**` and report evidence classified `UNKNOWN_REVIEW` needs its domain owner. Do not apply this Traversal cleanup plan to it.

## Validation record

This branch changes only documentation and adds the read-only audit generator. `node tools/project-continuity-audit-1.mjs --check-links` checked 17 canonical/audit docs and 95 local links with zero broken links. Its source cross-check confirmed the T0-only gate and selector, production Risk/Reward/Pursuit policy, absence of `TraversalRoadEncounter` and `LOCAL_INTERACTION`, and existence of the golden QA result. `git diff --check` passed. `git diff --name-only 6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0 -- src public/assets` returned no paths; `git status` found no untracked production source or asset paths. Full Vitest/build was not run because runtime and assets were untouched. Final branch HEAD is returned with the handoff.
