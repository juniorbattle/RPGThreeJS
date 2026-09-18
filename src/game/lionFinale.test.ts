import { describe, expect, it } from 'vitest';
import { combatConfigs } from './content';
import {
  assessAlaricBluff,
  buildLionEpilogue,
  buildLionFinaleJudgement,
  buildLionTrialAftermath,
  buildLionTrialPreCombat,
  buildSerpentGeneralAftermath,
  lionBossVictoryFacts,
  resolveLionFinaleExecution,
} from './lionFinale';
import { createInitialState } from './store';
import { resolveLionVerdict } from './lionVerdict';
import type { DialogueSequence, GameState, NarrativeEffect } from './types';

function stateWith(flags: Record<string, boolean>, reputation = 30): GameState {
  const state = createInitialState();
  state.flags = { ...flags };
  state.reputation = reputation;
  return state;
}

const HONOUR_FLAGS = {
  helpedRefugees: true,
  prioritizedVillage: true,
  missionSuccess: true,
  protectedWitnesses: true,
};

function allEffects(dialogue: DialogueSequence): NarrativeEffect[] {
  return dialogue.steps.flatMap((step) => [
    ...step.effects,
    ...(step.choices ?? []).flatMap((choice) => [
      ...choice.effects,
      ...(choice.contest ? [...choice.contest.success.effects, ...choice.contest.failure.effects] : []),
    ]),
  ]);
}

function expectValidTargets(dialogue: DialogueSequence): void {
  const ids = new Set(dialogue.steps.map((step) => step.id));
  for (const step of dialogue.steps) {
    if (step.next) expect(ids.has(step.next), `${dialogue.id}:${step.id}:next`).toBe(true);
    for (const choice of step.choices ?? []) {
      if (choice.next) expect(ids.has(choice.next), `${dialogue.id}:${step.id}:choice`).toBe(true);
    }
  }
}

describe('Lion finale semantic execution', () => {
  it('starts the Serpent boss for an accepted claim', () => {
    const result = resolveLionFinaleExecution({ flags: HONOUR_FLAGS, reputation: 20 }, 'claim_recognition');
    expect(result.route).toBe('serpent_pursuit');
    expect(result.combatId).toBe('serpent_captain');
    expect(result.trialCause).toBeNull();
    expect(result.flagChanges.lionSealAcknowledged).toBe(true);
    expect(result.reputationDelta).toBe(2);
  });

  it('starts the Lion boss for a rejected claim without marking it voluntary', () => {
    const result = resolveLionFinaleExecution({
      flags: { missionGreed: true, silencedWitnesses: true },
      reputation: 80,
    }, 'claim_recognition');
    expect(result.route).toBe('lion_trial');
    expect(result.combatId).toBe('lion_chief');
    expect(result.trialCause).toBe('rejected_claim');
    expect(result.flagChanges.lionTrialRequested).toBe(false);
    expect(result.reputationDelta).toBe(0);
  });

  it('starts the Lion boss for a voluntary trial on an honourable run', () => {
    const result = resolveLionFinaleExecution({ flags: HONOUR_FLAGS, reputation: 50 }, 'request_trial');
    expect(result.route).toBe('lion_trial');
    expect(result.combatId).toBe('lion_chief');
    expect(result.trialCause).toBe('voluntary');
    expect(result.flagChanges.lionTrialRequested).toBe(true);
    expect(result.reputationDelta).toBe(-2);
  });

  it('does not mutate its input or persist a derived verdict', () => {
    const input = { flags: { ...HONOUR_FLAGS }, reputation: 50 };
    const snapshot = structuredClone(input);
    resolveLionFinaleExecution(input, 'claim_recognition');
    expect(input).toEqual(snapshot);
    const state = createInitialState() as GameState & Record<string, unknown>;
    expect(state.alaricTrust).toBeUndefined();
    expect(state.lionTrust).toBeUndefined();
    expect(state.lionVerdictScore).toBeUndefined();
    expect(state.lionVerdict).toBeUndefined();
    expect(state.finalRoute).toBeUndefined();
  });
});

