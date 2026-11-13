/**
 * Last narrative pass of the high-stakes moments (operator remark in OD-2026-11-13-F), every retouche accepted on the
 * decision sheet of 2026-11-13 (docs/content/drafts/HIGH_STAKES_NARRATIVE_PASS_DRAFT_2026-11-13.md), word for word, in
 * the conditions it was approved for. Lines are text only: no flag, choice, outcome, fight or reward changes.
 */
import { describe, expect, it } from 'vitest';
import { resolveGameDialogue } from '../../game/contextualDialogueContent';
import { createInitialState } from '../../game/store';
import type { DialogueSequence, GameState } from '../../game/types';

const withFlags = (flags: Record<string, boolean> = {}): GameState => {
  const state = createInitialState();
  Object.assign(state.flags, flags);
  return state;
};
const sequenceOf = (id: string, flags?: Record<string, boolean>): DialogueSequence => resolveGameDialogue(id, withFlags(flags))!.sequence;
const step = (id: string, stepId: string, flags?: Record<string, boolean>) => sequenceOf(id, flags).steps.find((candidate) => candidate.id === stepId);

describe('the betrayal and the breach (A2 to A5)', () => {
  it('lets Marian close the betrayal on Maelor’s « Je dis seulement… »', () => {
    expect(step('finale_betrayal', 'alistair')!.next).toBe('marian');
    expect(step('finale_betrayal', 'marian')).toMatchObject({ speaker: 'Marian', next: null,
      text: '“Je dis seulement…” Il nous l’a répété à chaque Sceau. C’était pour eux qu’il parlait.' });
  });

  it('answers Maelor’s question at the breach and gives him his own last words', () => {
    const breach = sequenceOf('finale_breach_confrontation');
    expect(breach.steps.map((candidate) => candidate.id)).toEqual(['1', '2', '2b', '3', '4']);
    expect(breach.steps[2]).toMatchObject({ speaker: 'Marian', text: 'Ils nous servaient à refermer ce que tu ouvres.' });
    expect(breach.steps[4]!.text).toBe('Alors venez. Je compterai ce qu’il restera de vous.');
  });

  it('closes the act on Bois-Clair', () => {
    expect(step('finale_act_end', '1')!.text)
      .toBe('Refermer la brèche, maintenant. Ce qui suivra dépendra de tout ce que nous avons fait depuis Bois-Clair.');
  });
});

describe('the endings (B1, B2)', () => {
  it('keeps Séraphine’s « notre clan » to the end', () => {
    expect(step('finale_epilogue_respect', 'clan')!.text)
      .toBe('Notre clan avait perdu ses terres et sa place. Aujourd’hui, il retrouve son honneur, et devient un pilier de la nouvelle alliance.');
    expect(step('finale_epilogue_balance', 'clan')!.text)
      .toBe('Notre clan regagne une part de son honneur. Le reste, il faudra le mériter, dans un monde encore divisé.');
  });

  it('says the price of the Fear ending’s victory', () => {
    expect(step('finale_epilogue_fear', 'breach')!.text)
      .toBe('La brèche se referme. Les Ombres Silencieuses sont vaincues, et personne ne s’en réjouit avec nous.');
  });
});

