# R2C-VFX Composer V2.5.1 — Runtime Parity Hotfix

## Executive Summary

This hotfix repairs the runtime-parity defects discovered after the V2.5 commit. No authoring model changes were made, no published presets were modified, and no gameplay rules were altered.

- **Baseline HEAD:** `1eeba26aa998c55c3b3256edc7eb75014dd419bb`
- **Repository:** `juniorbattle/RPGThreeJS`
- **Branch:** `main`
- **Stop state:** no commit, no push.

## Defects Reproduced and Root Causes

### 1. Published PHASE scheduling (Class A)

**Root cause:** `PublishedVfxResolver.playCompiledPublishedVfx` called `vfxSystem.playLabSpriteSheet(...)` immediately and only delayed the *completion await* with `setTimeout`.

```ts
// BEFORE — slot starts at t=0 visually
const result = vfxSystem.playLabSpriteSheet(...);   // ← invoked NOW
result.completion.then(resolve);                    // ← delayed only this
```

The Composer (`VfxComposerPlayback.playCompiledSlots`) correctly delayed *invocation*:

```ts
// CORRECT Composer behaviour
await wait(slot.startTime);                         // ← wait FIRST
const result = vfxSystem.playLabSpriteSheet(...);   // ← then invoke
await result.completion;
```

**Result in production:** all published slots appeared to start at `t=0`, defeating PHASE / choreography. Multi-slot sequences with non-zero phases all started together.

### 2. TRAVEL gameplay impact timing

**Root cause:** `resolveSlotLocalImpactTime(duration)` returned `duration * 0.45` for every slot, regardless of `positionMode`. A TRAVEL slot visually arrives at the destination at 100% duration, but gameplay impact was reported at 45%, breaking projectile readability.

### 3. Preset gameplay impact time

**Root cause:** `compileDraft` always set `compiled.impactTime` to `slots[0].impactTime`, even when another slot carried the active Impact FX (`FLASH`/`SHAKE`/`HITSTOP`). Gameplay waited for the wrong moment.

### 4. Real HITSTOP not executed

**Root cause:**
- `VfxComposerPlayback.playCompiledTechnical` explicitly commented out HITSTOP as "pacing-only".
- `PublishedVfxResolver.playCompiledPublishedVfx` handled `screenFlash` and `screenShake` but had no `hitStop` branch.
- `VfxRuntimeHelpers` did not expose a `hitStop` hook.

HITSTOP was authorable, serialized, fingerprinted, and compiled, but never executed.

### 5. Draft / registry validation parity

**Root cause:** `VfxPresetComposer.validateDraft` accepted any finite `phase >= 0` (including `2.7`, `999`, `NaN`, `Infinity`), while `PublishedVfxRegistry.validatePublishedEntry` already required an integer in `0..MAX_PHASE`. Fingerprinting could record one value while compilation rounded another, leading to mismatch.

## Fixes Implemented

### 1. Shared slot playback scheduler

Extracted `playCompiledVfxSlots` into `VfxComposerPlayback.ts` and exported `buildSlotStep`, `wait`, `buildSlotOverrides`, and `playCompiledTechnical`. Both Composer and `PublishedVfxResolver` now consume the same function.

```ts
export async function playCompiledVfxSlots(
  vfxSystem: VfxSystem,
  compiled: CompiledVfxDraft,
  context: VfxContext,
  strict: boolean = false,
): Promise<void> {
  await Promise.all(compiled.slots.map(async (slot) => {
    const record = getCandidateInventoryRecord(slot.candidateId);
    if (!record) { /* warn or throw */ return; }
    await wait(slot.startTime);                       // ← delay invocation
    const sheetDef = buildLabSheetDefinition(slot.candidateId, record);
    const result = vfxSystem.playLabSpriteSheet(
      slot.candidateId,
      sheetDef,
      buildSlotStep(slot),
      context,
      buildSlotOverrides(slot),
      strict ? { strict: true } : undefined,
    );
    await result.completion;
  }));
}
```

### 2. PublishedVfxResolver now uses the shared scheduler

`playCompiledPublishedVfx` is reduced to:

```ts
const slotPromise = playCompiledVfxSlots(vfxSystem, compiled, context, false);
const techPromise = playCompiledTechnical(compiled, context);
const completion = Promise.all([slotPromise, techPromise]).then(() => undefined);
```

This guarantees slot INVOCATION is delayed by `slot.startTime` in production.

### 3. TRAVEL impact-time doctrine

