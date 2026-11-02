import type { PixelSheetEntry } from '../../combat/pixel/PixelSpriteSheets';
import { OPENING_POLE_CRACKS_AT, OPENING_POLE_LANDS_AT, type OpeningShotId, type ViewCamera } from './openingShots';

export interface PaintFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Seconds since the shot began, on the sequence's own clock. */
  seconds: number;
  dt: number;
  camera: ViewCamera;
}

export type ShotPainter = (frame: PaintFrame) => void;

export interface SheetArt { entry: PixelSheetEntry; image: HTMLImageElement }
export type SheetBook = ReadonlyMap<string, SheetArt>;

type Rgb = readonly [number, number, number];
interface Light { x: number; y: number; radius: number; color: Rgb; power: number; seed: number }

const FIRE: Rgb = [255, 122, 38], CANDLE: Rgb = [255, 190, 96], VIOLET: Rgb = [176, 92, 255], MOON: Rgb = [150, 180, 255];

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const p = clamp01(value); return p * p * (3 - 2 * p); };
const flicker = (t: number, seed: number) => 0.78 + 0.14 * Math.sin(t * 7.3 + seed) + 0.08 * Math.sin(t * 17.1 + seed * 2.1);
const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r},${g},${b},${alpha})`;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: Rgb, alpha: number): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function paintLights(frame: PaintFrame, lights: readonly Light[], amount = 1): void {
  const { ctx, camera, seconds } = frame;
  ctx.globalCompositeOperation = 'lighter';
  for (const light of lights) {
    glow(ctx, camera.x + light.x * camera.scale, camera.y + light.y * camera.scale, light.radius * camera.scale, light.color, light.power * flicker(seconds, light.seed) * amount);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** A soft puff, drawn once and stamped many times. */
function softPuff(color: Rgb): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) glow(ctx, 64, 64, 64, color, 1);
  return canvas;
}

interface Mote { x: number; y: number; vx: number; vy: number; size: number; phase: number; color: Rgb }

/** Pixel squares in screen space, wrapped around the view so the field never thins out. */
class MoteField {
  private readonly motes: Mote[] = [];
  private seededFor = 0;

  constructor(private readonly count: number, private readonly make: (random: () => number) => Omit<Mote, 'x' | 'y'>, private readonly mode: GlobalCompositeOperation, private readonly random: () => number) {}

  paint({ ctx, width, height, dt, seconds }: PaintFrame, amount = 1): void {
    if (this.seededFor !== width) {
      this.motes.length = 0;
      for (let i = 0; i < this.count; i += 1) this.motes.push({ ...this.make(this.random), x: this.random() * width, y: this.random() * height });
      this.seededFor = width;
    }
    ctx.globalCompositeOperation = this.mode;
    const unit = Math.max(1, Math.round(width / 960));
    for (const mote of this.motes) {
      mote.x += (mote.vx + Math.sin(seconds * 0.9 + mote.phase) * 10) * dt;
      mote.y += mote.vy * dt;
      if (mote.y < -8) mote.y = height + 8; else if (mote.y > height + 8) mote.y = -8;
      if (mote.x < -8) mote.x = width + 8; else if (mote.x > width + 8) mote.x = -8;
      const size = mote.size * unit;
      ctx.fillStyle = rgba(mote.color, amount * (0.55 + 0.45 * Math.sin(seconds * 3 + mote.phase * 7)));
      ctx.fillRect(Math.round(mote.x / unit) * unit, Math.round(mote.y / unit) * unit, size, size);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const embers = (count: number, seed: number) => new MoteField(count, (random) => ({
  vx: -30 - random() * 46, vy: -44 - random() * 90, size: random() < 0.2 ? 3 : random() < 0.6 ? 2 : 1, phase: random() * 6,
  color: random() < 0.5 ? [255, 150, 60] : random() < 0.6 ? [255, 96, 34] : [255, 206, 120],
}), 'lighter', seeded(seed));

const ash = (count: number, seed: number, color: Rgb) => new MoteField(count, (random) => ({
  vx: -6 - random() * 16, vy: 16 + random() * 34, size: random() < 0.3 ? 2 : 1, phase: random() * 6, color,
}), 'source-over', seeded(seed));

/** A hooded, long-robed walker, drawn for its outline: at this distance a sprite reads as a blot. */
function robedFigure(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 18;
  canvas.height = 46;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = 'rgb(5,6,14)';
  const rows: ReadonlyArray<readonly [number, number, number, number]> = [[6, 0, 5, 2], [5, 2, 7, 5], [7, 7, 3, 1], [3, 8, 11, 3], [2, 11, 13, 4], [4, 15, 9, 8], [3, 23, 11, 10], [2, 33, 13, 8], [1, 41, 15, 5], [16, 0, 1, 46]];
  for (const [x, y, width, height] of rows) ctx.fillRect(x, y, width, height);
  return canvas;
}

function tintedCanvas(source: HTMLImageElement | HTMLCanvasElement, color: string): CanvasImageSource {
  const canvas = document.createElement('canvas');
  canvas.width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  canvas.height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawFrame(ctx: CanvasRenderingContext2D, entry: PixelSheetEntry, source: CanvasImageSource, frame: string, x: number, y: number, scale: number, flip: boolean, angle = 0): void {
  const [cellWidth, cellHeight] = entry.cell, [anchorX, anchorY] = entry.anchor;
  const column = Math.max(0, entry.cells.indexOf(frame));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(source, column * cellWidth, 0, cellWidth, cellHeight, -anchorX, -anchorY, cellWidth, cellHeight);
  ctx.restore();
}

function contactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number): void {
  ctx.fillStyle = `rgba(6,3,4,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Worn linen with a pointed, torn, smouldering hem. No emblem (OD-2026-11-02-A, C5). */
function bannerCloth(): { canvas: HTMLCanvasElement; shade: CanvasImageSource; width: number; height: number } {
  const width = 92, height = 262;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, shade: canvas, width, height };
  const random = seeded(7717);
  const tears = Array.from({ length: 23 }, () => random() ** 2.2 * 58);
  const hem = (x: number) => height - 4 - Math.abs((2 * x) / width - 1) * 74 - (tears[Math.floor((x / width) * tears.length)] ?? 0) - random() * 3;
  const slits = [{ x: 28, y: 120, w: 3, h: 34 }, { x: 62, y: 76, w: 4, h: 42 }, { x: 44, y: 168, w: 3, h: 26 }];
  const image = ctx.createImageData(width, height);
  const put = (x: number, y: number, r: number, g: number, b: number) => {
    const index = (y * width + x) * 4;
    image.data[index] = r;
    image.data[index + 1] = g;
    image.data[index + 2] = b;
    image.data[index + 3] = 255;
  };
  for (let x = 0; x < width; x += 1) {
    const end = hem(x);
    for (let y = 0; y < height; y += 1) {
      if (y >= end) continue;
      let burn = clamp01(1 - (end - y) / 30);
      let cut = false;
      for (const slit of slits) {
        const dx = (x - slit.x) / slit.w, dy = (y - slit.y) / slit.h, distance = Math.hypot(dx, dy) - 1;
        if (distance < random() * 0.2) cut = true;
        burn = Math.max(burn, clamp01(1 - distance / 1.6));
      }
      if (cut) continue;
      const fold = Math.sin(x * 0.21 + Math.sin(y * 0.018) * 2.4) * 0.34 + Math.sin(x * 0.53 + y * 0.01) * 0.12;
      const weave = (x % 2 ? 4 : 0) + (y % 2 ? 3 : 0) + random() * 9;
      const light = Math.max(0.12, (1 + fold) * (0.62 + 0.38 * (y / height)) * (1 - burn * 0.86));
      const trim = y <= 5 || x <= 4 || x >= width - 5;
      const [r, g, b] = trim ? [186, 146, 80] : [128, 118, 104];
      const edge = burn > 0.8 && random() < 0.5 ? (burn - 0.8) * 3 : 0;
      put(x, y, (r + weave) * light + edge * 230, (g + weave) * light + edge * 82, (b + weave) * light * (1 - burn * 0.3));
    }
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, shade: tintedCanvas(canvas, 'rgb(6,7,18)'), width, height };
}

