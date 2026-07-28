import { describe, expect, it, vi } from 'vitest';
import {
  UNIT_MOTION_PRESETS,
  beginUnitMotion,
  cancelUnitMotion,
  createCanonicalUnitMotionBaseline,
  isUnitMotionCurrent,
  onceAsync,
} from './unitMotion';

describe('unit motion foundation', () => {
  it('defines movement cadence within the existing per-cell timing budget', () => {
    const movement = UNIT_MOTION_PRESETS.move_step;
    expect((movement.stepHalf ?? 0) * 2).toBe(0.13);
    expect(movement.settle).toBeLessThanOrEqual(0.08);
  });

  it('builds a complete canonical baseline with signed scales', () => {
    expect(createCanonicalUnitMotionBaseline({
      group: { x: 3, y: 0.4, z: -2 },
      baseY: 0.9,
      spriteScaleX: -1.25,
      spriteScaleY: 1.25,
      outlineScaleX: -1.375,
      outlineScaleY: 1.375,
    })).toEqual({
      group: { x: 3, y: 0.4, z: -2 },
      spritePosition: { x: 0, y: 0.9, z: 0 },
      spriteScale: { x: -1.25, y: 1.25, z: 1 },
      spriteRotationZ: 0,
      outlinePosition: { x: 0, y: 0.9, z: 0 },
      outlineScale: { x: -1.375, y: 1.375, z: 1 },
      outlineRotationZ: 0,
    });
  });

  it('invalidates stale motion epochs on cancel', () => {
    const owner = {};
    const first = beginUnitMotion(owner);
    expect(isUnitMotionCurrent(owner, first)).toBe(true);
    const cancelledAt = cancelUnitMotion(owner);
    expect(cancelledAt).toBeGreaterThan(first);
    expect(isUnitMotionCurrent(owner, first)).toBe(false);
  });

  it('runs an impact callback exactly once', async () => {
    const callback = vi.fn(async () => 7);
    const impact = onceAsync(callback);
    await expect(Promise.all([impact(), impact(), impact()])).resolves.toEqual([7, 7, 7]);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
