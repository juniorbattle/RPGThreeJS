import { bayer, makeNoise, mixRgb, PixelCanvas, ramp, rgb, seeded, type Rgb, type Rng } from './pixelArt';
import type { ArenaEmblem, ArenaPalette, GroundStyle, TileStyle } from './arenaThemes';

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

/**
 * A tooled granite block: grain of light and dark specks, a lit top-left bevel, chisel marks in pairs (a dark cut and
 * its lit lip) and the grout on its lower and right edges.
 */
function paintGraniteBlock(pc: PixelCanvas, rng: Rng, r: Rect, pal: ArenaPalette, base: number): void {
  const noise = makeNoise(rng, 8);
  for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
    const x = r.x + i, y = r.y + j;
    let level = base + (noise(i / 3.5, j / 3.5) - 0.5) * 0.2;
    if (i <= 1 || j <= 1) level += 0.14;
    if (i >= r.w - 2 || j >= r.h - 2) level -= 0.18;
    const grain = rng();
    let c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    if (grain < 0.03) c = ramp(pal.stone, level + 0.22);
    else if (grain > 0.975) c = ramp(pal.stone, level - 0.22);
    pc.set(x, y, c);
  }
  for (let i = 0; i < r.w; i++) pc.set(r.x + i, r.y + r.h - 1, rgb(pal.stoneDark[0]));
  for (let j = 0; j < r.h; j++) pc.set(r.x + r.w - 1, r.y + j, rgb(pal.stoneDark[0]));
  const marks = 2 + Math.floor(rng() * 2);
  for (let k = 0; k < marks; k++) {
    const x = r.x + 3 + Math.floor(rng() * Math.max(1, r.w - 7)), y = r.y + 3 + Math.floor(rng() * Math.max(1, r.h - 7));
    for (let t = 0; t < 3; t++) { pc.set(x + t, y + t, rgb(pal.stoneDark[2])); pc.set(x + t, y + t + 1, ramp(pal.stone, base + 0.22)); }
  }
  if (rng() < 0.35) crack(pc, rng, r.x + 2 + Math.floor(rng() * Math.max(1, r.w - 4)), r.y + 2, 4 + Math.floor(rng() * 8), rgb(pal.stoneDark[1]), r);
}

/**
 * Hewn granite slab for the Bear's arenas: two courses of big tooled blocks in running bond, snow packed into the
 * joints outdoors (the palette's "moss" is snow there) or soot and ore dust underground.
 */
function tileHewnGranite(pal: ArenaPalette, seed: number, snow: boolean): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  pc.fill(rgb(pal.stoneDark[0]));
  const blocks: Rect[] = [];
  for (const [y, h] of [[0, 24], [24, 24]] as const) {
    const cut = 16 + Math.floor(rng() * 17);
    blocks.push({ x: 0, y, w: cut, h }, { x: cut, y, w: TILE_TEXELS - cut, h });
  }
  for (const block of blocks) paintGraniteBlock(pc, rng, block, pal, 0.4 + rng() * 0.22);
  const drift = makeNoise(rng, 6);
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    const block = blocks.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    if (!block) continue;
    const joint = Math.min(x - block.x, y - block.y, block.x + block.w - 1 - x, block.y + block.h - 1 - y);
    // packed into the joints and the corners, a few drifts reaching onto the slab
    const v = drift(x / 3, y / 3) - joint * 0.12 + (snow ? 0.2 : 0.1);
    if (v > 0.62) pc.set(x, y, shadeTone(pal.moss, snow ? Math.min(1, 0.55 + (v - 0.62) * 1.6) : 0.25 + (v - 0.62) * 1.2, x, y));
  }
  return pc;
}

/**
 * Limestone slab for the Dragon's arenas: pale flags of uneven size, smooth and weathered, with what the place lays in
 * their joints: yellowed grass on the terraces' trail, powder snow on the summits, ash in the Wolf's cave (darkened
 * there, with a few wet glints). The Scorpion's old roads take the same worn flags, half drowned in drifting sand.
 */
function tileLimestone(pal: ArenaPalette, seed: number, joint: 'grass' | 'snow' | 'ash' | 'sand'): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  pc.fill(rgb(pal.stoneDark[0]));
  const stones: Rect[] = [];
  splitStones(rng, { x: 0, y: 0, w: TILE_TEXELS, h: TILE_TEXELS }, 3, stones);
  for (const s of stones) paintStone(pc, rng, s, pal, (joint === 'ash' ? 0.4 : 0.5) + rng() * 0.24, 0);
  // weathering pits: a dark hollow with a lit lower lip
  for (let k = 0; k < 5; k++) {
    const x = 2 + Math.floor(rng() * 44), y = 2 + Math.floor(rng() * 43);
    pc.set(x, y, rgb(pal.stoneDark[2])); pc.set(x, y + 1, ramp(pal.stone, 0.85));
  }
  const n = makeNoise(rng, 6), wet = makeNoise(rng, 4);
  const offset = joint === 'snow' ? 0.22 : joint === 'grass' ? 0.1 : joint === 'sand' ? 0.26 : 0.06;
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    const stone = stones.find((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
    if (!stone) continue;
    const edge = Math.min(x - stone.x, y - stone.y, stone.x + stone.w - 1 - x, stone.y + stone.h - 1 - y);
    const v = n(x / 3, y / 3) - edge * 0.14 + offset;
    if (joint === 'ash' && wet(x / 9, y / 9) > 0.7) {
      // a wet patch: darker stone, a glint of firelight here and there
      const [r, g, b] = pc.get(x, y);
      pc.set(x, y, (x * 5 + y * 3) % 23 === 0 ? ramp(pal.stone, 0.9) : mixRgb([r, g, b], rgb(pal.stoneDark[0]), 0.45));
    }
    if (v <= 0.62) continue;
    if (joint === 'grass') pc.set(x, y, shadeTone(pal.grass, Math.min(1, 0.3 + (v - 0.62) * 1.6), x, y));
    else if (joint === 'snow') pc.set(x, y, shadeTone(pal.moss, Math.min(1, 0.55 + (v - 0.62) * 1.6), x, y));
    else if (joint === 'sand') pc.set(x, y, shadeTone(pal.moss, Math.min(1, 0.42 + (v - 0.62) * 1.4), x, y));
    else pc.set(x, y, shadeTone(pal.moss, 0.25 + (v - 0.62) * 1.2, x, y));
  }
  return pc;
}

/**
 * Dressed limestone of Kaelen's esplanade: two courses of large squared flags, a lit bevel and a shaded lip, the
 * palette's dry grass and lichen lodged only in a few joints.
 */
