import { describe, expect, it } from 'vitest';
import { getStatusLabel, getVisibleStatusIndicators } from './statusPresentation';

describe('status presentation', () => {
  it('sorts state and negative effects before positive effects', () => {
    const result = getVisibleStatusIndicators({ regen: 2, burn: 1, root: 2, barrier: 3 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['exhausted', 'root', 'burn', 'regen', 'barrier']);
  });

  it('lets Brisé override derived Essoufflé', () => {
    const result = getVisibleStatusIndicators({ staggered: 1, burn: 2 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['staggered', 'burn']);
    expect(result.visible.some(({ key }) => key === 'exhausted')).toBe(false);
  });

  it('shows Essoufflé when AP exhaustion is derived', () => {
    const result = getVisibleStatusIndicators({ poison: 2 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['exhausted', 'poison']);
  });

  it('limits badges and reports overflow', () => {
    const result = getVisibleStatusIndicators({ burn: 1, poison: 2, blind: 2, weak: 1, regen: 3 });
    expect(result.visible.map(({ key }) => key)).toEqual(['burn', 'poison', 'blind']);
    expect(result.overflowCount).toBe(2);
  });

  it('keeps positive statuses presentable after higher priority effects', () => {
    const result = getVisibleStatusIndicators({ boost: 1, barrier: 1, regen: 1, curse: 2 }, { maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['curse', 'regen', 'boost', 'barrier']);
  });

  it('returns corrected French labels', () => {
    expect(getStatusLabel('burn')).toBe('Brûlure');
    expect(getStatusLabel('staggered')).toBe('Brisé');
    expect(getStatusLabel('exhausted')).toBe('Essoufflé');
    expect(getStatusLabel('curse')).toBe('Malédiction');
    expect(getStatusLabel('weak')).toBe('Affaibli');
    expect(getStatusLabel('slow')).toBe('Ralenti');
  });
});
