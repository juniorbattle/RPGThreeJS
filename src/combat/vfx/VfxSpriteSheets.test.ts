import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VFX_PRESETS } from './VfxPresets';
import {
  RESERVED_NATIVE_SHEET_IDS,
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

const RESERVED_SHEET_IDS = new Set<string>(RESERVED_NATIVE_SHEET_IDS);

describe('combat VFX sprite sheets', () => {
  const INSET = 0.5 / 1280;
  const CELL = 0.2;
  const REPEAT = CELL - INSET * 2;

  // R2C-C.1: Legacy definitions retired from VFX_SPRITE_SHEETS.
  // Generic engine UV math is tested with synthetic definitions below.
  const legacy5x5: VfxSpriteSheetDefinition = {
    id: 'basic_arrow_hit_small' as VfxSpriteSheetId,
    url: '/test/legacy_5x5.png',
    sheetWidthPx: 1280,
    sheetHeightPx: 1280,
    rows: 5,
    cols: 5,
    frameCount: 25,
    frameDurationMs: 40,
    align: 'center',
    presentation: { scaleMultiplier: 1.14, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' },
  };

  it('maps 5x5 frames row-major from the authored top-left with an explicit flipY invariant', () => {
    expect(VFX_SPRITE_SHEET_FLIP_Y).toBe(true);

    const expected = [
      { frame: 0, column: 0, row: 0, offsetX: INSET, offsetY: 0.8 + INSET },
      { frame: 4, column: 4, row: 0, offsetX: 0.8 + INSET, offsetY: 0.8 + INSET },
      { frame: 5, column: 0, row: 1, offsetX: INSET, offsetY: 0.6 + INSET },
      { frame: 24, column: 4, row: 4, offsetX: 0.8 + INSET, offsetY: INSET },
    ];

    for (const entry of expected) {
      const uv = getVfxSpriteSheetFrameUv(legacy5x5, entry.frame);
      expect(uv.column).toBe(entry.column);
      expect(uv.row).toBe(entry.row);
      expect(uv.repeatX).toBeCloseTo(REPEAT);
      expect(uv.repeatY).toBeCloseTo(REPEAT);
      expect(uv.offsetX).toBeCloseTo(entry.offsetX);
      expect(uv.offsetY).toBeCloseTo(entry.offsetY);
    }

    const texture = new THREE.Texture();
    texture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
    setVfxSpriteSheetFrame(texture, legacy5x5, 24);
    expect(texture.flipY).toBe(true);
    expect(texture.repeat.x).toBeCloseTo(REPEAT);
    expect(texture.repeat.y).toBeCloseTo(REPEAT);
    expect(texture.offset.x).toBeCloseTo(0.8 + INSET);
    expect(texture.offset.y).toBeCloseTo(INSET);
  });

  it('applies a half-texel UV inset so LinearFilter cannot sample neighbouring cells', () => {
    const inset = 0.5 / 1280;

    for (let frame = 0; frame < 25; frame++) {
      const uv = getVfxSpriteSheetFrameUv(legacy5x5, frame);
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

  it('R2C-C.1: legacy sheet IDs are NOT in VFX_SPRITE_SHEETS (retired)', () => {
    expect(LEGACY_SPRITE_SHEET_IDS.length).toBeGreaterThan(0);
    for (const id of LEGACY_SPRITE_SHEET_IDS) {
      expect(VFX_SPRITE_SHEETS[id as VfxSpriteSheetId]).toBeUndefined();
    }
  });

  it('R2C-C.1: VFX_SPRITE_SHEETS contains only native megapack definitions', () => {
    expect(VFX_SPRITE_SHEET_IDS.length).toBe(NATIVE_SPRITE_SHEET_IDS.length);
    for (const id of VFX_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id];
      expect(def).toBeDefined();
      expect(def.assetGeneration).toBe('megapack-native');
      expect(def.sourceCandidateId).toBeDefined();
    }
  });

  it('R2C-C.1: preset spriteSheet IDs may reference retired legacy sheets (now unresolved)', () => {
    const spriteSteps = Object.values(VFX_PRESETS)
      .flatMap((preset) => preset.steps)
      .filter((step) => step.type === 'spriteSheet');
    const usedIds = new Set(spriteSteps.map((step) => step.spriteSheet));

    // Some preset steps reference legacy IDs that are no longer in VFX_SPRITE_SHEETS
    const legacyUsed = [...usedIds].filter((id) => !VFX_SPRITE_SHEET_IDS.includes(id as VfxSpriteSheetId));
    expect(legacyUsed.length).toBeGreaterThan(0);

    // Native IDs used by presets are still valid
    for (const step of spriteSteps) {
      if (VFX_SPRITE_SHEET_IDS.includes(step.spriteSheet as VfxSpriteSheetId)) {
        expect(VFX_SPRITE_SHEETS[step.spriteSheet as VfxSpriteSheetId]).toBeDefined();
      }
    }
  });

  // R2C-C.1: Legacy PNG asset tests removed — files were manually deleted.
  // Native megapack-runtime PNG tests are covered by VfxResourceManager tests.

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
    const uvBelow = getVfxSpriteSheetFrameUv(legacy5x5, -5);
    expect(uvBelow.safeFrame).toBe(0);
    expect(uvBelow.column).toBe(0);
    expect(uvBelow.row).toBe(0);

    const uvAbove = getVfxSpriteSheetFrameUv(legacy5x5, 100);
    expect(uvAbove.safeFrame).toBe(24);
    expect(uvAbove.column).toBe(4);
    expect(uvAbove.row).toBe(4);
  });

  it('preserves flipY invariant across native and synthetic legacy-format definitions', () => {
    expect(VFX_SPRITE_SHEET_FLIP_Y).toBe(true);

    const legacyTexture = new THREE.Texture();
    legacyTexture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
    setVfxSpriteSheetFrame(legacyTexture, legacy5x5, 24);
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
    const legacyInset = 0.5 / 1280;
    const legacyCell = 0.2;
    const legacyUv = getVfxSpriteSheetFrameUv(legacy5x5, 0);
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
    const valid = VFX_SPRITE_SHEETS.megapack_dash_wind_white_v3;
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

  // R2C-C.1: R3E-3 legacy PNG test removed — file was manually deleted.
  // Native sheet validation is covered by the native definition test above.
});
