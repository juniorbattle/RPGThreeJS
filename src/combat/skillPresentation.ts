import type { VfxOrientation, VfxScaleTier } from './vfx/VfxTypes';

/**
 * Presentation only.  Combat rules remain in the skill catalogue/runtime;
 * this map gives every hero skill an explicit motion and VFX identity.
 */
export const HERO_SKILL_IDS = [
  'w_break_guard', 'w_charge', 'w_whirl', 'w_lion_surge',
  'p_holy_strike', 'p_interpose', 'p_oathwall', 'p_radiant_judgement',
  'd_cursed_blade', 'd_void_step', 'd_blood_pact', 'd_devouring_eclipse',
  'l_long_thrust', 'l_haft_recoil', 'l_griffon_jump', 'l_firmament_lance',
  'n_dark_bolt', 'n_teleport', 'n_flame_wave', 'n_dark_meteor',
  'w_salvation', 'w_purify', 'w_sanctuary', 'w_miracle',
  'r_arcane_blade', 'r_rune_step', 'r_scarlet_circle', 'r_perfect_duality',
  'e_vigor_rune', 'e_transpose', 'e_binding_seal', 'e_absolute_harmony',
  'a_precise_shot', 'a_hawk_leap', 'a_arrow_rain', 'a_zenith_arrow',
  'ni_venom_blade', 'ni_shadow_step', 'ni_smoke_bomb', 'ni_silent_assassin',
  'ro_sneak_attack', 'ro_tumble', 'ro_jaw_trap', 'ro_fault_breaker',
  'ar_calibrated_shot', 'ar_explosive_retreat', 'ar_incendiary_grenade', 'ar_artillery_barrage',
] as const;

export type HeroSkillId = (typeof HERO_SKILL_IDS)[number];

export const SKILL_MOTION_PRESET_IDS = [
  'melee_light', 'melee_heavy', 'ranged_attack', 'magic_cast', 'heal_cast',
  'buff_cast', 'debuff_cast', 'self_aoe', 'move_leap', 'teleport',
] as const;
export type SkillMotionPreset = (typeof SKILL_MOTION_PRESET_IDS)[number];

export const SKILL_VFX_PRESET_IDS = [
  'melee_light', 'melee_heavy', 'fireball', 'heal_burst', 'boss_quake',
  'generic_hit', 'sword_slash', 'blunt_impact', 'arrow_shot', 'dark_bolt', 'shadow_lightning_bolt', 'root_vines', 'frost_bind',
  'thrust_line', 'teleport_burst', 'holy_strike', 'leap_impact', 'caster_roar', 'arrow_rain',
  'bless_aura', 'curse_pulse', 'poison_bite', 'guard_barrier', 'boss_slam',
  'critical_hit', 'kill_spark', 'status_burn_mark', 'status_silence_seal',
  'status_curse_mark', 'status_weak_mark',
  'support_regen_aura', 'support_revive_pillar', 'support_holy_aura', 'support_bless_field',
  'support_boost_aura', 'move_smoke_burst', 'impact_mace',
  'shape_line_blast', 'shape_cone_blast', 'impact_dark_explosion', 'impact_explosion_large',
  'ultimate_judgement_beam', 'ultimate_holy_explosion', 'ultimate_eclipse_devour',
  'ultimate_drain_field', 'ultimate_zenith_arrow_v2', 'ultimate_fault_breaker_v2',
  'boss_apocalypse_v2',
  'ultimate_lion_surge', 'ultimate_radiant_judgement', 'ultimate_devouring_eclipse',
  'ultimate_firmament_lance', 'ultimate_dark_meteor', 'ultimate_miracle',
  'ultimate_perfect_duality', 'ultimate_absolute_harmony', 'ultimate_zenith_arrow',
  'ultimate_silent_assassin', 'ultimate_fault_breaker', 'ultimate_artillery_barrage',
  'enemy_dragon_breath', 'boss_apocalypse', 'boss_execution', 'boss_flurry',
  'boss_inferno', 'boss_titan_slam',
] as const;
export type SkillVfxPreset = (typeof SKILL_VFX_PRESET_IDS)[number];

export type SkillCastStyle =
  | 'strike' | 'dashImpact' | 'supportCast' | 'ultimateCast'
  | 'leapLanding' | 'teleport' | 'rangedShot' | 'areaCast' | 'retreat' | 'swap';
export type SkillImpactTiming = 'release' | 'impact' | 'landing';

