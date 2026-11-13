import { describe, expect, it } from 'vitest';
import {
  ARENA_CLAN_ORDER, ARENA_PLATFORM, ARENA_THEMES, arenaBandProps, arenaClutterProps, arenaThemeFor, BEAR_ARENA_IDS, CLAN_BANNER_COLOURS, DRAGON_ARENA_IDS, FINALE_ARENA_IDS,
  propCrowdsPlatform, SCORPION_ARENA_IDS, type ArenaPropKind, type ArenaTheme,
} from './arenaThemes';
import { seeded } from './pixelArt';

const kindsOf = (theme: ArenaTheme) => new Set([...theme.props, ...arenaBandProps(theme, seeded(9)), ...arenaClutterProps(theme, seeded(9))].map((prop) => prop.kind));
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
/** Purple, violet or magenta: red and blue both well above green. */
const purple = (hex: string) => { const [r, g, b] = rgbOf(hex); return r - g > 12 && b - g > 12; };

describe('procedural combat arena themes', () => {
  it('provides one arena per combat scene and falls back to the forest route', () => {
    expect(Object.keys(ARENA_THEMES).sort()).toEqual([
      'bear_hall_terrace', 'bear_mine_galleries', 'bear_mountain_pass', 'bois_clair_burning',
      'dragon_hall_esplanade', 'dragon_peak_trail', 'dragon_snowy_summit', 'dragon_wolf_cave',
      'finale_arena_breach', 'finale_breach_heart', 'finale_breach_scar', 'finale_burning_streets', 'finale_destiny_arena', 'finale_rampart_reserve', 'finale_smoke_square',
      'forest_route', 'lion_sanctum',
      'scorpion_ash_sanctuary', 'scorpion_dune_crest', 'scorpion_dune_track', 'scorpion_phoenix_ruins', 'scorpion_phoenix_temple', 'scorpion_records_court',
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

  it('ships a far plate for every theme: painted for the Lion, painted in code for the others (no arena plate, OD-2026-11-01-C)', () => {
    for (const id of ['forest_route', 'bois_clair_burning', 'lion_sanctum'] as const) {
      expect(ARENA_THEMES[id].farPlate.file).toMatch(/^\/assets\/generated\/combat-arena\/.+-far\.webp$/);
      expect(ARENA_THEMES[id].farPlate.procedural).toBeUndefined();
    }
    for (const id of [...BEAR_ARENA_IDS, ...DRAGON_ARENA_IDS, ...SCORPION_ARENA_IDS, ...FINALE_ARENA_IDS]) {
      expect(ARENA_THEMES[id].farPlate.file, id).toBeUndefined();
      expect(ARENA_THEMES[id].farPlate.procedural, id).toBeDefined();
    }
    expect(ARENA_THEMES.dragon_wolf_cave.farPlate.procedural).toBe('lair');
    expect(ARENA_THEMES.dragon_snowy_summit.farPlate.procedural).toBe('clouds_dusk');
  });

  it('gives the Lion’s arenas their own ambience and every post-demo arena its plateau’s biome, from the closed list', () => {
    for (const id of ['forest_route', 'bois_clair_burning', 'lion_sanctum'] as const) expect(ARENA_THEMES[id].sound).toBe(id);
    for (const id of BEAR_ARENA_IDS) expect(ARENA_THEMES[id].sound, id).toBe('bear_mountains');
    // the Wolf's cave too: it lies in the Dragon's peaks
    for (const id of DRAGON_ARENA_IDS) expect(ARENA_THEMES[id].sound, id).toBe('dragon_peaks');
    // the Phoenix's temple and sanctuary too: they stand in the same desert
    for (const id of SCORPION_ARENA_IDS) expect(ARENA_THEMES[id].sound, id).toBe('scorpion_desert');
    // the final act: the Tournament's day, the breach wherever the tear stands open, the corrupted city elsewhere
    expect(ARENA_THEMES.finale_destiny_arena.sound).toBe('tournament_arena');
    for (const id of ['finale_arena_breach', 'finale_breach_heart'] as const) expect(ARENA_THEMES[id].sound, id).toBe('breach');
    for (const id of ['finale_burning_streets', 'finale_smoke_square', 'finale_rampart_reserve', 'finale_breach_scar'] as const) expect(ARENA_THEMES[id].sound, id).toBe('corrupted_capital');
    expect(new Set(FINALE_ARENA_IDS.map((id) => ARENA_THEMES[id].sound))).toEqual(new Set(['tournament_arena', 'breach', 'corrupted_capital']));
  });

  it('dresses the final act’s arenas in the capital’s identity, with no plateau’s motifs, never purple', () => {
    // the Lion’s Gothic masonry, stele, graves, half-timbered houses, wooden lanterns and green country; the Bear’s granite,
    // snow and mines; the Dragon’s limestone, bells and pines; the Wolf’s lair; the Scorpion’s desert and the Phoenix’s places
    const forbidden: ArenaPropKind[] = [
      'arch', 'column', 'broken_column', 'obelisk', 'statue', 'candles', 'gravestone', 'tree', 'bush', 'fern', 'house', 'well', 'haystack', 'log', 'wall', 'pine',
      'grass', 'lantern', 'fence', 'stairs', 'rock',
      'mine_frame', 'minecart', 'rails', 'ore_pile', 'winch', 'bear_pillar', 'hall_gate', 'beam', 'snowdrift', 'snow_rock', 'cliff',
      'bell_post', 'bronze_brazier', 'dragon_stele', 'dragon_statue', 'dragon_gate', 'rock_needle', 'twisted_pine', 'terrace_wall', 'balustrade', 'cairn',
      'stalagmite', 'hide_curtain', 'stakes', 'bones', 'pelt',
      'dune', 'thorn_tree', 'thorn_scrub', 'dry_tuft', 'awning', 'clay_jars', 'mudbrick_arcade', 'records_gate', 'dry_basin', 'loose_leaves',
      'phoenix_column', 'fallen_column', 'ruin_wall', 'phoenix_stele', 'ward_circle', 'flame_hearth', 'niche_wall', 'ash_basin', 'phoenix_relief',
    ];
    for (const id of FINALE_ARENA_IDS) {
      const theme = ARENA_THEMES[id];
      const kinds = kindsOf(theme);
      for (const kind of forbidden) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      expect(theme.snow, id).toBeUndefined();
      expect(theme.rock, id).toBeUndefined();
      // red brick to rust (the palette's "plaster"), blue-black slate (its "roof"), pale grey stone dressings
      for (const hex of theme.palette.plaster) { const [r, g, b] = rgbOf(hex); expect(r - g > 20 && r - b > 20, `${id}:${hex}`).toBe(true); }
      for (const hex of theme.palette.roof) { const [r, , b] = rgbOf(hex); expect(b, `${id}:${hex}`).toBeGreaterThan(r); }
      for (const hex of theme.palette.stone) { const [r, g, b] = rgbOf(hex); expect(Math.max(r, g, b) - Math.min(r, g, b), `${id}:${hex}`).toBeLessThan(12); }
      const colours = [...Object.values(theme.palette).flat(), theme.light.hemiSky, theme.light.hemiGround, theme.light.sunColor, theme.light.fillColor,
        theme.fog.color, theme.background, theme.spriteTint, theme.spriteRim, theme.motes.color, theme.mist?.color ?? '#000000'];
      for (const hex of colours) expect(purple(hex), `${id}:${hex}`).toBe(false);
      // a banner shows only its own clan's sign: none flies anywhere but in the Arena of Destinies, and never the company's
      const banners = [...theme.props, ...arenaClutterProps(theme, seeded(9))].filter((prop) => prop.kind === 'banner' || prop.kind === 'clan_mast');
      if (id === 'finale_destiny_arena' || id === 'finale_arena_breach') {
        expect(banners.map((prop) => prop.kind), id).toEqual(Array(8).fill('clan_mast'));
        expect(banners.map((prop) => prop.emblem), id).toEqual([...ARENA_CLAN_ORDER]);
      } else expect(banners, id).toEqual([]);
    }
    // the eight clans' signs, each once; the Lion's gold lion on red is the act's only Lion motif and its only red-and-gold
    expect(new Set(ARENA_CLAN_ORDER).size).toBe(8);
    expect([...ARENA_CLAN_ORDER].sort()).toEqual(['bear', 'dragon', 'lion', 'phoenix', 'raven', 'scorpion', 'serpent', 'wolf']);
    const redAndGold = (clan: keyof typeof CLAN_BANNER_COLOURS) => CLAN_BANNER_COLOURS[clan].cloth.every((hex) => { const [r, g] = rgbOf(hex); return r - g > 30; })
      && CLAN_BANNER_COLOURS[clan].trim.every((hex) => { const [r, g, b] = rgbOf(hex); return r - b > 30 && g - b > 20; });
    for (const clan of ARENA_CLAN_ORDER) {
      expect(redAndGold(clan), clan).toBe(clan === 'lion');
      for (const hex of [...CLAN_BANNER_COLOURS[clan].cloth, ...CLAN_BANNER_COLOURS[clan].trim]) expect(purple(hex), `${clan}:${hex}`).toBe(false);
    }
    // the Tournament's day: the stands full, the sky veiled, no breach, no fire, no ink yet
    const tournament = kindsOf(ARENA_THEMES.finale_destiny_arena);
    expect(ARENA_THEMES.finale_destiny_arena.crowd).toBe(true);
    for (const kind of ['breach_tear', 'fire', 'smoke', 'ink_stain', 'ink_scar', 'brick_house', 'brick_ruin'] as const) expect(tournament.has(kind), kind).toBe(false);
    expect(tournament.has('arena_stand')).toBe(true);
    // the night of the breach: the same stands, empty and burning, the breach over the sand, its ink on it
    const night = ARENA_THEMES.finale_arena_breach;
    expect(night.crowd).toBeUndefined();
    expect(night.props.filter((prop) => prop.kind === 'arena_stand').every((prop) => prop.burning)).toBe(true);
    for (const kind of ['breach_tear', 'ink_stain', 'fire'] as const) expect(kindsOf(night).has(kind), kind).toBe(true);
    // the city: brick houses and their ruins; the ramparts' wall and round tower; the breach's heart, then its scar
    for (const id of ['finale_burning_streets', 'finale_smoke_square'] as const) expect(kindsOf(ARENA_THEMES[id]).has('brick_house'), id).toBe(true);
    expect(ARENA_THEMES.finale_burning_streets.props.filter((prop) => prop.kind === 'brick_house' && prop.burning).length).toBeGreaterThan(3);
    for (const kind of ['rampart_wall', 'round_tower', 'wall_stair'] as const) expect(kindsOf(ARENA_THEMES.finale_rampart_reserve).has(kind), kind).toBe(true);
    const heart = kindsOf(ARENA_THEMES.finale_breach_heart), scar = kindsOf(ARENA_THEMES.finale_breach_scar);
    for (const kind of ['breach_tear', 'ink_stain', 'brick_ruin', 'paving_slabs'] as const) expect(heart.has(kind), kind).toBe(true);
    // closed: nothing left in the air, no fire, only scars of dried ink
    for (const kind of ['breach_tear', 'ink_stain', 'fire'] as const) expect(scar.has(kind), kind).toBe(false);
    expect(scar.has('ink_scar') && scar.has('brick_ruin')).toBe(true);
    // the breach stands only where it is open
    for (const id of FINALE_ARENA_IDS) expect(kindsOf(ARENA_THEMES[id]).has('breach_tear'), id).toBe(id === 'finale_arena_breach' || id === 'finale_breach_heart');
    // the walls of the city close every view: no tree line, ridge, cloud bank or dune crest
    for (const id of FINALE_ARENA_IDS) expect(ARENA_THEMES[id].horizon, id).toBe('none');
  });

  it('dresses the Scorpion’s places in the Scorpion’s signs and the Phoenix’s in the Phoenix’s, never both, never purple', () => {
    // the Lion’s Gothic masonry, stele, graves and lowland trees; the Bear’s mines and carvings; the Dragon’s carvings,
    // bells, needles and pines; the Wolf’s lair; and the flowered grass tufts (their petals can be lilac)
    const forbidden: ArenaPropKind[] = [
      'arch', 'column', 'broken_column', 'obelisk', 'statue', 'candles', 'gravestone', 'tree', 'bush', 'fern', 'house', 'well', 'haystack', 'log', 'wall', 'pine',
      'mine_frame', 'minecart', 'rails', 'ore_pile', 'winch', 'bear_pillar', 'hall_gate', 'beam', 'snowdrift',
      'bell_post', 'bronze_brazier', 'dragon_stele', 'dragon_statue', 'dragon_gate', 'rock_needle', 'twisted_pine', 'terrace_wall', 'balustrade', 'cairn',
      'stalagmite', 'hide_curtain', 'stakes', 'bones', 'pelt', 'grass',
    ];
    const phoenixSigns: ArenaPropKind[] = ['phoenix_column', 'fallen_column', 'phoenix_stele', 'ward_circle', 'flame_hearth', 'niche_wall', 'ash_basin', 'phoenix_relief', 'ruin_wall'];
    const scorpionSigns: ArenaPropKind[] = ['records_gate', 'mudbrick_arcade', 'awning'];
    const phoenixPlaces = ['scorpion_phoenix_ruins', 'scorpion_phoenix_temple', 'scorpion_ash_sanctuary'] as const;
    const scorpionPlaces = ['scorpion_dune_track', 'scorpion_records_court'] as const;
    for (const id of SCORPION_ARENA_IDS) {
      const theme = ARENA_THEMES[id];
      const kinds = kindsOf(theme);
      for (const kind of forbidden) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      // the desert's red sandstone, never the Bear’s granite or the Dragon’s limestone; never snow
      expect(theme.rock, id).toBe('sandstone');
      expect(theme.snow, id).toBeUndefined();
      // never purple, violet or magenta anywhere: palette, light, fog, sky, mist, motes
      const colours = [...Object.values(theme.palette).flat(), theme.light.hemiSky, theme.light.hemiGround, theme.light.sunColor, theme.light.fillColor,
        theme.fog.color, theme.background, theme.spriteTint, theme.spriteRim, theme.motes.color, theme.mist?.color ?? '#000000'];
      for (const hex of colours) expect(purple(hex), `${id}:${hex}`).toBe(false);
    }
    for (const id of phoenixPlaces) {
      const theme = ARENA_THEMES[id];
      expect(theme.emblem, id).toBe('phoenix');
      const kinds = kindsOf(theme);
      for (const kind of scorpionSigns) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      expect(phoenixSigns.some((kind) => kinds.has(kind)), id).toBe(true);
      // saffron cloth, an orange-yellow far from the Lion’s crimson (whose green and blue sit together), and ash trim
      for (const hex of theme.palette.cloth) { const [, g, b] = rgbOf(hex); expect(g - b, `${id}:${hex}`).toBeGreaterThan(40); }
      for (const hex of theme.palette.trim) { const [r, , b] = rgbOf(hex); expect(r - b, `${id}:${hex}`).toBeLessThan(20); }
    }
    for (const id of scorpionPlaces) {
      const theme = ARENA_THEMES[id];
      expect(theme.emblem, id).toBe('scorpion');
      const kinds = kindsOf(theme);
      for (const kind of phoenixSigns) expect(kinds.has(kind), `${id}:${kind}`).toBe(false);
      expect(kinds.has('banner') || kinds.has('records_gate'), id).toBe(true);
      // umber cloth and undyed linen trim: never the Lion’s red-and-gold
      for (const hex of theme.palette.cloth) { const [r, g] = rgbOf(hex); expect(r - g, `${id}:${hex}`).toBeLessThan(40); }
      for (const hex of theme.palette.trim) { const [r, g, b] = rgbOf(hex); expect(r - b > 40 && g - b > 25, `${id}:${hex}`).toBe(false); }
    }
    // the wild crest at dusk shows no clan’s sign at all, only the Shadows’ ink and the Prophet’s leaves
    const crest = kindsOf(ARENA_THEMES.scorpion_dune_crest);
    for (const kind of [...phoenixSigns, ...scorpionSigns, 'banner'] as const) expect(crest.has(kind), `scorpion_dune_crest:${kind}`).toBe(false);
    expect(crest.has('ink_stain') && crest.has('loose_leaves')).toBe(true);
    // the temple’s heart: the saffron flame on its hearth, the hangings, its columns standing; the sanctuary’s ash and cold lamps
    const temple = kindsOf(ARENA_THEMES.scorpion_phoenix_temple);
    for (const kind of ['flame_hearth', 'phoenix_column', 'banner', 'niche_wall'] as const) expect(temple.has(kind), kind).toBe(true);
    expect(ARENA_THEMES.scorpion_phoenix_temple.interior).toBe(true);
    expect(kindsOf(ARENA_THEMES.scorpion_ash_sanctuary).has('ash_basin')).toBe(true);
    expect(ARENA_THEMES.scorpion_ash_sanctuary.unlitLamps).toBe(true);
    expect(kindsOf(ARENA_THEMES.scorpion_records_court).has('records_gate')).toBe(true);
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
