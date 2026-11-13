import { bayer, makeNoise, mixRgb, PixelCanvas, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaPalette } from './arenaThemes';
import { paintDragonSigil, SIGIL_H, SIGIL_W } from './arenaTextures';

/** Texels per world unit for decor billboards (units use 40). */
export const DECOR_TEXELS_PER_UNIT = 32;

export interface DecorSprite {
  canvas: PixelCanvas;
  /** Feet anchor in texels (x from left, y from top). */
  anchor: [number, number];
}

/** Key light from the upper left, as on the arena sun. */
const LIGHT = { x: -0.6, y: -0.8 };

/**
 * Discrete ramp pick: pixel art reads as clusters of a few flat tones. A
 * two-texel ordered dither is allowed only right at a tone boundary.
 */
function tone(tones: readonly string[], level: number, x: number, y: number, from = 0, to = tones.length - 1): Rgb {
  const span = to - from;
  const v = Math.max(0, Math.min(span, level * span));
  const lo = Math.floor(v);
  const frac = v - lo;
  const step = frac > 0.62 || (frac > 0.38 && bayer(x, y) < (frac - 0.38) / 0.24) ? 1 : 0;
  return rgb(tones[from + Math.min(span, lo + step)]);
}

// ---------------------------------------------------------------- foliage clumps

interface Clump { x: number; y: number; r: number; depth: number; seed: number }

/**
 * One leaf cluster: a scalloped sphere shaded in 4-5 flat tones, a leaf-bump
 * texture, a shadowed lower-right rim and a few bright leaf marks up-left.
 * Back clumps (depth → 1) are darker, which carves depth into the crown.
 */
function paintClump(pc: PixelCanvas, c: Clump, tones: readonly string[], leaf: (x: number, y: number) => number, ember = false): void {
  const lobes = 6 + (c.seed % 4);
  const phase = c.seed * 1.7;
  const x0 = Math.floor(c.x - c.r - 2), x1 = Math.ceil(c.x + c.r + 2);
  const y0 = Math.floor(c.y - c.r - 2), y1 = Math.ceil(c.y + c.r + 2);
  const top = tones.length - 1;
  const hi = Math.max(2, top - Math.round(c.depth * 2));
  const lo = Math.max(0, Math.min(hi - 2, Math.round(c.depth * 1.5)));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - c.x, dy = y - c.y;
    const d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const scallop = 0.84 + 0.16 * Math.abs(Math.sin(ang * lobes * 0.5 + phase)) + (leaf(x * 0.7, y * 0.7) - 0.5) * 0.12;
    const edge = c.r * scallop;
    if (d > edge) continue;
    const nx = dx / c.r, ny = dy / c.r;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let light = 0.45 + -(nx * LIGHT.x + ny * LIGHT.y) * 0.42 + nz * 0.16 + (leaf(x / 2.1, y / 2.1) - 0.5) * 0.34;
    const rim = d > edge - 1.6;
    if (rim && nx * LIGHT.x + ny * LIGHT.y > -0.1) light -= 0.35; // shadowed lower-right edge
    let col = tone(tones, Math.max(0, Math.min(1, light)), x, y, lo, hi);
    if (!rim && light > 0.82 && ((x * 7 + y * 13 + c.seed) % 11 === 0)) col = rgb(tones[top]); // leaf glints
    if (ember && leaf(x / 1.6, y / 1.6) > 0.78) col = mixRgb(col, rgb('#ff7a2a'), 0.8);
    pc.set(x, y, col);
  }
}

function paintClumps(pc: PixelCanvas, clumps: Clump[], tones: readonly string[], rng: Rng, ember = false): void {
  const leaf = makeNoise(rng, 16);
  // back to front: deep clumps first so front clusters overlap them
  for (const c of [...clumps].sort((a, b) => b.depth - a.depth || a.y - b.y)) paintClump(pc, c, tones, leaf, ember);
}

// ---------------------------------------------------------------- wood

/** Tapered, gently curving trunk with a lit left edge, bark furrows and root flare. */
function paintTrunk(pc: PixelCanvas, rng: Rng, base: { x: number; y: number }, top: { x: number; y: number }, w0: number, w1: number, tones: readonly string[]): void {
  const n = makeNoise(rng, 8);
  const len = base.y - top.y;
  for (let y = Math.floor(top.y); y <= base.y; y++) {
    const t = (base.y - y) / Math.max(1, len);
    const cx = base.x + (top.x - base.x) * (t * t * (3 - 2 * t)) + Math.sin(t * 3.1 + base.x) * 1.2;
    const flare = y > base.y - w0 * 0.6 ? Math.pow((y - (base.y - w0 * 0.6)) / (w0 * 0.6), 2) * w0 * 0.55 : 0;
    const half = (w0 + (w1 - w0) * t) / 2 + flare;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const u = (x - (cx - half)) / Math.max(1, half * 2);
      const furrow = Math.abs(Math.sin(u * 7.5 + n(x / 3, y / 9) * 2.4)) < 0.2;
      let level = 0.78 - u * 0.62 - (furrow ? 0.24 : 0) + (n(x / 2, y / 4) - 0.5) * 0.12;
      if (u > 0.82) level -= 0.15;
      pc.set(x, y, tone(tones, Math.max(0, Math.min(1, level)), x, y));
    }
  }
}

