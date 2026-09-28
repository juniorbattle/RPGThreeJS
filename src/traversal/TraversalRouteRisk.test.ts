// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { advanceRouteRun, createRouteRun, resetRouteSpeed } from './TraversalRouteRun';
import { createRouteRisk, resolveRouteRisk } from './TraversalRouteRisk';
import { TraversalRouteRiskRenderer } from './TraversalRouteRiskRenderer';
import { T0_ROUTE_HAZARDS, t0RouteHazards } from './TraversalT0Risk';
import { resolveT0RouteSegment } from './TraversalT0CheckpointRoute';

describe('T0 Route risk authoring', () => {
  it('is deterministic, uniquely identified, lane-bound and clear of route edges', () => {
    expect(t0RouteHazards('route-1')).toEqual(t0RouteHazards('route-1'));
    expect(new Set(T0_ROUTE_HAZARDS.map(hazard => hazard.id)).size).toBe(T0_ROUTE_HAZARDS.length);
    expect(T0_ROUTE_HAZARDS.every(hazard => [0, 1].includes(hazard.lane)
      && hazard.progress01 >= .18 && hazard.progress01 <= .82)).toBe(true);
    expect(T0_ROUTE_HAZARDS.map(hazard => hazard.segmentId))
      .toContain('route-5a');
    expect(T0_ROUTE_HAZARDS.map(hazard => hazard.segmentId))
      .toContain('route-5b');
  });

  it('passes the opposite lane, collides once in its lane, and respects pre-contact steering', () => {
    const hazard = t0RouteHazards('route-1')[0]!;
    const initial = createRouteRisk('route-1');
    const safe = resolveRouteRisk(initial, [hazard], .3, .4, 1, true);
    expect(safe.outcomes.map(outcome => outcome.result)).toEqual(['PASSED']);
    expect(safe.state.collisionCount).toBe(0);
    const hit = resolveRouteRisk(initial, [hazard], .3, .4, 0, true);
    expect(hit.outcomes.map(outcome => outcome.result)).toEqual(['COLLISION']);
    expect(hit.state).toMatchObject({ collisionCount: 1, lastCollisionId: hazard.id,
      resolvedHazardIds: [hazard.id] });
    expect(initial.resolvedHazardIds).toEqual([]);
    expect(resolveRouteRisk(hit.state, [hazard], .3, .6, 0, true).outcomes).toEqual([]);
    expect(resolveRouteRisk(initial, [hazard], .3, .4, 0, false).state).toBe(initial);
    expect(resolveRouteRisk(initial, [hazard], .3, .37, 0, true).outcomes).toEqual([]);
  });

  it('keeps canonical RouteRun time and progress independent of collision resolution', () => {
    const segment = resolveT0RouteSegment(0);
    const before = advanceRouteRun(createRouteRun(segment, 0),  segment, 4000);
    const after = advanceRouteRun(before, segment, 1000);
    const risk = resolveRouteRisk(createRouteRisk(segment.id), t0RouteHazards(segment.id),
      before.progress01, after.progress01, 0, true);
    expect(risk.state.collisionCount).toBe(1);
    const slowed = resetRouteSpeed(after, segment);
    expect(slowed.elapsedMs).toBe(after.elapsedMs);
    expect(slowed.progress01).toBe(after.progress01);
    expect(advanceRouteRun(slowed, segment, 1000).progress01)
      .toBe(advanceRouteRun(after, segment, 1000).progress01);
  });

  it('clears old marks and impact when a new segment starts', () => {
    const renderer = new TraversalRouteRiskRenderer();
    const vehicle = document.createElement('div');
    renderer.bindVehicle(vehicle);
    renderer.reset(t0RouteHazards('route-1'));
    renderer.impact(t0RouteHazards('route-1')[0]!, 4000);
    expect(vehicle.classList.contains('traversal-vehicle--risk-impact')).toBe(true);
    renderer.reset(t0RouteHazards('route-2'));
    expect(renderer.element.querySelector('[data-risk-hazard="t0:r1:branch-1"]')).toBeNull();
    expect(renderer.element.querySelectorAll('[data-risk-hazard]')).toHaveLength(1);
    expect(vehicle.classList.contains('traversal-vehicle--risk-impact')).toBe(false);
    expect(createRouteRisk('route-2').resolvedHazardIds).toEqual([]);
  });
});
