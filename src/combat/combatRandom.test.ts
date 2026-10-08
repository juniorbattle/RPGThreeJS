import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createCombatRandomStreams, mulberry32 } from './combatRandom';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const damageSource = runtime.slice(runtime.indexOf('function orientMult('), runtime.indexOf('const FX_COL='));
const flatSource = runtime.match(/Math\.max\(1,Math\.round\(spec\.flatDmg\*tacticalRnd\(0\.85,1\.15\)\)\)/)?.[0];
const chanceSource = runtime.slice(runtime.indexOf('function critChance('), runtime.indexOf('async function applyDamage('));
const procSource = runtime.slice(runtime.indexOf("    if(spec.key==='attack'&&spec.weaponType==='greatsword'"), runtime.indexOf('    await wait(0.15); }'));
const aiSource = runtime.slice(runtime.indexOf('    let pick=null;'), runtime.indexOf('    if(!pick)break;'));

function ownerChances(draw: () => number) {
  return new Function('effDEX', 'isBreakOpen', 'hasS', 'bossCenterGX', 'bossCenterGZ', 'cl', 'tacticalRnd',
    `${chanceSource}; return { rollHit, critChance };`)(
    (u: { dex: number }) => u.dex, (u: { exhausted?: boolean }) => !!u.exhausted,
    (u: { blind?: boolean }) => !!u.blind, (u: { gx: number }) => u.gx, (u: { gz: number }) => u.gz,
    (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)), draw,
  );
}

async function ownerProc(weapon: string, rolls: number[], basicDmg = 40) {
  const events: unknown[] = []; let count = 0;
  const u = { alive: true, team: 'player', gx: 1, gz: 1, hp: 50, maxhp: 100, ap: 1, maxap: 5 };
  const targets = [{ alive: true, team: 'enemy', gx: 2, gz: 1 }, { alive: true, team: 'enemy', gx: 3, gz: 1 }];
  const execute = new Function('u', 'spec', 'targets', 'basicDmg', 'tacticalRnd', 'isBreakOpen', 'applyStatus', 'applyHeal', 'aliveUnits', 'floatText', 'applyDamage', 'refreshPanel',
    `return (async()=>{${procSource}})();`);
  await execute(u, { key: 'attack', weaponType: weapon }, targets, basicDmg,
    () => { const roll = rolls[count++]; if (roll === undefined) throw Error('Unexpected owner draw'); return roll; },
    () => false, (t: unknown, status: string, turns: number) => events.push(['status', t, status, turns]),
    (_t: unknown, amount: number) => events.push(['heal', amount]), () => targets,
    () => {}, (_t: unknown, amount: number) => events.push(['damage', amount]), () => {});
  return { events, count, ap: u.ap };
}

function ownerAI(roll: number, forceUltimate = false) {
  return new Function('u', 'prof', 'actBest', 'supBest', 'itmBest', 'tacticalRnd',
    `${aiSource}; return pick.type;`)(
    { boss: true, ap: 5, _ultCooldown: forceUltimate ? 0 : 1, hp: 100, maxhp: 100 },
    'cautious', { score: 20 }, { score: 11 }, null, () => roll,
  );
}

function actualDamageSequence(visualDraws: number[]) {
  const streams = createCombatRandomStreams(20260615);
  // Execute the production formula and flat-damage expression, not a test copy.
  const compute = new Function('effMAG', 'effSTR', 'effEND', 'bossCenterGX', 'bossCenterGZ', 'dmgTakenMul', 'tacticalRnd',
    `${damageSource}; return computeDamage;`)(
    (u: { mag: number }) => u.mag, (u: { str: number }) => u.str, (u: { end: number }) => u.end,
    (u: { gx: number }) => u.gx, (u: { gz: number }) => u.gz, () => 1, streams.tactical,
  );
  const flat = new Function('spec', 'tacticalRnd', `return ${flatSource};`);
  const attacker = { gx: 1, gz: 1, size: 1, str: 25, mag: 18 };
  const target = { gx: 2, gz: 1, size: 1, str: 18, mag: 15, end: 12, facing: { dx: 1, dz: 0 } };
  return visualDraws.map((count, index) => {
    for (let draw = 0; draw < count; draw++) streams.visual(-5, 6);
    const normal = compute(attacker, target, { type: index % 2 ? 'mag' : 'phys', power: 16, weaponType: 'dagger' });
    const fixed = flat({ flatDmg: 35 }, streams.tactical);
    return { normal, fixed };
  });
}