export interface SkillPresentation {
  motionPreset: SkillMotionPreset;
  vfxPreset: SkillVfxPreset;
  castStyle: SkillCastStyle;
  impactTiming: SkillImpactTiming;
  /** The 5 AP hero action gets a controlled premium punctuation, not more damage. */
  ultimate?: true;
  /** Visual repetitions only; gameplay damage is still resolved once. */
  impactCount?: number;
  /** Presentation hierarchy only. It never changes AP, damage or targeting. */
  visualTier?: 5 | 6;
  /** Direction and placement for the renderer only. */
  orientation?: VfxOrientation;
  /** Size hierarchy for the renderer only. */
  scaleTier?: VfxScaleTier;
  /** Optional fine adjustment for compact support effects. */
  visualScale?: number;
}

const presentation = (
  motionPreset: SkillMotionPreset,
  vfxPreset: SkillVfxPreset,
  castStyle: SkillCastStyle,
  impactTiming: SkillImpactTiming,
  ultimate?: true,
  impactCount?: number,
  visual?: Pick<SkillPresentation, 'orientation' | 'scaleTier' | 'visualScale'>,
): SkillPresentation => ({
  motionPreset,
  vfxPreset,
  castStyle,
  impactTiming,
  ...(ultimate ? { ultimate, visualTier: 5 as const } : {}),
  ...(impactCount ? { impactCount } : {}),
  ...visual,
});

const bossSignature = (
  motionPreset: SkillMotionPreset,
  vfxPreset: SkillVfxPreset,
  castStyle: SkillCastStyle,
  impactTiming: SkillImpactTiming,
  visual?: Pick<SkillPresentation, 'orientation' | 'scaleTier' | 'visualScale'>,
): SkillPresentation => ({
  ...presentation(motionPreset, vfxPreset, castStyle, impactTiming, undefined, undefined, visual),
  visualTier: 6,
  scaleTier: visual?.scaleTier ?? 'boss',
});

