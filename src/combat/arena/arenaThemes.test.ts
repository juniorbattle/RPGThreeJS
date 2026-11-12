import { describe, expect, it } from 'vitest';
import {
  ARENA_PLATFORM, ARENA_THEMES, arenaBandProps, arenaClutterProps, arenaThemeFor, BEAR_ARENA_IDS, DRAGON_ARENA_IDS, propCrowdsPlatform, type ArenaPropKind,
  type ArenaTheme,
} from './arenaThemes';
import { seeded } from './pixelArt';

describe('procedural combat arena themes', () => {
  it('provides one arena per combat scene and falls back to the forest route', () => {
    expect(Object.keys(ARENA_THEMES).sort()).toEqual([
      'bear_hall_terrace', 'bear_mine_galleries', 'bear_mountain_pass', 'bois_clair_burning',
      'dragon_hall_esplanade', 'dragon_peak_trail', 'dragon_snowy_summit', 'dragon_wolf_cave', 'forest_route', 'lion_sanctum',
    ]);
    expect(arenaThemeFor('unknown').id).toBe('forest_route');
    expect(arenaThemeFor(undefined).id).toBe('forest_route');
  });

  it('never places decor on or against the 8×4 battle platform', () => {
    for (const theme of Object.values(ARENA_THEMES)) {
      for (const prop of [...theme.props, ...arenaBandProps(theme, seeded(1))]) {
        expect(propCrowdsPlatform(prop), `${theme.id}:${prop.kind}@${prop.x},${prop.z}`).toBe(false);
      }
    }
  });

  it('builds the mid-ground band deterministically and keeps the far-plate gap open', () => {
    for (const theme of Object.values(ARENA_THEMES)) {
      const a = arenaBandProps(theme, seeded(9));
      const b = arenaBandProps(theme, seeded(9));
      expect(a).toEqual(b);
      for (const prop of a) expect(Math.abs(prop.x)).toBeGreaterThanOrEqual(theme.band!.gap);
    }
  });

  it('keeps the forest to its broadleaf tree', () => {
    const forest = ARENA_THEMES.forest_route;
    expect([...forest.props, ...arenaBandProps(forest, seeded(9))].filter((prop) => prop.kind === 'pine')).toEqual([]);
  });

  it('ships a far plate for every theme: painted for the Lion, painted in code for the Bear and the Dragon (no arena plate, OD-2026-11-01-C)', () => {
    for (const id of ['forest_route', 'bois_clair_burning', 'lion_sanctum'] as const) {
      expect(ARENA_THEMES[id].farPlate.file).toMatch(/^\/assets\/generated\/combat-arena\/.+-far\.webp$/);
      expect(ARENA_THEMES[id].farPlate.procedural).toBeUndefined();
    }
    for (const id of [...BEAR_ARENA_IDS, ...DRAGON_ARENA_IDS]) {
      expect(ARENA_THEMES[id].farPlate.file, id).toBeUndefined();
      expect(ARENA_THEMES[id].farPlate.procedural, id).toBeDefined();
    }
    expect(ARENA_THEMES.dragon_wolf_cave.farPlate.procedural).toBe('lair');
    expect(ARENA_THEMES.dragon_snowy_summit.farPlate.procedural).toBe('clouds_dusk');
  });

  it('gives every arena a sound family of its own or one it borrows, with no new sound for the Bear', () => {
    for (const id of ['forest_route', 'bois_clair_burning', 'lion_sanctum'] as const) expect(ARENA_THEMES[id].sound).toBe(id);
    expect(ARENA_THEMES.bear_mountain_pass.sound).toBe('forest_route');
    expect(ARENA_THEMES.bear_mine_galleries.sound).toBe('lion_sanctum');
    expect(ARENA_THEMES.bear_hall_terrace.sound).toBe('lion_sanctum');
    // the Dragon's borrow the bed of the Lion arena each replaces: the trail and the esplanade the forest route, the
    // summits and the Wolf's cave the sanctum
    expect(ARENA_THEMES.dragon_peak_trail.sound).toBe('forest_route');
    expect(ARENA_THEMES.dragon_hall_esplanade.sound).toBe('forest_route');
    expect(ARENA_THEMES.dragon_snowy_summit.sound).toBe('lion_sanctum');
    expect(ARENA_THEMES.dragon_wolf_cave.sound).toBe('lion_sanctum');
  });

  it('dresses the Bear’s arenas in its own identity, with none of the Lion’s motifs', () => {
    // Gothic arches, columns and obelisks, the lion stele, candles and graves, lowland trees and houses stay the Lion’s
    const lionOnly: ArenaPropKind[] = ['arch', 'column', 'broken_column', 'obelisk', 'statue', 'candles', 'gravestone', 'tree', 'bush', 'fern', 'house', 'well', 'haystack', 'log', 'wall'];
    for (const id of BEAR_ARENA_IDS) {
      const theme = ARENA_THEMES[id];
      expect(theme.emblem, id).toBe('bear');
      const kinds = new Set([...theme.props, ...arenaBandProps(theme, seeded(9)), ...arenaClutterProps(theme, seeded(9))].map((prop) => prop.kind));
      for (const kind of lionOnly) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      expect(kinds.has('banner'), id).toBe(true);
      // slate cloth and bone trim: never the Lion’s red-and-gold
      for (const hex of [...theme.palette.cloth, ...theme.palette.trim]) {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
        expect(r - b, `${id}:${hex}`).toBeLessThan(24);
        expect(Math.abs(r - g), `${id}:${hex}`).toBeLessThan(24);
      }
    }
    expect(ARENA_THEMES.bear_mountain_pass.snow).toBe(true);
    expect(ARENA_THEMES.bear_hall_terrace.snow).toBe(true);
    expect(ARENA_THEMES.bear_mine_galleries.interior).toBe(true);
    expect(ARENA_THEMES.bear_hall_terrace.props.some((prop) => prop.kind === 'hall_gate')).toBe(true);
    expect(ARENA_THEMES.bear_mine_galleries.props.some((prop) => prop.kind === 'mine_frame')).toBe(true);
  });

  it('dresses the Dragon’s arenas in its identity: limestone, the winged dragon’s sign, and in the Wolf’s cave the Wolf’s', () => {
    const kindsOf = (theme: ArenaTheme) => new Set([...theme.props, ...arenaBandProps(theme, seeded(9)), ...arenaClutterProps(theme, seeded(9))].map((prop) => prop.kind));
    // the Lion’s Gothic masonry, stele, graves and lowland trees; the Bear’s mines, carvings and plain conifers
    const lionOnly: ArenaPropKind[] = ['arch', 'column', 'broken_column', 'obelisk', 'statue', 'candles', 'gravestone', 'tree', 'bush', 'fern', 'house', 'well', 'haystack', 'log', 'wall'];
    const bearOnly: ArenaPropKind[] = ['mine_frame', 'minecart', 'rails', 'ore_pile', 'winch', 'bear_pillar', 'hall_gate', 'beam', 'pine'];
    const dragonOnly: ArenaPropKind[] = ['bell_post', 'bronze_brazier', 'dragon_stele', 'dragon_statue', 'dragon_gate', 'rock_needle', 'twisted_pine', 'terrace_wall'];
    for (const id of DRAGON_ARENA_IDS) {
      const theme = ARENA_THEMES[id];
      const kinds = kindsOf(theme);
      for (const kind of [...lionOnly, ...bearOnly]) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      expect(kinds.has('banner'), id).toBe(true);
      // pale limestone, never the Bear’s dark granite
      expect(theme.rock, id).toBe('limestone');
      // jade and verdigris, soot and bone: never the Lion’s red-and-gold
      for (const hex of [...theme.palette.cloth, ...theme.palette.trim]) {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
        expect(r - b, `${id}:${hex}`).toBeLessThan(24);
        expect(r - g, `${id}:${hex}`).toBeLessThan(24);
      }
    }
    for (const id of ['dragon_peak_trail', 'dragon_snowy_summit', 'dragon_hall_esplanade'] as const) {
      const theme = ARENA_THEMES[id];
      expect(theme.emblem, id).toBe('dragon');
      expect(theme.horizon, id).toBe('clouds');
      const kinds = kindsOf(theme);
      // a carved winged dragon in every one
      expect((['dragon_stele', 'dragon_statue', 'dragon_gate'] as const).some((kind) => kinds.has(kind)), id).toBe(true);
    }
    expect(ARENA_THEMES.dragon_snowy_summit.snow).toBe(true);
    expect(ARENA_THEMES.dragon_peak_trail.snow).toBeUndefined();
    expect(kindsOf(ARENA_THEMES.dragon_peak_trail).has('twisted_pine')).toBe(true);
    expect(kindsOf(ARENA_THEMES.dragon_snowy_summit).has('bell_post')).toBe(true);
    expect(kindsOf(ARENA_THEMES.dragon_hall_esplanade).has('dragon_gate')).toBe(true);
    // the Wolf’s cave: the Wolf’s sign and lair, none of the Dragon’s carvings or bells
    const cave = ARENA_THEMES.dragon_wolf_cave;
    expect(cave.emblem).toBe('wolf');
    expect(cave.interior).toBe(true);
    const caveKinds = kindsOf(cave);
    for (const kind of dragonOnly) expect(caveKinds.has(kind), `dragon_wolf_cave:${kind}`).toBe(false);
    for (const kind of ['hide_curtain', 'stakes', 'bones', 'pelt', 'brazier'] as const) expect(caveKinds.has(kind), kind).toBe(true);
  });

  it('leaves the Bear’s arenas on their granite, with their own horizon', () => {
    for (const id of BEAR_ARENA_IDS) {
      expect(ARENA_THEMES[id].rock, id).toBeUndefined();
      expect(ARENA_THEMES[id].horizon, id).toBeUndefined();
    }
  });

  it('leaves the Lion’s arenas as they were: lion banners, painted plates, their own fringe', () => {
    for (const id of ['forest_route', 'bois_clair_burning', 'lion_sanctum'] as const) {
      const theme = ARENA_THEMES[id];
      expect(theme.rock).toBeUndefined();
      expect(theme.horizon).toBeUndefined();
      expect(theme.emblem ?? 'lion').toBe('lion');
      expect(theme.snow).toBeUndefined();
      expect(theme.interior).toBeUndefined();
      expect(theme.fringe ?? 'vegetation').toBe('vegetation');
      expect(theme.apron).toBeUndefined();
      expect(theme.clutter?.gap).toBeUndefined();
    }
  });

  it('keeps light shafts and mist behind the platform, so they never veil the units', () => {
    for (const theme of Object.values(ARENA_THEMES)) {
      for (const [, z] of theme.shafts?.items ?? []) expect(z, theme.id).toBeLessThan(-ARENA_PLATFORM.halfDepth - 2);
      for (const [z] of theme.mist?.layers ?? []) expect(z, theme.id).toBeLessThan(-ARENA_PLATFORM.halfDepth - 2);
    }
  });
});
