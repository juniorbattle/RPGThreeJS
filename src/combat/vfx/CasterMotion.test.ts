import { describe, it, expect } from 'vitest';
import {
  CASTER_MOTION_DEFAULTS,
  CASTER_MOTION_TYPES,
  buildUnifiedTimeline,
  compileCasterMotion,
  createCasterMotionStep,
  easeCasterMotion,
  resolveCasterMotionStep,
  resolveMotionAnchor,
  sampleCasterMotionOffset,
  validateCasterMotion,
  validateCasterMotionStep,
  type CasterMotionAnchorResolver,
  type CasterMotionStep,
  type CompiledCasterMotion,
  type MutableVec3,
} from './CasterMotion';

/**
 * Test resolver placing the target 4 units along +X from the caster.
 * FRONT/BACK resolution is a runtime (Stage) concern, so the pure layer is
 * exercised with a plain target vector.
 */
const resolver: CasterMotionAnchorResolver = (anchor, out) => {
  out.x = 0;
  out.y = 0;
  out.z = 0;
  if (anchor === 'target') out.x = 4;
  if (anchor === 'targetFront') out.x = 3;
  if (anchor === 'targetBack') out.x = 5;
};

function sampleAt(steps: CasterMotionStep[], t: number): MutableVec3;
function sampleAt(compiled: CompiledCasterMotion, t: number): MutableVec3;
function sampleAt(input: CasterMotionStep[] | CompiledCasterMotion, t: number): MutableVec3 {
  const out: MutableVec3 = { x: 0, y: 0, z: 0 };
  const compiled = Array.isArray(input) ? compileCasterMotion(input) : input;
  sampleCasterMotionOffset(compiled, t, resolver, out);
  return out;
}

function step(type: Parameters<typeof createCasterMotionStep>[0], overrides = {}): CasterMotionStep {
  return createCasterMotionStep(type, overrides);
}

describe('CasterMotion — authoring model', () => {
  it('exposes the canonical linked-motion vocabulary without legacy IDLE', () => {
    expect([...CASTER_MOTION_TYPES]).toEqual([
      'HOLD', 'DASH_SHORT', 'DASH_THROUGH', 'JUMP_UP', 'JUMP_DOWN', 'JUMP_ARC',
    ]);
  });

  it('stores only explicitly overridden fields so a bare step stays minimal', () => {
    const bare = createCasterMotionStep('DASH_SHORT');
    expect(Object.keys(bare).sort()).toEqual(['id', 'type']);
  });

  it('gives every motion type a usable default set', () => {
    for (const type of CASTER_MOTION_TYPES) {
      const defaults = CASTER_MOTION_DEFAULTS[type];
      expect(defaults.duration).toBeGreaterThan(0);
      expect(defaults.distance).toBeGreaterThanOrEqual(0);
      expect(defaults.distance).toBeLessThanOrEqual(1);
    }
  });

  it('resolves defaults per type when fields are absent', () => {
    const resolved = resolveCasterMotionStep(createCasterMotionStep('DASH_THROUGH'));
    expect(resolved.duration).toBe(CASTER_MOTION_DEFAULTS.DASH_THROUGH.duration);
    expect(resolved.destination).toBe('TARGET_BACK');
    expect(resolved.returnToOrigin).toBe(false);
  });

  it('clamps hostile numeric input instead of throwing', () => {
    const resolved = resolveCasterMotionStep({
      id: 'm', type: 'DASH_SHORT', distance: 99, duration: -5, height: -3,
    });
    expect(resolved.distance).toBe(1);
    expect(resolved.duration).toBeGreaterThan(0);
    expect(resolved.height).toBe(0);
  });

  it('maps destinations onto the existing semantic anchor vocabulary', () => {
    expect(resolveMotionAnchor('ORIGIN')).toBe('source');
    expect(resolveMotionAnchor('TARGET')).toBe('target');
    expect(resolveMotionAnchor('TARGET_FRONT')).toBe('targetFront');
    expect(resolveMotionAnchor('TARGET_BACK')).toBe('targetBack');
  });
});

