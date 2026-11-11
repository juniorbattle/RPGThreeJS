import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getStatusLabel } from '../combat/statusPresentation';
import { describeSkillFacts, describeSkillFactsAt, effectiveStatusTurns, resolveSkillSpec, STATUS_FACTS, zoneCellCount } from './skillFacts';
import { skillById, skills } from './skills';

// The production runtime, sliced as the other runtime tests do, so these checks run its real code.
const runtime = readFileSync(new URL('../combat/legacyCombatRuntime.js', import.meta.url), 'utf8');
const between = (start: string, end: string) => {
  const from = runtime.indexOf(start), to = runtime.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`missing slice ${start}`);
  return runtime.slice(from, to);
};
const RUNTIME_SKILLS = Object.fromEntries(skills.map((def) => [def.id, { ...def, desc: def.description }]));
const getSpec = new Function('SKILLS', 'G', `${between('function skillUpgradeLevel(', 'function unitAtTargetCell(')}\nreturn getSpec;`)(
  RUNTIME_SKILLS, { basicAttacksThisTurn: 0 },
) as (unit: { skillUpgrades: Record<string, number> }, id: string) => Record<string, unknown>;
const zones = new Function('inBounds', 'eud', 'bossCenterGX', 'bossCenterGZ', `${between('function aoeTiles(', 'function canAffectUnit(')}\nreturn { aoeCells };`)(
  () => true, (x1: number, z1: number, x2: number, z2: number) => Math.hypot(x1 - x2, z1 - z2), (u: { gx: number }) => u.gx, (u: { gz: number }) => u.gz,
) as { aoeCells(u: unknown, spec: unknown, cx: number, cz: number): number[][] };
const STATUS = new Function(`${between('const STATUS={', '// Innate gifts')}\nreturn STATUS;`)() as Record<string, Record<string, number>>;

const LEVELS = [0, 1, 2] as const;
const USABLE_HERO_SKILLS = skills.filter((def) => def.upgradeLevel1 && def.ap < 5);
const runtimeCells = (spec: Record<string, unknown>) => zones.aoeCells({ gx: 9, gz: 10, size: 1, facing: { dx: 1, dz: 0 } }, spec, 10, 10).length;

describe('skill facts mirror the runtime spec (skills pass 2026-11-11)', () => {
  it('resolve every skill at every upgrade level exactly as the runtime getSpec does', () => {
    for (const def of skills) for (const level of LEVELS) {
      expect(resolveSkillSpec(def, level), `${def.id} level ${level}`).toEqual(getSpec({ skillUpgrades: { [def.id]: level } }, def.id));
    }
  });

  it('count every zone as the runtime aoeCells draws it', () => {
    for (const def of skills) for (const level of LEVELS) {
      const spec = resolveSkillSpec(def, level);
      if (!((spec.radius ?? 0) > 0 || spec.shape)) continue;
      expect(zoneCellCount(spec.radius, spec.shape), `${def.id} level ${level}`).toBe(runtimeCells(spec as unknown as Record<string, unknown>));
    }
  });

  it('give statuses the status row names and the runtime STATUS numbers', () => {
    for (const [key, facts] of Object.entries(STATUS_FACTS)) {
      expect(facts.label, key).toBe(getStatusLabel(key));
      const status = STATUS[key]!;
      for (const [stat, word] of [['str', 'FOR'], ['end', 'END'], ['dex', 'DEX']] as const) {
        if (status[stat] == null) continue;
        const change = Math.round((status[stat] - 1) * 100);
        expect(facts.effect, key).toContain(`${word}`);
        expect(facts.effect, key).toContain(`${change > 0 ? '+' : '−'}${Math.abs(change)} %`);
      }
    }
    expect(STATUS_FACTS.root!.label).toBe('Entravé');
    expect(STATUS_FACTS.silence!.label).toBe('Mutisme');
  });

  it('keep the runtime rule on durations: one turn becomes two, except for a status that skips a turn', () => {
    const applyStatus = new Function('STATUS', 'G', 'stageRevealUnit', 'combatCue', 'isNegative', 'floatText', 'refreshPanel',
      `${between('function applyStatus(', 'async function knockOut(')}\nreturn applyStatus;`,
    )(STATUS, { stage: true }, () => {}, () => {}, () => true, () => {}, () => {}) as (t: { statuses: Record<string, number> }, st: string, n: number) => void;
    for (const [status, turns] of [['curse', 1], ['curse', 3], ['staggered', 1], ['boost', 2]] as const) {
      const unit = { statuses: {} as Record<string, number> };
      applyStatus(unit, status, turns);
      expect(effectiveStatusTurns(status, turns), `${status} ${turns}`).toBe(unit.statuses[status]);
    }
  });
});

describe('skill facts say what each skill does', () => {
  const facts = (id: string, level = 0) => describeSkillFactsAt(skillById.get(id)!, level);

  it('state range, damage and the status with its turns and effect, at the hero level', () => {
    expect(facts('w_break_guard')).toBe('Portée 1 · Dégâts physiques, puissance 10 · Malédiction 2 tours (END −30 %)');
    expect(facts('w_break_guard', 2)).toBe('Portée 1 · Dégâts physiques, puissance 12 · Malédiction 3 tours (END −30 %)');
    expect(facts('w_salvation', 1)).toBe('Allié à 0-3 (soi compris) · Soin de 55 % des PV max');
    expect(facts('ni_shadow_step')).toContain('Ennemi à 1-2 (ou case libre : déplacement seul)');
    expect(facts('w_charge')).toContain('Frappe les ennemis adjacents à l’arrivée : dégâts physiques, puissance 11, +10 %');
  });

  it('warn of friendly fire wherever the runtime hits allies, and only there', () => {
    for (const def of USABLE_HERO_SKILLS) for (const level of LEVELS) {
      const spec = resolveSkillSpec(def, level);
      const zone = (spec.radius ?? 0) >= 1 || Boolean(spec.shape);
      const genericOffensiveZone = zone && spec.offensive && !spec.effects?.length;
      expect(describeSkillFacts(spec).includes('alliés compris') || describeSkillFacts(spec).includes('alliés et lanceur compris'), `${def.id} level ${level}`)
        .toBe(Boolean(genericOffensiveZone));
      if (genericOffensiveZone && level === 0 && def.ap < 5) expect(def.description, def.id).toContain('alliés compris');
    }
  });

  it('keep each open hero skill description short enough for the two lines of the combat menu', () => {
    for (const def of USABLE_HERO_SKILLS) {
      expect(def.description.length, def.id).toBeLessThanOrEqual(85);
      expect(def.upgradeLevel1!.description.length, def.id).toBeGreaterThan(5);
      expect(def.upgradeLevel2!.description.length, def.id).toBeGreaterThan(5);
    }
  });
});
