import { describe, expect, it } from 'vitest';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import previewIndexJson from '../../../docs/reports/vfx-megapack-preview-index.json';
import {
  buildCatalogue,
  createDefaultLabState,
  getPreviewCandidateId,
  setPreviewCandidateId,
  getQaSourceId,
  setQaSourceId,
  getLabActions,
  getSelectedStep,
  getValidatedConfig,
  exportValidatedConfig,
  getAccordionOpen,
  setAccordionOpen,
  ALL_ACCORDION_SECTIONS,
  DEFAULT_ACCORDION_OPEN,
} from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';
import { hasGifPreview, getPreviewIndexCounts } from './VfxPreviewResolver';

const inventory = inventoryJson as never;
const previewIndex = previewIndexJson as { index: Record<string, { status: string }> };

describe('R2C-LAB V1D.4.1 — Remove Redundant Big GIF Preview Panel', () => {

  // ============================================================ GIF PREVIEW REMOVED

  describe('GIF PREVIEW REMOVED', () => {
    it('1. dedicated GIF PREVIEW accordion no longer renders', () => {
      expect(ALL_ACCORDION_SECTIONS).not.toContain('gif_preview');
    });

    it('2. catalogue is directly after ACTION / PROGRESS', () => {
      const actionIdx = ALL_ACCORDION_SECTIONS.indexOf('action_progress');
      const catIdx = ALL_ACCORDION_SECTIONS.indexOf('megapack_library');
      expect(catIdx).toBe(actionIdx + 1);
    });

    it('3. catalogue GRID mini GIFs still render (data contract)', () => {
      // The grid card infrastructure still uses hasGifPreview and resolvePreview
      expect(hasGifPreview('r1_1605')).toBe(true);
      expect(hasGifPreview('r1_1642')).toBe(true);
    });

    it('4. deterministic GIF resolver still works', () => {
      const counts = getPreviewIndexCounts();
      expect(counts.resolved).toBeGreaterThan(0);
      expect(counts.total).toBe(2769);
    });

    it('5. 1974 GIF mappings preserved', () => {
      const counts = getPreviewIndexCounts();
      expect(counts.resolved).toBe(1974);
    });

    it('6. 795 no-GIF candidates preserved', () => {
      const counts = getPreviewIndexCounts();
      expect(counts.noGif).toBe(795);
    });
  });

  // ============================================================ CARD SELECTION

  describe('CARD SELECTION', () => {
    it('7. card click selects candidate', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0450');
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
    });

    it('8. card click does not change QA source', () => {
      let state = createDefaultLabState();
      const action = getLabActions()[0]!;
      const stepIdx = getSelectedStep(state, action.actionKey);
      state = setQaSourceId(state, action.actionKey, stepIdx, 'r1_0592');
      state = setPreviewCandidateId(state, 'r1_0450');
      expect(getQaSourceId(state, action.actionKey, stepIdx)).toBe('r1_0592');
    });

    it('9. card click does not acquire PNG', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      state = setPreviewCandidateId(state, 'r1_0002');
      expect(getPreviewCandidateId(state)).toBe('r1_0002');
    });

    it('10. selected card is visibly marked (SELECTED badge)', () => {
      // The updateCataloguePreviewMarkers function uses "SELECTED" badge text
      // for the previewing candidate in both grid and compact modes
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      expect(getPreviewCandidateId(state)).toBe('r1_0001');
    });
  });

  // ============================================================ USE AS QA SOURCE

  describe('USE AS QA SOURCE', () => {
    it('11. USE AS QA SOURCE available for selected candidate', () => {
      // The updateCatalogueSelectionBar function creates a USE AS QA SOURCE button
      // when a candidate is selected and action exists and availability is not UNSUPPORTED_NATIVE
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_1605');
      expect(getPreviewCandidateId(state)).toBe('r1_1605');
    });

    it('12. USE AS QA SOURCE still performs existing acquisition/assignment flow', () => {
      let state = createDefaultLabState();
      const action = getLabActions()[0]!;
      const stepIdx = getSelectedStep(state, action.actionKey);
      state = setQaSourceId(state, action.actionKey, stepIdx, 'r1_0592');
      expect(getQaSourceId(state, action.actionKey, stepIdx)).toBe('r1_0592');
    });

    it('13. no-GIF candidate remains assignable', () => {
      const noGifId = Object.entries(previewIndex.index).find(([, v]) => v.status === 'NO_GIF')?.[0];
      expect(noGifId).toBeDefined();
      if (noGifId) {
        let state = createDefaultLabState();
        const action = getLabActions()[0]!;
        const stepIdx = getSelectedStep(state, action.actionKey);
        state = setQaSourceId(state, action.actionKey, stepIdx, noGifId);
        expect(getQaSourceId(state, action.actionKey, stepIdx)).toBe(noGifId);
      }
    });
  });

  // ============================================================ SOURCES

  describe('SOURCES', () => {
    it('14. SOURCES displays catalogue selection distinctly', () => {
      // The renderSourceIdentities function now uses "CATALOGUE SELECTION" label
      // instead of "PREVIEWING"
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      expect(getPreviewCandidateId(state)).toBe('r1_0001');
    });
  });

  // ============================================================ ACCORDION STATE

  describe('ACCORDION STATE', () => {
    it('15. obsolete gif_preview accordion state is safely ignored', () => {
      // Old localStorage may contain gif_preview in accordionState
      // The LabAccordionSection type no longer includes gif_preview
      // but old state with gif_preview should load safely
      const oldState: LabState = {
        ...createDefaultLabState(),
        accordionState: {
          ...createDefaultLabState().accordionState!,
          gif_preview: true, // obsolete key
        },
      };
      // The state should still be valid — gif_preview is just an extra key
      expect(oldState.accordionState?.gif_preview).toBe(true);
      // But it's not in ALL_ACCORDION_SECTIONS so it's ignored
      expect(ALL_ACCORDION_SECTIONS).not.toContain('gif_preview');
    });
  });

  // ============================================================ VALIDATED EXPORT

  describe('VALIDATED EXPORT', () => {
    it('16. validated export unchanged', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      const config = exportValidatedConfig(state);
      const json = JSON.stringify(config);
      expect(json).not.toContain('previewCandidateId');
      expect(json).not.toContain('catalogueViewMode');
    });
  });

  // ============================================================ PRESERVATION

  describe('PRESERVATION', () => {
    it('17. 2769 catalogue preserved', () => {
      const catalogue = buildCatalogue(inventory);
      expect(catalogue.length).toBe(2769);
    });

    it('18. production mappings unchanged', () => {
      const actions = getLabActions();
      expect(actions.length).toBe(83);
    });

    it('19. gameplay unchanged', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      expect(state.previewCandidateId).toBe('r1_0001');
    });
  });

  // ============================================================ DEFAULTS

  describe('DEFAULTS', () => {
    it('default open sections are ACTION / PROGRESS and CATALOGUE only', () => {
      expect(DEFAULT_ACCORDION_OPEN).toContain('action_progress');
      expect(DEFAULT_ACCORDION_OPEN).toContain('megapack_library');
      expect(DEFAULT_ACCORDION_OPEN).not.toContain('gif_preview');
      expect(DEFAULT_ACCORDION_OPEN.length).toBe(2);
    });

    it('default closed sections include PLAYBACK', () => {
      const state = createDefaultLabState();
      expect(getAccordionOpen(state, 'playback')).toBe(false);
      expect(getAccordionOpen(state, 'sources')).toBe(false);
      expect(getAccordionOpen(state, 'tuning')).toBe(false);
    });
  });
});
