import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { skillById } from '../game/skills';

// Exercise the production pure adapter without booting its WebGL/DOM runtime.
const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const adapter = runtime.slice(runtime.indexOf('function skillUpgradeLevel('), runtime.indexOf('function unitAtTargetCell('));
const getSpec = new Function('SKILLS', 'G', `${adapter}\nreturn getSpec;`)(
  Object.fromEntries(skillById), { basicAttacksThisTurn: 0 },
) as (unit: { skillUpgrades: Record<string, number> }, id: string) => { healPercent?: number; range: number[]; dispelAllies?: boolean };

describe('production skill adapter preserves authored healing', () => {
  it.each([0, 1, 2])('retains Salvation percentage with upgrade level %i', (level) => {
    const authored = skillById.get('w_salvation')!;
    const spec = getSpec({ skillUpgrades: { w_salvation: level } }, authored.id);
    const expected = authored.healPercent! + (level >= 1 ? authored.upgradeLevel1!.healMultiplier! : 0)
      + (level >= 2 ? authored.upgradeLevel2!.healMultiplier! : 0);
    expect(spec.healPercent).toBeCloseTo(expected);
    expect(spec.range).toEqual(authored.range);
    expect(Boolean(spec.dispelAllies)).toBe(level === 2);
    expect(Math.round(100 * spec.healPercent!)).toBe(Math.round(100 * expected));
    expect(skillById.get('w_salvation')!.healPercent).toBe(.4);
  });
});
