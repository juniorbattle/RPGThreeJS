import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import runtimeManifest from '../../../docs/reports/vfx-megapack-r2-selected-runtime-assets.json';
import {
  VFX_SPRITE_SHEETS,
  LEGACY_SPRITE_SHEET_IDS,
  NATIVE_SPRITE_SHEET_IDS,
  RESERVED_NATIVE_SHEET_IDS,
  getVfxSpriteSheetFrameUv,
  resolveVfxSpriteSheetPresentation,
  validateVfxSpriteSheetDefinition,
} from './VfxSpriteSheets';
import { validateRuntimeRegistryConsistency } from './vfxRuntimeRegistry';
import type { RuntimeManifest } from './vfxRuntimeRegistry';
import { configureVfxSpriteSheetPivot } from './VfxSystem';
import type { VfxStep, VfxSpritePresentationOverride, NativeVfxSpriteSheetId, LegacyVfxSpriteSheetId } from './VfxTypes';

const manifest = runtimeManifest as unknown as RuntimeManifest;

function makeStep(overrides?: Partial<VfxStep> & { spritePresentation?: VfxSpritePresentationOverride }): VfxStep {
  return {
    type: 'spriteSheet',
    anchor: 'target',
    startTime: 0,
    duration: 0.6,
    spriteSheet: 'megapack_fire_slash_spin',
    ...overrides,
  };
}

describe('VFX runtime registry hardening — presentation overrides', () => {
  const nativeDef = VFX_SPRITE_SHEETS.megapack_fire_slash_spin;
  const legacyDef = VFX_SPRITE_SHEETS.basic_arrow_hit_small;

  it('returns definition defaults when no override is present', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep());
    expect(resolved.align).toBe(nativeDef.align);
    expect(resolved.layer).toBe(nativeDef.presentation.layer);
    expect(resolved.blending).toBe(nativeDef.presentation.blending);
    expect(resolved.scaleMultiplier).toBe(nativeDef.presentation.scaleMultiplier);
    expect(resolved.opacityMultiplier).toBe(nativeDef.presentation.opacityMultiplier);
    expect(resolved.fadeIn).toBe(nativeDef.presentation.fadeIn);
    expect(resolved.fadeOut).toBe(nativeDef.presentation.fadeOut);
  });

  it('returns definition defaults when step is undefined', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef);
    expect(resolved.align).toBe(nativeDef.align);
    expect(resolved.layer).toBe(nativeDef.presentation.layer);
    expect(resolved.blending).toBe(nativeDef.presentation.blending);
    expect(resolved.scaleMultiplier).toBe(nativeDef.presentation.scaleMultiplier);
    expect(resolved.opacityMultiplier).toBe(nativeDef.presentation.opacityMultiplier);
    expect(resolved.fadeIn).toBe(nativeDef.presentation.fadeIn);
    expect(resolved.fadeOut).toBe(nativeDef.presentation.fadeOut);
  });

  it('overrides align from center to bottom', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { align: 'bottom' },
    }));
    expect(resolved.align).toBe('bottom');
    expect(resolved.layer).toBe(nativeDef.presentation.layer);
    expect(resolved.blending).toBe(nativeDef.presentation.blending);
  });

  it('overrides align from bottom to center', () => {
    const bottomDef = VFX_SPRITE_SHEETS.megapack_shield_on;
    expect(bottomDef.align).toBe('bottom');
    const resolved = resolveVfxSpriteSheetPresentation(bottomDef, makeStep({
      spriteSheet: 'megapack_shield_on',
      spritePresentation: { align: 'center' },
    }));
    expect(resolved.align).toBe('center');
  });

  it('overrides layer from impact to ground', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { layer: 'ground' },
    }));
    expect(resolved.layer).toBe('ground');
    expect(resolved.align).toBe(nativeDef.align);
  });

  it('overrides layer from ground to impact', () => {
    const groundDef = VFX_SPRITE_SHEETS.megapack_impact_darkness_lv3;
    expect(groundDef.presentation.layer).toBe('ground');
    const resolved = resolveVfxSpriteSheetPresentation(groundDef, makeStep({
      spriteSheet: 'megapack_impact_darkness_lv3',
      spritePresentation: { layer: 'impact' },
    }));
    expect(resolved.layer).toBe('impact');
  });

  it('overrides blending from additive to normal', () => {
    expect(nativeDef.presentation.blending).toBe('additive');
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { blending: 'normal' },
    }));
    expect(resolved.blending).toBe('normal');
  });

  it('overrides blending from normal to additive', () => {
    const normalDef = VFX_SPRITE_SHEETS.megapack_angry_smoke_burst;
    expect(normalDef.presentation.blending).toBe('normal');
    const resolved = resolveVfxSpriteSheetPresentation(normalDef, makeStep({
      spriteSheet: 'megapack_angry_smoke_burst',
      spritePresentation: { blending: 'additive' },
    }));
    expect(resolved.blending).toBe('additive');
  });

  it('overrides scaleMultiplier', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { scaleMultiplier: 2.5 },
    }));
    expect(resolved.scaleMultiplier).toBe(2.5);
    expect(resolved.opacityMultiplier).toBe(nativeDef.presentation.opacityMultiplier);
  });

  it('overrides opacityMultiplier', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { opacityMultiplier: 0.5 },
    }));
    expect(resolved.opacityMultiplier).toBe(0.5);
    expect(resolved.scaleMultiplier).toBe(nativeDef.presentation.scaleMultiplier);
  });

  it('overrides fadeIn', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { fadeIn: 0.15 },
    }));
    expect(resolved.fadeIn).toBe(0.15);
    expect(resolved.fadeOut).toBe(nativeDef.presentation.fadeOut);
  });

  it('overrides fadeOut', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { fadeOut: 0.5 },
    }));
    expect(resolved.fadeOut).toBe(0.5);
    expect(resolved.fadeIn).toBe(nativeDef.presentation.fadeIn);
  });

  it('overrides all fields simultaneously', () => {
    const full: VfxSpritePresentationOverride = {
      align: 'bottom',
      layer: 'ground',
      blending: 'normal',
      scaleMultiplier: 3.0,
      opacityMultiplier: 0.7,
      fadeIn: 0.1,
      fadeOut: 0.6,
    };
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({ spritePresentation: full }));
    expect(resolved).toEqual(full);
  });

  it('partial override leaves non-overridden fields at definition defaults', () => {
    const resolved = resolveVfxSpriteSheetPresentation(nativeDef, makeStep({
      spritePresentation: { scaleMultiplier: 1.0, fadeIn: 0.1 },
    }));
    expect(resolved.scaleMultiplier).toBe(1.0);
    expect(resolved.fadeIn).toBe(0.1);
    expect(resolved.align).toBe(nativeDef.align);
    expect(resolved.layer).toBe(nativeDef.presentation.layer);
    expect(resolved.blending).toBe(nativeDef.presentation.blending);
    expect(resolved.opacityMultiplier).toBe(nativeDef.presentation.opacityMultiplier);
    expect(resolved.fadeOut).toBe(nativeDef.presentation.fadeOut);
  });

  it('works correctly with legacy definitions', () => {
    const resolved = resolveVfxSpriteSheetPresentation(legacyDef, makeStep({
      spriteSheet: 'basic_arrow_hit_small',
      spritePresentation: { align: 'bottom', scaleMultiplier: 2.0 },
    }));
    expect(resolved.align).toBe('bottom');
    expect(resolved.scaleMultiplier).toBe(2.0);
    expect(resolved.layer).toBe(legacyDef.presentation.layer);
    expect(resolved.blending).toBe(legacyDef.presentation.blending);
  });
});

