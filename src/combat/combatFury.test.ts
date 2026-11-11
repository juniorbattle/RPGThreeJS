import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FURY_HP_RATIO, furyStrikeAllowed, isInFury } from './combatTempo';
import { getVisibleStatusIndicators, resolveStatusCarousel } from './statusPresentation';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const furySource = runtime.slice(runtime.indexOf('function bestFuryAttack(u,taunter){'), runtime.indexOf('\n// ============================= CAMERA CONTROL'));
const aiLoopSource = runtime.slice(runtime.indexOf('async function aiTurn(u){'), runtime.indexOf('\nfunction bestFuryAttack('));

type Unit = {
  name: string; team: string; alive: boolean; boss?: boolean; elite?: boolean; hp: number; maxhp: number; ap: number;
  statuses: Record<string, number>; weapons: unknown[]; _furyUsed?: boolean; _castUltThisTurn?: boolean;
};

const ALLOWED = { inFury: true, firstOffensiveActionThisTurn: true, usedThisTurn: false, castUltimateThisTurn: false, staggered: false, rooted: false, silenced: false, fightOpen: true };

function harness(boss: Unit, foes: Unit[]) {
  const actions: { unit: string; spec: { key: string; ap: number; fury?: boolean } }[] = [], log: string[] = [];
  const game = { over: false };
  const api = new Function('G', 'getSpec', 'rangeCells', 'affectedUnits', 'computeDamage', 'hasS', 'logMsg', 'floatText', 'executeAction', 'wait', 'isInFury', 'furyStrikeAllowed',
    furySource + ';return {bestFuryAttack,furyStrike};',
  )(game,
    () => ({ key: 'attack', ap: 3, range: [1, 2] }),
    () => foes.map((_, i) => ({ gx: i, gz: 0 })),
    (_u: Unit, _spec: unknown, gx: number) => [foes[gx]!],
    () => ({ dmg: 20 }),
    (u: Unit, s: string) => (u.statuses[s] || 0) > 0,
    (text: string) => log.push(text), () => {},
    async (u: Unit, spec: { key: string; ap: number; fury?: boolean }) => { actions.push({ unit: u.name, spec }); },
    async () => {}, isInFury, furyStrikeAllowed,
  ) as { furyStrike(u: Unit, taunter: Unit | null): Promise<boolean> };
  return { game, actions, log, ...api };
}

const unit = (patch: Partial<Unit> = {}): Unit => ({ name: 'Borin', team: 'foe', alive: true, boss: true, hp: 200, maxhp: 540, ap: 3, statuses: {}, weapons: [{}], ...patch });
const hero = (): Unit => ({ name: 'Chevalier', team: 'player', alive: true, hp: 140, maxhp: 140, ap: 5, statuses: {}, weapons: [] });

describe('boss and elite Fury (set 1.21.0, OD-2026-11-11-B)', () => {
  it('is derived from current HP: bosses and elites strictly below half their maximum HP', () => {
    expect(FURY_HP_RATIO).toBe(0.5);
    expect(isInFury(unit({ hp: 269 }))).toBe(true);
    expect(isInFury(unit({ hp: 270 }))).toBe(false);
    expect(isInFury(unit({ boss: false, elite: true, hp: 100 }))).toBe(true);
    expect(isInFury(unit({ boss: false, hp: 10 }))).toBe(false);
    expect(isInFury(unit({ hp: 0 }))).toBe(false);
    expect(isInFury(unit({ alive: false, hp: 10 }))).toBe(false);
  });

  it('strikes only after the first offensive action, once per turn, never on the ultimate turn nor Brisé, Entravé or Muet', () => {
    expect(furyStrikeAllowed(ALLOWED)).toBe(true);
    for (const key of ['firstOffensiveActionThisTurn', 'inFury', 'fightOpen'] as const) expect(furyStrikeAllowed({ ...ALLOWED, [key]: false })).toBe(false);
    for (const key of ['usedThisTurn', 'castUltimateThisTurn', 'staggered', 'rooted', 'silenced'] as const) expect(furyStrikeAllowed({ ...ALLOWED, [key]: true })).toBe(false);
  });

  it('plays one free basic attack outside the surcharge, states it in the log, and only once per turn', async () => {
    const boss = unit(), h = harness(boss, [hero()]);
    expect(await h.furyStrike(boss, null)).toBe(true);
    expect(h.actions).toEqual([{ unit: 'Borin', spec: { key: 'attack', ap: 0, range: [1, 2], fury: true } }]);
    expect(h.log).toEqual(['Borin — Furie : attaque supplémentaire.']);
    expect(await h.furyStrike(boss, null)).toBe(false);
    expect(h.actions).toHaveLength(1);
  });

  it('does nothing above half HP, on the ultimate turn, while Entravé or Muet, or without a target', async () => {
    for (const boss of [unit({ hp: 400 }), unit({ _castUltThisTurn: true }), unit({ statuses: { root: 1 } }), unit({ statuses: { silence: 1 } }), unit({ statuses: { staggered: 1 } })]) {
      const h = harness(boss, [hero()]);
      expect(await h.furyStrike(boss, null)).toBe(false);
      expect(h.actions).toEqual([]);
    }
    const boss = unit(), h = harness(boss, []);
    expect(await h.furyStrike(boss, null)).toBe(false);
    expect(boss._furyUsed).toBeFalsy();
  });

  it('wires Fury into the AI turn, the turn reset, the surcharge and the knock-out rules', () => {
    expect(runtime).toContain('u._offensiveActedThisTurn=false; u._furyUsed=false; u._castUltThisTurn=false;');
    expect(aiLoopSource).toContain("if(pick.type==='offense'){ const first=!u._offensiveActedThisTurn; u._offensiveActedThisTurn=true; if(first)await furyStrike(u,taunter); }");
    expect(aiLoopSource).toContain('u._ultCooldown=BOSS_ULTIMATE_COOLDOWN;u._castUltThisTurn=true;');
    expect(runtime).toContain("if(spec.key==='attack'&&!spec.fury){ G.basicAttacksThisTurn++; }");
    // The free attack goes through executeAction, so the +1 AP of a knock-out is settled like any action (cost 0).
    expect(furySource).toContain('await executeAction(u,pick.spec,pick.cx,pick.cz);');
    expect(furySource).not.toMatch(/moveAlong|\.ap\s*=|applyDamage/);
  });

  it('states "Furie" in text on the unit badge, the unit card, and the log entry into Fury', () => {
    const visible = getVisibleStatusIndicators({}, { fury: true }).visible;
    expect(visible.map(indicator => [indicator.key, indicator.label, indicator.shortCode, indicator.derived])).toEqual([['fury', 'Furie', 'FUR', true]]);
    expect(resolveStatusCarousel({}, false, true).indicators[0]?.label).toBe('Furie');
    expect(getVisibleStatusIndicators({}, {}).visible).toEqual([]);
    expect(runtime.match(/fury:isInFury\(u\)/g)?.length).toBe(2);
    expect(runtime).toContain('resolveStatusCarousel(u.statuses,exhausted,isInFury(u))');
    expect(runtime).toContain("function syncFuryAnnouncement(u){ const fury=isInFury(u); if(fury&&!u._furyAnnounced)logMsg(u.name+' entre en Furie !'); u._furyAnnounced=fury; }");
    expect(runtime).toContain('u.hp=Math.max(0,u.hp-dmg); syncFuryAnnouncement(u);');
    expect(runtime).toContain('u.hp=Math.min(u.maxhp,u.hp+amt); syncFuryAnnouncement(u);');
  });
});
