// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { TraversalT0Scene } from './TraversalT0Scene';
import type { TraversalRouteRunState } from './TraversalRouteRun';
import type { TraversalRunSession } from './TraversalRunRuntime';
import { TraversalRoadScene } from './TraversalRoadScene';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

function fixture() {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const arrival = vi.fn();
  const scene = new TraversalT0Scene({ root: document.body,
    leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
    getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: arrival, onMenu: vi.fn() });
  const motion = scene as unknown as {
    startRoute(index: number): void; advance(n: number): void; advanceTransition(n: number): void;
    advanceArrival(n: number): void; updateWorldTransforms(): void;
    beginCheckpointDeparture(kind: 'return', midpoint: () => Promise<void>): void;
    viewMode: string; speed: number; routeRun: TraversalRouteRunState;
    routeRenderer: { distance: number }; departure: unknown; transition: unknown;
    checkpointElapsed: number; checkpointStartSpeed: number; approachElapsed: number | null;
    arrivalRequested: boolean; arrivalVisualSpeed: number;
    controller: { readonly session: TraversalRunSession };
  };
  scene.open(); motion.advanceTransition(2); motion.advanceTransition(2);
  return { scene, motion, state, arrival };
}

it('carries residual speed through coverage and brakes with matching ground travel during reveal', async () => {
  const { scene, motion, state } = fixture();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  motion.advanceTransition(3);
  const before = structuredClone(state);
  motion.advance(30); motion.advance(.28);
  expect(scene.element.dataset.transition).toBe('focus');
  const clock = motion.routeRun.elapsedMs;
  const enteringSpeed = motion.speed;
  motion.advanceTransition(.2); motion.updateWorldTransforms();
  const fadingSpeed = motion.speed;
  expect(fadingSpeed).toBeGreaterThan(0);
  expect(fadingSpeed).toBeLessThan(enteringSpeed);
  const vehicle = scene.element.querySelector<HTMLElement>('.traversal-vehicle')!;
  const wheelBeforeSwap = vehicle.style.getPropertyValue('--wheel-angle');
  motion.advanceTransition(.28); motion.updateWorldTransforms();
  expect(motion.viewMode).toBe('CHECKPOINT');
  expect(motion.speed).toBeCloseTo(enteringSpeed * .58);
  expect(vehicle.style.getPropertyValue('--wheel-angle')).toBe(wheelBeforeSwap);
  const world = scene.element.querySelector<HTMLElement>('.traversal-world__sections')!;
  const cameraX = () => -Number(world.style.transform.match(/translateX\(([-\d.]+)px\)/)![1]);
  const atSwap = cameraX(), swapSpeed = motion.speed;
  for (let i = 0; i < 5; i++) await Promise.resolve();
  motion.advanceTransition(.12); motion.updateWorldTransforms();
  expect(cameraX()).toBe(atSwap); // Fully covered hold does not drive the visible world.
  motion.advanceTransition(.18); motion.updateWorldTransforms();
  expect(cameraX()).toBeGreaterThan(atSwap);
  expect(motion.speed).toBeGreaterThan(0);
  expect(motion.speed).toBeLessThan(swapSpeed);
  const viewportScale = 1; // Scene fallback width is the logical road reference width.
  expect(cameraX() - atSwap).toBeCloseTo((swapSpeed + motion.speed) / 2 * .18 * 1000 * .28 * viewportScale);
  motion.advanceTransition(.181); motion.updateWorldTransforms();
  expect(motion.transition).toBeNull();
  const revealSpeed = motion.speed;
  expect(revealSpeed).toBeGreaterThan(0);
  motion.advance(.1);
  expect(motion.speed).toBeLessThan(revealSpeed);
  expect(motion.routeRun.elapsedMs).toBe(clock);
  expect(state).toEqual(before);
  scene.dispose();
});

it('preserves wheel phase across covered origins and counts ground plus vehicle departure travel', () => {
  const { scene, motion } = fixture();
  const vehicle = scene.element.querySelector<HTMLElement>('.traversal-vehicle')!;
  const angle = () => Number.parseFloat(vehicle.style.getPropertyValue('--wheel-angle'));
  const initial = angle();
  motion.viewMode = 'CHECKPOINT'; motion.updateWorldTransforms();
  expect(angle()).toBe(initial);
  motion.updateWorldTransforms(); expect(angle()).toBe(initial);
  motion.beginCheckpointDeparture('return', async () => { motion.startRoute(1); });
  motion.advance(.14);
  const offset = Number(scene.element.dataset.vehicleOffset);
  const radius = 150 / 766 * Math.min(823 * .24, 1463 * .14);
  expect(angle() - initial).toBeCloseTo(offset * 2 / radius);
  const beforeSwap = angle();
  motion.startRoute(1); motion.updateWorldTransforms();
  expect(angle()).toBe(beforeSwap);
  motion.updateWorldTransforms(); expect(angle()).toBe(beforeSwap);
  scene.dispose();
});

