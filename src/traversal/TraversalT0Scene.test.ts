// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalT0Scene } from './TraversalT0Scene';

function settle(scene: TraversalT0Scene): void {
  (scene as unknown as { advanceTransition(seconds: number): void }).advanceTransition(.6);
  (scene as unknown as { advanceTransition(seconds: number): void }).advanceTransition(.6);
}

describe('TraversalT0Scene', () => {
  it('coalesces bounded physics steps without stepping past the first decision', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(),
      onArrival: vi.fn(), onMenu: vi.fn() });
    scene.open(); settle(scene);
    const clock = scene as unknown as { advance(seconds: number): void; updateWorldTransforms(): void };
    const updates = vi.spyOn(clock, 'updateWorldTransforms');
    clock.advance(20);
    expect(updates).toHaveBeenCalledOnce();
    expect(scene.session.routeProgress01).toBe(.09);
    expect(scene.session.phase).toBe('DECISION');
    expect(scene.session.pendingBeatId).toBe('t0:npc:roadside-merchant');
    scene.dispose();
  });

  it('holds distance during entry and delays canonical handoff until the fade covers the road', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const handoff = vi.fn();
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: handoff,
      onArrival: vi.fn(), onMenu: vi.fn() });
    const clock = scene as unknown as { advance(seconds: number): void; advanceTransition(seconds: number): void };
    scene.open();
    clock.advance(5);
    expect(scene.session.routeProgress01).toBe(0);
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')!.click();
    clock.advance(20);
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
    clock.advance(20);
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!.click();
    expect(handoff).not.toHaveBeenCalled();
    clock.advanceTransition(.30);
    expect(handoff).not.toHaveBeenCalled();
    expect(Number(scene.element.style.getPropertyValue('--transition-opacity'))).toBeCloseTo(.5);
    clock.advance(10);
    expect(scene.session.routeProgress01).toBe(.2);
    clock.advanceTransition(.18);
    expect(handoff).toHaveBeenCalledOnce();
    settle(scene);
    expect(handoff).toHaveBeenCalledOnce();
    scene.dispose();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders one two-lane road, the travel caravan, top event HUD and independent entities', () => {
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
    settle(scene);

    expect(document.querySelectorAll('.traversal-world__road')).toHaveLength(1);
    (scene as unknown as { advance(seconds: number): void }).advance(5);
    expect(document.querySelector<HTMLElement>('[data-traversal-event-panel]')!.hidden).toBe(true);
    expect(document.querySelectorAll('[data-traversal-lane]')).toHaveLength(2);
    expect(document.querySelector('.traversal-t0')?.getAttribute('data-lane-count')).toBe('2');
    expect(document.querySelector('.traversal-vehicle img')?.getAttribute('src')).toContain('/vehicle/traversal-caravan/');
    expect(document.querySelector('.traversal-vehicle')?.getAttribute('data-enclosed-cabin')).toBe('true');
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
    settle(scene);
    (scene as unknown as { advance: (seconds: number) => void }).advance(20);
    settle(scene);

    const advance = (seconds: number) => (scene as unknown as { advance: (seconds: number) => void }).advance(seconds);
    const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
    const before = JSON.stringify(state);
    expect(scene.session.phase).toBe('DECISION');
    expect(scene.session.routeProgress01).toBe(0.09);
    expect(handoff).not.toHaveBeenCalled();
    advance(20);
    button('[data-traversal-lane="1"]').click();
    expect(scene.session.currentLane).toBe(0);
    expect(scene.session.routeProgress01).toBe(0.09);
    button('[data-traversal-confirm]').click();
    settle(scene);
    expect(scene.session.phase).toBe('LOCAL_INTERACTION');
    expect(button('[data-traversal-skip]').hidden).toBe(true);
    advance(20);
    expect(scene.session.routeProgress01).toBe(0.09);
    button('[data-traversal-confirm]').click();
    settle(scene);
    expect(scene.session.phase).toBe('RUNNING');
    expect(JSON.stringify(state)).toBe(before);
    advance(20);
    expect(scene.session.phase).toBe('DECISION');
    settle(scene);
    expect(scene.session.routeProgress01).toBe(0.2);
    expect(scene.session.consumedBeatIds).toEqual(expect.arrayContaining([
      't0:npc:roadside-merchant',
    ]));
    expect(scene.session.bypassedBeatIds).not.toContain('t0:enemy:wolf-scouts');
    expect(button('[data-traversal-skip]').hidden).toBe(true);
    button('[data-traversal-skip]').click();
    expect(scene.session.phase).toBe('DECISION');
    expect(handoff).not.toHaveBeenCalled();
    button('[data-traversal-confirm]').click();
    settle(scene);
    expect(handoff).toHaveBeenCalledTimes(1);
    expect(handoff).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lion-opening-ambush' }),
      expect.objectContaining({ activeNodeId: 'lion-opening-ambush' }),
    );
    button('[data-traversal-confirm]').click();
    settle(scene);
    expect(handoff).toHaveBeenCalledTimes(1);
    scene.beginNodeResolution('lion-opening-ambush');
    advance(20);
    expect(scene.session.routeProgress01).toBe(0.2);
    scene.resumeNode('lion-opening-ambush');
    settle(scene);
    expect(scene.session.phase).toBe('RUNNING');
    expect(scene.session.routeProgress01).toBe(0.2);
    expect(scene.session.stageIndex).toBe(1);
    expect(scene.session.consumedBeatIds).toContain('t0:npc:roadside-merchant');
    advance(0.1);
    expect(scene.session.routeProgress01).toBeGreaterThan(0.2);
    scene.dispose();
  });

  it('runs non-campaign combat while holding the same road session, then resumes without narrative mutation', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    let finish!: (victory: boolean) => void;
    const roadCombat = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const handoff = vi.fn();
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
      getState: () => state, getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: handoff, onRoadCombat: roadCombat, onArrival: vi.fn(), onMenu: vi.fn() });
    scene.open();
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-lane="1"]')!.click();
    const advance = (seconds: number) => (scene as unknown as { advance(seconds: number): void }).advance(seconds);
    advance(20);
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
    advance(20);
    settle(scene);
    document.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!.click();
    settle(scene);
    scene.beginNodeResolution('lion-opening-ambush');
    scene.resumeNode('lion-opening-ambush');
    settle(scene);
    handoff.mockClear();
    advance(10);
    settle(scene);
    const snapshot = JSON.stringify(state);
    expect(scene.session.routeProgress01).toBe(.30);
    const interaction = (scene as unknown as { confirmDecision(): Promise<void> }).confirmDecision();
    settle(scene);
    expect(roadCombat).toHaveBeenCalledOnce();
    advance(100);
    expect(scene.session.routeProgress01).toBe(.30);
    expect(handoff).not.toHaveBeenCalled();
    finish(true);
    await interaction;
    expect(scene.session.phase).toBe('RUNNING');
    expect(scene.session.consumedBeatIds).toContain('t0:enemy:wolf-scouts');
    expect(JSON.stringify(state)).toBe(snapshot);
    scene.dispose();
  });

  it.each([0, 1] as const)('ignores a human on exact lane %s without steering and records bypass only after passing', lane => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!,
      getState: () => state, getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() });
    scene.open();
    settle(scene);
    const internals = scene as unknown as { moveToLane(lane: number): void; controller: { moveLane(direction: number): void } };
    internals.moveToLane(lane);
    const movement = vi.spyOn(internals, 'moveToLane');
    const controllerMovement = vi.spyOn(internals.controller, 'moveLane');
    const advance = (seconds: number) => (scene as unknown as { advance(seconds: number): void }).advance(seconds);
    advance(20);
    settle(scene);
    const world = document.querySelector<HTMLElement>('.traversal-t0')!;
    const vehicle = world.querySelector<HTMLElement>('.traversal-vehicle')!;
    const subject = document.querySelector<HTMLElement>('[data-traversal-beat="t0:npc:roadside-merchant"]')!;
    const beforeX = parseFloat(subject.style.left);
    const beforeProgress = scene.session.routeProgress01;
    const beforeWheel = vehicle.style.getPropertyValue('--wheel-angle');
    advance(10);
    expect(subject.style.left).toBe(`${beforeX}px`);
    expect(vehicle.style.getPropertyValue('--wheel-angle')).toBe(beforeWheel);
    document.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
    expect(scene.session.bypassedBeatIds).not.toContain('t0:npc:roadside-merchant');
    expect(scene.session.currentLane).toBe(lane);
    expect(movement).not.toHaveBeenCalled();
    expect(controllerMovement).not.toHaveBeenCalled();
    expect(world.dataset.assistedBypass).toBe('false');
    expect(subject.hidden).toBe(false);
    advance(.5);
    expect(subject.hidden).toBe(false);
    expect(parseFloat(subject.style.left)).toBeLessThan(beforeX);
    expect(scene.session.routeProgress01).toBeGreaterThan(beforeProgress);
    expect(vehicle.style.getPropertyValue('--wheel-angle')).not.toBe(beforeWheel);
    advance(4.5);
    expect(scene.session.currentLane).toBe(lane);
    expect(movement).not.toHaveBeenCalled();
    expect(controllerMovement).not.toHaveBeenCalled();
    expect(scene.session.bypassedBeatIds).toContain('t0:npc:roadside-merchant');
    expect(document.querySelector<HTMLButtonElement>('[data-traversal-lane="0"]')!.disabled).toBe(false);
    scene.dispose();
  });

  it('retains the physical assisted escape for optional combat Flee', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const state = createInitialState();
    state.run.currentNodeId = state.currentNodeId = 'lion-audience';
    const scene = new TraversalT0Scene({ root: document.body,
      leg: LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() });
    const clock = scene as unknown as { advance(n: number): void; moveToLane(lane: number): void };
    scene.open(); settle(scene);
    clock.moveToLane(1); clock.advance(20); settle(scene);
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
    clock.advance(20); settle(scene);
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!.click(); settle(scene);
    scene.beginNodeResolution('lion-opening-ambush'); scene.resumeNode('lion-opening-ambush'); settle(scene);
    clock.advance(12); settle(scene);
    expect(scene.session.pendingBeatId).toBe('t0:enemy:wolf-scouts');
    scene.element.querySelector<HTMLButtonElement>('[data-traversal-skip]')!.click();
    expect(scene.session.currentLane).toBe(0);
    expect(scene.element.dataset.assistedBypass).toBe('true');
    expect(scene.session.bypassedBeatIds).not.toContain('t0:enemy:wolf-scouts');
    clock.moveToLane(1);
    expect(scene.session.currentLane).toBe(0);
    clock.advance(5);
    expect(scene.session.bypassedBeatIds).toContain('t0:enemy:wolf-scouts');
    expect(scene.element.dataset.assistedBypass).toBe('false');
    scene.dispose();
    // Integrates over 50 seconds of road motion with the complete scene DOM.
    // This is a semantics check, not a five-second CPU performance benchmark.
  }, 10000);
});
