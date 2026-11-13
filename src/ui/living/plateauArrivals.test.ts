// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialState } from '../../game/store';
import { resolvePostDemoDialogue } from '../../game/postDemoContent';
import { resolvePixelSheet } from '../../combat/pixel/PixelSpriteSheets';
import { cameraAt, OPENING_FRAME } from '../opening/openingShots';
import { ALARIC_AUDIENCE } from './alaricAudience';
import { LivingTableauPlayer } from './LivingTableauPlayer';
import { POST_DEMO_LIVING_TABLEAUX } from './postDemoLiving';
import { LIVING_TABLEAUX } from './livingTableaux';
import { LIVING_STATURE, placeWalker, type Walker } from './livingFigures';
import {
  BEAR_ARRIVAL, BEAR_ARRIVAL_ACTORS, BEAR_HALL_IMAGE, BEAR_HALL_WARRIORS, bearHallDepth, bearWarriorDepth, BORIN_STATURE, POST_DEMO_FRAME,
} from './plateauArrivals';
import type { SheetArt } from '../opening/openingPainters';

/** Width and height of a lossy or lossless WebP, read from its header. */
function webpSize(url: string): [number, number] {
  const bytes = readFileSync(join(process.cwd(), 'public', url));
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const bits = bytes.readUInt32LE(21); return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]; }
  return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
}
const still = (walker: Walker) => walker.from[0] === walker.to[0] && walker.from[1] === walker.to[1];

afterEach(() => document.body.replaceChildren());

describe('the Borin arrival (built as the mock-up of PLATEAU_MOMENTS_DRAFT_2026-11-13)', () => {
  it('plays at most 30 seconds on the approved painting of Borin’s hall, at that painting’s own size', () => {
    expect(BEAR_ARRIVAL.id).toBe('bear_arrival_moment');
    expect(BEAR_ARRIVAL.shots.reduce((sum, shot) => sum + shot.seconds, 0)).toBeLessThanOrEqual(30);
    expect(BEAR_HALL_IMAGE).toBe('/assets/generated/post-demo/bear/scenes/bear_audience.webp');
    expect(existsSync(join(process.cwd(), 'public', BEAR_HALL_IMAGE))).toBe(true);
    expect(webpSize(BEAR_HALL_IMAGE)).toEqual([POST_DEMO_FRAME.width, POST_DEMO_FRAME.height]);
    for (const shot of BEAR_ARRIVAL.shots) expect([shot.image, shot.frame]).toEqual([BEAR_HALL_IMAGE, POST_DEMO_FRAME]);
  });

  it('joins the game’s post-demo living tableaux once judged in motion, apart from the Lion’s seven', () => {
    expect(Object.keys(LIVING_TABLEAUX)).not.toContain('bear_arrival_moment');
    expect(POST_DEMO_LIVING_TABLEAUX.bear_arrival_moment).toBe(BEAR_ARRIVAL);
  });

  it('keeps the four narrative actors of the audience: Borin waiting in place, the company walking in from the viewer', () => {
    expect(BEAR_ARRIVAL_ACTORS).toHaveLength(4);
    const speakers = new Set(resolvePostDemoDialogue('bear_audience', createInitialState())!.steps.map((step) => step.actorId));
    for (const actor of BEAR_ARRIVAL_ACTORS) expect(speakers.has(actor.id), actor.id).toBe(true);
    const borin = BEAR_ARRIVAL_ACTORS.find((actor) => actor.id === 'borin')!;
    expect(still(borin)).toBe(true);
    for (const hero of BEAR_ARRIVAL_ACTORS.filter((actor) => actor !== borin)) {
      expect(hero.from[1], hero.id).toBeGreaterThan(POST_DEMO_FRAME.height);
      expect(hero.to[1], hero.id).toBeGreaterThan(borin.to[1] + 100);
      expect(Math.sign(hero.to[0] - hero.from[0]), hero.id).toBe(hero.facing === 'RIGHT' ? 1 : -1);
      expect(Math.abs(hero.to[0] - borin.to[0]), hero.id).toBeGreaterThanOrEqual(140);
    }
    // Every figure comes from an existing sheet or portrait, Borin and the warriors from their combat sheets.
    for (const id of ['marian', 'borin', 'bear_warrior']) expect(resolvePixelSheet(id), id).toBeDefined();
    expect(BEAR_ARRIVAL.portraits).toEqual(['sage_seraphine', 'maelor']);
  });

  it('brings Borin’s boss sheet back to a tall man’s height, not a giant’s', () => {
    expect(BORIN_STATURE).toBeGreaterThan(0.4);
    expect(BORIN_STATURE).toBeLessThan(0.7);
    const borin = BEAR_ARRIVAL_ACTORS[0]!;
    const art = { entry: { anims: {}, cells: ['idle'], cell: [117, 178], anchor: [58, 175] }, image: {} } as unknown as SheetArt;
    expect(placeWalker(borin, 0, art, 30, true, bearHallDepth).scale).toBeCloseTo(bearHallDepth(borin.to[1]) * LIVING_STATURE * BORIN_STATURE);
    // A walker without a stature keeps the shared one, as every Lion tableau does.
    const marian = BEAR_ARRIVAL_ACTORS[1]!;
    expect(placeWalker(marian, 1, art, 30, true, bearHallDepth).scale).toBeCloseTo(bearHallDepth(marian.to[1]) * LIVING_STATURE);
  });

  it('keeps the warriors far off as scenery: at most twelve, standing, smaller than the company, never speakers', () => {
    const speakers = new Set(resolvePostDemoDialogue('bear_audience', createInitialState())!.steps.map((step) => step.actorId));
    expect(BEAR_HALL_WARRIORS.length).toBeLessThanOrEqual(12);
    const company = BEAR_ARRIVAL_ACTORS.filter((actor) => actor.id !== 'borin');
    for (const warrior of BEAR_HALL_WARRIORS) {
      expect(speakers.has(warrior.id)).toBe(false);
      expect(warrior.from).toEqual(warrior.to);
      expect(bearWarriorDepth(warrior.to[1])).toBeLessThan(Math.min(...company.map((hero) => bearHallDepth(hero.to[1]))));
    }
  });
});

