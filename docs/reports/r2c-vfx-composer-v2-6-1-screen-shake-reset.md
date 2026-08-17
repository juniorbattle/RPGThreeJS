# R2C-VFX COMPOSER V2.6.1 — Screen-Space Impact Shake + Global Reset

**Baseline HEAD:** `50fb19061a77d3fee9130acf4c353a08ba79ed48`  
**Date:** 2026-08-17  
**Status:** ✅ Complete — all tests pass, tsc clean, build clean

---

## 1. Objectives

### A. Screen-Space Impact Shake
Replace the ineffective world-camera SHAKE presentation with a screen-space/post-process impact shake that works in both Tactical Combat and Combat Stage while preserving the locked-camera / painted-background illusion.

### B. RESET ALL PRESETS
Add a safe "RESET ALL PRESETS" workflow allowing the VFX Composer to return to a completely clean authoring state after explicit confirmation.

---

## 2. Architecture

### 2A. Screen-Space Shake

**Problem:** The previous implementation applied shake by mutating the world camera's position in `applyCam()`. This broke the locked-camera illusion, caused misalignment with painted backgrounds, and didn't work correctly when the Combat Stage swapped in its own orthographic camera.

**Solution:** A minimal post-process shader pass (`ImpactShakePass`) inserted after `gradePass` and before `outputPass` in the `EffectComposer` pipeline. The pass offsets the final rendered image in UV space, producing a screen-space shake that is camera-agnostic.

**Key components:**

- **`SHAKE_PIXELS_PER_UNIT`** (constant = 22): Converts world-unit shake magnitude to screen pixels.
- **`shakeSampleToUvOffset(sample, viewport)`** (pure function in `combatCameraFeedback.ts`): Converts a `ShakeSample` (x, y in world units) to a UV offset (dx, dy) normalized by viewport dimensions. Returns `{0, 0}` for inactive/zero samples. Handles zero-dimension viewports safely (no NaN).
- **`ImpactShakePass`** (shader pass in `legacyCombatRuntime.js`): A `ShaderPass` with a uniform `uShakeOffset` (vec2). The fragment shader offsets UV coordinates by the uniform, sampling the input buffer at a shifted position. When offset is zero, the pass is a no-op (identity).
- **Render loop wiring:** In `animate()`, after `cameraFeedback.tick(dt)`, the shake sample is read via `cameraFeedback.sample()` and converted to a UV offset via `shakeSampleToUvOffset()`. The `ImpactShakePass.uniforms.uShakeOffset.value` is updated each frame.
- **`applyCam()` cleanup:** All world-camera shake code was removed from `applyCam()`. The camera position and lookAt are now set without any shake offset, preserving the locked-camera illusion.

**Camera invariants:**
- Tactical `PerspectiveCamera` transform is never mutated by shake.
- Combat Stage `OrthographicCamera` transform is never mutated by shake.
- Shake works identically regardless of which camera is active (the post-process pass operates on the final composited image).

### 2B. RESET ALL PRESETS

**Dev server endpoint:**
- `POST /dev/vfx-reset-all-presets` in `vite.config.ts` → calls `handleResetAllPresetsRequest()` in `vfxPublishDevServer.ts`.
- Atomically writes an empty published VFX registry (`{ schemaVersion: 1, actions: {} }`) to disk.
- Returns `{ ok: true, registry, clearedActions: N }` on success.

**UI workflow (in `CombatVfxComposerPanel.ts`):**
1. **DANGER ZONE section** appears at the bottom of the Advanced/Debug panel.
2. **RESET ALL PRESETS** button opens a confirmation dialog (appended to `document.body`).
3. Dialog shows:
   - Title: "RESET ALL VFX PRESETS?"
   - Draft count and published preset count
   - Warning text about what will be deleted/restored
   - Text input requiring exact phrase "RESET ALL"
   - CANCEL button (closes dialog, no changes)
   - EXPORT BACKUP button (exports current drafts as JSON before reset)
   - CONFIRM RESET button (disabled until exact phrase entered)
4. On confirm: `POST /dev/vfx-reset-all-presets` → on success, clears local drafts (`createEmptyComposerStore()`), saves to localStorage, updates published registry overlay, closes dialog, re-renders panel.
5. On failure: shows "RESET FAILED" status, keeps local drafts intact, re-enables confirm button.

