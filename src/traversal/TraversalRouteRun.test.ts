import { describe, expect, it } from 'vitest';
import { advanceRouteRun, baseRouteSpeedAt, completeRouteSegment, createRouteRun,
  resetRouteSpeed, routeSpeedRecovery01, setRouteLane } from './TraversalRouteRun';
import { resolveT0RouteSegment, T0_ROUTE_DRIVING_MS, T0_ROUTE_SEGMENTS } from './TraversalT0CheckpointRoute';

const segment = T0_ROUTE_SEGMENTS[0]!;

describe('TraversalRouteRun', () => {
  it('starts at minimum speed and advances deterministically without campaign state', () => {
    const initial = createRouteRun(segment, 0);
    expect(initial).toMatchObject({ segmentId: 'route-1', elapsedMs: 0, progress01: 0,
      speed: segment.vMin, lane: 0, complete: false });
    const first = advanceRouteRun(initial, segment, segment.durationMs / 2);
    expect(first).toEqual(advanceRouteRun(initial, segment, segment.durationMs / 2));
    expect(initial.elapsedMs).toBe(0);
    expect(Object.keys(first)).not.toContain('campaign');
    expect(first.progress01).toBe(.5);
    expect(first.speed).toBeGreaterThan(segment.vMin);
    expect(first.speed).toBeLessThan(segment.vMax);
    expect(advanceRouteRun(first, segment, 0)).toBe(first);
  });

  it('crescendos, clamps a huge delta, and completes once', () => {
    const initial = createRouteRun(segment, 0);
    const at10 = advanceRouteRun(initial, segment, segment.durationMs * .1);
    const at50 = advanceRouteRun(at10, segment, segment.durationMs * .4);
    const at90 = advanceRouteRun(at50, segment, segment.durationMs * .4);
    expect(at10.speed).toBeLessThan(at50.speed);
    expect(at50.speed).toBeLessThan(at90.speed);
    const done = advanceRouteRun(at90, segment, 1e9);
    expect(done).toMatchObject({ progress01: 1, elapsedMs: segment.durationMs,
      speed: segment.vMax, complete: true });
    expect(advanceRouteRun(done, segment, 100)).toBe(done);
    expect(completeRouteSegment(initial, segment)).toEqual(done);
  });

  it('resets speed without rewinding progress; lane selection has no timing effect', () => {
    const half = advanceRouteRun(createRouteRun(segment, 0), segment, segment.durationMs / 2);
    const reset = resetRouteSpeed(half, segment);
    expect(reset.speed).toBe(segment.vMin);
    expect(reset.progress01).toBe(.5);
    const upper = advanceRouteRun(setRouteLane(reset, 0), segment, 1000);
    const lower = advanceRouteRun(setRouteLane(reset, 1), segment, 1000);
    expect(lower.progress01).toBe(upper.progress01);
    expect(lower.speed).toBe(upper.speed);
    expect(lower.lane).toBe(1);
  });

  it('recovers toward the absolute crescendo within a bounded window, even after a second hit', () => {
    const recoverySegment = resolveT0RouteSegment(5);
    const late = advanceRouteRun(createRouteRun(recoverySegment, 5), recoverySegment, 15000);
    const reset = resetRouteSpeed(late, recoverySegment);
    expect(reset.speed).toBe(recoverySegment.vMin);
    expect(reset.progress01).toBe(.75);
    expect(routeSpeedRecovery01(reset, recoverySegment)).toBe(0);
    const afterOneSecond = advanceRouteRun(reset, recoverySegment, 1000);
    expect(afterOneSecond.speed).toBeGreaterThan(recoverySegment.vMin);
    expect(afterOneSecond.speed).toBeLessThan(baseRouteSpeedAt(recoverySegment, 16000));
    const resetAgain = resetRouteSpeed(afterOneSecond, recoverySegment);
    expect(resetAgain.speed).toBe(recoverySegment.vMin);
    expect(resetAgain.progress01).toBe(afterOneSecond.progress01);
    const recovered = advanceRouteRun(resetAgain, recoverySegment, 2400);
    expect(routeSpeedRecovery01(recovered, recoverySegment)).toBe(1);
    expect(recovered.speed).toBeCloseTo(baseRouteSpeedAt(recoverySegment, recovered.elapsedMs));
    const complete = completeRouteSegment(recovered, recoverySegment);
    expect(resetRouteSpeed(complete, recoverySegment)).toBe(complete);
  });

  it('rejects invalid duration, speed, delta, and a mismatched segment', () => {
    expect(() => createRouteRun({ ...segment, durationMs: 0 }, 0)).toThrow();
    expect(() => createRouteRun({ ...segment, durationMs: Number.NaN }, 0)).toThrow();
    expect(() => createRouteRun({ ...segment, vMax: .5 }, 0)).toThrow();
    expect(() => advanceRouteRun(createRouteRun(segment, 0), segment, -1)).toThrow();
    expect(() => advanceRouteRun(createRouteRun(segment, 0), segment, Number.NaN)).toThrow();
    expect(() => advanceRouteRun(createRouteRun(segment, 0), { ...segment, id: 'other' }, 1)).toThrow();
  });
});

describe('T0 checkpoint route data', () => {
  it('has six routes, five authored stops, and branch-specific Route 5', () => {
    expect(T0_ROUTE_SEGMENTS.map(route => route.checkpointKind))
      .toEqual(['CANONICAL', 'CANONICAL', 'CANONICAL', 'FORK', 'BRANCH', 'ARRIVAL']);
    expect(T0_ROUTE_DRIVING_MS).toBe(89000);
    expect(resolveT0RouteSegment(4, 'lion-first-trial-event').id).toBe('route-5a');
    expect(resolveT0RouteSegment(4, 'lion-first-trial-combat').id).toBe('route-5b');
    expect(() => resolveT0RouteSegment(4)).toThrow();
  });
});
