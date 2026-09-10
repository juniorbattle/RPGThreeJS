import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import {
  createNarrativeDialogueResolver,
  getNarrativeTextReduction,
  NARRATIVE_TEXT_REDUCTIONS,
  resolveRepresentedDialogueActors,
} from './NarrativeDialogueAdapter';
import { ALARIC_AUDIENCE_TABLEAU, FOREST_THREAT_TABLEAU } from './NarrativeTableau';

describe('Narrative dialogue presentation adapter', () => {
  it('assigns the Audience minimum visual weight per canonical step', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const resolver = createNarrativeDialogueResolver(sequence, ALARIC_AUDIENCE_TABLEAU);
    expect(Object.fromEntries(sequence.steps.map((step) => [step.id, resolver(step).mode]))).toEqual({
      '1': 'SPEAKER_CARD',
      '1a': 'HELD_DIALOGUE',
      '1b': 'SPEAKER_CARD',
      '2': 'SPEAKER_CARD',
      '3': 'SPATIAL_CHOICE',
      '4': 'SPEAKER_CARD',
      '5': 'SPEAKER_CARD',
    });
  });

  it('keeps static upper placement separate from the current video lower placement', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const step = sequence.steps.find((candidate) => candidate.id === '1')!;
    const still = createNarrativeDialogueResolver(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'STILL' })(step);
    const video = createNarrativeDialogueResolver(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'VIDEO', hasMovingMedia: true })(step);
    expect(still).toMatchObject({
      layoutPlacement: 'RIGHT_UPPER',
      speakerAssociation: 'SPEAKER_RIGHT_UPPER',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
    });
    expect(video).toMatchObject({
      layoutPlacement: 'RIGHT',
      speakerAssociation: 'SPEAKER_RIGHT_LOWER',
      dialogueSurfaceMode: 'VIDEO_CUTSCENE',
    });
  });

  it('maps the Audience choices to their semantic screen sides without reordering canonical truth', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const step = sequence.steps.find((candidate) => candidate.id === '3')!;
    const canonicalChoices = structuredClone(step.choices);
    const presentation = createNarrativeDialogueResolver(sequence, ALARIC_AUDIENCE_TABLEAU)(step);
    expect(presentation).toMatchObject({
      layoutPlacement: 'LEFT_UPPER',
      speakerScreenPosition: 'CENTER_LEFT',
      choiceScreenLanes: ['RIGHT', 'LEFT'],
    });
    expect(step.choices).toEqual(canonicalChoices);
  });

  it('never patches NarrativeStage media with an automatic full-body portrait', () => {
    const audience = dialogues.get('lion_briefing')!;
    const audienceResolver = createNarrativeDialogueResolver(audience, ALARIC_AUDIENCE_TABLEAU);
    expect(audience.steps.every((step) => audienceResolver(step).showPortrait === false)).toBe(true);

    const threat = dialogues.get('pre_opening_trail')!;
    const threatResolver = createNarrativeDialogueResolver(threat, FOREST_THREAT_TABLEAU);
    expect(threatResolver(threat.steps[0]!).showPortrait).toBe(false);
    expect(threatResolver(threat.steps[1]!).showPortrait).toBe(false);
    expect(threatResolver(threat.steps[2]!).showPortrait).toBe(false);
    expect(resolveRepresentedDialogueActors(threat, threatResolver)).toEqual(['kestrel', 'alistair', 'sage_seraphine']);
  });

  it('records exactly four reviewed display-only reductions', () => {
    expect(NARRATIVE_TEXT_REDUCTIONS.map(({ dialogueId, stepId, classification }) => ({ dialogueId, stepId, classification }))).toEqual([
      { dialogueId: 'village_choice', stepId: '1a', classification: 'VISUAL_REPLACEABLE' },
      { dialogueId: 'village_choice', stepId: '2a', classification: 'VISUAL_REPLACEABLE' },
      { dialogueId: 'final_refuge', stepId: '1', classification: 'REDUNDANT_EXPOSITION' },
      { dialogueId: 'final_refuge', stepId: '3', classification: 'REDUNDANT_EXPOSITION' },
    ]);
    expect(NARRATIVE_TEXT_REDUCTIONS.every((entry) => entry.reviewed && entry.sourceTextPreserved && entry.rationale.length > 0)).toBe(true);
  });

  it('paginates canonical DialogueSequence text without display-only rewriting', () => {
    const village = dialogues.get('village_choice')!;
    const step = village.steps.find((candidate) => candidate.id === '1a')!;
    const canonical = step.text;
    const resolver = createNarrativeDialogueResolver(village);
    expect(resolver(step).displayText).toBeUndefined();
    expect(resolver(step).displaySegments?.join(' ')).toBe(canonical);
    expect(step.text).toBe(canonical);
  });

  it('preserves factual anchors in every reduction', () => {
    expect(getNarrativeTextReduction('village_choice', '1a')?.displayText).toMatch(/captifs au nord.*réserves.*puits.*sud/i);
    expect(getNarrativeTextReduction('village_choice', '2a')?.displayText).toMatch(/vieux pont.*porte basse.*deux/i);
    expect(getNarrativeTextReduction('final_refuge', '1')?.displayText).toMatch(/camp du Lion.*Sceau.*Alaric/i);
    expect(getNarrativeTextReduction('final_refuge', '3')?.displayText).toMatch(/Bois-Clair.*réfugiés.*témoins.*convoi.*preuves/i);
    expect(getNarrativeTextReduction('lion_briefing', '1')).toBeUndefined();
  });

  it('keeps authoritative choices in held or spatial modes', () => {
    const village = dialogues.get('village_choice')!;
    const resolver = createNarrativeDialogueResolver(village);
    const choice = village.steps.find((step) => step.id === '5')!;
    expect(choice.choices).toHaveLength(2);
    expect(resolver(choice).mode).toBe('SPATIAL_CHOICE');
    expect(choice.choices?.map((entry) => entry.text)).toEqual(['Sauver les habitants.', 'Sécuriser les réserves.']);
  });
});