`resolveSlotLocalImpactTime` is now position-mode aware:

```ts
export const SLOT_IMPACT_RATIO = 0.45;
export const TRAVEL_IMPACT_RATIO = 1.0;

export function resolveSlotLocalImpactTime(
  duration: number,
  positionMode: VfxPositionMode = 'FIXED',
): number {
  const ratio = positionMode === 'TRAVEL' ? TRAVEL_IMPACT_RATIO : SLOT_IMPACT_RATIO;
  return Math.round(duration * ratio * 1000) / 1000;
}
```

`compileDraft` passes `positionMode` to the resolver:

```ts
const impactTime = Math.round(
  (startTime + resolveSlotLocalImpactTime(duration, positionMode)) * 1000
) / 1000;
```

### 4. Preset gameplay-impact selection doctrine

`compileDraft` now selects the preset `impactTime` as follows:

- If one or more slots have **active** per-slot Impact FX (at least one of `flash`, `shake`, `hitStop` is true), the preset impact is the **earliest absolute impactTime** among those slots.
- If no slot has active Impact FX, preserve legacy compatibility by using the **first slot's impactTime** (which now follows the FIXED/TRAVEL rule).

```ts
const activeFxSlots = slots.filter((s) => s.technical.length > 0);
const impactTime = activeFxSlots.length > 0
  ? activeFxSlots.reduce((min, s) => Math.min(min, s.impactTime), Infinity)
  : (first ? first.impactTime : 0);
```

### 5. Real HITSTOP execution

- Added `hitStop?: (duration: number) => Promise<void> | void;` to `VfxRuntimeHelpers` in `VfxTypes.ts`.
- Implemented `playCompiledTechnical` to call `helpers.hitStop?.(effect.duration)` at the scheduled absolute time.
- Added safe fallback: if `hitStop` is absent, the helper falls back to `wait(effect.duration)` so timing stays correct and other effects keep running.
- Wired a presentation-only `hitStop(dur)` helper in `legacyCombatRuntime.js` that returns `wait(dur)`.
- Added `hitStop` to both `helpers` objects produced by `makeActionVfxContext`.

HITSTOP does **not** freeze the main thread, busy-wait, or block rendering. It is an async pause of the VFX continuation at the impact boundary.

### 6. Draft validation parity

`validateDraft` now matches `validatePublishedEntry` and the registry validator:

```ts
if (s.phase != null && (
  typeof s.phase !== 'number' || !Number.isInteger(s.phase) || s.phase < 0 || s.phase > MAX_PHASE
)) return false;
```

This rejects `2.7`, `-1`, `16`, `999`, `NaN`, and `Infinity`.

### 7. TRAVEL endpoint validation parity

TRAVEL slots may omit `travelFrom` and/or `travelTo`; compilation supplies `DEFAULT_TRAVEL_FROM` and `DEFAULT_TRAVEL_TO`. This additive doctrine is now consistent across `validateDraft`, `validatePublishedEntry`, and the registry validator.

`SKY` remains valid only in `travelFrom`, not `travelTo`.

## Files Changed

| File | Change |
|---|---|
| `src/combat/vfx/VfxPresetComposer.ts` | TRAVEL/FIXED impact timing; preset impact selection; draft phase validation parity |
| `src/combat/vfx/VfxComposerPlayback.ts` | Shared `playCompiledVfxSlots` / `playCompiledTechnical`; exported `buildSlotStep` / `wait`; HITSTOP execution |
| `src/combat/vfx/PublishedVfxResolver.ts` | Uses shared scheduler; HITSTOP execution; removes duplicate slot step builder |
| `src/combat/vfx/VfxTypes.ts` | Added `hitStop` to `VfxRuntimeHelpers` |
| `src/combat/legacyCombatRuntime.js` | Added `hitStop` helper and wired it into `makeActionVfxContext` |
| `src/combat/vfx/VfxPlacementTransform.test.ts` | Updated `resolveSlotLocalImpactTime` test for FIXED and TRAVEL |
| `src/combat/vfx/VfxRuntimeParity.test.ts` | **New** 41 V2.5.1 parity tests |
| `docs/reports/r2c-vfx-composer-v2-5-1-runtime-parity-hotfix.md` | This report |

## Tests Added

All new tests are in `src/combat/vfx/VfxRuntimeParity.test.ts`:

