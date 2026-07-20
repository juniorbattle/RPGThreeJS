import { z } from 'zod';

export const nodeTypeSchema = z.enum([
  'start', 'story', 'mystery', 'random-combat', 'story-combat',
  'boss', 'treasure', 'shop', 'end',
]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

const countRecordSchema = z.record(z.number().int().nonnegative());

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

const contestOutcomeSchema = z.object({
  next: z.string(),
  effects: z.array(narrativeEffectSchema).default([]),
});
export type ContestOutcome = z.infer<typeof contestOutcomeSchema>;

const contestSchema = z.object({
  kind: z.enum(['lie', 'bluff', 'persuade', 'threaten', 'justify', 'gamble']),
  risk: z.enum(['low', 'moderate', 'high', 'extreme']),
  gainHint: z.enum(['minor', 'moderate', 'important']).optional(),
  truthState: z.enum(['unknown', 'suspected', 'known']),
  hint: z.string().optional(),
  success: contestOutcomeSchema,
  failure: contestOutcomeSchema,
});
export type Contest = z.infer<typeof contestSchema>;

export const dialogueChoiceSchema = z.object({
  text: z.string(),
  next: z.string().nullable(),
  requiresGold: z.number().int().nonnegative().optional(),
  requiresFlag: z.string().optional(),
  excludesFlag: z.string().optional(),
  requiresReputationMin: z.number().int().min(0).max(100).optional(),
  requiresReputationMax: z.number().int().min(0).max(100).optional(),
  blockedText: z.string().optional(),
  effects: z.array(narrativeEffectSchema).default([]),
  contest: contestSchema.optional(),
});
export type DialogueChoice = z.infer<typeof dialogueChoiceSchema>;

export const dialogueExpressionSchema = z.enum([
  'neutral', 'stern', 'wounded', 'fearful', 'grateful', 'hostile', 'mystical',
]);
export type DialogueExpression = z.infer<typeof dialogueExpressionSchema>;

export const dialogueStepSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  tag: z.string().default(''),
  text: z.string(),
  actorId: z.string().optional(),
  expression: dialogueExpressionSchema.default('neutral'),
  portrait: z.string().default(''),
  side: z.enum(['left', 'right', 'center', 'none']).default('center'),
  next: z.string().nullable().optional(),
  effects: z.array(narrativeEffectSchema).default([]),
  choices: z.array(dialogueChoiceSchema).optional(),
});
export type DialogueStep = z.infer<typeof dialogueStepSchema>;

export const dialogueSequenceSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  perspective: z.string().optional(),
  sceneArtId: z.string().optional(),
  backdrop: z.string().optional(),
  steps: z.array(dialogueStepSchema).min(1),
});
export type DialogueSequence = z.infer<typeof dialogueSequenceSchema>;

export const combatConfigSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  objective: z.string(),
  encounterLabel: z.string(),
  encounterRank: z.enum(['normal', 'elite', 'boss']).default('normal'),
  enemyVisualIds: z.array(z.string()).default([]),
  bossVisualId: z.string().optional(),
  escortVisualIds: z.array(z.string()).default([]),
  maxPlayerUnits: z.number().int().min(3).max(5).default(4),
  isBoss: z.boolean().optional(),
  preCombatDialogueId: z.string().optional(),
  postCombatDialogueId: z.string().optional(),
  rewards: z.object({
    gold: z.number().int().nonnegative().default(0),
    reputation: z.number().int().default(0),
    materials: countRecordSchema.default({}),
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
  shopId: z.string().optional(),
});
export type CampaignNode = z.infer<typeof campaignNodeSchema>;

export const unitStatsSchema = z.object({
  maxHealth: z.number().int().positive(),
  strength: z.number().int().nonnegative(),
  magic: z.number().int().nonnegative(),
  endurance: z.number().int().nonnegative(),
  dexterity: z.number().int().nonnegative(),
  charisma: z.number().int().nonnegative(),
  moveRange: z.number().int().positive(),
});
export type UnitStats = z.infer<typeof unitStatsSchema>;

