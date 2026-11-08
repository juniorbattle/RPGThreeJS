/**
 * Set 1.20.0, post-demo Lots 1 and 2: the Bear's and the Dragon's fights exist in the tactical runtime. Every enemy and
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

const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
const templateLine = (id: string) => new RegExp(`\\n  ${id}:\\{team:'foe'[^\\n]*`).exec(runtime)?.[0] ?? '';
const bossLine = (combatId: string) => runtime.slice(runtime.indexOf('const BOSS_DEFS=['), runtime.indexOf('const BOSS_PORTRAITS='))
  .split('\n').find((line) => line.includes(`combatIds:[`) && line.includes(`'${combatId}'`)) ?? '';
const list = (line: string, key: string) => (new RegExp(`${key}:\\[([^\\]]*)\\]`).exec(line)?.[1] ?? '')
  .split(',').map((item) => item.trim().replace(/^'|'$/g, '')).filter(Boolean);
const weaponName = (line: string) => /weapons:\[\{name:'([^']+)'/.exec(line)?.[1];

const postDemoCombats = [...POST_DEMO_COMBATS.values()];

describe('post-demo fights in the tactical runtime (set 1.20.0, Lots 1 and 2)', () => {
  it('gives every post-demo enemy and escort a runtime template, and keeps them apart from the demo fights', () => {
    expect(postDemoCombats.some((combat) => combat.id.startsWith('bear_'))).toBe(true);
    expect(postDemoCombats.some((combat) => combat.id.startsWith('dragon_'))).toBe(true);
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
      'dragon_kaelen', 'dragon_lair_assault', 'dragon_lair_seizure', 'dragon_shadow_shaman']);
    for (const combat of bosses) {
      const line = bossLine(combat.id);
      expect(line, combat.id).toContain('provisionalSprite:true');
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
    for (const id of ['raven_scout', 'corrupted_beast', 'depth_beast', 'wolf_hunter', 'wolf_champion', 'shadow_wyrm']) {
      expect(enemyAttackFxRecipe(weaponName(templateLine(id))), id).not.toBeNull();
    }
  });

  it('marks every new family as a provisional sprite listed with its awaited final image', () => {
    const families = ['raven_scout', 'raven_miner', 'raven_foreman', 'corrupted_beast', 'depth_beast', 'bear_warrior',
      'wolf_raider', 'wolf_hunter', 'wolf_champion', 'shadow_wyrm', 'dragon_guardian'];
    const listed = [...BEAR_PROVISIONAL_ENEMIES, ...DRAGON_PROVISIONAL_ENEMIES];
    for (const id of families) {
      expect(templateLine(id), id).toContain('provisionalSprite:true');
      expect(__testing.ENEMY_VISUAL_SKILLS[id], id).toEqual(list(templateLine(id), 'skills'));
      expect(listed.some((enemy) => enemy.unitId === id), id).toBe(true);
    }
  });
});
