import { createRecruitInstance, unitById } from './catalog';
import { resolveGameDialogue } from './contextualDialogueContent';
import { getRunNode } from './runSystem';
import type { GameState } from './types';

/**
 * Recruitment rules (OD-2026-11-11-F, F2). Truth owner: this module, on the RunSystem side; dialogues and the refuge
 * screen only ask for a recruit.
 *
 * - Eight heroes can join the four the chronicle starts with: Cedric and Garen in the Lion, then two per post-demo
 *   plateau (heroMeetings.ts). Each is met once on the map; the company holds at most its maximum size (12).
 * - A hero met but not recruited can be engaged later at a refuge, for more gold and under the same conditions as the
 *   meeting. The six post-demo heroes wait at the refuge their farewell names; Cedric and Garen, whose lines name none,
 *   at any refuge. A hero the meeting closed for good (Eldwin, when the faithful was left to the scholars) stays closed.
 */
interface SecondChance {
  unitId: string;
  /** The map node of the meeting; resolving it is what "met" means. */
  nodeId: string;
  metAt: string;
  /** The refuge the hero's farewell names, where the hero waits; any refuge when absent. */
  refugeNodeId?: string;
  price: number;
  /** The meeting's reputation floor: a number, or read from the Lion's calibrated meeting dialogue. */
  reputationMin: number | { dialogueId: string };
  reputationMax?: number;
  /** The meeting closed this hero for good unless this fact holds. */
  closedUnlessFlag?: string;
  /** A repair the meeting asked for, owed again at the refuge when its fact holds. */
  repair?: { flag: string; gold: number };
}

const SECOND_CHANCES: readonly SecondChance[] = Object.freeze([
  { unitId: 'rogue', nodeId: 'lion-nomad-crossroads', metAt: 'Croisement du rôdeur', price: 80, reputationMin: { dialogueId: 'mystery_recruit' } },
  { unitId: 'lancer', nodeId: 'lion-lancer-recruit', metAt: 'Volontaire de Bois-Clair', price: 60, reputationMin: { dialogueId: 'mystery_lancer_recruit' } },
  { unitId: 'artillerist', nodeId: 'bear-ore-convoy', metAt: 'Convoi de minerai', price: 180, reputationMin: 0, refugeNodeId: 'bear-second-refuge' },
  { unitId: 'paladin', nodeId: 'bear-final-trial-event', metAt: 'Sanctuaire de la montagne', price: 60, reputationMin: 55, refugeNodeId: 'bear-final-refuge',
    repair: { flag: 'bearShrinePlundered', gold: 50 } },
  { unitId: 'red_mage', nodeId: 'dragon-terrorized-village', metAt: 'Hameau terrorisé', price: 60, reputationMin: 45, refugeNodeId: 'dragon-first-refuge',
    repair: { flag: 'dragonVillageExtorted', gold: 60 } },
  { unitId: 'ninja', nodeId: 'dragon-first-trial-event', metAt: 'Pièges du Loup', price: 220, reputationMin: 0, refugeNodeId: 'dragon-second-refuge' },
  { unitId: 'enchanter', nodeId: 'scorpion-scholars', metAt: 'Érudits du Scorpion', price: 80, reputationMin: 60, refugeNodeId: 'scorpion-first-refuge',
    closedUnlessFlag: 'scorpionFaithfulFreed' },
  { unitId: 'dark_knight', nodeId: 'scorpion-second-trial-event', metAt: 'Bibliothèque ensevelie', price: 260, reputationMin: 0, reputationMax: 65,
    refugeNodeId: 'scorpion-second-refuge' },
]);

/** Every hero a chronicle can recruit beyond its four starting members. */
export const RECRUITABLE_HERO_IDS: readonly string[] = Object.freeze(SECOND_CHANCES.map((chance) => chance.unitId));

/** Whether a recruit effect may add this hero now: a recruitable hero, not already present, room in the company. */
export function canRecruit(state: Readonly<GameState>, unitId: string): boolean {
  return RECRUITABLE_HERO_IDS.includes(unitId)
    && state.clan.members.length < state.clan.maxSize
    && !state.clan.members.some((unit) => unit.definitionId === unitId || unit.id === unitId);
}

export interface RefugeHireOffer {
  unitId: string;
  name: string;
  className: string;
  metAt: string;
  price: number;
  reputationMin: number;
  reputationMax?: number;
  /** Why the offer cannot be taken now, or null when it can. */
  blocked: string | null;
}

/** The Lion's calibrated meeting condition: the reputation floor of the dialogue choice that recruits this hero. */
function dialogueReputationMin(dialogueId: string, unitId: string, state: Readonly<GameState>): number {
  const sequence = resolveGameDialogue(dialogueId, state)?.sequence;
  const choice = sequence?.steps.flatMap((step) => step.choices ?? [])
    .find((candidate) => candidate.effects.some((effect) => effect.type === 'recruitUnit' && effect.unitId === unitId));
  return choice?.requiresReputationMin ?? 0;
}

/**
 * The heroes the company met but has not recruited and who wait at this refuge (the run's current node by default),
 * with their price and what still blocks them.
 */
export function refugeHireOffers(state: Readonly<GameState>, refugeNodeId: string | undefined = getRunNode(state.run)?.id): RefugeHireOffer[] {
  const roomLeft = state.clan.members.length < state.clan.maxSize;
  return SECOND_CHANCES
    .filter((chance) => state.resolvedNodeIds.includes(chance.nodeId)
      && (!chance.refugeNodeId || chance.refugeNodeId === refugeNodeId)
      && !(chance.closedUnlessFlag && !state.flags[chance.closedUnlessFlag])
      && !state.clan.members.some((unit) => unit.definitionId === chance.unitId || unit.id === chance.unitId))
    .map((chance) => {
      const definition = unitById.get(chance.unitId);
      const reputationMin = typeof chance.reputationMin === 'number'
        ? chance.reputationMin : dialogueReputationMin(chance.reputationMin.dialogueId, chance.unitId, state);
      const price = chance.price + (chance.repair && state.flags[chance.repair.flag] ? chance.repair.gold : 0);
      const blocked = !roomLeft ? 'La compagnie est au complet.'
        : state.reputation < reputationMin ? `Réputation insuffisante : ${reputationMin} demandés.`
          : chance.reputationMax !== undefined && state.reputation > chance.reputationMax ? `Réputation trop haute : ${chance.reputationMax} au plus.`
            : state.gold < price ? `Or insuffisant : ${price} demandés.`
              : null;
      return {
        unitId: chance.unitId, name: definition?.name ?? chance.unitId, className: definition?.className ?? '',
        metAt: chance.metAt, price, reputationMin, ...(chance.reputationMax !== undefined ? { reputationMax: chance.reputationMax } : {}), blocked,
      };
    });
}

/** Engages one offered hero: revalidated here, gold paid and the hero joins, or nothing changes. */
export function hireAtRefuge(state: GameState, unitId: string, refugeNodeId: string | undefined = getRunNode(state.run)?.id): boolean {
  const offer = refugeHireOffers(state, refugeNodeId).find((candidate) => candidate.unitId === unitId);
  if (!offer || offer.blocked || !canRecruit(state, unitId)) return false;
  state.gold -= offer.price;
  state.clan.members.push(createRecruitInstance(unitId));
  return true;
}
