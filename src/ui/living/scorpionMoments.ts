import { SCORPION_PROVISIONAL_SCENES } from '../../campaign/plateaux/scorpion/scorpionPresentation';
import { CANDLE } from '../opening/openingPainters';
import { celestialGlow, driftingPuffs } from './livingAtmosphere';
import { CHIEF_STATURE, momentScript, standing, still, type MomentScene } from './postDemoScenes';

/**
 * The Scorpion's three moments (set 1.20.0, "Post-demo moments"; table validated 2026-11-13). Kestrel accompanies the
 * advisers on this plateau (operator, 2026-11-13). The desert's hard light: shafts of sun through the lattices with dust
 * turning in them, sand torn off the crests, striped awnings that stir, pierced copper lamps, the amber and copper of
 * dusk; the Shadows' ink is black, never purple. None shows the codex, the temple or the Seal. No caption.
 */

// ——— Arrival: the Grand Inquisiteur's hall of records, lit from above. ———

const ARCHIVES = SCORPION_PROVISIONAL_SCENES.scorpion_audience!.image!;
const archivesDepth = (y: number) => (y < 600 ? 1.2 : 1.2 + Math.max(0, y - 640) * 0.0036);

const LAMPS = [
  { x: 740, y: 170 }, { x: 920, y: 195 }, { x: 1175, y: 195 }, { x: 1365, y: 160 }, { x: 40, y: 320 }, { x: 78, y: 592 }, { x: 1515, y: 690 },
];

const ARCHIVES_SCENE: MomentScene = {
  image: ARCHIVES,
  depth: archivesDepth,
  // Hard sunlight from the lattices above, warm on top; the copper lamps around.
  light: {
    top: [255, 236, 200], middle: [230, 200, 170], bottom: [130, 110, 112], rim: [255, 220, 150], rimAlpha: 0.5, rimOffset: [0, -1],
    shadowFrom: { x: 1040, y: 60 }, shadowReach: 0.3, shadowAlpha: 0.26,
  },
  lights: LAMPS.map((lamp, index) => ({ ...lamp, radius: 46, color: CANDLE, power: 0.16, seed: 61 + index })),
  // The four hanging lamps swing a little; the banners stay still indoors.
  sway: [
    { x: 722, y: 120, width: 40, height: 100, amplitude: 1 }, { x: 900, y: 150, width: 44, height: 100, amplitude: 1 },
    { x: 1155, y: 150, width: 44, height: 100, amplitude: 1 }, { x: 1345, y: 110, width: 42, height: 100, amplitude: 1 },
  ],
  shafts: {
    shafts: [{ top: [840, 90], bottom: [700, 760], width: [40, 200] }, { top: [1045, 90], bottom: [980, 780], width: [100, 260] }, { top: [1250, 90], bottom: [1350, 760], width: [40, 200] }],
    color: [255, 226, 160], alpha: 0.08,
  },
  motes: { count: 60, color: [255, 232, 180], amount: 0.45 },
  extras: { tint: 'rgb(46,34,30)', depth: (y) => archivesDepth(y) * 0.55 },
};

export const SCORPION_ARRIVAL = momentScript({
  id: 'scorpion_arrival_moment',
  label: 'Arrivée chez le Grand Inquisiteur',
  scene: ARCHIVES_SCENE,
  shots: [
    // The hall of records: dust turns in the shafts of sun; the camera glides along the carpet to the dais.
    { id: 'scorpion_hall', seconds: 10, from: { x: 760, y: 800, zoom: 1.32 }, to: { x: 1035, y: 520, zoom: 1.24 }, vanishing: { x: 1035, y: 640 } },
    // The Grand Inquisiteur waits before his seat; the company walks in and stops at the foot of the steps.
    { id: 'scorpion_steps', seconds: 16, from: { x: 1035, y: 760, zoom: 1.14 }, to: { x: 1035, y: 660, zoom: 1.05 }, vanishing: { x: 1035, y: 640 }, cast: true },
  ],
  actors: [
    standing('grand_inquisitor', 0.2, 1035, 566, 'RIGHT', CHIEF_STATURE),
    { id: 'kestrel', at: 1.0, from: [780, 1090], to: [872, 714], facing: 'RIGHT', speed: 80 },
    { id: 'sage_seraphine', at: 1.6, from: [1300, 1095], to: [1200, 720], facing: 'LEFT', speed: 80 },
    { id: 'maelor', at: 2.2, from: [640, 1095], to: [736, 746], facing: 'RIGHT', speed: 80 },
  ],
  // A few scholars far off among the desks and shelves, still: the arrival names the clan's scholars, none speaks.
  extras: [still('scorpion_scholar', 0.3, 560, 652), still('scorpion_scholar', 0.5, 650, 648), still('scorpion_scholar', 0.7, 1290, 650), still('scorpion_scholar', 0.9, 1400, 656)],
  sheets: ['kestrel', 'grand_inquisitor', 'scorpion_scholar'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7601,
});

// ——— Honour: the dune crest at dusk, after the Shadow Prophet's fall. ———

const CREST = SCORPION_PROVISIONAL_SCENES.scorpion_prophet_aftermath!.image!;

const CREST_SCENE: MomentScene = {
  image: CREST,
  depth: (y) => 0.45 + (y - 300) * 0.0025,
  // The sun low ahead: the figures against the light, rimmed with gold.
  light: {
    top: [255, 206, 152], middle: [226, 172, 132], bottom: [120, 86, 82], rim: [255, 200, 120], rimAlpha: 0.6, rimOffset: [0, -1],
    shadowFrom: { x: 1095, y: 118 }, shadowReach: 0.4, shadowAlpha: 0.28,
  },
  weather: (seed) => [
    celestialGlow(1095, 118, 230, [255, 190, 100], 0.34),
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 0, x1: 1536, y0: 0, y1: 100 }, size: [140, 280], speed: 6, color: [255, 190, 140], alpha: 0.1 }),
    // A veil of sand torn off the crest by the wind.
    driftingPuffs({ seed: seed + 2, count: 12, region: { x0: 680, x1: 1120, y0: 330, y1: 660 }, size: [60, 140], speed: 18, color: [236, 192, 122], alpha: 0.1 }),
  ],
  // Sand in the air, and a few of the Prophet's loose leaves lifting and settling.
  motes: { count: 44, color: [240, 204, 146], amount: 0.38 },
};

