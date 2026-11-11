import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { settleActionAp } from './combatTempo';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const settlementSource = runtime.slice(runtime.indexOf('function creditKnockOutAp(src){'), runtime.indexOf('\nfunction applyHeal('));

type Unit = { ap: number; maxap: number };
type Game = { active: Unit | null; actionSettlement: { unit: Unit; knockOuts: number } | null; basicAttacksThisTurn: number; itemsUsedThisTurn: number };

function harness() {
  const game: Game = { active: null, actionSettlement: null, basicAttacksThisTurn: 0, itemsUsedThisTurn: 0 };
  const api = new Function('G', 'settleActionAp', 'refreshPanel',
    settlementSource + ';return {creditKnockOutAp,payActionCost,settleUnpaidKnockOuts};',
  )(game, settleActionAp, () => {}) as {
    creditKnockOutAp(src: Unit): void;
    payActionCost(u: Unit, spec: { ap: number }): number;
    settleUnpaidKnockOuts(u: Unit): void;
  };
  return { game, ...api };
}

describe('+1 PA for a knock-out (operator playtest 2026-11-11)', () => {
  it('settles the cost first, then the knock-out, under the AP cap', () => {
    expect(settleActionAp({ ap: 5, maxap: 5, cost: 3, knockOuts: 1 })).toBe(3);
    expect(settleActionAp({ ap: 5, maxap: 5, cost: 3, knockOuts: 0 })).toBe(2);
    expect(settleActionAp({ ap: 2, maxap: 5, cost: 1, knockOuts: 3 })).toBe(4);
    expect(settleActionAp({ ap: 5, maxap: 5, cost: 1, knockOuts: 2 })).toBe(5);
    expect(settleActionAp({ ap: 1, maxap: 5, cost: 3, knockOuts: 0 })).toBe(0);
  });

  it('keeps 3 PA after a 3 PA attack that kills from 5 / 5 PA (the playtest case)', () => {
    const { game, creditKnockOutAp, payActionCost } = harness();
    const hero = { ap: 5, maxap: 5 };
    game.active = hero; game.basicAttacksThisTurn = 0;
    game.actionSettlement = { unit: hero, knockOuts: 0 }; // executeActionCore opens the settlement
    creditKnockOutAp(hero); // applyDamage knocks the target out during the action
    expect(hero.ap).toBe(5); // nothing is clamped away while the action is still unpaid
    expect(payActionCost(hero, { ap: 3 })).toBe(1);
    expect(hero.ap).toBe(3);
    expect(game.actionSettlement).toBeNull();
  });

  it('credits a knock-out outside the striker\'s own action at once, as before', () => {
    const { game, creditKnockOutAp } = harness();
    const hero = { ap: 2, maxap: 5 }, other = { ap: 1, maxap: 5 };
    game.active = other; game.actionSettlement = { unit: other, knockOuts: 0 };
    creditKnockOutAp(hero);
    expect(hero.ap).toBe(3);
    expect(game.actionSettlement.knockOuts).toBe(0);
  });

  it('still pays a knock-out when the action ends without paying its cost', () => {
    const { game, creditKnockOutAp, settleUnpaidKnockOuts } = harness();
    const hero = { ap: 4, maxap: 5 };
    game.active = hero; game.basicAttacksThisTurn = 2; game.itemsUsedThisTurn = 1;
    game.actionSettlement = { unit: hero, knockOuts: 0 };
    creditKnockOutAp(hero);
    settleUnpaidKnockOuts(hero);
    expect(hero.ap).toBe(5);
    expect(game.basicAttacksThisTurn).toBe(0);
    expect(game.itemsUsedThisTurn).toBe(0);
    expect(game.actionSettlement).toBeNull();
  });

  it('wires every AP payment of an action through the settlement and keeps the kill reset of the surcharges', () => {
    expect(runtime).toContain('G.busy=true; closeMenus(); clearHL(); G.actionSettlement={unit:u,knockOuts:0};');
    expect(runtime).toContain("if(src&&src.alive){ creditKnockOutAp(src); floatText(src,'+1 PA','#7fd0ff',true); refreshPanel(src); }");
    expect(runtime.match(/payActionCost\(u,spec\)/g)?.length).toBe(5); // the definition and the four payment sites
    expect(runtime).not.toContain('u.ap=Math.max(0,u.ap-spec.ap)');
    expect(runtime).toContain("if(knockOutsThisAction>0&&u===G.active){ G.basicAttacksThisTurn=0; G.itemsUsedThisTurn=0; }");
    // \r?\n: the operator's Windows checkout has CRLF line endings (core.autocrlf=true).
    expect(runtime).toMatch(/try \{ await executeActionCore\(u,spec,cx,cz\); \}\r?\n {2}finally \{\r?\n {4}settleUnpaidKnockOuts\(u\);/);
  });
});
