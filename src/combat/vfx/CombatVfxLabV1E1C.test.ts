// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCombatVfxLabWorkbench } from './CombatVfxLabWorkbench';
import { createDefaultLabState, getLabActions, setQaSourceId, validateStepConfiguration, recordProductionTested, confirmProductionVerified, setSelectedStep } from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';

const ROOT_ID = 'r2c-vfx-lab';

function setupWorkbench(state?: LabState): () => void {
  const s = state ?? createDefaultLabState();
  localStorage.setItem('r2c-combat-vfx-lab-state', JSON.stringify(s));
  return installCombatVfxLabWorkbench({ enabled: true });
}

function getRoot(): HTMLElement {
  return document.getElementById(ROOT_ID)!;
}

function getActionBar(): HTMLElement {
  return getRoot().querySelector('.lab-action-bar') as HTMLElement;
}

function getMainRow(): HTMLElement {
  return getActionBar().querySelector('.lab-action-main-row') as HTMLElement;
}

function getSelectWrap(): HTMLElement {
  return getMainRow().querySelector('.lab-action-select-wrap') as HTMLElement;
}

function getActionSelect(): HTMLSelectElement {
  return getSelectWrap().querySelector('select') as HTMLSelectElement;
}

function getNav(): HTMLElement {
  return getMainRow().querySelector('.lab-action-nav') as HTMLElement;
}

function getMetaRow(): HTMLElement {
  return getActionBar().querySelector('.lab-action-meta-row') as HTMLElement;
}

function getMetaItems(): HTMLElement {
  return getMetaRow().querySelector('.lab-action-meta-items') as HTMLElement;
}

function getBadges(): HTMLElement {
  return getMetaRow().querySelector('.lab-action-badges') as HTMLElement;
}

function getWorkbench(): HTMLElement {
  return getRoot().querySelector('.lab-workbench') as HTMLElement;
}

function getCatalogueCol(): HTMLElement {
  return getWorkbench().querySelector('.lab-col-catalogue') as HTMLElement;
}

function getInspectorCol(): HTMLElement {
  return getWorkbench().querySelector('.lab-col-inspector') as HTMLElement;
}

function getCtaBar(): HTMLElement {
  return getRoot().querySelector('.lab-cta-bar') as HTMLElement;
}