interface ClothNode { x: number; y: number; px: number; py: number }

const BANNER = { x: 640, y: 654, ground: 668, height: 470, snapAt: 0.2, barAt: 0.87, clothScale: 1.25, tilt: 1.82 };
const NODES = 18;
const STEP = 1 / 60;

/** The standard: a pole that snaps on the word "défaite", and a cloth that really hangs from it, in the wind. */
class BannerRig {
  readonly nodes: ClothNode[] = [];
  private readonly segment: number;
  private time = 0;

  constructor(private readonly cloth: ReturnType<typeof bannerCloth>) {
    this.segment = (cloth.height * BANNER.clothScale) / (NODES - 1);
    const bar = this.along(BANNER.barAt, 0);
    for (let i = 0; i < NODES; i += 1) this.nodes.push({ x: bar.x, y: bar.y + i * this.segment, px: bar.x, py: bar.y + i * this.segment });
  }

  angle(t: number): number {
    const fall = clamp01((t - OPENING_POLE_CRACKS_AT) / (OPENING_POLE_LANDS_AT - OPENING_POLE_CRACKS_AT));
    return Math.sin(t * 1.3) * 0.012 * (1 - fall) + BANNER.tilt * fall * fall;
  }

  along(ratio: number, t: number): { x: number; y: number } {
    const pivotY = BANNER.y - BANNER.height * BANNER.snapAt, reach = (ratio - BANNER.snapAt) * BANNER.height, angle = this.angle(t);
    return { x: BANNER.x + Math.sin(angle) * reach, y: pivotY - Math.cos(angle) * reach };
  }

