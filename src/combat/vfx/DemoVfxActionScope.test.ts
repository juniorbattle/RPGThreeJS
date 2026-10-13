/**
 * R2C-VFX Composer V2.6.3 — DEMO authoring scope classifier tests.
 *
 * These tests protect three things:
 *   1. The scope partition is total, exclusive and stable.
 *   2. The derivation actually tracks authoritative game data (route graph,
 *      catalog, narrative effects) instead of a frozen hand-written list.
 *   3. The one unavoidable mirror (enemy visual -> skills) cannot silently
 *      drift away from `legacyCombatRuntime.js`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  getVfxActionScopeRecords,
  getVfxActionScopeRecord,
  getVfxActionScope,
  getActionsInScope,
  getGroupedActionsInScope,
  getScopeCensus,
  getReachableCombatIds,
  getReachableEnemyVisualIds,
  getDemoCoreUnitIds,
  getDemoRecruitableUnitIds,
  getObtainableItemIds,
  DEMO_ACTION_GROUP_ORDER,
  UPCOMING_ACTION_GROUP_ORDER,
  VFX_ACTION_GROUP_LABELS,
  __testing,
} from './DemoVfxActionScope';
import { getLabActions } from './CombatVfxLab';
import { combatConfigs } from '../../game/content';
import { unitById, weaponById } from '../../game/catalog';
import { skillById } from '../../game/skills';

const LEGACY_RUNTIME_PATH = resolve(__dirname, '../legacyCombatRuntime.js');

describe('DemoVfxActionScope — partition integrity', () => {
  it('classifies every Composer action exactly once', () => {
    const records = getVfxActionScopeRecords();
    const actions = getLabActions();
    expect(records).toHaveLength(actions.length);

    const keys = records.map((r) => r.actionKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(keys)).toEqual(new Set(actions.map((a) => a.actionKey)));
  });

  it('splits DEMO and UPCOMING into disjoint, exhaustive halves', () => {
    const demo = getActionsInScope('DEMO').map((a) => a.actionKey);
    const upcoming = getActionsInScope('UPCOMING').map((a) => a.actionKey);
    expect(demo.length + upcoming.length).toBe(getLabActions().length);
    expect(demo.filter((k) => upcoming.includes(k))).toEqual([]);
  });

  it('gives every record a non-empty human reason', () => {
    for (const record of getVfxActionScopeRecords()) {
      expect(record.reason.length, record.actionKey).toBeGreaterThan(0);
    }
  });

  it('assigns each record a group belonging to its own scope', () => {
    for (const record of getVfxActionScopeRecords()) {
      const allowed: readonly string[] = record.scope === 'DEMO'
        ? DEMO_ACTION_GROUP_ORDER
        : UPCOMING_ACTION_GROUP_ORDER;
      expect(allowed, `${record.actionKey}:${record.group}`).toContain(record.group);
    }
  });

  it('labels every declared group', () => {
    for (const group of [...DEMO_ACTION_GROUP_ORDER, ...UPCOMING_ACTION_GROUP_ORDER]) {
      expect(VFX_ACTION_GROUP_LABELS[group]).toBeTruthy();
    }
  });

  it('is deterministic across repeated calls', () => {
    expect(getVfxActionScopeRecords()).toBe(getVfxActionScopeRecords());
    expect(JSON.stringify(getScopeCensus())).toBe(JSON.stringify(getScopeCensus()));
  });

  it('keeps census totals consistent with the records', () => {
    const census = getScopeCensus();
    expect(census.demo + census.upcoming).toBe(census.total);
    expect(census.total).toBe(getLabActions().length);

    const demoSum = Object.values(census.demoByGroup).reduce((a, b) => a + b, 0);
    const upcomingSum = Object.values(census.upcomingByGroup).reduce((a, b) => a + b, 0);
    expect(demoSum).toBe(census.demo);
    expect(upcomingSum).toBe(census.upcoming);
  });

  it('returns null for unknown action keys and defaults them to UPCOMING', () => {
    expect(getVfxActionScopeRecord('totally_made_up_action')).toBeNull();
    expect(getVfxActionScope('totally_made_up_action')).toBe('UPCOMING');
  });
});

describe('DemoVfxActionScope — grouped listing', () => {
  it('groups DEMO actions in declared order and omits empty groups', () => {
    const buckets = getGroupedActionsInScope('DEMO');
    const groups = buckets.map((b) => b.group);
    const expectedOrder = DEMO_ACTION_GROUP_ORDER.filter((g) => groups.includes(g));
    expect(groups).toEqual(expectedOrder);
    for (const bucket of buckets) expect(bucket.actions.length).toBeGreaterThan(0);
  });

  it('covers every scoped action exactly once across buckets', () => {
    for (const scope of ['DEMO', 'UPCOMING'] as const) {
      const flat = getGroupedActionsInScope(scope).flatMap((b) => b.actions.map((a) => a.actionKey));
      expect(new Set(flat).size).toBe(flat.length);
      expect(new Set(flat)).toEqual(new Set(getActionsInScope(scope).map((a) => a.actionKey)));
    }
  });
});

describe('DemoVfxActionScope — route reachability derivation', () => {
  it('proves every authored combat encounter is reachable on some legal route', () => {
    const reachable = getReachableCombatIds();
    const unreachable = [...combatConfigs.keys()].filter((id) => !reachable.has(id));
    expect(unreachable).toEqual([]);
  });

  it('only reports ids that are real combat configs', () => {
    for (const id of getReachableCombatIds()) {
      expect(combatConfigs.has(id), id).toBe(true);
    }
  });

  it('includes both Lion finale boss routes', () => {
    expect(getReachableCombatIds().has('serpent_captain')).toBe(true);
    expect(getReachableCombatIds().has('lion_chief')).toBe(true);
  });

  it('includes conduct-adaptive route variants that no dialogue can trigger', () => {
    // spider_nest is only ever offered as the honour-tier first combat variant.
    expect(getReachableCombatIds().has('spider_nest')).toBe(true);
  });

  it('derives enemy visuals from the reachable combats only', () => {
    const visuals = getReachableEnemyVisualIds();
    expect(visuals.size).toBeGreaterThan(0);
    for (const visualId of visuals) {
      const used = [...getReachableCombatIds()].some((id) => {
        const config = combatConfigs.get(id);
        if (!config) return false;
        return config.enemyVisualIds.includes(visualId)
          || config.escortVisualIds.includes(visualId)
          || config.bossVisualId === visualId;
      });
      expect(used, visualId).toBe(true);
    }
  });
});

describe('DemoVfxActionScope — party derivation', () => {
  it('derives the core roster from the initial game state', () => {
    expect(getDemoCoreUnitIds()).toEqual(['warrior', 'white_mage', 'dark_mage', 'archer']);
  });

  it('derives recruitable units from recruitUnit narrative effects', () => {
    expect([...getDemoRecruitableUnitIds()].sort()).toEqual(['lancer', 'rogue']);
  });

  it('never lists a core unit as recruitable', () => {
    for (const id of getDemoRecruitableUnitIds()) {
      expect(getDemoCoreUnitIds()).not.toContain(id);
    }
  });

  it('treats shop stock and craft outputs as obtainable', () => {
    const obtainable = getObtainableItemIds();
    expect(obtainable.has('steel_greatsword')).toBe(true);       // Valmir shop
    expect(obtainable.has('lion_guard_greatsword')).toBe(true);   // craft chain
    expect(obtainable.has('strength_ring')).toBe(true);           // shop accessory
  });

  it('does not invent items that no source provides', () => {
    expect(getObtainableItemIds().has('miracle_crosier')).toBe(false);
  });
});

describe('DemoVfxActionScope — hero action scoping', () => {
  const scopeOf = (key: string) => getVfxActionScope(key);

  it('marks basic attacks of every demo unit as DEMO', () => {
    for (const key of [
      'basic_greatsword_hit', 'basic_crosier_hit', 'basic_grimoire_hit',
      'basic_longbow_hit', 'basic_dagger_hit', 'basic_long_spear_hit',
    ]) {
      expect(scopeOf(key), key).toBe('DEMO');
    }
  });

  it('marks basic attacks of unobtainable classes as UPCOMING', () => {
    expect(scopeOf('basic_holy_mace_hit')).toBe('UPCOMING');
  });

  it('never places a hero Ultimate in DEMO scope', () => {
    const heroKeys = new Set(
      getLabActions().filter((a) => a.ownerType === 'HERO').map((a) => a.actionKey),
    );
    for (const record of getVfxActionScopeRecords()) {
      if (!heroKeys.has(record.actionKey)) continue;
      const ap = skillById.get(record.actionKey)?.ap;
      if (ap !== undefined && ap >= 5) {
        expect(record.scope, record.actionKey).toBe('UPCOMING');
      }
    }
  });

  it('scopes skills of units that cannot join as UPCOMING', () => {
    for (const key of ['p_holy_strike', 'p_interpose', 'p_oathwall']) {
      const record = getVfxActionScopeRecord(key)!;
      expect(record.scope, key).toBe('UPCOMING');
      expect(record.reason).toMatch(/cannot join/);
    }
  });

  it('admits a skill only when some obtainable weapon tier unlocks its AP', () => {
    for (const record of getVfxActionScopeRecords()) {
      if (record.scope !== 'DEMO') continue;
      const skill = skillById.get(record.actionKey);
      if (!skill) continue; // basic attack
      const owners = [...unitById.values()].filter((u) => u.skillIds.includes(record.actionKey));
      if (owners.length === 0) continue; // equipment-granted cross-class skill
      const bestTier = Math.max(
        ...owners.flatMap((u) => u.allowedWeaponIds
          .filter((id) => getObtainableItemIds().has(id))
          .map((id) => weaponById.get(id)?.tier ?? -1)),
        -1,
      );
      expect(bestTier, record.actionKey).toBeGreaterThanOrEqual(0);
    }
  });

  it('explains every UPCOMING hero action with an unlock or roster reason', () => {
    for (const record of getVfxActionScopeRecords()) {
      if (record.group !== 'HEROES_UPCOMING') continue;
      expect(record.reason, record.actionKey).toMatch(/ultimate|weapon tier|cannot join|not reachable/);
    }
  });
});

describe('DemoVfxActionScope — enemy action scoping', () => {
  it('places rank-and-file Serpent skills in SERPENTS, not ELITES_BOSSES', () => {
    for (const key of ['enemy_heavy_strike', 'enemy_dark_bolt', 'enemy_binding_shot']) {
      const record = getVfxActionScopeRecord(key)!;
      expect(record.scope, key).toBe('DEMO');
      expect(record.group, key).toBe('SERPENTS');
    }
  });

  it('places creature-only skills in CREATURES', () => {
    const record = getVfxActionScopeRecord('enemy_venom_strike')!;
    expect(record.scope).toBe('DEMO');
    expect(record.group).toBe('CREATURES');
  });

  it('places every boss_* skill it admits in ELITES_BOSSES', () => {
    for (const record of getVfxActionScopeRecords()) {
      if (record.scope !== 'DEMO') continue;
      if (!record.actionKey.startsWith('boss_')) continue;
      expect(record.group, record.actionKey).toBe('ELITES_BOSSES');
    }
  });

  it('admits the finale boss signature moves', () => {
    expect(getVfxActionScope('boss_titan_slam')).toBe('DEMO');
    expect(getVfxActionScope('boss_apocalypse')).toBe('DEMO');
  });

  it('excludes enemy skills carried only by unused templates', () => {
    // `troll` and `young_wyrm` templates are never referenced by a combat config.
    expect(getVfxActionScope('enemy_crush')).toBe('UPCOMING');
    expect(getVfxActionScope('enemy_dragon_breath')).toBe('UPCOMING');
    // `undead_champion` is authored but never deployed.
    expect(getVfxActionScope('boss_execution')).toBe('UPCOMING');
  });

  it('ties every DEMO enemy reason to a reachable combat', () => {
    for (const record of getVfxActionScopeRecords()) {
      if (record.scope !== 'DEMO') continue;
      if (!/^(enemy|boss)_/.test(record.actionKey)) continue;
      const match = /(?:enemy|boss) in (\w+)/.exec(record.reason);
      expect(match, record.actionKey).not.toBeNull();
      const combatId = match?.[1] ?? '';
      expect(getReachableCombatIds().has(combatId), record.reason).toBe(true);
    }
  });
});

describe('DemoVfxActionScope — legacy runtime mirror drift guard', () => {
  const source = readFileSync(LEGACY_RUNTIME_PATH, 'utf8');

  /** Extracts `skills:[...]` for one `VISUAL_UNIT_TEMPLATES` entry. */
  function runtimeSkillsFor(visualId: string): string[] {
    const entry = new RegExp(`\\n  ${visualId}:\\{[^\\n]*`).exec(source);
    if (!entry) throw new Error(`Visual template '${visualId}' not found in legacy runtime.`);
    const skills = /skills:\[([^\]]*)\]/.exec(entry[0] ?? '');
    const rawList = skills?.[1];
    if (rawList === undefined) throw new Error(`No skills array for '${visualId}'.`);
    return rawList
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter((s) => s.length > 0);
  }

  it('mirrors VISUAL_UNIT_TEMPLATES skills exactly', () => {
    for (const [visualId, mirrored] of Object.entries(__testing.ENEMY_VISUAL_SKILLS)) {
      expect(runtimeSkillsFor(visualId), visualId).toEqual([...mirrored]);
    }
  });

  it('mirrors every visual template the runtime declares', () => {
    const declared = [...source.matchAll(/\n  (\w+):\{team:'foe'/g)].map((m) => m[1]);
    const block = source.slice(source.indexOf('const VISUAL_UNIT_TEMPLATES={'));
    const inBlock = declared.filter((id) => block.includes(`\n  ${id}:{team:'foe'`));
    for (const id of inBlock) {
      expect(Object.keys(__testing.ENEMY_VISUAL_SKILLS), `missing mirror for ${id}`).toContain(id);
    }
  });

  it('mirrors the elite/boss flag for every template marked elite in the runtime', () => {
    for (const visualId of Object.keys(__testing.ENEMY_VISUAL_SKILLS)) {
      const entry = new RegExp(`\\n  ${visualId}:\\{[^\\n]*`).exec(source)?.[0] ?? '';
      expect(entry, visualId).not.toBe('');
      const isEliteInRuntime = /elite:true|boss:true/.test(entry);
      expect(__testing.ELITE_VISUAL_IDS.has(visualId), visualId).toBe(isEliteInRuntime);
    }
  });

  it('mirrors BOSS_DEFS skills for both finale routes', () => {
    const bossBlock = source.slice(source.indexOf('const BOSS_DEFS=['));
    const serpent = /Général Serpent[^\n]*?skills:\[([^\]]*)\]/.exec(bossBlock);
    const lion = /Champion du Lion[^\n]*?skills:\[([^\]]*)\]/.exec(bossBlock);
    const parse = (raw: string | undefined) =>
      (raw ?? '').split(',').map((s) => s.trim().replace(/^'|'$/g, ''));

    expect(parse(serpent?.[1])).toEqual([...(__testing.BOSS_COMBAT_SKILLS.serpent_captain ?? [])]);
    expect(parse(lion?.[1])).toEqual([...(__testing.BOSS_COMBAT_SKILLS.lion_chief ?? [])]);
  });

  it('keeps every mirrored skill id resolvable in the skill catalog', () => {
    const all = new Set<string>([
      ...Object.values(__testing.ENEMY_VISUAL_SKILLS).flat(),
      ...Object.values(__testing.BOSS_COMBAT_SKILLS).flat(),
    ]);
    for (const skillId of all) {
      expect(skillById.has(skillId), skillId).toBe(true);
    }
  });
});
