import * as THREE from 'three';

/**
 * Small deterministic pixel-art toolkit for the procedural combat arenas.
 * Every texture is painted texel by texel on a tiny canvas and shown with
 * nearest filtering, so the decor shares the pixel language of the sprites.
 */
export type Rng = () => number;
export type Rgb = readonly [number, number, number];

export function seeded(seed: number): Rng {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rgb(hex: string | undefined): Rgb {
  const v = parseInt((hex ?? '#000000').replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Picks a tone of a dark→light ramp; `t` is clamped to [0, 1]. */
export function ramp(tones: readonly string[], t: number): Rgb {
  const i = Math.max(0, Math.min(tones.length - 1, Math.round(t * (tones.length - 1))));
  return rgb(tones[i]);
}

/** Ordered 4×4 Bayer threshold, used for crisp two-tone dithering. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(x: number, y: number): number {
  return ((BAYER[(y & 3) * 4 + (x & 3)] ?? 0) + 0.5) / 16;
}

/** Tileable value noise on an integer lattice (period = `period`). */
export function makeNoise(rng: Rng, period: number) {
  const grid = Array.from({ length: period * period }, () => rng());
  const at = (x: number, y: number) => grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)] ?? 0;
  return (x: number, y: number): number => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

export class PixelCanvas {
  readonly data: Uint8ClampedArray;

  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  set(x: number, y: number, c: Rgb, a = 255): void {
    x = Math.round(x); y = Math.round(y);
    if (!this.inside(x, y)) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a;
  }

  /** Wrapping set, for seamless repeating textures. */
  setWrap(x: number, y: number, c: Rgb, a = 255): void {
    const w = this.width, h = this.height;
    this.set(((Math.round(x) % w) + w) % w, ((Math.round(y) % h) + h) % h, c, a);
  }

  get(x: number, y: number): [number, number, number, number] {
    x = Math.round(x); y = Math.round(y);
    if (!this.inside(x, y)) return [0, 0, 0, 0];
    const i = (y * this.width + x) * 4;
    return [this.data[i] ?? 0, this.data[i + 1] ?? 0, this.data[i + 2] ?? 0, this.data[i + 3] ?? 0];
  }

  alpha(x: number, y: number): number {
    return this.get(x, y)[3];
  }

  fill(c: Rgb, a = 255): void {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) this.set(x, y, c, a);
  }

  rect(x: number, y: number, w: number, h: number, c: Rgb, a = 255): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a);
  }

  /** Darkens (f < 1) or lightens (f > 1) an existing opaque texel. */
  tint(x: number, y: number, f: number): void {
    const [r, g, b, a] = this.get(x, y);
    if (!a) return;
    this.set(x, y, [Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f)], a);
  }

  /** One-texel ink outline around every opaque region. */
  outline(ink: Rgb): void {
    const solid = new Uint8Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) solid[y * this.width + x] = this.alpha(x, y) > 127 ? 1 : 0;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.width || y >= this.height ? 0 : solid[y * this.width + x]);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (solid[y * this.width + x]) continue;
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.set(x, y, ink);
    }
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.putImageData(new ImageData(new Uint8ClampedArray(this.data), this.width, this.height), 0, 0);
    return canvas;
  }

  toTexture(options: { repeat?: boolean; linear?: boolean } = {}): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(this.toCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = options.linear ? THREE.LinearFilter : THREE.NearestFilter;
    texture.minFilter = options.linear ? THREE.LinearFilter : THREE.NearestMipmapLinearFilter;
    texture.generateMipmaps = !options.linear;
    if (options.repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }
}
