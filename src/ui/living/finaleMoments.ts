import { FINALE_PROVISIONAL_SCENES } from '../../campaign/plateaux/finale/finalePresentation';
import { FIRE } from '../opening/openingPainters';
import { smooth } from '../opening/openingLayer';
import { celestialGlow, driftingPuffs, risingSpray, type Banner } from './livingAtmosphere';
import { momentPainter, momentScript, standing, type MomentScene } from './postDemoScenes';
import type { FigureLight } from './livingFigures';

/**
 * The final act's four moments (set 1.20.0, "Post-demo moments"), held to the contract since the operator validated
 * PLATEAU_MOMENTS_DRAFT_2026-11-13 as is (questions 2 A and 3 A): a sequence never shows what its dialogue says first.
 * The whole company is present, Alistair among it. The clans' banners in the wind, the Tournament's cold silvery light,
 * the breach a tear of cold black ink with a thin cold white rim, embers and black smoke over the burning city, the ash
 * light of dawn; never purple. No caption, no choice: the Fear ending's choice stays in its dialogue.
 */

const OVERCAST: FigureLight = {
  top: [226, 228, 236], middle: [196, 198, 210], bottom: [120, 118, 134], rim: [240, 240, 255], rimAlpha: 0.35, rimOffset: [0, -1],
  shadowFrom: { x: 768, y: -200 }, shadowReach: 0.15, shadowAlpha: 0.2,
};

// ——— The betrayal: the arena at the end of the final, before Maelor steps forward. ———

const ARENA = FINALE_PROVISIONAL_SCENES.finale_pre_serpent_final!.image!;

/** The eight clans' banners on their masts, as the arena of the final shows them. */
const ARENA_BANNERS: readonly Banner[] = [
  { x: 55, y: 55, width: 60, height: 145, amplitude: 2 }, { x: 240, y: 112, width: 58, height: 133, amplitude: 2 },
  { x: 405, y: 140, width: 57, height: 130, amplitude: 2 }, { x: 570, y: 160, width: 55, height: 125, amplitude: 2 },
  { x: 783, y: 170, width: 55, height: 130, amplitude: 2 }, { x: 1065, y: 150, width: 57, height: 130, amplitude: 2 },
  { x: 1240, y: 115, width: 58, height: 130, amplitude: 2 }, { x: 1425, y: 60, width: 58, height: 145, amplitude: 2 },
];
const STAND_FIRES = [240, 420, 710, 885, 1100, 1290, 1480].map((x, index) => ({ x, y: 572, radius: 40, color: FIRE, power: 0.12, seed: 81 + index }));
/** The arena is vast: the company stands small on its sand. */
const arenaDepth = (y: number) => 0.8 + Math.max(0, y - 700) * 0.004;

const ARENA_SCENE: MomentScene = {
  image: ARENA,
  depth: arenaDepth,
  light: OVERCAST,
  lights: STAND_FIRES,
  sway: ARENA_BANNERS,
  weather: (seed) => [
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 0, x1: 1536, y0: 0, y1: 120 }, size: [140, 280], speed: 5, color: [200, 200, 212], alpha: 0.12 }),
  ],
  motes: { count: 24, color: [230, 220, 200], amount: 0.3 },
};

/** The wind rises at the end of the second shot: the banners whip, sand lifts, the light turns cold. No fact: weather. */
const gust = (seconds: number) => smooth((seconds - 7) / 3);
const GUST_SCENE: MomentScene = {
  ...ARENA_SCENE,
  gust: (seconds) => 1 + 3 * gust(seconds),
  turn: { color: [64, 78, 104], alpha: (seconds) => 0.2 * smooth((seconds - 7) / 4) },
  weather: (seed) => {
    const sky = ARENA_SCENE.weather!(seed);
    const sand = driftingPuffs({ seed: seed + 3, count: 14, region: { x0: 0, x1: 1536, y0: 700, y1: 1000 }, size: [120, 260], speed: 60, color: [226, 210, 180], alpha: 0.22 });
    return [...sky, (frame) => sand(frame, gust(frame.seconds))];
  },
};

