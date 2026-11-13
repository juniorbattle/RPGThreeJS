/**
 * Data for the procedural combat arenas. The builder (CombatArena.ts)
 * reads only this table: palettes, light rig, fog, far plate and the prop
 * layout around the 8×4 battle platform. Coordinates are world units with the
 * platform centred on the origin (x: −4.72…4.72, z: −2.36…2.36); the fixed
 * tactical camera looks from +z.
 *
 * The Lion's three arenas serve the demo. The Bear plateau has its own three (snowy pass, mine galleries, the terrace
 * before Borin's hall), coded only (OD-2026-11-01-C dropped the arena plates): granite, wind-driven snow, slate,
 * timber and iron, amber only from fire, the Bear's sign on its banners and none of the Lion's motifs.
 *
 * The Dragon plateau has four, coded only as well, on its validated identity (`IDENTITY.dragon`): pale limestone, a
 * sea of clouds and rock needles, powder snow on the summits, short yellowed grass and wind-twisted pines lower down,
 * verdigris bronze and jade, bronze bells and braziers, carved dragons always winged and four-legged. The trail of the
 * terraces, the snowy summits and the esplanade before Kaelen's hall carry the Dragon's sign; the Wolf's cave carries
 * the Wolf's (hide curtains, stakes, bones, pelts, iron braziers) and none of the Dragon's carvings or bells.
 *
 * The Scorpion plateau has six, coded only too, on its validated identity (`IDENTITY.scorpion`): a flat scorched land
 * of honey dunes, red-brown sandstone and thorn trees under a merciless sun. The Scorpion's places (the desert track,
 * the court of the Grand Inquisiteur's house of records) are of ochre mud brick, carved wooden lattices and striped
 * linen, under the scorpion's sign; the Phoenix's (the ruins of its road, its temple, its sanctuary dug into the rock)
 * are of ash-coloured cut sandstone, round columns and niches carved with phoenixes, lamps lit in daylight, ward
 * circles and the saffron flame with a white heart, under the phoenix's. A Phoenix place shows no scorpion and a
 * Scorpion place no phoenix; the wild dune crest at dusk shows neither, only the Shadows' cold black ink.
 *
 * The final act has seven, coded only as well, on its validated identity (the only city of the game, a capital of the
 * clans on a hill): red brick with pale stone dressings, blue-black slate roofs, iron lanterns and paved streets. The
 * Arena of Destinies on the Tournament's day under a veiled sky, its raked sand ringed by stands of brick arcades and the
 * eight clans' banners, each showing only its own sign (the Lion's gold lion on red is the only Lion motif in the act);
 * the same arena by night, its empty stands burning and the breach risen over the sand; the capital's burning streets,
 * its great square and its ramparts under the next day's smoke; the heart of the breach in the lower city before dawn,
 * a crater of shattered paving where the breach stands, a tall tear of cold black ink with a thin cold white rim; and
 * the same crater at dusk once it has closed, with only a long scar of dried ink. Never purple; never the company's own
 * banner, whose emblem is an open operator decision.
 */
export type ArenaSceneId =
  | 'forest_route' | 'bois_clair_burning' | 'lion_sanctum'
  | 'bear_mountain_pass' | 'bear_mine_galleries' | 'bear_hall_terrace'
  | 'dragon_peak_trail' | 'dragon_snowy_summit' | 'dragon_hall_esplanade' | 'dragon_wolf_cave'
  | 'scorpion_dune_track' | 'scorpion_dune_crest' | 'scorpion_phoenix_ruins' | 'scorpion_phoenix_temple' | 'scorpion_ash_sanctuary'
  | 'scorpion_records_court'
  | 'finale_destiny_arena' | 'finale_arena_breach' | 'finale_burning_streets' | 'finale_smoke_square' | 'finale_rampart_reserve'
  | 'finale_breach_heart' | 'finale_breach_scar';

export type TileStyle = 'mossy_flagstone' | 'packed_earth' | 'sanctum_marble' | 'hewn_granite' | 'snowy_granite'
  | 'limestone_flag' | 'snowy_limestone' | 'dressed_limestone' | 'cave_flag' | 'sand_flag' | 'dressed_sandstone'
  | 'raked_sand' | 'cobbles' | 'shattered_paving';
export type GroundStyle = 'forest_floor' | 'village_mud' | 'sanctum_rubble' | 'snow_scree' | 'mine_floor' | 'snow_terrace' | 'dry_grass_snow'
  | 'desert_sand' | 'arena_sand' | 'cobbled_street' | 'rubble_paving';

export type ArenaPropKind =
  | 'tree' | 'pine' | 'dead_tree' | 'bush' | 'fern' | 'rock' | 'grass'
  | 'column' | 'broken_column' | 'arch' | 'wall' | 'stairs' | 'obelisk'
  | 'house' | 'fence' | 'barrel' | 'crate' | 'cart' | 'haystack'
  | 'lantern' | 'brazier' | 'banner' | 'candles' | 'gravestone'
  | 'fire' | 'smoke' | 'statue' | 'well' | 'log' | 'debris'
  // the Bear's mountains
  | 'snow_rock' | 'snowdrift' | 'cliff' | 'beam' | 'mine_frame' | 'minecart' | 'rails' | 'ore_pile' | 'winch'
  | 'bear_pillar' | 'hall_gate'
  // the Dragon's peaks
  | 'rock_needle' | 'twisted_pine' | 'terrace_wall' | 'cairn' | 'bell_post' | 'bronze_brazier' | 'dragon_stele'
  | 'dragon_statue' | 'balustrade' | 'dragon_gate'
  // the Wolf's cave
  | 'stalagmite' | 'hide_curtain' | 'stakes' | 'bones' | 'pelt'
  // the Arid Deserts, and the Scorpion's mud brick
  | 'dune' | 'thorn_tree' | 'thorn_scrub' | 'dry_tuft' | 'awning' | 'clay_jars' | 'mudbrick_arcade' | 'records_gate' | 'dry_basin'
  // the Phoenix's places
  | 'phoenix_column' | 'fallen_column' | 'ruin_wall' | 'phoenix_stele' | 'ward_circle' | 'flame_hearth' | 'niche_wall' | 'ash_basin'
  | 'phoenix_relief'
  // the Shadows' mark
  | 'ink_stain' | 'loose_leaves'
  // the capital of the clans: its brick houses and their ruins, its paving, the Arena of Destinies, its ramparts
  | 'brick_house' | 'brick_ruin' | 'rubble' | 'paving_slabs' | 'iron_lantern' | 'arena_stand' | 'clan_mast' | 'rampart_wall' | 'round_tower'
  | 'wall_stair'
  // the breach
  | 'breach_tear' | 'ink_scar';

/**
 * The ambience a scene plays: the Lion's three combat biomes (set 1.11.0), and the six post-demo biomes of the closed
 * list (set 1.20.0), one per plateau and three for the final act (`src/audio/music/ambiencePostDemo.ts`).
 */
export type ArenaSoundFamily = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum'
  | 'bear_mountains' | 'dragon_peaks' | 'scorpion_desert' | 'tournament_arena' | 'corrupted_capital' | 'breach';
/** The clan sign on an arena's banners and carved reliefs. */
export type ArenaEmblem = 'lion' | 'bear' | 'dragon' | 'wolf' | 'scorpion' | 'phoenix' | 'raven' | 'serpent';
/** What grows or lies at the foot of the platform and of the masonry. */
export type ArenaFringe = 'vegetation' | 'alpine' | 'snow' | 'rubble' | 'grass' | 'sand';

export interface ArenaProp {
  kind: ArenaPropKind;
  x: number;
  z: number;
  /** Uniform scale (default 1). */
  s?: number;
  /** Yaw in radians for 3D props. */
  r?: number;
  /** Variant seed. */
  v?: number;
  /** Lit/burning variant for houses, trees and banners. */
  burning?: boolean;
  /**
   * The clan whose banner this one is, in its own colours (the Arena of Destinies' masts); a banner without one shows the
   * arena's sign in the arena's cloth.
   */
  emblem?: ArenaEmblem;
}

export interface ArenaLightRig {
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  fillColor: string;
  fillIntensity: number;
  exposure: number;
}

export interface ArenaPalette {
  stone: readonly string[];
  stoneDark: readonly string[];
  moss: readonly string[];
  dirt: readonly string[];
  grass: readonly string[];
  foliage: readonly string[];
  bark: readonly string[];
  wood: readonly string[];
  cloth: readonly string[];
  trim: readonly string[];
  plaster: readonly string[];
  roof: readonly string[];
  ink: string;
}

export interface ArenaTheme {
  id: ArenaSceneId;
  label: string;
  tile: TileStyle;
  ground: GroundStyle;
  palette: ArenaPalette;
  light: ArenaLightRig;
  fog: { color: string; density: number };
  background: string;
  /**
   * Far plate (sky + distant scenery), placed as a wall behind the diorama: a painted file for the Lion's arenas, or
   * painted in code (`procedural`) for the arenas that have no plate.
   */
  farPlate: {
    file?: string;
    procedural?: 'peaks' | 'cave' | 'clouds_day' | 'clouds_dusk' | 'lair' | 'dunes_day' | 'dunes_dusk' | 'ruins_day' | 'nave' | 'sanctuary' | 'court'
      | 'arena_day' | 'arena_night' | 'city_night' | 'city_smoke' | 'ramparts' | 'breach_dawn' | 'breach_dusk';
    width: number; bottomY: number; z: number; tint: string;
  };
  /** The ambience the scene plays: its own id for the Lion's arenas, its plateau's biome for the post-demo ones. */
  sound: ArenaSoundFamily;
  /** Sign on the banners (the lion by default). */
  emblem?: ArenaEmblem;
  /** Snow on rocks, conifers and the horizon. */
  snow?: boolean;
  /** Underground: a rock horizon instead of tree lines. */
  interior?: boolean;
  /** Fringe of the platform and the masonry (vegetation by default). */
  fringe?: ArenaFringe;
  /**
   * Apron around the platform: worn earth by default, cobbles in the village, flags on a terrace (with whatever the
   * palette's "moss" is in the joints: snow before Borin's hall, dry grass before Kaelen's).
   */
  apron?: 'flagstone' | 'cobbles';
  /** The living rock of cliffs, boulders and outcrops: the Bear's granite by default, the Dragon's pale limestone, the desert's red sandstone. */
  rock?: 'granite' | 'limestone' | 'sandstone';
  /**
   * Horizon between the band and the far plate: tree lines or ridges by default, the sea of clouds on the Dragon's peaks,
   * dune crests in the desert, none where walls close the view (the Phoenix's nave, the Scorpion's court).
   */
  horizon?: 'clouds' | 'dunes' | 'none';
  /** The lamps in the niches and on the steles are cold, smoke-blackened (the Phoenix's sanctuary); lit by default. */
  unlitLamps?: boolean;
  /** The stands are full (the Arena of Destinies on the Tournament's day); empty by default. */
  crowd?: boolean;
  /** Multiplier applied to pixel sprites so they sit in the arena light. */
  spriteTint: string;
  spriteRim: string;
  props: readonly ArenaProp[];
  /** Seeded mid-ground band (forest wall, village rooftops) that frames the far plate. */
  band?: { kinds: readonly ArenaPropKind[]; count: number; z: [number, number]; halfWidth: number; gap: number; scale: [number, number] };
  /** Seeded ground clutter between the platform and the band (never on the platform; never within `gap` of the centre line when set). */
  clutter?: { kinds: readonly ArenaPropKind[]; count: number; z: [number, number]; halfWidth: number; scale: [number, number]; gap?: number };
  /** Ambient particles drifting through the arena. */
  motes: { color: string; count: number; rise: number; size: number; glow: boolean };
  /** Slanted light shafts (sun through the canopy, moonlight between the arches): [x, z, width, height, tilt]. */
  shafts?: { color: string; opacity: number; items: ReadonlyArray<readonly [number, number, number, number, number]> };
  /** Low drifting mist layers between the decor and the horizon: [z, height, width]. */
  mist?: { color: string; opacity: number; layers: ReadonlyArray<readonly [number, number, number]> };
}

const FOREST_PROPS: ArenaProp[] = [
  // Back rank: ruined sanctuary edge, framed by old trees.
  { kind: 'tree', x: -9.4, z: -6.2, s: 1.35, v: 1 },
  { kind: 'tree', x: 9.6, z: -6.6, s: 1.4, v: 2 },
  { kind: 'tree', x: -13.5, z: -10.5, s: 1.55, v: 3 },
  { kind: 'tree', x: 13.8, z: -11.2, s: 1.6, v: 4 },
  { kind: 'tree', x: -5.4, z: -13.5, s: 1.5, v: 5 },
  { kind: 'tree', x: 6.2, z: -14.5, s: 1.6, v: 6 },
  { kind: 'tree', x: 0.8, z: -17.5, s: 1.7, v: 7 },
  { kind: 'tree', x: -1.6, z: -19.5, s: 1.8, v: 8 },
  { kind: 'arch', x: -0.9, z: -6.4, s: 1.05, v: 1 },
  { kind: 'wall', x: -4.4, z: -5.4, s: 1, r: 0.06, v: 2 },
  { kind: 'wall', x: 3.6, z: -5.8, s: 0.9, r: -0.1, v: 3 },
  { kind: 'column', x: -6.6, z: -4.4, s: 1.05, v: 1 },
  { kind: 'broken_column', x: 6.3, z: -4.2, s: 1, v: 2 },
  { kind: 'broken_column', x: 2.4, z: -4.6, s: 0.72, v: 3 },
  { kind: 'banner', x: -7.6, z: -3.6, s: 1, v: 1 },
  { kind: 'stairs', x: -0.9, z: -4.1, s: 1, v: 1 },
  { kind: 'rock', x: -5.6, z: -3.5, s: 0.9, v: 1 },
  { kind: 'rock', x: 7.6, z: -3.2, s: 1.1, v: 2 },
  { kind: 'bush', x: -3.1, z: -3.8, s: 1, v: 1 },
  { kind: 'bush', x: 4.8, z: -3.7, s: 1.1, v: 2 },
  { kind: 'fern', x: 1.2, z: -3.6, s: 0.9, v: 3 },
  // Flanks.
  { kind: 'tree', x: -8.4, z: 0.4, s: 1.25, v: 9 },
  { kind: 'tree', x: 8.9, z: 1.1, s: 1.3, v: 10 },
  { kind: 'column', x: -6.4, z: 1.6, s: 0.92, v: 4 },
  { kind: 'broken_column', x: 6.4, z: -1.2, s: 0.8, v: 5 },
  { kind: 'lantern', x: -6.0, z: -1.1, s: 1, v: 1 },
  { kind: 'lantern', x: 6.0, z: 1.7, s: 1, v: 2 },
  { kind: 'rock', x: -7.1, z: 3.0, s: 1.2, v: 3 },
  { kind: 'rock', x: 7.0, z: 3.3, s: 0.9, v: 4 },
  { kind: 'bush', x: -6.8, z: -2.1, s: 1, v: 3 },
  { kind: 'bush', x: 7.2, z: -0.2, s: 1.15, v: 4 },
  { kind: 'fern', x: -5.7, z: 3.4, s: 1.1, v: 5 },
  { kind: 'fern', x: 6.0, z: 3.9, s: 1, v: 6 },
  // Foreground framing (blurred by the tilt-shift band).
  { kind: 'fern', x: -6.8, z: 5.6, s: 1.5, v: 7 },
  { kind: 'bush', x: 7.4, z: 5.8, s: 1.4, v: 5 },
  { kind: 'rock', x: -3.6, z: 6.4, s: 0.8, v: 5 },
  { kind: 'log', x: 3.4, z: -3.9, s: 0.9, r: 0.25, v: 1 },
  { kind: 'log', x: -8.4, z: 2.6, s: 1, r: 1.3, v: 2 },
  { kind: 'fern', x: 4.6, z: -4.2, s: 0.8, v: 2 },
];

const VILLAGE_PROPS: ArenaProp[] = [
  { kind: 'house', x: -6.6, z: -8.2, s: 1.15, r: 0.18, v: 1, burning: true },
  { kind: 'house', x: 0.6, z: -10.4, s: 1.2, r: -0.04, v: 2 },
  { kind: 'house', x: 7.4, z: -8.6, s: 1.1, r: -0.22, v: 3, burning: true },
  { kind: 'house', x: -13.2, z: -12.5, s: 1.2, r: 0.3, v: 4, burning: true },
  { kind: 'house', x: 13.6, z: -13.4, s: 1.25, r: -0.3, v: 5 },
  { kind: 'dead_tree', x: -10.5, z: -5.4, s: 1.35, v: 1, burning: true },
  { kind: 'tree', x: 11.2, z: -5.6, s: 1.3, v: 2 },
  { kind: 'pine', x: -3.4, z: -17.5, s: 1.6, v: 3 },
  { kind: 'pine', x: 4.2, z: -18.2, s: 1.7, v: 4 },
  { kind: 'fire', x: -6.4, z: -7.2, s: 1.7, v: 1 },
  { kind: 'fire', x: 7.2, z: -7.6, s: 1.5, v: 2 },
  { kind: 'fire', x: -12.6, z: -11.6, s: 1.9, v: 3 },
  { kind: 'smoke', x: -6.6, z: -8.6, s: 2.2, v: 1 },
  { kind: 'smoke', x: 7.4, z: -9, s: 2, v: 2 },
  { kind: 'smoke', x: -13, z: -13, s: 2.6, v: 3 },
  { kind: 'fence', x: -4.2, z: -4.6, s: 1, r: 0.05, v: 1 },
  { kind: 'fence', x: 3.6, z: -4.7, s: 1, r: -0.05, v: 2 },
  { kind: 'cart', x: 5.6, z: -3.7, s: 1, r: -0.5, v: 1 },
  { kind: 'haystack', x: -1.4, z: -5.2, s: 1, v: 1 },
  { kind: 'banner', x: -6.4, z: -3.4, s: 1, v: 2, burning: true },
  { kind: 'banner', x: 6.6, z: 2.3, s: 1, v: 3 },
  { kind: 'barrel', x: -5.9, z: -1.8, s: 1, v: 1 },
  { kind: 'barrel', x: -6.4, z: -1.2, s: 0.9, v: 2 },
  { kind: 'crate', x: 6.1, z: -1.4, s: 1, r: 0.3, v: 1 },
  { kind: 'crate', x: 6.6, z: -0.6, s: 0.8, r: -0.2, v: 2 },
  { kind: 'brazier', x: -5.9, z: 1.6, s: 1, v: 1 },
  { kind: 'brazier', x: 5.9, z: 0.6, s: 1, v: 2 },
  { kind: 'fence', x: -6.4, z: 4.0, s: 1, r: 1.45, v: 3 },
  { kind: 'barrel', x: 6.8, z: 3.6, s: 1.1, v: 3 },
  { kind: 'rock', x: -7.4, z: 3.0, s: 0.8, v: 1 },
  { kind: 'grass', x: 7.4, z: 5.4, s: 1.4, v: 1 },
  { kind: 'crate', x: -7.2, z: 5.8, s: 1.3, r: 0.4, v: 3 },
  { kind: 'well', x: -8.9, z: -0.6, s: 1, r: 0.3, v: 4 },
  { kind: 'debris', x: 2.4, z: -4.1, s: 1, v: 1 },
  { kind: 'debris', x: -9.2, z: -7.2, s: 1.1, v: 2 },
  { kind: 'debris', x: 8.8, z: -4.6, s: 0.9, v: 3 },
];

