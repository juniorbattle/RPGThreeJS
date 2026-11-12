/**
 * Set 1.20.0, post-demo Lot 2 — the Dragon plateau's fights (COMBAT_AND_VFX "Post-demo combat"), canon since
 * OD-2026-11-08-C; their balance awaits the operator's PC test. Reputation is authored at the post-demo scale (OD-2026-11-08-A) and smaller
 * than the Bear's (R2): a routine victory gives none; the two elite fights and the Chaman des Ombres give +1.
 *
 * Enemy families (roadmap §3.3): the Clan du Loup's patrols, raiders, hunters and their wolves; mountain creatures,
 * sometimes under the Shadows' influence; Kaelen's guardians on the force path. Bosses: the chief of the Clan du Loup at
 * his lair, then the Chaman des Ombres on the honour path; the Ancien Dragon Kaelen and his guardians on the force path.
 * Their sprites are provisional stand-ins (see `dragonPresentation.ts`). The tactical runtime resolves every fight.
 */
import type { ChallengeDeclaration } from '../../../game/challenges';
import type { CombatConfig } from '../../../game/types';
import { DRAGON_GUARDIANS, DRAGON_OPTIONAL_POIS } from './dragonTopology';

type DragonCombatInput = Omit<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>
  & Partial<Pick<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>>;

/**
 * The Dragon's own coded arenas (`src/combat/arena/arenaThemes.ts`, no arena plate since OD-2026-11-01-C), by where
 * each fight takes place: the trail across the foothills and terraces (regions I and II), the snowy summits of the
 * climb to the altar (region III, where the shaman is run down), the Wolf's cave for the two lair fights, and the
 * esplanade before Kaelen's hall for his trial (`dragon_kaelen_pre_combat` shows it). Presentation only.
 */
const TRAIL = 'dragon_peak_trail';
const SUMMIT = 'dragon_snowy_summit';
const LAIR = 'dragon_wolf_cave';
const ESPLANADE = 'dragon_hall_esplanade';

