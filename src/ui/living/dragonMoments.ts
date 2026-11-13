import { DRAGON_PROVISIONAL_SCENES } from '../../campaign/plateaux/dragon/dragonPresentation';
import { CANDLE, FIRE } from '../opening/openingPainters';
import { celestialGlow, driftingPuffs, risingSpray } from './livingAtmosphere';
import { CHIEF_STATURE, momentScript, standing, still, type MomentScene } from './postDemoScenes';

/**
 * The Dragon's three moments (set 1.20.0, "Post-demo moments"; table validated 2026-11-13): the arrival before Kaelen's
 * audience, and the honour and force outcomes after their post-combat dialogues. The clear air of the heights: the sea of
 * clouds rolling under the peaks, incense from bronze braziers, bronze bells that swing without a sound, powder snow blown
 * off the needles; never the Bear's blizzard. None shows the Crystal, the Wolf or the Seal. No caption.
 */

// ——— Arrival: Kaelen's hall, open on the sky. ———

const HALL = DRAGON_PROVISIONAL_SCENES.dragon_audience!.image!;
const hallDepth = (y: number) => (y < 470 ? 1.15 : 1.15 + Math.max(0, y - 560) * 0.0036);

const HALL_SCENE: MomentScene = {
  image: HALL,
  depth: hallDepth,
  // Clear daylight through the arches on the left, pale stone around: bright, with soft shadows.
  light: {
    top: [255, 246, 230], middle: [226, 214, 206], bottom: [140, 134, 152], rim: [255, 236, 204], rimAlpha: 0.45, rimOffset: [-1, -1],
    shadowFrom: { x: 400, y: 150 }, shadowReach: 0.3, shadowAlpha: 0.22,
  },
  lights: [
    { x: 45, y: 480, radius: 70, color: FIRE, power: 0.18, seed: 31 }, { x: 350, y: 480, radius: 64, color: FIRE, power: 0.16, seed: 32 },
    { x: 800, y: 480, radius: 64, color: FIRE, power: 0.16, seed: 33 }, { x: 1055, y: 388, radius: 60, color: FIRE, power: 0.16, seed: 34 },
    { x: 1360, y: 358, radius: 60, color: FIRE, power: 0.16, seed: 35 }, { x: 1500, y: 478, radius: 64, color: FIRE, power: 0.16, seed: 36 },
    { x: 195, y: 140, radius: 50, color: CANDLE, power: 0.12, seed: 37 }, { x: 760, y: 150, radius: 50, color: CANDLE, power: 0.12, seed: 38 },
  ],
  fires: [
    { x: 45, y: 492, width: 30, height: 26, base: 0.6 }, { x: 350, y: 492, width: 26, height: 22, base: 0.6 },
    { x: 800, y: 492, width: 26, height: 22, base: 0.6 }, { x: 1055, y: 398, width: 22, height: 20, base: 0.6 },
    { x: 1360, y: 368, width: 22, height: 20, base: 0.6 }, { x: 1500, y: 488, width: 26, height: 22, base: 0.6 },
  ],
  // The bronze lanterns and the two near banners.
  sway: [
    { x: 170, y: 40, width: 50, height: 150, amplitude: 2 }, { x: 735, y: 50, width: 52, height: 150, amplitude: 2 },
    { x: 345, y: 20, width: 66, height: 330, amplitude: 2 }, { x: 960, y: 30, width: 80, height: 280, amplitude: 2 },
  ],
  shafts: { shafts: [{ top: [420, 200], bottom: [620, 700], width: [60, 220] }, { top: [610, 220], bottom: [760, 690], width: [30, 120] }], color: [255, 240, 212], alpha: 0.07 },
  weather: (seed) => [
    driftingPuffs({ seed: seed + 1, count: 12, region: { x0: 150, x1: 680, y0: 300, y1: 560 }, size: [120, 240], speed: 8, color: [250, 250, 255], alpha: 0.18 }),
    driftingPuffs({ seed: seed + 2, count: 7, region: { x0: 150, x1: 680, y0: 10, y1: 200 }, size: [100, 200], speed: 6, color: [255, 255, 255], alpha: 0.12 }),
    risingSpray({ seed: seed + 3, count: 6, x: 1090, y: 380, spread: 20, height: 120, size: 50, color: [235, 232, 226], alpha: 0.14 }),
    risingSpray({ seed: seed + 4, count: 6, x: 1372, y: 360, spread: 20, height: 120, size: 50, color: [235, 232, 226], alpha: 0.14 }),
  ],
  motes: { count: 36, color: [255, 240, 204], amount: 0.35 },
  extras: { tint: 'rgb(40,40,52)', depth: (y) => hallDepth(y) * 0.55 },
};

