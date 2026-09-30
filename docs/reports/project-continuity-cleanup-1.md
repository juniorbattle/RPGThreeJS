# PROJECT-CONTINUITY-CLEANUP-1

| Metadata | Value |
| --- | --- |
| TASK | `PROJECT-CONTINUITY-CLEANUP-1` |
| DOMAIN | Repository continuity |
| BASELINE | `main @ 81c5d6dd15be7121af2d02ae3fae4485e28e9dbd` |
| BRANCH | `project-continuity-cleanup-1` |
| HEAD | `project-continuity-cleanup-1` Git ref at review handoff; exact commit is returned in the handoff |
| STATUS | Operator review; unmerged |
| MERGED_IN | NONE |
| SUPERSEDES | Cleanup plan in [PROJECT-CONTINUITY-AUDIT-1](../audits/project-continuity-audit-1.md) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE |
| CANONICAL_DOCS_UPDATED | `docs/README.md`; `docs/traversal/QA_GUIDE.md`; `docs/reports/README.md`; `docs/reports/INDEX.md` |
| EVIDENCE | [Group-level cleanup result](../audits/project-continuity-cleanup-1.json); link audit; ignored local built-production T0 QA result |

This is the first physical cleanup approved by the continuity audit. It changes documentation, historical evidence retention, and QA output defaults only. Current authority stays production source/runtime → canonical docs → historical reports → browser evidence → Git history. No gameplay, campaign, save, combat, dialogue, economy, or production art changed.

## Exact retirement

All six `REMOVE_AFTER_LINK_REPAIR` directories were verified at the file level and removed. Every JSON parsed; all PNGs had valid signatures; the folders contained only task browser artifacts (JSON, HTML, PNG). The earlier screenshots are not byte duplicates of the final gallery, but their earlier DEV/activation status and measurements remain in their historical reports and Git history. Current T0 behavior is covered by the [integrated production report](traversal-t0-production-loop-final-1.md) and [contract](../traversal/T0_PRODUCTION_CONTRACT.md). Thirty live Markdown evidence links across the six reports were converted to labeled historical paths before removal; no result value was rewritten.

| Retired folder | Files | Git blob bytes |
| --- | ---: | ---: |
| `traversal-t0-route-risk-1-browser/` | 18 | 24,286,570 |
| `traversal-t0-route-risk-production-1-browser/` | 26 | 16,470,452 |
| `traversal-t0-route-reward-1-browser/` | 15 | 19,010,576 |
| `traversal-t0-route-reward-production-1-browser/` | 16 | 17,474,122 |
| `traversal-t0-pursuit-1-browser/` | 12 | 16,897,604 |
| `traversal-t0-pursuit-production-1-browser/` | 22 | 17,354,843 |
| **Mandatory retirement** | **109** | **111,494,167** |

The original paths are recoverable from `main @ 81c5d6dd15be7121af2d02ae3fae4485e28e9dbd` and earlier Git history. No corresponding task report was deleted.

Five one-shot tools were separately retired after checking imports and references: `tools/traversal-remaining-legs-audit-1-gallery.mjs`, `-gallery-page.mjs`, `-contact-sheet.mjs`, `-inventory.mjs`, and `tools/traversal-t0-cleanup-inventory.py`. Their four gallery/inventory outputs and the cleanup inventories remain in the tree. These **manual-review retirements** total 5 files / 50,410 Git blob bytes. Historical reports now describe the commands in past tense and point to Git recovery.

`tools/project-continuity-audit-1.mjs` remains as a **FROZEN ONE-SHOT AUDIT TOOL**, explicitly pinned to `6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0`; it is not a generic current-tree auditor.

## File-level retention review

