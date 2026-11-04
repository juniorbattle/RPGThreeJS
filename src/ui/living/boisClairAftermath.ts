import type { FireSpot } from '../opening/openingPainters';
import { CANDLE, FIRE, VILLAGE_FIRES } from '../opening/openingPainters';
import type { Light } from '../opening/openingLayer';
import type { LivingScript } from './LivingTableauPlayer';
import { BOIS_CLAIR_TABLEAUX, boisClairShot } from './boisClairArrival';
import type { Extra, FigureLight, Walker } from './livingFigures';

/**
 * The two outcomes of Bois-Clair (set 1.13.0, OD-2026-11-04-A). Each plays only after a won fight and through the
 * existing presentation trigger, before an aftermath dialogue whose choice is still open: no thanks, no embrace, no
 * provisions given or taken, and nothing about the reserves or the wells. No caption.
 */

/** Only what still burns on a saved evening: the brazier and the three torches on their posts. */
const SAVED_FIRES: readonly FireSpot[] = VILLAGE_FIRES.slice(0, 4);
const SAVED_LIGHTS: readonly Light[] = [
  { x: 488, y: 395, radius: 120, color: FIRE, power: 0.3, seed: 5 }, { x: 892, y: 300, radius: 80, color: FIRE, power: 0.28, seed: 6 },
  { x: 1018, y: 342, radius: 80, color: FIRE, power: 0.28, seed: 7 }, { x: 1368, y: 408, radius: 90, color: FIRE, power: 0.28, seed: 8 },
  { x: 186, y: 530, radius: 110, color: CANDLE, power: 0.26, seed: 9 }, { x: 335, y: 405, radius: 70, color: CANDLE, power: 0.24, seed: 10 },
];
/** Dusk from the hills, the torches nearer: a soft light from above and behind, cooler at the feet. */
const SAVED_LIGHT: FigureLight = {
  top: [246, 214, 184], middle: [206, 178, 166], bottom: [120, 112, 136], rim: [255, 206, 150], rimAlpha: 0.5, rimOffset: [0, -1],
  shadowFrom: { x: 900, y: 150 }, shadowReach: 0.36, shadowAlpha: 0.26,
};

/**
 * `bois_clair_saved`: after a `village_defense` victory, before `village_defense_aftermath`. Established: the Serpents
 * flee and the children are safe. The square is quiet; Alistair and Maelor stand on it; the villager who will speak
 * comes a few steps towards them; some villagers keep their distance; the last Serpents run off through the gate, between the fallen fence and the cart.
 */
export const SAVED_ACTORS: readonly Walker[] = [
  { id: 'alistair', at: 0.4, from: [1060, 662], to: [1060, 662], facing: 'LEFT', speed: 60 },
  { id: 'maelor', at: 0.9, from: [1180, 648], to: [1180, 648], facing: 'LEFT', speed: 60 },
  { id: 'villageoise', at: 5.5, from: [600, 636], to: [740, 640], facing: 'RIGHT', speed: 45 },
];
export const SAVED_EXTRAS: readonly Extra[] = [
  { id: 'serpent_raider', at: 0.4, seconds: 5, from: [820, 560], to: [955, 438], pace: 7 },
  { id: 'serpent_raider', at: 1.6, seconds: 5, from: [1000, 548], to: [948, 436], pace: 7 },
  { id: 'serpent_brute', at: 2.8, seconds: 5.5, from: [880, 580], to: [950, 440], pace: 6 },
  { id: 'villageois', at: 3, seconds: 1, from: [430, 560], to: [430, 560] },
  { id: 'refugee', at: 3.6, seconds: 1, from: [1290, 548], to: [1290, 548] },
  { id: 'survivor', at: 4.2, seconds: 1, from: [1340, 560], to: [1340, 560] },
];

export const BOIS_CLAIR_SAVED: LivingScript = {
  id: 'bois_clair_saved',
  label: 'Bois-Clair sauvé',
  shots: [{ id: 'saved_square', image: BOIS_CLAIR_TABLEAUX.saved, seconds: 20, from: { x: 960, y: 560, zoom: 1.16 }, to: { x: 920, y: 590, zoom: 1.05 }, vanishing: { x: 948, y: 430 } }],
  sheets: ['alistair', 'serpent_raider', 'serpent_brute'],
  portraits: ['maelor', 'villageoise', 'villageois', 'refugee', 'survivor'],
  painter(_shotId, sheets) {
    return boisClairShot({
      sheets, lights: SAVED_LIGHTS, fires: SAVED_FIRES, seed: 3401, smoke: 0.07, extras: SAVED_EXTRAS, actors: SAVED_ACTORS,
      light: SAVED_LIGHT, extraTint: 'rgba(30,26,40,.55)', embers: 0, warmth: 0,
    });
  },
  backdrop() {
    return boisClairShot({ sheets: new Map(), lights: SAVED_LIGHTS, fires: SAVED_FIRES, seed: 3421, smoke: 0.07, extras: [], actors: [], light: SAVED_LIGHT, extraTint: '', embers: 0, warmth: 0 });
  },
};

