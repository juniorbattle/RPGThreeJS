import { bayer, makeNoise, mixRgb, PixelCanvas, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaPalette } from './arenaThemes';

/** Texels per world unit for decor billboards (units use 40). */
export const DECOR_TEXELS_PER_UNIT = 32;

export interface DecorSprite {
  canvas: PixelCanvas;
  /** Feet anchor in texels (x from left, y from top). */
  anchor: [number, number];
}

const LIGHT = { x: -0.62, y: -0.78 };

function tone(tones: readonly string[], level: number, x: number, y: number): Rgb {
  const max = tones.length - 1;
  const v = Math.max(0, Math.min(max, level * max));
  const lo = Math.floor(v);
  return rgb(tones[v - lo > bayer(x, y) ? Math.min(max, lo + 1) : lo]);
}

interface Blob { x: number; y: number; r: number }

/** Lit leafy mass made of overlapping spheres with clumpy, noisy rims. */
function paintCanopy(pc: PixelCanvas, rng: Rng, blobs: Blob[], tones: readonly string[], ember = false): void {
  const rim = makeNoise(rng, 16), clump = makeNoise(rng, 12);
  for (let y = 0; y < pc.height; y++) for (let x = 0; x < pc.width; x++) {
    let best: Blob | null = null, bestD = Infinity;
    for (const b of blobs) {
      const ang = Math.atan2(y - b.y, x - b.x);
      const r = b.r * (0.86 + rim((ang + Math.PI) * 2.4 + b.x * 0.1, b.y * 0.05) * 0.26);
      const d = Math.hypot(x - b.x, y - b.y) / r;
      if (d < 1 && d < bestD) { bestD = d; best = b; }
    }
    if (!best) continue;
    const nx = (x - best.x) / best.r, ny = (y - best.y) / best.r;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let light = 0.38 + (-(nx * LIGHT.x + ny * LIGHT.y)) * 0.42 + nz * 0.18;
    light += (clump(x / 3.4, y / 3.4) - 0.5) * 0.42;
    light -= (y / pc.height) * 0.12;
    let c = tone(tones, Math.max(0, Math.min(1, light)), x, y);
    if (ember && clump(x / 2, y / 2) > 0.8) c = mixRgb(c, rgb('#ff7a2a'), 0.75);
    pc.set(x, y, c);
  }
}

function paintTrunk(pc: PixelCanvas, rng: Rng, cx: number, bottom: number, top: number, w0: number, w1: number, tones: readonly string[]): void {
  const n = makeNoise(rng, 8);
  for (let y = top; y <= bottom; y++) {
    const t = (bottom - y) / Math.max(1, bottom - top);
    const half = (w0 + (w1 - w0) * t) / 2 + (y > bottom - 4 ? (4 - (bottom - y)) * 1.6 : 0);
    const sway = Math.sin(t * 2.2) * 2;
    for (let x = Math.round(cx - half + sway); x <= Math.round(cx + half + sway); x++) {
      const u = (x - (cx + sway - half)) / Math.max(1, half * 2);
      const groove = Math.abs(Math.sin(u * 9 + n(x / 2, y / 6) * 2)) < 0.22;
      pc.set(x, y, tone(tones, 0.75 - u * 0.6 - (groove ? 0.22 : 0), x, y));
    }
  }
}

function branch(pc: PixelCanvas, rng: Rng, x: number, y: number, ang: number, len: number, width: number, tones: readonly string[], depth: number): void {
  for (let i = 0; i < len; i++) {
    const px = x + Math.cos(ang) * i, py = y - Math.sin(ang) * i;
    const w = Math.max(1, width * (1 - i / len));
    for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) pc.set(px + k * 0.6, py, tone(tones, k < 0 ? 0.7 : 0.3, Math.round(px), Math.round(py)));
  }
  if (depth <= 0) return;
  const ex = x + Math.cos(ang) * len, ey = y - Math.sin(ang) * len;
  const forks = 2 + (rng() < 0.4 ? 1 : 0);
  for (let f = 0; f < forks; f++) branch(pc, rng, ex, ey, ang + (rng() - 0.5) * 1.3, len * (0.55 + rng() * 0.2), width * 0.6, tones, depth - 1);
}

export function drawTree(pal: ArenaPalette, seed: number): DecorSprite {
  const W = 132, H = 196;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 7919 + 13);
  const cx = W / 2 + (rng() - 0.5) * 8, bottom = H - 3;
  paintTrunk(pc, rng, cx, bottom, H * 0.42, 15, 8, pal.bark);
  branch(pc, rng, cx, H * 0.55, Math.PI * 0.72, 22, 4, pal.bark, 1);
  branch(pc, rng, cx, H * 0.5, Math.PI * 0.25, 22, 4, pal.bark, 1);
  const blobs: Blob[] = [];
  const crownY = H * 0.36;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rng();
    blobs.push({ x: cx + Math.cos(a) * (18 + rng() * 22), y: crownY + Math.sin(a) * (16 + rng() * 14) - 6, r: 18 + rng() * 13 });
  }
  blobs.push({ x: cx, y: crownY - 18, r: 30 });
  paintCanopy(pc, rng, blobs, pal.foliage);
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [Math.round(cx), bottom] };
}