const SANCTUM_PROPS: ArenaProp[] = [
  { kind: 'arch', x: -6.4, z: -8.2, s: 1.05, v: 2 },
  { kind: 'arch', x: 4.8, z: -8.6, s: 1.05, v: 3 },
  { kind: 'column', x: -8.8, z: -5.4, s: 1.05, v: 2 },
  { kind: 'column', x: 8.6, z: -5.6, s: 1.05, v: 3 },
  { kind: 'broken_column', x: 6.4, z: -4.2, s: 0.9, v: 4 },
  { kind: 'stairs', x: -0.9, z: -4.3, s: 1.1, v: 2 },
  { kind: 'statue', x: -0.9, z: -8.2, s: 1.4, v: 1 },
  { kind: 'obelisk', x: -11.5, z: -9.5, s: 1.5, v: 1 },
  { kind: 'obelisk', x: 11.8, z: -10.5, s: 1.4, v: 2 },
  { kind: 'pine', x: -15, z: -14, s: 1.8, v: 1 },
  { kind: 'pine', x: 15.5, z: -15, s: 1.9, v: 2 },
  { kind: 'pine', x: -9.5, z: -16.5, s: 1.7, v: 3 },
  { kind: 'pine', x: 9.2, z: -17.5, s: 1.8, v: 4 },
  { kind: 'banner', x: -3.0, z: -4.3, s: 1.05, v: 4 },
  { kind: 'banner', x: 1.3, z: -4.4, s: 1.05, v: 5 },
  { kind: 'candles', x: -4.4, z: -3.6, s: 1, v: 1 },
  { kind: 'candles', x: 2.8, z: -3.7, s: 1, v: 2 },
  { kind: 'candles', x: -6.1, z: 2.2, s: 1, v: 3 },
  { kind: 'candles', x: 6.1, z: 2.5, s: 1, v: 4 },
  { kind: 'gravestone', x: -6.9, z: -1.6, s: 1, r: 0.15, v: 1 },
  { kind: 'gravestone', x: -7.6, z: 0.6, s: 0.9, r: -0.1, v: 2 },
  { kind: 'gravestone', x: 7.3, z: -1.9, s: 1, r: -0.2, v: 3 },
  { kind: 'brazier', x: -5.9, z: -0.6, s: 1.05, v: 3 },
  { kind: 'brazier', x: 5.9, z: -0.3, s: 1.05, v: 4 },
  { kind: 'wall', x: -9.5, z: 1.4, s: 0.9, r: 1.4, v: 4 },
  { kind: 'broken_column', x: 7.8, z: 2.8, s: 0.9, v: 5 },
  { kind: 'rock', x: -7.0, z: 3.6, s: 1, v: 2 },
  { kind: 'fern', x: 6.6, z: 5.2, s: 1.4, v: 1 },
  { kind: 'bush', x: -7.4, z: 5.6, s: 1.3, v: 2 },
];

/** The Bear's high pass: a trail between granite outcrops, a few snowy firs, the clan's boundary banners. */
const BEAR_PASS_PROPS: ArenaProp[] = [
  // Back: granite cliffs framing the pass, the peaks seen through the gap.
  { kind: 'cliff', x: -9.6, z: -8.6, s: 1.3, v: 1 },
  { kind: 'cliff', x: 9.9, z: -9.2, s: 1.35, v: 2 },
  { kind: 'cliff', x: -14.6, z: -12.6, s: 1.6, v: 3 },
  { kind: 'cliff', x: 15.1, z: -13.6, s: 1.7, v: 4 },
  { kind: 'cliff', x: -5.8, z: -13.4, s: 1.05, v: 5 },
  { kind: 'cliff', x: 6.6, z: -14.2, s: 1.1, v: 6 },
  { kind: 'pine', x: -7.4, z: -6.4, s: 1.2, v: 1 },
  { kind: 'pine', x: 8.0, z: -6.0, s: 1.25, v: 2 },
  { kind: 'pine', x: -11.9, z: -9.6, s: 1.45, v: 3 },
  { kind: 'pine', x: 12.5, z: -10.4, s: 1.5, v: 0 },
  { kind: 'pine', x: 3.4, z: -17.0, s: 1.5, v: 1 },
  { kind: 'pine', x: -2.8, z: -18.0, s: 1.6, v: 2 },
  { kind: 'snow_rock', x: -5.6, z: -4.4, s: 1.2, v: 1 },
  { kind: 'snow_rock', x: 5.4, z: -4.6, s: 1.35, v: 2 },
  { kind: 'snow_rock', x: 2.4, z: -5.6, s: 0.8, v: 3 },
  { kind: 'snow_rock', x: -2.2, z: -6.4, s: 0.9, v: 4 },
  { kind: 'banner', x: -3.5, z: -4.4, s: 1, v: 1 },
  { kind: 'rock', x: -4.1, z: -3.9, s: 0.6, v: 1 },
  { kind: 'snowdrift', x: 0.8, z: -4.2, s: 1.1, v: 1 },
  { kind: 'snowdrift', x: -7.4, z: -3.1, s: 1.3, v: 2 },
  { kind: 'grass', x: 3.6, z: -3.8, s: 1, v: 1 },
  // Flanks.
  { kind: 'snow_rock', x: -7.2, z: 0.6, s: 1.5, v: 5 },
  { kind: 'snow_rock', x: 7.6, z: -1.3, s: 1.4, v: 6 },
  { kind: 'pine', x: -9.0, z: -1.8, s: 1.2, v: 3 },
  { kind: 'pine', x: 9.6, z: 1.8, s: 1.25, v: 0 },
  { kind: 'banner', x: 7.0, z: 2.2, s: 0.95, v: 2 },
  { kind: 'snowdrift', x: -6.6, z: 2.9, s: 1.2, v: 3 },
  { kind: 'snowdrift', x: 6.8, z: 3.6, s: 1.1, v: 4 },
  { kind: 'crate', x: 6.3, z: 0.3, s: 0.9, r: 0.4, v: 1 },
  { kind: 'barrel', x: 6.6, z: -0.6, s: 0.9, v: 1 },
  { kind: 'beam', x: -6.4, z: -1.5, s: 1, r: 0.5, v: 1 },
  { kind: 'grass', x: -6.0, z: 1.9, s: 1.1, v: 2 },
  { kind: 'grass', x: 6.0, z: 2.5, s: 1, v: 0 },
  // Foreground framing (blurred by the tilt-shift band).
  { kind: 'snow_rock', x: -6.8, z: 5.6, s: 1.4, v: 7 },
  { kind: 'snowdrift', x: 7.2, z: 5.8, s: 1.5, v: 5 },
  { kind: 'grass', x: -3.6, z: 6.2, s: 1.3, v: 1 },
  { kind: 'rock', x: 4.2, z: 6.4, s: 0.8, v: 2 },
];

/** The Bear's sacred galleries: a timber-propped mine chamber hewn in the granite, rails, carts and carved bears. */
const BEAR_GALLERY_PROPS: ArenaProp[] = [
  // Back wall: hewn rock, two gallery mouths, the winch over its shaft and the Bear's carved pillars.
  { kind: 'cliff', x: -8.0, z: -9.8, s: 1.25, v: 11 },
  { kind: 'cliff', x: 0.4, z: -11.8, s: 1.35, v: 12 },
  { kind: 'cliff', x: 8.8, z: -10.0, s: 1.3, v: 13 },
  { kind: 'cliff', x: -14.2, z: -12.2, s: 1.6, v: 14 },
  { kind: 'cliff', x: 14.8, z: -12.6, s: 1.6, v: 15 },
  { kind: 'mine_frame', x: -3.8, z: -7.6, s: 1.05, v: 1 },
  { kind: 'mine_frame', x: 4.4, z: -8.0, s: 1.0, v: 3 },
  { kind: 'winch', x: 0.3, z: -7.4, s: 1, v: 1 },
  { kind: 'bear_pillar', x: -6.6, z: -5.8, s: 1, v: 1 },
  { kind: 'bear_pillar', x: 6.8, z: -6.0, s: 1, v: 2 },
  { kind: 'banner', x: -1.6, z: -4.8, s: 1, v: 3 },
  { kind: 'banner', x: 1.8, z: -4.9, s: 1, v: 4 },
  { kind: 'rails', x: 0, z: -3.7, s: 1, v: 1 },
  { kind: 'brazier', x: -4.8, z: -4.4, s: 1, v: 1 },
  { kind: 'ore_pile', x: 4.6, z: -4.6, s: 0.9, v: 1 },
  // Flanks.
  { kind: 'minecart', x: -6.6, z: -2.6, s: 1, r: 0.25, v: 1 },
  { kind: 'ore_pile', x: -6.2, z: -0.6, s: 1, v: 2 },
  { kind: 'lantern', x: -6.0, z: 1.3, s: 1, v: 1 },
  { kind: 'crate', x: -6.8, z: 2.7, s: 1, r: 0.3, v: 1 },
  { kind: 'barrel', x: -7.6, z: 1.9, s: 0.9, v: 1 },
  { kind: 'brazier', x: 6.0, z: -1.7, s: 1, v: 2 },
  { kind: 'minecart', x: 6.8, z: 0.7, s: 1, r: -0.5, v: 2 },
  { kind: 'crate', x: 6.5, z: 2.5, s: 0.9, r: -0.2, v: 2 },
  { kind: 'crate', x: 7.2, z: 3.2, s: 0.7, r: 0.5, v: 3 },
  { kind: 'beam', x: 7.6, z: -2.9, s: 1, r: 1.2, v: 1 },
  { kind: 'rock', x: -7.8, z: 4.2, s: 1.1, v: 1 },
  // Foreground framing.
  { kind: 'ore_pile', x: -6.6, z: 5.6, s: 1.3, v: 3 },
  { kind: 'rock', x: 7.0, z: 5.6, s: 1.3, v: 2 },
  { kind: 'beam', x: -3.4, z: 6.4, s: 1, r: 0.2, v: 2 },
  { kind: 'barrel', x: 4.4, z: 6.2, s: 1.1, v: 2 },
];

/** The cleared stone terrace before Borin's hall: the gate hewn in the rock, carved bears, braziers and banners. */
const BEAR_HALL_PROPS: ArenaProp[] = [
  // Back: the hall's heavy doors in the mountain, steps, carved pillars and the clan's banners.
  { kind: 'hall_gate', x: -0.4, z: -9.2, s: 1.1, v: 1 },
  { kind: 'cliff', x: -9.2, z: -9.6, s: 1.5, v: 21 },
  { kind: 'cliff', x: 9.0, z: -10.0, s: 1.5, v: 22 },
  { kind: 'cliff', x: -15.2, z: -12.8, s: 1.8, v: 23 },
  { kind: 'cliff', x: 15.6, z: -13.2, s: 1.8, v: 24 },
  { kind: 'stairs', x: -0.4, z: -5.8, s: 1.1, v: 3 },
  { kind: 'bear_pillar', x: -3.8, z: -5.4, s: 1, v: 3 },
  { kind: 'bear_pillar', x: 3.0, z: -5.5, s: 1, v: 4 },
  { kind: 'brazier', x: -2.4, z: -4.3, s: 1, v: 5 },
  { kind: 'brazier', x: 1.6, z: -4.3, s: 1, v: 6 },
  { kind: 'banner', x: -5.6, z: -4.2, s: 1.05, v: 5 },
  { kind: 'banner', x: 4.8, z: -4.4, s: 1.05, v: 6 },
  { kind: 'snowdrift', x: -7.2, z: -4.2, s: 1.3, v: 6 },
  { kind: 'snowdrift', x: 7.0, z: -4.6, s: 1.2, v: 7 },
  // Flanks: the terrace's timber railing, supplies, a brazier against the wind.
  { kind: 'fence', x: -7.4, z: 0.0, s: 1, r: 1.5, v: 1 },
  { kind: 'fence', x: 7.6, z: 0.4, s: 1, r: -1.5, v: 2 },
  { kind: 'brazier', x: -6.0, z: 2.5, s: 1, v: 7 },
  { kind: 'barrel', x: 6.1, z: -1.6, s: 1, v: 2 },
  { kind: 'crate', x: 6.5, z: -0.8, s: 0.9, r: 0.3, v: 4 },
  { kind: 'crate', x: -6.5, z: -1.9, s: 1, r: -0.3, v: 5 },
  { kind: 'snowdrift', x: -6.8, z: 3.9, s: 1.3, v: 8 },
  { kind: 'snowdrift', x: 7.0, z: 3.3, s: 1.4, v: 9 },
  { kind: 'snow_rock', x: 8.8, z: -2.6, s: 1.2, v: 8 },
  { kind: 'snow_rock', x: -9.0, z: 2.1, s: 1.3, v: 9 },
  // Foreground framing.
  { kind: 'snowdrift', x: -5.8, z: 6.0, s: 1.6, v: 10 },
  { kind: 'snow_rock', x: 7.0, z: 5.8, s: 1.3, v: 10 },
  { kind: 'barrel', x: -7.6, z: 4.8, s: 1.1, v: 3 },
];

/** Granite, slate and snow for the Bear's two outdoor arenas; the cloth is slate and the trim bone, never red-and-gold. */
const BEAR_SNOW_PALETTE: ArenaPalette = {
  stone: ['#2b2f36', '#3e444d', '#565d67', '#727a84', '#9199a2', '#b3bac1'],
  stoneDark: ['#15181d', '#1f2329', '#2b3038'],
  // the "moss" creeping from the joints is snow up here
  moss: ['#8c9bb0', '#a9b7c9', '#c8d3e0', '#e2e9f1', '#f4f7fb'],
  dirt: ['#2a2622', '#3b3530', '#4f4841', '#655d54'],
  // dry alpine grass, never a lush green
  grass: ['#2e2a1c', '#463f27', '#5f5531', '#7a6d3d', '#968849', '#b2a45c'],
  foliage: ['#101a1a', '#172524', '#1f312f', '#2a3f3b', '#36504a', '#466257', '#5a7566'],
  bark: ['#17110d', '#251c16', '#35291f', '#47382b', '#5a4838'],
  wood: ['#1d1612', '#2e241c', '#433528', '#5a4836'],
  cloth: ['#14181e', '#1e242c', '#2a323c', '#38424e'],
  trim: ['#5c5a54', '#8a877e', '#bdb9ae', '#e6e2d6'],
  plaster: ['#6a6e74', '#868a90', '#a3a7ac'],
  roof: ['#25262a', '#38393e', '#4c4d53'],
  ink: '#0b0d10',
};

