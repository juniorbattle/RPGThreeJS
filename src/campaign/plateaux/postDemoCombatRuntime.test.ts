/**
 * Set 1.20.0, post-demo Lots 1 to 4: the Bear's, the Dragon's, the Scorpion's and the final act's fights exist in the tactical runtime. Every enemy and
 * escort a plateau lists has a runtime template, every boss fight finds its own boss by its combat ID, and every enemy
 * skill and natural attack already has its procedural FX signature, so no plateau adds a new FX (COMBAT_AND_VFX).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enemyAttackFxRecipe, skillFxRecipe } from '../../combat/fx/fxSkills';
import { __testing } from '../../combat/vfx/DemoVfxActionScope';
import { combatConfigs } from '../../game/content';
import { POST_DEMO_COMBATS } from '../../game/postDemoContent';
import { BEAR_PROVISIONAL_ENEMIES } from './bear/bearPresentation';
import { DRAGON_PROVISIONAL_ENEMIES } from './dragon/dragonPresentation';
import { SCORPION_PROVISIONAL_ENEMIES } from './scorpion/scorpionPresentation';
import { FINALE_PROVISIONAL_ENEMIES } from './finale/finalePresentation';
import { CLAN_SUPPORTS } from './finale/finaleCombat';
import { skillById } from '../../game/skills';

const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
const templateLine = (id: string) => new RegExp(`\\n  ${id}:\\{team:'foe'[^\\n]*`).exec(runtime)?.[0] ?? '';
const bossLine = (combatId: string) => runtime.slice(runtime.indexOf('const BOSS_DEFS=['), runtime.indexOf('const BOSS_PORTRAITS='))
  .split('\n').find((line) => line.includes(`combatIds:[`) && line.includes(`'${combatId}'`)) ?? '';
const list = (line: string, key: string) => (new RegExp(`${key}:\\[([^\\]]*)\\]`).exec(line)?.[1] ?? '')
  .split(',').map((item) => item.trim().replace(/^'|'$/g, '')).filter(Boolean);
const weaponName = (line: string) => /weapons:\[\{name:'([^']+)'/.exec(line)?.[1];

const postDemoCombats = [...POST_DEMO_COMBATS.values()];

describe('post-demo fights in the tactical runtime (set 1.20.0, Lots 1 to 4)', () => {
  it('gives every post-demo enemy and escort a runtime template, and keeps them apart from the demo fights', () => {
    expect(postDemoCombats.some((combat) => combat.id.startsWith('bear_'))).toBe(true);
    expect(postDemoCombats.some((combat) => combat.id.startsWith('dragon_'))).toBe(true);
    expect(postDemoCombats.some((combat) => combat.id.startsWith('scorpion_'))).toBe(true);
    for (const combat of postDemoCombats) {
      expect(combatConfigs.has(combat.id), combat.id).toBe(false);
      for (const visualId of [...combat.enemyVisualIds, ...combat.escortVisualIds]) {
        expect(templateLine(visualId), `${combat.id}: ${visualId}`).not.toBe('');
      }
    }
  });

  it('chooses each post-demo boss by its fight, never the demo bosses', () => {
    const bosses = postDemoCombats.filter((combat) => combat.isBoss);
    expect(bosses.map((combat) => combat.id).sort()).toEqual(['bear_borin', 'bear_master_spy', 'bear_mines_defense', 'bear_mines_seizure',
      'dragon_kaelen', 'dragon_lair_assault', 'dragon_lair_seizure', 'dragon_shadow_shaman',
      'finale_arena_assault', 'finale_breach', 'finale_serpent_final',
      'scorpion_inquisitor', 'scorpion_shadow_prophet', 'scorpion_temple_assault', 'scorpion_temple_seizure']);
    for (const combat of bosses) {
      const line = bossLine(combat.id);
      // Every post-demo boss stands on its final master (OD-2026-11-11-F): the Bear's, the Dragon's, the Scorpion's and the
      // final act's; Maelor, at the breach, on his approved master.
      const chapter = /^(bear|dragon|scorpion|finale)_/.exec(combat.id)![1];
      expect(line, combat.id).not.toContain('provisionalSprite');
      expect(line, combat.id).toContain(combat.id === 'finale_breach' ? "portrait:'/assets/characters/pixel/masters/maelor.png'"
        : `portrait:'/assets/characters/pixel/post-demo/${chapter}/`);
      expect(list(line, 'skills'), combat.id).toEqual([...__testing.POST_DEMO_BOSS_COMBAT_SKILLS[combat.id]!]);
    }
    for (const demo of ['serpent_captain', 'lion_chief']) expect(bossLine(demo)).toBe('');
  });

  it('uses only skills and natural attacks that already have their procedural FX signature', () => {
    const lines = [
      ...new Set(postDemoCombats.flatMap((combat) => [...combat.enemyVisualIds, ...combat.escortVisualIds])),
    ].map(templateLine).concat(postDemoCombats.filter((combat) => combat.isBoss).map((combat) => bossLine(combat.id)));
    for (const line of lines) {
      for (const skillId of list(line, 'skills')) expect(skillFxRecipe(skillId), skillId).not.toBeNull();
    }
    // Natural attacks (claws, stones, thrown blades) play their own recipe; weapons keep the shared weapon sounds.
    for (const id of ['raven_scout', 'corrupted_beast', 'depth_beast', 'wolf_hunter', 'wolf_champion', 'shadow_wyrm', 'shadow_zealot']) {
      expect(enemyAttackFxRecipe(weaponName(templateLine(id))), id).not.toBeNull();
    }
  });

  it('stands every new family on its final sprite, each listed with the brief it was made from', () => {
    const families = ['raven_scout', 'raven_miner', 'raven_foreman', 'corrupted_beast', 'depth_beast', 'bear_warrior',
      'wolf_raider', 'wolf_hunter', 'wolf_champion', 'shadow_wyrm', 'dragon_guardian',
      'phoenix_guardian', 'phoenix_flamekeeper', 'shadow_zealot', 'scorpion_scholar',
      'raven_champion', 'phoenix_champion', 'breach_demon', 'demon_brute'];
    const listed = [...BEAR_PROVISIONAL_ENEMIES, ...DRAGON_PROVISIONAL_ENEMIES, ...SCORPION_PROVISIONAL_ENEMIES,
      ...FINALE_PROVISIONAL_ENEMIES];
    const finalChapter = new Map([
      ...BEAR_PROVISIONAL_ENEMIES.filter((enemy) => enemy.master).map((enemy) => [enemy.unitId, 'bear'] as const),
      ...DRAGON_PROVISIONAL_ENEMIES.filter((enemy) => enemy.master).map((enemy) => [enemy.unitId, 'dragon'] as const),
      ...SCORPION_PROVISIONAL_ENEMIES.filter((enemy) => enemy.master).map((enemy) => [enemy.unitId, 'scorpion'] as const),
      ...FINALE_PROVISIONAL_ENEMIES.filter((enemy) => enemy.master).map((enemy) => [enemy.unitId, 'finale'] as const),
    ]);
    // No combat unit of the game keeps a provisional sprite since the final act's integration.
    expect(runtime).not.toContain('provisionalSprite:true');
    for (const id of families) {
      const chapter = finalChapter.get(id);
      expect(chapter, id).toBeDefined();
      expect(templateLine(id), id).not.toContain('provisionalSprite');
      expect(templateLine(id), id).toContain(`portrait:'/assets/characters/pixel/post-demo/${chapter}/${id}.png'`);
      expect(__testing.ENEMY_VISUAL_SKILLS[id], id).toEqual(list(templateLine(id), 'skills'));
      expect(listed.some((enemy) => enemy.unitId === id), id).toBe(true);
    }
  });

  it('fights the breach in two phases: Maelor first, then the entity, each chosen by the fight and its phase', () => {
    const bosses = runtime.slice(runtime.indexOf('const BOSS_DEFS=['), runtime.indexOf('const BOSS_PORTRAITS='))
      .split('\n').filter((line) => line.includes("combatIds:['finale_breach']"));
    expect(bosses.map((line) => /name:'([^']+)'/.exec(line)?.[1])).toEqual(['Maelor', 'Entité de la brèche']);
    expect(bosses.map((line) => /phase:(\d)/.exec(line)?.[1])).toEqual(['1', '2']);
    for (const line of bosses) for (const skillId of list(line, 'skills')) expect(skillFxRecipe(skillId), skillId).not.toBeNull();
    const breach = POST_DEMO_COMBATS.get('finale_breach')!;
    expect(breach.phases).toEqual([{ label: 'L’entité de la brèche', bossVisualId: 'breach_entity', escortVisualIds: ['breach_demon', 'breach_demon'] }]);
    expect(postDemoCombats.filter((combat) => combat.phases).map((combat) => combat.id)).toEqual(['finale_breach']);
  });

  it('gives each clan support an existing, non-Ultimate skill with its procedural FX signature', () => {
    for (const [clan, support] of Object.entries(CLAN_SUPPORTS)) {
      const skill = skillById.get(support!.skillId);
      expect(skill, clan).toBeDefined();
      expect(skill!.ap, clan).toBeLessThanOrEqual(4);
      expect(skillFxRecipe(support!.skillId), clan).not.toBeNull();
    }
    expect(Object.keys(CLAN_SUPPORTS)).not.toContain('serpent');
  });
});
