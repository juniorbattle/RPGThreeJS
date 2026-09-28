// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { advanceRouteRun, createRouteRun, resetRouteSpeed, DEFAULT_ROUTE_SPEED_RECOVERY_MS } from './TraversalRouteRun';
import { createRouteRisk, resolveRouteRisk } from './TraversalRouteRisk';
import { TraversalRouteRiskRenderer } from './TraversalRouteRiskRenderer';
import { resolveRouteRiskVisual } from './TraversalRouteRiskVisual';
import { T0_ROUTE_HAZARDS, t0RouteHazards } from './TraversalT0Risk';
import { resolveT0RouteSegment, T0_ROUTE_SEGMENTS } from './TraversalT0CheckpointRoute';

describe('T0 Route risk authoring', () => {
  it('locks approved authoring, route clocks, recovery, and ephemeral module boundaries', () => {
    expect(T0_ROUTE_HAZARDS.map(({ id, segmentId, progress01, lane }) =>
      [id, segmentId, progress01, lane])).toEqual([
      ['t0:r1:branch-1', 'route-1', .38, 0],
      ['t0:r2:branch-1', 'route-2', .48, 1],
      ['t0:r3:branch-1', 'route-3', .32, 0],
      ['t0:r3:block-2', 'route-3', .68, 1],
      ['t0:r4:block-1', 'route-4', .31, 1],
      ['t0:r4:branch-2', 'route-4', .68, 0],
      ['t0:r5a:branch-1', 'route-5a', .30, 0],
      ['t0:r5a:block-2', 'route-5a', .66, 1],
      ['t0:r5b:block-1', 'route-5b', .27, 1],
      ['t0:r5b:branch-2', 'route-5b', .53, 0],
      ['t0:r5b:block-3', 'route-5b', .68, 1],
      ['t0:r6:branch-1', 'route-6', .24, 0],
      ['t0:r6:block-2', 'route-6', .49, 1],
      ['t0:r6:branch-3', 'route-6', .75, 0],
    ]);
    expect(T0_ROUTE_SEGMENTS.map(segment => segment.durationMs))
      .toEqual([12000, 15000, 15000, 12000, 15000, 20000]);
    expect(DEFAULT_ROUTE_SPEED_RECOVERY_MS).toBe(2400);
    for (const name of ['TraversalRouteRisk.ts', 'TraversalT0Risk.ts',
      'TraversalRouteRiskRenderer.ts', 'TraversalRouteRiskVisual.ts']) {
      const source = readFileSync(resolve(process.cwd(), 'src/traversal', name), 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*(?:game|campaign|save)[^'"]*['"]/i);
    }
  });
  it('resolves all authored hazards to deterministic, transparent production images', () => {
    const visualNames = new Set<string>();
    for (const hazard of T0_ROUTE_HAZARDS) {
      const visual = resolveRouteRiskVisual(hazard);
      expect(resolveRouteRiskVisual(hazard)).toEqual(visual);
      expect(['fallen-branch', 'boulder', 'roadblock']).toContain(visual.kind);
      expect(['a', 'b']).toContain(visual.variant);
      expect(visual.src).toBe(`/assets/generated/lion-phase/traversal/t0/risk/${visual.kind}-${visual.variant}.png`);
      visualNames.add(`${visual.kind}-${visual.variant}`);
    }
    expect(resolveRouteRiskVisual(t0RouteHazards('route-3')[1]!).kind).toBe('boulder');
    expect(resolveRouteRiskVisual(t0RouteHazards('route-4')[0]!).kind).toBe('boulder');
    expect(resolveRouteRiskVisual(t0RouteHazards('route-5b')[0]!).kind).toBe('roadblock');
    for (const kind of ['fallen-branch', 'boulder', 'roadblock']) {
      for (const variant of ['a', 'b']) {
        const name = `${kind}-${variant}`;
        expect(visualNames.has(name)).toBe(true);
        const path = resolve(process.cwd(), 'public/assets/generated/lion-phase/traversal/t0/risk', `${name}.png`);
        expect(existsSync(path)).toBe(true);
        const png = readFileSync(path);
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        expect(png.readUInt32BE(16)).toBeGreaterThan(200);
        expect(png.readUInt32BE(20)).toBeGreaterThan(150);
        expect(png[25]).toBe(6); // RGBA
      }
    }
  });

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
    renderer.update(t0RouteHazards('route-1'), createRouteRisk('route-1'), .2,
      2400, 12000, 0, 1000, true, () => 1200);
    const internals = renderer as unknown as {
      marks: Map<string, HTMLElement>; contactDistances: Map<string, number>;
    };
    expect(internals.marks.size).toBe(1);
    expect(internals.contactDistances.size).toBe(1);
    renderer.impact(t0RouteHazards('route-1')[0]!, 4000);
    expect(vehicle.classList.contains('traversal-vehicle--risk-impact')).toBe(true);
    renderer.reset(t0RouteHazards('route-2'));
    expect(renderer.element.querySelector('[data-risk-hazard="t0:r1:branch-1"]')).toBeNull();
    expect(renderer.element.querySelectorAll('[data-risk-hazard]')).toHaveLength(1);
    expect(internals.marks.size).toBe(1);
    expect(internals.contactDistances.size).toBe(0);
    expect(vehicle.classList.contains('traversal-vehicle--risk-impact')).toBe(false);
    expect(createRouteRisk('route-2').resolvedHazardIds).toEqual([]);
  });

  it('renders only the lane image and retires the warning as the obstacle enters view', () => {
    const renderer = new TraversalRouteRiskRenderer();
    const hazard = t0RouteHazards('route-1')[0]!;
    renderer.reset([hazard]);
    const mark = renderer.element.querySelector<HTMLElement>('[data-risk-hazard]')!;
    expect(mark.dataset.riskLane).toBe('0');
    expect(mark.querySelector('img')?.getAttribute('src')).toBe(resolveRouteRiskVisual(hazard).src);
    expect(mark.querySelector('.traversal-route-risk__bar')).toBeNull();
    expect(mark.textContent).not.toContain('DEV');
    renderer.update([hazard], createRouteRisk('route-1'), .2, 2400, 12000, 0, 1000, true, () => 1200);
    expect(mark.hidden).toBe(false);
    expect(mark.style.top).toBe('65%');
    expect(mark.dataset.warning).toBe('true');
    renderer.update([hazard], createRouteRisk('route-1'), .25, 3000, 12000, 600, 1000, true, () => 1200);
    expect(mark.dataset.warning).toBe('false');
    renderer.update([hazard], createRouteRisk('route-1'), .25, 3000, 12000, 600, 1000, false, () => 1200);
    expect(mark.hidden).toBe(true);
    expect(renderer.element.hidden).toBe(true);
  });

  it('holds the struck obstacle only for the existing 520 ms physical impact', () => {
    const renderer = new TraversalRouteRiskRenderer();
    const hazard = t0RouteHazards('route-1')[0]!;
    const initial = createRouteRisk('route-1');
    renderer.reset([hazard]);
    renderer.update([hazard], initial, .35, 4200, 12000, 0, 1000, true, () => 120);
    const collided = resolveRouteRisk(initial, [hazard], .35, .39, 0, true).state;
    renderer.impact(hazard, 4680);
    renderer.update([hazard], collided, .39, 4680, 12000, 0, 1000, true, () => 120);
    expect(renderer.element.querySelector<HTMLElement>('[data-risk-hazard]')?.hidden).toBe(false);
    renderer.update([hazard], collided, .43, 5200, 12000, 0, 1000, true, () => 120);
    expect(renderer.element.querySelector<HTMLElement>('[data-risk-hazard]')?.hidden).toBe(true);
  });

  it('has no placeholder paint or legacy obstacle references in risk presentation', () => {
    const rendererSource = readFileSync(resolve(process.cwd(), 'src/traversal/TraversalRouteRiskRenderer.ts'), 'utf8');
    const visualSource = readFileSync(resolve(process.cwd(), 'src/traversal/TraversalRouteRiskVisual.ts'), 'utf8');
    const css = readFileSync(resolve(process.cwd(), 'src/styles/traversal.css'), 'utf8');
    const hazardCss = css.split('.traversal-route-risk__hazard {')[1]?.split('.traversal-route-risk__impact {')[0] ?? '';
    expect(rendererSource).not.toMatch(/traversal-route-risk__bar|>DEV</);
    expect(hazardCss).not.toMatch(/repeating-linear-gradient|#ecbd59|#fff0b7/);
    expect(visualSource).not.toMatch(/abandoned-cart|forest-v4|old-road/);
  });
});
