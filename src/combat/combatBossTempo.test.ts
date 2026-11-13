import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { skillById } from '../game/skills';
import { BOSS_ELITE_AP_REGEN, BOSS_HEAVY_COOLDOWN, BOSS_ULTIMATE_COOLDOWN, bossApReserve, bossTempoProfile } from './combatTempo';
import { resolveBossIntentVisualState } from './bossIntentPresentation';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const tempoSource = runtime.slice(runtime.indexOf('const BOSS_TEMPO_RULES='), runtime.indexOf('\nfunction bestOffense('));
const applyStatusSource = runtime.slice(runtime.indexOf('function applyStatus(t,st,turns){'), runtime.indexOf('\nasync function knockOut('));
const SKILLS: Record<string, { ap: number; offensive?: boolean; effects?: { kind: string }[] }> = Object.fromEntries(skillById);
const RULES = { maxap: 5, regen: 3, breath: 1, chargeHold: 3 };

type Boss = { boss?: boolean; elite?: boolean; skills: string[]; ap: number; maxap: number; _ultCooldown: number; _tempoProfile?: unknown };

function runtimeTempo() {
  return new Function('SKILLS', 'bossTempoProfile', 'bossApReserve', 'BOSS_ELITE_AP_REGEN',
    tempoSource + ';return {BOSS_TEMPO_RULES,bossTempoOf,bossSpendableAp};',
  )(SKILLS, bossTempoProfile, bossApReserve, BOSS_ELITE_AP_REGEN) as {
    BOSS_TEMPO_RULES: { regen: number; breath: number; chargeHold: number };
    bossTempoOf(u: Boss): ReturnType<typeof bossTempoProfile> | null;
    bossSpendableAp(u: Boss): number;
  };
}

type AuthoredUnit = { id: string; name: string; boss?: boolean; elite?: boolean; skills: string[] };

/** Every boss and elite the runtime authors: the BOSS_DEFS and the visual templates flagged boss or elite. */
function authoredBossesAndElites(): AuthoredUnit[] {
  const literal = (start: string, end: string, name: string) =>
    new Function(`${runtime.slice(runtime.indexOf(start), runtime.indexOf(end))};return ${name};`)();
  const bossDefs = literal('const BOSS_DEFS=[', '\nfor(const bossDef of BOSS_DEFS)', 'BOSS_DEFS') as Omit<AuthoredUnit, 'id'>[];
  const templates = literal('const VISUAL_UNIT_TEMPLATES={', '\nconst ENEMY_VISUAL_POSITIONS=', 'VISUAL_UNIT_TEMPLATES') as Record<string, Omit<AuthoredUnit, 'id'>>;
  return [
    ...bossDefs.map(def => ({ ...def, id: def.name })),
    ...Object.entries(templates).filter(([, def]) => def.boss || def.elite).map(([id, def]) => ({ ...def, id })),
  ];
}

/**
 * Mirrors beginTurn (regen, then cooldown decrement), the AI budget and endTurn (Souffle) over a number of turns.
 * Each turn spends what the runtime budget allows: the ultimate when ready, the heavy skill on its turn, else light actions.
 */
function simulate(skills: string[], turns: number, start = { ap: 0, cooldown: BOSS_ULTIMATE_COOLDOWN }) {
  const tempo = runtimeTempo();
  const unit: Boss = { boss: true, skills, ap: start.ap, maxap: 5, _ultCooldown: start.cooldown };
  const profile = tempo.bossTempoOf(unit)!;
  const log: { turn: number; cooldown: number; startAp: number; action: string; endAp: number; charge: boolean }[] = [];
  for (let turn = 1; turn <= turns; turn++) {
    unit.ap = Math.min(unit.maxap, unit.ap + tempo.BOSS_TEMPO_RULES.regen);
    if (unit._ultCooldown > 0) unit._ultCooldown--;
    const cooldown = unit._ultCooldown, startAp = unit.ap;
    const charge = resolveBossIntentVisualState({ alive: true, boss: true, ap: unit.ap, cooldown })?.level === 'charge';
    let action = 'hold';
    const budget = tempo.bossSpendableAp(unit);
    if (profile.ultimateCost !== null && cooldown === 0 && unit.ap >= profile.ultimateCost) {
      unit.ap -= profile.ultimateCost; unit._ultCooldown = BOSS_ULTIMATE_COOLDOWN; action = 'ultimate';
    } else if (cooldown === BOSS_HEAVY_COOLDOWN && profile.heavyCost !== null && budget >= profile.heavyCost) {
      unit.ap -= profile.heavyCost; action = 'heavy';
    } else if (budget > 0) {
      const spent = Math.min(budget, 3); unit.ap -= spent; action = 'light' + spent;
    }
    if (unit.ap >= 1) unit.ap = Math.min(unit.maxap, unit.ap + tempo.BOSS_TEMPO_RULES.breath);
    log.push({ turn, cooldown, startAp, action, endAp: unit.ap, charge });
  }
  return log;
}

