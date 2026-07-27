import type { VfxPreset, VfxStepType } from './VfxTypes';
import { PREMIUM_VFX_PRESETS } from './VfxPremiumPresets';

export const VFX_PARTICLE_STEP_TYPES = new Set<VfxStepType>([
  'particleBurst',
  'projectile',
  'smokePuff',
  'sparkleBurst',
]);

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
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'fire_explosion', startTime: 0.34, duration: 0.46, scale: 1.82, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'heal_touch', startTime: 0.02, duration: 0.6, scale: 1.62, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'shockwave_ring', startTime: 0.03, duration: 0.66, scale: 2.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.7 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'small_impact', startTime: 0, duration: 0.23, scale: 0.92, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.78 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', orientation: 'source_to_target', startTime: 0, duration: 0.34, scale: 1.46, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'small_impact', startTime: 0.08, duration: 0.38, scale: 1.28, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'projectile_shot', sheetMode: 'projectile', orientation: 'source_to_target', startTime: 0, duration: 0.54, scale: 0.9, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'magic_bolt', sheetMode: 'projectile', startTime: 0.02, duration: 0.67, scale: 1.02, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'shadow_lightning_bolt', sheetMode: 'projectile', orientation: 'source_to_target', startTime: 0.02, duration: 0.68, scale: 1.24, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'root_vines', orientation: 'center_on_target', startTime: 0.02, duration: 0.7, scale: 1.42, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.84 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'frost_bind', orientation: 'center_on_target', startTime: 0.02, duration: 0.84, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.86 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'buff_pulse', startTime: 0, duration: 0.58, scale: 1.55, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'curse_mark', startTime: 0.01, duration: 0.58, scale: 1.24, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'curse_mark', startTime: 0, duration: 0.58, scale: 1.16, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.04, duration: 0.28, scale: 1.08, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'barrier_shell', startTime: 0.02, duration: 0.58, scale: 1.62, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'leap_impact', startTime: 0.02, duration: 0.58, scale: 2.08, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.7 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0, duration: 0.28, scale: 1.36, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'small_impact', startTime: 0, duration: 0.48, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.04, duration: 0.1, color: '#fae59a', opacity: 0.08, reducedGraphicsMultiplier: 0.5 },
    ],
  },
  {
    id: 'support_regen_aura', label: 'Aura de régénération', duration: 0.72, impactTime: 0.3,
    tags: ['support', 'regen'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'regen_aura', startTime: 0.01, duration: 0.62, scale: 1.48, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_revive_pillar', label: 'Pilier de résurrection', duration: 0.9, impactTime: 0.44,
    tags: ['support', 'revive', 'holy'], particleBudget: 0, reducedGraphicsScale: 0.54,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'revive_pillar', startTime: 0, duration: 0.82, scale: 1.74, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_holy_aura', label: 'Aura sacrée', duration: 0.76, impactTime: 0.33,
    tags: ['support', 'holy', 'aura'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'holy_aura', startTime: 0.01, duration: 0.65, scale: 1.52, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.8 },
    ],
  },
  {
    id: 'support_boost_aura', label: 'Aura d’élan', duration: 0.68, impactTime: 0.28,
    tags: ['support', 'boost', 'aura'], particleBudget: 0, reducedGraphicsScale: 0.58,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'boost_aura', startTime: 0.01, duration: 0.57, scale: 1.4, opacity: 0.98, blending: 'normal', reducedGraphicsMultiplier: 0.82 },
    ],
  },
  {
    id: 'move_smoke_burst', label: 'Écran de fumée', duration: 0.48, impactTime: 0.14,
    tags: ['movement', 'smoke', 'tactical'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'smoke_burst', startTime: 0, duration: 0.42, scale: 1.44, opacity: 0.86, blending: 'normal', reducedGraphicsMultiplier: 0.82 },
    ],
  },
  {
    id: 'shape_cone_blast', label: 'Souffle conique', duration: 0.78, impactTime: 0.38,
    tags: ['shape', 'cone', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'groundTarget', sheetMode: 'projectile', spriteSheet: 'cone_blast', orientation: 'align_cone', startTime: 0.02, duration: 0.64, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'impact_explosion_large', label: 'Grande explosion', duration: 0.88, impactTime: 0.42,
    tags: ['explosion', 'area', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.56,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'explosion_large', startTime: 0.02, duration: 0.76, scale: 1.95, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.4, duration: 0.16, scale: 0.2, reducedGraphicsMultiplier: 0.55 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.4, duration: 0.05 },
    ],
  },
  {
    id: 'boss_apocalypse_v2', label: 'Champ apocalypse', duration: 1.2, impactTime: 0.64,
    tags: ['boss', 'apocalypse', 'field'], particleBudget: 0, reducedGraphicsScale: 0.42,
    steps: [
      { type: 'spriteSheet', anchor: 'targetGround', spriteSheet: 'apocalypse_field', startTime: 0.02, duration: 1.04, scale: 2.24, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.6, duration: 0.2, scale: 0.28, reducedGraphicsMultiplier: 0.52 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.61, duration: 0.065 },
    ],
  },
  {
    id: 'thrust_line', label: 'Percée de lance', duration: 0.5, impactTime: 0.24,
    tags: ['physical', 'thrust', 'line'], particleBudget: 0, reducedGraphicsScale: 0.6,
    steps: [
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'thrust_line', sheetMode: 'projectile', orientation: 'source_to_target', startTime: 0.02, duration: 0.38, scale: 1.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.24, duration: 0.1, scale: 0.14, reducedGraphicsMultiplier: 0.55 },
    ],
  },
  {
    id: 'teleport_burst', label: 'Translation runique', duration: 0.46, impactTime: 0.2,
    tags: ['move', 'teleport'], particleBudget: 0, reducedGraphicsScale: 0.66,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'teleport_burst', startTime: 0, duration: 0.43, scale: 1.2, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.76 },
    ],
  },
  {
    id: 'holy_strike', label: 'Frappe sacrée', duration: 0.56, impactTime: 0.24,
    tags: ['holy', 'physical', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.62,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', orientation: 'source_to_target', startTime: 0.02, duration: 0.34, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.74 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'holy_aura', startTime: 0.1, duration: 0.42, scale: 1.12, opacity: 0.86, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
    ],
  },
  {
    id: 'leap_impact', label: 'Impact de saut', duration: 0.58, impactTime: 0.28,
    tags: ['move', 'landing', 'impact'], particleBudget: 0, reducedGraphicsScale: 0.64,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'leap_impact', startTime: 0.04, duration: 0.48, scale: 1.38, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.74 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.25, duration: 0.12, scale: 0.2, reducedGraphicsMultiplier: 0.55 },
    ],
  },
  {
    id: 'caster_roar', label: 'Onde de commandement', duration: 0.54, impactTime: 0.2,
    tags: ['support', 'debuff', 'caster'], particleBudget: 0, reducedGraphicsScale: 0.66,
    steps: [
      { type: 'spriteSheet', anchor: 'sourceGround', spriteSheet: 'shockwave_ring', startTime: 0.02, duration: 0.42, scale: 1.28, opacity: 0.9, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
    ],
  },
  {
    id: 'arrow_rain', label: 'Pluie de flèches', duration: 0.76, impactTime: 0.44,
    tags: ['ranged', 'area', 'multi-impact'], particleBudget: 0, reducedGraphicsScale: 0.58,
    steps: [
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'groundTarget', spriteSheet: 'projectile_shot', sheetMode: 'projectile', orientation: 'source_to_target', startTime: 0.03, duration: 0.54, scale: 1.06, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.74 },
    ],
  },
] as const satisfies readonly VfxPreset[];

const completePresetPack = [...presets, ...PREMIUM_VFX_PRESETS] as const satisfies readonly VfxPreset[];

export const VFX_PRESETS: Readonly<Record<string, VfxPreset>> = Object.freeze(
  Object.fromEntries(completePresetPack.map((preset) => [preset.id, preset])),
);

export const VFX_PRESET_IDS = Object.freeze(completePresetPack.map((preset) => preset.id));

export function getVfxPreset(id: string): VfxPreset | undefined {
  return VFX_PRESETS[id];
}