export const equipmentLoadoutSchema = z.object({
  weaponIds: z.array(z.string()).min(1).max(1),
  accessoryIds: z.tuple([z.string().nullable(), z.string().nullable()]),
});
export type EquipmentLoadout = z.infer<typeof equipmentLoadoutSchema>;

export const unitInstanceV5Schema = z.object({
  id: z.string(),
  definitionId: z.string(),
  name: z.string(),
  narrativeLocked: z.boolean(),
  equipment: equipmentLoadoutSchema,
});
export type UnitInstanceV5 = z.infer<typeof unitInstanceV5Schema>;

export const unitInstanceSchema = unitInstanceV5Schema.extend({
  currentHealth: z.number().int().nonnegative(),
  skillUpgrades: z.record(z.number().int().min(0).max(2)),
});
export type UnitInstance = z.infer<typeof unitInstanceSchema>;

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

export const clanStateV5Schema = z.object({
  maxSize: z.number().int().positive(),
  members: z.array(unitInstanceV5Schema).max(12),
});
export type ClanStateV5 = z.infer<typeof clanStateV5Schema>;

export const shopStateSchema = z.object({
  id: z.string(),
  stock: countRecordSchema,
});
export type ShopState = z.infer<typeof shopStateSchema>;

export const deploymentSchema = z.object({
  unitIds: z.array(z.string()).max(5),
});
export type Deployment = z.infer<typeof deploymentSchema>;

export const runNodeTypeSchema = z.enum([
  'combat', 'event', 'mystery', 'recruitment', 'shop', 'refuge', 'story', 'boss',
]);
export type RunNodeType = z.infer<typeof runNodeTypeSchema>;

export const runNodeSchema = z.object({
  id: z.string(),
  type: runNodeTypeSchema,
  depth: z.number().int().nonnegative(),
  links: z.array(z.string()),
  contentId: z.string(),
  label: z.string(),
  icon: z.string(),
  x: z.number(),
  z: z.number(),
  risk: z.number().int().min(0).max(3).optional(),
  reward: z.number().int().min(0).max(4).optional(),
  difficulty: z.enum(['safe', 'standard', 'dangerous', 'decisive']).optional(),
  moralTone: z.enum(['honour', 'pragmatic', 'greed', 'mystery', 'neutral']).optional(),
  hint: z.string().optional(),
});
export type RunNode = z.infer<typeof runNodeSchema>;

export const runGraphSchema = z.object({
  nodes: z.array(runNodeSchema).min(9),
});
export type RunGraph = z.infer<typeof runGraphSchema>;

export const runLootSchema = z.object({
  gold: z.number().int().nonnegative(),
  inventory: inventoryStateSchema,
});
export type RunLoot = z.infer<typeof runLootSchema>;

export const runStateSchema = z.object({
  id: z.string(),
  seed: z.number().int(),
  regionId: z.string(),
  status: z.enum(['active', 'completed', 'failed']),
  currentNodeId: z.string(),
  checkpointNodeId: z.string(),
  revealedNodeIds: z.array(z.string()),
  visitedNodeIds: z.array(z.string()),
  temporaryLoot: runLootSchema,
  graph: runGraphSchema,
});
export type RunState = z.infer<typeof runStateSchema>;

export const reputationHistoryEntrySchema = z.object({
  delta: z.number().int(),
  source: z.string(),
  value: z.number().int().min(0).max(100),
});
export type ReputationHistoryEntry = z.infer<typeof reputationHistoryEntrySchema>;

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

const legacyUnitInstanceSchema = unitInstanceV5Schema.extend({
  level: z.number().int().positive(),
  xp: z.number().int().nonnegative(),
});