- **Current golden T0:** all 42 files / 47,319,394 bytes retained: 8 JSON, 4 HTML, 30 PNG. The 30 PNGs have 30 distinct hashes and every image is directly referenced by its gallery HTML. The set covers Path A/B, three-system coexistence, CAUGHT, ESCAPED, Route 6, Journey agency, and three viewport widths. No artifact met all conditions for confident deletion. An approximate 5–10 screenshot target does not override those conditions.
- **Remaining-legs gallery:** all 103 files / 171,236,238 bytes retained, `MANUAL_REVIEW_REQUIRED`. Its 100 PNGs include 93 distinct hashes; all are linked from the historical gallery. The 97 indexed states and three contact sheets cover T1/Bois-Clair, T3/Shadow, T4/final refuge, and branch/dialogue/combat variants absent from final T0 proof. A compact set that preserves their uniquely useful information is not established. Its old architecture claims are marked historical.
- **T0 cleanup gallery:** all 44 files / 53,314,692 bytes retained, `MANUAL_REVIEW_REQUIRED`. Its 40 PNGs include 38 distinct hashes; all appear in its gallery. It retains pre-Risk shared-world, black-transition, branch/checkpoint, and responsive comparisons. The final integrated set and shared-world/motion reports overlap, but file-level visual equivalence is not proven, so no deletion was made.
- **Shared-world and motion:** the 73-file / 115,614,073-byte checkpoint gallery and 23-file / 19,356,321-byte motion gallery remain `KEEP_HISTORICAL`. They include branch/checkpoint comparisons and unique WebM motion clips.
- **Art:** the Risk (36 files / 41,883,074 bytes), Reward (14 / 17,781,012), and Pursuit (12 / 15,423,632) art galleries remain `KEEP_HISTORICAL`. Their visual selection/variant history is not replaced by final functional screenshots.

## QA output contract

`tools/traversal-t0-browser-qa.mjs`, `tools/traversal-t0-reward-qa.mjs`, and `tools/traversal-t0-pursuit-qa.mjs` now default to ignored `docs/reports/evidence/traversal-t0/{integrated,reward,pursuit}/<mode>/`. Risk-art, Reward-art, and Pursuit-art QA modes also write under ignored local evidence. `--output=<explicit-path>` still takes precedence for an intentionally reviewed package; `--print-output` verifies path resolution without starting Vite or Chromium. Ordinary reruns cannot overwrite tracked historical or golden folders through their defaults.

## Before and after tracked tree

Git blob sizes measure tracked content; Windows working-copy CRLF lengths are not used. The baseline is exact `main @ 81c5d6dd15be7121af2d02ae3fae4485e28e9dbd`. After figures are measured from the staged cleanup tree before commit, including this report and JSON result.

| Scope | Before files | Before bytes | After files | After bytes |
| --- | ---: | ---: | ---: | ---: |
| Entire tracked tree | 2,356 | 1,534,469,131 | 2,244 | 1,422,952,754 |
| `docs/reports/**` | 1,258 | 835,790,721 | 1,150 | 724,310,095 |
| `docs/reports/traversal-*` | 476 | 594,512,066 | 367 | 483,022,584 |

Gross removals are 114 files / 111,544,577 bytes: mandatory evidence 109 / 111,494,167; manual-review tools 5 / 50,410; golden curation 0 / 0. Net active-tree reduction after added documentation and QA-tool edits is 112 files / 111,516,377 bytes, or 7.27% of baseline tracked bytes. The mandatory set alone was 7.27% of baseline tracked bytes. No temporary screenshots, profiles, logs, or `dist` output are committed.

## Validation and limits

- `node --check` passed for all three modified QA drivers. Their `--print-output` checks confirmed the ignored defaults and explicit `--output` precedence.
- TypeScript `--noEmit` passed. Production Vite build passed with its existing large-chunk advisory. The sandbox initially denied Vite config access; the same build passed with approved repository access.
- Built-production canonical T0 QA passed using `docs/reports/evidence/traversal-t0/integrated/production/`: 23 captures, both branches complete, zero browser errors, and zero Risk, integrated, canonical, checkpoint, coast, or frame failures. Git ignores this result and no retired browser folder was regenerated.
- A relevant Markdown link audit checked 133 documents and 637 local links. No canonical link or historical Markdown link to retired Traversal evidence is broken. It found 46 inherited `tmp/cinematics` links in three unrelated CIN-6.7 historical reports; those reports are unchanged from baseline.
- `git diff --check` passed. `git diff --name-only` against the baseline returned zero paths under `src/**` and `public/assets/**`. Full Vitest is not needed because no gameplay source, test, or production asset changed.

Remaining review: the two large historical galleries above and unrelated `UNKNOWN_REVIEW` evidence. The cleanup stops at the pushed branch; no merge or further evidence deletion is implied.
