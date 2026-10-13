# R2C-VFX Composer V2.7 — Caster Motion Choreography

**Date:** 2026-08-23  
**Status:** Implemented, tested, validated. Not committed.  
**Schema version:** 1 (unchanged — beats field is additive optional)

## Problem

V2.6 Caster Motion and VFX slots ran on **two independent scheduling clocks**. Both shared a timeline origin but had no causal dependency: a VFX slot at `startTime=0.5` did not wait for a motion step at `startTime=0.3` to complete — it fired at its own scheduled time regardless. This made it impossible to author "dash in, THEN impact" choreography with a structural guarantee.

## Solution — ChoreographyBeat

A **Beat** is a temporal unit. Inside one Beat, ALL participants (VFX slots and caster motion steps) START TOGETHER. Between Beats, the next Beat does NOT start until the previous Beat is complete. Beat completion is `max(duration of all participants)`.

### Data Model

```typescript
interface ChoreographyBeat {
  id: string;
  vfxSlotIds: string[];
  casterMotionIds: string[];
}
```

Added to `VfxPresetDraft` as `beats?: ChoreographyBeat[]` — **additive and optional**. Absent means legacy phase scheduling is used. Present means beats are the single timing authority.

### Compiled Output

```typescript
interface CompiledBeat {
  beatId: string;
  startTime: number;
  duration: number;
  vfxSlots: CompiledVfxSlot[];
  casterMotions: CompiledCasterMotionStep[];
}
```

`CompiledVfxDraft` now always includes `compiledBeats: CompiledBeat[]` and `hasExplicitBeats: boolean`. When explicit beats exist, slot and motion startTimes are overridden to match beat boundaries. When absent, beats are derived from phases for display — the legacy scheduling path remains unchanged.

### Runtime — `playCompiledBeats`

New function in `VfxComposerPlayback.ts`. Iterates beats sequentially:

1. Start ALL VFX participants simultaneously (no delay between them).
2. `await Promise.all([Promise.all(vfxPromises), wait(beat.duration)])` — causal barrier.
3. Proceed to the next beat.

Motion is installed once at the beginning via `setCasterMotion` and runs in the Stage's frame loop. Motion steps have beat-assigned startTimes, so they naturally start at beat boundaries.

### Caster Anchor Tracking

`CombatStage.updateActorMotion` now updates `vfxSourceProxy.grp.position` to include the caster motion offset. This ensures CASTER-anchored VFX resolves to the caster's actual world position, not its static slot coordinate. With no motion, the offset is (0,0,0) — zero regression.

## Backward Compatibility

- **33 published presets:** All have no `beats` field. Fingerprints unchanged. Timing identical via legacy phase path.
- **`schemaVersion`:** Stays at 1. The `beats` field is additive optional, same pattern as `casterMotion` in Phase B.
- **Fingerprint:** `beats` contribution emitted ONLY when explicit beats exist. A missing field fingerprints identically to a pre-V2.7 draft.
- **Legacy phase scheduling:** Fully preserved as fallback. `playCompiledVfxSlots` is not deleted or replaced — it remains the runtime path when `hasExplicitBeats` is false.

## Files Modified

| File | Change |
|------|--------|
| `src/combat/vfx/VfxPresetComposer.ts` | `ChoreographyBeat`, `CompiledBeat`, `beats` field, beat mutators, `compileDraft` beat logic, `validateDraft` |
| `src/combat/vfx/VfxComposerPlayback.ts` | `playCompiledBeats`, updated `playDraftVisualsOnly`, `playDraftFull`, `playDraftInCombatStage` |
| `src/combat/vfx/PublishedVfxRegistry.ts` | `beats` in `PublishedVfxEntry`, fingerprint, `draftToPublishedEntry`, `publishedEntryToDraft`, `validatePublishedEntry` |
| `src/combat/vfx/PublishedVfxResolver.ts` | `playCompiledPublishedVfx` uses beat scheduler when `hasExplicitBeats` |
| `src/combat/stage/CombatStage.ts` | `vfxSourceProxy.grp.position` follows motion offset |

## Files Created

| File | Purpose |
|------|---------|
| `src/combat/vfx/ChoreographyBeats.test.ts` | 30 tests: beat scheduling, causal barriers, backward compat, mutators, non-regression, production parity |

## Acceptance Tests

All 30 tests pass. The critical acceptance tests with fake timers:

1. **CRITICAL: VFX in Beat 1 does NOT start until motion in Beat 0 completes** — Proven with `vi.useFakeTimers()`. VFX invocation count is 0 at t=0, 0 before motion completion, 1 at motion completion.

2. **CRITICAL: motion and VFX in same beat start at identical timestamp** — Both are invoked at t=0 (beat start). Invocation count is 1 immediately.

3. **CHAIN: VFX → motion → VFX — all three causal barriers hold** — VFX charge at t=0, no second VFX during motion, VFX impact at motion completion. Three sequential barriers proven.

4. **COMPLEX: VFX → motion + VFX → VFX → motion** — Four beats, all barriers hold. VFX invocations increment at each beat boundary.

5. **VFX after motion: impact VFX MUST NOT start before dash completes** — Halfway through motion: 0 invocations. At motion completion: 1 invocation.

## Validation Results

- **TypeScript:** `tsc --noEmit` — clean
- **Vitest:** 1771/1771 tests pass across 72 files (0 regressions)
- **Registry validator:** 33 actions, all valid, all fingerprints unchanged
- **Build:** `vite build` — successful
- **Git diff --check:** No whitespace errors (only LF/CRLF warnings, normal on Windows)

## Not Done

- **Composer UI refactor:** The beat-based CHOREOGRAPHY section UI is a future task. The data model and runtime are ready; the UI currently still uses the independent VFX + motion sections.
- **No commits or pushes** per instructions.
