import { describe, expect, it } from 'vitest';
import { advancePursuitCharge, createPursuitCharge, type TraversalChargeGeometry } from './TraversalPursuitCharge';

const initial = () => createPursuitCharge({ windowId: 'authored-window', lane: 0,
  left: 0, speed: 20, acceleration: 40 });
const geometry: TraversalChargeGeometry = { caravanLane: 1, caravanLeft: 100,
  caravanRight: 140, pursuerWidth: 30, viewportRight: 400 };

describe('unwired committed Pursuit charge', () => {
  it('accelerates without lane retargeting and is invariant to stable-input step subdivision', () => {
    const whole = advancePursuitCharge(initial(), 1, geometry).state;
    let divided = initial();
    for (let i = 0; i < 20; i++) divided = advancePursuitCharge(divided, .05, geometry).state;
    expect(divided.left).toBeCloseTo(whole.left, 10);
    expect(divided.speed).toBeCloseTo(whole.speed, 10);
    expect(divided.elapsedSeconds).toBeCloseTo(whole.elapsedSeconds, 10);
    expect(whole.lane).toBe(0); expect(whole.speed).toBe(60); expect(whole.phase).toBe('CHARGING');
    expect(Object.isFrozen(whole)).toBe(true);
  });

  it('observes swept same-lane contact before an exit in one large step, then freezes unresolved', () => {
    const same = { ...geometry, caravanLane: 0 as const };
    const whole = advancePursuitCharge(initial(), 100, same);
    expect(whole.state.phase).toBe('COLLISION_PENDING'); expect(whole.state.left).toBe(70);
    expect(whole.observations).toEqual([{ windowId: 'authored-window', lane: 0, kind: 'CONTACT' }]);
    let divided = initial(); let contacts = 0;
    for (let i = 0; i < 100; i++) {
      const next = advancePursuitCharge(divided, .1, same); divided = next.state;
      contacts += next.observations.length;
    }
    expect(contacts).toBe(1); expect(divided.left).toBe(whole.state.left);
    expect(divided.speed).toBeCloseTo(whole.state.speed, 10);
    expect(divided.elapsedSeconds).toBeCloseTo(whole.state.elapsedSeconds, 10);
    expect(advancePursuitCharge(whole.state, 100, geometry)).toEqual({ state: whole.state, observations: [] });
  });

  it('lets a genuine lane miss overtake and fully exit, stopping at the exact boundary once', () => {
    const beforeExit = advancePursuitCharge(initial(), 3, geometry);
    expect(beforeExit.state.left).toBe(240); expect(beforeExit.state.left).toBeGreaterThan(geometry.caravanRight);
    expect(beforeExit.observations).toEqual([]); expect(beforeExit.state.phase).toBe('CHARGING');
    const whole = advancePursuitCharge(initial(), 100, geometry);
    expect(whole.state.phase).toBe('EXITED'); expect(whole.state.left).toBe(geometry.viewportRight);
    expect(whole.observations).toEqual([{ windowId: 'authored-window', lane: 0, kind: 'MISS_EXITED' }]);
    let divided = initial();
    for (let i = 0; i < 100; i++) divided = advancePursuitCharge(divided, .1, geometry).state;
    expect(divided.elapsedSeconds).toBeCloseTo(whole.state.elapsedSeconds, 10);
    expect(divided.speed).toBeCloseTo(whole.state.speed, 10);
    expect(advancePursuitCharge(whole.state, 1, geometry).observations).toEqual([]);
  });

  it('freezes inactive/zero steps and handles a lane change only at the next input boundary', () => {
    const charge = initial();
    expect(advancePursuitCharge(charge, 100, geometry, false).state).toBe(charge);
    expect(advancePursuitCharge(charge, 0, geometry).state).toBe(charge);
    const approaching = advancePursuitCharge(charge, 1, geometry).state;
    const contact = advancePursuitCharge(approaching, 1, { ...geometry, caravanLane: 0 });
    expect(contact.state.phase).toBe('COLLISION_PENDING'); expect(contact.state.lane).toBe(0);
  });

  it('uses updated viewport geometry before exit and never retroactively catches an overtaken caravan', () => {
    const approaching = advancePursuitCharge(initial(), 3, geometry).state;
    const widened = { ...geometry, viewportRight: 800, caravanLane: 0 as const };
    const step = advancePursuitCharge(approaching, 1, widened);
    expect(step.state.phase).toBe('CHARGING'); expect(step.observations).toEqual([]);
    const exit = advancePursuitCharge(step.state, 100, widened);
    expect(exit.state.left).toBe(800); expect(exit.observations[0]?.kind).toBe('MISS_EXITED');
  });

  it('rejects malformed authored inputs and non-finite/negative steps or geometry', () => {
    for (const patch of [{ windowId: ' ' }, { left: NaN }, { speed: 0 }, { acceleration: -1 }]) {
      expect(() => createPursuitCharge({ ...initial(), ...patch })).toThrow('Invalid authored');
    }
    for (const seconds of [-1, NaN, Infinity]) expect(() => advancePursuitCharge(initial(), seconds, geometry)).toThrow('Invalid Pursuit');
    for (const patch of [{ pursuerWidth: 0 }, { viewportRight: Infinity }, { caravanRight: 100 }]) {
      expect(() => advancePursuitCharge(initial(), 1, { ...geometry, ...patch })).toThrow('Invalid Pursuit');
    }
  });

  it('rejects an offscreen target or arithmetic overflow instead of reporting a false miss', () => {
    expect(() => advancePursuitCharge(initial(), 100, { ...geometry,
      caravanLeft: 500, caravanRight: 540 })).toThrow('Invalid Pursuit');
    expect(() => createPursuitCharge({ ...initial(), speed: Number.MAX_VALUE })).toThrow('Invalid authored');
    const hugeAcceleration = createPursuitCharge({ ...initial(), acceleration: Number.MAX_VALUE });
    expect(() => advancePursuitCharge(hugeAcceleration, 1, geometry)).toThrow('Invalid Pursuit charge arithmetic');
  });
});
