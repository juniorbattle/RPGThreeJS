# R2C-C.1: Legacy 1280/5×5/25f Sprite Sheet Retirement

**Date:** 2025-01-18  
**Phase:** R2C-C.1  
**Doctrine:** CartoonCoffee-only production VFX

## Summary

Legacy 1280px / 5×5 / 25-frame sprite sheet PNGs were manually deleted from `public/assets/vfx/runtime/`. This phase retires their definitions from the runtime registry (`VFX_SPRITE_SHEETS`) while preserving the generic variable-grid engine and all CartoonCoffee native assets.

## What Changed

### 1. VFX_SPRITE_SHEETS (VfxSpriteSheets.ts)

- **Before:** 46 legacy definitions + 15 native definitions = 61 entries
- **After:** 15 native definitions only
- `_legacySheetDefinitions` object retained as historical reference, NOT spread into `VFX_SPRITE_SHEETS`
- `LEGACY_SPRITE_SHEET_IDS` export retained for tests and dev tools
- `LegacyVfxSpriteSheetId` type union retained for backward compatibility
- Generic UV engine (`getVfxSpriteSheetFrameUv`, `setVfxSpriteSheetFrame`) unchanged

### 2. Runtime Safety (VfxSystem.ts)

All three sprite sheet playback methods (`playSpriteSheetBillboard`, `playSpriteSheetProjectile`, `playSpriteSheetSkyDescent`) now guard against undefined definitions:

```typescript
const definition = VFX_SPRITE_SHEETS[step.spriteSheet];
if (!definition) {
  if (import.meta.env?.DEV) console.warn(`[VFX] Unresolved sprite sheet: ${step.spriteSheet} — skipping (legacy asset deleted)`);
  return;
}
```

**Behavior:** When a preset step references a retired legacy sheet, the sprite sheet step is skipped cleanly. Non-sprite steps (screenShake, hitStop, screenFlash) still play normally.

### 3. Lab Source Status (CombatVfxLab.ts)

`resolveSourceStatus` now returns `UNRESOLVED` for actions whose sprite steps reference retired legacy sheets. The `LEGACY` status is no longer returned in production.

### 4. Resource Manager (VfxResourceManager.ts)

No changes needed — `resolveSheetSource` already returns `null` for unknown sheet IDs. Legacy IDs naturally resolve to `null`.

## What Was Preserved

- **Generic variable-grid engine:** UV math for 1280/2048/4096 sheets with 4×4/5×5/8×8 grids
- **Pilot presets:** All 12 pilot presets with native megapack sheet references remain fully functional
- **Type system:** `LegacyVfxSpriteSheetId` type union retained for backward compatibility
- **Resource manager:** Cache, LRU eviction, dedup, and retention tracking unchanged
- **DEV preview:** `resolveCandidateSource` and `resolveCandidateAvailability` for CartoonCoffee candidates unchanged

## Test Coverage

| Test File | Changes |
|-----------|---------|
| `VfxSpriteSheets.test.ts` | Removed legacy PNG file checks; added R2C-C.1 doctrine tests (legacy not in registry, native-only registry, preset legacy refs) |
| `vfxRuntimeRegistry.test.ts` | Replaced legacy invariant tests with retirement tests; generic engine UV tested with synthetic definitions |
| `VfxResourceManager.test.ts` | Test 26 uses native sheet; added 26b for legacy null resolution |
| `VfxActionRegistry.test.ts` | Audit row tests accept legacy IDs as not-in-registry; runtime filenames allow empty for legacy |
| `spritesheetPng.test.ts` | Replaced legacy PNG tests with megapack-runtime PNG existence/dimension/magenta tests |
| `VfxR3F.test.ts` | Effective scale minimums adjusted for retired legacy sheets (scaleMultiplier defaults to 1) |
| `combatVfxPresentation.test.ts` | boss_inferno layer check handles undefined definition gracefully |

## Validation

- `tsc --noEmit`: **PASS**
- `vitest run`: **1062/1062 tests PASS** (45 test files)
