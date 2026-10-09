// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { enterRunNode, getAvailableRunNodes, selectTraversalBranch } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { TraversalRoadScene } from './TraversalRoadScene';
import type { TraversalRoadAuthoring } from './TraversalRoadAuthoring';
import type { TraversalRouteBeat } from './TraversalRouteModel';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';
import { hasAuthoredTraversalPresentation } from './TraversalPresentation';
import { createPursuitCharge } from './TraversalPursuitCharge';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('shared road scene authoring boundary', () => {
  it('contacts once, freezes road clocks, and resumes the same mounted road without consuming a campaign stage', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
    const state = createInitialState(), original = structuredClone(state), handoff = vi.fn();
    const leg = LION_TRAVERSAL_LEGS.find(l => l.id === 'T0')!;
    const scene = new TraversalRoadScene({ root: document.body, leg, getState: () => state,
      getAvailableNodes: () => [], onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn(), onPursuitContact: handoff },
      T0_ROAD_AUTHORING, { selectBranch: vi.fn(), optionalDecision: () => undefined });
    scene.open();
    const clock = scene as unknown as { transition: unknown; pursuitCharge: ReturnType<typeof createPursuitCharge> | null;
      routeRun: { elapsedMs: number; progress01: number }; routeRenderer: { distance: number };
      advance(seconds: number): void };
    clock.transition = null;
    clock.pursuitCharge = createPursuitCharge({ windowId: 't0:r3:pursuit-1', lane: 0, left: 100, speed: 170, acceleration: 850 });
    clock.advance(1);
    expect(handoff).toHaveBeenCalledOnce(); expect(scene.session.phase).toBe('DECISION');
    const held = { elapsed: clock.routeRun.elapsedMs, distance: clock.routeRenderer.distance, stage: scene.session.stageIndex, progress: scene.session.routeProgress01 };
    clock.advance(10);
    expect(clock.routeRun.elapsedMs).toBe(held.elapsed); expect(clock.routeRenderer.distance).toBe(held.distance);
    expect(scene.resumeRoadCombat('wrong')).toBe(false);
    expect(scene.resumeRoadCombat('t0:r3:pursuit-1')).toBe(true);
    expect(scene.session.stageIndex).toBe(held.stage); expect(scene.session.routeProgress01).toBe(held.progress);
    expect(clock.routeRun.elapsedMs).toBe(held.elapsed); expect(clock.routeRenderer.distance).toBe(held.distance);
    clock.advance(.1); expect(clock.routeRun.elapsedMs).toBeGreaterThan(held.elapsed);
    expect(handoff).toHaveBeenCalledOnce(); expect(state).toEqual(original);
    scene.dispose();
  });
  it('finishes a partially completed lane switch inside a delayed frame and freezes under global cover', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
    const state = createInitialState(), handoff = vi.fn(), leg = LION_TRAVERSAL_LEGS.find(l => l.id === 'T0')!;
    const scene = new TraversalRoadScene({ root: document.body, leg, getState: () => state,
      getAvailableNodes: () => [], onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn(), onPursuitContact: handoff },
      T0_ROAD_AUTHORING, { selectBranch: vi.fn(), optionalDecision: () => undefined });
    scene.open();
    const clock = scene as unknown as { transition: unknown; pursuitCharge: ReturnType<typeof createPursuitCharge>;
      laneMotion: { from: number; to: number; elapsed: number }; routeRun: { lane: number; elapsedMs: number };
      advance(seconds: number): void };
    clock.transition = null;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    clock.laneMotion = { from: 65, to: 81, elapsed: .30 };
    clock.pursuitCharge = createPursuitCharge({ windowId: 't0:r3:pursuit-1', lane: 1, left: -20, speed: 170, acceleration: 850 });
    document.body.classList.add('scene-transition--locked'); clock.advance(1);
    expect(clock.routeRun.elapsedMs).toBe(0); expect(clock.pursuitCharge.elapsedSeconds).toBe(0);
    document.body.classList.remove('scene-transition--locked'); clock.advance(1);
    expect(handoff).toHaveBeenCalledOnce(); expect(clock.pursuitCharge.phase).toBe('COLLISION_PENDING');
    expect(clock.pursuitCharge.elapsedSeconds).toBeGreaterThan(.08);
    scene.dispose();
  });
  it.each([false, true])('keeps interpolated lane ground and depth together without changing owner clocks (reduced=%s)', async reduced => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
    const state = createInitialState(); state.settings.reducedGraphics = reduced;
    const leg = LION_TRAVERSAL_LEGS.find(l => l.id === 'T0')!;
    const scene = new TraversalRoadScene({ leg, getState: () => state, root: document.body,
      getAvailableNodes: () => [], onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() },
      T0_ROAD_AUTHORING, { selectBranch: vi.fn(), optionalDecision: () => undefined });
    scene.open();
    const clock = scene as unknown as { transition: unknown; tick(time: number): void;
      routeRun: { elapsedMs: number; lane: number }; vehicleGroundPercent: number };
    clock.transition = null;
    clock.tick(1000);
    const elapsed = clock.routeRun.elapsedMs;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(clock.routeRun.lane).toBe(1); expect(clock.routeRun.elapsedMs).toBe(elapsed);
    if (reduced) expect(clock.vehicleGroundPercent).toBe(81);
    else { expect(clock.vehicleGroundPercent).toBe(65); clock.tick(1190);
      expect(clock.vehicleGroundPercent).toBeCloseTo(73); }
    const vehicle = scene.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    expect(Number(vehicle.dataset.screenGroundY)).toBeCloseTo(823 * clock.vehicleGroundPercent / 100);
    expect(Number(vehicle.style.zIndex)).toBe(Math.round(823 * clock.vehicleGroundPercent / 10));
    clock.tick(1570); expect(clock.vehicleGroundPercent).toBe(81);
    const beforeResize = clock.routeRun.elapsedMs;
    Object.defineProperty(scene.element, 'clientHeight', { configurable: true, value: 700 });
    window.dispatchEvent(new Event('resize'));
    expect(Number(vehicle.dataset.screenGroundY)).toBeCloseTo(567);
    expect(clock.routeRun.elapsedMs).toBe(beforeResize);
    scene.dispose();
    Object.defineProperty(scene.element, 'clientHeight', { configurable: true, value: 900 });
    window.dispatchEvent(new Event('resize'));
    expect(Number(vehicle.dataset.screenGroundY)).toBeCloseTo(567);
  });
  it('rejects a different leg before reading campaign state', () => {
    const getState = vi.fn(() => { throw new Error('Unexpected campaign read'); });
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T3')!;
    expect(() => new TraversalRoadScene({ leg, getState, root: document.body,
      getAvailableNodes: vi.fn(), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() },
      T0_ROAD_AUTHORING, { selectBranch: vi.fn(), optionalDecision: () => undefined }))
      .toThrow('Traversal authoring T0 cannot present T3.');
    expect(getState).not.toHaveBeenCalled();
  });

  it.each(['lion-final-trial-event', 'lion-final-trial-combat'])(
    'uses five authored roads through %s and arrives once without consuming its destination', async branch => {
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
      const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T3')!;
      const state = createInitialState();
      state.run.currentNodeId = state.currentNodeId = leg.originNodeId;
      const fork = leg.stages.at(-1)!;
      const beat = (ids: readonly string[], index: number, branchNodeId?: string): TraversalRouteBeat => ({
        id: `fixture:${branchNodeId ?? index}`, campaignNodeIds: ids, branchNodeId,
        type: ids.length > 1 ? 'fork' : 'campaign-node', category: ids.length > 1 ? 'ROUTE_CHOICE' : 'MANDATORY_EVENT',
        engagement: 'ROUTE', progress01: branchNodeId ? .85 : (index + 1) * .2,
        lane: null, placement: 'CENTERED', marker: ids.length > 1 ? 'fork' : 'speech',
        label: state.run.graph.nodes.find(node => node.id === ids[0])!.label,
        interactionPolicy: 'MANDATORY_CONFIRM', locationId: 'fixture-checkpoint',
      });
      const segments = [
        ...leg.stages.map((stage, index) => ({ id: `fixture-road-${index}`, durationMs: 1000, vMin: 1, vMax: 2,
          checkpointKind: stage.mode === 'IN_TRAVERSAL_FORK' ? 'FORK' as const : 'CANONICAL' as const,
          nextCheckpointId: stage.mode === 'IN_TRAVERSAL_FORK' ? 'fork' : stage.nodeIds[0], railLabel: 'Fixture' })),
        { id: 'fixture-branch', durationMs: 1000, vMin: 1, vMax: 2, checkpointKind: 'BRANCH' as const, railLabel: 'Fixture' },
        { id: 'fixture-arrival', durationMs: 1000, vMin: 1, vMax: 2, checkpointKind: 'ARRIVAL' as const, railLabel: 'Fixture' },
      ];
      // Isolated lifecycle fixture, not authored T3 art or production rollout.
      const section = { ...T0_ROAD_AUTHORING.world.routeSections[0]!, id: 'fixture-checkpoint' };
      const authoring: TraversalRoadAuthoring<'T3'> = {
        ...T0_ROAD_AUTHORING, legId: 'T3', routeSegments: segments,
        world: { ...T0_ROAD_AUTHORING.world, checkpointSections: [section], resolveWorld: () => [section] },
        hazards: () => [], pickups: () => [], pursuitWindow: () => undefined,
        resolveSegment: (index, selected) => index === leg.stages.length
          ? { ...segments[index]!, nextCheckpointId: selected } : segments[index]!,
        resolveRoute: () => ({ legId: 'T3', originNodeId: leg.originNodeId, destinationNodeId: leg.destinationNodeId,
          originLabel: 'Fixture', destinationLabel: 'Fixture', distanceKm: 1,
          beats: [...leg.stages.map((stage, index) => beat(stage.nodeIds, index)),
            ...fork.nodeIds.map(id => beat([id], leg.stages.length, id))] }),
      };
      const handoffs: string[] = [];
      const arrival = vi.fn();
      const selectBranch = vi.fn(nodeId => selectTraversalBranch(state.run, leg.id, nodeId));
      const scene = new TraversalRoadScene({ root: document.body, leg, getState: () => state,
        getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: node => {
          expect(enterRunNode(state.run, node.id)?.id).toBe(node.id);
          handoffs.push(node.id);
          scene.beginNodeResolution(node.id); scene.resumeNode(node.id);
        }, onArrival: arrival, onMenu: vi.fn() }, authoring, { selectBranch, optionalDecision: () => undefined });
      const clock = scene as unknown as { advance(n: number): void; advanceTransition(n: number): void;
        advanceArrival(n: number): void };
      const settle = async () => {
        clock.advanceTransition(1); await Promise.resolve(); await Promise.resolve(); clock.advanceTransition(1);
      };
      scene.open(); await settle();
      expect(scene.element.querySelectorAll('[data-rail-stop]')).toHaveLength(6);
      expect(scene.element.querySelector('[data-world-section="opening-ambush"]')).toBeNull();
      const roads = new Set<string>();
      let forkChosen = false;
      for (let frame = 0; frame < 300 && !arrival.mock.calls.length; frame++) {
        await settle();
        if (scene.element.dataset.view === 'route') roads.add(scene.element.dataset.routeSegment!);
        if (scene.session.phase === 'ARRIVING') clock.advanceArrival(.1);
        else clock.advance(.1);
        if (scene.session.phase === 'FORK_OVERLAY' && !forkChosen) {
          forkChosen = true;
          scene.element.querySelector<HTMLButtonElement>(`[data-traversal-fork-choice="${branch}"]`)!.click();
          expect(selectBranch).not.toHaveBeenCalled();
          expect(state.run.traversalBranches?.T3).toBeUndefined();
        }
      }
      expect(selectBranch).toHaveBeenCalledExactlyOnceWith(branch);
      expect(handoffs).toEqual(['lion-lancer-recruit', 'lion-witnesses', branch]);
      expect(roads).toEqual(new Set(segments.map(segment => segment.id)));
      expect(arrival).toHaveBeenCalledExactlyOnceWith(leg.destinationNodeId);
      clock.advanceArrival(10); expect(arrival).toHaveBeenCalledOnce();
      const before = structuredClone(state);
      scene.completeArrival(); expect(scene.session.phase).toBe('COMPLETE'); expect(state).toEqual(before);
      expect(state.run.currentNodeId).toBe(branch);
      expect(hasAuthoredTraversalPresentation('T3')).toBe(true);
      scene.dispose();
    });
});
