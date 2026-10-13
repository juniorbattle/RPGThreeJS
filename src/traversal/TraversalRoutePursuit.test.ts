// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRoutePursuit, pursuerLaneAt, resolveRoutePursuit,
  PURSUIT_COLLISION_PRESSURE, PURSUIT_OPPOSITE_LANE_PER_SECOND,
  PURSUIT_SAME_LANE_PER_SECOND, type TraversalRoutePursuitWindow } from './TraversalRoutePursuit';
import { T0_ROUTE_PURSUIT_WINDOWS, t0RoutePursuitWindow } from './TraversalT0Pursuit';
import { T0_ROUTE_HAZARDS } from './TraversalT0Risk';
import { T0_ROUTE_PICKUPS } from './TraversalT0Reward';
import { createRouteRisk, resolveRouteRisk } from './TraversalRouteRisk';
import { createRouteReward, resolveRouteReward } from './TraversalRouteReward';
import { advanceRouteRun, createRouteRun, resetRouteSpeed } from './TraversalRouteRun';
import { resolveT0RouteSegment } from './TraversalT0CheckpointRoute';
import { resolveTraversalPursuitEnabled } from './TraversalPursuitPresentationPolicy';
import { TraversalRoutePursuitRenderer } from './TraversalRoutePursuitRenderer';

const sample: TraversalRoutePursuitWindow = {
  id: 'sample', segmentId: 'route-3', startProgress01: .2, endProgress01: .8,
  startPressure01: .3, lanePhases: [{ fromProgress01: .2, lane: 0 }, { fromProgress01: .5, lane: 1 }],
};
const step = (state = createRoutePursuit('route-3'), from = .19, to = .3,
  lane: 0 | 1 = 0, ms = 1000, collisions = 0, active = true) =>
  resolveRoutePursuit(state, sample, from, to, lane, ms, collisions, active);

