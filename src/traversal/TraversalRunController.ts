import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { RunNode } from '../game/types';
import { TraversalForkOverlay } from './TraversalForkOverlay';
import {
  activateTraversalStage,
  approachTraversalStage,
  beginTraversalArrival,
  beginTraversalLocalInteraction,
  beginTraversalNodeResolution,
  chooseTraversalFork,
  continueTraversalAfterBranchSelection,
  handoffTraversalBranchEncounter,
  skipTraversalStage,
  completeTraversalRun,
  consumeTraversalBeat,
  bypassTraversalBeat,
  createTraversalRunSession,
  finishTraversalNodeResolution,
  moveTraversalLane,
  pauseTraversalForDecision,
  releaseTraversalDecision,
  resumeTraversalRun,
  updateTraversalProgress,
  type TraversalLaneDirection,
  type TraversalRunSession,
} from './TraversalRunRuntime';

export interface TraversalRunControllerOptions {
  readonly leg: LionTraversalLeg;
  readonly getAvailableNodes: () => readonly RunNode[];
  readonly onNodeHandoff: (node: RunNode, session: TraversalRunSession) => void;
  readonly onBranchSelect?: (nodeId: string) => boolean | Promise<boolean>;
  readonly onSessionChange?: (session: TraversalRunSession) => void;
  readonly overlayRoot?: HTMLElement;
}

export class TraversalRunController {
  private sessionState: TraversalRunSession;
  private forkOverlay: TraversalForkOverlay | null = null;
  private disposed = false;

  constructor(private readonly options: TraversalRunControllerOptions) {
    this.sessionState = createTraversalRunSession(options.leg);
  }

  get session(): TraversalRunSession {
    return this.sessionState;
  }

  advanceTo(routeProgress01: number): void {
    this.setSession(updateTraversalProgress(this.sessionState, routeProgress01));
  }

  moveLane(direction: TraversalLaneDirection): void {
    this.setSession(moveTraversalLane(this.sessionState, direction));
  }

  consumeBeat(beatId: string): void {
    this.setSession(consumeTraversalBeat(this.sessionState, beatId));
  }

  bypassBeat(beatId: string): void {
    this.setSession(bypassTraversalBeat(this.sessionState, beatId));
  }

  pauseForDecision(beatId: string): void {
    this.setSession(pauseTraversalForDecision(this.sessionState, beatId));
  }

  releaseDecision(): void {
    this.setSession(releaseTraversalDecision(this.sessionState));
  }

  beginLocalInteraction(): void {
    this.setSession(beginTraversalLocalInteraction(this.sessionState));
  }

  skipStage(): void {
    this.setSession(skipTraversalStage(this.sessionState));
  }

  enterSelectedBranch(nodeId: string): void {
    const node = this.options.getAvailableNodes().find(candidate => candidate.id === nodeId);
    if (!node) throw new Error('Selected branch encounter is unavailable.');
    this.setSession(handoffTraversalBranchEncounter(this.sessionState, nodeId));
    this.options.onNodeHandoff(node, this.sessionState);
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
          ...(this.options.overlayRoot ? { root: this.options.overlayRoot } : {}),
          eyebrow: 'Carrefour',
          title: 'Choix d’itinéraire',
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
    this.disposed = true;
    this.disposeForkOverlay();
  }

  private async selectFork(nodeId: string, availableNodes: readonly RunNode[]): Promise<void> {
    if (this.options.onBranchSelect) {
      if (!this.sessionState.forkOptionIds.includes(nodeId)) return;
      const accepted = await this.options.onBranchSelect(nodeId);
      if (!accepted || this.disposed) return;
      this.disposeForkOverlay();
      this.setSession(continueTraversalAfterBranchSelection(this.sessionState));
      return;
    }
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
