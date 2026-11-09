/**
 * Set 1.20.0, post-demo Lot 4 — the final act's fights (COMBAT_AND_VFX "Post-demo combat"), canon since OD-2026-11-09-A;
 * their balance awaits the operator's PC test. Reputation is authored at the post-demo scale (OD-2026-11-08-A) and is the smallest
 * share of the game (R2): only the victory at the breach and the guardian give +1; two choices give the rest.
 *
 * Enemy families (roadmap §3.6 and §3.7): the champions of the rival clans at the Tournament, the Serpent's champion in
 * the final, the demons that come through the breach (unnamed, as the roadmap leaves them), Maelor, then the entity
 * that follows him (unnamed until the operator decides, F4). The final fight has two phases (Maelor, then the entity),
 * the only boss fight with phases. Provisional sprites (see `finalePresentation.ts`); the tactical runtime resolves
 * every fight.
 *
 * Clan supports and enemy-clan foes (F3) are approved with the final act (OD-2026-11-09-A) and derived by RunSystem
 * before each final-act fight from the saved clan relations; nothing about them is saved.
 */
import type { ChallengeDeclaration } from '../../../game/challenges';
import type { CombatConfig } from '../../../game/types';
import type { CampaignClanId } from '../campaignIds';
import { FINALE_GUARDIANS, FINALE_OPTIONAL_POIS } from './finaleTopology';

type FinaleCombatInput = Omit<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>
  & Partial<Pick<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>>;

const ARENA = 'lion_sanctum';
const CAPITAL = 'forest_route';

export const FINALE_STORY_COMBATS: readonly FinaleCombatInput[] = Object.freeze<FinaleCombatInput[]>([
  { id: 'finale_raven_bout', sceneId: ARENA, objective: 'Battez le champion du Corbeau dans l’arène.', encounterLabel: 'Tournoi : le Corbeau',
    encounterRank: 'elite', enemyVisualIds: ['raven_champion', 'raven_scout'], postCombatDialogueId: 'finale_raven_verdict',
    rewards: { gold: 60, reputation: 0, materials: {} } },
  { id: 'finale_wolf_bout', sceneId: ARENA, objective: 'Battez le champion du Loup dans l’arène.', encounterLabel: 'Tournoi : le Loup',
    encounterRank: 'elite', enemyVisualIds: ['wolf_champion', 'wolf_hunter'], postCombatDialogueId: 'finale_wolf_verdict',
    rewards: { gold: 60, reputation: 0, materials: {} } },
  { id: 'finale_phoenix_bout', sceneId: ARENA, objective: 'Battez le champion du Phénix dans l’arène.', encounterLabel: 'Tournoi : le Phénix',
    encounterRank: 'elite', enemyVisualIds: ['phoenix_champion', 'phoenix_guardian'], postCombatDialogueId: 'finale_phoenix_verdict',
    rewards: { gold: 60, reputation: 0, materials: {} } },
  { id: 'finale_serpent_final', sceneId: ARENA, objective: 'Remportez la finale du Tournoi contre le champion du Serpent.',
    encounterLabel: 'Finale du Tournoi', encounterRank: 'boss', isBoss: true, bossVisualId: 'serpent_champion', escortVisualIds: ['serpent_raider'],
    preCombatDialogueId: 'finale_pre_serpent_final', postCombatDialogueId: 'finale_betrayal', rewards: { gold: 100, reputation: 0, materials: {} } },
  { id: 'finale_arena_assault', sceneId: ARENA, objective: 'Survivez à l’assaut des démons et quittez l’arène.', encounterLabel: 'L’arène en flammes',
    encounterRank: 'boss', isBoss: true, bossVisualId: 'demon_champion', escortVisualIds: ['breach_demon', 'breach_demon'],
    postCombatDialogueId: 'finale_arena_assault_aftermath', rewards: { gold: 0, reputation: 0, materials: {} } },
  { id: 'finale_burning_streets', sceneId: CAPITAL, objective: 'Frayez-vous un chemin dans les rues en flammes.', encounterLabel: 'Rues en flammes',
    enemyVisualIds: ['breach_demon', 'breach_demon'], rewards: { gold: 60, reputation: 0, materials: {} } },
  { id: 'finale_demon_square', sceneId: CAPITAL, objective: 'Abattez le démon qui tient la grande place.', encounterLabel: 'Place des démons',
    encounterRank: 'elite', enemyVisualIds: ['demon_brute', 'breach_demon'], rewards: { gold: 80, reputation: 0, materials: { red_gem: 1 } } },
  { id: 'finale_breach', sceneId: ARENA, objective: 'Abattez Maelor, puis ce qui le suit hors de la brèche.', encounterLabel: 'La brèche',
    encounterRank: 'boss', isBoss: true, bossVisualId: 'maelor_traitor', escortVisualIds: ['breach_demon'],
    phases: [{ label: 'L’entité de la brèche', bossVisualId: 'breach_entity', escortVisualIds: ['breach_demon', 'breach_demon'] }],
    preCombatDialogueId: 'finale_breach_confrontation', postCombatDialogueId: 'finale_breach_aftermath', rewards: { gold: 0, reputation: 1, materials: {} } },
]);

