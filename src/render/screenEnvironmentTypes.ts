export type ScreenEnvironmentId = 'title' | 'travel' | 'worldMap' | 'dialogue' | 'management' | 'exploration' | 'combat';

export type ScreenOverlayType = 'none' | 'premium-night' | 'forest-dawn';

export type ScreenVignetteType = 'none' | 'soft' | 'medium' | 'strong';

export type ScreenFogProfile = 'none' | 'low' | 'scene' | 'combat';

export type ScreenParticleProfile = 'none' | 'motes' | 'dust' | 'embers';

export type HeroStagingProfile = 'none' | 'travel-party' | 'dialogue-portrait' | 'management-unit' | 'combat-stage';

export type ScreenMotionPolicy = 'static' | 'ambientOnly' | 'reduced';

export interface ScreenEnvironmentPreset {
  id: ScreenEnvironmentId;
  mainImage: string;
  fallback: string;
  overlayType: ScreenOverlayType;
  vignetteType: ScreenVignetteType;
  fogProfile: ScreenFogProfile;
  particleProfile: ScreenParticleProfile;
  heroStagingProfile: HeroStagingProfile;
  motionPolicy: ScreenMotionPolicy;
}
