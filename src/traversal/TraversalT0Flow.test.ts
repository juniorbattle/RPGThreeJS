// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { bypassTraversalNode, enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
it.each([
  ['confirm', 'lion-first-trial-event'], ['skip', 'lion-first-trial-event'], ['opposite-lane', 'lion-first-trial-event'],
  ['confirm', 'lion-first-trial-combat'], ['skip', 'lion-first-trial-combat'],
] as const)('completes T0 checkpoints via %s and %s with canonical fork selection', async (action, branch) => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const handoffs: string[] = [];
  const arrival = vi.fn();
  const roadCombat = vi.fn(async () => true);
  const scene = new TraversalT0Scene({
    root: document.body, leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
    getState: () => state, getAvailableNodes: () => getAvailableRunNodes(state),
    onOptionalIgnore: nodeId => {
      expect(scene.session.phase).toBe('RUNNING');
      return { accepted: bypassTraversalNode(state.run, 'T0', nodeId) };
    },
    onNodeHandoff: node => {
      expect(enterRunNode(state.run, node.id)?.id).toBe(node.id);
      state.currentNodeId = node.id;
      handoffs.push(node.id);
      scene.beginNodeResolution(node.id);
      scene.resumeNode(node.id);
    }, onRoadCombat: roadCombat, onArrival: arrival, onMenu: () => undefined,
  });
  const clock = scene as unknown as { advance(n: number): void; advanceTransition(n: number): void; advanceArrival(n: number): void };
  const settle = async () => { clock.advanceTransition(1); await Promise.resolve(); await Promise.resolve(); clock.advanceTransition(1); };
  const click = async (selector: string) => { scene.element.querySelector<HTMLButtonElement>(selector)!.click(); await settle(); };
  scene.open(); await settle();
  const segments = new Set<string>();
  let coastVerified = false;
  for (let frame = 0; frame < 1300 && !arrival.mock.calls.length; frame++) {
    await settle();
    if (scene.element.dataset.view === 'route') segments.add(scene.element.dataset.routeSegment!);
    if (scene.element.dataset.view === 'route' && action === 'opposite-lane') {
      await click(`[data-traversal-lane="${frame % 2}"]`);
    }
    if (scene.session.phase === 'ARRIVING') {
      if (!coastVerified) {
        const motion = scene as unknown as { routeRenderer: { distance: number }; speed: number;
          routeRun: { progress01: number } };
        const canonicalProgress = scene.session.routeProgress01;
        const routeProgress = motion.routeRun.progress01;
        const worldBefore = motion.routeRenderer.distance;
        clock.advanceArrival(.35);
        expect(motion.routeRenderer.distance).toBeGreaterThan(worldBefore);
        expect(motion.speed).toBeGreaterThan(2);
        expect(scene.session.routeProgress01).toBe(canonicalProgress);
        expect(motion.routeRun.progress01).toBe(routeProgress);
        coastVerified = true;
      } else clock.advanceArrival(.1);
    }
    else clock.advance(.1);
    await settle();
    if (scene.session.phase === 'FORK_OVERLAY') {
      expect(scene.element.querySelector<HTMLElement>('[data-traversal-event-panel]')!.hidden).toBe(true);
      const priorNode = state.run.currentNodeId;
      scene.element.querySelector<HTMLButtonElement>(`[data-traversal-fork-choice="${branch}"]`)!.click();
      expect(state.run.traversalBranches?.T0).toBeUndefined();
      expect(scene.element.dataset.departure).toBe('fork');
      scene.element.querySelector<HTMLButtonElement>(`[data-traversal-fork-choice="${branch}"]`)!.click();
      expect(state.run.traversalBranches?.T0).toBeUndefined();
      clock.advance(.12);
      expect(Number(scene.element.dataset.vehicleOffset)).toBeGreaterThan(0);
      expect(scene.element.style.getPropertyValue('--transition-opacity')).toBe('0');
      clock.advance(.16);
      clock.advanceTransition(.47);
      expect(state.run.traversalBranches?.T0).toBeUndefined();
      clock.advanceTransition(.01);
      expect(state.run.traversalBranches?.T0).toBe(branch);
      expect(scene.element.style.getPropertyValue('--transition-opacity')).toBe('1');
      expect(scene.element.querySelector('[data-world-section="forest-junction"]')).toBeNull();
      expect(scene.element.querySelector('[data-location-prop="junction-sign"]')).toBeNull();
      expect(scene.element.dataset.routeVariant).toBe(branch);
      await settle();
      expect(scene.session.phase).toBe('RUNNING');
      expect(state.run.currentNodeId).toBe(priorNode);
      continue;
    }
    if (scene.session.phase !== 'DECISION') continue;
    const beat = scene.route.beats.find(b => b.id === scene.session.pendingBeatId)!;
    expect(['PICKUP', 'SIMPLE_OBSTACLE', 'ROUTE_CHOICE']).not.toContain(beat.category);
    if (action !== 'confirm' && beat.interactionPolicy === 'OPTIONAL_CONFIRM') {
      await click('[data-traversal-skip]');
      expect(scene.session.bypassedBeatIds).toContain(beat.id);
      if (beat.campaignNodeIds.includes('lion-refugees')) {
        expect(scene.element.dataset.departure).toBe('return');
        expect(scene.element.dataset.visualMoving).toBe('true');
        expect(scene.element.querySelector<HTMLElement>('[data-traversal-event-panel]')!.hidden).toBe(true);
        const bypassCount = state.run.bypassedRouteNodeIds?.filter(id => id === 'lion-refugees').length ?? 0;
        scene.element.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
        expect(state.run.bypassedRouteNodeIds?.filter(id => id === 'lion-refugees')).toHaveLength(bypassCount);
        clock.advance(.12);
        expect(Number(scene.element.dataset.vehicleOffset)).toBeGreaterThan(0);
        expect(scene.element.style.getPropertyValue('--transition-opacity')).toBe('0');
      }
    } else {
      await click('[data-traversal-confirm]');
      if (String(scene.session.phase) === 'LOCAL_INTERACTION') await click('[data-traversal-confirm]');
    }
  }
  expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-first-refuge');
  expect(coastVerified).toBe(true);
  // The physical exit signals once even while GameApp waits for the covered handoff.
  expect(scene.session.phase).toBe('ARRIVING');
  clock.advanceArrival(10);
  clock.advanceArrival(10);
  expect(arrival).toHaveBeenCalledOnce();
  const beforeCompletion = structuredClone(state);
  scene.completeArrival();
  expect(scene.session.phase).toBe('COMPLETE');
  expect(state).toEqual(beforeCompletion);
  expect(state.run.currentNodeId).not.toBe('lion-first-refuge');
  expect(getAvailableRunNodes(state).map(node => node.id)).toEqual(['lion-first-refuge']);
  expect(handoffs).toEqual(action === 'confirm'
    ? ['lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees', branch]
    : ['lion-opening-ambush', 'lion-nomad-crossroads', branch]);
  expect(roadCombat).not.toHaveBeenCalled();
  expect(segments).toEqual(new Set(['route-1', 'route-2', 'route-3', 'route-4',
    branch === 'lion-first-trial-event' ? 'route-5a' : 'route-5b', 'route-6']));
  scene.dispose();
// This is a complete simulated road journey with real DOM rendering at each road step.
}, 30000);