/** Optional encounter and guardian, built from the topology as the plateaux's are. */
export function finaleOptionalCombats(): FinaleCombatInput[] {
  return [
    ...FINALE_OPTIONAL_POIS.flatMap((poi) => poi.combat?.variants.map((variant) => ({
      id: variant.id, sceneId: poi.combat!.sceneId, objective: 'Remportez ce combat facultatif.', encounterLabel: poi.label,
      encounterRank: 'normal' as const, enemyVisualIds: [...variant.enemyVisualIds], escortVisualIds: [], maxPlayerUnits: 4,
      rewards: { gold: poi.combat!.rewards.temporaryGold, reputation: poi.combat!.rewards.reputation, materials: { ...poi.combat!.rewards.materials } },
    })) ?? []),
    ...FINALE_GUARDIANS.map((guardian) => ({
      id: guardian.combat.id, sceneId: guardian.combat.sceneId, objective: 'Affrontez le gardien pour ouvrir son coffre.',
      encounterLabel: guardian.label, encounterRank: 'elite' as const, enemyVisualIds: [...guardian.combat.enemies], escortVisualIds: [],
      maxPlayerUnits: 3, waves: 2,
      rewards: { gold: guardian.combat.rewards.temporaryGold, reputation: guardian.combat.rewards.reputation,
        materials: { ...guardian.combat.rewards.materials } },
    })),
  ];
}

/** Post-demo challenges, from the closed condition list of set 1.18.0, with the prime decided by RunSystem. */
export const FINALE_CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = Object.freeze({
  finale_demon_square: { kind: 'no_items', primeRedGems: 2 },
  finale_guardian_ramparts: { kind: 'max_heroes', limit: 3, primeRedGems: 2 },
});

/** The facts a won final-act fight records. */
export const FINALE_VICTORY_FACTS: Readonly<Record<string, Readonly<Record<string, boolean>>>> = Object.freeze({
  finale_raven_bout: Object.freeze({ finaleRavenBoutWon: true }),
  finale_wolf_bout: Object.freeze({ finaleWolfBoutWon: true }),
  finale_phoenix_bout: Object.freeze({ finalePhoenixBoutWon: true }),
  finale_serpent_final: Object.freeze({ finaleSerpentChampionFallen: true }),
  finale_arena_assault: Object.freeze({ finaleArenaEscaped: true }),
  finale_breach: Object.freeze({ finaleEntityDefeated: true }),
});

// ---------------------------------------------------------------------------------------------------------------------
// Clan supports and enemy-clan foes (F3), approved with the final act (OD-2026-11-09-A)

export interface ClanSupportDefinition {
  readonly label: string;
  /** An existing skill, non-Ultimate, with its procedural FX signature: the support's effect family. */
  readonly skillId: string;
  readonly family: 'soin' | 'dégâts' | 'altération' | 'protection';
}

/** Each allied clan's support, usable once in each final-act fight. The Serpent, always the finalist, has none. */
export const CLAN_SUPPORTS: Readonly<Partial<Record<CampaignClanId, ClanSupportDefinition>>> = Object.freeze({
  lion: { label: 'Lames du Lion', skillId: 'w_whirl', family: 'dégâts' },
  bear: { label: 'Rempart de l’Ours', skillId: 'p_oathwall', family: 'protection' },
  dragon: { label: 'Sanctuaire du Dragon', skillId: 'w_sanctuary', family: 'soin' },
  scorpion: { label: 'Sceau des érudits', skillId: 'e_binding_seal', family: 'altération' },
  raven: { label: 'Fumée du Corbeau', skillId: 'ni_smoke_bomb', family: 'altération' },
  wolf: { label: 'Piège du Loup', skillId: 'ro_jaw_trap', family: 'dégâts' },
  phoenix: { label: 'Flamme purificatrice', skillId: 'w_purify', family: 'soin' },
});

/** The foe each enemy clan adds to a final-act fight. The Lion is never an enemy (its outcomes make it ally or neutral). */
export const CLAN_FOES: Readonly<Partial<Record<CampaignClanId, string>>> = Object.freeze({
  bear: 'bear_warrior',
  raven: 'raven_scout',
  dragon: 'dragon_guardian',
  wolf: 'wolf_raider',
  scorpion: 'scorpion_scholar',
  phoenix: 'phoenix_guardian',
  serpent: 'serpent_raider',
});

/**
 * Which enemy clans add a foe to each final-act fight. At the Tournament, only the clan fought (an enemy clan is a
 * redoubtable opponent, §3.6); in the arena's chaos, none (the demons); in the capital and at the breach, every enemy
 * clan, in the order the company met them, up to the formation's free places (four foes, or a boss and three escorts).
 */
export const FINALE_ENEMY_CLAN_RULES: Readonly<Record<string, readonly CampaignClanId[] | 'all' | 'none'>> = Object.freeze<Record<string, readonly CampaignClanId[] | 'all' | 'none'>>({
  finale_raven_bout: ['raven'],
  finale_wolf_bout: ['wolf'],
  finale_phoenix_bout: ['phoenix'],
  finale_serpent_final: ['serpent'],
  finale_arena_assault: 'none',
});

/** The order in which enemy clans' foes join a fight: the plateaux's order, rivals with their hosts, then the Serpent. */
export const FINALE_CLAN_ORDER: readonly CampaignClanId[] = Object.freeze(['bear', 'raven', 'dragon', 'wolf', 'scorpion', 'phoenix', 'serpent']);