export const FINALE_BETRAYAL = momentScript({
  id: 'finale_betrayal_moment',
  label: 'La finale gagnée',
  scene: ARENA_SCENE,
  shots: [
    // The banners on their masts, the full stands, long shadows on the raked sand; the camera comes down along the axis.
    { id: 'finale_banners', seconds: 14, from: { x: 768, y: 200, zoom: 1.35 }, to: { x: 768, y: 380, zoom: 1.0 }, vanishing: { x: 800, y: 660 } },
    // The company on the sand facing the far gate; the wind rises and the light turns, before Maelor steps forward.
    // The camera widens as the wind rises, so the banners it whips are in view.
    { id: 'finale_sand', seconds: 16, from: { x: 790, y: 580, zoom: 1.14 }, to: { x: 790, y: 400, zoom: 1.0 }, vanishing: { x: 800, y: 660 }, cast: true, scene: GUST_SCENE },
  ],
  // No Maelor, no artefact, no breach, no champion changed: the dialogue says them first. The defeated champion does not appear.
  actors: [standing('alistair', 0.4, 790, 712, 'RIGHT'), standing('sage_seraphine', 0.8, 930, 716, 'LEFT'), standing('kestrel', 1.2, 650, 722, 'RIGHT')],
  sheets: ['alistair', 'kestrel'],
  portraits: ['sage_seraphine'],
  seed: 7901,
});

// ——— Before each epilogue: the capital at dawn, the breach still open and wavering. ———

const DAWN = FINALE_PROVISIONAL_SCENES.finale_act_end!.image!;
const dawnDepth = (y: number) => 1.0 + Math.max(0, y - 760) * 0.004;

const DAWN_SCENE: MomentScene = {
  image: DAWN,
  depth: dawnDepth,
  // Ash light of dawn from above, the fires of the city warm from below.
  light: {
    top: [214, 206, 214], middle: [196, 170, 162], bottom: [140, 92, 82], rim: [255, 162, 104], rimAlpha: 0.5, rimOffset: [0, -1],
    shadowFrom: { x: 1385, y: 200 }, shadowReach: 0.3, shadowAlpha: 0.24,
  },
  lights: [
    { x: 30, y: 440, radius: 80, color: FIRE, power: 0.22, seed: 91 }, { x: 140, y: 690, radius: 90, color: FIRE, power: 0.24, seed: 92 },
    { x: 495, y: 570, radius: 70, color: FIRE, power: 0.2, seed: 93 }, { x: 940, y: 655, radius: 60, color: FIRE, power: 0.18, seed: 94 },
    { x: 1165, y: 670, radius: 60, color: FIRE, power: 0.18, seed: 95 }, { x: 1410, y: 615, radius: 70, color: FIRE, power: 0.2, seed: 96 },
    { x: 760, y: 470, radius: 120, color: FIRE, power: 0.12, seed: 97 }, { x: 1100, y: 420, radius: 120, color: FIRE, power: 0.12, seed: 98 },
  ],
  fires: [
    { x: 30, y: 446, width: 30, height: 28, base: 0.7 }, { x: 140, y: 696, width: 34, height: 30, base: 0.7 },
    { x: 495, y: 576, width: 28, height: 24, base: 0.7 }, { x: 940, y: 661, width: 26, height: 22, base: 0.7 },
    { x: 1165, y: 677, width: 26, height: 22, base: 0.7 }, { x: 1410, y: 621, width: 28, height: 24, base: 0.7 },
  ],
  weather: (seed) => [
    // Smoke columns rising and leaning.
    risingSpray({ seed: seed + 1, count: 8, x: 650, y: 300, spread: 80, height: 220, size: 160, color: [70, 66, 70], alpha: 0.18 }),
    risingSpray({ seed: seed + 2, count: 6, x: 870, y: 300, spread: 40, height: 160, size: 120, color: [70, 66, 70], alpha: 0.14 }),
    risingSpray({ seed: seed + 3, count: 6, x: 1500, y: 260, spread: 40, height: 140, size: 120, color: [70, 66, 70], alpha: 0.14 }),
    // The breach wavers: its cold white rim trembles, its ink spatters drift.
    celestialGlow(1165, 130, 90, [230, 236, 255], 0.22),
    driftingPuffs({ seed: seed + 4, count: 10, region: { x0: 1080, x1: 1300, y0: 20, y1: 260 }, size: [16, 40], speed: 4, color: [8, 8, 12], alpha: 0.25, rise: 8 }),
  ],
  embers: 40,
  motes: { count: 50, color: [120, 116, 120], amount: 0.45 },
};

