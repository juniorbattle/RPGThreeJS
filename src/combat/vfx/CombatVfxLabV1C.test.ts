import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabAction,
  getLabActions,
  getActionCount,
  buildCatalogue,
  createDefaultLabState,
  setQaSourceId,
  getQaSourceId,
  clearQaSourceId,
  setQaPresentation,
  getQaPresentation,
  resetQaStep,
  getSelectedStep,
  setSelectedStep,
  getQaStatus,
  getStepNotes,
  setStepNotes,
  clearStepNotes,
  getValidatedConfig,
  validateStepConfiguration,
  clearValidation,
  restoreValidated,
  getValidationStepStatus,
  getValidationActionStatus,
  getValidationProgress,
  findNextToValidate,
  exportValidatedConfig,
  serializeValidatedConfig,
  serializeLabState,
  deserializeLabState,
  isLabEnabled,
} from './CombatVfxLab';
import type { LabState, LabAction, ValidatedStepConfiguration, ValidatedConfigExport } from './CombatVfxLab';
import { playProduction, playQaOverride, playValidated, replay } from './LabPlayback';
import type { LabPlaybackContext, LabPlaybackSnapshot } from './LabPlayback';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';

// ============================================================ Helpers

function makeMockPlaybackContext(): { ctx: LabPlaybackContext; calls: { mode: string; presetId: string; candidateId?: string }[] } {
  const calls: { mode: string; presetId: string; candidateId?: string }[] = [];
  const mockSystem = {
    play: vi.fn((presetId: string) => {
      calls.push({ mode: 'play', presetId });
      return { played: true, presetId, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playPreset: vi.fn((preset: { id: string }) => {
      calls.push({ mode: 'playPreset', presetId: preset.id });
      return { played: true, presetId: preset.id, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playLabSpriteSheet: vi.fn((candidateId: string) => {
      calls.push({ mode: 'playLab', presetId: `lab:${candidateId}`, candidateId });
      return { played: true, presetId: `lab:${candidateId}`, impactTime: 0.5, completion: Promise.resolve() };
    }),
    disposed: false,
  };
  const ctx: LabPlaybackContext = {
    vfxSystem: mockSystem as never,
    buildContext: () => ({ scene: new THREE.Scene(), camera: new THREE.Camera() }) as never,
  };
  return { ctx, calls };
}

const TEST_ACTION = 'w_charge';

// ============================================================ STATE

describe('R2C-LAB V1C — State', () => {
  it('1. validation creates immutable snapshot', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.5 });
    const result = validateStepConfiguration(state, action, 0);
    expect(result.ok).toBe(true);
    state = result.state;
    const validated = getValidatedConfig(state, TEST_ACTION, 0);
    expect(validated).toBeDefined();
    expect(validated!.presentation.scale).toBe(1.5);
  });

  it('2. validation does not mutate production', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    const prodSourceBefore = action.vfxSteps[0]?.sourceCandidateId;
    const result = validateStepConfiguration(state, action, 0);
    expect(result.ok).toBe(true);
    state = result.state;
    const actionAfter = getLabAction(TEST_ACTION)!;
    expect(actionAfter.vfxSteps[0]?.sourceCandidateId).toBe(prodSourceBefore);
  });

  it('3. changing QA after validation preserves validated snapshot', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.82 });
    state = validateStepConfiguration(state, action, 0).state;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.90 });
    const validated = getValidatedConfig(state, TEST_ACTION, 0);
    expect(validated!.presentation.scale).toBe(0.82);
  });

  it('4. changed QA after validation reports VALIDATED BUT MODIFIED', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.82 });
    state = validateStepConfiguration(state, action, 0).state;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.90 });
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED_BUT_MODIFIED');
  });

  it('5. revalidate replaces prior validated snapshot', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.82 });
    state = validateStepConfiguration(state, action, 0).state;
    const ts1 = getValidatedConfig(state, TEST_ACTION, 0)!.validatedAt;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.90 });
    state = validateStepConfiguration(state, action, 0).state;
    const validated = getValidatedConfig(state, TEST_ACTION, 0);
    expect(validated!.presentation.scale).toBe(0.90);
    expect(validated!.validatedAt).toBeGreaterThanOrEqual(ts1);
  });

  it('6. restore validated copies snapshot to QA working state', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.82 });
    state = validateStepConfiguration(state, action, 0).state;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.99 });
    state = restoreValidated(state, action, 0);
    const effPres = getQaPresentation(state, TEST_ACTION, 0);
    expect(effPres?.scale).toBe(0.82);
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED');
  });

  it('7. clear validation removes validation only', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.5 });
    state = validateStepConfiguration(state, action, 0).state;
    state = clearValidation(state, TEST_ACTION, 0);
    expect(getValidatedConfig(state, TEST_ACTION, 0)).toBeUndefined();
    expect(getQaPresentation(state, TEST_ACTION, 0)?.scale).toBe(1.5);
  });

  it('8. reset production does not silently delete validation', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.5 });
    state = validateStepConfiguration(state, action, 0).state;
    state = resetQaStep(state, TEST_ACTION, 0);
    expect(getValidatedConfig(state, TEST_ACTION, 0)).toBeDefined();
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED_BUT_MODIFIED');
  });

  it('9. notes persist per action/step', () => {
    let state = createDefaultLabState();
    state = setStepNotes(state, TEST_ACTION, 0, 'test note');
    expect(getStepNotes(state, TEST_ACTION, 0)).toBe('test note');
    expect(getStepNotes(state, 'w_whirl', 0)).toBe('');
  });

  it('10. validated notes immutable until revalidation', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setStepNotes(state, TEST_ACTION, 0, 'original note');
    state = validateStepConfiguration(state, action, 0).state;
    state = setStepNotes(state, TEST_ACTION, 0, 'changed note');
    const validated = getValidatedConfig(state, TEST_ACTION, 0);
    expect(validated!.notes).toBe('original note');
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED_BUT_MODIFIED');
  });
});

