import { bayer, makeNoise, mixRgb, PixelCanvas, ramp, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaPalette, GroundStyle, TileStyle } from './arenaThemes';

/** Texels per tile edge: 48 px over 1.18 m ≈ the 40 px/m of the unit sprites. */
export const TILE_TEXELS = 48;

function shadeTone(tones: readonly string[], level: number, x: number, y: number): Rgb {
  // Flat tone clusters; an ordered dither only in a narrow band at each tone
  // boundary (dithering every texel reads as a checkerboard, not as paint).
  const max = tones.length - 1;
  const v = Math.max(0, Math.min(max, level * max));
  const lo = Math.floor(v);
  const frac = v - lo;
  const step = frac > 0.68 || (frac > 0.32 && bayer(x, y) < (frac - 0.32) / 0.36) ? 1 : 0;
  return rgb(tones[Math.min(max, lo + step)]);
}

interface Rect { x: number; y: number; w: number; h: number }

function splitStones(rng: Rng, area: Rect, depth: number, out: Rect[]): void {
  const canSplitW = area.w >= 18, canSplitH = area.h >= 18;
  if (depth <= 0 || (!canSplitW && !canSplitH) || (depth < 2 && rng() < 0.3)) { out.push(area); return; }
  const vertical = canSplitW && (!canSplitH || rng() < 0.5);
  if (vertical) {
    const cut = Math.round(area.w * (0.35 + rng() * 0.3));
    splitStones(rng, { x: area.x, y: area.y, w: cut, h: area.h }, depth - 1, out);
    splitStones(rng, { x: area.x + cut, y: area.y, w: area.w - cut, h: area.h }, depth - 1, out);
  } else {
    const cut = Math.round(area.h * (0.35 + rng() * 0.3));
    splitStones(rng, { x: area.x, y: area.y, w: area.w, h: cut }, depth - 1, out);
    splitStones(rng, { x: area.x, y: area.y + cut, w: area.w, h: area.h - cut }, depth - 1, out);
  }
}

function crack(pc: PixelCanvas, rng: Rng, x: number, y: number, len: number, color: Rgb, bounds: Rect): void {
  let dx = rng() < 0.5 ? 1 : -1, dy = rng() < 0.5 ? 1 : 0;
  for (let i = 0; i < len; i++) {
    if (x <= bounds.x || y <= bounds.y || x >= bounds.x + bounds.w - 1 || y >= bounds.y + bounds.h - 1) break;
    pc.set(x, y, color);
    if (rng() < 0.35) { dy = rng() < 0.5 ? 1 : 0; dx = rng() < 0.7 ? dx : -dx; }
    x += dx; y += dy || (rng() < 0.4 ? 1 : 0);
  }
}

function paintStone(pc: PixelCanvas, rng: Rng, r: Rect, pal: ArenaPalette, base: number, mossy: number): void {
  const noise = makeNoise(rng, 8);
  for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
    const x = r.x + i, y = r.y + j;
    let level = base + (noise(i / 3.2, j / 3.2) - 0.5) * 0.22;
    if (i === 0 || j === 0) level += 0.16; // top-left bevel catches the light
    if (i === r.w - 1 || j === r.h - 1) level -= 0.2;
    pc.set(x, y, shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y));
  }
  // grout lines around the stone
  for (let i = 0; i < r.w; i++) { pc.set(r.x + i, r.y + r.h - 1, rgb(pal.stoneDark[1])); }
  for (let j = 0; j < r.h; j++) { pc.set(r.x + r.w - 1, r.y + j, rgb(pal.stoneDark[1])); }
  if (rng() < 0.55) crack(pc, rng, r.x + 2 + Math.floor(rng() * (r.w - 4)), r.y + 2, 4 + Math.floor(rng() * 10), rgb(pal.stoneDark[2]), r);
  // moss creeping from the joints
  if (mossy > 0) {
    const m = makeNoise(rng, 6);
    for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
      const edge = Math.min(i, j, r.w - 1 - i, r.h - 1 - j);
      const v = m(i / 2.6, j / 2.6) - edge * 0.09 + mossy * 0.35;
      if (v > 0.72) pc.set(r.x + i, r.y + j, shadeTone(pal.moss, Math.min(1, (v - 0.6) * 1.6), r.x + i, r.y + j));
    }
  }
  // pebbles and specks
  for (let k = 0; k < 4; k++) pc.set(r.x + 1 + Math.floor(rng() * (r.w - 2)), r.y + 1 + Math.floor(rng() * (r.h - 2)), ramp(pal.stone, 0.15 + rng() * 0.2));
}

