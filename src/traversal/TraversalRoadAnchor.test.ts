// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { anchoredRoadSpeed, TraversalRoadAnchors, setRoadGroundDepth } from './TraversalRoadAnchor';
import { advanceRouteRun, createRouteRun, forecastRouteDistance, resetRouteSpeed } from './TraversalRouteRun';
import { TraversalRouteRewardRenderer } from './TraversalRouteRewardRenderer';
import { createRouteReward, resolveRouteReward } from './TraversalRouteReward';

describe('physical road lifetime', () => {
  it.each([16, 160, 1000])('aligns an already-visible pouch after collision without changing its clock (%sms frames)', frameMs => {
    const segment = { id: 'authored-road', durationMs: 12000, vMin: 1.05, vMax: 2.45 };
    const initial = createRouteRun(segment, 0, 1);
    const target = { progress01: .5, distance: forecastRouteDistance(initial, segment, .5) };
    let state = initial, distance = 0, firstRecoverySpeed = 0, beforeResetSpeed = 0;
    while (state.progress01 < .5) {
      const boundary = state.progress01 < .31 ? .31 : .5;
      const previous = state;
      const next = advanceRouteRun(previous, segment, Math.min(frameMs, boundary * segment.durationMs - previous.elapsedMs));
      const speed = anchoredRoadSpeed(previous, next, segment, distance, target, 1);
      expect(Number.isFinite(speed) && speed > 0).toBe(true);
      expect(next).toEqual(advanceRouteRun(previous, segment, next.elapsedMs - previous.elapsedMs));
      distance += speed * (next.elapsedMs - previous.elapsedMs) * .28;
      if (previous.speedResetAtMs >= 0 && !firstRecoverySpeed) firstRecoverySpeed = speed;
      state = next;
      if (state.progress01 === .31 && state.speedResetAtMs < 0) {
        beforeResetSpeed = speed;
        // The future pouch has already entered at every accepted viewport.
        expect((target.distance - distance) / 1463 + .25).toBeLessThan(1);
        state = resetRouteSpeed(state, segment);
      }
    }
    expect(distance).toBeCloseTo(target.distance, 6);
    if (frameMs <= 160) expect(firstRecoverySpeed).toBeLessThan(beforeResetSpeed);
    expect(state.elapsedMs).toBe(6000);
    expect(state.speedResetAtMs).toBe(3720);
  });

  it('keeps invalid, elapsed and incompatible anchors from causing a camera jump or reversal', () => {
    const segment = { id: 'road', durationMs: 10000, vMin: 1, vMax: 2 };
    const previous = createRouteRun(segment, 0), next = advanceRouteRun(previous, segment, 16);
    const baseline = anchoredRoadSpeed(previous, next, segment, 0, null, .4);
    for (const target of [{ progress01: 0, distance: 20 }, { progress01: .5, distance: -1 },
      { progress01: .5, distance: Infinity }, { progress01: .5, distance: 99999 }]) {
      expect(anchoredRoadSpeed(previous, next, segment, 0, target, .4)).toBe(baseline);
    }
  });
  it('enters from the edge, freezes partial bounds through reforecast/resize, then exits completely', () => {
    const anchors = new TraversalRoadAnchors();
    let mark = anchors.update('rock', 0, 1463, 100, () => 1250);
    expect(mark.visible).toBe(false);
    mark = anchors.update('rock', 20, 1463, 100, () => 0);
    expect(mark.left).toBeGreaterThan(1463);
    mark = anchors.update('rock', 160, 1463, 100, () => 0);
    expect(mark.visible).toBe(true);
    expect(mark.left).toBeLessThan(1463);
    anchors.reforecastUnseen();
    expect(anchors.update('rock', 160, 1463, 100, () => 9999).x).toBe(mark.x);
    expect(anchors.update('rock', 160, 620, 100, () => 9999).x).toBeCloseTo(mark.x * 620 / 1463);
    const trailing = anchors.update('rock', 1680, 1463, 100, () => 0);
    expect(trailing.right).toBeGreaterThan(0);
    expect(trailing.visible).toBe(true);
    expect(anchors.update('rock', 1720, 1463, 100, () => 0).visible).toBe(false);
    expect(anchors.update('rock', 160, 1463, 100, () => 0).visible).toBe(false);
    anchors.reset();
    expect(anchors.update('rock', 160, 1463, 100, () => 0).visible).toBe(true);
  });

  it('reforecasts only an entirely unseen mark', () => {
    const anchors = new TraversalRoadAnchors();
    anchors.update('future', 0, 1463, 100, () => 3000);
    anchors.reforecastUnseen();
    expect(anchors.update('future', 200, 1463, 100, () => 2000).x).toBeCloseTo(2365.75);
  });

  it.each([0, 1] as const)('keeps resolved lane %s pouch on the road and the owner awards once', lane => {
    const pickup = { id: 'pouch', segmentId: 'road', lane: 0 as const, progress01: .5, gold: 5 };
    const renderer = new TraversalRouteRewardRenderer();
    renderer.reset([pickup]);
    const initial = createRouteReward('road');
    renderer.update([pickup], initial, .4, 4000, 10000, 0, 1463, true, () => 100);
    const result = resolveRouteReward(initial, [pickup], .4, .6, lane, true);
    if (lane === 0) renderer.collect(pickup, 6000);
    renderer.update([pickup], result.state, .7, 7000, 10000, 100, 1463, true, () => 0);
    const mark = renderer.element.querySelector<HTMLElement>('[data-reward-pickup]')!;
    expect(mark.hidden).toBe(false);
    expect(mark.dataset.collected).toBe(String(lane === 0));
    expect(resolveRouteReward(result.state, [pickup], .4, .8, 0, true).outcomes).toEqual([]);
    const x = mark.style.left;
    renderer.update([pickup], result.state, .7, 7000, 10000, 100, 1463, true, () => 9999);
    expect(mark.style.left).toBe(x);
    renderer.update([pickup], result.state, .9, 9000, 10000, 700, 1463, true, () => 0);
    expect(mark.hidden).toBe(true);
  });

  it('sorts ground depth independently of actor family or creation', () => {
    const near = document.createElement('span'), far = document.createElement('span'), vehicle = document.createElement('span');
    setRoadGroundDepth(near, 650); setRoadGroundDepth(far, 500); setRoadGroundDepth(vehicle, 600);
    expect(Number(far.style.zIndex)).toBeLessThan(Number(vehicle.style.zIndex));
    expect(Number(near.style.zIndex)).toBeGreaterThan(Number(vehicle.style.zIndex));
  });
});
