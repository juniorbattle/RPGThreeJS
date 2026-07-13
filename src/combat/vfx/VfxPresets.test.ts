import { describe, expect, it } from 'vitest';
import { VFX_PRESET_IDS, VFX_PRESETS, VFX_PARTICLE_STEP_TYPES, getVfxPreset } from './VfxPresets';
import { VFX_TEXTURE_NAMES } from './VfxTextures';
import { isVfxWorkbenchEnabled } from './VfxWorkbench';
import type { VfxStepType } from './VfxTypes';

const PHASE_1_PRESETS = ['melee_light', 'melee_heavy', 'fireball', 'heal_burst', 'boss_quake'];
const PHASE_2_PRESETS = [
  'generic_hit',
  'sword_slash',
  'blunt_impact',
  'arrow_shot',
  'dark_bolt',
  'bless_aura',
  'curse_pulse',
  'poison_bite',
  'guard_barrier',
  'boss_slam',
  'critical_hit',
  'kill_spark',
];
const REQUIRED_PRESETS = [...PHASE_1_PRESETS, ...PHASE_2_PRESETS];
const VALID_STEP_TYPES = new Set<VfxStepType>([
  'particleBurst',
  'projectile',
  'slashArc',
  'shockwave',
  'groundRing',
  'magicCircle',
  'screenFlash',
  'screenShake',
  'lightPulse',
  'smokePuff',
  'sparkleBurst',
  'impactStar',
  'hitStop',
]);

describe('combat VFX presets', () => {
  it('exposes the complete V1 preset pack with unique identifiers', () => {
    expect([...VFX_PRESET_IDS]).toEqual(REQUIRED_PRESETS);
    expect(new Set(VFX_PRESET_IDS).size).toBe(VFX_PRESET_IDS.length);
    for (const id of REQUIRED_PRESETS) expect(getVfxPreset(id)).toBe(VFX_PRESETS[id]);
  });

  it('keeps every Phase 2 effect addressable as an independent preset', () => {
    for (const id of PHASE_2_PRESETS) {
      const preset = getVfxPreset(id);
      expect(preset?.id).toBe(id);
      expect(preset?.tags.length).toBeGreaterThan(0);
    }
  });

  it('keeps every step valid and inside its preset timeline', () => {
    for (const preset of Object.values(VFX_PRESETS)) {
      expect(preset.duration).toBeGreaterThan(0);
      expect(preset.impactTime).toBeGreaterThanOrEqual(0);
      expect(preset.impactTime).toBeLessThanOrEqual(preset.duration);
      expect(preset.steps.length).toBeGreaterThan(0);
      for (const step of preset.steps) {
        expect(VALID_STEP_TYPES.has(step.type)).toBe(true);
        expect(step.startTime).toBeGreaterThanOrEqual(0);
        expect(step.duration).toBeGreaterThanOrEqual(0);
        expect(step.startTime + step.duration).toBeLessThanOrEqual(preset.duration + Number.EPSILON);
        if (step.texture) expect(VFX_TEXTURE_NAMES).toContain(step.texture);
      }
    }
  });

  it('declares an honest particle budget and a bounded reduced mode', () => {
    for (const preset of Object.values(VFX_PRESETS)) {
      const declaredParticles = preset.steps.reduce(
        (total, step) => total + (VFX_PARTICLE_STEP_TYPES.has(step.type) ? (step.count ?? 1) : 0),
        0,
      );
      expect(declaredParticles).toBe(preset.particleBudget);
      expect(preset.reducedGraphicsScale).toBeGreaterThan(0);
      expect(preset.reducedGraphicsScale).toBeLessThanOrEqual(1);
      for (const step of preset.steps) {
        if (step.reducedGraphicsMultiplier === undefined) continue;
        expect(step.reducedGraphicsMultiplier).toBeGreaterThan(0);
        expect(step.reducedGraphicsMultiplier).toBeLessThanOrEqual(1);
      }
    }
  });

  it('keeps the workbench strictly development-only', () => {
    expect(isVfxWorkbenchEnabled(true)).toBe(true);
    expect(isVfxWorkbenchEnabled(false)).toBe(false);
  });
});