/** Tapered limb from (x0, y0) to (x1, y1) with a slight sag. */
function paintLimb(pc: PixelCanvas, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, tones: readonly string[]): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(len * 1.5);
  const nx = -(y1 - y0) / Math.max(1, len), ny = (x1 - x0) / Math.max(1, len);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sag = Math.sin(t * Math.PI) * len * 0.06;
    const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t + sag;
    const w = (w0 + (w1 - w0) * t) / 2;
    for (let k = -Math.ceil(w); k <= Math.ceil(w); k++) {
      if (Math.abs(k) > w + 0.3) continue;
      const side = k / Math.max(0.5, w);
      pc.set(px + nx * k, py + ny * k, tone(tones, 0.62 - side * 0.35, Math.round(px), Math.round(py)));
    }
  }
}

// ---------------------------------------------------------------- trees

/** Broadleaf tree: real limbs ending in leaf clusters, deep crown, root flare. */
export function drawTree(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(156 * k), H = Math.round(216 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 7919 + 13);
  const base = { x: W / 2 + (rng() - 0.5) * 10 * k, y: H - 3 };
  const crownY = H * (0.44 + rng() * 0.06);
  const top = { x: base.x + (rng() - 0.5) * 14 * k, y: crownY };
  paintTrunk(pc, rng, base, top, 15 * k, 8 * k, pal.bark);
  const clumps: Clump[] = [];
  const limbs = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < limbs; i++) {
    const t = i / (limbs - 1);
    const ang = -Math.PI / 2 + (t - 0.5) * (1.9 + rng() * 0.4) + (rng() - 0.5) * 0.25;
    const len = (40 + rng() * 26) * k * (1 - Math.abs(t - 0.5) * 0.3);
    const sx = top.x + (rng() - 0.5) * 6 * k, sy = top.y + (8 + rng() * 22) * k;
    const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
    paintLimb(pc, sx, sy, ex, ey, 6 * k, 2 * k, pal.bark);
    const r = (18 + rng() * 9) * k;
    clumps.push({ x: ex, y: ey, r, depth: rng() * 0.5, seed: i * 3 + seed });
    clumps.push({ x: ex + (rng() - 0.5) * r, y: ey + r * 0.45, r: r * (0.6 + rng() * 0.2), depth: 0.35 + rng() * 0.4, seed: i * 3 + 1 + seed });
    clumps.push({ x: (sx + ex) / 2 + (rng() - 0.5) * 8 * k, y: (sy + ey) / 2, r: r * 0.75, depth: 0.6 + rng() * 0.4, seed: i * 3 + 2 + seed });
  }
  // crown cap and inner shadow mass
  clumps.push({ x: top.x, y: crownY - 34 * k, r: 24 * k, depth: 0.15, seed: seed + 91 });
  clumps.push({ x: top.x, y: crownY - 6 * k, r: 30 * k, depth: 0.95, seed: seed + 92 });
  paintClumps(pc, clumps, pal.foliage, rng);
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [Math.round(base.x), base.y] };
}

/**
 * Conifer: overlapping triangular skirts with drooping corners, zigzag needle edge, lit from the left. With `snow`,
 * each skirt carries a ridge of snow along its lit upper edge (the Bear's mountains).
 */
