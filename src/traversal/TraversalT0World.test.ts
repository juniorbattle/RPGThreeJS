// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { beatWorldX, ROAD_SPACE } from './TraversalRoadSpace';
import { resolveTraversalT0Route } from './TraversalT0Route';
import { TRAVERSAL_T0_WORLD, TRAVERSAL_T0_ROUTE_WORLD, TRAVERSAL_T0_ROUTE_WORLD_PERIOD,
  t0RouteWorldCamera, TRAVERSAL_WORLD_ASSETS, TRAVERSAL_T0_WORLD_PRESENTATION,
  TRAVERSAL_SECTION_OVERLAP, resolveTraversalWorld, traversalLocation } from './TraversalT0World';
import { TraversalT0Scene } from './TraversalT0Scene';
import { TraversalWorldRenderer } from './TraversalWorldRenderer';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('T0 authored geography', () => {
  it('renders every Route from the exact generic checkpoint forest without event dressing', () => {
    expect(TRAVERSAL_T0_ROUTE_WORLD.every(section => section.asset === TRAVERSAL_WORLD_ASSETS.forest
      && section.kind === 'FOREST' && !section.props && !section.variantAssets)).toBe(true);
    const renderer = new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);
    renderer.updateRoute(t0RouteWorldCamera(4800), ROAD_SPACE.referenceWidth);
    const visible = [...renderer.routeElement.querySelectorAll<HTMLElement>('[data-world-section]')]
      .filter(section => !section.hidden);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every(section => section.querySelector('.traversal-world-section__painting > img')
      ?.getAttribute('src') === TRAVERSAL_WORLD_ASSETS.forest)).toBe(true);
    expect(renderer.routeElement.querySelector('[data-location-prop], [data-traversal-beat]')).toBeNull();
    expect(renderer.element.querySelector('[data-world-section="opening-ambush"]')).not.toBeNull();
    expect(t0RouteWorldCamera(4800)).toBe(4800);
    expect(t0RouteWorldCamera(4800 + TRAVERSAL_T0_ROUTE_WORLD_PERIOD)).toBe(4800);
    const loopEnd = TRAVERSAL_T0_ROUTE_WORLD[0]!.worldStart + TRAVERSAL_T0_ROUTE_WORLD_PERIOD;
    expect(t0RouteWorldCamera(loopEnd - 1)).toBe(loopEnd - 1);
    renderer.updateRoute(t0RouteWorldCamera(loopEnd - 1), ROAD_SPACE.referenceWidth);
    const crossing = [...renderer.routeElement.querySelectorAll<HTMLElement>('[data-world-section]')]
      .filter(section => !section.hidden);
    expect(crossing.some(section => section.dataset.worldSection === 'route-forest-0-wrap')).toBe(true);
    expect(crossing.every(section => section.querySelector('.traversal-world-section__painting > img')
      ?.getAttribute('src') === TRAVERSAL_WORLD_ASSETS.forest && !section.querySelector('[data-location-prop]'))).toBe(true);
  });

  it('covers the entire driven road and exit without holes, and places referenced beats inside their locations', () => {
    const state = createInitialState();
    const leg = LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!;
    const route = resolveTraversalT0Route(leg, state.run.graph.nodes);
    expect(TRAVERSAL_T0_WORLD[0]!.worldStart).toBeLessThanOrEqual(0);
    expect(TRAVERSAL_T0_WORLD.at(-1)!.worldEnd).toBeGreaterThan(ROAD_SPACE.length + ROAD_SPACE.referenceWidth);
    TRAVERSAL_T0_WORLD.forEach((section, index) => {
      expect(section.worldStart).toBeLessThan(section.coreStart);
      expect(section.coreStart).toBeLessThan(section.coreEnd);
      expect(section.coreEnd).toBeLessThan(section.worldEnd);
      if (index > 0) expect(section.worldStart).toBe(TRAVERSAL_T0_WORLD[index - 1]!.worldEnd);
    });
    for (const beat of route.beats.filter(beat => beat.locationId)) {
      const location = traversalLocation(beat.locationId!)!;
      expect(location, beat.id).toBeDefined();
      expect(beatWorldX(beat.progress01)).toBeGreaterThanOrEqual(location.coreStart);
      expect(beatWorldX(beat.progress01)).toBeLessThanOrEqual(location.coreEnd);
    }
    for (const beat of route.beats.filter(beat => ['loot', 'booster', 'enemy', 'obstacle'].includes(beat.type))) {
      expect(beat.locationId).toBeUndefined();
    }
    for (const asset of Object.values(TRAVERSAL_WORLD_ASSETS)) {
      const bytes = readFileSync(`public${asset}`);
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1536, 1024]);
    }
  });

  it('keeps checkpoint geography separate from actors while excluding the merchant halt', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() });
    const clock = scene as unknown as { advance(seconds: number): void; advanceTransition(seconds: number): void };
    scene.open();
    await (scene as unknown as { routeRenderer: { ready: Promise<void> } }).routeRenderer.ready;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    clock.advanceTransition(.6);
    expect(scene.session.routeProgress01).toBe(0);
    expect(Number.parseFloat(scene.element.style.getPropertyValue('--vehicle-entry-x'))).toBeLessThan(0);
    clock.advanceTransition(.4);
    clock.advance(13);
    clock.advance(.28);
    clock.advanceTransition(1);
    const section = scene.element.querySelector<HTMLElement>('[data-world-section="opening-ambush"]')!;
    const snapshot = JSON.stringify(state);
    expect(scene.element.dataset.view).toBe('checkpoint');
    expect(scene.element.querySelector('[data-world-section="merchant-halt"]')).toBeNull();
    expect(section.hidden).toBe(false);
    scene.element.querySelector('.traversal-world__entities')!.replaceChildren();
    expect(section.isConnected).toBe(true);
    expect(scene.element.querySelector('[data-location-prop="junction-sign"]')).not.toBeNull();
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(scene.element.querySelector('.traversal-entity__backdrop, .traversal-grounding, .traversal-verge')).toBeNull();
    scene.dispose();
  });

  it('only changes scenery from supplied resolved state and presented branch, keeping a single road camera', () => {
    const renderer = new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);
    renderer.setDirections([{ id: 'lion-first-trial-event', label: 'Rencontre sur la route' }]);
    renderer.setDirections([{ id: 'lion-first-trial-event', label: 'Marchand blessé' }]);
    expect(renderer.element.querySelector('.traversal-sign-directions')?.textContent).toBe('↖ Marchand blessé');
    const camera = 810;
    const width = 960;
    renderer.update(camera, width, 'main', new Set());
    expect(renderer.element.style.transform).toBe(`translateX(${-camera * width / ROAD_SPACE.referenceWidth}px)`);
    const image = (id: string) => renderer.element.querySelector<HTMLImageElement>(`[data-world-section="${id}"] .traversal-world-section__painting > img`)!.getAttribute('src');
    expect(image('opening-ambush')).toBe(TRAVERSAL_WORLD_ASSETS.ambush);
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.forest);
    renderer.update(camera, width, 'lion-first-trial-combat', new Set(['opening-ambush']));
    expect(image('opening-ambush')).toBe(TRAVERSAL_WORLD_ASSETS.ambushCleared);
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.ruins);
    renderer.update(camera, width, 'lion-first-trial-event', new Set(['opening-ambush']));
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.caravan);
  });

  it.each(['lion-first-trial-event', 'lion-first-trial-combat'])('replaces the old junction with the %s lateral road', branch => {
    const sequence = resolveTraversalWorld(branch);
    expect(sequence.some(s => s.id === 'forest-junction')).toBe(false);
    const selected = sequence.find(s => s.id === 'selected-route')!;
    expect(selected.worldStart).toBe(traversalLocation('selected-route')!.worldStart);
    const approach = sequence.find(s => s.id === 'selected-approach')!;
    expect(approach.worldStart).toBe(traversalLocation('forest-junction')!.worldStart);
    expect(approach.asset).toBe(branch.endsWith('event') ? TRAVERSAL_WORLD_ASSETS.forest : TRAVERSAL_WORLD_ASSETS.ruins);
    expect(selected.asset).toBe(branch.endsWith('event') ? TRAVERSAL_WORLD_ASSETS.caravan : TRAVERSAL_WORLD_ASSETS.ruins);
    const renderer = new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);
    renderer.update(7200, 1463, branch, new Set());
    expect(renderer.element.querySelector('[data-world-section="forest-junction"]')).toBeNull();
    expect(renderer.element.querySelector('[data-location-prop="junction-sign"]')).toBeNull();
    expect(renderer.element.querySelector<HTMLElement>('[data-world-section="selected-route"]')!.hidden).toBe(false);
    sequence.forEach((section, index) => {
      expect(section.coreStart).toBeGreaterThan(section.worldStart + TRAVERSAL_SECTION_OVERLAP);
      expect(section.coreEnd).toBeLessThan(section.worldEnd - TRAVERSAL_SECTION_OVERLAP);
      if (index) expect(section.worldStart).toBe(sequence[index - 1]!.worldEnd);
    });
    expect(resolveTraversalWorld('lion-first-trial-event')).not.toEqual(resolveTraversalWorld('lion-first-trial-combat'));
  });
});
