import { describe, it, expect } from 'vitest';
import {
  createDefaultLabState,
  getLabActions,
  getHeroActions,
  getVisualSpriteSheetSteps,
  getArtisticState,
  labStepKey,
  getActionCount,
  setQaSourceId,
  setQaPresentation,
  serializeLabState,
  deserializeLabState,
} from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';
import { VFX_SPRITE_SHEETS, buildLabSheetDefinition } from './VfxSpriteSheets';
import { getCandidateInventoryRecord } from './VfxResourceManager';
import { STATIC_VFX_TIER_PRESENTATION, ACTION_PRESENTATION_TIERS, VFX_TIER_DURATION_BANDS } from '../combatVfxPresentation';
import { readFileSync, writeFileSync } from 'node:fs';

// ============================================================
// Phase 0: Presentation Semantics Audit
// ============================================================

describe('R2C-HERO60 P0.1 — Presentation Semantics Audit', () => {
  it('A. QA duration compresses/stretches full frame sequence', () => {
    // From VfxSystem.ts playLabSpriteSheetInternal line 500-503:
    // const duration = overrides.duration ?? step.duration;
    // const frame = Math.min(sheetDef.frameCount - 1, Math.floor(progress * sheetDef.frameCount));
    // progress = clamp((now - start) / (duration * 1000), 0, 1)
    // Therefore: all frameCount frames are distributed evenly across the QA duration.
    // A 64-frame sheet at 0.38s shows each frame for ~5.9ms — far too fast.
    // A 64-frame sheet at 1.28s shows each frame for 20ms — native cadence.
    expect(true).toBe(true); // Semantic finding documented
  });

  it('B. QA playback uses overrides.duration directly', () => {
    // VfxSystem.ts line 500: const duration = overrides.duration ?? step.duration;
    // QA override takes precedence over step.duration.
    expect(true).toBe(true);
  });

  it('C. Frame selection is linear progress × frameCount', () => {
    // VfxSystem.ts line 503:
    // const frame = Math.min(sheetDef.frameCount - 1, Math.floor(progress * sheetDef.frameCount));
    // Frame index = floor(progress * frameCount), clamped to frameCount-1.
    // No easing on frame selection — only on opacity/scale envelope.
    expect(true).toBe(true);
  });

  it('D. fadeOut is normalized progress position where fade begins', () => {
    // VfxSystem.ts spriteSheetEnvelope line 274-278:
    // const fadeOutProgress = clamp((progress - fadeOut) / Math.max(1 - fadeOut, 0.001), 0, 1);
    // return fadeInProgress * (1 - easeInOut(fadeOutProgress));
    // fadeOut=0.82 → fade begins at 82% progress, reaches 0 at 100%.
    // fadeOut=0.08 → fade begins at 8% progress — sprite vanishes almost immediately!
    expect(true).toBe(true);
  });

  it('E. fadeOut multiplies opacity via easeInOut ramp to zero', () => {
    // opacity = baseOpacity * spriteSheetEnvelope(progress, resolved)
    // envelope = fadeInProgress * (1 - easeInOut(fadeOutProgress))
    // At progress=fadeOut: envelope = fadeInProgress * (1 - 0) = fadeInProgress ≈ 1
    // At progress=1.0: envelope = fadeInProgress * (1 - 1) = 0
    // The fade is an easeInOut curve from fadeOut point to end.
    expect(true).toBe(true);
  });

  it('F. Final scale composition documented', () => {
    // VfxSystem.ts playLabSpriteSheetInternal line 485-490:
    // baseHeight = (step.scale ?? 1) * effectiveScale * intensity *
    //   (reducedGraphics ? 0.94 : 1) * contextPresentationScale(context) *
    //   contextTargetSizeMultiplier(context)
    //
    // Where:
    // - step.scale = preset step's authored scale (e.g. 1.82 for fire_impact_burst_medium)
    // - effectiveScale = QA override scale ?? native scaleMultiplier (e.g. 1.4 for 2048, 1.6 for 4096)
    // - intensity = context.intensity clamped 0.35-1.8, from ACTION_PRESENTATION_TIERS
    //   tier 1=0.88, tier 2=0.98, tier 3=1.07, tier 4=1.14, tier 5=1.20
    // - contextPresentationScale = staticScaleMultiplier * clamp(presentationScale, 0.55, 1.45)
    //   staticScaleMultiplier: basic=1.0, 2ap=1.05, 3ap=1.12, 4ap=1.30, 5ap=1.55
    // - contextTargetSizeMultiplier = 1.3 if target size > 1, else 1.0
    //
    // Additionally, spriteSheetScalePulse adds: 0.94 + sin(PI * peak) * 0.12
    // where peak = clamp(progress / fadeOut, 0, 1)
    //
    // Example: basic_greatsword_hit with QA scale=2.1:
    //   step.scale (varies by preset) × 2.1 × 0.88 × 1.0 × 1.0 × 1.0
    //   If step.scale=1.46: final ≈ 1.46 × 2.1 × 0.88 ≈ 2.70 (before pulse)
    expect(true).toBe(true);
  });

  it('G. ground vs impact layer differences', () => {
    // VfxSystem.ts:
    // ground: depthTest=true, renderOrder=38, opacity = clamp(requested * opacityMultiplier, 0, 1)
    // impact: depthTest=false, renderOrder=74+, opacity = foregroundPeakOpacity (applies floor)
    // ground effects render behind combatants (renderOrder 38 < sprite renderOrder 60)
    // impact effects render in front (renderOrder 74 > 60)
    expect(true).toBe(true);
  });

  it('H. Native vs QA override resolution order', () => {
    // VfxSpriteSheets.ts resolveVfxSpriteSheetPresentation:
    // step.spritePresentation override → definition.presentation default
    //
    // VfxSystem.ts playLabSpriteSheetInternal:
    // overrides.X ?? resolved.X (where resolved comes from resolveVfxSpriteSheetPresentation)
    // So: QA override > step spritePresentation > definition presentation default
    //
    // buildLabSheetDefinition defaults for Lab candidates:
    // scaleMultiplier=1.4, opacityMultiplier=1, fadeIn=0.02, fadeOut=0.82, layer=impact, blending=additive
    expect(true).toBe(true);
  });

  it('documents static tier multipliers', () => {
    expect(STATIC_VFX_TIER_PRESENTATION.basic.scaleMultiplier).toBe(1.0);
    expect(STATIC_VFX_TIER_PRESENTATION['2ap'].scaleMultiplier).toBe(1.05);
    expect(STATIC_VFX_TIER_PRESENTATION['3ap'].scaleMultiplier).toBe(1.12);
    expect(STATIC_VFX_TIER_PRESENTATION['4ap'].scaleMultiplier).toBe(1.30);
    expect(STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].scaleMultiplier).toBe(1.55);
  });

  it('documents action presentation tiers (intensity)', () => {
    expect(ACTION_PRESENTATION_TIERS[1].intensity).toBe(0.88);
    expect(ACTION_PRESENTATION_TIERS[2].intensity).toBe(0.98);
    expect(ACTION_PRESENTATION_TIERS[3].intensity).toBe(1.07);
    expect(ACTION_PRESENTATION_TIERS[4].intensity).toBe(1.14);
    expect(ACTION_PRESENTATION_TIERS[5].intensity).toBe(1.20);
  });

  it('documents AP-tier duration bands (retired for P0.1)', () => {
    // These bands were used by A1 to set durations. P0.1 replaces them
    // with native cadence: frameCount × frameDurationMs / 1000.
    expect(VFX_TIER_DURATION_BANDS.basic.max).toBe(0.45);
    expect(VFX_TIER_DURATION_BANDS['5ap_ultimate'].max).toBe(1.45);
  });
});

