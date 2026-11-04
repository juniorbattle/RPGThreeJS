import type { FireSpot, SheetBook, ShotPainter } from '../opening/openingPainters';
import { ash, CANDLE, FIRE, paintedFires, paintLights } from '../opening/openingPainters';
import { PropLayer, type Light } from '../opening/openingLayer';
import type { LivingScript } from './LivingTableauPlayer';
import { bannerSway, lightShafts, type Banner, type Shaft } from './livingAtmosphere';
import { ExtraCrowd, FigureCast, placeCast, type DepthScale, type Extra, type FigureLight, type Walker } from './livingFigures';

/**
 * `alaric_audience_arrival`, before `lion_briefing` (set 1.14.0, OD-2026-11-04-B). Established by `camp_departure`:
 * the defeated clan, its banner sewn again, four fighters, leaves the camp for the audience. The hall in daylight; the
 * company walks up the carpet and stops at the foot of the stairs, where Alaric waits before his throne. The sequence
 * ends before he speaks, and shows neither Bois-Clair nor the Seal: his first line says both. No caption.
 */
export const AUDIENCE_IMAGE = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/alaric-audience-tableau.png';

/** The floor recedes to the foot of the stairs; the dais is raised, so whoever stands on it keeps one size. */
export const audienceDepth: DepthScale = (y) => (y < 500 ? 1.55 : 1.9 * (y - 380) / 200);

const ALARIC: Walker = { id: 'alaric', at: 0.2, from: [1245, 452], to: [1245, 452], facing: 'LEFT', speed: 60 };

/** Alaric, and Alistair, Séraphine and Maelor, the company of the briefing's first lines: four narrative actors. */
export const AUDIENCE_ACTORS: readonly Walker[] = [
  ALARIC,
  { id: 'alistair', at: 1.0, from: [900, 980], to: [1150, 612], facing: 'RIGHT', speed: 80 },
  { id: 'sage_seraphine', at: 1.6, from: [1440, 990], to: [1322, 624], facing: 'LEFT', speed: 80 },
  { id: 'maelor', at: 2.2, from: [800, 990], to: [1062, 642], facing: 'RIGHT', speed: 80 },
];

/**
 * A few guards standing far off at the back of the hall, unlit, as scenery: no line names them, so they never come
 * forward. They are drawn smaller than the floor would make them, to stay in the distance behind the company.
 */
export const AUDIENCE_GUARDS: readonly Extra[] = [
  { id: 'village_militia_spearman', at: 0.3, seconds: 1, from: [500, 510], to: [500, 510] },
  { id: 'village_militia_spearman', at: 0.5, seconds: 1, from: [622, 516], to: [622, 516] },
  { id: 'village_militia_spearman', at: 0.7, seconds: 1, from: [762, 538], to: [762, 538] },
  { id: 'village_militia_spearman', at: 0.9, seconds: 1, from: [1500, 556], to: [1500, 556] },
];
export const guardDepth: DepthScale = (y) => audienceDepth(y) * 0.75;

