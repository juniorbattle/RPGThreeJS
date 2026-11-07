import type { FireSpot, SheetBook, ShotPainter } from '../opening/openingPainters';
import { ash, CANDLE, FIRE, paintedFires, paintLights } from '../opening/openingPainters';
import { PropLayer, type Light, type Rgb } from '../opening/openingLayer';
import type { LivingScript } from './LivingTableauPlayer';
import { bannerSway, celestialGlow, driftingPuffs, risingSpray, type Banner } from './livingAtmosphere';
import { FigureCast, placeCast, type DepthScale, type FigureLight, type Walker } from './livingFigures';

/**
 * The two route endings of set 1.14.0 (OD-2026-11-04-B). Each plays once its aftermath dialogue has resolved the Shadow
 * disclosure, on that dialogue's own tableau, and before the epilogue. Each shows only the established facts of its
 * route: the place, its light and weather, the company. Neither shows the Seal, held or handed over, nor anything the
 * epilogue tells first. No caption.
 */
const TABLEAU = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/';
export const SERPENT_ENDING_IMAGE = `${TABLEAU}serpent-finale-tableau-aftermath.png`;
export const TRIAL_ENDING_IMAGE = `${TABLEAU}lion-trial-tableau-aftermath.png`;

/** A figure who stands where they are from the start of the shot and breathes there. */
const standing = (id: string, at: number, x: number, y: number, facing: Walker['facing']): Walker => ({ id, at, from: [x, y], to: [x, y], facing, speed: 60 });

interface EndingScene {
  image: string;
  depth: DepthScale;
  light: FigureLight;
  lights: readonly Light[];
  fires: readonly FireSpot[];
  banners: readonly Banner[];
  sky: (seed: number) => Array<(frame: Parameters<ShotPainter>[0]) => void>;
  dust: Rgb;
}

function endingPainter(scene: EndingScene, sheets: SheetBook, actors: readonly Walker[], seed: number): ShotPainter {
  const sky = scene.sky(seed);
  const banners = bannerSway(scene.image, scene.banners, seed);
  const fires = paintedFires(scene.fires, seed);
  const layer = new PropLayer();
  const cast = new FigureCast(scene.light);
  const motes = ash(40, seed + 5, scene.dust);
  return (frame) => {
    const { ctx, camera, seconds, reduced } = frame;
    for (const paint of sky) paint(frame);
    banners(frame);
    paintLights(frame, scene.lights);
    fires(frame);
    const props = layer.begin();
    if (props) {
      cast.draw(props, placeCast(actors, sheets, seconds, reduced, scene.depth), seconds);
      layer.present(ctx, camera);
    }
    motes.paint(frame, 0.4);
  };
}

// ——— The Serpent pursuit: the ruins at night, after the general's fall. ———

/** The esplanade recedes gently toward the steps. */
export const ruinsDepth: DepthScale = (y) => 2.0 * (y - 200) / 490;

const RUINS: EndingScene = {
  image: SERPENT_ENDING_IMAGE,
  depth: ruinsDepth,
  // Moonlight from above and behind, cold; the two braziers warm the sides.
  light: {
    top: [156, 170, 220], middle: [112, 122, 172], bottom: [58, 60, 94], rim: [176, 204, 255], rimAlpha: 0.55, rimOffset: [0, -1],
    shadowFrom: { x: 1035, y: 80 }, shadowReach: 0.3, shadowAlpha: 0.3,
  },
  lights: [
    { x: 525, y: 405, radius: 120, color: FIRE, power: 0.3, seed: 61 }, { x: 1250, y: 405, radius: 120, color: FIRE, power: 0.3, seed: 62 },
    { x: 270, y: 545, radius: 40, color: CANDLE, power: 0.18, seed: 63 }, { x: 1545, y: 560, radius: 40, color: CANDLE, power: 0.18, seed: 64 },
  ],
  fires: [{ x: 525, y: 420, width: 30, height: 28, base: 0.6 }, { x: 1250, y: 420, width: 30, height: 28, base: 0.6 }],
  // The torn Serpent banner, on its rod at the top right.
  banners: [{ x: 1368, y: 80, width: 104, height: 318, amplitude: 4 }],
  sky: (seed) => [
    celestialGlow(1035, 80, 120, [150, 180, 255], 0.3),
    driftingPuffs({ seed: seed + 1, count: 9, region: { x0: 640, x1: 1460, y0: 40, y1: 150 }, size: [120, 260], speed: 9, color: [22, 30, 58], alpha: 0.42 }),
    driftingPuffs({ seed: seed + 2, count: 12, region: { x0: 620, x1: 1200, y0: 290, y1: 430 }, size: [140, 280], speed: 6, color: [150, 166, 204], alpha: 0.1, rise: 6 }),
    risingSpray({ seed: seed + 3, count: 8, x: 905, y: 348, spread: 40, height: 50, size: 70, color: [190, 205, 235], alpha: 0.16 }),
  ],
  dust: [170, 190, 235],
};

/** Alistair, Séraphine and Maelor on the mosaic, still. No artefact in view: in one branch the proof went to Alaric. */
export const SERPENT_ENDING_ACTORS: readonly Walker[] = [
  standing('alistair', 0.4, 885, 680, 'RIGHT'),
  standing('sage_seraphine', 0.8, 1055, 690, 'LEFT'),
  standing('maelor', 1.2, 725, 705, 'RIGHT'),
];

