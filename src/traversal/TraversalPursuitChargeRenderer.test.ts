// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { TraversalPursuitChargeRenderer } from './TraversalPursuitChargeRenderer';
import { createPursuitCharge, advancePursuitCharge } from './TraversalPursuitCharge';

const charge = (lane: 0 | 1) => createPursuitCharge({ windowId: 'authored', lane, left: 40, speed: 200, acceleration: 800 });
describe('unwired grounded charge renderer', () => {
  it('projects the committed lane and respects physical sibling depth', () => {
    const renderer = new TraversalPursuitChargeRenderer();
    renderer.update(charge(0), 1463, 160, true);
    expect(renderer.element.style.left).toBe('40px');
    expect(renderer.element.style.zIndex).toBe('21');
    renderer.update(charge(1), 731.5, 80, true);
    expect(renderer.element.style.left).toBe('20px');
    expect(renderer.element.style.width).toBe('80px');
    expect(renderer.element.style.top).toBe('81%');
    expect(renderer.element.style.zIndex).toBe('23');
  });
  it('freezes contact, hides only terminal exit, and never revives after disposal', () => {
    const renderer = new TraversalPursuitChargeRenderer();
    const pending = advancePursuitCharge(charge(0), 20, { caravanLane: 0, caravanLeft: 300,
      caravanRight: 500, pursuerWidth: 80, viewportRight: 1463 }).state;
    renderer.update(pending, 1463, 80, true);
    expect(renderer.element.hidden).toBe(false);
    expect(renderer.element.dataset.active).toBe('false');
    renderer.update({ ...pending, phase: 'EXITED', left: 1463 }, 1463, 80, true);
    expect(renderer.element.hidden).toBe(true);
    renderer.dispose();
    renderer.update(charge(0), 1463, 80, true);
    expect(renderer.element.hidden).toBe(true);
  });
  it('honors OS reduction with explicit game false and keeps displacement gentle', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const renderer = new TraversalPursuitChargeRenderer();
    renderer.update({ ...charge(0), left: 1200, elapsedSeconds: .5 }, 1000, 80, true, false);
    expect(renderer.element.dataset.reducedMotion).toBe('true');
    expect(renderer.element.style.left).toBe('60px');
    expect(Number(renderer.element.style.opacity)).toBeCloseTo(1 / 6);
    vi.restoreAllMocks();
  });
});