export function drawPine(pal: ArenaPalette, seed: number, scale = 1, snow = false): DecorSprite {
  const k = scale;
  const W = Math.round(108 * k), H = Math.round(240 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 3571 + 7);
  const cx = W / 2 + (rng() - 0.5) * 4 * k;
  const base = { x: cx, y: H - 3 };
  paintTrunk(pc, rng, base, { x: cx, y: H * 0.2 }, 9 * k, 3 * k, pal.bark);
  const tiers = 7 + Math.floor(rng() * 2);
  const crownTop = 4 * k, crownBottom = H * 0.84;
  const ft = pal.foliage;
  const n = makeNoise(rng, 16);
  const zig = Math.max(3, Math.round(4 * k));
  for (let t = tiers - 1; t >= 0; t--) {
    const p = t / (tiers - 1);
    const y0 = crownTop + p * (crownBottom - crownTop) * 0.8;
    const h = (crownBottom - crownTop) * (0.17 + p * 0.07);
    const hw = (7 + p * 39 + (rng() - 0.5) * 4) * k;
    const lean = (rng() - 0.5) * 0.12;
    for (let y = Math.floor(y0); y <= Math.ceil(y0 + h + zig); y++) {
      for (let x = Math.round(cx - hw - zig); x <= Math.round(cx + hw + zig); x++) {
        const u = (x - cx) / hw + lean;
        const au = Math.abs(u);
        if (au > 1.02) continue;
        const upper = y0 + au * h * 0.58;
        const teeth = Math.abs(((x + t * 3) % (zig * 2)) - zig) / zig; // 0..1 zigzag
        const lower = y0 + h * (0.6 + 0.4 * Math.pow(au, 1.5)) + teeth * zig * 0.9 + (n(x / 4, t * 9) - 0.5) * 2 * k;
        if (y < upper || y > lower) continue;
        const v = (y - upper) / Math.max(1, lower - upper);
        const ridge = y - upper < 2.2 * k && u < 0.15; // lit upper-left edge
        const dash = (y + Math.floor((x + t) / 3)) % 3 === 0;
        let light = 0.66 - u * 0.26 - v * 0.48 - p * 0.04 + (ridge ? 0.24 : 0) + (dash ? -0.07 : 0);
        if (y > lower - 1.4) light -= 0.28;
        if (snow && y - upper < ((u < 0 ? 5 : 3) + n(x / 3, t * 5) * 2) * k && v < 0.45) {
          pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, 0.92 - Math.max(0, u) * 0.5 - v * 0.6)), x, y));
          continue;
        }
        pc.set(x, y, tone(ft, Math.max(0, Math.min(1, light)), x, y, 0, ft.length - 2));
      }
    }
  }
  pc.outline(rgb(ft[0]));
  return { canvas: pc, anchor: [Math.round(cx), base.y] };
}

export function drawDeadTree(pal: ArenaPalette, seed: number, burning: boolean, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(136 * k), H = Math.round(190 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 1931 + 3);
  const bark = burning ? ['#0c0807', '#1a110d', '#2a1c15', '#3a2a1f', '#4d3a2b'] : pal.bark;
  const base = { x: W / 2, y: H - 3 };
  const top = { x: W / 2 + (rng() - 0.5) * 10 * k, y: H * 0.36 };
  paintTrunk(pc, rng, base, top, 15 * k, 6 * k, bark);
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    paintLimb(pc, x, y, ex, ey, w, Math.max(1, w * 0.5), bark);
    if (depth <= 0) return;
    const forks = 2 + (rng() < 0.35 ? 1 : 0);
    for (let f = 0; f < forks; f++) grow(ex, ey, ang + (rng() - 0.5) * 1.2, len * (0.55 + rng() * 0.2), Math.max(1, w * 0.6), depth - 1);
  };
  grow(top.x, top.y + 2, -Math.PI / 2 + (rng() - 0.5) * 0.3, 30 * k, 5 * k, 3);
  grow(top.x, top.y + 22 * k, -Math.PI * 0.82, 30 * k, 4 * k, 2);
  grow(top.x, top.y + 30 * k, -Math.PI * 0.2, 28 * k, 4 * k, 2);
  if (burning) {
    // smouldering cracks along the wood grain and glowing tips, not a speckle
    const ember = makeNoise(rng, 16);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!pc.alpha(x, y)) continue;
      const inside = pc.alpha(x - 1, y) && pc.alpha(x + 1, y);
      const v = ember(x / 1.4, y / 6);
      if (inside && v > 0.8) pc.set(x, y, v > 0.9 ? rgb('#ffc86a') : rgb('#e0541a'));
      else if (inside && v > 0.74) pc.set(x, y, rgb('#7a2410'));
      else if (y < H * 0.5 && !pc.alpha(x, y - 1) && (x * 7 + y * 3) % 4 === 0) pc.set(x, y, rgb('#ff8a2a'));
    }
  }
  pc.outline(rgb(pal.ink));
  return { canvas: pc, anchor: [Math.round(base.x), base.y] };
}