/** The pilgrims' trail across the Dragon's terraces: limestone, yellowed grass, twisted pines, a carved waymark. */
const DRAGON_TRAIL_PROPS: ArenaProp[] = [
  // Back: the rock needles rising from the clouds at the edges, the terraces stepping up toward them.
  { kind: 'rock_needle', x: -13.6, z: -15.6, s: 1.1, v: 1 },
  { kind: 'rock_needle', x: 14.6, z: -16.6, s: 1.2, v: 2 },
  { kind: 'rock_needle', x: -19.0, z: -19.0, s: 1.35, v: 3 },
  { kind: 'rock_needle', x: 19.6, z: -20.0, s: 1.4, v: 4 },
  { kind: 'rock_needle', x: -8.6, z: -21.0, s: 0.95, v: 5 },
  { kind: 'rock_needle', x: 9.2, z: -22.0, s: 1.0, v: 6 },
  { kind: 'terrace_wall', x: -4.0, z: -6.6, s: 1, r: 0.05, v: 1 },
  { kind: 'terrace_wall', x: 4.2, z: -7.0, s: 1, r: -0.06, v: 2 },
  { kind: 'terrace_wall', x: -7.4, z: -10.2, s: 1.1, r: 0.12, v: 3 },
  { kind: 'terrace_wall', x: 7.6, z: -10.6, s: 1.1, r: -0.1, v: 4 },
  { kind: 'twisted_pine', x: -7.8, z: -5.8, s: 1.15, v: 1 },
  { kind: 'twisted_pine', x: 8.4, z: -5.4, s: 1.2, v: 2 },
  { kind: 'twisted_pine', x: -12.4, z: -9.2, s: 1.35, v: 3 },
  { kind: 'twisted_pine', x: 12.8, z: -9.6, s: 1.35, v: 0 },
  { kind: 'twisted_pine', x: 1.8, z: -11.6, s: 1.1, v: 1 },
  { kind: 'dragon_stele', x: -1.2, z: -5.2, s: 0.9, v: 1 },
  { kind: 'cairn', x: 1.6, z: -4.4, s: 0.9, v: 1 },
  { kind: 'snow_rock', x: -5.8, z: -4.3, s: 1.05, v: 1 },
  { kind: 'snow_rock', x: 5.6, z: -4.5, s: 1.15, v: 2 },
  { kind: 'snow_rock', x: 3.2, z: -5.6, s: 0.7, v: 3 },
  { kind: 'banner', x: -3.6, z: -4.4, s: 1, v: 1 },
  { kind: 'grass', x: 3.8, z: -3.8, s: 1, v: 1 },
  { kind: 'grass', x: -2.4, z: -3.7, s: 1, v: 2 },
  // Flanks.
  { kind: 'snow_rock', x: -7.2, z: 0.6, s: 1.35, v: 5 },
  { kind: 'snow_rock', x: 7.6, z: -1.3, s: 1.3, v: 6 },
  { kind: 'twisted_pine', x: -9.4, z: -1.6, s: 1.1, v: 2 },
  { kind: 'twisted_pine', x: 9.9, z: 1.8, s: 1.15, v: 3 },
  { kind: 'banner', x: 7.0, z: 2.2, s: 0.95, v: 2 },
  { kind: 'cairn', x: -6.4, z: -1.7, s: 1, v: 2 },
  { kind: 'cairn', x: 6.3, z: 0.4, s: 0.85, v: 3 },
  { kind: 'snowdrift', x: -6.6, z: 3.0, s: 0.8, v: 3 },
  { kind: 'grass', x: -6.0, z: 2.0, s: 1.1, v: 2 },
  { kind: 'grass', x: 6.1, z: 2.6, s: 1, v: 0 },
  { kind: 'grass', x: 6.8, z: -2.6, s: 1, v: 1 },
  // Foreground framing (blurred by the tilt-shift band).
  { kind: 'snow_rock', x: -6.8, z: 5.6, s: 1.3, v: 7 },
  { kind: 'grass', x: -3.6, z: 6.2, s: 1.3, v: 1 },
  { kind: 'rock', x: 4.2, z: 6.4, s: 0.8, v: 2 },
  { kind: 'grass', x: 7.2, z: 5.8, s: 1.4, v: 2 },
];

/** The snowy summits above the clouds: powder snow, rock needles, bronze bells on their posts, a carved dragon stone. */
const DRAGON_SUMMIT_PROPS: ArenaProp[] = [
  // Back: snow-capped needles at the edges, the carved stone and the bells of the climb to the altar.
  { kind: 'rock_needle', x: -13.0, z: -14.6, s: 1.1, v: 7 },
  { kind: 'rock_needle', x: 13.8, z: -15.6, s: 1.15, v: 8 },
  { kind: 'rock_needle', x: -18.6, z: -18.6, s: 1.4, v: 9 },
  { kind: 'rock_needle', x: 19.2, z: -19.4, s: 1.4, v: 10 },
  { kind: 'rock_needle', x: -8.0, z: -21.2, s: 1.0, v: 11 },
  { kind: 'rock_needle', x: 8.6, z: -22.0, s: 1.05, v: 12 },
  { kind: 'dragon_stele', x: -0.3, z: -7.4, s: 1.1, v: 2 },
  { kind: 'bell_post', x: -3.2, z: -5.4, s: 1, v: 1 },
  { kind: 'bell_post', x: 2.8, z: -5.6, s: 1, v: 2 },
  { kind: 'bronze_brazier', x: -1.6, z: -4.5, s: 0.9, v: 1 },
  { kind: 'bronze_brazier', x: 1.2, z: -4.6, s: 0.9, v: 2 },
  { kind: 'banner', x: -4.8, z: -4.2, s: 1, v: 3 },
  { kind: 'banner', x: 4.8, z: -4.4, s: 1, v: 4 },
  { kind: 'snow_rock', x: -6.2, z: -4.8, s: 1.15, v: 8 },
  { kind: 'snow_rock', x: 6.2, z: -5.0, s: 1.2, v: 9 },
  { kind: 'twisted_pine', x: -7.6, z: -7.0, s: 1.1, v: 4 },
  { kind: 'twisted_pine', x: 8.2, z: -6.6, s: 1.15, v: 5 },
  { kind: 'twisted_pine', x: -12.0, z: -9.0, s: 1.3, v: 6 },
  { kind: 'twisted_pine', x: 12.6, z: -9.4, s: 1.3, v: 7 },
  { kind: 'snowdrift', x: 0.2, z: -9.2, s: 1.2, v: 1 },
  { kind: 'snowdrift', x: -7.6, z: -3.0, s: 1.2, v: 2 },
  // Flanks.
  { kind: 'snow_rock', x: -7.4, z: 0.4, s: 1.4, v: 10 },
  { kind: 'snow_rock', x: 7.6, z: -1.2, s: 1.3, v: 11 },
  { kind: 'bell_post', x: 6.6, z: 2.2, s: 0.95, v: 3 },
  { kind: 'bronze_brazier', x: -6.0, z: 2.4, s: 0.95, v: 3 },
  { kind: 'cairn', x: 6.3, z: 0.1, s: 0.9, v: 4 },
  { kind: 'cairn', x: -6.4, z: -1.8, s: 0.85, v: 5 },
  { kind: 'snowdrift', x: -6.6, z: 3.4, s: 1.2, v: 3 },
  { kind: 'snowdrift', x: 7.0, z: 3.8, s: 1.1, v: 4 },
  { kind: 'twisted_pine', x: -9.4, z: -1.8, s: 1.1, v: 1 },
  { kind: 'twisted_pine', x: 9.8, z: 1.6, s: 1.1, v: 2 },
  // Foreground framing.
  { kind: 'snowdrift', x: -5.8, z: 6.0, s: 1.5, v: 5 },
  { kind: 'snow_rock', x: 7.0, z: 5.8, s: 1.3, v: 12 },
  { kind: 'cairn', x: -7.8, z: 4.8, s: 1.1, v: 6 },
];

/** The esplanade before Kaelen's hall: the hall in the cliff, winged dragons on their pedestals, bronze, balustrades over the clouds. */
const DRAGON_ESPLANADE_PROPS: ArenaProp[] = [
  // Back: the hall's front carved into the mountain, its steps, the dragons that guard it.
  { kind: 'dragon_gate', x: -0.4, z: -9.6, s: 1.1, v: 1 },
  { kind: 'cliff', x: -9.6, z: -10.2, s: 1.5, v: 31 },
  { kind: 'cliff', x: 9.4, z: -10.6, s: 1.5, v: 32 },
  { kind: 'cliff', x: -15.6, z: -13.4, s: 1.8, v: 33 },
  { kind: 'cliff', x: 16.0, z: -13.8, s: 1.8, v: 34 },
  { kind: 'stairs', x: -0.4, z: -6.1, s: 1.1, v: 5 },
  { kind: 'dragon_statue', x: -3.9, z: -5.6, s: 1, v: 1 },
  { kind: 'dragon_statue', x: 3.1, z: -5.7, s: 1, v: 2 },
  { kind: 'bronze_brazier', x: -2.4, z: -4.4, s: 1, v: 4 },
  { kind: 'bronze_brazier', x: 1.6, z: -4.4, s: 1, v: 5 },
  { kind: 'banner', x: -5.8, z: -4.2, s: 1.05, v: 5 },
  { kind: 'banner', x: 5.0, z: -4.4, s: 1.05, v: 6 },
  { kind: 'twisted_pine', x: -7.6, z: -6.4, s: 1.15, v: 8 },
  { kind: 'twisted_pine', x: 7.8, z: -6.8, s: 1.2, v: 9 },
  // Flanks: the balustrades over the clouds, a dragon on each end post, bronze against the wind.
  { kind: 'balustrade', x: -7.6, z: -0.2, s: 1, r: Math.PI / 2, v: 1 },
  { kind: 'balustrade', x: 7.8, z: 0.2, s: 1, r: -Math.PI / 2, v: 2 },
  { kind: 'dragon_statue', x: -7.6, z: 2.6, s: 0.85, v: 3 },
  { kind: 'dragon_statue', x: 7.8, z: -2.4, s: 0.85, v: 4 },
  { kind: 'bronze_brazier', x: -6.1, z: 2.6, s: 0.95, v: 6 },
  { kind: 'bronze_brazier', x: 6.2, z: -1.6, s: 0.95, v: 7 },
  { kind: 'cairn', x: 6.4, z: 2.6, s: 0.8, v: 7 },
  { kind: 'grass', x: -6.2, z: -1.8, s: 1, v: 1 },
  { kind: 'grass', x: 6.4, z: 3.4, s: 1, v: 2 },
  { kind: 'grass', x: -6.6, z: 3.8, s: 1.1, v: 0 },
  // Foreground framing.
  { kind: 'balustrade', x: -6.0, z: 6.2, s: 1, r: 0.06, v: 3 },
  { kind: 'snow_rock', x: 7.0, z: 5.8, s: 1.2, v: 13 },
  { kind: 'grass', x: 3.6, z: 6.4, s: 1.3, v: 1 },
];

/** The Wolf's lair: a rough cave of hide curtains and stakes, bones and pelts, iron braziers and the Wolf's banners. */
const WOLF_CAVE_PROPS: ArenaProp[] = [
  // Back: the cave's walls and stalagmites, the hides hung across its recesses, the Wolf's banners.
  { kind: 'cliff', x: -8.2, z: -9.8, s: 1.3, v: 41 },
  { kind: 'cliff', x: 0.4, z: -12.0, s: 1.4, v: 42 },
  { kind: 'cliff', x: 8.8, z: -10.2, s: 1.3, v: 43 },
  { kind: 'cliff', x: -14.2, z: -12.4, s: 1.6, v: 44 },
  { kind: 'cliff', x: 14.8, z: -12.8, s: 1.6, v: 45 },
  { kind: 'stalagmite', x: -5.6, z: -7.4, s: 1.1, v: 1 },
  { kind: 'stalagmite', x: 6.0, z: -7.8, s: 1.15, v: 2 },
  { kind: 'stalagmite', x: -10.8, z: -6.6, s: 1.3, v: 3 },
  { kind: 'stalagmite', x: 11.0, z: -7.0, s: 1.25, v: 4 },
  { kind: 'stalagmite', x: 1.6, z: -8.8, s: 0.9, v: 5 },
  { kind: 'hide_curtain', x: -2.8, z: -7.2, s: 1, v: 1 },
  { kind: 'hide_curtain', x: 3.6, z: -7.6, s: 1, r: -0.1, v: 2 },
  { kind: 'banner', x: -1.4, z: -4.8, s: 1, v: 7 },
  { kind: 'banner', x: 1.8, z: -4.9, s: 1, v: 8 },
  { kind: 'brazier', x: -4.6, z: -4.4, s: 1, v: 11 },
  { kind: 'brazier', x: 4.4, z: -4.5, s: 1, v: 12 },
  { kind: 'stakes', x: -6.8, z: -5.0, s: 1, v: 1 },
  { kind: 'stakes', x: 7.0, z: -5.4, s: 1, v: 2 },
  { kind: 'bones', x: 2.9, z: -4.3, s: 0.9, v: 1 },
  // Flanks.
  { kind: 'pelt', x: -6.2, z: -0.8, s: 1, r: 0.4, v: 1 },
  { kind: 'pelt', x: 6.3, z: 0.6, s: 0.95, r: -0.5, v: 2 },
  { kind: 'stakes', x: -7.4, z: 1.6, s: 0.9, v: 3 },
  { kind: 'brazier', x: 6.0, z: -1.8, s: 1, v: 13 },
  { kind: 'brazier', x: -6.0, z: 2.8, s: 1, v: 14 },
  { kind: 'crate', x: 6.5, z: 2.6, s: 0.95, r: -0.2, v: 2 },
  { kind: 'crate', x: 7.2, z: 3.3, s: 0.7, r: 0.5, v: 3 },
  { kind: 'barrel', x: -7.8, z: 0.0, s: 0.9, v: 1 },
  { kind: 'bones', x: 6.9, z: -3.0, s: 1, v: 2 },
  { kind: 'stalagmite', x: -8.8, z: 3.6, s: 1.1, v: 6 },
  { kind: 'rock', x: 8.4, z: 1.0, s: 1.1, v: 1 },
  // Foreground framing.
  { kind: 'stalagmite', x: -6.6, z: 5.6, s: 1.3, v: 7 },
  { kind: 'crate', x: 4.4, z: 6.2, s: 1.1, r: 0.3, v: 4 },
  { kind: 'bones', x: -3.4, z: 6.4, s: 1, v: 3 },
  { kind: 'rock', x: 7.0, z: 5.6, s: 1.3, v: 2 },
];

/**
 * Pale limestone, powder snow and yellowed grass for the Dragon's peaks. The cloth is deep jade and the trim pale jade
 * and verdigris, never red-and-gold; the "moss" packed into joints and drifts is snow, as on the Bear's mountains.
 */
const DRAGON_PEAK_PALETTE: ArenaPalette = {
  stone: ['#5d564b', '#7c7465', '#9b9280', '#b9b09b', '#d2c9b3', '#e8e1cd'],
  stoneDark: ['#2d2923', '#413b32', '#564f44'],
  moss: ['#8e9aae', '#acb7c8', '#cad2de', '#e3e8ef', '#f6f8fb'],
  dirt: ['#392f24', '#514536', '#6a5c49', '#85765e'],
  // short yellowed grass, never a lush green
  grass: ['#3c3418', '#584c22', '#786a2e', '#98863a', '#b6a04a', '#d0bb66'],
  foliage: ['#121a16', '#1a261e', '#243327', '#304130', '#3e5038', '#506040', '#66734c'],
  bark: ['#1c1612', '#2c231c', '#3e3328', '#524536', '#685a47'],
  wood: ['#2a2017', '#3e3022', '#55432f', '#6e583e'],
  cloth: ['#0c2422', '#123632', '#1a4a44', '#245e56'],
  trim: ['#3d675b', '#5d8c7b', '#8db9a3', '#cde4d4'],
  plaster: ['#8a8170', '#a69d89', '#c2b9a3'],
  roof: ['#3a3a36', '#4e4e48', '#64645c'],
  ink: '#14110d',
};

/** The caravan track across the Scorpion's dunes: honey sand, red sandstone, thorn trees, the track's waymarks under the scorpion. */
const SCORPION_TRACK_PROPS: ArenaProp[] = [
  // Back: dunes rolling away to the mesas, a lone thorn tree, the track's waymark.
  { kind: 'dune', x: -9.6, z: -9.0, s: 1.4, r: 0.2, v: 1 },
  { kind: 'dune', x: 9.4, z: -10.4, s: 1.6, r: -0.15, v: 2 },
  { kind: 'dune', x: -2.6, z: -13.6, s: 1.9, r: 0.05, v: 3 },
  { kind: 'dune', x: 6.0, z: -16.8, s: 2.1, r: -0.1, v: 4 },
  { kind: 'dune', x: -13.0, z: -17.0, s: 2.2, r: 0.25, v: 5 },
  { kind: 'dune', x: 1.6, z: -7.4, s: 0.9, r: -0.3, v: 6 },
  { kind: 'cliff', x: -16.0, z: -13.6, s: 1.5, v: 51 },
  { kind: 'cliff', x: 16.4, z: -14.6, s: 1.6, v: 52 },
  { kind: 'thorn_tree', x: -7.6, z: -6.0, s: 1.15, v: 1 },
  { kind: 'thorn_tree', x: 11.8, z: -8.0, s: 1.3, v: 2 },
  { kind: 'snow_rock', x: -5.6, z: -4.4, s: 1.0, v: 1 },
  { kind: 'snow_rock', x: 5.6, z: -4.6, s: 1.15, v: 2 },
  { kind: 'snow_rock', x: 2.6, z: -5.8, s: 0.7, v: 3 },
  { kind: 'banner', x: -3.4, z: -4.4, s: 1, v: 1 },
  { kind: 'thorn_scrub', x: 0.8, z: -4.1, s: 1, v: 1 },
  { kind: 'dry_tuft', x: -1.8, z: -3.8, s: 1, v: 1 },
  { kind: 'dry_tuft', x: 3.8, z: -3.8, s: 1, v: 2 },
  // Flanks: a scholars' shade on the track, water jars and their crates, a second waymark.
  { kind: 'awning', x: -7.6, z: -0.4, s: 1, r: 0.12, v: 1 },
  { kind: 'clay_jars', x: -6.4, z: 2.2, s: 1, v: 1 },
  { kind: 'crate', x: -7.2, z: 3.2, s: 0.8, r: 0.4, v: 1 },
  { kind: 'snow_rock', x: 7.4, z: -1.2, s: 1.3, v: 4 },
  { kind: 'banner', x: 7.0, z: 2.2, s: 0.95, v: 2 },
  { kind: 'thorn_scrub', x: 6.2, z: 0.6, s: 1, v: 2 },
  { kind: 'thorn_tree', x: 9.8, z: 1.6, s: 1.05, v: 3 },
  { kind: 'dry_tuft', x: -6.0, z: -2.6, s: 1, v: 3 },
  { kind: 'dry_tuft', x: 6.1, z: 3.4, s: 1.1, v: 0 },
  // Foreground framing (blurred by the tilt-shift band).
  { kind: 'dune', x: -7.4, z: 6.2, s: 1.0, r: 0.1, v: 7 },
  { kind: 'thorn_scrub', x: 7.2, z: 5.8, s: 1.3, v: 3 },
  { kind: 'snow_rock', x: 4.2, z: 6.4, s: 0.7, v: 5 },
  { kind: 'dry_tuft', x: -3.6, z: 6.2, s: 1.2, v: 1 },
];