describe('Lion finale contextual dialogue', () => {
  it('acknowledges Bois-Clair, the advance, and cargo in the mixed playtest profile', () => {
    const dialogue = buildLionFinaleJudgement(stateWith({
      lionMandateAdvance: true,
      claimedLostTreasure: true,
      prioritizedLoot: true,
      helpedRefugees: true,
      missionSuccess: true,
      protectedWitnesses: true,
    }));
    const text = dialogue.steps.map((step) => step.text).join('\n');
    expect(text).toContain('Bois-Clair tient encore');
    expect(text).toContain('l’avance réclamée');
    expect(text).toContain('chargement perdu');
    expect(text).toContain('réserves détournées');
    expect(text).not.toContain('Réputation 30');
    expectValidTargets(dialogue);
  });

  it('lets a credible bluff pass when only a minor stain is disputed', () => {
    const state = stateWith({
      lionMandateAdvance: true,
      missionSuccess: true,
      protectedWitnesses: true,
    }, 45);
    const assessment = assessAlaricBluff(resolveLionVerdict({ flags: state.flags, reputation: state.reputation }));
    expect(assessment).toMatchObject({
      succeeds: true,
      minorStainCount: 1,
      reason: 'plausible_framing',
    });

    const dialogue = buildLionFinaleJudgement(state);
    const bluffChoice = dialogue.steps.flatMap((step) => step.choices ?? [])
      .find((choice) => choice.effects.some((effect) => effect.type === 'setFlag' && effect.key === 'alaricBluffSucceeded'));
    expect(bluffChoice).toBeDefined();
    expect(bluffChoice?.next).toBe('bluff-accepted');
    expect(dialogue.steps.find((step) => step.id === 'bluff-accepted')?.text).toMatch(/bénéfice du doute|lecture plausible/i);
  });

  it('exposes a bluff when too many minor traces contradict the framing', () => {
    const state = stateWith({
      lionMandateAdvance: true,
      claimedLostTreasure: true,
      prioritizedLoot: true,
      missionSuccess: true,
      protectedWitnesses: true,
    }, 45);
    const assessment = assessAlaricBluff(resolveLionVerdict({ flags: state.flags, reputation: state.reputation }));
    expect(assessment.succeeds).toBe(false);
    expect(assessment.reason).toBe('too_many_traces');

    const dialogue = buildLionFinaleJudgement(state);
    const bluffChoice = dialogue.steps.flatMap((step) => step.choices ?? [])
      .find((choice) => choice.effects.some((effect) => effect.type === 'setFlag' && effect.key === 'liedToAlaric'));
    expect(bluffChoice).toBeDefined();
    expect(bluffChoice?.next).toBe('lie-rebuked');
  });

  it('never lets reputation bluff away a serious breach', () => {
    const state = stateWith({
      missionSuccess: true,
      exploitedRefugees: true,
      protectedWitnesses: true,
    }, 100);
    const assessment = assessAlaricBluff(resolveLionVerdict({ flags: state.flags, reputation: state.reputation }));
    expect(assessment).toMatchObject({ succeeds: false, reason: 'serious_fact' });

    const dialogue = buildLionFinaleJudgement(state);
    const bluffChoice = dialogue.steps.flatMap((step) => step.choices ?? [])
      .find((choice) => choice.effects.some((effect) => effect.type === 'setFlag' && effect.key === 'liedToAlaric'));
    expect(bluffChoice).toBeDefined();
  });

  it('keeps an explicit reckless denial option that Alaric punishes immediately', () => {
    const state = stateWith({
      lionMandateAdvance: true,
      missionSuccess: true,
      protectedWitnesses: true,
    }, 80);
    const dialogue = buildLionFinaleJudgement(state);
    const denial = dialogue.steps.flatMap((step) => step.choices ?? [])
      .find((choice) => choice.effects.some((effect) => effect.type === 'setFlag' && effect.key === 'brazenLieToAlaric'));
    expect(denial).toBeDefined();
    expect(denial?.next).toBe('brazen-lie-rebuked');
    expect(denial?.effects).toEqual(expect.arrayContaining([
      { type: 'setFlag', key: 'liedToAlaric', value: true },
      { type: 'setFlag', key: 'brazenLieToAlaric', value: true },
    ]));
    expect(dialogue.steps.find((step) => step.id === 'brazen-lie-rebuked')?.text)
      .toMatch(/ce n’est plus seulement votre route.*c’est votre parole/i);
  });

  it('offers one exclusive Shadow disclosure choice when evidence is undecided', () => {
    const dialogue = buildLionFinaleJudgement(stateWith({
      ...HONOUR_FLAGS,
      shadowEvidence: true,
    }));
    const shadowChoices = dialogue.steps.flatMap((step) => step.choices ?? [])
      .filter((choice) => choice.effects.some((effect) => effect.type === 'setFlag' && ['shadowRevealed', 'shadowConcealed'].includes(effect.key)));
    expect(shadowChoices).toHaveLength(2);
    for (const choice of shadowChoices) {
      const disclosureEffects = choice.effects.filter((effect) => effect.type === 'setFlag' && ['shadowRevealed', 'shadowConcealed'].includes(effect.key));
      expect(disclosureEffects).toHaveLength(2);
      expect(disclosureEffects.filter((effect) => effect.type === 'setFlag' && effect.value)).toHaveLength(1);
      expect(disclosureEffects.filter((effect) => effect.type === 'setFlag' && !effect.value)).toHaveLength(1);
    }
  });

  it.each(['shadowRevealed', 'shadowConcealed'] as const)('does not ask again when legacy disclosure is %s', (flag) => {
    const dialogue = buildLionFinaleJudgement(stateWith({ ...HONOUR_FLAGS, shadowEvidence: true, [flag]: true }));
    const disclosureEffects = allEffects(dialogue).filter((effect) => effect.type === 'setFlag' && ['shadowRevealed', 'shadowConcealed'].includes(effect.key));
    expect(disclosureEffects).toHaveLength(0);
  });

  it('creates definitive evidence after the Serpent victory and asks only if still undecided', () => {
    const state = stateWith({ ...HONOUR_FLAGS });
    Object.assign(state.flags, lionBossVictoryFacts('serpent_captain'));
    expect(state.flags.shadowEvidence).toBe(true);
    const aftermath = buildSerpentGeneralAftermath(state);
    const disclosureChoices = aftermath.steps.flatMap((step) => step.choices ?? []);
    expect(disclosureChoices).toHaveLength(2);

    state.flags.shadowRevealed = true;
    const resolvedAftermath = buildSerpentGeneralAftermath(state);
    expect(resolvedAftermath.steps.flatMap((step) => step.choices ?? [])).toHaveLength(0);
  });

  it('uses cause-appropriate Lion pre-combat dialogue', () => {
    const voluntary = buildLionTrialPreCombat(stateWith({ ...HONOUR_FLAGS, lionTrialRequested: true }));
    const rejected = buildLionTrialPreCombat(stateWith({ missionGreed: true }));
    expect(voluntary.steps[0]!.tag).toBe('Épreuve demandée');
    expect(voluntary.steps[0]!.text).toContain('avez demandé');
    expect(rejected.steps[0]!.tag).toBe('Reconnaissance refusée');
    expect(rejected.steps[0]!.text).toContain('ne peut être accordée');
  });

  it('keeps the Lion Trial aftermath fail-forward and free of a dead General claim', () => {
    const dialogue = buildLionTrialAftermath(stateWith({ lionTrialWon: true, missionGreed: true }));
    const text = dialogue.steps.map((step) => step.text).join('\n');
    expect(text).toContain('Sceau');
    expect(text).toContain('demeure en fuite');
    expect(text).not.toMatch(/général Serpent (?:est |gît |repose )?(?:vaincu|mort|à vos pieds)/i);
    expectValidTargets(dialogue);
  });
});

