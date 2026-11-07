import type { FireSpot, SheetBook, ShotPainter } from '../opening/openingPainters';
import { ash, CANDLE, FIRE, paintedFires, paintLights } from '../opening/openingPainters';
import { PropLayer, type Light } from '../opening/openingLayer';
import type { LivingScript } from './LivingTableauPlayer';
import { FigureCast, placeCast, type DepthScale, type FigureLight, type Walker } from './livingFigures';

/**
 * `lion_judgement`, before `lion_finale_judgement` (set 1.13.0, OD-2026-11-04-A). Established by `final_refuge`: the
 * company reaches the Lion's camp and goes in ("Entrons"). Alaric waits alone before his throne, without the champion,
 * and without a gesture of verdict; the sequence ends before he speaks, so his verdict, the choice and the trial stay
 * with the dialogue and the fight. No caption.
 */
const IMAGE = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/lion-judgement-tableau.png';

/**
 * The hall's floor recedes to a horizon near the foot of the throne; the dais is raised, so whoever stands on it keeps
 * the size of the foot of the stairs.
 */
export const hallDepth: DepthScale = (y) => (y < 500 ? 1.6 : 1.6 * (y - 360) / 200);

const ALARIC: Walker = { id: 'alaric', at: 0.2, from: [836, 446], to: [836, 446], facing: 'RIGHT', speed: 60 };

/** Alaric, and three of the company: Alistair, Séraphine and Maelor, as at the audience. Four narrative actors. */
export const JUDGEMENT_ACTORS: readonly Walker[] = [
  ALARIC,
  { id: 'alistair', at: 0.6, from: [650, 935], to: [680, 642], facing: 'RIGHT', speed: 80 },
  { id: 'sage_seraphine', at: 1.2, from: [1045, 935], to: [1005, 652], facing: 'LEFT', speed: 80 },
  { id: 'maelor', at: 1.8, from: [470, 945], to: [515, 690], facing: 'RIGHT', speed: 80 },
];

const BRAZIERS: readonly FireSpot[] = [
  { x: 452, y: 340, width: 44, height: 42, base: 0.7 }, { x: 1224, y: 340, width: 44, height: 42, base: 0.7 },
  { x: 96, y: 394, width: 40, height: 38, base: 0.7 }, { x: 1576, y: 394, width: 40, height: 38, base: 0.7 },
];
const HALL_LIGHTS: readonly Light[] = [
  { x: 452, y: 320, radius: 150, color: FIRE, power: 0.26, seed: 31 }, { x: 1224, y: 320, radius: 150, color: FIRE, power: 0.26, seed: 32 },
  { x: 96, y: 376, radius: 120, color: FIRE, power: 0.22, seed: 33 }, { x: 1576, y: 376, radius: 120, color: FIRE, power: 0.22, seed: 34 },
  { x: 655, y: 345, radius: 60, color: CANDLE, power: 0.2, seed: 35 }, { x: 952, y: 345, radius: 60, color: CANDLE, power: 0.2, seed: 36 },
  { x: 1015, y: 380, radius: 50, color: CANDLE, power: 0.18, seed: 37 }, { x: 300, y: 400, radius: 50, color: CANDLE, power: 0.18, seed: 38 },
  { x: 1360, y: 400, radius: 50, color: CANDLE, power: 0.18, seed: 39 },
];
/** Gold of the braziers and candles from the front and above, daylight behind: warm and bright, darks kept. */
const HALL_LIGHT: FigureLight = {
  top: [255, 236, 204], middle: [226, 202, 180], bottom: [150, 134, 144], rim: [255, 214, 150], rimAlpha: 0.5, rimOffset: [0, -1],
  shadowFrom: { x: 836, y: 240 }, shadowReach: 0.34, shadowAlpha: 0.24,
};

function hallPainter(sheets: SheetBook, actors: readonly Walker[], seed: number): ShotPainter {
  const fires = paintedFires(BRAZIERS, seed);
  const layer = new PropLayer();
  const cast = new FigureCast(HALL_LIGHT);
  const dust = ash(46, seed + 5, [255, 222, 160]);
  return (frame) => {
    const { ctx, camera, seconds, reduced } = frame;
    paintLights(frame, HALL_LIGHTS);
    fires(frame);
    const props = layer.begin();
    if (props) {
      cast.draw(props, placeCast(actors, sheets, seconds, reduced, hallDepth), seconds);
      layer.present(ctx, camera);
    }
    dust.paint(frame, 0.5);
  };
}

export const LION_JUDGEMENT: LivingScript = {
  id: 'lion_judgement',
  label: 'Jugement du Lion',
  shots: [
    // The banners and the throne: Alaric waits.
    { id: 'judgement_throne', image: IMAGE, seconds: 10, from: { x: 836, y: 290, zoom: 1.38 }, to: { x: 836, y: 420, zoom: 1.16 }, vanishing: { x: 836, y: 560 } },
    // The hall from its entrance: the company walks in and stops at the foot of the stairs.
    { id: 'judgement_hall', image: IMAGE, seconds: 18, from: { x: 836, y: 640, zoom: 1.12 }, to: { x: 836, y: 600, zoom: 1.03 }, vanishing: { x: 836, y: 560 } },
  ],
  sheets: ['alistair'],
  portraits: ['alaric', 'sage_seraphine', 'maelor'],
  painter(shotId, sheets) {
    return shotId === 'judgement_throne' ? hallPainter(sheets, [ALARIC], 3601) : hallPainter(sheets, JUDGEMENT_ACTORS, 3611);
  },
  backdrop() {
    return hallPainter(new Map(), [], 3621);
  },
};
