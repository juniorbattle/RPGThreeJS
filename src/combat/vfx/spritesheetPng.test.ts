import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

interface PngPixels {
  width: number;
  height: number;
  data: Uint8Array;
}

function readPngPixels(path: string): PngPixels {
  const buf = readFileSync(path);
  if (buf.readUInt8(0) !== 0x89 || buf.readUInt8(1) !== 0x50 || buf.readUInt8(2) !== 0x4e || buf.readUInt8(3) !== 0x47) {
    throw new Error('Not a PNG file');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf.readUInt8(offset + 16);
      colorType = buf.readUInt8(offset + 17);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const raw: Buffer = inflateSync(compressed, {});

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const bpp = (bitDepth * channels) / 8;
  const stride = width * bpp + 1;
  const data = new Uint8Array(width * height * 4);

  let srcPos = 0;
  let prevLine: number[] = new Array(stride).fill(0);

  for (let y = 0; y < height; y++) {
    const filter = raw.readUInt8(srcPos);
    srcPos++;
    const line: number[] = new Array(stride - 1).fill(0);

    for (let x = 0; x < stride - 1; x++) {
      const cur = raw.readUInt8(srcPos + x);
      const left = x >= bpp ? (line[x - bpp] ?? 0) : 0;
      const up = prevLine[x + 1] ?? 0;
      const upLeft = x >= bpp ? (prevLine[x + 1 - bpp] ?? 0) : 0;
      let val: number;
      switch (filter) {
        case 0: val = cur; break;
        case 1: val = (cur + left) & 0xff; break;
        case 2: val = (cur + up) & 0xff; break;
        case 3: val = (cur + Math.floor((left + up) / 2)) & 0xff; break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          val = (cur + pred) & 0xff;
          break;
        }
        default: val = cur;
      }
      line[x] = val;
    }
    srcPos += stride - 1;

    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      const srcIdx = x * bpp;
      if (channels === 4) {
        data[dstIdx] = line[srcIdx] ?? 0;
        data[dstIdx + 1] = line[srcIdx + 1] ?? 0;
        data[dstIdx + 2] = line[srcIdx + 2] ?? 0;
        data[dstIdx + 3] = line[srcIdx + 3] ?? 0;
      } else if (channels === 3) {
        data[dstIdx] = line[srcIdx] ?? 0;
        data[dstIdx + 1] = line[srcIdx + 1] ?? 0;
        data[dstIdx + 2] = line[srcIdx + 2] ?? 0;
        data[dstIdx + 3] = 255;
      } else if (channels === 2) {
        data[dstIdx] = line[srcIdx] ?? 0;
        data[dstIdx + 1] = line[srcIdx] ?? 0;
        data[dstIdx + 2] = line[srcIdx] ?? 0;
        data[dstIdx + 3] = line[srcIdx + 1] ?? 0;
      } else {
        data[dstIdx] = line[srcIdx] ?? 0;
        data[dstIdx + 1] = line[srcIdx] ?? 0;
        data[dstIdx + 2] = line[srcIdx] ?? 0;
        data[dstIdx + 3] = 255;
      }
    }
    prevLine = [0, ...line];
  }

  return { width, height, data };
}

function countMagentaPixels(pixels: PngPixels): number {
  let count = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i]!;
    const g = pixels.data[i + 1]!;
    const b = pixels.data[i + 2]!;
    const a = pixels.data[i + 3]!;
    if (r > 180 && b > 180 && g < 100 && a > 10) {
      count++;
    }
  }
  return count;
}

describe('R2C-C.1 spritesheet PNG validation — CartoonCoffee-only doctrine', () => {
  const legacyRuntimeDir = 'public/assets/vfx/runtime';
  const megapackRuntimeDir = 'public/assets/vfx/megapack-runtime';

  it('R2C-C.1: deleted legacy runtime PNGs no longer exist', () => {
    expect(existsSync(`${legacyRuntimeDir}/blue_skill_arcane_sigil_burst_medium_5x5_25f_1280.png`)).toBe(false);
    expect(existsSync(`${legacyRuntimeDir}/iceblue_skill_ice_pillar_impact_heavy_5x5_25f_1280.png`)).toBe(false);
    expect(existsSync(`${legacyRuntimeDir}/white_basic_arrow_hit_small_5x5_25f_1280.png`)).toBe(false);
  });

  it('R2C-C.1: megapack-runtime PNGs exist and are valid', () => {
    const testFiles = ['r1_2561.png', 'r1_1700.png', 'r1_0480.png'];
    for (const file of testFiles) {
      const path = `${megapackRuntimeDir}/${file}`;
      expect(existsSync(path)).toBe(true);
    }
  });

  it('R2C-C.1: megapack-runtime 2048 PNG has correct dimensions', () => {
    const pixels = readPngPixels(`${megapackRuntimeDir}/r1_2561.png`);
    expect(pixels.width).toBe(2048);
    expect(pixels.height).toBe(2048);
  });

  it('R2C-C.1: megapack-runtime 4096 PNG has correct dimensions', () => {
    const pixels = readPngPixels(`${megapackRuntimeDir}/r1_1700.png`);
    expect(pixels.width).toBe(4096);
    expect(pixels.height).toBe(4096);
  });

  it('R2C-C.1: megapack-runtime PNG has no visible magenta background pixels', () => {
    const pixels = readPngPixels(`${megapackRuntimeDir}/r1_0480.png`);
    const magenta = countMagentaPixels(pixels);
    expect(magenta).toBe(0);
  });

  it('R2C-C.1: megapack-runtime PNG has transparent pixels (alpha channel works)', () => {
    const pixels = readPngPixels(`${megapackRuntimeDir}/r1_0480.png`);
    let transparentCount = 0;
    for (let i = 3; i < pixels.data.length; i += 4) {
      if (pixels.data[i] === 0) transparentCount++;
    }
    expect(transparentCount).toBeGreaterThan(0);
  });
});
