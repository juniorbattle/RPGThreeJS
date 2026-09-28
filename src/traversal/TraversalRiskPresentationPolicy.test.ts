import { describe, expect, it } from 'vitest';
import { resolveTraversalRiskEnabled } from './TraversalRiskPresentationPolicy';

describe('T0 Route Risk activation policy', () => {
  it.each([
    [false, '', true], [false, '?traversalRisk=0', true], [false, '?traversalRisk=1', true],
    [true, '', true], [true, '?traversalRisk=1', true], [true, '?traversalRisk=0', false],
  ])('dev=%s search=%s enables risk=%s', (dev, search, enabled) => {
    expect(resolveTraversalRiskEnabled({ dev, search })).toBe(enabled);
  });
});