function tileDressedLimestone(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(TILE_TEXELS, TILE_TEXELS);
  const rng = seeded(seed);
  pc.fill(rgb(pal.stoneDark[0]));
  // named slabs, not "flags": the narrative validator reads `flags.<name>` anywhere in src as a story fact
  const slabs: Rect[] = [];
  for (const [y, h] of [[0, 24], [24, 24]] as const) {
    const cut = 18 + Math.floor(rng() * 13);
    slabs.push({ x: 0, y, w: cut, h }, { x: cut, y, w: TILE_TEXELS - cut, h });
  }
  for (const slab of slabs) paintStone(pc, rng, slab, pal, 0.56 + rng() * 0.16, 0);
  const n = makeNoise(rng, 6);
  for (let y = 0; y < TILE_TEXELS; y++) for (let x = 0; x < TILE_TEXELS; x++) {
    const slab = slabs.find((f) => x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
    if (!slab) continue;
    const edge = Math.min(x - slab.x, y - slab.y, slab.x + slab.w - 1 - x, slab.y + slab.h - 1 - y);
    const v = n(x / 3, y / 3) - edge * 0.2;
    if (v > 0.66) pc.set(x, y, shadeTone(pal.moss, Math.min(1, 0.3 + (v - 0.66) * 1.8), x, y));
  }
  return pc;
}

export function tileTopTexture(style: TileStyle, pal: ArenaPalette, seed: number): PixelCanvas {
  if (style === 'packed_earth') return tileEarth(pal, seed);
  if (style === 'sanctum_marble') return tileMarble(pal, seed);
  if (style === 'hewn_granite' || style === 'snowy_granite') return tileHewnGranite(pal, seed, style === 'snowy_granite');
  if (style === 'limestone_flag') return tileLimestone(pal, seed, 'grass');
  if (style === 'snowy_limestone') return tileLimestone(pal, seed, 'snow');
  if (style === 'cave_flag') return tileLimestone(pal, seed, 'ash');
  if (style === 'sand_flag') return tileLimestone(pal, seed, 'sand');
  // the Phoenix's dressed sandstone and the Scorpion's sun-baked court: the same squared flags, in their own palette
  if (style === 'dressed_limestone' || style === 'dressed_sandstone') return tileDressedLimestone(pal, seed);
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
    } else if (style === 'snow_scree') {
      // wind-packed snow with its ripples; where the wind strips it, scree and dry grass
      const ripple = Math.sin(((x * 2 + y) / S) * Math.PI * 12 + n1((x / S) * 8, (y / S) * 8) * 3) > 0.84;
      if (big < 0.3) {
        pc.set(x, y, mid > 0.52 ? shadeTone(pal.stone, Math.max(0, Math.min(1, 0.3 + (fine - 0.5) * 0.5 + (mid - 0.5) * 0.4)), x, y)
          : shadeTone(pal.grass, Math.max(0, Math.min(1, 0.35 + (fine - 0.5) * 0.6)), x, y));
      } else {
        const level = 0.66 + (mid - 0.5) * 0.28 + (fine - 0.5) * 0.12 - (ripple ? 0.14 : 0) - (big < 0.36 ? 0.18 : 0);
        pc.set(x, y, shadeTone(pal.moss, Math.max(0, Math.min(1, level)), x, y));
      }
    } else if (style === 'mine_floor') {
      // packed earth and ore dust, gravel patches, soot where the carts turn
      let c = shadeTone(pal.dirt, Math.max(0, Math.min(1, 0.42 + (big - 0.5) * 0.3 + (mid - 0.5) * 0.25 + (fine - 0.5) * 0.15)), x, y);
      if (mid > 0.66) c = shadeTone(pal.grass, Math.max(0, Math.min(1, 0.25 + fine * 0.45)), x, y);
      if (big < 0.24) c = mixRgb(c, rgb(pal.stoneDark[0]), 0.5);
      pc.set(x, y, c);
    } else if (style === 'snow_terrace') {
      // the terrace's granite flags under the snow, swept bare in patches
      const cx = Math.floor(x / 16), cy = Math.floor((y + (cx % 2) * 8) / 16);
      const lx = x % 16, ly = (y + (cx % 2) * 8) % 16;
      const bare = n1(cx + 0.5, cy + 0.5) > 0.5 && big > 0.4 && lx > 0 && ly > 0;
      const level = bare ? 0.42 + (mid - 0.5) * 0.3 + (lx === 1 || ly === 1 ? 0.14 : 0) - (lx === 15 || ly === 15 ? 0.16 : 0)
        : 0.68 + (mid - 0.5) * 0.26 + (fine - 0.5) * 0.12;
      pc.set(x, y, shadeTone(bare ? pal.stone : pal.moss, Math.max(0, Math.min(1, level)), x, y));
    } else if (style === 'dry_grass_snow') {
      // the Dragon's terraces: short yellowed grass, pale scree where the slope breaks, thin snow lying in the hollows
      if (big < 0.26) pc.set(x, y, shadeTone(pal.stone, Math.max(0, Math.min(1, 0.46 + (fine - 0.5) * 0.5 + (mid - 0.5) * 0.4)), x, y));
      else if (big > 0.7 && mid > 0.5) pc.set(x, y, shadeTone(pal.moss, Math.max(0, Math.min(1, 0.62 + (fine - 0.5) * 0.3)), x, y));
      else pc.set(x, y, shadeTone(pal.grass, Math.max(0, Math.min(1, 0.54 + (big - 0.5) * 0.3 + (mid - 0.5) * 0.25 + (fine - 0.5) * 0.3)), x, y));
    } else if (style === 'desert_sand') {
      // the Arid Deserts: honey sand rippled by the wind, a cracked clay pan in the hollows (seamless: whole periods only)
      const ripple = Math.sin(((x * 3 + y * 2) / S) * Math.PI * 12 + n1((x / S) * 8, (y / S) * 8) * 4);
      if (big < 0.24) {
        const crack = Math.abs(Math.sin((x / S) * Math.PI * 28 + mid * 5)) < 0.09 || Math.abs(Math.sin((y / S) * Math.PI * 24 + fine * 5)) < 0.09;
        pc.set(x, y, crack ? rgb(pal.dirt[0]) : shadeTone(pal.dirt, Math.max(0, Math.min(1, 0.62 + (fine - 0.5) * 0.3 - (big < 0.12 ? 0.1 : 0))), x, y));
      } else {
        const level = 0.56 + (mid - 0.5) * 0.3 + (fine - 0.5) * 0.12 + (ripple > 0.8 ? 0.16 : ripple < -0.72 ? -0.14 : 0) - (big < 0.3 ? 0.08 : 0);
        pc.set(x, y, shadeTone(pal.moss, Math.max(0, Math.min(1, level)), x, y));
      }
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

/**
 * Cobbled village square around the platform: rounded setts in staggered
 * rows, packed earth in the joints, worn and missing stones toward a ragged
 * alpha-cut edge, a few scorch marks from the fires (u spans x, v spans z).
 */
export function cobbleApronTexture(pal: ArenaPalette, seed: number, w = 384, h = 256): PixelCanvas {
  const pc = new PixelCanvas(w, h);
  const rng = seeded(seed);
  const n1 = makeNoise(rng, 8), n2 = makeNoise(rng, 16);
  const k = w / 192; // texels per apron unit of the 192-wide layout
  const cell = Math.round(6 * k);
  const cols = Math.ceil(w / cell + 2);
  const jitter = Array.from({ length: cols * Math.ceil(h / cell + 2) }, () => [rng(), rng(), rng()] as const);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x / (w - 1)) * 2 - 1, v = (y / (h - 1)) * 2 - 1;
    const box = Math.max(Math.abs(u) / 0.9, Math.abs(v) / 0.84);
    const edge = box + (n1(x / (6 * k), y / (6 * k)) - 0.5) * 0.45 + (n2(x / (2.5 * k), y / (2.5 * k)) - 0.5) * 0.15;
    if (edge > 1) continue;
    const row = Math.floor(y / cell);
    const sx = x + (row % 2) * (cell / 2);
    const cx = Math.floor(sx / cell);
    const j = jitter[(row + 1) * cols + cx + 1] ?? [0.5, 0.5, 0.5];
    const lx = (sx % cell) - cell / 2 + 0.5 + (j[0] - 0.5) * k, ly = (y % cell) - cell / 2 + 0.5 + (j[1] - 0.5) * 0.6 * k;
    const d = Math.hypot(lx / (2.7 * k), ly / (2.4 * k));
    const missing = j[2] < 0.06 + Math.max(0, edge - 0.7) * 0.9;
    let c: Rgb;
    if (d > 1 || missing) {
      c = shadeTone(pal.dirt, 0.25 + (n2(x / (3 * k), y / (3 * k)) - 0.5) * 0.3, x, y); // earth in the joints
    } else {
      // domed sett: lit up-left, shaded down-right, a tone per stone
      const level = 0.42 + j[2] * 0.22 - ((lx + ly) / k) * 0.06 - d * 0.12 + (n1(x / (3 * k), y / (3 * k)) - 0.5) * 0.12;
      c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    }
    if (n1(x / (9 * k) + 3, y / (9 * k)) > 0.78) c = mixRgb(c, rgb(pal.stoneDark[0]), 0.55); // soot from the fires
    pc.set(x, y, c);
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

const BEAR_W = 26, BEAR_H = 34;

/**
 * The Bear clan's sign: a bear risen on its hind legs, facing left, forepaws raised and jaw open, on the lion's 26×34
 * grid so a banner takes either sign. 0 empty, 1 body, 2 the shoulder hump and the ear (the fur's shade). Sampled in
 * continuous grid units, so a carved relief draws it larger from the same strokes.
 */
function bearShape(px: number, py: number): 0 | 1 | 2 {
  if (Math.hypot(px - 7.6, py - 6.0) < 0.62) return 0; // eye
  if (Math.hypot(px - 2.5, py - 7.3) < 0.62) return 0; // nose
  if (inEllipse(px, py, 10.4, 3.6, 1.55, 1.35)) return 2; // round ear
  if (inEllipse(px, py, 8.6, 7.0, 3.9, 3.4) || inEllipse(px, py, 4.6, 8.2, 2.4, 1.7)) return 1; // head, short muzzle
  if (inEllipse(px, py, 13.6, 10.8, 4.8, 3.8)) return 2; // shoulder hump
  if (inEllipse(px, py, 13.6, 17.0, 6.4, 7.6) || inEllipse(px, py, 14.4, 23.2, 6.0, 4.6)
    || inStroke(px, py, [[10.8, 12.6], [7.2, 13.4], [4.0, 11.6]], 4.6, 3.6) || inEllipse(px, py, 3.4, 11.4, 2.0, 1.8)
    || inStroke(px, py, [[11.0, 17.4], [7.6, 18.8], [4.8, 18.0]], 4.4, 3.4) || inEllipse(px, py, 4.2, 17.8, 1.9, 1.7)
    || inStroke(px, py, [[11.8, 25.0], [11.0, 28.4], [11.2, 31.2]], 5.6, 4.6) || inEllipse(px, py, 10.0, 32.2, 3.0, 1.3)
    || inStroke(px, py, [[17.4, 25.0], [18.2, 28.6], [17.8, 31.2]], 5.4, 4.4) || inEllipse(px, py, 17.0, 32.2, 3.0, 1.3)
    || inEllipse(px, py, 20.6, 21.6, 1.2, 1.1)) return 1;
  // claws on the forepaws
  for (const [cx, cy] of [[1.2, 11.4], [2.2, 17.8]] as const) if ([-0.8, 0, 0.8].some((dy) => inEllipse(px, py, cx, cy + dy, 0.6, 0.26))) return 1;
  return 0;
}

interface BearTones { lit: number; mid: number; shade: number; fur: number }
const BANNER_BEAR: BearTones = { lit: 1, mid: 0.7, shade: 0.34, fur: 0.45 };

/** Paints the bear at (ox, oy), `scale` times the banner size: lit up-left edges, shaded down-right edges, darker fur. */
function paintBear(pc: PixelCanvas, ox: number, oy: number, tones: readonly string[], levels: BearTones, scale = 1, onPixel?: (x: number, y: number) => void): void {
  const W = Math.round(BEAR_W * scale), H = Math.round(BEAR_H * scale);
  const part = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : bearShape((x + 0.5) / scale, (y + 0.5) / scale));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = part(x, y);
    if (!p) continue;
    const lit = !part(x - 1, y) || !part(x, y - 1);
    const shade = !part(x + 1, y) || !part(x, y + 1);
    const t = lit ? levels.lit : shade ? levels.shade : p === 2 ? levels.fur : levels.mid;
    pc.set(ox + x, oy + y, ramp(tones, t));
    onPixel?.(ox + x, oy + y);
  }
}

/** The bottom of a Bear banner: three points, the middle one longest. */
function bearBannerHem(x: number, W: number, H: number): number {
  const local = ((x + 0.5) / (W / 3)) % 1;
  return H - 1 - Math.abs(local - 0.5) * 2 * 10 - (Math.floor((x + 0.5) / (W / 3)) === 1 ? 0 : 2);
}