describe('T0 Route Pursuit authoring and policy', () => {
  it('production pressure waits for a committed lane charge at window end, even at saturation', () => {
    const approaching = resolveRoutePursuit(createRoutePursuit('route-3'), sample, .19, .7, 0, 10000, 5, true, true);
    expect(approaching.state.pressure01).toBe(1);
    expect(approaching.outcomes.map(outcome => outcome.result)).toEqual(['STARTED']);
    const charged = resolveRoutePursuit(approaching.state, sample, .7, .8, 1, 1000, 0, true, true);
    expect(charged.outcomes.map(outcome => outcome.result)).toEqual(['COMMITTED_CHARGE']);
    expect(charged.state.caughtCount).toBe(0);
    expect(charged.state.escapedWindowIds).toEqual([]);
    expect(resolveRoutePursuit(charged.state, sample, .8, .9, 1, 1000, 0, true, true).outcomes).toEqual([]);
  });
  it('keeps the pure resolver independent of campaign, combat, Risk, Reward and saves', () => {
    const source = readFileSync('src/traversal/TraversalRoutePursuit.ts', 'utf8');
    expect(source).not.toMatch(/from ['"].*(?:GameState|RunState|GameApp|RunSystem|CombatBridge|SaveRepository|TraversalRouteRisk|TraversalRouteReward)/);
  });
  it('keeps stable valid windows on R3, R5A/B and R6 only, with three per complete path', () => {
    expect(T0_ROUTE_PURSUIT_WINDOWS.map(({ id, segmentId, startProgress01, endProgress01,
      startPressure01, lanePhases }) => [id, segmentId, startProgress01, endProgress01,
      startPressure01, lanePhases.map(({ fromProgress01, lane }) => [fromProgress01, lane])])).toEqual([
      ['t0:r3:pursuit-1', 'route-3', .22, .78, .24, [[.22, 0], [.5, 1]]],
      ['t0:r5a:pursuit-1', 'route-5a', .2, .78, .28, [[.2, 0], [.5, 1]]],
      ['t0:r5b:pursuit-1', 'route-5b', .18, .8, .32, [[.18, 1], [.4, 0], [.61, 1]]],
      ['t0:r6:pursuit-1', 'route-6', .18, .84, .34, [[.18, 0], [.36, 1], [.62, 0]]],
    ]);
    expect(new Set(T0_ROUTE_PURSUIT_WINDOWS.map(window => window.id)).size).toBe(4);
    expect(['route-1', 'route-2', 'route-4'].map(t0RoutePursuitWindow)).toEqual([undefined, undefined, undefined]);
    for (const path of [['route-1', 'route-2', 'route-3', 'route-4', 'route-5a', 'route-6'],
      ['route-1', 'route-2', 'route-3', 'route-4', 'route-5b', 'route-6']]) {
      expect(path.filter(id => t0RoutePursuitWindow(id))).toHaveLength(3);
    }
    for (const window of T0_ROUTE_PURSUIT_WINDOWS) {
      expect(window.startProgress01).toBeGreaterThan(0);
      expect(window.endProgress01).toBeGreaterThan(window.startProgress01);
      expect(window.endProgress01).toBeLessThan(1);
      expect(window.startPressure01).toBeGreaterThan(0);
      expect(window.startPressure01).toBeLessThan(1);
      expect(window.lanePhases[0]?.fromProgress01).toBe(window.startProgress01);
      expect(window.lanePhases.every((phase, index) => [0, 1].includes(phase.lane)
        && (index === 0 || phase.fromProgress01 > window.lanePhases[index - 1]!.fromProgress01)
        && phase.fromProgress01 < window.endProgress01)).toBe(true);
    }
  });

  it('matches each hazard lane and keeps the final Route 6 pouch beyond pursuit', () => {
    for (const segment of ['route-3', 'route-5a', 'route-5b', 'route-6']) {
      const window = t0RoutePursuitWindow(segment)!;
      for (const hazard of T0_ROUTE_HAZARDS.filter(hazard => hazard.segmentId === segment)) {
        expect(hazard.progress01).toBeGreaterThan(window.startProgress01);
        expect(hazard.progress01).toBeLessThan(window.endProgress01);
        expect(pursuerLaneAt(window, hazard.progress01)).toBe(hazard.lane);
      }
    }
    expect(T0_ROUTE_PICKUPS.find(pickup => pickup.segmentId === 'route-6')!.progress01)
      .toBeGreaterThan(t0RoutePursuitWindow('route-6')!.endProgress01);
  });

  it('is production default with only a DEV Pursuit-off override, independent of Risk and Reward', () => {
    for (const [dev, search, enabled] of [
      [false, '', true], [false, '?traversalPursuit=0', true],
      [false, '?traversalPursuit=1', true], [true, '', true],
      [true, '?traversalPursuit=1', true], [true, '?traversalPursuit=0', false],
    ] as const) {
      expect(resolveTraversalPursuitEnabled({ dev, search })).toBe(enabled);
    }
    for (const dev of [false, true]) {
      for (const pursuit of ['', 'traversalPursuit=0', 'traversalPursuit=1']) {
        for (const risk of ['', 'traversalRisk=0', 'traversalRisk=1']) {
          for (const reward of ['', 'traversalReward=0', 'traversalReward=1']) {
            const search = `?${[pursuit, risk, reward, 'qa=1', 'unrelated=0'].filter(Boolean).join('&')}`;
            expect(resolveTraversalPursuitEnabled({ dev, search }))
              .toBe(!(dev && pursuit === 'traversalPursuit=0'));
          }
        }
      }
    }
  });
});

describe('pure pursuit pressure', () => {
  it('starts once at the boundary, increases in the same lane, decreases opposite and freezes inactive', () => {
    const initial = createRoutePursuit('route-3');
    expect(step(initial, .1, .2).outcomes.map(o => o.result)).toEqual(['STARTED']);
    const started = step(initial);
    expect(started.outcomes.map(o => o.result)).toEqual(['STARTED']);
    expect(started.state.pressure01).toBeCloseTo(.3 + .11 * (.1 / .11), 6);
    const same = step(started.state, .3, .4, 0, 1000);
    expect(same.outcomes).toEqual([]);
    expect(same.state.pressure01 - started.state.pressure01).toBeCloseTo(PURSUIT_SAME_LANE_PER_SECOND);
    const opposite = step(same.state, .4, .49, 1, 1000);
    expect(opposite.state.pressure01 - same.state.pressure01).toBeCloseTo(PURSUIT_OPPOSITE_LANE_PER_SECOND);
    expect(step(opposite.state, .49, .6, 1, 1000, 1, false).state).toBe(opposite.state);
    expect(initial.pressure01).toBe(0);
    expect(initial.activeWindowId).toBeNull();
    expect(Object.isFrozen(started.state)).toBe(true);
  });

  it('integrates a lane boundary and is stable across 1, 10 and 60 frames', () => {
    const run = (frames: number) => {
      let state = step(createRoutePursuit('route-3'), .19, .4, 0, 0).state;
      for (let i = 0; i < frames; i++) {
        state = step(state, .4 + .2 * i / frames, .4 + .2 * (i + 1) / frames,
          0, 1000 / frames).state;
      }
      return state.pressure01;
    };
    expect(run(1)).toBeCloseTo(.3 + .5 * .11 - .5 * .075, 8);
    expect(run(10)).toBeCloseTo(run(1), 8);
    expect(run(60)).toBeCloseTo(run(1), 8);
  });

  it('clamps, adds exactly one collision impulse, catches once and never escapes after catch', () => {
    const initial = createRoutePursuit('route-3');
    const collided = step(initial, .19, .3, 1, 0, 1);
    expect(collided.state.pressure01).toBeCloseTo(.3 + PURSUIT_COLLISION_PRESSURE);
    const caught = step(collided.state, .3, .49, 0, 10000, 0);
    expect(caught.state.pressure01).toBe(1);
    expect(caught.state.caughtCount).toBe(1);
    expect(caught.outcomes.map(o => o.result)).toEqual(['CAUGHT']);
    expect(step(caught.state, .49, .9).outcomes).toEqual([]);
    expect(caught.state.escapedWindowIds).toEqual([]);
    const low = step(initial, .19, .3, 1, 10000);
    expect(low.state.pressure01).toBe(0);
  });

  it('escapes once at the end and never catches later; rejects segment mismatch', () => {
    const first = step(createRoutePursuit('route-3'), .19, .3, 1, 0);
    const escaped = step(first.state, .3, .8, 0, 0);
    expect(escaped.outcomes.map(o => o.result)).toEqual(['ESCAPED']);
    expect(escaped.state.escapedWindowIds).toEqual(['sample']);
    expect(step(escaped.state, .8, .9, 0, 100000, 5).outcomes).toEqual([]);
    const mismatch = step(createRoutePursuit('route-5a'));
    expect(mismatch.outcomes).toEqual([]);
    expect(mismatch.state.segmentId).toBe('route-5a');
  });

  it('uses a Risk collision count without changing Risk and leaves Reward state independent', () => {
    const hazard = T0_ROUTE_HAZARDS.find(item => item.segmentId === 'route-3')!;
    const pickup = T0_ROUTE_PICKUPS.find(item => item.segmentId === 'route-3' && item.progress01 === .5)!;
    const risk = resolveRouteRisk(createRouteRisk('route-3'), [hazard], .3, .34, 0, true);
    const reward = resolveRouteReward(createRouteReward('route-3'), [pickup], .49, .51, 0, true);
    const pursuit = step(step(createRoutePursuit('route-3'), .19, .3, 0, 0).state, .3, .34, 0, 0,
      risk.outcomes.filter(outcome => outcome.result === 'COLLISION').length);
    expect(risk.state.collisionCount).toBe(1);
    expect(risk.outcomes).toHaveLength(1);
    expect(pursuit.state.pressure01).toBeCloseTo(.3 + .22);
    expect(reward.state.collectedGold).toBe(pickup.gold);
    expect(reward.state.collectedPickupIds).toEqual([pickup.id]);
    expect(pursuit.state).not.toHaveProperty('collectedGold');
    expect(T0_ROUTE_PICKUPS.find(item => item.id === pickup.id)).toEqual(pickup);
  });

  it('resets route speed without moving the route clock', () => {
    const segment = resolveT0RouteSegment(2);
    const before = advanceRouteRun(createRouteRun(segment, 2), segment, 9000);
    const after = resetRouteSpeed(before, segment);
    expect([after.elapsedMs, after.progress01, segment.durationMs])
      .toEqual([before.elapsedMs, before.progress01, 15000]);
    expect(after.speed).toBe(segment.vMin);
    expect(after.speedResetAtMs).toBe(before.elapsedMs);
  });

  it('renders one aria-hidden rear proxy with no focusable controls and clears between segments', () => {
    const renderer = new TraversalRoutePursuitRenderer();
    expect(renderer.element.getAttribute('aria-hidden')).toBe('true');
    expect(renderer.element.querySelector('button, input, a')).toBeNull();
    const started = step().state;
    renderer.update(sample, started, .3, 1000, 1440, 194, true);
    const proxy = renderer.element.querySelector<HTMLElement>('.traversal-route-pursuit__proxy')!;
    expect(proxy.hidden).toBe(false);
    expect(proxy.dataset.pursuitLane).toBe('0');
    expect(Number.parseFloat(proxy.style.left)).toBeLessThan(1440 * .25);
    renderer.reset();
    expect(proxy.hidden).toBe(true);
    expect(proxy.dataset.pursuitActive).toBeUndefined();
  });
});
