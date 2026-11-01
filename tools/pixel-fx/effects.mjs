// The hand-written pixel effects of the ultimates. Each one draws frame `i` of
// `count` onto a Canvas; particles come from a fixed seed, so a render is
// reproducible byte for byte.
import { clamp01, easeOut, fbm, Field, noise, seeded, span } from './core.mjs';

const SIZE = 320;
// floor lines, high enough for the shock rings to stay inside the frame
const HOLY_FLOOR = 272, METEOR_FLOOR = 268;

/** A light column falls on the target, floods the cell, then thins to a thread. */
function holyPillar(canvas, i, count, pal) {
  const ground = HOLY_FLOOR, cx = SIZE / 2;
  const t = i / (count - 1);
  const halfWidth = [3, 5, 34, 50, 46, 42, 38, 33, 28, 23, 18, 14, 10, 6, 3, 2][i];
  const reach = i === 0 ? ground * 0.45 : ground;
  const glow = new Field(SIZE, SIZE);
  const foot = i === 0 ? 0 : halfWidth * 1.5 * 0.26;
  for (let y = 0; y < reach + foot; y++) {
    const flare = 1 + 0.5 * Math.pow(Math.min(1, y / ground), 4); // the column opens as it meets the floor
    const w = halfWidth * flare;
    for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) {
      const d = Math.abs(x - cx) / w;
      if (d > 1) continue;
      // below the floor line the column ends on the ellipse of its footprint
      if (y > reach && Math.hypot(d, (y - reach) / foot) > 1) continue;
      const streak = noise(x * 0.11, y * 0.009 + i * 0.9, 21);
      glow.hot(x, y, (1 - d * d * 0.85) * (0.6 + 0.55 * streak));
    }
  }
  // the column's own edges tear upward as it dies
  glow.fray(span(t, 0.5, 1) * 0.42, 0.05, 5, i * 0.5);
  glow.edges(52); // the top of the column melts into the procedural pillar above it
  canvas.paint(glow, pal, { cut: 0.1, dither: 0.03 });

  const floor = new Field(SIZE, SIZE);
  if (i >= 2) {
    const k = span(i, 2, 11);
    floor.ring(cx, ground, 22 + easeOut(k) * 118, 7 * (1 - k) + 2, 1 - k * 0.65, 0.26);
    if (i >= 4) floor.ring(cx, ground, 14 + easeOut(span(i, 4, 13)) * 82, 4, 0.8 * (1 - span(i, 4, 13)), 0.26);
    floor.disc(cx, ground, 66 * (1 - k * 0.7), 0.95 * (1 - k * 0.8), 0.7, 0.26);
  }
  canvas.paint(floor, pal, { cut: 0.12, dither: 0.06 });

  // sparks climbing out of the column: little four-point glints
  const rng = seeded(4107);
  for (let n = 0; n < 54; n++) {
    const born = 2 + rng() * 8, life = 4 + rng() * 4, side = (rng() * 2 - 1);
    const startX = cx + side * (24 + rng() * 74), speed = 16 + rng() * 26, sway = rng() * 6.28;
    const age = (i - born) / life;
    if (age < 0 || age > 1) continue;
    const x = startX + Math.sin(sway + age * 5) * 5, y = ground - 6 - age * life * speed;
    const arm = age < 0.3 ? 3 : age < 0.7 ? 2 : 1;
    const colour = age < 0.5 ? pal[3] : pal[2];
    canvas.plot(x, y, pal[3]);
    for (let a = 1; a <= arm; a++) {
      canvas.plot(x + a, y, colour); canvas.plot(x - a, y, colour);
      canvas.plot(x, y + a, colour); canvas.plot(x, y - a, colour);
    }
  }
}

/** One blade from (x0, y0) to (x1, y1), bowed by `bow`; `head` and `tail` run along it from 0 to 1. */
function crescent(field, x0, y0, x1, y1, bow, head, tail, width) {
  const length = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / length, ny = (x1 - x0) / length;
  for (let s = 0; s <= length; s++) {
    const u = s / length;
    if (u > head || u < tail) continue;
    const local = (u - tail) / Math.max(0.001, head - tail);
    const w = width * Math.pow(Math.sin(Math.PI * local), 0.7);
    const curve = Math.sin(Math.PI * u) * bow;
    const x = x0 + (x1 - x0) * u + nx * curve, y = y0 + (y1 - y0) * u + ny * curve;
    field.disc(x, y, w, 0.52);
    field.disc(x + nx * w * 0.3, y + ny * w * 0.3, w * 0.62, 0.78);
    field.disc(x + nx * w * 0.5, y + ny * w * 0.5, w * 0.3, 1);
  }
}

