import { describe, expect, it } from 'vitest';
import { anchoredRoadSpeed, TraversalRoadCamera, type RoadContactAnchor } from './TraversalRoadAnchor';
import { advanceRouteRun, createRouteRun, forecastRouteDistance, resetRouteSpeed } from './TraversalRouteRun';
import { resolveT0RouteSegment } from './TraversalT0CheckpointRoute';

const segment = resolveT0RouteSegment(4, 'lion-first-trial-combat');
const resetMs = 10082.9, contactMs = 10200, scale = 1.686;

function prepared(resetAt = resetMs, priorReset?: number, anchorRatio = 1) {
  const camera = new TraversalRoadCamera();
  const initial = createRouteRun(segment, 4);
  const origin = priorReset === undefined ? initial : resetRouteSpeed(advanceRouteRun(initial, segment, priorReset), segment);
  const previous = advanceRouteRun(origin, segment, 9966.1 - origin.elapsedMs);
  const target: RoadContactAnchor = { id: 'risk:route-5b-block-3', progress01: .68,
    distance: forecastRouteDistance(previous, segment, .68) * scale * anchorRatio };
  const next = advanceRouteRun(previous, segment, resetAt - previous.elapsedMs);
  const speed = camera.speed(previous, next, segment, 0, target, 1, scale);
  const distance = speed * (next.elapsedMs - previous.elapsedMs) * .28;
  return { camera, target, distance, state: resetRouteSpeed(next, segment) };
}

