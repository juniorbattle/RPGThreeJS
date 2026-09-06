export const COMBAT_POSES = ['prepare', 'dash', 'attack', 'cast'] as const;

export type CombatPose = (typeof COMBAT_POSES)[number];

export interface CombatPoseAsset {
  src: string;
  sourceSizePx: Readonly<{ width: number; height: number }>;
  /** Source pixels; origin is top-left, +x right, +y down. */
  anchor: Readonly<{ x: number; y: number }>;
  scaleCorrection?: number;
}

export interface CombatPoseSet {
  unitId: string;
  sourceFolder: string;
  worldUnitsPerPixel: number;
  poses: Readonly<Record<CombatPose, CombatPoseAsset>>;
}

export interface CombatPoseLayout {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const ROOT = '/assets/combat-stage/poses';

type PoseFactory = (file: string, width: number, height: number, x: number, y: number) => CombatPoseAsset;

function poseSet(
  unitId: string,
  sourceFolder: string,
  worldUnitsPerPixel: number,
  createPoses: (pose: PoseFactory) => Record<CombatPose, CombatPoseAsset>,
): CombatPoseSet {
  const pose: PoseFactory = (file, width, height, x, y) => Object.freeze({
    src: `${ROOT}/${sourceFolder}/${file}`,
    sourceSizePx: Object.freeze({ width, height }),
    anchor: Object.freeze({ x, y }),
  });
  return Object.freeze({ unitId, sourceFolder, worldUnitsPerPixel, poses: Object.freeze(createPoses(pose)) });
}

export const COMBAT_POSE_SOURCE_FOLDER_TO_UNIT_ID = Object.freeze({
  'heroes/warrior_sheet_4x1': 'warrior',
  'heroes/white_mage_sheet_4x1': 'white_mage',
  'heroes/dark_mage_sheet_4x1': 'dark_mage',
  'heroes/archer_sheet_4x1': 'archer',
  'heroes/rogue_sheet_4x1': 'rogue',
  'heroes/lancer_sheet_4x1': 'lancer',
  'enemies/enemy_badger_4x1_2560x768': 'forest_badger',
  'enemies/enemy_bat_4x1_2560x768': 'cave_bat',
  'enemies/enemy_boar_4x1_2560x768': 'wild_boar',
  'enemies/enemy_cave_rat_4x1_2560x768': 'cave_rat',
  'enemies/enemy_forest_spider_4x1_2560x768': 'forest_spider',
  'enemies/enemy_goblin_4x1_2560x768': 'goblin',
  'enemies/enemy_marsh_toad_4x1_2560x768': 'marsh_toad',
  'enemies/enemy_masked_assassin_4x1_2560x768': 'serpent_raider',
  'enemies/enemy_serpent_mace_knight_4x1_2560x768': 'serpent_brute',
  'enemies/enemy_serpent_mage_4x1_2560x768': 'serpent_oracle',
  'enemies/enemy_skeleton_4x1_2560x768': 'skeleton',
  'enemies/enemy_venom_serpent_4x1_2560x768': 'venom_serpent',
  'enemies/enemy_wolf_4x1_2560x768': 'wolf',
  'bosses/enemy_dragon_elite_4x1_2560x768': 'young_dragon_elite',
  'bosses/enemy_lion_king_boss_4x1_2560x768': 'lion_champion',
  'bosses/enemy_ogre_elite_4x1_2560x768': 'forest_troll_elite',
  'bosses/enemy_serpent_champion_4x1_2560x768': 'serpent_general_boss',
  'bosses/enemy_serpent_duelist_elite_4x1_2560x768': 'serpent_duelist_elite',
  'bosses/enemy_serpent_halberd_elite_4x1_2560x768': 'serpent_elite_brute',
} satisfies Record<string, string>);

const SETS = [
  poseSet('young_dragon_elite', 'bosses/enemy_dragon_elite_4x1_2560x768', 0.00481149, (pose) => ({
    prepare: pose('enemy_dragon_elite_4x1_2560x768_01_pose1.png', 595, 557, 316, 557),
    dash: pose('enemy_dragon_elite_4x1_2560x768_02_pose2.png', 685, 542, 418, 542),
    attack: pose('enemy_dragon_elite_4x1_2560x768_03_pose3.png', 633, 590, 316, 590),
    cast: pose('enemy_dragon_elite_4x1_2560x768_04_pose4.png', 568, 620, 282, 620),
  })),
  poseSet('lion_champion', 'bosses/enemy_lion_king_boss_4x1_2560x768', 0.00376238, (pose) => ({
    prepare: pose('enemy_lion_king_boss_4x1_2560x768_01_pose1.png', 519, 606, 269, 606),
    dash: pose('enemy_lion_king_boss_4x1_2560x768_02_pose2.png', 751, 492, 430, 492),
    attack: pose('enemy_lion_king_boss_4x1_2560x768_03_pose3.png', 645, 664, 322, 664),
    cast: pose('enemy_lion_king_boss_4x1_2560x768_04_pose4.png', 598, 594, 277, 593),
  })),
  poseSet('forest_troll_elite', 'bosses/enemy_ogre_elite_4x1_2560x768', 0.00441077, (pose) => ({
    prepare: pose('enemy_ogre_elite_4x1_2560x768_01_pose1.png', 584, 594, 292, 594),
    dash: pose('enemy_ogre_elite_4x1_2560x768_02_pose2.png', 688, 625, 320, 625),
    attack: pose('enemy_ogre_elite_4x1_2560x768_03_pose3.png', 562, 706, 291, 706),
    cast: pose('enemy_ogre_elite_4x1_2560x768_04_pose4.png', 641, 709, 360, 709),
  })),
  poseSet('serpent_general_boss', 'bosses/enemy_serpent_champion_4x1_2560x768', 0.00584670, (pose) => ({
    prepare: pose('enemy_serpent_champion_4x1_2560x768_01_pose1.png', 536, 561, 229, 561),
    dash: pose('enemy_serpent_champion_4x1_2560x768_02_pose2.png', 618, 519, 325, 519),
    attack: pose('enemy_serpent_champion_4x1_2560x768_03_pose3.png', 505, 639, 275, 639),
    cast: pose('enemy_serpent_champion_4x1_2560x768_04_pose4.png', 570, 486, 278, 486),
  })),
  poseSet('serpent_duelist_elite', 'bosses/enemy_serpent_duelist_elite_4x1_2560x768', 0.00333333, (pose) => ({
    prepare: pose('enemy_serpent_duelist_elite_4x1_2560x768_01_pose1.png', 607, 648, 310, 648),
    dash: pose('enemy_serpent_duelist_elite_4x1_2560x768_02_pose2.png', 678, 559, 370, 559),
    attack: pose('enemy_serpent_duelist_elite_4x1_2560x768_03_pose3.png', 584, 688, 220, 688),
    cast: pose('enemy_serpent_duelist_elite_4x1_2560x768_04_pose4.png', 547, 653, 276, 653),
  })),
  poseSet('serpent_elite_brute', 'bosses/enemy_serpent_halberd_elite_4x1_2560x768', 0.00341085, (pose) => ({
    prepare: pose('enemy_serpent_halberd_elite_4x1_2560x768_01_pose1.png', 472, 645, 241, 645),
    dash: pose('enemy_serpent_halberd_elite_4x1_2560x768_02_pose2.png', 856, 484, 264, 484),
    attack: pose('enemy_serpent_halberd_elite_4x1_2560x768_03_pose3.png', 624, 642, 348, 642),
    cast: pose('enemy_serpent_halberd_elite_4x1_2560x768_04_pose4.png', 544, 643, 302, 643),
  })),
  poseSet('forest_badger', 'enemies/enemy_badger_4x1_2560x768', 0.00426426, (pose) => ({
    prepare: pose('enemy_badger_4x1_2560x768_01_pose1.png', 484, 333, 248, 333),
    dash: pose('enemy_badger_4x1_2560x768_02_pose2.png', 672, 311, 391, 311),
    attack: pose('enemy_badger_4x1_2560x768_03_pose3.png', 524, 439, 273, 439),
    cast: pose('enemy_badger_4x1_2560x768_04_pose4.png', 483, 468, 246, 468),
  })),
  poseSet('cave_bat', 'enemies/enemy_bat_4x1_2560x768', 0.00308370, (pose) => ({
    prepare: pose('enemy_bat_4x1_2560x768_01_pose1.png', 503, 454, 234, 454),
    dash: pose('enemy_bat_4x1_2560x768_02_pose2.png', 599, 505, 300, 505),
    attack: pose('enemy_bat_4x1_2560x768_03_pose3.png', 498, 576, 229, 576),
    cast: pose('enemy_bat_4x1_2560x768_04_pose4.png', 544, 634, 250, 634),
  })),
  poseSet('wild_boar', 'enemies/enemy_boar_4x1_2560x768', 0.00421348, (pose) => ({
    prepare: pose('enemy_boar_4x1_2560x768_01_pose1.png', 608, 356, 325, 356),
    dash: pose('enemy_boar_4x1_2560x768_02_pose2.png', 557, 438, 333, 438),
    attack: pose('enemy_boar_4x1_2560x768_03_pose3.png', 600, 337, 328, 337),
    cast: pose('enemy_boar_4x1_2560x768_04_pose4.png', 502, 370, 254, 370),
  })),
  poseSet('cave_rat', 'enemies/enemy_cave_rat_4x1_2560x768', 0.00338462, (pose) => ({
    prepare: pose('enemy_cave_rat_4x1_2560x768_01_pose1.png', 573, 390, 279, 390),
    dash: pose('enemy_cave_rat_4x1_2560x768_02_pose2.png', 728, 309, 445, 309),
    attack: pose('enemy_cave_rat_4x1_2560x768_03_pose3.png', 494, 491, 257, 491),
    cast: pose('enemy_cave_rat_4x1_2560x768_04_pose4.png', 405, 489, 212, 489),
  })),
  poseSet('forest_spider', 'enemies/enemy_forest_spider_4x1_2560x768', 0.00261649, (pose) => ({
    prepare: pose('enemy_forest_spider_4x1_2560x768_01_pose1.png', 528, 558, 262, 558),
    dash: pose('enemy_forest_spider_4x1_2560x768_02_pose2.png', 554, 482, 300, 480),
    attack: pose('enemy_forest_spider_4x1_2560x768_03_pose3.png', 610, 464, 282, 461),
    cast: pose('enemy_forest_spider_4x1_2560x768_04_pose4.png', 498, 492, 245, 492),
  })),
  poseSet('goblin', 'enemies/enemy_goblin_4x1_2560x768', 0.00371429, (pose) => ({
    prepare: pose('enemy_goblin_4x1_2560x768_01_pose1.png', 699, 490, 272, 490),
    dash: pose('enemy_goblin_4x1_2560x768_02_pose2.png', 529, 520, 283, 520),
    attack: pose('enemy_goblin_4x1_2560x768_03_pose3.png', 634, 491, 385, 491),
    cast: pose('enemy_goblin_4x1_2560x768_04_pose4.png', 497, 472, 245, 472),
  })),
  poseSet('marsh_toad', 'enemies/enemy_marsh_toad_4x1_2560x768', 0.00304636, (pose) => ({
    prepare: pose('enemy_marsh_toad_4x1_2560x768_01_pose1.png', 528, 453, 249, 453),
    dash: pose('enemy_marsh_toad_4x1_2560x768_02_pose2.png', 604, 576, 281, 576),
    attack: pose('enemy_marsh_toad_4x1_2560x768_03_pose3.png', 487, 455, 222, 455),
    cast: pose('enemy_marsh_toad_4x1_2560x768_04_pose4.png', 649, 402, 272, 402),
  })),
  poseSet('serpent_raider', 'enemies/enemy_masked_assassin_4x1_2560x768', 0.00355172, (pose) => ({
    prepare: pose('enemy_masked_assassin_4x1_2560x768_01_pose1.png', 471, 580, 251, 580),
    dash: pose('enemy_masked_assassin_4x1_2560x768_02_pose2.png', 541, 515, 312, 515),
    attack: pose('enemy_masked_assassin_4x1_2560x768_03_pose3.png', 471, 597, 243, 597),
    cast: pose('enemy_masked_assassin_4x1_2560x768_04_pose4.png', 662, 462, 270, 455),
  })),
  poseSet('serpent_brute', 'enemies/enemy_serpent_mace_knight_4x1_2560x768', 0.00376511, (pose) => ({
    prepare: pose('enemy_serpent_mace_knight_4x1_2560x768_01_pose1.png', 480, 579, 208, 579),
    dash: pose('enemy_serpent_mace_knight_4x1_2560x768_02_pose2.png', 566, 497, 355, 497),
    attack: pose('enemy_serpent_mace_knight_4x1_2560x768_03_pose3.png', 685, 522, 270, 522),
    cast: pose('enemy_serpent_mace_knight_4x1_2560x768_04_pose4.png', 475, 729, 240, 729),
  })),
  poseSet('serpent_oracle', 'enemies/enemy_serpent_mage_4x1_2560x768', 0.00333858, (pose) => ({
    prepare: pose('enemy_serpent_mage_4x1_2560x768_01_pose1.png', 374, 635, 187, 635),
    dash: pose('enemy_serpent_mage_4x1_2560x768_02_pose2.png', 442, 560, 211, 560),
    attack: pose('enemy_serpent_mage_4x1_2560x768_03_pose3.png', 659, 472, 225, 472),
    cast: pose('enemy_serpent_mage_4x1_2560x768_04_pose4.png', 427, 709, 214, 709),
  })),
  poseSet('skeleton', 'enemies/enemy_skeleton_4x1_2560x768', 0.00384615, (pose) => ({
    prepare: pose('enemy_skeleton_4x1_2560x768_01_pose1.png', 563, 507, 256, 507),
    dash: pose('enemy_skeleton_4x1_2560x768_02_pose2.png', 619, 498, 368, 498),
    attack: pose('enemy_skeleton_4x1_2560x768_03_pose3.png', 730, 477, 336, 477),
    cast: pose('enemy_skeleton_4x1_2560x768_04_pose4.png', 553, 661, 327, 660),
  })),
  poseSet('venom_serpent', 'enemies/enemy_venom_serpent_4x1_2560x768', 0.00432099, (pose) => ({
    prepare: pose('enemy_venom_serpent_4x1_2560x768_01_pose1.png', 597, 405, 269, 405),
    dash: pose('enemy_venom_serpent_4x1_2560x768_02_pose2.png', 428, 513, 251, 513),
    attack: pose('enemy_venom_serpent_4x1_2560x768_03_pose3.png', 688, 407, 302, 407),
    cast: pose('enemy_venom_serpent_4x1_2560x768_04_pose4.png', 411, 442, 219, 442),
  })),
  poseSet('wolf', 'enemies/enemy_wolf_4x1_2560x768', 0.00381062, (pose) => ({
    prepare: pose('enemy_wolf_4x1_2560x768_01_pose1.png', 526, 433, 259, 433),
    dash: pose('enemy_wolf_4x1_2560x768_02_pose2.png', 546, 434, 296, 434),
    attack: pose('enemy_wolf_4x1_2560x768_03_pose3.png', 625, 352, 350, 350),
    cast: pose('enemy_wolf_4x1_2560x768_04_pose4.png', 489, 348, 260, 348),
  })),
  poseSet('archer', 'heroes/archer_sheet_4x1', 0.00358621, (pose) => ({
    prepare: pose('archer_sheet_4x1_04_pose4.png', 428, 580, 201, 580),
    dash: pose('archer_sheet_4x1_02_pose2.png', 590, 509, 330, 509),
    attack: pose('archer_sheet_4x1_01_pose1.png', 544, 653, 470, 653),
    cast: pose('archer_sheet_4x1_03_pose3.png', 468, 653, 204, 653),
  })),
  poseSet('dark_mage', 'heroes/dark_mage_sheet_4x1', 0.00365159, (pose) => ({
    prepare: pose('dark_mage_sheet_4x1_04_pose4.png', 376, 597, 181, 597),
    dash: pose('dark_mage_sheet_4x1_02_pose2.png', 566, 476, 340, 476),
    attack: pose('dark_mage_sheet_4x1_01_pose1.png', 557, 541, 286, 541),
    cast: pose('dark_mage_sheet_4x1_03_pose3.png', 479, 599, 242, 599),
  })),
  poseSet('lancer', 'heroes/lancer_sheet_4x1', 0.00358714, (pose) => ({
    prepare: pose('lancer_sheet_4x1_04_pose4.png', 429, 591, 213, 591),
    dash: pose('lancer_sheet_4x1_02_pose2.png', 641, 508, 380, 508),
    attack: pose('lancer_sheet_4x1_01_pose1.png', 652, 496, 278, 496),
    cast: pose('lancer_sheet_4x1_03_pose3.png', 446, 633, 223, 633),
  })),
  poseSet('rogue', 'heroes/rogue_sheet_4x1', 0.00328076, (pose) => ({
    prepare: pose('rogue_sheet_4x1_04_pose4.png', 447, 634, 225, 634),
    dash: pose('rogue_sheet_4x1_02_pose2.png', 561, 571, 360, 571),
    attack: pose('rogue_sheet_4x1_01_pose1.png', 583, 525, 281, 525),
    cast: pose('rogue_sheet_4x1_03_pose3.png', 495, 578, 252, 578),
  })),
  poseSet('warrior', 'heroes/warrior_sheet_4x1', 0.00338608, (pose) => ({
    prepare: pose('warrior_sheet_4x1_04_pose4.png', 455, 632, 293, 632),
    dash: pose('warrior_sheet_4x1_02_pose2.png', 573, 599, 350, 599),
    attack: pose('warrior_sheet_4x1_01_pose1.png', 629, 553, 226, 553),
    cast: pose('warrior_sheet_4x1_03_pose3.png', 500, 654, 270, 654),
  })),
  poseSet('white_mage', 'heroes/white_mage_sheet_4x1', 0.00361204, (pose) => ({
    prepare: pose('white_mage_sheet_4x1_04_pose4.png', 385, 598, 173, 598),
    dash: pose('white_mage_sheet_4x1_02_pose2.png', 611, 610, 400, 610),
    attack: pose('white_mage_sheet_4x1_01_pose1.png', 614, 510, 272, 510),
    cast: pose('white_mage_sheet_4x1_03_pose3.png', 447, 648, 216, 648),
  })),
] as const;

const registry = new Map<string, CombatPoseSet>(SETS.map((set) => [set.unitId, set]));

const UNIT_ID_ALIASES = Object.freeze({
  alistair: 'warrior',
  marian: 'white_mage',
  elara: 'dark_mage',
  kestrel: 'archer',
  cedric: 'rogue',
  serpent_elite_raider: 'serpent_duelist_elite',
  serpent_captain: 'serpent_general_boss',
  young_wyrm: 'young_dragon_elite',
  lion_chief: 'lion_champion',
  '/assets/characters/pixel/full/alistair.png': 'warrior',
  '/assets/characters/pixel/full/marian.png': 'white_mage',
  '/assets/characters/pixel/full/elara.png': 'dark_mage',
  '/assets/characters/pixel/full/kestrel.png': 'archer',
  '/assets/characters/pixel/full/cedric.png': 'rogue',
  '/assets/characters/pixel/full/lancer.png': 'lancer',
  '/assets/characters/pixel/full/forest_badger.png': 'forest_badger',
  '/assets/characters/pixel/full/cave_bat.png': 'cave_bat',
  '/assets/characters/pixel/full/wild_boar.png': 'wild_boar',
  '/assets/characters/pixel/full/cave_rat.png': 'cave_rat',
  '/assets/characters/pixel/full/forest_spider.png': 'forest_spider',
  '/assets/characters/pixel/full/goblin.png': 'goblin',
  '/assets/characters/pixel/full/marsh_toad.png': 'marsh_toad',
  '/assets/characters/pixel/full/serpent_raider.png': 'serpent_raider',
  '/assets/characters/pixel/full/serpent_brute.png': 'serpent_brute',
  '/assets/characters/pixel/full/serpent_oracle.png': 'serpent_oracle',
  '/assets/characters/pixel/full/skeleton.png': 'skeleton',
  '/assets/characters/pixel/full/venom_serpent.png': 'venom_serpent',
  '/assets/characters/pixel/full/wolf.png': 'wolf',
  '/assets/characters/pixel/full/young_dragon_elite.png': 'young_dragon_elite',
  '/assets/characters/pixel/full/lion_champion.png': 'lion_champion',
  '/assets/characters/pixel/full/forest_troll_elite.png': 'forest_troll_elite',
  '/assets/characters/pixel/full/serpent_general_boss.png': 'serpent_general_boss',
  '/assets/characters/pixel/full/serpent_duelist_elite.png': 'serpent_duelist_elite',
} satisfies Record<string, string>);

export function resolveCombatPoseUnitId(identity: string | null | undefined): string | undefined {
  if (!identity) return undefined;
  const normalized = identity.replaceAll('\\', '/');
  if (registry.has(normalized)) return normalized;
  return UNIT_ID_ALIASES[normalized as keyof typeof UNIT_ID_ALIASES]
    ?? COMBAT_POSE_SOURCE_FOLDER_TO_UNIT_ID[normalized as keyof typeof COMBAT_POSE_SOURCE_FOLDER_TO_UNIT_ID];
}

export function resolveCombatPoseSet(unitId: string | null | undefined): CombatPoseSet | undefined {
  const canonicalId = resolveCombatPoseUnitId(unitId);
  return canonicalId ? registry.get(canonicalId) : undefined;
}

export function resolvePoseAssetFromSet(
  set: Pick<CombatPoseSet, 'poses'> | null | undefined,
  poseName: CombatPose,
): CombatPoseAsset | undefined {
  const poses = set?.poses as Partial<Record<CombatPose, CombatPoseAsset>> | undefined;
  return poses?.[poseName] ?? poses?.prepare;
}

export function resolveCombatPoseAsset(
  unitId: string | null | undefined,
  poseName: CombatPose,
): CombatPoseAsset | undefined {
  return resolvePoseAssetFromSet(resolveCombatPoseSet(unitId), poseName);
}

export function combatPoseAssetScale(set: CombatPoseSet, asset: CombatPoseAsset): number {
  return set.worldUnitsPerPixel * (asset.scaleCorrection ?? 1);
}

/**
 * A Three.js PlaneGeometry is centred. This offset maps a source-pixel anchor
 * (top-left origin, y down) onto the poseVisual local origin / unit root.
 */
export function resolveCombatPoseLayout(set: CombatPoseSet, asset: CombatPoseAsset): CombatPoseLayout {
  const scale = combatPoseAssetScale(set, asset);
  const { width, height } = asset.sourceSizePx;
  return {
    width: width * scale,
    height: height * scale,
    offsetX: (width * 0.5 - asset.anchor.x) * scale,
    offsetY: (asset.anchor.y - height * 0.5) * scale,
  };
}

export function listCombatPoseSets(): readonly CombatPoseSet[] {
  return SETS;
}
