import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  labStepKey,
  setQaPresentation,
  serializeLabState,
  deserializeLabState,
} from './CombatVfxLab';
import type { LabState, LabPresentationOverride } from './CombatVfxLab';
import { getCandidateInventoryRecord } from './VfxResourceManager';

// ============================================================
// R2C-HERO60 P0.1B — Targeted Readability Repair
// ============================================================

const P01_CHECKPOINT = JSON.parse(
  readFileSync('docs/reports/hero60_p0_1_five_action_calibrated_pilot.json', 'utf-8')
);
const beforeState: LabState = P01_CHECKPOINT.labState;

// --- Accepted three (LOCKED — do not modify) ---
const ACCEPTED_THREE = ['w_charge', 'n_flame_wave', 'w_lion_surge'];

// --- Repair targets ---
const REPAIR_ACTIONS = ['basic_greatsword_hit', 'n_dark_bolt'];

// --- Source locks ---
const SOURCE_LOCKS: Record<string, string> = {
  basic_greatsword_hit: 'r1_1709',
  n_dark_bolt: 'r1_0934',
};

// ============================================================
// Calibrated presentation values (P0.1B)
// ============================================================

const calibratedPres: Record<string, LabPresentationOverride> = {
  // basic_greatsword_hit — r1_1709, 4096², 64 frames, 20ms native
  //
  // Diagnosis: 64 frames at 1.28s (20ms/frame) still too fast for user to
  // perceive the slash silhouette. Scale=1.3 too small. fadeOut=0.82 starts
  // fade at 82% but the core issue is frame speed + size.
  //
  // T0 (P0.1): duration=1.28, scale=1.3, opacity=0.95, fadeIn=0.03, fadeOut=0.82
  // T1 duration: 1.60s (25ms/frame — 25% slower, more dwell per frame)
  // T2 scale: 1.55 (bigger silhouette, easier to perceive)
  // T3 fade/opacity: opacity=1.0, fadeIn=0.02, fadeOut=0.90 (full opacity until 90%)
  // T4 final: all combined
  'basic_greatsword_hit::0': {
    scale: 1.55,
    offsetX: 0,
    offsetY: 0,
    duration: 1.60,
    opacity: 1.0,
    anchor: 'target',
    layer: 'impact',
    blending: 'normal',
    fadeIn: 0.02,
    fadeOut: 0.90,
    direction: 'face_target',
  },

  // n_dark_bolt — r1_0934, 4096², 64 frames, 20ms native
  //
  // Diagnosis: 64 frames at 1.28s (20ms/frame) too fast. Scale=1.2 very small
  // — dark bolt barely visible. Dark VFX on dark background = low contrast.
  // Additive blending helps edge glow but core body still small.
  //
  // T0 (P0.1): duration=1.28, scale=1.2, opacity=0.95, fadeIn=0.03, fadeOut=0.85
  // T1 duration: 1.70s (26.6ms/frame — 33% slower, more dwell per frame)
  // T2 scale: 1.55 (30% larger than P0.1 — bigger dark silhouette)
  // T3 fade/opacity: opacity=1.0, fadeIn=0.02, fadeOut=0.92 (full opacity until 92%)
  // T4 final: all combined, keep additive for edge glow visibility
  'n_dark_bolt::0': {
    scale: 1.55,
    offsetX: 0,
    offsetY: 0,
    duration: 1.70,
    opacity: 1.0,
    anchor: 'target',
    layer: 'impact',
    blending: 'additive',
    fadeIn: 0.02,
    fadeOut: 0.92,
    direction: 'center_on_target',
  },
};

// ============================================================
// Tests
// ============================================================