/** The knife-edge dune crest at dusk where the Prophet fled: wild and empty, the Shadows' cold ink and loose leaves across the sand. */
const SCORPION_CREST_PROPS: ArenaProp[] = [
  // Back: the long crest, the ink of his trail running up it, his leaves scattered along it.
  { kind: 'dune', x: -8.6, z: -8.4, s: 1.6, r: 0.3, v: 11 },
  { kind: 'dune', x: 8.8, z: -9.6, s: 1.7, r: -0.2, v: 12 },
  { kind: 'dune', x: 0.6, z: -12.6, s: 2.3, r: 0.12, v: 13 },
  { kind: 'dune', x: -13.4, z: -15.4, s: 2.0, r: 0.4, v: 14 },
  { kind: 'dune', x: 13.6, z: -16.2, s: 2.1, r: -0.3, v: 15 },
  { kind: 'cliff', x: -17.4, z: -18.0, s: 1.5, v: 53 },
  { kind: 'cliff', x: 17.8, z: -19.0, s: 1.4, v: 54 },
  { kind: 'ink_stain', x: -2.4, z: -4.2, s: 1.1, v: 1 },
  { kind: 'ink_stain', x: 1.2, z: -5.6, s: 0.9, v: 2 },
  { kind: 'ink_stain', x: 3.8, z: -7.6, s: 1.0, v: 3 },
  { kind: 'loose_leaves', x: -0.6, z: -4.6, s: 1, v: 1 },
  { kind: 'loose_leaves', x: 2.8, z: -6.8, s: 1, v: 2 },
  { kind: 'thorn_tree', x: -7.8, z: -5.4, s: 1.1, v: 4 },
  { kind: 'snow_rock', x: 5.8, z: -4.4, s: 1.1, v: 6 },
  { kind: 'thorn_scrub', x: -5.4, z: -3.9, s: 0.9, v: 4 },
  { kind: 'dry_tuft', x: 4.0, z: -3.9, s: 1, v: 3 },
  // Flanks.
  { kind: 'dune', x: -8.4, z: 0.6, s: 1.1, r: 1.3, v: 16 },
  { kind: 'snow_rock', x: 7.4, z: -1.0, s: 1.3, v: 7 },
  { kind: 'ink_stain', x: 6.6, z: 1.6, s: 0.8, v: 4 },
  { kind: 'loose_leaves', x: -6.4, z: 2.4, s: 0.9, v: 3 },
  { kind: 'thorn_scrub', x: 6.4, z: 3.4, s: 1.1, v: 5 },
  { kind: 'dry_tuft', x: -6.2, z: -1.6, s: 1, v: 4 },
  { kind: 'thorn_tree', x: 10.2, z: 2.2, s: 1.0, v: 5 },
  // Foreground framing.
  { kind: 'dune', x: 7.0, z: 6.2, s: 1.0, r: -0.2, v: 17 },
  { kind: 'loose_leaves', x: -3.4, z: 6.0, s: 1.1, v: 4 },
  { kind: 'thorn_scrub', x: -7.0, z: 5.6, s: 1.2, v: 6 },
];

/** The road through the Phoenix's ruins: worn flags between broken walls and toppled round columns, a ward circle across it. */
const PHOENIX_RUINS_PROPS: ArenaProp[] = [
  // Back: the road runs on between the ruins, a ward circle traced across it, the faithful's carved stones and their lamps.
  { kind: 'ward_circle', x: -0.4, z: -5.0, s: 1.1, v: 1 },
  { kind: 'phoenix_stele', x: -3.8, z: -4.2, s: 0.9, v: 1 },
  { kind: 'phoenix_stele', x: 3.0, z: -4.3, s: 0.9, v: 2 },
  { kind: 'ruin_wall', x: -6.0, z: -6.6, s: 1, r: 0.08, v: 1 },
  { kind: 'ruin_wall', x: 5.6, z: -7.0, s: 0.95, r: -0.1, v: 2 },
  { kind: 'phoenix_column', x: -2.6, z: -8.2, s: 1, v: 2 },
  { kind: 'phoenix_column', x: 2.2, z: -8.6, s: 1, v: 3 },
  { kind: 'phoenix_column', x: -9.4, z: -7.4, s: 1.05, v: 4 },
  { kind: 'phoenix_column', x: 9.2, z: -8.0, s: 1.05, v: 5 },
  { kind: 'fallen_column', x: 6.6, z: -4.4, s: 1, r: 0.3, v: 1 },
  { kind: 'dune', x: -12.4, z: -11.4, s: 1.7, r: 0.2, v: 21 },
  { kind: 'dune', x: 12.8, z: -12.4, s: 1.8, r: -0.2, v: 22 },
  { kind: 'dune', x: 0.4, z: -14.6, s: 2.0, r: 0.05, v: 23 },
  { kind: 'ruin_wall', x: -8.6, z: -12.0, s: 1.1, r: 0.3, v: 3 },
  { kind: 'phoenix_column', x: 7.4, z: -12.8, s: 1.1, v: 7 },
  { kind: 'dry_tuft', x: -1.6, z: -3.7, s: 0.9, v: 1 },
  // Flanks.
  { kind: 'fallen_column', x: -7.2, z: -1.8, s: 1, r: 1.25, v: 2 },
  { kind: 'phoenix_column', x: -7.6, z: 1.8, s: 0.95, v: 9 },
  { kind: 'phoenix_stele', x: 6.2, z: -1.4, s: 0.9, v: 3 },
  { kind: 'ruin_wall', x: 8.6, z: 2.2, s: 0.8, r: 1.45, v: 4 },
  { kind: 'thorn_scrub', x: 6.4, z: 0.9, s: 0.9, v: 1 },
  { kind: 'snow_rock', x: -6.4, z: 3.6, s: 0.8, v: 7 },
  { kind: 'dry_tuft', x: 6.0, z: 3.6, s: 1, v: 2 },
  // Foreground framing.
  { kind: 'fallen_column', x: -6.4, z: 5.8, s: 1.1, r: 0.2, v: 3 },
  { kind: 'dune', x: 7.2, z: 6.0, s: 1.0, r: -0.2, v: 24 },
  { kind: 'dry_tuft', x: 3.8, z: 6.4, s: 1.2, v: 3 },
];

/** The nave of the Phoenix's temple: the saffron flame on its round hearth, round columns carved with phoenixes, hangings, lit niches. */
const PHOENIX_TEMPLE_PROPS: ArenaProp[] = [
  // Back: the hearth at the heart of the nave in its ward circle, the colonnade and the lamp-lit niches behind.
  { kind: 'flame_hearth', x: -0.3, z: -6.8, s: 1.05, v: 1 },
  { kind: 'ward_circle', x: -0.3, z: -6.8, s: 1.9, v: 2 },
  { kind: 'phoenix_column', x: -3.8, z: -5.0, s: 1.05, v: 2 },
  { kind: 'phoenix_column', x: 3.2, z: -5.1, s: 1.05, v: 4 },
  { kind: 'phoenix_column', x: -8.6, z: -5.2, s: 1.1, v: 6 },
  { kind: 'phoenix_column', x: 8.0, z: -5.4, s: 1.1, v: 8 },
  { kind: 'banner', x: -6.2, z: -4.7, s: 1.05, v: 1 },
  { kind: 'banner', x: 5.6, z: -4.9, s: 1.05, v: 2 },
  { kind: 'niche_wall', x: -4.4, z: -10.2, s: 1, v: 1 },
  { kind: 'niche_wall', x: 3.8, z: -10.4, s: 1, v: 2 },
  { kind: 'niche_wall', x: -12.4, z: -9.6, s: 1.1, v: 3 },
  { kind: 'niche_wall', x: 11.8, z: -9.8, s: 1.1, v: 4 },
  // Flanks: the nave's colonnade, a hanging between each pair, lamps on their carved stones.
  { kind: 'phoenix_column', x: -6.8, z: -0.8, s: 1, v: 10 },
  { kind: 'phoenix_column', x: 6.8, z: -0.6, s: 1, v: 12 },
  { kind: 'phoenix_column', x: -7.2, z: 3.4, s: 1, v: 14 },
  { kind: 'phoenix_column', x: 7.2, z: 3.6, s: 1, v: 16 },
  { kind: 'banner', x: -7.0, z: 1.3, s: 0.95, v: 3 },
  { kind: 'banner', x: 7.0, z: 1.5, s: 0.95, v: 4 },
  { kind: 'phoenix_stele', x: -5.8, z: -2.8, s: 0.8, v: 5 },
  { kind: 'phoenix_stele', x: 5.8, z: -2.6, s: 0.8, v: 6 },
  // Foreground framing.
  { kind: 'phoenix_stele', x: -6.2, z: 5.8, s: 0.85, v: 7 },
  { kind: 'phoenix_stele', x: 6.4, z: 5.8, s: 0.85, v: 8 },
  { kind: 'clay_jars', x: -3.4, z: 6.4, s: 0.9, v: 2 },
];

/** The Phoenix's sanctuary dug into the red rock: the basin of sacred ash and its embers, the phoenix carved above, cold niches. */
const PHOENIX_SANCTUARY_PROPS: ArenaProp[] = [
  // Back: the great basin, the phoenix carved in the rock above it, smoke-blackened niches either side, the hewn walls.
  { kind: 'ash_basin', x: -0.3, z: -6.2, s: 1.15, v: 1 },
  { kind: 'phoenix_relief', x: -0.3, z: -9.8, s: 1.1, v: 1 },
  { kind: 'cliff', x: -7.8, z: -9.8, s: 1.3, v: 61 },
  { kind: 'cliff', x: 7.6, z: -10.0, s: 1.3, v: 62 },
  { kind: 'cliff', x: -14.0, z: -12.2, s: 1.6, v: 63 },
  { kind: 'cliff', x: 14.4, z: -12.6, s: 1.6, v: 64 },
  { kind: 'niche_wall', x: -5.0, z: -7.6, s: 0.9, r: 0.15, v: 5 },
  { kind: 'niche_wall', x: 4.6, z: -7.8, s: 0.9, r: -0.15, v: 6 },
  { kind: 'snow_rock', x: -5.8, z: -4.4, s: 0.9, v: 8 },
  { kind: 'ink_stain', x: 3.4, z: -4.4, s: 0.9, v: 5 },
  { kind: 'ink_stain', x: -2.8, z: -4.0, s: 0.7, v: 6 },
  // Flanks: the chamber's hewn walls, a carved stone with its cold lamp, the ink of the faithful led astray.
  { kind: 'cliff', x: -10.0, z: 0.6, s: 1.1, r: Math.PI / 2, v: 65 },
  { kind: 'cliff', x: 10.2, z: 0.2, s: 1.1, r: -Math.PI / 2, v: 66 },
  { kind: 'phoenix_stele', x: -6.4, z: -1.4, s: 0.85, v: 4 },
  { kind: 'niche_wall', x: 7.6, z: 2.4, s: 0.85, r: -Math.PI / 2, v: 7 },
  { kind: 'snow_rock', x: 7.0, z: -2.0, s: 1, v: 9 },
  { kind: 'ink_stain', x: 6.0, z: 0.4, s: 0.9, v: 7 },
  { kind: 'rock', x: -6.6, z: 2.8, s: 1, v: 1 },
  // Foreground framing.
  { kind: 'snow_rock', x: -6.8, z: 5.6, s: 1.3, v: 10 },
  { kind: 'rock', x: 7.0, z: 5.6, s: 1.2, v: 2 },
  { kind: 'ink_stain', x: -3.2, z: 6.2, s: 0.8, v: 8 },
];

/** The walled court of the Grand Inquisiteur's house of records: sun-baked flags, shaded mud-brick arcades, the doorway under the scorpion. */
const SCORPION_COURT_PROPS: ArenaProp[] = [
  // Back: the doorway of the hall of records under its carved scorpion and its banner, the dry basin before it, the arcades.
  { kind: 'records_gate', x: -0.4, z: -8.8, s: 1.05, v: 1 },
  { kind: 'dry_basin', x: -0.4, z: -5.2, s: 1, v: 1 },
  { kind: 'mudbrick_arcade', x: -8.4, z: -8.4, s: 1, v: 1 },
  { kind: 'mudbrick_arcade', x: 7.6, z: -8.6, s: 1, v: 2 },
  { kind: 'mudbrick_arcade', x: -15.0, z: -8.8, s: 1.05, v: 3 },
  { kind: 'mudbrick_arcade', x: 14.2, z: -9.0, s: 1.05, v: 4 },
  { kind: 'clay_jars', x: -4.4, z: -4.6, s: 0.9, v: 1 },
  { kind: 'clay_jars', x: 3.6, z: -4.8, s: 0.85, v: 2 },
  { kind: 'dry_tuft', x: -2.4, z: -3.8, s: 0.8, v: 1 },
  // Flanks: the shaded arcades along the court's sides, the scholars' jars and crates.
  { kind: 'mudbrick_arcade', x: -8.8, z: -0.4, s: 1, r: Math.PI / 2, v: 5 },
  { kind: 'mudbrick_arcade', x: 8.8, z: -0.2, s: 1, r: -Math.PI / 2, v: 6 },
  { kind: 'clay_jars', x: -6.2, z: 2.6, s: 1, v: 3 },
  { kind: 'clay_jars', x: 6.4, z: -2.8, s: 0.9, v: 4 },
  { kind: 'crate', x: 6.4, z: 2.4, s: 0.8, r: 0.3, v: 1 },
  { kind: 'crate', x: 6.8, z: 3.3, s: 0.65, r: -0.4, v: 2 },
  { kind: 'crate', x: -6.4, z: -2.6, s: 0.75, r: 0.2, v: 3 },
  { kind: 'dry_tuft', x: -6.0, z: 4.2, s: 0.9, v: 2 },
  { kind: 'dry_tuft', x: 6.2, z: 4.4, s: 0.8, v: 3 },
  // Foreground framing.
  { kind: 'clay_jars', x: -6.6, z: 5.8, s: 1.15, v: 5 },
  { kind: 'crate', x: 6.8, z: 5.6, s: 1.0, r: 0.2, v: 4 },
  { kind: 'dry_tuft', x: 3.6, z: 6.4, s: 1.0, v: 2 },
];

/**
 * Honey sand, red sandstone and dusty thorn scrub for the Scorpion's desert. The "moss" lodged in joints and heaped in
 * drifts is sand; the cloth is umber and the trim undyed linen, the plaster ochre clay: never red-and-gold, never purple.
 */
const SCORPION_DESERT_PALETTE: ArenaPalette = {
  stone: ['#3e2a1e', '#5c3e2a', '#7c573a', '#9a7250', '#b68e68', '#d0ac84'],
  stoneDark: ['#1e130c', '#2e2016', '#422c1f'],
  // honey and amber sand, from the shade of a dune's lee to its sunlit crest
  moss: ['#6e4a26', '#946632', '#b88544', '#d4a45c', '#e8c27a'],
  // the cracked clay of the pans, burnt sienna
  dirt: ['#4a2a18', '#6a3c22', '#8a5230', '#a86a40'],
  // dry grass and straw, never a lush green
  grass: ['#4e3c1c', '#6e5628', '#8e7236', '#ae8e48', '#c8a85c', '#ddc078'],
  // the dusty olive of thorn trees and scrub
  foliage: ['#1e1e14', '#2c2c1c', '#3c3c26', '#4e4e30', '#62603c', '#787448', '#8e8a58'],
  bark: ['#1e140c', '#2e2014', '#40301e', '#54402a', '#6a5236'],
  wood: ['#2a1c10', '#3e2a18', '#563c22', '#6e5030'],
  cloth: ['#241810', '#36241a', '#4a3324', '#5e4430'],
  trim: ['#6a6252', '#958c78', '#c2b89e', '#e6dcc4'],
  plaster: ['#8a5a30', '#a8723e', '#c48c50', '#d8a466'],
  roof: ['#3a2a1c', '#4e3a28', '#644c34'],
  ink: '#120b07',
};

/**
 * The Phoenix's weathered cut sandstone, the colour of ash and pale sand; the cloth is saffron and the trim ash grey
 * (no crimson, no gold); sand in the joints of the ruins' road.
 */
const PHOENIX_ASH_PALETTE: ArenaPalette = {
  ...SCORPION_DESERT_PALETTE,
  stone: ['#4a443c', '#655e54', '#827a6e', '#9e968a', '#b9b2a6', '#d4cec2'],
  stoneDark: ['#1e1b18', '#2c2824', '#3c3731'],
  cloth: ['#7a3e0c', '#a85a14', '#d07c1e', '#eda034'],
  trim: ['#4e4a44', '#7a756c', '#a8a298', '#d8d2c6'],
  plaster: ['#6e675c', '#8a8276', '#a69e90'],
  roof: ['#2e2a26', '#423d37', '#58524a'],
  ink: '#14100c',
};

/**
 * Every clan's banner in its own colours, for the place where the clans' banners fly together (the Arena of Destinies):
 * the Lion's gold on red (the forest route's cloth), the Bear's bone on slate, the Dragon's pale jade on deep jade, the
 * Wolf's bone on soot, the Scorpion's linen on umber, the Phoenix's ash on saffron, the Raven's pale steel on dark steel
 * blue and the Serpent's dull bronze on deep green. Never purple.
 */
