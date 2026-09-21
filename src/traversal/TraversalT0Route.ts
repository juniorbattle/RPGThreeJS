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
import { beatPassedProgress } from './TraversalRoadSpace';
import { createRoadEncounterConfig, resolveRoadEncounterId } from './TraversalRoadEncounter';
import { combatConfigs } from '../game/content';

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
  /** References independent presentation geography, never owns its rendering. */
  readonly locationId?: string;
  readonly mirrorX?: boolean;
  /** Conditional encounter on a road selected by RunSystem, not a second branch authority. */
  readonly branchNodeId?: string;
  readonly roadCombatId?: string;
  readonly formation?: readonly string[];
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
    progress01: 0.09,
    lane: 0 as const,
    placement: 'LANE' as const,
    label: 'Marchand itinérant',
    marker: 'speech' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    characterId: 'wounded_merchant',
    visualAsset: resolveCharacterAsset('wounded_merchant', 'full'),
    locationId: 'merchant-halt',
    mirrorX: false,
  }),
  Object.freeze({
    id: 't0:enemy:wolf-scouts',
    type: 'enemy' as const,
    progress01: 0.30,
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
    progress01: 0.49,
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
    progress01: 0.68,
    lane: 0 as const,
    placement: 'LANE' as const,
    label: 'Débris de chariot',
    marker: 'obstacle' as const,
    interactionPolicy: 'OPTIONAL_CONFIRM' as const,
    campaignNodeIds: Object.freeze([]),
    visualAsset: TRAVERSAL_T0_ASSETS.abandonedCart,
  }),
  Object.freeze({
    id: 't0:booster:lion-ward',
    type: 'booster' as const,
    progress01: 0.75,
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
  const characterId = stage.nodeIds.includes('lion-refugees') ? 'refugee_mother'
    : representativeCharacter(definitions, partyCharacterIds, issues);
  const isFork = stage.mode === 'IN_TRAVERSAL_FORK';
  const optional = stage.mode === 'OPTIONAL_INTERRUPT';
  const label = isFork
    ? runNodes.map((node) => node.label).join(' · ') || 'Choisir la route'
    : runNodes[0]?.label ?? stage.nodeIds[0] ?? 'Étape de route';
  const isCombat = definitions.some((definition) => definition.contentAuthority === 'COMBAT');
  const formation = !isFork && isCombat ? combatConfigs.get(runNodes[0]?.contentId ?? '')?.enemyVisualIds : undefined;

  return Object.freeze({
    id: `t0:stage:${stageIndex}:${stage.nodeIds.join('+')}`,
    type: isFork ? 'fork' : 'campaign-node',
    progress01: (stageIndex + 1) / (stageCount + 1),
    lane: optional ? (stageIndex % 2) as TraversalLane : null,
    placement: optional ? 'LANE' : 'CENTERED',
    label,
    marker: isFork ? 'fork' : isCombat ? 'danger' : 'speech',
    interactionPolicy: optional ? 'OPTIONAL_CONFIRM' : 'MANDATORY_CONFIRM',
    campaignNodeIds: Object.freeze([...stage.nodeIds]),
    // Recruits remain simple road encounters. Larger resting sites use upper-lane access.
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

/** Pure contact rule: optional beats require their lane; mandatory beats ignore lane. */
export function resolveTraversalBeatCrossing(
  beat: TraversalRouteBeat,
  previousProgress01: number,
  nextProgress01: number,
  lane: TraversalLane,
): TraversalBeatCrossing {
  if (nextProgress01 <= previousProgress01) return 'NONE';
  if (previousProgress01 < beat.progress01 && nextProgress01 >= beat.progress01) {
    if (beat.interactionPolicy === 'MANDATORY_CONFIRM' || beat.lane === lane) return 'TRIGGERED';
  }
  const passed = beatPassedProgress(beat.progress01);
  return beat.interactionPolicy === 'OPTIONAL_CONFIRM' && previousProgress01 < passed && nextProgress01 >= passed
    ? 'BYPASSED' : 'NONE';
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
  seed = 0,
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
  const branchBeats = fork.nodeIds.map((nodeId, index): TraversalRouteBeat => {
    const runNode = runNodesById.get(nodeId)!;
    const isCombat = runNode.type === 'combat';
    const composition = isCombat ? combatConfigs.get(runNode.contentId)?.enemyVisualIds : undefined;
    const characterId = isCombat ? composition?.[0] ?? 'wolf' : 'survivor';
    const optional = fork.branchEncounterMode === 'OPTIONAL_INTERRUPT';
    return Object.freeze({
      id: `t0:branch:${nodeId}`, branchNodeId: nodeId, type: 'campaign-node',
      progress01: .91, lane: optional ? index as TraversalLane : null,
      placement: optional ? 'LANE' : 'CENTERED', label: runNode.label,
      marker: isCombat ? 'danger' : 'speech',
      interactionPolicy: optional ? 'OPTIONAL_CONFIRM' : 'MANDATORY_CONFIRM',
      campaignNodeIds: Object.freeze([nodeId]), characterId,
      visualAsset: runNode.contentId === 'mystery_treasure' ? TRAVERSAL_T0_ASSETS.chest : resolveCharacterAsset(characterId, 'full'), mirrorX: true,
      locationId: 'selected-route',
      ...(composition ? { formation: composition } : {}),
    });
  });
  if (beatIssues.length > 0) throw new Error(beatIssues.map((issue) => issue.detail).join('\n'));
  const ambientBeats = AMBIENT_T0_BEATS.map(beat => {
    if (beat.type !== 'enemy') return beat;
    const roadCombatId = resolveRoadEncounterId(seed);
    const config = createRoadEncounterConfig(roadCombatId);
    const characterId = config.enemyVisualIds?.[0] ?? 'wolf';
    return Object.freeze({ ...beat, roadCombatId, characterId, label: config.encounterLabel,
      formation: config.enemyVisualIds,
      visualAsset: resolveCharacterAsset(characterId, 'full') });
  });

  return Object.freeze({
    legId: 'T0',
    originNodeId: leg.originNodeId,
    destinationNodeId: leg.destinationNodeId,
    originLabel: runNodesById.get(leg.originNodeId)!.label,
    destinationLabel: runNodesById.get(leg.destinationNodeId)!.label,
    distanceKm: 4,
    beats: Object.freeze([...stageBeats, ...ambientBeats, ...branchBeats]
      .sort((a, b) => a.progress01 - b.progress01)),
  });
}
