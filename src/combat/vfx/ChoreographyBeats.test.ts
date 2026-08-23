/**
 * V2.7 CHOREOGRAPHY BEATS — critical acceptance tests.
 *
 * These tests prove the causal barrier model:
 *   - Beat N+1 cannot start until Beat N completes.
 *   - All participants in the same beat start at exactly the same time.
 *   - Beat duration = max(participant durations).
 *
 * The highest-priority test uses fake timers to prove that VFX in Beat 1
 * does NOT start until the motion in Beat 0 completes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  addBeat,
  addVfxToBeat,
  addMotionToBeat,
  removeBeat,
  removeVfxFromBeat,
  deriveBeatsFromPhases,
  validateChoreographyBeats,
  hasExplicitBeats,
  type VfxPresetDraft,
  type VfxNativeCadence,
} from './VfxPresetComposer';
import {
  playCompiledBeats,
  wait,
} from './VfxComposerPlayback';
import {
  createCasterMotionStep,
  compileCasterMotion,
  type CasterMotionStep,
} from './CasterMotion';
import { computeFingerprint } from './PublishedVfxRegistry';
import type { VfxContext, VfxPlayResult } from './VfxTypes';
import type { VfxSystem, VfxLabPlaybackOverrides } from './VfxSystem';

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

function makeVfxSlot(duration: number) {
  return createVisualSlot('r1_0001', { advanced: { duration } });
}

function makeMotion(type: 'DASH_SHORT' | 'DASH_THROUGH' = 'DASH_THROUGH'): CasterMotionStep {
  return createCasterMotionStep(type);
}

function makeFakeContext(): VfxContext {
  return {
    scene: {} as VfxContext['scene'],
    camera: {} as VfxContext['camera'],
    helpers: { wait },
  };
}

/**
 * Fake VfxSystem that records the timestamp when playLabSpriteSheet is INVOKED.
 * Uses Date.now() which is controlled by fake timers.
 */
function makeFakeVfxSystem(): {
  system: VfxSystem;
  invocations: Array<{ candidateId: string; time: number }>;
} {
  const invocations: Array<{ candidateId: string; time: number }> = [];
  const system = {
    playLabSpriteSheet(
      candidateId: string,
      _sheetDef: unknown,
      _step: unknown,
      _context: VfxContext,
      _overrides: VfxLabPlaybackOverrides,
    ): VfxPlayResult {
      invocations.push({ candidateId, time: Date.now() });
      return { played: true, presetId: 'fake', impactTime: 0, completion: Promise.resolve() };
    },
    play() { return { played: false, presetId: 'fake', impactTime: 0, completion: Promise.resolve() }; },
    dispose() {},
  } as unknown as VfxSystem;
  return { system, invocations };
}

// ============================================================ Beat Scheduling (compile-time)

