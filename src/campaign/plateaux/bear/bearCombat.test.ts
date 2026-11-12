/**
 * The Bear's fights play in the Bear's own coded arenas (`src/combat/arena/arenaThemes.ts`; no arena plate since
 * OD-2026-11-01-C): the snowy pass on the trails, the mine galleries underground, the terrace before Borin's hall for
 * his trial. The other plateaux keep their arenas, and a scene id is static presentation that never reaches a save.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, BEAR_ARENA_IDS, type ArenaSceneId } from '../../../combat/arena/arenaThemes';
import { POST_DEMO_COMBATS, postDemoChapterOf } from '../../../game/postDemoContent';
import { createInitialState } from '../../../game/store';

const combats = [...POST_DEMO_COMBATS.values()];
const bearArenas: readonly string[] = BEAR_ARENA_IDS;

describe('Bear fights in the Bear arenas', () => {
  it('plays every Bear fight, story, optional or guardian, in a Bear arena under the Bear sign', () => {
    const bear = combats.filter((combat) => postDemoChapterOf(combat.id) === 'bear');
    expect(bear.length).toBeGreaterThan(15);
    for (const combat of bear) {
      expect(bearArenas, combat.id).toContain(combat.sceneId);
      expect(ARENA_THEMES[combat.sceneId as ArenaSceneId].emblem, combat.id).toBe('bear');
    }
  });

  it('stages each fight where it takes place', () => {
    const scene = (id: string) => POST_DEMO_COMBATS.get(id)?.sceneId;
    expect(scene('bear_borin')).toBe('bear_hall_terrace');
    for (const id of ['bear_pass_beasts', 'bear_raven_scouts', 'bear_raven_patrol', 'bear_poi_pass_beasts_a', 'bear_poi_mine_ravens_b', 'bear_guardian_foreman']) {
      expect(scene(id), id).toBe('bear_mountain_pass');
    }
    for (const id of ['bear_corrupted_beast', 'bear_mines_defense', 'bear_mines_seizure', 'bear_gallery_guardians', 'bear_master_spy', 'bear_poi_depths_watch_a', 'bear_guardian_depths']) {
      expect(scene(id), id).toBe('bear_mine_galleries');
    }
  });

  it('keeps its arenas to the Bear: no other plateau fights in one', () => {
    const others = combats.filter((combat) => postDemoChapterOf(combat.id) !== 'bear');
    expect(others.length).toBeGreaterThan(0);
    for (const combat of others) expect(bearArenas, combat.id).not.toContain(combat.sceneId);
  });

  it('never writes a scene id into the saved state', () => {
    expect(JSON.stringify(createInitialState())).not.toMatch(/sceneId|bear_(mountain_pass|mine_galleries|hall_terrace)/);
  });
});