/**
 * Heraldic banner (40×80, the decor's 32 texels/m): house cloth, border and the house sign. The lion's banners keep
 * their gold border and swallowtail; the Bear's are slate and bone, with an angular band and a three-pointed hem.
 */
export function bannerTexture(pal: ArenaPalette, seed: number, burning = false, emblem: ArenaEmblem = 'lion'): PixelCanvas {
  if (emblem === 'bear') return bearBannerTexture(pal, seed);
  if (emblem === 'dragon') return dragonBannerTexture(pal, seed);
  if (emblem === 'wolf') return wolfBannerTexture(pal, seed);
  if (emblem === 'scorpion') return scorpionBannerTexture(pal, seed);
  if (emblem === 'phoenix') return phoenixBannerTexture(pal, seed);
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

function bearBannerTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y > bearBannerHem(x, W, H)) continue;
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.6 + fold + (n(x / 6, y / 6) - 0.5) * 0.2, x, y);
    const dy = y - (H - 24), zig = Math.abs(((x + 4) % 8) - 4);
    const band = dy >= 0 && dy <= 5 && (dy === zig || dy === zig + 1);
    const hem = y > bearBannerHem(x, W, H) - 2;
    if (x <= 3 && x >= 2 || x >= W - 4 && x <= W - 3 || (y >= 4 && y <= 5) || band || hem) c = shadeTone(pal.trim, x <= 3 || y <= 5 ? 0.8 : 0.5, x, y);
    pc.set(x, y, c);
  }
  paintBear(pc, 7, 14, pal.trim, BANNER_BEAR);
  return pc;
}

/**
 * Carved panel of the Bear's pillars and hall: a dressed granite face with a bevelled frame, angular bands above and
 * below, and the house bear in relief at 1.3 times the banner's size, standing proud with its shadow to the lower
 * right (stone only: no gold, no glow).
 */
export function bearReliefTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 72;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let level = 0.32 + (n(x / 4, y / 4) - 0.5) * 0.16;
    if (edge < 3) level = edge === 0 ? 0.1 : x < W - 3 && y < H - 3 && (x < 3 || y < 3) ? 0.6 : 0.2;
    else if (edge === 3) level = 0.16;
    let c = shadeTone(pal.stone, level, x, y);
    if (edge > 3 && rng() < 0.05) c = rgb(pal.stoneDark[1]);
    pc.set(x, y, c);
  }
  // angular bands, cut into the stone: a dark groove with a lit lower lip
  for (const top of [6, H - 12]) for (let x = 5; x < W - 5; x++) {
    const zig = Math.abs(((x + 3) % 6) - 3);
    pc.set(x, top + zig, rgb(pal.stoneDark[0]));
    pc.set(x, top + zig + 1, ramp(pal.stone, 0.66));
  }
  const relief = new Set<number>();
  const scale = 1.3, ox = Math.round((W - BEAR_W * scale) / 2), oy = 13;
  paintBear(pc, ox, oy, pal.stone, { lit: 0.96, mid: 0.68, shade: 0.2, fur: 0.5 }, scale, (x, y) => relief.add(y * W + x));
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    if (relief.has((y - 1) * W + x - 1) && !relief.has(y * W + x) && Math.min(x, y, W - 1 - x, H - 1 - y) > 3) pc.set(x, y, rgb(pal.stoneDark[0]));
  }
  return pc;
}

// ---------------------------------------------------------------- the Dragon's and the Wolf's signs

function inPoly(px: number, py: number, pts: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The sign's grid, shared by the lion and the bear so a banner takes any of them. */
export const SIGIL_W = 26, SIGIL_H = 34;

const DRAGON_NEAR_WING: ReadonlyArray<readonly [number, number]> = [
  [12.2, 18.6], [14.6, 10.4], [17.4, 3.6], [22.8, 0.6], [25.4, 2.6], [24.2, 5.6], [25.6, 9.2], [23.6, 10.8], [23.8, 14.6],
  [21.6, 14.4], [19.4, 17.4], [17.0, 16.4], [15.0, 19.0],
];
const DRAGON_FAR_WING: ReadonlyArray<readonly [number, number]> = [
  [10.6, 17.4], [10.2, 10.4], [11.4, 4.4], [13.6, 1.2], [14.4, 5.0], [15.6, 8.4], [13.8, 10.0], [13.6, 13.6],
];
const DRAGON_SPINES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[7.4, 10.6], [9.2, 11.0], [7.6, 12.4]], [[7.8, 13.2], [9.6, 13.8], [8.0, 15.0]], [[8.8, 15.8], [10.6, 16.4], [9.2, 17.4]],
];

/**
 * The Dragon clan's sign: a Western dragon passant, facing left: four legs on the ground (the far foreleg lifted), a
 * long neck rising to a horned head with its jaw open, two membranous wings lifted high over the back, a spade-tipped
 * tail. Never a serpent. 0 empty, 1 body and wing bones, 2 the near wing's membrane, 3 the far wing behind the neck.
 * Sampled in continuous grid units, so a relief or a statue draws it larger from the same strokes.
 */
export function dragonShape(px: number, py: number): 0 | 1 | 2 | 3 {
  if (Math.hypot(px - 4.6, py - 7.9) < 0.55) return 0; // eye
  // head, snout and an open jaw, horns swept back, spines down the neck
  if (inEllipse(px, py, 5.2, 8.4, 2.6, 1.9) || inStroke(px, py, [[4.4, 8.6], [0.8, 9.6]], 2.4, 1.6)
    || inStroke(px, py, [[4.6, 10.2], [1.4, 11.4]], 1.2, 0.8)) return 1;
  if (inStroke(px, py, [[6.4, 7.2], [9.0, 5.0], [10.8, 5.0]], 1.1, 0.35) || inStroke(px, py, [[5.6, 6.8], [7.0, 4.4]], 0.8, 0.3)) return 1;
  if (DRAGON_SPINES.some((spine) => inPoly(px, py, spine))) return 1;
  // neck, chest and body
  if (inStroke(px, py, [[8.4, 18.0], [6.2, 13.0], [6.6, 9.4]], 3.6, 2.6) || inEllipse(px, py, 8.6, 19.6, 3.2, 3.4)
    || inEllipse(px, py, 14.0, 21.0, 6.5, 3.6) || inEllipse(px, py, 18.4, 22.4, 3.4, 3.2)) return 1;
  // the four legs: the near foreleg planted, the far one lifted, both hind legs planted; claws on the planted feet
  if (inStroke(px, py, [[9.0, 22.0], [8.2, 26.5], [7.4, 30.5]], 2.6, 1.8) || inEllipse(px, py, 6.4, 31.2, 1.8, 0.8)
    || inStroke(px, py, [[11.0, 22.5], [12.4, 26.6], [10.6, 29.4]], 2.2, 1.6) || inEllipse(px, py, 9.8, 29.8, 1.3, 0.9)
    || inStroke(px, py, [[18.8, 24.0], [17.2, 27.6], [18.4, 30.8]], 2.8, 1.8) || inEllipse(px, py, 17.8, 31.3, 2.2, 0.85)
    || inStroke(px, py, [[20.6, 23.8], [22.2, 27.4], [21.4, 30.6]], 2.3, 1.6) || inEllipse(px, py, 21.6, 31.2, 1.9, 0.8)) return 1;
  for (const [cx, cy] of [[4.5, 31.6], [15.6, 31.7], [8.4, 30.4]] as const) if (inEllipse(px, py, cx, cy, 0.7, 0.3)) return 1;
  // the tail, swinging out behind and curling down to its spade
  if (inStroke(px, py, [[20.0, 21.0], [23.8, 21.6], [25.4, 24.6], [24.6, 27.6]], 2.4, 0.9) || inPoly(px, py, [[23.6, 27.0], [25.8, 28.4], [23.4, 30.0]])) return 1;
  // the near wing: arm and finger bones over the membrane, scalloped between the tips
  if (inStroke(px, py, [[12.6, 18.2], [14.6, 10.4], [17.4, 3.6], [22.8, 0.6]], 1.6, 0.6) || inEllipse(px, py, 16.8, 2.6, 0.5, 0.9)
    || [[25.4, 2.6], [25.6, 9.2], [23.8, 14.6], [19.4, 17.4]].some(([x, y]) => inStroke(px, py, [[17.4, 3.6], [x!, y!]], 0.8, 0.45))) return 1;
  if (inPoly(px, py, DRAGON_NEAR_WING)) return 2;
  if (inPoly(px, py, DRAGON_FAR_WING)) return 3;
  return 0;
}

/**
 * The Wolf clan's sign: a wolf's head facing left, ears pricked, jaws open in a snarl on its fangs, the neck's ruff
 * cut off in ragged tufts. 0 empty, 1 head and fur, 2 the far ear, the inner ear, the brow and the ruff's strands
 * (the fur's shade), 3 the dark of the open mouth.
 */
