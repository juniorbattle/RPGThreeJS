import type { SheetBook, ShotPainter, FireSpot } from '../opening/openingPainters';
import { embers, paintedFires, paintLights, softPuff, VILLAGE, VILLAGE_FIRES } from '../opening/openingPainters';
import { flicker, glow, PropLayer, seeded, type Light } from '../opening/openingLayer';
import { assets } from '../../render/assetManifest';
import type { LivingScript } from './LivingTableauPlayer';
import { ExtraCrowd, FigureCast, placeCast, type DepthScale, type Extra, type FigureLight, type Walker } from './livingFigures';

/**
 * Bois-Clair's square, shared by the arrival and both outcomes: the three tableaux are the same place, burning, saved
 * or in ruins. Its perspective is the opening's march rule, carried past the square towards the viewer.
 */
export const boisClairDepth: DepthScale = (y) => Math.max(0.36, 0.42 + 1.63 * (y - 436) / 264);
const TABLEAU = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/';
export const BOIS_CLAIR_TABLEAUX = {
  burning: (assets.prologueScenes as Record<string, string>).prologue_lion ?? `${TABLEAU}bois-clair-tableau-burning.png`,
  saved: `${TABLEAU}bois-clair-tableau-aftermath-saved.png`,
  sacrificed: `${TABLEAU}bois-clair-tableau-aftermath-sacrificed.png`,
};

