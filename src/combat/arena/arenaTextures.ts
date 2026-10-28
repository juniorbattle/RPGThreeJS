import { bayer, makeNoise, mixRgb, PixelCanvas, ramp, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaPalette, GroundStyle, TileStyle } from './arenaThemes';

/** Texels per tile edge: 48 px over 1.18 m ≈ the 40 px/m of the unit sprites. */
export const TILE_TEXELS = 48;

function shadeTone(tones: readonly string[], level: number, x: number, y: number): Rgb {
  // Dithered pick between two neighbouring tones of a ramp.
  const max = tones.length - 1;
  const v = Math.max(0, Math.min(max, level * max));
  const lo = Math.floor(v);
  const frac = v - lo;
  return rgb(tones[frac > bayer(x, y) ? Math.min(max, lo + 1) : lo]);
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
  for (const wx of [8, 50]) {
    for (let y = 30; y < 40; y++) for (let x = wx; x < wx + 7; x++) {
      const frame = x === wx || x === wx + 6 || y === 30 || y === 39 || x === wx + 3;
      pc.set(x, y, frame ? rgb(pal.wood[0]) : burning ? mixRgb(rgb('#ffb347'), rgb('#ff6a1f'), (y - 30) / 10) : rgb('#f4c56a'));
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

/** Heraldic banner: house cloth, gold border and a rampant lion silhouette. */
export function bannerTexture(pal: ArenaPalette, seed: number, burning = false): PixelCanvas {
  const W = 20, H = 40;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 6);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // swallowtail bottom
    if (y > H - 7 && Math.abs(x - W / 2 + 0.5) < (y - (H - 7)) * 1.4) continue;
    if (burning && y > H - 12 && n(x / 2, y / 2) > 0.55 + (H - y) * 0.03) continue;
    const fold = Math.sin(x * 0.9) * 0.12;
    let c = shadeTone(pal.cloth, 0.6 + fold + (n(x / 3, y / 3) - 0.5) * 0.2, x, y);
    if (x === 1 || x === W - 2 || y === 2) c = shadeTone(pal.trim, 0.65, x, y);
    pc.set(x, y, c);
  }
  // lion: a compact rampant silhouette drawn as rows of spans
  const lion: Array<[number, number, number]> = [
    [10, 9, 12], [11, 8, 13], [12, 7, 13], [13, 8, 12], [14, 9, 13], [15, 6, 13], [16, 5, 12], [17, 6, 12],
    [18, 7, 13], [19, 7, 14], [20, 6, 14], [21, 6, 13], [22, 7, 9], [22, 11, 13], [23, 6, 8], [23, 12, 14], [24, 5, 7], [24, 13, 15],
  ];
  for (const [y, x0, x1] of lion) for (let x = x0; x <= x1; x++) pc.set(x, y, ramp(pal.trim, x === x0 ? 0.55 : 0.9));
  pc.set(12, 10, ramp(pal.cloth, 0.1));
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

export function strawTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const v = 0.5 + Math.sin(x * 1.7 + y * 0.3 + rng() * 0.8) * 0.25;
    pc.set(x, y, mixRgb(rgb('#6d5524'), rgb('#d8bb6a'), Math.max(0, Math.min(1, v))));
  }
  return pc;
}
