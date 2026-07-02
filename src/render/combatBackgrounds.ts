import type { BackgroundSceneConfig } from './BackgroundLayerSystem';
import { assets } from './assetManifest';

function paintedCombatScene(id: string, texture: string, fallback: [string, string]): BackgroundSceneConfig {
  return {
    id,
    enabled: true,
    layers: [
      {
        id: `${id}-painted-backdrop`,
        texture,
        position: [0, -0.28, -30],
        size: [36, 20.25],
        parallax: 0,
        opacity: 1,
        fallback,
      },
    ],
  };
}

export const combatBackgrounds: Record<string, BackgroundSceneConfig> = {
  forest_route: paintedCombatScene('forest-route-painted', assets.combatScenes.forest_route, ['#253044', '#0b111b']),
  bois_clair_burning: paintedCombatScene('bois-clair-burning-painted', assets.combatScenes.bois_clair_burning, ['#4a2219', '#120b0a']),
  lion_sanctum: paintedCombatScene('lion-sanctum-painted', assets.combatScenes.lion_sanctum, ['#2c263b', '#0b0b16']),
};

export const forestCombatBackground: BackgroundSceneConfig = {
  id: 'forest-ruins-hybrid-painted',
  enabled: true,
  layers: [
    {
      id: 'combat-painted-backdrop',
      texture: assets.screens.combat.forestRuinsBackdrop,
      position: [0, -0.28, -30],
      size: [36, 20.25],
      parallax: 0,
      opacity: 1,
      fallback: ['#253044', '#0b111b'],
    },
  ],
};

export function combatBackgroundFor(sceneId?: string): BackgroundSceneConfig {
  return sceneId ? combatBackgrounds[sceneId] ?? forestCombatBackground : forestCombatBackground;
}