function tileFlagstone(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  pc.fill(rgb(pal.stoneDark[0]));
  const stones: Rect[] = [];
  splitStones(rng, { x: 0, y: 0, w: TILE_TEXELS, h: TILE_TEXELS }, 3, stones);
  for (const s of stones) paintStone(pc, rng, s, pal, 0.42 + rng() * 0.28, rng() < 0.6 ? rng() : 0);
  return pc;
}

function tileEarth(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  const n1 = makeNoise(rng, 6), n2 = makeNoise(rng, 12);
  const puddle = rng() < 0.28;
  const pcx = 10 + rng() * 28, pcy = 10 + rng() * 28, pr = 6 + rng() * 6;
  const scorch = rng() < 0.3;
  const scx = 10 + rng() * 28, scy = 10 + rng() * 28;
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    let level = 0.5 + (n1(x / 6, y / 6) - 0.5) * 0.4 + (n2(x / 2.2, y / 2.2) - 0.5) * 0.18;
    const edge = Math.min(x, y, TILE_TEXELS - 1 - x, TILE_TEXELS - 1 - y);
    if (edge === 0) level -= 0.28; else if (edge === 1) level += 0.08;
    if (scorch && Math.hypot(x - scx, y - scy) < 7 + n1(x / 2, y / 2) * 4) level -= 0.3;
    let c = shadeTone(pal.dirt, Math.max(0, Math.min(1, level)), x, y);
    if (puddle) {
      const d = Math.hypot((x - pcx) * 0.8, y - pcy) + (n2(x / 2, y / 2) - 0.5) * 4;
      if (d < pr) c = d < pr - 1.5 ? mixRgb(rgb('#3a2a2a'), rgb('#ff9b4f'), Math.max(0, 0.55 - (y - pcy + pr) / (pr * 4)) * (bayer(x, y) > 0.4 ? 1 : 0.6)) : rgb(pal.dirt[0]);
    }
    pc.set(x, y, c);
  }
  for (let k = 0; k < 14; k++) pc.set(1 + Math.floor(rng() * 46), 1 + Math.floor(rng() * 46), ramp(pal.dirt, 0.85 + rng() * 0.15));
  for (let k = 0; k < 5; k++) { // straw
    const x = 2 + Math.floor(rng() * 42), y = 2 + Math.floor(rng() * 42);
    for (let i = 0; i < 3; i++) pc.set(x + i, y + (i > 1 ? 1 : 0), rgb('#b59a58'));
  }
  return pc;
}

function tileMarble(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  const vein = makeNoise(rng, 8), n = makeNoise(rng, 12);
  const inlay = rng() < 0.5;
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    const v = Math.abs(Math.sin((x * 0.13 + y * 0.07) + vein(x / 7, y / 7) * 5.5));
    let level = 0.5 + (n(x / 4, y / 4) - 0.5) * 0.25 - (v < 0.08 ? 0.22 : 0);
    const edge = Math.min(x, y, TILE_TEXELS - 1 - x, TILE_TEXELS - 1 - y);
    if (edge === 0) level = 0.05; else if (edge === 1) level += x < y ? 0.18 : -0.06;
    pc.set(x, y, shadeTone(pal.stone, Math.max(0, Math.min(1, level)), x, y));
    if (inlay && edge === 5) pc.set(x, y, shadeTone(pal.trim, 0.55 + ((x + y) % 7 === 0 ? 0.4 : 0), x, y));
  }
  if (inlay) {
    const c = TILE_TEXELS / 2;
    for (let d = 0; d < 4; d++) for (let i = -d; i <= d; i++) { pc.set(c + i, c - 4 + d, ramp(pal.trim, 0.8)); pc.set(c + i, c + 4 - d, ramp(pal.trim, 0.6)); }
  }
  if (rng() < 0.6) crack(pc, rng, 4 + Math.floor(rng() * 40), 3, 10 + Math.floor(rng() * 16), rgb(pal.stoneDark[1]), { x: 1, y: 1, w: 46, h: 46 });
  const mossNoise = makeNoise(rng, 6);
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    const edge = Math.min(x, y, TILE_TEXELS - 1 - x, TILE_TEXELS - 1 - y);
    if (edge < 4 && mossNoise(x / 3, y / 3) > 0.78) pc.set(x, y, ramp(pal.moss, 0.4 + mossNoise(x, y) * 0.5));
  }
  return pc;
}

