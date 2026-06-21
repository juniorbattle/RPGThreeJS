import { z } from 'zod';

export const nodeTypeSchema = z.enum([
  'start', 'story', 'mystery', 'random-combat', 'story-combat',
  'boss', 'treasure', 'shop', 'end',
]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

const baseEffectSchema = z.object({ delayMs: z.number().int().nonnegative().optional() });
export const narrativeEffectSchema = z.discriminatedUnion('type', [
  baseEffectSchema.extend({ type: z.literal('setFlag'), key: z.string(), value: z.boolean() }),
  baseEffectSchema.extend({ type: z.literal('addGold'), amount: z.number().int() }),
  baseEffectSchema.extend({ type: z.literal('addReputation'), amount: z.number().int() }),
  baseEffectSchema.extend({ type: z.literal('addItem'), itemId: z.string(), quantity: z.number().int().positive() }),
  baseEffectSchema.extend({ type: z.literal('recruitUnit'), unitId: z.string() }),
  baseEffectSchema.extend({ type: z.literal('startCombat'), combatId: z.string() }),
  baseEffectSchema.extend({ type: z.literal('finishChapter'), endingId: z.string() }),
]);
export type NarrativeEffect = z.infer<typeof narrativeEffectSchema>;

export const dialogueChoiceSchema = z.object({
  text: z.string(),
  next: z.string().nullable(),
  requiresGold: z.number().int().nonnegative().optional(),
  requiresFlag: z.string().optional(),
  effects: z.array(narrativeEffectSchema).default([]),
});
export type DialogueChoice = z.infer<typeof dialogueChoiceSchema>;

export const dialogueStepSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  tag: z.string().default(''),
  text: z.string(),
  portrait: z.string().default(''),
  side: z.enum(['left', 'right', 'center', 'none']).default('center'),
  next: z.string().nullable().optional(),
  effects: z.array(narrativeEffectSchema).default([]),
  choices: z.array(dialogueChoiceSchema).optional(),
});
export type DialogueStep = z.infer<typeof dialogueStepSchema>;

export const dialogueSequenceSchema = z.object({
  id: z.string(),
  backdrop: z.string().optional(),
  steps: z.array(dialogueStepSchema).min(1),
});
export type DialogueSequence = z.infer<typeof dialogueSequenceSchema>;

export const combatConfigSchema = z.object({
  id: z.string(),
  objective: z.string(),
  encounterLabel: z.string(),
  maxPlayerUnits: z.number().int().min(3).max(5).default(4),
  rewards: z.object({
    gold: z.number().int().nonnegative().default(0),
    reputation: z.number().int().default(0),
  }),
});
export type CombatConfig = z.infer<typeof combatConfigSchema>;

export const campaignNodeSchema = z.object({
  id: z.string(),
  type: nodeTypeSchema,
  x: z.number(),
  z: z.number(),
  icon: z.string(),
  label: z.string(),
  links: z.array(z.string()),
  dialogueId: z.string().optional(),
  combatId: z.string().optional(),
  mysteryPoolId: z.string().optional(),
  shopId: z.string().optional(),
});
export type CampaignNode = z.infer<typeof campaignNodeSchema>;

export const mysteryEventSchema = z.object({
  id: z.string(),
  dialogueId: z.string(),
  weight: z.number().positive(),
  unique: z.boolean().default(false),
  requiresFlag: z.string().optional(),
  excludesFlag: z.string().optional(),
});
export type MysteryEvent = z.infer<typeof mysteryEventSchema>;

export const unitStatsSchema = z.object({
  maxHealth: z.number().int().positive(),
  strength: z.number().int().nonnegative(),
  magic: z.number().int().nonnegative(),
  endurance: z.number().int().nonnegative(),
  dexterity: z.number().int().nonnegative(),
  charisma: z.number().int().nonnegative(),
  moveRange: z.number().int().positive(),
  jumpHeight: z.number().int().nonnegative(),
});
export type UnitStats = z.infer<typeof unitStatsSchema>;

export const equipmentLoadoutSchema = z.object({
  weaponIds: z.array(z.string()).min(1).max(2),
  accessoryIds: z.tuple([z.string().nullable(), z.string().nullable()]),
});
export type EquipmentLoadout = z.infer<typeof equipmentLoadoutSchema>;

export const unitInstanceSchema = z.object({
  id: z.string(),
  definitionId: z.string(),
  name: z.string(),
  level: z.number().int().positive(),
  xp: z.number().int().nonnegative(),
  narrativeLocked: z.boolean(),
  equipment: equipmentLoadoutSchema,
});
export type UnitInstance = z.infer<typeof unitInstanceSchema>;

