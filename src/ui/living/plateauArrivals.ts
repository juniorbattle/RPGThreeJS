import { BEAR_PROVISIONAL_SCENES } from '../../campaign/plateaux/bear/bearPresentation';
import type { FireSpot } from '../opening/openingPainters';
import { CANDLE, FIRE } from '../opening/openingPainters';
import type { Light } from '../opening/openingLayer';
import { momentScript, POST_DEMO_FRAME, type MomentScene } from './postDemoScenes';
export { POST_DEMO_FRAME };
import type { Banner } from './livingAtmosphere';
import type { DepthScale, Extra, FigureLight, Walker } from './livingFigures';

/**
 * `bear_arrival_moment`, before `bear_audience`, the chief's first dialogue (set 1.20.0, "Post-demo moments"; table
 * validated 2026-11-13). Built first as the mock-up of PLATEAU_MOMENTS_DRAFT_2026-11-13 (question 4), which the operator
 * judged in motion: « Elle convainc ». Established by `bear_arrival`: the company reaches the Mountains of Resilience,
 * which the Bear clan guards. Borin's hall in its firelight; the company walks in and stops at the foot of the steps,
 * where Borin waits before his stone seat. The sequence ends before he speaks and shows neither the Raven, the mines, the
 * request, the Seal nor the rumours of Bois-Clair: his first lines say them. No caption.
 */
export const BEAR_HALL_IMAGE = BEAR_PROVISIONAL_SCENES.bear_audience!.image!;

/** The hall floor recedes to the foot of the steps; the dais is raised, so whoever stands on it keeps one size. */
export const bearHallDepth: DepthScale = (y) => (y < 560 ? 1.2 : 1.2 + (y - 560) * 0.0036);

/**
 * Borin comes from his combat sheet, a boss sheet two cells high: brought back to a tall man's height among the company,
 * never a giant. His closed, bear-crowned helm covers his face (OD-2026-11-11-G); he faces the hall as he was drawn.
 */
export const BORIN_STATURE = 0.56;
const BORIN: Walker = { id: 'borin', at: 0.2, from: [1020, 516], to: [1020, 516], facing: 'RIGHT', speed: 60, stature: BORIN_STATURE };

/** Borin, and Marian, Séraphine and Maelor, the company of the audience (Marian accompanies the advisers on the Bear's plateau). */
export const BEAR_ARRIVAL_ACTORS: readonly Walker[] = [
  BORIN,
  { id: 'marian', at: 1.0, from: [760, 1090], to: [858, 668], facing: 'RIGHT', speed: 80 },
  { id: 'sage_seraphine', at: 1.6, from: [1300, 1095], to: [1186, 676], facing: 'LEFT', speed: 80 },
  { id: 'maelor', at: 2.2, from: [620, 1095], to: [716, 700], facing: 'RIGHT', speed: 80 },
];

/**
 * A few Bear warriors standing far off at the back of the hall, unlit, as scenery (proposition): no line names them, so
 * they never come forward, and they are drawn smaller than the floor would make them, behind the company.
 */
export const BEAR_HALL_WARRIORS: readonly Extra[] = [
  { id: 'bear_warrior', at: 0.3, seconds: 1, from: [648, 594], to: [648, 594] },
  { id: 'bear_warrior', at: 0.5, seconds: 1, from: [744, 592], to: [744, 592] },
  { id: 'bear_warrior', at: 0.7, seconds: 1, from: [1296, 592], to: [1296, 592] },
  { id: 'bear_warrior', at: 0.9, seconds: 1, from: [1392, 596], to: [1392, 596] },
];
export const bearWarriorDepth: DepthScale = (y) => bearHallDepth(y) * 0.55;

