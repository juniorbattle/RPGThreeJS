import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import runtimeManifest from '../../../public/assets/vfx/runtime/manifest.json';
import { VFX_PRESETS } from './VfxPresets';
import {
  BASIC_LIBRARY_ONLY_SPRITE_SHEET_IDS,
  BASIC_RUNTIME_SPRITE_SHEET_IDS,
  R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  R3E4_PROMOTED_SPRITE_SHEET_IDS,
  SKILL_RUNTIME_SPRITE_SHEET_IDS,
  VFX_SPRITE_SHEETS,
  VFX_SPRITE_SHEET_IDS,
} from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';

const FORBIDDEN_RUNTIME_SEGMENTS = ['/validation/', '/raw/', '/processed/', '/rejected/', '/v1/', '/v2/'];
const RUNTIME_PUBLIC_ROOT = new URL('../../../public/', import.meta.url);
const BASIC_LIBRARY_ONLY_SHEET_IDS = new Set<string>(BASIC_LIBRARY_ONLY_SPRITE_SHEET_IDS);

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
    expect(runtimeManifest.runtime_ready).toBe(true);
    expect(runtimeManifest.version).toBe(3);
    expect(runtimeManifest.entries.map((entry) => entry.id)).toEqual(VFX_SPRITE_SHEET_IDS);

    for (const entry of runtimeManifest.entries) {
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
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/[a-z0-9_f]+\.png$/);
      for (const forbidden of FORBIDDEN_RUNTIME_SEGMENTS) expect(definition.url).not.toContain(forbidden);
      expect(definition.presentation.scaleMultiplier).toBeGreaterThanOrEqual(1);
      expect(definition.presentation.opacityMultiplier).toBeGreaterThan(0);
      expect(definition.presentation.fadeIn).toBeGreaterThanOrEqual(0);
      expect(definition.presentation.fadeOut).toBeGreaterThan(definition.presentation.fadeIn);
      expect(definition.presentation.fadeOut).toBeLessThan(1);
    }
  });

  it('ships every runtime sheet as a public RGBA PNG asset', () => {
    for (const entry of runtimeManifest.entries) {
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

    expect([...usedIds].sort()).toEqual(
      [...VFX_SPRITE_SHEET_IDS]
        .filter((id) => !BASIC_LIBRARY_ONLY_SHEET_IDS.has(id))
        .sort(),
    );
    for (const step of spriteSteps) {
      expect(step.spriteSheet).toBeDefined();
      expect(VFX_SPRITE_SHEET_IDS).toContain(step.spriteSheet);
      if (step.sheetMode === 'projectile') expect(step.targetAnchor).toBeDefined();
    }
  });

  it('keeps root_vines and frost_bind free of magenta and separator bands', () => {
    for (const id of ['skill_void_spiral_implosion_medium', 'skill_ice_pillar_impact_heavy'] as const) {
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

  it('ships R3E-4 promoted sheets as clean 5x5 RGBA assets', () => {
    expect(R3E4_PROMOTED_SPRITE_SHEET_IDS).toHaveLength(6);
    expect(SKILL_RUNTIME_SPRITE_SHEET_IDS).toHaveLength(24);
    for (const id of R3E4_PROMOTED_SPRITE_SHEET_IDS) {
      const definition = VFX_SPRITE_SHEETS[id];
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/[a-z0-9_]+_skill_[a-z0-9_]+_5x5_25f_1280\.png$/);
      expect(definition.rows).toBe(5);
      expect(definition.cols).toBe(5);
      expect(definition.frameCount).toBe(25);

      const { width, height, pixels } = decodeRgbaPng(runtimePath(definition.url));
      expect([width, height]).toEqual([1280, 1280]);
      let opaqueMagenta = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          (pixels[offset + 3] ?? 0) > 8 &&
          (pixels[offset] ?? 0) > 230 &&
          (pixels[offset + 1] ?? 0) < 40 &&
          (pixels[offset + 2] ?? 0) > 230
        ) opaqueMagenta++;
      }
      expect(opaqueMagenta, id + ' opaque magenta pixels').toBe(0);
    }
  });

  it('ships the R3E-1 basic library as public 1280px RGBA sheets without magenta', () => {
    expect(BASIC_RUNTIME_SPRITE_SHEET_IDS).toHaveLength(22);
    for (const id of BASIC_RUNTIME_SPRITE_SHEET_IDS) {
      const definition = VFX_SPRITE_SHEETS[id];
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/white_basic_[a-z0-9_]+_5x5_25f_1280\.png$/);
      expect(definition.url).not.toContain('1254');
      expect(definition.url).not.toContain('/skills/');

      const assetPath = runtimePath(definition.url);
      const header = readPngHeader(assetPath);
      expect([header.width, header.height]).toEqual([1280, 1280]);
      expect(header.colorType).toBe(6);

      const { pixels } = decodeRgbaPng(assetPath);
      let opaqueMagenta = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          (pixels[offset + 3] ?? 0) > 8 &&
          (pixels[offset] ?? 0) > 230 &&
          (pixels[offset + 1] ?? 0) < 40 &&
          (pixels[offset + 2] ?? 0) > 230
        ) opaqueMagenta++;
      }
      expect(opaqueMagenta, id + ' opaque magenta pixels').toBe(0);
    }
  });

    it("ships R3E-2 approved skill impact sheets as clean 5x5 RGBA assets", () => {
    expect(R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS).toHaveLength(17);
    for (const id of R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS) {
      const definition = VFX_SPRITE_SHEETS[id];
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/[a-z0-9_]+_skill_[a-z0-9_]+_5x5_25f_1280\.png$/);
      expect(definition.rows).toBe(5);
      expect(definition.cols).toBe(5);
      expect(definition.frameCount).toBe(25);
      expect(definition.presentation.layer).toBe('impact');

      const { width, height, pixels } = decodeRgbaPng(runtimePath(definition.url));
      expect([width, height]).toEqual([1280, 1280]);
      let opaqueMagenta = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          (pixels[offset + 3] ?? 0) > 8 &&
          (pixels[offset] ?? 0) > 230 &&
          (pixels[offset + 1] ?? 0) < 40 &&
          (pixels[offset + 2] ?? 0) > 230
        ) opaqueMagenta++;
      }
      expect(opaqueMagenta, id + ' opaque magenta pixels').toBe(0);
    }
  });

  it('ships R3E-3 corrected arcane slash as a clean 5x5 RGBA asset', () => {
    expect(R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS).toHaveLength(1);
    expect(SKILL_RUNTIME_SPRITE_SHEET_IDS).toHaveLength(24);
    for (const id of R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS) {
      const definition = VFX_SPRITE_SHEETS[id];
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/[a-z0-9_]+_skill_[a-z0-9_]+_5x5_25f_1280\.png$/);
      expect(definition.rows).toBe(5);
      expect(definition.cols).toBe(5);
      expect(definition.frameCount).toBe(25);
      expect(definition.presentation.layer).toBe('impact');

      const { width, height, pixels } = decodeRgbaPng(runtimePath(definition.url));
      expect([width, height]).toEqual([1280, 1280]);
      let opaqueMagenta = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          (pixels[offset + 3] ?? 0) > 8 &&
          (pixels[offset] ?? 0) > 230 &&
          (pixels[offset + 1] ?? 0) < 40 &&
          (pixels[offset + 2] ?? 0) > 230
        ) opaqueMagenta++;
      }
      expect(opaqueMagenta, id + ' opaque magenta pixels').toBe(0);
    }
  });
});
