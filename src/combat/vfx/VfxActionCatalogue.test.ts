// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabActions,
  getLabAction,
  buildCatalogue,
  searchCatalogue,
  getCatalogue,
  getVisualSpriteSheetSteps,
  isLabEnabled,
  LAB_STORAGE_KEY,
  createDefaultLabState,
  serializeLabState,
  deserializeLabState,
} from './CombatVfxLab';
import type { LabAction, LabCatalogueRecord } from './CombatVfxLab';

describe('VfxActionCatalogue — reusable Lab infrastructure', () => {

  // ---------------------------------------------------------- action list

  describe('getLabActions / getLabAction', () => {
    it('returns a non-empty readonly list', () => {
      const actions = getLabActions();
      expect(actions.length).toBeGreaterThan(0);
    });

    it('every action has a unique actionKey', () => {
      const keys = getLabActions().map((a) => a.actionKey);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('getLabAction returns the matching action', () => {
      const first = getLabActions()[0]!;
      expect(getLabAction(first.actionKey)).toBe(first);
    });

    it('getLabAction returns undefined for unknown key', () => {
      expect(getLabAction('nonexistent_action')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------- catalogue

  describe('buildCatalogue', () => {
    const catalogue = buildCatalogue(inventoryJson as never);

    it('returns 2769 candidates', () => {
      expect(catalogue.length).toBe(2769);
    });

    it('every record has a candidateId and sourceFilename', () => {
      for (const rec of catalogue) {
        expect(rec.candidateId).toBeTruthy();
        expect(rec.sourceFilename).toBeTruthy();
      }
    });

    it('every record has a format string', () => {
      for (const rec of catalogue) {
        expect(typeof rec.format).toBe('string');
        expect(rec.format.length).toBeGreaterThan(0);
      }
    });
  });

  describe('searchCatalogue', () => {
    const catalogue = buildCatalogue(inventoryJson as never);

    it('searches by candidate ID', () => {
      const result = searchCatalogue(catalogue, { search: 'r1_1709' });
      expect(result.totalFiltered).toBeGreaterThan(0);
      expect(result.results.every((r) => r.candidateId.includes('r1_1709'))).toBe(true);
    });

    it('searches by filename', () => {
      const result = searchCatalogue(catalogue, { search: 'flamethrower' });
      expect(result.totalFiltered).toBeGreaterThan(0);
    });

    it('filters by format 2048_16F', () => {
      const result = searchCatalogue(catalogue, { formatFilter: '2048_16F' });
      expect(result.totalFiltered).toBe(309);
    });

    it('filters by format 4096_64F', () => {
      const result = searchCatalogue(catalogue, { formatFilter: '4096_64F' });
      expect(result.totalFiltered).toBe(2456);
    });

    it('paginates results', () => {
      const result = searchCatalogue(catalogue, { page: 1, pageSize: 50 });
      expect(result.results.length).toBe(50);
      expect(result.pageCount).toBe(Math.ceil(2769 / 50));
    });

    it('clamps page to valid range', () => {
      const result = searchCatalogue(catalogue, { page: 999, pageSize: 50 });
      expect(result.page).toBeLessThanOrEqual(result.pageCount);
    });

    it('returns empty for non-matching search', () => {
      const result = searchCatalogue(catalogue, { search: 'zzz_nonexistent_zzz' });
      expect(result.totalFiltered).toBe(0);
    });
  });

  // ---------------------------------------------------------- visual steps

  describe('getVisualSpriteSheetSteps', () => {
    it('returns visual spriteSheet steps for an action', () => {
      const action = getLabActions().find((a) => a.vfxSteps.some((s) => s.stepType === 'spriteSheet'));
      if (!action) return;
      const steps = getVisualSpriteSheetSteps(action);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.every((s) => s.stepIndex >= 0)).toBe(true);
    });
  });

  // ---------------------------------------------------------- isLabEnabled

  describe('isLabEnabled', () => {
    it('returns true when vfxlab=1', () => {
      expect(isLabEnabled(new URLSearchParams('vfxlab=1'))).toBe(true);
    });

    it('returns false when vfxlab is absent', () => {
      expect(isLabEnabled(new URLSearchParams('qa=1'))).toBe(false);
    });

    it('returns false when vfxlab=0', () => {
      expect(isLabEnabled(new URLSearchParams('vfxlab=0'))).toBe(false);
    });
  });

  // ---------------------------------------------------------- lab state

  describe('lab state serialization', () => {
    it('round-trips a default LabState through JSON', () => {
      const state = createDefaultLabState();
      const restored = deserializeLabState(serializeLabState(state));
      expect(restored).not.toBeNull();
      expect(restored!.qaSourceByActionStep).toEqual(state.qaSourceByActionStep);
    });

    it('rejects malformed JSON', () => {
      expect(deserializeLabState('{ not json')).toBeNull();
    });

    it('uses the correct storage key', () => {
      expect(LAB_STORAGE_KEY).toBe('r2c-combat-vfx-lab-state');
    });
  });
});
