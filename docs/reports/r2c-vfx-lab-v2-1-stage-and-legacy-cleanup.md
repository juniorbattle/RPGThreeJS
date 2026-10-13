# R2C-VFX LAB V2.1 — Stage Preview + Legacy Cleanup

**Date:** 2026-08-13
**Status:** COMPLETE

---

## BASELINE

- **HEAD:** `406c847`
- **Tests before:** 1881
- **src/combat/vfx files before:** 57
- **Test files before:** 38

---

## PHASE A — PLAY IN COMBAT STAGE

| Check | Result |
|-------|--------|
| Button added | YES |
| Uses current draft | YES |
| Uses actual Combat Stage | YES |
| Temporary preset only | YES |
| Production mutation | 0 |
| 1-slot Stage test | PASS |
| TOGETHER Stage test | PASS |
| SEQUENCE Stage test | PASS |
| PAIR_THEN_LAST Stage test | PASS |
| OFF polish Stage test | PASS |
| STRONG polish Stage test | PASS |
| Draft preserved after Stage | PASS |

### Implementation

`playDraftInCombatStage` in `VfxComposerPlayback.ts` calls `ctx.buildStageContext(actionKey, playVfx)`, which enters the real Combat Stage via `combatStageEnter`, plays the compiled draft, then exits via `combatStageExit`. No production preset is registered.

### Observed values

```
1-slot:        Stage playback: 1 slot(s), 3 technical effect(s)
TOGETHER:      Stage playback: 2 slot(s), 3 technical effect(s)
SEQUENCE:      Stage playback: 2 slot(s), 3 technical effect(s)
PAIR_THEN_LAST: Stage playback: 3 slot(s), 3 technical effect(s)
OFF:           Stage playback: 3 slot(s), 0 technical effect(s)
STRONG:        Stage playback: 3 slot(s), 3 technical effect(s)
```

---

## PHASE B — LEGACY QA RETIREMENT

| Check | Result |
|-------|--------|
| ?vfx=1 removed | YES |
| ?r2ca=1 removed | YES |
| ?vfxlab=1 retained | YES |
| Old CombatVfxLab Workbench mounted | NO |
| Old R2C-A UI mounted | NO |

### Runtime changes

`legacyCombatRuntime.js` was cleaned:
- Removed imports: `VfxWorkbench`, `MegaPackHeldReview`, `MegaPackHeldReviewWorkbench`, `CombatVfxLabWorkbench`
- Removed: `R2CA_REVIEW_ENABLED`, `disposeMegaPackHeldReviewWorkbench`, `disposeCombatVfxLabWorkbench`, `vfxWorkbenchContext`, `playMegaPackHeldReview`, `r2caReviewUsesFriendlyTarget`, `r2caReviewTargets`, `getLabVfxStats`
- Inlined: `VFX_LAB_ENABLED = campaignParams.get('vfxlab') === '1'`
- `main()` now mounts only `installVfxComposerPanel`

---

## VFX DIRECTORY CLEANUP

| Metric | Before | After |
|--------|--------|-------|
| Files | 57 | 27 |
| Test files | 38 | 14 |
| Files deleted | 32 | — |
| Legacy version tests removed | 25 | — |
| Current tests retained | 12 | — |
| Current tests added | 2 | — |
| Lines added | 313 | — |
| Lines deleted | 15133 | — |
| Net LOC | -14820 | — |

### New files

- `ComposerStagePlayback.test.ts` — 8 tests for Stage playback
- `VfxActionCatalogue.test.ts` — 21 tests for reusable Lab infrastructure

---

## DELETION MANIFEST

