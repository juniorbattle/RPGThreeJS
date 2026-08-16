export type LionConductTier = 'honour' | 'uncertain' | 'infamy';

export type LionWitnessState = 'none' | 'supportive' | 'unprotected' | 'silenced';

export type LionShadowKnowledge = 'none' | 'fragments' | 'evidence';

export type LionShadowDisclosure = 'undecided' | 'revealed' | 'concealed';

export interface LionNarrativeState {
  conductScore: number;
  conductTier: LionConductTier;
  witnessState: LionWitnessState;
  shadowKnowledge: LionShadowKnowledge;
  shadowDisclosure: LionShadowDisclosure;
}

export const LION_CONDUCT_FLAG_WEIGHTS = {
  helpedRefugees: 2,
  lionMandateHonour: 1,
  helpedMerchant: 1,
  returnedLostTreasure: 1,
  prioritizedVillage: 1,
  shrineRested: 1,
  preservedShrine: 1,
  missionSuccess: 2,
  protectedWitnesses: 1,
  protectedInformant: 1,
  shadowEvidence: 1,
  exploitedRefugees: -2,
  lionMandateAdvance: -1,
  abandonedMerchant: -1,
  claimedLostTreasure: -1,
  prioritizedLoot: -1,
  shrineLooted: -1,
  desecratedShrine: -1,
  missionGreed: -2,
  silencedWitnesses: -1,
  betrayedInformant: -1,
  shadowFragments: -1,
} as const;

export type LionConductFlag = keyof typeof LION_CONDUCT_FLAG_WEIGHTS;

export interface LionConductContribution {
  flag: LionConductFlag;
  weight: number;
}

export function explainLionConduct(flags: Readonly<Record<string, boolean>>): LionConductContribution[] {
  return (Object.entries(LION_CONDUCT_FLAG_WEIGHTS) as Array<[LionConductFlag, number]>)
    .filter(([flag]) => flags[flag] === true)
    .map(([flag, weight]) => ({ flag, weight }));
}

export function getLionConductScore(flags: Readonly<Record<string, boolean>>): number {
  return explainLionConduct(flags).reduce((score, contribution) => score + contribution.weight, 0);
}

function conductTierFromScore(score: number): LionConductTier {
  if (score >= 2) return 'honour';
  if (score <= -2) return 'infamy';
  return 'uncertain';
}

export function getLionConductTier(flags: Readonly<Record<string, boolean>>): LionConductTier {
  return conductTierFromScore(getLionConductScore(flags));
}

export function resolveLionWitnessState(flags: Readonly<Record<string, boolean>>): LionWitnessState {
  if (flags.silencedWitnesses) return 'silenced';
  if (flags.protectedWitnesses) return 'supportive';
  if (flags.missionGreed) return 'unprotected';
  return 'none';
}

export function resolveLionShadowKnowledge(flags: Readonly<Record<string, boolean>>): LionShadowKnowledge {
  if (flags.shadowEvidence) return 'evidence';
  if (flags.shadowFragments) return 'fragments';
  return 'none';
}

export function resolveLionShadowDisclosure(flags: Readonly<Record<string, boolean>>): LionShadowDisclosure {
  if (flags.shadowRevealed) return 'revealed';
  if (flags.shadowConcealed) return 'concealed';
  return 'undecided';
}

export function resolveLionNarrativeState(flags: Readonly<Record<string, boolean>>): LionNarrativeState {
  const conductScore = getLionConductScore(flags);

  return {
    conductScore,
    conductTier: conductTierFromScore(conductScore),
    witnessState: resolveLionWitnessState(flags),
    shadowKnowledge: resolveLionShadowKnowledge(flags),
    shadowDisclosure: resolveLionShadowDisclosure(flags),
  };
}
