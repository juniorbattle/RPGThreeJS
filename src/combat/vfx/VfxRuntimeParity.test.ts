import { describe, it, expect, vi } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  resolveSlotLocalImpactTime,
  resolveSlotPhases,
  resolvePhaseStartTimes,
  validateDraft,
  VFX_POSITION_MODES,
  VFX_TRAVEL_FROM_ENDPOINTS,
  VFX_TRAVEL_TO_ENDPOINTS,
  MAX_PHASE,
  SLOT_IMPACT_RATIO,
  TRAVEL_IMPACT_RATIO,
  type VfxPresetDraft,
  type VfxPositionMode,
  type VfxTravelEndpoint,
  type VfxNativeCadence,
} from './VfxPresetComposer';
import {
  buildSlotOverrides,
  buildSlotStep,
  playCompiledVfxSlots,
  playCompiledTechnical,
  wait,
} from './VfxComposerPlayback';
import type { CompiledVfxDraft, CompiledVfxSlot } from './VfxPresetComposer';
import type { VfxContext, VfxRuntimeHelpers, VfxPlayResult } from './VfxTypes';
import type { VfxSystem, VfxLabPlaybackOverrides } from './VfxSystem';
import {
  validatePublishedEntry,
  draftToPublishedEntry,
  publishedEntryToDraft,
} from './PublishedVfxRegistry';

// ============================================================ Helpers

const NOOP_CADENCE = (): VfxNativeCadence => ({ frameCount: 16, frameDurationMs: 40 });

function makeDraft(overrides: Partial<VfxPresetDraft> = {}): VfxPresetDraft {
  return {
    actionKey: 'test_action',
    presetId: 'composer_test_action',
    visualSlots: [createVisualSlot('r1_0001')],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
    ...overrides,
  };
}

/** Controlled cadence that produces predictable durations. */
function makeCadence(frameCount: number, frameDelayMs: number = 40): (id: string) => VfxNativeCadence {
  return () => ({ frameCount, frameDurationMs: frameDelayMs });
}

/**
 * Fake VfxSystem that records when playLabSpriteSheet is INVOKED (not when it
 * completes). This is the critical distinction for PHASE scheduling parity:
 * the published path must delay INVOCATION, not just the completion await.
 */
function makeFakeVfxSystem(): {
  system: VfxSystem;
  invocations: Array<{ candidateId: string; time: number }>;
  reset: () => void;
} {
  const invocations: Array<{ candidateId: string; time: number }> = [];
  let clock = 0;
  const reset = () => { invocations.length = 0; clock = 0; };

  const system = {
    playLabSpriteSheet(
      candidateId: string,
      _sheetDef: unknown,
      _step: unknown,
      _context: VfxContext,
      _overrides: VfxLabPlaybackOverrides,
    ): VfxPlayResult {
      invocations.push({ candidateId, time: clock });
      return {
        played: true,
        presetId: 'fake',
        impactTime: 0,
        completion: Promise.resolve(),
      };
    },
    play(_presetId: string, _context: VfxContext): VfxPlayResult {
      return { played: false, presetId: 'fake', impactTime: 0, completion: Promise.resolve() };
    },
    dispose() {},
  } as unknown as VfxSystem;

  // Override wait so we can track the clock
  const originalWait = wait;
  vi.mocked(originalWait);

  return { system, invocations, reset };
}

function makeFakeContext(helpers?: Partial<VfxRuntimeHelpers>): VfxContext {
  return {
    scene: {} as VfxContext['scene'],
    camera: {} as VfxContext['camera'],
    helpers: {
      wait,
      screenFlash: vi.fn(),
      screenShake: vi.fn(),
      hitStop: vi.fn().mockResolvedValue(undefined),
      ...helpers,
    },
  };
}

// ============================================================ TRAVEL Impact Timing

