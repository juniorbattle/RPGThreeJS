// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';

function settle(scene: TraversalT0Scene): void {
  (scene as unknown as { advanceTransition(seconds: number): void }).advanceTransition(.6);
  (scene as unknown as { advanceTransition(seconds: number): void }).advanceTransition(.6);
}

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

it.each(['confirm', 'skip', 'opposite-lane'] as const)('completes T0 via %s with deferred branch entry', action => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const handoffs: string[] = [];
  const arrival = vi.fn();
  const scene = new TraversalT0Scene({
    root: document.body, leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
    getState: () => state, getAvailableNodes: () => getAvailableRunNodes(state),
    onNodeHandoff: node => {
      expect(enterRunNode(state.run, node.id)?.id).toBe(node.id);
      state.currentNodeId = node.id;
      handoffs.push(node.id);
      scene.beginNodeResolution(node.id);
      scene.resumeNode(node.id);
    },
    onArrival: arrival, onMenu: () => undefined,
  });
  scene.open();
    settle(scene);
  const advance = (seconds: number) => (scene as unknown as { advance(seconds: number): void }).advance(seconds);
  const click = (selector: string) => { document.querySelector<HTMLButtonElement>(selector)!.click(); settle(scene); };
  for (let frame = 0; frame < 2000 && !arrival.mock.calls.length; frame++) {
    const upcoming = scene.route.beats.find(beat => beat.progress01 > scene.session.routeProgress01
      && (!beat.branchNodeId || state.run.traversalBranches?.T0 === beat.branchNodeId));
    if (upcoming?.lane != null) {
      const lane = action === 'opposite-lane' ? 1 - upcoming.lane : upcoming.lane;
      click(`[data-traversal-lane="${lane}"]`);
    }
    if (scene.session.phase === 'ARRIVING') {
      (scene as unknown as { advanceArrival(seconds: number): void }).advanceArrival(.1);
    } else advance(.1);
    if (scene.session.phase !== 'DECISION') continue;
    const beat = scene.route.beats.find(candidate => candidate.id === scene.session.pendingBeatId)!;
    const before = JSON.stringify(state);
    const progress = scene.session.routeProgress01;
    advance(10);
    expect(scene.session.routeProgress01).toBe(progress);
    if (action === 'skip' && beat.interactionPolicy === 'OPTIONAL_CONFIRM') click('[data-traversal-skip]');
    else {
      click('[data-traversal-confirm]');
      if (beat.type === 'fork') {
        const priorHandoffs = handoffs.length;
        const priorNode = state.run.currentNodeId;
        document.querySelector<HTMLButtonElement>('[data-traversal-fork-choice="lion-first-trial-event"]')!.click();
        expect(scene.element.dataset.transition).toBe('fork');
        const forkProgress = scene.session.routeProgress01;
        advance(10);
        expect(scene.session.routeProgress01).toBe(forkProgress);
        settle(scene);
        expect(scene.session.currentLane).toBe(0);
        expect(scene.element.dataset.routeVariant).toBe('lion-first-trial-event');
        expect(scene.session.phase).toBe('RUNNING');
        expect(handoffs).toHaveLength(priorHandoffs);
        expect(state.run.currentNodeId).toBe(priorNode);
        expect(state.run.traversalBranches?.T0).toBe('lion-first-trial-event');
      } else if (!beat.campaignNodeIds.length) {
        expect(scene.session.phase).toBe('LOCAL_INTERACTION');
        click('[data-traversal-confirm]');
      }
    }
    if (!beat.campaignNodeIds.length) expect(JSON.stringify(state)).toBe(before);
  }
  expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-first-refuge');
  expect(getAvailableRunNodes(state).map(node => node.id)).toEqual(['lion-first-refuge']);
  expect(handoffs).toEqual(action === 'confirm'
    ? ['lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees', 'lion-first-trial-event']
    : ['lion-opening-ambush']);
  if (action === 'opposite-lane') expect(scene.session.bypassedBeatIds).toHaveLength(8);
  scene.dispose();
});
