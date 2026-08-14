import { describe, expect, it } from 'vitest';
import inventory from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import { buildCatalogue } from './CombatVfxLab';
import {
  SOURCE_ASSIGNMENT_REPAIRS,
  classifyVfxSourceSuitability,
  filterDefaultComposerCatalogue,
  repairCandidateAssignment,
  repairComposerDraftAssignments,
} from './VfxSourceSuitability';

describe('R2C VFX Composer V2.2 source suitability', () => {
  it('classifies indicators, support, combat and uncertain sources deterministically', () => {
    expect(classifyVfxSourceSuitability({ sourceFilename: 'Arrow_Indicator_V4.png' }))
      .toBe('INDICATOR_UI');
    expect(classifyVfxSourceSuitability({ sourceFilename: 'Arrow_Impact_Wind.png' }))
      .toBe('COMBAT_EFFECT');
    expect(classifyVfxSourceSuitability({ sourceFilename: 'Healing_Aura.png' }))
      .toBe('SUPPORT_EFFECT');
    expect(classifyVfxSourceSuitability({ sourceFilename: 'Mystic_Thing_07.png' }))
      .toBe('AMBIGUOUS_REVIEW');
  });

  it('classifies the complete 2,769-source inventory without deleting uncertain sources', () => {
    const records = buildCatalogue(inventory as never);
    const counts = records.reduce<Record<string, number>>((acc, record) => {
      acc[record.suitability] = (acc[record.suitability] ?? 0) + 1;
      return acc;
    }, {});

    expect(records).toHaveLength(2769);
    expect(counts).toEqual({
      INDICATOR_UI: 5,
      AMBIGUOUS_REVIEW: 755,
      COMBAT_EFFECT: 1589,
      SUPPORT_EFFECT: 420,
    });
    expect(records.filter((record) => record.suitability === 'INDICATOR_UI').map((record) => record.assetId))
      .toEqual(['r1_0001', 'r1_0002', 'r1_0003', 'r1_0004', 'r1_0005']);
  });

  it('filters only interface indicators from the default Composer catalogue', () => {
    const records = buildCatalogue(inventory as never);
    const visible = filterDefaultComposerCatalogue(records);
    expect(visible).toHaveLength(2764);
    expect(visible.some((record) => record.suitability === 'INDICATOR_UI')).toBe(false);
    expect(visible.some((record) => record.suitability === 'AMBIGUOUS_REVIEW')).toBe(true);
  });

  it('repairs exactly the two conclusive historical assignments', () => {
    expect(SOURCE_ASSIGNMENT_REPAIRS).toHaveLength(2);
    expect(repairCandidateAssignment('a_arrow_rain', 'r1_0004')).toBe('r1_0614');
    expect(repairCandidateAssignment('a_zenith_arrow', 'r1_0005')).toBe('r1_0963');
    expect(repairCandidateAssignment('a_arrow_rain', 'r1_0005')).toBe('r1_0005');
    expect(repairCandidateAssignment('other_action', 'r1_0004')).toBe('r1_0004');
  });

  it('repairs stored drafts immutably and preserves all unrelated slots', () => {
    const source = {
      actionKey: 'a_arrow_rain',
      visualSlots: [{ candidateId: 'r1_0004' }, { candidateId: 'r1_1709' }],
    };
    const repaired = repairComposerDraftAssignments(source);
    expect(repaired).not.toBe(source);
    expect(repaired.visualSlots.map((slot) => slot.candidateId)).toEqual(['r1_0614', 'r1_1709']);
    expect(source.visualSlots[0]!.candidateId).toBe('r1_0004');
  });
});
