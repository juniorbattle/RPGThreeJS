import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import * as THREE from 'three';
import runtimeManifest from '../../../public/assets/vfx/runtime/manifest.json';
import { VFX_PRESETS } from './VfxPresets';
import {
  BASIC_LIBRARY_ONLY_SPRITE_SHEET_IDS,
  BASIC_RUNTIME_SPRITE_SHEET_IDS,
  R3E2_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  R3E3_SKILL_RUNTIME_SPRITE_SHEET_IDS,
  R3E4_PROMOTED_SPRITE_SHEET_IDS,
  RESERVED_NATIVE_SHEET_IDS,
  SKILL_RUNTIME_SPRITE_SHEET_IDS,
  VFX_SPRITE_SHEETS,
  VFX_SPRITE_SHEET_FLIP_Y,
  VFX_SPRITE_SHEET_IDS,
  LEGACY_SPRITE_SHEET_IDS,
  NATIVE_SPRITE_SHEET_IDS,
  getVfxSpriteSheetFrameUv,
  setVfxSpriteSheetFrame,
  validateVfxSpriteSheetDefinition,
} from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';
import type { VfxSpriteSheetDefinition } from './VfxSpriteSheets';

const FORBIDDEN_RUNTIME_SEGMENTS = ['/validation/', '/raw/', '/processed/', '/rejected/', '/v1/', '/v2/'];
const RUNTIME_PUBLIC_ROOT = new URL('../../../public/', import.meta.url);
const BASIC_LIBRARY_ONLY_SHEET_IDS = new Set<string>(BASIC_LIBRARY_ONLY_SPRITE_SHEET_IDS);
const RESERVED_SHEET_IDS = new Set<string>(RESERVED_NATIVE_SHEET_IDS);

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
  const INSET = 0.5 / 1280;
  const CELL = 0.2;
  const REPEAT = CELL - INSET * 2;

  it('maps 5x5 frames row-major from the authored top-left with an explicit flipY invariant', () => {
    const definition = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    expect(VFX_SPRITE_SHEET_FLIP_Y).toBe(true);

    const expected = [
      { frame: 0, column: 0, row: 0, offsetX: INSET, offsetY: 0.8 + INSET },
      { frame: 4, column: 4, row: 0, offsetX: 0.8 + INSET, offsetY: 0.8 + INSET },
      { frame: 5, column: 0, row: 1, offsetX: INSET, offsetY: 0.6 + INSET },
      { frame: 24, column: 4, row: 4, offsetX: 0.8 + INSET, offsetY: INSET },
    ];

    for (const entry of expected) {
      const uv = getVfxSpriteSheetFrameUv(definition, entry.frame);
      expect(uv.column).toBe(entry.column);
      expect(uv.row).toBe(entry.row);
      expect(uv.repeatX).toBeCloseTo(REPEAT);
      expect(uv.repeatY).toBeCloseTo(REPEAT);
      expect(uv.offsetX).toBeCloseTo(entry.offsetX);
      expect(uv.offsetY).toBeCloseTo(entry.offsetY);
    }

    const texture = new THREE.Texture();
    texture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
    setVfxSpriteSheetFrame(texture, definition, 24);
    expect(texture.flipY).toBe(true);
    expect(texture.repeat.x).toBeCloseTo(REPEAT);
    expect(texture.repeat.y).toBeCloseTo(REPEAT);
    expect(texture.offset.x).toBeCloseTo(0.8 + INSET);
    expect(texture.offset.y).toBeCloseTo(INSET);
  });

  it('applies a half-texel UV inset so LinearFilter cannot sample neighbouring cells', () => {
    const definition = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    const inset = 0.5 / 1280;

    for (let frame = 0; frame < 25; frame++) {
      const uv = getVfxSpriteSheetFrameUv(definition, frame);
      const col = frame % 5;
      const row = Math.floor(frame / 5);

      expect(uv.repeatX).toBeLessThan(CELL);
      expect(uv.repeatY).toBeLessThan(CELL);
      expect(uv.repeatX).toBeCloseTo(CELL - inset * 2);
      expect(uv.repeatY).toBeCloseTo(CELL - inset * 2);

      expect(uv.offsetX).toBeGreaterThan(col * CELL);
      expect(uv.offsetX).toBeLessThan((col + 1) * CELL);
      expect(uv.offsetY).toBeGreaterThan(1 - (row + 1) * CELL);
      expect(uv.offsetY).toBeLessThan(1 - row * CELL);

      const uMin = uv.offsetX;
      const uMax = uv.offsetX + uv.repeatX;
      const vMin = uv.offsetY;
      const vMax = uv.offsetY + uv.repeatY;
      expect(uMin).toBeGreaterThan(col * CELL - 1e-9);
      expect(uMax).toBeLessThan((col + 1) * CELL + 1e-9);
      expect(vMin).toBeGreaterThan(1 - (row + 1) * CELL - 1e-9);
      expect(vMax).toBeLessThan(1 - row * CELL + 1e-9);
    }
  });

  it('keeps the approved manifest and typed runtime registry synchronized', () => {
    expect(runtimeManifest.runtime_ready).toBe(true);
    expect(runtimeManifest.version).toBe(3);
    expect(runtimeManifest.entries.map((entry) => entry.id)).toEqual(LEGACY_SPRITE_SHEET_IDS);

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
        .filter((id) => !RESERVED_SHEET_IDS.has(id))
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

  it('computes correct UV for native 2048 / 4x4 / 16 frames', () => {
    const native4x4: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/native_4x4.png',
      sheetWidthPx: 2048,
      sheetHeightPx: 2048,
      rows: 4,
      cols: 4,
      frameCount: 16,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    const inset = 0.5 / 2048;
    const cell = 0.25;

    const uv0 = getVfxSpriteSheetFrameUv(native4x4, 0);
    expect(uv0.safeFrame).toBe(0);
    expect(uv0.column).toBe(0);
    expect(uv0.row).toBe(0);
    expect(uv0.repeatX).toBeCloseTo(cell - inset * 2);
    expect(uv0.repeatY).toBeCloseTo(cell - inset * 2);
    expect(uv0.offsetX).toBeCloseTo(inset);
    expect(uv0.offsetY).toBeCloseTo(1 - cell + inset);

    const uv15 = getVfxSpriteSheetFrameUv(native4x4, 15);
    expect(uv15.safeFrame).toBe(15);
    expect(uv15.column).toBe(3);
    expect(uv15.row).toBe(3);
    expect(uv15.offsetX).toBeCloseTo(3 * cell + inset);
    expect(uv15.offsetY).toBeCloseTo(1 - 4 * cell + inset);

    const uv3 = getVfxSpriteSheetFrameUv(native4x4, 3);
    expect(uv3.column).toBe(3);
    expect(uv3.row).toBe(0);
    const uv4 = getVfxSpriteSheetFrameUv(native4x4, 4);
    expect(uv4.column).toBe(0);
    expect(uv4.row).toBe(1);
  });

  it('computes correct UV for native 4096 / 8x8 / 64 frames', () => {
    const native8x8: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/native_8x8.png',
      sheetWidthPx: 4096,
      sheetHeightPx: 4096,
      rows: 8,
      cols: 8,
      frameCount: 64,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    const inset = 0.5 / 4096;
    const cell = 0.125;

    const uv0 = getVfxSpriteSheetFrameUv(native8x8, 0);
    expect(uv0.safeFrame).toBe(0);
    expect(uv0.column).toBe(0);
    expect(uv0.row).toBe(0);
    expect(uv0.repeatX).toBeCloseTo(cell - inset * 2);
    expect(uv0.repeatY).toBeCloseTo(cell - inset * 2);
    expect(uv0.offsetX).toBeCloseTo(inset);
    expect(uv0.offsetY).toBeCloseTo(1 - cell + inset);

    const uv63 = getVfxSpriteSheetFrameUv(native8x8, 63);
    expect(uv63.safeFrame).toBe(63);
    expect(uv63.column).toBe(7);
    expect(uv63.row).toBe(7);
    expect(uv63.offsetX).toBeCloseTo(7 * cell + inset);
    expect(uv63.offsetY).toBeCloseTo(1 - 8 * cell + inset);

    const uv7 = getVfxSpriteSheetFrameUv(native8x8, 7);
    expect(uv7.column).toBe(7);
    expect(uv7.row).toBe(0);
    const uv8 = getVfxSpriteSheetFrameUv(native8x8, 8);
    expect(uv8.column).toBe(0);
    expect(uv8.row).toBe(1);
  });

  it('clamps invalid frame indices to the valid range', () => {
    const definition = VFX_SPRITE_SHEETS.basic_arrow_hit_small;

    const uvBelow = getVfxSpriteSheetFrameUv(definition, -5);
    expect(uvBelow.safeFrame).toBe(0);
    expect(uvBelow.column).toBe(0);
    expect(uvBelow.row).toBe(0);

    const uvAbove = getVfxSpriteSheetFrameUv(definition, 100);
    expect(uvAbove.safeFrame).toBe(24);
    expect(uvAbove.column).toBe(4);
    expect(uvAbove.row).toBe(4);
  });

  it('preserves flipY invariant across native and legacy definitions', () => {
    expect(VFX_SPRITE_SHEET_FLIP_Y).toBe(true);

    const legacyDef = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    const legacyTexture = new THREE.Texture();
    legacyTexture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
    setVfxSpriteSheetFrame(legacyTexture, legacyDef, 24);
    expect(legacyTexture.flipY).toBe(true);

    const native4x4: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/native_4x4.png',
      sheetWidthPx: 2048,
      sheetHeightPx: 2048,
      rows: 4,
      cols: 4,
      frameCount: 16,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    const nativeTexture = new THREE.Texture();
    nativeTexture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
    setVfxSpriteSheetFrame(nativeTexture, native4x4, 15);
    expect(nativeTexture.flipY).toBe(true);
  });

  it('applies per-definition half-texel insets scaled to sheet dimensions', () => {
    const legacyDef = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    const legacyInset = 0.5 / 1280;
    const legacyCell = 0.2;
    const legacyUv = getVfxSpriteSheetFrameUv(legacyDef, 0);
    expect(legacyUv.repeatX).toBeCloseTo(legacyCell - legacyInset * 2);
    expect(legacyUv.repeatY).toBeCloseTo(legacyCell - legacyInset * 2);

    const native4x4: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/4x4.png',
      sheetWidthPx: 2048,
      sheetHeightPx: 2048,
      rows: 4,
      cols: 4,
      frameCount: 16,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    const native4x4Inset = 0.5 / 2048;
    const native4x4Cell = 0.25;
    const native4x4Uv = getVfxSpriteSheetFrameUv(native4x4, 0);
    expect(native4x4Uv.repeatX).toBeCloseTo(native4x4Cell - native4x4Inset * 2);
    expect(native4x4Uv.repeatY).toBeCloseTo(native4x4Cell - native4x4Inset * 2);

    const native8x8: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/8x8.png',
      sheetWidthPx: 4096,
      sheetHeightPx: 4096,
      rows: 8,
      cols: 8,
      frameCount: 64,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    const native8x8Inset = 0.5 / 4096;
    const native8x8Cell = 0.125;
    const native8x8Uv = getVfxSpriteSheetFrameUv(native8x8, 0);
    expect(native8x8Uv.repeatX).toBeCloseTo(native8x8Cell - native8x8Inset * 2);
    expect(native8x8Uv.repeatY).toBeCloseTo(native8x8Cell - native8x8Inset * 2);
  });

  it('validates sprite sheet definitions correctly', () => {
    const valid = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    expect(validateVfxSpriteSheetDefinition(valid)).toEqual([]);

    const native4x4: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/4x4.png',
      sheetWidthPx: 2048,
      sheetHeightPx: 2048,
      rows: 4,
      cols: 4,
      frameCount: 16,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    expect(validateVfxSpriteSheetDefinition(native4x4)).toEqual([]);

    const native8x8: VfxSpriteSheetDefinition = {
      id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
      url: '/test/8x8.png',
      sheetWidthPx: 4096,
      sheetHeightPx: 4096,
      rows: 8,
      cols: 8,
      frameCount: 64,
      frameDurationMs: 40,
      align: 'center',
      presentation: { scaleMultiplier: 1, opacityMultiplier: 1, fadeIn: 0, fadeOut: 0.8, layer: 'impact', blending: 'additive' },
    };
    expect(validateVfxSpriteSheetDefinition(native8x8)).toEqual([]);

    const invalid: VfxSpriteSheetDefinition = {
      ...valid,
      sheetWidthPx: -1,
      rows: 0,
      frameCount: 100,
    };
    const errors = validateVfxSpriteSheetDefinition(invalid);
    expect(errors).toContain('sheetWidthPx must be > 0');
    expect(errors).toContain('rows must be > 0');
    expect(errors.some(e => e.includes('frameCount'))).toBe(true);
  });

  it('registers native megapack sheet definitions with correct metadata', () => {
    expect(NATIVE_SPRITE_SHEET_IDS).toHaveLength(15);
    for (const id of NATIVE_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id];
      expect(def).toBeDefined();
      expect(def.assetGeneration).toBe('megapack-native');
      expect(def.sourceCandidateId).toBeDefined();
      expect(def.sourceFilename).toBeDefined();
      expect(def.nativeCellWidthPx).toBe(def.sheetWidthPx / def.cols);
      expect(def.nativeCellHeightPx).toBe(def.sheetHeightPx / def.rows);
      expect(validateVfxSpriteSheetDefinition(def)).toEqual([]);
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
