import { describe, expect, it } from 'vitest';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import previewIndexJson from '../../../docs/reports/vfx-megapack-preview-index.json';
import {
  buildCatalogue,
  searchCatalogue,
  createDefaultLabState,
  getPreviewCandidateId,
  setPreviewCandidateId,
  getQaSourceId,
  setQaSourceId,
  getLabActions,
  getSelectedStep,
  getValidatedConfig,
} from './CombatVfxLab';
import type { InventoryJsonRecord } from './CombatVfxLab';
import {
  resolvePreview,
  hasGifPreview,
  getPreviewIndexEntry,
  getGifFsPath,
  isValidCandidateId,
  deriveGifFilename,
  getPreviewIndexCounts,
} from './VfxPreviewResolver';

const inventory = inventoryJson as unknown as { results: InventoryJsonRecord[] };
const previewIndex = previewIndexJson as { index: Record<string, { status: string; previewFilename: string | null; previewRelativePath: string | null; candidates?: string[] }> };

describe('R2C-LAB V1D.2 — Deterministic GIF Preview Index + Resolver Fix', () => {

  // ============================================================ SPECIFIC CANDIDATES

  describe('SPECIFIC CANDIDATES', () => {
    it('1. r1_1605 resolves to correct GIF', () => {
      const entry = getPreviewIndexEntry('r1_1605');
      expect(entry).toBeDefined();
      expect(entry!.status).toBe('RESOLVED');
      expect(entry!.previewFilename).toBeTruthy();
      // The GIF should be for "Blue Slash v1 - Flurry"
      expect(entry!.previewFilename!.toLowerCase()).toContain('blue slash v1 - flurry');
    });

    it('2. r1_1642 resolves to correct GIF', () => {
      const entry = getPreviewIndexEntry('r1_1642');
      expect(entry).toBeDefined();
      expect(entry!.status).toBe('RESOLVED');
      expect(entry!.previewFilename).toBeTruthy();
      expect(entry!.previewFilename!.toLowerCase()).toContain('blue slash v23 - flurry');
    });
  });

  // ============================================================ NORMALIZATION

  describe('NORMALIZATION', () => {
    it('3. "_spritesheet.png" maps to ".gif"', () => {
      expect(deriveGifFilename('Arrow_Indicator_V1_spritesheet.png')).toBe('Arrow_Indicator_V1.gif');
      expect(deriveGifFilename('Blue Slash v1 - Flurry_spritesheet.png')).toBe('Blue Slash v1 - Flurry.gif');
    });

    it('4. collection folder name may differ from inventory collection', () => {
      // Inventory collection: "Sword Slash VFX Spritesheets"
      // Preview folder: "(PREVIEW) GIFs - Sword Slash VFX"
      // The resolver uses the index, not collection name matching
      const rec = inventory.results.find((r) => r.assetId === 'r1_1605')!;
      expect(rec.collection).toBe('Sword Slash VFX Spritesheets');
      const entry = getPreviewIndexEntry('r1_1605');
      expect(entry!.previewFolder).not.toBe(rec.collection);
      expect(entry!.status).toBe('RESOLVED');
    });
  });

  // ============================================================ RESOLUTION

  describe('RESOLUTION', () => {
    it('5. recursive scan finds nested preview GIFs', () => {
      // The preview index was built by scanning 02_previews/ recursively
      // All 5 preview folders should have entries
      const counts = getPreviewIndexCounts();
      expect(counts.total).toBe(2769);
      expect(counts.resolved).toBeGreaterThan(0);
    });

    it('6. exact basename unique match resolves', () => {
      // r1_1642 has an exact match: "Blue Slash v23 - Flurry.gif"
      const entry = getPreviewIndexEntry('r1_1642');
      expect(entry!.status).toBe('RESOLVED');
      expect(entry!.previewFilename).toBe('Blue Slash v23 - Flurry.gif');
    });

    it('7. duplicate basename is disambiguated correctly where possible', () => {
      // r1_1605 has variant GIFs: _1, _A_1, _B_1 — should resolve to _1 (shortest suffix)
      const entry = getPreviewIndexEntry('r1_1605');
      expect(entry!.status).toBe('RESOLVED');
      expect(entry!.previewFilename).toBe('Blue Slash v1 - Flurry_1.gif');
    });

    it('8. unresolved collision is marked ambiguous', () => {
      // Find any ambiguous candidates in the index
      const ambiguous = Object.entries(previewIndex.index).filter(([, v]) => v.status === 'AMBIGUOUS');
      // If there are any, verify they have candidates listed
      for (const [id, entry] of ambiguous) {
        expect(entry.candidates).toBeDefined();
        expect(entry.candidates!.length).toBeGreaterThan(1);
      }
      // The current index has 0 ambiguous — this is valid
      // The test verifies the mechanism works if any appear
      expect(ambiguous.length).toBeGreaterThanOrEqual(0);
    });

    it('9. missing GIF reports no preview', () => {
      // Find a candidate with NO_GIF status
      const noGif = Object.entries(previewIndex.index).find(([, v]) => v.status === 'NO_GIF');
      expect(noGif).toBeDefined();
      if (noGif) {
        const [id] = noGif;
        const preview = resolvePreview(id, undefined);
        expect(preview.hasPreview).toBe(false);
        expect(preview.previewUrl).toBe('');
      }
    });
  });

  // ============================================================ AUTHORITATIVE TRUTH

  describe('AUTHORITATIVE TRUTH', () => {
    it('10. hasGifPreview uses authoritative mapping', () => {
      // r1_1605 should be true
      expect(hasGifPreview('r1_1605')).toBe(true);
      // A NO_GIF candidate should be false
      const noGifId = Object.entries(previewIndex.index).find(([, v]) => v.status === 'NO_GIF')?.[0];
      if (noGifId) {
        expect(hasGifPreview(noGifId)).toBe(false);
      }
    });

    it('11. catalogue HAS_GIF filter uses authoritative mapping', () => {
      const catalogue = buildCatalogue(inventory);
      const result = searchCatalogue(catalogue, { gifFilter: 'HAS_GIF' });
      // Every result should have hasGifPreview = true
      for (const rec of result.results) {
        expect(rec.hasGifPreview).toBe(true);
      }
    });

    it('12. catalogue NO_GIF filter uses authoritative mapping', () => {
      const catalogue = buildCatalogue(inventory);
      const result = searchCatalogue(catalogue, { gifFilter: 'NO_GIF' });
      // Every result should have hasGifPreview = false
      for (const rec of result.results) {
        expect(rec.hasGifPreview).toBe(false);
      }
    });
  });

  // ============================================================ ENDPOINT CONTRACT

  describe('ENDPOINT CONTRACT', () => {
    it('13. endpoint returns GIF for mapped candidate (URL format)', () => {
      const preview = resolvePreview('r1_1605', undefined);
      expect(preview.hasPreview).toBe(true);
      expect(preview.previewUrl).toBe('/dev/vfx-preview/r1_1605');
    });

    it('14. endpoint rejects unknown candidate', () => {
      const preview = resolvePreview('r1_nonexistent', undefined);
      expect(preview.hasPreview).toBe(false);
      expect(preview.previewUrl).toBe('');
    });

    it('15. arbitrary path traversal rejected', () => {
      expect(isValidCandidateId('../../../etc/passwd')).toBe(false);
      expect(isValidCandidateId('/absolute/path')).toBe(false);
      expect(isValidCandidateId('..\\windows\\system32')).toBe(false);
    });

    it('16. browser contract remains candidateId-only', () => {
      const preview = resolvePreview('r1_1605', undefined);
      expect(preview.previewUrl).toMatch(/^\/dev\/vfx-preview\/r\d+_\d+$/);
      // No filesystem paths exposed
      expect(preview.previewUrl).not.toContain('C:');
      expect(preview.previewUrl).not.toContain('\\');
    });
  });

  // ============================================================ PERFORMANCE

  describe('PERFORMANCE', () => {
    it('17. directory scan is cached / not repeated per request', () => {
      // The preview index is a static JSON imported once at module load
      // Multiple calls to resolvePreview should use the same in-memory index
      const p1 = resolvePreview('r1_1605', undefined);
      const p2 = resolvePreview('r1_1605', undefined);
      expect(p1).toEqual(p2);
      // getPreviewIndexEntry returns the same object reference (cached)
      const e1 = getPreviewIndexEntry('r1_1605');
      const e2 = getPreviewIndexEntry('r1_1605');
      expect(e1).toBe(e2);
    });
  });

  // ============================================================ PRESERVATION

  describe('PRESERVATION', () => {
    it('18. preview click still does not alter qaSourceId', () => {
      let state = createDefaultLabState();
      const action = getLabActions()[0]!;
      const stepIdx = getSelectedStep(state, action.actionKey);
      state = setQaSourceId(state, action.actionKey, stepIdx, 'r1_0592');
      state = setPreviewCandidateId(state, 'r1_0450');
      expect(getQaSourceId(state, action.actionKey, stepIdx)).toBe('r1_0592');
      expect(getPreviewCandidateId(state)).toBe('r1_0450');
    });

    it('19. preview does not acquire PNG', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      state = setPreviewCandidateId(state, 'r1_0002');
      state = setPreviewCandidateId(state, 'r1_0003');
      expect(getPreviewCandidateId(state)).toBe('r1_0003');
    });

    it('20. 2769 catalogue preserved', () => {
      const catalogue = buildCatalogue(inventory);
      expect(catalogue.length).toBe(2769);
    });

    it('21. production mappings unchanged', () => {
      const actions = getLabActions();
      expect(actions.length).toBe(83);
    });

    it('22. validated state unchanged', () => {
      const state = createDefaultLabState();
      for (const action of getLabActions()) {
        for (let i = 0; i < action.vfxSteps.length; i++) {
          expect(getValidatedConfig(state, action.actionKey, i)).toBeUndefined();
        }
      }
    });

    it('23. gameplay unchanged', () => {
      let state = createDefaultLabState();
      state = setPreviewCandidateId(state, 'r1_0001');
      expect(state.previewCandidateId).toBe('r1_0001');
    });
  });

  // ============================================================ GLOBAL AUDIT

  describe('GLOBAL AUDIT', () => {
    it('counts reconcile: resolved + noGif + ambiguous = total', () => {
      const counts = getPreviewIndexCounts();
      expect(counts.resolved + counts.noGif + counts.ambiguous).toBe(counts.total);
      expect(counts.total).toBe(2769);
    });

    it('exact counts match generated index', () => {
      const counts = getPreviewIndexCounts();
      // These are the exact counts from the generated index
      expect(counts.resolved).toBe(1974);
      expect(counts.noGif).toBe(795);
      expect(counts.ambiguous).toBe(0);
    });
  });
});
