import * as THREE from 'three';
import type { VfxSpriteSheetId } from './VfxTypes';

export interface VfxSpriteSheetPresentation {
  /** Multiplies the presentation scale without changing the skill's logical targeting. */
  scaleMultiplier: number;
  /** Lets reduced graphics stay legible while the sheet's alpha still controls its fade. */
  opacityMultiplier: number;
  /** Normalized fade-in duration. */
  fadeIn: number;
  /** Normalized point at which the sheet clears rapidly after its peak. */
  fadeOut: number;
  /** Ground sheets retain depth; impact sheets may briefly overlap combatants. */
  layer: 'ground' | 'impact';
  /** Bright sprite sheets use additive light so they read against painted scenes. */
  blending: 'normal' | 'additive';
}

export interface VfxSpriteSheetDefinition {
  id: VfxSpriteSheetId;
  url: string;
  rows: number;
  cols: number;
  frameCount: number;
  frameDurationMs: number;
  align: 'center' | 'bottom';
  presentation: VfxSpriteSheetPresentation;
}

export const VFX_SPRITE_SHEETS = {
  basic_arrow_hit_small: { id: 'basic_arrow_hit_small', url: '/assets/vfx/runtime/white_basic_arrow_hit_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_axe_chop_medium: { id: 'basic_axe_chop_medium', url: '/assets/vfx/runtime/white_basic_axe_chop_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_bite_snap_small: { id: 'basic_bite_snap_small', url: '/assets/vfx/runtime/white_basic_bite_snap_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_blade_crescent_medium: { id: 'basic_blade_crescent_medium', url: '/assets/vfx/runtime/white_basic_blade_crescent_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_body_slam_heavy: { id: 'basic_body_slam_heavy', url: '/assets/vfx/runtime/white_basic_body_slam_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  basic_bolt_hit_small: { id: 'basic_bolt_hit_small', url: '/assets/vfx/runtime/white_basic_bolt_hit_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_bullet_hit_medium: { id: 'basic_bullet_hit_medium', url: '/assets/vfx/runtime/white_basic_bullet_hit_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_claw_rake_small: { id: 'basic_claw_rake_small', url: '/assets/vfx/runtime/white_basic_claw_rake_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_dagger_crosscut_small: { id: 'basic_dagger_crosscut_small', url: '/assets/vfx/runtime/white_basic_dagger_crosscut_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_execution_slash_heavy: { id: 'basic_execution_slash_heavy', url: '/assets/vfx/runtime/white_basic_execution_slash_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  basic_greatsword_cleave_heavy: { id: 'basic_greatsword_cleave_heavy', url: '/assets/vfx/runtime/white_basic_greatsword_cleave_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  basic_hammer_crush_heavy: { id: 'basic_hammer_crush_heavy', url: '/assets/vfx/runtime/white_basic_hammer_crush_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  basic_horn_ram_medium: { id: 'basic_horn_ram_medium', url: '/assets/vfx/runtime/white_basic_horn_ram_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_mace_impact_medium: { id: 'basic_mace_impact_medium', url: '/assets/vfx/runtime/white_basic_mace_impact_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_shield_bash_medium: { id: 'basic_shield_bash_medium', url: '/assets/vfx/runtime/white_basic_shield_bash_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_shuriken_cut_small: { id: 'basic_shuriken_cut_small', url: '/assets/vfx/runtime/white_basic_shuriken_cut_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_spear_stab_medium: { id: 'basic_spear_stab_medium', url: '/assets/vfx/runtime/white_basic_spear_stab_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_staff_strike_small: { id: 'basic_staff_strike_small', url: '/assets/vfx/runtime/white_basic_staff_strike_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_sword_slash_heavy: { id: 'basic_sword_slash_heavy', url: '/assets/vfx/runtime/white_basic_sword_slash_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  basic_sword_slash_small: { id: 'basic_sword_slash_small', url: '/assets/vfx/runtime/white_basic_sword_slash_small_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  basic_tail_whip_medium: { id: 'basic_tail_whip_medium', url: '/assets/vfx/runtime/white_basic_tail_whip_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  basic_titan_crush_heavy: { id: 'basic_titan_crush_heavy', url: '/assets/vfx/runtime/white_basic_titan_crush_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  // R3E-2: semantically approved skill sheets. All are target/beneficiary impacts, never travel effects.
  skill_wind_slash_swirl_medium: { id: 'skill_wind_slash_swirl_medium', url: '/assets/vfx/runtime/cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.62, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  skill_holy_radiance_burst_heavy: { id: 'skill_holy_radiance_burst_heavy', url: '/assets/vfx/runtime/gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.7, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.84, layer: 'impact', blending: 'additive' } },
  skill_barrier_guard_heavy: { id: 'skill_barrier_guard_heavy', url: '/assets/vfx/runtime/blue_skill_barrier_guard_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.48, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_barrier_shield_ring_medium: { id: 'skill_barrier_shield_ring_medium', url: '/assets/vfx/runtime/green_skill_barrier_shield_ring_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 0.96, fadeIn: 0.04, fadeOut: 0.84, layer: 'impact', blending: 'additive' } },
  skill_void_rune_orb_medium: { id: 'skill_void_rune_orb_medium', url: '/assets/vfx/runtime/purple_skill_void_rune_orb_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.44, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  skill_fire_impact_burst_medium: { id: 'skill_fire_impact_burst_medium', url: '/assets/vfx/runtime/orange_skill_fire_impact_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.55, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.76, layer: 'impact', blending: 'additive' } },
  skill_heal_blessing_bloom_heavy: { id: 'skill_heal_blessing_bloom_heavy', url: '/assets/vfx/runtime/whitegreen_skill_heal_blessing_bloom_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.58, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_holy_sigil_burst_medium: { id: 'skill_holy_sigil_burst_medium', url: '/assets/vfx/runtime/gold_skill_holy_sigil_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  skill_support_leaf_burst_medium: { id: 'skill_support_leaf_burst_medium', url: '/assets/vfx/runtime/green_skill_support_leaf_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.84, layer: 'impact', blending: 'additive' } },
  skill_arcane_vortex_nova_heavy: { id: 'skill_arcane_vortex_nova_heavy', url: '/assets/vfx/runtime/purple_skill_arcane_vortex_nova_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.72, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_arcane_orbit_burst_medium: { id: 'skill_arcane_orbit_burst_medium', url: '/assets/vfx/runtime/cyan_skill_arcane_orbit_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  skill_arcane_sigil_burst_medium: { id: 'skill_arcane_sigil_burst_medium', url: '/assets/vfx/runtime/blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.44, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  skill_fire_smoke_explosion_heavy: { id: 'skill_fire_smoke_explosion_heavy', url: '/assets/vfx/runtime/orange_skill_fire_smoke_explosion_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.76, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'normal' } },
  skill_poison_maw_bite_heavy: { id: 'skill_poison_maw_bite_heavy', url: '/assets/vfx/runtime/green_skill_poison_maw_bite_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  skill_ice_pillar_impact_heavy: { id: 'skill_ice_pillar_impact_heavy', url: '/assets/vfx/runtime/iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.74, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_fire_vortex_nova_heavy: { id: 'skill_fire_vortex_nova_heavy', url: '/assets/vfx/runtime/orange_skill_fire_vortex_nova_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.82, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_barrier_nature_guard_medium: { id: 'skill_barrier_nature_guard_medium', url: '/assets/vfx/runtime/green_skill_barrier_nature_guard_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.56, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  // R3E-3: corrected arcane slash burst. Target-centered impact, never travel.
  skill_arcane_slash_burst_medium: { id: 'skill_arcane_slash_burst_medium', url: '/assets/vfx/runtime/purple_skill_arcane_slash_burst_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  // R3E-4: promoted HOLD_SEMANTIC raw sheets for legacy replacement.
  skill_meteor_impact_burst_heavy: { id: 'skill_meteor_impact_burst_heavy', url: '/assets/vfx/runtime/orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_holy_light_pillar_medium: { id: 'skill_holy_light_pillar_medium', url: '/assets/vfx/runtime/blue_skill_holy_light_pillar_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.6, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.9, layer: 'impact', blending: 'additive' } },
  skill_void_singularity_implosion_ultimate: { id: 'skill_void_singularity_implosion_ultimate', url: '/assets/vfx/runtime/purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 2.24, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.88, layer: 'ground', blending: 'additive' } },
  skill_void_spiral_implosion_medium: { id: 'skill_void_spiral_implosion_medium', url: '/assets/vfx/runtime/purple_skill_void_spiral_implosion_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.34, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.75, layer: 'impact', blending: 'additive' } },
  skill_fire_spark_cluster_medium: { id: 'skill_fire_spark_cluster_medium', url: '/assets/vfx/runtime/orange_skill_fire_spark_cluster_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.32, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  skill_starburst_impact_medium: { id: 'skill_starburst_impact_medium', url: '/assets/vfx/runtime/green_skill_starburst_impact_medium_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 0.96, fadeIn: 0.04, fadeOut: 0.74, layer: 'ground', blending: 'additive' } },
} as const satisfies Record<VfxSpriteSheetId, VfxSpriteSheetDefinition>;

export const VFX_SPRITE_SHEET_IDS = Object.freeze(Object.keys(VFX_SPRITE_SHEETS) as VfxSpriteSheetId[]);

/** R3E-1 library validated for runtime use; direct skill sheets remain raw. */
export const BASIC_RUNTIME_SPRITE_SHEET_IDS = Object.freeze([
  'basic_arrow_hit_small', 'basic_axe_chop_medium', 'basic_bite_snap_small', 'basic_blade_crescent_medium',
  'basic_body_slam_heavy', 'basic_bolt_hit_small', 'basic_bullet_hit_medium', 'basic_claw_rake_small',
  'basic_dagger_crosscut_small', 'basic_execution_slash_heavy', 'basic_greatsword_cleave_heavy',
  'basic_hammer_crush_heavy', 'basic_horn_ram_medium', 'basic_mace_impact_medium', 'basic_shield_bash_medium',
  'basic_shuriken_cut_small', 'basic_spear_stab_medium', 'basic_staff_strike_small', 'basic_sword_slash_heavy',
  'basic_sword_slash_small', 'basic_tail_whip_medium', 'basic_titan_crush_heavy',
] as const satisfies readonly VfxSpriteSheetId[]);

/** Ready for later enemy/monster basic-attack mappings, intentionally not dispatched in R3E-1. */
export const BASIC_LIBRARY_ONLY_SPRITE_SHEET_IDS = Object.freeze([
  'basic_axe_chop_medium', 'basic_bite_snap_small', 'basic_claw_rake_small',
  'basic_horn_ram_medium', 'basic_shield_bash_medium',
  'basic_sword_slash_small', 'basic_tail_whip_medium',
] as const satisfies readonly VfxSpriteSheetId[]);

/** R3E-2 subset: only semantically approved skill sheets are present at runtime. */
export const R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS = Object.freeze([
  'skill_wind_slash_swirl_medium', 'skill_holy_radiance_burst_heavy', 'skill_barrier_guard_heavy',
  'skill_barrier_shield_ring_medium', 'skill_void_rune_orb_medium', 'skill_fire_impact_burst_medium',
  'skill_heal_blessing_bloom_heavy', 'skill_holy_sigil_burst_medium', 'skill_support_leaf_burst_medium',
  'skill_arcane_vortex_nova_heavy', 'skill_arcane_orbit_burst_medium', 'skill_arcane_sigil_burst_medium',
  'skill_fire_smoke_explosion_heavy', 'skill_poison_maw_bite_heavy', 'skill_ice_pillar_impact_heavy',
  'skill_fire_vortex_nova_heavy', 'skill_barrier_nature_guard_medium',
] as const satisfies readonly VfxSpriteSheetId[]);

/** R3E-3: corrected arcane slash burst sheet promoted to runtime. */
export const R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS = Object.freeze([
  'skill_arcane_slash_burst_medium',
] as const satisfies readonly VfxSpriteSheetId[]);

/** R3E-4: promoted HOLD_SEMANTIC raw sheets for legacy replacement. */
export const R3E4_PROMOTED_SPRITE_SHEET_IDS = Object.freeze([
  'skill_meteor_impact_burst_heavy',
  'skill_holy_light_pillar_medium',
  'skill_void_singularity_implosion_ultimate',
  'skill_void_spiral_implosion_medium',
  'skill_fire_spark_cluster_medium',
  'skill_starburst_impact_medium',
] as const satisfies readonly VfxSpriteSheetId[]);

/** All promoted skill sheets across R3E-2 + R3E-3 + R3E-4. */
export const SKILL_RUNTIME_SPRITE_SHEET_IDS = Object.freeze([
  ...R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  ...R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  ...R3E4_PROMOTED_SPRITE_SHEET_IDS,
] as const satisfies readonly VfxSpriteSheetId[]);

const loader = new THREE.TextureLoader();
const texturePromises = new Map<VfxSpriteSheetId, Promise<THREE.Texture>>();

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

export async function loadVfxSpriteSheetTexture(id: VfxSpriteSheetId) {
  let pending = texturePromises.get(id);
  if (!pending) {
    const definition = VFX_SPRITE_SHEETS[id];
    pending = loader.loadAsync(definition.url).then(configureTexture).catch((error) => {
      texturePromises.delete(id);
      throw error;
    });
    texturePromises.set(id, pending);
  }
  const baseTexture = await pending;
  return configureTexture(baseTexture.clone());
}

export function setVfxSpriteSheetFrame(
  texture: THREE.Texture,
  definition: VfxSpriteSheetDefinition,
  frameIndex: number,
) {
  const safeFrame = Math.max(0, Math.min(definition.frameCount - 1, Math.floor(frameIndex)));
  const column = safeFrame % definition.cols;
  const row = Math.floor(safeFrame / definition.cols);
  texture.repeat.set(1 / definition.cols, 1 / definition.rows);
  texture.offset.set(column / definition.cols, 1 - (row + 1) / definition.rows);
}

export function disposeVfxSpriteSheetTextures() {
  for (const pending of texturePromises.values()) pending.then((texture) => texture.dispose()).catch(() => undefined);
  texturePromises.clear();
}