export function drawBush(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(80 * k), H = Math.round(52 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 4243 + 11);
  const clumps: Clump[] = [];
  const count = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const r = (10 + rng() * 6 - Math.abs(t - 0.5) * 6) * k;
    clumps.push({ x: (12 + t * 56) * k + (rng() - 0.5) * 4 * k, y: H - r * 0.9 - 2 - (rng() * 6 + (1 - Math.abs(t - 0.5) * 2) * 6) * k, r, depth: rng() * 0.8, seed: seed * 5 + i });
  }
  paintClumps(pc, clumps, pal.foliage, rng);
  for (let i = 0; i < 6; i++) { // berries / small flowers
    const x = Math.round((10 + rng() * 60) * k), y = Math.round((10 + rng() * 26) * k);
    if (pc.alpha(x, y)) { const c = rng() < 0.5 ? rgb('#e8e2a8') : rgb('#c4505a'); pc.set(x, y, c); pc.set(x + 1, y, c); }
  }
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

export function drawFern(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale * 1.25;
  const W = Math.round(68 * k), H = Math.round(46 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 6151 + 5);
  const cx = W / 2, baseY = H - 2;
  const fronds = 8;
  for (let f = 0; f < fronds; f++) {
    const ang = Math.PI * (0.1 + (f / (fronds - 1)) * 0.8) + (rng() - 0.5) * 0.12;
    const len = (20 + rng() * 10) * k;
    const back = f % 2 === 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const x = cx + Math.cos(ang) * i, y = baseY - Math.sin(ang) * i + t * t * 11 * k;
      pc.set(x, y, tone(pal.foliage, back ? 0.3 : 0.5, Math.round(x), Math.round(y)));
      if (i % 2 === 0 && t > 0.1) {
        const leaf = Math.round((1 - t) * 4 * k) + 1;
        for (let j = 1; j <= leaf; j++) {
          pc.set(x - Math.sin(ang) * j, y - Math.cos(ang) * j * 0.5 - j * 0.3, tone(pal.foliage, (back ? 0.45 : 0.82) - j * 0.05, Math.round(x), Math.round(y)));
          pc.set(x + Math.sin(ang) * j, y + Math.cos(ang) * j * 0.5 + j * 0.2, tone(pal.foliage, back ? 0.2 : 0.38, Math.round(x), Math.round(y)));
        }
      }
    }
  }
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [Math.round(cx), baseY] };
}

export function drawGrass(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(44 * k), H = Math.round(24 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 911 + 3);
  for (let b = 0; b < 20; b++) {
    const x0 = (3 + rng() * 38) * k, h = (6 + rng() * 15) * k, lean = (rng() - 0.5) * 7 * k;
    for (let i = 0; i < h; i++) {
      const t = i / h;
      pc.set(x0 + lean * t * t, H - 2 - i, tone(pal.grass, 0.25 + t * 0.7, Math.round(x0), i));
    }
  }
  if (rng() < 0.6) { // a wild flower
    const x = Math.round((10 + rng() * 24) * k), y = Math.round(H - 14 * k);
    for (let i = 0; i < 8 * k; i++) pc.set(x, y + i, rgb(pal.grass[2]));
    const petal = rng() < 0.5 ? rgb('#f0e8b0') : rgb('#b8a4f0');
    pc.set(x, y - 1, petal); pc.set(x - 1, y, petal); pc.set(x + 1, y, petal); pc.set(x, y, rgb('#ffd75a'));
  }
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/**
 * Distant tree line: a wide, low-contrast silhouette of canopies (or conifer
 * tips) that closes the horizon between the mid-ground band and the far plate.
 */
export function drawTreeLine(pal: ArenaPalette, seed: number, conifer: boolean, width = 640, height = 150): DecorSprite {
  const pc = new PixelCanvas(width, height);
  const rng = seeded(seed * 2671 + 19);
  const tones = [pal.foliage[0], pal.foliage[1], pal.foliage[2]] as const;
  const n = makeNoise(rng, 32);
  const ridge: number[] = [];
  for (let x = 0; x < width; x++) {
    let top: number;
    if (conifer) {
      const period = 14 + Math.floor(n(x / 40, 0) * 10);
      const local = (x % period) / period;
      top = height * (0.35 + n(x / 60, 1) * 0.3) + Math.abs(local - 0.5) * 2 * period * 1.6;
    } else {
      top = height * (0.3 + n(x / 50, 2) * 0.32) + Math.abs(Math.sin(x / (9 + n(x / 30, 3) * 6))) * -8 + 8;
    }
    ridge.push(Math.max(2, top));
  }
  for (let x = 0; x < width; x++) for (let y = Math.floor(ridge[x] ?? height); y < height; y++) {
    const depth = (y - (ridge[x] ?? 0)) / height;
    const lit = (n(x / 6, y / 6) - 0.5) * 0.6 + 0.6 - depth * 1.4;
    pc.set(x, y, rgb(tones[lit > 0.55 ? 2 : lit > 0.2 ? 1 : 0]));
  }
  return { canvas: pc, anchor: [Math.round(width / 2), height - 1] };
}

/** A clump of wind-packed snow at the foot of a stone, lit up-left, with a few dry stalks poking through. */
export function drawSnowTuft(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(40 * k), H = Math.round(18 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 1709 + 23);
  const n = makeNoise(rng, 8);
  const lumps = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < lumps; i++) {
    const cx = (8 + (i / Math.max(1, lumps - 1)) * 24 + (rng() - 0.5) * 4) * k, r = (5 + rng() * 4) * k;
    for (let y = Math.floor(H - 2 - r); y <= H - 2; y++) for (let x = Math.floor(cx - r * 1.4); x <= Math.ceil(cx + r * 1.4); x++) {
      const dx = (x - cx) / (r * 1.4), dy = (y - (H - 2)) / r;
      if (dx * dx + dy * dy > 1 + (n(x / 3, y / 3) - 0.5) * 0.3) continue;
      const light = 0.8 - dx * 0.25 + dy * 0.35;
      pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, light)), x, y));
    }
  }
  for (let b = 0; b < 4; b++) {
    const x0 = (4 + rng() * 32) * k, h = (5 + rng() * 7) * k;
    for (let i = 0; i < h; i++) pc.set(x0 + (rng() - 0.5), H - 3 - i, tone(pal.grass, 0.3 + (i / h) * 0.5, Math.round(x0), i));
  }
  pc.outline(rgb(pal.moss[0]));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/** Rubble: a few stone chips and pebbles at the foot of a wall underground, lit up-left. */