/** Smoke rising over the roofs, stamped from one soft puff. */
export function smokePlumes(seed: number, count: number, alpha: number, color: readonly [number, number, number] = [34, 22, 26]) {
  const puff = softPuff(color);
  const random = seeded(seed);
  const plumes = Array.from({ length: count }, () => ({ x: 860 + random() * 780, y: 110 + random() * 240, size: 90 + random() * 200, speed: 7 + random() * 12, phase: random() }));
  return ({ ctx, camera, seconds }: Parameters<ShotPainter>[0]) => {
    for (const plume of plumes) {
      const rise = (plume.phase + (seconds * plume.speed) / 300) % 1;
      ctx.globalAlpha = alpha * Math.sin(rise * Math.PI);
      const size = plume.size * camera.scale * (1 + rise * 0.8);
      ctx.drawImage(puff, camera.x + (plume.x - 90 * rise) * camera.scale - size / 2, camera.y + (plume.y - 180 * rise) * camera.scale - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };
}

/**
 * One shot of Bois-Clair: the scene's lights and fires, its smoke, then on the prop layer its extras and its actors in
 * the scene's light, and the embers in front.
 */
export function boisClairShot(options: { sheets: SheetBook; lights: readonly Light[]; fires: readonly FireSpot[]; seed: number; smoke: number; extras: readonly Extra[]; actors: readonly Walker[]; light: FigureLight; extraTint: string; embers: number; warmth: number }): ShotPainter {
  const fires = paintedFires(options.fires, options.seed);
  const smoke = smokePlumes(options.seed + 7, 30, options.smoke);
  const layer = new PropLayer();
  const crowd = new ExtraCrowd(options.sheets, options.extraTint);
  const cast = new FigureCast(options.light);
  const sparks = embers(options.embers, options.seed + 11), near = embers(Math.round(options.embers / 6), options.seed + 13);
  return (frame) => {
    const { ctx, camera, seconds, dt, reduced } = frame;
    paintLights(frame, options.lights);
    smoke(frame);
    fires(frame);
    const props = layer.begin();
    if (props) {
      crowd.draw(props, options.extras, seconds, dt, reduced, boisClairDepth);
      cast.draw(props, placeCast(options.actors, options.sheets, seconds, reduced, boisClairDepth), seconds);
      layer.present(ctx, camera);
    }
    if (options.warmth > 0) {
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, frame.width * 0.5, frame.height * 0.2, frame.width * 0.75, [190, 66, 20], options.warmth * (0.7 + 0.3 * flicker(seconds, 13)));
      ctx.globalCompositeOperation = 'source-over';
    }
    if (options.embers) { sparks.paint(frame); near.paint(frame, 0.9); }
  };
}

/**
 * `bois_clair_arrival`, before `village_choice` (set 1.13.0, OD-2026-11-04-A). Only what is established before the
 * dialogue: "Bois-Clair brûle sous les torches des Serpents" (Alaric's briefing). The company comes in through the gap
 * of the broken fence in front of the square; raiders with torches pass; the villager who opens the dialogue steps
 * out, without a gesture that would speak before her line. No children, captives, coffers, chapel or wells: the
 * dialogue says those first. No caption.
 *
 * Three heroes and the villager: four narrative actors, the cast of the dialogue's first segment.
 */
export const ARRIVAL_ACTORS: readonly Walker[] = [
  { id: 'alistair', at: 0.5, from: [1250, 905], to: [1078, 668], facing: 'LEFT', speed: 70 },
  { id: 'marian', at: 1.1, from: [1370, 930], to: [1222, 652], facing: 'LEFT', speed: 70 },
  { id: 'kestrel', at: 1.7, from: [1130, 945], to: [935, 690], facing: 'LEFT', speed: 70 },
  { id: 'villageoise', at: 6.4, from: [520, 634], to: [660, 640], facing: 'RIGHT', speed: 60 },
];

/** Raiders with torches coming out of the gate and crossing the square, then passing at its back once the company is there, always in front of the cart they pass: extras, never actors. */
export const ARRIVAL_EXTRAS: Readonly<Record<'arrival_village' | 'arrival_square', readonly Extra[]>> = {
  arrival_village: [
    { id: 'serpent_raider', at: 0.3, seconds: 7, from: [930, 440], to: [560, 600], torch: true },
    { id: 'serpent_raider', at: 1.6, seconds: 7, from: [950, 438], to: [1180, 610], torch: true },
    { id: 'serpent_raider', at: 3.0, seconds: 7, from: [420, 580], to: [880, 620] },
    { id: 'serpent_raider', at: 4.4, seconds: 7, from: [940, 440], to: [700, 640], torch: true },
  ],
  arrival_square: [
    { id: 'serpent_raider', at: 0.2, seconds: 7, from: [940, 434], to: [690, 500], torch: true },
    { id: 'serpent_raider', at: 3.2, seconds: 7, from: [950, 434], to: [1035, 515], torch: true },
    { id: 'serpent_raider', at: 7.5, seconds: 7, from: [930, 436], to: [740, 506] },
  ],
};

/** The village burns at the back: everything on the square is lit from behind, warm along the top. */
const BURNING_LIGHT: FigureLight = {
  top: [250, 176, 128], middle: [196, 138, 118], bottom: [110, 88, 104], rim: [255, 170, 90], rimAlpha: 0.8, rimOffset: [0, -1],
  shadowFrom: { x: 948, y: 330 }, shadowReach: 0.42, shadowAlpha: 0.32,
};

export const BOIS_CLAIR_ARRIVAL: LivingScript = {
  id: 'bois_clair_arrival',
  label: 'Arrivée à Bois-Clair',
  shots: [
    // The hill and the roofs burn; the camera comes down to the gate. A different path from the opening's shot of this tableau.
    { id: 'arrival_village', image: BOIS_CLAIR_TABLEAUX.burning, seconds: 9, from: { x: 1010, y: 250, zoom: 1.32 }, to: { x: 930, y: 410, zoom: 1.14 }, vanishing: { x: 948, y: 430 } },
    // The square, from the gap in the fence: the company comes in, the villager steps out.
    { id: 'arrival_square', image: BOIS_CLAIR_TABLEAUX.burning, seconds: 14, from: { x: 1010, y: 660, zoom: 1.12 }, to: { x: 900, y: 610, zoom: 1.04 }, vanishing: { x: 948, y: 430 } },
  ],
  sheets: ['alistair', 'marian', 'kestrel', 'serpent_raider'],
  portraits: ['villageoise'],
  painter(shotId, sheets) {
    const square = shotId === 'arrival_square';
    return boisClairShot({
      sheets, lights: VILLAGE, fires: VILLAGE_FIRES, seed: square ? 3311 : 3301, smoke: 0.16,
      extras: ARRIVAL_EXTRAS[square ? 'arrival_square' : 'arrival_village'], actors: square ? ARRIVAL_ACTORS : [],
      light: BURNING_LIGHT, extraTint: 'rgba(38,14,8,.6)', embers: square ? 120 : 150, warmth: square ? 0.05 : 0,
    });
  },
  backdrop() {
    return boisClairShot({ sheets: new Map(), lights: VILLAGE, fires: VILLAGE_FIRES, seed: 3321, smoke: 0.16, extras: [], actors: [], light: BURNING_LIGHT, extraTint: '', embers: 90, warmth: 0.04 });
  },
};
