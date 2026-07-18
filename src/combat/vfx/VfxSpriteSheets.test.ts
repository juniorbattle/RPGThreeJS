import { describe, expect, it } from 'vitest';
import runtimeManifest from '../../../public/assets/vfx/runtime/v1/manifest.json';
import { VFX_PRESETS } from './VfxPresets';
import { VFX_SPRITE_SHEETS, VFX_SPRITE_SHEET_IDS } from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';

const FORBIDDEN_RUNTIME_SEGMENTS = ['/validation/', '/raw/', '/processed/', '/rejected/'];

describe('combat VFX sprite sheets', () => {
  it('keeps the approved manifest and typed runtime registry synchronized', () => {
    expect(runtimeManifest.runtime_ready).toBe(true);
    expect(runtimeManifest.version).toBe(1);
    expect(runtimeManifest.entries.map((entry) => entry.id)).toEqual(VFX_SPRITE_SHEET_IDS);

    for (const entry of runtimeManifest.entries) {
      const definition = VFX_SPRITE_SHEETS[entry.id as VfxSpriteSheetId];
      expect(definition).toBeDefined();
      expect(definition).toMatchObject(entry);
      expect(definition.url).toMatch(/^\/assets\/vfx\/runtime\/v1\/[a-z_]+\.png$/);
      for (const forbidden of FORBIDDEN_RUNTIME_SEGMENTS) expect(definition.url).not.toContain(forbidden);
      expect(definition.presentation.scaleMultiplier).toBeGreaterThanOrEqual(1);
      expect(definition.presentation.opacityMultiplier).toBeGreaterThan(0);
      expect(definition.presentation.fadeIn).toBeGreaterThanOrEqual(0);
      expect(definition.presentation.fadeOut).toBeGreaterThan(definition.presentation.fadeIn);
      expect(definition.presentation.fadeOut).toBeLessThan(1);
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
});
