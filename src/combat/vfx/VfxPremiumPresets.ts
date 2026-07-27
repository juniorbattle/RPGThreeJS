import type { VfxPreset, VfxStep } from './VfxTypes';

const PARTICLE_STEPS = new Set<VfxStep['type']>([
  'particleBurst',
  'projectile',
  'smokePuff',
  'sparkleBurst',
]);

function premiumPreset(definition: Omit<VfxPreset, 'particleBudget'>): VfxPreset {
  return {
    ...definition,
    particleBudget: definition.steps.reduce(
      (total, step) => total + (PARTICLE_STEPS.has(step.type) ? (step.count ?? 1) : 0),
      0,
    ),
  };
}

/**
 * Presentation data only. These presets deliberately use the existing VfxSystem
 * primitives so the premium pass stays compatible with fixed sprites, the
 * tactical grid and reduced graphics mode.
 */
export const PREMIUM_VFX_PRESETS = [
  premiumPreset({
    id: 'ultimate_lion_surge',
    label: 'Ruée du Lion',
    duration: 1.02,
    impactTime: 0.42,
    tags: ['hero', 'ultimate', 'physical', 'golden', 'line'],
    reducedGraphicsScale: 0.45,
    steps: [
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.2, duration: 0.5, scale: 2.22, opacity: 1, blending: 'additive', orientation: 'align_line', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'holy_aura', startTime: 0.1, duration: 0.82, scale: 2.0, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'apocalypse_field', startTime: 0.1, duration: 0.92, scale: 1.92, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'thrust_line', startTime: 0.22, duration: 0.56, scale: 1.82, opacity: 1, blending: 'normal', orientation: 'source_to_target', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'meteor_fall', startTime: 0.04, duration: 1.02, scale: 2, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.64 },
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
      { type: 'spriteSheet', anchor: 'allTargets', spriteSheet: 'holy_aura', startTime: 0.1, duration: 0.92, scale: 1.72, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'explosion_large', startTime: 0.2, duration: 0.82, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
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
      { type: 'spriteSheet', anchor: 'allTargets', spriteSheet: 'holy_aura', startTime: 0.1, duration: 0.94, scale: 2.05, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.68 },
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
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'projectile_shot', sheetMode: 'projectile', orientation: 'source_to_target', startTime: 0.1, duration: 0.54, scale: 1.42, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'sourceGround', spriteSheet: 'teleport_burst', startTime: 0, duration: 0.62, scale: 1.46, opacity: 1, blending: 'normal', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.25, duration: 0.34, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.28, duration: 0.38, scale: 1.86, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.36, duration: 0.14, color: '#e7fbef', opacity: 0.15, reducedGraphicsMultiplier: 0.5 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.36, duration: 0.28, scale: 0.46, reducedGraphicsMultiplier: 0.45 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.37, duration: 0.1 },
    ],
  }),
  premiumPreset({
    id: 'ultimate_artillery_barrage',
    label: 'Barrage d’artillerie',
    duration: 0.94,
    impactTime: 0.42,
    tags: ['hero', 'ultimate', 'ranged', 'fire', 'multi-impact'],
    reducedGraphicsScale: 0.4,
    steps: [
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'artillery_barrage', startTime: 0.04, duration: 0.8, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.66 },
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
      { type: 'spriteSheet', anchor: 'source', targetAnchor: 'groundTarget', spriteSheet: 'dragon_breath', sheetMode: 'projectile', startTime: 0.04, duration: 0.54, scale: 1.62, opacity: 1, blending: 'additive', orientation: 'align_cone', reducedGraphicsMultiplier: 0.64 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'heavy_execution', startTime: 0.24, duration: 0.62, scale: 1.55, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.64 },
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
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.22, duration: 0.42, scale: 1.68, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.38, duration: 0.42, scale: 1.82, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
      { type: 'spriteSheet', anchor: 'target', spriteSheet: 'slash_arc', startTime: 0.55, duration: 0.48, scale: 2.12, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.72 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'explosion_large', startTime: 0.3, duration: 0.82, scale: 2.15, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.62 },
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
      { type: 'spriteSheet', anchor: 'groundTarget', spriteSheet: 'titan_slam', startTime: 0.12, duration: 1, scale: 1.9, opacity: 1, blending: 'additive', reducedGraphicsMultiplier: 0.62 },
      { type: 'screenFlash', anchor: 'screen', startTime: 0.51, duration: 0.16, color: '#d69a5e', opacity: 0.15, reducedGraphicsMultiplier: 0.42 },
      { type: 'screenShake', anchor: 'camera', startTime: 0.5, duration: 0.62, scale: 0.78, reducedGraphicsMultiplier: 0.36 },
      { type: 'hitStop', anchor: 'screen', startTime: 0.52, duration: 0.13 },
    ],
  }),
] as const satisfies readonly VfxPreset[];

export const PREMIUM_VFX_PRESET_IDS = Object.freeze(PREMIUM_VFX_PRESETS.map((preset) => preset.id));