describe('combat randomness authority', () => {
  it('keeps the existing seeded algorithm when it is moved out of the runtime', () => {
    const baseline = new Function('seed', 'return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};')(20260615);
    const current = mulberry32(20260615);
    for (let draw = 0; draw < 100; draw++) expect(current()).toBe(baseline());
  });

  it('keeps actual normal and flat damage identical across different visual draw counts', () => {
    expect(flatSource).toBeDefined();
    expect(damageSource).toContain('tacticalRnd(0.92,1.08)');
    expect(damageSource).not.toMatch(/\brnd\(/);
    const normal = actualDamageSequence([96, 12, 6, 1200, 48, 600]);
    const reduced = actualDamageSequence([0, 6, 3, 0, 0, 0]);
    expect(reduced).toEqual(normal);
    expect(normal.every(value => value.normal.dmg > 0 && value.fixed > 0)).toBe(true);
  });

  it('keeps tactical draws from changing the visual stream', () => {
    const busy = createCombatRandomStreams(20260615);
    const idle = createCombatRandomStreams(20260615);
    for (let draw = 0; draw < 20; draw++) {
      busy.tactical();
      busy.tactical();
      expect(busy.visual()).toBe(idle.visual());
    }
  });

  it('preserves actual hit thresholds, critical chances and support short circuits', () => {
    let draws = 0; let roll = 0.49;
    const owner = ownerChances(() => { draws++; return roll; });
    const attacker = { dex: 0, gx: 1, gz: 1 };
    const target = { dex: 0, gx: 2, gz: 1 };
    expect(owner.rollHit(attacker, target, { support: true })).toBe(true);
    expect(draws).toBe(0);
    expect(owner.rollHit(attacker, target, { acc: 0.5 })).toBe(true);
    roll = 0.5; expect(owner.rollHit(attacker, target, { acc: 0.5 })).toBe(false);
    roll = 0.24; expect(owner.rollHit({ ...attacker, blind: true }, target, { acc: 0.5 })).toBe(false);
    expect(owner.critChance(attacker, target, { crit: 0.25 })).toBe(0.25);
    expect(owner.critChance(attacker, { ...target, exhausted: true }, { crit: 0.25 })).toBe(0.45);
  });

  it('preserves actual proc boundaries, secondary selection and conditional draws', async () => {
    expect((await ownerProc('greatsword', [0.199])).events).toHaveLength(1);
    expect((await ownerProc('greatsword', [0.2])).events).toHaveLength(0);
    expect((await ownerProc('holy_mace', [0.19])).events).toEqual([['heal', 8]]);
    expect((await ownerProc('long_spear', [0.249])).events).toEqual([['damage', 30]]);
    expect((await ownerProc('grimoire', [0.19])).ap).toBe(3);
    const wand = await ownerProc('wand', [0.1, 0.99]);
    expect(wand.events[0]).toEqual(['status', expect.anything(), 'silence', 2]);
    expect(wand.count).toBe(2);
    expect((await ownerProc('wand', [0.25])).count).toBe(1);
    expect((await ownerProc('shuriken', [0.249])).events).toEqual([['damage', 30]]);
    expect((await ownerProc('wand', [], 0)).count).toBe(0);
  });

  it('keeps actual hit, critical and AI decisions independent of visual draw cadence', () => {
    const simulate = (visualDraws: number) => {
      const streams = createCombatRandomStreams(20260615);
      const owner = ownerChances(streams.tactical);
      const results = [];
      for (let index = 0; index < 30; index++) {
        for (let draw = 0; draw < visualDraws; draw++) streams.visual();
        const hit = owner.rollHit({ dex: 20 }, { dex: 12 }, { acc: 0.8 });
        const critical = streams.tactical() < owner.critChance({ dex: 20 }, { dex: 12 }, { crit: 0.2 });
        results.push({ hit, critical, ai: ownerAI(streams.tactical()) });
      }
      return results;
    };
    expect(simulate(600)).toEqual(simulate(0));
    expect(ownerAI(0.399)).toBe('support');
    expect(ownerAI(0.4)).toBe('offense');
    expect(ownerAI(0.1, true)).toBe('offense');
    // The runtime contains all owner random consumers; global entropy stays in VFX.
    expect(runtime).not.toContain('Math.random(');
  });
});