export function wolfShape(px: number, py: number): 0 | 1 | 2 | 3 {
  if (inEllipse(px, py, 12.4, 11.4, 1.0, 0.5)) return 0; // eye
  // fangs over the dark of the open mouth
  if (inPoly(px, py, [[5.6, 15.6], [6.8, 15.6], [6.2, 17.4]]) || inPoly(px, py, [[9.0, 15.6], [10.2, 15.6], [9.6, 17.2]])
    || inPoly(px, py, [[7.2, 18.0], [8.2, 18.0], [7.7, 16.6]])) return 1;
  if (inPoly(px, py, [[4.4, 15.6], [11.4, 15.2], [11.6, 17.4], [5.0, 17.9]])) return 3; // the open mouth
  if (inStroke(px, py, [[10.6, 10.0], [14.4, 10.6]], 0.8, 0.8)) return 2; // brow
  if (inPoly(px, py, [[13.8, 8.2], [14.2, 3.6], [16.0, 7.8]])) return 2; // inner ear
  if (inEllipse(px, py, 14.8, 12.4, 5.2, 4.6) || inPoly(px, py, [[12.6, 9.0], [13.8, 1.2], [17.4, 8.2]])
    || inStroke(px, py, [[11.4, 12.6], [4.0, 14.2]], 4.6, 3.2) || inEllipse(px, py, 3.0, 13.8, 1.5, 1.3)
    || inStroke(px, py, [[11.6, 18.2], [5.0, 18.9]], 2.8, 1.8) || inEllipse(px, py, 12.0, 16.4, 2.8, 2.6)) return 1;
  if (inPoly(px, py, [[16.8, 8.8], [20.4, 2.4], [21.0, 10.0]])) return 2; // far ear
  const ruff = inPoly(px, py, [
    [10.6, 18.6], [13.0, 20.6], [11.4, 24.6], [14.2, 23.4], [13.4, 27.6], [16.6, 25.2], [17.0, 29.8], [19.4, 26.0],
    [21.6, 29.2], [22.4, 24.6], [24.6, 25.8], [23.0, 20.2], [21.4, 13.8], [18.6, 9.6],
  ]);
  if (ruff) return Math.sin(px * 0.9 + py * 1.7) > 0.72 ? 2 : 1;
  return 0;
}

interface SigilTones { lit: number; mid: number; shade: number; part2: number; part3: number }

/** Paints a sign at (ox, oy), `scale` times the banner size: lit up-left edges, shaded down-right edges, each part its tone. */
function paintSigil(pc: PixelCanvas, shape: (px: number, py: number) => number, ox: number, oy: number, tones: readonly string[], levels: SigilTones,
  scale = 1, flip = false, onPixel?: (x: number, y: number) => void): void {
  const W = Math.round(SIGIL_W * scale), H = Math.round(SIGIL_H * scale);
  const part = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : shape(((flip ? W - 1 - x : x) + 0.5) / scale, (y + 0.5) / scale));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = part(x, y);
    if (!p) continue;
    // the light comes from the upper left whichever way the sign faces
    const lit = part(x - 1, y) !== p || part(x, y - 1) !== p;
    const shade = part(x + 1, y) === 0 || part(x, y + 1) === 0;
    const t = p === 2 ? (lit ? levels.part2 + 0.16 : levels.part2) : p === 3 ? levels.part3 : lit ? levels.lit : shade ? levels.shade : levels.mid;
    pc.set(ox + x, oy + y, ramp(tones, t));
    onPixel?.(ox + x, oy + y);
  }
}

/** Shape and tones of the Dragon's sign, for the statues drawn in `arenaSprites`. */
export function paintDragonSigil(pc: PixelCanvas, ox: number, oy: number, tones: readonly string[], scale: number, flip: boolean, onPixel?: (x: number, y: number) => void): void {
  paintSigil(pc, dragonShape, ox, oy, tones, { lit: 0.96, mid: 0.7, shade: 0.3, part2: 0.46, part3: 0.24 }, scale, flip, onPixel);
}

/**
 * The Dragon's banner (40×80): deep jade cloth with a pale jade border, a cloud-scroll band above a straight hem
 * fringed with tassels, and the winged dragon in pale jade. No gold.
 */
function dragonBannerTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y > H - 5 && (x % 3 === 2 || y > H - 2 + (x % 2))) continue; // tasselled fringe
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.6 + fold + (n(x / 6, y / 6) - 0.5) * 0.2, x, y);
    const scroll = Math.abs(y - (H - 15) - Math.round(Math.sin(x * 0.55) * 2.2)) < 1; // a band of rolling clouds
    if (x <= 3 && x >= 2 || x >= W - 4 && x <= W - 3 || (y >= 4 && y <= 5) || scroll || y > H - 6) c = shadeTone(pal.trim, x <= 3 || y <= 5 ? 0.8 : 0.5, x, y);
    pc.set(x, y, c);
  }
  paintSigil(pc, dragonShape, 7, 14, pal.trim, { lit: 1, mid: 0.72, shade: 0.36, part2: 0.42, part3: 0.22 });
  return pc;
}

/** The Wolf's banner (40×80): soot-black cloth torn at the hem and the edges, a crude bone stitching, the wolf's head in bone. */
function wolfBannerTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), tear = makeNoise(rng, 16);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // ragged hem in long tongues, nicks along the edges, a hole or two
    const hem = H - 4 - Math.abs(Math.sin(x * 0.7 + seed)) * 9 - tear(x / 2, 3) * 6;
    if (y > hem) continue;
    if ((x < 2 || x > W - 3) && tear(x, y / 3) > 0.7 && y > 8) continue;
    if (y > 50 && tear(x / 3 + 5, y / 3) > 0.86) continue;
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.55 + fold + (n(x / 6, y / 6) - 0.5) * 0.24, x, y);
    if ((y === 4 || y === 6) && x % 3 !== 0) c = shadeTone(pal.trim, 0.5, x, y); // stitched sleeve
    if (y >= hem - 1) c = shadeTone(pal.cloth, 0.25, x, y); // frayed edge
    pc.set(x, y, c);
  }
  paintSigil(pc, wolfShape, 7, 14, pal.trim, { lit: 1, mid: 0.74, shade: 0.4, part2: 0.46, part3: 0 });
  return pc;
}

/**
 * Carved panel of the Dragon's steles, pedestals and hall: a dressed limestone face with a bevelled frame and a thin
 * verdigris inlay, cloud-scroll grooves above and below, and the winged dragon in relief at 1.3 times the banner's
 * size, standing proud with its shadow to the lower right. Stone and verdigris only: no gold, no glow.
 */
export function dragonReliefTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 72;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let level = 0.46 + (n(x / 4, y / 4) - 0.5) * 0.16;
    if (edge < 3) level = edge === 0 ? 0.14 : x < W - 3 && y < H - 3 && (x < 3 || y < 3) ? 0.82 : 0.3;
    else if (edge === 3) level = 0.24;
    let c = shadeTone(pal.stone, level, x, y);
    if (edge === 4) c = (x + y) % 2 ? rgb('#3d6a5c') : rgb('#5d8f7c'); // verdigris inlay
    if (edge > 4 && rng() < 0.04) c = rgb(pal.stoneDark[2]);
    pc.set(x, y, c);
  }
  // cloud-scroll grooves: a dark cut with a lit lower lip
  for (const top of [8, H - 10]) for (let x = 6; x < W - 6; x++) {
    const y = top + Math.round(Math.sin(x * 0.7) * 1.6);
    pc.set(x, y, rgb(pal.stoneDark[1]));
    pc.set(x, y + 1, ramp(pal.stone, 0.9));
  }
  const relief = new Set<number>();
  const scale = 1.3, ox = Math.round((W - SIGIL_W * scale) / 2), oy = 13;
  paintSigil(pc, dragonShape, ox, oy, pal.stone, { lit: 1, mid: 0.74, shade: 0.34, part2: 0.56, part3: 0.4 }, scale, false, (x, y) => relief.add(y * W + x));
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    if (relief.has((y - 1) * W + x - 1) && !relief.has(y * W + x) && Math.min(x, y, W - 1 - x, H - 1 - y) > 4) pc.set(x, y, rgb(pal.stoneDark[1]));
  }
  return pc;
}

/** Pale limestone for needles, cliffs and boulders: smooth weathered faces, vertical runnels, faint bedding and pits (seamless). */
export function limestoneTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let level = 0.56 + (n(x / 4, y / 4) - 0.5) * 0.28 + (fine(x / 2, y / 2) - 0.5) * 0.1;
    const runnel = Math.abs(Math.sin(x * 0.59 + n(x / 4, y / 10) * 3));
    if (runnel < 0.13) level -= 0.18; else if (runnel < 0.24) level += 0.08; // a runnel and its lit lip
    if ((y + Math.round(n(x / 8, 1) * 3)) % 11 === 0) level -= 0.1; // bedding
    let c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    if (rng() < 0.02) c = rgb(pal.stoneDark[2]);
    pc.set(x, y, c);
  }
  return pc;
}

/** Verdigris bronze: green-blue patina in broad patches, the brown bronze showing through where it wears (seamless). */
export function verdigrisTexture(seed: number): PixelCanvas {
  const S = 16;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4), fine = makeNoise(rng, 8);
  const patina = ['#24463c', '#386858', '#578e7a', '#84b6a0'] as const;
  const bronze = ['#3e2f1c', '#5e4628', '#7e6036'] as const;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = n(x / 4, y / 4), f = fine(x / 2, y / 2);
    pc.set(x, y, v < 0.3 ? shadeTone(bronze, 0.3 + f * 0.6, x, y) : shadeTone(patina, Math.max(0, Math.min(1, 0.25 + (v - 0.3) * 0.9 + (f - 0.5) * 0.3)), x, y));
  }
  return pc;
}

/** A hide hung in the Wolf's cave (24×40): scraped leather with darker patches, a fur edge on top, a ragged outline. */
export function hideTexture(seed: number): PixelCanvas {
  const W = 24, H = 40;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), edge = makeNoise(rng, 16);
  const leather = ['#2e2014', '#47321f', '#62472c', '#7d5f3c', '#97784f'] as const;
  const fur = ['#26221e', '#3c3630', '#575048', '#726a5f'] as const;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const inset = 1 + edge(x / 3, y / 4) * 2.4 + (y > H - 8 ? (y - (H - 8)) * 0.5 * Math.abs(Math.sin(x * 0.6 + seed)) : 0);
    if (x < inset || x > W - 1 - inset || y > H - 1 - edge(x / 2, 7) * 3) continue;
    const furry = y < 5 + edge(x / 2, 1) * 2;
    const c = furry ? shadeTone(fur, 0.3 + edge(x, y) * 0.6, x, y) : shadeTone(leather, Math.max(0, Math.min(1, 0.55 + (n(x / 4, y / 5) - 0.5) * 0.5 - (x > W - 5 ? 0.15 : 0))), x, y);
    pc.set(x, y, c);
  }
  for (let y = 9; y < H - 6; y += 4) pc.set(2 + (y % 3), y, rgb('#1a120b')); // lacing holes down one side
  return pc;
}