export const CLAN_BANNER_COLOURS: Readonly<Record<ArenaEmblem, { cloth: readonly string[]; trim: readonly string[] }>> = Object.freeze({
  lion: { cloth: ['#3d0f12', '#63181b', '#8e2622', '#b43a2b'], trim: ['#5b4317', '#8a6a25', '#c39a3c', '#e8c766'] },
  bear: { cloth: BEAR_SNOW_PALETTE.cloth, trim: BEAR_SNOW_PALETTE.trim },
  dragon: { cloth: DRAGON_PEAK_PALETTE.cloth, trim: DRAGON_PEAK_PALETTE.trim },
  wolf: { cloth: ['#121110', '#1c1a18', '#272421', '#33302c'], trim: ['#55504a', '#807a70', '#b0a999', '#ddd6c6'] },
  scorpion: { cloth: SCORPION_DESERT_PALETTE.cloth, trim: SCORPION_DESERT_PALETTE.trim },
  phoenix: { cloth: PHOENIX_ASH_PALETTE.cloth, trim: PHOENIX_ASH_PALETTE.trim },
  raven: { cloth: ['#10161e', '#18222e', '#22303e', '#2e3e50'], trim: ['#565e68', '#848c96', '#b2b9c2', '#e0e5ea'] },
  serpent: { cloth: ['#0e1a12', '#16261a', '#203424', '#2c4430'], trim: ['#4a3a1e', '#6c5830', '#8e7642', '#ae9458'] },
});

/** The eight clans' signs in the order their masts stand round the Arena of Destinies, each once. */
export const ARENA_CLAN_ORDER: readonly ArenaEmblem[] = Object.freeze(['lion', 'bear', 'dragon', 'scorpion', 'raven', 'wolf', 'phoenix', 'serpent']);

/** The Arena of Destinies: three runs of stands across the sand and one on each flank, the honour stand in the middle. */
function destinyArenaProps(night: boolean): ArenaProp[] {
  const burning = night || undefined;
  return [
    // Back: the stands across the sand, a great gate in each side run, the honour stand at the middle of the centre one.
    { kind: 'arena_stand', x: -10.6, z: -7.2, v: 1, burning },
    { kind: 'arena_stand', x: 0, z: -7.4, v: 2, burning },
    { kind: 'arena_stand', x: 10.6, z: -7.2, v: 4, burning },
    // The flanks: the stands curving round toward us.
    { kind: 'arena_stand', x: -12.6, z: -0.2, r: Math.PI / 2, v: 3, burning },
    { kind: 'arena_stand', x: 12.6, z: -0.2, r: -Math.PI / 2, v: 6, burning },
    // The eight clans' masts in one row along the wall, each sign once and none larger than another; by night every
    // other banner burns.
    ...ARENA_CLAN_ORDER.map((emblem, i): ArenaProp => ({
      kind: 'clan_mast', x: -9.8 + i * 2.8, z: -6.3, v: i + 1, emblem, burning: night && i % 2 === 1 ? true : undefined,
    })),
  ];
}

const DESTINY_ARENA_PROPS: ArenaProp[] = [
  ...destinyArenaProps(false),
  // On the sand by the wall: water barrels and crates for the bouts.
  { kind: 'barrel', x: -6.4, z: -4.6, s: 0.9, v: 1 },
  { kind: 'barrel', x: -5.9, z: -5.3, s: 0.8, v: 2 },
  { kind: 'crate', x: 6.3, z: -4.9, s: 0.8, r: 0.3, v: 1 },
  { kind: 'barrel', x: 7.4, z: -1.4, s: 0.9, v: 4 },
  { kind: 'crate', x: -7.6, z: 1.8, s: 0.8, r: -0.2, v: 3 },
  // Foreground framing (blurred by the tilt-shift band).
  { kind: 'barrel', x: -7.0, z: 5.6, s: 1.1, v: 3 },
  { kind: 'crate', x: 7.2, z: 5.8, s: 1.0, r: 0.2, v: 2 },
  { kind: 'barrel', x: 6.4, z: 6.2, s: 0.9, v: 5 },
];

/** The same arena the night of the betrayal: its stands empty and burning, torn banners on fire, the breach risen over the sand. */
const ARENA_BREACH_PROPS: ArenaProp[] = [
  ...destinyArenaProps(true),
  // The breach in the middle of the sand behind the fight, its ink seeping across the sand toward it.
  { kind: 'breach_tear', x: 0.6, z: -4.9, s: 0.9, v: 1 },
  { kind: 'ink_stain', x: 0.2, z: -4.1, s: 1.2, v: 1 },
  { kind: 'ink_stain', x: -2.3, z: -3.9, s: 0.8, v: 2 },
  { kind: 'ink_stain', x: 2.9, z: -4.0, s: 0.9, v: 3 },
  { kind: 'ink_stain', x: -6.4, z: 0.4, s: 0.8, v: 4 },
  { kind: 'ink_stain', x: 6.6, z: -1.2, s: 0.9, v: 5 },
  // What fell from the stands burns on the sand.
  { kind: 'debris', x: -6.8, z: -4.6, s: 0.9, v: 1 },
  { kind: 'fire', x: -6.6, z: -4.9, s: 0.9, v: 1 },
  { kind: 'debris', x: 6.6, z: -4.0, s: 0.9, v: 2 },
  { kind: 'fire', x: 7.0, z: -4.3, s: 1.0, v: 2 },
  { kind: 'smoke', x: -9.0, z: -12.5, s: 2.2, v: 1 },
  { kind: 'smoke', x: 4.0, z: -13.0, s: 2.0, v: 2 },
  { kind: 'smoke', x: 12.0, z: -11.5, s: 2.4, v: 3 },
  // Foreground framing.
  { kind: 'debris', x: -7.0, z: 5.6, s: 1.1, v: 3 },
  { kind: 'ink_stain', x: 3.4, z: 6.2, s: 0.9, v: 6 },
];

/** The capital's streets the night it burns: tall brick houses either side, some on fire, one fallen into the street. */
const CAPITAL_STREET_PROPS: ArenaProp[] = [
  // Back: the street running down between the houses toward the lower city, the breach far above its roofs.
  { kind: 'brick_house', x: -7.6, z: -12.4, r: 0.12, v: 1, burning: true },
  { kind: 'brick_house', x: 7.8, z: -12.8, r: -0.1, v: 2 },
  { kind: 'brick_house', x: -11.4, z: -13.8, r: 0.2, v: 3 },
  { kind: 'brick_house', x: 11.6, z: -14.4, r: -0.2, v: 4, burning: true },
  // The left side of the street, the facades toward it.
  { kind: 'brick_house', x: -8.8, z: -8.4, r: Math.PI / 2, v: 5 },
  { kind: 'brick_house', x: -8.8, z: -4.8, r: Math.PI / 2, v: 6, burning: true },
  { kind: 'brick_house', x: -8.8, z: -1.2, r: Math.PI / 2, v: 7 },
  { kind: 'brick_house', x: -8.8, z: 2.4, r: Math.PI / 2, v: 8 },
  // The right side, a house collapsed into the street.
  { kind: 'brick_house', x: 8.8, z: -8.6, r: -Math.PI / 2, v: 9, burning: true },
  { kind: 'brick_house', x: 8.8, z: -5.0, r: -Math.PI / 2, v: 10 },
  { kind: 'brick_ruin', x: 8.6, z: -1.2, r: -Math.PI / 2, v: 1 },
  { kind: 'brick_house', x: 8.8, z: 2.6, r: -Math.PI / 2, v: 11, burning: true },
  // In the street: iron lanterns still lit, an abandoned cart, barrels, what fell from the roofs, fires in the debris.
  { kind: 'iron_lantern', x: -6.5, z: -2.9, v: 1 },
  { kind: 'iron_lantern', x: 6.5, z: -6.8, r: Math.PI, v: 2 },
  { kind: 'cart', x: -6.3, z: -6.5, r: 0.4, v: 1 },
  { kind: 'barrel', x: 6.2, z: -3.4, v: 1 },
  { kind: 'barrel', x: 6.7, z: -2.8, s: 0.9, v: 2 },
  { kind: 'crate', x: -6.4, z: 0.7, s: 0.8, r: 0.3, v: 1 },
  { kind: 'rubble', x: 6.3, z: 0.8, v: 1 },
  { kind: 'debris', x: 2.6, z: -5.0, v: 1 },
  { kind: 'debris', x: -3.2, z: -5.6, v: 2 },
  { kind: 'fire', x: -5.9, z: -4.5, s: 0.9, v: 4 },
  { kind: 'fire', x: 3.2, z: -5.3, s: 0.8, v: 5 },
  { kind: 'smoke', x: -7.6, z: -13.6, v: 1 },
  { kind: 'smoke', x: 11.6, z: -15.2, v: 2 },
  { kind: 'smoke', x: -10.0, z: -5.0, v: 3 },
  { kind: 'smoke', x: 10.2, z: -9.0, v: 4 },
  // Foreground framing.
  { kind: 'rubble', x: -6.8, z: 5.8, s: 1.2, v: 2 },
  { kind: 'barrel', x: 7.0, z: 5.6, s: 1.1, v: 3 },
  { kind: 'debris', x: 3.6, z: 6.4, s: 0.9, v: 3 },
];

/** The capital's great square the next morning under the smoke: soot-blackened houses all round, one still burning. */
const CAPITAL_SQUARE_PROPS: ArenaProp[] = [
  // Back: the houses across the square, a street leaving it at the far end toward the breach.
  { kind: 'brick_house', x: -4.6, z: -11.2, v: 12 },
  { kind: 'brick_house', x: -8.4, z: -11.0, v: 13, burning: true },
  { kind: 'brick_house', x: -12.2, z: -11.4, v: 14 },
  { kind: 'brick_house', x: 4.8, z: -11.4, v: 15 },
  { kind: 'brick_house', x: 8.6, z: -11.2, v: 16 },
  { kind: 'brick_house', x: 12.4, z: -11.0, v: 17 },
  // The sides of the square.
  { kind: 'brick_house', x: -11.4, z: -6.0, r: Math.PI / 2, v: 18 },
  { kind: 'brick_ruin', x: -11.2, z: -2.2, r: Math.PI / 2, v: 2 },
  { kind: 'brick_house', x: -11.4, z: 1.6, r: Math.PI / 2, v: 19 },
  { kind: 'brick_house', x: 11.4, z: -6.2, r: -Math.PI / 2, v: 20 },
  { kind: 'brick_house', x: 11.4, z: -2.4, r: -Math.PI / 2, v: 21 },
  { kind: 'brick_house', x: 11.4, z: 1.4, r: -Math.PI / 2, v: 22, burning: true },
  // On the square: the lanterns out, a cart left behind, barrels and crates, rubble and charred beams.
  { kind: 'iron_lantern', x: -7.4, z: -6.4, v: 3 },
  { kind: 'iron_lantern', x: 7.6, z: -1.2, r: Math.PI, v: 4 },
  { kind: 'cart', x: 7.0, z: -6.6, r: -0.6, v: 2 },
  { kind: 'barrel', x: -6.4, z: -3.2, v: 4 },
  { kind: 'crate', x: -6.9, z: -2.4, s: 0.9, r: 0.4, v: 4 },
  { kind: 'rubble', x: -7.6, z: -0.2, s: 1.1, v: 3 },
  { kind: 'rubble', x: 7.6, z: 3.4, v: 4 },
  { kind: 'debris', x: 2.2, z: -6.2, v: 4 },
  { kind: 'debris', x: -2.8, z: -7.0, s: 0.9, v: 5 },
  { kind: 'fire', x: -7.8, z: -8.6, s: 0.8, v: 6 },
  { kind: 'smoke', x: -8.4, z: -12.4, v: 5 },
  { kind: 'smoke', x: 12.2, z: 1.0, v: 6 },
  { kind: 'smoke', x: 2.6, z: -16.0, s: 1.4, v: 7 },
  // Foreground framing.
  { kind: 'rubble', x: -6.9, z: 5.8, s: 1.2, v: 5 },
  { kind: 'crate', x: 7.1, z: 5.7, s: 1.0, r: 0.3, v: 5 },
  { kind: 'barrel', x: 6.3, z: 6.3, s: 0.9, v: 6 },
];

/** The foot of the ramparts by the reserve: the brick curtain wall, its round tower, the stair to the wall walk, the stores. */
const RAMPART_RESERVE_PROPS: ArenaProp[] = [
  // Back: the curtain wall of the same brick, a round tower with a flat crenellated top, the stair up to the wall walk.
  { kind: 'rampart_wall', x: -4.4, z: -9.4, v: 1 },
  { kind: 'rampart_wall', x: 3.8, z: -9.6, v: 2 },
  { kind: 'rampart_wall', x: 12.0, z: -9.4, v: 3 },
  { kind: 'rampart_wall', x: -16.6, z: -9.6, v: 4 },
  { kind: 'round_tower', x: -10.6, z: -9.0, v: 1 },
  { kind: 'wall_stair', x: 4.6, z: -8.1, v: 1 },
  // The reserve's stores along the wall: barrels, crates, a cart.
  { kind: 'barrel', x: -6.4, z: -6.0, v: 5 },
  { kind: 'barrel', x: -7.1, z: -5.3, s: 0.9, v: 6 },
  { kind: 'barrel', x: -5.7, z: -5.2, s: 0.95, v: 7 },
  { kind: 'crate', x: 6.6, z: -5.4, s: 1.0, r: 0.2, v: 6 },
  { kind: 'crate', x: 7.5, z: -4.6, s: 0.8, r: -0.3, v: 7 },
  { kind: 'crate', x: 0.6, z: -6.3, s: 0.9, r: 0.1, v: 8 },
  { kind: 'cart', x: -6.7, z: 0.4, r: 1.3, v: 3 },
  { kind: 'barrel', x: 6.4, z: 1.6, v: 8 },
  { kind: 'iron_lantern', x: -6.3, z: -2.8, v: 5 },
  // The flanks: houses of the town inside the walls, one of them fallen.
  { kind: 'brick_house', x: 11.4, z: -2.2, r: -Math.PI / 2, v: 24 },
  { kind: 'brick_house', x: 11.4, z: 1.6, r: -Math.PI / 2, v: 25, burning: true },
  { kind: 'brick_ruin', x: -11.2, z: -1.6, r: Math.PI / 2, v: 3 },
  { kind: 'rubble', x: -7.6, z: 2.8, v: 6 },
  { kind: 'debris', x: 2.8, z: -5.6, v: 6 },
  { kind: 'smoke', x: -6.0, z: -14.0, s: 1.4, v: 8 },
  { kind: 'smoke', x: 6.0, z: -15.0, s: 1.6, v: 9 },
  { kind: 'smoke', x: 12.6, z: 1.2, v: 10 },
  // Foreground framing.
  { kind: 'crate', x: -7.0, z: 5.8, s: 1.1, r: 0.3, v: 9 },
  { kind: 'barrel', x: 7.2, z: 5.6, s: 1.1, v: 9 },
  { kind: 'rubble', x: 3.6, z: 6.4, s: 0.9, v: 7 },
];

/**
 * The crater at the heart of the breach in the lower city: collapsed houses round it, upturned paving, fallen brick. Open,
 * the breach stands over it and its ink runs across the stones; closed, nothing is left in the air, only scars of dried ink.
 */
function breachHeartProps(open: boolean): ArenaProp[] {
  const ring: ArenaProp[] = [
    // Back: the collapsed houses closing the crater, fallen brick heaped where the breach stands.
    { kind: 'brick_ruin', x: -7.4, z: -10.0, r: 0.15, v: 3 },
    { kind: 'brick_ruin', x: 7.6, z: -10.4, r: -0.2, v: 4 },
    { kind: 'brick_ruin', x: -12.4, z: -13.2, r: 0.3, v: 5 },
    { kind: 'brick_ruin', x: 12.8, z: -13.8, r: -0.3, v: 6 },
    { kind: 'rubble', x: -1.8, z: -7.4, s: 1.3, v: 3 },
    { kind: 'rubble', x: 2.6, z: -7.8, s: 1.2, v: 4 },
    { kind: 'paving_slabs', x: -5.4, z: -4.6, v: 1 },
    { kind: 'paving_slabs', x: 4.8, z: -4.4, v: 2 },
    // The flanks: houses fallen across the street, one still standing with its lantern.
    { kind: 'brick_ruin', x: -9.4, z: -3.6, r: Math.PI / 2, v: 7 },
    { kind: 'brick_ruin', x: 9.6, z: -2.8, r: -Math.PI / 2, v: 8 },
    { kind: 'brick_house', x: -9.8, z: 1.8, r: Math.PI / 2, v: 23 },
    { kind: 'iron_lantern', x: -7.2, z: 0.4, v: 6 },
    { kind: 'paving_slabs', x: -6.4, z: 3.0, s: 0.9, v: 3 },
    { kind: 'paving_slabs', x: 6.6, z: 2.6, v: 4 },
    { kind: 'rubble', x: 7.0, z: 0.6, v: 5 },
    { kind: 'debris', x: -6.6, z: -1.4, s: 0.9, v: 7 },
    // Foreground framing.
    { kind: 'rubble', x: -7.0, z: 5.8, s: 1.3, v: 6 },
    { kind: 'debris', x: 6.8, z: 6.0, v: 8 },
  ];
  const breach: ArenaProp[] = open ? [
    // the breach, a tall tear of cold black ink over the crater, its ink running across the paving toward the fight
    { kind: 'breach_tear', x: 0.4, z: -8.6, s: 1.15, v: 2 },
    { kind: 'ink_stain', x: -0.6, z: -5.6, s: 1.3, v: 1 },
    { kind: 'ink_stain', x: 1.5, z: -4.3, s: 1.0, v: 2 },
    { kind: 'ink_stain', x: -2.6, z: -4.0, s: 0.8, v: 3 },
    { kind: 'ink_stain', x: 6.4, z: -0.8, s: 0.9, v: 4 },
    { kind: 'ink_stain', x: -3.4, z: 6.2, s: 0.9, v: 5 },
    // the fires still burning far behind
    { kind: 'fire', x: -10.4, z: -15.0, s: 1.1, v: 1 },
    { kind: 'fire', x: 11.2, z: -16.0, s: 1.2, v: 2 },
    { kind: 'smoke', x: -10.6, z: -16.0, s: 1.6, v: 1 },
    { kind: 'smoke', x: 11.0, z: -17.0, s: 1.6, v: 2 },
  ] : [
    // where the breach stood, nothing in the air: long scars of dried ink across the stones, a thinning smoke
    { kind: 'ink_scar', x: 0.2, z: -5.8, s: 1.3, v: 1 },
    { kind: 'ink_scar', x: -6.4, z: 1.0, s: 0.8, r: 1.2, v: 2 },
    { kind: 'ink_scar', x: 2.8, z: 6.2, s: 0.7, r: -0.3, v: 3 },
    { kind: 'smoke', x: -10.6, z: -16.0, s: 1.4, v: 3 },
    { kind: 'smoke', x: 9.0, z: -17.0, s: 1.2, v: 4 },
  ];
  return [...ring, ...breach];
}