export function tileTopTexture(style: TileStyle, pal: ArenaPalette, seed: number): PixelCanvas {
  if (style === 'packed_earth') return tileEarth(pal, seed);
  if (style === 'sanctum_marble') return tileMarble(pal, seed);
  return tileFlagstone(pal, seed);
}

export function tileSideTexture(style: TileStyle, pal: ArenaPalette): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, 8);
  const tones = style === 'packed_earth' ? pal.dirt : pal.stone;
  for (let y = 0; y < 8; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    pc.set(x, y, shadeTone(tones, y === 0 ? 0.55 : 0.32 - y * 0.03, x, y));
  }
  return pc;
}

/** 128×128 seamless ground around the platform. */
export function groundTexture(style: GroundStyle, pal: ArenaPalette, seed = 7): PixelCanvas {
  const S = 128;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n1 = makeNoise(rng, 8), n2 = makeNoise(rng, 16), n3 = makeNoise(rng, 32);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const big = n1((x / S) * 8, (y / S) * 8), mid = n2((x / S) * 16, (y / S) * 16), fine = n3((x / S) * 32, (y / S) * 32);
    if (style === 'forest_floor') {
      const dirt = big < 0.26 && mid < 0.55;
      const level = 0.42 + (big - 0.5) * 0.3 + (mid - 0.5) * 0.22 + (fine - 0.5) * 0.16;
      pc.set(x, y, dirt ? shadeTone(pal.dirt, Math.max(0, Math.min(1, level + 0.1)), x, y) : shadeTone(pal.grass, Math.max(0, Math.min(1, level)), x, y));
    } else if (style === 'village_mud') {
      const rut = Math.abs(((y + n1(x / 16, 0) * 10) % 32) - 16) < 2;
      let level = 0.42 + (mid - 0.5) * 0.45 + (fine - 0.5) * 0.25 - (rut ? 0.2 : 0);
      const grassy = big > 0.68;
      let c = grassy ? shadeTone(pal.grass, Math.max(0, Math.min(1, level)), x, y) : shadeTone(pal.dirt, Math.max(0, Math.min(1, level)), x, y);
      if (!grassy && big < 0.22 && mid > 0.45) { level = 0.2; c = mixRgb(rgb('#2d1f1d'), rgb('#e0874a'), bayer(x, y) * 0.5 * (1 - y / S)); }
      pc.set(x, y, c);
    } else {
      // Broken flagstones swallowed by dark grass.
      const cx = Math.floor(x / 16), cy = Math.floor((y + (cx % 2) * 8) / 16);
      const lx = x % 16, ly = (y + (cx % 2) * 8) % 16;
      const stone = n1(cx + 0.5, cy + 0.5) > 0.38 && lx > 0 && ly > 0;
      const level = 0.4 + (mid - 0.5) * 0.4 + (lx === 1 || ly === 1 ? 0.15 : 0) - (lx === 15 || ly === 15 ? 0.15 : 0);
      pc.set(x, y, stone ? shadeTone(pal.stone, Math.max(0, Math.min(1, level)), x, y) : shadeTone(pal.grass, Math.max(0, Math.min(1, 0.3 + (fine - 0.5) * 0.6)), x, y));
    }
  }
  // scattered details
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(rng() * S), y = Math.floor(rng() * S);
    if (style === 'forest_floor') {
      if (k % 3) continue;
      const leaf = rng() < 0.5 ? rgb('#6f5a2c') : rgb('#8a7035');
      pc.setWrap(x, y, leaf); pc.setWrap(x + 1, y, leaf);
      if (rng() < 0.25) { pc.setWrap(x, y - 1, rgb('#cfd39a')); pc.setWrap(x + 1, y - 1, rgb('#e9e6b0')); }
    } else if (style === 'village_mud') {
      pc.setWrap(x, y, ramp(pal.dirt, 0.9)); if (rng() < 0.3) pc.setWrap(x + 1, y, rgb('#b39556'));
    } else {
      pc.setWrap(x, y, ramp(pal.stone, 0.2));
    }
  }
  return pc;
}

