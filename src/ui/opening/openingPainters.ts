import type { PixelSheetEntry } from '../../combat/pixel/PixelSpriteSheets';
import { clamp01, flicker, glow, GRAIN, PixelFire, PropLayer, rgba, seeded, smooth, type Light, type Rgb } from './openingLayer';
import { OPENING_POLE_CRACKS_AT, OPENING_POLE_LANDS_AT, type OpeningShotId, type ViewCamera } from './openingShots';

export interface PaintFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Seconds since the shot began, on the sequence's own clock. */
  seconds: number;
  dt: number;
  camera: ViewCamera;
  /** Reduced motion: the camera holds and nothing falls or marches; fire, light and wind keep moving in place. */
  reduced: boolean;
}

export type ShotPainter = (frame: PaintFrame) => void;

export interface SheetArt { entry: PixelSheetEntry; image: HTMLImageElement }
export type SheetBook = ReadonlyMap<string, SheetArt>;

const FIRE: Rgb = [255, 122, 38], CANDLE: Rgb = [255, 190, 96], VIOLET: Rgb = [176, 92, 255], MOON: Rgb = [150, 180, 255];

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

/** A fire of the tableau, in image pixels: the middle of its root, then its size. */
interface FireSpot { x: number; y: number; width: number; height: number; base?: number }

function kindle(spots: readonly FireSpot[], seed: number): Array<{ spot: FireSpot; fire: PixelFire }> {
  return spots.map((spot, index) => ({ spot, fire: PixelFire.sized(spot.width, spot.height, seed + index * 97, spot.base) }));
}

function burn(ctx: CanvasRenderingContext2D, flames: ReturnType<typeof kindle>, dt: number): void {
  for (const { spot, fire } of flames) {
    fire.advance(dt);
    fire.draw(ctx, spot.x, spot.y, GRAIN);
  }
}

/** The fires the painter put in the picture, set burning in place on its grain. */
function paintedFires(spots: readonly FireSpot[], seed: number): (frame: PaintFrame) => void {
  const layer = new PropLayer();
  const flames = kindle(spots, seed);
  return ({ ctx, camera, dt }) => {
    const props = layer.begin();
    if (!props) return;
    burn(props, flames, dt);
    layer.present(ctx, camera);
  };
}

/** A wooden shaft with its lit edge, in image pixels. */
function shaft(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, width: number, dark: string, lit: string): void {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
  const length = Math.hypot(x1 - x0, y1 - y0);
  ctx.fillStyle = dark;
  ctx.fillRect(0, -width / 2, length, width);
  ctx.fillStyle = lit;
  ctx.fillRect(0, -width / 2, length, width * 0.4);
  ctx.restore();
}

function spearhead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgb(92,96,108)';
  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(10, -5);
  ctx.lineTo(24, 0);
  ctx.lineTo(10, 5);
  ctx.lineTo(-2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgb(176,180,194)';
  ctx.fillRect(4, -2, 15, 2);
  ctx.restore();
}

/** Worn linen with a pointed, torn, smouldering hem. No emblem (OD-2026-11-02-A, C5). */
function bannerCloth(): { canvas: HTMLCanvasElement; shade: CanvasImageSource; light: CanvasImageSource; width: number; height: number } {
  const width = 92, height = 262;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, shade: canvas, light: canvas, width, height };
  const random = seeded(7717);
  const tears = Array.from({ length: 23 }, () => random() ** 2.2 * 58);
  const hem = (x: number) => height - 4 - Math.abs((2 * x) / width - 1) * 74 - (tears[Math.floor((x / width) * tears.length)] ?? 0) - random() * 3;
  const slits = [{ x: 28, y: 120, w: 3, h: 34 }, { x: 62, y: 76, w: 4, h: 42 }, { x: 44, y: 168, w: 3, h: 26 }];
  const patches = [{ x: 14, y: 40, w: 22, h: 18 }, { x: 54, y: 142, w: 18, h: 24 }];
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
      const light = Math.max(0.12, (1 + fold) * (0.66 + 0.34 * (y / height)) * (1 - burn * 0.86));
      const trim = y <= 5 || x <= 4 || x >= width - 5;
      const band = !trim && (x <= 9 || x >= width - 10 || (y > 8 && y <= 11));
      const seam = y % 66 === 65 || (y % 66 === 64 && x % 4 === 0);
      const patch = patches.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
      const stitch = patch && (x === patch.x || x === patch.x + patch.w - 1 || y === patch.y || y === patch.y + patch.h - 1) && (x + y) % 3 === 0;
      const [r, g, b] = trim ? [196, 154, 86] : band ? [120, 92, 60] : seam || stitch ? [104, 92, 78] : patch ? [150, 140, 122] : [184, 168, 140];
      const edge = burn > 0.8 && random() < 0.5 ? (burn - 0.8) * 3 : 0;
      put(x, y, (r + weave) * light + edge * 230, (g + weave) * light + edge * 82, (b + weave) * light * (1 - burn * 0.3));
    }
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, shade: tintedCanvas(canvas, 'rgb(6,7,18)'), light: tintedCanvas(canvas, 'rgb(255,226,178)'), width, height };
}