/**
 * The capital's red brick with pale grey stone dressings, blue-black slate roofs and dark wooden shutters. The "plaster"
 * is the brick, the "roof" the slate, the "cloth" and "trim" the slate grey and undyed linen of the honour stand's
 * awning; the arena's "moss" and "dirt" are its pale raked sand. Never red-and-gold, never purple.
 */
const DESTINY_ARENA_PALETTE: ArenaPalette = {
  stone: ['#4a4844', '#64615c', '#7f7c76', '#9b9891', '#b8b5ae', '#d4d1ca'],
  stoneDark: ['#1c1b19', '#2a2826', '#3a3835'],
  moss: ['#8c7c62', '#a6967a', '#bfb092', '#d6c9ac', '#e8dec6'],
  dirt: ['#6a5a44', '#857358', '#a08e70', '#b9a888'],
  // straw and dust, never a lush green
  grass: ['#4a4232', '#625842', '#7c7052', '#968a64', '#b0a478', '#c8bc8e'],
  foliage: ['#1e1e1a', '#2a2a24', '#383830', '#46463c', '#555548', '#646456', '#747464'],
  bark: ['#18120e', '#261c16', '#36281e', '#483628', '#5a4634'],
  wood: ['#1c1612', '#2a201a', '#3a2e24', '#4c3e30'],
  cloth: ['#262c34', '#343c46', '#46505c', '#5a6470'],
  trim: ['#6e675a', '#958d7c', '#bdb4a0', '#e2dac6'],
  plaster: ['#4a2018', '#682c20', '#86392a', '#a04a34', '#b85e44'],
  roof: ['#161a20', '#20262e', '#2c333d', '#3a424e'],
  ink: '#0c0b0a',
};

/** The burning city: the same brick blackened with soot, ash in the joints of the paving, soot and mud in the gutters. */
const CAPITAL_PALETTE: ArenaPalette = {
  ...DESTINY_ARENA_PALETTE,
  stone: ['#3a3836', '#52504c', '#6c6964', '#87847e', '#a3a09a', '#bfbcb6'],
  stoneDark: ['#141312', '#1e1c1b', '#2a2826'],
  moss: ['#3a3836', '#504e4a', '#686560', '#807c76', '#9a968f'],
  dirt: ['#1a1614', '#28221e', '#38302a', '#4a4038'],
  grass: ['#2a2826', '#3a3734', '#4c4844', '#5e5a55', '#726d67', '#88827b'],
  plaster: ['#2e1612', '#47201a', '#622c22', '#7c3a2c', '#944a38'],
  ink: '#080707',
};