export function drawRubble(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(40 * k), H = Math.round(16 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 2389 + 31);
  const chips = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < chips; i++) {
    const cx = (5 + rng() * 30) * k, r = (1.6 + rng() * 3.2) * k, cy = H - 2 - r * 0.7;
    const facets = 5 + Math.floor(rng() * 3), phase = rng() * 6;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, (y - cy) * 1.25);
      const edge = r * (0.82 + 0.18 * Math.cos(Math.round((a + phase) / (Math.PI * 2 / facets)) * (Math.PI * 2 / facets) - a - phase));
      if (d > edge || y > H - 2) continue;
      const light = 0.55 - ((x - cx) / r) * 0.25 - ((y - cy) / r) * 0.3;
      pc.set(x, y, tone(pal.stone, Math.max(0, Math.min(1, light)), x, y));
    }
  }
  pc.outline(rgb(pal.ink));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/**
 * A wind-twisted pine of the Dragon's peaks: a gnarled trunk leaning and doubling back, a few bare limbs reaching out
 * with the wind, each ending in a flat pad of needles, lit on top and dark beneath. With `snow`, the pads carry snow.
 */
export function drawTwistedPine(pal: ArenaPalette, seed: number, scale = 1, snow = false): DecorSprite {
  const k = scale;
  const W = Math.round(150 * k), H = Math.round(150 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 4421 + 17);
  const n = makeNoise(rng, 16);
  const lean = (seed % 2 === 0 ? 1 : -1) * (14 + rng() * 10) * k;
  const base = { x: W / 2 - lean * 0.6, y: H - 3 };
  const top = { x: W / 2 + lean, y: H * 0.34 };
  paintTrunk(pc, rng, base, top, 12 * k, 5 * k, pal.bark);
  const pads: Array<{ x: number; y: number; rx: number; ry: number }> = [{ x: top.x, y: top.y - 4 * k, rx: 30 * k, ry: 9 * k }];
  const limbs = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < limbs; i++) {
    const t = 0.3 + (i / limbs) * 0.55;
    const sx = base.x + (top.x - base.x) * t, sy = base.y - (base.y - top.y) * t;
    const dir = i % 2 === 0 ? Math.sign(lean) : -Math.sign(lean);
    const len = (26 + rng() * 22) * k * (dir === Math.sign(lean) ? 1.25 : 0.75); // the wind side reaches further
    const ex = sx + dir * len, ey = sy - (6 + rng() * 14) * k;
    paintLimb(pc, sx, sy, ex, ey, 5 * k, 2 * k, pal.bark);
    pads.push({ x: ex, y: ey - 2 * k, rx: (16 + rng() * 10) * k, ry: (5 + rng() * 3) * k });
  }
  const ft = pal.foliage;
  for (const pad of pads.sort((a, b) => a.y - b.y)) {
    for (let y = Math.floor(pad.y - pad.ry - 3 * k); y <= Math.ceil(pad.y + pad.ry); y++) for (let x = Math.floor(pad.x - pad.rx - 3); x <= Math.ceil(pad.x + pad.rx + 3); x++) {
      const dx = (x - pad.x) / pad.rx, dy = (y - pad.y) / pad.ry;
      const tufts = Math.abs(((x + seed * 3) % Math.max(3, Math.round(4 * k))) - 2) * 0.14; // needle tufts along the top edge
      if (dx * dx + (dy < 0 ? dy * dy * (1 + tufts) : dy * dy * 1.8) > 1 + (n(x / 4, y / 3) - 0.5) * 0.4) continue;
      const light = 0.62 - dy * 0.42 - dx * 0.16 + (n(x / 2, y / 2) - 0.5) * 0.24;
      if (snow && dy < -0.35 + (n(x / 3, 4) - 0.5) * 0.4) { pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, 0.9 - Math.max(0, dx) * 0.4)), x, y)); continue; }
      pc.set(x, y, tone(ft, Math.max(0, Math.min(1, light)), x, y, 0, ft.length - 2));
    }
  }
  pc.outline(rgb(ft[0]));
  return { canvas: pc, anchor: [Math.round(base.x), base.y] };
}

