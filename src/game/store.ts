import { createUnitInstance, getFinalStats, getItemCategory } from './catalog';
import { createRunState, enterRunNode, getAvailableRunNodes, getRunNode } from './runSystem';
import {
  gameStateSchema,
  gameStateV1Schema,
  gameStateV2Schema,
  gameStateV3Schema,
  gameStateV4Schema,
  gameStateV5Schema,
  type GameState,
  type GameStateV1,
  type GameStateV2,
  type GameStateV3,
  type GameStateV4,
  type GameStateV5,
  type UnitInstance,
  type UnitInstanceV5,
} from './types';

const AUTO_KEY = 'rpg-threejs:autosave:v6';
const MANUAL_KEY = 'rpg-threejs:manual:v6';
const V5_AUTO_KEY = 'rpg-threejs:autosave:v5';
const V5_MANUAL_KEY = 'rpg-threejs:manual:v5';
const V4_AUTO_KEY = 'rpg-threejs:autosave:v4';
const V4_MANUAL_KEY = 'rpg-threejs:manual:v4';
const V3_AUTO_KEY = 'rpg-threejs:autosave:v3';
const V3_MANUAL_KEY = 'rpg-threejs:manual:v3';
const V2_AUTO_KEY = 'rpg-threejs:autosave:v2';
const V2_MANUAL_KEY = 'rpg-threejs:manual:v2';
const LEGACY_AUTO_KEY = 'rpg-threejs:autosave:v1';
const LEGACY_MANUAL_KEY = 'rpg-threejs:manual:v1';

export function createInitialState(): GameState {
  const run = createRunState();
  return {
    version: 6,
    currentNodeId: run.currentNodeId,
    visitedNodeIds: [run.currentNodeId],
    stepCounter: 0,
    resolvedNodeIds: [],
    combatCooldowns: {},
    mysteryAssignments: {},
    seenUniqueEvents: [],
    flags: {},
    gold: 150,
    reputation: 30,
    reputationHistory: [],
    inventory: {
      consumables: { potion: 3, ether: 1, antidote: 2, bomb: 2 },
      accessories: { strength_ring: 1, magic_pendant: 1 },
      materials: { iron_ore: 3 },
      weapons: { steel_sword: 1, long_bow: 1, mystic_staff: 1 },
    },
    clan: {
      maxSize: 12,
      members: [
        createUnitInstance('knight', true),
        createUnitInstance('cleric', true),
        createUnitInstance('mage', true),
        createUnitInstance('archer', true),
      ],
    },
    deployment: { unitIds: ['knight', 'cleric', 'mage', 'archer'] },
    shops: {
      valmir: {
        id: 'valmir',
        stock: {
          potion: 8, ether: 3, antidote: 4, bomb: 3,
          strength_ring: 1, life_belt: 1, agility_boots: 1, wisdom_crown: 1, magic_pendant: 1,
          steel_sword: 1, long_bow: 1, mystic_staff: 1, war_mace: 1, battle_axe: 1,
        },
      },
    },
    settings: { reducedGraphics: false },
    run,
    endingId: null,
  };
}

function hasCurrentLionRoute(state: GameState): boolean {
  const nodes = state.run.graph.nodes;
  return nodes.length === 19
    && nodes.some((node) => node.id === 'lion-opening-ambush')
    && nodes.some((node) => node.id === 'lion-final-trial-event')
    && Math.max(...nodes.map((node) => node.depth)) === 15;
}

function migrateCurrentLionRoute(previous: GameState): GameState {
  const previousNode = getRunNode(previous.run);
  const targetDepth = Math.min(15, previousNode?.depth ?? previous.resolvedNodeIds.length);
  const run = createRunState(previous.run.seed);
  for (let depth = 0; depth < targetDepth; depth += 1) {
    const next = getAvailableRunNodes(run)[0];
    if (!next) break;
    enterRunNode(run, next.id);
    if (next.type === 'refuge') run.checkpointNodeId = next.id;
  }
  run.temporaryLoot = structuredClone(previous.run.temporaryLoot);
  const activeNode = getRunNode(run);
  return gameStateSchema.parse({
    ...previous,
    currentNodeId: activeNode?.id ?? run.currentNodeId,
    visitedNodeIds: [...run.visitedNodeIds],
    resolvedNodeIds: run.visitedNodeIds.filter((id) => id !== run.currentNodeId),
    mysteryAssignments: {},
    run,
  });
}

export function migrateState(value: unknown): GameState {
  const current = gameStateSchema.safeParse(value);
  if (current.success) return hasCurrentLionRoute(current.data) ? current.data : migrateCurrentLionRoute(current.data);
  const v5 = gameStateV5Schema.safeParse(value);
  if (v5.success) return migrateV5(v5.data);
  const v4 = gameStateV4Schema.safeParse(value);
  if (v4.success) return migrateV4(v4.data);
  const v3 = gameStateV3Schema.safeParse(value);
  if (v3.success) return migrateV4(migrateV3(v3.data));
  const v2 = gameStateV2Schema.safeParse(value);
  if (v2.success) return migrateV4(migrateV2(v2.data));
  const legacy = gameStateV1Schema.parse(value);
  return migrateV1(legacy);
}

function migrateV3(previous: GameStateV3): GameStateV4 {
  return gameStateV4Schema.parse({
    ...previous,
    version: 4,
    visitedNodeIds: [...new Set([...previous.resolvedNodeIds, previous.currentNodeId])],
  });
}

