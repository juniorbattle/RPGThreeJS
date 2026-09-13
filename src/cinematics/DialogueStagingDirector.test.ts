import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { createInitialState } from '../game/store';
import { DialogueStagingDirector, segmentNarrativeText } from './DialogueStagingDirector';
import { applyFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { ALARIC_AUDIENCE_TABLEAU, createGenericNarrativeTableau, FOREST_THREAT_TABLEAU, NARRATIVE_LAYOUT_PROFILES, resolveNarrativeDialogueTableau } from './NarrativeTableau';

describe('DialogueStagingDirector', () => {
  it('gives every canonical dialogue step an explicit phase, layout and strategy', () => {
    for (const sequence of dialogues.values()) {
      const tableau = applyFinalDialoguePresentationPlan(
        sequence,
        resolveNarrativeDialogueTableau(sequence.id, sequence) ?? createGenericNarrativeTableau(sequence),
      );
      const plan = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL' }).plan;
      expect(plan.decisions).toHaveLength(sequence.steps.length);
      expect(plan.decisions.every((decision) => decision.currentVisualState && decision.layoutProfile && decision.presentationStrategy)).toBe(true);
      expect(plan.decisions.every((decision) => NARRATIVE_LAYOUT_PROFILES.includes(decision.layoutProfile))).toBe(true);
      expect(plan.decisions.every((decision) => decision.displaySegments.every((segment) => segment.length <= decision.maxCharactersPerSegment))).toBe(true);
    }
  });

  it('locks opening, adviser, choice and pre-combat beats to approved static profiles', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingPlan = new DialogueStagingDirector(opening, applyFinalDialoguePresentationPlan(opening), { mediaMode: 'STILL' }).plan;
    expect(openingPlan.decisions.every((decision) => decision.layoutProfile === 'INTRO_CAST_PRESENTATION' && decision.layoutPlacement.endsWith('_UPPER'))).toBe(true);

    const audience = dialogues.get('lion_briefing')!;
    const audienceTableau = applyFinalDialoguePresentationPlan(audience, ALARIC_AUDIENCE_TABLEAU);
    const audiencePlan = new DialogueStagingDirector(audience, audienceTableau, { mediaMode: 'STILL' }).plan;
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '1a')).toMatchObject({ dialogueSurfaceMode: 'STATIC_TABLEAU' });
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '2')).toMatchObject({ layoutProfile: 'ADVISER_EXCHANGE' });
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '3')).toMatchObject({
      layoutProfile: 'CHOICE_TWO_PATH_SPATIAL',
      layoutPlacement: 'LEFT_UPPER',
      speakerAssociation: 'SPEAKER_LEFT_UPPER',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
      speakerCardPolicy: 'SETUP_THEN_CHOICES_ONLY',
      choiceScreenLanes: ['RIGHT', 'LEFT'],
      addressedTo: 'alaric',
      addressResolution: 'EXPLICIT_ADDRESSEE',
      speakerFacing: 'RIGHT',
    });

    const audienceVideoPlan = new DialogueStagingDirector(audience, audienceTableau, { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    expect(audienceVideoPlan.decisions.every((decision) => decision.dialogueSurfaceMode === 'STATIC_TABLEAU')).toBe(true);
    expect(audienceVideoPlan.decisions.every((decision) => decision.segmentMode === 'STATIC_TABLEAU')).toBe(true);
    expect(audienceVideoPlan.decisions.every((decision) => decision.castOwnership === 'STAGE_OWNS_CAST')).toBe(true);
    expect(audienceVideoPlan.decisions.find((decision) => decision.stepId === '3')).toMatchObject({
      layoutPlacement: 'LEFT_UPPER',
      speakerAssociation: 'SPEAKER_LEFT_UPPER',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
    });

    const preCombat = dialogues.get('pre_opening_trail')!;
    const preCombatTableau = applyFinalDialoguePresentationPlan(preCombat, FOREST_THREAT_TABLEAU);
    const preCombatPlan = new DialogueStagingDirector(preCombat, preCombatTableau, { mediaMode: 'STILL' }).plan;
    expect(preCombatPlan.decisions.filter((decision) => decision.stepId !== '2').every((decision) => decision.layoutProfile === 'DIALOGUE_BOTTOM_BAND_RESERVED')).toBe(true);
    expect(preCombatPlan.decisions.find((decision) => decision.stepId === '2')).toMatchObject({ dialogueSurfaceMode: 'STATIC_TABLEAU' });
    expect(preCombatPlan.decisions.map((decision) => decision.layoutPlacement)).toEqual(['LEFT_UPPER', 'CENTER_UPPER', 'RIGHT_UPPER']);
  });

  it('moves the known forest video mismatch to a speaker-complete tableau before the line', () => {
    const sequence = dialogues.get('pre_opening_trail')!;
    const tableau = applyFinalDialoguePresentationPlan(sequence, FOREST_THREAT_TABLEAU);
    const director = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'VIDEO', hasMovingMedia: true });
    expect(director.plan.decisions.every((decision) => decision.presentationStrategy === 'SPEAKER_FOCUS')).toBe(true);
    expect(director.plan.decisions.every((decision) => decision.speakerVisibleBeforeLine)).toBe(true);
    expect(director.plan.decisions.every((decision) => decision.castOwnership === 'STAGE_OWNS_CAST')).toBe(true);
    expect(director.plan.decisions.every((decision) => decision.mediaRemasterLater)).toBe(true);
  });

  it('segments long text without changing its words or canonical step semantics', () => {
    const source = 'Première phrase suffisamment longue pour établir la scène. Deuxième phrase qui poursuit le même pas canonique. Troisième phrase qui termine ce pas sans créer un nouvel effet.';
    const segments = segmentNarrativeText(source, 80);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.join(' ')).toBe(source);
  });

  it('keeps narrative truth identical between still and video presentation', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const canonicalBefore = structuredClone(sequence);
    const tableau = applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU);
    const still = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL' }).plan;
    const video = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    const semanticProjection = (decision: (typeof still.decisions)[number]) => ({
      stepId: decision.stepId,
      choiceState: decision.choiceState,
      effectsState: decision.effectsState,
      displayedText: decision.displaySegments.join(' '),
    });
    expect(video.decisions.map(semanticProjection)).toEqual(still.decisions.map(semanticProjection));
    expect(sequence).toEqual(canonicalBefore);
  });

  it('stages contextual Cedric and Garen insertions without changing their canonical owner', () => {
    const state = createInitialState();
    state.flags.recruitedCedric = true;
    state.flags.recruitedLancer = true;
    const resolved = resolveGameDialogue('final_refuge', state)!;
    expect(resolved.optionalStepIds).toEqual(expect.arrayContaining(['r3-cedric-continuity', 'r5-garen-final-pledge']));
    const tableau = resolveNarrativeDialogueTableau(resolved.sequence.id, resolved.sequence)
      ?? createGenericNarrativeTableau(resolved.sequence);
    const plan = new DialogueStagingDirector(resolved.sequence, tableau, { mediaMode: 'STILL' }).plan;
    expect(plan.decisions.map((decision) => decision.stepId)).toEqual(resolved.sequence.steps.map((step) => step.id));
  });
});
