import { VFX_PRESETS, VFX_PRESET_IDS, getVfxPreset } from './VfxPresets';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS, getSkillPresentation } from '../skillPresentation';

export type ActionVfxKind = 'basicAttack' | 'heroSkill' | 'enemySkill' | 'bossSkill' | 'item' | 'feedback' | 'fallback';

export interface SpriteUpgradeCandidate {
  needsDedicatedSpriteUpgrade: true;
  upgradeReason: string;
  suggestedSpriteId: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActionVfxAuditRow {
  actionId: string;
  actionKind: ActionVfxKind;
  presetId: string;
  spriteSheetIds: string[];
  runtimeFilenames: string[];
  strictSpritesheetCompliant: boolean;
  upgrade?: SpriteUpgradeCandidate;
  note?: string;
}

const UPGRADE_CANDIDATES: Record<string, SpriteUpgradeCandidate> = {
  ultimate_radiant_judgement: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses holy_aura generic support sprite for a sacred ultimate',
    suggestedSpriteId: 'judgement_beam',
    priority: 'high',
  },
  ultimate_zenith_arrow: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses projectile_shot basic arrow sprite for a piercing ultimate',
    suggestedSpriteId: 'zenith_arrow',
    priority: 'high',
  },
  ultimate_fault_breaker: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses slash_arc generic melee sprite for a shatter ultimate',
    suggestedSpriteId: 'fault_breaker',
    priority: 'high',
  },
  ultimate_lion_surge: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses slash_arc generic melee sprite for a golden ultimate',
    suggestedSpriteId: 'lion_surge',
    priority: 'medium',
  },
  ultimate_miracle: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses holy_aura generic support sprite for a miracle ultimate',
    suggestedSpriteId: 'miracle_burst',
    priority: 'medium',
  },
  ultimate_absolute_harmony: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses holy_aura generic support sprite for a harmony ultimate',
    suggestedSpriteId: 'harmony_aura',
    priority: 'medium',
  },
  boss_inferno: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses explosion_large generic sprite for a boss signature inferno',
    suggestedSpriteId: 'inferno_field',
    priority: 'medium',
  },
  critical_hit: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses slash_arc generic melee sprite for critical hit feedback',
    suggestedSpriteId: 'critical_impact',
    priority: 'low',
  },
  poison_bite: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses slash_arc generic melee sprite for poison creature attack',
    suggestedSpriteId: 'poison_bite',
    priority: 'low',
  },
  kill_spark: {
    needsDedicatedSpriteUpgrade: true,
    upgradeReason: 'Reuses small_impact generic sprite for knockout reward',
    suggestedSpriteId: 'victory_spark',
    priority: 'low',
  },
};

const ITEM_VFX_MAPPINGS: Array<{ actionId: string; presetId: string; note: string }> = [
  { actionId: 'item_bomb', presetId: 'impact_explosion_large', note: 'Bomb/grenade item' },
  { actionId: 'item_revive_vial', presetId: 'support_revive_pillar', note: 'Revive item' },
  { actionId: 'item_potion', presetId: 'heal_burst', note: 'Healing item' },
  { actionId: 'item_ether', presetId: 'heal_burst', note: 'AP restore item' },
  { actionId: 'item_antidote', presetId: 'support_holy_aura', note: 'Status cure item' },
];

export interface BasicAttackVfxMapping {
  actionId: string;
  weaponType: string;
  presetId: string;
  spriteSheetId: VfxSpriteSheetId;
}

/**
 * Visual-only mapping for the 12 campaign weapon families. The combat runtime
 * already exposes the selected weapon type on an attack spec, so this table
 * never needs to participate in damage, range, or targeting resolution.
 */
export const BASIC_ATTACK_VFX_MAPPINGS = Object.freeze([
  { actionId: 'basic_greatsword_hit', weaponType: 'greatsword', presetId: 'basic_greatsword_hit', spriteSheetId: 'basic_greatsword_cleave_heavy' },
  { actionId: 'basic_holy_mace_hit', weaponType: 'holy_mace', presetId: 'basic_holy_mace_hit', spriteSheetId: 'basic_mace_impact_medium' },
  { actionId: 'basic_scythe_hit', weaponType: 'scythe', presetId: 'basic_scythe_hit', spriteSheetId: 'basic_blade_crescent_medium' },
  { actionId: 'basic_long_spear_hit', weaponType: 'long_spear', presetId: 'basic_long_spear_hit', spriteSheetId: 'basic_spear_stab_medium' },
  { actionId: 'basic_grimoire_hit', weaponType: 'grimoire', presetId: 'basic_grimoire_hit', spriteSheetId: 'basic_bolt_hit_small' },
  { actionId: 'basic_crosier_hit', weaponType: 'crosier', presetId: 'basic_crosier_hit', spriteSheetId: 'basic_staff_strike_small' },
  { actionId: 'basic_rapier_hit', weaponType: 'rapier', presetId: 'basic_rapier_hit', spriteSheetId: 'basic_dagger_crosscut_small' },
  { actionId: 'basic_wand_hit', weaponType: 'wand', presetId: 'basic_wand_hit', spriteSheetId: 'basic_bolt_hit_small' },
  { actionId: 'basic_longbow_hit', weaponType: 'longbow', presetId: 'basic_longbow_hit', spriteSheetId: 'basic_arrow_hit_small' },
  { actionId: 'basic_shuriken_hit', weaponType: 'shuriken', presetId: 'basic_shuriken_hit', spriteSheetId: 'basic_shuriken_cut_small' },
  { actionId: 'basic_dagger_hit', weaponType: 'dagger', presetId: 'basic_dagger_hit', spriteSheetId: 'basic_dagger_crosscut_small' },
  { actionId: 'basic_hand_cannon_hit', weaponType: 'hand_cannon', presetId: 'basic_hand_cannon_hit', spriteSheetId: 'basic_bullet_hit_medium' },
] as const satisfies readonly BasicAttackVfxMapping[]);