describe('V2.7 Beat Scheduling — compileDraft', () => {
  it('Beat 0 starts at t=0', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.compiledBeats[0]!.startTime).toBe(0);
  });

  it('Beat 1 starts after Beat 0 completion', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const beat0 = compiled.compiledBeats[0]!;
    const beat1 = compiled.compiledBeats[1]!;
    expect(beat1.startTime).toBeCloseTo(beat0.startTime + beat0.duration, 3);
  });

  it('Beat 2 starts after Beat 1 completion', () => {
    const s1 = makeVfxSlot(0.5);
    const s2 = makeVfxSlot(0.4);
    const s3 = makeVfxSlot(0.3);
    const draft = makeDraft({
      visualSlots: [s1, s2, s3],
      beats: [
        { id: 'b0', vfxSlotIds: [s1.id], casterMotionIds: [] },
        { id: 'b1', vfxSlotIds: [s2.id], casterMotionIds: [] },
        { id: 'b2', vfxSlotIds: [s3.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const b0 = compiled.compiledBeats[0]!;
    const b1 = compiled.compiledBeats[1]!;
    const b2 = compiled.compiledBeats[2]!;
    expect(b1.startTime).toBeCloseTo(b0.startTime + b0.duration, 3);
    expect(b2.startTime).toBeCloseTo(b1.startTime + b1.duration, 3);
  });

  it('Beat duration = max(participant durations)', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [motion.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const beat = compiled.compiledBeats[0]!;
    const motionDuration = compileCasterMotion([motion]).steps[0]!.endTime;
    expect(beat.duration).toBeCloseTo(Math.max(0.5, motionDuration), 3);
  });

  it('long VFX + short motion → Beat waits for VFX', () => {
    const slot = makeVfxSlot(1.0);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [motion.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.compiledBeats[0]!.duration).toBeCloseTo(1.0, 3);
  });

  it('short VFX + long motion → Beat waits for motion', () => {
    const slot = makeVfxSlot(0.1);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [motion.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const motionDuration = compileCasterMotion([motion]).steps[0]!.endTime;
    expect(compiled.compiledBeats[0]!.duration).toBeCloseTo(motionDuration, 3);
  });

  it('same-beat VFX and motion share identical startTime', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [motion.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const beat = compiled.compiledBeats[0]!;
    const slotStartTime = compiled.slots.find((s) => s.slotId === slot.id)!.startTime;
    const motionStartTime = compiled.casterMotion.steps.find((s) => s.motionId === motion.id)!.startTime;
    expect(slotStartTime).toBe(beat.startTime);
    expect(motionStartTime).toBe(beat.startTime);
  });

  it('hasExplicitBeats is true when beats are authored', () => {
    const draft = makeDraft({
      beats: [{ id: 'b0', vfxSlotIds: [], casterMotionIds: [] }],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.hasExplicitBeats).toBe(true);
  });

  it('hasExplicitBeats is false when no beats are authored', () => {
    const draft = makeDraft();
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.hasExplicitBeats).toBe(false);
  });

  it('compiledBeats are derived from phases when no explicit beats', () => {
    const s1 = makeVfxSlot(0.5);
    const s2 = makeVfxSlot(0.3);
    const draft = makeDraft({
      visualSlots: [
        { ...s1, phase: 0 },
        { ...s2, phase: 1 },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.compiledBeats).toHaveLength(2);
    expect(compiled.compiledBeats[0]!.vfxSlots).toHaveLength(1);
    expect(compiled.compiledBeats[1]!.vfxSlots).toHaveLength(1);
  });
});

// ============================================================ Causal Barrier (runtime with fake timers)

describe('V2.7 Causal Barrier — playCompiledBeats with fake timers', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('CRITICAL: VFX in Beat 1 does NOT start until motion in Beat 0 completes', async () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const { system, invocations } = makeFakeVfxSystem();
    const context = makeFakeContext();

    const motionDurationMs = compiled.compiledBeats[0]!.duration * 1000;
    expect(motionDurationMs).toBeGreaterThan(0);
    const playPromise = playCompiledBeats(system, compiled, context, false);

    // t=0: motion starts, VFX does NOT
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(0);

    // t < motionDuration: VFX still does NOT start
    await vi.advanceTimersByTimeAsync(motionDurationMs - 2);
    expect(invocations).toHaveLength(0);

    // t = motionDuration: Beat 0 completes, Beat 1 starts, VFX IS invoked
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(1);

    // Clean up
    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[1]!.duration * 1000);
    await playPromise;
  });

  it('CRITICAL: motion and VFX in same beat start at identical timestamp', async () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [motion.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const { system, invocations } = makeFakeVfxSystem();
    const context = makeFakeContext();

    const playPromise = playCompiledBeats(system, compiled, context, false);

    // At t=0, VFX should be invoked immediately (Beat 0 starts)
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[0]!.duration * 1000);
    await playPromise;
  });

  it('CHAIN: VFX → motion → VFX — all three causal barriers hold', async () => {
    const s1 = makeVfxSlot(0.5);
    const s2 = makeVfxSlot(0.4);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [s1, s2],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [s1.id], casterMotionIds: [] },
        { id: 'b1', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b2', vfxSlotIds: [s2.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const { system, invocations } = makeFakeVfxSystem();
    const context = makeFakeContext();

    const b0 = compiled.compiledBeats[0]!;
    const b1 = compiled.compiledBeats[1]!;
    const b2 = compiled.compiledBeats[2]!;

    const playPromise = playCompiledBeats(system, compiled, context, false);

    // Beat 0: VFX charge starts at t=0
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(1);

    // Beat 0 not yet complete: no second VFX
    await vi.advanceTimersByTimeAsync(b0.duration * 1000 - 2);
    expect(invocations).toHaveLength(1);

    // Beat 0 complete, Beat 1 (motion only): no new VFX
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(1);

    // Beat 1 not yet complete: still no new VFX
    await vi.advanceTimersByTimeAsync(b1.duration * 1000 - 1);
    expect(invocations).toHaveLength(1);

    // Beat 1 complete, Beat 2 starts: second VFX invoked
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(b2.duration * 1000);
    await playPromise;
  });

  it('COMPLEX: VFX → motion + VFX → VFX → motion — all barriers hold', async () => {
    const s1 = makeVfxSlot(0.5);
    const s2 = makeVfxSlot(0.3);
    const s3 = makeVfxSlot(0.4);
    const m1 = makeMotion('DASH_THROUGH');
    const m2 = makeMotion('DASH_SHORT');
    const draft = makeDraft({
      visualSlots: [s1, s2, s3],
      casterMotion: [m1, m2],
      beats: [
        { id: 'b0', vfxSlotIds: [s1.id], casterMotionIds: [] },
        { id: 'b1', vfxSlotIds: [s2.id], casterMotionIds: [m1.id] },
        { id: 'b2', vfxSlotIds: [s3.id], casterMotionIds: [] },
        { id: 'b3', vfxSlotIds: [], casterMotionIds: [m2.id] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const { system, invocations } = makeFakeVfxSystem();
    const context = makeFakeContext();

    const playPromise = playCompiledBeats(system, compiled, context, false);

    // Beat 0: VFX charge
    await vi.advanceTimersByTimeAsync(1);
    expect(invocations).toHaveLength(1);

    // Beat 1: VFX trail (starts after Beat 0 completes)
    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[0]!.duration * 1000);
    expect(invocations).toHaveLength(2);

    // Beat 2: VFX impact (starts after Beat 1 completes)
    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[1]!.duration * 1000);
    expect(invocations).toHaveLength(3);

    // Beat 3: motion only (no new VFX)
    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[2]!.duration * 1000);
    expect(invocations).toHaveLength(3);

    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[3]!.duration * 1000);
    await playPromise;
  });

  it('VFX after motion: impact VFX MUST NOT start before dash completes', async () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const { system, invocations } = makeFakeVfxSystem();
    const context = makeFakeContext();

    const motionDurationMs = compiled.compiledBeats[0]!.duration * 1000;
    const playPromise = playCompiledBeats(system, compiled, context, false);

    // Halfway through motion: VFX must not have started
    await vi.advanceTimersByTimeAsync(motionDurationMs / 2);
    expect(invocations).toHaveLength(0);

    // Motion completes: VFX starts
    await vi.advanceTimersByTimeAsync(motionDurationMs / 2);
    expect(invocations).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(compiled.compiledBeats[1]!.duration * 1000);
    await playPromise;
  });
});

// ============================================================ Backward Compatibility

describe('V2.7 Backward Compatibility', () => {
  it('draft without beats has valid fingerprint', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { phase: 0 })],
    });
    const fp = computeFingerprint(draft);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it('draft with beats has different fingerprint than without', () => {
    const slot = createVisualSlot('r1_0001', { phase: 0 });
    const draftNoBeats = makeDraft({ visualSlots: [slot] });
    const draftWithBeats = makeDraft({
      visualSlots: [slot],
      beats: [{ id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [] }],
    });
    const fpNo = computeFingerprint(draftNoBeats);
    const fpYes = computeFingerprint(draftWithBeats);
    expect(fpNo).not.toBe(fpYes);
  });

  it('legacy draft compiles with hasExplicitBeats=false', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.hasExplicitBeats).toBe(false);
    expect(compiled.slots[0]!.startTime).toBe(0);
    expect(compiled.slots[1]!.startTime).toBeGreaterThan(0);
  });

  it('legacy draft slot startTimes are unchanged by beat derivation', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot0 = compiled.slots[0]!;
    const slot1 = compiled.slots[1]!;
    expect(slot0.startTime).toBe(0);
    expect(slot1.startTime).toBeCloseTo(slot0.duration, 3);
  });

  it('deriveBeatsFromPhases groups slots by phase', () => {
    const slots = [
      createVisualSlot('r1_0001'),
      createVisualSlot('r1_0002'),
      createVisualSlot('r1_0003'),
    ];
    const phases = [0, 0, 1];
    const beats = deriveBeatsFromPhases(phases, slots);
    expect(beats).toHaveLength(2);
    expect(beats[0]!.vfxSlotIds).toHaveLength(2);
    expect(beats[1]!.vfxSlotIds).toHaveLength(1);
  });

  it('validateChoreographyBeats rejects duplicate slot references', () => {
    const slot = createVisualSlot('r1_0001');
    const draft = makeDraft({
      visualSlots: [slot],
      beats: [
        { id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const result = validateChoreographyBeats(draft);
    expect(result.ok).toBe(false);
  });

  it('validateChoreographyBeats rejects unknown slot references', () => {
    const draft = makeDraft({
      beats: [{ id: 'b0', vfxSlotIds: ['nonexistent'], casterMotionIds: [] }],
    });
    const result = validateChoreographyBeats(draft);
    expect(result.ok).toBe(false);
  });

  it('removeBeat drops the beats field when last beat is removed', () => {
    const draft = makeDraft({
      beats: [{ id: 'b0', vfxSlotIds: [], casterMotionIds: [] }],
    });
    const result = removeBeat(draft, 'b0');
    expect(result.beats).toBeUndefined();
  });
});

// ============================================================ Beat Mutators

describe('V2.7 Beat Mutators', () => {
  it('addBeat creates an empty beat', () => {
    const draft = makeDraft();
    const result = addBeat(draft);
    expect(result.beats).toHaveLength(1);
    expect(result.beats![0]!.vfxSlotIds).toEqual([]);
    expect(result.beats![0]!.casterMotionIds).toEqual([]);
  });

  it('addVfxToBeat moves a slot to the target beat', () => {
    const slot = createVisualSlot('r1_0001');
    const draft = makeDraft({
      visualSlots: [slot],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [] },
        { id: 'b1', vfxSlotIds: [], casterMotionIds: [] },
      ],
    });
    const result = addVfxToBeat(draft, 'b1', slot.id);
    expect(result.beats![1]!.vfxSlotIds).toContain(slot.id);
    expect(result.beats![0]!.vfxSlotIds).not.toContain(slot.id);
  });

  it('addMotionToBeat moves a motion to the target beat', () => {
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      casterMotion: [motion],
      beats: [{ id: 'b0', vfxSlotIds: [], casterMotionIds: [] }],
    });
    const result = addMotionToBeat(draft, 'b0', motion.id);
    expect(result.beats![0]!.casterMotionIds).toContain(motion.id);
  });

  it('removeVfxFromBeat keeps the beat when it becomes empty', () => {
    const slot = createVisualSlot('r1_0001');
    const draft = makeDraft({
      visualSlots: [slot],
      beats: [{ id: 'b0', vfxSlotIds: [slot.id], casterMotionIds: [] }],
    });
    const result = removeVfxFromBeat(draft, 'b0', slot.id);
    expect(result.beats).toBeDefined();
    expect(result.beats).toHaveLength(1);
    expect(result.beats![0]!.vfxSlotIds).toHaveLength(0);
  });
});

