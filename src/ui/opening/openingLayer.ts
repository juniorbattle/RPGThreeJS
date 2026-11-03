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
