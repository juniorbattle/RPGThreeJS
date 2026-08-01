import type { VfxPreset, VfxStepType } from './VfxTypes';

export const VFX_PARTICLE_STEP_TYPES = new Set<VfxStepType>([
  'particleBurst',
  'projectile',
  'smokePuff',
  'sparkleBurst',
]);

function premiumPreset(definition: Omit<VfxPreset, 'particleBudget'>): VfxPreset {
  return {
    ...definition,
    particleBudget: definition.steps.reduce(
      (total, step) => total + (VFX_PARTICLE_STEP_TYPES.has(step.type) ? (step.count ?? 1) : 0),
      0,
    ),
  };
}

const presets = [
  {
    id: 'fireball',
    label: 'Orbe ardent',
    duration: 0.84,
    impactTime: 0.52,
    tags: ['magic', 'fire', 'projectile'],
    particleBudget: 0,
    reducedGraphicsScale: 0.43,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_fire_impact_burst_medium', startTime: 0.34, duration: 0.46, scale: 1.82, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.49, duration: 0.15, color: '#ffd06a', opacity: 0.14, reducedGraphicsMultiplier: 0.55 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.49, duration: 0.2, scale: 0.3, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.49, duration: 0.07 },
    ],
  },
  {
    id: 'heal_burst',
    label: 'Souffle réparateur',
    duration: 0.7,
    impactTime: 0.36,
    tags: ['magic', 'heal', 'support'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_heal_blessing_bloom_heavy', startTime: 0.02, duration: 0.6, scale: 1.62, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'boss_quake',
    label: 'Fracture du colosse',
    duration: 0.96,
    impactTime: 0.36,
    tags: ['boss', 'physical', 'ground', 'aoe'],
    particleBudget: 0,
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_starburst_impact_medium', startTime: 0.03, duration: 0.66, scale: 2.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.7 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.27, duration: 0.17, color: '#ed9951', opacity: 0.16, reducedGraphicsMultiplier: 0.48 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.26, duration: 0.4, scale: 0.7, reducedGraphicsMultiplier: 0.5 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.27, duration: 0.11 },
    ],
  },
  {
    id: 'generic_hit',
    label: 'Impact générique',
    duration: 0.32,
    impactTime: 0.11,
    tags: ['impact', 'fallback'],
    particleBudget: 0,
    reducedGraphicsScale: 0.52,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_bolt_hit_small', startTime: 0, duration: 0.23, scale: 0.92, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.78 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.08, duration: 0.1, scale: 0.12, reducedGraphicsMultiplier: 0.55 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.08, duration: 0.04 },
    ],
  },
  {
    id: 'sword_slash',
    label: 'Entaille d’acier',
    duration: 0.46,
    impactTime: 0.16,
    tags: ['physical', 'melee', 'blade'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_sword_slash_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.34, scale: 1.46, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.13, duration: 0.14, scale: 0.17, reducedGraphicsMultiplier: 0.56 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.13, duration: 0.05 },
    ],
  },
  {
    id: 'blunt_impact',
    label: 'Choc contondant',
    duration: 0.62,
    impactTime: 0.23,
    tags: ['physical', 'melee', 'blunt'],
    particleBudget: 0,
    reducedGraphicsScale: 0.44,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_hammer_crush_heavy', startTime: 0.08, duration: 0.38, scale: 1.28, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.18, duration: 0.22, scale: 0.34, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.18, duration: 0.07 },
    ],
  },
  {
    id: 'arrow_shot',
    label: 'Trait précis',
    duration: 0.58,
    impactTime: 0.36,
    tags: ['physical', 'ranged', 'projectile'],
    particleBudget: 0,
    reducedGraphicsScale: 0.48,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_arrow_hit_small', orientation: 'center_on_target', startTime: 0, duration: 0.54, scale: 0.9, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.33, duration: 0.1, scale: 0.12, reducedGraphicsMultiplier: 0.55 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.33, duration: 0.045 },
    ],
  },
  {
    id: 'dark_bolt',
    label: 'Éclair des Ombres',
    duration: 0.76,
    impactTime: 0.47,
    tags: ['magic', 'shadow', 'projectile'],
    particleBudget: 0,
    reducedGraphicsScale: 0.43,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_void_rune_orb_medium', orientation: 'center_on_target', startTime: 0.02, duration: 0.67, scale: 1.02, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.43, duration: 0.12, color: '#8b66e8', opacity: 0.1, reducedGraphicsMultiplier: 0.52 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.43, duration: 0.15, scale: 0.19, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.43, duration: 0.055 },
    ],
  },
  {
    id: 'shadow_lightning_bolt',
    label: 'Foudre des Ombres',
    duration: 0.78,
    impactTime: 0.46,
    tags: ['magic', 'shadow', 'lightning', 'projectile'],
    particleBudget: 0,
    reducedGraphicsScale: 0.46,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_void_rune_orb_medium', orientation: 'center_on_target', startTime: 0.02, duration: 0.68, scale: 1.24, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.42, duration: 0.12, color: '#7b3ed1', opacity: 0.12, reducedGraphicsMultiplier: 0.56 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.42, duration: 0.14, scale: 0.18, reducedGraphicsMultiplier: 0.56 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.42, duration: 0.055 },
    ],
  },
  {
    id: 'root_vines',
    label: 'Entraves végétales',
    duration: 0.82,
    impactTime: 0.36,
    tags: ['magic', 'earth', 'root', 'bind', 'status'],
    particleBudget: 0,
    reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_arcane_sigil_burst_medium', orientation: 'center_on_target', startTime: 0.02, duration: 0.7, scale: 1.42, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.84 },
    ],
  },
  {
    id: 'frost_bind',
    label: 'Entrave de givre',
    duration: 0.94,
    impactTime: 0.45,
    tags: ['boss', 'magic', 'frost', 'bind'],
    particleBudget: 0,
    reducedGraphicsScale: 0.52,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_ice_pillar_impact_heavy', orientation: 'center_on_target', startTime: 0.02, duration: 0.84, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.86 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.44, duration: 0.14, scale: 0.2, reducedGraphicsMultiplier: 0.5 },
    ],
  },
  {
    id: 'bless_aura',
    label: 'Aura de bénédiction',
    duration: 0.68,
    impactTime: 0.31,
    tags: ['magic', 'support', 'bless'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_holy_sigil_burst_medium', startTime: 0, duration: 0.58, scale: 1.55, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'curse_pulse',
    label: 'Pulsation maudite',
    duration: 0.7,
    impactTime: 0.34,
    tags: ['magic', 'debuff', 'shadow'],
    particleBudget: 0,
    reducedGraphicsScale: 0.44,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_void_rune_orb_medium', startTime: 0.01, duration: 0.58, scale: 1.24, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.24, duration: 0.12, color: '#7a49a8', opacity: 0.08, reducedGraphicsMultiplier: 0.48 },
    ],
  },
  {
    id: 'status_curse_mark',
    label: 'Marque maudite',
    duration: 0.68,
    impactTime: 0.3,
    tags: ['status', 'debuff', 'curse', 'shadow'],
    particleBudget: 0,
    reducedGraphicsScale: 0.46,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_void_rune_orb_medium', startTime: 0, duration: 0.58, scale: 1.16, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'poison_bite',
    label: 'Morsure venimeuse',
    duration: 0.46,
    impactTime: 0.17,
    tags: ['physical', 'poison', 'creature'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_poison_maw_bite_heavy', startTime: 0.04, duration: 0.28, scale: 1.08, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.12, duration: 0.12, scale: 0.12, reducedGraphicsMultiplier: 0.55 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.12, duration: 0.045 },
    ],
  },
  {
    id: 'guard_barrier',
    label: 'Barrière de garde',
    duration: 0.68,
    impactTime: 0.3,
    tags: ['magic', 'support', 'barrier'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_barrier_guard_heavy', startTime: 0.02, duration: 0.58, scale: 1.62, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'boss_slam',
    label: 'Écrasement colossal',
    duration: 0.9,
    impactTime: 0.31,
    tags: ['boss', 'physical', 'ground', 'aoe'],
    particleBudget: 0,
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'basic_body_slam_heavy', startTime: 0.02, duration: 0.58, scale: 2.08, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.7 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.24, duration: 0.15, color: '#e9974c', opacity: 0.14, reducedGraphicsMultiplier: 0.48 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.23, duration: 0.35, scale: 0.62, reducedGraphicsMultiplier: 0.5 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.24, duration: 0.11 },
    ],
  },
  {
    id: 'critical_hit',
    label: 'Impact critique',
    duration: 0.34,
    impactTime: 0.08,
    tags: ['impact', 'critical'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_execution_slash_heavy', startTime: 0, duration: 0.28, scale: 1.36, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.03, duration: 0.1, color: '#fff6c2', opacity: 0.15, reducedGraphicsMultiplier: 0.52 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.03, duration: 0.18, scale: 0.31, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.03, duration: 0.085 },
    ],
  },
  {
    id: 'kill_spark',
    label: 'Éclat de victoire',
    duration: 0.72,
    impactTime: 0.09,
    tags: ['impact', 'knockout', 'reward'],
    particleBudget: 0,
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_bolt_hit_small', startTime: 0, duration: 0.48, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.04, duration: 0.1, color: '#fae59a', opacity: 0.08, reducedGraphicsMultiplier: 0.5 },
    ],
  },
  {
    id: 'support_regen_aura', label: 'Aura de régénération', duration: 0.72, impactTime: 0.3,
    tags: ['support', 'regen'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_support_leaf_burst_medium', startTime: 0.01, duration: 0.62, scale: 1.48, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_revive_pillar', label: 'Pilier de résurrection', duration: 0.9, impactTime: 0.44,
    tags: ['support', 'revive', 'holy'], particleBudget: 0, reducedGraphicsScale: 0.54,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_holy_light_pillar_medium', startTime: 0, duration: 0.82, scale: 1.74, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_holy_aura', label: 'Aura sacrée', duration: 0.76, impactTime: 0.33,
    tags: ['support', 'holy', 'aura'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_holy_radiance_burst_heavy', startTime: 0.01, duration: 0.65, scale: 1.52, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_boost_aura', label: 'Aura d’élan', duration: 0.68, impactTime: 0.28,
    tags: ['support', 'boost', 'aura'], particleBudget: 0, reducedGraphicsScale: 0.58,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_arcane_orbit_burst_medium', startTime: 0.01, duration: 0.57, scale: 1.4, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.82 },
    ],
  },
  {
    id: 'move_smoke_burst', label: 'Écran de fumée', duration: 0.48, impactTime: 0.14,
    tags: ['movement', 'smoke', 'tactical'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_void_spiral_implosion_medium', startTime: 0, duration: 0.42, scale: 1.44, opacity: 0.86, blending: 'normal', reducedGraphicsMultiplier: 0.82 },
    ],
  },
  {
    id: 'shape_cone_blast', label: 'Souffle conique', duration: 0.78, impactTime: 0.38,
    tags: ['shape', 'cone', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_wind_slash_swirl_medium', orientation: 'center_on_target', startTime: 0.02, duration: 0.64, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'impact_explosion_large', label: 'Grande explosion', duration: 0.88, impactTime: 0.42,
    tags: ['explosion', 'area', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_fire_vortex_nova_heavy', startTime: 0.02, duration: 0.76, scale: 1.95, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.4, duration: 0.16, scale: 0.2, reducedGraphicsMultiplier: 0.55 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.4, duration: 0.05 },
    ],
  },
  {
    id: 'boss_apocalypse_v2', label: 'Champ apocalypse', duration: 1.2, impactTime: 0.64,
    tags: ['boss', 'apocalypse', 'field'], particleBudget: 0, reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'skill_void_singularity_implosion_ultimate', startTime: 0.02, duration: 1.04, scale: 2.24, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.6, duration: 0.2, scale: 0.28, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.61, duration: 0.065 },
    ],
  },
  {
    id: 'thrust_line', label: 'Percée de lance', duration: 0.5, impactTime: 0.24,
    tags: ['physical', 'thrust', 'line'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_spear_stab_medium', orientation: 'center_on_target', startTime: 0.02, duration: 0.38, scale: 1.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.24, duration: 0.1, scale: 0.14, reducedGraphicsMultiplier: 0.55 },
    ],
  },
  {
    id: 'teleport_burst', label: 'Translation runique', duration: 0.46, impactTime: 0.2,
    tags: ['move', 'teleport'], particleBudget: 0, reducedGraphicsScale: 0.66,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_void_spiral_implosion_medium', startTime: 0, duration: 0.43, scale: 1.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'holy_strike', label: 'Frappe sacrée', duration: 0.56, impactTime: 0.24,
    tags: ['holy', 'physical', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.62,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_sword_slash_heavy', orientation: 'center_on_target', startTime: 0.02, duration: 0.34, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_holy_radiance_burst_heavy', startTime: 0.1, duration: 0.42, scale: 1.12, opacity: 0.86, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
    ],
  },
  {
    id: 'leap_impact', label: 'Impact de saut', duration: 0.58, impactTime: 0.28,
    tags: ['move', 'landing', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.64,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'basic_body_slam_heavy', startTime: 0.04, duration: 0.48, scale: 1.38, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.74 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.25, duration: 0.12, scale: 0.2, reducedGraphicsMultiplier: 0.55 },
    ],
  },
  {
    id: 'caster_roar', label: 'Onde de commandement', duration: 0.54, impactTime: 0.2,
    tags: ['support', 'debuff', 'caster'], particleBudget: 0, reducedGraphicsScale: 0.66,
    steps: [
      { type: 'spriteSheet', anchor: 'sourceGround', spriteSheet: 'skill_starburst_impact_medium', startTime: 0.02, duration: 0.42, scale: 1.28, opacity: 0.9, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
    ],
  },
  {
    id: 'arrow_rain', label: 'Pluie de flèches', duration: 0.76, impactTime: 0.44,
    tags: ['ranged', 'area', 'multi-impact'], particleBudget: 0, reducedGraphicsScale: 0.58,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_arrow_hit_small', orientation: 'center_on_target', startTime: 0.03, duration: 0.54, scale: 1.06, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.74 },
    ],
  },
] as const satisfies readonly VfxPreset[];

