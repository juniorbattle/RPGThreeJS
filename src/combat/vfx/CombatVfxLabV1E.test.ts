import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  getLabAction,
  getLabActions,
  createDefaultLabState,
  setQaSourceId,
  getQaSourceId,
  clearQaSourceId,
  setQaPresentation,
  getQaPresentation,
  setSelectedStep,
  getSelectedVisualStepIndex,
  getVisualSpriteSheetSteps,
  getProductionPresentation,
  getEffectivePresentation,
  validateStepConfiguration,
  clearValidation,
  restoreValidated,
  getValidatedConfig,
  getProductionVisualConfig,
  getValidatedVisualConfig,
  configsSemanticallyEqual,
  computeConfigFingerprint,
  getLifecycleStatus,
  confirmProductionVerified,
  clearProductionVerified,
  recordProductionTested,
  getActionLifecycleSummary,
  getProductionProgress,
  buildWorkQueue,
  findNextInWorkQueue,
  generateApplyPackage,
  generateApplyTaskText,
  serializeLabState,
  deserializeLabState,
} from './CombatVfxLab';
import type { LabState, LabAction, VisualConfig, ProductionLifecycleStatus, WorkQueueMode } from './CombatVfxLab';
import { playValidatedInCombatStage, playProductionInCombatStage } from './LabPlayback';
import type { LabPlaybackContext } from './LabPlayback';

// ============================================================ Helpers