describe('CasterMotion — validation', () => {
  it('accepts a well-formed step', () => {
    expect(validateCasterMotionStep(createCasterMotionStep('JUMP_ARC')).ok).toBe(true);
  });

  it('rejects unknown types, bad enums and non-finite numbers', () => {
    expect(validateCasterMotionStep({ id: 'a', type: 'TELEPORT' }).ok).toBe(false);
    expect(validateCasterMotionStep({ id: 'a', type: 'IDLE', easing: 'BOUNCE' }).ok).toBe(false);
    expect(validateCasterMotionStep({ id: 'a', type: 'IDLE', duration: NaN }).ok).toBe(false);
    expect(validateCasterMotionStep({ id: '', type: 'IDLE' }).ok).toBe(false);
  });

  it('treats an absent motion list as valid — legacy drafts must always load', () => {
    expect(validateCasterMotion(undefined).ok).toBe(true);
    expect(validateCasterMotion([]).ok).toBe(true);
  });

  it('detects duplicate motion ids', () => {
    const result = validateCasterMotion([
      { id: 'dup', type: 'IDLE' },
      { id: 'dup', type: 'IDLE' },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('duplicate');
  });
});

describe('CasterMotion — compilation', () => {
  it('compiles an absent list to a shared empty plan with no effect', () => {
    const compiled = compileCasterMotion(undefined);
    expect(compiled.steps).toHaveLength(0);
    expect(compiled.hasEffect).toBe(false);
    expect(compiled.totalDuration).toBe(0);
  });

  it('orders steps by authored index when no startTimeOverrides are given', () => {
    const compiled = compileCasterMotion([
      { id: 'a', type: 'DASH_SHORT' },
      { id: 'b', type: 'DASH_SHORT' },
      { id: 'c', type: 'DASH_SHORT' },
    ]);
    expect(compiled.steps.map((s) => s.motionId)).toEqual(['a', 'b', 'c']);
  });

  it('orders steps by startTimeOverrides when provided', () => {
    const overrides = new Map([['late', 0.5], ['tieB', 0.1], ['tieA', 0.1]]);
    const compiled = compileCasterMotion([
      { id: 'late', type: 'DASH_SHORT' },
      { id: 'tieB', type: 'DASH_SHORT' },
      { id: 'tieA', type: 'DASH_SHORT' },
    ], overrides);
    expect(compiled.steps.map((s) => s.motionId)).toEqual(['tieB', 'tieA', 'late']);
  });

  it('extends endTime by the return leg only when returnToOrigin is set', () => {
    const overrides = new Map([['a', 1], ['b', 1]]);
    const [held] = compileCasterMotion([
      { id: 'a', type: 'DASH_SHORT', duration: 0.2, returnToOrigin: false },
    ], overrides).steps;
    const [returned] = compileCasterMotion([
      { id: 'b', type: 'DASH_SHORT', duration: 0.2, returnToOrigin: true },
    ], overrides).steps;
    expect(held!.endTime).toBeCloseTo(1.2, 6);
    expect(returned!.endTime).toBeCloseTo(1.4, 6);
  });

  it('flags IDLE and zero-amplitude steps as no-ops', () => {
    expect(compileCasterMotion([step('IDLE')]).hasEffect).toBe(false);
    expect(compileCasterMotion([step('DASH_SHORT', { distance: 0 })]).hasEffect).toBe(false);
    expect(compileCasterMotion([step('JUMP_UP', { height: 0 })]).hasEffect).toBe(false);
    expect(compileCasterMotion([step('DASH_SHORT')]).hasEffect).toBe(true);
  });

  it('is deterministic — identical input compiles to identical output', () => {
    const steps: CasterMotionStep[] = [
      { id: 'a', type: 'JUMP_ARC' },
      { id: 'b', type: 'DASH_THROUGH' },
    ];
    expect(JSON.stringify(compileCasterMotion(steps)))
      .toBe(JSON.stringify(compileCasterMotion(steps)));
  });
});

describe('CasterMotion — sampling', () => {
  it('produces exactly zero offset before the first motion starts', () => {
    const overrides = new Map([['m', 1]]);
    expect(sampleAt(compileCasterMotion([step('DASH_SHORT', { duration: 0.2 })], overrides), 0)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('produces exactly zero offset for an empty plan at any time', () => {
    for (const t of [0, 0.5, 5, 1000]) {
      expect(sampleAt([], t)).toEqual({ x: 0, y: 0, z: 0 });
    }
  });

  it('DASH_SHORT travels only its authored fraction toward the target', () => {
    const steps = [step('DASH_SHORT', { duration: 0.2, distance: 0.5, returnToOrigin: false })];
    // Target is +4 on X, so half the distance is +2.
    expect(sampleAt(steps, 0.2).x).toBeCloseTo(2, 6);
  });

  it('DASH_THROUGH ends past the target when aimed at TARGET_BACK', () => {
    const steps = [step('DASH_THROUGH', { duration: 0.3 })];
    // TARGET_BACK resolves to +5, beyond the target's +4.
    expect(sampleAt(steps, 0.3).x).toBeCloseTo(5, 6);
  });

  it('holds the final position after the motion when returnToOrigin is false', () => {
    const steps = [step('DASH_THROUGH', { duration: 0.3, returnToOrigin: false })];
    expect(sampleAt(steps, 5).x).toBeCloseTo(5, 6);
  });

  it('returns exactly to origin after the return leg when returnToOrigin is true', () => {
    const steps = [step('DASH_SHORT', { duration: 0.2, returnToOrigin: true })];
    const settled = sampleAt(steps, 10);
    expect(settled.x).toBeCloseTo(0, 6);
    expect(settled.y).toBeCloseTo(0, 6);
    expect(settled.z).toBeCloseTo(0, 6);
  });

  it('JUMP_UP moves vertically only and never horizontally', () => {
    const steps = [step('JUMP_UP', { duration: 0.25, height: 1, returnToOrigin: false })];
    const at = sampleAt(steps, 0.25);
    expect(at.y).toBeCloseTo(1, 6);
    expect(at.x).toBeCloseTo(0, 6);
    expect(at.z).toBeCloseTo(0, 6);
  });

  it('JUMP_DOWN starts elevated and lands at zero height', () => {
    const steps = [step('JUMP_DOWN', { duration: 0.2, height: 2, distance: 0 })];
    expect(sampleAt(steps, 0).y).toBeCloseTo(2, 6);
    expect(sampleAt(steps, 0.2).y).toBeCloseTo(0, 6);
  });

  it('JUMP_ARC peaks at mid-flight and lands flat at both ends', () => {
    const steps = [step('JUMP_ARC', { duration: 0.4, height: 1, distance: 1 })];
    expect(sampleAt(steps, 0).y).toBeCloseTo(0, 6);
    expect(sampleAt(steps, 0.2).y).toBeCloseTo(1, 6);
    expect(sampleAt(steps, 0.4).y).toBeCloseTo(0, 6);
  });

  it('accumulates residuals so a later motion starts from where the previous ended', () => {
    const overrides = new Map([['a', 0], ['b', 0.3]]);
    const compiled = compileCasterMotion([
      step('DASH_THROUGH', { duration: 0.2, returnToOrigin: false }),
      step('JUMP_UP', { duration: 0.2, height: 1, returnToOrigin: false }),
    ], overrides);
    const airborne = sampleAt(compiled, 0.5);
    // Still behind the target from the dash, and now also elevated.
    expect(airborne.x).toBeCloseTo(5, 6);
    expect(airborne.y).toBeCloseTo(1, 6);
  });

  it('does not accumulate a residual for a motion that returned to origin', () => {
    const overrides = new Map([['a', 0], ['b', 0.5]]);
    const compiled = compileCasterMotion([
      step('DASH_SHORT', { duration: 0.1, returnToOrigin: true }),
      step('JUMP_UP', { duration: 0.1, height: 1, returnToOrigin: false }),
    ], overrides);
    const after = sampleAt(compiled, 0.6);
    expect(after.x).toBeCloseTo(0, 6);
    expect(after.y).toBeCloseTo(1, 6);
  });

  it('never mutates the compiled plan while sampling', () => {
    const compiled = compileCasterMotion([step('JUMP_ARC', { duration: 0.4 })]);
    const before = JSON.stringify(compiled);
    const out: MutableVec3 = { x: 0, y: 0, z: 0 };
    for (let t = 0; t < 1; t += 0.05) sampleCasterMotionOffset(compiled, t, resolver, out);
    expect(JSON.stringify(compiled)).toBe(before);
  });

  it('allocates nothing per sample — the same out object is reused and returned', () => {
    const compiled = compileCasterMotion([step('DASH_SHORT')]);
    const out: MutableVec3 = { x: 0, y: 0, z: 0 };
    expect(sampleCasterMotionOffset(compiled, 0.1, resolver, out)).toBe(out);
  });

  it('stays finite across a dense sweep of every motion type', () => {
    for (const type of CASTER_MOTION_TYPES) {
      const compiled = compileCasterMotion([step(type, { duration: 0.1 })]);
      const out: MutableVec3 = { x: 0, y: 0, z: 0 };
      for (let t = -0.5; t <= 3; t += 0.017) {
        sampleCasterMotionOffset(compiled, t, resolver, out);
        expect(Number.isFinite(out.x)).toBe(true);
        expect(Number.isFinite(out.y)).toBe(true);
        expect(Number.isFinite(out.z)).toBe(true);
      }
    }
  });
});

describe('CasterMotion — easing', () => {
  it('pins every easing curve to 0 and 1 at the endpoints', () => {
    for (const easing of ['LINEAR', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT'] as const) {
      expect(easeCasterMotion(easing, 0)).toBeCloseTo(0, 6);
      expect(easeCasterMotion(easing, 1)).toBeCloseTo(1, 6);
    }
  });

  it('clamps progress outside 0..1', () => {
    expect(easeCasterMotion('LINEAR', -5)).toBe(0);
    expect(easeCasterMotion('LINEAR', 5)).toBe(1);
  });

  it('is monotonically non-decreasing', () => {
    for (const easing of ['LINEAR', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT'] as const) {
      let previous = -Infinity;
      for (let p = 0; p <= 1.0001; p += 0.01) {
        const value = easeCasterMotion(easing, p);
        expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
        previous = value;
      }
    }
  });
});

describe('CasterMotion — unified timeline', () => {
  const slots = [
    { slotId: 's1', candidateId: 'r1_0001', startTime: 0, duration: 0.3 },
    { slotId: 's2', candidateId: 'r1_0002', startTime: 0.6, duration: 0.3 },
  ];

  it('returns only VFX events when no motion is authored', () => {
    const timeline = buildUnifiedTimeline(slots);
    expect(timeline).toHaveLength(2);
    expect(timeline.every((e) => e.kind === 'VFX')).toBe(true);
  });

  it('interleaves VFX and MOTION on one shared clock in time order', () => {
    const motion = compileCasterMotion([
      { id: 'm1', type: 'DASH_SHORT', duration: 0.15, returnToOrigin: false },
    ], new Map([['m1', 0.35]]));
    const timeline = buildUnifiedTimeline(slots, motion);
    expect(timeline.map((e) => e.kind)).toEqual(['VFX', 'MOTION', 'VFX']);
    expect(timeline.map((e) => e.id)).toEqual(['s1', 'm1', 's2']);
  });

  it('places VFX before MOTION deterministically at identical start times', () => {
    const motion = compileCasterMotion([{ id: 'm1', type: 'DASH_SHORT' }], new Map([['m1', 0]]));
    const timeline = buildUnifiedTimeline(slots, motion);
    expect(timeline[0]!.kind).toBe('VFX');
    expect(timeline[1]!.kind).toBe('MOTION');
  });

  it('is stable across repeated builds', () => {
    const motion = compileCasterMotion([{ id: 'm1', type: 'JUMP_ARC' }], new Map([['m1', 0.2]]));
    expect(JSON.stringify(buildUnifiedTimeline(slots, motion)))
      .toBe(JSON.stringify(buildUnifiedTimeline(slots, motion)));
  });
});
