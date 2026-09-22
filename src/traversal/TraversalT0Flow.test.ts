// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';
import { traversalContactProgress } from './TraversalT0Route';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
it.each([
  ['confirm', 'lion-first-trial-event'], ['skip', 'lion-first-trial-event'], ['opposite-lane', 'lion-first-trial-event'],
  ['confirm', 'lion-first-trial-combat'], ['skip', 'lion-first-trial-combat'],
] as const)('completes T0 via %s and %s with direct fork and deferred branch entry', async (action, branch) => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const handoffs: string[] = [];
  const arrival = vi.fn();
  const roadCombat = vi.fn(async () => true);
  const scene = new TraversalT0Scene({
    root: document.body, leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
    getState: () => state, getAvailableNodes: () => getAvailableRunNodes(state),
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
  const pickups = new Set<string>();
  for (let frame = 0; frame < 1300 && !arrival.mock.calls.length; frame++) {
    await settle();
    const upcoming = scene.route.beats.find(beat => traversalContactProgress(beat) > scene.session.routeProgress01
      && (!beat.branchNodeId || state.run.traversalBranches?.T0 === beat.branchNodeId));
    if (upcoming?.lane != null) await click(`[data-traversal-lane="${action === 'opposite-lane' ? 1 - upcoming.lane : upcoming.lane}"]`);
    if (scene.session.phase === 'ARRIVING') clock.advanceArrival(.1);
    else clock.advance(.1);
    for (const beat of scene.route.beats.filter(b => b.category === 'PICKUP')) {
      if (scene.session.consumedBeatIds.includes(beat.id) && !scene.session.bypassedBeatIds.includes(beat.id)) {
        pickups.add(beat.id);
        expect(scene.session.pendingBeatId).not.toBe(beat.id);
      }
    }
    await settle();
    if (scene.session.phase === 'FORK_OVERLAY') {
      expect(scene.element.querySelector<HTMLElement>('[data-traversal-event-panel]')!.hidden).toBe(true);
      const priorNode = state.run.currentNodeId;
      scene.element.querySelector<HTMLButtonElement>(`[data-traversal-fork-choice="${branch}"]`)!.click();
      expect(state.run.traversalBranches?.T0).toBeUndefined();
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
      expect(scene.session.bypassedBeatIds).not.toContain(beat.id);
    } else {
      await click('[data-traversal-confirm]');
      if (String(scene.session.phase) === 'LOCAL_INTERACTION') await click('[data-traversal-confirm]');
    }
  }
  expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-first-refuge');
  expect(getAvailableRunNodes(state).map(node => node.id)).toEqual(['lion-first-refuge']);
  expect(handoffs).toEqual(action === 'confirm'
    ? ['lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees', branch]
    : ['lion-opening-ambush', branch]);
  if (action === 'confirm') { expect(pickups.size).toBe(3); expect(roadCombat).toHaveBeenCalledOnce(); }
  if (action === 'opposite-lane') expect(roadCombat).not.toHaveBeenCalled();
  scene.dispose();
// This is a complete simulated road journey with real DOM rendering at each road step.
}, 30000);