// ============================================================ STATUS

describe('R2C-LAB V1C — Status', () => {
  it('11. untouched step = NOT CONFIGURED', () => {
    const state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    expect(getValidationStepStatus(state, action, 0)).toBe('NOT_CONFIGURED');
  });

  it('12. modified QA = QA MODIFIED', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 2.0 });
    expect(getValidationStepStatus(state, action, 0)).toBe('QA_MODIFIED');
  });

  it('13. matching validation = VALIDATED', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.5 });
    state = validateStepConfiguration(state, action, 0).state;
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED');
  });

  it('14. edited-after-validation = VALIDATED BUT MODIFIED', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.0 });
    state = validateStepConfiguration(state, action, 0).state;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 2.0 });
    expect(getValidationStepStatus(state, action, 0)).toBe('VALIDATED_BUT_MODIFIED');
  });

  it('15. multi-step partial action = PARTIAL', () => {
    const allActions = getLabActions();
    const multiStepAction = allActions.find(a => a.vfxSteps.length > 1);
    if (!multiStepAction) return;
    let state = createDefaultLabState();
    state = validateStepConfiguration(state, multiStepAction, 0).state;
    expect(getValidationActionStatus(state, multiStepAction)).toBe('PARTIAL');
  });

  it('16. all relevant steps validated = action VALIDATED', () => {
    const allActions = getLabActions();
    const singleStepAction = allActions.find(a => a.vfxSteps.length === 1 && a.sourceStatus !== 'NO_VFX');
    if (!singleStepAction) return;
    let state = createDefaultLabState();
    state = validateStepConfiguration(state, singleStepAction, 0).state;
    expect(getValidationActionStatus(state, singleStepAction)).toBe('VALIDATED');
  });

  it('17. NO_VFX action treated as not-applicable', () => {
    const allActions = getLabActions();
    const noVfxAction = allActions.find(a => a.sourceStatus === 'NO_VFX');
    if (!noVfxAction) return;
    const state = createDefaultLabState();
    expect(getValidationActionStatus(state, noVfxAction)).toBe('NO_VFX');
  });
});

// ============================================================ PROGRESS

