import { describe, expect, it } from 'vitest';
import {
  getLabAction,
  getLabActions,
  createDefaultLabState,
  setQaSourceId,
  setQaPresentation,
  setSelectedStep,
  getSelectedVisualStepIndex,
  getVisualSpriteSheetSteps,
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
  clearProductionTested,
  canConfirmProductionVerified,
  getArtisticState,
  getProductionState,
  getNextRequiredAction,
  serializeLabState,
  deserializeLabState,
  labStepKey,
} from './CombatVfxLab';
import type { LabState, LabAction, ArtisticState, ProductionState } from './CombatVfxLab';

// ============================================================ Helpers

const SINGLE_VFX_ACTION = 'w_break_guard';

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

function getActionWithDifferentSource(): { action: LabAction; stepIdx: number; altSource: string } {
  const action = getFirstActionWithVfx();
  const stepIdx = getFirstVisualStep(action);
  const step = action.vfxSteps[stepIdx];
  const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
  return { action, stepIdx, altSource: prodSource + '_alt' };
}

function setupValidatedNotApplied(): { state: LabState; action: LabAction; stepIdx: number } {
  const { action, stepIdx, altSource } = getActionWithDifferentSource();
  let state = createDefaultLabState();
  state = setQaSourceId(state, action.actionKey, stepIdx, altSource);
  const result = validateStepConfiguration(state, action, stepIdx);
  expect(result.ok).toBe(true);
  state = result.state;
  return { state, action, stepIdx };
}

function setupAppliedNotTested(): { state: LabState; action: LabAction; stepIdx: number } {
  const { state, action, stepIdx } = setupValidatedNotApplied();
  // Simulate production being updated to match validated
  // Since we can't modify production in tests, we use the action where
  // QA source matches production source (so validation == production)
  let s = createDefaultLabState();
  const a = getFirstActionWithVfx();
  const si = getFirstVisualStep(a);
  const step = a.vfxSteps[si];
  const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
  // Set QA to production source, validate → production matches validated
  s = setQaSourceId(s, a.actionKey, si, prodSource);
  const result = validateStepConfiguration(s, a, si);
  expect(result.ok).toBe(true);
  s = result.state;
  return { state: s, action: a, stepIdx: si };
}

// ============================================================ Tests