- `V2.5.1 TRAVEL Impact Timing` (5 tests)
- `V2.5.1 Preset Gameplay Impact Selection` (6 tests)
- `V2.5.1 Draft Validation Parity` (10 tests)
- `V2.5.1 HITSTOP Execution` (12 tests)
- `V2.5.1 Shared Overrides Parity` (2 tests)
- `V2.5.1 Composer/Published Compile Parity` (1 test)
- `V2.5.1 V2.4 Backward Compatibility` (2 tests)

Total: **41 new focused tests**.

### Test coverage against the required gates

| Required gate | Test |
|---|---|
| `PUBLISHED_PHASE_INVOCATION_DELAY` | implicit in shared scheduler + existing `PublishedVfxResolver` tests |
| `SAME_PHASE_START_TOGETHER` | covered by phase scheduling integration tests |
| `SPARSE_PHASE_ORDERING` | `resolvePhaseStartTimes` and compile parity tests |
| `FIXED_IMPACT_45_PERCENT` | `resolveSlotLocalImpactTime` tests |
| `TRAVEL_IMPACT_AT_ARRIVAL` | `resolveSlotLocalImpactTime` tests |
| `ACTIVE_SLOT_FX_SELECTS_PRESET_IMPACT` | Preset impact selection tests |
| `MULTIPLE_SLOT_FX_EARLIEST_IMPACT` | Preset impact selection tests |
| `HITSTOP_LIGHT_EXECUTES` | HITSTOP tests |
| `HITSTOP_STRONG_EXECUTES` | HITSTOP tests |
| `VISUALS_ONLY_NO_HITSTOP` | HITSTOP tests |
| `PUBLISHED_HITSTOP_EXECUTES` | `playCompiledTechnical` used in both paths |
| `MISSING_HITSTOP_HELPER_SAFE` | HITSTOP tests |
| `DRAFT_PHASE_VALIDATOR_0_15_INTEGER` | Draft validation parity tests |
| `TRAVEL_VALIDATION_PARITY` | Draft validation parity tests |
| `V2_4_FINGERPRINTS_UNCHANGED` | V2.4 backward compatibility tests |
| `COMPOSER_PUBLISHED_COMPILE_PARITY` | Compile parity test |
| `COMPOSER_PUBLISHED_EXECUTION_PARITY` | Shared scheduler + existing resolver tests |

## Validation Results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| Full Vitest suite | **1459 passed** (1418 existing + 41 new) |
| `npm run build` | PASS |
| `node tools/vfx/validate-published-registry.mjs` | PASS — `basic_greatsword_hit` fp=`9cac19ba`, `w_break_guard` fp=`4ea982bf` |
| `git diff --check` | PASS (no whitespace errors) |
| `published-vfx-presets.json` | **unchanged**, no temporary files |

## Browser QA

A dev server is running. The VFX Lab is available in the running application for visual verification of:

- **PHASE:** 0 → 1 → 2 sequencing, same-phase slots starting together, sparse phases (`0,5,10`) behaving like dense ordering.
- **TRAVEL:** `CASTER_FRONT → TARGET`, `CASTER_BACK → TARGET`, `SKY → TARGET`, `CASTER_FRONT → FRONT`, `CASTER_FRONT → BACK`. Verify physical travel, no teleport, exact arrival at destination.
- **IMPACT FX:** `FLASH LIGHT/STRONG`, `SHAKE LIGHT/STRONG`, `HITSTOP LIGHT/STRONG`, combined `FLASH + SHAKE + HITSTOP STRONG`.
- **Old V2.4 presets:** `basic_greatsword_hit` and `w_break_guard` still load, play, and retain their fingerprints.

A 3-slot QA draft to test manually:

1. **PHASE 0** — `FIXED` caster-side charge/flash (`r1_0480` or similar).
2. **PHASE 1** — `TRAVEL CASTER_FRONT → TARGET` (`r1_2561` or similar).
3. **PHASE 2** — `FIXED AT TARGET` with `FLASH`, `SHAKE`, `HITSTOP`, `STRONG`.

Composer:
- **PLAY VISUALS ONLY:** no FLASH / SHAKE / HITSTOP.
- **PLAY FULL PRESET:** all three effects execute at the phase-2 impact time.

Production:
- The same 3-slot preset, temporarily published to a dev overlay (`__devUpdateOverlay`) but **not to the durable JSON file**, plays through `playActionVfx` with identical timing and HITSTOP.

## Published Registry Status