describe('living tableaux on a painting of another size', () => {
  it('covers the view with a 3:2 painting, a portrait view the band between its bars, and leaves the Lion’s framing unchanged', () => {
    const shot = BEAR_ARRIVAL.shots[1]!;
    for (const [width, height] of [[1600, 900], [1280, 1024], [1920, 800], [390, 844]] as const) {
      const bar = Math.max(height * 0.11, (height - width / 2) / 2);
      const band = width >= height ? height : height - bar * 2;
      for (const progress of [0, 0.5, 1]) {
        const camera = cameraAt(shot, progress, width, height, bar, POST_DEMO_FRAME);
        expect(camera.x).toBeLessThanOrEqual(0);
        expect(camera.x + POST_DEMO_FRAME.width * camera.scale).toBeGreaterThanOrEqual(width - 0.01);
        expect(POST_DEMO_FRAME.height * camera.scale).toBeGreaterThanOrEqual(band - 0.01);
        if (width >= height) {
          expect(camera.y).toBeLessThanOrEqual(0);
          expect(camera.y + POST_DEMO_FRAME.height * camera.scale).toBeGreaterThanOrEqual(height - 0.01);
        }
      }
    }
    const lion = ALARIC_AUDIENCE.shots[0]!;
    expect(cameraAt(lion, 0.4, 1600, 900, 99)).toEqual(cameraAt(lion, 0.4, 1600, 900, 99, OPENING_FRAME));
  });

  it('sizes a plate to its painting, and leaves the Lion’s plates to the stylesheet', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const player = new LivingTableauPlayer(root);
    void player.open(BEAR_ARRIVAL);
    for (const image of root.querySelectorAll<HTMLImageElement>('.living-tableau__plate img')) {
      expect([image.style.width, image.style.height]).toEqual(['1536px', '1024px']);
    }
    player.close();
    void player.open(ALARIC_AUDIENCE);
    for (const image of root.querySelectorAll<HTMLImageElement>('.living-tableau__plate img')) expect(image.getAttribute('style')).toBeNull();
    player.close();
  });
});
