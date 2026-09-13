# REPO-CLEAN-3 physical reduction

## Baseline and authority

- Branch: `main`
- Required HEAD: `717c3d56277bf6008c34a2f534ca1f44f912afa4`
- Required `origin/main`: `717c3d56277bf6008c34a2f534ca1f44f912afa4`
- Preflight: clean and exact before REPO-CLEAN-3 changes.
- Commit: no.
- Push: no.
- Detailed tracked and local inventories: [`tools/cleanup/specs/repo_clean_3_execution.json`](../../tools/cleanup/specs/repo_clean_3_execution.json).

## Physical reduction result

The active tree removed 438 tracked files totaling 374,353,821 bytes. Batch F separately removed 2,220 ignored cinematic-QA files totaling 3,409,736,280 bytes after explicit operator approval. The Batch F preserved closure remains 390 files / 708,011,852 bytes.

No file was moved. No dependency was removed. No production MP4 was deleted or rewritten. No combat VFX content, tooling, registry, manifest, or local evidence was changed or removed.

| Batch | Scope | Files removed | Bytes removed |
| --- | --- | ---: | ---: |
| A | Non-ready character validation history | 219 | 219,677,387 |
| B | Obsolete ready-stage outputs after canonical QA migration | 205 | 116,012,435 |
| C | Raw status sources | 12 | 25,956,826 |
| C | Generated review PDFs | 2 | 12,707,173 |
| D | Legacy cinematic tools/specs/reports | 0 | 0 |
| E | Production cinematic/reference media | 0 | 0 |
| F | Ignored local cinematic-QA derivatives | 2,220 | 3,409,736,280 |

## Batch A — character validation history

All 219 files under the five non-ready historical validation pipelines were removed. They consisted of raw generations, processed variants, rejected/reserve material, boards, prompt notes, and QC metadata. Git at the baseline commit remains the recovery source.

The protected canonical full sprites were untouched. Option C retains the canonical full sprite plus one uniquely useful original reference for each pilot:

- Alistair: `public/assets/characters/pixel/full/alistair.png` and `public/assets/characters/pixel/validation/ready/original/alistair.png`
- Sage Seraphine: `public/assets/characters/pixel/full/sage_seraphine.png` and `public/assets/characters/pixel/validation/ready/original/sage_seraphine.png`
- Elara: `public/assets/characters/pixel/full/elara.png` and `public/assets/characters/pixel/validation/ready/original/elara.png`

## Batch B — ready/canonical consolidation

The ready tree was reduced from 209 files / 119,839,169 bytes to 4 files / 3,825,846 bytes. It now contains only the three curated original references and a concise policy README.

The CIN-6.7.1 browser QA no longer reads the deleted `ready-manifest.json`. It calculates alpha bounds directly from the already-rendered canonical runtime images. The CIN-6E-A preproduction protected-path assertion now names the canonical `pixel/full` authority instead of treating historical validation output as runtime-protected content.

Of 51 ready/full files, 48 were byte-identical to canonical content and three were obsolete non-runtime validation variants. The swapped-name Aldric/Eldwin/Lyra ready files were classified as legacy pipeline aliases and removed. The protected canonical `sage_seraphine.png` / `seraphine.png` runtime identity alias remains deliberately intact.

## Batch C — raw status sources and PDFs

The 12 files in `public/assets/status-indicators/raw` were removed after confirming that all runtime code resolves the ten protected `status-indicators/runtime` PNGs and no active generator consumes the raw directory.

The two committed CIN-6E-A.2/A.3 review PDFs were removed. Their source specifications, human decision reports, deterministic PDF builders, and required selected local inputs remain. The historical A.2 audit now records the PDF as generated on demand instead of requiring the binary to exist.

## Batch D — legacy cinematic tooling/specs/reports

No tracked files were removed. The audited 17-file A.2/A.3 bundle remains coupled to active gate/finalization tests and deterministic PDF regeneration. Removing isolated members would weaken recovery or change the expected test count.

## Batch E — cinematic and reference media

No tracked cinematic media was removed. All 31 production MP4s remain referenced by the current production manifest/tests. The sole `LEGACY_UNUSED` entry is `qa-placeholder`, a manifest-only record with no media source; it offers no physical MP4 to delete.

Minimal GOLD evidence for `alaric_audience_arrival`, `camp_departure`, and `valmir_route_fork` remains. Environment plates, production posters, and current cinematic source assets remain untouched.

## Batch F — local cinematic QA

Before deletion, the execution manifest recorded all 2,220 approved deletion paths and every one of the 390 preserved paths with sizes, categories, reasons, and reference status.

The preserved closure includes:

- exact CIN-6E-A preproduction and active dynamic-gate test inputs;
- six report-linked A.4R screenshots plus `cin6ea4/browser-qa/results.json`;
- final CIN-6E-A review viewer assets and deterministic PDF inputs;
- three minimal GOLD integration frames;
- approved Pilot C, E, E-C, and F sources/masters/final frames/provenance;
- retained cinematic prompt inputs;
- the complete ignored cinematic media toolchain.

Post-deletion verification found zero missing preserved files, zero size mismatches, zero surviving deletion targets, zero broken A.4R report images, zero broken final-review links, and zero missing GOLD references.

## Protected systems

| Gate | Result |
| --- | --- |
| Canonical full sprites | 52 before / 52 after; diff 0 |
| Combat poses | 76 before / 76 after; diff 0 |
| Production MP4s | 31 before / 31 after; diff 0 |
| Production manifest | LF-normalized SHA-256 unchanged: `85942a074b2b39f8c391482a936687682e3d4ac346601b0e5309b1a1050dc321` |
| Runtime asset URLs | 130 checked / 0 missing |
| VFX preset files changed/deleted/moved/renamed | 0 / 0 / 0 / 0 |
| VFX registry/manifest changes | 0 |
| VFX tooling deleted | 0 |
| VFX local evidence removed | 0 |
| Runtime, narrative, combat, save schema, dependencies | unchanged |

