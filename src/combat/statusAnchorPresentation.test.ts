import { describe, expect, it } from 'vitest';
import { resolveStatusAnchorY } from './statusAnchorPresentation';

const bounds = { sourceSizePx: { width: 100, height: 200 }, alphaBoundsPx: { left: 12, top: 50, right: 90, bottom: 195 } };
describe('status anchor', () => {
  it('uses reviewed visible top instead of canvas top', () => {
    expect(resolveStatusAnchorY({ spriteHeight: 2, scaleY: 1, spriteY: 1, visibleBounds: bounds })).toBeCloseTo(1.8);
    expect(resolveStatusAnchorY({ spriteHeight: 2, scaleY: 1, spriteY: 1 })).toBeCloseTo(2.3);
  });
  it('tracks current vertical scale, not horizontal facing', () => {
    expect(resolveStatusAnchorY({ spriteHeight: 2, scaleY: 2, spriteY: 1, visibleBounds: bounds })).toBeCloseTo(2.3);
    expect(resolveStatusAnchorY({ spriteHeight: 2, scaleY: -2, spriteY: 1, visibleBounds: bounds })).toBeCloseTo(2.3);
  });
  it('gives large units a modestly larger gap and handles missing metadata', () => {
    const normal = resolveStatusAnchorY({ spriteHeight: 2, scaleY: 1, spriteY: 1, visibleBounds: bounds });
    expect(resolveStatusAnchorY({ spriteHeight: 2, scaleY: 1, spriteY: 1, size: 2, visibleBounds: bounds })).toBeCloseTo(normal + 0.05);
    expect(Number.isFinite(resolveStatusAnchorY({ spriteHeight: Number.NaN, scaleY: Number.NaN, spriteY: Number.NaN, visibleBounds: null }))).toBe(true);
  });
});