describe('R2C-LAB V1E.1B — Dual-Dimension State Model', () => {

  // ============================================================ Artistic State

  describe('Artistic State Derivation', () => {
    it('1. returns UNCONFIGURED when no QA config and no validation', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      expect(getArtisticState(state, action, stepIdx)).toBe('UNCONFIGURED');
    });

    it('2. returns QA_WORKING when QA source set but not validated', () => {
      const { action, stepIdx, altSource } = getActionWithDifferentSource();
      let state = createDefaultLabState();
      state = setQaSourceId(state, action.actionKey, stepIdx, altSource);
      expect(getArtisticState(state, action, stepIdx)).toBe('QA_WORKING');
    });

    it('3. returns VALIDATED when validated and QA matches validated', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      expect(getArtisticState(state, action, stepIdx)).toBe('VALIDATED');
    });

    it('4. returns VALIDATED_QA_MODIFIED when validated but QA changed since', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      // Modify QA after validation
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      const newState = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_modified');
      expect(getArtisticState(newState, action, stepIdx)).toBe('VALIDATED_QA_MODIFIED');
    });

    it('5. returns UNCONFIGURED for non-spriteSheet steps', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      // Find a non-spriteSheet step if any
      const nonVisualStep = action.vfxSteps.findIndex(s => s.stepType !== 'spriteSheet');
      if (nonVisualStep >= 0) {
        expect(getArtisticState(state, action, nonVisualStep)).toBe('UNCONFIGURED');
      }
    });
  });

  // ============================================================ Production State

  describe('Production State Derivation', () => {
    it('6. returns NOT_APPLIED when no validated config', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      expect(getProductionState(state, action, stepIdx)).toBe('NOT_APPLIED');
    });

    it('7. returns NOT_APPLIED when validated but production does not match', () => {
      const { state, action, stepIdx } = setupValidatedNotApplied();
      expect(getProductionState(state, action, stepIdx)).toBe('NOT_APPLIED');
    });

    it('8. returns APPLIED_NOT_TESTED when production matches validated but no test', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      expect(getProductionState(state, action, stepIdx)).toBe('APPLIED_NOT_TESTED');
    });

    it('9. returns TESTED_NOT_CONFIRMED after production test recorded', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      expect(getProductionState(testedState, action, stepIdx)).toBe('TESTED_NOT_CONFIRMED');
    });

    it('10. returns VERIFIED after confirmProductionVerified with prior test', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const verifiedState = confirmProductionVerified(testedState, action, stepIdx);
      expect(getProductionState(verifiedState, action, stepIdx)).toBe('VERIFIED');
    });

    it('11. returns DRIFT when production changes after verification', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const verifiedState = confirmProductionVerified(testedState, action, stepIdx);
      // Simulate production drift by clearing verified fingerprint and checking
      // with a different state that has old verifiedFp but production changed
      // Since we can't change production in tests, we test the DRIFT path by
      // having a verifiedFp that doesn't match current production
      const key = labStepKey(action.actionKey, stepIdx);
      const driftedState: LabState = {
        ...verifiedState,
        verifiedFingerprintByActionStep: {
          ...(verifiedState.verifiedFingerprintByActionStep ?? {}),
          [key]: 'old-fingerprint-that-doesnt-match',
        },
      };
      expect(getProductionState(driftedState, action, stepIdx)).toBe('DRIFT');
    });
  });

  // ============================================================ Production Test Tracking

  describe('Production Test Tracking', () => {
    it('12. recordProductionTested stores current production fingerprint', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      const prodConfig = getProductionVisualConfig(action, stepIdx);
      expect(prodConfig).toBeDefined();
      const expectedFp = computeConfigFingerprint(prodConfig!);
      expect(testedState.testedFingerprintByActionStep?.[key]).toBe(expectedFp);
    });

    it('13. clearProductionTested removes the tested fingerprint', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      expect(testedState.testedFingerprintByActionStep?.[key]).toBeDefined();
      const clearedState = clearProductionTested(testedState, action.actionKey, stepIdx);
      expect(clearedState.testedFingerprintByActionStep?.[key]).toBeUndefined();
    });

    it('14. canConfirmProductionVerified returns false without prior test', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      expect(canConfirmProductionVerified(state, action, stepIdx)).toBe(false);
    });

    it('15. canConfirmProductionVerified returns true after production test', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      expect(canConfirmProductionVerified(testedState, action, stepIdx)).toBe(true);
    });

    it('16. confirmProductionVerified is a no-op without prior test', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const result = confirmProductionVerified(state, action, stepIdx);
      // State should be unchanged — no verifiedFingerprint set
      const key = labStepKey(action.actionKey, stepIdx);
      expect(result.verifiedFingerprintByActionStep?.[key]).toBeUndefined();
    });
  });

  // ============================================================ Revalidation Clears Stale Records

  describe('Revalidation Clears Stale Records', () => {
    it('17. revalidation clears testedFingerprint', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      expect(testedState.testedFingerprintByActionStep?.[key]).toBeDefined();
      // Revalidate
      const result = validateStepConfiguration(testedState, action, stepIdx);
      expect(result.ok).toBe(true);
      expect(result.state.testedFingerprintByActionStep?.[key]).toBeUndefined();
    });

    it('18. revalidation clears verifiedFingerprint', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const verifiedState = confirmProductionVerified(testedState, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      expect(verifiedState.verifiedFingerprintByActionStep?.[key]).toBeDefined();
      // Revalidate
      const result = validateStepConfiguration(verifiedState, action, stepIdx);
      expect(result.ok).toBe(true);
      expect(result.state.verifiedFingerprintByActionStep?.[key]).toBeUndefined();
    });

    it('19. clearValidation clears testedFingerprint and verifiedFingerprint', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const verifiedState = confirmProductionVerified(testedState, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      expect(verifiedState.testedFingerprintByActionStep?.[key]).toBeDefined();
      expect(verifiedState.verifiedFingerprintByActionStep?.[key]).toBeDefined();
      const clearedState = clearValidation(verifiedState, action.actionKey, stepIdx);
      expect(clearedState.testedFingerprintByActionStep?.[key]).toBeUndefined();
      expect(clearedState.verifiedFingerprintByActionStep?.[key]).toBeUndefined();
    });
  });

  // ============================================================ Next Required Action

  describe('Next Required Action Instructions', () => {
    it('20. returns SELECT OR CONFIGURE for UNCONFIGURED', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      const next = getNextRequiredAction(state, action, stepIdx);
      expect(next.artistic).toBe('UNCONFIGURED');
      expect(next.instruction).toContain('SELECT');
    });

    it('21. returns PLAY QA for QA_WORKING', () => {
      const { action, stepIdx, altSource } = getActionWithDifferentSource();
      let state = createDefaultLabState();
      state = setQaSourceId(state, action.actionKey, stepIdx, altSource);
      const next = getNextRequiredAction(state, action, stepIdx);
      expect(next.artistic).toBe('QA_WORKING');
      expect(next.instruction).toContain('PLAY QA');
    });

    it('22. returns APPLY for VALIDATED + NOT_APPLIED', () => {
      const { state, action, stepIdx } = setupValidatedNotApplied();
      const next = getNextRequiredAction(state, action, stepIdx);
      expect(next.artistic).toBe('VALIDATED');
      expect(next.production).toBe('NOT_APPLIED');
      expect(next.instruction).toContain('APPLY');
    });

    it('23. returns TEST PRODUCTION for APPLIED_NOT_TESTED', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const next = getNextRequiredAction(state, action, stepIdx);
      expect(next.production).toBe('APPLIED_NOT_TESTED');
      expect(next.instruction).toContain('TEST PRODUCTION');
    });

    it('24. returns CONFIRM for TESTED_NOT_CONFIRMED', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const next = getNextRequiredAction(testedState, action, stepIdx);
      expect(next.production).toBe('TESTED_NOT_CONFIRMED');
      expect(next.instruction).toContain('CONFIRM');
    });

    it('25. returns READY for VERIFIED', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const verifiedState = confirmProductionVerified(testedState, action, stepIdx);
      const next = getNextRequiredAction(verifiedState, action, stepIdx);
      expect(next.production).toBe('VERIFIED');
      expect(next.instruction).toContain('READY');
    });
  });

  // ============================================================ Serialization

  describe('Serialization Round-Trip', () => {
    it('26. testedFingerprintByActionStep survives serialize/deserialize', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const testedState = recordProductionTested(state, action, stepIdx);
      const key = labStepKey(action.actionKey, stepIdx);
      const expectedFp = testedState.testedFingerprintByActionStep?.[key];
      expect(expectedFp).toBeDefined();

      const json = serializeLabState(testedState);
      const restored = deserializeLabState(json);
      expect(restored).not.toBeNull();
      expect(restored!.testedFingerprintByActionStep?.[key]).toBe(expectedFp);
    });

    it('27. deserializeLabState handles missing testedFingerprintByActionStep gracefully', () => {
      const state = createDefaultLabState();
      // Manually serialize without testedFingerprintByActionStep
      const json = JSON.stringify({
        ...state,
        testedFingerprintByActionStep: undefined,
      });
      const restored = deserializeLabState(json);
      expect(restored).not.toBeNull();
      expect(restored!.testedFingerprintByActionStep).toEqual({});
    });
  });

  // ============================================================ Immutability

  describe('Validated Snapshot Immutability', () => {
    it('28. validated snapshot source does not change when QA changes', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const validatedBefore = getValidatedConfig(state, action.actionKey, stepIdx);
      expect(validatedBefore).toBeDefined();
      const sourceBefore = validatedBefore!.sourceId;

      // Modify QA source
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      const newState = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_changed');

      const validatedAfter = getValidatedConfig(newState, action.actionKey, stepIdx);
      expect(validatedAfter).toBeDefined();
      expect(validatedAfter!.sourceId).toBe(sourceBefore);
    });

    it('29. restoreValidated resets QA to match validated snapshot', () => {
      const { state, action, stepIdx } = setupAppliedNotTested();
      const validated = getValidatedConfig(state, action.actionKey, stepIdx);
      expect(validated).toBeDefined();

      // Modify QA
      const step = action.vfxSteps[stepIdx];
      const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId ?? '';
      let modifiedState = setQaSourceId(state, action.actionKey, stepIdx, prodSource + '_modified');

      // Verify artistic state is VALIDATED_QA_MODIFIED
      expect(getArtisticState(modifiedState, action, stepIdx)).toBe('VALIDATED_QA_MODIFIED');

      // Restore
      const restoredState = restoreValidated(modifiedState, action, stepIdx);
      expect(getArtisticState(restoredState, action, stepIdx)).toBe('VALIDATED');
    });
  });

  // ============================================================ Backward Compatibility

  describe('Backward Compatibility with V1E Lifecycle', () => {
    it('30. getLifecycleStatus still works alongside dual-dimension model', () => {
      const state = createDefaultLabState();
      const action = getFirstActionWithVfx();
      const stepIdx = getFirstVisualStep(action);
      // V1E lifecycle should still return UNCONFIGURED
      expect(getLifecycleStatus(state, action, stepIdx)).toBe('UNCONFIGURED');
      // V1E.1B artistic state should also return UNCONFIGURED
      expect(getArtisticState(state, action, stepIdx)).toBe('UNCONFIGURED');
    });
  });
});
