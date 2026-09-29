// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';
import { advanceRouteRun, type TraversalRouteRunState } from './TraversalRouteRun';
import { resolveT0RouteSegment } from './TraversalT0CheckpointRoute';
import type { TraversalRoutePursuitState } from './TraversalRoutePursuit';

type SceneInternals = { startRoute(index: number): void; advance(seconds: number): void;
  routeRun: TraversalRouteRunState };

function makeScene(search: string) {
  window.history.replaceState(null, '', `/${search}`);
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const scene = new TraversalT0Scene({ root: document.body,
    leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
    getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(),
    onArrival: vi.fn(), onMenu: vi.fn() });
  return { scene, state, internal: scene as unknown as SceneInternals };
}

async function settle(scene: TraversalT0Scene): Promise<void> {
  await (scene as unknown as { routeRenderer: { ready: Promise<void> } }).routeRenderer.ready;
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  const internal = scene as unknown as { advanceTransition(seconds: number): void };
  internal.advanceTransition(1);
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  internal.advanceTransition(1);
}

afterEach(() => {
  document.body.replaceChildren();
  document.body.className = '';
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

it('mounts one aria-hidden Pursuit renderer by default and honors only DEV Pursuit-off', () => {
  const off = makeScene('?qa=1&traversalPursuit=0');
  expect(off.scene.element.querySelector('.traversal-route-pursuit')).toBeNull();
  expect(off.scene.element.dataset.pursuitEnabled).toBeUndefined();
  off.scene.dispose();
  for (const search of ['?qa=1', '?qa=1&traversalPursuit=1']) {
    const on = makeScene(search);
    expect(on.scene.element.querySelectorAll('.traversal-route-pursuit')).toHaveLength(1);
    expect(on.scene.element.querySelector('.traversal-route-pursuit')?.getAttribute('aria-hidden')).toBe('true');
    expect(on.scene.element.dataset.pursuitEnabled).toBe('dev');
    expect(on.scene.element.querySelectorAll('.traversal-route-pursuit button, .traversal-route-pursuit a, .traversal-route-pursuit [tabindex]')).toHaveLength(0);
    expect(on.scene.element.querySelectorAll('.traversal-vehicle')).toHaveLength(1);
    on.scene.dispose();
  }
});

it('passes one Risk collision impulse to Pursuit and resets fresh state on next segment', async () => {
  const { scene, state, internal } = makeScene('?qa=1&traversalPursuit=1');
  scene.open();
  await settle(scene);
  internal.startRoute(2);
  const campaignBefore = JSON.stringify(state);
  internal.advance(4.9);
  expect(scene.element.dataset.routeSegment).toBe('route-3');
  expect(scene.element.dataset.riskCollisionCount).toBe('1');
  expect(scene.element.dataset.pursuitEvents).toContain('STARTED');
  expect(Number(scene.element.dataset.pursuitPressure)).toBeCloseTo(.24 + (4.9 - .22 * 15) * .11 + .22, 4);
  expect(JSON.stringify(state)).toBe(campaignBefore);
  internal.startRoute(3);
  expect(scene.element.dataset.pursuitWindow).toBe('');
  expect(scene.element.dataset.pursuitPressure).toBe('0');
  expect(scene.element.querySelector('.traversal-route-pursuit__proxy')?.hasAttribute('hidden')).toBe(true);
  scene.dispose();
});

it('catches once in isolation, resets speed only, and freezes during a global cover', async () => {
  const { scene, state, internal } = makeScene('?qa=1&traversalPursuit=1&traversalRisk=0');
  scene.open();
  await settle(scene);
  internal.startRoute(2);
  const campaignBefore = JSON.stringify(state);
  let caughtBefore: TraversalRouteRunState | null = null;
  let caughtAfter: TraversalRouteRunState | null = null;
  for (let i = 0; i < 140; i++) {
    if (internal.routeRun.progress01 >= .5 && scene.session.currentLane !== 1)
      scene.element.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')!.click();
    const before = internal.routeRun;
    internal.advance(.1);
    if (Number(scene.element.dataset.pursuitCaughtCount) === 1) {
      caughtBefore = before;
      caughtAfter = internal.routeRun;
      break;
    }
  }
  expect(caughtBefore).not.toBeNull();
  expect(caughtAfter).not.toBeNull();
  expect(caughtAfter!.speed).toBe(resolveT0RouteSegment(2).vMin);
  expect(caughtAfter!.elapsedMs).toBeCloseTo(caughtBefore!.elapsedMs + 100);
  expect(caughtAfter!.progress01).toBeCloseTo(advanceRouteRun(caughtBefore!, resolveT0RouteSegment(2), 100).progress01);
  expect(scene.element.dataset.pursuitEvents?.match(/CAUGHT/g)).toHaveLength(1);
  expect(scene.element.dataset.pursuitSpeedAfter).toBe('1');
  expect(JSON.stringify(state)).toBe(campaignBefore);
  const pressure = scene.element.dataset.pursuitPressure;
  document.body.classList.add('scene-transition--locked');
  internal.advance(.5);
  expect(scene.element.dataset.pursuitPressure).toBe(pressure);
  expect(scene.element.querySelector('.traversal-route-pursuit__proxy')?.hasAttribute('data-pursuit-active')).toBe(false);
  scene.dispose();
});

it('uses the Risk reset when collision and catch occur in the same step', async () => {
  const { scene, internal } = makeScene('?qa=1&traversalPursuit=1');
  scene.open(); await settle(scene);
  internal.startRoute(2);
  internal.advance(4.7); // Route 3 progress .313, just before the lane-0 hazard at .32.
  const internals = internal as SceneInternals & { routePursuit: TraversalRoutePursuitState };
  internals.routePursuit = Object.freeze({ ...internals.routePursuit, pressure01: .9 });
  const before = internal.routeRun;
  internal.advance(.2);
  expect(scene.element.dataset.riskCollisionCount).toBe('1');
  expect(scene.element.dataset.pursuitCaughtCount).toBe('1');
  expect(scene.element.dataset.pursuitEvents?.match(/CAUGHT/g)).toHaveLength(1);
  expect(scene.element.dataset.pursuitSpeedBefore).toBe(scene.element.dataset.riskSpeedBefore);
  expect(scene.element.dataset.pursuitSpeedAfter).toBe(scene.element.dataset.riskSpeedAfter);
  expect(internal.routeRun.speed).toBe(resolveT0RouteSegment(2).vMin);
  expect(internal.routeRun.elapsedMs).toBeCloseTo(before.elapsedMs + 200);
  expect(internal.routeRun.progress01).toBeCloseTo(advanceRouteRun(before, resolveT0RouteSegment(2), 200).progress01);
  scene.dispose();
});