/** A grey wolf pelt stretched flat, seen from above (48×32): body, four legs, the head and tail, a darker stripe down the back. */
export function peltTexture(seed: number): PixelCanvas {
  const W = 48, H = 32;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), tuft = makeNoise(rng, 16);
  const fur = ['#252527', '#3b3b3e', '#56565a', '#77777b', '#9c9ca0', '#c2c2c4'] as const;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x + 0.5, py = y + 0.5;
    const ragged = (tuft(x / 2, y / 2) - 0.5) * 1.6;
    const inside = inEllipse(px, py, 24, 16, 15 + ragged, 8 + ragged)
      || inStroke(px, py, [[14, 12], [8, 4]], 4.4, 3.0) || inStroke(px, py, [[14, 20], [8, 28]], 4.4, 3.0)
      || inStroke(px, py, [[33, 12], [39, 4]], 4.4, 3.0) || inStroke(px, py, [[33, 20], [39, 28]], 4.4, 3.0)
      || inEllipse(px, py, 6.5, 16, 4.6, 3.6) || inStroke(px, py, [[39, 16], [46.5, 16]], 3.4, 1.6);
    if (!inside) continue;
    const stripe = Math.abs(py - 16) < 2.4 + (tuft(x / 3, 2) - 0.5) * 2;
    const level = 0.55 + (n(x / 5, y / 5) - 0.5) * 0.3 - (stripe ? 0.32 : 0) + (Math.abs(py - 16) > 6 ? 0.12 : 0) + (tuft(x, y) - 0.5) * 0.18;
    pc.set(x, y, shadeTone(fur, Math.max(0, Math.min(1, level)), x, y));
  }
  pc.set(4, 15, rgb('#0c0c0d')); pc.set(4, 17, rgb('#0c0c0d')); // the empty eyes
  return pc;
}

/** Rough granite for outcrops and hewn masses: salt-and-pepper grain, faint strata and a few fissures (seamless). */
export function graniteTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const level = 0.46 + (n(x / 4, y / 4) - 0.5) * 0.34 + (fine(x / 2, y / 2) - 0.5) * 0.12 + Math.sin((y / S) * Math.PI * 6 + n(x / 4, 2) * 2) * 0.04;
    const grain = rng();
    let c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    if (grain < 0.06) c = ramp(pal.stone, level + 0.3);
    else if (grain > 0.93) c = rgb(pal.stoneDark[1]);
    pc.set(x, y, c);
  }
  for (let k = 0; k < 3; k++) crack(pc, rng, 2 + Math.floor(rng() * 28), 1 + Math.floor(rng() * 20), 6 + Math.floor(rng() * 10), rgb(pal.stoneDark[0]), { x: 0, y: 0, w: S, h: S });
  return pc;
}

/** Wind-packed snow: broad soft drifts in the snow ramp, blue dimples and a few sparkling texels (seamless). */
export function snowTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    pc.set(x, y, shadeTone(pal.moss, Math.max(0, Math.min(1, 0.72 + (n(x / 8, y / 8) - 0.5) * 0.32 + (fine(x / 2, y / 2) - 0.5) * 0.12)), x, y));
  }
  for (let k = 0; k < 10; k++) pc.set(Math.floor(rng() * S), Math.floor(rng() * S), rgb(pal.moss[pal.moss.length - 1]));
  for (let k = 0; k < 8; k++) pc.set(Math.floor(rng() * S), Math.floor(rng() * S), rgb(pal.moss[1]));
  return pc;
}

/** Ore-bearing rock: dark granite crossed by dull black veins, a few cold glints beside them (no crystal, no glow). */
export function oreTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), vein = makeNoise(rng, 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = Math.abs(Math.sin(((x + y * 0.6) / S) * Math.PI * 4 + vein(x / 8, y / 8) * 5));
    const level = 0.3 + (n(x / 4, y / 4) - 0.5) * 0.3;
    pc.set(x, y, v < 0.13 ? rgb('#060607') : shadeTone(pal.stone, Math.max(0.04, Math.min(0.9, level)), x, y));
    if (v >= 0.13 && v < 0.2 && rng() < 0.08) pc.set(x, y, ramp(pal.stone, 0.95));
  }
  return pc;
}

/**
 * The terrace before the Bear's hall around the platform: big granite flags in staggered courses, the snow swept
 * toward a ragged alpha-cut edge and lodged in the joints (u spans x, v spans z).
 */
export function flagApronTexture(pal: ArenaPalette, seed: number, w = 384, h = 256): PixelCanvas {
  const pc = new PixelCanvas(w, h);
  const rng = seeded(seed);
  const n1 = makeNoise(rng, 8), n2 = makeNoise(rng, 16);
  const k = w / 192;
  const course = Math.round(19 * k), flag = Math.round(27 * k);
  const shades = Array.from({ length: 64 }, () => rng());
  const offsets = Array.from({ length: 64 }, () => Math.round(rng() * flag));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x / (w - 1)) * 2 - 1, v = (y / (h - 1)) * 2 - 1;
    const box = Math.max(Math.abs(u) / 0.9, Math.abs(v) / 0.84);
    const edge = box + (n1(x / (6 * k), y / (6 * k)) - 0.5) * 0.4 + (n2(x / (2.5 * k), y / (2.5 * k)) - 0.5) * 0.12;
    if (edge > 1) continue;
    const row = Math.floor(y / course);
    const sx = x + (offsets[row & 63] ?? 0);
    const col = Math.floor(sx / flag);
    const lx = sx % flag, ly = y % course;
    const joint = lx < Math.max(1, Math.round(k * 0.6)) || ly < Math.max(1, Math.round(k * 0.6));
    const snow = (edge - 0.5) * 1.9 + (n1(x / (4 * k) + 5, y / (4 * k)) - 0.5) * 0.7;
    let c: Rgb;
    if (snow > 0.35 || (joint && snow > 0.05)) {
      c = shadeTone(pal.moss, Math.max(0, Math.min(1, 0.62 + (n2(x / (3 * k), y / (3 * k)) - 0.5) * 0.3 - (joint ? 0.12 : 0))), x, y);
    } else if (joint) {
      c = rgb(pal.stoneDark[0]);
    } else {
      const lit = lx < 2 * k || ly < 2 * k ? 0.12 : lx > flag - 2 * k || ly > course - 2 * k ? -0.12 : 0;
      const level = 0.42 + ((shades[(row * 7 + col) & 63] ?? 0.5) - 0.5) * 0.22 + lit + (n2(x / (2 * k), y / (2 * k)) - 0.5) * 0.12;
      c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    }
    pc.set(x, y, c);
  }
  return pc;
}

/**
 * Lime plaster between the timbers: broad flat patches in the plaster ramp,
 * hairline cracks and a few stains; soot-darkened on burning houses.
 */
export function plasterTexture(pal: ArenaPalette, seed: number, burning: boolean): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4), fine = makeNoise(rng, 16);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    let level = 0.62 + (n(x / 8, y / 8) - 0.5) * 0.22 + (fine(x / 2, y / 2) - 0.5) * 0.06;
    if (burning) level -= 0.16 + (n(x / 8 + 2, y / 8) > 0.6 ? 0.18 : 0);
    pc.set(x, y, shadeTone(pal.plaster, Math.max(0.04, Math.min(0.96, level)), x, y));
  }
  crack(pc, rng, 6 + Math.floor(rng() * 20), 3, 9 + Math.floor(rng() * 8), ramp(pal.plaster, 0.1), { x: 0, y: 0, w: 32, h: 32 });
  for (let k = 0; k < 3; k++) { // a weathering stain
    const cx = Math.floor(rng() * 32), cy = Math.floor(rng() * 32);
    for (let j = 0; j < 4; j++) pc.tint(cx, cy + j, 0.9);
  }
  return pc;
}

/**
 * Leaded window (9×14): wood frame, cross mullion, four panes lit by lamps
 * (or by fire inside). Returns the face and its emissive mask (panes only).
 */
export function windowTextures(burning: boolean): { face: PixelCanvas; glow: PixelCanvas } {
  const W = 9, H = 14;
  const face = new PixelCanvas(W, H), glow = new PixelCanvas(W, H);
  glow.fill([0, 0, 0]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const frame = x === 0 || x === W - 1 || y === 0 || y === H - 1 || x === 4 || y === 6;
    if (frame) { face.set(x, y, rgb(x === 0 || y === 0 ? '#4a3626' : '#22170f')); continue; }
    const t = burning ? 1 - y / H : y / H;
    const lead = (x + y) % 4 === 0; // diamond leading
    const c = burning ? mixRgb(rgb('#ffd47a'), rgb('#e0541a'), t) : mixRgb(rgb('#ffe9a8'), rgb('#d8923a'), t);
    face.set(x, y, lead ? mixRgb(c, rgb('#3a2a1a'), 0.45) : c);
    glow.set(x, y, lead ? mixRgb(c, rgb('#000000'), 0.5) : c);
  }
  return { face, glow };
}

/**
 * Monolithic headstone face (24×32): weathered single stone, a carved ring
 * and epitaph lines (dark cut, lit lower lip), lichen creeping from the foot.
 */