/**
 * R3E-1 weapon-impact presets. These are deliberately one-sheet, one-impact
 * presentations: weapon identity comes from the sprite sheet while combat
 * timing, damage and targeting remain owned by the legacy runtime.
 */
const basicAttackPresets = [
  {
    id: 'basic_greatsword_hit', label: 'Impact espadon', duration: 0.55, impactTime: 0.28,
    tags: ['basic', 'weapon', 'greatsword', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.78,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_greatsword_cleave_heavy', orientation: 'source_to_target', startTime: 0, duration: 0.55, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  },
  {
    id: 'basic_holy_mace_hit', label: 'Impact masse sacree', duration: 0.46, impactTime: 0.22,
    tags: ['basic', 'weapon', 'holy_mace', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.76,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_mace_impact_medium', orientation: 'source_to_target', startTime: 0, duration: 0.46, scale: 1.26, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  },
  {
    id: 'basic_scythe_hit', label: 'Impact faux', duration: 0.46, impactTime: 0.22,
    tags: ['basic', 'weapon', 'scythe', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.76,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_blade_crescent_medium', orientation: 'source_to_target', startTime: 0, duration: 0.46, scale: 1.26, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  },
  {
    id: 'basic_long_spear_hit', label: 'Impact lance longue', duration: 0.46, impactTime: 0.22,
    tags: ['basic', 'weapon', 'long_spear', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.76,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_spear_stab_medium', orientation: 'source_to_target', startTime: 0, duration: 0.46, scale: 1.26, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  },
  {
    id: 'basic_grimoire_hit', label: 'Impact grimoire', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'grimoire', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_bolt_hit_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_crosier_hit', label: 'Impact crosier', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'crosier', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_staff_strike_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_rapier_hit', label: 'Impact rapiere', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'rapier', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_dagger_crosscut_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_wand_hit', label: 'Impact baguette', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'wand', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_bolt_hit_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_longbow_hit', label: 'Impact arc long', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'longbow', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_arrow_hit_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_shuriken_hit', label: 'Impact shuriken', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'shuriken', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_shuriken_cut_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_dagger_hit', label: 'Impact dague', duration: 0.38, impactTime: 0.18,
    tags: ['basic', 'weapon', 'dagger', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.74,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_dagger_crosscut_small', orientation: 'source_to_target', startTime: 0, duration: 0.38, scale: 1.14, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  },
  {
    id: 'basic_hand_cannon_hit', label: 'Impact canon', duration: 0.46, impactTime: 0.22,
    tags: ['basic', 'weapon', 'hand_cannon', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.76,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_bullet_hit_medium', orientation: 'source_to_target', startTime: 0, duration: 0.46, scale: 1.26, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  },
] as const satisfies readonly VfxPreset[];

export const BASIC_ATTACK_VFX_PRESET_IDS = Object.freeze(
  basicAttackPresets.map((preset) => preset.id),
);

/**
 * R3E-2 skill-impact presets. These sheets are deliberately impact-only:
 * they spawn on the resolved target/area and never become a second projectile,
 * telegraph, terrain decal, or camera instruction.
 */
const skillRuntimePresets = [
  premiumPreset({
    id: 'skill_wind_slash_swirl', label: 'Tourbillon de lame', duration: 0.66, impactTime: 0.3,
    tags: ['skill', 'physical', 'wind', 'area'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_wind_slash_swirl_medium', orientation: 'center_on_target', startTime: 0, duration: 0.66, scale: 1.62, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_holy_radiance', label: 'Radiance sacrée', duration: 0.68, impactTime: 0.31,
    tags: ['skill', 'holy', 'impact'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_holy_radiance_burst_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.68, scale: 1.7, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_oathwall', label: 'Rempart du serment', duration: 0.82, impactTime: 0.36,
    tags: ['skill', 'support', 'barrier'], reducedGraphicsScale: 0.7,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_barrier_guard_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.76, scale: 1.48, opacity: 0.98, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_barrier_shield_ring_medium', orientation: 'center_on_target', startTime: 0.08, duration: 0.68, scale: 1.42, opacity: 0.96, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
    ],
  }),
  premiumPreset({
    id: 'skill_void_rune', label: 'Rune du vide', duration: 0.72, impactTime: 0.34,
    tags: ['skill', 'void', 'support'], reducedGraphicsScale: 0.7,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_void_rune_orb_medium', orientation: 'center_on_target', startTime: 0, duration: 0.72, scale: 1.54, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  }),
  premiumPreset({
    id: 'skill_fire_impact', label: 'Impact de flamme', duration: 0.65, impactTime: 0.3,
    tags: ['skill', 'fire', 'area'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_fire_impact_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.65, scale: 1.62, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_heal_bloom', label: 'Floraison réparatrice', duration: 0.76, impactTime: 0.34,
    tags: ['skill', 'heal', 'support'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_heal_blessing_bloom_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.76, scale: 1.64, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_holy_sigil', label: 'Sceau purificateur', duration: 0.7, impactTime: 0.32,
    tags: ['skill', 'holy', 'cleanse'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_holy_sigil_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.7, scale: 1.5, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_leaf_sanctuary', label: 'Sanctuaire des feuilles', duration: 0.76, impactTime: 0.34,
    tags: ['skill', 'nature', 'support'], reducedGraphicsScale: 0.7,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_support_leaf_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.76, scale: 1.62, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  }),
  premiumPreset({
    id: 'skill_arcane_vortex', label: 'Vortex arcanique', duration: 0.82, impactTime: 0.38,
    tags: ['skill', 'arcane', 'area'], reducedGraphicsScale: 0.68,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_arcane_vortex_nova_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.82, scale: 1.76, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  }),
  premiumPreset({
    id: 'skill_arcane_orbit', label: 'Orbite arcanique', duration: 0.68, impactTime: 0.3,
    tags: ['skill', 'arcane', 'support'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_arcane_orbit_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.68, scale: 1.5, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_binding_sigil', label: 'Sceau entravant', duration: 0.72, impactTime: 0.34,
    tags: ['skill', 'arcane', 'bind'], reducedGraphicsScale: 0.7,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_arcane_sigil_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.72, scale: 1.58, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 }],
  }),
  premiumPreset({
    id: 'skill_fire_smoke', label: 'Explosion fumante', duration: 0.76, impactTime: 0.36,
    tags: ['skill', 'fire', 'explosion'], reducedGraphicsScale: 0.68,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_fire_smoke_explosion_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.76, scale: 1.76, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.74 }],
  }),
  premiumPreset({
    id: 'skill_poison_maw', label: 'Morsure venimeuse', duration: 0.66, impactTime: 0.28,
    tags: ['skill', 'poison', 'melee'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_poison_maw_bite_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.66, scale: 1.5, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
  premiumPreset({
    id: 'skill_ice_pillar', label: 'Pilier de givre', duration: 0.8, impactTime: 0.37,
    tags: ['skill', 'ice', 'boss'], reducedGraphicsScale: 0.66,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_ice_pillar_impact_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.8, scale: 1.74, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 }],
  }),
  premiumPreset({
    id: 'skill_boss_inferno', label: 'Inferno du boss', duration: 0.88, impactTime: 0.42,
    tags: ['skill', 'boss', 'fire', 'area'], reducedGraphicsScale: 0.64,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_fire_vortex_nova_heavy', orientation: 'center_on_target', startTime: 0, duration: 0.88, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.7 }],
  }),
  premiumPreset({
    id: 'skill_boss_guard', label: 'Garde du boss', duration: 0.76, impactTime: 0.34,
    tags: ['skill', 'boss', 'barrier'], reducedGraphicsScale: 0.68,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_barrier_nature_guard_medium', orientation: 'center_on_target', startTime: 0, duration: 0.76, scale: 1.56, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 }],
  }),
] as const satisfies readonly VfxPreset[];

export const R3E2_SKILL_VFX_PRESET_IDS = Object.freeze(
  skillRuntimePresets.map((preset) => preset.id),
);

const r3e3SkillPresets = [
  premiumPreset({
    id: 'skill_arcane_slash_burst', label: 'Frappe arcanique', duration: 0.62, impactTime: 0.28,
    tags: ['skill', 'arcane', 'impact'], reducedGraphicsScale: 0.72,
    steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_arcane_slash_burst_medium', orientation: 'center_on_target', startTime: 0, duration: 0.62, scale: 1.5, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.78 }],
  }),
] as const satisfies readonly VfxPreset[];

export const R3E3_SKILL_VFX_PRESET_IDS = Object.freeze(
  r3e3SkillPresets.map((preset) => preset.id),
);

export const SKILL_VFX_PRESET_IDS = Object.freeze([
  ...R3E2_SKILL_VFX_PRESET_IDS,
  ...R3E3_SKILL_VFX_PRESET_IDS,
] as const);

// ── Hero ultimate / enemy / boss signature presets (formerly VfxPremiumPresets.ts) ──
const premiumPresets = [
  premiumPreset({
    id: 'ultimate_lion_surge',
    label: 'Ruée du Lion',
    duration: 1.02,
    impactTime: 0.42,
    tags: ['hero', 'ultimate', 'physical', 'golden', 'line'],
    reducedGraphicsScale: 0.45,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_execution_slash_heavy', startTime: 0.2, duration: 0.5, scale: 2.22, opacity: 1, blending: 'additive', orientation: 'center_on_target', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.37, duration: 0.14, color: '#ffe5a0', opacity: 0.16, reducedGraphicsMultiplier: 0.52 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.37, duration: 0.3, scale: 0.48, reducedGraphicsMultiplier: 0.48 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.38, duration: 0.1 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_radiant_judgement',
    label: 'Jugement radiant',
    duration: 1.14,
    impactTime: 0.5,
    tags: ['hero', 'ultimate', 'sacred', 'hybrid', 'area'],
    reducedGraphicsScale: 0.46,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_holy_radiance_burst_heavy', startTime: 0.1, duration: 0.82, scale: 2.0, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.45, duration: 0.16, color: '#fff2b3', opacity: 0.17, reducedGraphicsMultiplier: 0.5 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.46, duration: 0.28, scale: 0.4, reducedGraphicsMultiplier: 0.46 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.46, duration: 0.09 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_devouring_eclipse',
    label: 'Éclipse dévorante',
    duration: 1.14,
    impactTime: 0.5,
    tags: ['hero', 'ultimate', 'dark', 'drain', 'area'],
    reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_void_singularity_implosion_ultimate', startTime: 0.1, duration: 0.92, scale: 1.92, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.44, duration: 0.16, color: '#7a45a8', opacity: 0.13, reducedGraphicsMultiplier: 0.48 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.45, duration: 0.3, scale: 0.42, reducedGraphicsMultiplier: 0.45 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.45, duration: 0.1 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_firmament_lance',
    label: 'Lance du firmament',
    duration: 1.04,
    impactTime: 0.56,
    tags: ['hero', 'ultimate', 'piercing', 'anti-boss', 'line'],
    reducedGraphicsScale: 0.45,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_spear_stab_medium', startTime: 0.22, duration: 0.56, scale: 1.82, opacity: 1, blending: 'normal', orientation: 'center_on_target', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.52, duration: 0.14, color: '#dff8ff', opacity: 0.16, reducedGraphicsMultiplier: 0.52 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.52, duration: 0.28, scale: 0.46, reducedGraphicsMultiplier: 0.46 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.53, duration: 0.11 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_dark_meteor',
    label: 'Météore noir',
    duration: 1.2,
    impactTime: 0.62,
    tags: ['hero', 'ultimate', 'dark', 'fire', 'area'],
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_meteor_impact_burst_heavy', startTime: 0.04, duration: 1.02, scale: 2, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.64 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.57, duration: 0.17, color: '#b064d4', opacity: 0.15, reducedGraphicsMultiplier: 0.44 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.57, duration: 0.42, scale: 0.58, reducedGraphicsMultiplier: 0.42 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.58, duration: 0.11 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_miracle',
    label: 'Miracle',
    duration: 1.18,
    impactTime: 0.48,
    tags: ['hero', 'ultimate', 'heal', 'revive', 'support'],
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'allTargets', spriteSheet: 'skill_holy_radiance_burst_heavy', startTime: 0.1, duration: 0.92, scale: 1.72, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.42, duration: 0.19, color: '#fff7d0', opacity: 0.16, reducedGraphicsMultiplier: 0.58 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_perfect_duality',
    label: 'Dualité parfaite',
    duration: 1.12,
    impactTime: 0.48,
    tags: ['hero', 'ultimate', 'hybrid', 'light', 'shadow'],
    reducedGraphicsScale: 0.44,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_fire_vortex_nova_heavy', startTime: 0.2, duration: 0.82, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.43, duration: 0.15, color: '#f3b17e', opacity: 0.14, reducedGraphicsMultiplier: 0.5 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.43, duration: 0.28, scale: 0.38, reducedGraphicsMultiplier: 0.45 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.44, duration: 0.08 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_absolute_harmony',
    label: 'Harmonie absolue',
    duration: 1.16,
    impactTime: 0.46,
    tags: ['hero', 'ultimate', 'team', 'aura', 'barrier'],
    reducedGraphicsScale: 0.5,
    steps: [
      { type: 'spriteSheet', anchor: 'allTargets', spriteSheet: 'skill_holy_radiance_burst_heavy', startTime: 0.1, duration: 0.94, scale: 2.05, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.4, duration: 0.17, color: '#d7fff4', opacity: 0.12, reducedGraphicsMultiplier: 0.58 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_zenith_arrow',
    label: 'Flèche du zénith',
    duration: 0.98,
    impactTime: 0.54,
    tags: ['hero', 'ultimate', 'ranged', 'piercing', 'critical'],
    reducedGraphicsScale: 0.45,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_arrow_hit_small', orientation: 'center_on_target', startTime: 0.1, duration: 0.54, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.51, duration: 0.13, color: '#e9fbff', opacity: 0.16, reducedGraphicsMultiplier: 0.52 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.51, duration: 0.25, scale: 0.43, reducedGraphicsMultiplier: 0.46 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.52, duration: 0.11 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_silent_assassin',
    label: 'Assassin silencieux',
    duration: 0.92,
    impactTime: 0.34,
    tags: ['hero', 'ultimate', 'execution', 'shadow', 'poison'],
    reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'sourceGround', spriteSheet: 'skill_void_spiral_implosion_medium', startTime: 0, duration: 0.62, scale: 1.46, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_execution_slash_heavy', startTime: 0.25, duration: 0.34, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.29, duration: 0.11, color: '#8e59aa', opacity: 0.13, reducedGraphicsMultiplier: 0.46 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.29, duration: 0.22, scale: 0.42, reducedGraphicsMultiplier: 0.44 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.29, duration: 0.115 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_fault_breaker',
    label: 'Briseur de faille',
    duration: 1.0,
    impactTime: 0.42,
    tags: ['hero', 'ultimate', 'physical', 'shatter', 'dispel'],
    reducedGraphicsScale: 0.44,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_greatsword_cleave_heavy', startTime: 0.28, duration: 0.38, scale: 1.86, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.36, duration: 0.14, color: '#e7fbef', opacity: 0.15, reducedGraphicsMultiplier: 0.5 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.36, duration: 0.28, scale: 0.46, reducedGraphicsMultiplier: 0.45 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.37, duration: 0.1 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_artillery_barrage',
    label: 'Barrage d\u2019artillerie',
    duration: 0.94,
    impactTime: 0.42,
    tags: ['hero', 'ultimate', 'ranged', 'fire', 'multi-impact'],
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_fire_spark_cluster_medium', startTime: 0.04, duration: 0.8, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.66 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.37, duration: 0.12, color: '#ffb25f', opacity: 0.12, reducedGraphicsMultiplier: 0.42 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.37, duration: 0.26, scale: 0.43, reducedGraphicsMultiplier: 0.4 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.37, duration: 0.075 },
    ],
  }),
  premiumPreset({
    id: 'enemy_dragon_breath',
    label: 'Souffle draconique',
    duration: 0.84,
    impactTime: 0.46,
    tags: ['enemy', 'fire', 'breath', 'cone'],
    reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'skill_fire_smoke_explosion_heavy', startTime: 0.04, duration: 0.54, scale: 1.62, opacity: 1, blending: 'additive', orientation: 'center_on_target', reducedGraphicsMultiplier: 0.64 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.41, duration: 0.12, color: '#ff984d', opacity: 0.12, reducedGraphicsMultiplier: 0.46 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.41, duration: 0.22, scale: 0.32, reducedGraphicsMultiplier: 0.44 },
    ],
  }),
  premiumPreset({
    id: 'boss_execution',
    label: 'Exécution',
    duration: 1.08,
    impactTime: 0.5,
    tags: ['boss', 'signature', 'physical', 'execution'],
    reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_execution_slash_heavy', startTime: 0.24, duration: 0.62, scale: 1.55, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.64 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.45, duration: 0.14, color: '#e5a25c', opacity: 0.16, reducedGraphicsMultiplier: 0.45 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.45, duration: 0.36, scale: 0.62, reducedGraphicsMultiplier: 0.4 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.46, duration: 0.12 },
    ],
  }),
  premiumPreset({
    id: 'boss_flurry',
    label: 'Déluge de lames',
    duration: 1.12,
    impactTime: 0.42,
    tags: ['boss', 'signature', 'physical', 'multi-hit'],
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_sword_slash_heavy', startTime: 0.22, duration: 0.42, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_sword_slash_heavy', startTime: 0.38, duration: 0.42, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_sword_slash_heavy', startTime: 0.55, duration: 0.48, scale: 2.12, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.61, duration: 0.13, color: '#f5cf82', opacity: 0.14, reducedGraphicsMultiplier: 0.42 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.61, duration: 0.32, scale: 0.52, reducedGraphicsMultiplier: 0.4 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.62, duration: 0.1 },
    ],
  }),
  premiumPreset({
    id: 'boss_inferno',
    label: 'Inferno',
    duration: 1.22,
    impactTime: 0.6,
    tags: ['boss', 'signature', 'fire', 'area'],
    reducedGraphicsScale: 0.38,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'skill_fire_vortex_nova_heavy', startTime: 0.3, duration: 0.82, scale: 2.15, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.62 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.55, duration: 0.17, color: '#ff9a4c', opacity: 0.17, reducedGraphicsMultiplier: 0.42 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.55, duration: 0.48, scale: 0.68, reducedGraphicsMultiplier: 0.38 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.57, duration: 0.11 },
    ],
  }),
  premiumPreset({
    id: 'boss_titan_slam',
    label: 'Frappe du titan',
    duration: 1.26,
    impactTime: 0.56,
    tags: ['boss', 'signature', 'physical', 'ground', 'massive'],
    reducedGraphicsScale: 0.38,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'basic_titan_crush_heavy', startTime: 0.12, duration: 1, scale: 1.9, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.62 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.51, duration: 0.16, color: '#d69a5e', opacity: 0.15, reducedGraphicsMultiplier: 0.42 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.5, duration: 0.62, scale: 0.78, reducedGraphicsMultiplier: 0.36 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.52, duration: 0.13 },
    ],
  }),
] as const satisfies readonly VfxPreset[];

export const PREMIUM_VFX_PRESET_IDS = Object.freeze(premiumPresets.map((preset) => preset.id));

const completePresetPack = [...presets, ...basicAttackPresets, ...skillRuntimePresets, ...r3e3SkillPresets, ...premiumPresets] as const satisfies readonly VfxPreset[];

export const VFX_PRESETS: Readonly<Record<string, VfxPreset>> = Object.freeze(
  Object.fromEntries(completePresetPack.map((preset) => [preset.id, preset])),
);

export const VFX_PRESET_IDS = Object.freeze(completePresetPack.map((preset) => preset.id));

export function getVfxPreset(id: string): VfxPreset | undefined {
  return VFX_PRESETS[id];
}