function epilogueBreath(id: string, seed: number) {
  return momentScript({
    id,
    label: 'La brèche encore ouverte',
    scene: DAWN_SCENE,
    shots: [
      // The breach high over the burning capital; the camera comes down over the roofs to the esplanade.
      { id: 'finale_breach_sky', seconds: 10, from: { x: 1165, y: 160, zoom: 1.45 }, to: { x: 1000, y: 330, zoom: 1.05 }, vanishing: { x: 900, y: 740 } },
      // The company on the esplanade faces the breach; the camera rises toward it and stops before it closes.
      // Ends with the company at the foot of the frame and the breach above it, before it closes.
      { id: 'finale_esplanade', seconds: 14, from: { x: 880, y: 700, zoom: 1.15 }, to: { x: 980, y: 460, zoom: 1.0 }, vanishing: { x: 900, y: 740 }, cast: true },
    ],
    actors: [
      standing('alistair', 0.4, 790, 782, 'RIGHT'), standing('sage_seraphine', 0.8, 940, 786, 'RIGHT'),
      standing('kestrel', 1.2, 640, 790, 'RIGHT'), standing('marian', 1.6, 1090, 792, 'RIGHT'),
    ],
    sheets: ['alistair', 'kestrel', 'marian'],
    portraits: ['sage_seraphine'],
    seed,
  });
}

/** The same breath before each ending: nothing branches before the epilogue's first line; each takes its epilogue's mood. */
export const FINALE_RESPECT = epilogueBreath('finale_respect_moment', 8001);
export const FINALE_FEAR = epilogueBreath('finale_fear_moment', 8101);
export const FINALE_BALANCE = epilogueBreath('finale_balance_moment', 8201);

// ——— The backdrops of the dialogues that follow, each on its own painting, without a figure. ———

const NO_FIGURES = { depth: () => 1, light: OVERCAST } as const;

/** The betrayal's dialogue, on the breach just opened: the wind whips the banners, ink seeps, the white rim trembles. */
export const BETRAYAL_DIALOGUE_SCENE: MomentScene = {
  ...NO_FIGURES,
  image: FINALE_PROVISIONAL_SCENES.finale_betrayal!.image!,
  sway: [
    { x: 60, y: 55, width: 70, height: 165, amplitude: 4 }, { x: 230, y: 105, width: 72, height: 155, amplitude: 4 },
    { x: 405, y: 140, width: 67, height: 145, amplitude: 4 }, { x: 565, y: 160, width: 72, height: 135, amplitude: 4 },
    { x: 885, y: 160, width: 70, height: 132, amplitude: 4 }, { x: 1055, y: 140, width: 73, height: 148, amplitude: 4 },
    { x: 1230, y: 105, width: 76, height: 157, amplitude: 4 }, { x: 1400, y: 55, width: 78, height: 173, amplitude: 4 },
  ],
  weather: (seed) => [
    driftingPuffs({ seed: seed + 1, count: 10, region: { x0: 0, x1: 1536, y0: 0, y1: 150 }, size: [140, 280], speed: 9, color: [190, 190, 204], alpha: 0.12 }),
    celestialGlow(775, 470, 110, [230, 236, 255], 0.2),
    driftingPuffs({ seed: seed + 2, count: 12, region: { x0: 690, x1: 860, y0: 200, y1: 760 }, size: [18, 44], speed: 3, color: [8, 8, 12], alpha: 0.28, rise: 10 }),
  ],
};