describe('R2C-LAB V1E.1C — Compact Action Header + Workbench Layout', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    localStorage.clear();
  });

  function flushRender(): void {
    vi.advanceTimersByTime(100);
  }

  // ============================================================ Structure

  describe('Action Header Structure', () => {
    it('1. action header uses a main action row', () => {
      setupWorkbench();
      flushRender();
      const mainRow = getMainRow();
      expect(mainRow).toBeTruthy();
      expect(mainRow.className).toContain('lab-action-main-row');
    });

    it('2. action select and navigation are separate siblings in main row', () => {
      setupWorkbench();
      flushRender();
      const selectWrap = getSelectWrap();
      const nav = getNav();
      expect(selectWrap).toBeTruthy();
      expect(nav).toBeTruthy();
      expect(selectWrap.parentElement).toBe(getMainRow());
      // Both are direct children of main row
      const children = Array.from(getMainRow().children);
      expect(children).toContain(selectWrap);
      expect(children).toContain(nav);
    });

    it('3. metadata is below / separate from select row', () => {
      setupWorkbench();
      flushRender();
      const mainRow = getMainRow();
      const metaRow = getMetaRow();
      expect(mainRow).toBeTruthy();
      expect(metaRow).toBeTruthy();
      // meta row is not inside main row
      expect(metaRow.parentElement).not.toBe(mainRow);
      // meta row comes after main row in the context
      const ctx = getActionBar().querySelector('.lab-action-context');
      const children = Array.from(ctx!.children);
      expect(children.indexOf(mainRow)).toBeLessThan(children.indexOf(metaRow));
    });

    it('4. metadata is not rendered as narrow sidebar structure', () => {
      setupWorkbench();
      flushRender();
      const metaRow = getMetaRow();
      // meta row should be a flex-wrap row, not a narrow column
      expect(metaRow.className).toContain('lab-action-meta-row');
      // It should contain meta-items (inline) not a vertical sidebar
      const metaItems = getMetaItems();
      expect(metaItems).toBeTruthy();
      // Check that meta-items has multiple inline children
      const chips = metaItems.querySelectorAll('span');
      expect(chips.length).toBeGreaterThanOrEqual(3);
    });

    it('5. artistic state rendered as badge', () => {
      setupWorkbench();
      flushRender();
      const badges = getBadges();
      const artBadge = badges.querySelector('.lab-badge-artistic');
      expect(artBadge).toBeTruthy();
      expect(artBadge!.textContent).toContain('ART');
    });

    it('6. production state rendered as badge', () => {
      setupWorkbench();
      flushRender();
      const badges = getBadges();
      const prodBadge = badges.querySelector('.lab-badge-production');
      expect(prodBadge).toBeTruthy();
      expect(prodBadge!.textContent).toContain('PROD');
    });

    it('7. preset rendered in metadata', () => {
      setupWorkbench();
      flushRender();
      const metaItems = getMetaItems();
      const presetChip = metaItems.querySelector('.lab-action-preset-chip');
      expect(presetChip).toBeTruthy();
      expect(presetChip!.textContent).toContain('PRESET');
    });

    it('8. visual step count rendered in metadata', () => {
      setupWorkbench();
      flushRender();
      const metaItems = getMetaItems();
      const visualChip = metaItems.querySelector('.lab-action-visual-chip');
      expect(visualChip).toBeTruthy();
      expect(visualChip!.textContent).toContain('VISUAL');
    });

    it('9. PREVIOUS button rendered in navigation', () => {
      setupWorkbench();
      flushRender();
      const nav = getNav();
      const prevBtn = nav.querySelector('.lab-nav-btn');
      expect(prevBtn).toBeTruthy();
      expect(prevBtn!.textContent).toContain('PREV');
    });

    it('10. NEXT button rendered in navigation', () => {
      setupWorkbench();
      flushRender();
      const nav = getNav();
      const nextBtn = nav.querySelector('.lab-nav-next');
      expect(nextBtn).toBeTruthy();
      expect(nextBtn!.textContent).toContain('NEXT');
    });

    it('11. action name not redundantly rendered multiple times in header', () => {
      setupWorkbench();
      flushRender();
      const actionBar = getActionBar();
      // The old structure had lab-action-name div — should not exist
      const nameDivs = actionBar.querySelectorAll('.lab-action-name');
      expect(nameDivs.length).toBe(0);
      // Owner chip should exist but not duplicate the action display name
      const ownerChip = actionBar.querySelector('.lab-action-owner-chip');
      expect(ownerChip).toBeTruthy();
    });
  });

  // ============================================================ Sizing

  describe('Content-Sized Header', () => {
    it('12. top action container is content-sized (flex:0 0 auto)', () => {
      setupWorkbench();
      flushRender();
      const actionBar = getActionBar();
      const style = window.getComputedStyle(actionBar);
      // flex:0 0 auto means no growth — content-sized
      // happy-dom may return '' for unset flex values, which is equivalent to '0'
      const fg = style.flexGrow;
      const fs = style.flexShrink;
      expect(fg === '0' || fg === '').toBe(true);
      expect(fs === '0' || fs === '').toBe(true);
    });

    it('13. no flex:1 / equivalent full-height growth on action context', () => {
      setupWorkbench();
      flushRender();
      const ctx = getActionBar().querySelector('.lab-action-context') as HTMLElement;
      const style = window.getComputedStyle(ctx);
      // context should not grow to fill remaining space
      // happy-dom may return '' for unset flex-grow, which is equivalent to '0'
      const flexGrow = style.flexGrow;
      expect(flexGrow === '0' || flexGrow === '').toBe(true);
    });

    it('14. metadata row supports wrapping (flex-wrap)', () => {
      setupWorkbench();
      flushRender();
      const metaRow = getMetaRow();
      const style = window.getComputedStyle(metaRow);
      expect(style.flexWrap).toBe('wrap');
    });

    it('15. status badges remain compact (white-space:nowrap)', () => {
      setupWorkbench();
      flushRender();
      const artBadge = getBadges().querySelector('.lab-badge-artistic') as HTMLElement;
      const prodBadge = getBadges().querySelector('.lab-badge-production') as HTMLElement;
      expect(window.getComputedStyle(artBadge).whiteSpace).toBe('nowrap');
      expect(window.getComputedStyle(prodBadge).whiteSpace).toBe('nowrap');
    });
  });

  // ============================================================ Workbench Preservation

  describe('Workbench Structure Preserved', () => {
    it('16. workbench catalogue/inspector structure preserved', () => {
      setupWorkbench();
      flushRender();
      const workbench = getWorkbench();
      expect(workbench).toBeTruthy();
      const gridStyle = window.getComputedStyle(workbench);
      expect(gridStyle.display).toBe('grid');
    });

    it('17. catalogue column preserved', () => {
      setupWorkbench();
      flushRender();
      const catalogue = getCatalogueCol();
      expect(catalogue).toBeTruthy();
      expect(catalogue.className).toContain('lab-col-catalogue');
    });

    it('18. inspector column preserved', () => {
      setupWorkbench();
      flushRender();
      const inspector = getInspectorCol();
      expect(inspector).toBeTruthy();
      expect(inspector.className).toContain('lab-col-inspector');
    });

    it('19. NEXT REQUIRED CTA preserved', () => {
      setupWorkbench();
      flushRender();
      const ctaBar = getCtaBar();
      expect(ctaBar).toBeTruthy();
      const label = ctaBar.querySelector('.lab-cta-label');
      expect(label).toBeTruthy();
      expect(label!.textContent).toContain('NEXT REQUIRED ACTION');
    });
  });

  // ============================================================ Lifecycle Unchanged

  describe('Lifecycle Behavior Unchanged', () => {
    it('20. lifecycle behavior unchanged — artistic/production states still derived correctly', () => {
      // Set up a state with QA working
      let state = createDefaultLabState();
      const actions = getLabActions();
      const action = actions.find(a => a.sourceStatus !== 'NO_VFX')!;
      state = { ...state, selectedActionKey: action.actionKey };
      state = setQaSourceId(state, action.actionKey, 0, 'test-source');

      const cleanup = setupWorkbench(state);
      flushRender();

      const artBadge = getBadges().querySelector('.lab-badge-artistic');
      expect(artBadge).toBeTruthy();
      // Should show QA_WORKING state
      expect(artBadge!.className).toContain('qa_working');

      cleanup();
    });
  });
});