interface ClothNode { x: number; y: number; px: number; py: number }

/** `perspective`: the pole falls away from the viewer as well as sideways, so its crossbar turns less than it does on screen. */
const BANNER = { x: 640, y: 654, ground: 668, height: 470, snapAt: 0.2, barAt: 0.87, clothScale: 1.25, lean: 0.72, perspective: 0.4 };
const NODES = 18;
const STEP = 1 / 60;
/** Under reduced motion the standing banner fades into the broken one, on the word "défaite". */
const FALL_FADE_AT = 4.6;

/** How far the upper pole leans from upright, at each second of the shot. */
type Pose = (t: number) => number;
const standing: Pose = (t) => Math.sin(t * 1.3) * 0.012;
const leaning: Pose = (t) => BANNER.lean + Math.sin(t * 1.1) * 0.006;
/** It snaps on "défaite", drops like a weight, catches on its own splinters and rocks to rest. */
const falling: Pose = (t) => {
  if (t < OPENING_POLE_CRACKS_AT) return standing(t);
  const fall = clamp01((t - OPENING_POLE_CRACKS_AT) / (OPENING_POLE_LANDS_AT - OPENING_POLE_CRACKS_AT));
  if (fall < 1) return standing(t) * (1 - fall) + BANNER.lean * fall * fall;
  const since = t - OPENING_POLE_LANDS_AT;
  return BANNER.lean - 0.09 * Math.exp(-4.2 * since) * Math.sin(since * 11);
};

/** The standard: a pole that can snap, and a cloth that really hangs from its crossbar, in the wind. */
class BannerRig {
  readonly nodes: ClothNode[] = [];
  private readonly segment: number;
  private time = 0;

  constructor(private readonly cloth: ReturnType<typeof bannerCloth>, private readonly pose: Pose) {
    this.segment = (cloth.height * BANNER.clothScale) / (NODES - 1);
    const bar = this.along(BANNER.barAt, 0);
    for (let i = 0; i < NODES; i += 1) this.nodes.push({ x: bar.x, y: bar.y + i * this.segment, px: bar.x, py: bar.y + i * this.segment });
  }