describe('VFX runtime registry hardening — manifest ↔ registry consistency', () => {
  it('validates the real manifest with zero errors', () => {
    const errors = validateRuntimeRegistryConsistency(manifest);
    expect(errors).toEqual([]);
  });

  it('detects a duplicate candidateId', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [...manifest.assets, { ...first }],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('Duplicate candidateId'))).toBe(true);
  });

  it('detects a duplicate runtimeSheetId', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        ...manifest.assets,
        { ...first, candidateId: 'r1_dup_' + first.candidateId },
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('Duplicate runtimeSheetId'))).toBe(true);
  });

  it('detects a duplicate destinationFilename', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        ...manifest.assets,
        { ...first, candidateId: 'r1_dup_fn', runtimeSheetId: 'megapack_dup_fn' },
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('Duplicate destinationFilename'))).toBe(true);
  });

  it('detects MANUAL_REVIEW_REQUIRED source path', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, sourceRelativePath: '01_extracted/MANUAL_REVIEW_REQUIRED/foo.png' },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('MANUAL_REVIEW_REQUIRED'))).toBe(true);
  });

  it('detects a width mismatch between manifest and registry', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, expectedWidth: 9999 },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('sheetWidthPx mismatch'))).toBe(true);
  });

  it('detects a rows mismatch between manifest and registry', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, rows: 99 },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('rows mismatch'))).toBe(true);
  });

  it('detects a frameCount mismatch between manifest and registry', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, frameCount: 999 },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('frameCount mismatch'))).toBe(true);
  });

  it('detects a candidateId mismatch between manifest and registry', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, candidateId: 'r1_wrong' },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('candidateId mismatch'))).toBe(true);
  });

  it('detects a destinationFilename mismatch between manifest and registry', () => {
    const first = manifest.assets[0]!;
    const tampered: RuntimeManifest = {
      ...manifest,
      assets: [
        { ...first, destinationFilename: 'wrong.png' },
        ...manifest.assets.slice(1),
      ],
    };
    const errors = validateRuntimeRegistryConsistency(tampered);
    expect(errors.some((e) => e.includes('destinationFilename mismatch'))).toBe(true);
  });
});

