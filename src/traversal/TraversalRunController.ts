import type { LionTraversalLeg } from '../game/LionCampaignTravelRelations';
import type { RunNode } from '../game/types';
import { TraversalForkOverlay } from './TraversalForkOverlay';
import {
  activateTraversalStage,
  approachTraversalStage,
  beginTraversalArrival,
  beginTraversalNodeResolution,
  chooseTraversalFork,
  completeTraversalRun,
  createTraversalRunSession,
  finishTraversalNodeResolution,
  resumeTraversalRun,
  type TraversalRunSession,
} from './TraversalRunRuntime';

export interface TraversalRunControllerOptions {
  readonly leg: LionTraversalLeg;
  readonly getAvailableNodes: () => readonly RunNode[];
  readonly onNodeHandoff: (node: RunNode, session: TraversalRunSession) => void;
  readonly onSessionChange?: (session: TraversalRunSession) => void;
  readonly overlayRoot?: HTMLElement;
}

export class TraversalRunController {
  private sessionState: TraversalRunSession;
  private forkOverlay: TraversalForkOverlay | null = null;

  constructor(private readonly options: TraversalRunControllerOptions) {
    this.sessionState = createTraversalRunSession(options.leg);
  }

  get session(): TraversalRunSession {
    return this.sessionState;
  }

  approachNextStage(routeProgress01: number): void {
    this.disposeForkOverlay();
    this.setSession(approachTraversalStage(this.sessionState, this.options.leg, routeProgress01));

    const availableNodes = this.options.getAvailableNodes();
    this.setSession(activateTraversalStage(
      this.sessionState,
      this.options.leg,
      availableNodes.map((node) => node.id),
    ));

    if (this.sessionState.phase === 'FORK_OVERLAY') {
      const choices = availableNodes.filter((node) => this.sessionState.forkOptionIds.includes(node.id));
      this.forkOverlay = new TraversalForkOverlay(
        choices,
        { onSelect: (nodeId) => this.selectFork(nodeId, availableNodes) },
        {
          root: this.options.overlayRoot,
          eyebrow: 'Route',
          title: 'Choisir la route',
        },
      );
      this.forkOverlay.mount();
      return;
    }

    if (this.sessionState.phase === 'NODE_HANDOFF' && this.sessionState.activeNodeId) {
      const node = availableNodes.find((candidate) => candidate.id === this.sessionState.activeNodeId);
      if (!node) throw new Error('Traversal mandatory node disappeared before handoff.');
      this.options.onNodeHandoff(node, this.sessionState);
    }
  }

  beginNodeResolution(nodeId: string): void {
    if (this.sessionState.activeNodeId !== nodeId) {
      throw new Error('Traversal node handoff mismatch for "' + nodeId + '".');
    }
    this.disposeForkOverlay();
    this.setSession(beginTraversalNodeResolution(this.sessionState));
  }

  finishNodeResolution(nodeId: string): void {
    if (this.sessionState.activeNodeId !== nodeId) {
      throw new Error('Traversal node resolution mismatch for "' + nodeId + '".');
    }
    this.setSession(finishTraversalNodeResolution(this.sessionState, this.options.leg));
    this.setSession(resumeTraversalRun(this.sessionState));
  }

  beginArrival(routeProgress01 = 1): void {
    this.disposeForkOverlay();
    this.setSession(beginTraversalArrival(this.sessionState, this.options.leg, routeProgress01));
  }

  completeArrival(): void {
    this.disposeForkOverlay();
    this.setSession(completeTraversalRun(this.sessionState));
  }

  dispose(): void {
    this.disposeForkOverlay();
  }

  private selectFork(nodeId: string, availableNodes: readonly RunNode[]): void {
    this.setSession(chooseTraversalFork(this.sessionState, nodeId));
    this.disposeForkOverlay();
    const node = availableNodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error('Traversal fork node disappeared before handoff.');
    this.options.onNodeHandoff(node, this.sessionState);
  }

  private setSession(session: TraversalRunSession): void {
    this.sessionState = session;
    this.options.onSessionChange?.(session);
  }

  private disposeForkOverlay(): void {
    this.forkOverlay?.dispose();
    this.forkOverlay = null;
  }
}