/** Embers in the ruins, where the painter left them glowing, and a few low flames still alive. */
const RUIN_FIRES: readonly FireSpot[] = [
  { x: 330, y: 470, width: 22, height: 20, base: 0.5 }, { x: 205, y: 600, width: 24, height: 20, base: 0.5 },
  { x: 1330, y: 560, width: 26, height: 22, base: 0.5 }, { x: 1560, y: 592, width: 24, height: 22, base: 0.5 },
  { x: 820, y: 452, width: 18, height: 16, base: 0.4 }, { x: 1190, y: 520, width: 20, height: 16, base: 0.4 },
];
const RUIN_LIGHTS: readonly Light[] = [
  { x: 330, y: 470, radius: 110, color: FIRE, power: 0.2, seed: 21 }, { x: 205, y: 600, radius: 100, color: FIRE, power: 0.2, seed: 22 },
  { x: 1330, y: 560, radius: 120, color: FIRE, power: 0.2, seed: 23 }, { x: 1560, y: 592, radius: 120, color: FIRE, power: 0.2, seed: 24 },
  { x: 820, y: 452, radius: 80, color: FIRE, power: 0.16, seed: 25 }, { x: 1190, y: 520, radius: 90, color: FIRE, power: 0.16, seed: 26 },
  { x: 1420, y: 200, radius: 220, color: FIRE, power: 0.12, seed: 27 },
];
/** Grey ash light from a smoky sky, embers low and red. */
const RUIN_LIGHT: FigureLight = {
  top: [214, 196, 196], middle: [176, 150, 150], bottom: [104, 90, 104], rim: [255, 120, 70], rimAlpha: 0.45, rimOffset: [0, -1],
  shadowFrom: { x: 900, y: 200 }, shadowReach: 0.3, shadowAlpha: 0.22,
};

/**
 * `bois_clair_sacrificed`: after a `village_raid` victory, before `village_raid_aftermath`. Established: the coffers
 * are taken, the Serpents dispersed, the villagers silent, the villager wounded. Ruins, embers and smoke; Maelor stands
 * by the cart; the villager keeps apart; villagers watch from afar. Nobody loads or hands out anything.
 */
export const SACRIFICED_ACTORS: readonly Walker[] = [
  { id: 'maelor', at: 0.6, from: [1010, 600], to: [1010, 600], facing: 'LEFT', speed: 60 },
  { id: 'villageoise', at: 3.5, from: [600, 640], to: [640, 640], facing: 'RIGHT', speed: 30 },
];
export const SACRIFICED_EXTRAS: readonly Extra[] = [
  { id: 'villageois', at: 2, seconds: 1, from: [560, 540], to: [560, 540] },
  { id: 'refugee', at: 2.6, seconds: 1, from: [760, 520], to: [760, 520] },
  { id: 'survivor', at: 3.2, seconds: 1, from: [1150, 560], to: [1150, 560] },
];

export const BOIS_CLAIR_SACRIFICED: LivingScript = {
  id: 'bois_clair_sacrificed',
  label: 'Bois-Clair sacrifié',
  shots: [{ id: 'sacrificed_square', image: BOIS_CLAIR_TABLEAUX.sacrificed, seconds: 20, from: { x: 948, y: 470, zoom: 1.18 }, to: { x: 930, y: 560, zoom: 1.05 }, vanishing: { x: 948, y: 430 } }],
  sheets: [],
  portraits: ['maelor', 'villageoise', 'villageois', 'refugee', 'survivor'],
  painter(_shotId, sheets) {
    return boisClairShot({
      sheets, lights: RUIN_LIGHTS, fires: RUIN_FIRES, seed: 3501, smoke: 0.22, extras: SACRIFICED_EXTRAS, actors: SACRIFICED_ACTORS,
      light: RUIN_LIGHT, extraTint: 'rgba(24,20,26,.6)', embers: 60, warmth: 0.03,
    });
  },
  backdrop() {
    return boisClairShot({ sheets: new Map(), lights: RUIN_LIGHTS, fires: RUIN_FIRES, seed: 3521, smoke: 0.22, extras: [], actors: [], light: RUIN_LIGHT, extraTint: '', embers: 50, warmth: 0.03 });
  },
};
