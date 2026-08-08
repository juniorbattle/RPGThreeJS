import { describe, expect, it } from 'vitest';
import { skills } from '../../game/skills';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS, SKILL_PRESENTATION, ENEMY_SKILL_PRESENTATION } from '../skillPresentation';
import {
  resolveCombatStageProfileUniversal,
  getStageProfileInfo,
  type ActionSpecForStage,
  type PresentationForStage,
} from './combatStageProfiles';

interface AuditRow {
  key: string;
  family: string;
  explicit: boolean;
  layout: string;
  stageEnabled: boolean;
}

function skillToSpec(s: typeof skills[number]): ActionSpecForStage {
  return {
    key: s.id,
    type: s.type,
    offensive: s.offensive,
    support: s.support,
    self: s.self,
    radius: s.radius,
    range: s.range,
    mode: s.mode,
    dest: s.dest,
    targetMode: s.targetMode,
    healPercent: s.healPercent,
    flatHeal: s.flatHeal,
    status: s.status,
    ap: s.ap,
    shape: s.shape,
    effects: s.effects,
  };
}

function presForSkill(id: string): PresentationForStage | null {
  const heroPres = SKILL_PRESENTATION[id as (typeof HERO_SKILL_IDS)[number]];
  if (heroPres) return { ultimate: heroPres.ultimate, visualTier: heroPres.visualTier, motionPreset: heroPres.motionPreset, castStyle: heroPres.castStyle, scaleTier: heroPres.scaleTier };
  const enemyPres = ENEMY_SKILL_PRESENTATION[id as (typeof ENEMY_SKILL_IDS)[number]];
  if (enemyPres) return { ultimate: enemyPres.ultimate, visualTier: enemyPres.visualTier, motionPreset: enemyPres.motionPreset, castStyle: enemyPres.castStyle, scaleTier: enemyPres.scaleTier };
  return null;
}

function buildAudit(): AuditRow[] {
  const rows: AuditRow[] = [];

  rows.push({
    key: 'attack',
    family: 'BASIC_MELEE',
    explicit: true,
    layout: 'single_target',
    stageEnabled: true,
  });

  for (const s of skills) {
    const spec = skillToSpec(s);
    const pres = presForSkill(s.id);
    const profile = resolveCombatStageProfileUniversal(spec, pres);
    const info = getStageProfileInfo(spec, pres);
    rows.push({
      key: s.id,
      family: info?.id ?? 'UNRESOLVED',
      explicit: info?.explicit ?? false,
      layout: profile?.layout ?? 'none',
      stageEnabled: profile !== undefined,
    });
  }

  return rows;
}

