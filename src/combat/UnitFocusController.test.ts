import { describe, expect, it } from 'vitest';
import { UnitFocusController, type FocusableUnit } from './UnitFocusController';

const unit = (alive = true, opacity = 1, shadow = 0.62): FocusableUnit => ({
  alive,
  mat: { opacity },
  blob: { material: { opacity: shadow } },
});

describe('UnitFocusController', () => {
  it('dims living non-active units and restores exact opacities', () => {
    const active = unit();
    const other = unit(true, 0.9, 0.5);
    const ko = unit(false, 0.34, 0.12);
    const focus = new UnitFocusController();

    focus.focus([active, other, ko], active);
    expect(active.mat.opacity).toBe(1);
    expect(other.mat.opacity).toBe(0.45);
    expect(other.blob.material.opacity).toBe(0.24);
    expect(ko.mat.opacity).toBe(0.34);

    focus.restore();
    expect(other.mat.opacity).toBe(0.9);
    expect(other.blob.material.opacity).toBe(0.5);
    expect(ko.mat.opacity).toBe(0.34);
  });

  it('keeps valid targets readable and lifts the hovered target to full opacity', () => {
    const active = unit();
    const valid = unit();
    const other = unit();
    const focus = new UnitFocusController();

    focus.focus([active, valid, other], active, [valid]);
    expect(valid.mat.opacity).toBe(0.75);
    expect(other.mat.opacity).toBe(0.45);

    focus.preview([valid]);
    expect(valid.mat.opacity).toBe(1);
    expect(other.mat.opacity).toBe(0.45);
  });
});
