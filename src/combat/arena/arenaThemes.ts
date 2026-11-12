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
 */
export type ArenaSceneId =
  | 'forest_route' | 'bois_clair_burning' | 'lion_sanctum'
  | 'bear_mountain_pass' | 'bear_mine_galleries' | 'bear_hall_terrace'
  | 'dragon_peak_trail' | 'dragon_snowy_summit' | 'dragon_hall_esplanade' | 'dragon_wolf_cave';

export type TileStyle = 'mossy_flagstone' | 'packed_earth' | 'sanctum_marble' | 'hewn_granite' | 'snowy_granite'
  | 'limestone_flag' | 'snowy_limestone' | 'dressed_limestone' | 'cave_flag';
export type GroundStyle = 'forest_floor' | 'village_mud' | 'sanctum_rubble' | 'snow_scree' | 'mine_floor' | 'snow_terrace' | 'dry_grass_snow';

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
  | 'stalagmite' | 'hide_curtain' | 'stakes' | 'bones' | 'pelt';

/** The sound family a scene plays: a new arena borrows an existing one, since new sound awaits the operator's ear. */
export type ArenaSoundFamily = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';
/** The clan sign on an arena's banners and carved reliefs. */
export type ArenaEmblem = 'lion' | 'bear' | 'dragon' | 'wolf';
/** What grows or lies at the foot of the platform and of the masonry. */
export type ArenaFringe = 'vegetation' | 'alpine' | 'snow' | 'rubble' | 'grass';

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
    file?: string; procedural?: 'peaks' | 'cave' | 'clouds_day' | 'clouds_dusk' | 'lair'; width: number; bottomY: number; z: number; tint: string;
  };
  /** Ambience and sound mapping the scene plays (its own id for the Lion's arenas). */
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
  apron?: 'flagstone';
  /** The living rock of cliffs, boulders and outcrops: the Bear's granite by default, the Dragon's pale limestone. */
  rock?: 'granite' | 'limestone';
  /** Horizon between the band and the far plate: tree lines or ridges by default, the sea of clouds on the Dragon's peaks. */
  horizon?: 'clouds';
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
    sound: 'forest_route',
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
    sound: 'lion_sanctum',
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
    sound: 'lion_sanctum',
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
    sound: 'forest_route',
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
    sound: 'lion_sanctum',
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
    sound: 'forest_route',
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
    sound: 'lion_sanctum',
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
});

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
