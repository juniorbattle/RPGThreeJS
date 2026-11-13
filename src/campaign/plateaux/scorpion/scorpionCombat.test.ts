/**
 * The Scorpion's fights play in the Scorpion plateau's own coded arenas (`src/combat/arena/arenaThemes.ts`; no arena
 * plate since OD-2026-11-01-C), by where each scene stages it: the dune track of region I, the road through the Phoenix's
 * ruins in region II, the temple's nave for the codex, the sanctuary of the sacred ashes in region III, the dune crest
 * at dusk where the Prophet is run down, the court of the house of records for the Grand Inquisiteur's trial. The other
 * plateaux keep their arenas, the final act has its own, and a scene id is static presentation that never reaches a save.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, BEAR_ARENA_IDS, DRAGON_ARENA_IDS, FINALE_ARENA_IDS, SCORPION_ARENA_IDS, type ArenaSceneId } from '../../../combat/arena/arenaThemes';
import { POST_DEMO_COMBATS, postDemoChapterOf } from '../../../game/postDemoContent';
import { createInitialState } from '../../../game/store';

const combats = [...POST_DEMO_COMBATS.values()];
const scorpionArenas: readonly string[] = SCORPION_ARENA_IDS;
const scene = (id: string) => POST_DEMO_COMBATS.get(id)?.sceneId;

describe('Scorpion fights in the Scorpion arenas', () => {
  it('plays every Scorpion fight, story, optional or guardian, in a Scorpion arena, never under the lion', () => {
    const scorpion = combats.filter((combat) => postDemoChapterOf(combat.id) === 'scorpion');
    expect(scorpion.length).toBeGreaterThan(15);
    for (const combat of scorpion) {
      expect(scorpionArenas, combat.id).toContain(combat.sceneId);
      expect(['scorpion', 'phoenix'], combat.id).toContain(ARENA_THEMES[combat.sceneId as ArenaSceneId].emblem);
    }
  });

  it('stages each fight where it takes place', () => {
    // region I: the track toward the scholars' oasis, the Phoenix's scouts on the oasis path included
    for (const id of ['scorpion_dune_beasts', 'scorpion_phoenix_scouts', 'scorpion_poi_dune_serpents_a', 'scorpion_poi_dune_serpents_b',
      'scorpion_poi_dune_spiders_a', 'scorpion_poi_dune_spiders_b']) {
      expect(scene(id), id).toBe('scorpion_dune_track');
    }
    // region II: the road through the ruins, up to the flame warden who bars the way to the temple
    for (const id of ['scorpion_temple_sentinels', 'scorpion_flamekeeper', 'scorpion_poi_ruin_sentinels_a', 'scorpion_poi_ruin_sentinels_b',
      'scorpion_poi_ruin_serpents_a', 'scorpion_poi_ruin_serpents_b', 'scorpion_guardian_flamekeeper']) {
      expect(scene(id), id).toBe('scorpion_phoenix_ruins');
    }
    // the codex, whichever way the company takes it, in the nave before the flame
    for (const id of ['scorpion_temple_assault', 'scorpion_temple_seizure']) expect(scene(id), id).toBe('scorpion_phoenix_temple');
    // region III: the faithful led astray guard the sanctuary of the sacred ashes, and so do its guards and its guardian
    for (const id of ['scorpion_lost_faithful', 'scorpion_poi_sanctum_guards_a', 'scorpion_poi_sanctum_guards_b', 'scorpion_guardian_zealot']) {
      expect(scene(id), id).toBe('scorpion_ash_sanctuary');
    }
    // "Il s'est enfui dans les dunes": the Prophet on the crest at dusk, and the watch of the sands out in the dunes
    for (const id of ['scorpion_shadow_prophet', 'scorpion_poi_sanctum_watch_a', 'scorpion_poi_sanctum_watch_b']) expect(scene(id), id).toBe('scorpion_dune_crest');
    // the Grand Inquisiteur's trial in the court of his house of records (`scorpion_inquisitor_pre_combat`)
    expect(scene('scorpion_inquisitor')).toBe('scorpion_records_court');
  });

  it('keeps its arenas to the Scorpion, the Bear, the Dragon and the final act in theirs', () => {
    const others = combats.filter((combat) => postDemoChapterOf(combat.id) !== 'scorpion');
    expect(others.length).toBeGreaterThan(0);
    for (const combat of others) expect(scorpionArenas, combat.id).not.toContain(combat.sceneId);
    const bear: readonly string[] = BEAR_ARENA_IDS, dragon: readonly string[] = DRAGON_ARENA_IDS;
    for (const combat of combats.filter((c) => postDemoChapterOf(c.id) === 'bear')) expect(bear, combat.id).toContain(combat.sceneId);
    for (const combat of combats.filter((c) => postDemoChapterOf(c.id) === 'dragon')) expect(dragon, combat.id).toContain(combat.sceneId);
    const finale = combats.filter((combat) => postDemoChapterOf(combat.id) === 'finale');
    expect(finale.length).toBeGreaterThan(0);
    for (const combat of finale) expect(FINALE_ARENA_IDS as readonly string[], combat.id).toContain(combat.sceneId);
  });

  it('never writes a scene id into the saved state', () => {
    expect(JSON.stringify(createInitialState())).not.toMatch(/sceneId|scorpion_(dune_track|dune_crest|phoenix_ruins|phoenix_temple|ash_sanctuary|records_court)/);
  });
});
