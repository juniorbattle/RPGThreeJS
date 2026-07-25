import { describe, expect, it } from 'vitest';
import { VFX_RENDER_ORDER } from './VfxSystem';

describe('VFX render layers', () => {
  it('keeps short impact VFX above status indicators while ground effects stay lower', () => {
    expect(VFX_RENDER_ORDER.ground).toBeLessThan(60);
    expect(VFX_RENDER_ORDER.impact).toBeGreaterThan(60);
  });
});