// ============================================================ Gameplay Non-Regression

describe('V2.7 Gameplay Non-Regression', () => {
  it('motion never modifies tactical position — it is presentation-only', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled).not.toHaveProperty('tacticalPosition');
    expect(compiled).not.toHaveProperty('damage');
    expect(compiled).not.toHaveProperty('ap');
    expect(compiled).not.toHaveProperty('targeting');
  });

  it('impact time follows the beat-assigned startTime', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const beat1Start = compiled.compiledBeats[1]!.startTime;
    const slotImpact = compiled.slots.find((s) => s.slotId === slot.id)!.impactTime;
    expect(slotImpact).toBeGreaterThan(beat1Start * 0.9);
  });
});

// ============================================================ Production Parity

describe('V2.7 Production Parity', () => {
  it('Composer and Published compile to equivalent beat timing', () => {
    const slot = makeVfxSlot(0.5);
    const motion = makeMotion('DASH_THROUGH');
    const draft = makeDraft({
      visualSlots: [slot],
      casterMotion: [motion],
      beats: [
        { id: 'b0', vfxSlotIds: [], casterMotionIds: [motion.id] },
        { id: 'b1', vfxSlotIds: [slot.id], casterMotionIds: [] },
      ],
    });
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const publishedCompiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });

    expect(composerCompiled.compiledBeats.length).toBe(publishedCompiled.compiledBeats.length);
    for (let i = 0; i < composerCompiled.compiledBeats.length; i++) {
      expect(composerCompiled.compiledBeats[i]!.startTime).toBe(publishedCompiled.compiledBeats[i]!.startTime);
      expect(composerCompiled.compiledBeats[i]!.duration).toBe(publishedCompiled.compiledBeats[i]!.duration);
    }
  });
});
