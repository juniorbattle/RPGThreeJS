import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { skillById, skills } from '../game/skills';
import { describeSkillFacts, describeSkillFactsAt, resolveSkillSpec, zoneCellCount } from '../game/skillFacts';
import { renderCombatSkillRows } from './combatHudPresentation';

/**
 * Skills pass 2026-11-11: each correction is checked against the production runtime, sliced the way the other runtime
 * tests slice it, on a small stubbed grid. Nothing here boots WebGL or the DOM.
 */
const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const fn = (name: string) => {
  const start = runtime.search(new RegExp(`\\n(async )?function ${name}\\(`));
  if (start < 0) throw new Error(`missing ${name}`);
  const next = runtime.slice(start + 1).search(/\n(async )?function |\nlet |\nconst /);
  return runtime.slice(start + 1, next < 0 ? undefined : start + 1 + next);
};
const RUNTIME_SKILLS = Object.fromEntries(skills.map((def) => [def.id, { ...def, desc: def.description }]));

type Unit = { id: string; team: 'player' | 'foe'; gx: number; gz: number; alive: boolean; size: number; facing: { dx: number; dz: number };
  statuses: Record<string, number>; maxhp: number; hp: number; mag: number; str: number; end: number; dex: number; cha: number; skillUpgrades?: Record<string, number> };
const unit = (id: string, team: Unit['team'], gx: number, gz: number, extra: Partial<Unit> = {}): Unit => ({
  id, team, gx, gz, alive: true, size: 1, facing: { dx: team === 'player' ? 1 : -1, dz: 0 }, statuses: {}, maxhp: 100, hp: 100,
  mag: 20, str: 20, end: 10, dex: 10, cha: 12, ...extra,
});

/** The targeting functions of the runtime over an 8 × 4 grid holding these units. */
function field(units: Unit[]) {
  const G = { units, basicAttacksThisTurn: 0 };
  const cellAt = (gx: number, gz: number) => (gx < 0 || gz < 0 || gx >= 8 || gz >= 4 ? null
    : { gx, gz, walkable: true, occupant: units.find((u) => u.alive && u.gx === gx && u.gz === gz) ?? null });
  const applied: Array<[string, string, number]> = [];
  const source = ['skillUpgradeLevel', 'applySkillUpgrade', 'getSpec', 'unitAtTargetCell', 'selectedTargetsForAction', 'areaUnits', 'targetDistance',
    'allowsEmptyTileHybridTarget', 'aoeTiles', 'dirTo', 'lineCells', 'coneCells', 'aoeCells', 'canAffectUnit', 'affectedUnits', 'effectTargets',
    'applyAdditionalStatus', 'zoneSparesAllies', 'actionLacksTarget'].map(fn).join('\n');
  const api = new Function('SKILLS', 'G', 'cellAt', 'inBounds', 'eud', 'bossCenterGX', 'bossCenterGZ', 'applyStatus',
    `${source}\nreturn { getSpec, affectedUnits, effectTargets, applyAdditionalStatus, selectedTargetsForAction, actionLacksTarget };`,
  )(RUNTIME_SKILLS, G, cellAt, (gx: number, gz: number) => gx >= 0 && gz >= 0 && gx < 8 && gz < 4,
    (x1: number, z1: number, x2: number, z2: number) => Math.hypot(x1 - x2, z1 - z2), (u: Unit) => u.gx, (u: Unit) => u.gz,
    (t: Unit, st: string, n: number) => { applied.push([t.id, st, n]); });
  return { ...api, applied } as {
    getSpec(u: Unit, id: string): any; affectedUnits(u: Unit, spec: any, cx: number, cz: number): Unit[]; actionLacksTarget(u: Unit, spec: any, cx: number, cz: number): boolean;
    effectTargets(u: Unit, spec: any, cx: number, cz: number, effect: any, context?: any): Unit[];
    applyAdditionalStatus(u: Unit, spec: any, cx: number, cz: number, context: any): void;
    selectedTargetsForAction(u: Unit, spec: any, cx: number, cz: number): Unit[]; applied: Array<[string, string, number]>;
  };
}
const ids = (list: Unit[]) => list.map((u) => u.id).sort();