describe('route-aware Lion epilogues', () => {
  const combinations = [
    { route: 'serpent', routeFlags: { serpentGeneralDefeated: true, shadowEvidence: true }, disclosure: {} },
    { route: 'serpent', routeFlags: { serpentGeneralDefeated: true, shadowEvidence: true }, disclosure: { shadowRevealed: true } },
    { route: 'serpent', routeFlags: { serpentGeneralDefeated: true, shadowEvidence: true }, disclosure: { shadowConcealed: true } },
    { route: 'trial', routeFlags: { lionTrialWon: true }, disclosure: {} },
    { route: 'trial', routeFlags: { lionTrialWon: true, shadowEvidence: true }, disclosure: { shadowRevealed: true } },
    { route: 'trial', routeFlags: { lionTrialWon: true, shadowEvidence: true }, disclosure: { shadowConcealed: true } },
  ] as const;

  for (const profile of combinations) {
    it(`finishes the ${profile.route} route for ${Object.keys(profile.disclosure)[0] ?? 'undecided'} disclosure`, () => {
      const dialogue = buildLionEpilogue(stateWith({ ...profile.routeFlags, ...profile.disclosure }));
      expect(dialogue.steps.length).toBeGreaterThan(0);
      expectValidTargets(dialogue);
      const finishEffects = allEffects(dialogue).filter((effect) => effect.type === 'finishChapter');
      expect(finishEffects).toHaveLength(1);
      expect(finishEffects[0]!.type === 'finishChapter' ? finishEffects[0]!.endingId : '').toContain(`lion-seal-${profile.route}`);
      expect(allEffects(dialogue).some((effect) => effect.type === 'setFlag' && ['shadowRevealed', 'shadowConcealed'].includes(effect.key))).toBe(false);
    });
  }

  it('does not claim the General died on the Lion Trial route', () => {
    const text = buildLionEpilogue(stateWith({ lionTrialWon: true, shadowEvidence: true }))
      .steps.map((step) => step.text).join('\n');
    expect(text).toContain('demeure libre');
    expect(text).not.toMatch(/général Serpent (?:est |gît |repose )?(?:vaincu|mort|à vos pieds)/i);
  });
});

describe('route-specific boss content', () => {
  it('uses different, route-correct aftermaths', () => {
    const serpent = combatConfigs.get('serpent_captain')!;
    const lion = combatConfigs.get('lion_chief')!;
    expect(serpent.preCombatDialogueId).toBe('serpent_pursuit_pre_combat');
    expect(serpent.postCombatDialogueId).toBe('serpent_general_aftermath');
    expect(lion.preCombatDialogueId).toBe('pre_lion_chief');
    expect(lion.postCombatDialogueId).toBe('lion_trial_aftermath');
    expect(serpent.postCombatDialogueId).not.toBe(lion.postCombatDialogueId);
  });

  it('normalizes the legitimate Lion Trial combat reputation reward to zero', () => {
    expect(combatConfigs.get('lion_chief')?.rewards.reputation).toBe(0);
  });
});