| File | Classification | Action | Reason | Replacement |
|------|---------------|--------|--------|-------------|
| CombatVfxLabWorkbench.ts | LEGACY_VFX_LAB | DELETE | Old Lab workbench UI | CombatVfxComposerPanel.ts |
| MegaPackHeldReview.ts | LEGACY_R2CA | DELETE | R2C-A source review data | VfxComposerPlayback.ts catalogue |
| MegaPackHeldReviewWorkbench.ts | LEGACY_R2CA | DELETE | R2C-A workbench UI | CombatVfxComposerPanel.ts |
| MegaPackHeldReview.test.ts | OBSOLETE_TEST | DELETE | Tests retired R2C-A | None |
| VfxWorkbench.ts | LEGACY_VFX_LAB | DELETE | Old ?vfx=1 workbench | CombatVfxComposerPanel.ts |
| LabPlayback.ts | LEGACY_VFX_LAB | DELETE | Old Lab playback | VfxComposerPlayback.ts |
| LabAcquisition.ts | LEGACY_VFX_LAB | DELETE | Only used by deleted workbench | None (DEV endpoint server-side) |
| CombatVfxLab.test.ts | OBSOLETE_TEST | DELETE | Tests retired V1 Lab | VfxActionCatalogue.test.ts |
| CombatVfxLabV1B–V1E38C (24 files) | OBSOLETE_TEST | DELETE | Tests retired V1 workflows | VfxActionCatalogue.test.ts |

---

## KEPT FILES (notable)

| File | Classification | Reason |
|------|---------------|--------|
| CombatVfxLab.ts | KEEP_SHARED_DEV_INFRA | Composer uses action catalogue, search, visual steps, migration, isLabEnabled |
| VfxPreviewResolver.ts | KEEP_SHARED_DEV_INFRA | Composer uses resolvePreview for GIF URLs |
| vfxRuntimeRegistry.ts | KEEP_CORE_RUNTIME | Self-contained runtime manifest utility |
| VfxR3F.test.ts | KEEP_CORE_RUNTIME | Tests rotation/orientation — production behavior |
| galleryAnimationFix.test.ts | KEEP_CORE_RUNTIME | Tests grid correction — production pipeline |
| gridDetectorV2.test.ts | KEEP_CORE_RUNTIME | Tests grid detection — production pipeline |
| spritesheetPng.test.ts | KEEP_CORE_RUNTIME | Tests PNG validation — production pipeline |

---

## CORE PRESERVATION

| Component | Status |
|-----------|--------|
| VfxSystem | PRESERVED |
| VfxResourceManager | PRESERVED |
| CartoonCoffee catalogue | PRESERVED |
| Preview resolver | PRESERVED |
| Candidate acquisition | PRESERVED (server-side) |
| VfxPresetComposer | PRESERVED |
| VfxComposerPlayback | PRESERVED |
| CombatVfxComposerPanel | PRESERVED |
| Combat Stage | PRESERVED |
| Production VFX runtime | PRESERVED |

---

## DEAD CODE AUDIT

| Check | Count |
|-------|-------|
| Unexpected CombatVfxLab references | 0 |
| Unexpected r2ca references | 0 |
| Unexpected vfx=1 references | 0 |
| Unexpected old Lab storage references | 0 |
| **UNEXPECTED_LEFTOVER** | **0** |

---

## BROWSER QA

| Check | Result |
|-------|--------|
| Composer only UI | PASS |
| Old Workbench absent | YES |
| Old R2C-A absent | YES |
| Draft persistence | PASS |
| Visuals Only | PASS |
| Full Preset | PASS |
| Combat Stage | PASS |

---

## TECHNICAL

| Check | Result |
|-------|--------|
| Tests | 982/982 PASS |
| Build | PASS |
| Typecheck | PASS |
| git diff --check | PASS |
| Commit | NO |
| Push | NO |

---

## FINAL GATES

| Gate | Status |
|------|--------|
| R2C_VFX_COMPOSER_STAGE_PLAYBACK | YES |
| R2C_VFX_SINGLE_AUTHORING_UI | YES |
| R2C_LEGACY_VFX_QA_RETIRED | YES |
| R2C_R2CA_RETIRED | YES |
| R2C_VFXLAB_QUERY_RETAINED | YES |
| R2C_VFX_DIRECTORY_AUDITED | YES |
| R2C_VFX_OBSOLETE_FILES_REMOVED | YES |
| R2C_VFX_CORE_RUNTIME_PRESERVED | YES |
| R2C_CARTOONCOFFEE_INFRA_PRESERVED | YES |
| R2C_COMBAT_STAGE_PRESERVED | YES |
| R2C_PRODUCTION_BEHAVIOR_UNCHANGED | YES |
| R2C_UNEXPECTED_LEGACY_LEFTOVERS | 0 |

STOP. No commit. No push.