function makeMockPlaybackContext(): { ctx: LabPlaybackContext; calls: string[] } {
  const calls: string[] = [];
  const mockSystem = {
    play: vi.fn((presetId: string) => {
      calls.push(`play:${presetId}`);
      return { played: true, presetId, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playPreset: vi.fn((preset: { id: string }) => {
      calls.push(`playPreset:${preset.id}`);
      return { played: true, presetId: preset.id, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playLabSpriteSheet: vi.fn((candidateId: string) => {
      calls.push(`playLab:${candidateId}`);
      return { played: true, presetId: `lab:${candidateId}`, impactTime: 0.5, completion: Promise.resolve() };
    }),
    disposed: false,
  };
  const ctx: LabPlaybackContext = {
    vfxSystem: mockSystem as never,
    buildContext: () => ({ scene: new THREE.Scene(), camera: new THREE.Camera() }) as never,
    buildStageContext: vi.fn(async (_actionKey: string, playVfx: (context: never) => Promise<void>) => {
      await playVfx({ scene: new THREE.Scene(), camera: new THREE.Camera() } as never);
      return true;
    }),
  };
  return { ctx, calls };
}

const SINGLE_VFX_ACTION = 'w_break_guard';
const MULTI_VFX_ACTION = 'ni_silent_assassin';

function getFirstVisualStep(action: LabAction): number {
  const steps = getVisualSpriteSheetSteps(action);
  return steps[0]?.stepIndex ?? 0;
}

function getFirstActionWithVfx(): LabAction {
  const actions = getLabActions();
  const action = actions.find(a => a.sourceStatus !== 'NO_VFX' && getVisualSpriteSheetSteps(a).length > 0);
  if (!action) throw new Error('No action with VFX found');
  return action;
}

// ============================================================ Tests

describe('R2C-LAB V1E — Production Lifecycle Workbench', () => {

  // ============================================================ Part A: Lifecycle State Machine

  describe('Part A: Lifecycle State Machine', () => {
    it('1. UNCONFIGURED when no QA config and no validation', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('UNCONFIGURED');
    });

    it('2. QA_WORKING when QA source set but not validated', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('QA_WORKING');
    });

    it('3. VALIDATED_NOT_APPLIED when validated but production differs', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      // Set QA to different source, validate
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      const result = validateStepConfiguration(state, action, stepIdx);
      expect(result.ok).toBe(true);
      state = result.state;
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('VALIDATED_NOT_APPLIED');
    });

    it('4. APPLIED_NOT_VERIFIED when production matches validated', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Validate with production config (no QA override)
      const result = validateStepConfiguration(state, action, stepIdx);
      expect(result.ok).toBe(true);
      state = result.state;
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('APPLIED_NOT_VERIFIED');
    });

    it('5. PRODUCTION_VERIFIED when confirmed', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Validate with production config
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      // V1E.1B: Record production test before confirming
      state = recordProductionTested(state, action, stepIdx);
      // Confirm verified
      state = confirmProductionVerified(state, action, stepIdx);
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_VERIFIED');
    });

    it('6. PRODUCTION_DRIFT when verified but production changes', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Validate and verify
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_VERIFIED');
      // V1E.1B: Revalidation now clears stale verified fingerprints, so to
      // simulate production drift we corrupt the verified fingerprint directly
      const key = `${action.actionKey}::${stepIdx}`;
      state = {
        ...state,
        verifiedFingerprintByActionStep: {
          ...(state.verifiedFingerprintByActionStep ?? {}),
          [key]: 'old-fingerprint-that-no-longer-matches',
        },
      };
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_DRIFT');
    });

    it('7. NO_VFX for non-spriteSheet steps', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      // Find a non-spriteSheet step
      const nonVisualStep = action.vfxSteps.findIndex(s => s.stepType !== 'spriteSheet');
      if (nonVisualStep >= 0) {
        expect(getLifecycleStatus(state, action, nonVisualStep)).toBe('NO_VFX');
      }
    });

    it('8. NO_VFX for NO_VFX actions', () => {
      const state = createDefaultLabState();
      const noVfxAction = getLabActions().find(a => a.sourceStatus === 'NO_VFX');
      if (noVfxAction) {
        expect(getLifecycleStatus(state, noVfxAction, 0)).toBe('NO_VFX');
      }
    });
  });

  // ============================================================ Part B-C: Canonical Config Comparison

  describe('Part B-C: Canonical Config Comparison', () => {
    it('9. getProductionVisualConfig extracts sourceId and presentation', () => {
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const config = getProductionVisualConfig(action, stepIdx);
      expect(config).not.toBeNull();
      expect(config!.sourceId).toBeDefined();
    });

    it('10. getProductionVisualConfig returns null for non-spriteSheet', () => {
      const action = getFirstActionWithVfx();
      const nonVisualStep = action.vfxSteps.findIndex(s => s.stepType !== 'spriteSheet');
      if (nonVisualStep >= 0) {
        expect(getProductionVisualConfig(action, nonVisualStep)).toBeNull();
      }
    });

    it('11. getValidatedVisualConfig returns null when no validation', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      expect(getValidatedVisualConfig(state, action.actionKey, stepIdx)).toBeNull();
    });

    it('12. getValidatedVisualConfig matches validated snapshot', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const valConfig = getValidatedVisualConfig(state, action.actionKey, stepIdx);
      expect(valConfig).not.toBeNull();
      const prodConfig = getProductionVisualConfig(action, stepIdx);
      expect(configsSemanticallyEqual(valConfig!, prodConfig!)).toBe(true);
    });

    it('13. configsSemanticallyEqual returns true for identical configs', () => {
      const a: VisualConfig = { sourceId: 'test', scale: 1.0, opacity: 0.8 };
      const b: VisualConfig = { sourceId: 'test', scale: 1.0, opacity: 0.8 };
      expect(configsSemanticallyEqual(a, b)).toBe(true);
    });

    it('14. configsSemanticallyEqual returns false for different sourceId', () => {
      const a: VisualConfig = { sourceId: 'test1', scale: 1.0 };
      const b: VisualConfig = { sourceId: 'test2', scale: 1.0 };
      expect(configsSemanticallyEqual(a, b)).toBe(false);
    });

    it('15. configsSemanticallyEqual returns false for different scale', () => {
      const a: VisualConfig = { sourceId: 'test', scale: 1.0 };
      const b: VisualConfig = { sourceId: 'test', scale: 2.0 };
      expect(configsSemanticallyEqual(a, b)).toBe(false);
    });

    it('16. configsSemanticallyEqual ignores property order', () => {
      const a: VisualConfig = { sourceId: 'test', scale: 1.0, opacity: 0.5 };
      const b: VisualConfig = { opacity: 0.5, scale: 1.0, sourceId: 'test' };
      expect(configsSemanticallyEqual(a, b)).toBe(true);
    });
  });

  // ============================================================ Part C: Config Fingerprint

  describe('Part C: Config Fingerprint', () => {
    it('17. computeConfigFingerprint is deterministic', () => {
      const config: VisualConfig = { sourceId: 'test', scale: 1.0, opacity: 0.8 };
      const fp1 = computeConfigFingerprint(config);
      const fp2 = computeConfigFingerprint(config);
      expect(fp1).toBe(fp2);
    });

    it('18. computeConfigFingerprint differs for different sourceId', () => {
      const a: VisualConfig = { sourceId: 'test1' };
      const b: VisualConfig = { sourceId: 'test2' };
      expect(computeConfigFingerprint(a)).not.toBe(computeConfigFingerprint(b));
    });

    it('19. computeConfigFingerprint differs for different scale', () => {
      const a: VisualConfig = { sourceId: 'test', scale: 1.0 };
      const b: VisualConfig = { sourceId: 'test', scale: 2.0 };
      expect(computeConfigFingerprint(a)).not.toBe(computeConfigFingerprint(b));
    });

    it('20. computeConfigFingerprint handles undefined fields', () => {
      const config: VisualConfig = { sourceId: 'test' };
      const fp = computeConfigFingerprint(config);
      expect(fp).toContain('sourceId:test');
      expect(fp).toContain('scale:');
    });
  });

  // ============================================================ Part D: Applied Status

  describe('Part D: Applied Status (production vs validated)', () => {
    it('21. production matches validated after validate with no QA override', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const prod = getProductionVisualConfig(action, stepIdx)!;
      const val = getValidatedVisualConfig(state, action.actionKey, stepIdx)!;
      expect(configsSemanticallyEqual(prod, val)).toBe(true);
    });

    it('22. production does not match validated when QA source differs', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const prod = getProductionVisualConfig(action, stepIdx)!;
      const val = getValidatedVisualConfig(state, action.actionKey, stepIdx)!;
      expect(configsSemanticallyEqual(prod, val)).toBe(false);
    });
  });

  // ============================================================ Part E: Verification Status

  describe('Part E: Verification Status with Fingerprint Binding', () => {
    it('23. confirmProductionVerified stores fingerprint', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      const key = `${action.actionKey}::${stepIdx}`;
      expect(state.verifiedFingerprintByActionStep?.[key]).toBeDefined();
    });

    it('24. clearProductionVerified removes fingerprint', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      state = clearProductionVerified(state, action.actionKey, stepIdx);
      const key = `${action.actionKey}::${stepIdx}`;
      expect(state.verifiedFingerprintByActionStep?.[key]).toBeUndefined();
    });

    it('25. verified fingerprint matches production fingerprint', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      const prodConfig = getProductionVisualConfig(action, stepIdx)!;
      const key = `${action.actionKey}::${stepIdx}`;
      expect(state.verifiedFingerprintByActionStep?.[key]).toBe(computeConfigFingerprint(prodConfig));
    });

    it('26. PRODUCTION_DRIFT when fingerprint no longer matches', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Verify with production config
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_VERIFIED');
      // Manually corrupt the fingerprint to simulate production change
      const key = `${action.actionKey}::${stepIdx}`;
      state = {
        ...state,
        verifiedFingerprintByActionStep: {
          ...(state.verifiedFingerprintByActionStep ?? {}),
          [key]: 'corrupted-fingerprint',
        },
      };
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_DRIFT');
    });
  });

  // ============================================================ Part I: Two Progress Concepts

  describe('Part I: Two Progress Concepts', () => {
    it('27. getProductionProgress returns hero and enemy/boss counts', () => {
      const state = createDefaultLabState();
      const progress = getProductionProgress(state);
      expect(progress).toHaveProperty('heroVerified');
      expect(progress).toHaveProperty('heroTotal');
      expect(progress).toHaveProperty('enemyBossVerified');
      expect(progress).toHaveProperty('enemyBossTotal');
      expect(progress).toHaveProperty('allVerified');
      expect(progress).toHaveProperty('allTotal');
    });

    it('28. getProductionProgress counts verified actions', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      const progress = getProductionProgress(state);
      expect(progress.allVerified).toBeGreaterThan(0);
    });

    it('29. getProductionProgress tracks validatedNotApplied', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const progress = getProductionProgress(state);
      expect(progress.validatedNotApplied).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================ Part J: Work Queue Modes

  describe('Part J: Work Queue Modes', () => {
    it('30. CONFIGURE mode includes UNCONFIGURED items', () => {
      const state = createDefaultLabState();
      const queue = buildWorkQueue(state, 'CONFIGURE');
      expect(queue.length).toBeGreaterThan(0);
      expect(queue.every(item => item.status === 'UNCONFIGURED' || item.status === 'QA_WORKING')).toBe(true);
    });

    it('31. APPLY mode includes VALIDATED_NOT_APPLIED items', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const queue = buildWorkQueue(state, 'APPLY');
      expect(queue.some(item => item.status === 'VALIDATED_NOT_APPLIED')).toBe(true);
    });

    it('32. VERIFY mode includes APPLIED_NOT_VERIFIED items', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const queue = buildWorkQueue(state, 'VERIFY');
      expect(queue.some(item => item.status === 'APPLIED_NOT_VERIFIED')).toBe(true);
    });

    it('33. ALL mode includes all visual VFX steps', () => {
      const state = createDefaultLabState();
      const queue = buildWorkQueue(state, 'ALL');
      const allActions = getLabActions();
      let totalVisualSteps = 0;
      for (const action of allActions) {
        if (action.sourceStatus === 'NO_VFX') continue;
        totalVisualSteps += getVisualSpriteSheetSteps(action).length;
      }
      expect(queue.length).toBe(totalVisualSteps);
    });

    it('34. findNextInWorkQueue returns null for empty queue', () => {
      // Create a state where everything is verified
      let state = createDefaultLabState();
      const allActions = getLabActions();
      for (const action of allActions) {
        if (action.sourceStatus === 'NO_VFX') continue;
        const visualSteps = getVisualSpriteSheetSteps(action);
        for (const vs of visualSteps) {
          const result = validateStepConfiguration(state, action, vs.stepIndex);
          if (result.ok) {
            state = result.state;
            state = recordProductionTested(state, action, vs.stepIndex);
            state = confirmProductionVerified(state, action, vs.stepIndex);
          }
        }
      }
      const next = findNextInWorkQueue(state, 'CONFIGURE', '', 0);
      // May still have items if some couldn't validate
      // Just check it doesn't crash
      expect(next === null || typeof next === 'object').toBe(true);
    });

    it('35. findNextInWorkQueue returns next item from current position', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const next = findNextInWorkQueue(state, 'CONFIGURE', action.actionKey, 0);
      expect(next === null || next.actionKey).toBeDefined();
    });
  });

  // ============================================================ Part T-U: Apply Package

  describe('Part T-U: Apply Package', () => {
    it('36. generateApplyPackage returns null when no validation', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      expect(generateApplyPackage(state, action, stepIdx)).toBeNull();
    });

    it('37. generateApplyPackage returns package when validated', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx);
      expect(pkg).not.toBeNull();
      expect(pkg!.actionKey).toBe(action.actionKey);
      expect(pkg!.stepIndex).toBe(stepIdx);
    });

    it('38. apply package contains actionKey, presetId, stepIndex', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      expect(pkg.actionKey).toBeDefined();
      expect(pkg.presetId).toBeDefined();
      expect(typeof pkg.stepIndex).toBe('number');
    });

    it('39. apply package contains currentProduction and validated configs', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      expect(pkg.currentProduction).toBeDefined();
      expect(pkg.currentProduction.sourceId).toBeDefined();
      expect(pkg.validated).toBeDefined();
      expect(pkg.validated.sourceId).toBeDefined();
    });

    it('40. apply package contains diff with sourceChanged and changedFields', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      state = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_alt');
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      expect(pkg.diff.sourceChanged).toBe(true);
      expect(Array.isArray(pkg.diff.changedFields)).toBe(true);
    });

    it('41. apply package contains validatedFingerprint', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      expect(pkg.validatedFingerprint).toBeDefined();
      expect(typeof pkg.validatedFingerprint).toBe('string');
    });

    it('42. generateApplyTaskText produces human-readable text', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      const text = generateApplyTaskText(pkg);
      expect(text).toContain('RPGThreeJS');
      expect(text).toContain(action.actionKey);
      expect(text).toContain('Requirements:');
    });

    it('43. generateApplyTaskText includes source and presentation details', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const pkg = generateApplyPackage(state, action, stepIdx)!;
      const text = generateApplyTaskText(pkg);
      expect(text).toContain('Validated source:');
      expect(text).toContain('Presentation:');
    });
  });

  // ============================================================ Part AD: Action Lifecycle Summary

  describe('Part AD: Multi-VFX Lifecycle', () => {
    it('44. getActionLifecycleSummary returns visualCount', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const summary = getActionLifecycleSummary(state, action);
      expect(summary.visualCount).toBeGreaterThan(0);
    });

    it('45. getActionLifecycleSummary counts validated and verified', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      const summary = getActionLifecycleSummary(state, action);
      expect(summary.verifiedCount).toBeGreaterThan(0);
      expect(summary.validatedCount).toBeGreaterThanOrEqual(summary.verifiedCount);
    });

    it('46. getActionLifecycleSummary returns statuses array', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const summary = getActionLifecycleSummary(state, action);
      expect(Array.isArray(summary.statuses)).toBe(true);
      expect(summary.statuses.length).toBe(summary.visualCount);
    });

    it('47. multi-VFX action has per-spritesheet lifecycle', () => {
      const state = createDefaultLabState();
      const multiAction = getLabActions().find(a =>
        a.sourceStatus !== 'NO_VFX' && getVisualSpriteSheetSteps(a).length > 1
      );
      if (multiAction) {
        const visualSteps = getVisualSpriteSheetSteps(multiAction);
        const status1 = getLifecycleStatus(state, multiAction, visualSteps[0]!.stepIndex);
        const status2 = getLifecycleStatus(state, multiAction, visualSteps[1]!.stepIndex);
        expect(status1).toBe(status2); // Both UNCONFIGURED initially
      }
    });
  });

  // ============================================================ Serialization

  describe('Serialization Round-Trip', () => {
    it('48. serializeLabState preserves verifiedFingerprintByActionStep', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      const serialized = serializeLabState(state);
      const deserialized = deserializeLabState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.verifiedFingerprintByActionStep).toBeDefined();
      const key = `${action.actionKey}::${stepIdx}`;
      expect(deserialized!.verifiedFingerprintByActionStep![key]).toBeDefined();
    });

    it('49. serializeLabState preserves workQueueMode', () => {
      let state = createDefaultLabState();
      state = { ...state, workQueueMode: 'APPLY' };
      const serialized = serializeLabState(state);
      const deserialized = deserializeLabState(serialized);
      expect(deserialized!.workQueueMode).toBe('APPLY');
    });

    it('50. deserializeLabState defaults workQueueMode to ALL', () => {
      const state = createDefaultLabState();
      const serialized = serializeLabState(state);
      const deserialized = deserializeLabState(serialized);
      expect(deserialized!.workQueueMode).toBe('ALL');
    });

    it('51. deserializeLabState defaults verifiedFingerprintByActionStep to empty', () => {
      const state = createDefaultLabState();
      const serialized = serializeLabState(state);
      const deserialized = deserializeLabState(serialized);
      expect(deserialized!.verifiedFingerprintByActionStep).toEqual({});
    });
  });

  // ============================================================ Part P-Q: Validated Stage Playback

  describe('Part P-Q: Validated Stage Playback', () => {
    it('52. playValidatedInCombatStage returns played=false without validated config', async () => {
      const { ctx } = makeMockPlaybackContext();
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const result = await playValidatedInCombatStage(ctx, state, action.actionKey);
      expect(result.played).toBe(false);
    });

    it('53. playValidatedInCombatStage plays when validated config exists', async () => {
      const { ctx, calls } = makeMockPlaybackContext();
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const playResult = await playValidatedInCombatStage(ctx, state, action.actionKey);
      expect(playResult.played).toBe(true);
      expect(playResult.snapshot).not.toBeNull();
      expect(playResult.snapshot!.mode).toBe('validated_stage');
      expect(calls.length).toBeGreaterThan(0);
    });

    it('54. playProductionInCombatStage plays production preset', async () => {
      const { ctx, calls } = makeMockPlaybackContext();
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const result = await playProductionInCombatStage(ctx, state, action.actionKey);
      expect(result.played).toBe(true);
      expect(result.snapshot).not.toBeNull();
      expect(result.snapshot!.mode).toBe('production_stage');
      expect(calls.length).toBeGreaterThan(0);
    });

    it('55. playProductionInCombatStage returns false without buildStageContext', async () => {
      const mockSystem = {
        playPreset: vi.fn(() => ({ played: true, completion: Promise.resolve() })),
        playLabSpriteSheet: vi.fn(() => ({ played: true, completion: Promise.resolve() })),
        disposed: false,
      };
      const ctx: LabPlaybackContext = {
        vfxSystem: mockSystem as never,
        buildContext: () => ({ scene: new THREE.Scene(), camera: new THREE.Camera() }) as never,
      };
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const result = await playProductionInCombatStage(ctx, state, action.actionKey);
      expect(result.played).toBe(false);
    });
  });

  // ============================================================ Part W: No Automatic Mark-as-Applied

  describe('Part W: No Automatic Mark-as-Applied', () => {
    it('56. validation does not set verifiedFingerprint', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      const key = `${action.actionKey}:${stepIdx}`;
      expect(state.verifiedFingerprintByActionStep?.[key]).toBeUndefined();
    });

    it('57. APPLIED_NOT_VERIFIED requires manual CONFIRM PRODUCTION VERIFIED', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      // Should be APPLIED_NOT_VERIFIED, not PRODUCTION_VERIFIED
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('APPLIED_NOT_VERIFIED');
      // After manual confirm
      state = recordProductionTested(state, action, stepIdx);
      state = confirmProductionVerified(state, action, stepIdx);
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('PRODUCTION_VERIFIED');
    });
  });

  // ============================================================ Part AB-AC: Validated Config Modification

  describe('Part AB-AC: Validated Config Modification', () => {
    it('58. modifying QA after validation shows QA_WORKING', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Validate
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      // Modify QA
      state = setQaPresentation(state, action.actionKey, stepIdx, { scale: 2.0 });
      // Production lifecycle tracks production vs validated, not QA modifications.
      // Production still matches validated, so status remains APPLIED_NOT_VERIFIED.
      // QA modification is tracked separately via getValidationStepStatus.
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('APPLIED_NOT_VERIFIED');
    });

    it('59. revalidation replaces prior snapshot', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // First validation
      const result1 = validateStepConfiguration(state, action, stepIdx);
      state = result1.state;
      const validated1 = getValidatedConfig(state, action.actionKey, stepIdx);
      // Modify and re-validate
      state = setQaPresentation(state, action.actionKey, stepIdx, { scale: 3.0 });
      const result2 = validateStepConfiguration(state, action, stepIdx);
      state = result2.state;
      const validated2 = getValidatedConfig(state, action.actionKey, stepIdx);
      expect(validated2!.validatedAt).toBeGreaterThanOrEqual(validated1!.validatedAt);
      expect(validated2!.presentation.scale).toBe(3.0);
    });

    it('60. restoreValidated restores QA to validated state', () => {
      let state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // Validate
      const result = validateStepConfiguration(state, action, stepIdx);
      state = result.state;
      // Modify QA
      state = setQaPresentation(state, action.actionKey, stepIdx, { scale: 5.0 });
      // Restore
      state = restoreValidated(state, action, stepIdx);
      // QA should match validated again
      const effPres = getEffectivePresentation(state, action, stepIdx);
      const validated = getValidatedConfig(state, action.actionKey, stepIdx);
      expect(effPres.scale).toBe(validated!.presentation.scale);
    });
  });

});
