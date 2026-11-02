import type { PixelSheetEntry } from '../../combat/pixel/PixelSpriteSheets';
import type { OpeningShotId, ViewCamera } from './openingShots';

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
export interface PainterOptions { sheets: SheetBook; marchers: boolean }

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

const BANNER_LANDS_AT = 8;

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

/** Worn linen on a broken spar, its hem torn into strips and smouldering. No emblem and no clan's colours (OD-2026-11-02-A, C5). */
function bannerCloth(): { canvas: HTMLCanvasElement; shade: CanvasImageSource; width: number; height: number } {
  const width = 92, height = 262, spar = 7;
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
      if (y < spar) { put(x, y, 44 + random() * 14, 30 + random() * 8, 22); continue; }
      if (y >= end || x < 3 || x >= width - 3) continue;
      let burn = clamp01(1 - (end - y) / 30);
      let cut = false;
      for (const slit of slits) {
        const dx = (x - slit.x) / slit.w, dy = (y - slit.y) / slit.h, distance = Math.hypot(dx, dy) - 1;
        if (distance < random() * 0.2) cut = true;
        burn = Math.max(burn, clamp01(1 - distance / 1.6));
      }
      if (cut) continue;
      const fold = Math.sin(x * 0.21 + Math.sin(y * 0.018) * 2.4) * 0.26 + Math.sin(x * 0.53 + y * 0.01) * 0.1;
      const weave = (x % 2 ? 4 : 0) + (y % 2 ? 3 : 0) + random() * 9;
      const under = 0.34 + 0.66 * (y / height) ** 1.4;
      const light = Math.max(0.12, (1 + fold) * under * (1 - burn * 0.86));
      const trim = y > spar && y <= spar + 4;
      const [r, g, b] = trim ? [150, 116, 66] : [136, 124, 104];
      const edge = burn > 0.8 && random() < 0.5 ? (burn - 0.8) * 3 : 0;
      put(x, y, (r + weave) * light + edge * 230, (g + weave) * light + edge * 82, (b + weave) * light * (1 - burn * 0.3));
    }
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, shade: tintedCanvas(canvas, 'rgb(4,3,6)'), width, height };
}

/** The cloth drifts down and reaches the ground just before the cut. Returns its middle, for the sparks. */
function paintBanner(frame: PaintFrame, cloth: ReturnType<typeof bannerCloth>, ground: number): number {
  const { ctx, width, height, seconds } = frame;
  const scale = Math.max(2, Math.round(height / 300));
  const fall = clamp01(seconds / BANNER_LANDS_AT);
  const clothHeight = cloth.height * scale;
  const startBottom = -height * 0.06, bottom = startBottom + (ground - startBottom) * (1 - (1 - fall) ** 1.35);
  const settle = smooth((seconds - BANNER_LANDS_AT) / 1.5);
  const drawn = clothHeight * (1 - settle * 0.2);
  const sway = (1 - settle) * Math.sin(seconds * 1.05);
  const x = width * 0.5 + sway * width * 0.045;
  const amplitude = (3 + 3 * (1 - fall)) * (1 + settle * 1.6);
  const time = seconds * (1 - settle);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, bottom);
  ctx.rotate(sway * 0.1);
  for (let column = 0; column < cloth.width; column += 2) {
    const wave = Math.sin(column * 0.11 + time * 2.4) * amplitude + Math.sin(column * 0.27 - time * 1.7) * amplitude * 0.4;
    const px = (column - cloth.width / 2) * scale, py = -drawn + Math.round(wave) * scale;
    const tall = drawn - Math.round(wave) * scale * settle;
    ctx.drawImage(cloth.canvas, column, 0, 2, cloth.height, px, py, 2 * scale, tall);
    const slope = Math.cos(column * 0.11 + time * 2.4) * 0.3;
    if (slope < 0) {
      ctx.globalAlpha = -slope;
      ctx.drawImage(cloth.shade, column, 0, 2, cloth.height, px, py, 2 * scale, tall);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  return x;
}

function fallPainter(): ShotPainter {
  const cloth = bannerCloth();
  const smoke = softPuff([58, 40, 34]);
  const sparks = embers(46, 913), cinders = ash(70, 317, [120, 112, 104]);
  const bursts: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  let burst = false;
  return (frame) => {
    const { ctx, width, height, seconds, dt } = frame;
    const ground = height * 0.78;
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, width / 2, ground + height * 0.05, width * 0.42, [150, 48, 18], 0.28 * flicker(seconds, 2));
    glow(ctx, width * 0.28, ground + height * 0.08, width * 0.2, [120, 36, 14], 0.2 * flicker(seconds, 4));
    glow(ctx, width * 0.74, ground + height * 0.07, width * 0.22, [120, 36, 14], 0.2 * flicker(seconds, 6));
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6; i += 1) {
      const size = width * (0.3 + i * 0.05);
      ctx.globalAlpha = 0.22;
      ctx.drawImage(smoke, ((i * 0.23 + seconds * 0.012) % 1.3 - 0.3) * width, ground - size * 0.62, size, size * 0.6);
    }
    ctx.globalAlpha = 1;
    cinders.paint(frame, 0.7);
    const x = paintBanner(frame, cloth, ground + height * 0.05);
    if (seconds > BANNER_LANDS_AT && !burst) {
      burst = true;
      const random = seeded(4049);
      for (let i = 0; i < 70; i += 1) bursts.push({ x: x + (random() - 0.5) * width * 0.2, y: ground + height * 0.03, vx: (random() - 0.5) * 170, vy: -50 - random() * 190, life: 0.6 + random() * 1.3 });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of bursts) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      spark.vy += 120 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      ctx.fillStyle = rgba([255, 150, 70], Math.min(1, spark.life));
      ctx.fillRect(Math.round(spark.x), Math.round(spark.y), 3, 3);
    }
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame, 0.85);
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