/**
 * Trampled apron around the battle platform: worn earth with ragged,
 * dithered edges and a path running back toward the ruins (alpha-cut).
 * u spans x (−W/2…W/2), v spans z (back → front).
 */
export function trampledGroundTexture(pal: ArenaPalette, seed: number, w = 192, h = 128): PixelCanvas {
  const pc = new PixelCanvas(w, h);
  const rng = seeded(seed);
  const n1 = makeNoise(rng, 8), n2 = makeNoise(rng, 16);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x / (w - 1)) * 2 - 1, v = (y / (h - 1)) * 2 - 1;
    // rounded rectangle around the platform + a path toward the back (v < 0)
    const box = Math.max(Math.abs(u) / 0.86, Math.abs(v) / 0.8);
    const path = v < 0 ? Math.abs(u + Math.sin(v * 3) * 0.05) / (0.1 + (1 + v) * 0.06) : 9;
    const shape = Math.min(box, path);
    const edge = shape + (n1(x / 6, y / 6) - 0.5) * 0.5 + (n2(x / 2.5, y / 2.5) - 0.5) * 0.18;
    if (edge > 1) continue;
    if (edge > 0.88 && bayer(x, y) > (1 - edge) * 6) continue; // dithered fringe
    const level = 0.45 + (n2(x / 3, y / 3) - 0.5) * 0.4 + (n1(x / 9, y / 9) - 0.5) * 0.2 - (edge > 0.8 ? 0.12 : 0);
    let c = shadeTone(pal.dirt, Math.max(0, Math.min(1, level)), x, y);
    if (n1(x / 2, y / 2) > 0.8 && edge > 0.5) c = shadeTone(pal.grass, 0.35 + n2(x, y) * 0.3, x, y);
    pc.set(x, y, c);
  }
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(rng() * w), y = Math.floor(rng() * h);
    if (pc.alpha(x, y)) pc.set(x, y, ramp(pal.stone, 0.3 + rng() * 0.4));
  }
  return pc;
}

/** Ashlar courses for walls, columns, arches and pedestals. */
export function stoneBlockTexture(pal: ArenaPalette, seed: number, w = 32, h = 64, course = 8, mossy = 0.5): PixelCanvas {
  const pc = new PixelCanvas(w, h);
  const rng = seeded(seed);
  pc.fill(rgb(pal.stoneDark[0]));
  for (let row = 0; row * course < h; row++) {
    const offset = row % 2 ? 8 : 0;
    let x = -offset;
    while (x < w) {
      const bw = 10 + Math.floor(rng() * 10);
      const r = { x: Math.max(0, x), y: row * course, w: Math.min(w, x + bw) - Math.max(0, x), h: Math.min(course, h - row * course) };
      if (r.w > 2) paintStone(pc, rng, r, pal, 0.38 + rng() * 0.3, mossy * (1 - row * course / h) * rng());
      x += bw;
    }
  }
  return pc;
}

export function barkTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(16, 32);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
    const groove = Math.abs(Math.sin(x * 1.3 + n(x / 3, y / 8) * 3)) < 0.25;
    pc.set(x, y, shadeTone(pal.bark, 0.5 + (n(x / 2, y / 5) - 0.5) * 0.5 - (groove ? 0.3 : 0), x, y));
  }
  return pc;
}