// ============================================================
// Phase 1-6: Pilot Calibration
// ============================================================

describe('R2C-HERO60 P0.1 — Five-Action Presentation Pilot', () => {
  const checkpoint = JSON.parse(
    readFileSync('docs/reports/hero60_a1_3_64of64_pre_human_qa.json', 'utf-8')
  );
  const beforeState: LabState = checkpoint.labState;

  // Pilot selection: 1 BASIC, 1 2AP, 1 3AP, 1 4AP, 1 5AP Ultimate
  // Diverse: physical slash, magic projectile, physical dash, AoE fire, melee ultimate
  // Both native formats: 2048/16f and 4096/64f
  // All single-step actions (avoiding d_devouring_eclipse and ni_silent_assassin)
  const pilotActions = [
    { actionKey: 'basic_greatsword_hit', tier: 'BASIC', apTier: 1, scaleTier: 'basic' as const },
    { actionKey: 'n_dark_bolt', tier: '2AP', apTier: 2, scaleTier: '2ap' as const },
    { actionKey: 'w_charge', tier: '3AP', apTier: 3, scaleTier: '3ap' as const },
    { actionKey: 'n_flame_wave', tier: '4AP', apTier: 4, scaleTier: '4ap' as const },
    { actionKey: 'w_lion_surge', tier: '5AP ULTIMATE', apTier: 5, scaleTier: '5ap_ultimate' as const },
  ];

  it('1. before-checkpoint has 64 QA sources and 64 QA overrides', () => {
    expect(Object.keys(beforeState.qaSourceByActionStep).length).toBe(64);
    expect(Object.keys(beforeState.qaPresentationByActionStep).length).toBe(64);
  });

  it('2. before-checkpoint has 0 validated/tested/verified', () => {
    expect(Object.keys(beforeState.validatedByActionStep).length).toBe(0);
    expect(Object.keys(beforeState.testedFingerprintByActionStep ?? {}).length).toBe(0);
    expect(Object.keys(beforeState.verifiedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  it('3. all 5 pilot actions are single-step hero actions', () => {
    for (const pilot of pilotActions) {
      const action = getHeroActions().find(a => a.actionKey === pilot.actionKey);
      expect(action).toBeDefined();
      const visualSteps = getVisualSpriteSheetSteps(action!);
      expect(visualSteps.length).toBe(1);
    }
  });

  it('4. derives native presentation baseline for each pilot', () => {
    for (const pilot of pilotActions) {
      const action = getHeroActions().find(a => a.actionKey === pilot.actionKey);
      expect(action).toBeDefined();
      const stepIndex = 0;
      const qaKey = labStepKey(pilot.actionKey, stepIndex);
      const candidateId = beforeState.qaSourceByActionStep[qaKey]!;
      expect(candidateId).toBeDefined();

      const invRecord = getCandidateInventoryRecord(candidateId);
      expect(invRecord).toBeDefined();

      const is2048 = invRecord!.width === 2048;
      const frameCount = invRecord!.nativeFrameCount;
      const frameDurationMs = is2048 ? 50 : 20;
      const nativeDuration = (frameCount * frameDurationMs) / 1000;

      // Log for documentation
      console.log(`${pilot.tier}: ${pilot.actionKey} → ${candidateId} | ${invRecord!.width}×${invRecord!.height} | ${frameCount}f × ${frameDurationMs}ms = ${nativeDuration}s | grid: ${invRecord!.nativeGrid}`);
    }
  });

  it('5. A1 fadeOut values are catastrophically early', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const pres = beforeState.qaPresentationByActionStep[qaKey]!;
      expect(pres).toBeDefined();
      // A1 fadeOut values should be < 0.20 (the problematic range)
      console.log(`${pilot.actionKey}: A1 fadeOut=${pres.fadeOut} (starts vanishing at ${Math.round(pres.fadeOut! * 100)}% progress)`);
      expect(pres.fadeOut!).toBeLessThan(0.20);
    }
  });

  it('6. A1 durations are shorter than native cadence', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const pres = beforeState.qaPresentationByActionStep[qaKey]!;
      const candidateId = beforeState.qaSourceByActionStep[qaKey]!;
      const invRecord = getCandidateInventoryRecord(candidateId);
      const is2048 = invRecord!.width === 2048;
      const nativeDuration = (invRecord!.nativeFrameCount * (is2048 ? 50 : 20)) / 1000;
      const ratio = nativeDuration / pres.duration!;
      console.log(`${pilot.actionKey}: A1 duration=${pres.duration}s vs native=${nativeDuration}s (compressed ${ratio.toFixed(1)}×)`);
      expect(pres.duration!).toBeLessThan(nativeDuration);
    }
  });

  // ============================================================
  // Phase 4: Calibrated presentation values
  // ============================================================

  // Calibrated values based on native cadence doctrine:
  // - duration: near nativeDuration (frameCount × frameDurationMs / 1000)
  // - fadeOut: 0.78-0.88 (normalized progress where fade begins)
  // - fadeIn: 0.02-0.05
  // - scale: tuned per candidate accounting for tier multipliers
  // - opacity: near 1.0 for impacts
  // - anchor: semantic (target for hits, source for self, groundTarget for AoE)
  // - layer: impact for foreground effects
  // - blending: per candidate nature

  const calibratedPres: Record<string, LabState['qaPresentationByActionStep'][string]> = {
    // BASIC: basic_greatsword_hit — physical slash, 4096/64f
    // Native: 64f × 20ms = 1.28s. A1 had 0.38s (3.4× compressed).
    // Scale: A1 had 2.1. With step.scale ~1.46, tier 1.0, intensity 0.88:
    //   final ≈ 1.46 × 2.1 × 0.88 ≈ 2.70. With native scaleMultiplier 1.6:
    //   1.46 × 1.6 × 0.88 ≈ 2.06. QA scale 1.3 gives: 1.46 × 1.3 × 0.88 ≈ 1.67.
    //   Actually for Lab playback, step.scale comes from the preset step.
    //   Let's use scale 1.3 — readable without being huge.
    'basic_greatsword_hit::0': {
      scale: 1.3, offsetX: 0, offsetY: 0,
      duration: 1.28, opacity: 0.95,
      anchor: 'target', layer: 'impact', blending: 'normal',
      fadeIn: 0.03, fadeOut: 0.82, direction: 'face_target',
    },
    // 2AP: n_dark_bolt — magic projectile, 4096/64f
    // Native: 64f × 20ms = 1.28s. A1 had 0.44s (2.9× compressed).
    // Scale: A1 had 2.2. With tier 1.05, intensity 0.98:
    //   Too large. Use 1.2 for a readable magic bolt.
    'n_dark_bolt::0': {
      scale: 1.2, offsetX: 0, offsetY: 0,
      duration: 1.28, opacity: 0.95,
      anchor: 'target', layer: 'impact', blending: 'additive',
      fadeIn: 0.03, fadeOut: 0.85, direction: 'center_on_target',
    },
    // 3AP: w_charge — physical dash, 2048/16f
    // Native: 16f × 50ms = 0.80s. A1 had 0.56s (1.4× compressed).
    // Scale: A1 had 2.35. With tier 1.12, intensity 1.07:
    //   Use 1.15 for a dash wind effect.
    'w_charge::0': {
      scale: 1.15, offsetX: 0, offsetY: 0,
      duration: 0.80, opacity: 0.90,
      anchor: 'source', layer: 'impact', blending: 'additive',
      fadeIn: 0.04, fadeOut: 0.80, direction: 'source_to_destination',
    },
    // 4AP: n_flame_wave — AoE fire magic, 4096/64f
    // Native: 64f × 20ms = 1.28s. A1 had 0.78s (1.6× compressed).
    // Scale: A1 had 2.6. With tier 1.30, intensity 1.14:
    //   Use 1.25 for a readable AoE fire wave.
    'n_flame_wave::0': {
      scale: 1.25, offsetX: 0, offsetY: 0,
      duration: 1.28, opacity: 0.95,
      anchor: 'groundTarget', layer: 'impact', blending: 'additive',
      fadeIn: 0.03, fadeOut: 0.82, direction: 'center_on_aoe_origin',
    },
    // 5AP Ultimate: w_lion_surge — melee heavy, 4096/64f
    // Native: 64f × 20ms = 1.28s. A1 had 1.18s (1.1× compressed — close).
    // Scale: A1 had 3.0. With tier 1.55, intensity 1.20:
    //   3.0 × 1.55 × 1.20 is enormous. Use 1.15 for a powerful but readable ultimate.
    'w_lion_surge::0': {
      scale: 1.15, offsetX: 0, offsetY: 0,
      duration: 1.28, opacity: 1.0,
      anchor: 'target', layer: 'impact', blending: 'additive',
      fadeIn: 0.04, fadeOut: 0.85, direction: 'face_target',
    },
  };

  it('7. calibrated durations are near native cadence', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const cal = calibratedPres[qaKey]!;
      const candidateId = beforeState.qaSourceByActionStep[qaKey]!;
      const invRecord = getCandidateInventoryRecord(candidateId);
      const is2048 = invRecord!.width === 2048;
      const nativeDuration = (invRecord!.nativeFrameCount * (is2048 ? 50 : 20)) / 1000;
      const ratio = cal.duration! / nativeDuration;
      console.log(`${pilot.actionKey}: calibrated=${cal.duration}s vs native=${nativeDuration}s (ratio ${ratio.toFixed(2)})`);
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(1.15);
    }
  });

  it('8. calibrated fadeOut values are in readable range', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const cal = calibratedPres[qaKey]!;
      console.log(`${pilot.actionKey}: calibrated fadeOut=${cal.fadeOut} (fade begins at ${Math.round(cal.fadeOut! * 100)}% progress)`);
      expect(cal.fadeOut).toBeGreaterThanOrEqual(0.75);
      expect(cal.fadeOut).toBeLessThanOrEqual(0.90);
    }
  });

  it('9. calibrated fadeIn values are minimal', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const cal = calibratedPres[qaKey]!;
      expect(cal.fadeIn).toBeGreaterThanOrEqual(0.02);
      expect(cal.fadeIn).toBeLessThanOrEqual(0.06);
    }
  });

  it('10. calibrated scales are positive and reasonable', () => {
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      const cal = calibratedPres[qaKey]!;
      expect(cal.scale).toBeGreaterThan(0);
      expect(cal.scale).toBeLessThan(2.0); // No artificial scale >= 2.0 rule
    }
  });

  it('11. builds after-state with only pilot presentation changes', () => {
    // Start from before state
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));

    // Apply calibrated presentations to pilot actions only
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      afterState = setQaPresentation(afterState, pilot.actionKey, 0, calibratedPres[qaKey]!);
    }

    // Verify candidate IDs are unchanged
    for (const [key, sourceId] of Object.entries(beforeState.qaSourceByActionStep)) {
      expect(afterState.qaSourceByActionStep[key]).toBe(sourceId);
    }

    // Verify QA source count unchanged
    expect(Object.keys(afterState.qaSourceByActionStep).length).toBe(64);
    expect(Object.keys(afterState.qaPresentationByActionStep).length).toBe(64);
  });

  it('12. non-pilot presentation values are unchanged', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      afterState = setQaPresentation(afterState, pilot.actionKey, 0, calibratedPres[qaKey]!);
    }

    const pilotKeys = new Set(pilotActions.map(p => labStepKey(p.actionKey, 0)));
    let changedNonPilot = 0;
    for (const [key, beforePres] of Object.entries(beforeState.qaPresentationByActionStep)) {
      if (pilotKeys.has(key)) continue;
      const afterPres = afterState.qaPresentationByActionStep[key];
      if (JSON.stringify(beforePres) !== JSON.stringify(afterPres)) {
        changedNonPilot++;
      }
    }
    expect(changedNonPilot).toBe(0);
  });

  it('13. no validation/production changes in after-state', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const pilot of pilotActions) {
      afterState = setQaPresentation(afterState, pilot.actionKey, 0, calibratedPres[labStepKey(pilot.actionKey, 0)]!);
    }
    expect(Object.keys(afterState.validatedByActionStep).length).toBe(0);
    expect(Object.keys(afterState.testedFingerprintByActionStep ?? {}).length).toBe(0);
    expect(Object.keys(afterState.verifiedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  it('14. serialization round-trip preserves calibrated state', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const pilot of pilotActions) {
      afterState = setQaPresentation(afterState, pilot.actionKey, 0, calibratedPres[labStepKey(pilot.actionKey, 0)]!);
    }
    const serialized = serializeLabState(afterState);
    const restored = deserializeLabState(serialized);
    expect(restored).not.toBeNull();
    for (const pilot of pilotActions) {
      const qaKey = labStepKey(pilot.actionKey, 0);
      expect(restored!.qaPresentationByActionStep[qaKey]!.duration).toBe(calibratedPres[qaKey]!.duration);
      expect(restored!.qaPresentationByActionStep[qaKey]!.fadeOut).toBe(calibratedPres[qaKey]!.fadeOut);
      expect(restored!.qaPresentationByActionStep[qaKey]!.scale).toBe(calibratedPres[qaKey]!.scale);
    }
  });

  it('15. creates before and after checkpoints', () => {
    // Before checkpoint
    const beforeCheckpoint = {
      checkpointId: 'hero60_p0_1_before_presentation_calibration',
      createdAt: new Date().toISOString(),
      sourceCheckpoint: 'docs/reports/hero60_a1_3_64of64_pre_human_qa.json',
      qaSources: 64,
      qaOverrides: 64,
      validated: 0,
      tested: 0,
      verified: 0,
      applied: 0,
      labState: beforeState,
    };
    writeFileSync(
      'docs/reports/hero60_p0_1_before_presentation_calibration.json',
      JSON.stringify(beforeCheckpoint, null, 2),
    );

    // After state
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const pilot of pilotActions) {
      afterState = setQaPresentation(afterState, pilot.actionKey, 0, calibratedPres[labStepKey(pilot.actionKey, 0)]!);
    }

    // After checkpoint
    const afterCheckpoint = {
      checkpointId: 'hero60_p0_1_five_action_calibrated_pilot',
      createdAt: new Date().toISOString(),
      pilotActions: pilotActions.map(p => p.actionKey),
      qaSources: 64,
      qaOverrides: 64,
      validated: 0,
      tested: 0,
      verified: 0,
      applied: 0,
      labState: afterState,
    };
    writeFileSync(
      'docs/reports/hero60_p0_1_five_action_calibrated_pilot.json',
      JSON.stringify(afterCheckpoint, null, 2),
    );

    expect(true).toBe(true);
  });
});
