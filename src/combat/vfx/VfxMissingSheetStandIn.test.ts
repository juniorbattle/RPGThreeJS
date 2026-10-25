// @vitest-environment happy-dom

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGroupedActionsInScope, getScopeCensus } from './DemoVfxActionScope';
import { __resetStandInWarnings, isMissingSpriteSheetStep, isVfxSpriteSheetResolved, resolveRenderableVfxStep } from './VfxMissingSheetStandIn';
import { VFX_PRESETS, getVfxPreset } from './VfxPresets';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import { VfxSystem } from './VfxSystem';
import type { VfxPreset, VfxStep, VfxStepType } from './VfxTypes';

/** Step types VfxSystem draws in the scene itself, independent of any sprite sheet file. */
const PROCEDURAL_WORLD_TYPES: ReadonlySet<VfxStepType> = new Set(['particleBurst', 'sparkleBurst', 'smokePuff', 'slashArc', 'impactStar', 'groundRing', 'projectile']);
const CAMERA_ONLY_TYPES: ReadonlySet<VfxStepType> = new Set(['screenFlash', 'screenShake', 'hitStop']);

const drawsInWorld = (step: VfxStep) => (step.type === 'spriteSheet' ? isVfxSpriteSheetResolved(step.spriteSheet) : !CAMERA_ONLY_TYPES.has(step.type));
const missingSheetSteps = () => Object.values(VFX_PRESETS).flatMap((preset) => preset.steps.filter(isMissingSpriteSheetStep));

const retired = (spriteSheet: string, extra: Partial<VfxStep> = {}) => ({ type: 'spriteSheet', anchor: 'target', spriteSheet, startTime: 0, duration: 0.4, ...extra }) as unknown as VfxStep;