  advance(to: number): void {
    while (this.time < to) {
      this.step(this.time);
      this.time += STEP;
    }
  }

  private step(t: number): void {
    const bar = this.along(BANNER.barAt, t);
    const anchor = this.nodes[0]!;
    anchor.x = anchor.px = bar.x;
    anchor.y = anchor.py = bar.y;
    this.nodes.forEach((node, i) => {
      if (i === 0) return;
      const wind = (220 + 170 * Math.sin(t * 1.9 + i * 0.42) + 90 * Math.sin(t * 4.3 + i * 0.9)) * (0.4 + (0.6 * i) / NODES);
      const vx = (node.x - node.px) * 0.986, vy = (node.y - node.py) * 0.986;
      node.px = node.x;
      node.py = node.y;
      node.x += vx + wind * STEP * STEP;
      node.y += vy + 420 * STEP * STEP;
    });
    for (let pass = 0; pass < 5; pass += 1) {
      for (let i = 1; i < NODES; i += 1) {
        const up = this.nodes[i - 1]!, node = this.nodes[i]!;
        const dx = node.x - up.x, dy = node.y - up.y, length = Math.hypot(dx, dy) || 1, pull = (length - this.segment) / length;
        if (i > 1) { up.x += dx * pull * 0.5; up.y += dy * pull * 0.5; }
        node.x -= dx * pull * (i > 1 ? 0.5 : 1);
        node.y -= dy * pull * (i > 1 ? 0.5 : 1);
      }
    }
    for (const node of this.nodes) {
      if (node.y <= BANNER.ground) continue;
      node.y = BANNER.ground;
      node.px = node.x - (node.x - node.px) * 0.82;
    }
  }