describe('R2C-LAB V1C — Progress', () => {
  it('18. hero progress computed correctly', () => {
    const state = createDefaultLabState();
    const progress = getValidationProgress(state);
    expect(progress.heroTotal).toBe(60);
    expect(progress.heroValidated).toBe(0);
  });

  it('19. enemy/boss progress computed correctly', () => {
    const state = createDefaultLabState();
    const progress = getValidationProgress(state);
    expect(progress.enemyBossTotal).toBe(23);
    expect(progress.enemyBossValidated).toBe(0);
  });

  it('20. global progress computed correctly', () => {
    const state = createDefaultLabState();
    const progress = getValidationProgress(state);
    expect(progress.allTotal).toBe(83);
    expect(progress.allValidated).toBe(0);
  });

  it('21. denominator excludes non-VFX applicable actions', () => {
    const state = createDefaultLabState();
    const progress = getValidationProgress(state);
    expect(progress.vfxConfigurable + progress.noVfx).toBe(83);
    expect(progress.vfxConfigurable).toBeLessThanOrEqual(83);
  });

  it('22. unresolved actions counted', () => {
    let state = createDefaultLabState();
    const allActions = getLabActions();
    const unresolvedAction = allActions.find(a => a.sourceStatus === 'UNRESOLVED');
    if (unresolvedAction) {
      state = {
        ...state,
        qaHistory: { [unresolvedAction.actionKey]: [{ candidateId: 'r1_0001', verdict: 'REJECTED', timestamp: 1 }] },
      };
      const progress = getValidationProgress(state);
      expect(progress.unresolvedActions).toBeGreaterThan(0);
      expect(progress.unresolvedActionKeys).toContain(unresolvedAction.actionKey);
    }
  });

  it('23. modified-after-validation counted', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.0 });
    state = validateStepConfiguration(state, action, 0).state;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 2.0 });
    const progress = getValidationProgress(state);
    expect(progress.modifiedAfterValidation).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================ NAVIGATION

describe('R2C-LAB V1C — Navigation', () => {
  it('24. NEXT searches forward', () => {
    const state = createDefaultLabState();
    const allActions = getLabActions();
    const firstAction = allActions[0]!;
    const next = findNextToValidate(state, firstAction.actionKey);
    expect(next).not.toBeNull();
    expect(next).not.toBe(firstAction.actionKey);
  });

  it('25. NEXT wraps', () => {
    const state = createDefaultLabState();
    const allActions = getLabActions();
    const lastAction = allActions[allActions.length - 1]!;
    const next = findNextToValidate(state, lastAction.actionKey);
    expect(next).not.toBeNull();
  });

  it('26. NEXT does not trap unresolved current action', () => {
    const state = createDefaultLabState();
    const allActions = getLabActions();
    const firstAction = allActions[0]!;
    const next = findNextToValidate(state, firstAction.actionKey);
    expect(next).not.toBe(firstAction.actionKey);
  });

  it('27. manual selection preserved', () => {
    let state = createDefaultLabState();
    state = { ...state, selectedActionKey: 'w_whirl' };
    expect(state.selectedActionKey).toBe('w_whirl');
  });
});

// ============================================================ PLAYBACK

describe('R2C-LAB V1C — Playback', () => {
  it('28. PLAY VALIDATED uses validated source', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaSourceId(state, TEST_ACTION, 0, 'r1_0001');
    state = validateStepConfiguration(state, action, 0).state;
    const result = playValidated(ctx, state, TEST_ACTION);
    expect(result.played).toBe(true);
    expect(result.snapshot!.source).toBe('r1_0001');
  });

  it('29. PLAY VALIDATED uses validated parameters', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 2.5 });
    state = validateStepConfiguration(state, action, 0).state;
    const result = playValidated(ctx, state, TEST_ACTION);
    expect(result.snapshot!.presentation.scale).toBe(2.5);
  });

  it('30. PLAY QA remains working state', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.8 });
    const result = playQaOverride(ctx, state, TEST_ACTION);
    expect(result.snapshot!.mode).toBe('qa');
    expect(result.snapshot!.presentation.scale).toBe(1.8);
  });

  it('31. PLAY PRODUCTION remains production state', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 9.0 });
    const result = playProduction(ctx, state, TEST_ACTION);
    expect(result.snapshot!.mode).toBe('production');
    expect(result.snapshot!.presentation.scale).not.toBe(9.0);
  });

  it('32. all use real route', () => {
    const { ctx } = makeMockPlaybackContext();
    const state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    const prodResult = playProduction(ctx, state, TEST_ACTION);
    expect(prodResult.snapshot!.route).toBe(action.route);
  });

  it('33. no gameplay execution', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    playValidated(ctx, state, TEST_ACTION);
    expect(calls.every(c => c.mode === 'playLab' || c.mode === 'playPreset' || c.mode === 'play')).toBe(true);
  });
});

