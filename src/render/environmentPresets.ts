import type {
  HeroStagingProfile,
  ScreenFogProfile,
  ScreenMotionPolicy,
  ScreenOverlayType,
  ScreenParticleProfile,
  ScreenVignetteType,
} from './screenEnvironmentTypes';

export const overlayPresets = {
  none: 'none',
  premiumNight: 'premium-night',
  forestDawn: 'forest-dawn',
} as const satisfies Record<string, ScreenOverlayType>;

export const vignettePresets = {
  none: 'none',
  soft: 'soft',
  medium: 'medium',
  strong: 'strong',
} as const satisfies Record<string, ScreenVignetteType>;

export const fogPresets = {
  none: 'none',
  low: 'low',
  scene: 'scene',
  combat: 'combat',
} as const satisfies Record<string, ScreenFogProfile>;

export const particlePresets = {
  none: 'none',
  motes: 'motes',
  dust: 'dust',
  embers: 'embers',
} as const satisfies Record<string, ScreenParticleProfile>;

export const heroStagingPresets = {
  none: 'none',
  travelParty: 'travel-party',
  dialoguePortrait: 'dialogue-portrait',
  managementUnit: 'management-unit',
  combatStage: 'combat-stage',
} as const satisfies Record<string, HeroStagingProfile>;

export const motionPresets = {
  static: 'static',
  ambientOnly: 'ambientOnly',
  reduced: 'reduced',
} as const satisfies Record<string, ScreenMotionPolicy>;
