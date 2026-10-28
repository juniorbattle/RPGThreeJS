/**
 * Data for the three procedural combat arenas. The builder (CombatArena.ts)
 * reads only this table: palettes, light rig, fog, far plate and the prop
 * layout around the 8×4 battle platform. Coordinates are world units with the
 * platform centred on the origin (x: −4.72…4.72, z: −2.36…2.36); the fixed
 * tactical camera looks from +z.
 */
export type ArenaSceneId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';

export type TileStyle = 'mossy_flagstone' | 'packed_earth' | 'sanctum_marble';
export type GroundStyle = 'forest_floor' | 'village_mud' | 'sanctum_rubble';

export type ArenaPropKind =
  | 'tree' | 'pine' | 'dead_tree' | 'bush' | 'fern' | 'rock' | 'grass'
  | 'column' | 'broken_column' | 'arch' | 'wall' | 'stairs' | 'obelisk'
  | 'house' | 'fence' | 'barrel' | 'crate' | 'cart' | 'haystack'
  | 'lantern' | 'brazier' | 'banner' | 'candles' | 'gravestone'
  | 'fire' | 'smoke' | 'statue' | 'well' | 'log' | 'debris';

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
  /** Far plate (sky + distant scenery), placed as a wall behind the diorama. */
  farPlate: { file: string; width: number; bottomY: number; z: number; tint: string };
  /** Multiplier applied to pixel sprites so they sit in the arena light. */
  spriteTint: string;
  spriteRim: string;
  props: readonly ArenaProp[];
  /** Seeded mid-ground band (forest wall, village rooftops) that frames the far plate. */
  band?: { kinds: readonly ArenaPropKind[]; count: number; z: [number, number]; halfWidth: number; gap: number; scale: [number, number] };
  /** Seeded ground clutter between the platform and the band (never on the platform). */
  clutter?: { kinds: readonly ArenaPropKind[]; count: number; z: [number, number]; halfWidth: number; scale: [number, number] };
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
  { kind: 'pine', x: -5.4, z: -13.5, s: 1.5, v: 5 },
  { kind: 'pine', x: 6.2, z: -14.5, s: 1.6, v: 6 },
  { kind: 'tree', x: 0.8, z: -17.5, s: 1.7, v: 7 },
  { kind: 'pine', x: -1.6, z: -19.5, s: 1.8, v: 8 },
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

export const ARENA_THEMES: Readonly<Record<ArenaSceneId, ArenaTheme>> = Object.freeze({
  forest_route: {
    id: 'forest_route',
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
    band: { kinds: ['tree', 'pine', 'tree', 'bush'], count: 30, z: [-8.5, -20], halfWidth: 26, gap: 4.5, scale: [1.2, 1.9] },
    clutter: { kinds: ['bush', 'fern', 'rock', 'grass', 'bush', 'fern'], count: 34, z: [-3.6, -11], halfWidth: 15, scale: [0.8, 1.4] },
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
    clutter: { kinds: ['gravestone', 'rock', 'grass', 'fern', 'broken_column', 'bush'], count: 16, z: [-3.8, -11], halfWidth: 14, scale: [0.8, 1.2] },
    motes: { color: '#f1d68c', count: 90, rise: 0.06, size: 0.065, glow: true },
    shafts: {
      color: '#a8bfff',
      opacity: 0.2,
      items: [[-6.4, -8.6, 2.0, 14, -0.28], [-0.9, -9.4, 2.6, 15, -0.28], [4.8, -9.0, 2.0, 14, -0.28], [9.8, -11.5, 1.4, 15, -0.28]],
    },
    mist: { color: '#5d6f92', opacity: 0.45, layers: [[-6.8, 1.1, 40], [-12.5, 2.2, 58]] },
  },
});

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