function migrateV2(previous: GameStateV2): GameStateV4 {
  const initial = createInitialState();
  const { run: _run, reputationHistory: _history, ...initialV4Shape } = initial;
  const next = initialV4Shape as unknown as GameStateV4;
  Object.assign(next, previous, {
    version: 4,
    visitedNodeIds: [...new Set([...previous.resolvedNodeIds, previous.currentNodeId])],
  });
  next.clan = {
    maxSize: previous.clan.maxSize,
    members: previous.clan.members.map((unit) => {
      const defaults = createUnitInstance(unit.definitionId).equipment.weaponIds;
      return {
        ...unit,
        equipment: {
          weaponIds: [unit.equipment.weaponId, ...defaults.filter((id) => id !== unit.equipment.weaponId)].slice(0, 1),
          accessoryIds: [...unit.equipment.accessoryIds, null, null].slice(0, 3) as [string | null, string | null, string | null],
        },
      };
    }),
  };
  return gameStateV4Schema.parse(next);
}

function migrateV1(legacy: GameStateV1): GameState {
  const next = createInitialState();
  next.currentNodeId = legacy.currentNodeId;
  next.stepCounter = legacy.stepCounter;
  next.resolvedNodeIds = legacy.resolvedNodeIds;
  next.combatCooldowns = legacy.combatCooldowns;
  next.mysteryAssignments = legacy.mysteryAssignments;
  next.seenUniqueEvents = legacy.seenUniqueEvents;
  next.flags = legacy.flags;
  next.gold = legacy.gold;
  next.reputation = legacy.reputation;
  next.endingId = legacy.endingId;
  next.clan.members = legacy.roster.slice(0, 12).map((id, index) => createUnitInstance(id, index < 4));
  next.deployment.unitIds = next.clan.members.slice(0, 4).map((unit) => unit.id);
  next.inventory.consumables = {};
  for (const [itemId, quantity] of Object.entries(legacy.inventory)) {
    const category = getItemCategory(itemId) ?? 'consumables';
    next.inventory[category][itemId] = quantity;
  }
  return gameStateSchema.parse(next);
}

function hydrateV6Unit(unit: UnitInstanceV5): UnitInstance {
  const stats = getFinalStats(unit);
  return {
    ...unit,
    currentHealth: stats.maxHealth,
    skillUpgrades: {},
  };
}

function migrateV5(previous: GameStateV5): GameState {
  const migrated = gameStateSchema.parse({
    ...previous,
    version: 6,
    clan: {
      ...previous.clan,
      members: previous.clan.members.map(hydrateV6Unit),
    },
  });
  return hasCurrentLionRoute(migrated) ? migrated : migrateCurrentLionRoute(migrated);
}

function migrateV4(previous: GameStateV4): GameState {
  const run = createRunState(20260622 + previous.stepCounter);
  const targetDepth = Math.min(15, previous.resolvedNodeIds.length);
  for (let depth = 0; depth < targetDepth; depth += 1) {
    const next = getAvailableRunNodes(run)[0];
    if (!next) break;
    enterRunNode(run, next.id);
    if (next.type === 'refuge') run.checkpointNodeId = next.id;
  }
  const activeNode = getRunNode(run);
  return gameStateSchema.parse({
    ...previous,
    version: 6,
    currentNodeId: activeNode?.id ?? run.currentNodeId,
    visitedNodeIds: [...run.visitedNodeIds],
    reputationHistory: [],
    clan: {
      ...previous.clan,
      members: previous.clan.members.map(({ level: _level, xp: _xp, ...unit }) => hydrateV6Unit(unit)),
    },
    run,
  });
}

export class SaveRepository {
  loadAuto(): GameState | null {
    return this.load(AUTO_KEY) ?? this.load(V5_AUTO_KEY) ?? this.load(V4_AUTO_KEY) ?? this.load(V3_AUTO_KEY) ?? this.load(V2_AUTO_KEY) ?? this.load(LEGACY_AUTO_KEY);
  }

  loadManual(): GameState | null {
    return this.load(MANUAL_KEY) ?? this.load(V5_MANUAL_KEY) ?? this.load(V4_MANUAL_KEY) ?? this.load(V3_MANUAL_KEY) ?? this.load(V2_MANUAL_KEY) ?? this.load(LEGACY_MANUAL_KEY);
  }

  saveAuto(state: GameState): void {
    localStorage.setItem(AUTO_KEY, JSON.stringify(gameStateSchema.parse(state)));
  }

  saveManual(state: GameState): void {
    localStorage.setItem(MANUAL_KEY, JSON.stringify(gameStateSchema.parse(state)));
  }

  hasSave(): boolean {
    return [AUTO_KEY, MANUAL_KEY, V5_AUTO_KEY, V5_MANUAL_KEY, V4_AUTO_KEY, V4_MANUAL_KEY, V3_AUTO_KEY, V3_MANUAL_KEY, V2_AUTO_KEY, V2_MANUAL_KEY, LEGACY_AUTO_KEY, LEGACY_MANUAL_KEY]
      .some((key) => localStorage.getItem(key) !== null);
  }

  clear(): void {
    for (const key of [AUTO_KEY, MANUAL_KEY, V5_AUTO_KEY, V5_MANUAL_KEY, V4_AUTO_KEY, V4_MANUAL_KEY, V3_AUTO_KEY, V3_MANUAL_KEY, V2_AUTO_KEY, V2_MANUAL_KEY, LEGACY_AUTO_KEY, LEGACY_MANUAL_KEY]) {
      localStorage.removeItem(key);
    }
  }

  private load(key: string): GameState | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return migrateState(JSON.parse(raw));
    } catch (error) {
      console.warn(`Ignoring invalid save '${key}'.`, error);
      return null;
    }
  }
}
