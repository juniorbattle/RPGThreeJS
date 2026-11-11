import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { resolveBossIntentVisualState } from './bossIntentPresentation';
import { bossGuardAp, chargeBreakPercent, chargeBreakThreshold, CHARGE_BREAK_RATIO } from './combatTempo';
import { PLATEAU_FOE_FACTORS, plateauFoeFactor, scaleFoeValue } from './plateauScaling';
import { combatInitializeMessageSchema } from './protocol';

const runtime = readFileSync(join(process.cwd(), 'src', 'combat', 'legacyCombatRuntime.js'), 'utf8');
const gameApp = readFileSync(join(process.cwd(), 'src', 'game', 'GameApp.ts'), 'utf8');

type Unit = { name: string; team: string; alive: boolean; boss?: boolean; elite?: boolean; ap: number; maxhp: number; _ultCooldown: number; _chargeBreak?: { dealt: number; broken: boolean } | null };

function chargeHarness() {
  const source = runtime.slice(runtime.indexOf('function chargeWindowOpen('), runtime.indexOf('async function applyDamage('));
  const log = vi.fn(), cleared = vi.fn();
  const track = new Function('resolveBossIntentVisualState', 'chargeBreakThreshold', 'BOSS_ULTIMATE_COOLDOWN', 'clearBossIntentPresentation', 'floatText', 'logMsg', 'refreshPanel',
    `${source}; return trackChargeBreak;`,
  )(resolveBossIntentVisualState, chargeBreakThreshold, 4, cleared, () => {}, log, () => {}) as (u: Unit, amount: number, src: { team: string } | null) => void;
  return { track, log, cleared };
}

describe('set 1.22.0 combat rules (OD-2026-11-11-E, final audit B2, B3 and B3b)', () => {
  it('B2: scales foes by the five contract factors, 1.00 without a plateau, rounded with a minimum of 1', () => {
    expect(PLATEAU_FOE_FACTORS).toEqual({ lion: 1, bear: 1.1, dragon: 1.2, scorpion: 1.3, finale: 1.4 });
    expect(plateauFoeFactor(undefined)).toBe(1);
    expect(plateauFoeFactor('nowhere')).toBe(1);
    expect(plateauFoeFactor('dragon')).toBe(1.2);
    expect(scaleFoeValue(450, 1.4)).toBe(630);
    expect(scaleFoeValue(0.4, 1.1)).toBe(1);
    expect(scaleFoeValue(37, 1.3)).toBe(48);
  });

  it('B2: lets RunSystem name the plateau in the launch request, and only a known plateau', () => {
    const base = combatInitializeMessageSchema.shape;
    expect(base.plateauId.safeParse('scorpion').success).toBe(true);
    expect(base.plateauId.safeParse(undefined).success).toBe(true);
    expect(base.plateauId.safeParse('phoenix').success).toBe(false);
    expect(gameApp).toContain('plateauId: runPlateauId(this.state),');
    expect(gameApp).toContain('holdOnResult:true,plateauId:runPlateauId(this.state)});');
  });

  it('B2: scales foe HP when a foe unit is created (waves and phases included) and foe hits in the damage formula and its preview', () => {
    expect(runtime).toContain("if(def.team==='foe'&&PLATEAU_FOE_FACTOR!==1){ const baseMax=def.maxhp||def.hp; def={...def,maxhp:scaleFoeValue(baseMax,PLATEAU_FOE_FACTOR),hp:scaleFoeValue(Math.min(def.hp,baseMax),PLATEAU_FOE_FACTOR)}; }");
    expect(runtime).toContain("if(spec.elanMul) d*=spec.elanMul; if(att.team==='foe') d*=PLATEAU_FOE_FACTOR; return {dmg:");
    expect(runtime).toContain('PLATEAU_FOE_FACTOR=plateauFoeFactor(message.plateauId);');
  });

  it('B3: breaks a charge at 15 % of the maximum HP dealt by the company while the badge shows, once per window', () => {
    expect(CHARGE_BREAK_RATIO).toBe(0.15);
    expect(chargeBreakThreshold(400)).toBe(60);
    expect(chargeBreakPercent(30, 400)).toBe(50);
    expect(chargeBreakPercent(90, 400)).toBe(100);
    const { track, log, cleared } = chargeHarness();
    const boss: Unit = { name: 'Borin', team: 'foe', alive: true, boss: true, ap: 3, maxhp: 400, _ultCooldown: 1, _chargeBreak: null };
    track(boss, 30, { team: 'foe' }); // an escort's stray hit does not count
    expect(boss._chargeBreak ?? null).toBeNull();
    track(boss, 30, { team: 'player' });
    expect(boss._chargeBreak).toEqual({ dealt: 30, broken: false });
    expect(boss._ultCooldown).toBe(1);
    track(boss, 30, { team: 'player' });
    expect(boss._chargeBreak).toEqual({ dealt: 60, broken: true });
    expect(boss._ultCooldown).toBe(4);
    expect(cleared).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith('Borin : charge brisée, son ultime est annulé.');
    track(boss, 200, { team: 'player' });
    expect(log).toHaveBeenCalledOnce();
  });

  it('B3: counts nothing while no CHARGE or ULTIME badge shows, and opens a fresh window at the unit\'s next turn', () => {
    const { track } = chargeHarness();
    const boss: Unit = { name: 'Kaelen', team: 'foe', alive: true, boss: true, ap: 5, maxhp: 560, _ultCooldown: 3, _chargeBreak: null };
    track(boss, 100, { team: 'player' });
    expect(boss._chargeBreak ?? null).toBeNull();
    expect(runtime).toContain('async function beginTurn(u){ if(G.over)return; u._hasStartedTurn=true; u._chargeBreak=null;');
    expect(runtime).toContain('trackChargeBreak(u,hpBefore-u.hp,src);');
  });

  it('B3b: a boss or elite guards only with the AP above its cycle reserve', () => {
    expect(bossGuardAp(5, 3)).toBe(2);
    expect(bossGuardAp(3, 3)).toBe(0);
    expect(bossGuardAp(2, 3)).toBe(0);
    expect(runtime).toContain('if(u.boss||u.elite){ const profile=bossTempoOf(u); u.gardeAP=profile?bossGuardAp(u.ap,bossApReserve(u._ultCooldown,profile,{maxap:u.maxap,...BOSS_TEMPO_RULES})):u.ap; }');
  });

  it('B3: the boss school states the break and the Guard reserve', () => {
    const page = readFileSync(join(process.cwd(), 'legacy-combat.html'), 'utf8');
    expect(page).toContain('<b>15 % de ses PV maximum</b> pour <b>briser la charge</b>');
    expect(page).toContain('seuls les PA au-delà de cette réserve comptent pour leur Garde');
  });
});