export function gravestoneTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 24, H = 32;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), moss = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let level = 0.5 + (n(x / 5, y / 5) - 0.5) * 0.24 - (x > W - 3 ? 0.14 : x < 2 ? -0.1 : 0);
    let c = shadeTone(pal.stone, Math.max(0.05, Math.min(0.95, level)), x, y);
    if (moss(x / 3, y / 3) - (H - y) * 0.035 > 0.38) c = shadeTone(pal.moss, 0.35 + moss(x, y) * 0.4, x, y);
    pc.set(x, y, c);
  }
  const cut = (x: number, y: number) => { pc.set(x, y, rgb(pal.stoneDark[0])); pc.set(x, y + 1, ramp(pal.stone, 0.75)); };
  for (let a = 0; a < Math.PI * 2; a += 0.2) cut(Math.round(12 + Math.cos(a) * 4), Math.round(9 + Math.sin(a) * 4));
  for (const [y, w] of [[17, 12], [20, 14], [23, 10]] as const) for (let x = 12 - w / 2; x < 12 + w / 2; x++) if ((x * 7 + y) % 5) cut(x, y);
  crack(pc, rng, 3 + Math.floor(rng() * 18), 2, 10, rgb(pal.stoneDark[1]), { x: 0, y: 0, w: W, h: H });
  return pc;
}

/** Lantern pane: iron frame and cross bars over warm glass, brightest at the flame. */
export function lanternTexture(): PixelCanvas {
  const W = 8, H = 12;
  const pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const frame = x === 0 || x === W - 1 || y === 0 || y === H - 1 || y === 5 || x === 3 || x === 4 && y < 2;
    const glow = 1 - Math.min(1, Math.hypot(x - 3.5, y - 7.5) / 6);
    pc.set(x, y, frame ? rgb('#241f1b') : mixRgb(rgb('#e0782a'), rgb('#fff1b8'), glow));
  }
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

/** Burlap: soft folds and coarse vertical threads, never a checkerboard. */
export function burlapTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(32, 32);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4), fine = makeNoise(rng, 16);
  const tones = ['#4a3a26', '#6b5639', '#8c7550', '#ab9469'] as const;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const fold = Math.sin(x * 0.35 + n(x / 8, y / 8) * 4) * 0.12; // slack folds of the cloth
    const thread = x % 3 === 0 ? -0.07 : 0;
    pc.set(x, y, shadeTone(tones, Math.max(0, Math.min(1, 0.55 + fold + thread + (fine(x / 2, y / 3) - 0.5) * 0.14)), x, y));
  }
  return pc;
}

/** Barrel lid: boards across a round head, an iron chime ring, a bung. */
export function barrelLidTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const pc = new PixelCanvas(24, 24);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const d = Math.hypot(x - 11.5, y - 11.5);
    let c: Rgb;
    if (d > 10.6) c = rgb('#2a2622');
    else if (d > 9.6) c = rgb('#4a4440');
    else {
      const board = Math.floor(y / 6), seam = y % 6 === 0;
      c = shadeTone(pal.wood, seam ? 0.08 : 0.5 + (n(x / 5, board * 2) - 0.5) * 0.35 + (board % 2) * 0.08, x, y);
    }
    pc.set(x, y, c);
  }
  pc.set(15, 15, rgb(pal.wood[0])); pc.set(16, 15, rgb(pal.wood[0])); pc.set(15, 16, rgb(pal.wood[0]));
  return pc;
}

/** Glowing bed of coals: dark lumps over a molten orange glow. */
export function coalsTexture(seed: number): PixelCanvas {
  const pc = new PixelCanvas(24, 24);
  const rng = seeded(seed);
  const n = makeNoise(rng, 6);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const v = n(x / 3, y / 3);
    const c = v > 0.62 ? rgb('#2a1610') : v > 0.5 ? rgb('#7a2a10') : v > 0.32 ? rgb('#e0601c') : rgb('#ffb347');
    pc.set(x, y, c);
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

// ---------------------------------------------------------------- the Scorpion's and the Phoenix's signs

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const SCORPION_TAIL: ReadonlyArray<readonly [number, number]> = [[13, 20.6], [13.0, 24.4], [14.0, 28.0], [16.4, 30.8], [19.4, 31.0], [21.6, 29.0], [22.4, 26.2]];
const SCORPION_LEGS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[10.4, 12.0], [7.0, 10.4], [4.6, 12.6]], [[10.2, 13.8], [6.6, 13.0], [3.8, 15.6]],
  [[10.2, 15.6], [6.8, 15.8], [4.2, 19.0]], [[10.6, 17.4], [7.6, 18.4], [6.0, 21.2]],
];

/**
 * The Scorpion clan's sign, seen from above on the shared 26×34 grid: the head between two open pincers, four legs a
 * side, the banded abdomen, and the tail curling round and up to its raised stinger. 0 empty, 1 body, claws and legs,
 * 2 the abdomen's bands and every other tail segment (in shade), 3 the stinger.
 */
export function scorpionShape(px: number, py: number): 0 | 1 | 2 | 3 {
  const mx = px > 13 ? 26 - px : px; // the claws and the legs are symmetric
  if (Math.hypot(Math.abs(px - 13) - 0.8, py - 9.4) < 0.5) return 0; // eyes
  if (inEllipse(px, py, 22.0, 24.6, 1.4, 1.3) || inPoly(px, py, [[21.2, 23.6], [19.0, 23.4], [21.0, 25.2]])) return 3;
  for (let i = 0; i < SCORPION_TAIL.length - 1; i++) {
    const w = 2.8 - i * 0.18;
    if (inStroke(px, py, [SCORPION_TAIL[i]!, SCORPION_TAIL[i + 1]!], w, w - 0.18)) return i % 2 ? 2 : 1;
  }
  if (inEllipse(px, py, 13, 10.6, 2.9, 2.6)) return 1;
  if (inEllipse(px, py, 13, 16.6, 3.4, 4.6)) return Math.sin(py * 1.7) > 0.82 ? 2 : 1;
  if (inStroke(mx, py, [[11.2, 9.6], [8.0, 8.6], [6.2, 6.0]], 1.9, 1.5) || inEllipse(mx, py, 5.4, 4.4, 2.0, 1.7)
    || inStroke(mx, py, [[4.4, 3.4], [3.8, 0.8]], 1.1, 0.5) || inStroke(mx, py, [[6.4, 3.2], [6.8, 0.8]], 1.1, 0.5)) return 1;
  if (SCORPION_LEGS.some((leg) => inStroke(mx, py, leg, 1.1, 0.7))) return 1;
  return 0;
}

const PHOENIX_WING: ReadonlyArray<readonly [number, number]> = [
  [11.4, 13.0], [9.0, 10.6], [6.6, 7.4], [4.2, 4.0], [1.6, 1.6], [1.0, 3.8], [2.2, 5.4], [0.6, 6.8], [2.0, 8.6], [0.8, 10.4],
  [2.8, 11.8], [1.8, 13.6], [4.4, 14.4], [4.0, 16.2], [7.2, 16.0], [10.6, 16.6],
];
const PHOENIX_FLAMES: ReadonlyArray<readonly [number, number]> = [
  [5.6, 33.6], [7.4, 28.4], [8.8, 30.6], [10.4, 25.6], [12.0, 29.6], [13.0, 24.4], [14.0, 29.6], [15.6, 25.6], [17.2, 30.6], [18.6, 28.4], [20.4, 33.6],
];

/**
 * The Phoenix clan's sign on the shared 26×34 grid: a phoenix rising with its wings spread wide above the flames, its
 * crested head turned to the left, three long plumes falling into the fire. 0 empty, 1 body, head and wings, 2 the
 * wings' feathers, the crest and the plumes (in shade), 3 the flames it rises from.
 */
export function phoenixShape(px: number, py: number): 0 | 1 | 2 | 3 {
  const mx = px > 13 ? 26 - px : px; // the wings are symmetric
  if (Math.hypot(px - 12.8, py - 5.6) < 0.42) return 0; // eye
  if (inEllipse(px, py, 13.2, 6.0, 1.7, 1.6) || inPoly(px, py, [[11.8, 5.4], [9.8, 6.6], [11.8, 7.0]])) return 1;
  if (inStroke(px, py, [[13.6, 4.6], [13.0, 1.2]], 1.0, 0.4) || inStroke(px, py, [[14.2, 4.8], [15.4, 1.6]], 1.0, 0.4)
    || inStroke(px, py, [[14.6, 5.4], [17.0, 3.4]], 1.0, 0.4)) return 2;
  if (inStroke(px, py, [[13.2, 7.4], [13.0, 11.4]], 2.2, 3.0) || inEllipse(px, py, 13, 14.4, 2.6, 3.4)) return 1;
  if (inPoly(mx, py, PHOENIX_WING)) return Math.sin(Math.atan2(py - 15, mx - 12) * 9) > 0.55 ? 2 : 1;
  if (inStroke(px, py, [[13, 17], [13.2, 21.5], [12.4, 26]], 2.2, 0.9) || inStroke(mx, py, [[12, 17.2], [9.6, 21.4], [7.8, 25.2]], 1.8, 0.7)) return 2;
  if (inPoly(px, py, PHOENIX_FLAMES)) return 3;
  return 0;
}

/** The Phoenix's flame: ember at the edge, saffron within, a white-hot heart; never crimson. */
const PHOENIX_FLAME = ['#8a3a10', '#c45e18', '#f2a63a', '#fff4dc'] as const;
/** The same flame worn into stone as an old saffron pigment. */
const PHOENIX_PIGMENT = ['#5a3014', '#7e4a1e', '#a8682a', '#c8883e'] as const;