  along(ratio: number, t: number): { x: number; y: number } {
    const pivotY = BANNER.y - BANNER.height * BANNER.snapAt, reach = (ratio - BANNER.snapAt) * BANNER.height, angle = this.pose(t);
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
    // Down among the ruins the cloth is out of the worst of the wind.
    const shelter = 1 - clamp01(this.pose(t) / BANNER.lean) * 0.55;
    const anchor = this.nodes[0]!;
    anchor.x = anchor.px = bar.x;
    anchor.y = anchor.py = bar.y;
    this.nodes.forEach((node, i) => {
      if (i === 0) return;
      const wind = (220 + 170 * Math.sin(t * 1.9 + i * 0.42) + 90 * Math.sin(t * 4.3 + i * 0.9)) * (0.4 + (0.6 * i) / NODES) * shelter;
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

  /** Draws it in image pixels. */
  paint(ctx: CanvasRenderingContext2D, seconds: number): void {
    const pivot = { x: BANNER.x, y: BANNER.y - BANNER.height * BANNER.snapAt };
    const angle = this.pose(seconds), bar = this.along(BANNER.barAt, seconds), tip = this.along(1, seconds);
    const up = { x: Math.sin(angle), y: -Math.cos(angle) }, turn = angle * BANNER.perspective, across = { x: Math.cos(turn), y: Math.sin(turn) };
    shaft(ctx, BANNER.x, BANNER.y, pivot.x, pivot.y, 9, 'rgb(70,50,36)', 'rgb(116,86,58)');
    // Broken, the upper pole hangs a hand's width off the stub, held by a few fibres.
    const broken = angle > 0.05, gap = broken ? 7 : 0;
    const root = { x: pivot.x + up.x * gap + across.x * gap * 0.6, y: pivot.y + up.y * gap + across.y * gap * 0.6 };
    shaft(ctx, root.x, root.y, tip.x, tip.y, 9, 'rgb(70,50,36)', 'rgb(116,86,58)');
    if (broken) {
      ctx.strokeStyle = 'rgb(150,112,72)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const offset of [-3, 0, 3]) {
        ctx.moveTo(pivot.x + offset, pivot.y - 4);
        ctx.lineTo(root.x + offset * Math.cos(angle), root.y + offset * Math.sin(angle) + 2);
      }
      ctx.stroke();
      // The break: raw wood teeth on the stub.
      ctx.fillStyle = 'rgb(164,124,80)';
      ctx.beginPath();
      ctx.moveTo(pivot.x - 4.5, pivot.y + 3);
      ctx.lineTo(pivot.x - 3, pivot.y - 9);
      ctx.lineTo(pivot.x - 0.5, pivot.y - 2);
      ctx.lineTo(pivot.x + 1.5, pivot.y - 13);
      ctx.lineTo(pivot.x + 4.5, pivot.y + 3);
      ctx.closePath();
      ctx.fill();
    }
    shaft(ctx, bar.x - across.x * 70, bar.y - across.y * 70, bar.x + across.x * 70, bar.y + across.y * 70, 8, 'rgb(84,60,40)', 'rgb(132,98,64)');
    shaft(ctx, tip.x, tip.y, tip.x + up.x * 30, tip.y + up.y * 30, 10, 'rgb(150,116,62)', 'rgb(226,190,120)');
    // Each row is a parallelogram drawn from the cloth: its top follows the crossbar, and lower down the hem hangs
    // level whatever the slant of the bar, as cloth does under its own weight.
    const rowHeight = this.cloth.height / (NODES - 1), width = this.cloth.width * BANNER.clothScale;
    // The folds follow the cloth: where it bends one way it turns from the light, the other way it catches it.
    const heading = (i: number) => Math.atan2(this.nodes[i + 1]!.x - this.nodes[i]!.x, this.nodes[i + 1]!.y - this.nodes[i]!.y);
    for (let i = 0; i < NODES - 1; i += 1) {
      const top = this.nodes[i]!, bottom = this.nodes[i + 1]!;
      const bend = i + 2 < NODES ? heading(i + 1) - heading(i) : 0;
      const level = (i / (NODES - 1)) * 0.75;
      const ax = across.x + (1 - across.x) * level, ay = across.y * (1 - level), norm = Math.hypot(ax, ay) || 1;
      const wx = ((ax / norm) * width) / this.cloth.width, wy = ((ay / norm) * width) / this.cloth.width;
      ctx.save();
      ctx.transform(wx, wy, (bottom.x - top.x) / rowHeight, (bottom.y - top.y) / rowHeight, top.x - (wx * this.cloth.width) / 2, top.y - (wy * this.cloth.width) / 2);
      ctx.drawImage(this.cloth.canvas, 0, i * rowHeight, this.cloth.width, rowHeight, 0, 0, this.cloth.width, rowHeight * 1.2);
      const alpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha * Math.min(0.55, Math.max(0, bend) * 5);
      ctx.drawImage(this.cloth.shade, 0, i * rowHeight, this.cloth.width, rowHeight, 0, 0, this.cloth.width, rowHeight * 1.2);
      ctx.globalAlpha = alpha * Math.min(0.3, Math.max(0, -bend) * 4);
      ctx.drawImage(this.cloth.light, 0, i * rowHeight, this.cloth.width, rowHeight, 0, 0, this.cloth.width, rowHeight * 1.2);
      ctx.restore();
    }
  }
}

/** The leftovers of the fight around the standard. Nothing here belongs to a named clan. */
const LANCES: ReadonlyArray<{ x: number; y: number; angle: number; length: number; tip: boolean }> = [
  { x: 470, y: 676, angle: -0.34, length: 190, tip: true }, { x: 530, y: 650, angle: 0.2, length: 120, tip: false },
  { x: 1236, y: 636, angle: -0.26, length: 170, tip: true }, { x: 1318, y: 672, angle: 0.14, length: 130, tip: true },
  { x: 1420, y: 640, angle: 0.3, length: 110, tip: false },
];
/** Lances on the paving: a start, an angle from the horizontal, a length. */
const FALLEN_LANCES: ReadonlyArray<{ x: number; y: number; angle: number; length: number }> = [
  { x: 742, y: 694, angle: -0.06, length: 170 }, { x: 498, y: 704, angle: 3.04, length: 150 },
];
const SHIELDS: ReadonlyArray<{ x: number; y: number; radius: number }> = [{ x: 572, y: 686, radius: 24 }, { x: 830, y: 678, radius: 21 }, { x: 1196, y: 664, radius: 19 }];
/** Two more broken standards, further off, with what is left of their cloth. */
const STANDARDS: ReadonlyArray<{ x: number; y: number; angle: number; height: number; color: Rgb; seed: number }> = [
  { x: 322, y: 612, angle: -0.42, height: 150, color: [88, 80, 70], seed: 1 }, { x: 1150, y: 618, angle: 0.5, height: 136, color: [66, 70, 82], seed: 2 },
];
const FIRES: readonly FireSpot[] = [{ x: 420, y: 656, width: 74, height: 104 }, { x: 1290, y: 634, width: 50, height: 72 }, { x: 1380, y: 666, width: 70, height: 98 }];
/** Glow of the fires and the moon on the painting. */
const BATTLEFIELD: readonly Light[] = [
  ...FIRES.map((fire, index) => ({ x: fire.x, y: fire.y - fire.height * 0.4, radius: fire.width * 4.4, color: FIRE, power: 0.36, seed: index + 1 })),
  { x: 1220, y: 62, radius: 220, color: MOON, power: 0.12, seed: 7 },
];
/** The same lights, as they fall on what the code lays on the paving. */
const FIELD_LIGHT: readonly Light[] = [
  ...FIRES.map((fire, index) => ({ x: fire.x, y: fire.y - 24, radius: fire.width * (index ? 3.4 : 4.4), color: FIRE, power: 0.5, seed: index + 1 })),
  { x: 1200, y: 120, radius: 900, color: MOON, power: 0.14, seed: 7 },
];

interface Heap { planks: Array<{ x: number; y: number; length: number; angle: number; thick: number }>; rocks: Array<{ x: number; y: number; rx: number; ry: number }> }

/** What each fire burns: broken planks and stones, so no flame stands on bare paving. */
function heapOf(fire: FireSpot, random: () => number): Heap {
  return {
    planks: Array.from({ length: 7 }, () => ({ x: fire.x + (random() - 0.5) * fire.width * 0.9, y: fire.y - random() * 6, length: 14 + random() * 18, angle: (random() - 0.5) * 1.4, thick: 4 + random() * 2 })),
    rocks: Array.from({ length: 4 }, () => ({ x: fire.x + (random() - 0.5) * fire.width * 1.3, y: fire.y + 2 + random() * 4, rx: 5 + random() * 6, ry: 3 + random() * 2 })),
  };
}

function paintHeap(ctx: CanvasRenderingContext2D, heap: Heap): void {
  for (const rock of heap.rocks) {
    ctx.fillStyle = 'rgb(74,68,78)';
    ctx.beginPath();
    ctx.ellipse(rock.x, rock.y, rock.rx, rock.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const plank of heap.planks) {
    const dx = (Math.cos(plank.angle) * plank.length) / 2, dy = (Math.sin(plank.angle) * plank.length) / 2;
    shaft(ctx, plank.x - dx, plank.y - dy, plank.x + dx, plank.y + dy, plank.thick, 'rgb(46,32,24)', 'rgb(104,66,40)');
  }
}

function paintLance(ctx: CanvasRenderingContext2D, lance: (typeof LANCES)[number]): void {
  const top = { x: lance.x + Math.sin(lance.angle) * lance.length, y: lance.y - Math.cos(lance.angle) * lance.length };
  shaft(ctx, lance.x, lance.y, top.x, top.y, 5, 'rgb(46,36,30)', 'rgb(80,64,50)');
  if (lance.tip) spearhead(ctx, top.x, top.y, Math.atan2(-Math.cos(lance.angle), Math.sin(lance.angle)));
  else {
    // Snapped: a splintered end.
    ctx.fillStyle = 'rgb(150,112,74)';
    ctx.beginPath();
    ctx.moveTo(top.x - 2.5, top.y + 2);
    ctx.lineTo(top.x - 1, top.y - 6);
    ctx.lineTo(top.x + 0.5, top.y - 1);
    ctx.lineTo(top.x + 2, top.y - 8);
    ctx.lineTo(top.x + 2.5, top.y + 2);
    ctx.closePath();
    ctx.fill();
  }
}

function paintShield(ctx: CanvasRenderingContext2D, { x, y, radius }: (typeof SHIELDS)[number]): void {
  ctx.fillStyle = 'rgba(12,8,8,.6)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3, radius * 1.05, radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgb(78,60,46)';
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgb(108,110,120)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'rgb(140,142,152)';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, radius * 0.22, radius * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

const STRIPS: ReadonlyArray<{ at: number; length: number; width: number; shade: number }> = [
  { at: -13, length: 40, width: 8, shade: 1 }, { at: -5, length: 24, width: 7, shade: 0.78 }, { at: 3, length: 46, width: 8, shade: 0.92 }, { at: 11, length: 17, width: 7, shade: 0.7 },
];

function paintStandard(ctx: CanvasRenderingContext2D, standard: (typeof STANDARDS)[number], seconds: number): void {
  const { x, y, angle, height, color, seed } = standard;
  const up = { x: Math.sin(angle), y: -Math.cos(angle) }, across = { x: Math.cos(angle), y: Math.sin(angle) };
  const top = { x: x + up.x * height, y: y + up.y * height }, bar = { x: x + up.x * height * 0.88, y: y + up.y * height * 0.88 };
  shaft(ctx, x, y, top.x, top.y, 5, 'rgb(40,32,28)', 'rgb(70,58,48)');
  shaft(ctx, bar.x - across.x * 18, bar.y - across.y * 18, bar.x + across.x * 18, bar.y + across.y * 18, 4, 'rgb(46,36,30)', 'rgb(78,62,50)');
  // What is left of the cloth: strips of different lengths, each swinging on its own.
  STRIPS.forEach((strip, k) => {
    const root = { x: bar.x + across.x * strip.at, y: bar.y + across.y * strip.at };
    const sway = Math.sin(seconds * 2.3 + k * 1.3 + seed * 2) * strip.length * 0.14;
    ctx.fillStyle = rgba([color[0] * strip.shade, color[1] * strip.shade, color[2] * strip.shade], 1);
    ctx.beginPath();
    ctx.moveTo(root.x - (across.x * strip.width) / 2, root.y - (across.y * strip.width) / 2);
    ctx.lineTo(root.x + (across.x * strip.width) / 2, root.y + (across.y * strip.width) / 2);
    ctx.lineTo(root.x + sway + strip.width * 0.25, root.y + strip.length);
    ctx.lineTo(root.x + sway - strip.width * 0.1, root.y + strip.length * 0.82);
    ctx.lineTo(root.x + sway * 0.6 - strip.width * 0.4, root.y + strip.length * 0.9);
    ctx.closePath();
    ctx.fill();
  });
}

function fallPainter(): ShotPainter {
  const layer = new PropLayer(), fade = new PropLayer();
  const cloth = bannerCloth();
  let rigs: Array<{ rig: BannerRig; shown: (t: number) => number }> | null = null;
  const flames = kindle(FIRES, 1301);
  const smoke = softPuff([30, 26, 34]);
  const sparks = embers(70, 913), cinders = ash(80, 317, [150, 150, 164]);
  const random = seeded(4049);
  const heaps = FIRES.map((fire) => heapOf(fire, random));
  const plumes = Array.from({ length: 22 }, () => ({ fire: FIRES[Math.floor(random() * FIRES.length)]!, size: 70 + random() * 150, speed: 0.05 + random() * 0.05, phase: random() }));
  const bursts: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  let cracked = false, caught = false;
  const scatter = (x: number, y: number, spread: number, count: number) => {
    for (let i = 0; i < count; i += 1) bursts.push({ x: x + (random() - 0.5) * spread, y, vx: (random() - 0.5) * 190, vy: -60 - random() * 200, life: 0.5 + random() * 1.1 });
  };
  return (frame) => {
    const { ctx, camera, width, height, seconds, dt, reduced } = frame;
    rigs ??= reduced
      ? [{ rig: new BannerRig(cloth, standing), shown: (t) => 1 - smooth(t - FALL_FADE_AT) }, { rig: new BannerRig(cloth, leaning), shown: (t) => smooth(t - FALL_FADE_AT) }]
      : [{ rig: new BannerRig(cloth, falling), shown: () => 1 }];
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
    const props = layer.begin();
    if (props) {
      for (const heap of heaps) paintHeap(props, heap);
      for (const standard of STANDARDS) paintStandard(props, standard, seconds);
      for (const lance of FALLEN_LANCES) shaft(props, lance.x, lance.y, lance.x + Math.cos(lance.angle) * lance.length, lance.y + Math.sin(lance.angle) * lance.length, 5, 'rgb(42,33,28)', 'rgb(74,60,48)');
      for (const shield of SHIELDS) paintShield(props, shield);
      for (const lance of LANCES) paintLance(props, lance);
      for (const { rig, shown } of rigs) {
        rig.advance(seconds);
        const alpha = shown(seconds);
        if (alpha >= 0.999) rig.paint(props, seconds);
        else if (alpha > 0.001) {
          // A half-faded banner is drawn whole on its own layer first, so its overlapping rows never show.
          const own = fade.begin();
          if (!own) continue;
          rig.paint(own, seconds);
          props.save();
          props.globalAlpha = alpha;
          props.drawImage(fade.canvas, 0, 0);
          props.restore();
        }
      }
      layer.shade('rgba(10,13,32,.42)', FIELD_LIGHT, seconds);
      burn(props, flames, dt);
      layer.present(ctx, camera);
    }
    const pivot = { x: px(BANNER.x), y: py(BANNER.y - BANNER.height * BANNER.snapAt) };
    if (!reduced && seconds > OPENING_POLE_CRACKS_AT && !cracked) {
      cracked = true;
      scatter(pivot.x, pivot.y, 20, 26);
    }
    if (!reduced && seconds > OPENING_POLE_LANDS_AT && !caught) {
      caught = true;
      scatter(pivot.x, pivot.y, 30, 34);
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
/** The two braziers before the throne. */
const HALL_FIRES: readonly FireSpot[] = [{ x: 906, y: 380, width: 46, height: 76, base: 0.7 }, { x: 1608, y: 380, width: 50, height: 58, base: 0.7 }];

function sealsPainter(): ShotPainter {
  const fires = paintedFires(HALL_FIRES, 3307);
  const motes = new MoteField(70, (random) => ({ vx: 4 + random() * 8, vy: -6 - random() * 8, size: random() < 0.3 ? 2 : 1, phase: random() * 6, color: [255, 222, 160] }), 'lighter', seeded(5503));
  return (frame) => {
    paintLights(frame, HALL);
    fires(frame);
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
/** The brazier, the three torches on posts and the burning roofs of Bois-Clair, where the painter put them. */
const VILLAGE_FIRES: readonly FireSpot[] = [
  { x: 492, y: 414, width: 42, height: 56, base: 0.7 },
  { x: 894, y: 318, width: 24, height: 38 }, { x: 1018, y: 350, width: 20, height: 32 }, { x: 1368, y: 438, width: 26, height: 34 },
  { x: 1342, y: 150, width: 44, height: 54 }, { x: 1610, y: 94, width: 60, height: 58 }, { x: 1610, y: 150, width: 34, height: 38 },
  { x: 608, y: 134, width: 54, height: 30, base: 0.8 }, { x: 554, y: 162, width: 36, height: 40 }, { x: 630, y: 228, width: 32, height: 40 },
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

/** Under reduced motion they do not march: each one fades in where the march would have left it, and breathes. */
function paintMarch(frame: PaintFrame, sheets: Map<string, { entry: PixelSheetEntry; dark: CanvasImageSource }>, torches: readonly PixelFire[]): void {
  const { ctx, camera, seconds, reduced } = frame;
  const order = MARCH.map((march, index) => {
    const d = reduced ? 1 : clamp01((seconds - march.delay) / 11);
    const shown = reduced ? smooth((seconds - march.delay * 0.45) / 0.9) : 1;
    return { march, index, d, shown, y: ROAD.y + (march.y - ROAD.y) * d ** 1.4 };
  }).filter((entry) => entry.d > 0 && entry.shown > 0).sort((a, b) => a.y - b.y);
  for (const { march, index, d, shown, y } of order) {
    const art = sheets.get(march.unit);
    if (!art) continue;
    const scale = (ROAD.farScale + (ROAD.nearScale - ROAD.farScale) * clamp01((y - ROAD.y) / (ROAD.nearY - ROAD.y))) * camera.scale;
    const x = ROAD.x + (march.x - ROAD.x) * d;
    const step = seconds * 3.8 + index * 1.7;
    const lift = reduced ? 0 : Math.abs(Math.sin(step)) * 2.2 * scale;
    const pose = reduced ? (Math.floor(seconds * 1.4 + index * 0.5) % 2 ? 'idle_b' : 'idle') : Math.sin(step) > 0 ? 'idle' : 'idle_b';
    const sx = camera.x + x * camera.scale, sy = camera.y + y * camera.scale;
    ctx.globalAlpha = shown;
    contactShadow(ctx, sx, sy, 24 * scale, 0.46);
    drawFrame(ctx, art.entry, art.dark, pose, sx, sy - lift, scale, true, reduced ? 0 : Math.sin(step) * 0.035);
    if (march.torch) {
      const tx = sx - 27 * scale, ty = sy - lift - 80 * scale;
      ctx.fillStyle = 'rgb(30,16,10)';
      ctx.fillRect(tx - Math.max(1, scale * 0.8) / 2, ty, Math.max(1, scale * 0.8), 34 * scale);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, tx, ty - 6 * scale, 30 * scale, FIRE, 0.5 * flicker(seconds, index) * shown);
      ctx.globalCompositeOperation = 'source-over';
      torches[index % torches.length]!.draw(ctx, tx, ty + 2 * scale, scale * 2, shown);
    }
    ctx.globalAlpha = 1;
  }
}

function boisClairPainter(sheets: SheetBook): ShotPainter {
  const puff = softPuff([34, 22, 26]);
  const fires = paintedFires(VILLAGE_FIRES, 2203);
  const torches = [0, 1, 2].map((index) => new PixelFire(7, 12, 611 + index * 31, 0.5));
  const sparks = embers(150, 12041), near = embers(26, 3307);
  const random = seeded(808);
  const plumes = Array.from({ length: 34 }, () => ({ x: 860 + random() * 780, y: 120 + random() * 240, size: 90 + random() * 200, speed: 7 + random() * 12, phase: random() }));
  const cast = new Map<string, { entry: PixelSheetEntry; dark: CanvasImageSource }>();
  for (const [id, art] of sheets) cast.set(id, { entry: art.entry, dark: tintedCanvas(art.image, 'rgba(38,14,8,.56)') });
  return (frame) => {
    const { ctx, camera, seconds, width, height, dt } = frame;
    paintLights(frame, VILLAGE);
    for (const plume of plumes) {
      const rise = ((plume.phase + (seconds * plume.speed) / 300) % 1);
      ctx.globalAlpha = 0.16 * Math.sin(rise * Math.PI);
      const size = plume.size * camera.scale * (1 + rise * 0.8);
      ctx.drawImage(puff, camera.x + (plume.x - 90 * rise) * camera.scale - size / 2, camera.y + (plume.y - 180 * rise) * camera.scale - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    fires(frame);
    for (const torch of torches) torch.advance(dt);
    paintMarch(frame, cast, torches);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, width * 0.5, height * 0.2, width * 0.75, [190, 66, 20], 0.05 + 0.03 * flicker(seconds, 13));
    ctx.globalCompositeOperation = 'source-over';
    sparks.paint(frame);
    near.paint(frame, 0.9);
  };
}

/** A hooded walker with a staff, facing left, feet at (0, 0), in image pixels. The legs swing under the robe. */
const WALKER: ReadonlyArray<readonly [number, number, number]> = [
  // x, y, and how much the stride moves the point: the hem follows the legs.
  [1, -50, 0], [-3, -48, 0], [-6, -44, 0], [-6, -40, 0], [-8, -37, 0], [-10, -30, 0], [-10, -26, 0], [-7, -27, 0], [-7, -21, 0],
  [-9, 0, 1], [-2, 0, 0.5], [0, -8, 0], [2, 0, -0.5], [9, 0, -1], [12, -3, -0.4], [10, -14, 0], [9, -30, 0], [8, -37, 0], [7, -44, 0], [5, -48, 0],
];

function paintWalker(ctx: CanvasRenderingContext2D, x: number, y: number, stride: number): void {
  const swing = Math.sin(stride) * 3;
  ctx.save();
  // A little larger than life, so that at this distance they still read as people.
  ctx.translate(x, y);
  ctx.scale(1.15, 1.15);
  ctx.translate(-x, -y);
  const outline = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    WALKER.forEach(([px, py, follows], index) => {
      const at = [x + dx + px + follows * swing, y + dy + py] as const;
      if (index === 0) ctx.moveTo(...at); else ctx.lineTo(...at);
    });
    ctx.closePath();
    ctx.fill();
  };
  // Moonlight from the upper right leaves a thin cold edge.
  outline(1.8, -1.4, 'rgb(72,82,118)');
  outline(0, 0, 'rgb(12,11,22)');
  shaft(ctx, x - 13 + swing * 0.6, y + 1, x - 12 + swing * 0.3, y - 60, 3, 'rgb(14,12,22)', 'rgb(66,74,108)');
  ctx.restore();
}

function shadowPainter(): ShotPainter {
  const layer = new PropLayer();
  const puff = softPuff([120, 142, 184]);
  const fall = ash(110, 2293, [150, 156, 170]);
  const random = seeded(61);
  const bands = Array.from({ length: 11 }, () => ({ x: random() * 1672, y: 470 + random() * 200, width: 380 + random() * 460, speed: 10 + random() * 16, alpha: 0.05 + random() * 0.07 }));
  const marks: readonly Light[] = [
    { x: 1178, y: 205, radius: 46, color: VIOLET, power: 0.6, seed: 1 }, { x: 1570, y: 292, radius: 48, color: VIOLET, power: 0.56, seed: 2 },
    { x: 1190, y: 466, radius: 58, color: VIOLET, power: 0.34, seed: 3 }, { x: 1026, y: 492, radius: 46, color: VIOLET, power: 0.34, seed: 4 },
    { x: 1576, y: 472, radius: 58, color: VIOLET, power: 0.34, seed: 5 },
  ];
  const walkers = [0, 1, 2, 3, 4, 5, 6].map((index) => ({ offset: index * 50 + (index % 2) * 13 }));
  return (frame) => {
    const { ctx, camera, seconds } = frame;
    paintLights(frame, [{ x: 1066, y: 66, radius: 240, color: MOON, power: 0.14, seed: 7 }, { x: 134, y: 395, radius: 110, color: CANDLE, power: 0.26, seed: 8 }]);
    const props = layer.begin();
    if (props) {
      for (const walker of walkers) {
        const x = 880 + walker.offset - seconds * 21;
        // They come out from behind the ruin and go on along the aqueduct, fading at both ends.
        const shown = smooth((884 - x) / 26) * smooth((x - 606) / 26);
        if (shown <= 0) continue;
        const stride = seconds * 4.2 + walker.offset;
        props.globalAlpha = shown;
        paintWalker(props, x, 386 - Math.abs(Math.sin(stride)), stride);
      }
      props.globalAlpha = 1;
      layer.present(ctx, camera);
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
const CAMP_FIRES: readonly FireSpot[] = [{ x: 384, y: 514, width: 82, height: 76, base: 0.66 }];

function companyPainter(): ShotPainter {
  const fires = paintedFires(CAMP_FIRES, 4421);
  const random = seeded(2741);
  const sparks = Array.from({ length: 30 }, () => ({ phase: random(), offset: (random() - 0.5) * 70, speed: 0.16 + random() * 0.2 }));
  return (frame) => {
    const { ctx, camera, seconds } = frame;
    paintLights(frame, CAMP);
    fires(frame);
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
