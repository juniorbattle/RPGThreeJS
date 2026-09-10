import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { DialogueStagingDirector } from './DialogueStagingDirector';
import {
  ALARIC_AUDIENCE_TABLEAU,
  createGenericNarrativeTableau,
  FOREST_THREAT_TABLEAU,
  resolveStaticNarrativeStepPlacement,
  resolveNarrativeStepPlacement,
  stageActors,
} from './NarrativeTableau';

describe('CIN-6.7.x spatial coherence', () => {
  it('maps static speakers to upper anchors while preserving video lower anchors', () => {
    const cast = stageActors(['left', 'center', 'right']);
    const step = dialogues.get('post_opening_trail')!.steps[0]!;
    expect(resolveStaticNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[0])).toBe('LEFT_UPPER');
    expect(resolveStaticNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[1])).toBe('CENTER_UPPER');
    expect(resolveStaticNarrativeStepPlacement('DIALOGUE_SIDE_COMPACT', step, cast[2])).toBe('RIGHT_UPPER');
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
      '1': { speaker: 'alaric', position: 'FAR_RIGHT', placement: 'RIGHT_UPPER', association: 'SPEAKER_RIGHT_UPPER' },
      '1b': { speaker: 'alistair', position: 'CENTER_RIGHT', placement: 'RIGHT_UPPER', association: 'SPEAKER_RIGHT_UPPER' },
      '2': { speaker: 'sage_seraphine', position: 'FAR_LEFT', placement: 'LEFT_UPPER', association: 'SPEAKER_LEFT_UPPER' },
      '3': { speaker: 'maelor', position: 'CENTER_LEFT', placement: 'LEFT_UPPER', association: 'SPEAKER_LEFT_UPPER' },
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

  it('keeps the opening exception and moves static pre-combat dialogue into speaker lanes', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingPlan = new DialogueStagingDirector(opening, createGenericNarrativeTableau(opening), { mediaMode: 'STILL' }).plan;
    expect(openingPlan.decisions.every((decision) => decision.speakerAssociation.endsWith('_UPPER'))).toBe(true);
    expect(openingPlan.decisions[0]?.visibleStaticCast).toHaveLength(6);

    const threat = dialogues.get('pre_opening_trail')!;
    const threatPlan = new DialogueStagingDirector(threat, FOREST_THREAT_TABLEAU, { mediaMode: 'STILL' }).plan;
    expect(threatPlan.decisions.map((decision) => decision.speakerAssociation)).toEqual([
      'SPEAKER_LEFT_UPPER',
      'SPEAKER_CENTER_UPPER',
      'SPEAKER_RIGHT_UPPER',
    ]);
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
    expect(css).toContain('.narrative-scene-surface__cast[data-cast-count="4"] .narrative-cast__actor { bottom:-14vh; width:min(36vw,66vh,700px); }');
    expect(css).toContain('.narrative-scene-surface__cast[data-cast-count="6"] .narrative-cast__actor { bottom:-12vh; width:min(34vw,61vh,660px); }');
    expect(css).toMatch(/data-narrative-placement="CENTER_UPPER"\] \.dialogue__box \{[^}]*top:14vh;[^}]*width:clamp\(560px,42vw,820px\);[^}]*min-height:190px;/);
    expect(css).toMatch(/\.narrative-cast__actor \{[^}]*bottom:-17vh;[^}]*width:min\(46vw,74vh,800px\);[^}]*opacity:\.5;/);
    const speakingRule = css.match(/\.narrative-cast__actor\.is-speaking \{([^}]*)\}/)?.[1] ?? '';
    expect(speakingRule).not.toMatch(/scale|translate/);
    expect(speakingRule).toMatch(/opacity:1/);
  });
});
