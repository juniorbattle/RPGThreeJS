import { createUnitInstance, getItemCategory } from './catalog';
import {
  gameStateSchema,
  gameStateV1Schema,
  gameStateV2Schema,
  gameStateV3Schema,
  type GameState,
  type GameStateV1,
  type GameStateV2,
  type GameStateV3,
} from './types';

const AUTO_KEY = 'rpg-threejs:autosave:v4';
const MANUAL_KEY = 'rpg-threejs:manual:v4';
const V3_AUTO_KEY = 'rpg-threejs:autosave:v3';
const V3_MANUAL_KEY = 'rpg-threejs:manual:v3';
const V2_AUTO_KEY = 'rpg-threejs:autosave:v2';
const V2_MANUAL_KEY = 'rpg-threejs:manual:v2';
const LEGACY_AUTO_KEY = 'rpg-threejs:autosave:v1';
const LEGACY_MANUAL_KEY = 'rpg-threejs:manual:v1';

export function createInitialState(): GameState {
  return {
    version: 4,
    currentNodeId: 'camp',
    visitedNodeIds: ['camp'],
    stepCounter: 0,
    resolvedNodeIds: [],
    combatCooldowns: {},
    mysteryAssignments: {},
    seenUniqueEvents: [],
    flags: {},
    gold: 250,
    reputation: 50,
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
          strength_ring: 1, life_belt: 1, agility_boots: 1,
          steel_sword: 1, long_bow: 1, mystic_staff: 1,
        },
      },
    },
    settings: { reducedGraphics: false },
    endingId: null,
  };
}

export function migrateState(value: unknown): GameState {
  const current = gameStateSchema.safeParse(value);
  if (current.success) return current.data;
  const v3 = gameStateV3Schema.safeParse(value);
  if (v3.success) return migrateV3(v3.data);
  const v2 = gameStateV2Schema.safeParse(value);
  if (v2.success) return migrateV2(v2.data);
  const legacy = gameStateV1Schema.parse(value);
  return migrateV1(legacy);
}

function migrateV3(previous: GameStateV3): GameState {
  return gameStateSchema.parse({
    ...previous,
    version: 4,
    visitedNodeIds: [...new Set([...previous.resolvedNodeIds, previous.currentNodeId])],
  });
}

function migrateV2(previous: GameStateV2): GameState {
  const next = createInitialState();
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
          weaponIds: [unit.equipment.weaponId, ...defaults.filter((id) => id !== unit.equipment.weaponId)].slice(0, defaults.length),
          accessoryIds: unit.equipment.accessoryIds,
        },
      };
    }),
  };
  return gameStateSchema.parse(next);
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

export class SaveRepository {
  loadAuto(): GameState | null {
    return this.load(AUTO_KEY) ?? this.load(V3_AUTO_KEY) ?? this.load(V2_AUTO_KEY) ?? this.load(LEGACY_AUTO_KEY);
  }

  loadManual(): GameState | null {
    return this.load(MANUAL_KEY) ?? this.load(V3_MANUAL_KEY) ?? this.load(V2_MANUAL_KEY) ?? this.load(LEGACY_MANUAL_KEY);
  }

  saveAuto(state: GameState): void {
    localStorage.setItem(AUTO_KEY, JSON.stringify(gameStateSchema.parse(state)));
  }

  saveManual(state: GameState): void {
    localStorage.setItem(MANUAL_KEY, JSON.stringify(gameStateSchema.parse(state)));
  }

  hasSave(): boolean {
    return [AUTO_KEY, MANUAL_KEY, V3_AUTO_KEY, V3_MANUAL_KEY, V2_AUTO_KEY, V2_MANUAL_KEY, LEGACY_AUTO_KEY, LEGACY_MANUAL_KEY]
      .some((key) => localStorage.getItem(key) !== null);
  }

  clear(): void {
    for (const key of [AUTO_KEY, MANUAL_KEY, V3_AUTO_KEY, V3_MANUAL_KEY, V2_AUTO_KEY, V2_MANUAL_KEY, LEGACY_AUTO_KEY, LEGACY_MANUAL_KEY]) {
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