export const DRAGON_STORY_COMBATS: readonly DragonCombatInput[] = Object.freeze<DragonCombatInput[]>([
  { id: 'dragon_wolf_patrol', sceneId: TRAIL, objective: 'Dispersez la patrouille du Loup qui tient le premier sentier.',
    encounterLabel: 'Patrouille du Loup', enemyVisualIds: ['wolf_raider', 'wolf', 'wolf'],
    rewards: { gold: 25, reputation: 0, materials: {} } },
  { id: 'dragon_wolf_scouts', sceneId: TRAIL, objective: 'Chassez les éclaireurs du Loup avant qu’ils ne préviennent le repaire.',
    encounterLabel: 'Éclaireurs du Loup', enemyVisualIds: ['wolf_hunter', 'wolf_raider', 'wolf'],
    rewards: { gold: 35, reputation: 0, materials: {} } },
  { id: 'dragon_crest_creatures', sceneId: TRAIL, objective: 'Repoussez les créatures qui harcèlent la route des terrasses.',
    encounterLabel: 'Créatures des crêtes', enemyVisualIds: ['young_wyrm', 'wild_boar', 'cave_rat'],
    rewards: { gold: 40, reputation: 0, materials: { iron_ore: 1 } } },
  { id: 'dragon_corrupted_wyrm', sceneId: TRAIL, objective: 'Abattez le wyrm rendu fou par une énergie sombre.',
    encounterLabel: 'Wyrm corrompu', encounterRank: 'elite', enemyVisualIds: ['shadow_wyrm', 'cave_rat'],
    rewards: { gold: 65, reputation: 1, materials: { iron_ore: 1 } } },
  { id: 'dragon_lair_assault', sceneId: LAIR, objective: 'Prenez le repaire du Loup et reprenez le Cristal d’Écho pour Kaelen.',
    encounterLabel: 'Assaut du repaire', encounterRank: 'boss', isBoss: true, bossVisualId: 'wolf_chief',
    escortVisualIds: ['wolf_raider', 'wolf_hunter'], preCombatDialogueId: 'dragon_pre_lair_assault',
    postCombatDialogueId: 'dragon_lair_assault_aftermath', rewards: { gold: 90, reputation: 0, materials: { iron_ore: 2 } } },
  { id: 'dragon_lair_seizure', sceneId: LAIR, objective: 'Prenez le repaire du Loup et gardez le Cristal d’Écho pour le clan.',
    encounterLabel: 'Prise du Cristal', encounterRank: 'boss', isBoss: true, bossVisualId: 'wolf_chief',
    escortVisualIds: ['wolf_raider', 'wolf_hunter'], preCombatDialogueId: 'dragon_pre_lair_seizure',
    postCombatDialogueId: 'dragon_lair_seizure_aftermath', rewards: { gold: 150, reputation: -1, materials: { iron_ore: 2 } } },
  { id: 'dragon_shadow_touched', sceneId: SUMMIT, objective: 'Frayez-vous un passage parmi les bêtes sous l’emprise des Ombres.',
    encounterLabel: 'Bêtes sous l’emprise des Ombres', encounterRank: 'elite', enemyVisualIds: ['corrupted_beast', 'wolf', 'wolf'],
    rewards: { gold: 65, reputation: 1, materials: { red_gem: 1 } } },
  { id: 'dragon_shadow_shaman', sceneId: SUMMIT, objective: 'Traquez le Chaman des Ombres avant qu’il ne quitte les Pics.',
    encounterLabel: 'Chaman des Ombres', encounterRank: 'boss', isBoss: true, bossVisualId: 'shadow_shaman',
    escortVisualIds: ['wolf_raider', 'wolf'], preCombatDialogueId: 'dragon_shaman_pre_combat',
    postCombatDialogueId: 'dragon_shaman_aftermath', rewards: { gold: 110, reputation: 1, materials: { red_gem: 1 } } },
  { id: 'dragon_kaelen', sceneId: ESPLANADE, objective: 'Affrontez Kaelen et ses gardiens pour le Sceau du Dragon.',
    encounterLabel: 'Épreuve du Dragon', encounterRank: 'boss', isBoss: true, bossVisualId: 'kaelen',
    escortVisualIds: ['dragon_guardian', 'dragon_guardian'], preCombatDialogueId: 'dragon_kaelen_pre_combat',
    postCombatDialogueId: 'dragon_trial_aftermath', rewards: { gold: 90, reputation: 0, materials: {} } },
]);

/** Optional encounters and the two guardians, built from the topology as the Lion's Lot E fights are. */
export function dragonOptionalCombats(): DragonCombatInput[] {
  return [
    ...DRAGON_OPTIONAL_POIS.flatMap((poi) => poi.combat?.variants.map((variant) => ({
      id: variant.id, sceneId: poi.combat!.sceneId, objective: 'Remportez ce combat facultatif.', encounterLabel: poi.label,
      encounterRank: 'normal' as const, enemyVisualIds: [...variant.enemyVisualIds], escortVisualIds: [], maxPlayerUnits: 4,
      rewards: { gold: poi.combat!.rewards.temporaryGold, reputation: poi.combat!.rewards.reputation, materials: { ...poi.combat!.rewards.materials } },
    })) ?? []),
    ...DRAGON_GUARDIANS.map((guardian) => ({
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
export const DRAGON_CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = Object.freeze({
  // The initiation, on « Bêtes du ravin » in region I: both stable variants.
  dragon_poi_foothill_beasts_a: threeHeroes(1),
  dragon_poi_foothill_beasts_b: threeHeroes(1),
  dragon_corrupted_wyrm: { kind: 'no_items', primeRedGems: 2 },
  dragon_shadow_touched: { kind: 'max_rounds', limit: 8, primeRedGems: 2 },
  dragon_guardian_champion: threeHeroes(2),
  dragon_guardian_wyrm: threeHeroes(2),
});
