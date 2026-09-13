# REPO-CLEAN-1 — Full repository cleanup audit

## Mission boundary

Dry-run only at `16dca5fa1d7f0c2474f1c8101b4412b45a227093`. Preflight found `main`, HEAD and `origin/main` equal to the required baseline and a clean worktree. This audit creates report/spec artifacts only. It deletes, moves, renames, uninstalls and modifies no runtime or media file.

The current doctrine remains locked: VIDEO is for main events, STATIC_TABLEAU is dialogue, HOLD is dialogue/choice-free punctuation, and TRAVEL_STILL is connective journey presentation.

## Baseline inventory

| Metric | Result |
| --- | ---: |
| Tracked files | 1,297 |
| Non-ignored working-tree files before audit | 1,297 |
| Tracked bytes | 875,670,776 (835.10 MiB) |
| Tracked public assets | 674 |
| Source non-test files | 127 |
| Test files | 125 |
| Docs/reports files | 173 |
| Tools/spec files | 180 |
| Production cinematic MP4s | 31 |
| Canonical full sprites | 52 |
| Combat-pose PNGs | 76 |
| Generated runtime media | 24 |

The local checkout additionally contains approximately 20,040 ignored files / 6.18 GiB, dominated by `tmp/`, `dist/`, Playwright profiles, local VFX runtime assets, evidence and `node_modules`. These are not tracked repository size.

## Repository size breakdown

| Category | Files | Bytes | Classification |
| --- | ---: | ---: | --- |
| Production media | 31 | 372,958,596 | PROTECTED_ACTIVE |
| Other character assets | 429 | 339,565,137 | ACTIVE / HISTORY / ARCHIVE mixed |
| Other public assets | 161 | 98,820,515 | ACTIVE / source-history mixed |
| Canonical full characters | 52 | 21,172,669 | PROTECTED_ACTIVE |
| Source non-test | 127 | 2,493,536 | PROTECTED_ACTIVE / ACTIVE |
| Tests | 125 | 1,392,068 | ACTIVE; one historical compatibility exception |
| Docs/reports | 173 | 21,454,089 | KEEP_HISTORY / ACTIVE manifests / generated review |
| Tools/specs | 180 | 4,941,038 | ACTIVE / milestone / generated review |
| Root/output/other | 15 | 12,831,267 | config plus review PDFs |

## Largest tracked directories

1. `public/assets` — 674 files / 832,538,790 bytes.
2. `public/assets/cinematics` — 37 / 380,873,592; protected.
3. `public/assets/characters` — 481 / 360,737,806.
4. `public/assets/characters/pixel/validation` — 428 / 339,508,726.
5. `public/assets/characters/pixel/validation/ready` — 209 / 119,833,675; current QA and Option C reference.
6. `public/assets/combat-stage` — 100 / 43,838,726; protected.
7. `public/assets/status-indicators` — 22 / 28,747,843.
8. `docs/reports` — 173 / 21,454,089.
9. `output/pdf` — 2 / 12,707,173.
10. `public/assets/backdrops` — 3 / 9,206,385; active.

The top 50 tracked files and classifications are recorded in `tools/cleanup/specs/repo_clean_size_report.json`. The largest 21 files are current production MP4s except for two tracked review PDFs.

## Protected active systems

- `src/game/**`: GameApp, narrative truth, dialogue, route, run/save/effect systems.
- `src/combat/**`: current combat, VFX and the protected empty published registry. `legacy-combat.html` is an active Vite input, so its runtime is not dead code.
- `src/cinematics/**`: current A.4R presentation runtime, generated dialogue plan, registry and lock tests.
- `src/journey/**`: current campaign boundary and travel presentation.
- `public/assets/cinematics/**`: all 31 MP4s, manifest and source posters.
- `public/assets/characters/pixel/full/**`: all 52 canonical full assets.
- `public/assets/combat-stage/**`: all dynamically resolved combat poses/stages.
- `public/assets/generated/**`, backdrops, 3D kit and runtime status indicators.
- Current build configuration and dependency locks pending package-manager consolidation.

