import {
  resolveLionNarrativeState,
  type LionConductTier,
  type LionShadowDisclosure,
  type LionShadowKnowledge,
  type LionWitnessState,
} from './lionNarrative';

export type LionVerdictStance =
  | 'respect'
  | 'respect_with_reservations'
  | 'uncertain'
  | 'distrust'
  | 'hostile';

export type LionFinalRoute = 'serpent_pursuit' | 'lion_trial';

export type LionVerdictSeverity = 'decisive' | 'important' | 'minor';

export type LionVerdictPolarity = 'merit' | 'breach' | 'context';

export interface LionVerdictFact {
  id: string;
  polarity: LionVerdictPolarity;
  severity: LionVerdictSeverity;
  source?: string;
}

export interface LionVerdictInput {
  flags: Readonly<Record<string, boolean>>;
  reputation: number;
}

export interface LionVerdict {
  conductScore: number;
  conductTier: LionConductTier;
  reputation: number;
  witnessState: LionWitnessState;
  shadowKnowledge: LionShadowKnowledge;
  shadowDisclosure: LionShadowDisclosure;
  majorMerits: LionVerdictFact[];
  majorBreaches: LionVerdictFact[];
  minorStains: LionVerdictFact[];
  context: LionVerdictFact[];
  stance: LionVerdictStance;
  finalRoute: LionFinalRoute;
  reasons: string[];
}

const fact = (
  id: string,
  polarity: LionVerdictPolarity,
  severity: LionVerdictSeverity,
  source?: string,
): LionVerdictFact => ({ id, polarity, severity, ...(source ? { source } : {}) });

function collectMajorMerits(
  flags: Readonly<Record<string, boolean>>,
  witnessState: LionWitnessState,
  shadowKnowledge: LionShadowKnowledge,
  shadowDisclosure: LionShadowDisclosure,
): LionVerdictFact[] {
  const merits: LionVerdictFact[] = [];
  if (flags.missionSuccess) merits.push(fact('saved_bois_clair', 'merit', 'decisive', 'missionSuccess'));
  if (flags.helpedRefugees) merits.push(fact('helped_refugees', 'merit', 'important', 'helpedRefugees'));
  if (flags.lionMandateHonour) merits.push(fact('accepted_lion_mandate', 'merit', 'important', 'lionMandateHonour'));
  if (flags.helpedMerchant) merits.push(fact('helped_merchant', 'merit', 'important', 'helpedMerchant'));
  if (flags.returnedLostTreasure) merits.push(fact('returned_lost_cargo', 'merit', 'important', 'returnedLostTreasure'));
  if (flags.prioritizedVillage) merits.push(fact('prioritized_village', 'merit', 'important', 'prioritizedVillage'));
  if (flags.shrineRested || flags.preservedShrine) {
    merits.push(fact('preserved_shrine', 'merit', 'important', flags.preservedShrine ? 'preservedShrine' : 'shrineRested'));
  }
  if (witnessState === 'supportive') merits.push(fact('supportive_witnesses', 'merit', 'important', 'witnessState'));
  if (flags.protectedInformant) merits.push(fact('protected_informant', 'merit', 'important', 'protectedInformant'));
  if (shadowKnowledge === 'evidence' && shadowDisclosure === 'revealed') {
    merits.push(fact('revealed_shadow_evidence', 'merit', 'important', 'shadowDisclosure'));
  }
  return merits;
}

function collectMajorBreaches(
  flags: Readonly<Record<string, boolean>>,
  witnessState: LionWitnessState,
): LionVerdictFact[] {
  const breaches: LionVerdictFact[] = [];
  if (flags.missionGreed) breaches.push(fact('sacrificed_bois_clair', 'breach', 'decisive', 'missionGreed'));
  if (witnessState === 'silenced') breaches.push(fact('silenced_witnesses', 'breach', 'decisive', 'witnessState'));
  if (flags.betrayedInformant) breaches.push(fact('betrayed_informant', 'breach', 'decisive', 'betrayedInformant'));
  if (flags.exploitedRefugees) breaches.push(fact('exploited_refugees', 'breach', 'important', 'exploitedRefugees'));
  if (flags.desecratedShrine) breaches.push(fact('desecrated_shrine', 'breach', 'important', 'desecratedShrine'));
  if (flags.liedToAlaric) breaches.push(fact('lied_to_alaric', 'breach', 'important', 'liedToAlaric'));
  return breaches;
}

function collectMinorStains(flags: Readonly<Record<string, boolean>>): LionVerdictFact[] {
  const stains: LionVerdictFact[] = [];
  if (flags.lionMandateAdvance) stains.push(fact('requested_advance', 'breach', 'minor', 'lionMandateAdvance'));
  if (flags.claimedLostTreasure) stains.push(fact('claimed_lost_cargo', 'breach', 'minor', 'claimedLostTreasure'));
  if (flags.abandonedMerchant) stains.push(fact('abandoned_merchant', 'breach', 'minor', 'abandonedMerchant'));
  if (flags.shrineLooted) stains.push(fact('looted_shrine', 'breach', 'minor', 'shrineLooted'));
  if (flags.prioritizedLoot) stains.push(fact('prioritized_loot', 'breach', 'minor', 'prioritizedLoot'));
  if (flags.shadowFragments) stains.push(fact('broke_shadow_altar', 'breach', 'minor', 'shadowFragments'));
  return stains;
}

