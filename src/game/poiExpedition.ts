import { LOT_E_ELITES, LOT_E_EDGES, LOT_E_POIS, makeExpeditionNodes, GUARD_POSTS,
  type EliteDefinition } from '../campaign/LionPoiAuthoring';
import { challengeFor, describeChallenge, type ChallengeText } from './challenges';
import type { GameState, PoiEliteEncounter, PoiExpeditionState } from './types';

export interface ExpeditionGeography {
  nodes: {id: string; status: string; canActivate: boolean}[];
  edges: {from: string; to: string; unlocked: boolean}[];
}
/** A stationary guardian on its post (set 1.18.0). Derived, never saved. */
export interface PoiThreatView {
  id: string; label: string; region: number; positionId: string; canFight: boolean; challenge?: ChallengeText;
}

export function initialPoiExpedition(): PoiExpeditionState {
  return {version: 1, turn: 0, elites: Object.fromEntries(LOT_E_ELITES.map(def => [def.id, {
    active: false, positionId: GUARD_POSTS[def.id] ?? def.spawnPosition, patrolIndex: def.allowedPositions.indexOf(def.spawnPosition),
    mode: def.mode, lastStep: 0, defeated: false,
  }]))};
}

/** Add only missing Lot E entries; never reconstruct a canonical fact or assignment. */
export function migratePoiExpedition(state: GameState): GameState {
  const ids = new Set(state.run.graph.nodes.map(node => node.id));
  state.run.graph.nodes.push(...makeExpeditionNodes(state.run.seed).filter(node => !ids.has(node.id)));
  state.run.poiExpedition ??= initialPoiExpedition();
  const initial = initialPoiExpedition();
  for (const def of LOT_E_ELITES) state.run.poiExpedition.elites[def.id] ??= initial.elites[def.id]!;
  syncPoiElites(state);
  return state;
}

/** Set 1.18.0: a post opens once its existing activation condition is met and its chest is unlocked. */
function postOpen(state: GameState, def: EliteDefinition): boolean {
  const poi = LOT_E_POIS.find(poi => poi.id === GUARD_POSTS[def.id]);
  return state.resolvedNodeIds.includes(def.activateAfterResolved)
    && (poi?.prerequisiteResolved ?? []).every(id => state.resolvedNodeIds.includes(id));
}

/**
 * Set 1.18.0: guardians stand at their post, deferred while the company stands there, and never move. An old save's
 * pending step clears without moving anyone, and a saved encounter keeps its guardian where it was found.
 */
export function syncPoiElites(state: GameState): void {
  const expedition = state.run.poiExpedition;
  if (!expedition) return;
  delete expedition.pendingStep;
  for (const def of LOT_E_ELITES) {
    const elite = expedition.elites[def.id];
    if (!elite || expedition.encounter?.eliteId === def.id) continue;
    if (state.run.status !== 'active' || elite.defeated) {elite.active = false; continue;}
    const post = GUARD_POSTS[def.id]!;
    elite.active = postOpen(state, def) && state.run.currentNodeId !== post;
    if (elite.active) elite.positionId = post;
  }
}

const adjacent = (map: ExpeditionGeography, from: string, to: string): boolean => map.edges.some(edge =>
  edge.unlocked && ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)));

export function safePoiReturn(state: GameState, map: ExpeditionGeography, id = state.run.poiExpedition?.previousSafeNodeId): string|undefined {
  if (!id || id === state.run.currentNodeId || !state.run.visitedNodeIds.includes(id)
    || !adjacent(map, state.run.currentNodeId, id)) return undefined;
  const node = map.nodes.find(node => node.id === id);
  const inert = node?.status === 'resolved' || node?.status === 'neutralized' || id === 'lion-camp';
  if (!inert || LOT_E_ELITES.some(def => {
    const elite = state.run.poiExpedition?.elites[def.id];
    return elite?.active && !elite.defeated && elite.positionId === id;
  })) return undefined;
  return id;
}

export function eliteAtPoi(state: GameState, id: string): EliteDefinition|undefined {
  if (state.run.status !== 'active') return undefined;
  return LOT_E_ELITES.find(def => {
    const elite = state.run.poiExpedition?.elites[def.id];
    return elite?.active && !elite.defeated && elite.positionId === id;
  });
}

export function beginPoiEliteEncounter(state: GameState, eliteId: string, kind: PoiEliteEncounter['kind'], target: string,
  safeReturnNodeId?: string): PoiEliteEncounter|null {
  const expedition = state.run.poiExpedition;
  const elite = expedition?.elites[eliteId];
  if (!expedition || expedition.encounter || !elite?.active || elite.defeated || state.run.status !== 'active') return null;
  return expedition.encounter = {id: `${eliteId}:${expedition.turn}:${kind}`, eliteId, kind,
    originNodeId: state.run.currentNodeId, targetNodeId: target, safeReturnNodeId, phase: 'choice'};
}

export function recordPoiMovement(state: GameState, from: string, to: string, safeOrigin: boolean): void {
  const expedition = state.run.poiExpedition;
  if (!expedition || from === to) return;
  expedition.previousSafeNodeId = safeOrigin ? from : undefined;
  // Set 1.18.0: the turn stays readable and keeps encounter ids distinct; it gates nothing and moves no one.
  expedition.turn++;
}

/** Called after arrival content, never by a redraw. Set 1.18.0: guardians take or keep their post; nobody moves. */
export function settlePoiStep(state: GameState, _map: ExpeditionGeography): void {
  syncPoiElites(state);
}

export function retreatPoiElite(state: GameState, map: ExpeditionGeography): boolean {
  const expedition = state.run.poiExpedition; const encounter = expedition?.encounter;
  if (!expedition || !encounter || encounter.phase !== 'choice') return false;
  if (encounter.kind === 'rear') {
    const target = safePoiReturn(state, map, encounter.safeReturnNodeId);
    if (!target) return false;
    state.run.currentNodeId = state.currentNodeId = target;
    delete expedition.previousSafeNodeId;
  }
  delete expedition.encounter; return true;
}

export function selectPoiThreats(state: GameState, map: ExpeditionGeography): PoiThreatView[] {
  return LOT_E_ELITES.flatMap(def => {
    const elite = state.run.poiExpedition?.elites[def.id];
    if (!elite?.active || elite.defeated || state.run.status !== 'active') return [];
    const challenge = challengeFor(def.combat.id);
    return [{id: def.id, label: def.label, region: def.region, positionId: elite.positionId,
      canFight: elite.positionId === state.run.currentNodeId || adjacent(map, elite.positionId, state.run.currentNodeId),
      ...(challenge ? {challenge: describeChallenge(challenge)} : {})}];
  });
}

export function expeditionEdges(): {from: string; to: string}[] {return LOT_E_EDGES;}
export function isExpeditionPoi(id: string): boolean {return LOT_E_POIS.some(poi => poi.id === id);}