export function plankTexture(pal: ArenaPalette, seed: number, vertical = false): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const a = vertical ? x : y, b = vertical ? y : x;
    const board = Math.floor(a / 8), inBoard = a % 8;
    let level = 0.5 + (n(b / 6, board * 3) - 0.5) * 0.4 + Math.sin(b * 0.6 + board) * 0.05;
    if (inBoard === 0) level = 0.05; else if (inBoard === 1) level += 0.12;
    if ((b + board * 7) % 13 === 0 && inBoard === 4) level -= 0.3; // knot
    pc.set(x, y, shadeTone(pal.wood, Math.max(0, Math.min(1, level)), x, y));
  }
  return pc;
}

/** Half-timbered plaster facade (one storey, tiles horizontally). */
export function timberWallTexture(pal: ArenaPalette, seed: number, burning: boolean): PixelCanvas {
  const pc = new PixelCanvas(64, 48);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 64; x++) {
    let c = shadeTone(pal.plaster, 0.55 + (n(x / 5, y / 5) - 0.5) * 0.35 - (burning ? y / 140 : 0), x, y);
    const post = x % 21 < 3, beam = y < 3 || y > 44 || Math.abs(y - 24) < 2;
    const brace = Math.abs((x % 21) - 3 - (y - 3) * 0.42) < 1.6 && y > 3 && y < 23;
    if (post || beam || brace) c = shadeTone(pal.wood, 0.3 + (n(x, y) - 0.5) * 0.3, x, y);
    pc.set(x, y, c);
  }
  // windows
  for (const wx of TIMBER_WINDOWS) {
    for (let y = 30; y < 40; y++) for (let x = wx; x < wx + 7; x++) {
      const frame = x === wx || x === wx + 6 || y === 30 || y === 39 || x === wx + 3 || y === 35;
      pc.set(x, y, frame ? rgb(pal.wood[0]) : windowPane(burning, x - wx, y - 30));
    }
  }
  return pc;
}

const TIMBER_WINDOWS = [8, 50] as const;

function windowPane(burning: boolean, x: number, y: number): Rgb {
  // warm lamplight, brighter at the top of each pane (or fire light from below)
  const t = burning ? 1 - y / 10 : y / 10;
  return burning ? mixRgb(rgb('#ffd27a'), rgb('#ff6a1f'), t) : mixRgb(rgb('#ffe3a0'), rgb('#e09a3c'), t + (x === 1 || x === 4 ? -0.15 : 0));
}

/** Emissive mask of the facade: only the window panes glow at night. */
export function timberWindowMask(burning: boolean): PixelCanvas {
  const pc = new PixelCanvas(64, 48);
  pc.fill([0, 0, 0]);
  for (const wx of TIMBER_WINDOWS) {
    for (let y = 31; y < 39; y++) for (let x = wx + 1; x < wx + 6; x++) {
      if (x === wx + 3 || y === 35) continue;
      pc.set(x, y, windowPane(burning, x - wx, y - 30));
    }
  }
  return pc;
}

export function roofTexture(pal: ArenaPalette, seed: number, burning: boolean): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const row = Math.floor(y / 4), lx = (x + (row % 2) * 3) % 6;
    let level = 0.5 + (n(x / 4, y / 4) - 0.5) * 0.4 - (y % 4 === 3 ? 0.35 : 0) + (lx === 0 ? -0.2 : 0);
    let c = shadeTone(pal.roof, Math.max(0, Math.min(1, level)), x, y);
    if (burning && y < 14 && n(x / 4, y / 4) > 0.7) c = mixRgb(rgb('#2a1006'), rgb('#e0601c'), bayer(x, y) * 0.8);
    pc.set(x, y, c);
  }
  return pc;
}

// ---------------------------------------------------------------- heraldry

const LION_W = 26, LION_H = 34;

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): [number, number] {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return [Math.hypot(px - (ax + dx * t), py - (ay + dy * t)), t];
}

