import { describe, expect, it } from 'vitest';
import { listCombatPoseSets } from '../stage/CombatPoseRegistry';
import { listPixelSheets, PIXEL_PX_PER_UNIT, PixelAnimationClock, pixelSheetLayout, resolvePixelSheet } from './PixelSpriteSheets';

describe('combat pixel sprite sheets', () => {
  it('covers every unit that owns the four combat poses', () => {
    const sheets = new Set(listPixelSheets().map((entry) => entry.unitId));
    for (const set of listCombatPoseSets()) expect(sheets.has(set.unitId), set.unitId).toBe(true);
  });

  it('keeps one pixel density: heroes around the RPGCards 88 px figure, bosses about twice as tall', () => {
    expect(PIXEL_PX_PER_UNIT).toBe(40);
    const hero = resolvePixelSheet('alistair');
    const boss = resolvePixelSheet('lion_champion');
    expect(hero?.figureHeightPx).toBeGreaterThanOrEqual(80);
    expect(hero?.figureHeightPx).toBeLessThanOrEqual(96);
    expect(boss!.figureHeightPx / hero!.figureHeightPx).toBeGreaterThan(1.8);
  });

  it('resolves canonical aliases such as master portraits', () => {
    expect(resolvePixelSheet('/assets/characters/pixel/masters/goblin.png')?.unitId).toBe('goblin');
    expect(resolvePixelSheet('unknown-unit')).toBeUndefined();
  });

  it('lays the cell plane out around the feet anchor', () => {
    const entry = resolvePixelSheet('alistair')!;
    const layout = pixelSheetLayout(entry);
    expect(layout.width).toBeCloseTo(entry.cell[0] / 40);
    expect(layout.centerY).toBeCloseTo((entry.anchor[1] - entry.cell[1] / 2) / 40);
    expect(layout.columns).toBe(entry.cells.length);
    for (const anim of Object.values(entry.anims)) for (const frame of anim.frames) expect(entry.cells).toContain(frame);
  });

  it('loops idle and holds the last frame of one-shot animations', () => {
    const entry = resolvePixelSheet('alistair')!;
    const clock = new PixelAnimationClock(entry, 'idle');
    const idle = entry.anims.idle!;
    const first = clock.cellIndex();
    clock.advance(idle.ms.reduce((a, b) => a + b, 0) + 1);
    expect(clock.cellIndex()).toBe(first);
    clock.play('cast');
    clock.advance(10_000);
    expect(clock.done).toBe(true);
    expect(clock.cellIndex()).toBe(entry.cells.indexOf('cast'));
  });
});
