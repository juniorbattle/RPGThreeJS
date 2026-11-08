/**
 * Set 1.20.0, post-demo Lot 1 — the Bear plateau's fights (COMBAT_AND_VFX "Post-demo combat"), canon since
 * OD-2026-11-08-B; their balance awaits the operator's PC test. Reputation is authored at the post-demo scale (OD-2026-11-08-A): a routine victory
 * gives none; elite and boss fights and the decisive Bois-Clair-like fight at the mines keep a value.
 *
 * Enemy families (roadmap §3.2): the Raven's scouts and miners, the local mountain fauna, creatures corrupted near the
 * dark vein, and Borin's warriors on the force path. Bosses: the chief of the Raven miners, then the Raven's Master Spy
 * on the honour path; Borin and his warriors on the force path. Their sprites are provisional stand-ins (see
 * `bearPresentation.ts`). The tactical runtime resolves every fight; nothing here computes an outcome.
 */
import type { ChallengeDeclaration } from '../../../game/challenges';
import type { CombatConfig } from '../../../game/types';
import { BEAR_GUARDIANS, BEAR_OPTIONAL_POIS } from './bearTopology';

type BearCombatInput = Omit<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>
  & Partial<Pick<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>>;

const MOUNTAIN = 'forest_route';
const GALLERIES = 'lion_sanctum';

export const BEAR_STORY_COMBATS: readonly BearCombatInput[] = Object.freeze<BearCombatInput[]>([
  { id: 'bear_pass_beasts', sceneId: MOUNTAIN, objective: 'Repoussez les bêtes affamées qui barrent le premier col.',
    encounterLabel: 'Bêtes des éboulis', enemyVisualIds: ['wild_boar', 'forest_badger', 'cave_rat'],
    rewards: { gold: 20, reputation: 0, materials: {} } },
  { id: 'bear_raven_scouts', sceneId: MOUNTAIN, objective: 'Dispersez les éclaireurs du Corbeau avant qu’ils ne donnent l’alerte.',
    encounterLabel: 'Éclaireurs du Corbeau', enemyVisualIds: ['raven_scout', 'raven_scout', 'raven_miner'],
    rewards: { gold: 30, reputation: 0, materials: {} } },
  { id: 'bear_raven_patrol', sceneId: MOUNTAIN, objective: 'Ouvrez la route des mines tenue par la patrouille du Corbeau.',
    encounterLabel: 'Route des mines', enemyVisualIds: ['raven_scout', 'raven_miner', 'raven_scout'],
    rewards: { gold: 35, reputation: 0, materials: { iron_ore: 1 } } },
  { id: 'bear_corrupted_beast', sceneId: GALLERIES, objective: 'Abattez la bête rendue folle près des galeries.',
    encounterLabel: 'Bête corrompue', encounterRank: 'elite', enemyVisualIds: ['corrupted_beast', 'cave_rat'],
    rewards: { gold: 60, reputation: 1, materials: { iron_ore: 1 } } },
  { id: 'bear_mines_defense', sceneId: GALLERIES, objective: 'Chassez le Corbeau des galeries sacrées et rendez-les à l’Ours.',
    encounterLabel: 'Défense des mines sacrées', encounterRank: 'boss', isBoss: true, bossVisualId: 'raven_miner_chief',
    escortVisualIds: ['raven_miner', 'raven_scout'], preCombatDialogueId: 'bear_pre_mines_defense',
    postCombatDialogueId: 'bear_mines_defense_aftermath', rewards: { gold: 80, reputation: 2, materials: { iron_ore: 2 } } },
  { id: 'bear_mines_seizure', sceneId: GALLERIES, objective: 'Chassez le Corbeau et prenez le filon sombre pour le clan.',
    encounterLabel: 'Prise du filon', encounterRank: 'boss', isBoss: true, bossVisualId: 'raven_miner_chief',
    escortVisualIds: ['raven_miner', 'raven_scout'], preCombatDialogueId: 'bear_pre_mines_seizure',
    postCombatDialogueId: 'bear_mines_seizure_aftermath', rewards: { gold: 140, reputation: -2, materials: { iron_ore: 2 } } },
  { id: 'bear_gallery_guardians', sceneId: GALLERIES, objective: 'Frayez-vous un passage parmi les créatures corrompues des galeries.',
    encounterLabel: 'Gardiens des galeries', encounterRank: 'elite', enemyVisualIds: ['depth_beast', 'skeleton', 'cave_rat'],
    rewards: { gold: 60, reputation: 1, materials: { red_gem: 1 } } },
  { id: 'bear_master_spy', sceneId: GALLERIES, objective: 'Traquez le Maître Espion du Corbeau avant qu’il ne quitte la montagne.',
    encounterLabel: 'Maître Espion du Corbeau', encounterRank: 'boss', isBoss: true, bossVisualId: 'raven_master_spy',
    escortVisualIds: ['raven_scout', 'raven_scout'], preCombatDialogueId: 'bear_master_spy_pre_combat',
    postCombatDialogueId: 'bear_master_spy_aftermath', rewards: { gold: 100, reputation: 1, materials: { red_gem: 1 } } },
  { id: 'bear_borin', sceneId: MOUNTAIN, objective: 'Affrontez Borin et ses guerriers pour le Sceau de l’Ours.',
    encounterLabel: 'Épreuve de l’Ours', encounterRank: 'boss', isBoss: true, bossVisualId: 'borin',
    escortVisualIds: ['bear_warrior', 'bear_warrior'], preCombatDialogueId: 'bear_borin_pre_combat',
    postCombatDialogueId: 'bear_trial_aftermath', rewards: { gold: 80, reputation: 0, materials: {} } },
]);