describe('V2.5.1 TRAVEL Impact Timing', () => {
  it('FIXED_IMPACT_45_PERCENT: FIXED slot local impact = 45% duration', () => {
    expect(resolveSlotLocalImpactTime(1.0, 'FIXED')).toBeCloseTo(0.45);
    expect(resolveSlotLocalImpactTime(2.0, 'FIXED')).toBeCloseTo(0.9);
  });

  it('TRAVEL_IMPACT_AT_ARRIVAL: TRAVEL slot local impact = 100% duration', () => {
    expect(resolveSlotLocalImpactTime(1.0, 'TRAVEL')).toBeCloseTo(1.0);
    expect(resolveSlotLocalImpactTime(0.8, 'TRAVEL')).toBeCloseTo(0.8);
  });

  it('TRAVEL absolute impact = startTime + 100% duration', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
        timingProfile: 'NORMAL',
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.impactTime).toBeCloseTo(slot.startTime + slot.duration, 2);
  });

  it('Changing SPEED changes travel arrival impact automatically', () => {
    const quick = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET',
        timingProfile: 'QUICK',
      })],
    });
    const long = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET',
        timingProfile: 'LONG',
      })],
    });
    const cQuick = compileDraft(quick, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const cLong = compileDraft(long, { includeTechnical: false, getCadence: NOOP_CADENCE });
    // QUICK has shorter duration → earlier arrival
    expect(cQuick.slots[0]!.impactTime).toBeLessThan(cLong.slots[0]!.impactTime);
  });

  it('Changing PHASE changes travel arrival impact automatically', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', {
          positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET',
          phase: 1,
        }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot0 = compiled.slots[0]!;
    const slot1 = compiled.slots[1]!;
    // Phase 1 starts after phase 0
    expect(slot1.startTime).toBeGreaterThanOrEqual(slot0.duration);
    // Travel impact = startTime + duration
    expect(slot1.impactTime).toBeCloseTo(slot1.startTime + slot1.duration, 2);
  });
});

// ============================================================ Preset Impact Selection

describe('V2.5.1 Preset Gameplay Impact Selection', () => {
  it('A. Legacy one-slot FIXED without slot Impact FX: 45% behavior', () => {
    const draft = makeDraft({
      technicalPolish: 'OFF',
      visualSlots: [createVisualSlot('r1_0001', { timingProfile: 'NORMAL' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(compiled.impactTime).toBeCloseTo(slot.startTime + slot.duration * SLOT_IMPACT_RATIO, 2);
  });

  it('B. One-slot TRAVEL without slot Impact FX: preset impact at arrival', () => {
    const draft = makeDraft({
      technicalPolish: 'OFF',
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET',
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(compiled.impactTime).toBeCloseTo(slot.startTime + slot.duration, 2);
  });

  it('C. Multi-slot with no slot Impact FX: first-slot compatibility', () => {
    const draft = makeDraft({
      technicalPolish: 'OFF',
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(compiled.impactTime).toBe(compiled.slots[0]!.impactTime);
  });

  it('D. Multi-slot with one active Impact FX slot: selects that slot impactTime', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', {
          phase: 1,
          impactFx: { flash: true, power: 'STRONG' },
        }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const fxSlot = compiled.slots[1]!;
    expect(compiled.impactTime).toBe(fxSlot.impactTime);
    expect(compiled.impactTime).not.toBe(compiled.slots[0]!.impactTime);
  });

  it('E. Multi-slot with multiple active Impact FX slots: earliest active FX impactTime', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', {
          phase: 0,
          impactFx: { flash: true, power: 'LIGHT' },
        }),
        createVisualSlot('r1_0002', {
          phase: 1,
          impactFx: { shake: true, power: 'STRONG' },
        }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const earliest = Math.min(compiled.slots[0]!.impactTime, compiled.slots[1]!.impactTime);
    expect(compiled.impactTime).toBe(earliest);
  });

  it('F. Active FX slot in a later phase: gameplay impact waits for that phase', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
        createVisualSlot('r1_0003', {
          phase: 2,
          impactFx: { flash: true, shake: true, hitStop: true, power: 'STRONG' },
        }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const fxSlot = compiled.slots[2]!;
    expect(compiled.impactTime).toBe(fxSlot.impactTime);
    expect(compiled.impactTime).toBeGreaterThan(compiled.slots[0]!.impactTime);
    expect(compiled.impactTime).toBeGreaterThan(compiled.slots[1]!.impactTime);
  });
});

// ============================================================ Draft Validation Parity

describe('V2.5.1 Draft Validation Parity', () => {
  it('DRAFT_PHASE_VALIDATOR_0_15_INTEGER: accepts valid integers 0..15', () => {
    for (let p = 0; p <= MAX_PHASE; p++) {
      const draft = makeDraft({
        visualSlots: [createVisualSlot('r1_0001', { phase: p })],
      });
      expect(validateDraft(draft)).toBe(true);
    }
  });

  it('rejects phase = 2.7 (non-integer)', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 2.7 as unknown as number })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('rejects phase = -1', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: -1 })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('rejects phase = 16 (above MAX_PHASE)', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 16 })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('rejects phase = 999', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 999 })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('rejects phase = NaN', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: NaN })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('rejects phase = Infinity', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: Infinity })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('TRAVEL_VALIDATION_PARITY: TRAVEL without endpoints is valid (defaults supplied)', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { positionMode: 'TRAVEL' })],
    });
    expect(validateDraft(draft)).toBe(true);
  });

  it('TRAVEL with only travelFrom is valid', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL', travelFrom: 'SKY',
      })],
    });
    expect(validateDraft(draft)).toBe(true);
  });

  it('SKY_FROM_ONLY: SKY is valid in travelFrom but not travelTo', () => {
    expect(VFX_TRAVEL_FROM_ENDPOINTS).toContain('SKY');
    expect(VFX_TRAVEL_TO_ENDPOINTS).not.toContain('SKY');
  });

  it('rejects SKY in travelTo', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL', travelTo: 'SKY' as unknown as VfxTravelEndpoint,
      })],
    });
    expect(validateDraft(draft)).toBe(false);
  });

  it('published and draft validators agree on phase = 2.7', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 2.7 as unknown as number })],
    });
    const entry = draftToPublishedEntry(draft);
    expect(validateDraft(draft)).toBe(validatePublishedEntry(entry).ok);
  });

  it('published and draft validators agree on phase = 16', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 16 })],
    });
    const entry = draftToPublishedEntry(draft);
    expect(validateDraft(draft)).toBe(validatePublishedEntry(entry).ok);
  });
});

