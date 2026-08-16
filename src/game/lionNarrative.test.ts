import { describe, expect, it } from 'vitest';
import {
  explainLionConduct,
  getLionConductScore,
  getLionConductTier,
  resolveLionNarrativeState,
  resolveLionShadowDisclosure,
  resolveLionShadowKnowledge,
  resolveLionWitnessState,
} from './lionNarrative';

describe('Lion narrative truth foundation', () => {
  describe('conduct profiles', () => {
    const profiles = [
      { name: 'A', flags: { helpedRefugees: true }, score: 2, tier: 'honour' },
      { name: 'B', flags: { exploitedRefugees: true }, score: -2, tier: 'infamy' },
      { name: 'C', flags: { helpedRefugees: true, prioritizedLoot: true }, score: 1, tier: 'uncertain' },
      { name: 'D', flags: { lionMandateAdvance: true, missionSuccess: true }, score: 1, tier: 'uncertain' },
      {
        name: 'E',
        flags: {
          lionMandateAdvance: true,
          prioritizedLoot: true,
          missionSuccess: true,
          protectedWitnesses: true,
        },
        score: 1,
        tier: 'uncertain',
      },
      {
        name: 'F',
        flags: {
          lionMandateAdvance: true,
          prioritizedLoot: true,
          helpedRefugees: true,
          missionSuccess: true,
          protectedWitnesses: true,
        },
        score: 3,
        tier: 'honour',
      },
    ] as const;

    for (const profile of profiles) {
      it(`resolves profile ${profile.name}`, () => {
        expect(getLionConductScore(profile.flags)).toBe(profile.score);
        expect(getLionConductTier(profile.flags)).toBe(profile.tier);
      });
    }

    it.each([
      'alaricDoubt',
      'recruitedCedric',
      'recruitedLancer',
      'shadowRevealed',
    ])('does not score historical fact %s', (flag) => {
      expect(getLionConductScore({ [flag]: true })).toBe(0);
      expect(getLionConductTier({ [flag]: true })).toBe('uncertain');
    });

    it('explains only weighted conduct facts without prose', () => {
      expect(explainLionConduct({ helpedRefugees: true, alaricDoubt: true, prioritizedLoot: true })).toEqual([
        { flag: 'helpedRefugees', weight: 2 },
        { flag: 'prioritizedLoot', weight: -1 },
      ]);
    });
  });

  describe('witness state', () => {
    it('uses silenced as the strongest precedence', () => {
      expect(resolveLionWitnessState({
        silencedWitnesses: true,
        protectedWitnesses: true,
        missionGreed: true,
      })).toBe('silenced');
    });

    it('uses protected before an unprotected greed outcome', () => {
      expect(resolveLionWitnessState({ protectedWitnesses: true, missionGreed: true })).toBe('supportive');
    });

    it('derives unprotected witnesses from mission greed', () => {
      expect(resolveLionWitnessState({ missionGreed: true })).toBe('unprotected');
    });

    it('returns none without witness facts', () => {
      expect(resolveLionWitnessState({})).toBe('none');
    });
  });

  describe('shadow truth', () => {
    it('prefers evidence over fragments', () => {
      expect(resolveLionShadowKnowledge({ shadowEvidence: true, shadowFragments: true })).toBe('evidence');
    });

    it('resolves fragments and absence', () => {
      expect(resolveLionShadowKnowledge({ shadowFragments: true })).toBe('fragments');
      expect(resolveLionShadowKnowledge({})).toBe('none');
    });

    it('prefers revealed over concealed when contradictory facts coexist', () => {
      expect(resolveLionShadowDisclosure({ shadowRevealed: true, shadowConcealed: true })).toBe('revealed');
    });

    it('resolves concealed and undecided', () => {
      expect(resolveLionShadowDisclosure({ shadowConcealed: true })).toBe('concealed');
      expect(resolveLionShadowDisclosure({})).toBe('undecided');
    });
  });

  it('resolves the complete derived state without mutating historical facts', () => {
    const flags = {
      helpedRefugees: true,
      protectedWitnesses: true,
      shadowEvidence: true,
      shadowConcealed: true,
    };
    const snapshot = { ...flags };

    expect(resolveLionNarrativeState(flags)).toEqual({
      conductScore: 4,
      conductTier: 'honour',
      witnessState: 'supportive',
      shadowKnowledge: 'evidence',
      shadowDisclosure: 'concealed',
    });
    expect(flags).toEqual(snapshot);
  });

  it('keeps public reputation independent from Lion conduct', () => {
    const highReputationInfamy = {
      reputation: 80,
      flags: { exploitedRefugees: true },
    };
    const lowReputationHonour = {
      reputation: 20,
      flags: { helpedRefugees: true },
    };

    expect(resolveLionNarrativeState(highReputationInfamy.flags).conductTier).toBe('infamy');
    expect(resolveLionNarrativeState(lowReputationHonour.flags).conductTier).toBe('honour');
  });
});
