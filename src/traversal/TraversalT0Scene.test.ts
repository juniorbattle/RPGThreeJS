// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TRAVERSAL_WORLD_ASSETS } from './TraversalT0World';
import { TraversalT0Scene } from './TraversalT0Scene';

const clock = (scene: TraversalT0Scene) => scene as unknown as {
  advance(seconds: number): void;
  advanceTransition(seconds: number): void;
};
async function settle(scene: TraversalT0Scene): Promise<void> {
  await (scene as unknown as { routeRenderer: { ready: Promise<void> } }).routeRenderer.ready;
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  clock(scene).advanceTransition(1);
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  clock(scene).advanceTransition(1);
}
function makeScene(onNodeHandoff = vi.fn()) {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const scene = new TraversalT0Scene({ root: document.body,
    leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
    getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff,
    onArrival: vi.fn(), onMenu: vi.fn() });
  return { scene, state, onNodeHandoff };
}

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('TraversalT0Scene Lot A', () => {
  it('opens one two-lane fast route with the existing caravan and no local road extras', async () => {
    const { scene } = makeScene();
    scene.open(); await settle(scene);
    expect(scene.element.dataset).toMatchObject({ traversalLeg: 'T0', view: 'route', routeWorld: 'shared',
      routeSegment: 'route-1', laneCount: '2', singleRoad: 'false' });
    expect(scene.element.querySelectorAll('.traversal-route-loop')).toHaveLength(1);
    const genericSections = [...scene.element.querySelectorAll<HTMLElement>('.traversal-world__route-sections [data-world-section]')];
    expect(genericSections).toHaveLength(14);
    expect(genericSections.every(section => section.dataset.sectionKind === 'FOREST'
      && section.querySelector('.traversal-world-section__painting > img')?.getAttribute('src') === TRAVERSAL_WORLD_ASSETS.forest
      && !section.querySelector('[data-location-prop]'))).toBe(true);
    expect(scene.element.querySelectorAll('.traversal-world__road')).toHaveLength(1);
    expect(scene.element.querySelectorAll('[data-traversal-lane]')).toHaveLength(2);
    expect(scene.element.querySelector('.traversal-vehicle')?.getAttribute('data-visible-wheels')).toBe('4');
    expect(scene.element.querySelectorAll('[data-rail-stop]')).toHaveLength(7);
    expect(scene.element.querySelector('[data-traversal-beat="t0:npc:roadside-merchant"]')).toBeNull();
    expect(scene.element.querySelector('[data-world-section="merchant-halt"]')).toBeNull();
    expect(scene.route.beats.some(beat => !beat.campaignNodeIds.length)).toBe(false);
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')!.click();
    expect(scene.session.currentLane).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(scene.session.currentLane).toBe(0);
    scene.dispose();
  });

  it('swaps route to checkpoint only at a fully black midpoint and blocks lane input', async () => {
    const { scene } = makeScene();
    scene.open(); await settle(scene);
    clock(scene).advance(12.1);
    expect(scene.element.dataset.transition).toBe('focus');
    expect(scene.element.dataset.view).toBe('route');
    clock(scene).advanceTransition(.3);
    expect(scene.element.dataset.view).toBe('route');
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')!.click();
    expect(scene.session.currentLane).toBe(0);
    clock(scene).advanceTransition(.18);
    expect(scene.element.style.getPropertyValue('--transition-opacity')).toBe('1');
    expect(scene.element.dataset.view).toBe('checkpoint');
    expect(scene.element.dataset.checkpointEntries).toBe('1');
    clock(scene).advance(2);
    expect(scene.session.phase).toBe('RUNNING');
    await settle(scene);
    expect(scene.element.dataset.transition).toBeUndefined();
    expect(scene.element.dataset.checkpointEntries).toBe('1');
    scene.dispose();
  });

  it('crescendos on Route 1, frames the authored ambush, and hands off once under cover', async () => {
    const handoff = vi.fn();
    const { scene } = makeScene(handoff);
    scene.open();
    clock(scene).advance(5);
    expect(scene.session.routeProgress01).toBe(0);
    await settle(scene);
    clock(scene).advance(2);
    const earlySpeed = Number(scene.element.dataset.routeSpeed);
    clock(scene).advance(8);
    expect(Number(scene.element.dataset.routeSpeed)).toBeGreaterThan(earlySpeed);
    expect(Number(scene.element.dataset.routeProgress)).toBeGreaterThan(.8);
    clock(scene).advance(4);
    expect(scene.session.routeProgress01).toBe(.2);
    expect(scene.element.dataset.transition).toBe('focus');
    expect(handoff).not.toHaveBeenCalled();
    await settle(scene);
    expect(scene.element.dataset.view).toBe('checkpoint');
    expect(scene.element.querySelector('[data-world-section="opening-ambush"]')).not.toBeNull();
    clock(scene).advance(1.2);
    expect(scene.session.phase).toBe('NODE_HANDOFF');
    expect(handoff).not.toHaveBeenCalled();
    clock(scene).advanceTransition(.3);
    expect(handoff).not.toHaveBeenCalled();
    clock(scene).advanceTransition(.18);
    expect(handoff).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: 'lion-opening-ambush' }),
      expect.objectContaining({ activeNodeId: 'lion-opening-ambush' }),
    );
    scene.beginNodeResolution('lion-opening-ambush');
    scene.resumeNode('lion-opening-ambush');
    expect(scene.element.dataset.routeSegment).toBe('route-2');
    expect(scene.element.dataset.view).toBe('route');
    expect(scene.element.dataset.routeWorld).toBe('shared');
    expect(scene.session.stageIndex).toBe(1);
    expect(handoff).toHaveBeenCalledOnce();
    scene.dispose();
  });
});
