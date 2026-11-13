/**
 * The final act's fights play in the final act's own coded arenas (`src/combat/arena/arenaThemes.ts`; no arena plate
 * since OD-2026-11-01-C), by where each scene stages them: the Arena of Destinies on the Tournament's day for the bouts
 * and the final, the same arena burning under the breach for the assault, the capital's burning streets and their
 * collapsed houses, the great square and the ramparts under the next day's smoke, the heart of the breach before dawn,
 * and the same crater at dusk once the breach has closed for the Fear ending's last stand. The other plateaux keep their
 * arenas, and a scene id is static presentation that never reaches a save.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_THEMES, BEAR_ARENA_IDS, DRAGON_ARENA_IDS, FINALE_ARENA_IDS, SCORPION_ARENA_IDS, type ArenaSceneId } from '../../../combat/arena/arenaThemes';
import { POST_DEMO_COMBATS, postDemoChapterOf } from '../../../game/postDemoContent';
import { createInitialState } from '../../../game/store';

const combats = [...POST_DEMO_COMBATS.values()];
const finaleArenas: readonly string[] = FINALE_ARENA_IDS;
const scene = (id: string) => POST_DEMO_COMBATS.get(id)?.sceneId;

describe('the final act’s fights in the final act’s arenas', () => {
  it('plays every final-act fight, story, optional, guardian or ending, in an arena of the final act, never in the Lion’s', () => {
    const finale = combats.filter((combat) => postDemoChapterOf(combat.id) === 'finale');
    expect(finale.length).toBeGreaterThanOrEqual(12);
    for (const combat of finale) {
      expect(finaleArenas, combat.id).toContain(combat.sceneId);
      expect(['forest_route', 'bois_clair_burning', 'lion_sanctum'], combat.id).not.toContain(combat.sceneId);
    }
  });

  it('stages each fight where it takes place', () => {
    // the Tournament's bouts and its final, on the sand of the Arena of Destinies under the eight clans' banners
    for (const id of ['finale_raven_bout', 'finale_wolf_bout', 'finale_phoenix_bout', 'finale_serpent_final']) expect(scene(id), id).toBe('finale_destiny_arena');
    // "Survivez à l'assaut des démons et quittez l'arène": the same arena burning, the breach open over its sand
    expect(scene('finale_arena_assault')).toBe('finale_arena_breach');
    // the streets that run down from the arena, burning that night, and the houses fallen in them
    for (const id of ['finale_burning_streets', 'finale_poi_ruins_a', 'finale_poi_ruins_b']) expect(scene(id), id).toBe('finale_burning_streets');
    // the next day under the smoke: the great square the massive demon holds, the foot of the ramparts by their reserve
    expect(scene('finale_demon_square')).toBe('finale_smoke_square');
    expect(scene('finale_guardian_ramparts')).toBe('finale_rampart_reserve');
    // "Maelor nous attend au cœur de la brèche", before dawn in the lower city
    expect(scene('finale_breach')).toBe('finale_breach_heart');
    // the Fear ending's last stand, in the empty crater at dusk once the breach has closed (`finale_fear_close`)
    expect(scene('finale_last_stand')).toBe('finale_breach_scar');
  });

  it('flies the clans’ banners only where they flew, and shows the breach only where it is open', () => {
    const banners = (id: string) => ARENA_THEMES[id as ArenaSceneId].props.filter((prop) => prop.kind === 'clan_mast' || prop.kind === 'banner');
    const tear = (id: string) => ARENA_THEMES[id as ArenaSceneId].props.some((prop) => prop.kind === 'breach_tear');
    expect(banners(scene('finale_raven_bout')!).length).toBe(8);
    expect(banners(scene('finale_breach')!)).toEqual([]);
    expect(tear(scene('finale_raven_bout')!)).toBe(false);
    expect(tear(scene('finale_arena_assault')!)).toBe(true);
    expect(tear(scene('finale_breach')!)).toBe(true);
    expect(tear(scene('finale_last_stand')!)).toBe(false);
  });

  it('keeps its arenas to the final act and the plateaux in theirs', () => {
    const others = combats.filter((combat) => postDemoChapterOf(combat.id) !== 'finale');
    expect(others.length).toBeGreaterThan(0);
    for (const combat of others) expect(finaleArenas, combat.id).not.toContain(combat.sceneId);
    const own: Record<string, readonly string[]> = { bear: BEAR_ARENA_IDS, dragon: DRAGON_ARENA_IDS, scorpion: SCORPION_ARENA_IDS };
    for (const combat of others) expect(own[postDemoChapterOf(combat.id)!], combat.id).toContain(combat.sceneId);
  });

  it('never writes a scene id into the saved state', () => {
    expect(JSON.stringify(createInitialState())).not.toMatch(/sceneId|finale_(destiny_arena|arena_breach|burning_streets|smoke_square|rampart_reserve|breach_heart|breach_scar)/);
  });
});
