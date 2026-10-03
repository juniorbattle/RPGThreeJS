// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { TraversalRoadAnchors, setRoadGroundDepth } from './TraversalRoadAnchor';
import { TraversalRouteRewardRenderer } from './TraversalRouteRewardRenderer';
import { createRouteReward, resolveRouteReward } from './TraversalRouteReward';

describe('physical road lifetime', () => {
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
