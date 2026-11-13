// OD-2026-11-13-F, T1 (operator choice "Talon ardoise"): turns Talon's blue into a dark slate. Applied on 2026-11-13 to
// public/assets/characters/pixel/archive/non-demo/talon.png and combat-sprites/talon.png. The pose sources in
// poses/talon/*.webp keep the original blue: a rebuild of Talon's combat sheet must run this script on its outputs again.
// Usage: node tools/pixel-sprites/recolor-talon-slate.cjs <png>... Exact PNG round trip (8-bit RGBA, non-interlaced): only
// pixels whose hue is blue (195-265 deg) and saturation > 0.12 change, saturation x0.28 and lightness x0.92. Alpha is kept.
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function decode(buf) {
  let p = 8; const chunks = []; const idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p); const type = buf.toString('latin1', p + 4, p + 8); const data = buf.subarray(p + 8, p + 8 + len); chunks.push({ type, data }); if (type === 'IDAT') idat.push(data); p += 12 + len; }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4), depth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
  if (depth !== 8 || colorType !== 6 || interlace !== 0) throw new Error(`unsupported PNG ${depth}/${colorType}/${interlace}`);
  const raw = zlib.inflateSync(Buffer.concat(idat)); const bpp = 4, stride = width * bpp; const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]; const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y > 0 ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, px, chunks };
}
function encode({ width, height, px, chunks }) {
  const stride = width * 4; const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const out = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];
  let wroteIdat = false;
  for (const c of chunks) {
    if (c.type === 'IDAT') { if (!wroteIdat) { out.push(chunk('IDAT', zlib.deflateSync(raw, { level: 9 }))); wroteIdat = true; } continue; }
    out.push(chunk(c.type, c.data));
  }
  return Buffer.concat(out);
}
const rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); const l = (max + min) / 2; if (max === min) return [0, 0, l];
  const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min); const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };
const hsl2rgb = (h, s, l) => { h = (((h % 360) + 360) % 360) / 360; if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)); };

for (const file of process.argv.slice(2)) {
  const img = decode(fs.readFileSync(file));
  let changed = 0;
  for (let i = 0; i < img.px.length; i += 4) {
    if (!img.px[i + 3]) continue;
    const [h, s, l] = rgb2hsl(img.px[i], img.px[i + 1], img.px[i + 2]);
    if (h >= 195 && h <= 265 && s > 0.12) { const [r, g, b] = hsl2rgb(h, s * 0.28, l * 0.92); img.px[i] = r; img.px[i + 1] = g; img.px[i + 2] = b; changed++; }
  }
  fs.writeFileSync(file, encode(img));
  const check = decode(fs.readFileSync(file));
  console.log(file, `${img.width}x${img.height}`, 'pixels changed', changed, 'round trip', check.px.equals(img.px));
}