export const ARENA_THEMES: Readonly<Record<ArenaSceneId, ArenaTheme>> = Object.freeze({
  forest_route: {
    id: 'forest_route',
    sound: 'forest_route',
    label: 'Route forestière — sanctuaire en ruine',
    tile: 'mossy_flagstone',
    ground: 'forest_floor',
    palette: {
      stone: ['#2a2f2b', '#3d453e', '#555f54', '#6f7a6a', '#8c9584', '#a9af9c'],
      stoneDark: ['#161a18', '#20261f', '#2c332b'],
      moss: ['#1c2c18', '#2b4422', '#3e5e2b', '#567a35', '#76983f'],
      dirt: ['#2a2119', '#3d3022', '#52412e', '#6a553c'],
      grass: ['#1d3320', '#2a4a26', '#3c652d', '#548237', '#71a043', '#93bd55'],
      foliage: ['#132419', '#1d3a20', '#2b5527', '#3d7030', '#548e39', '#72aa45', '#98c75c'],
      bark: ['#1b130d', '#2b2016', '#3d2e20', '#523f2d', '#68523b'],
      wood: ['#24180f', '#3a2818', '#523a24', '#6b4e31'],
      cloth: ['#3d0f12', '#63181b', '#8e2622', '#b43a2b'],
      trim: ['#5b4317', '#8a6a25', '#c39a3c', '#e8c766'],
      plaster: ['#6d6658', '#8a826f', '#a69d86'],
      roof: ['#2d2421', '#463631', '#5e4840'],
      ink: '#0e0c0f',
    },
    light: {
      hemiSky: '#dbe8ff', hemiGround: '#3d4a2e', hemiIntensity: 2.3,
      sunColor: '#ffe2b0', sunIntensity: 6.2, sunPosition: [-9, 15, 7],
      fillColor: '#a9c4ff', fillIntensity: 1.1, exposure: 1.08,
    },
    fog: { color: '#56655f', density: 0.017 },
    background: '#1c2629',
    farPlate: { file: '/assets/generated/combat-arena/forest_route-far.webp', width: 46, bottomY: -2.2, z: -27, tint: '#d6dcd6' },
    spriteTint: '#f6f3ea',
    spriteRim: '#3a4a30',
    props: FOREST_PROPS,
    band: { kinds: ['tree', 'tree', 'tree', 'bush'], count: 30, z: [-8.5, -20], halfWidth: 26, gap: 4.5, scale: [1.2, 1.9] },
    clutter: { kinds: ['bush', 'fern', 'rock', 'grass', 'bush', 'fern', 'log'], count: 58, z: [-3.6, -18], halfWidth: 17, scale: [0.8, 1.5] },
    motes: { color: '#f3e3a0', count: 70, rise: 0.08, size: 0.07, glow: true },
    shafts: {
      color: '#ffe7a8',
      opacity: 0.26,
      items: [[-5.2, -10.5, 2.2, 15, 0.36], [-1.2, -13, 1.4, 16, 0.36], [2.8, -9.4, 2.8, 15, 0.36], [7.4, -12.2, 1.8, 16, 0.36], [10.6, -8.6, 1.2, 14, 0.36]],
    },
    mist: { color: '#b8cbb4', opacity: 0.4, layers: [[-8.8, 1.6, 44], [-14.5, 2.6, 60]] },
  },
  bois_clair_burning: {
    id: 'bois_clair_burning',
    sound: 'bois_clair_burning',
    label: 'Bois-Clair en flammes — place du village',
    tile: 'packed_earth',
    ground: 'village_mud',
    palette: {
      stone: ['#2a221f', '#3f3430', '#584a42', '#736257', '#8f7c6d', '#ab9785'],
      stoneDark: ['#140f0d', '#1f1814', '#2b221c'],
      moss: ['#24261a', '#343a22', '#46502b', '#5d6834', '#77823c'],
      dirt: ['#24170f', '#3a2616', '#53381f', '#6d4c2b', '#896238', '#a57c48'],
      grass: ['#1e2414', '#2c361a', '#3f4c22', '#55642a', '#6f7c33', '#8c9640'],
      foliage: ['#151a0e', '#212b13', '#33401a', '#4a5820', '#667228', '#879033', '#a8a540'],
      bark: ['#140d09', '#22170f', '#352517', '#4a3421', '#61452c'],
      wood: ['#21150c', '#3a2716', '#553b21', '#71502f', '#8d673d'],
      cloth: ['#3a0c0e', '#64161a', '#922421', '#bb3b29'],
      trim: ['#5b4317', '#8a6a25', '#c39a3c', '#e8c766'],
      plaster: ['#7c6c58', '#9b896f', '#b9a586', '#d2bf9c'],
      roof: ['#25191a', '#3c2725', '#55372f', '#704a3a'],
      ink: '#0e0a09',
    },
    light: {
      hemiSky: '#ffb98a', hemiGround: '#40251a', hemiIntensity: 1.9,
      sunColor: '#ff9d5c', sunIntensity: 5.0, sunPosition: [7, 10, -5],
      fillColor: '#8a8fe6', fillIntensity: 0.9, exposure: 1.06,
    },
    fog: { color: '#5a3426', density: 0.019 },
    background: '#24130d',
    farPlate: { file: '/assets/generated/combat-arena/bois_clair_burning-far.webp', width: 46, bottomY: -2.2, z: -27, tint: '#ffe0cc' },
    spriteTint: '#fff0de',
    spriteRim: '#7a3014',
    props: VILLAGE_PROPS,
    band: { kinds: ['house', 'pine', 'dead_tree', 'house'], count: 12, z: [-15, -22], halfWidth: 26, gap: 4.5, scale: [1.0, 1.5] },
    clutter: { kinds: ['barrel', 'crate', 'grass', 'rock', 'grass', 'fence'], count: 18, z: [-3.8, -12], halfWidth: 14, scale: [0.8, 1.2] },
    motes: { color: '#ffa54d', count: 140, rise: 0.42, size: 0.075, glow: true },
    mist: { color: '#5a3328', opacity: 0.5, layers: [[-11.5, 2.2, 56], [-17, 3.4, 66]] },
  },
  lion_sanctum: {
    id: 'lion_sanctum',
    sound: 'lion_sanctum',
    label: 'Sanctuaire du Lion — parvis nocturne',
    tile: 'sanctum_marble',
    ground: 'sanctum_rubble',
    palette: {
      stone: ['#1a1d26', '#272c39', '#383f50', '#4d5568', '#666f84', '#838ca1'],
      stoneDark: ['#0d0f15', '#151821', '#1e222d'],
      moss: ['#12201f', '#1a2e2b', '#244038', '#2f5246', '#3d6553'],
      dirt: ['#1b1a1f', '#29272d', '#38353b', '#48444a'],
      grass: ['#0f1a1a', '#162624', '#1f342f', '#2a453b', '#365647', '#456854'],
      foliage: ['#0a1416', '#102022', '#172d2d', '#203c38', '#2b4c44', '#3a5f52', '#4d7462'],
      bark: ['#110d0e', '#1b1517', '#271f21', '#352a2c', '#45383a'],
      wood: ['#1a1414', '#2a2020', '#3c2d2b', '#4f3c37'],
      cloth: ['#0f1736', '#18245a', '#24357e', '#3249a3'],
      trim: ['#5b4317', '#8a6a25', '#c39a3c', '#e8c766'],
      plaster: ['#4c5262', '#646b7e', '#7f879b'],
      roof: ['#1d1f28', '#2a2d39', '#393d4c'],
      ink: '#08090d',
    },
    light: {
      hemiSky: '#9fb3e8', hemiGround: '#1d2232', hemiIntensity: 1.9,
      sunColor: '#c4d6ff', sunIntensity: 4.2, sunPosition: [6, 16, -4],
      fillColor: '#ffcf8a', fillIntensity: 0.8, exposure: 1.1,
    },
    fog: { color: '#2c364b', density: 0.018 },
    background: '#0d1018',
    farPlate: { file: '/assets/generated/combat-arena/lion_sanctum-far.webp', width: 46, bottomY: -2.2, z: -27, tint: '#d9e0f2' },
    spriteTint: '#e9ecf7',
    spriteRim: '#30406c',
    props: SANCTUM_PROPS,
    band: { kinds: ['pine', 'pine', 'broken_column', 'tree'], count: 18, z: [-12, -21], halfWidth: 26, gap: 6, scale: [1.2, 1.8] },
    clutter: { kinds: ['gravestone', 'rock', 'grass', 'fern', 'broken_column', 'bush', 'gravestone'], count: 26, z: [-3.8, -15], halfWidth: 15, scale: [0.8, 1.2] },
    motes: { color: '#f1d68c', count: 90, rise: 0.06, size: 0.065, glow: true },
    shafts: {
      color: '#a8bfff',
      opacity: 0.2,
      items: [[-6.4, -8.6, 2.0, 14, -0.28], [-0.9, -9.4, 2.6, 15, -0.28], [4.8, -9.0, 2.0, 14, -0.28], [9.8, -11.5, 1.4, 15, -0.28]],
    },
    mist: { color: '#5d6f92', opacity: 0.45, layers: [[-6.8, 1.1, 40], [-12.5, 2.2, 58]] },
  },
  bear_mountain_pass: {
    id: 'bear_mountain_pass',
    sound: 'bear_mountains',
    label: 'Montagnes de l’Ours — col enneigé',
    tile: 'snowy_granite',
    ground: 'snow_scree',
    palette: BEAR_SNOW_PALETTE,
    light: {
      hemiSky: '#dfe9ff', hemiGround: '#545c6a', hemiIntensity: 2.1,
      sunColor: '#f6f7ff', sunIntensity: 4.8, sunPosition: [-9, 15, 7],
      fillColor: '#9fb6e0', fillIntensity: 1.0, exposure: 0.96,
    },
    fog: { color: '#97a7bb', density: 0.011 },
    background: '#a9b8c9',
    farPlate: { procedural: 'peaks', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f2f5fb',
    spriteRim: '#4c5c74',
    props: BEAR_PASS_PROPS,
    emblem: 'bear',
    snow: true,
    fringe: 'alpine',
    band: { kinds: ['snow_rock', 'pine', 'cliff', 'snow_rock', 'pine'], count: 22, z: [-9, -20], halfWidth: 26, gap: 5, scale: [1.0, 1.7] },
    clutter: { kinds: ['snow_rock', 'snowdrift', 'grass', 'rock', 'snowdrift', 'grass'], count: 40, z: [-3.6, -16], halfWidth: 16, scale: [0.7, 1.3], gap: 2.4 },
    motes: { color: '#f4f8ff', count: 150, rise: -0.45, size: 0.07, glow: false },
    mist: { color: '#e4ecf5', opacity: 0.24, layers: [[-9, 1.4, 46], [-15, 2.6, 62]] },
  },
  bear_mine_galleries: {
    id: 'bear_mine_galleries',
    // the galleries are dug into the same mountain: its wind down the shafts, the braziers, the winch chains
    sound: 'bear_mountains',
    label: 'Mines sacrées de l’Ours — galeries étayées',
    tile: 'hewn_granite',
    ground: 'mine_floor',
    palette: {
      stone: ['#16171b', '#22242a', '#31343b', '#44484f', '#5b5f66', '#767a80'],
      stoneDark: ['#0a0b0d', '#111215', '#191b1f'],
      // soot and ore dust in the joints
      moss: ['#141210', '#1d1a17', '#28241f', '#332e27', '#3f392f'],
      dirt: ['#141210', '#1f1b17', '#2c2620', '#3a332b', '#4a4137'],
      // gravel: what lies at the foot of the walls underground
      grass: ['#1a1a1c', '#26272a', '#34353a', '#45464b', '#56585d', '#6a6c70'],
      foliage: ['#0d0e10', '#15161a', '#1d1f24', '#26292f', '#30333a', '#3b3f46', '#474b52'],
      bark: ['#17110d', '#251c16', '#35291f', '#47382b', '#5a4838'],
      wood: ['#1a130e', '#2a2017', '#3d2f22', '#52402e'],
      cloth: ['#14181e', '#1e242c', '#2a323c', '#38424e'],
      trim: ['#5c5a54', '#8a877e', '#bdb9ae', '#e6e2d6'],
      plaster: ['#3c3f45', '#50545a', '#666a70'],
      roof: ['#1a1b1f', '#26282d', '#33363c'],
      ink: '#08090b',
    },
    light: {
      hemiSky: '#8d93a3', hemiGround: '#1c1814', hemiIntensity: 1.6,
      sunColor: '#ffcf9a', sunIntensity: 3.4, sunPosition: [-6, 14, 6],
      fillColor: '#6f7fa0', fillIntensity: 0.6, exposure: 1.12,
    },
    fog: { color: '#1a1714', density: 0.028 },
    background: '#08080a',
    farPlate: { procedural: 'cave', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f4e6d2',
    spriteRim: '#6a4424',
    props: BEAR_GALLERY_PROPS,
    emblem: 'bear',
    interior: true,
    fringe: 'rubble',
    band: { kinds: ['mine_frame', 'cliff', 'ore_pile', 'cliff', 'crate'], count: 16, z: [-9, -18], halfWidth: 22, gap: 5, scale: [1.0, 1.4] },
    clutter: { kinds: ['rock', 'ore_pile', 'crate', 'barrel', 'beam', 'rock'], count: 26, z: [-3.8, -14], halfWidth: 14, scale: [0.7, 1.1], gap: 5.2 },
    motes: { color: '#d9b080', count: 70, rise: 0.06, size: 0.06, glow: true },
    mist: { color: '#3a332c', opacity: 0.4, layers: [[-7.5, 1.0, 40], [-12.5, 2.0, 56]] },
  },
  bear_hall_terrace: {
    id: 'bear_hall_terrace',
    sound: 'bear_mountains',
    label: 'Salle de Borin — parvis taillé dans le roc',
    tile: 'snowy_granite',
    ground: 'snow_terrace',
    palette: {
      ...BEAR_SNOW_PALETTE,
      // dressed granite, a shade lighter than the wild rock of the pass
      stone: ['#2e3238', '#43484f', '#5c6168', '#777c83', '#959aa0', '#b5b9bd'],
    },
    light: {
      hemiSky: '#e2ebff', hemiGround: '#565d6a', hemiIntensity: 2.0,
      sunColor: '#fbf7ee', sunIntensity: 4.6, sunPosition: [-8, 16, 7],
      fillColor: '#a2b6dc', fillIntensity: 0.95, exposure: 0.96,
    },
    fog: { color: '#97a6b9', density: 0.011 },
    background: '#9fb0c4',
    farPlate: { procedural: 'peaks', width: 46, bottomY: -2.2, z: -27, tint: '#f2f4f8' },
    spriteTint: '#f6f4ee',
    spriteRim: '#4f5a68',
    props: BEAR_HALL_PROPS,
    emblem: 'bear',
    snow: true,
    fringe: 'snow',
    apron: 'flagstone',
    band: { kinds: ['snow_rock', 'cliff', 'pine', 'snow_rock'], count: 16, z: [-11, -20], halfWidth: 26, gap: 6, scale: [1.1, 1.7] },
    clutter: { kinds: ['snowdrift', 'snow_rock', 'snowdrift', 'barrel', 'crate'], count: 22, z: [-3.8, -12], halfWidth: 14, scale: [0.7, 1.2], gap: 5 },
    motes: { color: '#f4f8ff', count: 90, rise: -0.3, size: 0.065, glow: false },
    mist: { color: '#e6edf5', opacity: 0.2, layers: [[-11.5, 1.4, 48], [-16, 2.4, 62]] },
  },
  dragon_peak_trail: {
    id: 'dragon_peak_trail',
    sound: 'dragon_peaks',
    label: 'Pics Célestes — sentier des terrasses',
    tile: 'limestone_flag',
    ground: 'dry_grass_snow',
    palette: DRAGON_PEAK_PALETTE,
    light: {
      hemiSky: '#e3ecff', hemiGround: '#6a6048', hemiIntensity: 2.15,
      sunColor: '#fff3dc', sunIntensity: 5.0, sunPosition: [-9, 15, 7],
      fillColor: '#a7bde6', fillIntensity: 1.0, exposure: 0.98,
    },
    fog: { color: '#b6c3d2', density: 0.011 },
    background: '#b4c4d6',
    farPlate: { procedural: 'clouds_day', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f6f3ea',
    spriteRim: '#5a5440',
    props: DRAGON_TRAIL_PROPS,
    emblem: 'dragon',
    rock: 'limestone',
    horizon: 'clouds',
    fringe: 'alpine',
    band: { kinds: ['twisted_pine', 'snow_rock', 'twisted_pine', 'cairn'], count: 16, z: [-9, -20], halfWidth: 26, gap: 5, scale: [0.9, 1.4] },
    clutter: { kinds: ['snow_rock', 'grass', 'cairn', 'grass', 'rock', 'grass'], count: 34, z: [-3.6, -16], halfWidth: 16, scale: [0.7, 1.2], gap: 2.4 },
    motes: { color: '#fff6d8', count: 50, rise: 0.05, size: 0.06, glow: false },
    mist: { color: '#f2f5fa', opacity: 0.22, layers: [[-10, 1.4, 48], [-16, 2.6, 64]] },
  },
  dragon_snowy_summit: {
    id: 'dragon_snowy_summit',
    sound: 'dragon_peaks',
    label: 'Pics Célestes — cimes enneigées au couchant',
    tile: 'snowy_limestone',
    ground: 'snow_scree',
    palette: DRAGON_PEAK_PALETTE,
    light: {
      hemiSky: '#cbbde6', hemiGround: '#5e5060', hemiIntensity: 1.85,
      sunColor: '#ffb27c', sunIntensity: 4.7, sunPosition: [-10, 9, 6],
      fillColor: '#8e9fdc', fillIntensity: 1.0, exposure: 1.0,
    },
    fog: { color: '#b9a3b6', density: 0.012 },
    background: '#c2a2a8',
    farPlate: { procedural: 'clouds_dusk', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fbefe6',
    spriteRim: '#6a5c80',
    props: DRAGON_SUMMIT_PROPS,
    emblem: 'dragon',
    rock: 'limestone',
    horizon: 'clouds',
    snow: true,
    fringe: 'snow',
    band: { kinds: ['snow_rock', 'twisted_pine', 'snowdrift', 'snow_rock'], count: 16, z: [-9, -20], halfWidth: 26, gap: 5, scale: [0.9, 1.4] },
    clutter: { kinds: ['snowdrift', 'snow_rock', 'cairn', 'snowdrift', 'snow_rock'], count: 30, z: [-3.6, -16], halfWidth: 16, scale: [0.7, 1.2], gap: 2.4 },
    motes: { color: '#fff4ec', count: 130, rise: -0.4, size: 0.065, glow: false },
    mist: { color: '#f4e6ea', opacity: 0.3, layers: [[-9.5, 1.4, 48], [-15.5, 2.6, 64]] },
  },
  dragon_hall_esplanade: {
    id: 'dragon_hall_esplanade',
    sound: 'dragon_peaks',
    label: 'Salle de Kaelen — esplanade au-dessus des nuages',
    tile: 'dressed_limestone',
    // the terrace pattern, whose "snow" is this palette's dry grass and lichen
    ground: 'snow_terrace',
    palette: {
      ...DRAGON_PEAK_PALETTE,
      // dressed limestone, a shade lighter than the wild rock; dry grass and lichen in the joints instead of snow
      stone: ['#615a4e', '#827969', '#a29884', '#c0b69f', '#d8cfb8', '#ece6d3'],
      moss: ['#4f4622', '#6e622e', '#8e7f3a', '#ad9c4c', '#c8b766'],
    },
    light: {
      hemiSky: '#e6eeff', hemiGround: '#6e6448', hemiIntensity: 2.1,
      sunColor: '#fff0d2', sunIntensity: 5.2, sunPosition: [-8, 16, 7],
      fillColor: '#a9bde4', fillIntensity: 0.95, exposure: 0.97,
    },
    fog: { color: '#b9c6d6', density: 0.0105 },
    background: '#b7c7d9',
    farPlate: { procedural: 'clouds_day', width: 46, bottomY: -2.2, z: -27, tint: '#f6f6f4' },
    spriteTint: '#f8f4ea',
    spriteRim: '#5c5640',
    props: DRAGON_ESPLANADE_PROPS,
    emblem: 'dragon',
    rock: 'limestone',
    horizon: 'clouds',
    fringe: 'grass',
    apron: 'flagstone',
    band: { kinds: ['rock_needle', 'twisted_pine', 'cliff', 'rock_needle'], count: 14, z: [-11, -20], halfWidth: 26, gap: 6, scale: [1.0, 1.5] },
    clutter: { kinds: ['grass', 'cairn', 'grass', 'snow_rock', 'grass'], count: 18, z: [-3.8, -12], halfWidth: 14, scale: [0.7, 1.1], gap: 5 },
    motes: { color: '#fff6d8', count: 40, rise: 0.04, size: 0.06, glow: false },
    mist: { color: '#f4f6fa', opacity: 0.26, layers: [[-12, 1.4, 50], [-16.5, 2.4, 64]] },
  },
  dragon_wolf_cave: {
    id: 'dragon_wolf_cave',
    // the Wolf’s lair lies in the Dragon’s peaks: their high wind at the cave’s mouth, their bells far across the valley
    sound: 'dragon_peaks',
    label: 'Repaire du Loup — caverne',
    tile: 'cave_flag',
    // packed earth with straw in this palette's "gravel" tones and soot where the fires burn
    ground: 'mine_floor',
    palette: {
      stone: ['#1b1815', '#29241f', '#39322b', '#4b4238', '#5f5547', '#766b5a'],
      stoneDark: ['#0a0908', '#12100d', '#1b1814'],
      // soot and ash in the joints
      moss: ['#141210', '#1e1b17', '#2a2620', '#36312a', '#433d34'],
      dirt: ['#16120e', '#241d16', '#33291f', '#433629', '#554534'],
      // trampled straw where the cave meets its walls
      grass: ['#2a2416', '#3c331f', '#524629', '#6a5b35', '#837143', '#9c8752'],
      foliage: ['#0d0e0c', '#151612', '#1d1f19', '#262920', '#303328', '#3b3f31', '#474b3b'],
      bark: ['#1a130e', '#291f16', '#3a2c1f', '#4d3b2a', '#614c37'],
      wood: ['#1c140e', '#2c2016', '#3e2e1f', '#52402b'],
      // the Wolf's banners: soot-black cloth, bone and ash, never red-and-gold
      cloth: ['#121110', '#1c1a18', '#272421', '#33302c'],
      trim: ['#55504a', '#807a70', '#b0a999', '#ddd6c6'],
      plaster: ['#3c3832', '#504a42', '#665e54'],
      roof: ['#1a1816', '#26231f', '#33302a'],
      ink: '#070605',
    },
    light: {
      hemiSky: '#8e8a94', hemiGround: '#1e1712', hemiIntensity: 1.75,
      sunColor: '#ffc690', sunIntensity: 3.6, sunPosition: [-6, 14, 6],
      fillColor: '#6e7894', fillIntensity: 0.55, exposure: 1.12,
    },
    fog: { color: '#1c1612', density: 0.026 },
    background: '#09080a',
    farPlate: { procedural: 'lair', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f6e6d0',
    spriteRim: '#6e4622',
    props: WOLF_CAVE_PROPS,
    emblem: 'wolf',
    rock: 'limestone',
    interior: true,
    fringe: 'rubble',
    band: { kinds: ['stalagmite', 'cliff', 'stalagmite', 'crate', 'cliff'], count: 16, z: [-9, -18], halfWidth: 22, gap: 5, scale: [1.0, 1.4] },
    clutter: { kinds: ['rock', 'bones', 'stalagmite', 'crate', 'barrel', 'rock'], count: 24, z: [-3.8, -14], halfWidth: 14, scale: [0.7, 1.1], gap: 5.2 },
    motes: { color: '#e0a868', count: 70, rise: 0.12, size: 0.06, glow: true },
    mist: { color: '#3c3028', opacity: 0.4, layers: [[-7.5, 1.0, 40], [-12.5, 2.0, 56]] },
  },
  scorpion_dune_track: {
    id: 'scorpion_dune_track',
    sound: 'scorpion_desert',
    label: 'Déserts Arides — piste des dunes',
    tile: 'sand_flag',
    ground: 'desert_sand',
    palette: SCORPION_DESERT_PALETTE,
    light: {
      hemiSky: '#f6ecda', hemiGround: '#6a4a30', hemiIntensity: 1.45,
      sunColor: '#fff0d0', sunIntensity: 6.0, sunPosition: [-9, 16, 7],
      fillColor: '#7e94c6', fillIntensity: 0.75, exposure: 0.9,
    },
    fog: { color: '#cdb38c', density: 0.008 },
    background: '#e8dfcc',
    farPlate: { procedural: 'dunes_day', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fbf3e4',
    spriteRim: '#6a4a2a',
    props: SCORPION_TRACK_PROPS,
    emblem: 'scorpion',
    rock: 'sandstone',
    horizon: 'dunes',
    fringe: 'sand',
    band: { kinds: ['dune', 'thorn_scrub', 'dune', 'snow_rock', 'thorn_tree'], count: 18, z: [-9, -20], halfWidth: 26, gap: 5, scale: [0.9, 1.5] },
    clutter: { kinds: ['dry_tuft', 'thorn_scrub', 'snow_rock', 'dry_tuft', 'rock'], count: 34, z: [-3.6, -16], halfWidth: 16, scale: [0.7, 1.2], gap: 2.4 },
    motes: { color: '#f2deb2', count: 60, rise: 0.04, size: 0.055, glow: false },
    mist: { color: '#f4e8cc', opacity: 0.1, layers: [[-10, 1.2, 48], [-16, 2.2, 64]] },
  },
  scorpion_dune_crest: {
    id: 'scorpion_dune_crest',
    sound: 'scorpion_desert',
    label: 'Déserts Arides — crête des dunes au crépuscule',
    tile: 'sand_flag',
    ground: 'desert_sand',
    palette: SCORPION_DESERT_PALETTE,
    light: {
      hemiSky: '#e0a676', hemiGround: '#4a3c3a', hemiIntensity: 1.75,
      sunColor: '#ffab64', sunIntensity: 4.6, sunPosition: [-10, 8, 6],
      fillColor: '#6e82b8', fillIntensity: 1.0, exposure: 1.0,
    },
    fog: { color: '#9a7460', density: 0.012 },
    background: '#c88a62',
    farPlate: { procedural: 'dunes_dusk', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fbe8d6',
    spriteRim: '#4a5470',
    props: SCORPION_CREST_PROPS,
    emblem: 'scorpion',
    rock: 'sandstone',
    horizon: 'dunes',
    fringe: 'sand',
    band: { kinds: ['dune', 'dune', 'thorn_scrub', 'snow_rock'], count: 16, z: [-9, -20], halfWidth: 26, gap: 5, scale: [1.0, 1.6] },
    clutter: { kinds: ['dry_tuft', 'thorn_scrub', 'snow_rock', 'dry_tuft'], count: 26, z: [-3.6, -16], halfWidth: 16, scale: [0.7, 1.1], gap: 2.4 },
    motes: { color: '#ffd2a4', count: 70, rise: 0.03, size: 0.055, glow: false },
    mist: { color: '#d49a74', opacity: 0.26, layers: [[-9.5, 1.3, 48], [-15.5, 2.4, 64]] },
  },
  scorpion_phoenix_ruins: {
    id: 'scorpion_phoenix_ruins',
    sound: 'scorpion_desert',
    label: 'Ruines du Phénix — route des sceaux de garde',
    tile: 'sand_flag',
    ground: 'desert_sand',
    palette: PHOENIX_ASH_PALETTE,
    light: {
      hemiSky: '#f6ecdc', hemiGround: '#6a4c34', hemiIntensity: 1.5,
      sunColor: '#fff0d2', sunIntensity: 5.8, sunPosition: [-9, 16, 7],
      fillColor: '#7e94c6', fillIntensity: 0.75, exposure: 0.9,
    },
    fog: { color: '#cbb48e', density: 0.008 },
    background: '#e6ddca',
    farPlate: { procedural: 'ruins_day', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f8f2e6',
    spriteRim: '#5e5446',
    props: PHOENIX_RUINS_PROPS,
    emblem: 'phoenix',
    rock: 'sandstone',
    horizon: 'dunes',
    fringe: 'sand',
    apron: 'flagstone',
    band: { kinds: ['phoenix_column', 'dune', 'ruin_wall', 'dune', 'snow_rock'], count: 16, z: [-10, -20], halfWidth: 26, gap: 5, scale: [0.9, 1.3] },
    clutter: { kinds: ['dry_tuft', 'rock', 'thorn_scrub', 'dry_tuft', 'snow_rock'], count: 28, z: [-3.6, -15], halfWidth: 15, scale: [0.7, 1.1], gap: 2.6 },
    motes: { color: '#f0dcb0', count: 50, rise: 0.05, size: 0.055, glow: false },
    mist: { color: '#f2e6ca', opacity: 0.1, layers: [[-10.5, 1.2, 48], [-16, 2.2, 64]] },
  },
  scorpion_phoenix_temple: {
    id: 'scorpion_phoenix_temple',
    // the temple stands in the same desert (IDENTITY.scorpion): its dry wind through the doors
    sound: 'scorpion_desert',
    label: 'Temple du Phénix — la nef de la flamme',
    tile: 'dressed_sandstone',
    // the nave's flags, whose "snow" is this palette's grey ash
    ground: 'snow_terrace',
    palette: {
      ...PHOENIX_ASH_PALETTE,
      // pale ash swept into the joints of the nave, never sand indoors
      moss: ['#5a5650', '#76716a', '#938e86', '#b0aba2', '#ccc8c0'],
      dirt: ['#2a2420', '#3c3430', '#4e4640', '#625852'],
      grass: ['#2a2622', '#3c3732', '#504a44', '#655e56', '#7a726a', '#908880'],
    },
    light: {
      hemiSky: '#c8b090', hemiGround: '#2a2018', hemiIntensity: 1.45,
      sunColor: '#ffc88a', sunIntensity: 3.0, sunPosition: [-7, 14, 6],
      fillColor: '#6e6458', fillIntensity: 0.5, exposure: 1.12,
    },
    fog: { color: '#2a2018', density: 0.024 },
    background: '#0e0a08',
    farPlate: { procedural: 'nave', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f6e4cc',
    spriteRim: '#7a4a1e',
    props: PHOENIX_TEMPLE_PROPS,
    emblem: 'phoenix',
    rock: 'sandstone',
    interior: true,
    horizon: 'none',
    fringe: 'rubble',
    apron: 'flagstone',
    band: { kinds: ['phoenix_column', 'niche_wall', 'phoenix_column'], count: 12, z: [-11, -18], halfWidth: 20, gap: 5, scale: [1.0, 1.2] },
    clutter: { kinds: ['clay_jars'], count: 8, z: [-3.8, -9], halfWidth: 12, scale: [0.7, 0.9], gap: 5 },
    motes: { color: '#ffb458', count: 80, rise: 0.18, size: 0.055, glow: true },
    mist: { color: '#4e4034', opacity: 0.32, layers: [[-8, 1.2, 40], [-13, 2.2, 56]] },
  },
  scorpion_ash_sanctuary: {
    id: 'scorpion_ash_sanctuary',
    // dug into the desert’s red rock: its dry wind through the entrance
    sound: 'scorpion_desert',
    label: 'Sanctuaire du Phénix — les cendres sacrées',
    tile: 'cave_flag',
    // the hewn floor: packed earth, grit and ash in this palette's "gravel" tones
    ground: 'mine_floor',
    palette: {
      ...PHOENIX_ASH_PALETTE,
      // the red-brown rock the chamber is hewn from
      stone: ['#2e1a12', '#44281c', '#5c3826', '#764a32', '#8e5e40', '#a8744e'],
      stoneDark: ['#100806', '#1a0e0a', '#26150e'],
      // grey ash in the joints and along the walls
      moss: ['#3a3634', '#55504c', '#716b66', '#8e8882', '#aaa49e'],
      dirt: ['#1e120c', '#2e1c12', '#40281a', '#523424'],
      grass: ['#2a2422', '#3c3532', '#504844', '#655c56', '#7a716a', '#908680'],
      plaster: ['#5c3826', '#764a32', '#8e5e40'],
    },
    light: {
      hemiSky: '#8a6a5a', hemiGround: '#1a0c08', hemiIntensity: 1.35,
      sunColor: '#ff9a60', sunIntensity: 2.8, sunPosition: [-6, 13, 6],
      fillColor: '#4a4c56', fillIntensity: 0.45, exposure: 1.14,
    },
    fog: { color: '#1e100a', density: 0.028 },
    background: '#080504',
    farPlate: { procedural: 'sanctuary', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f6dcc8',
    spriteRim: '#6e2e18',
    props: PHOENIX_SANCTUARY_PROPS,
    emblem: 'phoenix',
    rock: 'sandstone',
    interior: true,
    unlitLamps: true,
    fringe: 'rubble',
    band: { kinds: ['cliff', 'snow_rock', 'cliff', 'niche_wall'], count: 14, z: [-9, -18], halfWidth: 22, gap: 5, scale: [1.0, 1.4] },
    clutter: { kinds: ['rock', 'snow_rock', 'rock', 'ink_stain'], count: 20, z: [-3.8, -14], halfWidth: 14, scale: [0.7, 1.1], gap: 5.2 },
    motes: { color: '#ff8a44', count: 60, rise: 0.12, size: 0.05, glow: true },
    mist: { color: '#3a2a22', opacity: 0.38, layers: [[-7.5, 1.0, 40], [-12.5, 2.0, 56]] },
  },
  scorpion_records_court: {
    id: 'scorpion_records_court',
    sound: 'scorpion_desert',
    label: 'Maison des registres — cour du Grand Inquisiteur',
    tile: 'dressed_sandstone',
    // the court's flags under the sun, whose "snow" is this palette's blown sand
    ground: 'snow_terrace',
    palette: {
      ...SCORPION_DESERT_PALETTE,
      // sun-baked flagstones, paler than the wild rock
      stone: ['#5e4a34', '#7e6648', '#9e845e', '#bca276', '#d4bc90', '#e8d4ac'],
      plaster: ['#7e4e28', '#9c6634', '#b88044', '#cf9858', '#e0b070'],
    },
    light: {
      hemiSky: '#f6ecdc', hemiGround: '#6a4a30', hemiIntensity: 1.5,
      sunColor: '#fff0d4', sunIntensity: 5.8, sunPosition: [-8, 17, 7],
      fillColor: '#7e94c6', fillIntensity: 0.75, exposure: 0.9,
    },
    fog: { color: '#cdb692', density: 0.008 },
    background: '#e6ddcc',
    farPlate: { procedural: 'court', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fbf2e2',
    spriteRim: '#6a4c2c',
    props: SCORPION_COURT_PROPS,
    emblem: 'scorpion',
    rock: 'sandstone',
    horizon: 'none',
    fringe: 'sand',
    apron: 'flagstone',
    clutter: { kinds: ['clay_jars', 'crate', 'dry_tuft', 'clay_jars'], count: 14, z: [-3.8, -7.2], halfWidth: 12, scale: [0.6, 0.9], gap: 5.6 },
    motes: { color: '#fff0d0', count: 40, rise: 0.03, size: 0.05, glow: false },
    mist: { color: '#f2e8d2', opacity: 0.08, layers: [[-11, 1.2, 46], [-16, 2.2, 60]] },
  },
  finale_destiny_arena: {
    id: 'finale_destiny_arena',
    // the Tournament’s day: open air, the stands’ wordless murmur, banners and masts
    sound: 'tournament_arena',
    label: 'Arène des Destins — la piste du Tournoi',
    tile: 'raked_sand',
    ground: 'arena_sand',
    palette: DESTINY_ARENA_PALETTE,
    light: {
      // the even veil of grey-white cloud: a cool silvery light, soft shadows, the banners the only bright colours
      hemiSky: '#e4e8ee', hemiGround: '#8a7c68', hemiIntensity: 2.1,
      sunColor: '#eef1f6', sunIntensity: 3.4, sunPosition: [-6, 18, 8],
      fillColor: '#c4ccd8', fillIntensity: 1.1, exposure: 0.98,
    },
    fog: { color: '#c6c9ce', density: 0.009 },
    background: '#d6d9de',
    farPlate: { procedural: 'arena_day', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f4f4f2',
    spriteRim: '#5a5e66',
    props: DESTINY_ARENA_PROPS,
    crowd: true,
    horizon: 'none',
    fringe: 'rubble',
    motes: { color: '#e8e0cc', count: 36, rise: 0.02, size: 0.05, glow: false },
  },
  finale_arena_breach: {
    id: 'finale_arena_breach',
    // the tear stands open on the sand: the breach, not the empty, burning stands’ crowd
    sound: 'breach',
    label: 'Arène des Destins en flammes — la brèche',
    tile: 'raked_sand',
    ground: 'arena_sand',
    palette: DESTINY_ARENA_PALETTE,
    light: {
      // night: the fires' orange from the stands, the breach's cold white rim over the sand
      hemiSky: '#3a4658', hemiGround: '#3a1e12', hemiIntensity: 1.5,
      sunColor: '#ff9c5c', sunIntensity: 3.6, sunPosition: [8, 11, -3],
      fillColor: '#d6e2f4', fillIntensity: 1.2, exposure: 1.1,
    },
    fog: { color: '#2a1e1a', density: 0.017 },
    background: '#0c0d12',
    farPlate: { procedural: 'arena_night', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f6e8dc',
    spriteRim: '#7a3a1e',
    props: ARENA_BREACH_PROPS,
    horizon: 'none',
    fringe: 'rubble',
    motes: { color: '#ffa04a', count: 130, rise: 0.4, size: 0.07, glow: true },
    mist: { color: '#3a2a24', opacity: 0.42, layers: [[-9.5, 1.6, 48], [-14.5, 2.8, 62]] },
  },
  finale_burning_streets: {
    id: 'finale_burning_streets',
    sound: 'corrupted_capital',
    label: 'La capitale en flammes — les rues de brique',
    tile: 'cobbles',
    ground: 'cobbled_street',
    palette: CAPITAL_PALETTE,
    light: {
      hemiSky: '#3c4658', hemiGround: '#3a1c10', hemiIntensity: 1.6,
      sunColor: '#ff9256', sunIntensity: 4.2, sunPosition: [7, 10, -5],
      fillColor: '#8a9cc0', fillIntensity: 0.8, exposure: 1.08,
    },
    fog: { color: '#3a2620', density: 0.02 },
    background: '#120e0e',
    farPlate: { procedural: 'city_night', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fff0de',
    spriteRim: '#7a3014',
    props: CAPITAL_STREET_PROPS,
    horizon: 'none',
    fringe: 'rubble',
    apron: 'cobbles',
    clutter: { kinds: ['rubble', 'debris', 'rubble'], count: 8, z: [-3.8, -7.0], halfWidth: 6.2, scale: [0.6, 0.9], gap: 5.4 },
    motes: { color: '#ffa54d', count: 140, rise: 0.42, size: 0.075, glow: true },
    mist: { color: '#4a3028', opacity: 0.48, layers: [[-11.5, 2.2, 56], [-17, 3.4, 66]] },
  },
  finale_smoke_square: {
    id: 'finale_smoke_square',
    sound: 'corrupted_capital',
    label: 'La capitale sous la fumée — la grande place',
    tile: 'cobbles',
    ground: 'cobbled_street',
    palette: CAPITAL_PALETTE,
    light: {
      // a grey morning under the smoke: a dull warm light, soft shadows
      hemiSky: '#bab6ae', hemiGround: '#4a3e36', hemiIntensity: 1.9,
      sunColor: '#eadccb', sunIntensity: 3.2, sunPosition: [-8, 15, 6],
      fillColor: '#9ca6b2', fillIntensity: 0.85, exposure: 1.02,
    },
    fog: { color: '#8e8a84', density: 0.015 },
    background: '#9a968f',
    farPlate: { procedural: 'city_smoke', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f4f0ea',
    spriteRim: '#5a524a',
    props: CAPITAL_SQUARE_PROPS,
    horizon: 'none',
    fringe: 'rubble',
    apron: 'cobbles',
    unlitLamps: true,
    clutter: { kinds: ['rubble', 'debris', 'rubble'], count: 10, z: [-3.8, -8.0], halfWidth: 8, scale: [0.6, 0.9], gap: 5.6 },
    motes: { color: '#b8b2aa', count: 70, rise: -0.06, size: 0.06, glow: false },
    mist: { color: '#8a847c', opacity: 0.4, layers: [[-11.5, 2.0, 56], [-17, 3.2, 66]] },
  },
  finale_rampart_reserve: {
    id: 'finale_rampart_reserve',
    sound: 'corrupted_capital',
    label: 'Les remparts — la réserve',
    tile: 'cobbles',
    ground: 'cobbled_street',
    palette: CAPITAL_PALETTE,
    light: {
      hemiSky: '#b6b4ae', hemiGround: '#4a3e36', hemiIntensity: 1.9,
      sunColor: '#e8dccc', sunIntensity: 3.3, sunPosition: [-9, 15, 7],
      fillColor: '#9ca6b2', fillIntensity: 0.85, exposure: 1.02,
    },
    fog: { color: '#8c8a86', density: 0.014 },
    background: '#9c9a94',
    farPlate: { procedural: 'ramparts', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#f4f0ea',
    spriteRim: '#5a524a',
    props: RAMPART_RESERVE_PROPS,
    horizon: 'none',
    fringe: 'rubble',
    apron: 'cobbles',
    unlitLamps: true,
    motes: { color: '#b8b2aa', count: 60, rise: -0.05, size: 0.06, glow: false },
    mist: { color: '#8a847c', opacity: 0.32, layers: [[-12.5, 2.0, 56], [-17.5, 3.0, 66]] },
  },
  finale_breach_heart: {
    id: 'finale_breach_heart',
    sound: 'breach',
    label: 'Le cœur de la brèche — la ville basse avant l’aube',
    tile: 'shattered_paving',
    ground: 'rubble_paving',
    palette: CAPITAL_PALETTE,
    light: {
      // before dawn: the breach's thin white rim is the scene's main light, the fires still burning far behind
      hemiSky: '#56647a', hemiGround: '#1a1614', hemiIntensity: 1.55,
      sunColor: '#e6eefa', sunIntensity: 3.6, sunPosition: [-4, 14, -6],
      fillColor: '#ffb070', fillIntensity: 0.55, exposure: 1.12,
    },
    fog: { color: '#1e2430', density: 0.02 },
    background: '#121822',
    farPlate: { procedural: 'breach_dawn', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#e8eef8',
    spriteRim: '#3a4a64',
    props: breachHeartProps(true),
    horizon: 'none',
    fringe: 'rubble',
    clutter: { kinds: ['rubble', 'debris', 'rubble', 'paving_slabs'], count: 10, z: [-3.8, -8.0], halfWidth: 8, scale: [0.6, 0.9], gap: 5.6 },
    motes: { color: '#c8ccd2', count: 70, rise: 0.06, size: 0.055, glow: false },
    mist: { color: '#2c3240', opacity: 0.44, layers: [[-10.5, 1.6, 50], [-15.5, 2.8, 64]] },
  },
  finale_breach_scar: {
    id: 'finale_breach_scar',
    // the tear has closed: what is left is the city it scarred, not the breach’s own sound
    sound: 'corrupted_capital',
    label: 'Le cœur de la brèche refermée — au crépuscule',
    tile: 'shattered_paving',
    ground: 'rubble_paving',
    palette: CAPITAL_PALETTE,
    light: {
      // dusk: a long low warm light, a thinning smoke, nothing left in the air
      hemiSky: '#b89c86', hemiGround: '#2e2622', hemiIntensity: 1.7,
      sunColor: '#ffb88a', sunIntensity: 3.8, sunPosition: [-10, 7, 5],
      fillColor: '#8a96b0', fillIntensity: 0.8, exposure: 1.04,
    },
    fog: { color: '#6e5a50', density: 0.014 },
    background: '#8a7262',
    farPlate: { procedural: 'breach_dusk', width: 46, bottomY: -2.2, z: -27, tint: '#ffffff' },
    spriteTint: '#fbe8d6',
    spriteRim: '#4a5470',
    props: breachHeartProps(false),
    horizon: 'none',
    fringe: 'rubble',
    unlitLamps: true,
    clutter: { kinds: ['rubble', 'debris', 'rubble', 'paving_slabs'], count: 10, z: [-3.8, -8.0], halfWidth: 8, scale: [0.6, 0.9], gap: 5.6 },
    motes: { color: '#e0c8b0', count: 40, rise: 0.02, size: 0.05, glow: false },
    mist: { color: '#8a6e60', opacity: 0.3, layers: [[-10.5, 1.4, 50], [-15.5, 2.6, 64]] },
  },
});

/**
 * The arenas of the final act, one per place its fights take place: the Arena of Destinies on the Tournament's day and
 * the night of the breach, the burning streets, the great square and the ramparts under the smoke, the heart of the
 * breach before dawn and the same crater at dusk once the breach has closed.
 */
export const FINALE_ARENA_IDS = Object.freeze([
  'finale_destiny_arena', 'finale_arena_breach', 'finale_burning_streets', 'finale_smoke_square', 'finale_rampart_reserve', 'finale_breach_heart',
  'finale_breach_scar',
] as const);

/**
 * The arenas of the Scorpion plateau, one per place its fights take place: the dune track, the dune crest at dusk,
 * the Phoenix's ruins, temple and sanctuary, the court of the Grand Inquisiteur's house of records.
 */
export const SCORPION_ARENA_IDS = Object.freeze([
  'scorpion_dune_track', 'scorpion_dune_crest', 'scorpion_phoenix_ruins', 'scorpion_phoenix_temple', 'scorpion_ash_sanctuary', 'scorpion_records_court',
] as const);

/** The arenas of the Bear plateau, one per place its fights take place. */
export const BEAR_ARENA_IDS = Object.freeze(['bear_mountain_pass', 'bear_mine_galleries', 'bear_hall_terrace'] as const);

/** The arenas of the Dragon plateau: the terraces' trail, the snowy summits, Kaelen's esplanade and the Wolf's cave. */
export const DRAGON_ARENA_IDS = Object.freeze(['dragon_peak_trail', 'dragon_snowy_summit', 'dragon_hall_esplanade', 'dragon_wolf_cave'] as const);

/** Deterministic mid-ground band props for a theme (kept off the far plate's centre gap). */
export function arenaBandProps(theme: ArenaTheme, rng: () => number): ArenaProp[] {
  const band = theme.band;
  if (!band) return [];
  const out: ArenaProp[] = [];
  for (let i = 0; i < band.count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (band.gap + rng() * (band.halfWidth - band.gap));
    const z = band.z[0] + (band.z[1] - band.z[0]) * rng();
    const kind = band.kinds[Math.floor(rng() * band.kinds.length)] ?? 'tree';
    const s = band.scale[0] + (band.scale[1] - band.scale[0]) * rng();
    out.push({ kind, x, z, s, v: 20 + i, r: (rng() - 0.5) * 0.6, burning: theme.id === 'bois_clair_burning' && rng() < 0.4 });
  }
  return out;
}

/** Deterministic ground clutter; positions that would crowd the platform are dropped. */
export function arenaClutterProps(theme: ArenaTheme, rng: () => number): ArenaProp[] {
  const clutter = theme.clutter;
  if (!clutter) return [];
  const out: ArenaProp[] = [];
  for (let i = 0; i < clutter.count; i++) {
    const x = (rng() * 2 - 1) * clutter.halfWidth;
    const z = clutter.z[0] + (clutter.z[1] - clutter.z[0]) * rng();
    const kind = clutter.kinds[Math.floor(rng() * clutter.kinds.length)] ?? 'grass';
    const s = clutter.scale[0] + (clutter.scale[1] - clutter.scale[0]) * rng();
    const prop: ArenaProp = { kind, x, z, s, v: 40 + i, r: (rng() - 0.5) * 1.2 };
    if (clutter.gap !== undefined && Math.abs(x) < clutter.gap) continue;
    if (!propCrowdsPlatform(prop)) out.push(prop);
  }
  return out;
}

export function arenaThemeFor(sceneId: string | null | undefined): ArenaTheme {
  return (sceneId && (ARENA_THEMES as Record<string, ArenaTheme>)[sceneId]) || ARENA_THEMES.forest_route;
}

/** Battle platform footprint used by layout validation (8×4 tiles of 1.18). */
export const ARENA_PLATFORM = Object.freeze({ halfWidth: 4.72, halfDepth: 2.36, clearance: 0.9 });

/** True when a prop would stand on, or crowd, the playable platform. */
export function propCrowdsPlatform(prop: Pick<ArenaProp, 'x' | 'z' | 's'>): boolean {
  const margin = ARENA_PLATFORM.clearance * (prop.s ?? 1);
  return Math.abs(prop.x) < ARENA_PLATFORM.halfWidth + margin && Math.abs(prop.z) < ARENA_PLATFORM.halfDepth + margin;
}