describe('the Tournament and the chiefs (C1 to C4)', () => {
  it('lets the Serpent final remember the Lion’s outcome, and says nothing without one', () => {
    expect(step('finale_pre_serpent_final', 'lion', { serpentGeneralDefeated: true })).toMatchObject({ speaker: 'Kestrel',
      text: 'Leur général est tombé sous nos lames, dans les terres du Lion. Le Serpent ne l’a pas oublié.' });
    expect(step('finale_pre_serpent_final', 'lion', { lionTrialWon: true })!.text)
      .toBe('Leur général court toujours, depuis les terres du Lion. Le Serpent n’en a pas fini avec nous.');
    expect(sequenceOf('finale_pre_serpent_final').steps.map((candidate) => candidate.id)).toEqual(['1', '2']);
  });

  it('lets a chief who refused the Seal say so, and keeps the requested trial’s words', () => {
    const chiefs = [
      { id: 'bear_borin_pre_combat', plateau: 'bear', refused: 'Vous réclamez mon Sceau, mais la montagne ne vous le confie pas. Alors gagnez-le selon sa loi : mes guerriers et moi, contre votre compagnie.',
        requested: 'Vous voulez mon Sceau par la force ? Alors gagnez-le selon la loi de la montagne : mes guerriers et moi, contre votre compagnie.', answer: 'Nous l’assumerons.' },
      { id: 'dragon_kaelen_pre_combat', plateau: 'dragon', refused: 'Vous réclamez mon Sceau, et les Pics ne vous le confient pas. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie.',
        requested: 'Vous voulez mon Sceau sans le mériter. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie.', answer: 'Que les Pics regardent, alors.' },
      { id: 'scorpion_inquisitor_pre_combat', plateau: 'scorpion', refused: 'Vous réclamez mon Sceau, mais rien dans mes registres ne me permet de vous le confier. Seule la vérité, même amère, peut sauver ce monde ; voyons ce que vaut la vôtre. Mes érudits et moi, contre votre compagnie.',
        requested: 'Vous voulez mon Sceau par la force plutôt que par ma confiance. Soit. Seule la vérité, même amère, peut sauver ce monde ; voyons ce que vaut la vôtre. Mes érudits et moi, contre votre compagnie.', answer: 'Qu’ils consignent aussi ceci.' },
    ];
    for (const chief of chiefs) {
      const selected = `${chief.plateau}FinaleTrialSelected`;
      const requested = `${chief.plateau}TrialRequested`;
      expect(step(chief.id, '1', { [selected]: true })!.text, chief.id).toBe(chief.refused);
      expect(step(chief.id, '1', { [selected]: true, [requested]: true })!.text, chief.id).toBe(chief.requested);
      expect(step(chief.id, '2')!.text, chief.id).toBe(chief.answer);
    }
  });

  it('lets each chief rally in the first person', () => {
    const rally = sequenceOf('finale_allied_rally', { serpentGeneralDefeated: true, bearMasterSpyDefeated: true,
      dragonShadowShamanDefeated: true, scorpionShadowProphetDefeated: true });
    const line = (id: string) => rally.steps.find((candidate) => candidate.id === id)!.text;
    expect(line('lion')).toBe('Le Lion n’a pas oublié votre jugement. Mes guerriers marchent avec vous.');
    expect(line('bear')).toBe('Vous avez rendu leurs galeries à mes mineurs. Mes guerriers tiendront cette rue avec vous.');
    expect(line('dragon')).toBe('Le Dragon pèse longtemps, et il n’oublie pas. Mes gardiens sont à vos côtés.');
    expect(line('scorpion')).toBe('Mes érudits ont tout consigné, même ceci : le Scorpion se tient avec vous.');
    expect(rally.steps.filter((candidate) => candidate.text.includes('tiennent parole'))).toEqual([]);
  });
});

describe('the plateaux and the Lion (D1, D2)', () => {
  it('gives each plateau’s witnesses their own words', () => {
    expect(step('bear_miners_testimony', 'protected')!.text).toBe('Merci. Nous marcherons avec vous, mais nous parlerons pour nous.');
    expect(step('dragon_freed_pilgrims', 'protected')!.text).toBe('Merci. Nous monterons avec vous, mais devant l’Ancien Kaelen, nos mots seront les nôtres.');
    expect(step('scorpion_temple_witnesses', 'protected')!.text).toBe('Merci. Nous vous suivrons, mais devant le Grand Inquisiteur, c’est le Phénix qui parlera.');
  });

  it('no longer burns Bois-Clair’s coffers that leave by the low gate', () => {
    expect(step('village_choice', '1')!.text)
      .toBe('Ils emmènent les enfants vers le nord. Ils emportent déjà les coffres du village. Aidez-nous — ils reviendront avant la nuit.');
  });
});