/** Optional encounters and the two guardians, built from the topology as the Lion's Lot E fights are. */
export function bearOptionalCombats(): BearCombatInput[] {
  return [
    ...BEAR_OPTIONAL_POIS.flatMap((poi) => poi.combat?.variants.map((variant) => ({
      id: variant.id, sceneId: poi.combat!.sceneId, objective: 'Remportez ce combat facultatif.', encounterLabel: poi.label,
      encounterRank: 'normal' as const, enemyVisualIds: [...variant.enemyVisualIds], escortVisualIds: [], maxPlayerUnits: 4,
      rewards: { gold: poi.combat!.rewards.temporaryGold, reputation: poi.combat!.rewards.reputation, materials: { ...poi.combat!.rewards.materials } },
    })) ?? []),
    ...BEAR_GUARDIANS.map((guardian) => ({
      id: guardian.combat.id, sceneId: guardian.combat.sceneId, objective: 'Affrontez le gardien pour ouvrir son coffre.',
      encounterLabel: guardian.label, encounterRank: 'elite' as const, enemyVisualIds: [...guardian.combat.enemies], escortVisualIds: [],
      maxPlayerUnits: 3, waves: 2,
      rewards: { gold: guardian.combat.rewards.temporaryGold, reputation: guardian.combat.rewards.reputation,
        materials: { ...guardian.combat.rewards.materials } },
    })),
  ];
}

const threeHeroes = (primeRedGems: number): ChallengeDeclaration => ({ kind: 'max_heroes', limit: 3, primeRedGems });

/** Post-demo challenges, from the closed condition list of set 1.18.0, with the prime decided by RunSystem. */
export const BEAR_CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = Object.freeze({
  // The initiation, on « Bêtes du détour » in region I: both stable variants.
  bear_poi_pass_beasts_a: threeHeroes(1),
  bear_poi_pass_beasts_b: threeHeroes(1),
  bear_corrupted_beast: { kind: 'no_items', primeRedGems: 2 },
  bear_gallery_guardians: { kind: 'max_rounds', limit: 8, primeRedGems: 2 },
  bear_guardian_foreman: threeHeroes(2),
  bear_guardian_depths: threeHeroes(2),
});