function inStroke(px: number, py: number, pts: ReadonlyArray<readonly [number, number]>, w0: number, w1: number): boolean {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    const [d, t] = segmentDistance(px, py, a[0], a[1], b[0], b[1]);
    if (d <= (w0 + (w1 - w0) * (i + t) / n) / 2) return true;
  }
  return false;
}

function inEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
}

const LION_CLAWS = new Set(['1,5', '2,4', '1,7', '2,14', '2,16', '5,23', '5,25']);

/**
 * The house lion, rampant and facing left, on a 26×34 grid: 0 empty, 1 body,
 * 2 mane (and tail tuft). Built from strokes and ellipses so the banners and
 * the stele share one emblem.
 */
function lionPart(x: number, y: number): 0 | 1 | 2 {
  const px = x + 0.5, py = y + 0.5;
  if (x === 9 && y === 5) return 0; // eye
  if (py > 8.4 && py < 9.4 && px > 4.5 && px < 8.6) return 0; // open jaw
  if (inEllipse(px, py, 10.8, 6.6, 3.3, 2.9) || inEllipse(px, py, 7.2, 7.4, 2.3, 1.3) || inEllipse(px, py, 7.6, 9.8, 1.9, 0.9) || inEllipse(px, py, 11.6, 3.4, 1.1, 1.1)) return 1;
  const ma = Math.atan2(py - 8.8, px - 13.2);
  if (px > 8.2 && Math.hypot(px - 13.2, (py - 8.8) / 1.12) <= 5 + Math.abs(Math.sin(ma * 5 + 0.6))) return 2;
  if (inStroke(px, py, [[13.5, 12], [15.2, 18], [16.2, 23]], 7.6, 5.6)
    || inStroke(px, py, [[12, 12.5], [7.2, 11.6], [3.8, 7.8]], 3.2, 2.4) || inEllipse(px, py, 3.2, 6.8, 1.6, 1.4)
    || inStroke(px, py, [[12.5, 15.6], [8.2, 16.2], [4.8, 15.4]], 3.0, 2.2) || inEllipse(px, py, 3.9, 15.2, 1.6, 1.3)
    || inEllipse(px, py, 16.6, 23.2, 3.0, 3.4)
    || inStroke(px, py, [[17, 25], [16.4, 29], [17.6, 32]], 4.2, 2.8) || inEllipse(px, py, 17.4, 32.6, 2.8, 1.0)
    || inStroke(px, py, [[14.8, 23.6], [10.8, 26.6], [7.8, 24.6]], 3.8, 2.6) || inEllipse(px, py, 7.0, 24.0, 1.6, 1.3)
    || inStroke(px, py, [[18.6, 22], [21.6, 19], [21.2, 14.2], [23, 10.8]], 1.7, 1.3)) return 1;
  if (inEllipse(px, py, 23.4, 9.2, 1.7, 2.3)) return 2;
  return LION_CLAWS.has(`${x},${y}`) ? 1 : 0;
}

/**
 * Paints the lion at (ox, oy) in a ramp: lit up-left edges, shaded down-right
 * edges, radial strands in the mane and a shade line where mane meets head.
 */
function paintLion(pc: PixelCanvas, ox: number, oy: number, tones: readonly string[], onPixel?: (x: number, y: number, c: Rgb) => void): void {
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < LION_W && y < LION_H && lionPart(x, y) > 0;
  for (let y = 0; y < LION_H; y++) for (let x = 0; x < LION_W; x++) {
    const part = lionPart(x, y);
    if (!part) continue;
    const lit = !solid(x - 1, y) || !solid(x, y - 1);
    const shade = !solid(x + 1, y) || !solid(x, y + 1);
    let t = lit ? 1 : shade ? 0.34 : 0.7;
    if (part === 2 && !lit) {
      const a = Math.atan2(y + 0.5 - 8.8, x + 0.5 - 13.2), d = Math.hypot(x + 0.5 - 13.2, y + 0.5 - 8.8);
      if (Math.sin(a * 7 + d * 0.9) > 0.55) t = 0.42;
      if ((lionPart(x - 1, y) === 1 && x - 1 > 8 && x - 1 < 14) || (lionPart(x, y - 1) === 1 && x > 8 && x < 14 && y - 1 < 10)) t = 0.2;
    }
    const c = ramp(tones, t);
    pc.set(ox + x, oy + y, c);
    onPixel?.(ox + x, oy + y, c);
  }
}