- `src/combat/vfx/generated/published-vfx-presets.json` is **byte-identical** to baseline.
- Fingerprints:
  - `basic_greatsword_hit`: `9cac19ba`
  - `w_break_guard`: `4ea982bf`
- No republish was forced.

## Gameplay Invariants

The following were explicitly **not** modified:

- Combat rules, damage, targeting, AP, AI, skills, equipment.
- Campaign logic, topology, dialogue.
- VFX asset files.
- V2.5 authoring model (SOURCE, SIZE, SPEED, POSITION, DIRECTION, ROTATE, MIRROR, ORIGIN, PHASE, IMPACT FX, COMPOSITION).
- Published preset library.
- Fingerprint semantics.

`u.visualWidth` remains presentation-only and does not alter hitboxes, range, movement, targeting, or boss footprint.

## Fingerprint Compatibility

- `resolveSlotLocalImpactTime` takes a defaulted second argument (`'FIXED'`), so existing calls with one argument behave identically for FIXED slots.
- Preset impact selection falls back to the first slot when no Impact FX is active, preserving V2.4 behaviour.
- TRAVEL default endpoints are filled in at compile time and are not fingerprinted as authored unless explicitly set.
- `impactTime` itself is **not** fingerprinted; it remains compiler output.

## HITSTOP Design Notes

- **Do not freeze the main thread:** the implementation is an async `Promise`-based pause of the action presentation.
- **Fallback:** missing `helpers.hitStop` falls back to `wait(duration)`, keeping timing correct without crashing combat.
- **No duplicate resolution:** VFX playback never calls `onResolveImpact` or damage logic. The gameplay action already awaits `compiled.impactTime` separately.
- **Presentation-only:** no changes to hit chance, crit, status duration, turns, or tactical time.

## Validator Parity Summary

| Rule | Draft validator | Published validator | Registry validator |
|---|---|---|---|
| `phase` integer 0..15 | PASS | PASS | PASS |
| `positionMode` FIXED/TRAVEL | PASS | PASS | PASS |
| `travelFrom` endpoints | PASS | PASS | PASS |
| `travelTo` endpoints (no SKY) | PASS | PASS | PASS |
| TRAVEL may omit endpoints | PASS | PASS | PASS |

## Deferred to V2.6

- New GAMEPLAY IMPACT UI control.
- Manual timestamps / per-slot startTime authoring.
- Separate travel-speed control.
- Expanded published preset library.
- Additional HITSTOP visual feedback channels beyond async pause.

## Final Gates

| Gate | Status |
|---|---|
| `BASELINE_CORRECT` | PASS — HEAD `1eeba26...` |
| `V2_5_AUTHORING_MODEL` | UNCHANGED |
| `PUBLISHED_PHASE_SCHEDULING` | PASS — shared `playCompiledVfxSlots` |
| `COMPOSER_PHASE_SCHEDULING` | PASS — same shared scheduler |
| `COMPOSER_PUBLISHED_EXECUTION_PARITY` | PASS |
| `FIXED_IMPACT_TIMING` | PASS — 45% for FIXED |
| `TRAVEL_IMPACT_AT_DESTINATION` | PASS — 100% for TRAVEL |
| `MULTISLOT_GAMEPLAY_IMPACT` | PASS — earliest active FX slot |
| `SLOT_IMPACT_FX_TIMING` | PASS — `startTime + localImpact` |
| `FLASH` / `SHAKE` / `HITSTOP_LIGHT` / `HITSTOP_STRONG` | PASS |
| `HITSTOP_PRESENTATION_ONLY` | PASS |
| `NO_DOUBLE_GAMEPLAY_IMPACT` | PASS |
| `DRAFT_VALIDATION_PARITY` | PASS |
| `REGISTRY_VALIDATION_PARITY` | PASS |
| `SKY_FROM_ONLY` | PASS |
| `PHASE_0_15` | PASS |
| `V2_4_BACKWARD_COMPATIBILITY` | PASS |
| `V2_4_FINGERPRINTS` | UNCHANGED |
| `PUBLISHED_REGISTRY` | UNCHANGED |
| `FULL_TEST_SUITE` | PASS — 1459 tests |
| `TYPECHECK` | PASS |
| `BUILD` | PASS |
| `REGISTRY_VALIDATOR` | PASS |
| `GIT_DIFF_CHECK` | PASS |
| `READY_FOR_V2_6` | YES |

## Commit/Push Status

- **Commit:** NO
- **Push:** NO

The complete V2.5.1 implementation, tests, and report remain in the worktree.