export const SERPENT_ROUTE_ENDING: LivingScript = {
  id: 'serpent_route_ending',
  label: 'Fin de la poursuite Serpent',
  shots: [
    // The moon behind passing clouds; the camera comes down to the esplanade.
    { id: 'serpent_moon', image: SERPENT_ENDING_IMAGE, seconds: 12, from: { x: 1035, y: 250, zoom: 1.5 }, to: { x: 920, y: 470, zoom: 1.22 }, vanishing: { x: 905, y: 500 } },
    // The company stands on the mosaic under the torn banner; the camera rises back toward the moon.
    { id: 'serpent_esplanade', image: SERPENT_ENDING_IMAGE, seconds: 20, from: { x: 920, y: 620, zoom: 1.25 }, to: { x: 990, y: 400, zoom: 1.12 }, vanishing: { x: 905, y: 500 } },
  ],
  sheets: ['alistair'],
  portraits: ['sage_seraphine', 'maelor'],
  painter(shotId, sheets) {
    return shotId === 'serpent_moon' ? endingPainter(RUINS, sheets, [], 5101) : endingPainter(RUINS, sheets, SERPENT_ENDING_ACTORS, 5111);
  },
  backdrop() {
    return endingPainter(RUINS, new Map(), [], 5121);
  },
};

// ——— The Lion trial: the terrace at sunset, after the champion's defeat. ———

/** The terrace recedes to the foot of the stairs; whoever stands on the stairs keeps one size. */
export const terraceDepth: DepthScale = (y) => (y < 480 ? 1.3 : 2.0 * (y - 120) / 530);

const TERRACE: EndingScene = {
  image: TRIAL_ENDING_IMAGE,
  depth: terraceDepth,
  // The setting sun behind on the right, gold; its edge on the right of every figure.
  light: {
    top: [255, 216, 176], middle: [216, 172, 152], bottom: [122, 98, 120], rim: [255, 204, 128], rimAlpha: 0.6, rimOffset: [1, -1],
    shadowFrom: { x: 1210, y: 192 }, shadowReach: 0.4, shadowAlpha: 0.28,
  },
  lights: [
    { x: 668, y: 322, radius: 70, color: FIRE, power: 0.22, seed: 71 }, { x: 1003, y: 322, radius: 70, color: FIRE, power: 0.22, seed: 72 },
    { x: 26, y: 545, radius: 140, color: FIRE, power: 0.28, seed: 73 }, { x: 1636, y: 552, radius: 140, color: FIRE, power: 0.28, seed: 74 },
    { x: 860, y: 370, radius: 60, color: CANDLE, power: 0.16, seed: 75 },
  ],
  fires: [
    { x: 668, y: 338, width: 20, height: 26, base: 0.6 }, { x: 1003, y: 338, width: 20, height: 26, base: 0.6 },
    { x: 26, y: 566, width: 46, height: 52, base: 0.7 }, { x: 1636, y: 574, width: 44, height: 48, base: 0.7 },
  ],
  // The two star banners on their poles, left and right.
  banners: [{ x: 40, y: 34, width: 96, height: 356, amplitude: 3 }, { x: 1540, y: 34, width: 96, height: 356, amplitude: 3 }],
  sky: (seed) => [
    celestialGlow(1210, 192, 230, [255, 176, 96], 0.32),
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 180, x1: 1500, y0: 24, y1: 150 }, size: [140, 300], speed: 7, color: [196, 140, 156], alpha: 0.12 }),
    risingSpray({ seed: seed + 2, count: 9, x: 382, y: 392, spread: 90, height: 60, size: 80, color: [236, 226, 236], alpha: 0.16 }),
    risingSpray({ seed: seed + 3, count: 6, x: 1256, y: 398, spread: 50, height: 40, size: 60, color: [236, 226, 236], alpha: 0.12 }),
  ],
  dust: [255, 222, 160],
};

/** Alaric on the stairs; Alistair, Séraphine and Maelor on the lion mosaic. The champion does not appear. */
export const TRIAL_ENDING_ACTORS: readonly Walker[] = [
  standing('alaric', 0.2, 838, 392, 'LEFT'),
  standing('alistair', 0.6, 790, 650, 'RIGHT'),
  standing('sage_seraphine', 1.0, 965, 660, 'LEFT'),
  standing('maelor', 1.4, 635, 685, 'RIGHT'),
];

export const LION_TRIAL_ROUTE_ENDING: LivingScript = {
  id: 'lion_trial_route_ending',
  label: 'Fin de l’épreuve du Lion',
  shots: [
    // The sun going down behind the hills; the camera comes down to the terrace.
    { id: 'trial_sunset', image: TRIAL_ENDING_IMAGE, seconds: 12, from: { x: 1150, y: 260, zoom: 1.45 }, to: { x: 838, y: 420, zoom: 1.18 }, vanishing: { x: 838, y: 470 } },
    // Alaric on the stairs, the company on the mosaic.
    { id: 'trial_terrace', image: TRIAL_ENDING_IMAGE, seconds: 18, from: { x: 838, y: 560, zoom: 1.18 }, to: { x: 838, y: 520, zoom: 1.06 }, vanishing: { x: 838, y: 470 } },
  ],
  sheets: ['alistair'],
  portraits: ['alaric', 'sage_seraphine', 'maelor'],
  painter(shotId, sheets) {
    return shotId === 'trial_sunset' ? endingPainter(TERRACE, sheets, [], 5201) : endingPainter(TERRACE, sheets, TRIAL_ENDING_ACTORS, 5211);
  },
  backdrop() {
    return endingPainter(TERRACE, new Map(), [], 5221);
  },
};
