import { bayer, makeNoise, mixRgb, PixelCanvas, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaPalette } from './arenaThemes';

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

/** Conifer: overlapping triangular skirts with drooping corners, zigzag needle edge, lit from the left. */
export function drawPine(pal: ArenaPalette, seed: number, scale = 1): DecorSprite {
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