// ============================================================ HITSTOP Execution

describe('V2.5.1 HITSTOP Execution', () => {
  it('HITSTOP_LIGHT_EXECUTES: hitStop helper called with LIGHT duration (0.04s)', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, power: 'LIGHT' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).toHaveBeenCalledTimes(1);
    expect(hitStopFn).toHaveBeenCalledWith(0.04);
  });

  it('HITSTOP_STRONG_EXECUTES: hitStop helper called with STRONG duration (0.08s)', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).toHaveBeenCalledTimes(1);
    expect(hitStopFn).toHaveBeenCalledWith(0.08);
  });

  it('FLASH-only does not invoke hitStop', async () => {
    const hitStopFn = vi.fn();
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { flash: true, power: 'LIGHT' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).not.toHaveBeenCalled();
  });

  it('SHAKE-only does not invoke hitStop', async () => {
    const hitStopFn = vi.fn();
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { shake: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).not.toHaveBeenCalled();
  });

  it('VISUALS_ONLY_NO_HITSTOP: includeTechnical=false produces no hitStop', async () => {
    const hitStopFn = vi.fn();
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).not.toHaveBeenCalled();
  });

  it('FULL_PRESET executes hitStop', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { flash: true, shake: true, hitStop: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).toHaveBeenCalledTimes(1);
  });

  it('MISSING_HITSTOP_HELPER_SAFE: no crash when hitStop helper absent', async () => {
    const context = makeFakeContext({ hitStop: undefined });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, flash: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    // Should not throw
    await expect(playCompiledTechnical(compiled, context)).resolves.toBeUndefined();
  });

  it('MISSING_HITSTOP_HELPER_SAFE: other effects still run', async () => {
    const screenFlashFn = vi.fn();
    const context = makeFakeContext({ hitStop: undefined, screenFlash: screenFlashFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, flash: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(screenFlashFn).toHaveBeenCalledTimes(1);
  });

  it('legacy Technical Polish hitStop remains functional', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      technicalPolish: 'STRONG',
      visualSlots: [createVisualSlot('r1_0001')],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).toHaveBeenCalledTimes(1);
    expect(hitStopFn).toHaveBeenCalledWith(0.08);
  });

  it('slot Impact FX supersedes legacy global polish', async () => {
    const draft = makeDraft({
      technicalPolish: 'STRONG',
      visualSlots: [
        createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'LIGHT' } }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(compiled.usesSlotImpactFx).toBe(true);
    // Only 1 event (flash) from slot FX, not 3 from legacy polish
    expect(compiled.technical).toHaveLength(1);
    expect(compiled.technical[0]!.type).toBe('screenFlash');
  });

  it('multiple impact slots schedule their own hitStop independently', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0, impactFx: { hitStop: true, power: 'LIGHT' } }),
        createVisualSlot('r1_0002', { phase: 1, impactFx: { hitStop: true, power: 'STRONG' } }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    expect(hitStopFn).toHaveBeenCalledTimes(2);
    expect(hitStopFn).toHaveBeenNthCalledWith(1, 0.04);
    expect(hitStopFn).toHaveBeenNthCalledWith(2, 0.08);
  });

  it('no duplicate execution after completion', async () => {
    const hitStopFn = vi.fn().mockResolvedValue(undefined);
    const context = makeFakeContext({ hitStop: hitStopFn });
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { hitStop: true, power: 'STRONG' },
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    await playCompiledTechnical(compiled, context);
    await playCompiledTechnical(compiled, context);
    // Each call runs the events once — 2 total
    expect(hitStopFn).toHaveBeenCalledTimes(2);
  });
});

