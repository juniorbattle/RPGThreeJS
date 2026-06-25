import type { BackgroundSceneConfig } from './BackgroundLayerSystem';
import { assets } from './assetManifest';

/**
 * Forest combat backdrop: sky, distance, mist. Kept faint and low-parallax so
 * the backdrop never competes with units or the tactical grid. Swap the texture
 * paths to plug in future pre-rendered panoramas without touching this file.
 */
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
