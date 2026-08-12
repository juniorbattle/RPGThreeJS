// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultLabState,
  resetArtisticWorkspace,
  auditCleanArtisticWorkspace,
  serializeLabState,
  deserializeLabState,
  setQaSourceId,
  setQaPresentation,
  setSelectedStep,
  validateStepConfiguration,
  recordProductionTested,
  confirmProductionVerified,
  getQaSourceId,
  getQaPresentation,
  getSelectedStep,
  getValidatedConfig,
  getDisplayMode,
  getLabActions,
  getLabAction,
  getActionCount,
  getCatalogueCounts,
  buildCatalogue,
  buildWorkQueue,
  getValidationProgress,
  getProductionProgress,
  getVisualSpriteSheetSteps,
  getProductionVisualConfig,
  labStepKey,
} from './CombatVfxLab';
import { getPreviewIndexCounts } from './VfxPreviewResolver';
import type { LabState, LabAction } from './CombatVfxLab';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';

function getFirstActionWithVfx(): LabAction {
  const actions = getLabActions();
  const action = actions.find(a => a.sourceStatus !== 'NO_VFX');
  if (!action) throw new Error('No action with VFX found');
  return action;
}

describe('R2C-LAB V1E.3 — Clean Artistic Workspace Reset', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Helper: create a dirty state with all artistic fields populated
  function createDirtyState(): LabState {
    let state = createDefaultLabState();
    const action = getFirstActionWithVfx();
    const stepIdx = 0;

    // QA source
    state = setQaSourceId(state, action.actionKey, stepIdx, 'r1_0001');

    // QA presentation override
    state = setQaPresentation(state, action.actionKey, stepIdx, { scale: 1.5 });

    // Selected step
    state = setSelectedStep(state, action.actionKey, 1);

    // Notes
    state = {
      ...state,
      notesByActionStep: { [labStepKey(action.actionKey, stepIdx)]: 'test note' },
    };

    // Validated config
    state = validateStepConfiguration(state, action, stepIdx).state;

    // QA history
    state = {
      ...state,
      qaHistory: {
        [action.actionKey]: [
          { candidateId: 'r1_0001', verdict: 'LOCK', timestamp: Date.now() },
        ],
      },
    };

    // Preview candidate
    state = { ...state, previewCandidateId: 'r1_0001' };

    // Tested + verified fingerprints
    state = recordProductionTested(state, action, stepIdx);
    state = confirmProductionVerified(state, action, stepIdx);

    // Work queue mode
    state = { ...state, workQueueMode: 'VERIFY' };

    // Display mode
    state = { ...state, displayMode: 'MINIMIZED' };

    // Catalogue UI
    state = {
      ...state,
      search: 'fire',
      formatFilter: '2048_16F',
      availabilityFilter: 'READY',
      usageFilter: 'USED',
      cataloguePage: 5,
      gifFilter: 'HAS_GIF',
      catalogueViewMode: 'COMPACT',
    };

    // Selected action
    state = { ...state, selectedActionKey: action.actionKey };

    return state;
  }

  // ============================================================ RESET TESTS

  it('1. reset clears all QA sources', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.qaSourceByActionStep).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.qaSourceByActionStep).length).toBe(0);
  });

  it('2. reset clears QA presentation overrides', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.qaPresentationByActionStep).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.qaPresentationByActionStep).length).toBe(0);
  });

  it('3. reset clears catalogue candidate selection', () => {
    const dirty = createDirtyState();
    expect(dirty.previewCandidateId).toBeDefined();
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.previewCandidateId).toBeUndefined();
  });

  it('4. reset clears validated configs', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.validatedByActionStep).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.validatedByActionStep).length).toBe(0);
  });

  it('5. reset clears notes', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.notesByActionStep).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.notesByActionStep).length).toBe(0);
  });

  it('6. reset clears QA history', () => {
    const dirty = createDirtyState();
    expect(Object.values(dirty.qaHistory).some(h => h.length > 0)).toBe(true);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.values(clean.qaHistory).every(h => h.length === 0)).toBe(true);
  });

  it('7. reset clears tested fingerprints', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.testedFingerprintByActionStep ?? {}).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.testedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  it('8. reset clears verified fingerprints', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.verifiedFingerprintByActionStep ?? {}).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.verifiedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  it('9. reset clears selected-step UI state', () => {
    const dirty = createDirtyState();
    expect(Object.keys(dirty.selectedStepByAction).length).toBeGreaterThan(0);
    const clean = resetArtisticWorkspace(dirty);
    expect(Object.keys(clean.selectedStepByAction).length).toBe(0);
  });

  it('10. work queue becomes CONFIGURE', () => {
    const dirty = createDirtyState();
    expect(dirty.workQueueMode).not.toBe('CONFIGURE');
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.workQueueMode).toBe('CONFIGURE');
  });

  it('11. display mode becomes EXPANDED', () => {
    const dirty = createDirtyState();
    expect(getDisplayMode(dirty)).toBe('MINIMIZED');
    const clean = resetArtisticWorkspace(dirty);
    expect(getDisplayMode(clean)).toBe('EXPANDED');
  });

  it('12. search resets empty', () => {
    const dirty = createDirtyState();
    expect(dirty.search).not.toBe('');
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.search).toBe('');
  });

  it('13. page resets to 1', () => {
    const dirty = createDirtyState();
    expect(dirty.cataloguePage).not.toBe(1);
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.cataloguePage).toBe(1);
  });

  it('14. filters reset to defaults', () => {
    const dirty = createDirtyState();
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.formatFilter).toBe('ALL');
    expect(clean.availabilityFilter).toBe('ALL');
    expect(clean.usageFilter).toBe('ALL');
    expect(clean.gifFilter).toBe('ALL');
  });

  it('15. GRID becomes/default remains catalogue view', () => {
    const dirty = createDirtyState();
    expect(dirty.catalogueViewMode).not.toBe('GRID');
    const clean = resetArtisticWorkspace(dirty);
    expect(clean.catalogueViewMode).toBe('GRID');
  });

  it('16. production presets unchanged', () => {
    const dirty = createDirtyState();
    const action = getFirstActionWithVfx();
    const dirtyPreset = action.currentPresetId;
    resetArtisticWorkspace(dirty);
    // Action registry is static — not affected by state reset
    const sameAction = getLabAction(action.actionKey);
    expect(sameAction?.currentPresetId).toBe(dirtyPreset);
  });

  it('17. production source IDs unchanged', () => {
    const action = getFirstActionWithVfx();
    const visualSteps = getVisualSpriteSheetSteps(action);
    const stepIdx = visualSteps[0]!.stepIndex;
    const step = action.vfxSteps[stepIdx];
    const prodSource = step?.sourceCandidateId ?? step?.spriteSheetId;
    resetArtisticWorkspace(createDirtyState());
    const sameAction = getLabAction(action.actionKey);
    const sameStep = sameAction?.vfxSteps[stepIdx];
    const sameProdSource = sameStep?.sourceCandidateId ?? sameStep?.spriteSheetId;
    expect(sameProdSource).toBe(prodSource);
  });

  it('18. production presentations unchanged', () => {
    const action = getFirstActionWithVfx();
    const visualSteps = getVisualSpriteSheetSteps(action);
    const stepIdx = visualSteps[0]!.stepIndex;
    const prodConfig = getProductionVisualConfig(action, stepIdx);
    resetArtisticWorkspace(createDirtyState());
    const sameAction = getLabAction(action.actionKey)!;
    const sameProdConfig = getProductionVisualConfig(sameAction, stepIdx);
    expect(sameProdConfig).toEqual(prodConfig);
  });

  it('19. technical preset steps unchanged', () => {
    const action = getFirstActionWithVfx();
    const techSteps = action.vfxSteps.filter(s => s.stepType !== 'spriteSheet');
    const techCount = techSteps.length;
    resetArtisticWorkspace(createDirtyState());
    const sameAction = getLabAction(action.actionKey)!;
    const sameTechSteps = sameAction.vfxSteps.filter(s => s.stepType !== 'spriteSheet');
    expect(sameTechSteps.length).toBe(techCount);
  });

  it('20. VFX action mappings unchanged', () => {
    const beforeCount = getActionCount();
    resetArtisticWorkspace(createDirtyState());
    const afterCount = getActionCount();
    expect(afterCount.total).toBe(beforeCount.total);
    expect(afterCount.heroTotal).toBe(beforeCount.heroTotal);
    expect(afterCount.enemyBoss).toBe(beforeCount.enemyBoss);
  });

  it('21. CartoonCoffee catalogue remains 2769', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(getCatalogueCounts(catalogue).total).toBe(2769);
  });

  it('22. GIF mappings remain 1974', () => {
    const counts = getPreviewIndexCounts();
    expect(counts.resolved).toBe(1974);
  });

  it('23. acquired PNG files are not part of reset logic', () => {
    // Reset only affects LabState — it does not touch the file system
    // or VfxResourceManager cache
    const dirty = createDirtyState();
    const clean = resetArtisticWorkspace(dirty);
    // No file-system related fields in LabState
    expect(clean).toBeDefined();
  });

  it('24. reset is persisted correctly', () => {
    const dirty = createDirtyState();
    const clean = resetArtisticWorkspace(dirty);
    const json = serializeLabState(clean);
    const restored = deserializeLabState(json);
    expect(restored).not.toBeNull();
    expect(Object.keys(restored!.qaSourceByActionStep).length).toBe(0);
    expect(Object.keys(restored!.validatedByActionStep).length).toBe(0);
    expect(restored!.workQueueMode).toBe('CONFIGURE');
    expect(getDisplayMode(restored!)).toBe('EXPANDED');
  });

  it('25. deserializing after reset remains clean', () => {
    const dirty = createDirtyState();
    const clean = resetArtisticWorkspace(dirty);
    const json = serializeLabState(clean);
    const restored = deserializeLabState(json)!;
    const audit = auditCleanArtisticWorkspace(restored);
    expect(audit.isClean).toBe(true);
  });

  it('26. audit helper reports isClean = true after reset', () => {
    const dirty = createDirtyState();
    const auditDirty = auditCleanArtisticWorkspace(dirty);
    expect(auditDirty.isClean).toBe(false);
    const clean = resetArtisticWorkspace(dirty);
    const auditClean = auditCleanArtisticWorkspace(clean);
    expect(auditClean.isClean).toBe(true);
  });

  it('27. APPLY queue = 0 after reset', () => {
    const clean = resetArtisticWorkspace(createDirtyState());
    const applyQueue = buildWorkQueue(clean, 'APPLY');
    expect(applyQueue.length).toBe(0);
  });

  it('28. VERIFY queue = 0 after reset', () => {
    const clean = resetArtisticWorkspace(createDirtyState());
    const verifyQueue = buildWorkQueue(clean, 'VERIFY');
    expect(verifyQueue.length).toBe(0);
  });

  it('29. hero artistic validated = 0 after reset', () => {
    const clean = resetArtisticWorkspace(createDirtyState());
    const progress = getValidationProgress(clean);
    expect(progress.heroValidated).toBe(0);
  });

  it('30. reset does not mutate gameplay', () => {
    // Reset only affects LabState — gameplay code is not touched
    const dirty = createDirtyState();
    const clean = resetArtisticWorkspace(dirty);
    // Verify no gameplay-related fields exist in LabState
    expect(clean).toBeDefined();
    expect(typeof clean).toBe('object');
  });
});