## Runtime reachability map

| System | Entry/consumer | Generated dependency | Safe-to-touch |
| --- | --- | --- | --- |
| `GameApp` | `src/main.ts` | presentation registries | NO — CRITICAL |
| `NarrativeStage` | GameApp, Journey boundary | resolved presentation beats/tableaux | NO — CRITICAL |
| `NarrativePresentationResolver` | GameApp, Journey resolver, tests | `FinalPresentationRegistry.generated.ts` | Concrete APIs protected; test-only export surface may be consolidated |
| `NarrativeTableau` | stage, adapter, segment application, Journey, tests | staging specs | NO — CRITICAL |
| `NarrativeSceneSurface` | NarrativeStage | tableau phases and canonical actor assets | NO — CRITICAL |
| `DialogueStagingDirector` | NarrativeDialogueAdapter | tableau/step direction data | NO — CRITICAL |
| `NarrativeDialogueAdapter` | GameApp | generated presentation phases | NO — CRITICAL |
| `DialoguePresentationSegments` | GameApp, adapter | `FinalDialoguePresentation.generated.ts` | NO — CRITICAL |
| `FinalDialoguePresentation.generated` | segment application and tests | A.4R generator | Runtime-required; regenerate, never simply remove |
| `CinematicReductionPolicy` | GameApp and A.4R generator | production manifest IDs | Source of truth; protected |

## Source code audit

No whole runtime module meets the DELETE_CANDIDATE standard.

Candidate seams:

- `CinematicDialogueSession.ts` is not imported by runtime, but is read/imported by three active compatibility tests and documents CIN-6.5 held-video behavior. Classify `CONSOLIDATE_CANDIDATE`, MEDIUM, not delete.
- `NarrativePresentationResolver` exposes generic/test-only lookup helpers and an unconsumed `resolveCombatPresentation`. Classify export-surface consolidation, LOW; migrate tests first.
- `HELD_VIDEO_DIALOGUE` profile remains in type/rule/CSS/spec/test vocabulary but no current resolver assignment was found. Classify historical compatibility/consolidation, MEDIUM.
- `HELD_DIALOGUE` itself is active: DialogueView uses it as the no-step-presentation fallback. Do not remove it based on its name.
- `HELD_VIDEO` is active scenic/freeze compatibility in NarrativeStage/Journey. Do not remove.
- A.4R `dialogueStepsOnHold`, `choiceStepsOnHold`, final-frame and wrong-hold-cast fields are not all runtime-read, but tests/audits use them as doctrine proof. Consolidate only by redesigning the proof contract, not by stripping generated data.
- Runtime `console.warn/error` occurrences are defensive fallback/dev diagnostics, not confirmed debug leftovers.
- No `debugger`, TODO, FIXME or HACK marker requiring cleanup was found in current TypeScript runtime.

## A.4R commit delta

`ff743b08..16dca5f` contains 46 paths, +54,233/-1,195 lines:

- Runtime/source: `CinematicReductionPolicy`, `DialoguePresentationSegments`, current staging/surface/stage/GameApp integration and generated runtime plan.
- Tests: focused A.4R regression guards and updates to integration/layout tests.
- Reports: nine Markdown/HTML operator artifacts.
- Generated specs: two validation files plus six detailed dialogue/cinematic audits.
- Tooling: deterministic generator, browser QA runner, final audit and tool-only Vite config.

`FinalDialoguePresentation.generated.ts` is generated but runtime-required. The 17 review/spec artifacts total 1,397,942 bytes and 37,428 text lines; they are candidates for an on-demand generation policy only after tests, browser QA and operator review are re-wired.

Exact A.4R duplicates:

- `cin-6e-a-4-dialogue-review.html` and `cin-6e-a-4r-dialogue-review.html`.
- `cin6ea4_final_validation.json` and `cin6ea4r_final_validation.json`.

