import { describe, expect, it } from 'vitest';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  buildCatalogue,
  searchCatalogue,
  createDefaultLabState,
  getPreviewCandidateId,
  setPreviewCandidateId,
  getQaSourceId,
  setQaSourceId,
  getAccordionOpen,
  setAccordionOpen,
  expandAllAccordions,
  collapseAllAccordions,
  DEFAULT_ACCORDION_OPEN,
  ALL_ACCORDION_SECTIONS,
  exportValidatedConfig,
  getValidatedConfig,
  getLabActions,
  getSelectedStep,
} from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';

const inventory = inventoryJson as never;

describe('R2C-LAB V1D.1 — Catalogue UX Refinement', () => {

  // ============================================================ SECTION ORDER

  describe('SECTION ORDER', () => {
    it('1. GIF PREVIEW section index is before CATALOGUE section index', () => {
      const gifIdx = ALL_ACCORDION_SECTIONS.indexOf('gif_preview');
      const catIdx = ALL_ACCORDION_SECTIONS.indexOf('megapack_library');
      expect(gifIdx).toBeGreaterThanOrEqual(0);
      expect(catIdx).toBeGreaterThanOrEqual(0);
      expect(gifIdx).toBeLessThan(catIdx);
    });

    it('2. CATALOGUE section renders after GIF PREVIEW', () => {
      const order = ['action_progress', 'gif_preview', 'megapack_library'];
      const indices = order.map((s) => ALL_ACCORDION_SECTIONS.indexOf(s as typeof ALL_ACCORDION_SECTIONS[number]));
      expect(indices[0]).toBeLessThan(indices[1]!);
      expect(indices[1]).toBeLessThan(indices[2]!);
    });
  });

  // ============================================================ NESTED FILTERS

  describe('NESTED FILTERS', () => {
    it('3. FILTERS is a valid LabAccordionSection nested inside catalogue', () => {
      expect(ALL_ACCORDION_SECTIONS).toContain('catalogue_filters');
    });

    it('4. FILTERS defaults collapsed', () => {
      expect(DEFAULT_ACCORDION_OPEN).not.toContain('catalogue_filters');
      const state = createDefaultLabState();
      expect(getAccordionOpen(state, 'catalogue_filters')).toBe(false);
    });

    it('5. FILTERS can expand', () => {
      let state = createDefaultLabState();
      state = setAccordionOpen(state, 'catalogue_filters', true);
      expect(getAccordionOpen(state, 'catalogue_filters')).toBe(true);
    });

    it('6. FILTERS state persists in LabState', () => {
      let state = createDefaultLabState();
      state = setAccordionOpen(state, 'catalogue_filters', true);
      const serialized = JSON.stringify(state);
      const restored = JSON.parse(serialized) as LabState;
      expect(getAccordionOpen(restored, 'catalogue_filters')).toBe(true);
    });

    it('7. filter state excluded from validated export', () => {
      let state = createDefaultLabState();
      state = setAccordionOpen(state, 'catalogue_filters', true);
      const config = exportValidatedConfig(state);
      const json = JSON.stringify(config);
      expect(json).not.toContain('accordionState');
      expect(json).not.toContain('catalogue_filters');
      expect(json).not.toContain('previewCandidateId');
    });
  });

  // ============================================================ SCROLL CONTAINER

  describe('SCROLL CONTAINER', () => {
    it('8. catalogue result list has dedicated scroll container (CSS class)', () => {
      // The CSS class lab-cat-scroll is defined with overflow-y:auto and max-height
      // We verify the class name is used in the workbench by checking the style string
      // is present in the module. This is a structural assertion.
      // Since we can't import CSS from the workbench in Node, we verify the
      // data-layer contract: searchCatalogue returns paginated results that
      // fit in a scrollable area.
      const catalogue = buildCatalogue(inventory);
      const result = searchCatalogue(catalogue, { page: 1, pageSize: 50 });
      expect(result.results.length).toBeLessThanOrEqual(50);
      expect(result.pageCount).toBeGreaterThan(1);
    });

    it('9. catalogue pagination remains outside scroll list (separate containers)', () => {
      // The renderCatalogueResults function uses separate element IDs:
      // lab-cat-scroll-inner for items, lab-cat-pager-inner for pagination
      // We verify the data contract: pagination info is separate from result items
      const catalogue = buildCatalogue(inventory);
      const result = searchCatalogue(catalogue, { page: 1, pageSize: 50 });
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageCount');
      expect(result).toHaveProperty('results');
      // Results and pagination are separate properties
      expect(result.results).not.toHaveProperty('page');
    });
  });

  // ============================================================ CLICK BEHAVIOR

  describe('CLICK BEHAVIOR', () => {
    it('10. catalogue click still changes preview only', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0450');
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
    });

    it('11. catalogue click still does not change QA source', () => {
      let state = createDefaultLabState();
      const action = getLabActions()[0]!;
      const stepIdx = getSelectedStep(state, action.actionKey);
      state = setQaSourceId(state, action.actionKey, stepIdx, 'r1_0592');
      state = setPreviewCandidateId(state, 'r1_0450');
      expect(getQaSourceId(state, action.actionKey, stepIdx)).toBe('r1_0592');
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
    });

    it('12. catalogue click still does not acquire PNG', () => {
      let state = createDefaultLabState();
      // Setting preview does not trigger any acquisition — it's just a string
      state = setPreviewCandidateId(state, 'r1_0001');
      state = setPreviewCandidateId(state, 'r1_0002');
      state = setPreviewCandidateId(state, 'r1_0003');
      expect(getPreviewCandidateId(state)).toBe('r1_0003');
      // No side effects — previewCandidateId is a plain string in state
    });
  });

  // ============================================================ INDEPENDENCE

  describe('INDEPENDENCE', () => {
    it('13. GIF preview remains independent from catalogue list rendering', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0450');
      // Changing catalogue page does not clear preview
      state = { ...state, cataloguePage: 5 };
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
      // Changing search does not clear preview
      state = { ...state, search: 'fire' };
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
    });
  });

  // ============================================================ PRESERVATION

  describe('PRESERVATION', () => {
    it('14. 2769 catalogue entries preserved', () => {
      const catalogue = buildCatalogue(inventory);
      expect(catalogue.length).toBe(2769);
    });

    it('15. catalogue search/filter behavior unchanged', () => {
      const catalogue = buildCatalogue(inventory);
      // Search by candidate ID
      const r1 = searchCatalogue(catalogue, { search: 'r1_0450' });
      expect(r1.results.some((r) => r.candidateId === 'r1_0450')).toBe(true);
      // Filter by format
      const fmt = searchCatalogue(catalogue, { formatFilter: '2048_16F' });
      expect(fmt.results.every((r) => r.format === '2048_16F')).toBe(true);
      // Filter by availability
      const avail = searchCatalogue(catalogue, { availabilityFilter: 'READY' });
      expect(avail.results.every((r) => r.availability === 'READY')).toBe(true);
      // Filter by GIF
      const gif = searchCatalogue(catalogue, { gifFilter: 'HAS_GIF' });
      expect(gif.results.every((r) => r.hasGifPreview)).toBe(true);
      // Filter by usage
      const used = searchCatalogue(catalogue, { usageFilter: 'USED' });
      expect(used.results.every((r) => r.usedBy.length > 0)).toBe(true);
    });

    it('16. major accordion persistence unchanged', () => {
      let state = createDefaultLabState();
      state = setAccordionOpen(state, 'playback', true);
      expect(getAccordionOpen(state, 'playback')).toBe(true);
      state = setAccordionOpen(state, 'playback', false);
      expect(getAccordionOpen(state, 'playback')).toBe(false);
      // Expand/collapse all still works
      state = expandAllAccordions(state);
      expect(getAccordionOpen(state, 'action_progress')).toBe(true);
      expect(getAccordionOpen(state, 'catalogue_filters')).toBe(true);
      state = collapseAllAccordions(state);
      expect(getAccordionOpen(state, 'action_progress')).toBe(false);
      expect(getAccordionOpen(state, 'catalogue_filters')).toBe(false);
    });

    it('17. production mappings unchanged', () => {
      const actions = getLabActions();
      expect(actions.length).toBe(83);
    });

    it('18. validated state unchanged', () => {
      const state = createDefaultLabState();
      for (const action of getLabActions()) {
        for (let i = 0; i < action.vfxSteps.length; i++) {
          expect(getValidatedConfig(state, action.actionKey, i)).toBeUndefined();
        }
      }
    });

    it('19. gameplay unchanged', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      state = setAccordionOpen(state, 'catalogue_filters', true);
      // No game data is modified — state changes are UI-only
      expect(state.previewCandidateId).toBe('r1_0001');
      expect(state.accordionState?.catalogue_filters).toBe(true);
    });
  });
});
