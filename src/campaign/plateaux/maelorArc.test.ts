/**
 * Maelor's full arc, on the operator's intent of 2026-11-13 (docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md):
 * he caused the clan's fall by turning the other clans against it, then joined it and made the Seals the measure of its
 * worth, the Seals being also the key of the demons' sealed rift. Every line below was approved word for word by the
 * operator on 2026-11-13 (docs/content/drafts/MAELOR_ARC_DRAFT_2026-11-13.md): the confession at the betrayal (C1), five
 * discreet hints (I1 to I5) and four coherence retouches (R1 to R4). Lines are text only: no flag, choice, outcome,
 * fight, reward or saved field changes, and no actor joins a scene.
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
const cast = (sequence: DialogueSequence) => [...new Set(sequence.steps.map((candidate) => candidate.actorId))].sort();

const WHY = 'Pourquoi nous ?';
const FALL = 'Parce qu’il me fallait un clan à terre. Votre chute, c’est moi : j’ai soufflé à chaque clan ce qu’il voulait croire de vous, et vos alliés ont rompu leurs serments l’un après l’autre.';
const JOIN = 'Puis je suis venu tenir vos comptes. Un clan déchu fait tout pour se relever ; je n’avais qu’à faire des Sceaux la mesure de votre valeur. Aucun seigneur ne me les aurait remis. À vous, ils les ont donnés un à un.';
const KEY = 'Vos Sceaux : votre réussite, votre valeur… et la clé de la faille où les démons sont scellés. Regardez.';

describe('the confession at the betrayal (C1)', () => {
  const variants: readonly [string, Record<string, boolean>, readonly string[]][] = [
    ['without a Bois-Clair line', {}, ['open', 'reveal', 'advice', 'why', 'fall', 'join', 'breach', 'champion', 'flee', 'alistair', 'marian']],
    ['with the Bois-Clair line and followed advice', { missionGreed: true, bearMinesSeized: true },
      ['open', 'reveal', 'boisclair', 'advice', 'why', 'fall', 'join', 'breach', 'champion', 'flee', 'alistair', 'marian']],
  ];

  for (const [label, flags, order] of variants) {
    it(`asks why, then confesses the whole plan before the breach, ${label}`, () => {
      const betrayal = sequenceOf('finale_betrayal', flags);
      expect(betrayal.steps.map((candidate) => candidate.id)).toEqual(order);
      expect(step('finale_betrayal', 'advice', flags)!.next).toBe('why');
      expect(step('finale_betrayal', 'why', flags)).toMatchObject({ speaker: 'Alistair', actorId: 'alistair', text: WHY, next: 'fall' });
      expect(step('finale_betrayal', 'fall', flags)).toMatchObject({ speaker: 'Maelor', actorId: 'maelor', text: FALL, next: 'join' });
      expect(step('finale_betrayal', 'join', flags)).toMatchObject({ speaker: 'Maelor', actorId: 'maelor', text: JOIN, next: 'breach' });
      expect(step('finale_betrayal', 'breach', flags)).toMatchObject({ speaker: 'Maelor', text: KEY, next: 'champion' });
    });
  }

  it('changes no mechanic: the breach still opens on its own step, with no choice anywhere', () => {
    const betrayal = sequenceOf('finale_betrayal', { missionGreed: true, silencedWitnesses: true });
    expect(betrayal.steps.filter((candidate) => candidate.effects.length).map((candidate) => candidate.id)).toEqual(['breach']);
    expect(step('finale_betrayal', 'breach')!.effects).toEqual([{ type: 'setFlag', key: 'finaleBreachOpened', value: true }]);
    expect(betrayal.steps.every((candidate) => !candidate.choices?.length)).toBe(true);
    expect(step('finale_betrayal', 'flee')!.text).toBe('Nous nous reverrons au cœur de la brèche.');
  });

  it('brings no new actor into the scene', () => {
    expect(cast(sequenceOf('finale_betrayal', { missionGreed: true })))
      .toEqual(['alistair', 'kestrel', 'maelor', 'marian', 'sage_seraphine']);
  });
});

describe('the coherence retouches (R1 to R4)', () => {
  it('starts the Bois-Clair line with « À Bois-Clair déjà » (R1)', () => {
    expect(step('finale_betrayal', 'boisclair', { missionGreed: true })!.text)
      .toBe('À Bois-Clair déjà, je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres pendant que les captifs partaient au nord.');
  });

  it('lets Alistair answer the confession at the breach (R2)', () => {
    expect(step('finale_breach_confrontation', '3')).toMatchObject({ speaker: 'Alistair',
      text: 'Tu nous as fait tomber, puis tu as marché avec nous, Maelor. Ici, ça s’arrête.' });
  });

  it('says Maelor led the company, at the last vigil (R3)', () => {
    expect(step('finale_last_vigil', 'evidence', { shadowRevealed: true })!.text)
      .toBe('Voici ce que nous savons des Ombres : les preuves des Ombres confiées à Alaric. La même marque, partout où Maelor nous a menés.');
  });

  it('lets the beaten Master Spy name the Seals (R4)', () => {
    expect(step('bear_master_spy_aftermath', '1')!.text)
      .toBe('Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses. De vos Sceaux, par exemple.');
  });
});

describe('the discreet hints (I1 to I5)', () => {
  it('lets Alaric remember a strange fall, and Maelor sweep the old oaths aside (I1), on the locked steps', () => {
    const audience = sequenceOf('lion_briefing');
    // The Lion's dialogue is in the generated presentation lock: same steps, same speakers, same choices.
    expect(audience.steps.map((candidate) => `${candidate.id}@${candidate.actorId}@${candidate.choices?.length ?? 0}`).join('|'))
      .toBe('1@alaric@0|1a@alaric@0|1b@alistair@0|2@sage_seraphine@0|3@maelor@2|4@alaric@0|5@alaric@0');
    expect(step('lion_briefing', '1a')!.text).toBe('Je me souviens de votre chute. Vos alliés ont rompu leurs serments l’un après l’autre, comme si on leur avait soufflé les mêmes mots. Ici, je ne demande pas une parade : revenez répondre de vos décisions. Mes éclaireurs, les survivants et le Sceau lui-même distingueront un secours d’un pillage.');
    expect(step('lion_briefing', '3')!.text).toBe('Laissons les vieux serments où ils sont : ils ne nourrissent pas une compagnie. Si Alaric exige que nous sauvions son village, demander de quoi tenir la route n’est pas une offense : c’est dire honnêtement ce que notre clan peut encore payer.');
  });

  it('lets Marian tie Maelor’s advice to the clan’s fall, at Borin’s audience (I2)', () => {
    expect(step('bear_audience', 'alistair')).toMatchObject({ speaker: 'Marian', next: 'mandate',
      text: 'Nous ne sommes pas venus vider la montagne d’un autre clan. Des clans dressés l’un contre l’autre : c’est ainsi que le nôtre est tombé.' });
  });

  it('lets Kaelen say what a Seal opens, between Elara and the mandate (I3)', () => {
    const audience = sequenceOf('dragon_audience');
    expect(step('dragon_audience', 'alistair')!.next).toBe('seal');
    expect(step('dragon_audience', 'seal')).toMatchObject({ speaker: 'Ancien Dragon Kaelen', actorId: 'kaelen', next: 'mandate',
      text: 'Un Sceau ne se vend pas non plus. Ce qu’il ouvre, il peut aussi le refermer, et le Dragon veille à qui il le confie.' });
    expect(cast(audience)).toEqual(['elara', 'kaelen', 'maelor', 'sage_seraphine']);
  });

  it('lets the Scorpion’s archives doubt the fall, and Maelor turn to the codex (I4)', () => {
    const audience = sequenceOf('scorpion_audience');
    expect(audience.steps.slice(0, 5).map((candidate) => candidate.id)).toEqual(['open', 'seals', 'archives', 'dodge', 'request']);
    expect(step('scorpion_audience', 'archives')).toMatchObject({ speaker: 'Grand Inquisiteur',
      text: 'Nos archives gardent aussi la chute de votre clan. Vos alliés se sont tous retournés contre vous, sur la foi des mêmes rumeurs. Le Scorpion n’a jamais cru à ce hasard-là.' });
    expect(step('scorpion_audience', 'dodge')).toMatchObject({ speaker: 'Intendant Maelor', actorId: 'maelor',
      text: 'Les archives gardent ce qu’on leur raconte, Grand Inquisiteur. Parlons plutôt du codex.' });
    expect(cast(audience)).toEqual(['grand_inquisitor', 'kestrel', 'maelor', 'sage_seraphine']);
  });

  it('gives Maelor one word at the Tournament’s gates (I5)', () => {
    expect(step('finale_arrival', '4')).toMatchObject({ speaker: 'Intendant Maelor',
      text: 'Enfin. Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire.' });
  });

  it('adds no choice to the audiences: each mandate keeps its two choices', () => {
    for (const id of ['dragon_audience', 'scorpion_audience']) {
      const choices = sequenceOf(id).steps.filter((candidate) => candidate.choices?.length);
      expect(choices.map((candidate) => [candidate.id, candidate.choices!.length])).toEqual([['mandate', 2]]);
    }
  });
});