Both pairs are low-risk consolidation candidates, but their generators/QA URLs must be changed first.

## Asset and public-directory audit

A literal-path scan found exact references for 310 of 674 public assets. It found no exact literal reference for 364 files / 329,643,110 bytes. This is not an orphan verdict:

- 76 combat pose PNGs are addressed by directory/filename convention.
- Cinematics are reached through a loaded JSON manifest and cinematic IDs.
- Local VFX assets are addressed by candidate IDs.
- backdrops are selected by dialogue-context rules.
- validation assets retain QA/production/Option C value.

Apparent full-sprite orphans (`giant_mygale`, `swamp_crocodile`, `river_crab`, `mountain_ram`, and four `future_*` files) are KEEP_HISTORY for Option C, not deletion candidates. `sage_seraphine.png` is directly recorded by A.4R canonical specs and remains protected despite the runtime `seraphine.png` alias.

Character validation assets split into:

- `validation/ready/**`: 209 files / 119,839,169 bytes, current browser-QA input and future visual reference.
- other validation history: 219 files / 219,669,557 bytes, ARCHIVE_CANDIDATE HIGH. Preserve externally before considering active-tree removal.

Status indicator runtime assets are active. `status-indicators/raw/**` is 12 source/reference files / 25,956,826 bytes and is an archive candidate, not a delete candidate.

## Exact duplicate audit

52 tracked exact-byte duplicate sets account for 22,175,849 duplicate bytes:

- 48 character/canonical-ready sets (49 extra files because Seraphine has three aliases): 20,295,714 bytes, HIGH risk.
- three identical Hero60 screenshots: 1,827,218 duplicate bytes, LOW consolidation risk after report links migrate.
- duplicate A.4R HTML: 26,703 bytes.
- duplicate A.4R validation JSON: 26,214 bytes.
- two zero-byte `.gitkeep` files: no saving and separate directory purpose.

No production MP4 is an exact duplicate. Full set hashes and paths are in `repo_clean_size_report.json`.

## Production media and cinematic history

Fresh SHA-256 verification matched all 31 production MP4s to the committed A.4R records. Total production video bytes: 372,958,596. The normalized production manifest SHA-256 also matches: `85942a074b2b39f8c391482a936687682e3d4ac346601b0e5309b1a1050dc321`.

Current cinematic classification remains:

- KEEP_MAJOR_VIDEO 8
- OPTIONAL_VIDEO 5
- COMBAT_OWNED 6
- CONVERT_TO_STATIC_TABLEAU 7
- CONVERT_TO_TRAVEL_STILL 4
- CONVERT_TO_HOLD_STILL 1
- LEGACY_UNUSED placeholder 1

All physical MP4s remain `PROTECTED_ACTIVE` for this audit, including the 12 future-reclassified slots. Tracked pilot approval/rejection specs and PDFs are history/reference. Ignored temporary cinematic QA totals 4.12 GB; A.4R-referenced `cin67` + `cin6ea4` evidence (45.2 MB) should remain available for current review. The older 4.07 GB is an archive candidate pending evidence triage.

## Test audit

- 125 test files / 2,358 test cases.
- Fresh full suite after the A.4R contract repair: 124 files passed, 1 failed; 2,347 tests passed, 11 failed.
- `CasterMotionBackCompat.test.ts` is HISTORICAL_COMPATIBILITY: exactly 11 intentional failures from the protected empty registry. It is not a cleanup candidate.
- The stale `tools/cinematics/cin6ea_preproduction.test.mjs` A.4R allowlist now explicitly recognizes the committed `src/cinematics/CinematicReductionPolicy.ts`; the guard remains exact and protected assertions remain intact.
- Focused A.4R/preproduction validation reports 19/19.
- Unexpected clean-baseline failures = 0; new regressions = 0.
- CinematicDialogueSession tests are historical compatibility guards, not obsolete merely because the runtime no longer imports the coordinator.
- No test file meets the deletion standard in this dry run.
- Some resolver and presentation tests overlap, but behavioral differences require manual consolidation before labeling duplicate coverage.