**CSS styles** added for `.cmp-danger-zone`, `.cmp-danger-title`, `.cmp-danger-desc`, `.cmp-reset-dialog`, `.cmp-reset-input`, `.cmp-export-backup-btn`, `.cmp-reset-confirm-btn`.

---

## 3. Files Modified

| File | Changes |
|------|---------|
| `src/combat/combatCameraFeedback.ts` | Added `SHAKE_PIXELS_PER_UNIT` constant and `shakeSampleToUvOffset()` pure function |
| `src/combat/legacyCombatRuntime.js` | Added `ImpactShakePass` shader pass; removed world-camera shake from `applyCam()`; wired screen-space shake in `animate()` |
| `src/dev/vfxPublishDevServer.ts` | Added `handleResetAllPresetsRequest()` for atomic registry reset |
| `vite.config.ts` | Added `POST /dev/vfx-reset-all-presets` endpoint |
| `src/combat/vfx/CombatVfxComposerPanel.ts` | Added DANGER ZONE UI, reset confirmation dialog, CSS styles, `createEmptyComposerStore` import |
| `src/combat/vfx/VfxV2_6_1ScreenShakeReset.test.ts` | New: 24 tests for shake and reset |
| `src/combat/vfx/CombatVfxComposerPanel.test.ts` | Added 8 reset UI tests with `qBody` helper for `document.body` queries |

---

## 4. Tests

### VfxV2_6_1ScreenShakeReset.test.ts — 24 tests
- **shakeSampleToUvOffset** (9 tests): zero sample, inactive sample, positive X/Y, pixel-equivalent magnitudes at 720p/1080p/4K, zero viewport safety, LIGHT vs STRONG scaling
- **Shake Envelope** (6 tests): active envelope creation, non-zero light, strong > light, decay to zero, no permanent offset, no runaway amplitudes
- **Screen-Space Shake** (3 tests): non-zero offset during shake, zero after shake, no double world+screen shake
- **Camera Transform Invariants** (3 tests): tactical camera unchanged, combat stage camera unchanged, render-pass camera agnostic
- **Composer Playback Shake** (2 tests): visuals-only no shake, full preset correct magnitude
- **Reduced Graphics** (1 test): 0.58 scale on 0.22 still visible

### CombatVfxComposerPanel.test.ts — 8 reset tests
1. RESET ALL PRESETS button exists inside danger-zone section
2. Clicking RESET opens confirmation dialog
3. CONFIRM RESET disabled until exact "RESET ALL" phrase entered
4. CANCEL closes dialog without changing anything
5. EXPORT BACKUP button exists in reset dialog
6. Confirmation dialog shows draft and published counts
7. CONFIRM RESET sends POST to /dev/vfx-reset-all-presets
8. RESET failure keeps local drafts intact

### Full suite results
- **Test files:** 63 passed
- **Tests:** 1531 passed
- **tsc --noEmit:** clean
- **npm run build:** clean

---

## 5. QA Checklist

- [x] Screen-space shake pure function tested with multiple viewport sizes
- [x] Camera transforms (tactical + stage) verified immutable during shake
- [x] World-camera shake fully removed from `applyCam()`
- [x] ImpactShakePass inserted after gradePass, before outputPass
- [x] Shake decays to zero (no permanent offset)
- [x] Reduced graphics mode still shows visible shake
- [x] RESET ALL PRESETS button in DANGER ZONE section
- [x] Confirmation dialog requires exact "RESET ALL" phrase
- [x] CANCEL button closes dialog without changes
- [x] EXPORT BACKUP button present in dialog
- [x] Draft/published counts shown in dialog
- [x] Successful reset clears local drafts + published registry
- [x] Failed reset preserves local drafts
- [x] All 1531 tests pass
- [x] TypeScript strict mode clean
- [x] Production build succeeds

---

## 6. Constraints Held

- No Composer redesign — only added DANGER ZONE section and screen-space shake pass
- No gameplay, asset, or background changes
- No commit or push performed
- Camera lock and painted-background illusion preserved
- `applyAdditiveCameraShake` retained as legacy but not used for screen presentation