// ============================================================ Shared Overrides Parity

describe('V2.5.1 Shared Overrides Parity', () => {
  it('buildSlotOverrides maps all V2.5 fields correctly', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
        aimProfile: 'ALONG_PATH',
        mirrorProfile: 'AUTO_HORIZONTAL',
        rotationDegrees: 45,
        pivotProfile: 'LEFT',
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const overrides = buildSlotOverrides(compiled.slots[0]!);
    expect(overrides.positionMode).toBe('TRAVEL');
    expect(overrides.travelFromAnchor).toBe('sourceFront');
    expect(overrides.travelToAnchor).toBe('target');
    expect(overrides.directionProfile).toBe('ALONG_PATH');
    expect(overrides.autoMirrorHorizontal).toBe(true);
    expect(overrides.rotationOffset).toBeCloseTo(Math.PI / 4);
    expect(overrides.pivotCenterX).toBe(0.0);
    expect(overrides.pivotCenterY).toBe(0.5);
  });

  it('buildSlotStep produces correct VfxStep shape', () => {
    const draft = makeDraft();
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const step = buildSlotStep(compiled.slots[0]!);
    expect(step.type).toBe('spriteSheet');
    expect(step.scale).toBe(1);
    expect(step.opacity).toBe(1);
    expect(step.startTime).toBe(0);
  });
});

// ============================================================ Compile Parity (Composer vs Published round-trip)

describe('V2.5.1 Composer/Published Compile Parity', () => {
  it('COMPOSER_PUBLISHED_COMPILE_PARITY: 3-slot draft with TRAVEL + Impact FX round-trips identically', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0, timingProfile: 'QUICK' }),
        createVisualSlot('r1_0002', {
          phase: 1,
          positionMode: 'TRAVEL',
          travelFrom: 'CASTER_FRONT',
          travelTo: 'TARGET',
          timingProfile: 'NORMAL',
        }),
        createVisualSlot('r1_0003', {
          phase: 2,
          placementProfile: 'TARGET',
          timingProfile: 'NORMAL',
          impactFx: { flash: true, shake: true, hitStop: true, power: 'STRONG' },
        }),
      ],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const c1 = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const c2 = compileDraft(restored, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(c1.slots.map((s) => s.startTime)).toEqual(c2.slots.map((s) => s.startTime));
    expect(c1.slots.map((s) => s.impactTime)).toEqual(c2.slots.map((s) => s.impactTime));
    expect(c1.slots.map((s) => s.phase)).toEqual(c2.slots.map((s) => s.phase));
    expect(c1.impactTime).toBe(c2.impactTime);
    expect(c1.technical).toEqual(c2.technical);
    expect(c1.usesSlotImpactFx).toBe(c2.usesSlotImpactFx);
  });
});

// ============================================================ V2.4 Backward Compatibility

describe('V2.5.1 V2.4 Backward Compatibility', () => {
  it('V2_4_FINGERPRINTS_UNCHANGED: legacy draft fingerprint stable', () => {
    const draft: VfxPresetDraft = {
      actionKey: 'legacy',
      presetId: 'composer_legacy',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    // FIXED slot: 45% impact
    expect(compiled.slots[0]!.impactTime).toBeCloseTo(
      compiled.slots[0]!.duration * SLOT_IMPACT_RATIO, 2,
    );
    expect(compiled.slots[0]!.positionMode).toBe('FIXED');
    expect(compiled.slots[0]!.phase).toBe(0);
    expect(compiled.usesSlotImpactFx).toBe(false);
  });

  it('legacy draft with TRAVEL slot gets 100% impact (V2.5.1 fix)', () => {
    const draft: VfxPresetDraft = {
      actionKey: 'legacy_travel',
      presetId: 'composer_legacy_travel',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'CASTER_FRONT',
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.impactTime).toBeCloseTo(
      compiled.slots[0]!.duration * TRAVEL_IMPACT_RATIO, 2,
    );
  });
});
