import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { DialogueStagingDirector } from './DialogueStagingDirector';
import {
  ALARIC_AUDIENCE_TABLEAU,
  createGenericNarrativeTableau,
  FOREST_THREAT_TABLEAU,
  resolveNarrativeStepPlacement,
  stageActors,
} from './NarrativeTableau';

describe('CIN-6.7.3 spatial coherence', () => {
  it('maps left, center and right staged speakers to the three compact lower anchors', () => {
    const cast = stageActors(['left', 'center', 'right']);
    const step = dialogues.get('post_opening_trail')!.steps[0]!;
    expect(resolveNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[0])).toBe('LEFT');
    expect(resolveNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[1])).toBe('CENTER_LOWER');
    expect(resolveNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[2])).toBe('RIGHT');
  });

  it('moves the Audience card with each authoritative speaker position', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const plan = new DialogueStagingDirector(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'STILL' }).plan;
    const handoff = Object.fromEntries(plan.decisions.map((decision) => [decision.stepId, {
      speaker: decision.speakerId,
      position: decision.speakerScreenPosition,
      placement: decision.layoutPlacement,
      association: decision.speakerAssociation,
    }]));
    expect(handoff).toMatchObject({
      '1': { speaker: 'alaric', position: 'FAR_RIGHT', placement: 'RIGHT', association: 'SPEAKER_RIGHT_LOWER' },
      '1b': { speaker: 'alistair', position: 'FAR_LEFT', placement: 'LEFT', association: 'SPEAKER_LEFT_LOWER' },
      '2': { speaker: 'sage_seraphine', position: 'CENTER_LEFT', placement: 'LEFT', association: 'SPEAKER_LEFT_LOWER' },
      '3': { speaker: 'maelor', position: 'CENTER_RIGHT', placement: 'RIGHT', association: 'SPEAKER_RIGHT_LOWER' },
    });
  });

  it('keeps actor scale and cast composition stable through speaker handoffs', () => {
    const phases = ALARIC_AUDIENCE_TABLEAU.phases!;
    const actorIds = phases[0]!.staticCast.map((actor) => actor.actorId);
    expect(phases.every((phase) => phase.staticCast.map((actor) => actor.actorId).join('|') === actorIds.join('|'))).toBe(true);
    for (const actorId of actorIds) {
      const scales = new Set(phases.map((phase) => phase.staticCast.find((actor) => actor.actorId === actorId)!.scale));
      expect([...scales], actorId).toEqual([1]);
    }
  });

  it('keeps all seven event speakers in the stable generic tableau', () => {
    const sequence = dialogues.get('village_choice')!;
    const tableau = createGenericNarrativeTableau(sequence);
    expect(tableau.phases?.[0]?.staticCast).toHaveLength(7);
    const plan = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL' }).plan;
    expect(plan.decisions.every((decision) => decision.visibleStaticCast.includes(decision.speakerId))).toBe(true);
  });

  it('keeps the opening clan and pre-combat band as explicit composition exceptions', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingPlan = new DialogueStagingDirector(opening, createGenericNarrativeTableau(opening), { mediaMode: 'STILL' }).plan;
    expect(openingPlan.decisions.every((decision) => decision.speakerAssociation === 'SPECIAL_TOP_CENTER')).toBe(true);
    expect(openingPlan.decisions[0]?.visibleStaticCast).toHaveLength(6);

    const threat = dialogues.get('pre_opening_trail')!;
    const threatPlan = new DialogueStagingDirector(threat, FOREST_THREAT_TABLEAU, { mediaMode: 'STILL' }).plan;
    expect(threatPlan.decisions.filter((decision) => decision.layoutProfile === 'DIALOGUE_BOTTOM_BAND_RESERVED')
      .every((decision) => decision.speakerAssociation === 'SPECIAL_BOTTOM_BAND')).toBe(true);
  });

  it('uses held-video staging metadata while leaving video-owned cast unduplicated', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const plan = new DialogueStagingDirector(sequence, ALARIC_AUDIENCE_TABLEAU, { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    const held = plan.decisions.find((decision) => decision.stepId === '1a')!;
    expect(held).toMatchObject({
      castOwnership: 'VIDEO_OWNS_CAST',
      visibleStaticCast: [],
      layoutProfile: 'HELD_VIDEO_DIALOGUE',
      layoutPlacement: 'RIGHT',
      speakerAssociation: 'SPEAKER_RIGHT_LOWER',
    });
  });

  it('locks stronger cast-count-aware presence and equal speaker/listener transforms', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8');
    expect(css).toContain('.narrative-scene-surface__cast[data-cast-count="6"] .narrative-cast__actor { width:clamp(155px,19vw,350px); height:min(74vh,800px); }');
    expect(css).toContain('.dialogue--narrative[data-narrative-placement="CENTER_LOWER"] .dialogue__box');
    const speakingRule = css.match(/\.narrative-cast__actor\.is-speaking \{([^}]*)\}/)?.[1] ?? '';
    expect(speakingRule).not.toMatch(/scale|translate/);
  });
});
