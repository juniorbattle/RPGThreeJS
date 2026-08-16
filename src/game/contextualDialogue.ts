import { resolveLionNarrativeState } from './lionNarrative';
import type {
  LionConductTier,
  LionShadowDisclosure,
  LionShadowKnowledge,
  LionWitnessState,
} from './lionNarrative';
import { resolveLionVerdict } from './lionVerdict';
import type { LionFinalRoute, LionVerdictStance } from './lionVerdict';
import { dialogueSequenceSchema } from './types';
import type { DialogueSequence, DialogueStep, GameState } from './types';

export type DialogueCondition =
  | { kind: 'always' }
  | { kind: 'flag'; key: string; value?: boolean }
  | { kind: 'publicReputation'; min?: number; max?: number }
  | {
    kind: 'reputationHistory';
    source?: string;
    sourcePrefix?: string;
    minDelta?: number;
    maxDelta?: number;
    minMatches?: number;
  }
  | { kind: 'resolvedNode'; nodeId: string }
  | { kind: 'visitedNode'; nodeId: string }
  | { kind: 'seenUniqueEvent'; eventId: string }
  | { kind: 'unitInClan'; definitionId: string }
  | { kind: 'lionConduct'; tiers: readonly LionConductTier[] }
  | { kind: 'lionWitness'; states: readonly LionWitnessState[] }
  | { kind: 'lionShadowKnowledge'; states: readonly LionShadowKnowledge[] }
  | { kind: 'lionShadowDisclosure'; states: readonly LionShadowDisclosure[] }
  | { kind: 'lionVerdictReason'; reason: string }
  | { kind: 'lionVerdictStance'; stances: readonly LionVerdictStance[] }
  | { kind: 'lionFinalRoute'; routes: readonly LionFinalRoute[] }
  | { kind: 'all'; conditions: readonly DialogueCondition[] }
  | { kind: 'any'; conditions: readonly DialogueCondition[] }
  | { kind: 'not'; condition: DialogueCondition };

export interface ContextualStepPatch {
  stepId: string;
  patch: Partial<Omit<DialogueStep, 'id'>>;
}

export interface ContextualDialogueVariant {
  id: string;
  when: DialogueCondition;
  priority?: number;
  /**
   * Tied variants are hash-selected only when every tied variant names the
   * same group. Content authors must use a group solely for equivalent prose.
   */
  equivalenceGroup?: string;
  stepPatches: readonly ContextualStepPatch[];
}

export interface ContextualOptionalStep {
  id: string;
  when: DialogueCondition;
  afterStepId: string;
  priority?: number;
  step: Omit<DialogueStep, 'next'>;
}

export interface ContextualDialogueDefinition {
  variants?: readonly ContextualDialogueVariant[];
  optionalSteps?: readonly ContextualOptionalStep[];
}

export interface ResolvedContextualDialogue {
  sequence: DialogueSequence;
  variantId: string | null;
  optionalStepIds: string[];
}

export interface ContextualAteRule {
  id: string;
  triggerNodeId: string;
  dialogueId: string;
  priority?: number;
  once?: boolean;
  when?: DialogueCondition;
}

interface ConditionContext {
  state: Readonly<GameState>;
  lion: ReturnType<typeof resolveLionNarrativeState>;
  verdict: ReturnType<typeof resolveLionVerdict>;
}

function makeConditionContext(state: Readonly<GameState>): ConditionContext {
  return {
    state,
    lion: resolveLionNarrativeState(state.flags),
    verdict: resolveLionVerdict({ flags: state.flags, reputation: state.reputation }),
  };
}

function evaluate(condition: DialogueCondition, context: ConditionContext): boolean {
  const { state, lion, verdict } = context;
  switch (condition.kind) {
    case 'always':
      return true;
    case 'flag':
      return (state.flags[condition.key] ?? false) === (condition.value ?? true);
    case 'publicReputation':
      return (condition.min === undefined || state.reputation >= condition.min)
        && (condition.max === undefined || state.reputation <= condition.max);
    case 'reputationHistory': {
      const matches = state.reputationHistory.filter((entry) => (
        (condition.source === undefined || entry.source === condition.source)
        && (condition.sourcePrefix === undefined || entry.source.startsWith(condition.sourcePrefix))
        && (condition.minDelta === undefined || entry.delta >= condition.minDelta)
        && (condition.maxDelta === undefined || entry.delta <= condition.maxDelta)
      ));
      return matches.length >= (condition.minMatches ?? 1);
    }
    case 'resolvedNode':
      return state.resolvedNodeIds.includes(condition.nodeId);
    case 'visitedNode':
      return state.visitedNodeIds.includes(condition.nodeId)
        || state.run.visitedNodeIds.includes(condition.nodeId);
    case 'seenUniqueEvent':
      return state.seenUniqueEvents.includes(condition.eventId);
    case 'unitInClan':
      return state.clan.members.some((unit) => unit.definitionId === condition.definitionId);
    case 'lionConduct':
      return condition.tiers.includes(lion.conductTier);
    case 'lionWitness':
      return condition.states.includes(lion.witnessState);
    case 'lionShadowKnowledge':
      return condition.states.includes(lion.shadowKnowledge);
    case 'lionShadowDisclosure':
      return condition.states.includes(lion.shadowDisclosure);
    case 'lionVerdictReason':
      return verdict.reasons.includes(condition.reason);
    case 'lionVerdictStance':
      return condition.stances.includes(verdict.stance);
    case 'lionFinalRoute':
      return condition.routes.includes(verdict.finalRoute);
    case 'all':
      return condition.conditions.every((entry) => evaluate(entry, context));
    case 'any':
      return condition.conditions.some((entry) => evaluate(entry, context));
    case 'not':
      return !evaluate(condition.condition, context);
  }
}

