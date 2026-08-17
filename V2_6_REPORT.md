# V2.6 Authoring Polish — Implementation Report

## Summary

V2.6 adds **TRAJECTORY** (arc paths for TRAVEL slots), fixes the **SHAKE** root cause, removes **HITSTOP** from the normal Composer UI, cleans **position labels**, retires the **Legacy Technical Polish** section, and sets the new draft default to **OFF**.

---

## 1. SHAKE FIX (Root Cause)

### Problem
Manual QA found SHAKE was not visibly functional. The root cause was in `STATIC_COMBAT_CAMERA_POLICY`:

```typescript
// combatCameraFeedback.ts (BEFORE)
maxShakeMagnitude: 0.035
```

This cap was so low that **every** shake request — regardless of input magnitude — was clamped to 0.035 world units:
- LIGHT (0.10) → clamped to 0.035 (65% reduction)
- STRONG (0.22) → clamped to 0.035 (84% reduction)
- Combat hits (0.16–0.50) → clamped to 0.035

This made LIGHT and STRONG **indistinguishable** and all shake barely visible (0.22° angular change at camera distance 9).

### Fix
```typescript
// combatCameraFeedback.ts (AFTER)
maxShakeMagnitude: 0.30
```

Now:
- LIGHT (0.10) → passes through at 0.10 (0.64° — visible)
- STRONG (0.22) → passes through at 0.22 (1.4° — clearly stronger)
- Extreme combat (0.50) → capped at 0.30 (still strong but not nauseating)

### Files Changed
- `src/combat/combatCameraFeedback.ts` — `maxShakeMagnitude: 0.035 → 0.30`
- `src/combat/combatCameraFeedback.test.ts` — updated expectation

---

## 2. TRAJECTORY

### Data Model
- **Type:** `VfxTrajectoryProfile = 'STRAIGHT' | 'ARC_LOW' | 'ARC_HIGH'`
- **Default:** `STRAIGHT` (missing field = STRAIGHT for backward compatibility)
- **Scope:** Only TRAVEL slots use this value; FIXED slots ignore it entirely

### Arc Heights
| Profile  | Peak Height (world units) | Parabolic Term                    |
|----------|--------------------------|-----------------------------------|
| STRAIGHT | 0                        | —                                 |
| ARC_LOW  | 0.8                      | `4 * progress * (1 - progress) * 0.8` |
| ARC_HIGH | 2.0                      | `4 * progress * (1 - progress) * 2.0` |

The parabolic term is exactly **0 at progress=0 and progress=1** (endpoints are exact) and peaks at **progress=0.5**.

### Direction (ALONG_PATH)
For arc trajectories with `ALONG_PATH` direction, the sprite rotation is updated each frame from the **local trajectory tangent** (sampled at `progress ± 0.01`), rather than the global FROM→TO vector. This makes the sprite visually follow the arc curve. Safe fallback near endpoints uses the global FROM→TO direction.

### Fingerprint
- `STRAIGHT` (missing) and `STRAIGHT` (explicit) fingerprint **identically**
- `ARC_LOW` and `ARC_HIGH` each change the fingerprint
- `ARC_LOW ≠ ARC_HIGH` fingerprints

### Files Changed
- `src/combat/vfx/VfxPresetComposer.ts` — type, constants, field, compiler, validation, `setSlotTrajectoryProfile()`
- `src/combat/vfx/VfxSystem.ts` — `resolveTravelPosition()`, arc constants, runtime interpolation + tangent direction
- `src/combat/vfx/VfxComposerPlayback.ts` — `buildSlotOverrides()` passes trajectory
- `src/combat/vfx/PublishedVfxRegistry.ts` — `PublishedVfxSlot.trajectoryProfile`, fingerprint, validation
- `tools/vfx/validate-published-registry.mjs` — trajectory validation

---

## 3. UI Changes

### HITSTOP Removed
The HITSTOP button is removed from the IMPACT FX control. Only **FLASH** and **SHAKE** remain. Existing drafts with `hitStop: true` still load and compile safely — the runtime `playCompiledTechnical()` still handles hitStop events.

