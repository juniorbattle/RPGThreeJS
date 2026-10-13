import { describe, expect, it } from 'vitest';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { dialoguePresentationShapeSignature } from '../game/dialoguePresentationShape';
import { createInitialState } from '../game/store';
import { DialogueStagingDirector } from './DialogueStagingDirector';
import {
  applyFinalDialoguePresentationPlan,
  resolveFinalDialoguePresentationPlan,
} from './DialoguePresentationSegments';
import { FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';
import { resolveNarrativeDialogueTableau } from './NarrativeTableau';
import {
  createRuntimePresentationStepCensus,
  validateRuntimePresentationStepCensus,
  type RuntimePresentationPlans,
} from './RuntimePresentationStepCensus';

describe('OPTION-C-P0 runtime presentation coverage lock', () => {
  it('accounts for every runtime-reachable step without a silent remainder', () => {
    const census = createRuntimePresentationStepCensus();
    expect(validateRuntimePresentationStepCensus(census)).toEqual([]);
    expect(census.summary).toMatchObject({
      stateScenarios: 330,
      runtimePresentationVariants: 134,
      canonicalDialogueSteps: 257,
      runtimeReachablePresentationSteps: 282,
      plannedRuntimePresentationSteps: 282,
      explicitLegitimateRuntimeOnlySteps: 0,
      missingFromPlan: 0,
      deadOrUnreachable: 2,
      unknown: 0,
      missingVariantPlans: 0,
      invalidVariantPlans: 0,
    });
    expect(census.entries.find((entry) => entry.key === 'lion_finale_judgement:open')).toMatchObject({
      classification: 'VALID_PLANNED',
    });
    expect(census.entries.find((entry) => entry.key === 'lion_finale_judgement:bluff-accepted')).toMatchObject({
      classification: 'VALID_PLANNED',
    });
    expect(census.entries.find((entry) => entry.key === 'lion_finale_judgement:brazen-lie-rebuked')).toMatchObject({
      classification: 'VALID_PLANNED',
    });
    expect(census.entries.filter((entry) => entry.classification === 'DEAD_OR_UNREACHABLE')).toEqual([
      expect.objectContaining({ key: 'lion_finale_judgement:1', reason: expect.any(String) }),
      expect.objectContaining({ key: 'pre_lion_chief:4', reason: expect.any(String) }),
    ]);
  });

  it('fails validation when one reachable dynamic step is omitted from its exact variant plan', () => {
    const plans = structuredClone(FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS) as unknown as Record<string, Record<string, any>>;
    const [signature, plan] = Object.entries(plans.lion_finale_judgement!)
      .find(([, candidate]) => candidate.segments.some((segment: any) => segment.stepIds.includes('open')))!;
    const segment = plan.segments.find((candidate: any) => candidate.stepIds.includes('open'))!;
    segment.stepIds = segment.stepIds.filter((stepId: string) => stepId !== 'open');

    const census = createRuntimePresentationStepCensus(plans as RuntimePresentationPlans);
    expect(validateRuntimePresentationStepCensus(census)).toEqual(expect.arrayContaining([
      expect.stringContaining(`lion_finale_judgement::${signature}`),
    ]));
    expect(census.summary.invalidVariantPlans).toBeGreaterThan(0);
  });

  it('resolves lion_finale_judgement/open with exact static-tableau ownership', () => {
    const state = createInitialState();
    const resolved = resolveGameDialogue('lion_finale_judgement', state)!;
    const resumed = resolveGameDialogue('lion_finale_judgement', structuredClone(state))!;
    expect(resolved.sequence.steps[0]?.id).toBe('open');
    expect(dialoguePresentationShapeSignature(resumed.sequence)).toBe(dialoguePresentationShapeSignature(resolved.sequence));

    const plan = resolveFinalDialoguePresentationPlan(resolved.sequence.id, resolved.sequence)!;
    expect(plan.segments.flatMap((segment) => segment.stepIds)).toEqual(resolved.sequence.steps.map((step) => step.id));
    const tableau = applyFinalDialoguePresentationPlan(
      resolved.sequence,
      resolveNarrativeDialogueTableau(resolved.sequence.id, resolved.sequence) ?? undefined,
    );
    const director = new DialogueStagingDirector(resolved.sequence, tableau, { mediaMode: 'STILL' });
    expect(director.resolve(resolved.sequence.steps[0]!)).toMatchObject({
      stepId: 'open',
      speakerId: 'alaric',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
      castOwnership: 'STAGE_OWNS_CAST',
      transitionFromPrevious: 'VIDEO_TO_TABLEAU',
      speakerVisibleBeforeLine: true,
    });
  });

  it('rejects an unregistered runtime shape instead of falling back to a generic plan', () => {
    const state = createInitialState();
    const resolved = resolveGameDialogue('lion_finale_judgement', state)!;
    const unknown = structuredClone(resolved.sequence);
    unknown.steps[0]!.id = 'unregistered-runtime-step';
    expect(() => resolveFinalDialoguePresentationPlan(unknown.id, unknown)).toThrow(/No authoritative runtime presentation plan/);
  });
});
