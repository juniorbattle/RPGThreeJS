import { describe, expect, it } from 'vitest';
import { COMBAT_RENDER_LAYERS } from './combatRenderLayers';
import { VFX_RENDER_ORDER } from './vfx/VfxSystem';

describe('combat render layers', () => {
  it('keeps tactical overlays below every unit presentation layer', () => {
    expect(COMBAT_RENDER_LAYERS.TILE_BASE).toBeLessThan(COMBAT_RENDER_LAYERS.TILE_ACTION);
    expect(COMBAT_RENDER_LAYERS.TILE_ACTION).toBeLessThan(COMBAT_RENDER_LAYERS.TILE_TARGET);
    expect(COMBAT_RENDER_LAYERS.TILE_TARGET).toBeLessThan(COMBAT_RENDER_LAYERS.UNIT_SHADOW);
    expect(COMBAT_RENDER_LAYERS.UNIT_SHADOW).toBeLessThan(COMBAT_RENDER_LAYERS.UNIT_OUTLINE);
    expect(COMBAT_RENDER_LAYERS.UNIT_OUTLINE).toBeLessThan(COMBAT_RENDER_LAYERS.UNIT_SPRITE);
    expect(COMBAT_RENDER_LAYERS.UNIT_SPRITE).toBeGreaterThan(VFX_RENDER_ORDER.ground);
  });

  it('keeps statuses and boss alerts readable below impact VFX', () => {
    expect(COMBAT_RENDER_LAYERS.UNIT_SPRITE).toBeLessThan(COMBAT_RENDER_LAYERS.UNIT_STATUS);
    expect(COMBAT_RENDER_LAYERS.UNIT_STATUS).toBeLessThan(COMBAT_RENDER_LAYERS.BOSS_ALERT);
    expect(COMBAT_RENDER_LAYERS.BOSS_ALERT).toBeLessThan(COMBAT_RENDER_LAYERS.VFX);
    expect(COMBAT_RENDER_LAYERS.VFX).toBe(VFX_RENDER_ORDER.impact);
    expect(COMBAT_RENDER_LAYERS.VFX).toBeLessThan(COMBAT_RENDER_LAYERS.FLOATING_TEXT);
  });
});