/** Heraldic banner (40×80, the decor's 32 texels/m): house cloth, gold border and the rampant lion. */
export function bannerTexture(pal: ArenaPalette, seed: number, burning = false): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // swallowtail bottom
    if (y > H - 14 && Math.abs(x - W / 2 + 0.5) < (y - (H - 14)) * 1.4) continue;
    if (burning && y > H - 24 && n(x / 4, y / 4) > 0.55 + (H - y) * 0.015) continue;
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.6 + fold + (n(x / 6, y / 6) - 0.5) * 0.2, x, y);
    const swallow = y > H - 14 && Math.abs(Math.abs(x - W / 2 + 0.5) - (y - (H - 14)) * 1.4) < 1.6;
    if (x <= 3 && x >= 2 || x >= W - 4 && x <= W - 3 || (y >= 4 && y <= 5) || (swallow && !burning)) c = shadeTone(pal.trim, x <= 3 || y <= 5 ? 0.8 : 0.5, x, y);
    pc.set(x, y, c);
  }
  // charred, glowing hem on burning banners
  if (burning) for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
    if (pc.alpha(x, y) && !pc.alpha(x, y + 1) && y > H - 30) { pc.set(x, y, rgb('#ff8a2a')); pc.set(x, y - 1, rgb('#2a120c')); }
  }
  paintLion(pc, 7, 16, pal.trim);
  return pc;
}

export function metalTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(16, 16);
  const rng = seeded(seed);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = 0.35 + rng() * 0.15 - (x % 8 === 0 ? 0.15 : 0);
    pc.set(x, y, [60 * v + 30, 55 * v + 28, 50 * v + 26]);
  }
  return pc;
}

/** Straw: long strands in five tones, a few bright stalks and dark gaps between bundles. */
export function strawTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  const strand = makeNoise(rng, 16), bundle = makeNoise(rng, 4);
  const tones = ['#3b2a10', '#6a5022', '#977733', '#c2a04f', '#e0c473'] as const;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    // elongated in y: strands run down the stack
    let level = 0.5 + (strand(x / 1.2, y / 9) - 0.5) * 0.9 + (bundle(x / 8, y / 8) - 0.5) * 0.25;
    if (strand(x / 0.9 + 7, y / 5) > 0.86) level = 0.98; // a lit stalk
    if (strand(x / 1.1 + 3, y / 6 + 5) < 0.12) level = 0.08; // gap between strands
    pc.set(x, y, shadeTone(tones, Math.max(0, Math.min(1, level)), x, y));
  }
  return pc;
}

/** Burlap: a coarse two-tone weave for sacks. */
export function burlapTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(16, 16);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4);
  const tones = ['#4a3a26', '#6b5639', '#8c7550', '#ab9469'] as const;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const weave = (x + y) % 2 === 0 ? 0.12 : -0.08;
    pc.set(x, y, shadeTone(tones, Math.max(0, Math.min(1, 0.55 + weave + (n(x / 4, y / 4) - 0.5) * 0.4)), x, y));
  }
  return pc;
}

/**
 * Fluted column drum, 4 flutes per 32-texel repeat (light from the left:
 * the left wall of each groove is in shade, the fillets catch the light),
 * a drum joint every 32 texels, chips, a crack and lichen in the grooves.
 */