/** Three blades cross on the target, then the cross bursts into a shock and sparks. */
function lionSlash(canvas, i, count, pal) {
  const c = SIZE / 2;
  const blades = new Field(SIZE, SIZE);
  const blade = (start, x0, y0, x1, y1, bow, width) => {
    const k = (i - start) / 6;
    if (k < 0 || k > 1) return;
    crescent(blades, x0, y0, x1, y1, bow, Math.min(1, (k + 0.17) * 3.2), span(k, 0.3, 1), width * (1 - span(k, 0.45, 1) * 0.85));
  };
  blade(0, 62, 72, 258, 248, -18, 10);
  blade(0, 258, 72, 62, 248, 18, 10);
  blade(2, 42, 172, 278, 148, -12, 13);
  canvas.paint(blades, pal, { cut: 0.1, dither: 0 });

  const burst = new Field(SIZE, SIZE);
  if (i >= 2 && i <= 10) {
    const k = span(i, 2, 10), reach = 24 + easeOut(k) * 66, heat = 1 - k * 0.8;
    for (let spike = 0; spike < 8; spike++) {
      const a = spike * Math.PI / 4 + 0.39, len = reach * (spike % 2 ? 0.58 : 1);
      burst.line(c, c, c + Math.cos(a) * len, c + Math.sin(a) * len, 7 * (1 - k * 0.7), heat, true);
    }
    burst.disc(c, c, 23 * (1 - k * 0.9) + 2, heat, 0.3);
    burst.ring(c, c, 22 + easeOut(k) * 92, 5 * (1 - k) + 1, 0.9 * (1 - k * 0.6), 1);
    burst.fray(k * 0.5, 0.07, 9);
  }
  canvas.paint(burst, pal, { cut: 0.12, dither: 0.1 });

  const rng = seeded(2291);
  const sparks = new Field(SIZE, SIZE);
  for (let n = 0; n < 74; n++) {
    const a = rng() * Math.PI * 2, speed = 13 + rng() * 17, born = 2 + rng() * 3, life = 5 + rng() * 5;
    const age = i - born;
    if (age < 0 || age > life) continue;
    const fall = age * age * 0.9, spread = speed * easeOut(clamp01(age / life)) * life * 0.72;
    const x = c + Math.cos(a) * spread, y = c + Math.sin(a) * spread + fall;
    sparks.line(x, y, x - Math.cos(a) * speed * 0.3, y - Math.sin(a) * speed * 0.3 - age, 0.8, 1 - (age / life) * 0.65);
  }
  canvas.paint(sparks, pal, { cut: 0.1, dither: 0 });
}