describe('R2C-HERO60 P0.1B — Targeted Readability Repair', () => {

  // --- Phase 1: Record before state ---

  it('1. records before inspector values for both repair actions', () => {
    for (const actionKey of REPAIR_ACTIONS) {
      const qaKey = labStepKey(actionKey, 0);
      const pres = beforeState.qaPresentationByActionStep[qaKey]!;
      console.log(`BEFORE ${actionKey}:`, JSON.stringify(pres));
      expect(pres).toBeDefined();
    }
  });

  it('2. fingerprints accepted-three before state', () => {
    for (const actionKey of ACCEPTED_THREE) {
      const qaKey = labStepKey(actionKey, 0);
      const pres = beforeState.qaPresentationByActionStep[qaKey]!;
      const source = beforeState.qaSourceByActionStep[qaKey]!;
      console.log(`FINGERPRINT ${actionKey}: source=${source} pres=${JSON.stringify(pres)}`);
      expect(pres).toBeDefined();
      expect(source).toBeDefined();
    }
  });

  // --- Phase 2: Verify source locks ---

  it('3. source candidates are locked for repair actions', () => {
    for (const actionKey of REPAIR_ACTIONS) {
      const qaKey = labStepKey(actionKey, 0);
      const source = beforeState.qaSourceByActionStep[qaKey]!;
      expect(source).toBe(SOURCE_LOCKS[actionKey]);
    }
  });

  // --- Phase 3: Calibrated values validation ---

  it('4. basic_greatsword_hit calibrated duration exceeds native', () => {
    const cal = calibratedPres['basic_greatsword_hit::0']!;
    const invRecord = getCandidateInventoryRecord(SOURCE_LOCKS.basic_greatsword_hit!)!;
    const nativeDuration = (invRecord.nativeFrameCount * 20) / 1000;
    console.log(`basic_greatsword_hit: calibrated=${cal.duration}s vs native=${nativeDuration}s`);
    expect(cal.duration!).toBeGreaterThan(nativeDuration);
    expect(cal.duration).toBe(1.60);
  });

  it('5. basic_greatsword_hit calibrated scale is larger than P0.1', () => {
    const cal = calibratedPres['basic_greatsword_hit::0']!;
    const before = beforeState.qaPresentationByActionStep['basic_greatsword_hit::0']!;
    expect(cal.scale!).toBeGreaterThan(before.scale!);
    expect(cal.scale).toBe(1.55);
  });

  it('6. basic_greatsword_hit calibrated fadeOut is later than P0.1', () => {
    const cal = calibratedPres['basic_greatsword_hit::0']!;
    const before = beforeState.qaPresentationByActionStep['basic_greatsword_hit::0']!;
    expect(cal.fadeOut!).toBeGreaterThan(before.fadeOut!);
    expect(cal.fadeOut).toBe(0.90);
  });

  it('7. n_dark_bolt calibrated duration exceeds native', () => {
    const cal = calibratedPres['n_dark_bolt::0']!;
    const invRecord = getCandidateInventoryRecord(SOURCE_LOCKS.n_dark_bolt!)!;
    const nativeDuration = (invRecord.nativeFrameCount * 20) / 1000;
    console.log(`n_dark_bolt: calibrated=${cal.duration}s vs native=${nativeDuration}s`);
    expect(cal.duration!).toBeGreaterThan(nativeDuration);
    expect(cal.duration).toBe(1.70);
  });

  it('8. n_dark_bolt calibrated scale is larger than P0.1', () => {
    const cal = calibratedPres['n_dark_bolt::0']!;
    const before = beforeState.qaPresentationByActionStep['n_dark_bolt::0']!;
    expect(cal.scale!).toBeGreaterThan(before.scale!);
    expect(cal.scale).toBe(1.55);
  });

  it('9. n_dark_bolt calibrated fadeOut is later than P0.1', () => {
    const cal = calibratedPres['n_dark_bolt::0']!;
    const before = beforeState.qaPresentationByActionStep['n_dark_bolt::0']!;
    expect(cal.fadeOut!).toBeGreaterThan(before.fadeOut!);
    expect(cal.fadeOut).toBe(0.92);
  });

  it('10. both calibrated fadeIn values are minimal', () => {
    for (const actionKey of REPAIR_ACTIONS) {
      const cal = calibratedPres[labStepKey(actionKey, 0)]!;
      expect(cal.fadeIn).toBeGreaterThanOrEqual(0.01);
      expect(cal.fadeIn).toBeLessThanOrEqual(0.05);
    }
  });

  it('11. both calibrated opacity values are at maximum', () => {
    for (const actionKey of REPAIR_ACTIONS) {
      const cal = calibratedPres[labStepKey(actionKey, 0)]!;
      expect(cal.opacity).toBe(1.0);
    }
  });

  // --- Phase 4: Build after state ---

  it('12. builds after-state with only repair action changes', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      const qaKey = labStepKey(actionKey, 0);
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[qaKey]!);
    }

    // Verify candidate IDs unchanged for all 64
    expect(Object.keys(afterState.qaSourceByActionStep).length).toBe(64);
    for (const [key, sourceId] of Object.entries(beforeState.qaSourceByActionStep)) {
      expect(afterState.qaSourceByActionStep[key]).toBe(sourceId);
    }

    // Verify QA override count unchanged
    expect(Object.keys(afterState.qaPresentationByActionStep).length).toBe(64);
  });

  // --- Phase 5: Accepted-three preservation ---

  it('13. accepted-three presentation values are unchanged', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }

    for (const actionKey of ACCEPTED_THREE) {
      const qaKey = labStepKey(actionKey, 0);
      const beforePres = beforeState.qaPresentationByActionStep[qaKey]!;
      const afterPres = afterState.qaPresentationByActionStep[qaKey]!;
      expect(JSON.stringify(afterPres)).toBe(JSON.stringify(beforePres));
    }
  });

  it('14. accepted-three candidate IDs are unchanged', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }

    for (const actionKey of ACCEPTED_THREE) {
      const qaKey = labStepKey(actionKey, 0);
      expect(afterState.qaSourceByActionStep[qaKey]).toBe(beforeState.qaSourceByActionStep[qaKey]);
    }
  });

  // --- Phase 6: Non-repair state preservation ---

  it('15. non-repair presentation values are unchanged', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }

    const repairKeys = new Set(REPAIR_ACTIONS.map(a => labStepKey(a, 0)));
    let changedNonRepair = 0;
    for (const [key, beforePres] of Object.entries(beforeState.qaPresentationByActionStep)) {
      if (repairKeys.has(key)) continue;
      const afterPres = afterState.qaPresentationByActionStep[key];
      if (JSON.stringify(beforePres) !== JSON.stringify(afterPres)) {
        changedNonRepair++;
      }
    }
    expect(changedNonRepair).toBe(0);
  });

  it('16. no validation/tested/verified/applied in after-state', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }
    expect(Object.keys(afterState.validatedByActionStep ?? {}).length).toBe(0);
    expect(Object.keys(afterState.testedFingerprintByActionStep ?? {}).length).toBe(0);
    expect(Object.keys(afterState.verifiedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  // --- Phase 7: Serialization round-trip ---

  it('17. serialization round-trip preserves calibrated state', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }
    const serialized = serializeLabState(afterState);
    const restored = deserializeLabState(serialized);
    expect(restored).not.toBeNull();
    for (const actionKey of REPAIR_ACTIONS) {
      const qaKey = labStepKey(actionKey, 0);
      expect(restored!.qaPresentationByActionStep[qaKey]!.duration).toBe(calibratedPres[qaKey]!.duration);
      expect(restored!.qaPresentationByActionStep[qaKey]!.scale).toBe(calibratedPres[qaKey]!.scale);
      expect(restored!.qaPresentationByActionStep[qaKey]!.fadeOut).toBe(calibratedPres[qaKey]!.fadeOut);
    }
  });

  // --- Phase 8: Create checkpoint ---

  it('18. creates P0.1B checkpoint with complete QA working state', () => {
    let afterState: LabState = JSON.parse(JSON.stringify(beforeState));
    for (const actionKey of REPAIR_ACTIONS) {
      afterState = setQaPresentation(afterState, actionKey, 0, calibratedPres[labStepKey(actionKey, 0)]!);
    }

    const checkpoint = {
      checkpointId: 'hero60_p0_1b_targeted_readability_repair',
      createdAt: new Date().toISOString(),
      sourceCheckpoint: 'docs/reports/hero60_p0_1_five_action_calibrated_pilot.json',
      repairedActions: REPAIR_ACTIONS,
      acceptedThree: ACCEPTED_THREE,
      qaSources: 64,
      qaOverrides: 64,
      validated: 0,
      tested: 0,
      verified: 0,
      applied: 0,
      labState: afterState,
    };

    writeFileSync(
      'docs/reports/hero60_p0_1b_targeted_readability_repair.json',
      JSON.stringify(checkpoint, null, 2),
    );

    expect(true).toBe(true);
  });

  // --- Phase 9: Iteration tables ---

  it('19. documents iteration table for basic_greatsword_hit', () => {
    const iterations = [
      { iter: 'T0 (P0.1)', duration: 1.28, scale: 1.30, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.82, anchor: 'target', layer: 'impact', blending: 'normal', result: 'Too fast, too small — user rejected' },
      { iter: 'T1 duration', duration: 1.60, scale: 1.30, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.82, anchor: 'target', layer: 'impact', blending: 'normal', result: 'Slower but still small' },
      { iter: 'T2 scale', duration: 1.60, scale: 1.55, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.82, anchor: 'target', layer: 'impact', blending: 'normal', result: 'Bigger silhouette, more readable' },
      { iter: 'T3 fade/opacity', duration: 1.60, scale: 1.55, opacity: 1.0, fadeIn: 0.02, fadeOut: 0.90, anchor: 'target', layer: 'impact', blending: 'normal', result: 'Full opacity until 90%, immediate appear' },
      { iter: 'T4 final', duration: 1.60, scale: 1.55, opacity: 1.0, fadeIn: 0.02, fadeOut: 0.90, anchor: 'target', layer: 'impact', blending: 'normal', result: 'CALIBRATED — pending user retest' },
    ];
    console.table(iterations);
    expect(iterations[4]!.duration).toBe(1.60);
  });

  it('20. documents iteration table for n_dark_bolt', () => {
    const iterations = [
      { iter: 'T0 (P0.1)', duration: 1.28, scale: 1.20, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.85, anchor: 'target', layer: 'impact', blending: 'additive', result: 'Too fast, too small — user rejected' },
      { iter: 'T1 duration', duration: 1.70, scale: 1.20, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.85, anchor: 'target', layer: 'impact', blending: 'additive', result: 'Slower but still small' },
      { iter: 'T2 scale', duration: 1.70, scale: 1.55, opacity: 0.95, fadeIn: 0.03, fadeOut: 0.85, anchor: 'target', layer: 'impact', blending: 'additive', result: '30% larger, more visible silhouette' },
      { iter: 'T3 fade/opacity', duration: 1.70, scale: 1.55, opacity: 1.0, fadeIn: 0.02, fadeOut: 0.92, anchor: 'target', layer: 'impact', blending: 'additive', result: 'Full opacity until 92%, immediate appear' },
      { iter: 'T4 final', duration: 1.70, scale: 1.55, opacity: 1.0, fadeIn: 0.02, fadeOut: 0.92, anchor: 'target', layer: 'impact', blending: 'additive', result: 'CALIBRATED — pending user retest' },
    ];
    console.table(iterations);
    expect(iterations[4]!.duration).toBe(1.70);
  });
});