export function drawPine(pal: ArenaPalette, seed: number): DecorSprite {
  const W = 104, H = 216;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 3571 + 7);
  const cx = W / 2 + (rng() - 0.5) * 4, bottom = H - 3;
  paintTrunk(pc, rng, cx, bottom, H * 0.62, 10, 6, pal.bark);
  const n = makeNoise(rng, 16);
  const tiers = 7;
  const crownTop = 4, crownBottom = H * 0.8;
  // Draw from the bottom tier up so upper boughs overlap the ones below.
  for (let t = tiers - 1; t >= 0; t--) {
    const k0 = t / tiers;
    const top = crownTop + k0 * (crownBottom - crownTop) * 0.86;
    const height = (crownBottom - crownTop) * (0.2 + k0 * 0.08);
    const halfBase = 9 + k0 * 38 + rng() * 4;
    for (let y = Math.round(top); y < top + height; y++) {
      const k = (y - top) / height;
      for (let x = Math.round(cx - halfBase - 4); x <= Math.round(cx + halfBase + 4); x++) {
        const u = (x - cx) / halfBase;
        // drooping boughs: the tier edge is a row of sagging tips
        const tips = Math.abs(Math.sin((x - cx) * 0.42 + t * 1.7)) * 0.22;
        const edge = k * (1 - tips) + (n(x / 3, y / 3 + t * 5) - 0.5) * 0.18;
        if (Math.abs(u) > edge * 1.05 + 0.04) continue;
        const underside = k > 0.78 ? (k - 0.78) * 1.6 : 0;
        const light = 0.64 - u * 0.34 - underside - k0 * 0.1 + (n(x / 2.2, y / 2.2 + t) - 0.5) * 0.34;
        pc.set(x, y, tone(pal.foliage, Math.max(0, Math.min(1, light)), x, y));
      }
    }
  }
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [Math.round(cx), bottom] };
}

export function drawDeadTree(pal: ArenaPalette, seed: number, burning: boolean): DecorSprite {
  const W = 128, H = 180;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 1931 + 3);
  const cx = W / 2, bottom = H - 3;
  const bark = burning ? ['#0c0807', '#1a110d', '#2a1c15', '#3a2a1f', '#4d3a2b'] : pal.bark;
  paintTrunk(pc, rng, cx, bottom, H * 0.45, 14, 7, bark);
  branch(pc, rng, cx, H * 0.48, Math.PI * 0.5, 34, 6, bark, 3);
  branch(pc, rng, cx, H * 0.6, Math.PI * 0.8, 28, 4, bark, 2);
  branch(pc, rng, cx, H * 0.62, Math.PI * 0.2, 26, 4, bark, 2);
  if (burning) {
    const ember = makeNoise(rng, 8);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (pc.alpha(x, y) && ember(x / 3, y / 3) > 0.74) pc.set(x, y, mixRgb(rgb('#ff5a1a'), rgb('#ffd27a'), bayer(x, y)));
    }
  }
  pc.outline(rgb(pal.ink));
  return { canvas: pc, anchor: [cx, bottom] };
}

export function drawBush(pal: ArenaPalette, seed: number): DecorSprite {
  const W = 72, H = 46;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 4243 + 11);
  const blobs: Blob[] = [];
  for (let i = 0; i < 5; i++) blobs.push({ x: 14 + i * 11 + rng() * 4, y: H - 14 - rng() * 8 - (i === 2 ? 6 : 0), r: 11 + rng() * 6 });
  paintCanopy(pc, rng, blobs, pal.foliage);
  // a few berries / flowers
  for (let k = 0; k < 5; k++) {
    const x = 10 + Math.floor(rng() * 52), y = 10 + Math.floor(rng() * 24);
    if (pc.alpha(x, y)) pc.set(x, y, rng() < 0.5 ? rgb('#d9d39a') : rgb('#c85a5a'));
  }
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [W / 2, H - 2] };
}

export function drawFern(pal: ArenaPalette, seed: number): DecorSprite {
  const W = 64, H = 44;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 6151 + 5);
  const cx = W / 2, base = H - 2;
  const fronds = 7;
  for (let f = 0; f < fronds; f++) {
    const ang = Math.PI * (0.12 + (f / (fronds - 1)) * 0.76) + (rng() - 0.5) * 0.15;
    const len = 18 + rng() * 10;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const x = cx + Math.cos(ang) * i, y = base - Math.sin(ang) * i + t * t * 10;
      pc.set(x, y, tone(pal.foliage, 0.45 + (1 - t) * 0.2, Math.round(x), Math.round(y)));
      if (i % 2 === 0 && t > 0.15) {
        const leaf = Math.round((1 - t) * 4) + 1;
        for (let k = 1; k <= leaf; k++) {
          pc.set(x - Math.sin(ang) * k, y - Math.cos(ang) * k * 0.6, tone(pal.foliage, 0.75 - k * 0.06, Math.round(x), Math.round(y)));
          pc.set(x + Math.sin(ang) * k, y + Math.cos(ang) * k * 0.6, tone(pal.foliage, 0.3, Math.round(x), Math.round(y)));
        }
      }
    }
  }
  pc.outline(rgb(pal.foliage[0]));
  return { canvas: pc, anchor: [cx, base] };
}

export function drawGrass(pal: ArenaPalette, seed: number): DecorSprite {
  const W = 40, H = 22;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed * 911 + 3);
  for (let b = 0; b < 16; b++) {
    const x0 = 3 + rng() * 34, h = 6 + rng() * 14, lean = (rng() - 0.5) * 6;
    for (let i = 0; i < h; i++) {
      const t = i / h;
      pc.set(x0 + lean * t * t, H - 2 - i, tone(pal.grass, 0.35 + t * 0.55, Math.round(x0), i));
    }
  }
  return { canvas: pc, anchor: [W / 2, H - 2] };
}
