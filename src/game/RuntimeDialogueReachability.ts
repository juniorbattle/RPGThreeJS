import { CONTEXTUAL_DIALOGUE_DEFINITIONS, resolveGameDialogue } from './contextualDialogueContent';
import { dialogues } from './content';
import { dialoguePresentationShapeSignature } from './dialoguePresentationShape';
import {
  LION_CONTEXTUAL_DIALOGUE_ALIASES,
  LION_CONTEXTUAL_DIALOGUE_BUILDERS,
  LION_CONTEXTUAL_DIALOGUE_STEP_CONTRACTS,
} from './lionFinale';
import { REPUTATION_EVENT_DIALOGUE_DEFINITIONS } from './reputationEventContent';
import { createInitialState } from './store';
import type { DialogueSequence, GameState } from './types';

export type RuntimePresentationStepClassification =
  | 'VALID_PLANNED'
  | 'VALID_RUNTIME_ONLY'
  | 'BUG_MISSING_FROM_PLAN'
  | 'DEAD_OR_UNREACHABLE'
  | 'UNKNOWN';

export interface RuntimeDialoguePresentationVariant {
  dialogueId: string;
  signature: string;
  sequence: DialogueSequence;
  witnessScenarioIds: readonly string[];
}

export interface RuntimeDialogueReachability {
  scenarios: number;
  variants: readonly RuntimeDialoguePresentationVariant[];
  canonicalStepKeys: readonly string[];
  runtimeReachableStepKeys: readonly string[];
  declaredDynamicStepKeys: readonly string[];
  declaredOptionalStepKeys: readonly string[];
  explicitLegitimateRuntimeOnlyStepKeys: readonly string[];
  deadOrUnreachableStepKeys: readonly string[];
  unknownStepKeys: readonly string[];
  contractErrors: readonly string[];
}

interface StateScenario {
  id: string;
  state: GameState;
}

const SHADOW_PROFILES = Object.freeze([
  { id: 'shadow-none', flags: {} },
  { id: 'shadow-fragments', flags: { shadowFragments: true } },
  { id: 'shadow-evidence-undecided', flags: { shadowEvidence: true } },
  { id: 'shadow-evidence-revealed', flags: { shadowEvidence: true, shadowRevealed: true } },
  { id: 'shadow-evidence-concealed', flags: { shadowEvidence: true, shadowConcealed: true } },
] as const);

/**
 * These dimensions are exhaustive for runtime presentation shape in the
 * current campaign: they control inserted steps, speaker substitutions,
 * conditional Lion-finale speakers, and choice-bearing variants. Other
 * contextual state changes prose only and therefore shares a shape signature.
 */
function createPresentationStateScenarios(): StateScenario[] {
  const scenarios: StateScenario[] = [];
  for (const hasMerit of [false, true]) {
    for (const hasBreach of [false, true]) {
      for (const hasStain of [false, true]) {
        for (const liedToAlaric of [false, true]) {
          for (const recruitedCedric of [false, true]) {
            for (const recruitedLancer of [false, true]) {
              for (const shadow of SHADOW_PROFILES) {
                const state = createInitialState();
                state.flags = {
                  ...(hasMerit ? { helpedRefugees: true } : {}),
                  ...(hasBreach ? { betrayedInformant: true } : {}),
                  ...(hasStain ? { lionMandateAdvance: true } : {}),
                  ...(liedToAlaric ? { liedToAlaric: true } : {}),
                  ...(recruitedCedric ? { recruitedCedric: true } : {}),
                  ...(recruitedLancer ? { recruitedLancer: true } : {}),
                  ...shadow.flags,
                };
                scenarios.push({
                  id: [
                    hasMerit ? 'merit' : 'no-merit',
                    hasBreach ? 'breach' : 'no-breach',
                    hasStain ? 'stain' : 'no-stain',
                    liedToAlaric ? 'lied' : 'truthful',
                    recruitedCedric ? 'cedric' : 'no-cedric',
                    recruitedLancer ? 'garen' : 'no-garen',
                    shadow.id,
                  ].join('+'),
                  state,
                });
              }
            }
          }
        }
      }
    }
  }
  return scenarios;
}

function stepKey(dialogueId: string, stepId: string): string {
  return `${dialogueId}:${stepId}`;
}

function declaredOptionalStepKeys(): string[] {
  const definitions = {
    ...CONTEXTUAL_DIALOGUE_DEFINITIONS,
    ...REPUTATION_EVENT_DIALOGUE_DEFINITIONS,
  };
  return Object.entries(definitions).flatMap(([dialogueId, definition]) => (
    (definition.optionalSteps ?? []).map((entry) => stepKey(dialogueId, entry.step.id))
  ));
}

/**
 * No current dialogue step is allowed to bypass the generated plan. This
 * explicit list exists so a future legitimate runtime-only category requires
 * an authored contract rather than an ignore rule.
 */