describe('VFX runtime registry hardening — reserved assets', () => {
  it('reserved native sheets are valid definitions in VFX_SPRITE_SHEETS', () => {
    for (const id of RESERVED_NATIVE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      expect(def).toBeDefined();
      expect(def.assetGeneration).toBe('megapack-native');
      expect(validateVfxSpriteSheetDefinition(def)).toEqual([]);
    }
  });

  it('reserved native sheets are included in NATIVE_SPRITE_SHEET_IDS', () => {
    const nativeSet = new Set<string>(NATIVE_SPRITE_SHEET_IDS);
    for (const id of RESERVED_NATIVE_SHEET_IDS) {
      expect(nativeSet.has(id)).toBe(true);
    }
  });

  it('reserved sheets are not assigned to any preset step', () => {
    const reservedSet = new Set<string>(RESERVED_NATIVE_SHEET_IDS);
    for (const id of NATIVE_SPRITE_SHEET_IDS) {
      if (reservedSet.has(id)) {
        const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
        expect(def).toBeDefined();
      }
    }
  });
});

describe('VFX runtime registry hardening — legacy 5×5 grid invariants', () => {
  it('all legacy sheets are 5×5 / 25 frames / 1280px', () => {
    expect(LEGACY_SPRITE_SHEET_IDS.length).toBeGreaterThan(0);
    for (const id of LEGACY_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as LegacyVfxSpriteSheetId];
      expect(def.rows).toBe(5);
      expect(def.cols).toBe(5);
      expect(def.frameCount).toBe(25);
      expect(def.sheetWidthPx).toBe(1280);
      expect(def.sheetHeightPx).toBe(1280);
      expect(def.assetGeneration).toBe('legacy');
      expect(validateVfxSpriteSheetDefinition(def)).toEqual([]);
    }
  });

  it('legacy sheets have no sourceCandidateId or nativeCell dimensions', () => {
    for (const id of LEGACY_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as LegacyVfxSpriteSheetId];
      expect(def.sourceCandidateId).toBeUndefined();
      expect(def.nativeCellWidthPx).toBeUndefined();
      expect(def.nativeCellHeightPx).toBeUndefined();
    }
  });
});

describe('VFX runtime registry hardening — native grid invariants', () => {
  it('native 4×4 sheets are 2048px / 16 frames', () => {
    const native4x4 = NATIVE_SPRITE_SHEET_IDS.filter(
      (id) => VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId].rows === 4,
    );
    expect(native4x4.length).toBe(2);
    for (const id of native4x4) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      expect(def.cols).toBe(4);
      expect(def.frameCount).toBe(16);
      expect(def.sheetWidthPx).toBe(2048);
      expect(def.sheetHeightPx).toBe(2048);
      expect(def.nativeCellWidthPx).toBe(512);
      expect(def.nativeCellHeightPx).toBe(512);
      expect(def.assetGeneration).toBe('megapack-native');
    }
  });

  it('native 8×8 sheets are 4096px / 64 frames', () => {
    const native8x8 = NATIVE_SPRITE_SHEET_IDS.filter(
      (id) => VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId].rows === 8,
    );
    expect(native8x8.length).toBe(13);
    for (const id of native8x8) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      expect(def.cols).toBe(8);
      expect(def.frameCount).toBe(64);
      expect(def.sheetWidthPx).toBe(4096);
      expect(def.sheetHeightPx).toBe(4096);
      expect(def.nativeCellWidthPx).toBe(512);
      expect(def.nativeCellHeightPx).toBe(512);
      expect(def.assetGeneration).toBe('megapack-native');
    }
  });

  it('all native sheets have sourceCandidateId and sourceFilename', () => {
    for (const id of NATIVE_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      expect(def.sourceCandidateId).toBeDefined();
      expect(def.sourceFilename).toBeDefined();
      expect(def.sourceCollection).toBeDefined();
    }
  });

  it('nativeCellWidthPx = sheetWidthPx / cols for all native sheets', () => {
    for (const id of NATIVE_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      expect(def.nativeCellWidthPx).toBe(def.sheetWidthPx / def.cols);
      expect(def.nativeCellHeightPx).toBe(def.sheetHeightPx / def.rows);
    }
  });
});

