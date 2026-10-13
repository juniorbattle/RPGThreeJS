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
import type { TraversalRoute, TraversalRouteBeat } from './TraversalRouteModel';
import { combatConfigs } from '../game/content';

export type {
  TraversalBeatType, TraversalBeatPlacement, TraversalContentCategory,
  TraversalInteractionPolicy, TraversalBeatCrossing, TraversalRouteBeat,
} from './TraversalRouteModel';
export { traversalContactProgress, resolveTraversalBeatCrossing } from './TraversalRouteModel';

export type TraversalT0Route = TraversalRoute<'T0'>;

export interface TraversalRouteIssue {
  readonly code: 'NOT_T0' | 'MISSING_CAMPAIGN_NODE' | 'MISSING_RUN_NODE' | 'MISSING_CHARACTER_VISUAL';
  readonly subjectId: string;
  readonly detail: string;
}

// T0 presents canonical checkpoint beats only. Local road prototypes are not route defaults.

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
  const characterId = stage.nodeIds.includes('lion-refugees') ? 'refugee_mother'
    : representativeCharacter(definitions, partyCharacterIds, issues);
  const isFork = stage.mode === 'IN_TRAVERSAL_FORK';
  const optional = stage.mode === 'OPTIONAL_INTERRUPT';
  // Participation and presentation are separate: Cedric is mandatory route-wide,
  // but remains staged on the authored upper roadside rather than as a centered blockade.
  const upperRoadside = optional || stage.nodeIds.includes('lion-nomad-crossroads');
  const label = isFork
    ? runNodes.map((node) => node.label).join(' · ') || 'Choisir la route'
    : runNodes[0]?.label ?? stage.nodeIds[0] ?? 'Étape de route';
  const isCombat = definitions.some((definition) => definition.contentAuthority === 'COMBAT');
  const formation = !isFork && isCombat ? combatConfigs.get(runNodes[0]?.contentId ?? '')?.enemyVisualIds : undefined;

  return Object.freeze({
    id: `t0:stage:${stageIndex}:${stage.nodeIds.join('+')}`,
    type: isFork ? 'fork' : 'campaign-node',
    category: isFork ? 'ROUTE_CHOICE' : optional ? 'OPTIONAL_EVENT' : 'MANDATORY_EVENT',
    engagement: 'ROUTE',
    progress01: (stageIndex + 1) / (stageCount + 1),
    // Human roadside interactions may be route-wide without becoming centered blockades.
    lane: upperRoadside ? 0 : null,
    placement: upperRoadside ? 'LANE' : 'CENTERED',
    label,
    marker: isFork ? 'fork' : isCombat ? 'danger' : 'speech',
    interactionPolicy: optional ? 'OPTIONAL_CONFIRM' : 'MANDATORY_CONFIRM',
    campaignNodeIds: Object.freeze([...stage.nodeIds]),
    // Narrative situations occupy authored road sections; characters retain canonical scale.
    ...(stage.nodeIds.includes('lion-nomad-crossroads') ? { locationId: 'nomad-waystation' } : {}),
    ...(stage.nodeIds.includes('lion-refugees') ? { locationId: 'resting-clearing' } : {}),
    ...(stage.nodeIds.includes('lion-opening-ambush') ? { locationId: 'opening-ambush' } : {}),
    ...(isFork ? { locationId: 'forest-junction' } : {}),
    ...(formation ? { formation } : {}),
    ...(isFork ? { visualAsset: TRAVERSAL_T0_ASSETS.forkSign } : characterId ? {
      characterId,
      visualAsset: resolveCharacterAsset(characterId, 'full'),
      mirrorX: characterId !== 'wounded_merchant',
    } : isCombat ? {
      visualAsset: resolveCharacterAsset('wolf', 'full'),
      mirrorX: true,
    } : {}),
  });
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
  _seed = 0,
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
  const fork = leg.stages.find(stage => stage.mode === 'IN_TRAVERSAL_FORK')!;
  const branchBeats = fork.nodeIds.map((nodeId): TraversalRouteBeat => {
    const runNode = runNodesById.get(nodeId)!;
    const isCombat = runNode.type === 'combat';
    const composition = isCombat ? combatConfigs.get(runNode.contentId)?.enemyVisualIds : undefined;
    const characterId = isCombat ? composition?.[0] ?? 'wolf' : 'survivor';
    const optional = fork.branchEncounterMode === 'OPTIONAL_INTERRUPT' || Boolean(fork.optionalBranchNodeIds?.includes(nodeId));
    return Object.freeze({
      id: `t0:branch:${nodeId}`, branchNodeId: nodeId, type: 'campaign-node',
      category: optional ? isCombat ? 'OPTIONAL_COMBAT' : 'OPTIONAL_EVENT' : 'MANDATORY_EVENT',
      engagement: isCombat && optional ? 'LANE' : 'ROUTE',
      progress01: .91, lane: null,
      placement: 'CENTERED', label: runNode.label,
      marker: isCombat ? 'danger' : 'speech',
      interactionPolicy: optional ? 'OPTIONAL_CONFIRM' : 'MANDATORY_CONFIRM',
      campaignNodeIds: Object.freeze([nodeId]), characterId,
      visualAsset: runNode.contentId === 'mystery_treasure' ? TRAVERSAL_T0_ASSETS.abandonedCart : resolveCharacterAsset(characterId, 'full'), mirrorX: true,
      locationId: 'selected-route',
      ...(composition ? { formation: composition } : {}),
    });
  });
  if (beatIssues.length > 0) throw new Error(beatIssues.map((issue) => issue.detail).join('\n'));
  return Object.freeze({
    legId: 'T0',
    originNodeId: leg.originNodeId,
    destinationNodeId: leg.destinationNodeId,
    originLabel: runNodesById.get(leg.originNodeId)!.label,
    destinationLabel: runNodesById.get(leg.destinationNodeId)!.label,
    distanceKm: 4,
    beats: Object.freeze([...stageBeats, ...branchBeats]
      .sort((a, b) => a.progress01 - b.progress01)),
  });
}
