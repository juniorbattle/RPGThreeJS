import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { createInitialState } from '../game/store';
import { DialogueStagingDirector, segmentNarrativeText } from './DialogueStagingDirector';
import { ALARIC_AUDIENCE_TABLEAU, createGenericNarrativeTableau, FOREST_THREAT_TABLEAU, NARRATIVE_LAYOUT_PROFILES, resolveNarrativeDialogueTableau } from './NarrativeTableau';

describe('DialogueStagingDirector', () => {
  it('gives every canonical dialogue step an explicit phase, layout and strategy', () => {
    for (const sequence of dialogues.values()) {
      const tableau = resolveNarrativeDialogueTableau(sequence.id, sequence) ?? createGenericNarrativeTableau(sequence);
      const plan = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL' }).plan;
      expect(plan.decisions).toHaveLength(sequence.steps.length);
      expect(plan.decisions.every((decision) => decision.currentVisualState && decision.layoutProfile && decision.presentationStrategy)).toBe(true);
      expect(plan.decisions.every((decision) => NARRATIVE_LAYOUT_PROFILES.includes(decision.layoutProfile))).toBe(true);
      expect(plan.decisions.every((decision) => decision.displaySegments.every((segment) => segment.length <= decision.maxCharactersPerSegment))).toBe(true);
    }
  });

  it('locks opening, adviser, choice, pre-combat and held-video beats to approved profiles', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingPlan = new DialogueStagingDirector(opening, createGenericNarrativeTableau(opening), { mediaMode: 'STILL' }).plan;
    expect(openingPlan.decisions.every((decision) => decision.layoutProfile === 'INTRO_CAST_PRESENTATION' && decision.layoutPlacement.endsWith('_UPPER'))).toBe(true);

    const audience = dialogues.get('lion_briefing')!;
    const audiencePlan = new DialogueStagingDirector(audience, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'STILL' }).plan;
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '1a')).toMatchObject({ layoutProfile: 'HELD_VIDEO_DIALOGUE' });
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '2')).toMatchObject({ layoutProfile: 'ADVISER_EXCHANGE' });
    expect(audiencePlan.decisions.find((decision) => decision.stepId === '3')).toMatchObject({
      layoutProfile: 'CHOICE_TWO_PATH_SPATIAL',
      layoutPlacement: 'LEFT_UPPER',
      speakerAssociation: 'SPEAKER_LEFT_UPPER',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
      speakerCardPolicy: 'SETUP_THEN_CHOICES_ONLY',
      choiceScreenLanes: ['RIGHT', 'LEFT'],
    });

    const audienceVideoPlan = new DialogueStagingDirector(audience, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    expect(audienceVideoPlan.decisions.find((decision) => decision.stepId === '3')).toMatchObject({
      layoutPlacement: 'RIGHT',
      speakerAssociation: 'SPEAKER_RIGHT_LOWER',
      dialogueSurfaceMode: 'VIDEO_CUTSCENE',
    });

    const preCombat = dialogues.get('pre_opening_trail')!;
    const preCombatPlan = new DialogueStagingDirector(preCombat, FOREST_THREAT_TABLEAU, { mediaMode: 'STILL' }).plan;
    expect(preCombatPlan.decisions.filter((decision) => decision.stepId !== '2').every((decision) => decision.layoutProfile === 'DIALOGUE_BOTTOM_BAND_RESERVED')).toBe(true);
    expect(preCombatPlan.decisions.find((decision) => decision.stepId === '2')).toMatchObject({ layoutProfile: 'HELD_VIDEO_DIALOGUE' });
    expect(preCombatPlan.decisions.map((decision) => decision.layoutPlacement)).toEqual(['LEFT_UPPER', 'CENTER_UPPER', 'RIGHT_UPPER']);
  });

  it('makes the known forest video mismatch explicitly offscreen without sprite patching', () => {
    const sequence = dialogues.get('pre_opening_trail')!;
    const director = new DialogueStagingDirector(sequence, FOREST_THREAT_TABLEAU, { mediaMode: 'VIDEO', hasMovingMedia: true });
    expect(director.resolve(sequence.steps[0]!).presentationStrategy).toBe('OFFSCREEN_CONTEXTUAL');
    expect(director.resolve(sequence.steps[1]!).presentationStrategy).toBe('OFFSCREEN_CONTEXTUAL');
    expect(director.resolve(sequence.steps[2]!).presentationStrategy).toBe('IN_SCENE');
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
    const still = new DialogueStagingDirector(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'STILL' }).plan;
    const video = new DialogueStagingDirector(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    const semanticProjection = (decision: (typeof still.decisions)[number]) => ({
      stepId: decision.stepId,
      choiceState: decision.choiceState,
      effectsState: decision.effectsState,
      layoutProfile: decision.layoutProfile,
      displaySegments: decision.displaySegments,
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
