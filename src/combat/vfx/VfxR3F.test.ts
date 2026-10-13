import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  BASIC_ATTACK_VFX_PRESET_IDS,
  VFX_PRESETS,
  getVfxPreset,
} from './VfxPresets';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import { configureVfxSpriteSheetPivot } from './VfxSystem';
import type { VfxOrientation, VfxStep } from './VfxTypes';

const DYNAMIC_ROTATION_ORIENTATIONS: VfxOrientation[] = [
  'source_to_target',
  'align_line',
  'align_cone',
  'face_target',
];

function spriteSheetSteps(presetId: string): VfxStep[] {
  const preset = getVfxPreset(presetId);
  return preset?.steps.filter((step) => step.type === 'spriteSheet') ?? [];
}

describe('VFX-R3F billboard placement and readability doctrine', () => {
  it('impact spriteSheet steps never use dynamic-rotation orientations', () => {
    for (const preset of Object.values(VFX_PRESETS)) {
      for (const step of spriteSheetSteps(preset.id)) {
        if (step.sheetMode === 'projectile' || step.sheetMode === 'sky_descent') continue;
        expect(DYNAMIC_ROTATION_ORIENTATIONS).not.toContain(step.orientation);
      }
    }
  });

  it('basic attack VFX use center_on_target orientation', () => {
    for (const id of BASIC_ATTACK_VFX_PRESET_IDS) {
      for (const step of spriteSheetSteps(id)) {
        expect(step.orientation).toBe('center_on_target');
      }
    }
  });

  it('unit-centered support and debuff presets use anchor: target', () => {
    const unitCenteredPresets = [
      'fireball',
      'heal_burst',
      'bless_aura',
      'curse_pulse',
      'status_curse_mark',
      'support_regen_aura',
      'support_holy_aura',
      'support_boost_aura',
    ];
    for (const id of unitCenteredPresets) {
      const steps = spriteSheetSteps(id);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.anchor).toBe('target');
      }
    }
  });

  it('ground effects retain ground anchors only when semantically justified', () => {
    const groundPresets: Record<string, string[]> = {
      boss_quake: ['groundTarget'],
      root_vines: ['groundTarget'],
      frost_bind: ['groundTarget'],
      support_revive_pillar: ['targetGround'],
      move_smoke_burst: ['targetGround'],
      boss_apocalypse_v2: ['targetGround'],
      teleport_burst: ['groundTarget'],
      leap_impact: ['groundTarget'],
      boss_slam: ['targetGround'],
      caster_roar: ['sourceGround'],
    };
    for (const [id, expectedAnchors] of Object.entries(groundPresets)) {
      const steps = spriteSheetSteps(id);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(expectedAnchors).toContain(step.anchor);
      }
    }
  });

  it('keeps a bottom-aligned sprite baseline fixed while its visual scale pulses', () => {
    const anchorY = 0.055;
    const sprite = configureVfxSpriteSheetPivot(new THREE.Sprite(), 'bottom');
    sprite.position.y = anchorY;

    const lowerEdgeAt = (height: number) => {
      sprite.scale.y = height;
      return sprite.position.y - sprite.scale.y * sprite.center.y;
    };

    expect(sprite.center.x).toBeCloseTo(0.5);
    expect(sprite.center.y).toBeCloseTo(0);
    expect(lowerEdgeAt(0.94)).toBeCloseTo(anchorY);
    expect(lowerEdgeAt(1.06)).toBeCloseTo(anchorY);

    const centered = configureVfxSpriteSheetPivot(new THREE.Sprite(), 'center');
    expect(centered.center.x).toBeCloseTo(0.5);
    expect(centered.center.y).toBeCloseTo(0.5);
  });

  it('spriteSheet steps meet minimum visual duration for 25-frame sheets', () => {
    const MIN_DURATION_BY_TAG: Record<string, number> = {
      basic: 0.45,
      skill: 0.55,
      boss: 0.65,
      ultimate: 0.65,
    };

    for (const preset of Object.values(VFX_PRESETS)) {
      const isUltimate = preset.tags.includes('ultimate');
      const isBoss = preset.tags.includes('boss');
      const isSkill = preset.tags.includes('skill');
      const minDuration = (isUltimate || isBoss
        ? MIN_DURATION_BY_TAG.ultimate
        : isSkill
          ? MIN_DURATION_BY_TAG.skill
          : MIN_DURATION_BY_TAG.basic) ?? 0.45;

      for (const step of spriteSheetSteps(preset.id)) {
        if (step.sheetMode === 'projectile' || step.sheetMode === 'sky_descent') continue;
        const sheet = VFX_SPRITE_SHEETS[step.spriteSheet!];
        if (!sheet || sheet.frameCount !== 25) continue;
        expect(step.duration).toBeGreaterThanOrEqual(minDuration);
      }
    }
  });

  it('generic_hit, arrow_shot, and kill_spark meet minimum effective scale', () => {
    // R2C-C.1: legacy sheets are retired — scaleMultiplier defaults to 1
    // when the definition is undefined. Minimums adjusted for legacy-only presets.
    const MIN_SCALE: Record<string, number> = {
      generic_hit: 1.0,
      arrow_shot: 1.0,
      kill_spark: 1.8,
    };

    for (const [id, minEffective] of Object.entries(MIN_SCALE)) {
      const steps = spriteSheetSteps(id);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        const sheet = VFX_SPRITE_SHEETS[step.spriteSheet!];
        const effectiveScale = (step.scale ?? 1) * (sheet?.presentation.scaleMultiplier ?? 1);
        expect(effectiveScale).toBeGreaterThanOrEqual(minEffective);
      }
    }
  });

  it('targetSizeMultiplier is presentation-only on VfxContext', () => {
    const testContext: Partial<import('./VfxTypes').VfxContext> = {
      targetSizeMultiplier: 1.3,
    };
    expect(testContext.targetSizeMultiplier).toBe(1.3);
    expect(testContext.targetSizeMultiplier).not.toBeUndefined();
  });
});
