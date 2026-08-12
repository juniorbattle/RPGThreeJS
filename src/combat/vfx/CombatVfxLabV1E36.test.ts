// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultLabState,
  resetArtisticWorkspace,
  auditCleanArtisticWorkspace,
  setQaSourceId,
  setPreviewCandidateId,
  setDisplayMode,
  setQaPresentation,
  getLabActions,
  getLabAction,
  getArtisticState,
  getVisualSpriteSheetSteps,
  getActionCount,
} from './CombatVfxLab';
import type { LabState, ValidatedStepConfiguration } from './CombatVfxLab';

function getFirstActionWithVfx() {
  const actions = getLabActions();
  const action = actions.find(a => a.sourceStatus !== 'NO_VFX');
  if (!action) throw new Error('No action with VFX found');
  return action;
}

describe('R2C-LAB V1E.3.6 — Fix Semantic Clean Gate / Separate Artistic State from UI State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================ CLEAN CANONICAL

  it('1. canonical reset => semantic clean YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
    expect(audit.selectionClean).toBe(true);
  });

  // ============================================================ UI STATE DOES NOT AFFECT SEMANTIC CLEAN

  it('2. page 4 => semantic clean remains YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, cataloguePage: 4 };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
  });

  it('3. page 56 => semantic clean remains YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, cataloguePage: 56 };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
  });

  it('4. workQueue ALL => semantic clean remains YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state: LabState = { ...clean, workQueueMode: 'ALL' };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
  });

  it('5. display MINIMIZED => semantic clean remains YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = setDisplayMode(clean, 'MINIMIZED');
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
  });

  it('6. search "slash" => semantic clean remains YES', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, search: 'slash' };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(true);
    expect(audit.artisticClean).toBe(true);
  });

  // ============================================================ UI DEFAULTS REPORTED SEPARATELY

  it('7. UI defaults canonical becomes NO for page 4', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, cataloguePage: 4 };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.uiDefaultsCanonical).toBe(false);
  });

  it('8. UI defaults canonical becomes NO for search', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, search: 'slash' };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.uiDefaultsCanonical).toBe(false);
  });

  // ============================================================ TRUE DIRTY CASES

  it('9. QA source => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = setQaSourceId(clean, action.actionKey, 0, 'r1_0001');
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  it('10. QA override => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = setQaPresentation(clean, action.actionKey, 0, { anchor: 'source' });
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  it('11. validation => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const stepKey = `${action.actionKey}::0`;
    const validated: ValidatedStepConfiguration = {
      actionKey: action.actionKey,
      stepIndex: 0,
      sourceId: 'r1_0001',
      presentation: {},
      validatedAt: Date.now(),
    };
    const state = { ...clean, validatedByActionStep: { [stepKey]: validated } };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  it('12. QA history => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, qaHistory: { [action.actionKey]: [{ candidateId: 'r1_0001', verdict: 'REJECT', timestamp: Date.now() }] } };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  it('13. tested fingerprint => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const stepKey = `${action.actionKey}::0`;
    const state = { ...clean, testedFingerprintByActionStep: { [stepKey]: 'abc123' } };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  it('14. verified fingerprint => semantic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const stepKey = `${action.actionKey}::0`;
    const state = { ...clean, verifiedFingerprintByActionStep: { [stepKey]: 'abc123' } };
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.artisticClean).toBe(false);
  });

  // ============================================================ SELECTION CLEAN

  it('15. selected candidate => selection clean NO', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = setPreviewCandidateId(clean, 'r1_0001');
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.selectionClean).toBe(false);
    expect(audit.artisticClean).toBe(true);
  });

  it('16. selected candidate => semantic clean / codexReady NO', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = setPreviewCandidateId(clean, 'r1_0001');
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.isClean).toBe(false);
    expect(audit.codexReady).toBe(false);
  });

  // ============================================================ QA_WORKING

  it('17. QA_WORKING visual step => artistic clean NO', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    // Set a QA source which makes the step QA_WORKING
    const state = setQaSourceId(clean, action.actionKey, 0, 'r1_0001');
    const audit = auditCleanArtisticWorkspace(state);
    expect(audit.artisticClean).toBe(false);
    expect(audit.qaWorkingVisualSteps).toBeGreaterThan(0);
  });

  // ============================================================ PRESERVATION

  it('18. 83 actions preserved', () => {
    resetArtisticWorkspace(createDefaultLabState());
    expect(getActionCount().total).toBe(83);
  });

  it('19. 89 configurable visual steps preserved', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.totalConfigurableVisualSteps).toBe(89);
  });

  it('20. reset semantics otherwise unchanged', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.qaSources).toBe(0);
    expect(audit.qaPresentationOverrides).toBe(0);
    expect(audit.selectedCandidates).toBe(0);
    expect(audit.validatedConfigs).toBe(0);
    expect(audit.notes).toBe(0);
    expect(audit.testedFingerprints).toBe(0);
    expect(audit.verifiedFingerprints).toBe(0);
    expect(audit.qaHistoryEntries).toBe(0);
    expect(audit.qaWorkingVisualSteps).toBe(0);
    expect(audit.validatedVisualSteps).toBe(0);
    expect(audit.validatedModifiedVisualSteps).toBe(0);
    expect(audit.unexpectedArtisticStates).toBe(0);
    // UI defaults are canonical after reset
    expect(audit.uiDefaultsCanonical).toBe(true);
    // codexReady matches isClean
    expect(audit.codexReady).toBe(audit.isClean);
  });
});
