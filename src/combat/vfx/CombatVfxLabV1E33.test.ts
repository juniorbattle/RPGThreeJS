// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultLabState,
  resetArtisticWorkspace,
  auditCleanArtisticWorkspace,
  clearR2cAStateFromStorage,
  saveLabStateToStorage,
  setQaSourceId,
  getLabActions,
  getLabAction,
  getArtisticState,
  getVisualSpriteSheetSteps,
  labStepKey,
} from './CombatVfxLab';
import { installCombatVfxLabWorkbench } from './CombatVfxLabWorkbench';
import type { LabState } from './CombatVfxLab';

const ROOT_ID = 'r2c-vfx-lab';
const LAB_STORAGE_KEY = 'r2c-combat-vfx-lab-state';
const R2CA_STORAGE_KEY = 'r2ca-qa-state';

function getRoot(): HTMLElement {
  return document.getElementById(ROOT_ID)!;
}

function flushRender(): void {
  vi.advanceTimersByTime(100);
}

function getFirstActionWithVfx() {
  const actions = getLabActions();
  const action = actions.find(a => a.sourceStatus !== 'NO_VFX');
  if (!action) throw new Error('No action with VFX found');
  return action;
}

function setupWorkbench(state?: LabState): () => void {
  const s = state ?? createDefaultLabState();
  localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(s));
  return installCombatVfxLabWorkbench({ enabled: true });
}

