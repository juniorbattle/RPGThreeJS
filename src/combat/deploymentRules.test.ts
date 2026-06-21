import { describe, expect, it } from 'vitest';
import { canStartDeployment, normalizeDeploymentLimit, orderDeploymentCandidates } from './deploymentRules';

describe('deployment rules', () => {
  it('supports scenario limits from three to five', () => {
    expect(normalizeDeploymentLimit(2)).toBe(3);
    expect(normalizeDeploymentLimit(4)).toBe(4);
    expect(normalizeDeploymentLimit(9)).toBe(5);
  });

  it('places preferred combatants first without removing reserves', () => {
    const ordered = orderDeploymentCandidates(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
      ['e', 'b'],
    );
    expect(ordered.map((unit) => unit.id)).toEqual(['e', 'b', 'a', 'c', 'd']);
  });

  it('allows one to the encounter maximum', () => {
    expect(canStartDeployment(0, 4)).toBe(false);
    expect(canStartDeployment(1, 4)).toBe(true);
    expect(canStartDeployment(4, 4)).toBe(true);
    expect(canStartDeployment(5, 4)).toBe(false);
  });
});
