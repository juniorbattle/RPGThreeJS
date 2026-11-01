// Small pixel-effect toolkit, written for this project with no dependency.
// An effect paints heat into a Field; a ramp then turns the heat into a few
// flat colours with ordered dithering, so every frame stays true pixel art.
import { deflateSync } from 'node:zlib';

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (x, y, seed) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t) => t * t * (3 - 2 * t);

/** Smooth value noise in [0, 1]. */
export function noise(x, y, seed = 1) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const top = hash(ix, iy, seed) * (1 - fx) + hash(ix + 1, iy, seed) * fx;
  const bottom = hash(ix, iy + 1, seed) * (1 - fx) + hash(ix + 1, iy + 1, seed) * fx;
  return top * (1 - fy) + bottom * fy;
}

export function fbm(x, y, seed = 1) {
  return noise(x, y, seed) * 0.55 + noise(x * 2.1, y * 2.1, seed + 7) * 0.3 + noise(x * 4.3, y * 4.3, seed + 13) * 0.15;
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
/** 0 outside [from, to], rising to 1 at the end of the span. */
export const span = (t, from, to) => clamp01((t - from) / (to - from));

export class Field {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Float32Array(width * height);
  }

  /** Keeps the hottest value, so overlapping shapes never add up to a blown-out blob. */
  hot(x, y, value) {
    const px = Math.round(x), py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const i = py * this.width + px;
    if (value > this.data[i]) this.data[i] = value;
  }

  disc(cx, cy, radius, value, falloff = 0, squash = 1) {
    const r = Math.ceil(radius);
    const ry = Math.ceil(radius * squash);
    for (let y = -ry; y <= ry; y++) {
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y / squash) / Math.max(radius, 0.001);
        if (d <= 1) this.hot(cx + x, cy + y, value * (1 - falloff * d * d));
      }
    }
  }

  /** Elliptical shock ring lying on the ground. */
  ring(cx, cy, radius, thickness, value, squash = 0.3) {
    const outer = radius + thickness;
    for (let y = -Math.ceil(outer * squash); y <= Math.ceil(outer * squash); y++) {
      for (let x = -Math.ceil(outer); x <= Math.ceil(outer); x++) {
        const d = Math.hypot(x, y / squash);
        if (d < radius - thickness || d > outer) continue;
        this.hot(cx + x, cy + y, value * (1 - Math.abs(d - radius) / thickness));
      }
    }
  }

  line(x0, y0, x1, y1, width, value, taper = false) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      const w = taper ? width * (1 - k) : width;
      this.disc(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, Math.max(0.5, w), value);
    }
  }

  /** Cools the field near the frame borders, so nothing is ever cut by the frame. */
  edges(margin) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        if (this.data[i] <= 0) continue;
        const near = Math.min(x, y, this.width - 1 - x);
        if (near < margin) this.data[i] -= 1 - near / margin;
      }
    }
  }

  /** Multiplies the field by noise so an effect frays away instead of fading. */
  fray(amount, scale, seed, drift = 0) {
    if (amount <= 0) return;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        if (this.data[i] > 0) this.data[i] = Math.max(0, this.data[i] - amount * fbm(x * scale, y * scale + drift, seed) * 1.6);
      }
    }
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.rgba = new Uint8Array(width * height * 4);
  }

  /** Paints a field through a dark-to-hot ramp; heat under `cut` stays transparent. */
  paint(field, ramp, { cut = 0.08, dither = 0.09 } = {}) {
    const colours = ramp.map(hexToRgb);
    for (let y = 0; y < field.height; y++) {
      for (let x = 0; x < field.width; x++) {
        const heat = field.data[y * field.width + x];
        if (heat <= 0) continue;
        const offset = (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.47) * dither * 2;
        const h = heat + offset;
        if (h < cut) continue;
        const band = Math.min(colours.length - 1, Math.floor(clamp01((h - cut) / (1 - cut)) * colours.length));
        const [r, g, b] = colours[band];
        const i = (y * this.width + x) * 4;
        this.rgba[i] = r; this.rgba[i + 1] = g; this.rgba[i + 2] = b; this.rgba[i + 3] = 255;
      }
    }
  }

  plot(x, y, hex) {
    const px = Math.round(x), py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const [r, g, b] = hexToRgb(hex);
    const i = (py * this.width + px) * 4;
    this.rgba[i] = r; this.rgba[i + 1] = g; this.rgba[i + 2] = b; this.rgba[i + 3] = 255;
  }

  /** Copies this frame into a sheet, skipping transparent pixels. */
  blit(target, ox, oy) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const from = (y * this.width + x) * 4;
        if (!this.rgba[from + 3]) continue;
        const to = ((y + oy) * target.width + x + ox) * 4;
        for (let c = 0; c < 4; c++) target.rgba[to + c] = this.rgba[from + c];
      }
    }
  }
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (bytes) => {
  let c = -1;
  for (const byte of bytes) c = CRC[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

export function encodePng(canvas) {
  const { width, height, rgba } = canvas;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(rows, row + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