/**
 * Cloud banks for the horizon of the Dragon's peaks: rounded cumulus tops in the palette's snow ramp, lit from the upper
 * left and blue in their hollows; the arena's fog warms or cools them (the sea of clouds the terraces look over).
 */
export function drawCloudBank(pal: ArenaPalette, seed: number, width = 720, height = 96): DecorSprite {
  const pc = new PixelCanvas(width, height);
  const rng = seeded(seed * 5113 + 41);
  const n = makeNoise(rng, 32);
  const puffs: Array<{ x: number; y: number; r: number }> = [];
  for (let x = -20; x < width + 20; x += 18 + rng() * 26) puffs.push({ x, y: height * (0.5 + n(x / 60, 1) * 0.3), r: 14 + rng() * 22 });
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let best = -1, shade = 0;
    for (const p of puffs) {
      if (Math.abs(x - p.x) > p.r) continue;
      const dx = (x - p.x) / p.r, dy = (y - p.y) / p.r;
      const d = dx * dx + dy * dy;
      if (y >= p.y || d <= 1) {
        const lit = y >= p.y ? 0.35 - (y - p.y) / height : 0.82 - dx * 0.3 - dy * 0.3 - d * 0.25;
        if (lit > best) { best = lit; shade = lit; }
      }
    }
    if (best < -0.5) continue;
    pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, shade + (n(x / 5, y / 5) - 0.5) * 0.12)), x, y));
  }
  return { canvas: pc, anchor: [Math.round(width / 2), height - 1] };
}

/**
 * A carved dragon for the pedestals of Kaelen's esplanade: the clan's winged, four-legged sign cut in the round in pale
 * limestone, outlined like the rest of the decor; odd variants face the other way.
 */