describe('execution fixes of the skills pass', () => {
  it('Lame Arcanique +2 gives Force to the caster, no longer to the enemy it strikes', () => {
    const hero = unit('lyra', 'player', 2, 1, { skillUpgrades: { r_arcane_blade: 2 } }), foe = unit('brute', 'foe', 3, 1);
    const f = field([hero, foe]);
    const spec = f.getSpec(hero, 'r_arcane_blade');
    f.applyAdditionalStatus(hero, spec, 3, 1, { selectedTargets: f.selectedTargetsForAction(hero, spec, 3, 1) });
    expect(f.applied).toEqual([['lyra', 'boost', 2]]);
  });

  it('Rempart du Serment provokes the adjacent enemies and shields the caster and adjacent allies', () => {
    const paladin = unit('aldric', 'player', 3, 1), ally = unit('kestrel', 'player', 3, 2), foe = unit('brute', 'foe', 4, 1), far = unit('mage', 'foe', 6, 1);
    const f = field([paladin, ally, foe, far]);
    const spec = f.getSpec({ ...paladin, skillUpgrades: {} }, 'p_oathwall');
    const [taunt, barrier] = spec.effects;
    expect(taunt).toMatchObject({ target: 'enemies', status: 'taunt' });
    expect(ids(f.effectTargets(paladin, spec, 3, 1, taunt))).toEqual(['brute']);
    expect(ids(f.effectTargets(paladin, spec, 3, 1, barrier))).toEqual(['aldric', 'kestrel']);
  });

  it('Purification +2 reaches the allies adjacent to its target, and stays on the target before', () => {
    const cleric = unit('clerc', 'player', 0, 1), target = unit('alistair', 'player', 2, 1), next = unit('kestrel', 'player', 2, 2), foe = unit('brute', 'foe', 3, 1);
    const f = field([cleric, target, next, foe]);
    for (const [level, expected] of [[0, ['alistair']], [1, ['alistair']], [2, ['alistair', 'kestrel']]] as const) {
      const spec = f.getSpec({ ...cleric, skillUpgrades: { w_purify: level } }, 'w_purify');
      const context = { selectedTargets: f.selectedTargetsForAction(cleric, spec, 2, 1) };
      for (const effect of spec.effects) expect(ids(f.effectTargets(cleric, spec, 2, 1, effect, context)), `level ${level} ${effect.kind}`).toEqual([...expected]);
    }
  });

  it('Mâchoire à Ressort +2 strikes the enemies adjacent to its target, never an ally or the caster', () => {
    const rogue = unit('rogue', 'player', 1, 1, { skillUpgrades: { ro_jaw_trap: 2 } }), foe = unit('brute', 'foe', 2, 1), foe2 = unit('mage', 'foe', 3, 1), ally = unit('kestrel', 'player', 2, 2);
    const f = field([rogue, foe, foe2, ally]);
    expect(ids(f.affectedUnits(rogue, f.getSpec(rogue, 'ro_jaw_trap'), 2, 1))).toEqual(['brute', 'mage']);
    expect(ids(f.affectedUnits(rogue, f.getSpec({ ...rogue, skillUpgrades: {} }, 'ro_jaw_trap'), 2, 1))).toEqual(['brute']);
  });

  it('Tourbillon d’Acier +2 reaches the diagonal cells', () => {
    const knight = unit('alistair', 'player', 3, 1, { skillUpgrades: { w_whirl: 2 } }), diag = unit('brute', 'foe', 4, 2), side = unit('mage', 'foe', 2, 1);
    const f = field([knight, diag, side]);
    expect(ids(f.affectedUnits(knight, f.getSpec(knight, 'w_whirl'), 3, 1))).toEqual(['brute', 'mage']);
    expect(ids(f.affectedUnits(knight, f.getSpec({ ...knight, skillUpgrades: { w_whirl: 1 } }, 'w_whirl'), 3, 1))).toEqual(['mage']);
  });

  it('every zone upgrade of an open hero skill adds cells to the zone', () => {
    const grows = skills.filter((def) => def.ap < 5 && [def.upgradeLevel1, def.upgradeLevel2].some((up) => up?.radiusBonus));
    expect(grows.map((def) => def.id).sort()).toEqual(['a_arrow_rain', 'ar_incendiary_grenade', 'e_binding_seal', 'n_flame_wave', 'ni_smoke_bomb', 'p_oathwall', 'r_scarlet_circle', 'ro_jaw_trap', 'w_purify', 'w_sanctuary', 'w_whirl']);
    for (const def of grows) for (const level of [1, 2] as const) {
      if (!(level === 1 ? def.upgradeLevel1 : def.upgradeLevel2)?.radiusBonus) continue;
      const before = resolveSkillSpec(def, level - 1), after = resolveSkillSpec(def, level);
      expect(zoneCellCount(after.radius, after.shape), `${def.id} level ${level}`).toBeGreaterThan(zoneCellCount(before.radius, before.shape));
    }
  });

  it('Charge applies its +10 % damage on the dash impact, as its definition and the preview do', () => {
    const doMove = fn('doMove');
    const impact = doMove.slice(doMove.indexOf('if(spec.impact){'));
    expect(impact).toContain('if(crit)dmg=Math.round(dmg*1.5); if(spec.damageMultiplier)dmg=Math.round(dmg*spec.damageMultiplier);');
    expect(skillById.get('w_charge')!.damageMultiplier).toBe(1.1);
  });

  it('Repli Explosif backs away from the nearest enemy and faces it, instead of taking the caster for the threat', async () => {
    const gunner = unit('gunnar', 'player', 3, 1, { facing: { dx: -1, dz: 0 } }), foe = unit('brute', 'foe', 5, 1);
    const units = [gunner, foe], moves: Array<[number, number]> = [], faced: Array<[number, number]> = [];
    const cellAt = (gx: number, gz: number) => (gx < 0 || gz < 0 || gx >= 8 || gz >= 4 ? null : { gx, gz, walkable: true, occupant: units.find((u) => u.gx === gx && u.gz === gz) ?? null });
    const performSkillMovement = new Function('cellAt', 'aliveUnits', 'bossCenterGX', 'bossCenterGZ', 'bossCells', 'doMove', 'setFacing', 'toast',
      `${['unitCenter', 'isFreeSkillTile', 'findStrikeDestination', 'findRetreatDestination', 'performSkillMovement'].map(fn).join('\n')}\nreturn performSkillMovement;`,
    )(cellAt, () => units, (u: Unit) => u.gx, (u: Unit) => u.gz, () => [],
      async (u: Unit, _spec: unknown, gx: number, gz: number) => { moves.push([gx, gz]); u.gx = gx; u.gz = gz; },
      (_u: Unit, gx: number, gz: number) => { faced.push([gx, gz]); }, () => {}) as (u: Unit, spec: any, cx: number, cz: number, context: any) => Promise<boolean>;
    const spec = resolveSkillSpec(skillById.get('ar_explosive_retreat')!);
    // A self-targeted skill selects the caster's own cell: the runtime passes the caster as the selected unit.
    expect(await performSkillMovement(gunner, spec, 3, 1, { selectedTargets: [gunner] })).toBe(true);
    expect(moves).toEqual([[2, 1]]);
    expect(faced).toEqual([[5, 1]]);
  });
});

