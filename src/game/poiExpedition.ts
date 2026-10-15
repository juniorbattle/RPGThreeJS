import { LOT_E_ELITES, LOT_E_EDGES, LOT_E_POIS, makeExpeditionNodes,
  LION_CANONICAL_POI_IDS, type EliteDefinition } from '../campaign/LionPoiAuthoring';
import type { GameState, PoiEliteEncounter, PoiExpeditionState } from './types';

export interface ExpeditionGeography {
  nodes: {id: string; status: string; canActivate: boolean}[];
  edges: {from: string; to: string; unlocked: boolean}[];
}
export interface PoiThreatView {
  id: string; label: string; region: number; positionId: string; nextPositionId: string;
  mode: string; contested: boolean; canFight: boolean;
}

export function initialPoiExpedition(): PoiExpeditionState {
  return {version: 1, turn: 0, elites: Object.fromEntries(LOT_E_ELITES.map(def => [def.id, {
    active: false, positionId: def.spawnPosition, patrolIndex: def.allowedPositions.indexOf(def.spawnPosition),
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

export function syncPoiElites(state: GameState): void {
  const expedition = state.run.poiExpedition;
  if (!expedition) return;
  for (const def of LOT_E_ELITES) {
    const elite = expedition.elites[def.id];
    if (!elite) continue;
    if (state.run.status !== 'active' || elite.defeated) {elite.active = false; continue;}
    if (!elite.active && state.resolvedNodeIds.includes(def.activateAfterResolved)
      && state.run.currentNodeId !== def.spawnPosition) {
      elite.active = true; elite.positionId = def.spawnPosition;
      elite.patrolIndex = def.allowedPositions.indexOf(def.spawnPosition); elite.lastStep = expedition.turn;
    }
  }
}

const adjacent = (map: ExpeditionGeography, from: string, to: string): boolean => map.edges.some(edge =>
  edge.unlocked && ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)));

function canOccupy(state: GameState, def: EliteDefinition, id: string, map: ExpeditionGeography): boolean {
  const node = map.nodes.find(node => node.id === id);
  return def.allowedPositions.includes(id) && Boolean(node && node.status !== 'locked')
    && (!LION_CANONICAL_POI_IDS.includes(id) || state.resolvedNodeIds.includes(id));
}

function distances(map: ExpeditionGeography, target: string): Map<string, number> {
  const distance = new Map([[target, 0]]); const queue = [target];
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index]!;
    for (const edge of map.edges.filter(edge => edge.unlocked && (edge.from === id || edge.to === id))) {
      const next = edge.from === id ? edge.to : edge.from;
      if (!distance.has(next)) {distance.set(next, distance.get(id)! + 1); queue.push(next);}
    }
  }
  return distance;
}

function nextElitePosition(state: GameState, def: EliteDefinition, map: ExpeditionGeography): string {
  const elite = state.run.poiExpedition!.elites[def.id]!;
  const candidates = def.allowedPositions.filter(id => id !== elite.positionId
    && adjacent(map, elite.positionId, id) && canOccupy(state, def, id, map));
  if (def.mode === 'cyclic_patrol') {
    const next = def.allowedPositions[(elite.patrolIndex + 1) % def.allowedPositions.length]!;
    return candidates.includes(next) ? next : elite.positionId;
  }
  const distance = distances(map, state.run.currentNodeId);
  const closer = candidates.filter(id => (distance.get(id) ?? Infinity) < (distance.get(elite.positionId) ?? Infinity))
    .sort((a,b) => (distance.get(a)! - distance.get(b)!) || a.localeCompare(b));
  if (closer[0]) return closer[0];
  return candidates.sort()[expeditionPatrolChoice(elite.patrolIndex, candidates.length)] ?? elite.positionId;
}
function expeditionPatrolChoice(index: number, length: number): number {return length ? index % length : 0;}

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
  expedition.turn++;
  expedition.pendingStep = {step: expedition.turn, fromNodeId: from, toNodeId: to};
}

/** Called after arrival content, never by a redraw. Persisted pendingStep makes reload idempotent. */
export function settlePoiStep(state: GameState, map: ExpeditionGeography): void {
  const expedition = state.run.poiExpedition;
  if (!expedition) return;
  syncPoiElites(state);
  if (!expedition.pendingStep || expedition.encounter || state.run.status !== 'active') return;
  const step = expedition.pendingStep.step;
  for (const def of LOT_E_ELITES) {
    const elite = expedition.elites[def.id]!;
    if (!elite.active || elite.defeated || elite.lastStep >= step) continue;
    elite.lastStep = step;
    const next = nextElitePosition(state, def, map);
    const safeReturn = next === state.run.currentNodeId ? safePoiReturn(state, map) : undefined;
    if (next === state.run.currentNodeId && !safeReturn) continue;
    elite.positionId = next; elite.patrolIndex = def.allowedPositions.indexOf(next);
    if (next === state.run.currentNodeId) beginPoiEliteEncounter(state, def.id, 'rear', next, safeReturn);
  }
  delete expedition.pendingStep;
}

export function waitPoiTurn(state: GameState, map: ExpeditionGeography): boolean {
  const expedition = state.run.poiExpedition;
  if (!expedition || expedition.encounter || expedition.pendingStep || state.run.status !== 'active') return false;
  expedition.turn++;
  expedition.pendingStep = {step: expedition.turn, fromNodeId: state.run.currentNodeId, toNodeId: state.run.currentNodeId};
  settlePoiStep(state, map); return true;
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
    const next = nextElitePosition(state, def, map);
    return [{id: def.id, label: def.label, region: def.region, positionId: elite.positionId, nextPositionId: next,
      mode: def.mode, contested: next === state.run.currentNodeId || elite.positionId === state.run.currentNodeId,
      canFight: elite.positionId === state.run.currentNodeId || adjacent(map, elite.positionId, state.run.currentNodeId)}];
  });
}

export function expeditionEdges(): {from: string; to: string}[] {return LOT_E_EDGES;}
export function isExpeditionPoi(id: string): boolean {return LOT_E_POIS.some(poi => poi.id === id);}