## Tooling audit

Current production/QA:

- A.4R generator, audit and browser QA.
- runtime presentation-registry generator.
- narrative staging validator.
- VFX `sync-runtime`, `sync-candidate`, published-registry validator and preview-index flow.
- R7 simulation tool.

Milestone/archive candidates:

- 16 `tools/vfx/r1*` scripts (319,063 bytes / 6,589 lines).
- 17 CIN-6E-A.2/A.3 tools/specs (107,804 bytes / 2,195 lines).
- historical PDF/contact-sheet/gate builders should move as coherent milestone bundles, not be individually deleted.

Two VFX cadence scripts hard-code Michele's local MegaPack path; two cinematic Python tools hard-code Windows font locations. These require portability refactoring or archival classification.

## Dependency, npm-script and config audit

All declared runtime/dev dependencies have direct runtime, build, test or tooling usage. No dependency removal candidate was proven.

`vite-node` is invoked by two npm scripts but is only transitively available. This is a dependency hygiene risk, not a removal candidate.

Both `package-lock.json` and `pnpm-lock.yaml` match `package.json`; no `packageManager` authority is declared. `pnpm-workspace.yaml` contains an unresolved textual `allowBuilds.esbuild` value. Select one package manager only after clean-install parity and full validation.

All npm-script targets exist. `legacy-combat.html` is a real Vite Rollup input. The root `tsconfig` excludes `tools/**/*.ts`, so tool scripts need a dedicated typecheck/config if retained. There is no ESLint/Prettier/Playwright/Vitest config file; absence alone is not obsolete configuration.

## Gitignore and temporary outputs

Current `.gitignore` correctly covers dependencies, build output, coverage, logs, raw/local VFX, evidence, Python cache, tmp, QA screenshots, Playwright profiles, local env and IDE config.

Not ignored intentionally/ambiguously:

- `output/pdf/**` is tracked review output.
- generated runtime/spec/report artifacts are tracked.
- character validation assets and metadata are tracked.
- both lockfile families are tracked.

`git count-objects` reports ten loose garbage objects / 26.07 MiB, but git GC/pruning is out of scope and no action is recommended here.

## Absolute-path audit

Portability candidates:

- two VFX tools hard-code `C:/Users/miche/Documents/VFX_Library/...`.
- 27 pipeline metadata files contain absolute project input paths.
- two Python review tools hard-code `C:/Windows/Fonts/...`.
- three historical reports record local paths as evidence.

A `file:///etc/passwd` occurrence is a security rejection test, not a portability defect. A constructed file URL in an old browser QA tool is deliberate. Historical reports should retain facts; active tools should use environment/configuration in a future non-audit mission.

## Empty/trivial files

Only directory markers are empty/trivial: two zero-byte rejected-folder `.gitkeep` files and one one-byte 3D `.gitkeep`. The manifest `qa-placeholder` has no source but is an intentional tested placeholder. The empty published VFX registry is protected and intentionally not repaired.

## Option C reference value

Retain or archive, never direct-delete:

- all canonical full sprites and combat poses;
- future/unreferenced full sprites;
- raw/processed character production lineage and boards;
- approved/rejected pilot specs and review PDFs;
- source posters, visual-family plans, gold references and cinematic QA captures;
- generated environment plates and current travel backdrops;
- A.4R composition/facing/operator review evidence.

## Audit conclusion

There are zero tracked DELETE_CANDIDATE files. Low-risk delete candidates are local ignored Playwright profiles, Python bytecode and a log. Larger safe local savings are regenerable `dist`, dependency installs and PDF cache. Tracked simplification should start with exact A.4R duplicates, then generated-output policy, then deliberate legacy/tool and archive phases.

`READY_FOR_REPO_CLEAN_2 = YES_PENDING_OPERATOR_CLEANUP_REVIEW`. No cleanup phase is authorized or started by this audit status.
