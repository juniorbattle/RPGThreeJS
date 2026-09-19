// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { TraversalRunController } from './TraversalRunController';

function leg(id: 'T0' | 'T1' | 'T2' | 'T3' | 'T4') {
  return LION_TRAVERSAL_LEGS.find((candidate) => candidate.id === id)!;
}

describe('TraversalRunController', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('hands mandatory nodes off without releasing traversal state', () => {
    const state = createInitialState();
    state.run.currentNodeId = 'lion-audience';
    state.currentNodeId = 'lion-audience';
    const handoffs: string[] = [];

    const controller = new TraversalRunController({
      leg: leg('T0'),
      getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: (node) => handoffs.push(node.id),
    });

    controller.approachNextStage(0.18);
    expect(handoffs).toEqual(['lion-opening-ambush']);
    expect(controller.session.phase).toBe('NODE_HANDOFF');
    expect(controller.session.worldMountState).toBe('MOUNTED');

    controller.beginNodeResolution('lion-opening-ambush');
    expect(controller.session.phase).toBe('NODE_RESOLUTION');
    expect(controller.session.worldMountState).toBe('MOUNTED');

    controller.finishNodeResolution('lion-opening-ambush');
    expect(controller.session.phase).toBe('RUNNING');
    expect(controller.session.routeProgress01).toBe(0.18);
  });

  it('keeps fork selection in the traversal overlay and emits only the chosen RunNode', () => {
    const state = createInitialState();
    const handoffs: string[] = [];
    const controller = new TraversalRunController({
      leg: leg('T0'),
      getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: (node) => handoffs.push(node.id),
    });

    const resolveStage = (currentNodeId: string, nodeId: string, progress: number) => {
      state.run.currentNodeId = currentNodeId;
      state.currentNodeId = currentNodeId;
      controller.approachNextStage(progress);
      expect(handoffs.at(-1)).toBe(nodeId);
      controller.beginNodeResolution(nodeId);
      controller.finishNodeResolution(nodeId);
    };

    resolveStage('lion-audience', 'lion-opening-ambush', 0.14);
    resolveStage('lion-opening-ambush', 'lion-nomad-crossroads', 0.29);
    resolveStage('lion-nomad-crossroads', 'lion-refugees', 0.44);

    state.run.currentNodeId = 'lion-refugees';
    state.currentNodeId = 'lion-refugees';
    controller.approachNextStage(0.62);

    expect(controller.session.phase).toBe('FORK_OVERLAY');
    expect(controller.session.worldMountState).toBe('MOUNTED');
    expect(document.querySelector('.traversal-fork-overlay')).not.toBeNull();

    document.querySelector<HTMLButtonElement>(
      '[data-traversal-fork-choice="lion-first-trial-combat"]',
    )?.click();

    expect(handoffs.at(-1)).toBe('lion-first-trial-combat');
    expect(controller.session.phase).toBe('NODE_HANDOFF');
    expect(document.querySelector('.traversal-fork-overlay')).toBeNull();
  });

  it('releases traversal only after explicit destination completion', () => {
    const state = createInitialState();
    const controller = new TraversalRunController({
      leg: leg('T2'),
      getAvailableNodes: () => getAvailableRunNodes(state),
      onNodeHandoff: () => undefined,
    });

    controller.beginArrival(1);
    expect(controller.session.worldMountState).toBe('MOUNTED');
    controller.completeArrival();
    expect(controller.session.phase).toBe('COMPLETE');
    expect(controller.session.worldMountState).toBe('RELEASED');
  });
});
