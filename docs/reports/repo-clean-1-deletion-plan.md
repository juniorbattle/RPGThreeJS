# REPO-CLEAN-1 — Future deletion/consolidation plan

No phase is authorized by this document. Every command in the future cleanup mission requires operator approval and pre/post validation. The clean-baseline `cin6ea_preproduction.test.mjs` allowlist has been repaired and validated; cleanup remains pending operator cleanup review.

## Phase 1 — Safe low-risk local cleanup

| Candidate | Files | Bytes | Primary class | Preconditions |
| --- | ---: | ---: | --- | --- |
| `.playwright/**` | 2,985 | 386,846,317 | DELETE_CANDIDATE | no active QA session |
| Python `__pycache__` | 4 | 104,843 | DELETE_CANDIDATE | none |
| `debug.log` | 1 | 3,076 | DELETE_CANDIDATE | no active diagnostic session |
| `dist/**` | 887 | 1,217,850,373 | REGENERABLE | rebuild command documented |
| `node_modules/**` | 13,040 | 220,093,079 | REGENERABLE | approved package manager selected; reinstall before validation |
| `tmp/pdfs/**` | 58 | 39,491,966 | REGENERABLE | final review PDFs/source retained |

Total: 16,975 local files / 1,864,389,654 bytes. This does not reduce tracked Git size.

Do not blanket-delete `tmp/cinematics`; current and historical review evidence is mixed there.

## Phase 2 — Generated/regenerable repository outputs

1. Consolidate the exact A.4R duplicate HTML and validation JSON pairs.
2. Keep the A.4R-suffixed names as proposed canonical paths.
3. Update generator output lists, browser-QA URLs and all tests before removing compatibility copies.
4. Decide whether 15 canonical review-only A.4R artifacts remain committed or are generated before QA/review.
5. Keep `FinalDialoguePresentation.generated.ts` committed or add an enforced prebuild/CI generation check; it cannot simply disappear.
6. Archive or regenerate the two tracked PDFs after retaining their human approval evidence.

Scope: 19 files / 14,105,115 bytes / approximately 37,428 tracked text lines. Risk is MEDIUM because current tests and QA consume several generated specs.

## Phase 3 — Legacy code and tooling

No item here is a current delete candidate.

- Compare `CinematicDialogueSession` with `JourneySession`; migrate three compatibility tests before retirement.
- Audit `HELD_VIDEO_DIALOGUE` profile separately from active `HELD_DIALOGUE` and `HELD_VIDEO` semantics.
- Consolidate test-only generic exports in `NarrativePresentationResolver` only after test migration.
- Decide whether proof-only A.4R fields remain in generated runtime data or move to a review spec.
- Externalize hard-coded VFX roots and Windows font paths for retained tools.
- Preserve `legacy-combat.html`, `legacyCombat.ts`, `legacyCombatRuntime.js`, and `combatPresentationConfig.js`: they are an active second Vite entry and protected combat code.

At least nine source/tool files require review. Risk: MEDIUM to HIGH. Mandatory full suite and both game/combat build entries after any change.

## Phase 4 — Historical assets and archive

Conceptual archive candidates:

- 219 non-ready character validation files / 219,669,557 bytes.
- 23 non-duplicate Hero60 history files / 2,596,934 bytes.
- 258 ignored VFX evidence files / 268,184,981 bytes.
- 7 ignored QA shots / 9,098,599 bytes.
- 16 VFX r1 tools / 319,063 bytes.
- 17 CIN-6E-A.2/A.3 tool/spec files / 107,804 bytes.
- 12 raw status-source files / 25,956,826 bytes.
- 2,582 older temporary cinematic files / 4,072,553,291 bytes.

Total: 3,134 files / 4,598,487,055 bytes. Space is recovered only if the archive is external; moving within Git improves structure but not repository bytes/history.

Retain current `tmp/cinematics/cin67` and `cin6ea4` evidence until A.4R human review closes. Preserve Option C identity/composition references.

## Phase 5 — Dependency and configuration cleanup

- Select npm or pnpm based on reproducible clean-install/build/test evidence.
- Remove only the non-authoritative lock/workspace after operator approval.
- Declare `vite-node` directly if npm scripts continue invoking it.
- Add a tool-specific TypeScript check if TypeScript tools remain supported.
- Do not remove Playwright, happy-dom, Three, Zod, fonts, TypeScript, Vite or Vitest; all have proven consumers.

Minimum lockfile saving if npm remains canonical: approximately 33,743 bytes. Risk: HIGH.

## Estimated savings

- Excluding external archive: 17,046 candidate files / 1,900,651,444 bytes.
- Including an external historical archive: 20,180 files / 6,499,138,499 bytes.
- Tracked-line reduction: about 37,428 generated lines, plus an operator-dependent lockfile reduction.

These are ceilings, not targets. Safety and maintainability take priority over maximum deletion.

## Required future validation

1. exact branch/baseline and clean preflight;
2. asset/reference index regenerated before deletion;
3. production manifest and 31 media SHA-256 checks;
4. canonical full-sprite and combat-pose inventories;
5. TypeScript typecheck;
6. production build for both Vite entries;
7. focused narrative/A.4R tests;
8. focused combat/VFX/legacy entry tests where touched;
9. full suite with only 11 historical `CasterMotionBackCompat` failures;
10. secret and protected-path audits;
11. `git diff --check`;
12. operator review of every archive/delete path.

Expected: `NEW_REGRESSIONS = 0`.
