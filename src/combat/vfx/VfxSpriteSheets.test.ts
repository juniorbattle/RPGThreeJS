import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
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
  'burn_mark', 'silence_seal', 'curse_mark', 'weak_mark',
  'regen_aura', 'revive_pillar', 'holy_aura', 'bless_field', 'boost_aura', 'smoke_burst', 'mace_impact',
  'line_blast', 'cone_blast', 'dark_explosion', 'explosion_large', 'judgement_beam', 'holy_explosion',
  'eclipse_devour', 'drain_field', 'zenith_arrow', 'fault_breaker', 'apocalypse_field',
  'shadow_lightning_bolt',
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
});
