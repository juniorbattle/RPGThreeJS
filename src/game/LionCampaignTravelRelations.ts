import {
  getLionCampaignNodeDefinition,
  type LionCampaignNodeDefinition,
} from './LionCampaignStructure';

export type LionTraversalLegId = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

export interface LionTraversalStage {
  /**
   * One ID means a mandatory route interruption.
   * Multiple IDs mean RunSystem owns the branch choice among these alternatives.
   */
  readonly nodeIds: readonly string[];
}

export interface LionTraversalLeg {
  readonly id: LionTraversalLegId;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
  readonly stages: readonly LionTraversalStage[];
}

export interface LionMajorCampaignTransition {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly mode: 'DIRECT_MAJOR_TRANSITION';
}

/**
 * Playable travel relations only.
 *
 * RunSystem still owns which branch is available. Traversal presents the movement,
 * materializes route interrupts, hands each interrupt back to the existing node
 * resolver, then resumes the same leg until the destination anchor is reached.
 */
export const LION_TRAVERSAL_LEGS: readonly LionTraversalLeg[] = Object.freeze([
  {
    id: 'T0',
    originNodeId: 'lion-audience',
    destinationNodeId: 'lion-first-refuge',
    stages: [
      { nodeIds: ['lion-opening-ambush'] },
      { nodeIds: ['lion-nomad-crossroads'] },
      { nodeIds: ['lion-refugees'] },
      { nodeIds: ['lion-first-trial-event', 'lion-first-trial-combat'] },
    ],
  },
  {
    id: 'T1',
    originNodeId: 'lion-first-refuge',
    destinationNodeId: 'lion-village-choice',
    stages: [
      { nodeIds: ['lion-reserve-trail'] },
      { nodeIds: ['lion-valmir-road'] },
      { nodeIds: ['lion-second-trial-event', 'lion-second-trial-combat'] },
    ],
  },
  {
    id: 'T2',
    originNodeId: 'lion-village-choice',
    destinationNodeId: 'lion-second-refuge',
    stages: [],
  },
  {
    id: 'T3',
    originNodeId: 'lion-second-refuge',
    destinationNodeId: 'lion-shadow-signs',
    stages: [
      { nodeIds: ['lion-lancer-recruit'] },
      { nodeIds: ['lion-witnesses'] },
      { nodeIds: ['lion-final-trial-event', 'lion-final-trial-combat'] },
    ],
  },
  {
    id: 'T4',
    originNodeId: 'lion-shadow-signs',
    destinationNodeId: 'lion-final-refuge',
    stages: [],
  },
].map((leg) => Object.freeze({
  ...leg,
  stages: Object.freeze(leg.stages.map((stage) => Object.freeze({
    nodeIds: Object.freeze([...stage.nodeIds]),
  }))),
})));

export const LION_MAJOR_CAMPAIGN_TRANSITIONS: readonly LionMajorCampaignTransition[] = Object.freeze([
  Object.freeze({
    id: 'camp-to-audience',
    fromNodeId: 'lion-camp',
    toNodeId: 'lion-audience',
    mode: 'DIRECT_MAJOR_TRANSITION' as const,
  }),
  Object.freeze({
    id: 'final-refuge-to-judgement',
    fromNodeId: 'lion-final-refuge',
    toNodeId: 'lion-final-judgement',
    mode: 'DIRECT_MAJOR_TRANSITION' as const,
  }),
]);

export interface LionTravelRelationIssue {
  readonly code:
    | 'UNKNOWN_NODE'
    | 'ORIGIN_NOT_ANCHOR'
    | 'DESTINATION_NOT_ANCHOR'
    | 'INTERRUPT_NOT_ROUTE_NODE'
    | 'DUPLICATE_TRAVERSAL_NODE'
    | 'BROKEN_STAGE_LINK'
    | 'BROKEN_DESTINATION_LINK'
    | 'MAJOR_TRANSITION_NOT_DIRECT';
  readonly relationId: string;
  readonly detail: string;
}

