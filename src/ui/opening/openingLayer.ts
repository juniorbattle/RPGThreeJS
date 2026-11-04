import type { PixelSheetEntry } from '../../combat/pixel/PixelSpriteSheets';
import { IMAGE_HEIGHT, IMAGE_WIDTH, type ViewCamera } from './openingShots';

export type Rgb = readonly [number, number, number];
export interface Light { x: number; y: number; radius: number; color: Rgb; power: number; seed: number }

export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const smooth = (value: number) => { const p = clamp01(value); return p * p * (3 - 2 * p); };
export const flicker = (t: number, seed: number) => 0.78 + 0.14 * Math.sin(t * 7.3 + seed) + 0.08 * Math.sin(t * 17.1 + seed * 2.1);
export const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r},${g},${b},${alpha})`;

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: Rgb, alpha: number): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/** The tableaux are painted in blocks of about two image pixels: the fires the code lights burn on that grain. */
export const GRAIN = 2;

const HEAT = 36;
const FIRE_STEP = 1 / 30;
/** Flat bands, as a pixel artist paints fire: from this heat up, this colour and opacity. Below the first, nothing. */
const BANDS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [6, 156, 32, 12, 0.8], [11, 222, 76, 18, 0.96], [17, 250, 134, 34, 1], [24, 255, 194, 72, 1], [30, 255, 242, 190, 1],
];
const PALETTE = (() => {
  const palette = new Uint8ClampedArray((HEAT + 1) * 4);
  for (let level = 0; level <= HEAT; level += 1) {
    const band = BANDS.filter(([from]) => from <= level).at(-1);
    if (band) palette.set([band[1], band[2], band[3], band[4] * 255], level * 4);
  }
  return palette;
})();

/** A fire on the tableaux' own grain: heat rises cell by cell, cools and drifts, so every tongue licks on its own. */
export class PixelFire {
  private readonly heat: Float32Array;
  private readonly blurred: Float32Array;
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly image: ImageData | null;
  private readonly random: () => number;
  private clock = 0;
  private breath = 1;

  constructor(readonly columns: number, readonly rows: number, seed: number, private readonly base = 0.62) {
    this.heat = new Float32Array(columns * rows);
    this.blurred = new Float32Array(columns * rows);
    this.canvas.width = columns;
    this.canvas.height = rows;
    this.ctx = this.canvas.getContext('2d');
    this.image = this.ctx?.createImageData(columns, rows) ?? null;
    this.random = seeded(seed);
    for (let i = 0; i < rows * 2; i += 1) this.spread();
    this.render();
  }

  /** A fire measured in image pixels. */
  static sized(width: number, height: number, seed: number, base?: number): PixelFire {
    return new PixelFire(Math.max(5, Math.round(width / GRAIN)), Math.max(8, Math.round(height / GRAIN)), seed, base);
  }

  advance(dt: number): void {
    this.clock += dt;
    if (this.clock < FIRE_STEP) return;
    while (this.clock >= FIRE_STEP) {
      this.clock -= FIRE_STEP;
      this.spread();
    }
    this.render();
  }

  /** Draws it standing on (x, y), one cell for every `cell` pixels. */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, alpha = 1): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.canvas, x - (this.columns * cell) / 2, y - this.rows * cell, this.columns * cell, this.rows * cell);
    ctx.restore();
  }

  private spread(): void {
    const { columns, rows, heat, random } = this;
    const center = (columns - 1) / 2, half = Math.max(1, columns / 2), bottom = (rows - 1) * columns;
    this.breath += (0.78 + random() * 0.3 - this.breath) * 0.2;
    for (let x = 0; x < columns; x += 1) {
      const edge = Math.abs(x - center) / half;
      heat[bottom + x] = edge < this.base ? HEAT * this.breath * (0.84 + 0.16 * random()) : edge < this.base + 0.22 ? HEAT * 0.55 * random() : 0;
    }
    // Cooling sized so the tallest tongues reach the top row; the flanks cool faster, which shapes the flame.
    const cooling = (2 * HEAT) / (rows * 1.2);
    for (let y = 1; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const to = Math.min(columns - 1, Math.max(0, x + Math.floor(random() * 3) - 1));
        const edge = Math.abs(to - center) / half;
        heat[(y - 1) * columns + to] = Math.max(0, heat[y * columns + x]! - random() * cooling * (1 + edge * edge * 2.2));
      }
    }
  }

  private render(): void {
    const { ctx, image, heat, blurred, columns, rows } = this;
    if (!ctx || !image) return;
    // Each cell leans on its neighbours, so the bands come out as tongues instead of speckle.
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const i = y * columns + x;
        let sum = heat[i]! * 2, weight = 2;
        if (x > 0) { sum += heat[i - 1]!; weight += 1; }
        if (x < columns - 1) { sum += heat[i + 1]!; weight += 1; }
        if (y > 0) { sum += heat[i - columns]!; weight += 1; }
        if (y < rows - 1) { sum += heat[i + columns]!; weight += 1; }
        blurred[i] = sum / weight;
      }
    }
    const data = image.data;
    for (let i = 0; i < heat.length; i += 1) {
      const level = Math.min(HEAT, Math.round(blurred[i]!)) * 4;
      // The root melts into what burns instead of ending on a hard line.
      const root = Math.min(1, (rows - 1 - Math.floor(i / columns)) / 2 + 0.3);
      data[i * 4] = PALETTE[level]!;
      data[i * 4 + 1] = PALETTE[level + 1]!;
      data[i * 4 + 2] = PALETTE[level + 2]!;
      data[i * 4 + 3] = PALETTE[level + 3]! * root;
    }
    ctx.putImageData(image, 0, 0);
  }
}

/** Heat from 0 to 1, then colour and opacity: the same five flat bands as `PixelFire`. */
const TONGUE_BANDS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0.06, 150, 30, 12, 0.85], [0.22, 220, 74, 18, 0.97], [0.42, 250, 134, 34, 1], [0.62, 255, 196, 74, 1], [0.82, 255, 242, 190, 1],
];

interface Tongue { x: number; width: number; height: number; phase: number; speed: number }

/**
 * A fire close to the viewer, drawn as a pixel artist draws one: a few tall tongues, each swaying, stretching and
 * shedding a flicker that rises and dies, on the tableaux' grain.
 */
export class TongueFire {
  private readonly heat: Float32Array;
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly image: ImageData | null;
  private readonly random: () => number;
  private readonly tongues: Tongue[];
  private readonly flickers: Array<{ x: number; y: number; radius: number; life: number; age: number; drift: number }> = [];
  private clock = 0;
  private time = 0;

  constructor(readonly columns: number, readonly rows: number, seed: number) {
    this.heat = new Float32Array(columns * rows);
    this.canvas.width = columns;
    this.canvas.height = rows;
    this.ctx = this.canvas.getContext('2d');
    this.image = this.ctx?.createImageData(columns, rows) ?? null;
    this.random = seeded(seed);
    // Tallest in the middle, lower and narrower towards the edges of the hearth.
    this.tongues = [[0, 0.5, 1], [-0.3, 0.4, 0.74], [0.3, 0.42, 0.7], [-0.6, 0.3, 0.44], [0.62, 0.28, 0.4]].map(([x, width, height]) => ({
      x: x!, width: width!, height: height!, phase: this.random() * 6.3, speed: 4.4 + this.random() * 2.6,
    }));
    this.render();
  }

  /** A fire measured in image pixels. */
  static sized(width: number, height: number, seed: number): TongueFire {
    return new TongueFire(Math.max(8, Math.round(width / GRAIN)), Math.max(12, Math.round(height / GRAIN)), seed);
  }

  advance(dt: number): void {
    this.clock += dt;
    if (this.clock < FIRE_STEP) return;
    while (this.clock >= FIRE_STEP) {
      this.clock -= FIRE_STEP;
      this.time += FIRE_STEP;
      this.shed(FIRE_STEP);
    }
    this.render();
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, alpha = 1): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.canvas, x - (this.columns * cell) / 2, y - this.rows * cell, this.columns * cell, this.rows * cell);
    ctx.restore();
  }

  /** Where each tongue stands now: its height in cells and the middle of a row `up` cells above the hearth. */
  private shape(tongue: Tongue): { height: number; middle: (up: number) => number } {
    const { columns, rows, time } = this;
    const height = tongue.height * rows * (0.8 + 0.13 * Math.sin(time * tongue.speed + tongue.phase) + 0.07 * Math.sin(time * tongue.speed * 2.7 + tongue.phase * 1.7));
    const root = (columns - 1) / 2 + (tongue.x * columns) / 2;
    return { height, middle: (up) => root + Math.pow(up / height, 1.4) * Math.sin(time * 3.1 + tongue.phase - (up / height) * 4) * columns * 0.1 };
  }

  private shed(dt: number): void {
    const { random } = this;
    for (const tongue of this.tongues) {
      if (random() > dt * 7 * tongue.height) continue;
      const { height, middle } = this.shape(tongue);
      this.flickers.push({ x: middle(height * 0.9), y: height * 0.86, radius: 1.2 + random() * 1.6 * tongue.width * 2, life: 0.28 + random() * 0.32, age: 0, drift: (random() - 0.5) * 3 });
    }
    for (const flicker of this.flickers) {
      flicker.age += dt;
      flicker.y += dt * this.rows * 0.9;
      flicker.x += dt * flicker.drift;
    }
    for (let i = this.flickers.length - 1; i >= 0; i -= 1) if (this.flickers[i]!.age >= this.flickers[i]!.life) this.flickers.splice(i, 1);
  }

  private render(): void {
    const { ctx, image, heat, columns, rows } = this;
    if (!ctx || !image) return;
    heat.fill(0);
    for (const tongue of this.tongues) {
      const { height, middle } = this.shape(tongue);
      for (let up = 0; up < Math.min(rows, height); up += 1) {
        const u = up / height;
        // Widest a little above the hearth, then drawn out to a point.
        const half = ((tongue.width * columns) / 2) * Math.pow(1 - u, 0.9) * Math.min(1, 0.62 + u * 2.6);
        if (half < 0.3) continue;
        const center = middle(up), row = (rows - 1 - up) * columns;
        for (let x = Math.max(0, Math.floor(center - half)); x <= Math.min(columns - 1, Math.ceil(center + half)); x += 1) {
          const across = 1 - Math.abs(x + 0.5 - center) / half;
          if (across <= 0) continue;
          heat[row + x] = Math.max(heat[row + x]!, Math.pow(across, 0.7) * (1 - u * 0.62));
        }
      }
    }
    for (const flicker of this.flickers) {
      const fade = 1 - flicker.age / flicker.life, radius = flicker.radius * (0.5 + fade * 0.5);
      for (let up = Math.floor(flicker.y - radius); up <= Math.ceil(flicker.y + radius); up += 1) {
        if (up < 0 || up >= rows) continue;
        for (let x = Math.floor(flicker.x - radius); x <= Math.ceil(flicker.x + radius); x += 1) {
          if (x < 0 || x >= columns) continue;
          const near = 1 - Math.hypot(x + 0.5 - flicker.x, up + 0.5 - flicker.y) / radius;
          if (near > 0) heat[(rows - 1 - up) * columns + x] = Math.max(heat[(rows - 1 - up) * columns + x]!, near * 0.5 * fade + 0.08);
        }
      }
    }
    const data = image.data;
    for (let i = 0; i < heat.length; i += 1) {
      const band = TONGUE_BANDS.filter(([from]) => from <= heat[i]!).at(-1);
      // The root melts into the logs instead of ending on a hard line.
      const root = Math.min(1, (rows - 1 - Math.floor(i / columns)) / 3 + 0.25);
      data[i * 4] = band?.[1] ?? 0;
      data[i * 4 + 1] = band?.[2] ?? 0;
      data[i * 4 + 2] = band?.[3] ?? 0;
      data[i * 4 + 3] = band ? band[4] * 255 * root : 0;
    }
    ctx.putImageData(image, 0, 0);
  }
}

const OUTLINE: Rgb = [20, 14, 26];

/**
 * A character who has no combat sheet, brought down from their master portrait to the sheets' own density, the way
 * tools/pixel-sprites does it for master-only units: area reduction, hard edges, no lone specks, a one-pixel ink
 * outline, and a second frame where everything above the waist sinks one pixel to breathe. `factor` is the
 * character's world units per pixel times the sheets' pixels per unit.
 */
export function pixelFigure(image: HTMLImageElement, unitId: string, factor: number): { entry: PixelSheetEntry; image: HTMLCanvasElement } | null {
  const width = image.naturalWidth, height = image.naturalHeight;
  const read = document.createElement('canvas');
  read.width = width;
  read.height = height;
  const readCtx = read.getContext('2d', { willReadFrequently: true });
  if (!readCtx || !width || !height) return null;
  readCtx.drawImage(image, 0, 0);
  const full = readCtx.getImageData(0, 0, width, height).data;
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (full[(y * width + x) * 4 + 3]! < 128) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) return null;
  const pad = 2;
  const w = Math.max(1, Math.round((right + 1 - left) * factor)), h = Math.max(1, Math.round((bottom + 1 - top) * factor));
  const cellWidth = w + pad * 2, cellHeight = h + pad * 2;
  const small = document.createElement('canvas');
  small.width = cellWidth;
  small.height = cellHeight;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, left, top, right + 1 - left, bottom + 1 - top, pad, pad, w, h);
  const cell = ctx.getImageData(0, 0, cellWidth, cellHeight);
  const data = cell.data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < cellWidth && y < cellHeight && data[(y * cellWidth + x) * 4 + 3] === 255;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! >= 122) data[i + 3] = 255; else data.fill(0, i, i + 4);
  }
  for (let y = 0; y < cellHeight; y += 1) for (let x = 0; x < cellWidth; x += 1) {
    if (solid(x, y) && !solid(x - 1, y) && !solid(x + 1, y) && !solid(x, y - 1) && !solid(x, y + 1)) data.fill(0, (y * cellWidth + x) * 4, (y * cellWidth + x) * 4 + 4);
  }
  const edges: number[] = [];
  for (let y = 0; y < cellHeight; y += 1) for (let x = 0; x < cellWidth; x += 1) {
    if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edges.push((y * cellWidth + x) * 4);
  }
  for (const i of edges) data.set([...OUTLINE, 255], i);
  const feet = cellHeight - pad - 1, waist = Math.round(feet - (feet - pad) * 0.46);
  const sheet = document.createElement('canvas');
  sheet.width = cellWidth * 2;
  sheet.height = cellHeight;
  const sheetCtx = sheet.getContext('2d');
  if (!sheetCtx) return null;
  sheetCtx.putImageData(cell, 0, 0);
  sheetCtx.putImageData(cell, cellWidth, 0, 0, waist + 1, cellWidth, cellHeight - waist - 1);
  sheetCtx.putImageData(cell, cellWidth, 1, 0, 0, cellWidth, waist);
  return {
    image: sheet,
    entry: {
      unitId, file: '', cell: [cellWidth, cellHeight], anchor: [Math.floor(cellWidth / 2), feet], presenceScale: 1, cells: ['idle', 'idle_b'],
      anims: { idle: { frames: ['idle', 'idle_b'], ms: [680, 680], loop: true } }, figureHeightPx: feet - pad,
      idleBoundsPx: { left: pad, top: pad, right: cellWidth - pad, bottom: feet }, masterOnly: true,
    },
  };
}

/**
 * What the code adds to a tableau, drawn in image pixels at the painting's own resolution and lit by the scene's own
 * lights, then laid over the picture through its camera, so it scales exactly as the painting does.
 */
export class PropLayer {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  /** Only a layer that is lit needs this second canvas: it is made on the first `shade`. */
  private lit: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } | null = null;

  constructor() {
    this.canvas.width = IMAGE_WIDTH;
    this.canvas.height = IMAGE_HEIGHT;
    this.ctx = this.canvas.getContext('2d');
  }

  /** Clears the layer and returns it, set to draw in image pixels. */
  begin(): CanvasRenderingContext2D | null {
    const { ctx, canvas } = this;
    if (!ctx) return null;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  /** Night over everything drawn so far, then each light where it falls on it. */
  shade(ambient: string, lights: readonly Light[], seconds: number): void {
    const { ctx, canvas } = this;
    if (!this.lit) {
      const lit = document.createElement('canvas');
      lit.width = IMAGE_WIDTH;
      lit.height = IMAGE_HEIGHT;
      this.lit = { canvas: lit, ctx: lit.getContext('2d') };
    }
    const { canvas: lit, ctx: litCtx } = this.lit;
    if (!ctx || !litCtx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    litCtx.globalCompositeOperation = 'source-over';
    litCtx.clearRect(0, 0, lit.width, lit.height);
    litCtx.globalCompositeOperation = 'lighter';
    for (const light of lights) glow(litCtx, light.x, light.y, light.radius, light.color, light.power * flicker(seconds, light.seed));
    litCtx.globalCompositeOperation = 'destination-in';
    litCtx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(lit, 0, 0);
    ctx.restore();
  }

  present(ctx: CanvasRenderingContext2D, camera: ViewCamera): void {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.canvas, camera.x, camera.y, this.canvas.width * camera.scale, this.canvas.height * camera.scale);
    ctx.restore();
  }
}