const countRecordSchema = z.record(z.number().int().nonnegative());
export const inventoryStateSchema = z.object({
  consumables: countRecordSchema,
  accessories: countRecordSchema,
  materials: countRecordSchema,
  weapons: countRecordSchema,
});
export type InventoryState = z.infer<typeof inventoryStateSchema>;

export const clanStateSchema = z.object({
  maxSize: z.number().int().positive(),
  members: z.array(unitInstanceSchema).max(12),
});
export type ClanState = z.infer<typeof clanStateSchema>;

export const shopStateSchema = z.object({
  id: z.string(),
  stock: countRecordSchema,
});
export type ShopState = z.infer<typeof shopStateSchema>;

export const deploymentSchema = z.object({
  unitIds: z.array(z.string()).max(5),
});
export type Deployment = z.infer<typeof deploymentSchema>;

export const gameStateV1Schema = z.object({
  version: z.literal(1),
  currentNodeId: z.string(),
  stepCounter: z.number().int().nonnegative(),
  resolvedNodeIds: z.array(z.string()),
  combatCooldowns: z.record(z.number().int().nonnegative()),
  mysteryAssignments: z.record(z.string()),
  seenUniqueEvents: z.array(z.string()),
  flags: z.record(z.boolean()),
  gold: z.number().int(),
  reputation: z.number().int(),
  inventory: countRecordSchema,
  roster: z.array(z.string()),
  endingId: z.string().nullable(),
});
export type GameStateV1 = z.infer<typeof gameStateV1Schema>;

const unitInstanceV2Schema = unitInstanceSchema.extend({
  equipment: z.object({
    weaponId: z.string(),
    accessoryIds: z.tuple([z.string().nullable(), z.string().nullable()]),
  }),
});

export const gameStateV2Schema = z.object({
  version: z.literal(2),
  currentNodeId: z.string(),
  stepCounter: z.number().int().nonnegative(),
  resolvedNodeIds: z.array(z.string()),
  combatCooldowns: z.record(z.number().int().nonnegative()),
  mysteryAssignments: z.record(z.string()),
  seenUniqueEvents: z.array(z.string()),
  flags: z.record(z.boolean()),
  gold: z.number().int(),
  reputation: z.number().int(),
  inventory: inventoryStateSchema,
  clan: z.object({
    maxSize: z.number().int().positive(),
    members: z.array(unitInstanceV2Schema).max(12),
  }),
  deployment: deploymentSchema,
  shops: z.record(shopStateSchema),
  settings: z.object({ reducedGraphics: z.boolean() }),
  endingId: z.string().nullable(),
});
export type GameStateV2 = z.infer<typeof gameStateV2Schema>;

export const gameStateV3Schema = gameStateV2Schema.extend({
  version: z.literal(3),
  clan: clanStateSchema,
});
export type GameStateV3 = z.infer<typeof gameStateV3Schema>;

export const gameStateSchema = gameStateV3Schema.extend({
  version: z.literal(4),
  visitedNodeIds: z.array(z.string()),
});
export type GameState = z.infer<typeof gameStateSchema>;

export type ItemCategory = keyof InventoryState;
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  price: number;
  icon: string;
  modifiers?: Partial<UnitStats>;
}

export interface WeaponDefinition extends ItemDefinition {
  category: 'weapons';
  type: 'sword' | 'dagger' | 'axe' | 'spear' | 'bow' | 'staff' | 'mace';
  damage: number;
  range: number;
  minRange?: number;
  accuracyBonus: number;
  critBonus: number;
}

export interface UnitDefinition {
  id: string;
  name: string;
  className: string;
  combatKind: 'knight' | 'cleric' | 'mage' | 'archer';
  portrait: string;
  baseStats: UnitStats;
  weaponSlotCount: 1 | 2;
  allowedWeaponIds: string[];
  skillIds: string[];
}

export interface CombatantPayload {
  id: string;
  name: string;
  kind: UnitDefinition['combatKind'];
  portrait: string;
  level: number;
  xp: number;
  stats: UnitStats;
  weapons: WeaponDefinition[];
  skills: string[];
}

export interface CombatProgress {
  unitId: string;
  level: number;
  xp: number;
}

export interface CombatResult {
  victory: boolean;
  combatId: string;
  consumables?: Record<string, number>;
  participants: string[];
  progress: CombatProgress[];
}