/** Rock hits the floor: white flash, a rolling fireball, ballistic debris and smoke. */
function meteorImpact(canvas, i, count, pal, smokePal, rockPal) {
  const ground = METEOR_FLOOR, cx = SIZE / 2;
  const t = i / (count - 1);
  const rng = seeded(7716);
  const puffs = [];
  for (let n = 0; n < 46; n++) {
    const a = -Math.PI * (0.12 + rng() * 0.76);
    puffs.push({ a, speed: 26 + rng() * 74, size: 15 + rng() * 25, born: rng() * 3, life: 8 + rng() * 7, lift: 12 + rng() * 24 });
  }
  const smoke = new Field(SIZE, SIZE), fire = new Field(SIZE, SIZE);
  for (const p of puffs) {
    const age = (i - p.born) / p.life;
    if (age < 0 || age > 1) continue;
    const out = easeOut(Math.min(1, age * 1.5));
    const x = cx + Math.cos(p.a) * p.speed * out * 1.1, y = ground - 12 + Math.sin(p.a) * p.speed * out - age * age * p.lift * 3;
    const r = p.size * (0.42 + easeOut(age) * 0.68);
    if (age > 0.3) smoke.disc(x, y - r * 0.16, r * 1.08, 0.95 - span(age, 0.55, 1) * 0.5, 0.5);
    if (age < 0.72) fire.disc(x, y, r * (1 - span(age, 0.4, 0.72) * 0.72), 1.04 - age * 1.15, 0.42);
  }
  // billowing edges: noise eats the outlines of both layers
  for (const [field, seed] of [[smoke, 3], [fire, 8]]) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const k = y * SIZE + x;
        if (field.data[k] > 0) field.data[k] -= 0.38 * fbm(x * 0.038, y * 0.038 + i * 0.32, seed);
      }
    }
  }
  smoke.fray(span(t, 0.62, 1) * 0.7, 0.06, 12, i * 0.4);
  smoke.edges(46);
  fire.edges(46);
  canvas.paint(smoke, smokePal, { cut: 0.1, dither: 0.1 });
  canvas.paint(fire, pal, { cut: 0.08, dither: 0.08 });

  const flash = new Field(SIZE, SIZE);
  if (i <= 3) flash.disc(cx, ground - 22, [42, 60, 34, 14][i], 1, 0.3);
  if (i >= 1 && i <= 11) {
    const k = span(i, 1, 11);
    flash.ring(cx, ground, 40 + easeOut(k) * 118, 8 * (1 - k) + 2, 0.95 * (1 - k * 0.6), 0.24);
  }
  canvas.paint(flash, pal, { cut: 0.12, dither: 0.06 });

  const rocks = new Field(SIZE, SIZE), trail = new Field(SIZE, SIZE);
  for (let n = 0; n < 22; n++) {
    const a = -Math.PI * (0.14 + rng() * 0.72), speed = 11 + rng() * 11, size = 1.4 + rng() * 2.2, born = 1 + rng() * 1.5, shade = 0.5 + rng() * 0.5;
    const age = i - born;
    if (age < 0) continue;
    const vx = Math.cos(a) * speed, vy = Math.sin(a) * speed + 2.4 * age;
    const x = cx + vx * age, y = ground - 16 + Math.sin(a) * speed * age + 1.2 * age * age;
    if (y > ground + 8) continue; // the rock has landed
    rocks.disc(x, y, size, shade);
    trail.line(x, y, x - vx * 0.8, y - vy * 0.8, 1, 0.9 - t * 0.5);
  }
  canvas.paint(trail, pal, { cut: 0.1, dither: 0 });
  canvas.paint(rocks, rockPal, { cut: 0.05, dither: 0 });

  for (let n = 0; n < 36; n++) {
    const x0 = cx + (rng() * 2 - 1) * 140, born = 5 + rng() * 6, speed = 8 + rng() * 13, sway = rng() * 6.28;
    const age = i - born;
    if (age < 0 || age > 7) continue;
    const x = x0 + Math.sin(sway + age) * 6, y = ground - 30 - age * speed;
    canvas.plot(x, y, age < 3 ? pal[3] : pal[2]);
    if (age < 5) canvas.plot(x + 1, y, pal[1]);
  }
}

const ramp = (p, ...keys) => keys.map((key) => p[key]);

/**
 * `worldSize` keeps the frames at the sprites' 40 px per world unit, so the
 * effects and the units share one pixel size. `pivotY` is the frame height
 * (from the bottom) that sits on the anchor: the floor line of ground effects.
 */
export const PIXEL_EFFECTS = [
  {
    id: 'holy_pillar', frameSize: SIZE, grid: [4, 4], pivotY: 1 - HOLY_FLOOR / SIZE,
    draw: (canvas, i, count, palettes) => holyPillar(canvas, i, count, ramp(palettes.holy, 'dark', 'edge', 'body', 'core')),
  },
  {
    id: 'lion_slash', frameSize: SIZE, grid: [4, 4], pivotY: 0.5,
    draw: (canvas, i, count, palettes) => lionSlash(canvas, i, count, ramp(palettes.gold, 'dark', 'edge', 'body', 'core')),
  },
  {
    id: 'meteor_impact', frameSize: SIZE, grid: [4, 4], pivotY: 1 - METEOR_FLOOR / SIZE,
    draw: (canvas, i, count, palettes) => meteorImpact(canvas, i, count, ramp(palettes.fire, 'dark', 'edge', 'body', 'core'), ramp(palettes.smoke, 'dark', 'edge', 'body'), ramp(palettes.earth, 'dark', 'edge', 'body')),
  },
];
