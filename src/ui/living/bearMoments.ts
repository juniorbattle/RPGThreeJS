import { BEAR_PROVISIONAL_SCENES } from '../../campaign/plateaux/bear/bearPresentation';
import { CANDLE, FIRE } from '../opening/openingPainters';
import { celestialGlow, driftingPuffs } from './livingAtmosphere';
import { CHIEF_STATURE, momentScript, standing, still, type MomentScene } from './postDemoScenes';

/**
 * The Bear's two outcomes (set 1.20.0, "Post-demo moments"; table validated 2026-11-13), each after its post-combat
 * dialogue and before the epilogue, on that dialogue's own painting. The land of cold and fire: wind-driven snow, chains
 * and winches that stir, amber firelight on granite. Neither shows the Seal, the alliance or the dark ore: the epilogue
 * says them first. No caption.
 */

// ——— Honour: the high gallery at dusk, after the Master Spy's fall. ———

const GALLERY = BEAR_PROVISIONAL_SCENES.bear_master_spy_aftermath!.image!;

const GALLERY_SCENE: MomentScene = {
  image: GALLERY,
  // The gallery floor recedes to the railing over the void.
  depth: (y) => 0.7 * (y - 440) / 120,
  // Cold dusk from the opening behind, the sun's edge on every figure, the lanterns warm in front.
  light: {
    top: [214, 196, 206], middle: [174, 164, 184], bottom: [84, 82, 106], rim: [255, 192, 140], rimAlpha: 0.55, rimOffset: [1, -1],
    shadowFrom: { x: 1360, y: 195 }, shadowReach: 0.32, shadowAlpha: 0.26,
  },
  lights: [
    { x: 130, y: 470, radius: 90, color: FIRE, power: 0.22, seed: 11 }, { x: 485, y: 470, radius: 90, color: FIRE, power: 0.22, seed: 12 },
    { x: 800, y: 485, radius: 70, color: FIRE, power: 0.18, seed: 13 }, { x: 1165, y: 490, radius: 70, color: FIRE, power: 0.18, seed: 14 },
    { x: 110, y: 230, radius: 60, color: CANDLE, power: 0.18, seed: 15 }, { x: 1405, y: 245, radius: 50, color: CANDLE, power: 0.16, seed: 16 },
    { x: 300, y: 405, radius: 40, color: CANDLE, power: 0.14, seed: 17 }, { x: 160, y: 420, radius: 36, color: CANDLE, power: 0.12, seed: 18 },
  ],
  fires: [
    { x: 130, y: 488, width: 36, height: 30, base: 0.6 }, { x: 485, y: 488, width: 34, height: 30, base: 0.6 },
    { x: 800, y: 500, width: 28, height: 24, base: 0.6 }, { x: 1165, y: 505, width: 28, height: 24, base: 0.6 },
  ],
  // The long chain in the opening, the winch chains and hooks on the right, the two hanging lanterns.
  sway: [
    { x: 698, y: 0, width: 16, height: 430, amplitude: 3 }, { x: 1296, y: 40, width: 24, height: 240, amplitude: 2 },
    { x: 1338, y: 40, width: 22, height: 280, amplitude: 2 }, { x: 1486, y: 200, width: 22, height: 130, amplitude: 2 },
    { x: 92, y: 180, width: 40, height: 90, amplitude: 1 }, { x: 1388, y: 200, width: 36, height: 80, amplitude: 1 },
  ],
  weather: (seed) => [
    celestialGlow(1360, 195, 200, [255, 170, 100], 0.3),
    driftingPuffs({ seed: seed + 1, count: 9, region: { x0: 760, x1: 1536, y0: 20, y1: 170 }, size: [120, 260], speed: 8, color: [70, 60, 92], alpha: 0.3 }),
    driftingPuffs({ seed: seed + 2, count: 10, region: { x0: 800, x1: 1500, y0: 330, y1: 520 }, size: [140, 280], speed: 5, color: [204, 208, 228], alpha: 0.12, rise: 6 }),
  ],
  motes: { count: 70, color: [236, 240, 255], amount: 0.6 },
};

