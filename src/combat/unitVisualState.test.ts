import { describe, expect, it } from 'vitest';
import { getUnitVisualState } from './unitVisualState';

describe('combat unit visual lifecycle', () => {
  it('fully removes defeated enemies', () => {
    expect(getUnitVisualState('foe', false, true)).toEqual({
      visible: false,
      bodyOpacity: 0,
      shadowOpacity: 0,
      targetable: false,
    });
  });

  it('keeps allied K.O. markers available for revival', () => {
    expect(getUnitVisualState('player', false, true)).toEqual({
      visible: true,
      bodyOpacity: 0.34,
      shadowOpacity: 0.12,
      targetable: false,
    });
  });
});
