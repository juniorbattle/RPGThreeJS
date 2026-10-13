import {
  ateSeenFlag,
  resolveContextualDialogue,
  type ContextualAteRule,
  type ContextualDialogueDefinition,
} from '../game/contextualDialogue';
import {
  CONTEXTUAL_ATE_RULES,
  CONTEXTUAL_DIALOGUE_DEFINITIONS,
  resolveGameAteRules,
  resolveGameDialogue,
} from '../game/contextualDialogueContent';
import {
  lionBossVictoryFacts,
  LION_FINALE_SERPENT_SELECTED_FLAG,
  LION_FINALE_TRIAL_SELECTED_FLAG,
  resolveLionFinaleExecution,
  resolvePendingLionFinaleCombat,
  resolveSelectedLionFinaleCombat,
  type LionFinaleIntent,
  type LionTrialCause,
} from '../game/lionFinale';
import { resolveLionNarrativeState } from '../game/lionNarrative';
import { resolveLionVerdict, type LionFinalRoute, type LionVerdictStance } from '../game/lionVerdict';
import {
  REPUTATION_EVENT_DEFINITIONS,
  getReputationEventOpportunity,
} from '../game/reputationEventContent';
import {
  readReputationEventOccurrences,
  recordReputationEventSelection,
  reputationEventOccurrenceKey,
  selectReputationEvent,
  type ReputationEventDefinition,
  type ReputationEventRejectionReason,
} from '../game/reputationEventDirector';
import { getReputationRule } from '../game/reputation';
import {
  createRunState,
  enterRunNode,
  getAvailableRunNodes,
  getRunNode,
} from '../game/runSystem';
import { createInitialState } from '../game/store';
import {
  dialogueSequenceSchema,
  gameStateSchema,
  type DialogueSequence,
  type GameState,
} from '../game/types';

export const R7_BASELINE_HEAD = '098b774136e6e6aee33dc532aa67eb31febc54ee';
export const R7_CANONICAL_SEEDS = Object.freeze(Array.from({ length: 1_000 }, (_, index) => index));
export const R7_DISTRIBUTION_SEEDS = Object.freeze(Array.from({ length: 10_000 }, (_, index) => index));
export const R7_REPUTATION_BANDS = Object.freeze([5, 15, 30, 50, 70, 90, 95]);

export type SimulationMandate = 'honour' | 'advance';
export type SimulationRefugees = 'helped' | 'exploited';
export type SimulationReserve = 'village' | 'loot';
export type SimulationBoisClair = 'saved' | 'sacrificed';
export type SimulationWitnesses = 'supportive' | 'unprotected' | 'silenced' | 'none';
export type SimulationShadow = 'none' | 'fragments' | 'evidence';
export type SimulationDisclosure = 'undecided' | 'revealed' | 'concealed';
export type SimulationConductFamily = 'honour' | 'uncertain' | 'infamy';

export interface LionSimulationProfile {
  id: string;
  family: SimulationConductFamily;
  reputation: number;
  mandate: SimulationMandate;
  refugees: SimulationRefugees;
  reserve: SimulationReserve;
  boisClair: SimulationBoisClair;
  witnesses: SimulationWitnesses;
  shadow: SimulationShadow;
  disclosure: SimulationDisclosure;
  cedric: boolean;
  intent: LionFinaleIntent;
  extraFlags?: Readonly<Record<string, boolean>>;
  finaleState?: 'pre_selection' | 'selected' | 'completed';
}

export interface ProfileValidation {
  valid: boolean;
  reasons: string[];
}

export interface AdaptiveSelectionResult {
  nodeId: string;
  selectedContentId: string;
  eligibleContentIds: string[];
  source: 'seeded_graph' | 'fact_adaptive';
}

export interface ContextualResolutionResult {
  dialogueId: string;
  variantId: string | null;
  optionalStepIds: string[];
}

export interface AteResolutionResult extends ContextualResolutionResult {
  ateId: string;
  triggerNodeId: string;
}

export interface R4TraceSummary {
  opportunityKey: string;
  step: number;
  eligibleEventIds: string[];
  selectedEventId: string | null;
  noEvent: boolean;
  rejectionCounts: Partial<Record<ReputationEventRejectionReason, number>>;
  hashValue: number;
}

export interface LionSimulationResult {
  profileId: string;
  seed: number;
  initialReputation: number;
  finalRelevantReputation: number;
  reputationBand: string;
  historicalFacts: string[];
  conductScore: number;
  conduct: 'honour' | 'uncertain' | 'infamy';
  witnessState: 'none' | 'supportive' | 'unprotected' | 'silenced';
  shadowKnowledge: 'none' | 'fragments' | 'evidence';
  shadowDisclosure: 'undecided' | 'revealed' | 'concealed';
  adaptiveSelections: AdaptiveSelectionResult[];
  contextualResolutions: ContextualResolutionResult[];
  ateResults: AteResolutionResult[];
  r4OpportunityResults: R4TraceSummary[];
  r4SelectedEventIds: string[];
  r4NoEventCount: number;
  totalR4Events: number;
  stance: LionVerdictStance;
  verdictReasonIds: string[];
  finalRoute: LionFinalRoute;
  trialCause: LionTrialCause | null;
  persistedFinaleCombat: 'serpent_captain' | 'lion_chief' | null;
  pendingFinaleCombat: 'serpent_captain' | 'lion_chief' | null;
  boss: 'serpent_captain' | 'lion_chief';
  endingId: string | null;
  impossibleOutcomes: string[];
}

const DEFAULT_PROFILE: Omit<LionSimulationProfile, 'id'> = {
  family: 'honour',
  reputation: 65,
  mandate: 'honour',
  refugees: 'helped',
  reserve: 'village',
  boisClair: 'saved',
  witnesses: 'supportive',
  shadow: 'evidence',
  disclosure: 'revealed',
  cedric: true,
  intent: 'claim_recognition',
  finaleState: 'pre_selection',
};

function authoredProfile(
  id: string,
  changes: Partial<Omit<LionSimulationProfile, 'id'>> = {},
): LionSimulationProfile {
  return { id, ...DEFAULT_PROFILE, ...changes };
}