const unitInstanceV2Schema = legacyUnitInstanceSchema.extend({
  equipment: z.object({
    weaponId: z.string(),
    accessoryIds: z.union([
      z.tuple([z.string().nullable(), z.string().nullable()]),
      z.tuple([z.string().nullable(), z.string().nullable(), z.string().nullable()]),
    ]),
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
  clan: z.object({
    maxSize: z.number().int().positive(),
    members: z.array(legacyUnitInstanceSchema).max(12),
  }),
});
export type GameStateV3 = z.infer<typeof gameStateV3Schema>;

export const gameStateV4Schema = gameStateV3Schema.extend({
  version: z.literal(4),
  visitedNodeIds: z.array(z.string()),
});
export type GameStateV4 = z.infer<typeof gameStateV4Schema>;

export const gameStateV5Schema = z.object({
  version: z.literal(5),
  currentNodeId: z.string(),
  visitedNodeIds: z.array(z.string()),
  stepCounter: z.number().int().nonnegative(),
  resolvedNodeIds: z.array(z.string()),
  combatCooldowns: z.record(z.number().int().nonnegative()),
  mysteryAssignments: z.record(z.string()),
  seenUniqueEvents: z.array(z.string()),
  flags: z.record(z.boolean()),
  gold: z.number().int(),
  reputation: z.number().int().min(0).max(100),
  reputationHistory: z.array(reputationHistoryEntrySchema),
  inventory: inventoryStateSchema,
  clan: clanStateV5Schema,
  deployment: deploymentSchema,
  shops: z.record(shopStateSchema),
  settings: z.object({ reducedGraphics: z.boolean() }),
  run: runStateSchema,
  endingId: z.string().nullable(),
});
export type GameStateV5 = z.infer<typeof gameStateV5Schema>;

export const gameStateSchema = gameStateV5Schema.extend({
  version: z.literal(6),
  clan: clanStateSchema,
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
  skillModifier?: EquipmentSkillModifier;
  innateGiftModifier?: InnateGiftModifier;
}

export interface InnateGiftModifier {
  targetHeroId?: string;
  label: string;
  description: string;
}

export interface EquipmentSkillModifier {
  grants?: string[];
  replaces?: Record<string, string>;
}

export interface WeaponDefinition extends ItemDefinition {
  category: 'weapons';
  type: 'greatsword' | 'holy_mace' | 'scythe' | 'long_spear' | 'grimoire' | 'crosier' | 'rapier' | 'wand' | 'longbow' | 'shuriken' | 'dagger' | 'hand_cannon';
  tier: number;
  damage: number;
  range: number;
  minRange?: number;
  accuracyBonus: number;
  critBonus: number;
  healthBonus?: number;
}

export interface CraftRecipeDefinition {
  id: string;
  name: string;
  description: string;
  inputs: {
    weapons?: Record<string, number>;
    accessories?: Record<string, number>;
    gold: number;
  };
  output: {
    itemId: string;
    category: 'weapons' | 'accessories';
    quantity: number;
  };
  preview: string;
}

export interface UnitDefinition {
  id: string;
  name: string;
  className: string;
  combatKind: 'knight' | 'cleric' | 'mage' | 'archer' | 'rogue';
  visualProfileId: string;
  recruitTier: 'core' | 'optional' | 'late';
  portrait: string;
  baseStats: UnitStats;
  weaponSlotCount: 1;
  allowedWeaponIds: string[];
  skillIds: string[];
  innateGift: { name: string; description: string };
}

export interface CombatantPayload {
  id: string;
  name: string;
  className: string;
  kind: UnitDefinition['combatKind'];
  portrait: string;
  stats: UnitStats;
  currentHealth: number;
  weapons: WeaponDefinition[];
  skills: string[];
  skillUpgrades: Record<string, number>;
}

export interface CombatResult {
  victory: boolean;
  combatId: string;
  consumables?: Record<string, number>;
  participants: string[];
  unitHealth: Record<string, number>;
}

export interface ReputationRule {
  min: number;
  max: number;
  label: string;
  shopPriceMultiplier: number;
  ambushWeightMultiplier: number;
  eventWeightModifiers: Record<string, number>;
}

export type SkillType = 'phys' | 'mag' | 'heal' | 'buff' | 'debuff' | 'move' | 'revive';
export type SkillShape = 'circle' | 'line' | 'cone';
export type SkillMoveMode = 'teleport' | 'leap' | 'dash' | 'swap' | 'strike' | 'retreat';
export type SkillMovementPhase = 'before' | 'after';
export type SkillTargetMode = 'tile' | 'ally' | 'enemy';
export type SkillEffectTargetSource = 'area' | 'selected';
export type SkillUpgradeStatusTarget = 'self' | 'allies' | 'enemies' | 'selected' | 'casterAndSelected';
export type SkillEffectKind =
  | 'damage' | 'heal' | 'status' | 'buff' | 'revive'
  | 'dispel' | 'lifesteal' | 'hp_cost' | 'trap' | 'ap_restore' | 'move';
export type SkillEffectTarget = 'enemies' | 'allies' | 'self' | 'caster' | 'all' | 'tile';

export interface SkillEffect {
  kind: SkillEffectKind;
  target: SkillEffectTarget;
  damageType?: 'phys' | 'mag';
  power?: number;
  penetration?: number;
  status?: string;
  statusTurns?: number;
  accuracy?: number;
  flatHeal?: number;
  flatDamage?: number;
  hpCostPercent?: number;
  lifestealPercent?: number;
  moveMode?: SkillMoveMode;
  dispelType?: 'positive' | 'negative' | 'all';
  /** Reuse the explicitly selected unit instead of recomputing an area. */
  targetSource?: SkillEffectTargetSource;
  damageMultiplier?: number;
  bonusVsSize?: number;
  bonusVsAfflicted?: number;
}

export interface SkillUpgrade {
  description: string;
  powerBonus?: number;
  statusTurnsBonus?: number;
  radiusBonus?: number;
  rangeBonus?: number;
  accuracyBonus?: number;
  penetrationBonus?: number;
  additionalStatus?: string;
  additionalStatusTurns?: number;
  damageMultiplier?: number;
  bonusVsSize?: number;
  bonusVsAfflicted?: number;
  additionalStatusTarget?: SkillUpgradeStatusTarget;
  healMultiplier?: number;
  revivePercent?: number;
  hpCostReduction?: number;
  lifestealBonus?: number;
  critBonus?: number;
  selfHealPercent?: number;
  minRangeReduction?: number;
  stealBuffs?: boolean;
  dispelAllies?: boolean;
  flatHealBonus?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  ap: number;
  icon: string;
  type: SkillType;
  power?: number;
  range?: [number, number];
  radius?: number;
  shape?: SkillShape;
  mode?: SkillMoveMode;
  dest?: boolean;
  /** Controls whether the selected cell resolves as a free tile, ally or enemy. */
  targetMode?: SkillTargetMode;
  /** Applies a movement component before or after the skill's effects. */
  movePhase?: SkillMovementPhase;
  self?: boolean;
  offensive?: boolean;
  support?: boolean;
  acc?: number;
  status?: string;
  statusTurns?: number;
  impact?: { status: string; statusTurns: number };
  flatDmg?: number;
  flatHeal?: number;
  apRestore?: number;
  cure?: boolean;
  allowSelfDamage?: boolean;
  penetration?: number;
  crit?: number;
  effects?: SkillEffect[];
  additionalStatus?: string;
  additionalStatusTurns?: number;
  damageMultiplier?: number;
  bonusVsSize?: number;
  bonusVsAfflicted?: number;
  upgradeLevel1?: SkillUpgrade;
  upgradeLevel2?: SkillUpgrade;
}