export const BEAR_HONOUR = momentScript({
  id: 'bear_honour_moment',
  label: 'Après la chute du Maître Espion',
  scene: GALLERY_SCENE,
  shots: [
    // The sun goes down behind the peaks; the camera comes down to the gallery.
    { id: 'bear_peaks', seconds: 12, from: { x: 1300, y: 260, zoom: 1.45 }, to: { x: 1000, y: 520, zoom: 1.2 }, vanishing: { x: 1000, y: 560 } },
    // The company stands still among the overturned crates; the camera draws back toward the dark gallery.
    { id: 'bear_gallery', seconds: 16, from: { x: 900, y: 640, zoom: 1.2 }, to: { x: 740, y: 600, zoom: 1.05 }, vanishing: { x: 1000, y: 560 }, cast: true },
  ],
  // No Master Spy: his fate is not told. No Borin, no Seal, no ore.
  actors: [standing('marian', 0.4, 770, 690, 'RIGHT'), standing('sage_seraphine', 0.8, 940, 678, 'LEFT'), standing('maelor', 1.2, 616, 720, 'RIGHT')],
  sheets: ['marian'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7101,
});

// ——— Force: the terrace before Borin's hall at sunset, after the trial. ———

const TERRACE = BEAR_PROVISIONAL_SCENES.bear_trial_aftermath!.image!;

const TERRACE_SCENE: MomentScene = {
  image: TERRACE,
  // Whoever stands on the stairs before the doors keeps one size; the terrace recedes to the foot of the stairs.
  depth: (y) => (y < 600 ? 1.15 : 1.15 + (y - 600) * 0.0042),
  // The setting sun behind on the right, gold; its edge on the right of every figure.
  light: {
    top: [255, 214, 178], middle: [214, 172, 152], bottom: [110, 94, 114], rim: [255, 196, 120], rimAlpha: 0.55, rimOffset: [1, -1],
    shadowFrom: { x: 1250, y: 215 }, shadowReach: 0.38, shadowAlpha: 0.26,
  },
  lights: [
    { x: 225, y: 380, radius: 90, color: FIRE, power: 0.24, seed: 21 }, { x: 500, y: 384, radius: 90, color: FIRE, power: 0.24, seed: 22 },
    { x: 905, y: 280, radius: 60, color: FIRE, power: 0.18, seed: 23 }, { x: 1050, y: 400, radius: 60, color: FIRE, power: 0.18, seed: 24 },
    { x: 1455, y: 480, radius: 70, color: FIRE, power: 0.2, seed: 25 },
    { x: 70, y: 165, radius: 50, color: CANDLE, power: 0.16, seed: 26 }, { x: 750, y: 220, radius: 46, color: CANDLE, power: 0.15, seed: 27 },
  ],
  fires: [
    { x: 225, y: 394, width: 34, height: 30, base: 0.6 }, { x: 500, y: 398, width: 34, height: 30, base: 0.6 },
    { x: 905, y: 292, width: 24, height: 22, base: 0.6 }, { x: 1050, y: 412, width: 24, height: 22, base: 0.6 },
    { x: 1455, y: 494, width: 30, height: 26, base: 0.6 },
  ],
  sway: [{ x: 52, y: 110, width: 36, height: 110, amplitude: 1 }, { x: 732, y: 170, width: 36, height: 90, amplitude: 1 }],
  weather: (seed) => [
    celestialGlow(1250, 215, 220, [255, 170, 90], 0.32),
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 780, x1: 1536, y0: 20, y1: 190 }, size: [140, 280], speed: 7, color: [196, 140, 156], alpha: 0.14 }),
    driftingPuffs({ seed: seed + 2, count: 10, region: { x0: 1080, x1: 1536, y0: 300, y1: 560 }, size: [140, 280], speed: 5, color: [220, 220, 236], alpha: 0.12, rise: 6 }),
  ],
  motes: { count: 40, color: [240, 244, 255], amount: 0.5 },
  extras: {
    tint: 'rgb(16,13,18)', depth: (y) => (y < 600 ? 1.15 : 1.15 + (y - 600) * 0.0042) * 0.85,
    lit: { top: [196, 168, 150], middle: [156, 134, 128], bottom: [76, 68, 84], rim: [255, 190, 120], rimAlpha: 0.35, rimOffset: [1, -1], shadowFrom: { x: 1250, y: 215 }, shadowReach: 0.3, shadowAlpha: 0.2 },
  },
};

export const BEAR_FORCE = momentScript({
  id: 'bear_force_moment',
  label: 'Après l’épreuve de l’Ours',
  scene: TERRACE_SCENE,
  shots: [
    // The sunset over the peaks; the camera comes down onto the terrace.
    { id: 'bear_sunset', seconds: 12, from: { x: 1200, y: 300, zoom: 1.45 }, to: { x: 800, y: 480, zoom: 1.2 }, vanishing: { x: 500, y: 560 } },
    // Borin on the last step before his shut doors, two warriors at the doors, the company among the broken spears.
    { id: 'bear_terrace', seconds: 16, from: { x: 560, y: 620, zoom: 1.15 }, to: { x: 540, y: 580, zoom: 1.06 }, vanishing: { x: 500, y: 560 }, cast: true },
  ],
  // Nobody steps aside, nothing is handed over: the epilogue says the warriors let the company pass.
  actors: [
    standing('borin', 0.2, 410, 456, 'RIGHT', CHIEF_STATURE),
    standing('marian', 0.6, 640, 690, 'LEFT'), standing('sage_seraphine', 1.0, 830, 704, 'LEFT'), standing('maelor', 1.4, 960, 730, 'LEFT'),
  ],
  extras: [still('bear_warrior', 0.3, 268, 452), still('bear_warrior', 0.5, 556, 456)],
  sheets: ['marian', 'borin', 'bear_warrior'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7201,
});