function boisClairPainter({ sheets, marchers }: PainterOptions): ShotPainter {
  const puff = softPuff([34, 22, 26]);
  const sparks = embers(150, 12041), near = embers(26, 3307);
  const random = seeded(808);
  const plumes = Array.from({ length: 34 }, () => ({ x: 860 + random() * 780, y: 120 + random() * 240, size: 90 + random() * 200, speed: 7 + random() * 12, phase: random() }));
  const cast = new Map<string, { entry: PixelSheetEntry; dark: CanvasImageSource }>();
  for (const [id, art] of sheets) cast.set(id, { entry: art.entry, dark: tintedCanvas(art.image, 'rgba(38,14,8,.56)') });
  return (frame) => {
    const { ctx, camera, seconds, width, height } = frame;
    if (marchers) {
      paintLights(frame, VILLAGE);
      for (const plume of plumes) {
        const rise = ((plume.phase + (seconds * plume.speed) / 300) % 1);
        ctx.globalAlpha = 0.16 * Math.sin(rise * Math.PI);
        const size = plume.size * camera.scale * (1 + rise * 0.8);
        ctx.drawImage(puff, camera.x + (plume.x - 90 * rise) * camera.scale - size / 2, camera.y + (plume.y - 180 * rise) * camera.scale - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      paintMarch(frame, cast);
    }
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, width * 0.5, height * 0.2, width * 0.75, [190, 66, 20], 0.05 + 0.03 * flicker(seconds, 13));
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame);
    near.paint(frame, 0.9);
  };
}

function shadowPainter({ sheets }: PainterOptions): ShotPainter {
  const puff = softPuff([120, 142, 184]);
  const fall = ash(110, 2293, [150, 156, 170]);
  const random = seeded(61);
  const bands = Array.from({ length: 11 }, () => ({ x: random() * 1672, y: 470 + random() * 200, width: 380 + random() * 460, speed: 10 + random() * 16, alpha: 0.05 + random() * 0.07 }));
  const marks: readonly Light[] = [
    { x: 1178, y: 205, radius: 46, color: VIOLET, power: 0.6, seed: 1 }, { x: 1570, y: 292, radius: 48, color: VIOLET, power: 0.56, seed: 2 },
    { x: 1190, y: 466, radius: 58, color: VIOLET, power: 0.34, seed: 3 }, { x: 1026, y: 492, radius: 46, color: VIOLET, power: 0.34, seed: 4 },
    { x: 1576, y: 472, radius: 58, color: VIOLET, power: 0.34, seed: 5 },
  ];
  const art = sheets.get('rogue');
  const shade = art ? tintedCanvas(art.image, 'rgba(5,6,14,1)') : null;
  const walkers = [0, 1, 2, 3, 4, 5].map((index) => ({ offset: index * 62 + (index % 2) * 17 }));
  return (frame) => {
    const { ctx, camera, seconds } = frame;
    paintLights(frame, [{ x: 1066, y: 66, radius: 240, color: MOON, power: 0.14, seed: 7 }, { x: 134, y: 395, radius: 110, color: CANDLE, power: 0.26, seed: 8 }]);
    if (art && shade) {
      for (const walker of walkers) {
        const x = 880 + walker.offset - seconds * 21;
        if (x < 606 || x > 884) continue;
        const step = seconds * 3.1 + walker.offset;
        const scale = 0.42 * camera.scale;
        const sx = camera.x + x * camera.scale, sy = camera.y + 387 * camera.scale;
        drawFrame(ctx, art.entry, shade, Math.sin(step) > 0 ? 'idle' : 'idle_b', sx, sy - Math.abs(Math.sin(step)) * 1.6 * scale, scale, true);
      }
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

export function createShotPainter(id: OpeningShotId, options: PainterOptions): ShotPainter {
  if (id === 'fall') return fallPainter();
  if (id === 'seals') return sealsPainter();
  if (id === 'bois-clair') return boisClairPainter(options);
  if (id === 'shadow') return shadowPainter(options);
  return companyPainter();
}
