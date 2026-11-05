import { describe, expect, it } from 'vitest';
import { dialogues } from './content';
import { buildLionFinaleJudgement } from './lionFinale';
import { createInitialState } from './store';
import { resolveFinalDialoguePresentationPlan } from '../cinematics/DialoguePresentationSegments';
import { resolveGameDialogue } from './contextualDialogueContent';
import type { GameState } from './types';

// OD-2026-11-04-C: operator-approved narrative pass. Text changes only; flags, gold, reputation and combats stay as they were.
function stateWith(flags: Record<string, boolean>, reputation = 30): GameState {
  const state = createInitialState();
  state.flags = { ...flags };
  state.reputation = reputation;
  return state;
}

const SAVED = { helpedRefugees: true, prioritizedVillage: true, missionSuccess: true, protectedWitnesses: true };

describe('Narrative pass OD-2026-11-04-C', () => {
  it('names the low gate for what it is while keeping its greed mechanics', () => {
    const choice = dialogues.get('village_choice')!.steps.find((step) => step.id === '5')!.choices![1]!;
    expect(choice.text).toBe('Prendre la porte basse et emporter les coffres pour le clan.');
    expect(choice.effects).toEqual([
      { type: 'setFlag', key: 'missionSuccess', value: false },
      { type: 'setFlag', key: 'missionGreed', value: true },
      { type: 'addGold', amount: 200 },
      { type: 'addReputation', amount: -10 },
      { type: 'startCombat', combatId: 'village_raid' },
    ]);
  });

  it('echoes the carried list of the dead at the judgement without changing the verdict', () => {
    const echo = 'Vous avez aussi porté la liste des morts de Bois-Clair.';
    const outcome = (flags: Record<string, boolean>) => buildLionFinaleJudgement(stateWith(flags)).steps.find((step) => step.id === 'outcome')!;
    const withNames = buildLionFinaleJudgement(stateWith({ ...SAVED, r5CarriedBoisClairNames: true }));
    const without = buildLionFinaleJudgement(stateWith(SAVED));
    expect(outcome({ ...SAVED, r5CarriedBoisClairNames: true }).text).toContain(echo);
    expect(outcome(SAVED).text).not.toContain(echo);
    expect(withNames.steps.map((step) => step.id)).toEqual(without.steps.map((step) => step.id));
    expect(withNames.steps.at(-1)!.choices).toEqual(without.steps.at(-1)!.choices);
  });

  it('gives the dragon nest description to Kestrel and stages Kestrel in the tableau', () => {
    const roost = dialogues.get('mystery_dragon_roost')!;
    expect(roost.steps[0]).toMatchObject({ speaker: 'Kestrel', actorId: 'kestrel' });
    expect(roost.steps[0]!.text).toContain('Au-dessus des ruines');
    const plan = resolveFinalDialoguePresentationPlan('mystery_dragon_roost', roost)!;
    expect(plan.segments[0]!.visibleCast).toContain('kestrel');
    expect(plan.segments[0]!.actors.length).toBeLessThanOrEqual(4);
    expect(plan.segments[0]!.stepDirections.find((direction) => direction.stepId === '1')!.speakerId).toBe('kestrel');
  });

  it('keeps a single Maelor line before the gates, with and without the recruits', () => {
    const base = dialogues.get('final_refuge')!;
    expect(base.steps.map((step) => step.id)).toEqual(['1', '2', '4', '5', '6']);
    const recruits: Record<string, boolean>[] = [{}, { recruitedCedric: true }, { recruitedLancer: true }, { recruitedCedric: true, recruitedLancer: true }];
    for (const flags of recruits) {
      const sequence = resolveGameDialogue('final_refuge', stateWith(flags))!.sequence;
      expect(sequence.steps.filter((step) => step.actorId === 'maelor')).toHaveLength(1);
      const plan = resolveFinalDialoguePresentationPlan('final_refuge', sequence)!;
      expect(plan.segments.flatMap((segment) => segment.stepIds)).toEqual(sequence.steps.map((step) => step.id));
    }
  });
});