export const EXPLICIT_LEGITIMATE_RUNTIME_ONLY_PRESENTATION_STEPS: readonly string[] = Object.freeze([]);

export const DEAD_OR_UNREACHABLE_PRESENTATION_STEP_REASONS: Readonly<Record<string, string>> = Object.freeze({
  'lion_finale_judgement:1': 'Static registry placeholder superseded by the state-built Lion judgement sequence.',
  'pre_lion_chief:4': 'Legacy static registry tail superseded by the state-built three-step Lion Trial sequence.',
});

export function createRuntimeDialogueReachability(): RuntimeDialogueReachability {
  const scenarios = createPresentationStateScenarios();
  const variants = new Map<string, {
    dialogueId: string;
    signature: string;
    sequence: DialogueSequence;
    witnessScenarioIds: string[];
  }>();
  const runtimeReachable = new Set<string>();

  for (const [dialogueId] of [...dialogues.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    for (const scenario of scenarios) {
      const resolved = resolveGameDialogue(dialogueId, scenario.state);
      if (!resolved) continue;
      const signature = dialoguePresentationShapeSignature(resolved.sequence);
      const variantKey = `${dialogueId}\u0000${signature}`;
      const existing = variants.get(variantKey);
      if (existing) {
        existing.witnessScenarioIds.push(scenario.id);
      } else {
        variants.set(variantKey, {
          dialogueId,
          signature,
          sequence: resolved.sequence,
          witnessScenarioIds: [scenario.id],
        });
      }
      for (const step of resolved.sequence.steps) runtimeReachable.add(stepKey(resolved.sequence.id, step.id));
    }
  }

  const canonical = new Set(
    [...dialogues.values()].flatMap((sequence) => sequence.steps.map((step) => stepKey(sequence.id, step.id))),
  );
  const declaredDynamic = new Set(
    Object.entries(LION_CONTEXTUAL_DIALOGUE_STEP_CONTRACTS)
      .flatMap(([dialogueId, stepIds]) => stepIds.map((stepId) => stepKey(dialogueId, stepId))),
  );
  const declaredOptional = new Set(declaredOptionalStepKeys());
  const declared = new Set([...canonical, ...declaredDynamic, ...declaredOptional]);
  const explicitRuntimeOnly = new Set(EXPLICIT_LEGITIMATE_RUNTIME_ONLY_PRESENTATION_STEPS);
  const builderIds = Object.keys(LION_CONTEXTUAL_DIALOGUE_BUILDERS).sort();
  const contractIds = Object.keys(LION_CONTEXTUAL_DIALOGUE_STEP_CONTRACTS).sort();
  const contractErrors: string[] = [];
  if (builderIds.join('|') !== contractIds.join('|')) {
    contractErrors.push(`Dynamic builder/step-contract registry mismatch: builders=${builderIds.join(',')} contracts=${contractIds.join(',')}`);
  }
  for (const [alias, target] of Object.entries(LION_CONTEXTUAL_DIALOGUE_ALIASES)) {
    if (!LION_CONTEXTUAL_DIALOGUE_BUILDERS[target]) contractErrors.push(`Dynamic dialogue alias ${alias} targets unknown builder ${target}`);
  }
  const deadOrUnreachable = [...declared].filter((key) => !runtimeReachable.has(key)).sort();
  for (const key of deadOrUnreachable) {
    if (!DEAD_OR_UNREACHABLE_PRESENTATION_STEP_REASONS[key]) contractErrors.push(`Dead/unreachable step ${key} has no documented reason`);
  }
  for (const key of Object.keys(DEAD_OR_UNREACHABLE_PRESENTATION_STEP_REASONS)) {
    if (!deadOrUnreachable.includes(key)) contractErrors.push(`Stale dead/unreachable step reason: ${key}`);
  }

  return Object.freeze({
    scenarios: scenarios.length,
    variants: Object.freeze(
      [...variants.values()]
        .sort((left, right) => left.dialogueId.localeCompare(right.dialogueId) || left.signature.localeCompare(right.signature))
        .map((entry) => Object.freeze({ ...entry, witnessScenarioIds: Object.freeze(entry.witnessScenarioIds) })),
    ),
    canonicalStepKeys: Object.freeze([...canonical].sort()),
    runtimeReachableStepKeys: Object.freeze([...runtimeReachable].sort()),
    declaredDynamicStepKeys: Object.freeze([...declaredDynamic].sort()),
    declaredOptionalStepKeys: Object.freeze([...declaredOptional].sort()),
    explicitLegitimateRuntimeOnlyStepKeys: Object.freeze([...explicitRuntimeOnly].sort()),
    deadOrUnreachableStepKeys: Object.freeze(deadOrUnreachable),
    unknownStepKeys: Object.freeze(
      [...runtimeReachable].filter((key) => !declared.has(key) && !explicitRuntimeOnly.has(key)).sort(),
    ),
    contractErrors: Object.freeze(contractErrors),
  });
}
