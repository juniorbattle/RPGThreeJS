// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { cameraAt, type ViewCamera } from '../opening/openingShots';
import type { LivingScript, LivingShot } from './LivingTableauPlayer';
import { AUDIENCE_ACTORS, AUDIENCE_GUARDS } from './alaricAudience';
import { SACRIFICED_ACTORS, SACRIFICED_EXTRAS, SAVED_ACTORS, SAVED_EXTRAS } from './boisClairAftermath';
import { ARRIVAL_ACTORS, ARRIVAL_EXTRAS } from './boisClairArrival';
import { JUDGEMENT_ACTORS } from './lionJudgement';
import { OPENING_GUST_SECONDS, openingGust } from './livingAtmosphere';
import type { Extra, Walker } from './livingFigures';
import { LIVING_TABLEAUX } from './livingTableaux';
import { POST_DEMO_LIVING_TABLEAUX } from './postDemoLiving';
import { castOf, type MomentScript, type MomentShot } from './postDemoScenes';
import { SERPENT_ENDING_ACTORS, TRIAL_ENDING_ACTORS } from './routeEndings';

/**
 * OD-2026-11-14-A: every shot of a living tableau shows something new before 0.5 s, while the shared black veil lifts
 * (0.05 to 0.55 s): a figure who comes in by 0.2 s, so it shows as the veil lifts, or a camera already visibly moving. A
 * shot without a figure does not linger.
 */

interface Figures { actors: readonly Walker[]; extras: readonly Extra[] }
const NONE: Figures = { actors: [], extras: [] };

/** What each of the Lion's shots shows; the post-demo scripts carry their own cast. */
const LION_FIGURES: Readonly<Record<string, Figures>> = {
  arrival_village: { actors: [], extras: ARRIVAL_EXTRAS.arrival_village },
  arrival_square: { actors: ARRIVAL_ACTORS, extras: ARRIVAL_EXTRAS.arrival_square },
  saved_square: { actors: SAVED_ACTORS, extras: SAVED_EXTRAS },
  sacrificed_square: { actors: SACRIFICED_ACTORS, extras: SACRIFICED_EXTRAS },
  judgement_throne: { actors: [JUDGEMENT_ACTORS[0]!], extras: [] },
  judgement_hall: { actors: JUDGEMENT_ACTORS, extras: [] },
  audience_hall: { actors: [AUDIENCE_ACTORS[0]!], extras: AUDIENCE_GUARDS },
  audience_carpet: { actors: AUDIENCE_ACTORS, extras: AUDIENCE_GUARDS },
  serpent_moon: NONE,
  serpent_esplanade: { actors: SERPENT_ENDING_ACTORS, extras: [] },
  trial_sunset: NONE,
  trial_terrace: { actors: TRIAL_ENDING_ACTORS, extras: [] },
};

const isMoment = (script: LivingScript): script is MomentScript => 'actors' in script && 'scene' in script;

function figuresOf(script: LivingScript, shot: LivingShot): Figures {
  if (isMoment(script)) {
    const own = shot as LivingShot & Pick<MomentShot, 'cast'>;
    return { actors: castOf(own, script.actors), extras: own.cast ? script.extras : [] };
  }
  const figures = LION_FIGURES[shot.id];
  if (!figures) throw new Error(`no figure table for ${script.id}/${shot.id}`);
  return figures;
}

const WIDTH = 1366, HEIGHT = 768, BAR = Math.max(HEIGHT * 0.11, (HEIGHT - WIDTH / 2) / 2);

/** How fast the picture moves on screen at `t`, at its fastest view corner, in px/s. */
function cameraSpeed(shot: LivingShot, t: number): number {
  const at = (s: number): ViewCamera => cameraAt(shot, s / shot.seconds, WIDTH, HEIGHT, BAR, shot.frame);
  const a = at(t), b = at(t + 1 / 30);
  let best = 0;
  for (const [x, y] of [[0, BAR], [WIDTH, BAR], [0, HEIGHT - BAR], [WIDTH, HEIGHT - BAR]] as const) {
    const px = (x - a.x) / a.scale, py = (y - a.y) / a.scale;
    best = Math.max(best, Math.hypot(b.x + px * b.scale - x, b.y + py * b.scale - y) * 30);
  }
  return best;
}

const ALL: ReadonlyArray<LivingScript> = [...Object.values(LIVING_TABLEAUX), ...Object.values(POST_DEMO_LIVING_TABLEAUX)];
const SHOTS = ALL.flatMap((script) => script.shots.map((shot) => ({ script, shot })));

describe('living tableaux open on something (OD-2026-11-14-A)', () => {
  it('covers the seven Lion moments and the thirteen post-demo moments', () => {
    expect(ALL).toHaveLength(20);
  });

  it.each(SHOTS.map(({ script, shot }) => [`${script.id} / ${shot.id}`, script, shot] as const))('%s shows a figure or a moving camera before 0.5 s', (_name, script, shot) => {
    const { actors, extras } = figuresOf(script, shot);
    const firstFigure = Math.min(...actors.map((actor) => actor.at), ...extras.map((extra) => extra.at));
    const cameraMoving = cameraSpeed(shot, 0.45) >= 15;
    expect(firstFigure <= 0.2 || cameraMoving, `first figure at ${firstFigure} s, camera at ${cameraSpeed(shot, 0.45).toFixed(1)} px/s`).toBe(true);
  });

  it('never lingers on a shot without a figure', () => {
    for (const { script, shot } of SHOTS) {
      const { actors, extras } = figuresOf(script, shot);
      if (!actors.length && !extras.length) expect(shot.seconds, `${script.id}/${shot.id}`).toBeLessThanOrEqual(6);
    }
  });

  it('shows the chief already waiting, with his guards, from the first shot of each arrival', () => {
    for (const id of ['alaric_audience_arrival', 'bear_arrival_moment', 'dragon_arrival_moment', 'scorpion_arrival_moment']) {
      const script = (LIVING_TABLEAUX[id] ?? POST_DEMO_LIVING_TABLEAUX[id])!;
      const { actors, extras } = figuresOf(script, script.shots[0]!);
      expect(actors.map((actor) => actor.id), id).toHaveLength(1);
      expect(actors[0]!.from, id).toEqual(actors[0]!.to);
      expect(extras.length, id).toBeGreaterThanOrEqual(4);
    }
  });

  it('keeps the company out of an arrival\'s first shot: only those already in place wait there', () => {
    const walking: Walker = { id: 'marian', at: 0.3, from: [0, 10], to: [0, 0], facing: 'RIGHT', speed: 80 };
    const waiting: Walker = { id: 'borin', at: 0.05, from: [5, 5], to: [5, 5], facing: 'RIGHT', speed: 60 };
    expect(castOf({ cast: 'waiting' }, [waiting, walking])).toEqual([waiting]);
    expect(castOf({ cast: true }, [waiting, walking])).toEqual([waiting, walking]);
    expect(castOf({}, [waiting, walking])).toEqual([]);
  });

  it('puts the wind in the cloth at the first image and lets it settle', () => {
    expect(openingGust(0)).toBe(4);
    expect(openingGust(OPENING_GUST_SECONDS)).toBe(1);
    expect(openingGust(OPENING_GUST_SECONDS + 5)).toBe(1);
    for (let t = 0; t < OPENING_GUST_SECONDS; t += 0.25) expect(openingGust(t + 0.25)).toBeLessThanOrEqual(openingGust(t));
  });
});
