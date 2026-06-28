import { assets } from './assetManifest';
import {
  fogPresets,
  heroStagingPresets,
  motionPresets,
  overlayPresets,
  particlePresets,
  vignettePresets,
} from './environmentPresets';
import type { ScreenEnvironmentId, ScreenEnvironmentPreset } from './screenEnvironmentTypes';

export const screenEnvironments: Record<ScreenEnvironmentId, ScreenEnvironmentPreset> = {
  title: {
    id: 'title',
    mainImage: assets.screens.title.background,
    fallback: 'linear-gradient(180deg, rgba(4, 6, 12, 0.74), rgba(4, 6, 12, 0.28) 38%, rgba(4, 6, 12, 0.54))',
    overlayType: overlayPresets.premiumNight,
    vignetteType: vignettePresets.strong,
    fogProfile: fogPresets.low,
    particleProfile: particlePresets.motes,
    heroStagingProfile: heroStagingPresets.none,
    motionPolicy: motionPresets.ambientOnly,
  },
  travel: {
    id: 'travel',
    mainImage: assets.screens.travel.sky,
    fallback: 'linear-gradient(180deg, #394c5b 0%, #162524 58%, #080b14 100%)',
    overlayType: overlayPresets.forestDawn,
    vignetteType: vignettePresets.medium,
    fogProfile: fogPresets.scene,
    particleProfile: particlePresets.motes,
    heroStagingProfile: heroStagingPresets.travelParty,
    motionPolicy: motionPresets.ambientOnly,
  },
  dialogue: {
    id: 'dialogue',
    mainImage: assets.screens.dialogue.background,
    fallback: 'radial-gradient(circle at 50% 32%, #2e4058 0%, #111c2f 40%, #040710 100%)',
    overlayType: overlayPresets.premiumNight,
    vignetteType: vignettePresets.strong,
    fogProfile: fogPresets.low,
    particleProfile: particlePresets.dust,
    heroStagingProfile: heroStagingPresets.dialoguePortrait,
    motionPolicy: motionPresets.ambientOnly,
  },
  management: {
    id: 'management',
    mainImage: assets.screens.management.background,
    fallback: 'linear-gradient(110deg, rgba(3, 6, 12, 0.96), rgba(10, 17, 29, 0.8))',
    overlayType: overlayPresets.premiumNight,
    vignetteType: vignettePresets.medium,
    fogProfile: fogPresets.low,
    particleProfile: particlePresets.none,
    heroStagingProfile: heroStagingPresets.managementUnit,
    motionPolicy: motionPresets.ambientOnly,
  },
  exploration: {
    id: 'exploration',
    mainImage: assets.screens.exploration.background,
    fallback: 'linear-gradient(90deg, rgba(5, 9, 15, 0.82), rgba(5, 9, 15, 0.12) 62%, rgba(5, 9, 15, 0.58))',
    overlayType: overlayPresets.forestDawn,
    vignetteType: vignettePresets.medium,
    fogProfile: fogPresets.low,
    particleProfile: particlePresets.motes,
    heroStagingProfile: heroStagingPresets.none,
    motionPolicy: motionPresets.ambientOnly,
  },
  combat: {
    id: 'combat',
    mainImage: assets.screens.combat.background,
    fallback: 'linear-gradient(180deg, #789aa4 0%, #3e5a4a 100%)',
    overlayType: overlayPresets.forestDawn,
    vignetteType: vignettePresets.medium,
    fogProfile: fogPresets.combat,
    particleProfile: particlePresets.none,
    heroStagingProfile: heroStagingPresets.combatStage,
    motionPolicy: motionPresets.static,
  },
};

export function getScreenEnvironment(id: ScreenEnvironmentId): ScreenEnvironmentPreset {
  return screenEnvironments[id];
}

export function applyScreenEnvironment(element: HTMLElement, id: ScreenEnvironmentId): ScreenEnvironmentPreset {
  const preset = getScreenEnvironment(id);
  element.dataset.screenEnv = preset.id;
  element.dataset.overlay = preset.overlayType;
  element.dataset.vignette = preset.vignetteType;
  element.dataset.fog = preset.fogProfile;
  element.dataset.particles = preset.particleProfile;
  element.dataset.heroStaging = preset.heroStagingProfile;
  element.dataset.motion = preset.motionPolicy;
  element.style.setProperty('--screen-bg-image', `url("${preset.mainImage}")`);
  element.style.setProperty('--screen-bg-fallback', preset.fallback);
  return preset;
}

