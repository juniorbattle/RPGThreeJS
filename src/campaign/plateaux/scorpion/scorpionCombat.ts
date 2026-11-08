/**
 * Set 1.20.0, post-demo Lot 3 — DRAFT: the Scorpion plateau's fights (COMBAT_AND_VFX "Post-demo combat"). Not canon
 * until the operator approves the plateau. Reputation is authored at the post-demo scale (OD-2026-11-08-A) and is the
 * smallest of the Seal plateaux (R2): no route fight moves it, elite or boss; only the two guardians give +1.
 *
 * Enemy families (roadmap §3.4): the Clan du Phénix's temple guardians and flame keepers, desert creatures, faithful
 * lost under the Shadows' influence, and the Grand Inquisiteur's scholars on the force path. Bosses: the chief of the
 * Phénix's guardians at the temple, then the Prophète des Ombres on the honour path; the Grand Inquisiteur and his
 * scholars on the force path. Provisional sprites (see `scorpionPresentation.ts`); the tactical runtime resolves every fight.
 */
import type { ChallengeDeclaration } from '../../../game/challenges';
import type { CombatConfig } from '../../../game/types';
import { SCORPION_GUARDIANS, SCORPION_OPTIONAL_POIS } from './scorpionTopology';

type ScorpionCombatInput = Omit<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>
  & Partial<Pick<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>>;

const DUNES = 'forest_route';
const TEMPLE = 'lion_sanctum';

export const SCORPION_STORY_COMBATS: readonly ScorpionCombatInput[] = Object.freeze<ScorpionCombatInput[]>([
  { id: 'scorpion_dune_beasts', sceneId: DUNES, objective: 'Repoussez les bêtes qui guettent la première piste.',
    encounterLabel: 'Bêtes des dunes', enemyVisualIds: ['venom_serpent', 'forest_spider', 'cave_rat'],
    rewards: { gold: 30, reputation: 0, materials: {} } },
  { id: 'scorpion_phoenix_scouts', sceneId: DUNES, objective: 'Passez les éclaireurs du Phénix qui gardent le chemin de l’oasis.',
    encounterLabel: 'Éclaireurs du Phénix', enemyVisualIds: ['phoenix_guardian', 'venom_serpent', 'phoenix_guardian'],
    rewards: { gold: 40, reputation: 0, materials: {} } },
  { id: 'scorpion_temple_sentinels', sceneId: DUNES, objective: 'Ouvrez la route des ruines tenue par les sentinelles du Phénix.',
    encounterLabel: 'Sentinelles du temple', enemyVisualIds: ['phoenix_guardian', 'phoenix_guardian', 'venom_serpent'],
    rewards: { gold: 45, reputation: 0, materials: { iron_ore: 1 } } },
  { id: 'scorpion_flamekeeper', sceneId: TEMPLE, objective: 'Venez à bout du gardien de flamme du Phénix.',
    encounterLabel: 'Gardien de flamme', encounterRank: 'elite', enemyVisualIds: ['phoenix_flamekeeper', 'phoenix_guardian'],
    rewards: { gold: 70, reputation: 0, materials: { iron_ore: 1 } } },
  { id: 'scorpion_temple_assault', sceneId: TEMPLE, objective: 'Entrez dans le Temple du Phénix et prenez le codex pour le Grand Inquisiteur.',
    encounterLabel: 'Assaut du temple', encounterRank: 'boss', isBoss: true, bossVisualId: 'phoenix_guardian_chief',
    escortVisualIds: ['phoenix_guardian', 'phoenix_guardian'], preCombatDialogueId: 'scorpion_pre_temple_assault',
    postCombatDialogueId: 'scorpion_temple_assault_aftermath', rewards: { gold: 100, reputation: 0, materials: { iron_ore: 2 } } },
  { id: 'scorpion_temple_seizure', sceneId: TEMPLE, objective: 'Entrez dans le Temple du Phénix et prenez le codex pour le clan.',
    encounterLabel: 'Prise du codex', encounterRank: 'boss', isBoss: true, bossVisualId: 'phoenix_guardian_chief',
    escortVisualIds: ['phoenix_guardian', 'phoenix_guardian'], preCombatDialogueId: 'scorpion_pre_temple_seizure',
    postCombatDialogueId: 'scorpion_temple_seizure_aftermath', rewards: { gold: 160, reputation: -1, materials: { iron_ore: 2 } } },
  { id: 'scorpion_lost_faithful', sceneId: TEMPLE, objective: 'Frayez-vous un passage parmi les fidèles égarés sous l’emprise des Ombres.',
    encounterLabel: 'Fidèles égarés', encounterRank: 'elite', enemyVisualIds: ['shadow_zealot', 'venom_serpent', 'forest_spider'],
    rewards: { gold: 70, reputation: 0, materials: { red_gem: 1 } } },
  { id: 'scorpion_shadow_prophet', sceneId: TEMPLE, objective: 'Traquez le Prophète des Ombres avant qu’il ne répande d’autres prophéties.',
    encounterLabel: 'Prophète des Ombres', encounterRank: 'boss', isBoss: true, bossVisualId: 'shadow_prophet',
    escortVisualIds: ['phoenix_guardian', 'venom_serpent'], preCombatDialogueId: 'scorpion_prophet_pre_combat',
    postCombatDialogueId: 'scorpion_prophet_aftermath', rewards: { gold: 120, reputation: 0, materials: { red_gem: 1 } } },
  { id: 'scorpion_inquisitor', sceneId: DUNES, objective: 'Affrontez le Grand Inquisiteur et ses érudits pour le Sceau du Scorpion.',
    encounterLabel: 'Épreuve du Scorpion', encounterRank: 'boss', isBoss: true, bossVisualId: 'grand_inquisitor',
    escortVisualIds: ['scorpion_scholar', 'scorpion_scholar'], preCombatDialogueId: 'scorpion_inquisitor_pre_combat',
    postCombatDialogueId: 'scorpion_trial_aftermath', rewards: { gold: 100, reputation: 0, materials: {} } },
]);

/** Optional encounters and the two guardians, built from the topology as the Lion's Lot E fights are. */
export function scorpionOptionalCombats(): ScorpionCombatInput[] {
  return [
    ...SCORPION_OPTIONAL_POIS.flatMap((poi) => poi.combat?.variants.map((variant) => ({
      id: variant.id, sceneId: poi.combat!.sceneId, objective: 'Remportez ce combat facultatif.', encounterLabel: poi.label,
      encounterRank: 'normal' as const, enemyVisualIds: [...variant.enemyVisualIds], escortVisualIds: [], maxPlayerUnits: 4,
      rewards: { gold: poi.combat!.rewards.temporaryGold, reputation: poi.combat!.rewards.reputation, materials: { ...poi.combat!.rewards.materials } },
    })) ?? []),
    ...SCORPION_GUARDIANS.map((guardian) => ({
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
export const SCORPION_CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = Object.freeze({
  // The initiation, on « Araignées des sables » in region I: both stable variants.
  scorpion_poi_dune_spiders_a: threeHeroes(1),
  scorpion_poi_dune_spiders_b: threeHeroes(1),
  scorpion_flamekeeper: { kind: 'no_items', primeRedGems: 2 },
  scorpion_lost_faithful: { kind: 'max_rounds', limit: 8, primeRedGems: 2 },
  scorpion_guardian_flamekeeper: threeHeroes(2),
  scorpion_guardian_zealot: threeHeroes(2),
});
