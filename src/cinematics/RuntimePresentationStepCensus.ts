import {
  createRuntimeDialogueReachability,
  DEAD_OR_UNREACHABLE_PRESENTATION_STEP_REASONS,
  type RuntimePresentationStepClassification,
} from '../game/RuntimeDialogueReachability';
import {
  FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES,
  FINAL_DIALOGUE_PRESENTATION_PLANS,
  FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS,
} from './NarrativePresentationPlans';
import type { FinalDialoguePresentationPlan } from './DialoguePresentationSegments';

export type RuntimePresentationPlans = Readonly<
  Record<string, Readonly<Record<string, FinalDialoguePresentationPlan>>>
>;

export interface RuntimePresentationStepCensusEntry {
  key: string;
  classification: RuntimePresentationStepClassification;
  reason?: string;
}

export interface RuntimePresentationStepCensus {
  schemaVersion: 1;
  contract: 'RUNTIME_REACHABLE_PRESENTATION_STEPS == PLANNED_PRESENTATION_STEPS + EXPLICIT_LEGITIMATE_RUNTIME_ONLY_STEPS';
  summary: {
    stateScenarios: number;
    runtimePresentationVariants: number;
    canonicalDialogueSteps: number;
    runtimeReachablePresentationSteps: number;
    plannedRuntimePresentationSteps: number;
    explicitLegitimateRuntimeOnlySteps: number;
    missingFromPlan: number;
    deadOrUnreachable: number;
    unknown: number;
    missingVariantPlans: number;
    invalidVariantPlans: number;
  };
  entries: readonly RuntimePresentationStepCensusEntry[];
  missingRuntimeStepKeys: readonly string[];
  missingVariantSignatures: readonly string[];
  invalidVariantPlanErrors: readonly string[];
  contractErrors: readonly string[];
}

const GENERATED_RUNTIME_PLANS = FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS as unknown as RuntimePresentationPlans;
const GENERATED_CANONICAL_PLANS = FINAL_DIALOGUE_PRESENTATION_PLANS as unknown as Readonly<Record<string, FinalDialoguePresentationPlan>>;
const GENERATED_CANONICAL_SHAPES = FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES as unknown as Readonly<Record<string, string>>;

function planStepIds(plan: FinalDialoguePresentationPlan): string[] {
  return plan.segments.flatMap((segment) => [...segment.stepIds]);
}

