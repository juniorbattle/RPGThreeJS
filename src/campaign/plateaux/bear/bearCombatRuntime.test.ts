/**
 * Set 1.20.0, post-demo Lot 1 — DRAFT: the Bear's fights exist in the tactical runtime. Every enemy and escort the
 * Bear lists has a runtime template, every Bear boss fight finds its own boss by its combat ID, and every enemy skill
 * and natural attack already has its procedural FX signature, so the plateau adds no new FX (COMBAT_AND_VFX).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enemyAttackFxRecipe, skillFxRecipe } from '../../../combat/fx/fxSkills';
import { __testing } from '../../../combat/vfx/DemoVfxActionScope';
import { combatConfigs } from '../../../game/content';
import { POST_DEMO_COMBATS } from '../../../game/postDemoContent';
import { BEAR_PROVISIONAL_ENEMIES } from './bearPresentation';

const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
const templateLine = (id: string) => new RegExp(`\\n  ${id}:\\{team:'foe'[^\\n]*`).exec(runtime)?.[0] ?? '';
const bossLine = (combatId: string) => runtime.slice(runtime.indexOf('const BOSS_DEFS=['), runtime.indexOf('const BOSS_PORTRAITS='))
  .split('\n').find((line) => line.includes(`combatIds:[`) && line.includes(`'${combatId}'`)) ?? '';
const list = (line: string, key: string) => (new RegExp(`${key}:\\[([^\\]]*)\\]`).exec(line)?.[1] ?? '')
  .split(',').map((item) => item.trim().replace(/^'|'$/g, '')).filter(Boolean);
const weaponName = (line: string) => /weapons:\[\{name:'([^']+)'/.exec(line)?.[1];

const bearCombats = [...POST_DEMO_COMBATS.values()].filter((combat) => combat.id.startsWith('bear_'));

describe('Bear fights in the tactical runtime (set 1.20.0, Lot 1 draft)', () => {
  it('gives every Bear enemy and escort a runtime template, and keeps the Bear apart from the demo fights', () => {
    for (const combat of bearCombats) {
      expect(combatConfigs.has(combat.id), combat.id).toBe(false);
      for (const visualId of [...combat.enemyVisualIds, ...combat.escortVisualIds]) {
        expect(templateLine(visualId), `${combat.id}: ${visualId}`).not.toBe('');
      }
    }
  });

  it('chooses each Bear boss by its fight, never the demo bosses', () => {
    const bosses = bearCombats.filter((combat) => combat.isBoss);
    expect(bosses.map((combat) => combat.id).sort()).toEqual(['bear_borin', 'bear_master_spy', 'bear_mines_defense', 'bear_mines_seizure']);
    for (const combat of bosses) {
      const line = bossLine(combat.id);
      expect(line, combat.id).toContain('provisionalSprite:true');
      expect(list(line, 'skills'), combat.id).toEqual([...__testing.POST_DEMO_BOSS_COMBAT_SKILLS[combat.id]!]);
    }
    for (const demo of ['serpent_captain', 'lion_chief']) expect(bossLine(demo)).toBe('');
  });

  it('uses only skills and natural attacks that already have their procedural FX signature', () => {
    const lines = [
      ...new Set(bearCombats.flatMap((combat) => [...combat.enemyVisualIds, ...combat.escortVisualIds])),
    ].map(templateLine).concat(bearCombats.filter((combat) => combat.isBoss).map((combat) => bossLine(combat.id)));
    for (const line of lines) {
      for (const skillId of list(line, 'skills')) expect(skillFxRecipe(skillId), skillId).not.toBeNull();
    }
    // Natural attacks (claws, stones, thrown blades) play their own recipe; weapons keep the shared weapon sounds.
    for (const id of ['raven_scout', 'corrupted_beast', 'depth_beast']) {
      expect(enemyAttackFxRecipe(weaponName(templateLine(id))), id).not.toBeNull();
    }
  });

  it('marks every new Bear family as a provisional sprite listed with its awaited final image', () => {
    const families = ['raven_scout', 'raven_miner', 'raven_foreman', 'corrupted_beast', 'depth_beast', 'bear_warrior'];
    for (const id of families) {
      expect(templateLine(id), id).toContain('provisionalSprite:true');
      expect(__testing.ENEMY_VISUAL_SKILLS[id], id).toEqual(list(templateLine(id), 'skills'));
      expect(BEAR_PROVISIONAL_ENEMIES.some((enemy) => enemy.unitId === id), id).toBe(true);
    }
  });
});