export function generateCanonicalLionProfiles(): LionSimulationProfile[] {
  return [
    authoredProfile('PURE_HONOUR'),
    authoredProfile('HONOUR_WITH_MINOR_STAINS', {
      reputation: 55,
      mandate: 'advance',
      reserve: 'loot',
      extraFlags: { claimedLostTreasure: true },
    }),
    authoredProfile('REAL_MIXED_PROFILE', {
      reputation: 38,
      mandate: 'advance',
      reserve: 'loot',
      disclosure: 'concealed',
      extraFlags: { claimedLostTreasure: true },
    }),
    authoredProfile('UNCERTAIN', {
      family: 'uncertain', reputation: 30, mandate: 'advance', reserve: 'loot', witnesses: 'none',
      shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('INFAMY', {
      family: 'infamy', reputation: 15, mandate: 'advance', refugees: 'exploited', reserve: 'loot',
      boisClair: 'sacrificed', witnesses: 'silenced', shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('HIGH_REPUTATION_PLUS_INFAMY', {
      family: 'infamy', reputation: 90, mandate: 'advance', refugees: 'exploited', reserve: 'loot',
      boisClair: 'sacrificed', witnesses: 'silenced', shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('LOW_REPUTATION_PLUS_HONOUR', { reputation: 10 }),
    authoredProfile('SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES', { reputation: 55, witnesses: 'silenced' }),
    authoredProfile('SACRIFICED_BOIS_CLAIR_PLUS_HIGH_REPUTATION', {
      family: 'infamy', reputation: 95, mandate: 'advance', refugees: 'exploited', reserve: 'loot',
      boisClair: 'sacrificed', witnesses: 'silenced', shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('BETRAYED_INFORMANT', { extraFlags: { betrayedInformant: true } }),
    authoredProfile('EXPLOITED_REFUGEES', { refugees: 'exploited' }),
    authoredProfile('MISSION_GREED', {
      family: 'infamy', mandate: 'advance', refugees: 'exploited', reserve: 'loot',
      boisClair: 'sacrificed', witnesses: 'unprotected', shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('HEROIC_PLUS_LIE_TO_ALARIC', { extraFlags: { liedToAlaric: true } }),
    authoredProfile('SHADOW_FRAGMENTS', {
      family: 'uncertain', reputation: 45, mandate: 'advance', reserve: 'loot', witnesses: 'none',
      shadow: 'fragments', disclosure: 'undecided',
    }),
    authoredProfile('DEFINITIVE_SHADOW_EVIDENCE', { disclosure: 'undecided' }),
    authoredProfile('SHADOW_REVEALED'),
    authoredProfile('SHADOW_CONCEALED', { disclosure: 'concealed' }),
    authoredProfile('CEDRIC_RECRUITED'),
    authoredProfile('CEDRIC_ABSENT', { cedric: false }),
    authoredProfile('VOLUNTARY_LION_TRIAL', { intent: 'request_trial' }),
    authoredProfile('SERPENT_SELECTED_NOT_COMPLETED', {
      finaleState: 'selected',
      extraFlags: { [LION_FINALE_SERPENT_SELECTED_FLAG]: true },
    }),
    authoredProfile('LION_TRIAL_SELECTED_NOT_COMPLETED', {
      reputation: 63, intent: 'request_trial', finaleState: 'selected',
      extraFlags: { lionTrialRequested: true, [LION_FINALE_TRIAL_SELECTED_FLAG]: true },
    }),
    authoredProfile('SERPENT_COMPLETED', {
      finaleState: 'completed',
      extraFlags: {
        [LION_FINALE_SERPENT_SELECTED_FLAG]: true,
        serpentGeneralDefeated: true,
        lionSealAcknowledged: true,
      },
    }),
    authoredProfile('LION_TRIAL_COMPLETED', {
      reputation: 63, intent: 'request_trial', finaleState: 'completed',
      extraFlags: {
        lionTrialRequested: true,
        [LION_FINALE_TRIAL_SELECTED_FLAG]: true,
        lionTrialWon: true,
        lionSealAcknowledged: true,
      },
    }),
  ];
}

export function generateLegacyContradictionProfiles(): LionSimulationProfile[] {
  return [
    authoredProfile('LEGACY_SAVED_AND_SACRIFICED_BOIS_CLAIR', { extraFlags: { missionGreed: true } }),
    authoredProfile('LEGACY_SUPPORTIVE_AND_SILENCED_WITNESSES', { extraFlags: { silencedWitnesses: true } }),
    authoredProfile('LEGACY_FRAGMENTS_AND_EVIDENCE', { extraFlags: { shadowFragments: true } }),
    authoredProfile('LEGACY_REVEALED_AND_CONCEALED', { extraFlags: { shadowConcealed: true } }),
    authoredProfile('LEGACY_BOTH_FINALE_SELECTION_FLAGS', {
      finaleState: 'selected',
      extraFlags: {
        [LION_FINALE_SERPENT_SELECTED_FLAG]: true,
        [LION_FINALE_TRIAL_SELECTED_FLAG]: true,
      },
    }),
  ];
}

export function validateCoherentProfile(profile: LionSimulationProfile): ProfileValidation {
  const reasons: string[] = [];
  if (!Number.isInteger(profile.reputation) || profile.reputation < 0 || profile.reputation > 100) {
    reasons.push('reputation_out_of_range');
  }
  if (profile.shadow !== 'evidence' && profile.disclosure !== 'undecided') {
    reasons.push('disclosure_requires_definitive_evidence');
  }
  if (profile.boisClair === 'saved' && profile.witnesses === 'unprotected') {
    reasons.push('r1_unprotected_witnesses_require_mission_greed');
  }
  if (profile.boisClair === 'sacrificed' && profile.witnesses === 'supportive') {
    reasons.push('supportive_witnesses_conflict_with_village_sacrifice');
  }
  const flags = profile.extraFlags ?? {};
  if (flags[LION_FINALE_SERPENT_SELECTED_FLAG] && flags[LION_FINALE_TRIAL_SELECTED_FLAG]) {
    reasons.push('both_finale_selection_flags');
  }
  if (flags.serpentGeneralDefeated && !flags[LION_FINALE_SERPENT_SELECTED_FLAG]) {
    reasons.push('serpent_completion_requires_serpent_selection');
  }
  if (flags.lionTrialWon && !flags[LION_FINALE_TRIAL_SELECTED_FLAG]) {
    reasons.push('trial_completion_requires_trial_selection');
  }
  return { valid: reasons.length === 0, reasons };
}

function crossProductTemplate(family: SimulationConductFamily): Pick<
  LionSimulationProfile,
  'mandate' | 'refugees' | 'reserve'
> {
  if (family === 'honour') return { mandate: 'honour', refugees: 'helped', reserve: 'village' };
  if (family === 'infamy') return { mandate: 'advance', refugees: 'exploited', reserve: 'loot' };
  return { mandate: 'advance', refugees: 'helped', reserve: 'village' };
}

export interface ControlledProfileMatrix {
  profiles: LionSimulationProfile[];
  attemptedCount: number;
  rejectedCount: number;
  rejectedByReason: Record<string, number>;
}

export function generateControlledProfileMatrix(): ControlledProfileMatrix {
  const reputations = R7_REPUTATION_BANDS;
  const families: readonly SimulationConductFamily[] = ['honour', 'uncertain', 'infamy'];
  const villages: readonly SimulationBoisClair[] = ['saved', 'sacrificed'];
  const witnesses: readonly SimulationWitnesses[] = ['supportive', 'unprotected', 'silenced'];
  const shadows: readonly SimulationShadow[] = ['none', 'fragments', 'evidence'];
  const disclosures: readonly SimulationDisclosure[] = ['undecided', 'revealed', 'concealed'];
  const cedricStates = [true, false] as const;
  const profiles: LionSimulationProfile[] = [];
  const rejectedByReason: Record<string, number> = {};
  let attemptedCount = 0;

  for (const reputation of reputations) for (const family of families) for (const boisClair of villages) {
    for (const witnessState of witnesses) for (const shadow of shadows) for (const disclosure of disclosures) {
      for (const cedric of cedricStates) {
        attemptedCount += 1;
        const template = crossProductTemplate(family);
        const profile: LionSimulationProfile = {
          id: `MATRIX_${reputation}_${family}_${boisClair}_${witnessState}_${shadow}_${disclosure}_${cedric ? 'CEDRIC' : 'NO_CEDRIC'}`,
          family,
          reputation,
          ...template,
          boisClair,
          witnesses: witnessState,
          shadow,
          disclosure,
          cedric,
          intent: 'claim_recognition',
          finaleState: 'pre_selection',
        };
        const validation = validateCoherentProfile(profile);
        if (!validation.valid) {
          for (const reason of validation.reasons) rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
          continue;
        }
        const state = createProfileState(profile, 0, false);
        const actualFamily = resolveLionNarrativeState(state.flags).conductTier;
        if (actualFamily !== family) {
          rejectedByReason.conduct_template_did_not_resolve_to_requested_family =
            (rejectedByReason.conduct_template_did_not_resolve_to_requested_family ?? 0) + 1;
          continue;
        }
        profiles.push(profile);
      }
    }
  }
  return {
    profiles,
    attemptedCount,
    rejectedCount: attemptedCount - profiles.length,
    rejectedByReason,
  };
}

function applyMilestoneFacts(state: GameState, profile: LionSimulationProfile, nodeId: string): void {
  if (nodeId === 'lion-camp') Object.assign(state.flags, profile.extraFlags ?? {});
  if (nodeId === 'lion-audience') {
    state.flags.lionMissionAccepted = true;
    state.flags[profile.mandate === 'honour' ? 'lionMandateHonour' : 'lionMandateAdvance'] = true;
  }
  if (nodeId === 'lion-nomad-crossroads' && profile.cedric) state.flags.recruitedCedric = true;
  if (nodeId === 'lion-refugees') {
    state.flags[profile.refugees === 'helped' ? 'helpedRefugees' : 'exploitedRefugees'] = true;
  }
  if (nodeId === 'lion-reserve-trail') {
    state.flags[profile.reserve === 'village' ? 'prioritizedVillage' : 'prioritizedLoot'] = true;
  }
  if (nodeId === 'lion-village-choice') {
    state.flags[profile.boisClair === 'saved' ? 'missionSuccess' : 'missionGreed'] = true;
  }
  if (nodeId === 'lion-witnesses') {
    if (profile.witnesses === 'supportive') state.flags.protectedWitnesses = true;
    if (profile.witnesses === 'silenced') state.flags.silencedWitnesses = true;
    if (profile.witnesses === 'unprotected') state.flags.missionGreed = true;
  }
  if (nodeId === 'lion-shadow-signs') {
    if (profile.shadow === 'evidence') state.flags.shadowEvidence = true;
    if (profile.shadow === 'fragments') state.flags.shadowFragments = true;
    if (profile.disclosure === 'revealed') state.flags.shadowRevealed = true;
    if (profile.disclosure === 'concealed') state.flags.shadowConcealed = true;
  }
}

function createProfileState(profile: LionSimulationProfile, seed: number, progressive = true): GameState {
  const state = createInitialState();
  state.run = createRunState(seed);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.reputation = profile.reputation;
  if (!progressive) {
    for (const nodeId of [
      'lion-camp', 'lion-audience', 'lion-nomad-crossroads', 'lion-refugees', 'lion-reserve-trail',
      'lion-village-choice', 'lion-witnesses', 'lion-shadow-signs',
    ]) applyMilestoneFacts(state, profile, nodeId);
  }
  return state;
}

function roundTripState(state: GameState): GameState {
  return gameStateSchema.parse(JSON.parse(JSON.stringify(state)));
}

function traceSummary(selection: ReturnType<typeof selectReputationEvent>): R4TraceSummary {
  const rejectionCounts: Partial<Record<ReputationEventRejectionReason, number>> = {};
  for (const candidate of selection.trace.candidates) for (const reason of candidate.rejectionReasons) {
    rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1;
  }
  return {
    opportunityKey: selection.trace.opportunityKey,
    step: selection.trace.opportunityStep,
    eligibleEventIds: [...selection.trace.eligibleEventIds],
    selectedEventId: selection.trace.selectedEventId,
    noEvent: selection.trace.noEventSelected,
    rejectionCounts,
    hashValue: selection.trace.hashValue,
  };
}

function endingFromState(state: Readonly<GameState>): string | null {
  const epilogue = resolveGameDialogue('epilogue', state)?.sequence;
  if (!epilogue) return null;
  for (const step of epilogue.steps) {
    const finish = step.effects.find((effect) => effect.type === 'finishChapter');
    if (finish?.type === 'finishChapter') return finish.endingId;
    for (const choice of step.choices ?? []) {
      const choiceFinish = choice.effects.find((effect) => effect.type === 'finishChapter');
      if (choiceFinish?.type === 'finishChapter') return choiceFinish.endingId;
    }
  }
  return null;
}

function relevantFacts(flags: Readonly<Record<string, boolean>>): string[] {
  return Object.keys(flags).filter((key) => flags[key]).sort();
}

function reputationBand(reputation: number): string {
  const rule = getReputationRule(reputation);
  return `${rule.min}-${rule.max}:${rule.label}`;
}

function detectImpossibleOutcomes(
  state: Readonly<GameState>,
  result: Pick<LionSimulationResult, 'stance' | 'finalRoute' | 'boss' | 'endingId' | 'persistedFinaleCombat'>,
): string[] {
  const failures: string[] = [];
  const verdict = resolveLionVerdict({ flags: state.flags, reputation: state.reputation });
  const decisiveBreach = state.flags.missionGreed
    || verdict.witnessState === 'silenced'
    || state.flags.betrayedInformant
    || verdict.conductTier === 'infamy';
  if (result.stance === 'respect' && decisiveBreach) failures.push('RESPECT_WITH_DECISIVE_BREACH');
  if (result.finalRoute === 'serpent_pursuit' && decisiveBreach) failures.push('SERPENT_WITH_ROUTE_FORCING_BREACH');
  if (state.flags.missionGreed && result.finalRoute === 'serpent_pursuit') failures.push('HIGH_REPUTATION_ERASED_SACRIFICE');
  if (verdict.conductTier === 'honour' && state.reputation < 20 && result.stance === 'hostile') {
    failures.push('LOW_REPUTATION_ERASED_HONOUR');
  }
  if (verdict.shadowDisclosure !== 'undecided' && verdict.shadowKnowledge === 'none') {
    failures.push('SHADOW_DISCLOSURE_WITHOUT_KNOWLEDGE');
  }
  if (state.flags.serpentGeneralDefeated && result.finalRoute === 'lion_trial') {
    failures.push('SERPENT_DEFEATED_AFTER_TRIAL');
  }
  if (state.flags.lionTrialWon && !state.flags.lionSealAcknowledged) failures.push('TRIAL_COMPLETED_WITHOUT_SEAL');
  if (state.flags.serpentGeneralDefeated && !state.flags[LION_FINALE_SERPENT_SELECTED_FLAG]) {
    failures.push('SERPENT_COMPLETED_WITHOUT_SELECTION');
  }
  if (state.flags.serpentGeneralDefeated && state.flags.lionTrialWon) failures.push('BOTH_FINALES_COMPLETED');
  if (result.persistedFinaleCombat === 'serpent_captain' && result.finalRoute !== 'serpent_pursuit') {
    failures.push('PERSISTED_SERPENT_REINTERPRETED');
  }
  if (result.persistedFinaleCombat === 'lion_chief' && result.finalRoute !== 'lion_trial') {
    failures.push('PERSISTED_TRIAL_REINTERPRETED');
  }
  if (result.endingId?.includes('serpent') && result.finalRoute !== 'serpent_pursuit') failures.push('SERPENT_ENDING_ROUTE_MISMATCH');
  if (result.endingId?.includes('trial') && result.finalRoute !== 'lion_trial') failures.push('TRIAL_ENDING_ROUTE_MISMATCH');
  return failures;
}

export interface SimulateLionOptions {
  roundTripAfterEachNode?: boolean;
  definitions?: readonly ReputationEventDefinition[];
}

export function simulateLionRunProfile(
  profile: LionSimulationProfile,
  seed: number,
  options: SimulateLionOptions = {},
): LionSimulationResult {
  let state = createProfileState(profile, seed);
  const adaptiveSelections: AdaptiveSelectionResult[] = [
    {
      nodeId: 'lion-opening-ambush',
      selectedContentId: state.run.graph.nodes.find((node) => node.id === 'lion-opening-ambush')!.contentId,
      eligibleContentIds: ['forest_ambush', 'wolf_pack'],
      source: 'seeded_graph',
    },
    {
      nodeId: 'lion-valmir-road',
      selectedContentId: state.run.graph.nodes.find((node) => node.id === 'lion-valmir-road')!.contentId,
      eligibleContentIds: ['road_to_valmir', 'marsh_crossing'],
      source: 'seeded_graph',
    },
  ];
  const contextualResolutions: ContextualResolutionResult[] = [];
  const ateResults: AteResolutionResult[] = [];
  const r4OpportunityResults: R4TraceSummary[] = [];
  const definitions = options.definitions ?? REPUTATION_EVENT_DEFINITIONS;

  let current = getRunNode(state.run)!;
  while (current.id !== 'lion-final-judgement') {
    applyMilestoneFacts(state, profile, current.id);
    if (!state.resolvedNodeIds.includes(current.id)) state.resolvedNodeIds.push(current.id);
    const dialogue = resolveGameDialogue(current.contentId, state);
    if (dialogue && (dialogue.variantId !== null || dialogue.optionalStepIds.length > 0)) {
      contextualResolutions.push({
        dialogueId: current.contentId,
        variantId: dialogue.variantId,
        optionalStepIds: [...dialogue.optionalStepIds],
      });
    }
    for (const rule of resolveGameAteRules(current.id, state)) {
      const resolved = resolveGameDialogue(rule.dialogueId, state);
      if (!resolved) throw new Error(`ATE '${rule.id}' has no dialogue '${rule.dialogueId}'.`);
      ateResults.push({
        ateId: rule.id,
        triggerNodeId: current.id,
        dialogueId: rule.dialogueId,
        variantId: resolved.variantId,
        optionalStepIds: [...resolved.optionalStepIds],
      });
      if (rule.once) state.flags[ateSeenFlag(rule)] = true;
    }
    const opportunity = getReputationEventOpportunity(current.id, state);
    if (opportunity) {
      const selection = selectReputationEvent(state, opportunity, definitions);
      r4OpportunityResults.push(traceSummary(selection));
      recordReputationEventSelection(state, selection);
    }

    const available = getAvailableRunNodes(state);
    if (available.length === 0) throw new Error(`Profile '${profile.id}' stalled after '${current.id}'.`);
    const selected = available.find((node) => node.type !== 'combat') ?? available[0]!;
    if (available.length > 1) {
      adaptiveSelections.push({
        nodeId: selected.id,
        selectedContentId: selected.contentId,
        eligibleContentIds: available.map((node) => node.contentId),
        source: 'fact_adaptive',
      });
    }
    const entered = enterRunNode(state.run, selected.id);
    if (!entered) throw new Error(`Profile '${profile.id}' could not enter '${selected.id}'.`);
    state.currentNodeId = entered.id;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.stepCounter += 1;
    if (options.roundTripAfterEachNode) state = roundTripState(state);
    current = getRunNode(state.run)!;
  }

  const initialReputation = state.reputation;
  let verdictAtFinalDecision = resolveLionVerdict({ flags: state.flags, reputation: state.reputation });
  const existingSelection = resolveSelectedLionFinaleCombat(state.flags);
  let persistedFinaleCombat = existingSelection;
  let pendingFinaleCombat = resolvePendingLionFinaleCombat(state.flags);
  let route: LionFinalRoute;
  let trialCause: LionTrialCause | null = null;
  let boss: 'serpent_captain' | 'lion_chief';

  if (existingSelection) {
    boss = existingSelection;
    route = existingSelection === 'serpent_captain' ? 'serpent_pursuit' : 'lion_trial';
    trialCause = route === 'lion_trial'
      ? (state.flags.lionTrialRequested ? 'voluntary' : 'rejected_claim')
      : null;
  } else {
    const execution = resolveLionFinaleExecution(state, profile.intent);
    verdictAtFinalDecision = execution.verdict;
    Object.assign(state.flags, execution.flagChanges);
    state.reputation = Math.max(0, Math.min(100, state.reputation + execution.reputationDelta));
    route = execution.route;
    trialCause = execution.trialCause;
    boss = execution.combatId;
    persistedFinaleCombat = resolveSelectedLionFinaleCombat(state.flags);
    pendingFinaleCombat = resolvePendingLionFinaleCombat(state.flags);
  }

  const completeRun = profile.finaleState === 'pre_selection';
  if (completeRun) {
    Object.assign(state.flags, lionBossVictoryFacts(boss));
    pendingFinaleCombat = resolvePendingLionFinaleCombat(state.flags);
  }
  const completed = !!state.flags.serpentGeneralDefeated || !!state.flags.lionTrialWon;
  const endingId = completed ? endingFromState(state) : null;
  const baseResult = {
    stance: verdictAtFinalDecision.stance,
    finalRoute: route,
    boss,
    endingId,
    persistedFinaleCombat,
  };
  const selectedEventIds = r4OpportunityResults.flatMap((entry) => entry.selectedEventId ? [entry.selectedEventId] : []);

  return {
    profileId: profile.id,
    seed,
    initialReputation,
    finalRelevantReputation: state.reputation,
    reputationBand: reputationBand(state.reputation),
    historicalFacts: relevantFacts(state.flags),
    conductScore: verdictAtFinalDecision.conductScore,
    conduct: verdictAtFinalDecision.conductTier,
    witnessState: verdictAtFinalDecision.witnessState,
    shadowKnowledge: verdictAtFinalDecision.shadowKnowledge,
    shadowDisclosure: verdictAtFinalDecision.shadowDisclosure,
    adaptiveSelections,
    contextualResolutions,
    ateResults,
    r4OpportunityResults,
    r4SelectedEventIds: selectedEventIds,
    r4NoEventCount: r4OpportunityResults.filter((entry) => entry.noEvent).length,
    totalR4Events: selectedEventIds.length,
    stance: verdictAtFinalDecision.stance,
    verdictReasonIds: [...verdictAtFinalDecision.reasons],
    finalRoute: route,
    trialCause,
    persistedFinaleCombat,
    pendingFinaleCombat,
    boss,
    endingId,
    impossibleOutcomes: detectImpossibleOutcomes(state, baseResult),
  };
}

export function simulateLionSeedRange(
  profile: LionSimulationProfile,
  seeds: readonly number[],
  options: SimulateLionOptions = {},
): LionSimulationResult[] {
  return seeds.map((seed) => simulateLionRunProfile(profile, seed, options));
}

export interface LionSimulationAggregate {
  sampleSize: number;
  stanceCounts: Record<LionVerdictStance, number>;
  routeCounts: Record<LionFinalRoute, number>;
  eventCounts: Record<string, number>;
  noEventOpportunityCount: number;
  totalR4Events: number;
  averageR4EventsPerRun: number;
  invariantFailureCount: number;
}

export function aggregateLionSimulation(results: readonly LionSimulationResult[]): LionSimulationAggregate {
  const stanceCounts: Record<LionVerdictStance, number> = {
    respect: 0,
    respect_with_reservations: 0,
    uncertain: 0,
    distrust: 0,
    hostile: 0,
  };
  const routeCounts: Record<LionFinalRoute, number> = { serpent_pursuit: 0, lion_trial: 0 };
  const eventCounts: Record<string, number> = {};
  let noEventOpportunityCount = 0;
  let totalR4Events = 0;
  let invariantFailureCount = 0;
  for (const result of results) {
    stanceCounts[result.stance] += 1;
    routeCounts[result.finalRoute] += 1;
    noEventOpportunityCount += result.r4NoEventCount;
    totalR4Events += result.totalR4Events;
    invariantFailureCount += result.impossibleOutcomes.length;
    for (const id of result.r4SelectedEventIds) eventCounts[id] = (eventCounts[id] ?? 0) + 1;
  }
  return {
    sampleSize: results.length,
    stanceCounts,
    routeCounts,
    eventCounts: Object.fromEntries(Object.entries(eventCounts).sort(([left], [right]) => left.localeCompare(right))),
    noEventOpportunityCount,
    totalR4Events,
    averageR4EventsPerRun: results.length === 0 ? 0 : totalR4Events / results.length,
    invariantFailureCount,
  };
}

export interface SeedInvariantAudit {
  invariant: boolean;
  differingFields: string[];
}

export function auditFactSeedInvariance(results: readonly LionSimulationResult[]): SeedInvariantAudit {
  const first = results[0];
  if (!first) return { invariant: true, differingFields: [] };
  const fields: Array<keyof LionSimulationResult> = [
    'conduct', 'witnessState', 'shadowKnowledge', 'shadowDisclosure', 'stance', 'verdictReasonIds',
    'finalRoute', 'trialCause', 'persistedFinaleCombat', 'boss', 'endingId',
  ];
  const differingFields = fields.filter((field) => {
    const expected = JSON.stringify(first[field]);
    return results.some((result) => JSON.stringify(result[field]) !== expected);
  });
  return { invariant: differingFields.length === 0, differingFields: differingFields.map(String) };
}

export function serializeReloadSimulation(profile: LionSimulationProfile, seed: number): {
  direct: LionSimulationResult;
  reloaded: LionSimulationResult;
} {
  return {
    direct: simulateLionRunProfile(profile, seed),
    reloaded: simulateLionRunProfile(structuredClone(profile), seed, { roundTripAfterEachNode: true }),
  };
}

export function productionEquivalentVariantGroupCount(): number {
  return Object.values(CONTEXTUAL_DIALOGUE_DEFINITIONS).reduce(
    (count, definition) => count + (definition.variants ?? []).filter((variant) => variant.equivalenceGroup).length,
    0,
  );
}

export function resolveProfileDialogue(
  profile: LionSimulationProfile,
  seed: number,
  dialogueId: string,
): ContextualResolutionResult | null {
  const resolved = resolveGameDialogue(dialogueId, createProfileState(profile, seed, false));
  return resolved ? {
    dialogueId,
    variantId: resolved.variantId,
    optionalStepIds: [...resolved.optionalStepIds],
  } : null;
}

const EQUIVALENT_FIXTURE_BASE: DialogueSequence = dialogueSequenceSchema.parse({
  id: 'r7_equivalent_fixture',
  steps: [{
    id: '1', speaker: 'Narrateur', tag: '', text: 'Equivalent base.', expression: 'neutral',
    portrait: '', side: 'center', next: null, effects: [], choices: [],
  }],
});

const EQUIVALENT_FIXTURE: ContextualDialogueDefinition = {
  variants: [
    { id: 'equivalent-a', priority: 10, equivalenceGroup: 'equivalent-prose', when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'A' } }] },
    { id: 'equivalent-b', priority: 10, equivalenceGroup: 'equivalent-prose', when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'B' } }] },
    { id: 'equivalent-c', priority: 10, equivalenceGroup: 'equivalent-prose', when: { kind: 'always' }, stepPatches: [{ stepId: '1', patch: { text: 'C' } }] },
  ],
};

export function resolveEquivalentFixture(seed: number, reverse = false): string {
  const state = createProfileState(generateCanonicalLionProfiles()[0]!, seed, false);
  const variants = reverse ? [...EQUIVALENT_FIXTURE.variants!].reverse() : EQUIVALENT_FIXTURE.variants;
  return resolveContextualDialogue(EQUIVALENT_FIXTURE_BASE, state, { variants }).variantId!;
}

export function measureEquivalentFixture(seeds: readonly number[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const seed of seeds) {
    const id = resolveEquivalentFixture(seed);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export function auditAllAteRules(profile: LionSimulationProfile, seed: number): {
  eligible: string[];
  onceSuppressed: string[];
  missingDialogues: string[];
} {
  const state = createProfileState(profile, seed, false);
  const eligible: string[] = [];
  const onceSuppressed: string[] = [];
  const missingDialogues: string[] = [];
  for (const rule of CONTEXTUAL_ATE_RULES) {
    const first = resolveGameAteRules(rule.triggerNodeId, state).find((candidate) => candidate.id === rule.id);
    if (!first) continue;
    eligible.push(rule.id);
    if (!resolveGameDialogue(rule.dialogueId, state)) missingDialogues.push(rule.dialogueId);
    if (rule.once) {
      state.flags[ateSeenFlag(rule)] = true;
      const second = resolveGameAteRules(rule.triggerNodeId, state).find((candidate) => candidate.id === rule.id);
      if (!second) onceSuppressed.push(rule.id);
    }
  }
  return { eligible, onceSuppressed, missingDialogues };
}

export function allAteRules(): readonly ContextualAteRule[] {
  return CONTEXTUAL_ATE_RULES;
}

export function reputationDefinitions(): readonly ReputationEventDefinition[] {
  return REPUTATION_EVENT_DEFINITIONS;
}

export function readSimulationOccurrences(state: Readonly<GameState>) {
  return readReputationEventOccurrences(state);
}

export interface ProfileDistributionSummary extends LionSimulationAggregate {
  profileId: string;
  seedStart: number;
  seedEnd: number;
  factSeedInvariant: boolean;
  factSeedDifferences: string[];
  contextualSeedInvariant: boolean;
  stance: LionVerdictStance;
  route: LionFinalRoute;
  conduct: SimulationConductFamily;
  witnessState: LionSimulationResult['witnessState'];
  shadowKnowledge: LionSimulationResult['shadowKnowledge'];
  shadowDisclosure: LionSimulationResult['shadowDisclosure'];
}

export function auditProfileDistribution(
  profile: LionSimulationProfile,
  seeds: readonly number[],
): ProfileDistributionSummary {
  const results = simulateLionSeedRange(profile, seeds);
  const aggregate = aggregateLionSimulation(results);
  const factAudit = auditFactSeedInvariance(results);
  const first = results[0] ?? simulateLionRunProfile(profile, 0);
  const contextualSeedInvariant = results.every((result) => (
    JSON.stringify(result.contextualResolutions) === JSON.stringify(first.contextualResolutions)
    && JSON.stringify(result.ateResults) === JSON.stringify(first.ateResults)
  ));
  return {
    profileId: profile.id,
    seedStart: seeds[0] ?? 0,
    seedEnd: seeds[seeds.length - 1] ?? 0,
    ...aggregate,
    factSeedInvariant: factAudit.invariant,
    factSeedDifferences: factAudit.differingFields,
    contextualSeedInvariant,
    stance: first.stance,
    route: first.finalRoute,
    conduct: first.conduct,
    witnessState: first.witnessState,
    shadowKnowledge: first.shadowKnowledge,
    shadowDisclosure: first.shadowDisclosure,
  };
}

export interface R4EventDistributionRow {
  eventId: string;
  category: 'hostile' | 'helpful' | 'neutral';
  eligible: number;
  selected: number;
  selectedPerEligible: number;
}

export interface R4OpportunityDistributionRow {
  opportunityKey: string;
  attempts: number;
  candidateEligibilityTotal: number;
  selected: number;
  noEvent: number;
  noEventPercentage: number;
}

export interface R4ReputationDistribution {
  reputation: number;
  sampleRuns: number;
  opportunityAttempts: number;
  categorySelections: Record<'hostile' | 'helpful' | 'neutral', number>;
  categoryPercentages: Record<'hostile' | 'helpful' | 'neutral', number>;
  noEventCount: number;
  noEventPercentage: number;
  averageEventsPerRun: number;
  eventsPerRun: Record<'0' | '1' | '2', number>;
  attemptedMoreThanTwoRuns: number;
  eventRows: R4EventDistributionRow[];
  opportunityRows: R4OpportunityDistributionRow[];
  rejectionCounts: Partial<Record<ReputationEventRejectionReason, number>>;
  invariantFailures: string[];
}

const R4_WINDOWS = [
  { nodeId: 'lion-first-refuge', step: 6 },
  { nodeId: 'lion-village-choice', step: 10 },
  { nodeId: 'lion-final-refuge', step: 16 },
] as const;

function r4AuditProfiles(reputation: number): readonly LionSimulationProfile[] {
  const profiles = generateCanonicalLionProfiles();
  const honour = structuredClone(profiles.find((profile) => profile.id === 'PURE_HONOUR')!);
  const infamy = structuredClone(profiles.find((profile) => profile.id === 'INFAMY')!);
  honour.id = `R4_HONOUR_${reputation}`;
  infamy.id = `R4_INFAMY_${reputation}`;
  honour.reputation = reputation;
  infamy.reputation = reputation;
  return [honour, infamy];
}

export function auditR4ReputationDistribution(
  reputation: number,
  seeds: readonly number[],
): R4ReputationDistribution {
  const profiles = r4AuditProfiles(reputation);
  const eventStats = new Map<string, { eligible: number; selected: number }>();
  const opportunityStats = new Map<string, { attempts: number; eligible: number; selected: number; noEvent: number }>();
  const categorySelections = { hostile: 0, helpful: 0, neutral: 0 };
  const eventsPerRun = { '0': 0, '1': 0, '2': 0 };
  const rejectionCounts: Partial<Record<ReputationEventRejectionReason, number>> = {
    condition_ineligible: 0,
    unique_already_consumed: 0,
    family_cooldown: 0,
    opportunity_budget_exhausted: 0,
    global_frequency_cooldown: 0,
    non_positive_base_weight: 0,
    non_positive_effective_weight: 0,
  };
  const invariantFailures: string[] = [];
  let attemptedMoreThanTwoRuns = 0;
  let totalEvents = 0;
  let noEventCount = 0;

  for (let runIndex = 0; runIndex < seeds.length; runIndex += 1) {
    const seed = seeds[runIndex]!;
    const profile = profiles[runIndex % profiles.length]!;
    const state = createProfileState(profile, seed, false);
    let runEvents = 0;
    let budgetBlocked = false;
    const selectedIds = new Set<string>();
    const familySteps = new Map<string, number>();
    let lastEventStep: number | null = null;

    for (const window of R4_WINDOWS) {
      state.stepCounter = window.step;
      const opportunity = getReputationEventOpportunity(window.nodeId, state)!;
      const selection = selectReputationEvent(state, opportunity, REPUTATION_EVENT_DEFINITIONS);
      const reversed = selectReputationEvent(state, opportunity, [...REPUTATION_EVENT_DEFINITIONS].reverse());
      if (selection.trace.selectedEventId !== reversed.trace.selectedEventId) {
        invariantFailures.push(`REGISTRATION_ORDER:${seed}:${window.nodeId}`);
      }
      const same = selectReputationEvent(state, opportunity, REPUTATION_EVENT_DEFINITIONS);
      if (selection.trace.selectedEventId !== same.trace.selectedEventId || selection.trace.hashValue !== same.trace.hashValue) {
        invariantFailures.push(`NON_DETERMINISTIC_SELECTION:${seed}:${window.nodeId}`);
      }

      const opportunityStat = opportunityStats.get(opportunity.key)
        ?? { attempts: 0, eligible: 0, selected: 0, noEvent: 0 };
      opportunityStat.attempts += 1;
      opportunityStat.eligible += selection.trace.eligibleEventIds.length;
      if (selection.selectedEvent) opportunityStat.selected += 1;
      else opportunityStat.noEvent += 1;
      opportunityStats.set(opportunity.key, opportunityStat);

      for (const candidate of selection.trace.candidates) {
        const stat = eventStats.get(candidate.eventId) ?? { eligible: 0, selected: 0 };
        if (candidate.status === 'eligible') stat.eligible += 1;
        eventStats.set(candidate.eventId, stat);
        for (const reason of candidate.rejectionReasons) {
          rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1;
          if (reason === 'opportunity_budget_exhausted') budgetBlocked = true;
        }
      }

      const beforeOccurrenceCount = readReputationEventOccurrences(state).length;
      if (!selection.selectedEvent) {
        noEventCount += 1;
        recordReputationEventSelection(state, selection);
        if (readReputationEventOccurrences(state).length !== beforeOccurrenceCount) {
          invariantFailures.push(`NO_EVENT_CONSUMED_OCCURRENCE:${seed}:${window.nodeId}`);
        }
        continue;
      }

      const event = selection.selectedEvent;
      const stat = eventStats.get(event.id)!;
      stat.selected += 1;
      const category = event.reputationCategory ?? 'neutral';
      categorySelections[category] += 1;
      if (event.unique && selectedIds.has(event.id)) invariantFailures.push(`DUPLICATE_UNIQUE:${seed}:${event.id}`);
      selectedIds.add(event.id);
      const family = event.familyId ?? event.id;
      const previousFamilyStep = familySteps.get(family);
      if (previousFamilyStep !== undefined && window.step - previousFamilyStep < (event.cooldownSteps ?? 0)) {
        invariantFailures.push(`FAMILY_COOLDOWN:${seed}:${family}`);
      }
      if (lastEventStep !== null && window.step - lastEventStep < (opportunity.minimumStepsSinceAnyEvent ?? 0)) {
        invariantFailures.push(`GLOBAL_SPACING:${seed}:${window.nodeId}`);
      }
      familySteps.set(family, window.step);
      lastEventStep = window.step;
      recordReputationEventSelection(state, selection);
      runEvents += 1;
      totalEvents += 1;
    }
    if (runEvents > 2) invariantFailures.push(`RUN_BUDGET:${seed}:${runEvents}`);
    eventsPerRun[String(Math.min(runEvents, 2)) as keyof typeof eventsPerRun] += 1;
    if (budgetBlocked) attemptedMoreThanTwoRuns += 1;
  }

  const opportunityAttempts = seeds.length * R4_WINDOWS.length;
  const eventRows = REPUTATION_EVENT_DEFINITIONS.map((event) => {
    const stats = eventStats.get(event.id) ?? { eligible: 0, selected: 0 };
    return {
      eventId: event.id,
      category: event.reputationCategory ?? 'neutral',
      eligible: stats.eligible,
      selected: stats.selected,
      selectedPerEligible: stats.eligible === 0 ? 0 : stats.selected / stats.eligible,
    };
  });
  const opportunityRows = [...opportunityStats.entries()].map(([opportunityKey, stats]) => ({
    opportunityKey,
    attempts: stats.attempts,
    candidateEligibilityTotal: stats.eligible,
    selected: stats.selected,
    noEvent: stats.noEvent,
    noEventPercentage: stats.attempts === 0 ? 0 : stats.noEvent / stats.attempts,
  }));
  return {
    reputation,
    sampleRuns: seeds.length,
    opportunityAttempts,
    categorySelections,
    categoryPercentages: {
      hostile: categorySelections.hostile / opportunityAttempts,
      helpful: categorySelections.helpful / opportunityAttempts,
      neutral: categorySelections.neutral / opportunityAttempts,
    },
    noEventCount,
    noEventPercentage: noEventCount / opportunityAttempts,
    averageEventsPerRun: seeds.length === 0 ? 0 : totalEvents / seeds.length,
    eventsPerRun,
    attemptedMoreThanTwoRuns,
    eventRows,
    opportunityRows,
    rejectionCounts,
    invariantFailures,
  };
}

export function probeR4SpacingAndCooldowns(): {
  familyCooldownRejections: number;
  globalSpacingRejections: number;
  budgetRejections: number;
} {
  const state = createProfileState(generateCanonicalLionProfiles()[4]!, 41, false);
  state.seenUniqueEvents.push(reputationEventOccurrenceKey({
    eventId: 'roadside-intimidation',
    familyId: 'roadside-pressure',
    opportunityKey: 'lion-social-window-1',
    step: 6,
  }));

  state.stepCounter = 9;
  const familyOpportunity = getReputationEventOpportunity('lion-village-choice', state)!;
  const familySelection = selectReputationEvent(state, familyOpportunity, REPUTATION_EVENT_DEFINITIONS);
  const familyCooldownRejections = familySelection.trace.candidates.filter((candidate) => (
    candidate.rejectionReasons.includes('family_cooldown')
  )).length;

  state.stepCounter = 8;
  const spacingOpportunity = getReputationEventOpportunity('lion-village-choice', state)!;
  const spacingSelection = selectReputationEvent(state, spacingOpportunity, REPUTATION_EVENT_DEFINITIONS);
  const globalSpacingRejections = spacingSelection.trace.candidates.filter((candidate) => (
    candidate.rejectionReasons.includes('global_frequency_cooldown')
  )).length;

  state.seenUniqueEvents.push(reputationEventOccurrenceKey({
    eventId: 'brokered-information',
    familyId: 'roadside-opportunity',
    opportunityKey: 'lion-social-window-2',
    step: 10,
  }));
  state.stepCounter = 16;
  const budgetOpportunity = getReputationEventOpportunity('lion-final-refuge', state)!;
  const budgetSelection = selectReputationEvent(state, budgetOpportunity, REPUTATION_EVENT_DEFINITIONS);
  const budgetRejections = budgetSelection.trace.candidates.filter((candidate) => (
    candidate.rejectionReasons.includes('opportunity_budget_exhausted')
  )).length;
  return { familyCooldownRejections, globalSpacingRejections, budgetRejections };
}

export interface FullR7Audit {
  schemaVersion: 1;
  baselineHead: string;
  generatedAtPolicy: 'deterministic-no-timestamp';
  seedRanges: {
    canonicalAndLegacy: string;
    r4Distribution: string;
    equivalentFixture: string;
    matrix: string;
  };
  counts: {
    coherentProfiles: number;
    legacyProfiles: number;
    controlledMatrixProfiles: number;
    rejectedMatrixProfiles: number;
    canonicalSimulations: number;
    legacySimulations: number;
    matrixSimulations: number;
    r4DistributionRuns: number;
    equivalentVariantResolutions: number;
    totalCases: number;
  };
  performanceMs: {
    oneThousandNarrativeSimulations: number;
    tenThousandR4Runs: number;
    fullMatrix: number;
  };
  profileDistributions: ProfileDistributionSummary[];
  legacyDistributions: ProfileDistributionSummary[];
  r4Distributions: R4ReputationDistribution[];
  equivalentVariantDistribution: {
    productionAuthoredGroupCandidates: number;
    qaFixtureCounts: Record<string, number>;
  };
  matrix: Omit<ControlledProfileMatrix, 'profiles'>;
  gates: {
    invariantFailureCount: number;
    reloadMismatchCount: number;
    r4InvariantFailureCount: number;
    eventStarvationWarnings: string[];
    eventDominanceWarnings: string[];
  };
}

function resultComparable(result: LionSimulationResult): unknown {
  return {
    ...result,
    adaptiveSelections: result.adaptiveSelections,
    r4OpportunityResults: result.r4OpportunityResults,
  };
}

export function runFullR7Audit(): FullR7Audit {
  const fullStart = performance.now();
  const canonical = generateCanonicalLionProfiles();
  const legacy = generateLegacyContradictionProfiles();
  const matrix = generateControlledProfileMatrix();

  const firstStart = performance.now();
  const firstProfile = auditProfileDistribution(canonical[0]!, R7_CANONICAL_SEEDS);
  const oneThousandNarrativeSimulations = performance.now() - firstStart;
  const profileDistributions = [
    firstProfile,
    ...canonical.slice(1).map((profile) => auditProfileDistribution(profile, R7_CANONICAL_SEEDS)),
  ];
  const legacyDistributions = legacy.map((profile) => auditProfileDistribution(profile, R7_CANONICAL_SEEDS));

  let matrixInvariantFailures = 0;
  for (let index = 0; index < matrix.profiles.length; index += 1) {
    const result = simulateLionRunProfile(matrix.profiles[index]!, 200_000 + index);
    matrixInvariantFailures += result.impossibleOutcomes.length;
  }

  const r4Distributions: R4ReputationDistribution[] = [];
  let tenThousandR4Runs = 0;
  for (const reputation of R7_REPUTATION_BANDS) {
    const started = performance.now();
    const distribution = auditR4ReputationDistribution(reputation, R7_DISTRIBUTION_SEEDS);
    const elapsed = performance.now() - started;
    if (reputation === R7_REPUTATION_BANDS[0]) tenThousandR4Runs = elapsed;
    r4Distributions.push(distribution);
  }
  const equivalentCounts = measureEquivalentFixture(R7_DISTRIBUTION_SEEDS);

  let reloadMismatchCount = 0;
  for (const profile of [...canonical, ...legacy]) {
    for (const seed of [0, 499, 999]) {
      const { direct, reloaded } = serializeReloadSimulation(profile, seed);
      if (JSON.stringify(resultComparable(direct)) !== JSON.stringify(resultComparable(reloaded))) reloadMismatchCount += 1;
    }
  }

  const eventTotals = new Map<string, { eligible: number; selected: number }>();
  for (const distribution of r4Distributions) for (const row of distribution.eventRows) {
    const total = eventTotals.get(row.eventId) ?? { eligible: 0, selected: 0 };
    total.eligible += row.eligible;
    total.selected += row.selected;
    eventTotals.set(row.eventId, total);
  }
  const eventStarvationWarnings: string[] = [];
  const eventDominanceWarnings: string[] = [];
  for (const [eventId, total] of eventTotals) {
    const rate = total.eligible === 0 ? 0 : total.selected / total.eligible;
    if (total.eligible > 0 && rate < 0.01) eventStarvationWarnings.push(`${eventId}:${rate.toFixed(4)}`);
    if (total.eligible > 0 && rate > 0.8) eventDominanceWarnings.push(`${eventId}:${rate.toFixed(4)}`);
  }

  const invariantFailureCount = matrixInvariantFailures
    + profileDistributions.reduce((total, profile) => total + profile.invariantFailureCount + (profile.factSeedInvariant ? 0 : 1) + (profile.contextualSeedInvariant ? 0 : 1), 0)
    + legacyDistributions.reduce((total, profile) => total + profile.invariantFailureCount + (profile.factSeedInvariant ? 0 : 1) + (profile.contextualSeedInvariant ? 0 : 1), 0);
  const r4InvariantFailureCount = r4Distributions.reduce((total, distribution) => total + distribution.invariantFailures.length, 0);
  const totalCases = canonical.length * R7_CANONICAL_SEEDS.length
    + legacy.length * R7_CANONICAL_SEEDS.length
    + matrix.profiles.length
    + R7_REPUTATION_BANDS.length * R7_DISTRIBUTION_SEEDS.length
    + R7_DISTRIBUTION_SEEDS.length;

  return {
    schemaVersion: 1,
    baselineHead: R7_BASELINE_HEAD,
    generatedAtPolicy: 'deterministic-no-timestamp',
    seedRanges: {
      canonicalAndLegacy: '0..999',
      r4Distribution: '0..9999',
      equivalentFixture: '0..9999',
      matrix: `200000..${200_000 + Math.max(0, matrix.profiles.length - 1)}`,
    },
    counts: {
      coherentProfiles: canonical.length,
      legacyProfiles: legacy.length,
      controlledMatrixProfiles: matrix.profiles.length,
      rejectedMatrixProfiles: matrix.rejectedCount,
      canonicalSimulations: canonical.length * R7_CANONICAL_SEEDS.length,
      legacySimulations: legacy.length * R7_CANONICAL_SEEDS.length,
      matrixSimulations: matrix.profiles.length,
      r4DistributionRuns: R7_REPUTATION_BANDS.length * R7_DISTRIBUTION_SEEDS.length,
      equivalentVariantResolutions: R7_DISTRIBUTION_SEEDS.length,
      totalCases,
    },
    performanceMs: {
      oneThousandNarrativeSimulations,
      tenThousandR4Runs,
      fullMatrix: performance.now() - fullStart,
    },
    profileDistributions,
    legacyDistributions,
    r4Distributions,
    equivalentVariantDistribution: {
      productionAuthoredGroupCandidates: productionEquivalentVariantGroupCount(),
      qaFixtureCounts: equivalentCounts,
    },
    matrix: {
      attemptedCount: matrix.attemptedCount,
      rejectedCount: matrix.rejectedCount,
      rejectedByReason: matrix.rejectedByReason,
    },
    gates: {
      invariantFailureCount,
      reloadMismatchCount,
      r4InvariantFailureCount,
      eventStarvationWarnings,
      eventDominanceWarnings,
    },
  };
}

export function compactR7Snapshot(audit: FullR7Audit): Omit<FullR7Audit, 'performanceMs'> & {
  performancePolicy: string;
} {
  const { performanceMs: _runtimeSpecific, ...deterministic } = audit;
  return {
    ...deterministic,
    performancePolicy: 'Runtime is reported in the R7 report; excluded from deterministic snapshot.',
    profileDistributions: audit.profileDistributions.map((profile) => ({
      ...profile,
      averageR4EventsPerRun: Number(profile.averageR4EventsPerRun.toFixed(6)),
    })),
    legacyDistributions: audit.legacyDistributions.map((profile) => ({
      ...profile,
      averageR4EventsPerRun: Number(profile.averageR4EventsPerRun.toFixed(6)),
    })),
    r4Distributions: audit.r4Distributions.map((distribution) => ({
      ...distribution,
      categoryPercentages: Object.fromEntries(Object.entries(distribution.categoryPercentages).map(([key, value]) => [key, Number(value.toFixed(6))])) as R4ReputationDistribution['categoryPercentages'],
      noEventPercentage: Number(distribution.noEventPercentage.toFixed(6)),
      averageEventsPerRun: Number(distribution.averageEventsPerRun.toFixed(6)),
      eventRows: distribution.eventRows.map((row) => ({ ...row, selectedPerEligible: Number(row.selectedPerEligible.toFixed(6)) })),
      opportunityRows: distribution.opportunityRows.map((row) => ({ ...row, noEventPercentage: Number(row.noEventPercentage.toFixed(6)) })),
    })),
  };
}

export function buildR7FastRegressionSnapshot(): unknown {
  const canonical = generateCanonicalLionProfiles();
  const profileIds = [
    'PURE_HONOUR',
    'REAL_MIXED_PROFILE',
    'UNCERTAIN',
    'INFAMY',
    'HIGH_REPUTATION_PLUS_INFAMY',
    'LOW_REPUTATION_PLUS_HONOUR',
    'SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES',
    'VOLUNTARY_LION_TRIAL',
  ];
  const profileSeeds = Array.from({ length: 32 }, (_, index) => index);
  const r4Seeds = Array.from({ length: 200 }, (_, index) => index);
  return {
    schemaVersion: 1,
    baselineHead: R7_BASELINE_HEAD,
    seedRanges: { profiles: '0..31', r4: '0..199', equivalent: '0..199' },
    profiles: profileIds.map((id) => {
      const profile = canonical.find((entry) => entry.id === id)!;
      const summary = auditProfileDistribution(profile, profileSeeds);
      return {
        profileId: id,
        stanceCounts: summary.stanceCounts,
        routeCounts: summary.routeCounts,
        eventCounts: summary.eventCounts,
        noEventOpportunityCount: summary.noEventOpportunityCount,
        totalR4Events: summary.totalR4Events,
        invariantFailureCount: summary.invariantFailureCount,
      };
    }),
    r4: [5, 50, 95].map((reputation) => {
      const result = auditR4ReputationDistribution(reputation, r4Seeds);
      return {
        reputation,
        categorySelections: result.categorySelections,
        noEventCount: result.noEventCount,
        eventsPerRun: result.eventsPerRun,
        eventSelections: Object.fromEntries(result.eventRows.map((row) => [row.eventId, row.selected])),
        invariantFailureCount: result.invariantFailures.length,
      };
    }),
    equivalentFixture: measureEquivalentFixture(r4Seeds),
  };
}