describe('preview and tooltip fixes of the skills pass', () => {
  const preview = (extra: Record<string, unknown> = {}) => new Function('effMAG', 'effSTR', 'effEND', 'effCHA', 'effDEX', 'orientMult', 'dmgTakenMul', 'isNegative', 'hasS', 'cl', 'bossCenterGX', 'bossCenterGZ',
    `${['targetDistance', 'isCrosierAllyHeal', 'previewPower', 'previewAccuracy'].map(fn).join('\n')}\nreturn { previewPower, previewAccuracy, isCrosierAllyHeal };`,
  )((u: Unit) => u.mag, (u: Unit) => u.str, (u: Unit) => u.end, (u: Unit) => u.cha, (u: Unit) => u.dex,
    extra.orientMult ?? (() => ({ m: 1, lab: 'face' })), () => 1, () => true, () => false, (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
    (u: Unit) => u.gx, (u: Unit) => u.gz) as { previewPower(a: Unit, t: Unit, spec: any): number; previewAccuracy(a: Unit, t: Unit, spec: any): number; isCrosierAllyHeal(a: Unit, t: Unit, spec: any): boolean };

  it('estimates Purification at its real 20 % of max HP, not from the caster magic', () => {
    const cleric = unit('clerc', 'player', 0, 1, { mag: 22, cha: 18 }), target = unit('alistair', 'player', 2, 1, { maxhp: 140 });
    expect(preview().previewPower(cleric, target, resolveSkillSpec(skillById.get('w_purify')!))).toBe(28);
    expect(preview().previewPower(cleric, target, resolveSkillSpec(skillById.get('w_purify')!, 1))).toBe(49);
  });

  it('shows the crosier basic attack on an ally as the heal it is', () => {
    const cleric = unit('clerc', 'player', 0, 1, { mag: 22 }), ally = unit('alistair', 'player', 1, 1), foe = unit('brute', 'foe', 1, 1);
    const attack = { key: 'attack', weaponType: 'crosier', type: 'phys', power: 8, range: [1, 1], acc: 0.92 };
    expect(preview().isCrosierAllyHeal(cleric, ally, attack)).toBe(true);
    expect(preview().isCrosierAllyHeal(cleric, foe, attack)).toBe(false);
    expect(preview().previewPower(cleric, ally, attack)).toBe(11);
    const show = fn('showActionPreview');
    expect(show).toContain('const crosierHeal=isCrosierAllyHeal(att,primary,spec);');
    expect(show).toContain('spec.cure||crosierHeal)');
    expect(show).toContain("const valueLabel=spec.heal||crosierHeal?'Soin'");
  });

  it('adds the longbow +5 at maximum range, the dagger back blow and the rapier magic at range, as the resolution does', () => {
    const archer = unit('kestrel', 'player', 0, 1), near = unit('wolf', 'foe', 3, 1), far = unit('wolf2', 'foe', 4, 1);
    const bow = { key: 'attack', weaponType: 'longbow', type: 'phys', power: 9, range: [2, 4], acc: 0.8 };
    expect(preview().previewAccuracy(archer, far, bow) - preview().previewAccuracy(archer, near, bow)).toBe(5);
    const rogue = unit('rogue', 'player', 1, 1), back = unit('brute', 'foe', 2, 1);
    const dagger = { key: 'attack', weaponType: 'dagger', type: 'phys', power: 8, range: [1, 1] }, sword = { ...dagger, weaponType: 'greatsword' };
    const behind = preview({ orientMult: () => ({ m: 1.3, lab: 'DOS' }) });
    expect(behind.previewPower(rogue, back, dagger) / behind.previewPower(rogue, back, sword)).toBeCloseTo(1.45 / 1.3, 1);
    const lyra = unit('lyra', 'player', 0, 1, { str: 5, mag: 40 }), close = unit('a', 'foe', 1, 1), ranged = unit('b', 'foe', 2, 1);
    const rapier = { key: 'attack', weaponType: 'rapier', type: 'phys', power: 9, range: [1, 2] };
    expect(preview().previewPower(lyra, ranged, rapier)).toBeGreaterThan(preview().previewPower(lyra, close, rapier));
  });

  it('gives the long spear basic attack its real reach in the action tooltip', () => {
    const tipFor = new Function('SKILLS', 'G', 'hasS', 'itemsForbidden', 'invCount', 'unusedSupports',
      `${['skillUpgradeLevel', 'applySkillUpgrade', 'getSpec', 'tipFor'].map(fn).join('\n')}\nreturn tipFor;`,
    )(RUNTIME_SKILLS, { basicAttacksThisTurn: 0 }, () => false, () => false, () => 0, () => []) as (u: unknown, b: unknown) => string;
    const button = { dataset: { a: 'attack', wi: '0' } };
    const lancer = { weapons: [{ name: 'Lance', weaponType: 'long_spear', type: 'phys', min: 1, max: 2, power: 8, crit: 0.05, acc: 0.9 }] };
    const archer = { weapons: [{ name: 'Arc', weaponType: 'longbow', type: 'phys', min: 2, max: 4, power: 9, crit: 0.1, acc: 0.92 }] };
    expect(tipFor(lancer, button)).toContain('portée 1 (diagonales comprises)');
    expect(tipFor(archer, button)).toContain('portée 2-4');
  });
});

describe('facts in the combat menu', () => {
  it('lists the runtime spec facts under each skill of the combat menu and its support tooltips', () => {
    expect(fn('openSkillMenu')).toContain('facts:describeSkillFacts(sp)');
    expect(fn('openSupportMenu')).toContain("describeSkillFacts(spec)");
    const html = renderCombatSkillRows([{ id: 'w_break_guard', name: 'Brise-Garde', cost: 2, description: 'Frappe.', facts: describeSkillFactsAt(skillById.get('w_break_guard')!, 2), disabled: false, upgradeLevel: 2 }]);
    expect(html.replace(/\u00a0/g, ' ')).toContain('<small class="combat-skill__facts">Portée 1 · Dégâts physiques, puissance 12 · Malédiction 3 tours (END −30 %)</small>');
    expect(html).toContain('title="Frappe. Portée 1');
  });

  it('describes the runtime spec in combat the same way the sheet describes the catalogue level', () => {
    const f = field([]);
    for (const def of skills) for (const level of [0, 1, 2]) {
      expect(describeSkillFacts(f.getSpec(unit('u', 'player', 0, 0, { skillUpgrades: { [def.id]: level } }), def.id)), `${def.id} ${level}`).toBe(describeSkillFactsAt(def, level));
    }
  });
});

describe('operator decisions of 2026-11-11', () => {
  it('D1: a hero offensive zone spares the hero allies, unless the skill says it can hit them; enemy zones still strike their side', () => {
    const knight = unit('alistair', 'player', 3, 1), ally = unit('kestrel', 'player', 3, 2), foe = unit('brute', 'foe', 4, 1);
    const f = field([knight, ally, foe]);
    const whirl = f.getSpec({ ...knight, skillUpgrades: {} }, 'w_whirl');
    expect(ids(f.affectedUnits(knight, whirl, 3, 1))).toEqual(['brute']);
    // « peut toucher les alliés » keeps its friendly fire.
    const mage = unit('mage', 'player', 2, 1), f2 = field([mage, unit('kestrel', 'player', 3, 1), unit('brute', 'foe', 4, 1)]);
    const flames = f2.getSpec({ ...mage, skillUpgrades: { n_flame_wave: 2 } }, 'n_flame_wave');
    expect(ids(f2.affectedUnits(mage, flames, 3, 1))).toEqual(['brute', 'kestrel']);
    // An enemy zone (the Troll's Écrasement) still strikes the enemy's own allies.
    const troll = unit('troll', 'foe', 5, 1), escort = unit('goblin', 'foe', 5, 2), hero = unit('alistair', 'player', 4, 1);
    const f3 = field([troll, escort, hero]);
    expect(ids(f3.affectedUnits(troll, f3.getSpec({ ...troll, skillUpgrades: {} }, 'enemy_crush'), 5, 1))).toEqual(['alistair', 'goblin']);
    // A zone that heals allies (Cercle Écarlate) keeps them among its targets.
    const lyra = unit('lyra', 'player', 1, 1), f4 = field([lyra, unit('kestrel', 'player', 3, 2), unit('brute', 'foe', 3, 1)]);
    expect(ids(f4.affectedUnits(lyra, f4.getSpec({ ...lyra, skillUpgrades: {} }, 'r_scarlet_circle'), 3, 1))).toEqual(['brute', 'kestrel']);
    expect(fn('previewAt')).toContain("else if(!helpful&&isAlly&&!zoneSparesAllies(G.active,sp)){ col=0xff9a52;");
    expect(fn('showActionPreview')).toContain("spec.effects.some(effect=>effect.kind==='damage'&&effect.target==='all')");
  });

  it('D3, D5, D7: Charge +2 strikes harder, Cercle Écarlate +1 heals 4 more, Vague de Flammes +2 widens to 9 cells', () => {
    const f = field([]);
    const level = (id: string, n: number) => f.getSpec(unit('u', 'player', 0, 0, { skillUpgrades: { [id]: n } }), id);
    expect(level('w_charge', 2).power).toBe(13);
    expect(level('r_scarlet_circle', 1).effects.find((effect: any) => effect.kind === 'heal').flatHeal).toBe(16);
    const flames = level('n_flame_wave', 2);
    expect(zoneCellCount(flames.radius, flames.shape)).toBe(9);
  });

  it('D4: Coup Sournois +2 adds its critical bonus to a blow from behind only', () => {
    const critChance = (lab: string) => new Function('orientMult', 'effDEX', 'isBreakOpen', 'cl', `${fn('critChance')}\nreturn critChance;`)(
      () => ({ m: 1, lab }), () => 10, () => false, (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
    ) as (att: unknown, tgt: unknown, spec: any) => number;
    const spec = field([]).getSpec(unit('rogue', 'player', 0, 0, { skillUpgrades: { ro_sneak_attack: 2 } }), 'ro_sneak_attack');
    expect(spec).toMatchObject({ crit: 0.2, backCritBonus: 0.8 });
    expect(critChance('DOS')({}, {}, spec)).toBe(0.9);
    expect(critChance('face')({}, {}, spec)).toBe(0.2);
    expect(critChance('flanc')({}, {}, spec)).toBe(0.2);
  });

  it('D9: a single-target action confirmed on a cell it would affect nothing on is refused, other actions stay valid', () => {
    const knight = unit('alistair', 'player', 2, 1), cleric = unit('clerc', 'player', 1, 2), foe = unit('brute', 'foe', 3, 1);
    const f = field([knight, cleric, foe]);
    const skill = (id: string) => f.getSpec({ ...knight, skillUpgrades: {} }, id);
    const sword = { key: 'attack', type: 'phys', power: 10, range: [1, 1], radius: 0, offensive: true };
    expect(f.actionLacksTarget(knight, skill('w_break_guard'), 2, 0)).toBe(true);
    expect(f.actionLacksTarget(knight, skill('p_holy_strike'), 2, 0)).toBe(true);
    expect(f.actionLacksTarget(knight, sword, 2, 0)).toBe(true);
    expect(f.actionLacksTarget(knight, skill('w_break_guard'), 3, 1)).toBe(false);
    expect(f.actionLacksTarget(cleric, { ...sword, weaponType: 'crosier' }, 2, 1)).toBe(false);
    expect(f.actionLacksTarget(knight, skill('w_whirl'), 2, 1)).toBe(false);
    expect(f.actionLacksTarget(knight, skill('a_arrow_rain'), 6, 3)).toBe(false);
    expect(f.actionLacksTarget(knight, skill('n_teleport'), 4, 3)).toBe(false);
    expect(f.actionLacksTarget(knight, skill('ni_shadow_step'), 2, 3)).toBe(false);
    expect(f.actionLacksTarget(knight, skill('l_haft_recoil'), 2, 2)).toBe(false);
    expect(fn('activateBattlefieldCell')).toContain("if(actionLacksTarget(G.active,sp,c.gx,c.gz)){ announceBattlefieldRejection('Ciblage',c,'aucune cible sur cette case'); return; } await doExecute(sp,c.gx,c.gz);");
  });
});
