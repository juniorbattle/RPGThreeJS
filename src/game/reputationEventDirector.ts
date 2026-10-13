import { evaluateDialogueCondition, type DialogueCondition } from './contextualDialogue';
import { getReputationRule } from './reputation';
import type { GameState, ReputationRule } from './types';

export type ReputationEventCategory = 'hostile' | 'helpful' | 'neutral';

export interface ReputationEventScope {
  opportunityKeys?: readonly string[];
  triggerNodeIds?: readonly string[];
  requiredOpportunityTags?: readonly string[];
}

export interface ReputationEventWeightModifier {
  id: string;
  multiplier: number;
  when?: DialogueCondition;
}

export interface ReputationEventDefinition {
  id: string;
  tags: readonly string[];
  baseWeight: number;
  scope?: ReputationEventScope;
  eligibility?: DialogueCondition;
  unique?: boolean;
  familyId?: string;
  cooldownSteps?: number;
  dialogueId: string;
  reputationCategory?: ReputationEventCategory;
  useAmbushWeighting?: boolean;
  priority?: number;
  weightModifiers?: readonly ReputationEventWeightModifier[];
  metadata?: {
    consequenceHints?: readonly string[];
    contentTags?: readonly string[];
  };
}

export interface ReputationEventOpportunity {
  key: string;
  triggerNodeId: string;
  step: number;
  tags: readonly string[];
  noEventWeight: number;
  maxEventsPerRun?: number;
  minimumStepsSinceAnyEvent?: number;
}

export type ReputationEventRejectionReason =
  | 'condition_ineligible'
  | 'unique_already_consumed'
  | 'family_cooldown'
  | 'opportunity_budget_exhausted'
  | 'global_frequency_cooldown'
  | 'non_positive_base_weight'
  | 'non_positive_effective_weight';

export interface ReputationEventAppliedModifier {
  id: string;
  multiplier: number;
}

export interface ReputationEventCandidateTrace {
  eventId: string;
  priority: number;
  status: 'eligible' | 'rejected';
  rejectionReasons: ReputationEventRejectionReason[];
  baseWeight: number;
  reputationCategory: ReputationEventCategory | null;
  reputationModifier: number;
  ambushModifier: number;
  explicitModifiers: ReputationEventAppliedModifier[];
  effectiveWeight: number;
}

export interface ReputationEventSelectionTrace {
  opportunityKey: string;
  triggerNodeId: string;
  opportunityStep: number;
  opportunityTags: string[];
  reputation: number;
  reputationRule: Pick<ReputationRule, 'min' | 'max' | 'label'>;
  registeredEventIds: string[];
  candidateIds: string[];
  eligibleEventIds: string[];
  rejectedEventIds: string[];
  candidates: ReputationEventCandidateTrace[];
  previousEventCount: number;
  lastEventStep: number | null;
  noEventWeight: number;
  totalEventWeight: number;
  totalWeight: number;
  hashInput: string;
  hashValue: number;
  rollUnit: number;
  weightedRoll: number;
  selectedEventId: string | null;
  noEventSelected: boolean;
}

export interface ReputationEventSelection {
  selectedEvent: ReputationEventDefinition | null;
  trace: ReputationEventSelectionTrace;
}

export interface ReputationEventOccurrence {
  eventId: string;
  familyId: string;
  opportunityKey: string;
  step: number;
}

const OCCURRENCE_PREFIX = 'reputation-director-event|';

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function roundedWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1_000_000) / 1_000_000;
}

function encodePart(value: string): string {
  return encodeURIComponent(value);
}