  paint({ ctx, camera, seconds }: PaintFrame): void {
    const at = (x: number, y: number) => ({ x: camera.x + x * camera.scale, y: camera.y + y * camera.scale });
    const stick = (from: { x: number; y: number }, to: { x: number; y: number }, width: number, color: string) => {
      const a = at(from.x, from.y), b = at(to.x, to.y);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
      ctx.fillStyle = color;
      ctx.fillRect(0, (-width * camera.scale) / 2, Math.hypot(b.x - a.x, b.y - a.y), width * camera.scale);
      ctx.restore();
    };
    const pivot = { x: BANNER.x, y: BANNER.y - BANNER.height * BANNER.snapAt };
    const angle = this.angle(seconds), bar = this.along(BANNER.barAt, seconds), tip = this.along(1, seconds);
    const fall = clamp01((seconds - OPENING_POLE_CRACKS_AT) / (OPENING_POLE_LANDS_AT - OPENING_POLE_CRACKS_AT)) ** 2;
    const acrossX = Math.cos(angle) * (1 - fall) + 0.14 * fall, acrossY = Math.sin(angle) * (1 - fall) + 0.46 * fall;
    const cross = { x: acrossX * 78, y: acrossY * 78 };
    stick({ x: BANNER.x, y: BANNER.y }, pivot, 9, 'rgb(62,44,32)');
    stick(pivot, tip, 9, 'rgb(84,60,42)');
    stick({ x: bar.x - cross.x, y: bar.y - cross.y }, { x: bar.x + cross.x, y: bar.y + cross.y }, 8, 'rgb(104,76,48)');
    stick(tip, { x: tip.x + Math.sin(angle) * 34, y: tip.y - Math.cos(angle) * 34 }, 11, 'rgb(208,172,106)');
    // Each row is a parallelogram sharing its edges with the next, so the cloth bends in one piece. Its width lies
    // along the crossbar while the pole stands, and flattens onto the paving as it falls.
    const rowHeight = this.cloth.height / (NODES - 1), width = this.cloth.width * BANNER.clothScale * camera.scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // A chain folds on itself on a flat line: once down, the cloth is laid out along the paving instead.
    const settle = smooth((seconds - OPENING_POLE_LANDS_AT) / 0.8);
    const point = (i: number) => {
      const node = this.nodes[i]!;
      const x = bar.x + i * this.segment * 0.94, y = bar.y + (BANNER.ground - bar.y) * clamp01(i / 3) + Math.sin(i * 0.8) * 3;
      return { x: node.x + (x - node.x) * settle, y: node.y + (y - node.y) * settle };
    };
    for (let i = 0; i < NODES - 1; i += 1) {
      const up = point(i), down = point(i + 1), start = at(up.x, up.y);
      ctx.setTransform(
        (acrossX * width) / this.cloth.width, (acrossY * width) / this.cloth.width,
        ((down.x - up.x) * camera.scale) / rowHeight, ((down.y - up.y) * camera.scale) / rowHeight,
        start.x - (acrossX * width) / 2, start.y - (acrossY * width) / 2,
      );
      ctx.drawImage(this.cloth.canvas, 0, i * rowHeight, this.cloth.width, rowHeight, 0, 0, this.cloth.width, rowHeight * 1.08);
      ctx.globalAlpha = 0.34 * (0.5 + 0.5 * Math.sin(i * 0.8 - seconds * 3.1));
      ctx.drawImage(this.cloth.shade, 0, i * rowHeight, this.cloth.width, rowHeight, 0, 0, this.cloth.width, rowHeight * 1.08);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

/** The leftovers of the fight around the standard. Nothing here belongs to a named clan. */
const LANCES: ReadonlyArray<{ x: number; y: number; angle: number; length: number; tip: boolean }> = [
  { x: 470, y: 676, angle: -0.34, length: 190, tip: true }, { x: 530, y: 650, angle: 0.2, length: 120, tip: false },
  { x: 1236, y: 636, angle: -0.26, length: 170, tip: true }, { x: 1318, y: 672, angle: 0.14, length: 130, tip: true },
  { x: 1420, y: 640, angle: 0.3, length: 110, tip: false },
];
const FIRES: ReadonlyArray<{ x: number; y: number; size: number; seed: number }> = [
  { x: 420, y: 650, size: 2.4, seed: 1 }, { x: 1290, y: 628, size: 1.6, seed: 2 }, { x: 1380, y: 660, size: 2.2, seed: 3 },
];
const BATTLEFIELD: readonly Light[] = [
  ...FIRES.map((fire) => ({ x: fire.x, y: fire.y - 16, radius: 130 * fire.size, color: FIRE, power: 0.36, seed: fire.seed })),
  { x: 1220, y: 62, radius: 220, color: MOON, power: 0.12, seed: 7 },
];

/** Columns of pixels that lick at their own pace: red outside, then orange, then a pale core. */
function paintFlame(ctx: CanvasRenderingContext2D, x: number, y: number, unit: number, seconds: number, seed: number): void {
  ctx.globalCompositeOperation = 'lighter';
  for (let column = -7; column <= 7; column += 1) {
    const body = 1 - Math.abs(column) / 8;
    const tall = (10 + 26 * body) * (0.72 + 0.28 * Math.sin(seconds * (8 + (column % 3)) + column * 1.7 + seed)) * unit;
    const left = x + column * 2 * unit;
    ctx.fillStyle = rgba([206, 58, 18], 0.85);
    ctx.fillRect(left, y - tall, 2 * unit, tall);
    ctx.fillStyle = rgba([255, 134, 40], 0.9);
    ctx.fillRect(left, y - tall * 0.68, 2 * unit, tall * 0.68);
    if (Math.abs(column) < 4) {
      ctx.fillStyle = rgba([255, 226, 150], 0.9);
      ctx.fillRect(left, y - tall * 0.36, 2 * unit, tall * 0.36);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

function fallPainter(): ShotPainter {
  const rig = new BannerRig(bannerCloth());
  const smoke = softPuff([30, 26, 34]);
  const sparks = embers(70, 913), cinders = ash(80, 317, [150, 150, 164]);
  const random = seeded(4049);
  const plumes = Array.from({ length: 22 }, () => ({ fire: FIRES[Math.floor(random() * FIRES.length)]!, size: 70 + random() * 150, speed: 0.05 + random() * 0.05, phase: random() }));
  const bursts: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  let cracked = false, landed = false;
  const scatter = (x: number, y: number, spread: number, count: number) => {
    for (let i = 0; i < count; i += 1) bursts.push({ x: x + (random() - 0.5) * spread, y, vx: (random() - 0.5) * 190, vy: -60 - random() * 200, life: 0.5 + random() * 1.1 });
  };
  return (frame) => {
    const { ctx, camera, width, height, seconds, dt } = frame;
    const px = (x: number) => camera.x + x * camera.scale, py = (y: number) => camera.y + y * camera.scale;
    ctx.fillStyle = 'rgba(6,9,22,.3)';
    ctx.fillRect(0, 0, width, height);
    paintLights(frame, BATTLEFIELD);
    for (const plume of plumes) {
      const rise = (plume.phase + seconds * plume.speed) % 1;
      ctx.globalAlpha = 0.3 * Math.sin(rise * Math.PI);
      const size = plume.size * camera.scale * (1 + rise);
      ctx.drawImage(smoke, px(plume.fire.x + 90 * rise) - size / 2, py(plume.fire.y - 340 * rise) - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    cinders.paint(frame, 0.6);
    for (const lance of LANCES) {
      ctx.save();
      ctx.translate(px(lance.x), py(lance.y));
      ctx.rotate(lance.angle);
      ctx.fillStyle = 'rgb(30,22,20)';
      ctx.fillRect(-3.5 * camera.scale, -lance.length * camera.scale, 7 * camera.scale, lance.length * camera.scale);
      if (lance.tip) { ctx.fillStyle = 'rgb(168,166,170)'; ctx.fillRect(-4 * camera.scale, (-lance.length - 28) * camera.scale, 8 * camera.scale, 28 * camera.scale); }
      ctx.restore();
    }
    rig.advance(seconds);
    rig.paint(frame);
    for (const fire of FIRES) paintFlame(ctx, px(fire.x), py(fire.y), Math.max(1, Math.round(fire.size * camera.scale)), seconds, fire.seed);
    if (seconds > OPENING_POLE_CRACKS_AT && !cracked) {
      cracked = true;
      scatter(px(BANNER.x), py(BANNER.y - BANNER.height * BANNER.snapAt), 20, 26);
    }
    if (seconds > OPENING_POLE_LANDS_AT && !landed) {
      landed = true;
      const tip = rig.along(1, seconds);
      scatter(px((BANNER.x + tip.x) / 2), py(BANNER.ground), width * 0.26, 90);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of bursts) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      spark.vy += 130 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      ctx.fillStyle = rgba([255, 158, 74], Math.min(1, spark.life * 1.6));
      ctx.fillRect(Math.round(spark.x), Math.round(spark.y), 3, 3);
    }
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame, 0.9);
  };
}

const HALL: readonly Light[] = [
  { x: 906, y: 368, radius: 150, color: FIRE, power: 0.3, seed: 1 }, { x: 1606, y: 366, radius: 150, color: FIRE, power: 0.3, seed: 2 },
  { x: 1240, y: 300, radius: 300, color: CANDLE, power: 0.08, seed: 3 }, { x: 205, y: 130, radius: 120, color: CANDLE, power: 0.16, seed: 4 },
];

function sealsPainter(): ShotPainter {
  const motes = new MoteField(70, (random) => ({ vx: 4 + random() * 8, vy: -6 - random() * 8, size: random() < 0.3 ? 2 : 1, phase: random() * 6, color: [255, 222, 160] }), 'lighter', seeded(5503));
  return (frame) => {
    paintLights(frame, HALL);
    motes.paint(frame, 0.5);
  };
}

const VILLAGE: readonly Light[] = [
  { x: 1600, y: 80, radius: 250, color: FIRE, power: 0.34, seed: 1 }, { x: 1340, y: 130, radius: 190, color: FIRE, power: 0.28, seed: 2 },
  { x: 985, y: 170, radius: 260, color: FIRE, power: 0.26, seed: 3 }, { x: 540, y: 170, radius: 170, color: FIRE, power: 0.26, seed: 4 },
  { x: 488, y: 395, radius: 120, color: FIRE, power: 0.36, seed: 5 }, { x: 892, y: 300, radius: 80, color: FIRE, power: 0.34, seed: 6 },
  { x: 1018, y: 342, radius: 80, color: FIRE, power: 0.34, seed: 7 }, { x: 1368, y: 408, radius: 90, color: FIRE, power: 0.34, seed: 8 },
  { x: 186, y: 530, radius: 110, color: CANDLE, power: 0.28, seed: 9 }, { x: 335, y: 405, radius: 70, color: CANDLE, power: 0.26, seed: 10 },
  { x: 1050, y: 622, radius: 190, color: FIRE, power: 0.12, seed: 11 },
];

const ROAD = { x: 948, y: 436, farScale: 0.42, nearScale: 2.05, nearY: 700 };

/** They stream out of the gate and spread across the square, at the tableau's own pixel size. */
const MARCH: ReadonlyArray<{ unit: string; delay: number; x: number; y: number; torch: boolean }> = [
  { unit: 'serpent_brute', delay: 0, x: 500, y: 668, torch: true }, { unit: 'serpent_raider', delay: 0.6, x: 700, y: 640, torch: false },
  { unit: 'serpent_raider', delay: 1.2, x: 360, y: 610, torch: true }, { unit: 'serpent_raider', delay: 1.9, x: 870, y: 672, torch: true },
  { unit: 'serpent_raider', delay: 2.7, x: 590, y: 590, torch: false }, { unit: 'serpent_brute', delay: 3.4, x: 760, y: 566, torch: true },
  { unit: 'serpent_raider', delay: 4.2, x: 450, y: 548, torch: false }, { unit: 'serpent_raider', delay: 5, x: 650, y: 532, torch: true },
  { unit: 'serpent_raider', delay: 5.9, x: 840, y: 520, torch: false }, { unit: 'serpent_raider', delay: 6.8, x: 560, y: 512, torch: true },
  { unit: 'serpent_raider', delay: 7.6, x: 720, y: 498, torch: false }, { unit: 'serpent_brute', delay: 8.5, x: 830, y: 480, torch: true },
];

function paintMarch(frame: PaintFrame, sheets: Map<string, { entry: PixelSheetEntry; dark: CanvasImageSource }>): void {
  const { ctx, camera, seconds } = frame;
  const order = MARCH.map((march, index) => {
    const d = clamp01((seconds - march.delay) / 11);
    return { march, index, d, y: ROAD.y + (march.y - ROAD.y) * d ** 1.4 };
  }).filter((entry) => entry.d > 0).sort((a, b) => a.y - b.y);
  for (const { march, index, d, y } of order) {
    const art = sheets.get(march.unit);
    if (!art) continue;
    const scale = (ROAD.farScale + (ROAD.nearScale - ROAD.farScale) * clamp01((y - ROAD.y) / (ROAD.nearY - ROAD.y))) * camera.scale;
    const x = ROAD.x + (march.x - ROAD.x) * d;
    const step = seconds * 3.8 + index * 1.7;
    const lift = Math.abs(Math.sin(step)) * 2.2 * scale;
    const sx = camera.x + x * camera.scale, sy = camera.y + y * camera.scale;
    contactShadow(ctx, sx, sy, 24 * scale, 0.46);
    drawFrame(ctx, art.entry, art.dark, Math.sin(step) > 0 ? 'idle' : 'idle_b', sx, sy - lift, scale, true, Math.sin(step) * 0.035);
    if (march.torch) {
      const tx = sx - 27 * scale, ty = sy - lift - 80 * scale;
      const pixel = Math.max(1, scale * 0.8);
      const lick = Math.sin(seconds * 13 + index);
      ctx.fillStyle = 'rgb(30,16,10)';
      ctx.fillRect(tx - pixel / 2, ty, pixel, 34 * scale);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, tx, ty - 3 * scale, 30 * scale, FIRE, 0.5 * flicker(seconds, index));
      ctx.fillStyle = rgba([232, 76, 24], 0.95);
      ctx.fillRect(tx - pixel * 3, ty - pixel * 8, pixel * 6, pixel * 9);
      ctx.fillStyle = rgba([255, 136, 44], 0.95);
      ctx.fillRect(tx - pixel * 2, ty - pixel * (10.5 + lick), pixel * 4, pixel * (10 + lick));
      ctx.fillStyle = rgba([255, 226, 150], 0.95);
      ctx.fillRect(tx - pixel, ty - pixel * 6, pixel * 2, pixel * 5);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

function boisClairPainter(sheets: SheetBook): ShotPainter {
  const puff = softPuff([34, 22, 26]);
  const sparks = embers(150, 12041), near = embers(26, 3307);
  const random = seeded(808);
  const plumes = Array.from({ length: 34 }, () => ({ x: 860 + random() * 780, y: 120 + random() * 240, size: 90 + random() * 200, speed: 7 + random() * 12, phase: random() }));
  const cast = new Map<string, { entry: PixelSheetEntry; dark: CanvasImageSource }>();
  for (const [id, art] of sheets) cast.set(id, { entry: art.entry, dark: tintedCanvas(art.image, 'rgba(38,14,8,.56)') });
  return (frame) => {
    const { ctx, camera, seconds, width, height } = frame;
    paintLights(frame, VILLAGE);
    for (const plume of plumes) {
      const rise = ((plume.phase + (seconds * plume.speed) / 300) % 1);
      ctx.globalAlpha = 0.16 * Math.sin(rise * Math.PI);
      const size = plume.size * camera.scale * (1 + rise * 0.8);
      ctx.drawImage(puff, camera.x + (plume.x - 90 * rise) * camera.scale - size / 2, camera.y + (plume.y - 180 * rise) * camera.scale - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    paintMarch(frame, cast);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, width * 0.5, height * 0.2, width * 0.75, [190, 66, 20], 0.05 + 0.03 * flicker(seconds, 13));
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame);
    near.paint(frame, 0.9);
  };
}

function shadowPainter(): ShotPainter {
  const puff = softPuff([120, 142, 184]);
  const fall = ash(110, 2293, [150, 156, 170]);
  const random = seeded(61);
  const bands = Array.from({ length: 11 }, () => ({ x: random() * 1672, y: 470 + random() * 200, width: 380 + random() * 460, speed: 10 + random() * 16, alpha: 0.05 + random() * 0.07 }));
  const marks: readonly Light[] = [
    { x: 1178, y: 205, radius: 46, color: VIOLET, power: 0.6, seed: 1 }, { x: 1570, y: 292, radius: 48, color: VIOLET, power: 0.56, seed: 2 },
    { x: 1190, y: 466, radius: 58, color: VIOLET, power: 0.34, seed: 3 }, { x: 1026, y: 492, radius: 46, color: VIOLET, power: 0.34, seed: 4 },
    { x: 1576, y: 472, radius: 58, color: VIOLET, power: 0.34, seed: 5 },
  ];
  const figure = robedFigure();
  const walkers = [0, 1, 2, 3, 4, 5, 6].map((index) => ({ offset: index * 50 + (index % 2) * 13 }));
  return (frame) => {
    const { ctx, camera, seconds } = frame;
    paintLights(frame, [{ x: 1066, y: 66, radius: 240, color: MOON, power: 0.14, seed: 7 }, { x: 134, y: 395, radius: 110, color: CANDLE, power: 0.26, seed: 8 }]);
    for (const walker of walkers) {
      const x = 880 + walker.offset - seconds * 21;
      if (x < 606 || x > 884) continue;
      const lift = Math.abs(Math.sin(seconds * 3.1 + walker.offset)) * 1.4 * camera.scale;
      const tall = 46 * camera.scale, wide = 18 * camera.scale;
      ctx.drawImage(figure, camera.x + x * camera.scale - wide / 2, camera.y + 386 * camera.scale - tall - lift, wide, tall);
    }
    for (const band of bands) {
      const x = ((band.x - seconds * band.speed) % 2100 + 2100) % 2100 - 300;
      ctx.globalAlpha = band.alpha;
      ctx.drawImage(puff, camera.x + x * camera.scale, camera.y + band.y * camera.scale, band.width * camera.scale, 74 * camera.scale);
    }
    ctx.globalAlpha = 1;
    paintLights(frame, marks, smooth((seconds - 1.2) / 3.4) * (0.82 + 0.18 * Math.sin(seconds * 1.6)));
    fall.paint(frame, 0.55);
  };
}

const CAMP: readonly Light[] = [
  { x: 380, y: 496, radius: 250, color: FIRE, power: 0.3, seed: 1 }, { x: 176, y: 336, radius: 90, color: CANDLE, power: 0.22, seed: 2 },
  { x: 462, y: 300, radius: 70, color: CANDLE, power: 0.2, seed: 3 }, { x: 1478, y: 358, radius: 90, color: CANDLE, power: 0.22, seed: 4 },
  { x: 1426, y: 524, radius: 90, color: CANDLE, power: 0.24, seed: 5 }, { x: 358, y: 676, radius: 100, color: CANDLE, power: 0.24, seed: 6 },
];

function companyPainter(): ShotPainter {
  const random = seeded(2741);
  const sparks = Array.from({ length: 30 }, () => ({ phase: random(), offset: (random() - 0.5) * 70, speed: 0.16 + random() * 0.2 }));
  return (frame) => {
    const { ctx, camera, seconds } = frame;
    paintLights(frame, CAMP);
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of sparks) {
      const rise = (spark.phase + seconds * spark.speed) % 1;
      ctx.fillStyle = rgba([255, 164, 70], 1 - rise);
      const size = Math.max(2, Math.round(2 * camera.scale));
      ctx.fillRect(camera.x + (380 + spark.offset * (0.4 + rise) + Math.sin(rise * 9 + spark.offset) * 16) * camera.scale, camera.y + (486 - rise * 210) * camera.scale, size, size);
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}

export function createShotPainter(id: OpeningShotId, sheets: SheetBook): ShotPainter {
  if (id === 'prologue_fall') return fallPainter();
  if (id === 'prologue_seals') return sealsPainter();
  if (id === 'prologue_lion') return boisClairPainter(sheets);
  if (id === 'prologue_shadow') return shadowPainter();
  return companyPainter();
}
