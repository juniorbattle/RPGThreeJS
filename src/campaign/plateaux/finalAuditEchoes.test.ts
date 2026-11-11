import { describe, expect, it } from 'vitest';
import { resolvePostDemoDialogue, PLATEAU_FINALES } from '../../game/postDemoContent';
import { buildPlateauJudgement } from '../../game/plateauFinale';
import { createInitialState } from '../../game/store';
import type { GameState } from '../../game/types';

const withFlags = (flags: Record<string, boolean>, reputation = 30): GameState => {
  const state = createInitialState();
  Object.assign(state.flags, flags);
  state.reputation = reputation;
  return state;
};
const text = (state: GameState, id: string, step: string) =>
  resolvePostDemoDialogue(id, state)!.steps.find((candidate) => candidate.id === step)?.text;

describe('approved echoes across plateaux (OD-2026-11-11-E, final audit B7)', () => {
  it('a: a Tournament champion whose clan is already allied says so, and the outcome lines and hints follow', () => {
    const allied = withFlags({ bearMinesAbandoned: true });
    expect(text(allied, 'finale_raven_verdict', '2')).toBe('Dans les galeries de l’Ours, vous avez tenu parole au Corbeau. Ici, l’arène ne connaît pas les dettes. Faites de moi ce que vous voudrez.');
    expect(text(allied, 'finale_raven_verdict', 'spared')).toBe('Deux fois que vous tenez parole envers le Corbeau. Il ne l’oubliera pas.');
    expect(text(allied, 'finale_raven_verdict', 'humiliated')).toBe('Il nous croyait alliés. Ce que le Corbeau nous devait, nous venons de l’effacer.');
    const choices = resolvePostDemoDialogue('finale_raven_verdict', allied)!.steps.find((step) => step.id === 'choice')!.choices ?? [];
    expect(choices.map((choice) => choice.outcomePreview?.hints)).toEqual([
      ['Le clan du Corbeau reste votre allié', 'Une parole tenue deux fois'], ['Les tribunes acclament', 'Une alliance trahie']]);
    expect(choices[0]!.effects).toContainEqual({ type: 'setClanRelation', clan: 'raven', stance: 'ally', cause: 'finale.tournament.raven' });
    expect(text(withFlags({ dragonWolfAlliance: true }), 'finale_wolf_verdict', '2')).toBe('Aux Pics, vous avez laissé le Cristal au Loup. Je n’attendais pas de vous retrouver de l’autre côté de l’arène. Finissez-en.');
    expect(text(withFlags({ scorpionCodexProtected: true }), 'finale_phoenix_verdict', 'spared')).toBe('Vous avez épargné notre flamme au temple, et moi dans cette arène. Le Phénix vous restera fidèle.');
    // Without the plateau's alliance, the verdict is the one already canon.
    expect(text(withFlags({}), 'finale_raven_verdict', '2')).toBe('Achevez ce que vous avez commencé. Le Corbeau ne demande rien à personne.');
  });

  it('b: the Dragon nest remembers the Lion nest, without saying it is the same dragon', () => {
    expect(text(withFlags({ sparedYoungDragon: true }), 'dragon_young_dragon', 'lion')).toBe('Ce n’est pas le premier jeune dragon que nous croisons. Dans les terres du Lion, nous avions scellé un nid sans y toucher.');
    expect(text(withFlags({ challengedYoungDragon: true }), 'dragon_young_dragon', 'lion')).toBe('Dans les terres du Lion, nous avons chassé un jeune dragon pour ses gemmes. Celui-ci ne pourrait même pas se défendre.');
    const untouched = resolvePostDemoDialogue('dragon_young_dragon', withFlags({}))!;
    expect(untouched.steps.map((step) => step.id)).toEqual(['1', '2', '3', 'choice', 'tended', 'scales']);
    expect(untouched.steps[1]!.next).toBe('3');
  });

  it('c: each chief says the company’s credibility at the judgement, by the existing tiers', () => {
    const bear = PLATEAU_FINALES.bear!;
    const line = (reputation: number) => buildPlateauJudgement(bear, withFlags({}, reputation)).steps.find((step) => step.id === 'credibility')?.text;
    expect(line(70)).toBe('Votre nom est arrivé ici avant vous, et il pèse lourd. Quand vous parlez, la montagne ne se méfie pas.');
    expect(line(55)).toBe('On parle de vous dans les vallées, et pas seulement en mal. Je veux bien vous croire sur parole.');
    expect(line(20)).toBe('Votre nom est arrivé avant vous, et il ne plaide pas pour vous. Vos paroles ne pèseront que ce que pèsent vos actes.');
    const scorpion = buildPlateauJudgement(PLATEAU_FINALES.scorpion!, withFlags({}, 90)).steps.find((step) => step.id === 'credibility');
    expect(scorpion?.speaker).toBe('Grand Inquisiteur');
    expect(scorpion?.text).toBe('Mes érudits ont aussi noté ce que l’on dit de vous, et cela vous honore. Votre parole entre dans mes registres sans réserve.');
  });
});