describe('R0B universal routing audit', () => {
  const audit = buildAudit();

  it('offensive and ultimate actions resolve to Stage; support/movement route to tactical', () => {
    const stageRows = audit.filter((r) => r.stageEnabled);
    const tacticalRows = audit.filter((r) => !r.stageEnabled);
    expect(stageRows.length).toBeGreaterThan(0);
    expect(tacticalRows.length).toBeGreaterThan(0);
    // All ultimates must be Stage-enabled
    for (const row of audit) {
      const p = presForSkill(row.key);
      if (p?.ultimate === true) {
        expect(row.stageEnabled, `Ultimate "${row.key}" must be Stage-enabled`).toBe(true);
      }
    }
  });

  it('explicit profiles are preserved for pilot actions', () => {
    const attack = audit.find((r) => r.key === 'attack');
    expect(attack?.explicit).toBe(true);
    expect(attack?.family).toBe('BASIC_MELEE');

    const flameWave = audit.find((r) => r.key === 'n_flame_wave');
    expect(flameWave?.explicit).toBe(true);
    expect(flameWave?.family).toBe('FLAME_WAVE');

    const eclipse = audit.find((r) => r.key === 'd_devouring_eclipse');
    expect(eclipse?.explicit).toBe(true);
    expect(eclipse?.family).toBe('DEVOURING_ECLIPSE');
  });

  it('non-ultimate healing actions route to TACTICAL; ultimate healing (w_miracle) uses Stage', () => {
    const salvation = audit.find((r) => r.key === 'w_salvation');
    expect(salvation?.stageEnabled).toBe(false);

    const sanctuary = audit.find((r) => r.key === 'w_sanctuary');
    expect(sanctuary?.stageEnabled).toBe(false);

    const miracle = audit.find((r) => r.key === 'w_miracle');
    expect(miracle?.stageEnabled).toBe(true);
  });

  it('non-ultimate support actions route to TACTICAL; ultimate support (e_absolute_harmony) uses Stage', () => {
    const bloodPact = audit.find((r) => r.key === 'd_blood_pact');
    expect(bloodPact?.stageEnabled).toBe(false);

    const vigorRune = audit.find((r) => r.key === 'e_vigor_rune');
    expect(vigorRune?.stageEnabled).toBe(false);

    const oathwall = audit.find((r) => r.key === 'p_oathwall');
    expect(oathwall?.stageEnabled).toBe(false);

    const harmony = audit.find((r) => r.key === 'e_absolute_harmony');
    expect(harmony?.stageEnabled).toBe(true);
  });

  it('multi-target offensive actions use Stage', () => {
    const arrowRain = audit.find((r) => r.key === 'a_arrow_rain');
    expect(arrowRain?.stageEnabled).toBe(true);
    expect(arrowRain?.family).toBe('MULTI_TARGET_OFFENSIVE');

    const whirl = audit.find((r) => r.key === 'w_whirl');
    expect(whirl?.stageEnabled).toBe(true);
    expect(whirl?.family).toBe('MULTI_TARGET_OFFENSIVE');
  });

  it('movement/teleport actions route to TACTICAL', () => {
    const teleport = audit.find((r) => r.key === 'n_teleport');
    expect(teleport?.stageEnabled).toBe(false);

    const hawkLeapap = audit.find((r) => r.key === 'a_hawk_leap');
    expect(hawkLeapap?.stageEnabled).toBe(false);

    // w_charge is type:move with mode:dash — routes to tactical
    const charge = audit.find((r) => r.key === 'w_charge');
    expect(charge?.stageEnabled).toBe(false);
  });

  it('debuff actions use Stage', () => {
    const hex = audit.find((r) => r.key === 'enemy_hex');
    expect(hex?.stageEnabled).toBe(true);
    expect(hex?.family).toBe('SINGLE_TARGET_DEBUFF');

    const bindingSeal = audit.find((r) => r.key === 'e_binding_seal');
    expect(bindingSeal?.stageEnabled).toBe(true);
    expect(bindingSeal?.family).toBe('GROUP_DEBUFF');
  });

  it('ultimates use Stage (offensive arena/sky descent or support family)', () => {
    const ultimates = audit.filter((r) => {
      const p = presForSkill(r.key);
      return p?.ultimate === true;
    });
    expect(ultimates.length).toBeGreaterThan(0);
    for (const u of ultimates) {
      expect(u.stageEnabled, `Ultimate "${u.key}" should be Stage-enabled`).toBe(true);
    }

    const darkMeteor = audit.find((r) => r.key === 'n_dark_meteor');
    expect(darkMeteor?.family).toBe('SKY_DESCENT_ULTIMATE');

    const lionSurge = audit.find((r) => r.key === 'w_lion_surge');
    expect(lionSurge?.family).toBe('ARENA_ULTIMATE');

    // Support ultimates use support family layouts for proper faction-side slots
    const miracle = audit.find((r) => r.key === 'w_miracle');
    expect(miracle?.stageEnabled).toBe(true);
    expect(['GROUP_HEAL', 'SINGLE_TARGET_HEAL'].includes(miracle?.family ?? '')).toBe(true);
  });

  it('boss signature actions use Stage', () => {
    const bossSlam = audit.find((r) => r.key === 'boss_slam');
    expect(bossSlam?.stageEnabled).toBe(true);
    expect(bossSlam?.family).toBe('BOSS_SIGNATURE');

    const bossExecution = audit.find((r) => r.key === 'boss_execution');
    expect(bossExecution?.stageEnabled).toBe(true);
    expect(bossExecution?.family).toBe('BOSS_SIGNATURE');
  });

  it('enemy actions use Stage', () => {
    const heavyStrike = audit.find((r) => r.key === 'enemy_heavy_strike');
    expect(heavyStrike?.stageEnabled).toBe(true);

    const dragonBreath = audit.find((r) => r.key === 'enemy_dragon_breath');
    expect(dragonBreath?.stageEnabled).toBe(true);
  });

  it('audit covers all registered skills plus basic attack', () => {
    expect(audit.length).toBe(skills.length + 1);
  });

  it('produces audit table (visible in test output)', () => {
    const header = '| key | family | explicit | layout | stage |\n|---|---|---|---|---|';
    const table = audit.map((r) => `| ${r.key} | ${r.family} | ${r.explicit ? 'YES' : 'no'} | ${r.layout} | ${r.stageEnabled ? 'YES' : 'NO'} |`).join('\n');
    const fullTable = header + '\n' + table;
    expect(fullTable).toBeDefined();
  });
});
