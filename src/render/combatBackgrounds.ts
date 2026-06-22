import type { BackgroundSceneConfig } from './BackgroundLayerSystem';
import { assets } from './assetManifest';

export const forestCombatBackground: BackgroundSceneConfig = {
  id: 'forest-dawn',
  enabled: true,
  layers: [
    {
      id: 'forest-sky',
      texture: assets.world.forestFar,
      position: [0, 1.2, -26],
      size: [36, 20],
      parallax: 0.015,
      fallback: ['#789aa4', '#3e5a4a'],
    },
    {
      id: 'forest-distance',
      texture: assets.world.forestMid,
      position: [0, -0.4, -24],
      size: [34, 19],
      parallax: 0.04,
      opacity: 0.34,
      fallback: ['#617e70', '#2e493b'],
    },
    {
      id: 'forest-mist',
      texture: assets.world.forestFore,
      position: [0, -1.4, -22],
      size: [33, 18.5],
      parallax: 0.075,
      opacity: 0.12,
      shader: { type: 'uvWave', intensity: 0.004, speed: 0.22, frequency: 6 },
      fallback: ['rgba(146,174,153,.2)', 'rgba(45,70,55,.15)'],
    },
  ],
};
