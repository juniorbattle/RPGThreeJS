import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import runtimeV1Manifest from '../../../public/assets/vfx/runtime/v1/manifest.json';
import runtimeV2Manifest from '../../../public/assets/vfx/runtime/v2/manifest.json';
import { VFX_PRESETS } from './VfxPresets';
import { VFX_SPRITE_SHEETS, VFX_SPRITE_SHEET_IDS } from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';

const FORBIDDEN_RUNTIME_SEGMENTS = ['/validation/', '/raw/', '/processed/', '/rejected/'];
const V1_SHEET_IDS = [
  'slash_arc', 'small_impact', 'thrust_line', 'projectile_shot', 'magic_bolt', 'fire_explosion',
  'heal_touch', 'buff_pulse', 'barrier_shell', 'teleport_burst', 'shockwave_ring', 'leap_impact',
] as const;
const V2_SHEET_IDS = [
  'artillery_barrage', 'dragon_breath', 'heavy_execution', 'meteor_fall', 'titan_slam',
  'curse_mark',
  'regen_aura', 'revive_pillar', 'holy_aura', 'boost_aura', 'smoke_burst',
  'cone_blast', 'explosion_large', 'apocalypse_field',
  'shadow_lightning_bolt', 'root_vines', 'frost_bind',
] as const;
const RUNTIME_PUBLIC_ROOT = new URL('../../../public/', import.meta.url);

function runtimePath(url: string) {
  return new URL(`.${url}`, RUNTIME_PUBLIC_ROOT);
}

function readPngHeader(path: URL) {
  const buffer = readFileSync(path);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

function decodeRgbaPng(path: URL) {
  const png = readFileSync(path);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === 'IEND') break;
  }
  const encoded = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = encoded[y * (stride + 1)] ?? 0;
    const source = y * (stride + 1) + 1;
    const target = y * stride;
    for (let x = 0; x < stride; x++) {
      const raw = encoded[source + x] ?? 0;
      const left = x >= 4 ? (pixels[target + x - 4] ?? 0) : 0;
      const up = y > 0 ? (pixels[target + x - stride] ?? 0) : 0;
      const upperLeft = y > 0 && x >= 4 ? (pixels[target + x - stride - 4] ?? 0) : 0;
      const predictor: number =
        filter === 1 ? left :
        filter === 2 ? up :
        filter === 3 ? Math.floor((left + up) / 2) :
        filter === 4 ? paeth(left, up, upperLeft) : 0;
      pixels[target + x] = (raw + predictor) & 0xff;
    }
  }
  return { width, height, pixels };
}

describe('combat VFX sprite sheets', () => {
  it('keeps the approved manifest and typed runtime registry synchronized', () => {
    expect(runtimeV1Manifest.runtime_ready).toBe(true);
    expect(runtimeV1Manifest.version).toBe(1);
    expect(runtimeV1Manifest.entries.map((entry) => entry.id)).toEqual(V1_SHEET_IDS);
    expect(runtimeV2Manifest.runtime_ready).toBe(true);
    expect(runtimeV2Manifest.version).toBe(2);
    expect(runtimeV2Manifest.entries.map((entry) => entry.id)).toEqual(V2_SHEET_IDS);

    const runtimeEntries = [...runtimeV1Manifest.entries, ...runtimeV2Manifest.entries];
    expect(runtimeEntries.map((entry) => entry.id)).toEqual(VFX_SPRITE_SHEET_IDS);

    for (const entry of runtimeEntries) {
      const definition = VFX_SPRITE_SHEETS[entry.id as VfxSpriteSheetId];
      expect(definition).toBeDefined();
      expect(definition).toMatchObject({
        id: entry.id,
        url: entry.url,
        rows: entry.rows,
        cols: entry.cols,
        frameCount: entry.frameCount,
        frameDurationMs: entry.frameDurationMs,
        align: entry.align,
        presentation: entry.presentation,
      });
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/v[12]\/[a-z0-9_f]+\.png$/);
      for (const forbidden of FORBIDDEN_RUNTIME_SEGMENTS) expect(definition.url).not.toContain(forbidden);
      expect(definition.presentation.scaleMultiplier).toBeGreaterThanOrEqual(1);
      expect(definition.presentation.opacityMultiplier).toBeGreaterThan(0);
      expect(definition.presentation.fadeIn).toBeGreaterThanOrEqual(0);
      expect(definition.presentation.fadeOut).toBeGreaterThan(definition.presentation.fadeIn);
      expect(definition.presentation.fadeOut).toBeLessThan(1);
    }
  });

  it('ships every runtime sheet as a public RGBA PNG asset', () => {
    for (const entry of [...runtimeV1Manifest.entries, ...runtimeV2Manifest.entries]) {
      const assetPath = runtimePath(entry.url);
      expect(existsSync(assetPath), entry.url).toBe(true);
      const header = readPngHeader(assetPath);
      expect(header.width).toBe(entry.cols * 256);
      expect(header.height).toBe(entry.rows * 256);
      expect(header.bitDepth).toBe(8);
      expect(header.colorType).toBe(6);
    }
  });

  it('uses every approved sheet from a valid presentation preset', () => {
    const spriteSteps = Object.values(VFX_PRESETS)
      .flatMap((preset) => preset.steps)
      .filter((step) => step.type === 'spriteSheet');
    const usedIds = new Set(spriteSteps.map((step) => step.spriteSheet));

    expect([...usedIds].sort()).toEqual([...VFX_SPRITE_SHEET_IDS].sort());
    for (const step of spriteSteps) {
      expect(step.spriteSheet).toBeDefined();
      expect(VFX_SPRITE_SHEET_IDS).toContain(step.spriteSheet);
      if (step.sheetMode === 'projectile') expect(step.targetAnchor).toBeDefined();
    }
  });

  it('keeps root_vines and frost_bind free of magenta and separator bands', () => {
    for (const id of ['root_vines', 'frost_bind'] as const) {
      const definition = VFX_SPRITE_SHEETS[id];
      const { width, height, pixels } = decodeRgbaPng(runtimePath(definition.url));
      let opaqueMagenta = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          (pixels[offset + 3] ?? 0) > 8 &&
          (pixels[offset] ?? 0) > 230 &&
          (pixels[offset + 1] ?? 0) < 40 &&
          (pixels[offset + 2] ?? 0) > 230
        ) opaqueMagenta++;
      }
      expect(opaqueMagenta, `${id} opaque magenta pixels`).toBe(0);

      for (const boundary of [256, 512, 768, 1024]) {
        for (let delta = -2; delta <= 1; delta++) {
          const x = boundary + delta;
          const y = boundary + delta;
          let columnOpaque = 0;
          let rowOpaque = 0;
          for (let index = 0; index < height; index++) {
            if ((pixels[(index * width + x) * 4 + 3] ?? 0) > 8) columnOpaque++;
          }
          for (let index = 0; index < width; index++) {
            if ((pixels[(y * width + index) * 4 + 3] ?? 0) > 8) rowOpaque++;
          }
          expect(columnOpaque, `${id} separator column ${x}`).toBeLessThan(height / 2);
          expect(rowOpaque, `${id} separator row ${y}`).toBeLessThan(width / 2);
        }
      }
    }
  });
});
