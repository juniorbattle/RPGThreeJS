import { getLionCampaignNodeDefinition } from '../campaign/LionCampaignStructure';
import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import { getAvailableRunNodes } from '../game/runSystem';
import type { GameState, RunNode } from '../game/types';
import { combatConfigs } from '../game/content';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import { assets } from '../render/assetManifest';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import type { TraversalRoute, TraversalRouteBeat } from './TraversalRouteModel';

/** Explicit encounter contact, including the existing non-V2 presentation entity. */
const CONTACTS: Readonly<Record<string, string>> = Object.freeze({
  mystery_lancer_recruit: 'lancer', witnesses_on_road: 'survivor',
  mystery_dragon_roost: 'young_dragon_elite', mystery_shrine: 'shrine_apparition',
  serpent_informant: 'serpent_oracle',
});

/** Presentation of existing T3 nodes; available adaptive nodes remain RunSystem-owned. */
export function resolveTraversalT3Route(leg: LionTraversalLeg, state: GameState): TraversalRoute<'T3'> {
  if (leg.id !== 'T3') throw new Error('The T3 route resolver only accepts T3.');
  const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
  for (const node of getAvailableRunNodes(state)) nodes.set(node.id, node);
  const requireNode = (id: string): RunNode => {
    const node = nodes.get(id);
    if (!node || !getLionCampaignNodeDefinition(id)) throw new Error(`Missing canonical T3 node: ${id}`);
    return node;
  };
  const createBeat = (ids: readonly string[], index: number, branchNodeId?: string): TraversalRouteBeat => {
    const contacts = ids.map(requireNode);
    const fork = ids.length > 1;
    const node = contacts[0]!;
    const combat = !fork && node.type === 'combat';
    const formation = combat ? combatConfigs.get(node.contentId)?.enemyVisualIds : undefined;
    const characterId = fork ? undefined : combat ? formation?.[0]
      : CONTACTS[node.contentId];
    const visualAsset = fork ? TRAVERSAL_T0_ASSETS.forkSign
      : characterId === 'shrine_apparition' ? assets.characterProfiles.shrine_apparition.full
      : characterId ? resolveCharacterAsset(characterId, 'full') : undefined;
    if (!fork && (!characterId || !visualAsset)) throw new Error(`T3 checkpoint lacks canonical actor: ${node.id}`);
    return Object.freeze({ id: `t3:${branchNodeId ? 'branch' : 'stage'}:${branchNodeId ?? index}`,
      branchNodeId, type: fork ? 'fork' : 'campaign-node', category: fork ? 'ROUTE_CHOICE' : 'MANDATORY_EVENT',
      engagement: 'ROUTE', progress01: branchNodeId ? .91 : (index + 1) / (leg.stages.length + 1),
      lane: combat || fork ? null : 0, placement: combat || fork ? 'CENTERED' : 'LANE',
      label: contacts.map(contact => contact.label).join(' · '), marker: fork ? 'fork' : combat ? 'danger' : 'speech',
      interactionPolicy: 'MANDATORY_CONFIRM', campaignNodeIds: Object.freeze([...ids]),
      characterId, visualAsset, mirrorX: !fork,
      locationId: branchNodeId ? 't3-selected-route' : fork ? 't3-junction'
        : node.id === 'lion-lancer-recruit' ? 'lancer-halt' : 'witness-road',
      ...(formation ? { formation } : {}),
    });
  };
  const fork = leg.stages.find(stage => stage.mode === 'IN_TRAVERSAL_FORK');
  if (!fork) throw new Error('T3 requires its canonical route fork.');
  return Object.freeze({ legId: 'T3', originNodeId: leg.originNodeId, destinationNodeId: leg.destinationNodeId,
    originLabel: requireNode(leg.originNodeId).label, destinationLabel: requireNode(leg.destinationNodeId).label,
    distanceKm: 4, beats: Object.freeze([...leg.stages.map((stage, index) => createBeat(stage.nodeIds, index)),
      ...fork.nodeIds.map(id => createBeat([id], leg.stages.length, id))]) });
}