export const SKILL_PRESENTATION: Readonly<Record<HeroSkillId, SkillPresentation>> = Object.freeze({
  w_break_guard: presentation('melee_light', 'sword_slash', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  w_charge: presentation('melee_heavy', 'blunt_impact', 'dashImpact', 'impact'),
  w_whirl: presentation('self_aoe', 'sword_slash', 'areaCast', 'landing'),
  w_lion_surge: presentation('melee_heavy', 'ultimate_lion_surge', 'ultimateCast', 'impact', true, undefined, { orientation: 'align_line', scaleTier: '5ap_ultimate' }),

  p_holy_strike: presentation('melee_light', 'holy_strike', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  p_interpose: presentation('move_leap', 'leap_impact', 'leapLanding', 'landing', undefined, undefined, { orientation: 'center_on_target', scaleTier: '3ap' }),
  p_oathwall: presentation('buff_cast', 'guard_barrier', 'supportCast', 'release'),
  p_radiant_judgement: presentation('magic_cast', 'ultimate_radiant_judgement', 'ultimateCast', 'impact', true, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '5ap_ultimate' }),

  d_cursed_blade: presentation('melee_light', 'sword_slash', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  d_void_step: presentation('teleport', 'teleport_burst', 'teleport', 'landing', undefined, undefined, { orientation: 'source_to_destination', scaleTier: '3ap' }),
  d_blood_pact: presentation('buff_cast', 'bless_aura', 'supportCast', 'release'),
  d_devouring_eclipse: presentation('magic_cast', 'ultimate_devouring_eclipse', 'ultimateCast', 'impact', true, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '5ap_ultimate' }),

  l_long_thrust: presentation('melee_light', 'thrust_line', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  l_haft_recoil: presentation('melee_light', 'thrust_line', 'retreat', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '3ap' }),
  l_griffon_jump: presentation('move_leap', 'leap_impact', 'leapLanding', 'landing', undefined, undefined, { orientation: 'center_on_target', scaleTier: '4ap' }),
  l_firmament_lance: presentation('melee_heavy', 'ultimate_firmament_lance', 'ultimateCast', 'impact', true, undefined, { orientation: 'source_to_target', scaleTier: '5ap_ultimate' }),

  n_dark_bolt: presentation('magic_cast', 'shadow_lightning_bolt', 'rangedShot', 'release', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  n_teleport: presentation('teleport', 'teleport_burst', 'teleport', 'landing', undefined, undefined, { orientation: 'source_to_destination', scaleTier: '3ap' }),
  n_flame_wave: presentation('magic_cast', 'shape_cone_blast', 'areaCast', 'release', undefined, undefined, { orientation: 'align_cone', scaleTier: '4ap' }),
  n_dark_meteor: presentation('magic_cast', 'ultimate_dark_meteor', 'ultimateCast', 'impact', true),

  w_salvation: presentation('heal_cast', 'heal_burst', 'supportCast', 'release'),
  w_purify: presentation('heal_cast', 'support_holy_aura', 'supportCast', 'release', undefined, undefined, { orientation: 'center_on_target', scaleTier: '3ap', visualScale: 0.78 }),
  w_sanctuary: presentation('buff_cast', 'support_holy_aura', 'areaCast', 'release'),
  w_miracle: presentation('heal_cast', 'ultimate_miracle', 'ultimateCast', 'release', true, undefined, { orientation: 'center_on_target', scaleTier: '5ap_ultimate' }),

  r_arcane_blade: presentation('melee_light', 'sword_slash', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  r_rune_step: presentation('teleport', 'teleport_burst', 'teleport', 'landing', undefined, undefined, { orientation: 'source_to_destination', scaleTier: '3ap' }),
  r_scarlet_circle: presentation('magic_cast', 'impact_explosion_large', 'areaCast', 'release', undefined, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '4ap' }),
  r_perfect_duality: presentation('magic_cast', 'ultimate_perfect_duality', 'ultimateCast', 'impact', true),

  e_vigor_rune: presentation('buff_cast', 'support_boost_aura', 'supportCast', 'release'),
  e_transpose: presentation('teleport', 'teleport_burst', 'swap', 'landing', undefined, undefined, { orientation: 'source_to_destination', scaleTier: '3ap' }),
  e_binding_seal: presentation('debuff_cast', 'root_vines', 'areaCast', 'release', undefined, undefined, { orientation: 'center_on_target', scaleTier: '4ap' }),
  e_absolute_harmony: presentation('buff_cast', 'ultimate_absolute_harmony', 'ultimateCast', 'release', true),

  a_precise_shot: presentation('ranged_attack', 'arrow_shot', 'rangedShot', 'release', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  a_hawk_leap: presentation('move_leap', 'leap_impact', 'leapLanding', 'landing', undefined, undefined, { orientation: 'center_on_target', scaleTier: '3ap' }),
  a_arrow_rain: presentation('ranged_attack', 'arrow_rain', 'areaCast', 'release', undefined, undefined, { orientation: 'source_to_target', scaleTier: '4ap' }),
  a_zenith_arrow: presentation('ranged_attack', 'ultimate_zenith_arrow', 'ultimateCast', 'impact', true, undefined, { orientation: 'source_to_target', scaleTier: '5ap_ultimate' }),

  ni_venom_blade: presentation('melee_light', 'sword_slash', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  ni_shadow_step: presentation('melee_heavy', 'critical_hit', 'dashImpact', 'impact'),
  ni_smoke_bomb: presentation('debuff_cast', 'move_smoke_burst', 'areaCast', 'release'),
  ni_silent_assassin: presentation('melee_heavy', 'ultimate_silent_assassin', 'ultimateCast', 'impact', true),

  ro_sneak_attack: presentation('melee_light', 'sword_slash', 'strike', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  ro_tumble: presentation('move_leap', 'leap_impact', 'leapLanding', 'landing', undefined, undefined, { orientation: 'source_to_destination', scaleTier: '3ap' }),
  ro_jaw_trap: presentation('melee_heavy', 'root_vines', 'strike', 'impact', undefined, undefined, { orientation: 'center_on_target', scaleTier: '4ap' }),
  ro_fault_breaker: presentation('melee_heavy', 'ultimate_fault_breaker', 'ultimateCast', 'impact', true, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '5ap_ultimate' }),

  ar_calibrated_shot: presentation('ranged_attack', 'arrow_shot', 'rangedShot', 'release', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  ar_explosive_retreat: presentation('move_leap', 'impact_explosion_large', 'retreat', 'impact', undefined, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '3ap' }),
  ar_incendiary_grenade: presentation('ranged_attack', 'impact_explosion_large', 'areaCast', 'release', undefined, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '4ap' }),
  ar_artillery_barrage: presentation('ranged_attack', 'ultimate_artillery_barrage', 'ultimateCast', 'impact', true, 3),
});

export const ENEMY_SKILL_IDS = [
  'enemy_heavy_strike', 'enemy_crush', 'enemy_dark_bolt', 'enemy_hex',
  'enemy_venom_strike', 'enemy_binding_shot', 'enemy_smoke_veil', 'enemy_taunt',
  'enemy_battle_cry', 'enemy_dragon_breath',
  'boss_slam', 'boss_roar', 'boss_quake', 'boss_guard', 'boss_apocalypse',
  'boss_regen', 'boss_fortify', 'boss_freeze', 'boss_pin', 'boss_execution',
  'boss_flurry', 'boss_inferno', 'boss_titan_slam',
] as const;

export type EnemySkillId = (typeof ENEMY_SKILL_IDS)[number];

export const ENEMY_SKILL_PRESENTATION: Readonly<Record<EnemySkillId, SkillPresentation>> = Object.freeze({
  enemy_heavy_strike: presentation('melee_heavy', 'blunt_impact', 'strike', 'impact'),
  enemy_crush: presentation('self_aoe', 'blunt_impact', 'areaCast', 'landing'),
  enemy_dark_bolt: presentation('magic_cast', 'shadow_lightning_bolt', 'rangedShot', 'release', undefined, undefined, { orientation: 'source_to_target', scaleTier: '2ap' }),
  enemy_hex: presentation('debuff_cast', 'status_curse_mark', 'rangedShot', 'release'),
  enemy_venom_strike: presentation('melee_light', 'poison_bite', 'strike', 'impact'),
  enemy_binding_shot: presentation('ranged_attack', 'root_vines', 'rangedShot', 'release', undefined, undefined, { orientation: 'center_on_target', scaleTier: '3ap' }),
  enemy_smoke_veil: presentation('debuff_cast', 'move_smoke_burst', 'areaCast', 'release'),
  enemy_taunt: presentation('debuff_cast', 'caster_roar', 'rangedShot', 'release', undefined, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '2ap' }),
  enemy_battle_cry: presentation('debuff_cast', 'caster_roar', 'areaCast', 'release', undefined, undefined, { orientation: 'center_on_aoe_origin', scaleTier: '3ap' }),
  enemy_dragon_breath: presentation('magic_cast', 'enemy_dragon_breath', 'areaCast', 'release', undefined, undefined, { orientation: 'align_cone', scaleTier: 'boss' }),

  boss_slam: bossSignature('melee_heavy', 'boss_slam', 'areaCast', 'impact', { orientation: 'center_on_aoe_origin' }),
  boss_roar: bossSignature('debuff_cast', 'caster_roar', 'areaCast', 'release', { orientation: 'center_on_aoe_origin' }),
  boss_quake: bossSignature('magic_cast', 'boss_quake', 'rangedShot', 'impact'),
  boss_guard: presentation('buff_cast', 'guard_barrier', 'supportCast', 'release', undefined, undefined, { scaleTier: 'boss' }),
  boss_apocalypse: bossSignature('magic_cast', 'boss_apocalypse_v2', 'areaCast', 'impact', { orientation: 'center_on_aoe_origin' }),
  boss_regen: presentation('buff_cast', 'support_regen_aura', 'supportCast', 'release', undefined, undefined, { scaleTier: 'boss' }),
  boss_fortify: presentation('buff_cast', 'bless_aura', 'supportCast', 'release', undefined, undefined, { scaleTier: 'boss' }),
  boss_freeze: presentation('magic_cast', 'frost_bind', 'rangedShot', 'impact', undefined, undefined, { orientation: 'center_on_target', scaleTier: 'boss' }),
  boss_pin: presentation('ranged_attack', 'arrow_shot', 'rangedShot', 'impact', undefined, undefined, { orientation: 'source_to_target', scaleTier: 'boss' }),
  boss_execution: bossSignature('melee_heavy', 'boss_execution', 'strike', 'impact'),
  boss_flurry: bossSignature('melee_heavy', 'boss_flurry', 'strike', 'impact'),
  boss_inferno: bossSignature('magic_cast', 'boss_inferno', 'areaCast', 'impact'),
  boss_titan_slam: bossSignature('melee_heavy', 'boss_titan_slam', 'areaCast', 'impact'),
});

export function getSkillPresentation(spec?: { key?: string }): SkillPresentation | undefined {
  if (!spec?.key) return undefined;
  return SKILL_PRESENTATION[spec.key as HeroSkillId] ?? ENEMY_SKILL_PRESENTATION[spec.key as EnemySkillId];
}