export function drawDragonStatue(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const s = 1.7 * scale;
  const W = Math.round(SIGIL_W * s) + 2, H = Math.round(SIGIL_H * s) + 2;
  const pc = new PixelCanvas(W, H);
  paintDragonSigil(pc, 1, 1, pal.stone, s, seed % 2 === 1);
  pc.outline(rgb(pal.ink));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/**
 * Distant ridge line for the Bear's arenas: a jagged granite silhouette whose up-left facets catch the light, with
 * snow on the crests outdoors; underground, the same rock heaps fall into the dark (the tree line's mountain twin).
 */
export function drawRidgeLine(pal: ArenaPalette, seed: number, snow: boolean, width = 720, height = 96): DecorSprite {
  const pc = new PixelCanvas(width, height);
  const rng = seeded(seed * 3911 + 29);
  const n = makeNoise(rng, 32), fine = makeNoise(rng, 64);
  const ridge: number[] = [];
  for (let x = 0; x < width; x++) {
    const big = 1 - Math.abs(n(x / 40, 1) * 2 - 1); // ridged noise: sharp crests
    ridge.push(Math.max(2, height * (0.62 - big * 0.5) + (fine(x / 6, 2) - 0.5) * 6));
  }
  const tones = snow ? pal.stone.slice(0, 4) : pal.stone.slice(0, 3);
  for (let x = 0; x < width; x++) {
    const top = ridge[x] ?? height;
    const slope = ((ridge[Math.min(width - 1, x + 2)] ?? top) - (ridge[Math.max(0, x - 2)] ?? top)) / 4;
    for (let y = Math.floor(top); y < height; y++) {
      const depth = (y - top) / height;
      const lit = slope < 0 ? 0.62 : 0.3;
      if (snow && depth < 0.16 + fine(x / 5, y / 9) * 0.14) { pc.set(x, y, tone(pal.moss, slope < 0 ? 0.85 : 0.45, x, y)); continue; }
      pc.set(x, y, tone(tones, Math.max(0, Math.min(1, lit - depth * 0.9 + (fine(x / 3, y / 3) - 0.5) * 0.2)), x, y));
    }
  }
  return { canvas: pc, anchor: [Math.round(width / 2), height - 1] };
}

// ---------------------------------------------------------------- the Arid Deserts

/**
 * A lone thorn tree of the Arid Deserts: a short trunk forking into a few crooked limbs that spread wide, each carrying
 * a flat, layered crown of dusty olive leaves, lit on top and dark beneath, with pale thorns on the bare twigs.
 */
export function drawThornTree(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(160 * k), H = Math.round(140 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 6151 + 29);
  const n = makeNoise(rng, 16);
  const base = { x: W / 2 + (rng() - 0.5) * 12 * k, y: H - 3 };
  const fork = { x: base.x + (rng() - 0.5) * 10 * k, y: H * 0.62 };
  paintTrunk(pc, rng, base, fork, 10 * k, 6 * k, pal.bark);
  const pads: Array<{ x: number; y: number; rx: number; ry: number }> = [];
  const limbs = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < limbs; i++) {
    const spread = (i / (limbs - 1) - 0.5) * 2;
    const ex = fork.x + spread * (34 + rng() * 10) * k, ey = H * (0.3 + rng() * 0.1) + Math.abs(spread) * 6 * k;
    paintLimb(pc, fork.x, fork.y, ex, ey, 5 * k, 2 * k, pal.bark);
    // bare twigs with their thorns past the crown's edge
    const tx = ex + Math.sign(spread || 1) * (8 + rng() * 6) * k, ty = ey - (2 + rng() * 4) * k;
    paintLimb(pc, ex, ey, tx, ty, 1.6 * k, 1 * k, pal.bark);
    for (let t = 0; t < 3; t++) pc.set(ex + (tx - ex) * (0.3 + t * 0.25), ey + (ty - ey) * (0.3 + t * 0.25) - 1, rgb(pal.grass[pal.grass.length - 1]));
    pads.push({ x: ex, y: ey - 3 * k, rx: (18 + rng() * 8) * k, ry: (5 + rng() * 2) * k });
  }
  pads.push({ x: fork.x, y: H * 0.26, rx: 40 * k, ry: 7 * k });
  const ft = pal.foliage;
  for (const pad of pads.sort((a, b) => a.y - b.y)) {
    for (let y = Math.floor(pad.y - pad.ry - 3 * k); y <= Math.ceil(pad.y + pad.ry); y++) for (let x = Math.floor(pad.x - pad.rx - 3); x <= Math.ceil(pad.x + pad.rx + 3); x++) {
      const dx = (x - pad.x) / pad.rx, dy = (y - pad.y) / pad.ry;
      if (dx * dx + (dy < 0 ? dy * dy * 1.3 : dy * dy * 2.2) > 1 + (n(x / 4, y / 3) - 0.5) * 0.5) continue;
      const light = 0.64 - dy * 0.4 - dx * 0.18 + (n(x / 2, y / 2) - 0.5) * 0.26;
      pc.set(x, y, tone(ft, Math.max(0, Math.min(1, light)), x, y, 0, ft.length - 1));
    }
  }
  pc.outline(rgb(ft[0]));
  return { canvas: pc, anchor: [Math.round(base.x), base.y] };
}

