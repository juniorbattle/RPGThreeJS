// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

it.each(['confirm', 'skip', 'opposite-lane'] as const)('runs every local beat via %s while canonical stages retain authority', (action) => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-audience';
  const handoffs: string[] = [];
  const arrival = vi.fn();
  const scene = new TraversalT0Scene({
    root: document.body,
    leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
    getState: () => state,
    getAvailableNodes: () => getAvailableRunNodes(state),
    onNodeHandoff: (node) => {
      expect(enterRunNode(state.run, node.id)?.id).toBe(node.id);
      state.currentNodeId = node.id;
      handoffs.push(node.id);
      scene.beginNodeResolution(node.id);
      scene.resumeNode(node.id);
    },
    onArrival: arrival,
    onMenu: () => undefined,
  });
  scene.open();
  const advance = (seconds: number) => (scene as unknown as { advance(seconds: number): void }).advance(seconds);
  const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!.click();
  for (const beat of scene.route.beats) {
    const local = beat.campaignNodeIds.length === 0;
    const lane = local ? (action === 'opposite-lane' ? 1 - beat.lane! : beat.lane!) : handoffs.length % 2;
    click(`[data-traversal-lane="${lane}"]`);
    const before = JSON.stringify(state);
    advance((beat.progress01 - scene.session.routeProgress01) / .012 + .001);
    if (local && action === 'opposite-lane') {
      expect(scene.session.phase).toBe('RUNNING');
      expect(scene.session.bypassedBeatIds).toContain(beat.id);
    } else {
      expect(scene.session.phase).toBe('DECISION');
      expect(scene.session.routeProgress01).toBe(beat.progress01);
      advance(100);
      expect(scene.session.routeProgress01).toBe(beat.progress01);
      if (local && action === 'skip') click('[data-traversal-skip]');
      else {
        click('[data-traversal-confirm]');
        if (local) {
          expect(scene.session.phase).toBe('LOCAL_INTERACTION');
          advance(100);
          expect(scene.session.routeProgress01).toBe(beat.progress01);
          click('[data-traversal-confirm]');
        } else if (beat.type === 'fork') {
          expect(scene.session.phase).toBe('FORK_OVERLAY');
          click('[data-traversal-fork-choice="lion-first-trial-event"]');
        }
      }
    }
    expect(scene.session.phase).toBe('RUNNING');
    expect(scene.session.currentLane).toBe(lane);
    if (local) {
      expect(scene.session.consumedBeatIds).toContain(beat.id);
      expect(JSON.stringify(state)).toBe(before);
    }
  }
  expect(handoffs).toEqual(['lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees', 'lion-first-trial-event']);
  expect(scene.session.consumedBeatIds).toHaveLength(9);
  advance(100);
  advance(100);
  expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-first-refuge');
  scene.dispose();
});
