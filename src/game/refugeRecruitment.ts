import { createRecruitInstance, unitById } from './catalog';
import { resolveGameDialogue } from './contextualDialogueContent';
import type { GameState } from './types';

/**
 * OD-2026-11-11-F (F2): a hero the company met on the map but did not recruit can be engaged later at a refuge, for more
 * gold and under the same reputation condition as the meeting. Truth owner: this module (RunSystem side); the refuge
 * screen only lists the offers and asks for one. The meeting stays the story's moment: no line is added here.
 */
interface SecondChance {
  unitId: string;
  /** The map node of the meeting; resolving it is what "met" means. */
  nodeId: string;
  dialogueId: string;
  metAt: string;
  price: number;
}

const SECOND_CHANCES: readonly SecondChance[] = Object.freeze([
  { unitId: 'rogue', nodeId: 'lion-nomad-crossroads', dialogueId: 'mystery_recruit', metAt: 'Croisement du rôdeur', price: 80 },
  { unitId: 'lancer', nodeId: 'lion-lancer-recruit', dialogueId: 'mystery_lancer_recruit', metAt: 'Volontaire de Bois-Clair', price: 60 },
]);

export interface RefugeHireOffer {
  unitId: string;
  name: string;
  className: string;
  metAt: string;
  price: number;
  reputationMin: number;
  /** Why the offer cannot be taken now, or null when it can. */
  blocked: string | null;
}

/** The meeting's reputation condition, as the game plays it (the calibrated dialogue choice that recruits this hero). */
function meetingReputationMin(chance: SecondChance, state: Readonly<GameState>): number {
  const sequence = resolveGameDialogue(chance.dialogueId, state)?.sequence;
  const choice = sequence?.steps.flatMap((step) => step.choices ?? [])
    .find((candidate) => candidate.effects.some((effect) => effect.type === 'recruitUnit' && effect.unitId === chance.unitId));
  return choice?.requiresReputationMin ?? 0;
}

/** The heroes the company met but has not recruited, with their price and what still blocks them. */
export function refugeHireOffers(state: Readonly<GameState>): RefugeHireOffer[] {
  const roomLeft = state.clan.members.length < state.clan.maxSize;
  return SECOND_CHANCES
    .filter((chance) => state.resolvedNodeIds.includes(chance.nodeId)
      && !state.clan.members.some((unit) => unit.definitionId === chance.unitId || unit.id === chance.unitId))
    .map((chance) => {
      const definition = unitById.get(chance.unitId);
      const reputationMin = meetingReputationMin(chance, state);
      const blocked = !roomLeft ? 'La compagnie est au complet.'
        : state.reputation < reputationMin ? `Réputation insuffisante : ${reputationMin} demandés.`
          : state.gold < chance.price ? `Or insuffisant : ${chance.price} demandés.`
            : null;
      return {
        unitId: chance.unitId, name: definition?.name ?? chance.unitId, className: definition?.className ?? '',
        metAt: chance.metAt, price: chance.price, reputationMin, blocked,
      };
    });
}

/** Engages one offered hero: revalidated here, gold paid and the hero joins, or nothing changes. */
export function hireAtRefuge(state: GameState, unitId: string): boolean {
  const offer = refugeHireOffers(state).find((candidate) => candidate.unitId === unitId);
  if (!offer || offer.blocked) return false;
  state.gold -= offer.price;
  state.clan.members.push(createRecruitInstance(unitId));
  return true;
}