const BRAZIERS: readonly FireSpot[] = [
  { x: 905, y: 374, width: 40, height: 44, base: 0.7 }, { x: 1607, y: 372, width: 40, height: 46, base: 0.7 },
];
const HALL_LIGHTS: readonly Light[] = [
  { x: 905, y: 350, radius: 150, color: FIRE, power: 0.24, seed: 41 }, { x: 1607, y: 350, radius: 150, color: FIRE, power: 0.24, seed: 42 },
  { x: 205, y: 130, radius: 70, color: CANDLE, power: 0.18, seed: 43 }, { x: 370, y: 235, radius: 55, color: CANDLE, power: 0.16, seed: 44 },
  { x: 608, y: 230, radius: 55, color: CANDLE, power: 0.16, seed: 45 }, { x: 940, y: 265, radius: 55, color: CANDLE, power: 0.16, seed: 46 },
  { x: 1125, y: 350, radius: 50, color: CANDLE, power: 0.16, seed: 47 }, { x: 1360, y: 345, radius: 50, color: CANDLE, power: 0.16, seed: 48 },
  { x: 1520, y: 215, radius: 55, color: CANDLE, power: 0.16, seed: 49 }, { x: 40, y: 345, radius: 50, color: CANDLE, power: 0.16, seed: 50 },
  { x: 315, y: 400, radius: 45, color: CANDLE, power: 0.14, seed: 51 }, { x: 688, y: 365, radius: 45, color: CANDLE, power: 0.14, seed: 52 },
];
/** Daylight through the high windows on the left, falling across the hall. */
const SHAFTS: readonly Shaft[] = [
  { top: [440, 120], bottom: [600, 560], width: [44, 170] },
  { top: [648, 170], bottom: [770, 560], width: [34, 140] },
  { top: [1500, 130], bottom: [1460, 560], width: [40, 120] },
];
const BANNERS: readonly Banner[] = [
  { x: 262, y: 0, width: 52, height: 228, amplitude: 2 }, { x: 497, y: 102, width: 48, height: 184, amplitude: 2 },
  { x: 803, y: 0, width: 58, height: 234, amplitude: 2 }, { x: 1040, y: 92, width: 74, height: 242, amplitude: 2 },
  { x: 1396, y: 92, width: 72, height: 246, amplitude: 2 },
];
/** Gold daylight from above and behind, the braziers in front: warm and bright, with its darks kept. */
const AUDIENCE_LIGHT: FigureLight = {
  top: [255, 238, 210], middle: [228, 206, 186], bottom: [150, 136, 146], rim: [255, 220, 160], rimAlpha: 0.5, rimOffset: [0, -1],
  shadowFrom: { x: 1150, y: 160 }, shadowReach: 0.34, shadowAlpha: 0.24,
};

function audiencePainter(sheets: SheetBook, actors: readonly Walker[], guards: readonly Extra[], seed: number): ShotPainter {
  const fires = paintedFires(BRAZIERS, seed);
  const shafts = lightShafts(SHAFTS, [255, 226, 168], 0.09);
  const banners = bannerSway(AUDIENCE_IMAGE, BANNERS, seed);
  const layer = new PropLayer();
  const crowd = new ExtraCrowd(sheets, 'rgb(54,44,48)');
  const cast = new FigureCast(AUDIENCE_LIGHT);
  const dust = ash(54, seed + 5, [255, 226, 170]);
  return (frame) => {
    const { ctx, camera, seconds, dt, reduced } = frame;
    banners(frame);
    shafts(frame);
    paintLights(frame, HALL_LIGHTS);
    fires(frame);
    const props = layer.begin();
    if (props) {
      crowd.draw(props, guards, seconds, dt, reduced, guardDepth);
      cast.draw(props, placeCast(actors, sheets, seconds, reduced, audienceDepth), seconds);
      layer.present(ctx, camera);
    }
    dust.paint(frame, 0.45);
  };
}

export const ALARIC_AUDIENCE: LivingScript = {
  id: 'alaric_audience_arrival',
  label: 'Audience d’Alaric',
  shots: [
    // The empty hall in daylight: the camera glides up the carpet toward the throne.
    { id: 'audience_hall', image: AUDIENCE_IMAGE, seconds: 10, from: { x: 900, y: 660, zoom: 1.36 }, to: { x: 1200, y: 400, zoom: 1.28 }, vanishing: { x: 1200, y: 470 } },
    // Alaric waits before his throne; the company walks up the carpet and stops at the foot of the stairs.
    { id: 'audience_carpet', image: AUDIENCE_IMAGE, seconds: 16, from: { x: 1100, y: 640, zoom: 1.15 }, to: { x: 1160, y: 560, zoom: 1.06 }, vanishing: { x: 1200, y: 470 } },
  ],
  sheets: ['alistair', 'village_militia_spearman'],
  portraits: ['alaric', 'sage_seraphine', 'maelor'],
  painter(shotId, sheets) {
    return shotId === 'audience_hall' ? audiencePainter(sheets, [], [], 4101) : audiencePainter(sheets, AUDIENCE_ACTORS, AUDIENCE_GUARDS, 4111);
  },
  backdrop() {
    return audiencePainter(new Map(), [], [], 4121);
  },
};