/** Paints the phoenix at (ox, oy): body and wings in `tones`, the flames by depth (ember edge, saffron, white heart). */
function paintPhoenix(pc: PixelCanvas, ox: number, oy: number, tones: readonly string[], scale: number, flameTones: readonly string[],
  onPixel?: (x: number, y: number) => void): void {
  const body = (px: number, py: number) => { const p = phoenixShape(px, py); return p === 3 ? 0 : p; };
  paintSigil(pc, body, ox, oy, tones, { lit: 1, mid: 0.72, shade: 0.36, part2: 0.5, part3: 0 }, scale, false, onPixel);
  const W = Math.round(SIGIL_W * scale), H = Math.round(SIGIL_H * scale);
  const flame = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && phoenixShape((x + 0.5) / scale, (y + 0.5) / scale) === 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!flame(x, y)) continue;
    let depth = 0;
    for (const d of [1, 2]) if ([[d, 0], [-d, 0], [0, d], [0, -d]].every(([dx, dy]) => flame(x + dx!, y + dy!))) depth = d;
    pc.set(ox + x, oy + y, rgb(flameTones[Math.min(flameTones.length - 1, depth + 1)]));
    onPixel?.(ox + x, oy + y);
  }
}

/**
 * The Scorpion's banner (40×80): umber cloth with undyed linen edges, a band of linked lozenges like the segments of
 * the tail above a hem cut in square tabs, and the scorpion in linen. Never red-and-gold.
 */
function scorpionBannerTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y >= H - 5 && Math.floor(x / 5) % 2 === 1) continue;
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.6 + fold + (n(x / 6, y / 6) - 0.5) * 0.2, x, y);
    const dy = y - (H - 17);
    const lozenge = dy >= 0 && dy <= 6 && Math.abs(((x + 3) % 6) - 3) + Math.abs(dy - 3) === 3;
    if ((x >= 2 && x <= 3) || (x >= W - 4 && x <= W - 3) || (y >= 4 && y <= 5) || lozenge || y >= H - 6) c = shadeTone(pal.trim, x <= 3 || y <= 5 ? 0.8 : 0.5, x, y);
    pc.set(x, y, c);
  }
  paintSigil(pc, scorpionShape, 7, 13, pal.trim, { lit: 1, mid: 0.72, shade: 0.36, part2: 0.5, part3: 0.26 });
  return pc;
}

/**
 * The Phoenix's hanging (40×80): saffron cloth with ash-grey edges, a band of ash flickers, a hem falling in four
 * tongues of flame, and the phoenix in pale ash rising from its flame. No crimson, no gold.
 */
function phoenixBannerTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 40, H = 80;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const hem = H - 2 - Math.abs(Math.sin(((x + 0.5 - 5) / W) * Math.PI * 4)) * 7;
    if (y > hem) continue;
    const fold = Math.sin(x * 0.45) * 0.12;
    let c = shadeTone(pal.cloth, 0.62 + fold + (n(x / 6, y / 6) - 0.5) * 0.2, x, y);
    const wave = Math.abs(y - (H - 17) - Math.round(Math.sin(x * 0.8) * 1.5)) < 1;
    if ((x >= 2 && x <= 3) || (x >= W - 4 && x <= W - 3) || (y >= 4 && y <= 5) || wave || y > hem - 2) c = shadeTone(pal.trim, x <= 3 || y <= 5 ? 0.8 : 0.5, x, y);
    pc.set(x, y, c);
  }
  paintPhoenix(pc, 7, 12, pal.trim, 1, PHOENIX_FLAME);
  return pc;
}

/**
 * Carved panel of the Phoenix's columns, steles and sanctuary: a dressed sandstone face with a bevelled frame, a band
 * of flame waves cut above and below, the phoenix in relief at 1.3 times the banner's size with its flames in an old
 * saffron pigment, its shadow to the lower right; `sooty` darkens it with the smoke of the sanctuary's lamps.
 */
export function phoenixReliefTexture(pal: ArenaPalette, seed: number, sooty = false): PixelCanvas {
  const W = 40, H = 72;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let level = 0.46 + (n(x / 4, y / 4) - 0.5) * 0.16;
    if (edge < 3) level = edge === 0 ? 0.14 : x < W - 3 && y < H - 3 && (x < 3 || y < 3) ? 0.8 : 0.3;
    else if (edge === 3) level = 0.24;
    let c = shadeTone(pal.stone, level, x, y);
    if (edge > 3 && rng() < 0.04) c = rgb(pal.stoneDark[2]);
    pc.set(x, y, c);
  }
  for (const top of [7, H - 9]) for (let x = 6; x < W - 6; x++) {
    const y = top - Math.round(Math.abs(Math.sin(x * 0.52)) * 2.4);
    pc.set(x, y, rgb(pal.stoneDark[1]));
    pc.set(x, y + 1, ramp(pal.stone, 0.88));
  }
  const relief = new Set<number>();
  const scale = 1.3, ox = Math.round((W - SIGIL_W * scale) / 2), oy = 14;
  paintPhoenix(pc, ox, oy, pal.stone, scale, PHOENIX_PIGMENT, (x, y) => relief.add(y * W + x));
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    if (relief.has((y - 1) * W + x - 1) && !relief.has(y * W + x) && Math.min(x, y, W - 1 - x, H - 1 - y) > 3) pc.set(x, y, rgb(pal.stoneDark[1]));
  }
  if (sooty) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const soot = clamp01((1 - y / (H * 0.7)) * 0.3 + (n(x / 3 + 4, y / 5) - 0.5) * 0.2);
    if (soot > 0.12) pc.set(x, y, mixRgb(pc.get(x, y) as unknown as Rgb, rgb(pal.stoneDark[0]), soot));
  }
  return pc;
}

/**
 * Carved lintel panel of the Scorpion's buildings (48×40): ochre clay with a bevelled frame, stepped bands cut down
 * both sides, and the scorpion in relief stained dark copper, its shadow to the lower right. No phoenix, no gold.
 */
export function scorpionReliefTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const W = 48, H = 40;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let level = 0.5 + (n(x / 4, y / 4) - 0.5) * 0.16;
    if (edge < 2) level = edge === 0 ? 0.12 : x < W - 2 && y < H - 2 && (x < 2 || y < 2) ? 0.82 : 0.28;
    pc.set(x, y, shadeTone(pal.plaster, level, x, y));
  }
  // stepped bands down both sides: a dark cut with a lit lip
  for (const x0 of [4, W - 9]) for (let y = 4; y < H - 4; y++) {
    const step = Math.floor(y / 4) % 2 ? 2 : 0;
    pc.set(x0 + step, y, rgb(pal.stoneDark[0]));
    pc.set(x0 + step + 1, y, ramp(pal.plaster, 0.9));
  }
  const relief = new Set<number>();
  paintSigil(pc, scorpionShape, Math.round((W - SIGIL_W) / 2), 3, ['#2a160c', '#4a2a16', '#6e4024', '#8e5832', '#a8704a'],
    { lit: 1, mid: 0.6, shade: 0.2, part2: 0.36, part3: 0.1 }, 1, false, (x, y) => relief.add(y * W + x));
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    if (relief.has((y - 1) * W + x - 1) && !relief.has(y * W + x) && Math.min(x, y, W - 1 - x, H - 1 - y) > 2) pc.set(x, y, ramp(pal.plaster, 0.1));
  }
  return pc;
}

// ---------------------------------------------------------------- the Arid Deserts

/** The desert's living rock, whatever the arena's masonry: red-brown sandstone, rust to burnt sienna. */
const SANDSTONE_ROCK = ['#3c2016', '#56301f', '#74432b', '#925838', '#ae7049', '#c68a5e'] as const;

/** Red-brown sandstone for mesas, outcrops and boulders: wind-scoured bedding, a hard band standing proud (seamless). */
export function sandstoneTexture(seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const strata = Math.sin((y / S) * Math.PI * 2 * 5 + (n(x / 4 + 3, y / 4) - 0.5) * 2.4);
    let level = 0.5 + strata * 0.12 + (n(x / 4, y / 4) - 0.5) * 0.24 + (fine(x / 2, y / 2) - 0.5) * 0.1;
    if (strata > 0.86) level += 0.12;
    else if (strata < -0.9) level -= 0.16;
    let c = shadeTone(SANDSTONE_ROCK, clamp01(level), x, y);
    if (rng() < 0.02) c = rgb(SANDSTONE_ROCK[0]);
    pc.set(x, y, c);
  }
  return pc;
}

/** Wind-rippled sand for dunes and drifts, in the palette's sand ramp (its "moss"), a few bright grains (seamless). */
export function sandTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const ripple = Math.sin(((x * 2 + y) / S) * Math.PI * 2 * 3 + (n(x / 4, y / 4) - 0.5) * 3);
    const level = 0.58 + (n(x / 4, y / 4) - 0.5) * 0.22 + (fine(x / 2, y / 2) - 0.5) * 0.08 + (ripple > 0.78 ? 0.14 : ripple < -0.7 ? -0.12 : 0);
    pc.set(x, y, shadeTone(pal.moss, clamp01(level), x, y));
  }
  for (let k = 0; k < 8; k++) pc.set(Math.floor(rng() * S), Math.floor(rng() * S), rgb(pal.moss[pal.moss.length - 1]));
  return pc;
}

/**
 * The Scorpion's walls: ochre clay plaster over sun-dried mud brick, faint dust streaks, and where the plaster has
 * flaked away the bricks show in their courses (seamless).
 */
export function mudBrickTexture(pal: ArenaPalette, seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), flake = makeNoise(rng, 4), fine = makeNoise(rng, 16);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const f = flake(x / 8, y / 8);
    let c: Rgb;
    if (f > 0.82) {
      // the bricks show where the plaster has flaked: sun-dried clay a shade darker than the plaster, dark joints
      const row = Math.floor(y / 4), bx = (x + (row % 2) * 4) % 8, by = y % 4;
      c = bx === 0 || by === 0 ? ramp(pal.plaster, 0.1) : shadeTone(pal.plaster, clamp01(0.36 + (fine(x / 2, y / 2) - 0.5) * 0.2 + (by === 1 ? 0.1 : 0)), x, y);
    } else {
      const streak = Math.abs(Math.sin((x / S) * Math.PI * 2 * 5 + n(x / 4, 1) * 2)) < 0.1 ? 0.06 : 0;
      const level = 0.6 + (n(x / 4, y / 4) - 0.5) * 0.18 + (fine(x / 2, y / 2) - 0.5) * 0.08 - streak - (f > 0.78 ? 0.1 : 0);
      c = shadeTone(pal.plaster, clamp01(level), x, y);
    }
    pc.set(x, y, c);
  }
  return pc;
}