export function createRuntimePresentationStepCensus(
  runtimePlans: RuntimePresentationPlans = GENERATED_RUNTIME_PLANS,
  canonicalPlans: Readonly<Record<string, FinalDialoguePresentationPlan>> = GENERATED_CANONICAL_PLANS,
  canonicalShapes: Readonly<Record<string, string>> = GENERATED_CANONICAL_SHAPES,
): RuntimePresentationStepCensus {
  const reachability = createRuntimeDialogueReachability();
  const runtimeReachable = new Set(reachability.runtimeReachableStepKeys);
  const explicitRuntimeOnly = new Set(reachability.explicitLegitimateRuntimeOnlyStepKeys);
  const planned = new Set<string>();
  const missingVariantSignatures: string[] = [];
  const invalidVariantPlanErrors: string[] = [];

  for (const variant of reachability.variants) {
    const plan = runtimePlans[variant.dialogueId]?.[variant.signature]
      ?? (canonicalShapes[variant.dialogueId] === variant.signature ? canonicalPlans[variant.dialogueId] : undefined);
    const variantLabel = `${variant.dialogueId}::${variant.signature}`;
    if (!plan) {
      missingVariantSignatures.push(variantLabel);
      continue;
    }
    for (const stepId of planStepIds(plan)) planned.add(`${variant.dialogueId}:${stepId}`);
    const expectedStepIds = variant.sequence.steps.map((step) => step.id);
    const actualStepIds = planStepIds(plan);
    if (actualStepIds.length !== expectedStepIds.length
      || new Set(actualStepIds).size !== actualStepIds.length
      || actualStepIds.join('|') !== expectedStepIds.join('|')) {
      invalidVariantPlanErrors.push(`${variantLabel}: planned step order differs from runtime sequence`);
    }
    if (plan.normalDialogueDuringVideo !== 0 || plan.dialogueStepsOnHold !== 0 || plan.choiceStepsOnHold !== 0) {
      invalidVariantPlanErrors.push(`${variantLabel}: A.4R video/HOLD doctrine violated`);
    }
    for (const step of variant.sequence.steps) {
      const segment = plan.segments.find((candidate) => candidate.stepIds.includes(step.id));
      const speakerId = step.actorId ?? `speaker:${step.speaker}`;
      if (!segment) {
        invalidVariantPlanErrors.push(`${variantLabel}: no segment for ${step.id}`);
      } else if (!segment.visibleCast.includes(speakerId) || !segment.allowedSpeakers.includes(speakerId)) {
        invalidVariantPlanErrors.push(`${variantLabel}: speaker ${speakerId} is not visible for ${step.id}`);
      }
    }
  }

  const missingRuntimeStepKeys = [...runtimeReachable]
    .filter((key) => !planned.has(key) && !explicitRuntimeOnly.has(key))
    .sort();
  const keys = new Set([
    ...reachability.runtimeReachableStepKeys,
    ...reachability.deadOrUnreachableStepKeys,
    ...reachability.unknownStepKeys,
  ]);
  const entries = [...keys].sort().map((key): RuntimePresentationStepCensusEntry => {
    if (reachability.unknownStepKeys.includes(key)) return { key, classification: 'UNKNOWN' };
    if (reachability.deadOrUnreachableStepKeys.includes(key)) {
      return { key, classification: 'DEAD_OR_UNREACHABLE', reason: DEAD_OR_UNREACHABLE_PRESENTATION_STEP_REASONS[key] };
    }
    if (explicitRuntimeOnly.has(key)) return { key, classification: 'VALID_RUNTIME_ONLY' };
    if (planned.has(key)) return { key, classification: 'VALID_PLANNED' };
    return { key, classification: 'BUG_MISSING_FROM_PLAN' };
  });

  return Object.freeze({
    schemaVersion: 1,
    contract: 'RUNTIME_REACHABLE_PRESENTATION_STEPS == PLANNED_PRESENTATION_STEPS + EXPLICIT_LEGITIMATE_RUNTIME_ONLY_STEPS',
    summary: Object.freeze({
      stateScenarios: reachability.scenarios,
      runtimePresentationVariants: reachability.variants.length,
      canonicalDialogueSteps: reachability.canonicalStepKeys.length,
      runtimeReachablePresentationSteps: reachability.runtimeReachableStepKeys.length,
      plannedRuntimePresentationSteps: [...planned].filter((key) => runtimeReachable.has(key)).length,
      explicitLegitimateRuntimeOnlySteps: reachability.explicitLegitimateRuntimeOnlyStepKeys.length,
      missingFromPlan: missingRuntimeStepKeys.length,
      deadOrUnreachable: reachability.deadOrUnreachableStepKeys.length,
      unknown: reachability.unknownStepKeys.length,
      missingVariantPlans: missingVariantSignatures.length,
      invalidVariantPlans: invalidVariantPlanErrors.length,
    }),
    entries: Object.freeze(entries),
    missingRuntimeStepKeys: Object.freeze(missingRuntimeStepKeys),
    missingVariantSignatures: Object.freeze(missingVariantSignatures.sort()),
    invalidVariantPlanErrors: Object.freeze(invalidVariantPlanErrors.sort()),
    contractErrors: reachability.contractErrors,
  });
}

export function validateRuntimePresentationStepCensus(census: RuntimePresentationStepCensus): string[] {
  const errors = [...census.contractErrors];
  if (census.summary.unknown > 0) errors.push(`Unknown runtime presentation steps: ${census.summary.unknown}`);
  if (census.missingRuntimeStepKeys.length) errors.push(`Missing runtime presentation steps: ${census.missingRuntimeStepKeys.join(', ')}`);
  if (census.missingVariantSignatures.length) errors.push(`Missing runtime presentation variants: ${census.missingVariantSignatures.join(', ')}`);
  errors.push(...census.invalidVariantPlanErrors);
  if (
    census.summary.runtimeReachablePresentationSteps
    !== census.summary.plannedRuntimePresentationSteps + census.summary.explicitLegitimateRuntimeOnlySteps
  ) {
    errors.push('Runtime/planned/runtime-only presentation-step equality failed');
  }
  return errors;
}
