/**
 * The Dragon's fights play in the Dragon's own coded arenas (`src/combat/arena/arenaThemes.ts`; no arena plate since
 * OD-2026-11-01-C), by where each one takes place: the trail across the foothills and terraces, the snowy summits of
 * the climb to the altar, the Wolf's cave for the lair, the esplanade before Kaelen's hall for his trial. The other
 * plateaux keep their arenas, and a scene id is static presentation that never reaches a save.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, DRAGON_ARENA_IDS, FINALE_ARENA_IDS, type ArenaSceneId } from '../../../combat/arena/arenaThemes';
import { POST_DEMO_COMBATS, postDemoChapterOf } from '../../../game/postDemoContent';
import { createInitialState } from '../../../game/store';

const combats = [...POST_DEMO_COMBATS.values()];
const dragonArenas: readonly string[] = DRAGON_ARENA_IDS;
const scene = (id: string) => POST_DEMO_COMBATS.get(id)?.sceneId;

describe('Dragon fights in the Dragon arenas', () => {
  it('plays every Dragon fight, story, optional or guardian, in a Dragon arena, never under the lion', () => {
    const dragon = combats.filter((combat) => postDemoChapterOf(combat.id) === 'dragon');
    expect(dragon.length).toBeGreaterThan(15);
    for (const combat of dragon) {
      expect(dragonArenas, combat.id).toContain(combat.sceneId);
      expect(['dragon', 'wolf'], combat.id).toContain(ARENA_THEMES[combat.sceneId as ArenaSceneId].emblem);
    }
  });

  it('stages each fight where it takes place', () => {
    // regions I and II: the foothills' and terraces' trail, the Wolf's cache on the terraces included
    for (const id of ['dragon_wolf_patrol', 'dragon_wolf_scouts', 'dragon_crest_creatures', 'dragon_corrupted_wyrm', 'dragon_poi_foothill_wolves_a',
      'dragon_poi_foothill_beasts_b', 'dragon_poi_terrace_ravine_a', 'dragon_poi_terrace_raiders_b', 'dragon_guardian_champion']) {
      expect(scene(id), id).toBe('dragon_peak_trail');
    }
    // region III: the snowy summits, where the shaman is run down
    for (const id of ['dragon_shadow_touched', 'dragon_shadow_shaman', 'dragon_poi_peak_hunters_a', 'dragon_poi_peak_watch_b', 'dragon_guardian_wyrm']) {
      expect(scene(id), id).toBe('dragon_snowy_summit');
    }
    // the Wolf's lair, whichever way the company takes the Crystal
    for (const id of ['dragon_lair_assault', 'dragon_lair_seizure']) expect(scene(id), id).toBe('dragon_wolf_cave');
    // Kaelen's trial, on the esplanade before his hall (`dragon_kaelen_pre_combat`)
    expect(scene('dragon_kaelen')).toBe('dragon_hall_esplanade');
  });

  it('keeps its arenas to the Dragon, and the final act in its own', () => {
    const others = combats.filter((combat) => postDemoChapterOf(combat.id) !== 'dragon');
    expect(others.length).toBeGreaterThan(0);
    for (const combat of others) expect(dragonArenas, combat.id).not.toContain(combat.sceneId);
    const finale = combats.filter((combat) => postDemoChapterOf(combat.id) === 'finale');
    expect(finale.length).toBeGreaterThan(0);
    for (const combat of finale) expect(FINALE_ARENA_IDS as readonly string[], combat.id).toContain(combat.sceneId);
  });

  it('never writes a scene id into the saved state', () => {
    expect(JSON.stringify(createInitialState())).not.toMatch(/sceneId|dragon_(peak_trail|snowy_summit|hall_esplanade|wolf_cave)/);
  });
});