/** A carved wooden lattice screen (32×32, alpha-cut): a lozenge grid of bars inside its frame, lit up-left. */
export function latticeTexture(pal: ArenaPalette): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const a = (x + y) % 8, b = (x - y + 64) % 8;
    const frame = x <= 1 || y <= 1 || x >= S - 2 || y >= S - 2;
    if (!frame && a > 1 && b > 1) continue;
    const lit = frame ? (x <= 1 || y <= 1 ? 0.8 : 0.3) : a === 0 || b === 0 ? 0.75 : 0.4;
    pc.set(x, y, shadeTone(pal.wood, lit, x, y));
  }
  return pc;
}

/** Striped awning cloth: bands of undyed linen and brown, a faint weave (seamless). */
export function awningTexture(seed: number): PixelCanvas {
  const S = 32;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8);
  const linen = ['#8e8470', '#b4a88e', '#d4c8ac', '#ece2c8'], brown = ['#3e2a1a', '#56402a', '#6e543a', '#86684a'];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const weave = (x + y) % 2 ? 0.04 : -0.04;
    pc.set(x, y, shadeTone(Math.floor(x / 4) % 2 ? brown : linen, clamp01(0.62 + weave + (n(x / 4, y / 4) - 0.5) * 0.2), x, y));
  }
  return pc;
}

/** Unglazed clay of the water jars (16×32, u around, v up): tan clay, two painted umber bands and a zigzag at the shoulder. */
export function jarTexture(seed: number): PixelCanvas {
  const W = 16, H = 32;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const n = makeNoise(rng, 4);
  const clay = ['#5e3a20', '#7e5030', '#9c6a42', '#b88658', '#cc9e70'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = shadeTone(clay, clamp01(0.58 + (n(x / 4, y / 8) - 0.5) * 0.24), x, y);
    if (y === 9 || y === 13 || (y >= 10 && y <= 12 && Math.abs((x % 4) - 1.5) + Math.abs(y - 11) <= 1.5)) c = rgb('#3a2214');
    pc.set(x, y, c);
  }
  return pc;
}

// ---------------------------------------------------------------- the Phoenix's fire and the Shadows' ink

/**
 * A ward circle of the Phoenix traced on the flagstones (96×96, alpha-cut): a double outer ring around a band of
 * interlaced signs, three interlaced rings within and a white-hot heart; saffron lines that smoulder, brighter in
 * places, fading in others. No crimson, never purple.
 */
export function wardCircleTexture(seed: number): PixelCanvas {
  const S = 96, c = 47.5;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 16);
  const tones = [rgb('#b24c16'), rgb('#ffa83a'), rgb('#fff0c4')] as const;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - c, y - c), a = Math.atan2(y - c, x - c);
    let t = 0;
    if (Math.abs(d - 44) < 1.0 || Math.abs(d - 38) < 0.8 || Math.abs(d - 24) < 0.9) t = 2;
    else if (d > 38.8 && d < 43.2) {
      const turn = ((a + Math.PI) / (Math.PI * 2)) * 24, glyph = Math.floor(turn);
      const u = turn - glyph, v = (d - 38.8) / 4.4, g = (glyph * 7 + seed) % 4;
      const r = Math.hypot(u - 0.5, v - 0.5);
      const stroke = g === 0 ? Math.abs(u - 0.5) < 0.12 : g === 1 ? Math.abs(u - v) < 0.14 || Math.abs(u - (1 - v)) < 0.14
        : g === 2 ? Math.abs(v - 0.5) < 0.16 && u > 0.2 && u < 0.8 : r < 0.3 && r > 0.14;
      if (stroke) t = 2;
    } else if (d < 24 && [0, 1, 2].some((k) => Math.abs(Math.hypot(x - c - Math.cos(k * Math.PI * 2 / 3 + 0.5) * 10, y - c - Math.sin(k * Math.PI * 2 / 3 + 0.5) * 10) - 12) < 0.75)) t = 2;
    if (Math.abs(d - 4) < 0.9 || d < 1.6) t = 3;
    if (!t) continue;
    const v = n(x / 6, y / 6);
    if (v < 0.3) t -= 1;
    else if (v > 0.8) t = 3;
    if (t <= 0) continue;
    pc.set(x, y, tones[t - 1]!, t >= 2 ? 255 : 190);
  }
  return pc;
}

/**
 * The Shadows' mark (64×64, alpha-cut): a splash of cold black ink with tendrils reaching out and droplets around it, a
 * cold blue-grey sheen where it pools thickest. Never a glow, never purple.
 */
export function inkStainTexture(seed: number): PixelCanvas {
  const S = 64, c = 31.5;
  const pc = new PixelCanvas(S, S);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), fine = makeNoise(rng, 16);
  const ink = ['#050608', '#0b0d11', '#151a20', '#26303a'].map((h) => rgb(h));
  const tendrils = Array.from({ length: 4 }, () => ({ a: rng() * Math.PI * 2, len: 14 + rng() * 14, w: 2 + rng() * 2 }));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let inside = d < 12 + (n(x / 8 + 2, y / 8) - 0.5) * 9 + Math.sin(a * 5 + seed) * 2;
    for (const t of tendrils) {
      const along = dx * Math.cos(t.a) + dy * Math.sin(t.a), across = Math.abs(-dx * Math.sin(t.a) + dy * Math.cos(t.a));
      if (along > 0 && along < t.len && across < t.w * (1 - along / t.len) + (fine(x / 2, y / 2) - 0.5) * 1.5) inside = true;
    }
    if (!inside) continue;
    const sheen = n(x / 4, y / 4) > 0.72 && d < 10;
    pc.set(x, y, sheen ? ink[3]! : ink[(x * 3 + y) % 7 === 0 ? 2 : d > 14 ? 1 : 0]!);
  }
  for (let k = 0; k < 12; k++) {
    const a = rng() * Math.PI * 2, r = 18 + rng() * 12, x = Math.round(c + Math.cos(a) * r), y = Math.round(c + Math.sin(a) * r);
    pc.set(x, y, ink[0]!);
    if (rng() < 0.5) pc.set(x + 1, y, ink[1]!);
  }
  return pc;
}

/** A loose leaf of the Prophet's writings (12×16): pale paper crowded with lines of cramped black writing, unreadable. */
export function leafTexture(seed: number): PixelCanvas {
  const W = 12, H = 16;
  const pc = new PixelCanvas(W, H);
  const rng = seeded(seed);
  const paper = ['#a89c82', '#c8bea4', '#e0d8c2'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = shadeTone(paper, x + y > W + H - 6 ? 0.2 : 0.62 + (rng() - 0.5) * 0.1, x, y);
    if (y >= 2 && y <= H - 3 && y % 2 === 0 && x >= 1 && x <= W - 2 && rng() < 0.72) c = rgb('#16130f');
    pc.set(x, y, c);
  }
  return pc;
}

/**
 * The sacred ash of the Phoenix's sanctuary (64×64): grey ash, darker toward the rim, red embers glowing along its
 * cracks and a few coals breaking through. Returns the face and an emissive mask holding only the embers.
 */
export function ashEmberTextures(seed: number): { face: PixelCanvas; glow: PixelCanvas } {
  const S = 64;
  const face = new PixelCanvas(S, S), glow = new PixelCanvas(S, S);
  glow.fill([0, 0, 0]);
  const rng = seeded(seed);
  const n = makeNoise(rng, 8), crack = makeNoise(rng, 16), fine = makeNoise(rng, 32);
  const ash = ['#262220', '#3c3734', '#55504b', '#706a64', '#8c857e', '#a8a199'];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - 31.5, y - 31.5) / 31.5;
    face.set(x, y, shadeTone(ash, clamp01(0.56 + (n(x / 6, y / 6) - 0.5) * 0.4 + (fine(x / 2, y / 2) - 0.5) * 0.12 - d * 0.18), x, y));
    const v = Math.abs(crack(x / 5, y / 5) - 0.5);
    if (v < 0.035 && d < 0.92) {
      const hot = v < 0.012;
      face.set(x, y, rgb(hot ? '#ff9a3a' : '#c43a14'));
      glow.set(x, y, rgb(hot ? '#ffb050' : '#d0401a'));
    } else if (n(x / 3 + 7, y / 3) > 0.82 && d < 0.8) {
      face.set(x, y, rgb('#ff7a2a'));
      glow.set(x, y, rgb('#ff8a3a'));
    }
  }
  return { face, glow };
}

/**
 * The inside of a niche (16×24): a stepped head, a lit left reveal and a shaded right one; lit, the lamp on its sill
 * warms the bottom; unlit, the smoke of old lamps has blackened it.
 */
export function nicheTexture(pal: ArenaPalette, lit: boolean): PixelCanvas {
  const W = 16, H = 24;
  const pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c: Rgb;
    if (y < 3 && (x < 3 || x > W - 4)) c = ramp(pal.stone, 0.4);
    else if (x === 0 || (y === 3 && (x < 3 || x > W - 4))) c = ramp(pal.stone, 0.62);
    else if (x === W - 1 || y === 0) c = rgb(pal.stoneDark[0]);
    else {
      const t = y / H, across = 1 - Math.abs(x - 7.5) / 9;
      c = lit ? mixRgb(rgb('#140c07'), rgb('#c8803a'), Math.pow(t, 2.2) * across) : mixRgb(rgb('#090807'), rgb(pal.stoneDark[2]), t * 0.5);
    }
    pc.set(x, y, c);
  }
  return pc;
}