export const DRAGON_ARRIVAL = momentScript({
  id: 'dragon_arrival_moment',
  label: 'Arrivée chez Kaelen',
  scene: HALL_SCENE,
  shots: [
    // The hall open on the sky: the camera glides over the floor's rosette toward the steps.
    { id: 'dragon_hall', seconds: 10, from: { x: 600, y: 760, zoom: 1.32 }, to: { x: 1150, y: 470, zoom: 1.24 }, vanishing: { x: 1150, y: 560 } },
    // Kaelen waits before his seat between the two bronze dragons; the company walks in and stops at the foot of the steps.
    { id: 'dragon_steps', seconds: 16, from: { x: 1150, y: 700, zoom: 1.14 }, to: { x: 1180, y: 600, zoom: 1.05 }, vanishing: { x: 1150, y: 560 }, cast: true },
  ],
  actors: [
    standing('kaelen', 0.2, 1255, 444, 'RIGHT', CHIEF_STATURE),
    { id: 'elara', at: 1.0, from: [1000, 1090], to: [1098, 680], facing: 'RIGHT', speed: 80 },
    { id: 'sage_seraphine', at: 1.6, from: [1500, 1095], to: [1412, 690], facing: 'LEFT', speed: 80 },
    { id: 'maelor', at: 2.2, from: [860, 1095], to: [958, 714], facing: 'RIGHT', speed: 80 },
  ],
  // A few Dragon guardians far off by the columns, as scenery: no line names them.
  extras: [still('dragon_guardian', 0.3, 470, 604), still('dragon_guardian', 0.5, 640, 598), still('dragon_guardian', 0.7, 836, 596), still('dragon_guardian', 0.9, 1486, 604)],
  sheets: ['elara', 'kaelen', 'dragon_guardian'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7301,
});

// ——— Honour: the snowy ridge at dusk, after the Shadow Shaman's fall. ———

const RIDGE = DRAGON_PROVISIONAL_SCENES.dragon_shaman_aftermath!.image!;

const RIDGE_SCENE: MomentScene = {
  image: RIDGE,
  depth: (y) => 0.72 * (y - 470) / 120,
  // The sun low ahead over the clouds: the figures against the light, rimmed with gold.
  light: {
    top: [236, 206, 214], middle: [200, 180, 200], bottom: [104, 100, 134], rim: [255, 200, 150], rimAlpha: 0.6, rimOffset: [0, -1],
    shadowFrom: { x: 1040, y: 190 }, shadowReach: 0.35, shadowAlpha: 0.26,
  },
  lights: [{ x: 95, y: 410, radius: 70, color: FIRE, power: 0.2, seed: 41 }],
  fires: [{ x: 95, y: 420, width: 22, height: 18, base: 0.6 }],
  // The bronze bell on the right swings a little, without a sound.
  sway: [{ x: 1452, y: 100, width: 56, height: 130, amplitude: 2 }],
  weather: (seed) => [
    celestialGlow(1040, 190, 240, [255, 180, 110], 0.32),
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 300, x1: 1536, y0: 10, y1: 150 }, size: [140, 280], speed: 7, color: [210, 150, 170], alpha: 0.14 }),
    driftingPuffs({ seed: seed + 2, count: 12, region: { x0: 560, x1: 1200, y0: 300, y1: 600 }, size: [140, 280], speed: 5, color: [255, 226, 214], alpha: 0.14, rise: 4 }),
    driftingPuffs({ seed: seed + 3, count: 5, region: { x0: 1160, x1: 1320, y0: 30, y1: 200 }, size: [40, 90], speed: 14, color: [255, 255, 255], alpha: 0.1 }),
    risingSpray({ seed: seed + 4, count: 6, x: 95, y: 410, spread: 16, height: 90, size: 46, color: [230, 226, 220], alpha: 0.16 }),
  ],
  motes: { count: 30, color: [245, 246, 255], amount: 0.4 },
};