## File-type reduction

| Type | Files removed | Bytes removed |
| --- | ---: | ---: |
| PNG | 393 | 361,446,534 |
| JPG/JPEG | 0 | 0 |
| WEBP | 0 | 0 |
| MP4 | 0 | 0 |
| PDF | 2 | 12,707,173 |
| JSON metadata/manifests | 32 | 185,387 |
| Markdown validation history | 9 | 14,727 |
| Empty `.gitkeep` markers | 2 | 0 |
| Tracked tools | 0 | 0 |
| `docs/reports` documents | 0 | 0 |
| `tools/**/specs` artifacts | 0 | 0 |

## Size accounting

The accounting below keeps Git classifications separate. The live materialized
`git ls-files` set contains 868 files / 501,519,840 bytes after the 438 approved
deletions. The two new, non-ignored execution artifacts remain untracked because
this mission does not commit; the prospective tracked tree therefore contains
870 files and includes their exact current byte sizes.

| Metric | Before | After |
| --- | ---: | ---: |
| Tracked files | 1,306 | 870 |
| Tracked tree bytes | 875,873,510 | 502,969,560 |
| Public assets files / bytes | 674 / 832,549,171 | 238 / 470,901,635 |
| Character validation files / bytes | 428 / 339,516,556 | 4 / 3,825,846 |
| Ready files / bytes | 209 / 119,839,169 | 4 / 3,825,846 |
| Cinematic assets files / bytes | 37 / 380,873,610 | 37 / 380,873,610 |
| Docs/reports files / bytes | 177 / 21,545,037 | 178 / 21,556,106 |
| Tools/specs files / bytes | 85 / 3,730,838 | 86 / 5,169,566 |
| Local ignored files / bytes | 22,663 / 6,293,079,825 | 20,007 / 2,521,696,053 |

Tracked accounting reconciles as follows: 438 files / 374,353,821 bytes were
deleted gross; five retained tracked files changed by a net +151 bytes; and the
two prospective tracked additions contain 1,449,720 bytes. This produces the
502,969,560-byte after tree and a 372,903,950-byte net reduction. The two
additions are currently the only untracked non-ignored files.

Public assets reconcile independently: 436 files / 361,646,648 bytes were
deleted gross. The retained
`public/assets/characters/pixel/validation/ready/README.md` was intentionally
rewritten from 1,437 to 549 bytes to document the consolidated Option C
reference policy. Its 888-byte reduction produces the public-asset net reduction
of 361,647,536 bytes. The same rewrite explains why the character-validation net
reduction (335,690,710 bytes) is 888 bytes greater than the Batch A + Batch B
gross deletion total (335,689,822 bytes).

The local ignored after value is a fresh
`git ls-files --others --ignored --exclude-standard` measurement, not a tracked
asset subtraction. Batch F accounts for 2,220 files / 3,409,736,280 bytes. The
required production build also refreshed ignored `dist/**`: its pre-clean build
contained 887 files / 1,217,850,373 bytes, while the post-clean build contains
451 files / 856,202,837 bytes. That regenerable-output turnover accounts for an
additional 436 files / 361,647,536 bytes. Non-`dist` ignored state has zero net
file-count drift and a net +44 bytes beyond Batch F, so the total live ignored
reduction is 2,656 files / 3,771,383,772 bytes and the measured after state is
20,007 files / 2,521,696,053 bytes. No tracked public asset was counted as an
ignored file; `dist` merely held generated copies of those assets before the
build refreshed it.

## Validation

- Batch F preserved closure: 390/390 files, exact sizes.
- Current A.4R report: 6/6 image references resolve.
- Final CIN-6E-A review viewer: 202/202 local references resolve.
- GOLD: 3/3 reference inputs resolve.
- Deterministic A.4R staging validator: 71/71 dialogues, 247/247 steps, 28 choices, 78 visual compositions, zero reported violations.
- Exact A.4R focused matrix: 7 files, 61/61 tests passed.
- Cleanup/manifest/pilot matrix: 8 files, 140/140 tests passed.
- Complete cinematic tool matrix: 13 files, 156/156 tests passed.
- Typecheck: `npx tsc --noEmit` passed.
- Production build: passed; both entries emitted.
- Full suite: 2,347 passed, 11 failed.
- Known exception: all 11 failures are exclusively `src/combat/vfx/CasterMotionBackCompat.test.ts`.
- New regressions: 0.
- `git diff --check`: passed.

## Retained or blocked candidates

- All production MP4s: retained because current manifest/test reachability remains.
- All 17 A.2/A.3 tool/spec/test files: retained because active tests and PDF regeneration still consume the coherent bundle.
- Hero60 historical material: retained because this mission's hard VFX evidence protection supersedes the earlier general archive recommendation.
- All combat VFX files and local evidence: retained by hard protection.
- Canonical full-sprite orphans and all combat-stage poses: retained by hard protection and dynamic-selection risk.

## Locks

- `PHYSICAL_ASSET_REDUCTION_LOCK = YES`
- `ACTIVE_RUNTIME_INTEGRITY_LOCK = YES`
- `VFX_PRESET_PROTECTION_LOCK = YES`
- `OPTION_C_REFERENCE_LOCK = YES`
- `CLEANUP_VALIDATION_LOCK = YES`
- `READY_FOR_REPO_CLEAN_3_COMMIT = YES_PENDING_OPERATOR_REVIEW`
- `COMMIT = NO`
- `PUSH = NO`
