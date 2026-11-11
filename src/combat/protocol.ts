import { z } from 'zod';
import { SCALED_PLATEAU_IDS, type ScaledPlateauId } from './plateauScaling';
import { combatConfigSchema, unitStatsSchema, type CombatResult } from '../game/types';

export const weaponPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.literal('weapons'),
  price: z.number(),
  icon: z.string(),
  type: z.enum(['greatsword', 'holy_mace', 'scythe', 'long_spear', 'grimoire', 'crosier', 'rapier', 'wand', 'longbow', 'shuriken', 'dagger', 'hand_cannon']),
  damage: z.number(),
  range: z.number(),
  minRange: z.number().optional(),
  accuracyBonus: z.number(),
  critBonus: z.number(),
  healthBonus: z.number().optional(),
  basicAttackStatus: z.object({
    status: z.enum(['burn', 'poison', 'slow', 'root', 'blind', 'weak', 'curse']),
    chance: z.number(),
    turns: z.number(),
  }).optional(),
});

export const combatantPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  className: z.string(),
  kind: z.enum(['knight', 'cleric', 'mage', 'archer', 'rogue']),
  portrait: z.string(),
  stats: unitStatsSchema,
  currentHealth: z.number().int().positive(),
  weapons: z.array(weaponPayloadSchema).min(1).max(2),
  skills: z.array(z.string()),
  skillUpgrades: z.record(z.number().int().min(0).max(2)),
});

export const combatReadyMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-ready'),
});

/** Sent only after the combat iframe has built its scene and dismissed its loader. */
export const combatInitializedMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-initialized'),
});

export const combatInitializeMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-initialize'),
  config: combatConfigSchema,
  clan: z.array(combatantPayloadSchema).min(1).max(12),
  inventory: z.record(z.number().int().nonnegative()),
  preferredUnitIds: z.array(z.string()).max(5),
  reducedGraphics: z.boolean(),
  presentationSessionId: z.string().max(80).optional(),
  devQa: z.boolean().default(false),
  qaFullAp: z.boolean().default(false),
  qaDeployAll: z.boolean().default(false),
  /** Set 1.22.0 (OD-2026-11-11-E): the fight's plateau, named by RunSystem; foes scale by its factor. */
  plateauId: z.enum(SCALED_PLATEAU_IDS as [ScaledPlateauId, ...ScaledPlateauId[]]).optional(),
});
export type CombatInitializeMessage = z.infer<typeof combatInitializeMessageSchema>;

/** The settings menu changed reduced motion during a fight (OD-2026-11-05-B): presentation only. */
export const combatGraphicsMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-graphics'),
  reducedGraphics: z.boolean(),
}).strict();
export type CombatGraphicsMessage = z.infer<typeof combatGraphicsMessageSchema>;

export const combatResultMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-result'),
  victory: z.boolean(),
  combatId: z.string(),
  inventory: z.record(z.number().int().nonnegative()),
  participants: z.array(z.string()),
  unitHealth: z.record(z.number().int().nonnegative()),
  rounds: z.number().int().nonnegative().optional(),
  itemsUsed: z.number().int().nonnegative().optional(),
});

export function toCombatResult(value: unknown): CombatResult | null {
  const parsed = combatResultMessageSchema.safeParse(value);
  if (!parsed.success) return null;
  return {
    victory: parsed.data.victory,
    combatId: parsed.data.combatId,
    consumables: parsed.data.inventory,
    participants: parsed.data.participants,
    unitHealth: parsed.data.unitHealth,
    ...(parsed.data.rounds !== undefined ? { rounds: parsed.data.rounds } : {}),
    ...(parsed.data.itemsUsed !== undefined ? { itemsUsed: parsed.data.itemsUsed } : {}),
  };
}