### Position Labels Cleaned
| Old Label | New Label |
|-----------|-----------|
| `C.F`     | `C.FRONT` |
| `C.B`     | `C.BACK`  |
| `FRONT`   | `T.FRONT` |
| `BACK`    | `T.BACK`  |
| `TOP`     | `T.TOP`   |
| `BOTTOM`  | `T.BOTTOM`|

### Legacy Technical Polish Section Removed
The `renderTechnicalPolish()` section is no longer called from the normal `render()` function. The section function itself is retained in the source so pre-V2.5 presets can still be inspected if needed, but it is not rendered in the normal UI.

### New Draft Default: OFF
`createDraftFromAction()` now defaults `technicalPolish` to `'OFF'` instead of `'AUTO'`. Per-slot Impact FX is the primary authoring path.

### TRAJECTORY Control
A new TRAJECTORY control is added to the slot authoring UI, visible only when `POSITION = TRAVEL`. It appears after the FROM/TO controls and offers three buttons: **STRAIGHT**, **ARC LOW**, **ARC HIGH**.

### Files Changed
- `src/combat/vfx/CombatVfxComposerPanel.ts` — labels, HITSTOP removal, TRAJECTORY control, legacy polish removal, summary

---

## 4. Tests

### New Test File
`src/combat/vfx/VfxV2_6AuthoringPolish.test.ts` — **34 tests**:
- **Trajectory** (17 tests): data model, fingerprint stability, compilation, validation, round-trip persistence, SKY→TARGET, setSlotTrajectoryProfile
- **Shake** (11 tests): maxShakeMagnitude value, LIGHT/STRONG pass-through, differentiation, cap, compiled event magnitudes, VISUALS ONLY vs FULL, no duplicates, per-slot supersedes legacy
- **HITSTOP/Legacy Polish** (5 tests): backward compatibility, default OFF, per-slot supersedes legacy
- **Registry Stability** (1 test): V2.4 fingerprints remain stable

### Updated Existing Tests
- `src/combat/vfx/CombatVfxComposerPanel.test.ts` — 5 existing tests updated + 6 new V2.6 UI tests
- `src/combat/combatCameraFeedback.test.ts` — maxShakeMagnitude expectation updated

---

## 5. Validation Results

| Check                | Result |
|----------------------|--------|
| TypeScript (`tsc`)   | ✅     |
| Tests (`vitest`)     | 1499/1499 ✅ |
| Build (`vite build`) | ✅     |
| Registry Validator   | ✅     |
| `git diff --check`   | ✅     |
| Published presets    | Unchanged ✅ |

---

## 6. Files Changed

| File | Change |
|------|--------|
| `src/combat/combatCameraFeedback.ts` | `maxShakeMagnitude: 0.035 → 0.30` |
| `src/combat/combatCameraFeedback.test.ts` | Updated expectation |
| `src/combat/vfx/VfxPresetComposer.ts` | Trajectory type, constants, field, compiler, validation, `setSlotTrajectoryProfile()`, default OFF |
| `src/combat/vfx/VfxSystem.ts` | `resolveTravelPosition()`, arc constants, runtime interpolation + tangent direction |
| `src/combat/vfx/VfxComposerPlayback.ts` | `buildSlotOverrides()` passes trajectory |
| `src/combat/vfx/PublishedVfxRegistry.ts` | `PublishedVfxSlot.trajectoryProfile`, fingerprint, validation |
| `src/combat/vfx/CombatVfxComposerPanel.ts` | Labels, HITSTOP removal, TRAJECTORY control, legacy polish removal |
| `src/combat/vfx/CombatVfxComposerPanel.test.ts` | 5 tests updated + 6 new V2.6 UI tests |
| `src/combat/vfx/VfxV2_6AuthoringPolish.test.ts` | **New** — 34 V2.6 tests |
| `tools/vfx/validate-published-registry.mjs` | Trajectory validation |