describe('missing sprite sheet stand-in', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => vi.restoreAllMocks());

  it('tells resolved native sheets from retired ones', () => {
    const native = Object.keys(VFX_SPRITE_SHEETS)[0]!;
    expect(isVfxSpriteSheetResolved(native)).toBe(true);
    expect(isVfxSpriteSheetResolved('basic_sword_slash_heavy')).toBe(false);
    expect(isVfxSpriteSheetResolved(undefined)).toBe(false);
    expect(isVfxSpriteSheetResolved('toString')).toBe(false);
  });

  it('leaves every resolved or procedural step untouched', () => {
    for (const preset of Object.values(VFX_PRESETS)) {
      for (const step of preset.steps.filter((candidate) => !isMissingSpriteSheetStep(candidate))) {
        expect(resolveRenderableVfxStep(step)).toBe(step);
      }
    }
  });

  it('replaces every missing sheet of the preset pack with a procedural step at the same anchor and time', () => {
    const missing = missingSheetSteps();
    expect(missing.length).toBeGreaterThan(0);
    for (const step of missing) {
      const standIn = resolveRenderableVfxStep(step);
      expect(PROCEDURAL_WORLD_TYPES.has(standIn.type), `${step.spriteSheet} -> ${standIn.type}`).toBe(true);
      expect(standIn).toMatchObject({ anchor: step.anchor, startTime: step.startTime });
      expect(standIn.duration).toBeGreaterThanOrEqual(step.duration);
      expect(standIn.spriteSheet).toBeUndefined();
    }
  });

  it('reads the retired art family from the sheet name', () => {
    const typeOf = (spriteSheet: string) => resolveRenderableVfxStep({ type: 'spriteSheet', anchor: 'target', spriteSheet, startTime: 0, duration: 0.4 } as VfxStep).type;
    expect(typeOf('basic_sword_slash_heavy')).toBe('slashArc');
    expect(typeOf('basic_hammer_crush_heavy')).toBe('impactStar');
    expect(typeOf('skill_heal_blessing_bloom_heavy')).toBe('sparkleBurst');
    expect(typeOf('skill_barrier_guard_heavy')).toBe('groundRing');
    expect(typeOf('skill_poison_maw_bite_heavy')).toBe('smokePuff');
    expect(typeOf('skill_fire_impact_burst_medium')).toBe('particleBurst');
    expect(typeOf('skill_ice_pillar_impact_heavy')).toBe('particleBurst');
    expect(resolveRenderableVfxStep({ type: 'spriteSheet', anchor: 'source', targetAnchor: 'target', spriteSheet: 'gone', sheetMode: 'projectile', startTime: 0, duration: 0.4 } as unknown as VfxStep))
      .toMatchObject({ type: 'projectile', anchor: 'source', targetAnchor: 'target' });
  });

  // Pure moves (a_hawk_leap) also keep doMove's own fallback, which this preset-level check does not cover.
  it("gives every demo action's preset something drawn in the scene, and keeps the gap visible for the lab", () => {
    const actions = getGroupedActionsInScope('DEMO').flatMap((bucket) => bucket.actions);
    expect(actions).toHaveLength(getScopeCensus().demo);
    const gaps: string[] = [];
    for (const action of actions) {
      const preset = getVfxPreset(action.currentPresetId ?? '');
      expect(preset, action.actionKey).toBeDefined();
      const rendered = preset!.steps.map(resolveRenderableVfxStep);
      expect(rendered.some(drawsInWorld), action.actionKey).toBe(true);
      expect(rendered.filter(isMissingSpriteSheetStep), action.actionKey).toEqual([]);
      if (preset!.steps.some(isMissingSpriteSheetStep)) gaps.push(action.actionKey);
    }
    expect(gaps).toHaveLength(31);
    expect(actions.map((action) => action.actionKey).filter((key) => !gaps.includes(key)).sort()).toEqual(['ni_shadow_step', 'w_charge', 'w_salvation']);
  });

  it('sizes each stand-in for its engine type and keeps healing green apart', () => {
    const sparkle = resolveRenderableVfxStep(retired('skill_heal_blessing_bloom_heavy'));
    expect(sparkle).toMatchObject({ type: 'sparkleBurst', count: 16, scale: 0.45, color: '#c8ffc0' });
    expect(resolveRenderableVfxStep(retired('skill_holy_sigil_burst_medium'))).toMatchObject({ type: 'sparkleBurst', color: '#ffe9a0' });
    expect(resolveRenderableVfxStep(retired('skill_poison_maw_bite_heavy'))).toMatchObject({ type: 'smokePuff', count: 12 });
    expect(resolveRenderableVfxStep(retired('skill_barrier_guard_heavy'))).toMatchObject({ type: 'groundRing', radius: 0.75, scale: 1 });
    expect(resolveRenderableVfxStep(retired('basic_sword_slash_heavy', { scale: 1.8 })).scale).toBeCloseTo(0.9);
    expect(resolveRenderableVfxStep(retired('basic_sword_slash_heavy', { scale: 4 })).scale).toBe(1.1);
    expect(resolveRenderableVfxStep(retired('basic_dagger_crosscut_small')).scale).toBe(0.6);
    expect(resolveRenderableVfxStep(retired('basic_slice_hit_small')).type).toBe('impactStar');
    expect(resolveRenderableVfxStep(retired('skill_fire_impact_burst_medium', { opacity: 0.4 })).opacity).toBe(0.4);
  });

  it('warns once per missing sheet in development', () => {
    __resetStandInWarnings();
    resolveRenderableVfxStep(retired('basic_titan_crush_heavy'));
    resolveRenderableVfxStep(retired('basic_titan_crush_heavy'));
    resolveRenderableVfxStep(retired('basic_mace_impact_medium'));
    expect(warn.mock.calls.filter(([message]) => String(message).includes('basic_titan_crush_heavy'))).toHaveLength(1);
    expect(warn.mock.calls.filter(([message]) => String(message).includes('stand-in'))).toHaveLength(2);
  });

  it('draws the stand-in through VfxSystem instead of skipping the step', async () => {
    const system = new VfxSystem();
    const billboard = vi.spyOn(VfxSystem.prototype as unknown as { playBillboard: () => Promise<void> }, 'playBillboard').mockResolvedValue(undefined);
    const preset: VfxPreset = { ...getVfxPreset('basic_greatsword_hit')!, steps: [{ type: 'spriteSheet', anchor: 'target', spriteSheet: 'basic_greatsword_cleave_heavy', startTime: 0, duration: 0.4 } as VfxStep] };
    const result = system.playPreset(preset, { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), targetPoint: { x: 0, y: 0, z: 0 } });
    await result.completion;
    expect(billboard).toHaveBeenCalledTimes(1);
    expect((billboard.mock.calls[0] as unknown as [VfxStep])[0]).toMatchObject({ type: 'slashArc', anchor: 'target' });
    system.dispose();
  });
});