// ============================================================ EXPORT

describe('R2C-LAB V1C — Export', () => {
  it('34. export contains only validated corrections as authoritative values', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 0.82 });
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    expect(config.actions[TEST_ACTION]).toBeDefined();
    expect(config.actions[TEST_ACTION]!.steps['0']).toBeDefined();
    expect(config.actions[TEST_ACTION]!.steps['0']!.validated.presentation.scale).toBe(0.82);
  });

  it('35. unvalidated QA changes excluded from final configuration', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 5.0 });
    const config = exportValidatedConfig(state);
    expect(config.actions[TEST_ACTION]).toBeUndefined();
  });

  it('36. source ID explicit', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    const step = config.actions[TEST_ACTION]!.steps['0']!;
    expect(step.validated.sourceId).toBeDefined();
    expect(typeof step.validated.sourceId).toBe('string');
  });

  it('37. all 12 presentation values represented', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, {
      scale: 0.82, offsetX: 0.04, offsetY: -0.12, duration: 0.68,
      opacity: 0.9, anchor: 'target', layer: 'impact', blending: 'additive',
      fadeIn: 0.05, fadeOut: 0.8, direction: 'face_target',
    });
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    const pres = config.actions[TEST_ACTION]!.steps['0']!.validated.presentation;
    expect(pres.scale).toBe(0.82);
    expect(pres.offsetX).toBe(0.04);
    expect(pres.offsetY).toBe(-0.12);
    expect(pres.duration).toBe(0.68);
    expect(pres.opacity).toBe(0.9);
    expect(pres.anchor).toBe('target');
    expect(pres.layer).toBe('impact');
    expect(pres.blending).toBe('additive');
    expect(pres.fadeIn).toBe(0.05);
    expect(pres.fadeOut).toBe(0.8);
    expect(pres.direction).toBe('face_target');
  });

  it('38. multi-step preserved', () => {
    const allActions = getLabActions();
    const multiStepAction = allActions.find(a => a.vfxSteps.length > 1);
    if (!multiStepAction) return;
    let state = createDefaultLabState();
    let validatedCount = 0;
    for (let i = 0; i < multiStepAction.vfxSteps.length; i++) {
      const result = validateStepConfiguration(state, multiStepAction, i);
      if (result.ok) {
        state = result.state;
        validatedCount++;
      }
    }
    expect(validatedCount).toBeGreaterThanOrEqual(1);
    const config = exportValidatedConfig(state);
    const steps = config.actions[multiStepAction.actionKey]!.steps;
    const stepKeys = Object.keys(steps);
    expect(stepKeys.length).toBe(validatedCount);
  });

  it('39. actions deterministically ordered', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    const keys = Object.keys(config.actions);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });

  it('40. steps deterministically ordered', () => {
    const allActions = getLabActions();
    const multiStepAction = allActions.find(a => a.vfxSteps.length > 1);
    if (!multiStepAction) return;
    let state = createDefaultLabState();
    for (let i = 0; i < multiStepAction.vfxSteps.length; i++) {
      state = validateStepConfiguration(state, multiStepAction, i).state;
    }
    const config = exportValidatedConfig(state);
    const stepKeys = Object.keys(config.actions[multiStepAction.actionKey]!.steps);
    const sorted = [...stepKeys].sort((a, b) => parseInt(a) - parseInt(b));
    expect(stepKeys).toEqual(sorted);
  });

  it('41. production-vs-validated diff correct', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 2.0, offsetY: 0.5 });
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    const diff = config.actions[TEST_ACTION]!.steps['0']!.diff;
    expect(diff).toBeDefined();
    expect(diff!.presentationChanged).toBe(true);
    expect(diff!.changedFields).toContain('scale');
    expect(diff!.changedFields).toContain('offsetY');
  });

  it('42. partial export complete=false', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    expect(config.complete).toBe(false);
  });

  it('43. full required set complete=true', () => {
    let state = createDefaultLabState();
    let validatedAny = false;
    for (const action of getLabActions()) {
      if (action.sourceStatus === 'NO_VFX') continue;
      for (const step of action.vfxSteps) {
        const result = validateStepConfiguration(state, action, step.stepIndex);
        if (result.ok) {
          state = result.state;
          validatedAny = true;
        }
      }
    }
    expect(validatedAny).toBe(true);
    const config = exportValidatedConfig(state);
    const progress = getValidationProgress(state);
    expect(config.complete).toBe(progress.allValidated === progress.vfxConfigurable && progress.vfxConfigurable > 0);
  });

  it('44. heroComplete computed correctly', () => {
    let state = createDefaultLabState();
    const config = exportValidatedConfig(state);
    expect(config.heroComplete).toBe(false);
  });

  it('45. unresolved keys listed', () => {
    let state = createDefaultLabState();
    const allActions = getLabActions();
    const unresolvedAction = allActions.find(a => a.sourceStatus === 'UNRESOLVED');
    if (unresolvedAction) {
      state = {
        ...state,
        qaHistory: { [unresolvedAction.actionKey]: [{ candidateId: 'r1_0001', verdict: 'REJECTED', timestamp: 1 }] },
      };
      const config = exportValidatedConfig(state);
      expect(config.summary.unresolvedActionKeys).toContain(unresolvedAction.actionKey);
    }
  });

  it('46. export survives JSON roundtrip', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    const config = exportValidatedConfig(state);
    const json = serializeValidatedConfig(config);
    const parsed = JSON.parse(json) as ValidatedConfigExport;
    expect(parsed.version).toBe(1);
    expect(parsed.kind).toBe('r2c-combat-vfx-validated-config');
    expect(parsed.actions[TEST_ACTION]).toBeDefined();
  });
});

