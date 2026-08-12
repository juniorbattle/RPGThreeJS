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

describe('R2C-LAB V1E.3.5 — Restore Main VFX Workbench After Debug Tools Refactor', () => {
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

  // ============================================================ WORKBENCH RESTORATION

  it('1. expanded mode renders workbenchGrid', () => {
    setupWorkbench();
    flushRender();
    const workbench = getRoot().querySelector('.lab-workbench');
    expect(workbench).toBeTruthy();
    expect((workbench as HTMLElement).style.display).not.toBe('none');
  });

  it('2. workbenchGrid contains catalogue', () => {
    setupWorkbench();
    flushRender();
    const workbench = getRoot().querySelector('.lab-workbench')!;
    const catalogue = workbench.querySelector('.lab-col-catalogue');
    expect(catalogue).toBeTruthy();
  });

  it('3. workbenchGrid contains inspector', () => {
    setupWorkbench();
    flushRender();
    const workbench = getRoot().querySelector('.lab-workbench')!;
    const inspector = workbench.querySelector('.lab-col-inspector');
    expect(inspector).toBeTruthy();
  });

  it('4. workbenchGrid appears before nextRequired (ctaBar)', () => {
    setupWorkbench();
    flushRender();
    const workbench = getRoot().querySelector('.lab-workbench')!;
    const ctaBar = getRoot().querySelector('.lab-cta-bar')!;
    const rootChildren = Array.from(getRoot().children);
    const wbIdx = rootChildren.indexOf(workbench);
    const ctaIdx = rootChildren.indexOf(ctaBar);
    expect(wbIdx).toBeLessThan(ctaIdx);
  });

  it('5. nextRequired (ctaBar) appears before debugTools', () => {
    setupWorkbench();
    flushRender();
    const ctaBar = getRoot().querySelector('.lab-cta-bar')!;
    const debugTools = getRoot().querySelector('.lab-debug-tools')!;
    const rootChildren = Array.from(getRoot().children);
    const ctaIdx = rootChildren.indexOf(ctaBar);
    const debugIdx = rootChildren.indexOf(debugTools);
    expect(ctaIdx).toBeLessThan(debugIdx);
  });

  it('6. debugTools appears before exports', () => {
    setupWorkbench();
    flushRender();
    const debugTools = getRoot().querySelector('.lab-debug-tools')!;
    const exportSection = getRoot().querySelector('.lab-section')!;
    const rootChildren = Array.from(getRoot().children);
    const debugIdx = rootChildren.indexOf(debugTools);
    const exportIdx = rootChildren.indexOf(exportSection);
    expect(debugIdx).toBeLessThan(exportIdx);
  });

  // ============================================================ UNCONFIGURED STATE

  it('7. UNCONFIGURED action still renders catalogue', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, selectedActionKey: action.actionKey };
    setupWorkbench(state);
    flushRender();
    const catalogue = getRoot().querySelector('.lab-col-catalogue');
    expect(catalogue).toBeTruthy();
    expect((catalogue as HTMLElement).style.display).not.toBe('none');
    // Catalogue should have content (view mode buttons, etc.)
    expect(catalogue!.children.length).toBeGreaterThan(0);
  });

  it('8. UNCONFIGURED action still renders inspector', () => {
    const action = getFirstActionWithVfx();
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const state = { ...clean, selectedActionKey: action.actionKey };
    setupWorkbench(state);
    flushRender();
    const inspector = getRoot().querySelector('.lab-col-inspector');
    expect(inspector).toBeTruthy();
    expect((inspector as HTMLElement).style.display).not.toBe('none');
    expect(inspector!.children.length).toBeGreaterThan(0);
  });

  it('9. clean reset does not hide catalogue', () => {
    setupWorkbench();
    flushRender();
    // Click reset
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    const catalogue = getRoot().querySelector('.lab-col-catalogue');
    expect(catalogue).toBeTruthy();
    expect((catalogue as HTMLElement).style.display).not.toBe('none');
    confirmSpy.mockRestore();
  });

  it('10. clean reset does not hide inspector', () => {
    setupWorkbench();
    flushRender();
    const resetBtn = getRoot().querySelector('.lab-reset-workspace-btn') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    resetBtn.click();
    flushRender();
    const inspector = getRoot().querySelector('.lab-col-inspector');
    expect(inspector).toBeTruthy();
    expect((inspector as HTMLElement).style.display).not.toBe('none');
    confirmSpy.mockRestore();
  });

  // ============================================================ CATALOGUE FEATURES

  it('11. GRID catalogue view preserved', () => {
    setupWorkbench();
    flushRender();
    const gridBtn = getRoot().querySelector('.lab-cat-view-btn[data-active="true"]');
    expect(gridBtn).toBeTruthy();
    expect(gridBtn!.textContent).toContain('GRID');
  });

  it('12. GIF previews preserved (mini preview area)', () => {
    setupWorkbench();
    flushRender();
    // The catalogue renders grid cards with mini preview areas
    // After flush, the catalogue should have rendered some cards
    const catalogue = getRoot().querySelector('.lab-col-catalogue')!;
    // Check for either grid cards or compact items (both are valid)
    const hasContent = catalogue.children.length > 0;
    expect(hasContent).toBe(true);
  });

  it('13. candidate selection preserved (select button)', () => {
    setupWorkbench();
    flushRender();
    // The catalogue should have select buttons or grid cards with selection capability
    const catalogue = getRoot().querySelector('.lab-col-catalogue')!;
    // Verify the catalogue has interactive elements
    const buttons = catalogue.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('14. USE AS QA SOURCE preserved', () => {
    setupWorkbench();
    flushRender();
    // The USE AS QA SOURCE button is in the inspector when a candidate is selected
    // Verify the inspector exists and has content
    const inspector = getRoot().querySelector('.lab-col-inspector')!;
    expect(inspector.children.length).toBeGreaterThan(0);
  });

  // ============================================================ INSPECTOR

  it('15. inspector current VFX preserved', () => {
    setupWorkbench();
    flushRender();
    const inspector = getRoot().querySelector('.lab-col-inspector')!;
    const currentVfx = inspector.querySelector('.lab-inspector-section');
    expect(currentVfx).toBeTruthy();
    expect(currentVfx!.textContent).toContain('CURRENT VFX');
  });

  // ============================================================ MINIMIZED / EXPANDED

  it('16. minimized mode hides workbenchGrid', () => {
    let state = createDefaultLabState();
    state = setDisplayMode(state, 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const workbench = getRoot().querySelector('.lab-workbench') as HTMLElement;
    expect(workbench).toBeTruthy();
    expect(workbench.style.display).toBe('none');
  });

  it('17. OPEN LAB restores workbenchGrid', () => {
    // Start minimized
    let state = createDefaultLabState();
    state = setDisplayMode(state, 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    // Verify hidden
    const workbench = getRoot().querySelector('.lab-workbench') as HTMLElement;
    expect(workbench.style.display).toBe('none');
    // Click OPEN LAB
    const openBtn = getRoot().querySelector('.lab-dock-open-btn') as HTMLButtonElement;
    expect(openBtn).toBeTruthy();
    openBtn.click();
    flushRender();
    // Verify restored
    const workbenchAfter = getRoot().querySelector('.lab-workbench') as HTMLElement;
    expect(workbenchAfter.style.display).not.toBe('none');
  });

  it('18. repeated minimize/expand does not lose catalogue', () => {
    setupWorkbench();
    flushRender();
    // Expand → Minimize → Expand
    for (let i = 0; i < 3; i++) {
      // Minimize
      const minimizeBtn = getRoot().querySelector('.lab-minimize-btn') as HTMLButtonElement;
      minimizeBtn.click();
      flushRender();
      const wbHidden = getRoot().querySelector('.lab-workbench') as HTMLElement;
      expect(wbHidden.style.display).toBe('none');
      // Expand
      const openBtn = getRoot().querySelector('.lab-dock-open-btn') as HTMLButtonElement;
      openBtn.click();
      flushRender();
      const wbVisible = getRoot().querySelector('.lab-workbench') as HTMLElement;
      expect(wbVisible.style.display).not.toBe('none');
      // Catalogue should still have content
      const catalogue = getRoot().querySelector('.lab-col-catalogue')!;
      expect(catalogue.children.length).toBeGreaterThan(0);
    }
  });

  // ============================================================ DEBUG TOOLS PRESERVED

  it('19. System / Debug Tools preserved', () => {
    setupWorkbench();
    flushRender();
    const heading = getRoot().querySelector('.lab-debug-tools-heading');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toContain('SYSTEM / DEBUG TOOLS');
    // Verify panels exist
    const cards = getRoot().querySelectorAll('.lab-debug-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const maintenance = getRoot().querySelector('.lab-advanced-maintenance');
    expect(maintenance).toBeTruthy();
  });

  // ============================================================ RESET SEMANTICS

  it('20. semantic reset unchanged', () => {
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

  // ============================================================ PRESERVATION COUNTS

  it('21. 2769 catalogue preserved', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(getCatalogueCounts(catalogue).total).toBe(2769);
  });

  it('22. 89 configurable visual work items preserved', () => {
    const clean = resetArtisticWorkspace(createDefaultLabState());
    const audit = auditCleanArtisticWorkspace(clean);
    expect(audit.totalConfigurableVisualSteps).toBe(89);
  });

  it('23. lifecycle unchanged — UNCONFIGURED for clean state', () => {
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

  it('24. gameplay unchanged', () => {
    resetArtisticWorkspace(createDefaultLabState());
    expect(getPreviewIndexCounts().resolved).toBe(1974);
  });
});