export function columnTexture(pal: ArenaPalette, seed: number, lichen = 0.4): PixelCanvas {
  const W = 32, H = 64;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16), moss = makeNoise(rng, 8);
  const profile = [0.82, 0.22, 0.32, 0.44, 0.54, 0.62, 0.7, 0.78];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const f = x % 8;
    let level = (profile[f] ?? 0.5) * 0.74 + 0.1 + (n(x / 6, y / 7) - 0.5) * 0.2 + (fine(x / 2, y / 2) - 0.5) * 0.08;
    const joint = y % 32;
    if (joint === 0) level = 0.04; else if (joint === 1) level += 0.12; else if (joint === 31) level -= 0.1;
    let c = shadeTone(pal.stone, Math.max(0.03, Math.min(0.97, level)), x, y);
    if (f >= 1 && f <= 3 && moss(x / 3, y / 5) > 0.82 - lichen * 0.2) c = shadeTone(pal.moss, 0.3 + moss(x, y) * 0.5, x, y);
    pc.set(x, y, c);
  }
  for (let k = 0; k < 7; k++) { // chips: a dark pit with a lit lower lip
    const x = Math.floor(rng() * W), y = 2 + Math.floor(rng() * (H - 4));
    pc.setWrap(x, y, rgb(pal.stoneDark[1])); pc.setWrap(x + 1, y, rgb(pal.stoneDark[2]));
    pc.setWrap(x, y + 1, ramp(pal.stone, 0.8));
  }
  crack(pc, rng, 4 + Math.floor(rng() * 24), 4, 14 + Math.floor(rng() * 12), rgb(pal.stoneDark[1]), { x: 0, y: 0, w: W, h: H });
  return pc;
}

/** Sawn log end: growth rings around a dark heart, bark rim (16×16, used on caps). */
export function logEndTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(16, 16);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5) + (n(x / 3, y / 3) - 0.5) * 1.2;
    let c: Rgb;
    if (d > 7.2) c = rgb(pal.bark[1]);
    else if (d > 6.2) c = rgb(pal.bark[3]);
    else c = shadeTone(pal.wood, 0.55 + (Math.floor(d) % 2 ? -0.18 : 0.12) + (x < y ? 0.08 : -0.06), x, y);
    pc.set(x, y, c);
  }
  return pc;
}

/**
 * Carved stele face for the lion sanctum: a dark stone panel with a bevelled
 * border, a gold sun medallion and the house lion in relief (the banner lion
 * at twice the size, so both read as one emblem). Returns the face and an
 * emissive mask holding only the gold.
 */
export function lionReliefTexture(pal: ArenaPalette, seed: number): { face: PixelCanvas; gold: PixelCanvas } {
  const W = 48, H = 72;
  const face = new PixelCanvas(W, H);
  const gold = new PixelCanvas(W, H);
  gold.fill([0, 0, 0]);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let level = 0.34 + (n(x / 4, y / 4) - 0.5) * 0.18;
    if (edge < 3) level = edge === 0 ? 0.1 : x < W - 3 && y < H - 3 && (x < 3 || y < 3) ? 0.62 : 0.2;
    else if (edge === 3) level = 0.16;
    face.set(x, y, shadeTone(pal.stone, level, x, y));
  }
  const putGold = (x: number, y: number, t: number) => {
    face.set(x, y, ramp(pal.trim, t));
    gold.set(x, y, ramp(pal.trim, t * 0.85));
  };
  // sun medallion
  const cx = 24, cy = 17;
  for (let y = cy - 13; y <= cy + 13; y++) for (let x = cx - 13; x <= cx + 13; x++) {
    const d = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx);
    const ray = d > 8.5 && d < 12.5 && Math.abs(Math.sin(a * 6)) > 0.72 - (12.5 - d) * 0.04;
    if (d < 6.5 || (d >= 7.5 && d < 8.5) || ray) putGold(x, y, d < 6.5 ? (x - cx + (y - cy) < -2 ? 1 : 0.72) : 0.55 + (x < cx ? 0.3 : 0));
  }
  // the house lion in relief, under the medallion
  paintLion(face, 11, 33, pal.trim, (x, y, c) => gold.set(x, y, mixRgb([0, 0, 0], c, 0.85)));
  // drop shadow of the relief on the panel
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    if (gold.get(x - 1, y - 1)[0] > 0 && gold.get(x, y)[0] === 0 && Math.min(x, y, W - 1 - x, H - 1 - y) > 3) face.set(x, y, rgb(pal.stoneDark[0]));
  }
  return { face, gold };
}