function collectContext(
  flags: Readonly<Record<string, boolean>>,
  reputation: number,
  witnessState: LionWitnessState,
  shadowKnowledge: LionShadowKnowledge,
  shadowDisclosure: LionShadowDisclosure,
): LionVerdictFact[] {
  const context: LionVerdictFact[] = [];
  if (!flags.missionSuccess) context.push(fact('bois_clair_not_saved', 'context', 'decisive', 'missionSuccess'));
  if (witnessState === 'unprotected') context.push(fact('unprotected_witnesses', 'context', 'important', 'witnessState'));
  if (witnessState === 'none') context.push(fact('no_witness_testimony', 'context', 'minor', 'witnessState'));
  if (shadowKnowledge === 'evidence' && shadowDisclosure === 'undecided') {
    context.push(fact('undisclosed_shadow_evidence', 'context', 'important', 'shadowDisclosure'));
  } else if (shadowKnowledge === 'evidence' && shadowDisclosure === 'concealed') {
    context.push(fact('concealed_shadow_evidence', 'context', 'important', 'shadowDisclosure'));
  } else if (shadowKnowledge === 'fragments') {
    context.push(fact('shadow_fragments_only', 'context', 'minor', 'shadowKnowledge'));
  }
  if (reputation >= 70) context.push(fact('high_public_reputation', 'context', 'important', 'reputation'));
  else if (reputation >= 45) context.push(fact('credible_public_reputation', 'context', 'important', 'reputation'));
  else context.push(fact('low_public_reputation', 'context', 'minor', 'reputation'));
  return context;
}

function chooseRoute(
  flags: Readonly<Record<string, boolean>>,
  reputation: number,
  conductTier: LionConductTier,
  witnessState: LionWitnessState,
  shadowKnowledge: LionShadowKnowledge,
  shadowDisclosure: LionShadowDisclosure,
): LionFinalRoute {
  if (flags.lionTrialRequested) return 'lion_trial';
  if (!flags.missionSuccess || flags.missionGreed) return 'lion_trial';
  if (conductTier === 'infamy') return 'lion_trial';
  if (witnessState === 'silenced' || flags.betrayedInformant) return 'lion_trial';
  if (conductTier === 'honour') return 'serpent_pursuit';

  const hasCredibleSupport = witnessState === 'supportive'
    || (shadowKnowledge === 'evidence' && shadowDisclosure === 'revealed')
    || reputation >= 45;
  return hasCredibleSupport ? 'serpent_pursuit' : 'lion_trial';
}

function chooseStance(
  flags: Readonly<Record<string, boolean>>,
  conductTier: LionConductTier,
  witnessState: LionWitnessState,
  majorMerits: readonly LionVerdictFact[],
  majorBreaches: readonly LionVerdictFact[],
  minorStains: readonly LionVerdictFact[],
): LionVerdictStance {
  const decisiveBreachCount = majorBreaches.filter((entry) => entry.severity === 'decisive').length;
  if (
    (flags.missionGreed && witnessState === 'silenced' && conductTier === 'infamy')
    || decisiveBreachCount >= 3
  ) return 'hostile';

  if (
    !flags.missionSuccess
    || flags.missionGreed
    || witnessState === 'silenced'
    || flags.betrayedInformant
    || conductTier === 'infamy'
  ) return 'distrust';

  if (flags.missionSuccess && conductTier === 'honour') {
    const hasStrongSupport = majorMerits.some((entry) => [
      'supportive_witnesses', 'protected_informant', 'revealed_shadow_evidence',
    ].includes(entry.id));
    return majorBreaches.length > 0 || minorStains.length > 0 || !hasStrongSupport
      ? 'respect_with_reservations'
      : 'respect';
  }

  return 'uncertain';
}

export function resolveLionVerdict(input: LionVerdictInput): LionVerdict {
  const narrative = resolveLionNarrativeState(input.flags);
  const reputation = Math.max(0, Math.min(100, Math.trunc(input.reputation)));
  const majorMerits = collectMajorMerits(
    input.flags,
    narrative.witnessState,
    narrative.shadowKnowledge,
    narrative.shadowDisclosure,
  );
  const majorBreaches = collectMajorBreaches(input.flags, narrative.witnessState);
  const minorStains = collectMinorStains(input.flags);
  const context = collectContext(
    input.flags,
    reputation,
    narrative.witnessState,
    narrative.shadowKnowledge,
    narrative.shadowDisclosure,
  );
  const finalRoute = chooseRoute(
    input.flags,
    reputation,
    narrative.conductTier,
    narrative.witnessState,
    narrative.shadowKnowledge,
    narrative.shadowDisclosure,
  );
  const stance = chooseStance(
    input.flags,
    narrative.conductTier,
    narrative.witnessState,
    majorMerits,
    majorBreaches,
    minorStains,
  );
  const reasons = [
    ...majorMerits.map((entry) => entry.id),
    ...majorBreaches.map((entry) => entry.id),
    ...minorStains.map((entry) => entry.id),
    ...context.map((entry) => entry.id),
    `stance_${stance}`,
    `route_${finalRoute}`,
  ];

  return {
    conductScore: narrative.conductScore,
    conductTier: narrative.conductTier,
    reputation,
    witnessState: narrative.witnessState,
    shadowKnowledge: narrative.shadowKnowledge,
    shadowDisclosure: narrative.shadowDisclosure,
    majorMerits,
    majorBreaches,
    minorStains,
    context,
    stance,
    finalRoute,
    reasons,
  };
}