describe('VFX runtime registry hardening — R3F bottom pivot invariant', () => {
  it('configureVfxSpriteSheetPivot with bottom sets center.y = 0', () => {
    const sprite = configureVfxSpriteSheetPivot(new THREE.Sprite(), 'bottom');
    expect(sprite.center.x).toBeCloseTo(0.5);
    expect(sprite.center.y).toBeCloseTo(0);
  });

  it('configureVfxSpriteSheetPivot with center sets center.y = 0.5', () => {
    const sprite = configureVfxSpriteSheetPivot(new THREE.Sprite(), 'center');
    expect(sprite.center.x).toBeCloseTo(0.5);
    expect(sprite.center.y).toBeCloseTo(0.5);
  });

  it('resolved align bottom produces pivot that keeps lower edge fixed', () => {
    const def = VFX_SPRITE_SHEETS.megapack_shield_on;
    expect(def.align).toBe('bottom');
    const resolved = resolveVfxSpriteSheetPresentation(def, makeStep({
      spriteSheet: 'megapack_shield_on',
    }));
    expect(resolved.align).toBe('bottom');
    const sprite = configureVfxSpriteSheetPivot(new THREE.Sprite(), resolved.align);
    expect(sprite.center.y).toBeCloseTo(0);
  });

  it('align override to bottom changes pivot from center to bottom', () => {
    const def = VFX_SPRITE_SHEETS.megapack_fire_slash_spin;
    expect(def.align).toBe('center');
    const resolved = resolveVfxSpriteSheetPresentation(def, makeStep({
      spritePresentation: { align: 'bottom' },
    }));
    expect(resolved.align).toBe('bottom');
    const sprite = configureVfxSpriteSheetPivot(new THREE.Sprite(), resolved.align);
    expect(sprite.center.y).toBeCloseTo(0);
  });
});

describe('VFX runtime registry hardening — R3G half-texel UV correctness', () => {
  it('legacy 1280px sheets use 0.5/1280 inset on all frames', () => {
    const def = VFX_SPRITE_SHEETS.basic_arrow_hit_small;
    const inset = 0.5 / 1280;
    const cell = 0.2;
    for (let frame = 0; frame < 25; frame++) {
      const uv = getVfxSpriteSheetFrameUv(def, frame);
      expect(uv.repeatX).toBeCloseTo(cell - inset * 2);
      expect(uv.repeatY).toBeCloseTo(cell - inset * 2);
    }
  });

  it('native 2048px sheets use 0.5/2048 inset on all frames', () => {
    const def = VFX_SPRITE_SHEETS.megapack_dash_wind_white_v3;
    const inset = 0.5 / 2048;
    const cell = 0.25;
    for (let frame = 0; frame < 16; frame++) {
      const uv = getVfxSpriteSheetFrameUv(def, frame);
      expect(uv.repeatX).toBeCloseTo(cell - inset * 2);
      expect(uv.repeatY).toBeCloseTo(cell - inset * 2);
    }
  });

  it('native 4096px sheets use 0.5/4096 inset on all frames', () => {
    const def = VFX_SPRITE_SHEETS.megapack_fire_slash_spin;
    const inset = 0.5 / 4096;
    const cell = 0.125;
    for (let frame = 0; frame < 64; frame++) {
      const uv = getVfxSpriteSheetFrameUv(def, frame);
      expect(uv.repeatX).toBeCloseTo(cell - inset * 2);
      expect(uv.repeatY).toBeCloseTo(cell - inset * 2);
    }
  });

  it('UV insets keep all frames within their cell boundaries for all native sheets', () => {
    for (const id of NATIVE_SPRITE_SHEET_IDS) {
      const def = VFX_SPRITE_SHEETS[id as NativeVfxSpriteSheetId];
      const cellW = 1 / def.cols;
      const cellH = 1 / def.rows;
      for (let frame = 0; frame < def.frameCount; frame++) {
        const uv = getVfxSpriteSheetFrameUv(def, frame);
        const col = frame % def.cols;
        const row = Math.floor(frame / def.cols);
        expect(uv.offsetX).toBeGreaterThan(col * cellW - 1e-9);
        expect(uv.offsetX + uv.repeatX).toBeLessThan((col + 1) * cellW + 1e-9);
        expect(uv.offsetY).toBeGreaterThan(1 - (row + 1) * cellH - 1e-9);
        expect(uv.offsetY + uv.repeatY).toBeLessThan(1 - row * cellH + 1e-9);
      }
    }
  });
});