/** The two braziers at the foot of the stone seat and the fire basket on the right. */
const HALL_FIRES: readonly FireSpot[] = [
  { x: 880, y: 426, width: 40, height: 44, base: 0.7 }, { x: 1160, y: 420, width: 40, height: 46, base: 0.7 },
  { x: 1502, y: 520, width: 46, height: 44, base: 0.7 },
];
const HALL_LIGHTS: readonly Light[] = [
  { x: 880, y: 400, radius: 170, color: FIRE, power: 0.26, seed: 81 }, { x: 1160, y: 395, radius: 170, color: FIRE, power: 0.26, seed: 82 },
  { x: 1502, y: 505, radius: 130, color: FIRE, power: 0.22, seed: 83 },
  // The iron chandeliers' candles.
  { x: 366, y: 160, radius: 90, color: CANDLE, power: 0.2, seed: 84 }, { x: 656, y: 258, radius: 64, color: CANDLE, power: 0.18, seed: 85 },
  { x: 1306, y: 250, radius: 64, color: CANDLE, power: 0.18, seed: 86 },
  // Torches on the walls and pillars, and the lantern on the near table.
  { x: 246, y: 246, radius: 52, color: CANDLE, power: 0.16, seed: 87 }, { x: 580, y: 336, radius: 46, color: CANDLE, power: 0.15, seed: 88 },
  { x: 708, y: 430, radius: 40, color: CANDLE, power: 0.14, seed: 89 }, { x: 1378, y: 336, radius: 46, color: CANDLE, power: 0.15, seed: 90 },
  { x: 306, y: 446, radius: 36, color: CANDLE, power: 0.13, seed: 91 }, { x: 1280, y: 470, radius: 36, color: CANDLE, power: 0.13, seed: 92 },
  { x: 66, y: 676, radius: 54, color: CANDLE, power: 0.18, seed: 93 },
];
/** The two Bear banners on either side of the seat: indoors, they barely stir. */
const HALL_BANNERS: readonly Banner[] = [
  { x: 758, y: 150, width: 104, height: 290, amplitude: 2 }, { x: 1172, y: 142, width: 110, height: 298, amplitude: 2 },
];
/** Firelight from the braziers in front and above, amber on stone: warm on top, the granite's cold in the darks. */
const HALL_LIGHT: FigureLight = {
  top: [255, 214, 172], middle: [212, 178, 156], bottom: [112, 96, 108], rim: [255, 178, 96], rimAlpha: 0.5, rimOffset: [0, -1],
  shadowFrom: { x: 1020, y: 400 }, shadowReach: 0.32, shadowAlpha: 0.26,
};

const HALL_SCENE: MomentScene = {
  image: BEAR_HALL_IMAGE,
  depth: bearHallDepth,
  light: HALL_LIGHT,
  lights: HALL_LIGHTS,
  fires: HALL_FIRES,
  sway: HALL_BANNERS,
  motes: { count: 40, color: [255, 210, 160], amount: 0.4 },
  extras: { tint: 'rgb(16,13,18)', depth: bearWarriorDepth },
};

export const BEAR_ARRIVAL = momentScript({
  id: 'bear_arrival_moment',
  label: 'Arrivée chez Borin',
  scene: HALL_SCENE,
  shots: [
    // The empty hall in its firelight: the camera glides low over the flagstones toward the steps.
    { id: 'bear_hall', seconds: 10, from: { x: 760, y: 760, zoom: 1.34 }, to: { x: 1010, y: 470, zoom: 1.26 }, vanishing: { x: 1010, y: 560 } },
    // Borin waits before his stone seat; the company walks in from the viewer and stops at the foot of the steps.
    { id: 'bear_steps', seconds: 16, from: { x: 980, y: 700, zoom: 1.14 }, to: { x: 1000, y: 610, zoom: 1.05 }, vanishing: { x: 1010, y: 560 }, cast: true },
  ],
  actors: BEAR_ARRIVAL_ACTORS,
  extras: BEAR_HALL_WARRIORS,
  sheets: ['marian', 'borin', 'bear_warrior'],
  portraits: ['sage_seraphine', 'maelor'],
  seed: 6101,
});
