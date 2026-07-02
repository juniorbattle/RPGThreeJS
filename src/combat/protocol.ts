import { z } from 'zod';
import { combatConfigSchema, unitStatsSchema, type CombatResult } from '../game/types';

const weaponPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.literal('weapons'),
  price: z.number(),
  icon: z.string(),
  type: z.enum(['sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'mace']),
  damage: z.number(),
  range: z.number(),
  minRange: z.number().optional(),
  accuracyBonus: z.number(),
  critBonus: z.number(),
});

export const combatantPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['knight', 'cleric', 'mage', 'archer']),
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

export const combatInitializeMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-initialize'),
  config: combatConfigSchema,
  clan: z.array(combatantPayloadSchema).min(1).max(12),
  inventory: z.record(z.number().int().nonnegative()),
  preferredUnitIds: z.array(z.string()).max(5),
  reducedGraphics: z.boolean(),
});
export type CombatInitializeMessage = z.infer<typeof combatInitializeMessageSchema>;

export const combatResultMessageSchema = z.object({
  type: z.literal('rpg-threejs:combat-result'),
  victory: z.boolean(),
  combatId: z.string(),
  inventory: z.record(z.number().int().nonnegative()),
  participants: z.array(z.string()),
  unitHealth: z.record(z.number().int().positive()),
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
  };
}
