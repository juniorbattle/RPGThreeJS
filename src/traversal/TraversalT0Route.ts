import {
  getLionCampaignNodeDefinition,
  type LionCampaignNodeDefinition,
} from '../campaign/LionCampaignStructure';
import type { LionTraversalLeg, LionTraversalStage } from '../campaign/LionCampaignTravelRelations';
import type { RunNode } from '../game/types';
import {
  resolveCharacterAsset,
  resolveCharacterUnitId,
  resolveCharacterVisualProfile,
} from '../render/CharacterVisualRegistry';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import type { TraversalLane } from './TraversalRunRuntime';

export type TraversalBeatType =
  | 'campaign-node'
  | 'npc'
  | 'enemy'
  | 'obstacle'
  | 'loot'
  | 'booster'
  | 'fork';

export type TraversalBeatPlacement = 'LANE' | 'CENTERED';
export type TraversalInteractionPolicy = 'OPTIONAL_CONFIRM' | 'MANDATORY_CONFIRM';
export type TraversalBeatCrossing = 'NONE' | 'TRIGGERED' | 'BYPASSED';

export interface TraversalRouteBeat {
  readonly id: string;
  readonly type: TraversalBeatType;
  readonly progress01: number;
  readonly lane: TraversalLane | null;
  readonly placement: TraversalBeatPlacement;
  readonly label: string;
  readonly marker: 'danger' | 'speech' | 'loot' | 'booster' | 'fork' | 'obstacle';
  readonly interactionPolicy: TraversalInteractionPolicy;
  readonly campaignNodeIds: readonly string[];
  readonly characterId?: string;
  readonly visualAsset?: string;
  readonly backdropAsset?: string;
  readonly mirrorX?: boolean;
}

export interface TraversalT0Route {
  readonly legId: 'T0';
  readonly originNodeId: string;
  readonly destinationNodeId: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly distanceKm: number;
  readonly beats: readonly TraversalRouteBeat[];
}

export interface TraversalRouteIssue {
  readonly code: 'NOT_T0' | 'MISSING_CAMPAIGN_NODE' | 'MISSING_RUN_NODE' | 'MISSING_CHARACTER_VISUAL';
  readonly subjectId: string;
  readonly detail: string;
}

// Spatial presentation only. Campaign order and branch validity remain owned by the relation and
// RunSystem records passed into the resolver.
const AMBIENT_T0_BEATS: readonly TraversalRouteBeat[] = Object.freeze([
  Object.freeze({
    id: 't0:npc:roadside-merchant',
    type: 'npc' as const,
    progress01: 0.12,
    lane: 0 as const,
    placement: 'LANE' as const,
    label: 'Marchand itinérant',
    marker: 'speech' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    characterId: 'wounded_merchant',
    visualAsset: resolveCharacterAsset('wounded_merchant', 'full'),
    backdropAsset: TRAVERSAL_T0_ASSETS.merchantCaravan,
    mirrorX: false,
  }),
  Object.freeze({
    id: 't0:enemy:wolf-scouts',
    type: 'enemy' as const,
    progress01: 0.16,
    lane: 1 as const,
    placement: 'LANE' as const,
    label: 'Éclaireurs sauvages',
    marker: 'danger' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    visualAsset: resolveCharacterAsset('wolf', 'full'),
    mirrorX: true,
  }),
  Object.freeze({
    id: 't0:loot:road-cache',
    type: 'loot' as const,
    progress01: 0.31,
    lane: 1 as const,
    placement: 'LANE' as const,
    label: 'Cache de route',
    marker: 'loot' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    visualAsset: TRAVERSAL_T0_ASSETS.chest,
  }),
  Object.freeze({
    id: 't0:obstacle:broken-cart',
    type: 'obstacle' as const,
    progress01: 0.51,
    lane: 0 as const,
    placement: 'LANE' as const,
    label: 'Débris de chariot',
    marker: 'obstacle' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    visualAsset: TRAVERSAL_T0_ASSETS.abandonedCart,
    backdropAsset: TRAVERSAL_T0_ASSETS.debris,
  }),
  Object.freeze({
    id: 't0:booster:lion-ward',
    type: 'booster' as const,
    progress01: 0.70,
    lane: 1 as const,
    placement: 'LANE' as const,
    label: 'Garde du Lion',
    marker: 'booster' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    visualAsset: TRAVERSAL_T0_ASSETS.waystone,
  }),
]);

function campaignNode(nodeId: string, issues: TraversalRouteIssue[]): LionCampaignNodeDefinition | undefined {
  const definition = getLionCampaignNodeDefinition(nodeId);
  if (!definition) {
    issues.push({
      code: 'MISSING_CAMPAIGN_NODE',
      subjectId: nodeId,
      detail: `Traversal references unknown campaign node "${nodeId}".`,
    });
  }
  return definition;
}

function representativeCharacter(
  definitions: readonly LionCampaignNodeDefinition[],
  partyCharacterIds: ReadonlySet<string>,
  issues: TraversalRouteIssue[],
): string | undefined {
  const required = definitions.flatMap((definition) => definition.cast.required);
  for (const characterId of required) {
    if (!resolveCharacterVisualProfile(characterId)) {
      issues.push({
        code: 'MISSING_CHARACTER_VISUAL',
        subjectId: characterId,
        detail: `Campaign character "${characterId}" has no Character System V2 visual master.`,
      });
    }
  }
  const resolvable = required.filter((characterId) => resolveCharacterVisualProfile(characterId));
  return resolvable.find((characterId) => {
    const unitId = resolveCharacterUnitId(characterId);
    return unitId ? !partyCharacterIds.has(unitId) : false;
  }) ?? resolvable.at(-1);
}