it('keeps the next clock at zero under delayed coverage and reveals engaged momentum once', async () => {
  const { scene, motion, state } = fixture();
  const before = structuredClone(state);
  motion.viewMode = 'CHECKPOINT';
  let ready!: () => void;
  const decoded = new Promise<void>(resolve => { ready = resolve; });
  const swap = vi.fn(() => { motion.startRoute(1); return decoded; });
  motion.beginCheckpointDeparture('return', swap);
  motion.advance(.14); motion.updateWorldTransforms();
  const earlyOffset = Number(scene.element.dataset.vehicleOffset);
  motion.advance(.14); motion.advanceTransition(.3); motion.updateWorldTransforms();
  expect(Number(scene.element.dataset.vehicleOffset)).toBeGreaterThan(earlyOffset * 2);
  motion.advanceTransition(.18);
  expect(swap).toHaveBeenCalledOnce();
  expect(scene.element.style.getPropertyValue('--transition-opacity')).toBe('1');
  expect(motion.routeRun.elapsedMs).toBe(0);
  motion.advanceTransition(1);
  expect(motion.routeRun.elapsedMs).toBe(0);
  expect(motion.departure).not.toBeNull();
  ready(); await Promise.resolve();
  motion.advanceTransition(.2);
  const coveredDistance = motion.routeRenderer.distance;
  motion.advanceTransition(.15);
  expect(motion.speed).toBeGreaterThanOrEqual(1);
  expect(motion.routeRenderer.distance).toBeGreaterThan(coveredDistance);
  expect(motion.routeRun.elapsedMs).toBe(0);
  motion.advanceTransition(1);
  expect(motion.departure).toBeNull();
  motion.advance(.016);
  expect(motion.routeRun.elapsedMs).toBe(16);
  expect(motion.speed).toBeGreaterThanOrEqual(1);
  expect(state).toEqual(before);
  scene.dispose();
});

it('waits for actual trailing-edge exit after resize, then hands off once and stops after disposal', () => {
  const { scene, motion, state, arrival } = fixture();
  const before = structuredClone(state);
  motion.startRoute(5);
  const session = scene.session;
  vi.spyOn(motion.controller, 'session', 'get').mockReturnValue({ ...session, phase: 'ARRIVING' });
  motion.arrivalRequested = true; motion.arrivalVisualSpeed = 2;
  const vehicle = scene.element.querySelector<HTMLElement>('.traversal-vehicle')!;
  let left = 800;
  vi.spyOn(vehicle, 'getBoundingClientRect').mockImplementation(() => ({ left, width: 200 } as DOMRect));
  let viewportRight = 1024;
  vi.spyOn(scene.element, 'getBoundingClientRect').mockImplementation(() => ({ right: viewportRight } as DOMRect));
  motion.advanceArrival(3); expect(arrival).not.toHaveBeenCalled(); expect(motion.speed).toBe(4);
  left = 1200; viewportRight = 1440;
  motion.advanceArrival(.1); expect(arrival).not.toHaveBeenCalled();
  left = 2000;
  motion.advanceArrival(.1); expect(arrival).not.toHaveBeenCalled();
  motion.advanceArrival(.5); expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-first-refuge');
  motion.advanceArrival(20); expect(arrival).toHaveBeenCalledOnce();
  expect(state).toEqual(before);
  motion.arrivalRequested = true; scene.dispose(); motion.advanceArrival(20);
  expect(arrival).toHaveBeenCalledOnce();
});

it('ends a rejected fork departure without repeating the canonical selection', async () => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
  const state = createInitialState(), selectBranch = vi.fn(() => false);
  const leg = LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!;
  const scene = new TraversalRoadScene({ root: document.body, leg, getState: () => state,
    getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() },
    T0_ROAD_AUTHORING, { selectBranch, optionalDecision: () => undefined });
  const motion = scene as unknown as { viewMode: string; advance(n: number): void; advanceTransition(n: number): void;
    departure: unknown; controller: { options: { onBranchSelect(id: string): Promise<boolean> } } };
  scene.open(); motion.viewMode = 'CHECKPOINT';
  const before = structuredClone(state);
  const accepted = motion.controller.options.onBranchSelect('lion-first-trial-event');
  motion.advance(.28); motion.advanceTransition(.5);
  expect(await accepted).toBe(false); expect(motion.departure).toBeNull();
  motion.advanceTransition(2); motion.advance(1); motion.advanceTransition(2);
  expect(selectBranch).toHaveBeenCalledOnce(); expect(state).toEqual(before);
  expect(scene.element.dataset.departure).toBeUndefined(); scene.dispose();
});

it.each(['os', 'game'])('covers the equivalent exit gently for %s reduction without visible large displacement', source => {
  const { scene, motion, state, arrival } = fixture();
  state.settings.reducedGraphics = source === 'game';
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: source === 'os' } as MediaQueryList);
  motion.startRoute(5);
  const session = scene.session;
  vi.spyOn(motion.controller, 'session', 'get').mockReturnValue({ ...session, phase: 'ARRIVING' });
  motion.arrivalRequested = true; motion.arrivalVisualSpeed = 2;
  motion.advanceArrival(.18);
  expect(scene.element.style.getPropertyValue('--arrival-fade')).toBe('0.5');
  expect(Number(scene.element.dataset.vehicleOffset)).toBe(0);
  expect(arrival).not.toHaveBeenCalled();
  motion.advanceArrival(.18);
  expect(scene.element.style.getPropertyValue('--arrival-fade')).toBe('1');
  expect(Number(scene.element.dataset.vehicleOffset)).toBeGreaterThan(window.innerWidth * .75);
  expect(arrival).not.toHaveBeenCalled();
  motion.advanceArrival(.13); expect(arrival).toHaveBeenCalledOnce();
  scene.dispose();
});