export const SCORPION_HONOUR = momentScript({
  id: 'scorpion_honour_moment',
  label: 'Après la chute du Prophète des Ombres',
  scene: CREST_SCENE,
  shots: [
    { id: 'scorpion_sunset', seconds: 12, from: { x: 1095, y: 220, zoom: 1.45 }, to: { x: 900, y: 480, zoom: 1.2 }, vanishing: { x: 900, y: 480 } },
    // The company stands still on the crest.
    { id: 'scorpion_crest', seconds: 16, from: { x: 820, y: 640, zoom: 1.16 }, to: { x: 860, y: 560, zoom: 1.05 }, vanishing: { x: 900, y: 480 }, cast: true },
  ],
  // No Prophet: his fate is not told. No Grand Inquisiteur, no codex, no Seal.
  actors: [standing('kestrel', 0.4, 830, 612, 'RIGHT'), standing('sage_seraphine', 0.8, 980, 640, 'LEFT'), standing('maelor', 1.2, 690, 690, 'RIGHT')],
  sheets: ['kestrel'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7701,
});

// ——— Force: the courtyard of the house of records at sunset, after the trial. ———

const COURTYARD = SCORPION_PROVISIONAL_SCENES.scorpion_trial_aftermath!.image!;
const courtyardDepth = (y: number) => (y < 620 ? 1.1 : 1.1 + (y - 620) * 0.004);

const COURTYARD_SCENE: MomentScene = {
  image: COURTYARD,
  depth: courtyardDepth,
  light: {
    top: [255, 214, 160], middle: [220, 170, 132], bottom: [120, 90, 92], rim: [255, 196, 120], rimAlpha: 0.55, rimOffset: [1, -1],
    shadowFrom: { x: 1160, y: 125 }, shadowReach: 0.38, shadowAlpha: 0.26,
  },
  lights: [
    { x: 100, y: 300 }, { x: 280, y: 370 }, { x: 380, y: 400 }, { x: 612, y: 430 }, { x: 1100, y: 425 }, { x: 1360, y: 395 }, { x: 1465, y: 360 },
  ].map((lamp, index) => ({ ...lamp, radius: 44, color: CANDLE, power: 0.16, seed: 71 + index })),
  // The striped awnings and the two banners by the doors stir in the evening wind.
  sway: [
    { x: 96, y: 190, width: 150, height: 100, amplitude: 1 }, { x: 290, y: 290, width: 160, height: 90, amplitude: 1 },
    { x: 1100, y: 345, width: 190, height: 65, amplitude: 1 }, { x: 1300, y: 280, width: 180, height: 80, amplitude: 1 },
    { x: 688, y: 210, width: 44, height: 190, amplitude: 1 }, { x: 993, y: 210, width: 44, height: 190, amplitude: 1 },
  ],
  weather: (seed) => [
    celestialGlow(1160, 125, 200, [255, 180, 100], 0.3),
    driftingPuffs({ seed: seed + 1, count: 8, region: { x0: 420, x1: 1300, y0: 0, y1: 110 }, size: [140, 260], speed: 6, color: [255, 190, 140], alpha: 0.1 }),
  ],
  motes: { count: 40, color: [255, 222, 170], amount: 0.35 },
  extras: {
    tint: 'rgb(46,34,30)', depth: (y) => courtyardDepth(y) * 0.85,
    lit: { top: [200, 164, 130], middle: [164, 128, 104], bottom: [84, 64, 64], rim: [255, 196, 120], rimAlpha: 0.35, rimOffset: [1, -1], shadowFrom: { x: 1160, y: 125 }, shadowReach: 0.3, shadowAlpha: 0.2 },
  },
};

export const SCORPION_FORCE = momentScript({
  id: 'scorpion_force_moment',
  label: 'Après l’épreuve du Scorpion',
  scene: COURTYARD_SCENE,
  shots: [
    { id: 'scorpion_walls', seconds: 12, from: { x: 1160, y: 200, zoom: 1.42 }, to: { x: 860, y: 420, zoom: 1.2 }, vanishing: { x: 860, y: 620 } },
    // The Grand Inquisiteur before his shut doors, two scholars under the arcades, the company in the courtyard.
    { id: 'scorpion_courtyard', seconds: 16, from: { x: 860, y: 700, zoom: 1.15 }, to: { x: 860, y: 620, zoom: 1.05 }, vanishing: { x: 860, y: 620 }, cast: true },
  ],
  actors: [
    standing('grand_inquisitor', 0.2, 860, 592, 'RIGHT', CHIEF_STATURE),
    standing('kestrel', 0.6, 680, 790, 'RIGHT'), standing('sage_seraphine', 1.0, 1040, 800, 'LEFT'), standing('maelor', 1.4, 540, 824, 'RIGHT'),
  ],
  extras: [still('scorpion_scholar', 0.3, 330, 602), still('scorpion_scholar', 0.5, 1350, 604)],
  sheets: ['kestrel', 'grand_inquisitor', 'scorpion_scholar'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 7801,
});