describe('late reset camera continuity', () => {
  it.each([16, 33, 160, 600])('retains a validated contact plan through unaligned %sms frames', frameMs => {
    const p = prepared();
    let state = p.state, distance = p.distance;
    expect(state.elapsedMs).toBe(resetMs);
    expect(state.speedResetAtMs).toBe(resetMs);
    const baselineNext = advanceRouteRun(state, segment, 16);
    // Reproduce the existing >2 guard rejection; that guard remains effective.
    expect(anchoredRoadSpeed(state, baselineNext, segment, distance, p.target, 1, scale))
      .toBe(anchoredRoadSpeed(state, baselineNext, segment, distance, null, 1, scale));
    while (state.elapsedMs < contactMs) {
      const previous = state;
      const next = advanceRouteRun(previous, segment, frameMs);
      const snapshot = { ...previous };
      const speed = p.camera.speed(previous, next, segment, distance, p.target, 1, scale);
      expect(previous).toEqual(snapshot);
      expect(speed).toBeGreaterThan(0);
      expect(speed).toBeLessThanOrEqual(2 * segment.vMax * scale);
      const afterMs = Math.max(0, next.elapsedMs - contactMs);
      const contact = advanceRouteRun(previous, segment, Math.min(frameMs, contactMs - previous.elapsedMs));
      const tail = afterMs * (contact.speed + next.speed) / 2 * scale * .28;
      distance += speed * (next.elapsedMs - previous.elapsedMs) * .28;
      if (next.elapsedMs >= contactMs) {
        expect(distance - tail).toBeCloseTo(p.target.distance, 6);
        for (const width of [1440, 620, 390]) {
          const x = width * .25 + (p.target.distance - (distance - tail)) * width / 1463;
          expect(x).toBeCloseTo(width * .25, 6);
        }
      }
      state = next;
      expect(state.speedResetAtMs).toBe(resetMs);
    }
    const next = advanceRouteRun(state, segment, 16);
    expect(p.camera.speed(state, next, segment, distance, p.target, 1, scale))
      .toBe(anchoredRoadSpeed(state, next, segment, distance, null, 1, scale));
  });

  it('retains its envelope through a second reset without changing either reset clock', () => {
    const p = prepared();
    const middle = advanceRouteRun(p.state, segment, 48.3);
    const speed = p.camera.speed(p.state, middle, segment, p.distance, p.target, 1, scale);
    const distance = p.distance + speed * 48.3 * .28;
    const state = resetRouteSpeed(middle, segment);
    const next = advanceRouteRun(state, segment, contactMs - state.elapsedMs);
    const finalSpeed = p.camera.speed(state, next, segment, distance, p.target, 1, scale);
    expect(distance + finalSpeed * (next.elapsedMs - state.elapsedMs) * .28).toBeCloseTo(p.target.distance, 6);
    expect(next.speedResetAtMs).toBe(state.elapsedMs);
    expect(state.elapsedMs).toBeCloseTo(10131.2, 8);
    expect(next.elapsedMs).toBe(contactMs);
  });

  it.each(['id', 'distance', 'progress', 'segment', 'scale', 'null', 'dispose', 'rewind'])
    ('expires the cached plan on %s change', change => {
      const p = prepared();
      let state = p.state, target: RoadContactAnchor | null = p.target, road = segment, distance = p.distance, factor = scale;
      if (change === 'id') target = { ...p.target, id: 'reward:numerical-alias' };
      if (change === 'distance') target = { ...p.target, distance: Infinity };
      if (change === 'progress') target = { ...p.target, progress01: .679 };
      if (change === 'segment') road = { ...segment };
      if (change === 'scale') factor *= .99;
      if (change === 'null') target = null;
      if (change === 'dispose') p.camera.reset();
      if (change === 'rewind') { state = { ...state, elapsedMs: 9950, progress01: 9950 / segment.durationMs }; distance = 0; }
      const next = advanceRouteRun(state, road, 16);
      expect(p.camera.speed(state, next, road, distance, target, 1, factor))
        .toBe(anchoredRoadSpeed(state, next, road, distance, null, 1, factor));
    });

  it('never promotes a malformed initially unvalidated target after reset', () => {
    const camera = new TraversalRoadCamera();
    const previous = advanceRouteRun(createRouteRun(segment, 4), segment, 9966.1);
    const target = { id: 'invalid', progress01: .68, distance: 99999 };
    const next = advanceRouteRun(previous, segment, resetMs - previous.elapsedMs);
    camera.speed(previous, next, segment, 0, target, 1, scale);
    const reset = resetRouteSpeed(next, segment), after = advanceRouteRun(reset, segment, 16);
    expect(camera.speed(reset, after, segment, 100, target, 1, scale))
      .toBe(anchoredRoadSpeed(reset, after, segment, 100, null, 1, scale));
  });

  it('retains the reference when a valid post-reset ratio only fails near contact', () => {
    // Native diagnostic: previous Risk reset7966.4ms, frozen forecast ratio
    // .999994 before the new reset, new ratio1.999624 then2.000180 near contact.
    const p = prepared(10049.6, 7966.4, .999994);
    let state = p.state, distance = p.distance, validFrames = 0, rejectedFrames = 0;
    while (state.elapsedMs < contactMs) {
      const next = advanceRouteRun(state, segment, Math.min(16.7, contactMs - state.elapsedMs));
      const ordinary = anchoredRoadSpeed(state, next, segment, distance, p.target, 1, scale);
      const baseline = anchoredRoadSpeed(state, next, segment, distance, null, 1, scale);
      if (ordinary === baseline) rejectedFrames++; else validFrames++;
      const speed = p.camera.speed(state, next, segment, distance, p.target, 1, scale);
      expect(speed).toBeGreaterThan(0); expect(speed).toBeLessThanOrEqual(2 * segment.vMax * scale);
      distance += speed * (next.elapsedMs - state.elapsedMs) * .28;
      state = next;
    }
    expect(validFrames).toBeGreaterThan(0);
    expect(rejectedFrames).toBeGreaterThan(0);
    expect(distance).toBeCloseTo(p.target.distance, 6);
    expect(state.elapsedMs).toBe(contactMs);
    expect(state.speedResetAtMs).toBe(10049.6);
  });

  it('rejects a future reset timestamp instead of authorizing a bridge', () => {
    const p = prepared();
    const state = { ...p.state, speedResetAtMs: contactMs + 1 };
    const next = advanceRouteRun(state, segment, 16);
    expect(p.camera.speed(state, next, segment, p.distance, p.target, 1, scale))
      .toBe(anchoredRoadSpeed(state, next, segment, p.distance, null, 1, scale));
  });
});