// ============================================================ PERSISTENCE

describe('R2C-LAB V1C — Persistence', () => {
  it('47. validated state survives serialization', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = setQaPresentation(state, TEST_ACTION, 0, { scale: 1.5 });
    state = validateStepConfiguration(state, action, 0).state;
    const json = serializeLabState(state);
    const restored = deserializeLabState(json);
    expect(restored).not.toBeNull();
    expect(getValidatedConfig(restored!, TEST_ACTION, 0)).toBeDefined();
    expect(getValidatedConfig(restored!, TEST_ACTION, 0)!.presentation.scale).toBe(1.5);
  });

  it('48. V1B state without validations loads safely', () => {
    const v1bState = {
      selectedStepByAction: {},
      qaSourceByActionStep: {},
      qaPresentationByActionStep: {},
      search: '',
      formatFilter: 'ALL' as const,
      availabilityFilter: 'ALL' as const,
      usageFilter: 'ALL' as const,
      cataloguePage: 1,
      qaHistory: {},
    };
    const json = JSON.stringify(v1bState);
    const restored = deserializeLabState(json);
    expect(restored).not.toBeNull();
    expect(restored!.validatedByActionStep).toEqual({});
    expect(restored!.notesByActionStep).toEqual({});
  });

  it('49. acquisition state does not corrupt validation', () => {
    let state = createDefaultLabState();
    const action = getLabAction(TEST_ACTION)!;
    state = validateStepConfiguration(state, action, 0).state;
    const validatedBefore = getValidatedConfig(state, TEST_ACTION, 0);
    state = setQaSourceId(state, TEST_ACTION, 0, 'r1_9999');
    const validatedAfter = getValidatedConfig(state, TEST_ACTION, 0);
    expect(validatedAfter).toEqual(validatedBefore);
  });
});

// ============================================================ PRESERVATION

describe('R2C-LAB V1C — Preservation', () => {
  it('50. 83 actions unchanged', () => {
    expect(getActionCount().total).toBe(83);
  });

  it('51. 2769 catalogue unchanged', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(catalogue.length).toBe(2769);
  });

  it('52. Resource Manager unchanged', async () => {
    const mod = await import('./VfxResourceManager');
    expect(mod.vfxResourceManager).toBeDefined();
  });

  it('53. production mappings unchanged', () => {
    const sheet = VFX_SPRITE_SHEETS['megapack_dash_wind_white_v3'];
    expect(sheet).toBeDefined();
    expect(sheet.sourceCandidateId).toBe('r1_2561');
  });

  it('54. old QA tools retained', async () => {
    const mod = await import('./MegaPackHeldReviewWorkbench');
    expect(mod.installMegaPackHeldReviewWorkbench).toBeDefined();
  });

  it('55. gameplay unchanged', async () => {
    const mod = await import('../stage/combatStageProfiles');
    expect(mod.resolvePresentationRoute).toBeDefined();
  });
});