function campaignNode(
  nodeId: string,
  relationId: string,
  issues: LionTravelRelationIssue[],
): LionCampaignNodeDefinition | undefined {
  const node = getLionCampaignNodeDefinition(nodeId);
  if (!node) {
    issues.push({
      code: 'UNKNOWN_NODE',
      relationId,
      detail: `Unknown campaign node "${nodeId}".`,
    });
  }
  return node;
}

function nextStageTargets(leg: LionTraversalLeg, stageIndex: number): readonly string[] {
  const nextStage = leg.stages[stageIndex + 1];
  return nextStage ? nextStage.nodeIds : [leg.destinationNodeId];
}

/** Pure structural validation; it does not select a RunSystem branch. */
export function auditLionTravelRelations(): LionTravelRelationIssue[] {
  const issues: LionTravelRelationIssue[] = [];
  const consumedInterrupts = new Map<string, string>();

  for (const leg of LION_TRAVERSAL_LEGS) {
    const origin = campaignNode(leg.originNodeId, leg.id, issues);
    const destination = campaignNode(leg.destinationNodeId, leg.id, issues);
    if (origin && origin.spatialRole !== 'LOCATION_ANCHOR') {
      issues.push({
        code: 'ORIGIN_NOT_ANCHOR',
        relationId: leg.id,
        detail: `${origin.id} is not a LOCATION_ANCHOR.`,
      });
    }
    if (destination && destination.spatialRole !== 'LOCATION_ANCHOR') {
      issues.push({
        code: 'DESTINATION_NOT_ANCHOR',
        relationId: leg.id,
        detail: `${destination.id} is not a LOCATION_ANCHOR.`,
      });
    }

    const firstTargets = leg.stages[0]?.nodeIds ?? [leg.destinationNodeId];
    if (origin && !firstTargets.some((id) => origin.expectedNextNodeIds.includes(id))) {
      issues.push({
        code: 'BROKEN_STAGE_LINK',
        relationId: leg.id,
        detail: `${origin.id} does not link to the first traversal stage/destination.`,
      });
    }

    leg.stages.forEach((stage, stageIndex) => {
      const targets = nextStageTargets(leg, stageIndex);
      for (const nodeId of stage.nodeIds) {
        const node = campaignNode(nodeId, leg.id, issues);
        if (!node) continue;
        if (node.spatialRole !== 'ROUTE_INTERRUPT') {
          issues.push({
            code: 'INTERRUPT_NOT_ROUTE_NODE',
            relationId: leg.id,
            detail: `${node.id} is not a ROUTE_INTERRUPT.`,
          });
        }

        const previousLeg = consumedInterrupts.get(node.id);
        if (previousLeg) {
          issues.push({
            code: 'DUPLICATE_TRAVERSAL_NODE',
            relationId: leg.id,
            detail: `${node.id} is already consumed by ${previousLeg}.`,
          });
        } else {
          consumedInterrupts.set(node.id, leg.id);
        }

        if (!targets.some((targetId) => node.expectedNextNodeIds.includes(targetId))) {
          issues.push({
            code: stageIndex === leg.stages.length - 1
              ? 'BROKEN_DESTINATION_LINK'
              : 'BROKEN_STAGE_LINK',
            relationId: leg.id,
            detail: `${node.id} does not link to the next stage/destination.`,
          });
        }
      }
    });
  }

  for (const transition of LION_MAJOR_CAMPAIGN_TRANSITIONS) {
    const from = campaignNode(transition.fromNodeId, transition.id, issues);
    const to = campaignNode(transition.toNodeId, transition.id, issues);
    if (from && to && !from.expectedNextNodeIds.includes(to.id)) {
      issues.push({
        code: 'MAJOR_TRANSITION_NOT_DIRECT',
        relationId: transition.id,
        detail: `${from.id} does not directly link to ${to.id}.`,
      });
    }
  }

  return issues;
}
