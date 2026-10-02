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

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('shared road scene authoring boundary', () => {
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