export function evaluateDialogueCondition(
  condition: DialogueCondition,
  state: Readonly<GameState>,
): boolean {
  return evaluate(condition, makeConditionContext(state));
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function chooseVariant(
  sequenceId: string,
  variants: readonly ContextualDialogueVariant[],
  context: ConditionContext,
): ContextualDialogueVariant | null {
  const eligible = variants
    .map((variant, declarationIndex) => ({ variant, declarationIndex }))
    .filter(({ variant }) => evaluate(variant.when, context));
  if (eligible.length === 0) return null;

  const highestPriority = Math.max(...eligible.map(({ variant }) => variant.priority ?? 0));
  const tied = eligible.filter(({ variant }) => (variant.priority ?? 0) === highestPriority);
  if (tied.length === 1) return tied[0]!.variant;

  const group = tied[0]!.variant.equivalenceGroup;
  const equivalent = group !== undefined
    && tied.every(({ variant }) => variant.equivalenceGroup === group);
  if (!equivalent) {
    tied.sort((left, right) => left.declarationIndex - right.declarationIndex);
    return tied[0]!.variant;
  }

  const candidates = tied.map(({ variant }) => variant)
    .sort((left, right) => left.id.localeCompare(right.id));
  const key = `${context.state.run.seed}:${sequenceId}:${group}`;
  return candidates[stableHash(key) % candidates.length]!;
}

function applyStepPatches(
  sequence: DialogueSequence,
  patches: readonly ContextualStepPatch[],
): void {
  for (const { stepId, patch } of patches) {
    const step = sequence.steps.find((candidate) => candidate.id === stepId);
    if (!step) throw new Error(`Contextual patch target '${sequence.id}:${stepId}' does not exist.`);
    Object.assign(step, structuredClone(patch));
  }
}

function insertOptionalSteps(
  sequence: DialogueSequence,
  optionalSteps: readonly ContextualOptionalStep[],
  context: ConditionContext,
): string[] {
  const eligible = optionalSteps
    .map((entry, declarationIndex) => ({ entry, declarationIndex }))
    .filter(({ entry }) => evaluate(entry.when, context));
  const byAnchor = new Map<string, typeof eligible>();
  for (const item of eligible) {
    const group = byAnchor.get(item.entry.afterStepId) ?? [];
    group.push(item);
    byAnchor.set(item.entry.afterStepId, group);
  }

  const inserted: string[] = [];
  for (const [anchorId, items] of byAnchor) {
    const anchorIndex = sequence.steps.findIndex((step) => step.id === anchorId);
    if (anchorIndex < 0) {
      throw new Error(`Contextual optional-step anchor '${sequence.id}:${anchorId}' does not exist.`);
    }
    const anchor = sequence.steps[anchorIndex]!;
    if ((anchor.choices?.length ?? 0) > 0) {
      throw new Error(`Contextual optional-step anchor '${sequence.id}:${anchorId}' must be linear.`);
    }

    items.sort((left, right) => (
      (right.entry.priority ?? 0) - (left.entry.priority ?? 0)
      || left.declarationIndex - right.declarationIndex
    ));
    const stepIds = new Set(sequence.steps.map((step) => step.id));
    for (const { entry } of items) {
      if (entry.id !== entry.step.id) {
        throw new Error(`Contextual optional step '${entry.id}' must match its step id '${entry.step.id}'.`);
      }
      if (stepIds.has(entry.step.id)) {
        throw new Error(`Contextual optional step '${sequence.id}:${entry.step.id}' already exists.`);
      }
      stepIds.add(entry.step.id);
    }

    const originalNext = anchor.next ?? null;
    const additions = items.map(({ entry }, index) => ({
      ...structuredClone(entry.step),
      next: items[index + 1]?.entry.step.id ?? originalNext,
    }));
    anchor.next = additions[0]!.id;
    sequence.steps.splice(anchorIndex + 1, 0, ...additions);
    inserted.push(...items.map(({ entry }) => entry.id));
  }
  return inserted;
}

export function resolveContextualDialogue(
  baseSequence: Readonly<DialogueSequence>,
  state: Readonly<GameState>,
  definition: Readonly<ContextualDialogueDefinition> = {},
): ResolvedContextualDialogue {
  const context = makeConditionContext(state);
  const sequence = structuredClone(baseSequence) as DialogueSequence;
  const variant = chooseVariant(sequence.id, definition.variants ?? [], context);
  if (variant) applyStepPatches(sequence, variant.stepPatches);
  const optionalStepIds = insertOptionalSteps(sequence, definition.optionalSteps ?? [], context);

  return {
    sequence: dialogueSequenceSchema.parse(sequence),
    variantId: variant?.id ?? null,
    optionalStepIds,
  };
}

export function ateSeenFlag(rule: Pick<ContextualAteRule, 'id'>): string {
  return `ate:${rule.id}`;
}

export function resolveEligibleAteRules(
  triggerNodeId: string,
  state: Readonly<GameState>,
  rules: readonly ContextualAteRule[],
): ContextualAteRule[] {
  const context = makeConditionContext(state);
  return rules
    .map((rule, declarationIndex) => ({ rule, declarationIndex }))
    .filter(({ rule }) => rule.triggerNodeId === triggerNodeId)
    .filter(({ rule }) => !rule.once || state.flags[ateSeenFlag(rule)] !== true)
    .filter(({ rule }) => rule.when === undefined || evaluate(rule.when, context))
    .sort((left, right) => (
      (right.rule.priority ?? 0) - (left.rule.priority ?? 0)
      || left.declarationIndex - right.declarationIndex
    ))
    .map(({ rule }) => rule);
}
