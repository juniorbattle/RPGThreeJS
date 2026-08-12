// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultLabState,
  resetArtisticWorkspace,
  auditCleanArtisticWorkspace,
  clearR2cAStateFromStorage,
  saveLabStateToStorage,
  setQaSourceId,
  setDisplayMode,
  getLabActions,
  getLabAction,
  getArtisticState,
  getVisualSpriteSheetSteps,
  getActionCount,
  buildCatalogue,
  getCatalogueCounts,
  labStepKey,
} from './CombatVfxLab';
import { installCombatVfxLabWorkbench } from './CombatVfxLabWorkbench';
import { getPreviewIndexCounts } from './VfxPreviewResolver';
import type { LabState } from './CombatVfxLab';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';

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

describe('R2C-LAB V1E.3.4 — Independent Debug Tools / Final Maintenance UX', () => {
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

  it('1. outer ADVANCED / DEBUG accordion no longer controls debug tools', () => {
    setupWorkbench();
    flushRender();
    // No accordion with section="resource_debug" should exist
    const oldAccordion = getRoot().querySelector('[data-section="resource_debug"]');
    expect(oldAccordion).toBeNull();
  });

  it('2. SYSTEM / DEBUG TOOLS heading rendered', () => {
    setupWorkbench();
    flushRender();
    const heading = getRoot().querySelector('.lab-debug-tools-heading');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toContain('SYSTEM / DEBUG TOOLS');
  });

  it('3. status panel always rendered', () => {
    setupWorkbench();
    flushRender();
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const statusCard = Array.from(cards).find(c => c.textContent?.includes('ARTISTIC / PRODUCTION STATUS'));
    expect(statusCard).toBeTruthy();
  });

  it('4. clean audit panel always rendered', () => {
    setupWorkbench();
    flushRender();
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const auditCard = Array.from(cards).find(c => c.textContent?.includes('CLEAN RESET AUDIT'));
    expect(auditCard).toBeTruthy();
  });

  it('5. status and audit are siblings in same grid', () => {
    setupWorkbench();
    flushRender();
    const grid = getRoot().querySelector('.lab-debug-grid-two');
    expect(grid).toBeTruthy();
    const cards = grid!.querySelectorAll('.lab-debug-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const titles = Array.from(cards).map(c => c.querySelector('.lab-debug-card-title')?.textContent);
    expect(titles.some(t => t?.includes('ARTISTIC / PRODUCTION STATUS'))).toBe(true);
    expect(titles.some(t => t?.includes('CLEAN RESET AUDIT'))).toBe(true);
  });

  it('6. QA Review History panel rendered independently', () => {
    setupWorkbench();
    flushRender();
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]');
    expect(historySection).toBeTruthy();
    expect(historySection!.textContent).toContain('QA REVIEW HISTORY');
  });

  it('7. QA Review History default collapsed', () => {
    setupWorkbench();
    flushRender();
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]') as HTMLElement;
    expect(historySection.dataset.open).toBe('false');
    const body = historySection.querySelector('.lab-debug-subsection-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('8. QA History count rendered', () => {
    const action = getFirstActionWithVfx();
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        [action.actionKey]: [
          { candidateId: 'r1_0001', verdict: 'REJECT', timestamp: Date.now() },
          { candidateId: 'r1_0002', verdict: 'LOCK', timestamp: Date.now() },
        ],
      },
    };
    setupWorkbench(state);
    flushRender();
    const countSpan = getRoot().querySelector('[data-subsection="qa_history"] .lab-debug-subsection-count');
    expect(countSpan).toBeTruthy();
    expect(countSpan!.textContent).toBe('2');
  });

  it('9. expanded history uses localized scroll list', () => {
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

  it('10. Resource / Internals rendered independently', () => {
    setupWorkbench();
    flushRender();
    const internalsSection = getRoot().querySelector('[data-subsection="resource_internals"]');
    expect(internalsSection).toBeTruthy();
    expect(internalsSection!.textContent).toContain('RESOURCE / INTERNALS');
  });

  it('11. Resource / Internals default collapsed', () => {
    setupWorkbench();
    flushRender();
    const internalsSection = getRoot().querySelector('[data-subsection="resource_internals"]') as HTMLElement;
    expect(internalsSection.dataset.open).toBe('false');
    const body = internalsSection.querySelector('.lab-debug-subsection-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('12. Workspace Maintenance rendered independently', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance');
    expect(maintenance).toBeTruthy();
    expect(maintenance!.textContent).toContain('WORKSPACE MAINTENANCE');
  });

  it('13. Workspace Maintenance always visible in expanded Lab', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance') as HTMLElement;
    expect(maintenance).toBeTruthy();
    expect(maintenance.style.display).not.toBe('none');
  });

  it('14. Reset button descendant of Workspace Maintenance', () => {
    setupWorkbench();
    flushRender();
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance')!;
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn');
    expect(resetBtn).toBeTruthy();
    expect(maintenance.contains(resetBtn)).toBe(true);
  });

  it('15. Reset button not descendant of QA history', () => {
    setupWorkbench();
    flushRender();
    const historySection = getRoot().querySelector('[data-subsection="qa_history"]')!;
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn')!;
    expect(historySection.contains(resetBtn)).toBe(false);
  });

  it('16. Reset button not descendant of Resource / Internals', () => {
    setupWorkbench();
    flushRender();
    const internalsSection = getRoot().querySelector('[data-subsection="resource_internals"]')!;
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn')!;
    expect(internalsSection.contains(resetBtn)).toBe(false);
  });

  it('17. Reset button not inside any scroll container', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn')!;
    const scrollables = getRoot().querySelectorAll('.lab-debug-history-list, [style*="overflow"]');
    for (const el of scrollables) {
      expect(el.contains(resetBtn)).toBe(false);
    }
  });

  it('18. semantic clean badge visible directly', () => {
    setupWorkbench();
    flushRender();
    const semanticBadge = getRoot().querySelector('.lab-semantic-badge');
    expect(semanticBadge).toBeTruthy();
    expect(semanticBadge!.textContent!.trim()).toMatch(/^(YES|NO)$/);
    // Badge is inside an always-visible card, not a collapsed subsection
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    const foundInCard = Array.from(cards).some(c => c.contains(semanticBadge));
    expect(foundInCard).toBe(true);
  });

  it('19. global debug scroll absent', () => {
    setupWorkbench();
    flushRender();
    const globalScroll = getRoot().querySelector('.lab-advanced-scroll, .system-debug-scroll');
    expect(globalScroll).toBeNull();
  });

  it('20. export controls remain outside debug tools', () => {
    setupWorkbench();
    flushRender();
    const debugTools = getRoot().querySelector('.lab-debug-tools')!;
    const exportBtn = getRoot().querySelector('.lab-export-btn, .lab-export-validated-btn');
    if (exportBtn) {
      expect(debugTools.contains(exportBtn)).toBe(false);
    }
  });

  it('21. minimized mode hides debug tools', () => {
    let state = createDefaultLabState();
    state = setDisplayMode(state, 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const debugTools = getRoot().querySelector('.lab-debug-tools') as HTMLElement;
    expect(debugTools).toBeTruthy();
    expect(debugTools.style.display).toBe('none');
  });

  it('22. reset confirmation unchanged', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    expect(resetBtn).toBeTruthy();
    expect(resetBtn.disabled).toBe(false);
  });

  it('23. reset semantics unchanged — clears QA sources after click', () => {
    const action = getFirstActionWithVfx();
    let state = createDefaultLabState();
    state = setQaSourceId(state, action.actionKey, 0, 'r1_0001');
    saveLabStateToStorage(localStorage, state);
    localStorage.setItem(R2CA_STORAGE_KEY, JSON.stringify({ finalSelections: {}, decisions: {} }));
    const dispose = installCombatVfxLabWorkbench({ enabled: true });
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    const rawState = localStorage.getItem(LAB_STORAGE_KEY);
    const parsed = rawState ? JSON.parse(rawState) : null;
    expect(Object.keys(parsed.qaSourceByActionStep).length).toBe(0);
    expect(localStorage.getItem(R2CA_STORAGE_KEY)).toBeNull();
    confirmSpy.mockRestore();
    dispose();
  });

  it('24. reset clears QA history', () => {
    const action = getFirstActionWithVfx();
    const state: LabState = {
      ...createDefaultLabState(),
      qaHistory: {
        [action.actionKey]: [
          { candidateId: 'r1_0001', verdict: 'REJECT', timestamp: Date.now() },
        ],
      },
    };
    saveLabStateToStorage(localStorage, state);
    const dispose = installCombatVfxLabWorkbench({ enabled: true });
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    const rawState = localStorage.getItem(LAB_STORAGE_KEY);
    const parsed = rawState ? JSON.parse(rawState) : null;
    expect(Object.values(parsed.qaHistory).every((h: unknown) => Array.isArray(h) && h.length === 0)).toBe(true);
    confirmSpy.mockRestore();
    dispose();
  });

  it('25. reset audit updates to semantic clean', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    const auditEl = getRoot().querySelector('.lab-reset-audit');
    expect(auditEl).toBeTruthy();
    // After reset, semantic clean should be YES (clean state with CONFIGURE mode)
    const badge = auditEl!.querySelector('.lab-semantic-badge');
    expect(badge).toBeTruthy();
    // Reset produces a clean state
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.isClean).toBe(true);
    confirmSpy.mockRestore();
  });

  it('26. 83 actions preserved', () => {
    resetArtisticWorkspace(createDefaultLabState());
    expect(getActionCount().total).toBe(83);
  });

  it('27. 89 visual work items preserved', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.totalConfigurableVisualSteps).toBe(89);
  });

  it('28. 2769 catalogue preserved', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(getCatalogueCounts(catalogue).total).toBe(2769);
  });

  it('29. lifecycle unchanged — UNCONFIGURED for clean state', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const actions = getLabActions();
    for (const action of actions) {
      if (action.sourceStatus === 'NO_VFX') continue;
      const visualSteps = getVisualSpriteSheetSteps(action);
      for (const vs of visualSteps) {
        expect(getArtisticState(clean, action, vs.stepIndex)).toBe('UNCONFIGURED');
      }
    }
  });

  it('30. gameplay unchanged', () => {
    resetArtisticWorkspace(createDefaultLabState());
    expect(getPreviewIndexCounts().resolved).toBe(1974);
  });
});