const FEEDBACK_PRESET_IDS = ['generic_hit', 'critical_hit', 'kill_spark'] as const;

function normalizeWeaponType(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

/**
 * Resolves only the visual preset for the selected basic attack. Returning
 * undefined intentionally preserves the established generic presentation for
 * legacy or unknown weapon types.
 */
export function getBasicAttackVfxPreset(
  spec: { key?: unknown; wi?: unknown; weaponType?: unknown },
  unit?: {
    weapons?: readonly { weaponType?: unknown; type?: unknown }[];
  } | null,
): string | undefined {
  if (spec.key !== 'attack') return undefined;

  const weaponIndex = typeof spec.wi === 'number' ? spec.wi : 0;
  const weapon = unit?.weapons?.[weaponIndex] ?? unit?.weapons?.[0];
  const weaponType = normalizeWeaponType(weapon?.weaponType ?? weapon?.type ?? spec.weaponType);
  return BASIC_ATTACK_VFX_MAPPINGS.find((mapping) => mapping.weaponType === weaponType)?.presetId;
}

function getPresetSpriteSheetIds(presetId: string): string[] {
  const preset = getVfxPreset(presetId);
  if (!preset) return [];
  return preset.steps
    .filter((s) => s.type === 'spriteSheet' && s.spriteSheet)
    .map((s) => s.spriteSheet as string);
}

function getRuntimeFilenames(spriteSheetIds: string[]): string[] {
  return spriteSheetIds.map((id) => {
    const def = VFX_SPRITE_SHEETS[id as VfxSpriteSheetId];
    return def ? def.url.split('/').pop() ?? '' : '';
  });
}

function isStrictSpritesheetCompliant(presetId: string): boolean {
  const preset = getVfxPreset(presetId);
  if (!preset) return false;
  return preset.steps.some((s) => s.type === 'spriteSheet');
}

function buildAuditRow(actionId: string, actionKind: ActionVfxKind, presetId: string, note?: string): ActionVfxAuditRow {
  const spriteSheetIds = getPresetSpriteSheetIds(presetId);
  return {
    actionId,
    actionKind,
    presetId,
    spriteSheetIds,
    runtimeFilenames: getRuntimeFilenames(spriteSheetIds),
    strictSpritesheetCompliant: isStrictSpritesheetCompliant(presetId),
    ...(UPGRADE_CANDIDATES[presetId] ? { upgrade: UPGRADE_CANDIDATES[presetId] } : {}),
    ...(note ? { note } : {}),
  };
}

export function getActionVfxAuditRows(): ActionVfxAuditRow[] {
  const rows: ActionVfxAuditRow[] = [];

  for (const mapping of BASIC_ATTACK_VFX_MAPPINGS) {
    rows.push(buildAuditRow(
      mapping.actionId,
      'basicAttack',
      mapping.presetId,
      'Basic weapon: ' + mapping.weaponType,
    ));
  }

  for (const skillId of HERO_SKILL_IDS) {
    const presentation = getSkillPresentation({ key: skillId });
    if (presentation) {
      rows.push(buildAuditRow(skillId, 'heroSkill', presentation.vfxPreset));
    }
  }

  for (const skillId of ENEMY_SKILL_IDS) {
    const presentation = getSkillPresentation({ key: skillId });
    if (presentation) {
      const kind: ActionVfxKind = skillId.startsWith('boss_') ? 'bossSkill' : 'enemySkill';
      rows.push(buildAuditRow(skillId, kind, presentation.vfxPreset));
    }
  }

  for (const item of ITEM_VFX_MAPPINGS) {
    rows.push(buildAuditRow(item.actionId, 'item', item.presetId, item.note));
  }

  for (const presetId of FEEDBACK_PRESET_IDS) {
    rows.push(buildAuditRow(presetId, 'feedback', presetId, 'Feedback/fallback preset'));
  }

  return rows;
}

export function getActionVfxChain(actionId: string): ActionVfxAuditRow | undefined {
  return getActionVfxAuditRows().find((row) => row.actionId === actionId);
}

export function getActionsUsingSpriteSheet(spriteSheetId: string): string[] {
  return getActionVfxAuditRows()
    .filter((row) => row.spriteSheetIds.includes(spriteSheetId))
    .map((row) => row.actionId);
}

export function getMissingOrUpgradeCandidateSprites(): ActionVfxAuditRow[] {
  return getActionVfxAuditRows().filter((row) => row.upgrade !== undefined);
}

export { VFX_PRESETS, VFX_PRESET_IDS, getVfxPreset };