function decodePart(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function reputationEventOccurrenceKey(occurrence: ReputationEventOccurrence): string {
  return [
    OCCURRENCE_PREFIX.slice(0, -1),
    occurrence.step,
    encodePart(occurrence.opportunityKey),
    encodePart(occurrence.eventId),
    encodePart(occurrence.familyId),
  ].join('|');
}

export function readReputationEventOccurrences(
  state: Pick<GameState, 'seenUniqueEvents'>,
): ReputationEventOccurrence[] {
  const occurrences: ReputationEventOccurrence[] = [];
  for (const entry of state.seenUniqueEvents) {
    if (!entry.startsWith(OCCURRENCE_PREFIX)) continue;
    const parts = entry.split('|');
    if (parts.length !== 5) continue;
    const step = Number(parts[1]);
    const opportunityKey = decodePart(parts[2]!);
    const eventId = decodePart(parts[3]!);
    const familyId = decodePart(parts[4]!);
    if (!Number.isInteger(step) || step < 0 || !opportunityKey || !eventId || !familyId) continue;
    occurrences.push({ step, opportunityKey, eventId, familyId });
  }
  return occurrences.sort((left, right) => (
    left.step - right.step
    || left.opportunityKey.localeCompare(right.opportunityKey)
    || left.eventId.localeCompare(right.eventId)
  ));
}

function matchesScope(
  definition: ReputationEventDefinition,
  opportunity: ReputationEventOpportunity,
): boolean {
  const { scope } = definition;
  if (!scope) return true;
  if (scope.opportunityKeys && !scope.opportunityKeys.includes(opportunity.key)) return false;
  if (scope.triggerNodeIds && !scope.triggerNodeIds.includes(opportunity.triggerNodeId)) return false;
  if (
    scope.requiredOpportunityTags
    && !scope.requiredOpportunityTags.every((tag) => opportunity.tags.includes(tag))
  ) return false;
  return true;
}

function reputationModifierFor(
  definition: ReputationEventDefinition,
  reputationRule: ReputationRule,
): number {
  if (!definition.reputationCategory) return 1;
  return reputationRule.eventWeightModifiers[definition.reputationCategory] ?? 1;
}

function candidateTrace(
  definition: ReputationEventDefinition,
  state: Readonly<GameState>,
  opportunity: ReputationEventOpportunity,
  reputationRule: ReputationRule,
  occurrences: readonly ReputationEventOccurrence[],
  globalRejections: readonly ReputationEventRejectionReason[],
): ReputationEventCandidateTrace {
  const familyId = definition.familyId ?? definition.id;
  const rejectionReasons = [...globalRejections];
  if (definition.eligibility && !evaluateDialogueCondition(definition.eligibility, state)) {
    rejectionReasons.push('condition_ineligible');
  }
  if (definition.unique && occurrences.some((entry) => entry.eventId === definition.id)) {
    rejectionReasons.push('unique_already_consumed');
  }
  if ((definition.cooldownSteps ?? 0) > 0) {
    const lastFamilyStep = occurrences
      .filter((entry) => entry.familyId === familyId)
      .reduce<number | null>((latest, entry) => latest === null ? entry.step : Math.max(latest, entry.step), null);
    if (lastFamilyStep !== null && opportunity.step - lastFamilyStep < definition.cooldownSteps!) {
      rejectionReasons.push('family_cooldown');
    }
  }
  if (!Number.isFinite(definition.baseWeight) || definition.baseWeight <= 0) {
    rejectionReasons.push('non_positive_base_weight');
  }

  const reputationModifier = roundedWeight(reputationModifierFor(definition, reputationRule));
  const ambushModifier = definition.useAmbushWeighting
    ? roundedWeight(reputationRule.ambushWeightMultiplier)
    : 1;
  const explicitModifiers = (definition.weightModifiers ?? [])
    .filter((modifier) => modifier.when === undefined || evaluateDialogueCondition(modifier.when, state))
    .map((modifier) => ({ id: modifier.id, multiplier: roundedWeight(modifier.multiplier) }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const authoredMultiplier = explicitModifiers.reduce((value, modifier) => value * modifier.multiplier, 1);
  const effectiveWeight = roundedWeight(
    definition.baseWeight * reputationModifier * ambushModifier * authoredMultiplier,
  );
  if (effectiveWeight <= 0 && !rejectionReasons.includes('non_positive_base_weight')) {
    rejectionReasons.push('non_positive_effective_weight');
  }

  return {
    eventId: definition.id,
    priority: definition.priority ?? 0,
    status: rejectionReasons.length === 0 ? 'eligible' : 'rejected',
    rejectionReasons,
    baseWeight: definition.baseWeight,
    reputationCategory: definition.reputationCategory ?? null,
    reputationModifier,
    ambushModifier,
    explicitModifiers,
    effectiveWeight: rejectionReasons.length === 0 ? effectiveWeight : 0,
  };
}

export function selectReputationEvent(
  state: Readonly<GameState>,
  opportunity: Readonly<ReputationEventOpportunity>,
  definitions: readonly ReputationEventDefinition[],
): ReputationEventSelection {
  const duplicateIds = definitions
    .map((definition) => definition.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate reputation event id '${[...new Set(duplicateIds)].sort().join(', ')}'.`);
  }

  const registeredEventIds = definitions.map((definition) => definition.id).sort();
  const candidates = definitions
    .filter((definition) => matchesScope(definition, opportunity))
    .sort((left, right) => (
      (right.priority ?? 0) - (left.priority ?? 0)
      || left.id.localeCompare(right.id)
    ));
  const reputationRule = getReputationRule(state.reputation);
  const occurrences = readReputationEventOccurrences(state);
  const lastEventStep = occurrences.reduce<number | null>(
    (latest, entry) => latest === null ? entry.step : Math.max(latest, entry.step),
    null,
  );
  const globalRejections: ReputationEventRejectionReason[] = [];
  if (
    opportunity.maxEventsPerRun !== undefined
    && occurrences.length >= opportunity.maxEventsPerRun
  ) globalRejections.push('opportunity_budget_exhausted');
  if (
    lastEventStep !== null
    && (opportunity.minimumStepsSinceAnyEvent ?? 0) > 0
    && opportunity.step - lastEventStep < opportunity.minimumStepsSinceAnyEvent!
  ) globalRejections.push('global_frequency_cooldown');

  const candidateTraces = candidates.map((definition) => candidateTrace(
    definition,
    state,
    opportunity,
    reputationRule,
    occurrences,
    globalRejections,
  ));
  const eligibleDefinitions = candidates.filter((definition) => (
    candidateTraces.find((trace) => trace.eventId === definition.id)?.status === 'eligible'
  ));
  const eligibleTraces = candidateTraces.filter((trace) => trace.status === 'eligible');
  const totalEventWeight = roundedWeight(eligibleTraces.reduce(
    (total, trace) => total + trace.effectiveWeight,
    0,
  ));
  const noEventWeight = roundedWeight(Math.max(0, opportunity.noEventWeight));
  const totalWeight = roundedWeight(totalEventWeight + noEventWeight);
  const hashInput = [
    'reputation-event-director-v1',
    state.run.seed,
    opportunity.key,
    opportunity.triggerNodeId,
    opportunity.step,
  ].join('|');
  const hashValue = stableHash(hashInput);
  const rollUnit = hashValue / 0x1_0000_0000;
  const weightedRoll = totalWeight > 0 ? rollUnit * totalWeight : 0;

  let selectedEvent: ReputationEventDefinition | null = null;
  let cursor = 0;
  for (const definition of eligibleDefinitions) {
    const trace = eligibleTraces.find((entry) => entry.eventId === definition.id)!;
    cursor += trace.effectiveWeight;
    if (weightedRoll < cursor) {
      selectedEvent = definition;
      break;
    }
  }

  const trace: ReputationEventSelectionTrace = {
    opportunityKey: opportunity.key,
    triggerNodeId: opportunity.triggerNodeId,
    opportunityStep: opportunity.step,
    opportunityTags: [...opportunity.tags],
    reputation: state.reputation,
    reputationRule: { min: reputationRule.min, max: reputationRule.max, label: reputationRule.label },
    registeredEventIds,
    candidateIds: candidates.map((definition) => definition.id),
    eligibleEventIds: eligibleTraces.map((entry) => entry.eventId),
    rejectedEventIds: candidateTraces.filter((entry) => entry.status === 'rejected').map((entry) => entry.eventId),
    candidates: candidateTraces,
    previousEventCount: occurrences.length,
    lastEventStep,
    noEventWeight,
    totalEventWeight,
    totalWeight,
    hashInput,
    hashValue,
    rollUnit,
    weightedRoll,
    selectedEventId: selectedEvent?.id ?? null,
    noEventSelected: selectedEvent === null,
  };
  return { selectedEvent, trace };
}

export function recordReputationEventSelection(
  state: GameState,
  selection: Readonly<ReputationEventSelection>,
): string | null {
  const event = selection.selectedEvent;
  if (!event) return null;
  const key = reputationEventOccurrenceKey({
    eventId: event.id,
    familyId: event.familyId ?? event.id,
    opportunityKey: selection.trace.opportunityKey,
    step: selection.trace.opportunityStep,
  });
  if (!state.seenUniqueEvents.includes(key)) state.seenUniqueEvents.push(key);
  return key;
}
