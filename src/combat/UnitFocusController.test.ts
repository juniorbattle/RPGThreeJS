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
    expect(other.mat.opacity).toBe(0.42);
    expect(other.blob.material.opacity).toBe(0.22);
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
    expect(valid.mat.opacity).toBe(0.82);
    expect(other.mat.opacity).toBe(0.42);

    focus.preview([valid]);
    expect(valid.mat.opacity).toBe(1);
    expect(other.mat.opacity).toBe(0.42);

    focus.preview([]);
    expect(valid.mat.opacity).toBe(0.82);
    expect(other.mat.opacity).toBe(0.42);
  });

  it('protects boss, elite, and charge opacity floors while dimmed', () => {
    const active = unit();
    const boss = Object.assign(unit(), { boss: true });
    const elite = Object.assign(unit(), { elite: true });
    const chargingElite = Object.assign(unit(), { elite: true, focusOpacityFloor: 0.75 });
    const focus = new UnitFocusController();

    focus.focus([active, boss, elite, chargingElite], active);
    expect(boss.mat.opacity).toBe(0.6);
    expect(elite.mat.opacity).toBe(0.55);
    expect(chargingElite.mat.opacity).toBe(0.75);
  });

  it('does not overwrite KO or revive presentation during restoration', () => {
    const active = unit();
    const knockedOut = unit(true, 0.9, 0.5);
    const revived = unit(false, 0.34, 0.12);
    const focus = new UnitFocusController();

    focus.focus([active, knockedOut, revived], active);
    knockedOut.alive = false;
    knockedOut.mat.opacity = 0.2;
    knockedOut.blob.material.opacity = 0.08;
    revived.alive = true;
    revived.mat.opacity = 1;
    revived.blob.material.opacity = 0.62;
    focus.restore();

    expect(knockedOut.mat.opacity).toBe(0.2);
    expect(knockedOut.blob.material.opacity).toBe(0.08);
    expect(revived.mat.opacity).toBe(1);
    expect(revived.blob.material.opacity).toBe(0.62);
  });
});