describe('boss and elite tempo (operator playtest 2026-11-11)', () => {
  it('reads the ultimate and heavy skill from the authored kits', () => {
    expect(bossTempoProfile([2, 4, 5])).toEqual({ ultimateCost: 5, heavyCost: 4 });
    expect(bossTempoProfile([2, 5, 5])).toEqual({ ultimateCost: 5, heavyCost: null });
    expect(bossTempoProfile([2, 3])).toEqual({ ultimateCost: null, heavyCost: null });
    const tempo = runtimeTempo();
    // Ancien Ours Borin: Frappe lourde 2, Onde de choc 4, Frappe du Titan 5 (Garde is support, not offence).
    expect(tempo.bossTempoOf({ boss: true, skills: ['enemy_heavy_strike', 'boss_guard', 'boss_quake', 'boss_titan_slam'], ap: 0, maxap: 5, _ultCooldown: 5 }))
      .toEqual({ ultimateCost: 5, heavyCost: 4 });
    expect(tempo.bossTempoOf({ skills: ['enemy_heavy_strike'], ap: 3, maxap: 5, _ultCooldown: 5 })).toBeNull();
  });

  it('keeps a reserve that never plans an Essoufflé turn and holds the charge before the ultimate', () => {
    const profile = { ultimateCost: 5, heavyCost: 4 };
    expect([3, 2, 1, 0].map(cd => bossApReserve(cd, profile, RULES))).toEqual([1, 1, 3, 3]);
    expect(bossApReserve(1, { ultimateCost: 5, heavyCost: null }, RULES)).toBe(3);
    expect(bossApReserve(3, { ultimateCost: null, heavyCost: null }, RULES)).toBe(1);
  });

  it('mirrors the runtime regen and Souffle it plans with', () => {
    expect(runtime).toContain('const regen=(u.boss||u.elite)?BOSS_ELITE_AP_REGEN:1;');
    expect(runtime).toContain("if(u.ap>=1){ u.ap=Math.min(u.maxap,u.ap+1); u._souffle=true;");
    expect(runtimeTempo().BOSS_TEMPO_RULES).toEqual({ regen: 3, breath: 1, chargeHold: 3 });
    // Operator decision 2026-11-11: four-turn cycle, 3 AP regeneration for bosses and elites.
    expect(BOSS_ULTIMATE_COOLDOWN).toBe(4);
    expect(BOSS_ELITE_AP_REGEN).toBe(3);
    expect(runtime).toContain('_ultCooldown:BOSS_ULTIMATE_COOLDOWN,');
    expect(runtime).toContain('{u._ultCooldown=BOSS_ULTIMATE_COOLDOWN;clearBossIntentPresentation(u);}');
    expect(runtime).not.toMatch(/_ultCooldown=5|_ultCooldown<5|_ultCooldown:5/);
  });

  it('escalates every four turns: light, heavy, charge, ultimate', () => {
    const log = simulate(['enemy_heavy_strike', 'boss_guard', 'boss_quake', 'boss_titan_slam'], 12);
    expect(log.filter(t => t.action === 'ultimate').map(t => t.turn)).toEqual([4, 8, 12]);
    expect(log.filter(t => t.action === 'heavy').map(t => t.turn)).toEqual([2, 6, 10]);
    expect(log.slice(0, 4).map(t => t.action)).toEqual(['light2', 'heavy', 'light2', 'ultimate']);
    // The CHARGE telegraph is up on the turn before each ultimate, and the boss keeps it while it acts lightly.
    expect(log.filter(t => t.charge).map(t => t.turn)).toEqual([3, 7, 11]);
    expect(log.filter(t => t.charge).every(t => t.endAp >= 3)).toBe(true);
    // It ends a turn on 0 AP only right after its ultimate.
    expect(log.filter(t => t.endAp === 0).map(t => t.action)).toEqual(['ultimate', 'ultimate', 'ultimate']);
  });

  it('reaches its ultimate in time for every authored boss and elite kit', () => {
    const kits = [...runtime.matchAll(/skills:\[([^\]]*boss_[^\]]*)\]/g)].map(m => [...String(m[1]).matchAll(/'([^']+)'/g)].map(x => String(x[1])))
      .filter(kit => kit.some(id => (SKILLS[id]?.ap ?? 0) >= 5)); // kits without a 5 AP skill have no ultimate to pace
    expect(kits.length).toBeGreaterThanOrEqual(15);
    for (const kit of kits) {
      const log = simulate(kit, 8);
      expect(log.filter(t => t.action === 'ultimate').map(t => t.turn), kit.join(',')).toEqual([4, 8]);
      expect(log.filter(t => t.endAp === 0 && t.action !== 'ultimate'), kit.join(',')).toEqual([]);
    }
  });

  it('gives every authored boss and elite the heavy step of its four-turn cycle (OD-2026-11-13-F, C1)', () => {
    const tempo = runtimeTempo();
    const units = authoredBossesAndElites();
    // The fifteen bosses of BOSS_DEFS plus the Lion champion's visual, and the sixteen elite visuals.
    expect(units.filter(u => u.boss).length).toBe(16);
    expect(units.filter(u => u.elite).length).toBe(16);
    for (const unit of units) {
      const profile = tempo.bossTempoOf({ boss: unit.boss, elite: unit.elite, skills: unit.skills, ap: 0, maxap: 5, _ultCooldown: BOSS_ULTIMATE_COOLDOWN });
      expect(profile?.ultimateCost, unit.id).toBe(5);
      expect(profile?.heavyCost, unit.id).toBe(4);
      const log = simulate(unit.skills, 8);
      expect(log.slice(0, 4).map(t => t.action === 'heavy' || t.action === 'ultimate' ? t.action : 'light'), unit.id)
        .toEqual(['light', 'heavy', 'light', 'ultimate']);
      expect(log.filter(t => t.action === 'heavy').map(t => t.turn), unit.id).toEqual([2, 6]);
    }
  });

  it('spends a full AP pool at once when the cooldown is far, and everything on a ready ultimate', () => {
    const tempo = runtimeTempo();
    const borin = ['enemy_heavy_strike', 'boss_guard', 'boss_quake', 'boss_titan_slam'];
    expect(tempo.bossSpendableAp({ boss: true, skills: borin, ap: 5, maxap: 5, _ultCooldown: 3 })).toBe(4);
    expect(tempo.bossSpendableAp({ boss: true, skills: borin, ap: 5, maxap: 5, _ultCooldown: 0 })).toBe(5);
    expect(tempo.bossSpendableAp({ boss: true, skills: borin, ap: 4, maxap: 5, _ultCooldown: 0 })).toBe(1);
  });

  it('feeds the budget to the AI offence and support choices and holds a ready ultimate without target', () => {
    expect(runtime).toContain('budget=isBE?bossSpendableAp(u):u.ap');
    expect(runtime).toContain("if(s.ap<=budget&&!(forceUlt&&s.ap<5)&&!(onCD&&s.ap>=5))specs.push(s);");
    expect(runtime).toContain('||def.ap>budget)return false;');
    expect(runtime).toContain("const budget=(u.boss||u.elite)?bossSpendableAp(u):u.ap; const supSpecs=u.skills.map(s=>getSpec(u,s)).filter(s=>skillHasSupport(s)&&s.ap<=budget);");
    expect(runtime).toContain("if(forceUlt){ pick=actBest&&actBest.score>0?{type:'offense',best:actBest}:null; }");
    expect(runtime).not.toContain('saving=isBE');
  });

  it('makes Brisé skip exactly the one turn it is applied for, other statuses keep their minimum', () => {
    const STATUS = { staggered: { name: 'Brisé', skip: true }, burn: { name: 'Brûlure' } };
    const applyStatus = new Function('STATUS', 'stageRevealUnit', 'combatCue', 'isNegative', 'G', 'floatText', 'refreshPanel',
      applyStatusSource + ';return applyStatus;',
    )(STATUS, () => {}, () => {}, () => true, { stage: true }, () => {}, () => {}) as (t: { statuses: Record<string, number> }, st: string, turns: number) => void;
    const boss = { statuses: {} as Record<string, number> };
    applyStatus(boss, 'staggered', 1);
    applyStatus(boss, 'burn', 1);
    expect(boss.statuses).toEqual({ staggered: 1, burn: 2 });
    // A skipped turn counts as that unit's turn for every status: one skip turn is consumed, and poison, burn or a
    // barrier tick down as at the end of a played turn (final audit 2026-11-11, A8).
    expect(runtime).toContain('await wait(0.7); tickStatusDuration(u);');
  });
});