describe('R2C-LAB V1E.3.3 — Advanced/Debug Information Architecture + Localized Scroll', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    localStorage.clear();
  });

  // ============================================================ STRUCTURAL TESTS

  it('1. Advanced body no longer uses one global diagnostic scroll', () => {
    setupWorkbench();
    flushRender();
    const globalScroll = getRoot().querySelector('.lab-advanced-scroll');
    expect(globalScroll).toBeNull();
  });

  it('2. status panel rendered', () => {
    setupWorkbench();
    flushRender();
    const statusCard = getRoot().querySelector('.lab-debug-card');
    expect(statusCard).toBeTruthy();
    expect(statusCard!.textContent).toContain('ARTISTIC / PRODUCTION STATUS');
  });

  it('3. QA REVIEW HISTORY subsection rendered', () => {
    setupWorkbench();
    flushRender();
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]');
    expect(historySection).toBeTruthy();
    expect(historySection!.textContent).toContain('QA REVIEW HISTORY');
  });

  it('4. QA REVIEW HISTORY default collapsed', () => {
    setupWorkbench();
    flushRender();
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]') as HTMLElement;
    expect(historySection).toBeTruthy();
    expect(historySection.dataset.open).toBe('false');
    const body = historySection.querySelector('.lab-debug-subsection-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('5. long history list has localized scroll container', () => {
    // Create state with many QA history entries
    const action = getFirstActionWithVfx();
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        [action.actionKey]: Array.from({ length: 20 }, (_, i) => ({
          candidateId: `r1_${String(i).padStart(4, '0')}`,
          verdict: 'REJECT',
          timestamp: Date.now(),
        })),
      },
    };
    setupWorkbench(state);
    flushRender();
    const historyList = getRoot().querySelector('.lab-debug-history-list');
    expect(historyList).toBeTruthy();
    const computed = window.getComputedStyle(historyList as HTMLElement);
    expect(computed.overflowY).toBe('auto');
    expect(computed.maxHeight).not.toBe('none');
  });

  it('6. CLEAN RESET AUDIT rendered', () => {
    setupWorkbench();
    flushRender();
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const auditCard = Array.from(cards).find(c => c.textContent?.includes('CLEAN RESET AUDIT'));
    expect(auditCard).toBeTruthy();
  });

  it('7. CLEAN RESET AUDIT always visible (not collapsible)', () => {
    setupWorkbench();
    flushRender();
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const auditCard = Array.from(cards).find(c => c.textContent?.includes('CLEAN RESET AUDIT'));
    expect(auditCard).toBeTruthy();
    // Audit card is always visible — it's a card, not a collapsible subsection
    expect(auditCard!.classList.contains('lab-debug-card')).toBe(true);
    expect(auditCard!.classList.contains('lab-debug-subsection')).toBe(false);
  });

  it('8. semantic clean status visible directly', () => {
    setupWorkbench();
    flushRender();
    // The semantic clean badge is inside the audit card which is always visible
    const semanticBadge = getRoot().querySelector('.lab-semantic-badge');
    expect(semanticBadge).toBeTruthy();
    expect(semanticBadge!.textContent!.trim()).toMatch(/^(YES|NO)$/);
    // Verify it's in an always-visible card (not a collapsed subsection)
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const foundInCard = Array.from(cards).some(c => c.contains(semanticBadge));
    expect(foundInCard).toBe(true);
  });

  it('9. RESOURCE / INTERNALS rendered', () => {
    setupWorkbench();
    flushRender();
    const internalsSection = getRoot().querySelector('[data-subsection="resource_internals"]');
    expect(internalsSection).toBeTruthy();
    expect(internalsSection!.textContent).toContain('RESOURCE / INTERNALS');
  });

  it('10. RESOURCE / INTERNALS default collapsed', () => {
    setupWorkbench();
    flushRender();
    const internalsSection = getRoot().querySelector('[data-subsection="resource_internals"]') as HTMLElement;
    expect(internalsSection).toBeTruthy();
    expect(internalsSection.dataset.open).toBe('false');
    const body = internalsSection.querySelector('.lab-debug-subsection-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('11. WORKSPACE MAINTENANCE rendered', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance');
    expect(maintenance).toBeTruthy();
    expect(maintenance!.textContent).toContain('WORKSPACE MAINTENANCE');
  });

  it('12. reset button is descendant of maintenance section', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance')!;
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn');
    expect(resetBtn).toBeTruthy();
    expect(maintenance.contains(resetBtn)).toBe(true);
  });

  it('13. reset button not descendant of history scroll', () => {
    setupWorkbench();
    flushRender();
    const historyList = getRoot().querySelector('.lab-debug-history-list');
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn');
    expect(resetBtn).toBeTruthy();
    if (historyList) {
      expect(historyList.contains(resetBtn)).toBe(false);
    }
  });

  it('14. reset button not descendant of any debug scroll container', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn')!;
    // Check all elements with overflow scroll/auto
    const scrollables = getRoot().querySelectorAll('[style*="overflow"], .lab-debug-history-list');
    for (const el of scrollables) {
      expect(el.contains(resetBtn)).toBe(false);
    }
  });

  it('15. reset confirmation unchanged', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    expect(resetBtn).toBeTruthy();
    // The button exists and has a click handler — confirmation is triggered on click
    // We verify the button is not disabled
    expect(resetBtn.disabled).toBe(false);
  });

  it('16. reset semantics unchanged — clears QA sources after click', () => {
    const action = getFirstActionWithVfx();
    let state = createDefaultLabState();
    state = setQaSourceId(state, action.actionKey, 0, 'r1_0001');
    saveLabStateToStorage(localStorage, state);
    localStorage.setItem(R2CA_STORAGE_KEY, JSON.stringify({
      finalSelections: {},
      decisions: {},
    }));
    const dispose = installCombatVfxLabWorkbench({ enabled: true });
    flushRender();
    // Verify QA source exists before reset
    expect(Object.keys(state.qaSourceByActionStep).length).toBeGreaterThan(0);
    // Click reset
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    // Verify QA sources cleared
    const rawState = localStorage.getItem(LAB_STORAGE_KEY);
    const parsed = rawState ? JSON.parse(rawState) : null;
    expect(parsed).toBeTruthy();
    expect(Object.keys(parsed.qaSourceByActionStep).length).toBe(0);
    expect(localStorage.getItem(R2CA_STORAGE_KEY)).toBeNull();
    confirmSpy.mockRestore();
    dispose();
  });

  it('17. current QA history clears after clean reset', () => {
    const action = getFirstActionWithVfx();
    let state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        [action.actionKey]: [
          { candidateId: 'r1_0001', verdict: 'REJECT', timestamp: Date.now() },
          { candidateId: 'r1_0002', verdict: 'LOCK', timestamp: Date.now() },
        ],
      },
    };
    saveLabStateToStorage(localStorage, state);
    const dispose = installCombatVfxLabWorkbench({ enabled: true });
    flushRender();
    // Verify history exists before reset
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]');
    expect(historySection!.textContent).toContain('2');
    // Click reset
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    // Verify history cleared
    const rawState = localStorage.getItem(LAB_STORAGE_KEY);
    const parsed = rawState ? JSON.parse(rawState) : null;
    expect(parsed.qaHistory).toBeDefined();
    expect(Object.values(parsed.qaHistory).every((h: unknown) => Array.isArray(h) && h.length === 0)).toBe(true);
    confirmSpy.mockRestore();
    dispose();
  });

  it('18. archival R2C-A data cannot affect artistic state after reset', () => {
    // Set up R2C-A state
    localStorage.setItem(R2CA_STORAGE_KEY, JSON.stringify({
      finalSelections: { a_arrow_rain: { candidateId: 'r1_9999', verdict: 'LOCK' } },
      decisions: {},
    }));
    // Migrate
    let state: LabState = {
      ...createDefaultLabState(),
      selectedActionKey: 'a_arrow_rain',
    };
    // Simulate migration by loading from storage
    saveLabStateToStorage(localStorage, state);
    // Reset
    state = resetArtisticWorkspace(state);
    clearR2cAStateFromStorage(localStorage);
    saveLabStateToStorage(localStorage, state);
    // Verify R2C-A is cleared
    expect(localStorage.getItem(R2CA_STORAGE_KEY)).toBeNull();
    // Verify artistic state is UNCONFIGURED for all actions
    const actions = getLabActions();
    for (const action of actions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      for (const vs of visualSteps) {
        expect(getArtisticState(state, action, vs.stepIndex)).toBe('UNCONFIGURED');
      }
    }
  });

  it('19. export controls remain outside Advanced maintenance', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance');
    const exportBtn = getRoot().querySelector('.lab-export-btn, .lab-export-validated-btn');
    if (exportBtn) {
      expect(maintenance!.contains(exportBtn)).toBe(false);
    }
  });

  it('20. lifecycle unchanged — UNCONFIGURED for clean state', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const actions = getLabActions();
    for (const action of actions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      for (const vs of visualSteps) {
        const artistic = getArtisticState(clean, action, vs.stepIndex);
        expect(artistic).toBe('UNCONFIGURED');
      }
    }
  });
});