/** Thorny desert scrub: a low tangle of grey twigs fanning from the sand, a few dusty olive leaves, pale thorns. */
export function drawThornScrub(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(60 * k), H = Math.round(38 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 2741 + 11);
  const twigs = 9 + Math.floor(rng() * 5);
  const leaves: Array<[number, number]> = [];
  for (let i = 0; i < twigs; i++) {
    const a = -Math.PI / 2 + (rng() - 0.5) * 2.4, len = (14 + rng() * 16) * k;
    const sx = W / 2 + (rng() - 0.5) * 8 * k, sy = H - 2;
    const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len * 0.9;
    paintLimb(pc, sx, sy, ex, ey, 2 * k, 1 * k, pal.bark);
    leaves.push([ex, ey], [sx + (ex - sx) * 0.6, sy + (ey - sy) * 0.6]);
    if (rng() < 0.6) pc.set(ex + 1, ey - 1, rgb(pal.grass[pal.grass.length - 1]));
  }
  for (const [lx, ly] of leaves) {
    if (rng() < 0.35) continue;
    const r = (1.6 + rng() * 1.6) * k;
    for (let y = Math.floor(ly - r); y <= Math.ceil(ly + r); y++) for (let x = Math.floor(lx - r); x <= Math.ceil(lx + r); x++) {
      if (Math.hypot(x - lx, (y - ly) * 1.4) > r) continue;
      pc.set(x, y, tone(pal.foliage, Math.max(0, Math.min(1, 0.6 - (y - ly) / r * 0.3 - (x - lx) / r * 0.15)), x, y, 1, pal.foliage.length - 1));
    }
  }
  pc.outline(rgb(pal.ink));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/** A tuft of dry desert grass with a pebble at its foot (no flower: the desert grows none). */
export function drawDryTuft(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(40 * k), H = Math.round(22 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 1931 + 7);
  for (let b = 0; b < 14; b++) {
    const x0 = (6 + rng() * 28) * k, h = (5 + rng() * 13) * k, lean = (rng() - 0.5) * 9 * k;
    for (let i = 0; i < h; i++) {
      const t = i / h;
      pc.set(x0 + lean * t * t, H - 2 - i, tone(pal.grass, 0.3 + t * 0.66, Math.round(x0), i));
    }
  }
  const px = (8 + rng() * 24) * k, r = (2 + rng() * 1.6) * k;
  for (let y = Math.floor(H - 2 - r); y <= H - 2; y++) for (let x = Math.floor(px - r * 1.3); x <= Math.ceil(px + r * 1.3); x++) {
    if (Math.hypot((x - px) / 1.3, y - (H - 2)) > r) continue;
    pc.set(x, y, tone(pal.stone, Math.max(0, Math.min(1, 0.62 - (x - px) / r * 0.2 + (y - (H - 2)) / r * 0.3)), x, y));
  }
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/** A little drift of sand banked against the foot of a stone, lit up-left, a dry stalk or two poking through. */
export function drawSandTuft(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
  const k = scale;
  const W = Math.round(40 * k), H = Math.round(14 * k);
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 1777 + 19);
  const n = makeNoise(rng, 8);
  const lumps = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < lumps; i++) {
    const cx = (10 + (i / Math.max(1, lumps - 1)) * 20 + (rng() - 0.5) * 4) * k, r = (4 + rng() * 3) * k;
    for (let y = Math.floor(H - 2 - r); y <= H - 2; y++) for (let x = Math.floor(cx - r * 1.8); x <= Math.ceil(cx + r * 1.8); x++) {
      const dx = (x - cx) / (r * 1.8), dy = (y - (H - 2)) / r;
      if (dx * dx + dy * dy > 1 + (n(x / 3, y / 3) - 0.5) * 0.25) continue;
      pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, 0.72 - dx * 0.28 + dy * 0.3)), x, y));
    }
  }
  for (let b = 0; b < 2; b++) {
    const x0 = (8 + rng() * 24) * k, h = (4 + rng() * 6) * k;
    for (let i = 0; i < h; i++) pc.set(x0 + (rng() - 0.5), H - 3 - i, tone(pal.grass, 0.35 + (i / h) * 0.5, Math.round(x0), i));
  }
  pc.outline(rgb(pal.moss[0]));
  return { canvas: pc, anchor: [Math.round(W / 2), H - 2] };
}

/**
 * Distant dune crests for the desert's horizon: smooth swells rising to sharp crests, the face left of each crest in
 * the light of the arena's key, the lee in shade; the fog takes them into the heat haze or the dusk.
 */
export function drawDuneLine(pal: ArenaPalette, seed: number, width = 720, height = 96): DecorSprite {
  const pc = new PixelCanvas(width, height);
  const rng = seeded(seed * 3301 + 37);
  const fine = makeNoise(rng, 64);
  // overlapping crescents, left to right: a gentle windward slope in the light up to a sharp crest, the lee in shade
  // under it, its edge slanting down and back from the crest (never a vertical seam)
  for (let cx = -40 + rng() * 30; cx < width + 60; cx += 40 + rng() * 50) {
    const w = 60 + rng() * 50, cy = height * (0.2 + rng() * 0.35), lean = 1.4 + rng() * 1.0;
    for (let x = Math.max(0, Math.floor(cx - w)); x < Math.min(width, Math.ceil(cx + w * 0.5)); x++) {
      const windward = x < cx, t = windward ? (cx - x) / w : (x - cx) / (w * 0.5);
      const top = cy + (height - cy) * (windward ? Math.pow(t, 2.2) : Math.pow(t, 0.6));
      for (let y = Math.floor(top); y < height; y++) {
        const lee = x > cx - (y - cy) * lean;
        const light = (lee ? 0.3 : 0.8 - t * 0.15) - ((y - cy) / height) * 0.4 + (fine(x / 4, y / 3) - 0.5) * 0.1;
        pc.set(x, y, tone(pal.moss, Math.max(0, Math.min(1, light)), x, y));
      }
    }
  }
  return { canvas: pc, anchor: [Math.round(width / 2), height - 1] };
}
