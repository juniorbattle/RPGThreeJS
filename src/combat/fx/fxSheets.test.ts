// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { fxSheetPlayable, FX_SHEETS, pixelSheetsTrial, setPixelSheetsTrial } from './fxSheets';
import { resolveFxRecipe } from './fxRecipes';

const PIXEL_IDS = ['holy_pillar', 'lion_slash', 'meteor_impact'];

describe('pixel FX sheets', () => {
  beforeEach(() => setPixelSheetsTrial(false));

  it('stay off until the operator turns the trial on', () => {
    expect(pixelSheetsTrial()).toBe(false);
    for (const id of PIXEL_IDS) expect(fxSheetPlayable(id)).toBeNull();
    setPixelSheetsTrial(true);
    for (const id of PIXEL_IDS) expect(fxSheetPlayable(id)).toBe(FX_SHEETS[id]);
    setPixelSheetsTrial(false);
    expect(fxSheetPlayable('holy_pillar')).toBeNull();
  });

  it('never play a sheet that is not registered', () => {
    setPixelSheetsTrial(true);
    expect(fxSheetPlayable('void_implosion')).toBeNull();
  });

  it('ship a PNG that matches their grid at the sprites pixel density', () => {
    for (const id of PIXEL_IDS) {
      const entry = FX_SHEETS[id]!;
      const png = readFileSync(`public${entry.file}`);
      const [cols, rows] = entry.grid;
      expect(entry.frames, id).toBe(cols * rows);
      expect(png.readUInt32BE(16) / cols, id).toBe(entry.worldSize! * 40);
      expect(png.readUInt32BE(20) / rows, id).toBe(entry.worldSize! * 40);
    }
  });

  it('land on the ultimates of their element, floor effects on the impact point', () => {
    const sheetStep = (preset: string) => resolveFxRecipe(preset).steps.find((step) => step.kind === 'sheet');
    expect(sheetStep('ultimate_lion_surge')).toMatchObject({ anchor: 'targetChest', p: { id: 'lion_slash' } });
    expect(sheetStep('ultimate_radiant_judgement')).toMatchObject({ anchor: 'point', p: { id: 'holy_pillar' } });
    expect(sheetStep('ultimate_dark_meteor')).toMatchObject({ anchor: 'point', p: { id: 'meteor_impact' } });
  });
});
