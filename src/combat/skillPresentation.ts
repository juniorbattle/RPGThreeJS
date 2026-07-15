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
  'generic_hit', 'sword_slash', 'blunt_impact', 'arrow_shot', 'dark_bolt',
  'bless_aura', 'curse_pulse', 'poison_bite', 'guard_barrier', 'boss_slam',
  'critical_hit', 'kill_spark',
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
}

const presentation = (
  motionPreset: SkillMotionPreset,
  vfxPreset: SkillVfxPreset,
  castStyle: SkillCastStyle,
  impactTiming: SkillImpactTiming,
  ultimate?: true,
  impactCount?: number,
): SkillPresentation => ({ motionPreset, vfxPreset, castStyle, impactTiming, ...(ultimate ? { ultimate } : {}), ...(impactCount ? { impactCount } : {}) });

export const SKILL_PRESENTATION: Readonly<Record<HeroSkillId, SkillPresentation>> = Object.freeze({
  w_break_guard: presentation('melee_light', 'sword_slash', 'strike', 'impact'),
  w_charge: presentation('melee_heavy', 'blunt_impact', 'dashImpact', 'impact'),
  w_whirl: presentation('self_aoe', 'sword_slash', 'areaCast', 'landing'),
  w_lion_surge: presentation('melee_heavy', 'boss_slam', 'ultimateCast', 'impact', true),

  p_holy_strike: presentation('melee_light', 'guard_barrier', 'strike', 'impact'),
  p_interpose: presentation('move_leap', 'guard_barrier', 'leapLanding', 'landing'),
  p_oathwall: presentation('buff_cast', 'guard_barrier', 'supportCast', 'release'),
  p_radiant_judgement: presentation('magic_cast', 'boss_quake', 'ultimateCast', 'impact', true),

  d_cursed_blade: presentation('melee_light', 'curse_pulse', 'strike', 'impact'),
  d_void_step: presentation('teleport', 'dark_bolt', 'teleport', 'landing'),
  d_blood_pact: presentation('buff_cast', 'bless_aura', 'supportCast', 'release'),
  d_devouring_eclipse: presentation('magic_cast', 'boss_quake', 'ultimateCast', 'impact', true),

  l_long_thrust: presentation('melee_light', 'sword_slash', 'strike', 'impact'),
  l_haft_recoil: presentation('melee_light', 'sword_slash', 'retreat', 'impact'),
  l_griffon_jump: presentation('move_leap', 'blunt_impact', 'leapLanding', 'landing'),
  l_firmament_lance: presentation('melee_heavy', 'boss_slam', 'ultimateCast', 'impact', true),

  n_dark_bolt: presentation('magic_cast', 'dark_bolt', 'rangedShot', 'release'),
  n_teleport: presentation('teleport', 'dark_bolt', 'teleport', 'landing'),
  n_flame_wave: presentation('magic_cast', 'fireball', 'areaCast', 'release'),
  n_dark_meteor: presentation('magic_cast', 'boss_quake', 'ultimateCast', 'impact', true),

  w_salvation: presentation('heal_cast', 'heal_burst', 'supportCast', 'release'),
  w_purify: presentation('heal_cast', 'heal_burst', 'supportCast', 'release'),
  w_sanctuary: presentation('buff_cast', 'bless_aura', 'areaCast', 'release'),
  w_miracle: presentation('heal_cast', 'heal_burst', 'ultimateCast', 'release', true),

  r_arcane_blade: presentation('melee_light', 'sword_slash', 'strike', 'impact'),
  r_rune_step: presentation('teleport', 'dark_bolt', 'teleport', 'landing'),
  r_scarlet_circle: presentation('magic_cast', 'fireball', 'areaCast', 'release'),
  r_perfect_duality: presentation('magic_cast', 'boss_quake', 'ultimateCast', 'impact', true),

  e_vigor_rune: presentation('buff_cast', 'bless_aura', 'supportCast', 'release'),
  e_transpose: presentation('teleport', 'dark_bolt', 'swap', 'landing'),
  e_binding_seal: presentation('debuff_cast', 'curse_pulse', 'areaCast', 'release'),
  e_absolute_harmony: presentation('buff_cast', 'bless_aura', 'ultimateCast', 'release', true),

  a_precise_shot: presentation('ranged_attack', 'arrow_shot', 'rangedShot', 'release'),
  a_hawk_leap: presentation('move_leap', 'bless_aura', 'leapLanding', 'landing'),
  a_arrow_rain: presentation('ranged_attack', 'arrow_shot', 'areaCast', 'release'),
  a_zenith_arrow: presentation('ranged_attack', 'critical_hit', 'ultimateCast', 'impact', true),

  ni_venom_blade: presentation('melee_light', 'poison_bite', 'strike', 'impact'),
  ni_shadow_step: presentation('melee_heavy', 'critical_hit', 'dashImpact', 'impact'),
  ni_smoke_bomb: presentation('debuff_cast', 'curse_pulse', 'areaCast', 'release'),
  ni_silent_assassin: presentation('melee_heavy', 'critical_hit', 'ultimateCast', 'impact', true),

  ro_sneak_attack: presentation('melee_light', 'sword_slash', 'strike', 'impact'),
  ro_tumble: presentation('move_leap', 'sword_slash', 'leapLanding', 'landing'),
  ro_jaw_trap: presentation('melee_heavy', 'blunt_impact', 'strike', 'impact'),
  ro_fault_breaker: presentation('melee_heavy', 'critical_hit', 'ultimateCast', 'impact', true),

  ar_calibrated_shot: presentation('ranged_attack', 'arrow_shot', 'rangedShot', 'release'),
  ar_explosive_retreat: presentation('move_leap', 'blunt_impact', 'retreat', 'impact'),
  ar_incendiary_grenade: presentation('ranged_attack', 'fireball', 'areaCast', 'release'),
  ar_artillery_barrage: presentation('ranged_attack', 'boss_quake', 'ultimateCast', 'impact', true, 3),
});

export function getSkillPresentation(spec?: { key?: string }): SkillPresentation | undefined {
  return spec?.key ? SKILL_PRESENTATION[spec.key as HeroSkillId] : undefined;
}