export const DRAGON_HONOUR = momentScript({
  id: 'dragon_honour_moment',
  label: 'Après la chute du Chaman des Ombres',
  scene: RIDGE_SCENE,
  shots: [
    // The sun sets over the sea of clouds; the camera comes down to the ridge.
    { id: 'dragon_clouds', seconds: 12, from: { x: 1040, y: 260, zoom: 1.45 }, to: { x: 800, y: 520, zoom: 1.2 }, vanishing: { x: 760, y: 560 } },
    // The company stands still on the ridge; the camera draws back.
    { id: 'dragon_ridge', seconds: 16, from: { x: 700, y: 640, zoom: 1.18 }, to: { x: 760, y: 560, zoom: 1.05 }, vanishing: { x: 760, y: 560 }, cast: true },
  ],
  // No Shaman: his fate is not told. No Kaelen, no Crystal, no Seal.
  actors: [standing('elara', 0.4, 640, 690, 'RIGHT'), standing('sage_seraphine', 0.8, 820, 700, 'LEFT'), standing('maelor', 1.2, 490, 730, 'RIGHT')],
  sheets: ['elara'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7401,
});

// ——— Force: the esplanade before the great hall at sunset, after the trial. ———

const ESPLANADE = DRAGON_PROVISIONAL_SCENES.dragon_trial_aftermath!.image!;
const esplanadeDepth = (y: number) => (y < 610 ? 1.15 : 1.15 + (y - 610) * 0.004);

const ESPLANADE_SCENE: MomentScene = {
  image: ESPLANADE,
  depth: esplanadeDepth,
  light: {
    top: [255, 216, 178], middle: [216, 174, 152], bottom: [116, 100, 120], rim: [255, 200, 128], rimAlpha: 0.55, rimOffset: [1, -1],
    shadowFrom: { x: 1345, y: 185 }, shadowReach: 0.38, shadowAlpha: 0.26,
  },
  lights: [
    { x: 55, y: 436, radius: 70, color: FIRE, power: 0.2, seed: 51 }, { x: 560, y: 450, radius: 70, color: FIRE, power: 0.2, seed: 52 },
    { x: 1500, y: 510, radius: 70, color: FIRE, power: 0.2, seed: 53 }, { x: 235, y: 390, radius: 70, color: FIRE, power: 0.2, seed: 54 },
  ],
  fires: [
    { x: 55, y: 448, width: 26, height: 20, base: 0.6 }, { x: 560, y: 463, width: 24, height: 20, base: 0.6 },
    { x: 1500, y: 523, width: 26, height: 20, base: 0.6 }, { x: 205, y: 400, width: 18, height: 22, base: 0.6 }, { x: 265, y: 400, width: 18, height: 22, base: 0.6 },
  ],
  // The two bells on the columns.
  sway: [{ x: 132, y: 80, width: 40, height: 70, amplitude: 1 }, { x: 380, y: 130, width: 36, height: 60, amplitude: 1 }],
  weather: (seed) => [
    celestialGlow(1345, 185, 220, [255, 176, 96], 0.32),
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 600, x1: 1536, y0: 20, y1: 200 }, size: [140, 280], speed: 7, color: [196, 140, 156], alpha: 0.14 }),
    driftingPuffs({ seed: seed + 2, count: 12, region: { x0: 650, x1: 1536, y0: 360, y1: 600 }, size: [140, 280], speed: 5, color: [255, 220, 200], alpha: 0.12, rise: 4 }),
    risingSpray({ seed: seed + 3, count: 5, x: 55, y: 430, spread: 16, height: 80, size: 40, color: [232, 226, 220], alpha: 0.14 }),
    risingSpray({ seed: seed + 4, count: 5, x: 560, y: 445, spread: 16, height: 80, size: 40, color: [232, 226, 220], alpha: 0.14 }),
    risingSpray({ seed: seed + 5, count: 5, x: 1500, y: 505, spread: 16, height: 80, size: 40, color: [232, 226, 220], alpha: 0.14 }),
  ],
  motes: { count: 30, color: [255, 226, 170], amount: 0.35 },
  extras: {
    tint: 'rgb(40,32,40)', depth: (y) => esplanadeDepth(y) * 0.85,
    lit: { top: [200, 170, 152], middle: [160, 136, 128], bottom: [82, 72, 88], rim: [255, 196, 128], rimAlpha: 0.35, rimOffset: [1, -1], shadowFrom: { x: 1345, y: 185 }, shadowReach: 0.3, shadowAlpha: 0.2 },
  },
};

export const DRAGON_FORCE = momentScript({
  id: 'dragon_force_moment',
  label: 'Après l’épreuve du Dragon',
  scene: ESPLANADE_SCENE,
  shots: [
    { id: 'dragon_sunset', seconds: 12, from: { x: 1300, y: 270, zoom: 1.45 }, to: { x: 800, y: 480, zoom: 1.2 }, vanishing: { x: 520, y: 600 } },
    // Kaelen on the steps of his hall, two guardians at the doors, the company on the esplanade facing him.
    { id: 'dragon_esplanade', seconds: 16, from: { x: 520, y: 640, zoom: 1.15 }, to: { x: 500, y: 590, zoom: 1.06 }, vanishing: { x: 520, y: 600 }, cast: true },
  ],
  // Nobody steps aside: the epilogue says the guardians let the company pass.
  actors: [
    standing('kaelen', 0.2, 250, 456, 'RIGHT', CHIEF_STATURE),
    standing('elara', 0.6, 520, 690, 'LEFT'), standing('sage_seraphine', 1.0, 700, 706, 'LEFT'), standing('maelor', 1.4, 840, 736, 'LEFT'),
  ],
  extras: [still('dragon_guardian', 0.3, 120, 458), still('dragon_guardian', 0.5, 410, 462)],
  sheets: ['elara', 'kaelen', 'dragon_guardian'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7501,
});