const beam = (x: number) => celestialGlow(x, 300, 110, [235, 240, 255], 0.2);
const smoke = (seed: number, x: number, y: number, size: number) =>
  risingSpray({ seed, count: 6, x, y, spread: 50, height: 180, size, color: [80, 76, 80], alpha: 0.16 });

export const RESPECT_DIALOGUE_SCENE: MomentScene = {
  ...NO_FIGURES,
  image: FINALE_PROVISIONAL_SCENES.finale_epilogue_respect!.image!,
  fires: [{ x: 75, y: 470, width: 30, height: 26, base: 0.7 }, { x: 1478, y: 486, width: 30, height: 26, base: 0.7 }],
  lights: [{ x: 75, y: 455, radius: 80, color: FIRE, power: 0.2, seed: 101 }, { x: 1478, y: 470, radius: 80, color: FIRE, power: 0.2, seed: 102 }],
  sway: [
    { x: 252, y: 250, width: 52, height: 150, amplitude: 1 }, { x: 372, y: 282, width: 48, height: 136, amplitude: 1 },
    { x: 1228, y: 330, width: 52, height: 110, amplitude: 1 }, { x: 1372, y: 262, width: 58, height: 156, amplitude: 1 },
  ],
  weather: (seed) => [beam(770), smoke(seed + 1, 430, 250, 140), smoke(seed + 2, 850, 280, 110)],
};

export const FEAR_DIALOGUE_SCENE: MomentScene = {
  ...NO_FIGURES,
  image: FINALE_PROVISIONAL_SCENES.finale_epilogue_fear!.image!,
  lights: [
    { x: 205, y: 350, radius: 90, color: FIRE, power: 0.16, seed: 111 }, { x: 560, y: 420, radius: 90, color: FIRE, power: 0.14, seed: 112 },
    { x: 1290, y: 520, radius: 90, color: FIRE, power: 0.16, seed: 113 }, { x: 1490, y: 560, radius: 90, color: FIRE, power: 0.16, seed: 114 },
    { x: 1430, y: 350, radius: 70, color: FIRE, power: 0.14, seed: 115 },
  ],
  weather: (seed) => [beam(350), smoke(seed + 1, 560, 250, 160), smoke(seed + 2, 840, 200, 120)],
  embers: 40,
};

export const BALANCE_DIALOGUE_SCENE: MomentScene = {
  ...NO_FIGURES,
  image: FINALE_PROVISIONAL_SCENES.finale_epilogue_balance!.image!,
  fires: [{ x: 25, y: 566, width: 30, height: 26, base: 0.7 }, { x: 1490, y: 656, width: 32, height: 28, base: 0.7 }, { x: 1440, y: 550, width: 26, height: 22, base: 0.7 }],
  lights: [
    { x: 25, y: 550, radius: 80, color: FIRE, power: 0.2, seed: 121 }, { x: 1490, y: 640, radius: 80, color: FIRE, power: 0.2, seed: 122 },
    { x: 1440, y: 536, radius: 60, color: FIRE, power: 0.16, seed: 123 },
  ],
  sway: [{ x: 152, y: 312, width: 70, height: 175, amplitude: 2 }, { x: 287, y: 337, width: 62, height: 190, amplitude: 2 }],
  weather: (seed) => [beam(775), smoke(seed + 1, 430, 200, 130), smoke(seed + 2, 985, 160, 100)],
};

/** A painter for a dialogue's own painting, no figure. */
export const dialogueBackdrop = (scene: MomentScene, seed: number) => () => momentPainter(scene, new Map(), [], [], seed);