function stageBeat(
  stage: LionTraversalStage,
  stageIndex: number,
  stageCount: number,
  runNodesById: ReadonlyMap<string, RunNode>,
  partyCharacterIds: ReadonlySet<string>,
  issues: TraversalRouteIssue[],
): TraversalRouteBeat {
  const definitions = stage.nodeIds
    .map((nodeId) => campaignNode(nodeId, issues))
    .filter((definition): definition is LionCampaignNodeDefinition => Boolean(definition));
  const runNodes = stage.nodeIds
    .map((nodeId) => {
      const runNode = runNodesById.get(nodeId);
      if (!runNode) {
        issues.push({
          code: 'MISSING_RUN_NODE',
          subjectId: nodeId,
          detail: `Traversal campaign node "${nodeId}" has no RunSystem node.`,
        });
      }
      return runNode;
    })
    .filter((node): node is RunNode => Boolean(node));
  const characterId = representativeCharacter(definitions, partyCharacterIds, issues);
  const isFork = stage.mode === 'IN_TRAVERSAL_FORK';
  const label = isFork
    ? runNodes.map((node) => node.label).join(' · ') || 'Choisir la route'
    : runNodes[0]?.label ?? stage.nodeIds[0] ?? 'Étape de route';
  const isCombat = definitions.some((definition) => definition.contentAuthority === 'COMBAT');

  return Object.freeze({
    id: `t0:stage:${stageIndex}:${stage.nodeIds.join('+')}`,
    type: isFork ? 'fork' : 'campaign-node',
    progress01: (stageIndex + 1) / (stageCount + 1),
    lane: null,
    placement: 'CENTERED',
    label,
    marker: isFork ? 'fork' : isCombat ? 'danger' : 'speech',
    interactionPolicy: 'MANDATORY_CONFIRM',
    campaignNodeIds: Object.freeze([...stage.nodeIds]),
    ...(characterId ? {
      characterId,
      visualAsset: resolveCharacterAsset(characterId, 'full'),
      mirrorX: characterId !== 'wounded_merchant',
    } : isCombat ? {
      visualAsset: resolveCharacterAsset('wolf', 'full'),
      mirrorX: true,
    } : {}),
  });
}

/** Pure contact rule: optional beats require their lane; mandatory beats ignore lane. */
export function resolveTraversalBeatCrossing(
  beat: TraversalRouteBeat,
  previousProgress01: number,
  nextProgress01: number,
  lane: TraversalLane,
): TraversalBeatCrossing {
  if (nextProgress01 <= previousProgress01) return 'NONE';
  if (previousProgress01 >= beat.progress01 || nextProgress01 < beat.progress01) return 'NONE';
  if (beat.interactionPolicy === 'MANDATORY_CONFIRM') return 'TRIGGERED';
  return beat.lane === lane ? 'TRIGGERED' : 'BYPASSED';
}

export function auditTraversalT0Route(
  leg: LionTraversalLeg,
  runNodes: readonly RunNode[],
  partyDefinitionIds: readonly string[] = [],
): TraversalRouteIssue[] {
  const issues: TraversalRouteIssue[] = [];
  if (leg.id !== 'T0') {
    issues.push({ code: 'NOT_T0', subjectId: leg.id, detail: 'The T0 route resolver only accepts T0.' });
    return issues;
  }
  const runNodesById = new Map(runNodes.map((node) => [node.id, node] as const));
  const partyCharacterIds = new Set(
    partyDefinitionIds.map((id) => resolveCharacterUnitId(id)).filter((id): id is string => Boolean(id)),
  );
  campaignNode(leg.originNodeId, issues);
  campaignNode(leg.destinationNodeId, issues);
  if (!runNodesById.has(leg.originNodeId)) {
    issues.push({ code: 'MISSING_RUN_NODE', subjectId: leg.originNodeId, detail: 'T0 origin is absent from RunSystem.' });
  }
  if (!runNodesById.has(leg.destinationNodeId)) {
    issues.push({ code: 'MISSING_RUN_NODE', subjectId: leg.destinationNodeId, detail: 'T0 destination is absent from RunSystem.' });
  }
  leg.stages.forEach((stage, index) => {
    stageBeat(stage, index, leg.stages.length, runNodesById, partyCharacterIds, issues);
  });
  return issues;
}

export function resolveTraversalT0Route(
  leg: LionTraversalLeg,
  runNodes: readonly RunNode[],
  partyDefinitionIds: readonly string[] = [],
): TraversalT0Route {
  const issues = auditTraversalT0Route(leg, runNodes, partyDefinitionIds);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.code}: ${issue.detail}`).join('\n'));
  }
  const runNodesById = new Map(runNodes.map((node) => [node.id, node] as const));
  const partyCharacterIds = new Set(
    partyDefinitionIds.map((id) => resolveCharacterUnitId(id)).filter((id): id is string => Boolean(id)),
  );
  const beatIssues: TraversalRouteIssue[] = [];
  const stageBeats = leg.stages.map((stage, index) => stageBeat(
    stage,
    index,
    leg.stages.length,
    runNodesById,
    partyCharacterIds,
    beatIssues,
  ));
  if (beatIssues.length > 0) throw new Error(beatIssues.map((issue) => issue.detail).join('\n'));

  return Object.freeze({
    legId: 'T0',
    originNodeId: leg.originNodeId,
    destinationNodeId: leg.destinationNodeId,
    originLabel: runNodesById.get(leg.originNodeId)!.label,
    destinationLabel: runNodesById.get(leg.destinationNodeId)!.label,
    distanceKm: 4,
    beats: Object.freeze([...stageBeats, ...AMBIENT_T0_BEATS]
      .sort((a, b) => a.progress01 - b.progress01)),
  });
}
