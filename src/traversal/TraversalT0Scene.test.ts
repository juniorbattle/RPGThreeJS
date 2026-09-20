// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';

describe('TraversalT0Scene', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders one two-lane road, the wooden 4x4, top event HUD and independent entities', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const state = createInitialState();
    state.run.currentNodeId = 'lion-audience';
    state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({
      root: document.body,
      leg: LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T0')!,
      getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: () => undefined,
      onArrival: () => undefined,
      onMenu: () => undefined,
    });
    scene.open();

    expect(document.querySelectorAll('.traversal-world__road')).toHaveLength(1);
    expect(document.querySelectorAll('[data-traversal-lane]')).toHaveLength(2);
    expect(document.querySelector('.traversal-t0')?.getAttribute('data-lane-count')).toBe('2');
    expect(document.querySelector('.traversal-vehicle img')?.getAttribute('src')).toContain('/vehicle/wooden-4x4/');
    expect(document.querySelector('.traversal-vehicle')?.getAttribute('data-empty-cabin')).toBe('true');
    expect(document.querySelector('.traversal-vehicle')?.getAttribute('data-visible-wheels')).toBe('4');
    expect(document.querySelectorAll('[data-traversal-beat]').length).toBeGreaterThanOrEqual(5);
    expect(document.querySelector('[data-traversal-leg="T0"]')?.getAttribute('data-single-road')).toBe('true');
    expect(document.querySelector('[data-traversal-event-panel]')).not.toBeNull();
    expect(document.querySelector('.traversal-party')).toBeNull();
    expect(document.querySelector('.traversal-controls')).toBeNull();
    expect(document.querySelectorAll('[data-placement="centered"][data-interaction-policy="MANDATORY_CONFIRM"]')).not.toHaveLength(0);
    expect(document.querySelectorAll('[data-placement="lane"][data-interaction-policy="OPTIONAL_CONFIRM"]')).not.toHaveLength(0);
    expect(document.querySelector('[data-traversal-beat="t0:enemy:wolf-scouts"] [data-facing="left"]')?.classList.contains('is-mirrored')).toBe(true);

    document.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')?.click();
    expect(scene.session.currentLane).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(scene.session.currentLane).toBe(1);
    scene.dispose();
  });

  it('holds optional and mandatory decisions before committing and preserves the same run', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const state = createInitialState();
    state.run.currentNodeId = 'lion-audience';
    state.currentNodeId = 'lion-audience';
    const handoff = vi.fn();
    const scene = new TraversalT0Scene({
      root: document.body,
      leg: LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T0')!,
      getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: handoff,
      onArrival: () => undefined,
      onMenu: () => undefined,
    });
    scene.open();
    (scene as unknown as { advance: (seconds: number) => void }).advance(20);

    const advance = (seconds: number) => (scene as unknown as { advance: (seconds: number) => void }).advance(seconds);
    const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
    const before = JSON.stringify(state);
    expect(scene.session.phase).toBe('DECISION');
    expect(scene.session.routeProgress01).toBe(0.12);
    expect(handoff).not.toHaveBeenCalled();
    advance(20);
    button('[data-traversal-lane="1"]').click();
    expect(scene.session.currentLane).toBe(0);
    expect(scene.session.routeProgress01).toBe(0.12);
    button('[data-traversal-confirm]').click();
    expect(scene.session.phase).toBe('LOCAL_INTERACTION');
    expect(button('[data-traversal-skip]').hidden).toBe(true);
    advance(20);
    expect(scene.session.routeProgress01).toBe(0.12);
    button('[data-traversal-confirm]').click();
    expect(scene.session.phase).toBe('RUNNING');
    expect(JSON.stringify(state)).toBe(before);
    advance(20);
    expect(scene.session.phase).toBe('DECISION');
    expect(scene.session.routeProgress01).toBe(0.2);
    expect(scene.session.consumedBeatIds).toEqual(expect.arrayContaining([
      't0:npc:roadside-merchant', 't0:enemy:wolf-scouts',
    ]));
    expect(button('[data-traversal-skip]').hidden).toBe(true);
    button('[data-traversal-skip]').click();
    expect(scene.session.phase).toBe('DECISION');
    expect(handoff).not.toHaveBeenCalled();
    button('[data-traversal-confirm]').click();
    expect(handoff).toHaveBeenCalledTimes(1);
    expect(handoff).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lion-opening-ambush' }),
      expect.objectContaining({ activeNodeId: 'lion-opening-ambush' }),
    );
    button('[data-traversal-confirm]').click();
    expect(handoff).toHaveBeenCalledTimes(1);
    scene.beginNodeResolution('lion-opening-ambush');
    advance(20);
    expect(scene.session.routeProgress01).toBe(0.2);
    scene.resumeNode('lion-opening-ambush');
    expect(scene.session.phase).toBe('RUNNING');
    expect(scene.session.routeProgress01).toBe(0.2);
    expect(scene.session.stageIndex).toBe(1);
    expect(scene.session.consumedBeatIds).toContain('t0:npc:roadside-merchant');
    advance(0.1);
    expect(scene.session.routeProgress01).toBeGreaterThan(0.2);
    scene.dispose();
  });
});
