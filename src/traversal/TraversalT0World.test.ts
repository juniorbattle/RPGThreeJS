// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { beatWorldX, ROAD_SPACE } from './TraversalRoadSpace';
import { resolveTraversalT0Route } from './TraversalT0Route';
import { TRAVERSAL_T0_WORLD, TRAVERSAL_WORLD_ASSETS, traversalLocation } from './TraversalT0World';
import { TraversalT0Scene } from './TraversalT0Scene';
import { TraversalWorldRenderer } from './TraversalWorldRenderer';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('T0 authored geography', () => {
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

  it('keeps physical places and the junction sign when interaction actors are removed or consumed', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() });
    const clock = scene as unknown as { advance(seconds: number): void; advanceTransition(seconds: number): void };
    scene.open();
    clock.advanceTransition(.6);
    expect(scene.session.routeProgress01).toBe(0);
    expect(Number.parseFloat(scene.element.style.getPropertyValue('--vehicle-entry-x'))).toBeLessThan(0);
    clock.advanceTransition(.4);
    clock.advance(10);
    clock.advanceTransition(1);
    const section = scene.element.querySelector<HTMLElement>('[data-world-section="merchant-halt"]')!;
    const snapshot = JSON.stringify(state);
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!.click();
    clock.advanceTransition(1);
    clock.advanceTransition(1);
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!.click();
    clock.advanceTransition(.6);
    expect(scene.session.consumedBeatIds).toContain('t0:npc:roadside-merchant');
    expect(section.hidden).toBe(false);
    scene.element.querySelector('.traversal-world__entities')!.replaceChildren();
    expect(section.isConnected).toBe(true);
    expect(scene.element.querySelector('[data-location-prop="junction-sign"]')).not.toBeNull();
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(scene.element.querySelector('.traversal-entity__backdrop, .traversal-grounding, .traversal-verge')).toBeNull();
    scene.dispose();
  });

  it('only changes scenery from supplied resolved state and presented branch, keeping a single road camera', () => {
    const renderer = new TraversalWorldRenderer();
    renderer.setDirections([{ id: 'lion-first-trial-event', label: 'Rencontre sur la route' }]);
    renderer.setDirections([{ id: 'lion-first-trial-event', label: 'Marchand blessé' }]);
    expect(renderer.element.querySelector('.traversal-sign-directions')?.textContent).toBe('↖ Marchand blessé');
    const camera = 810;
    const width = 960;
    renderer.update(camera, width, 'main', new Set());
    expect(renderer.element.style.transform).toBe(`translateX(${-camera * width / ROAD_SPACE.referenceWidth}px)`);
    const image = (id: string) => renderer.element.querySelector<HTMLImageElement>(`[data-world-section="${id}"] > img`)!.getAttribute('src');
    expect(image('opening-ambush')).toBe(TRAVERSAL_WORLD_ASSETS.ambush);
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.forest);
    renderer.update(camera, width, 'lion-first-trial-combat', new Set(['opening-ambush']));
    expect(image('opening-ambush')).toBe(TRAVERSAL_WORLD_ASSETS.ambushCleared);
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.ruins);
    renderer.update(camera, width, 'lion-first-trial-event', new Set(['opening-ambush']));
    expect(image('selected-route')).toBe(TRAVERSAL_WORLD_ASSETS.caravan);
  });
});
