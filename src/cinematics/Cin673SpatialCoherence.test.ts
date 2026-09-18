import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { DialogueStagingDirector } from './DialogueStagingDirector';
import { applyFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { resolveNarrativeCastDensityScale } from './NarrativeSceneSurface';
import {
  ALARIC_AUDIENCE_TABLEAU,
  createGenericNarrativeTableau,
  FOREST_THREAT_TABLEAU,
  resolveStaticNarrativeStepPlacement,
  resolveNarrativeStepPlacement,
  stageActors,
} from './NarrativeTableau';

describe('CIN-6.7.x spatial coherence', () => {
  it('maps static speakers to upper anchors independently from legacy video anchors', () => {
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
    const plan = new DialogueStagingDirector(sequence, applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU), { mediaMode: 'STILL' }).plan;
    const handoff = Object.fromEntries(plan.decisions.map((decision) => [decision.stepId, {
      speaker: decision.speakerId,
      position: decision.speakerScreenPosition,
      placement: decision.layoutPlacement,
      association: decision.speakerAssociation,
    }]));
    expect(handoff).toMatchObject({
      '1': { speaker: 'alaric', position: 'FAR_RIGHT', placement: 'RIGHT_UPPER', association: 'SPEAKER_RIGHT_UPPER' },
      '1b': { speaker: 'alistair', position: 'FAR_LEFT', placement: 'LEFT_UPPER', association: 'SPEAKER_LEFT_UPPER' },
      '2': { speaker: 'sage_seraphine', position: 'LEFT', placement: 'LEFT_UPPER', association: 'SPEAKER_LEFT_UPPER' },
      '3': { speaker: 'maelor', position: 'CENTER_LEFT', placement: 'LEFT_UPPER', association: 'SPEAKER_LEFT_UPPER' },
    });
  });

  it('keeps actor scale and cast composition stable through speaker handoffs', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const phases = applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU).phases!;
    const actorIds = phases[0]!.staticCast.map((actor) => actor.actorId);
    expect(phases.every((phase) => phase.staticCast.map((actor) => actor.actorId).sort().join('|') === actorIds.slice().sort().join('|'))).toBe(true);
    for (const actorId of actorIds) {
      const scales = new Set(phases.map((phase) => phase.staticCast.find((actor) => actor.actorId === actorId)!.scale));
      expect([...scales], actorId).toEqual([1]);
    }
  });

  it('keeps all seven event speakers represented across staged groups of at most four', () => {
    const sequence = dialogues.get('village_choice')!;
    const tableau = applyFinalDialoguePresentationPlan(sequence, createGenericNarrativeTableau(sequence));
    expect(tableau.phases?.every((phase) => phase.staticCast.length <= 4)).toBe(true);
    expect(new Set(tableau.phases?.flatMap((phase) => phase.staticCast.map((actor) => actor.actorId))).size).toBe(7);
    const plan = new DialogueStagingDirector(sequence, tableau, { mediaMode: 'STILL' }).plan;
    expect(plan.decisions.every((decision) => decision.visibleStaticCast.includes(decision.speakerId))).toBe(true);
  });

  it('keeps the opening exception and moves static pre-combat dialogue into speaker lanes', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingPlan = new DialogueStagingDirector(opening, applyFinalDialoguePresentationPlan(opening), { mediaMode: 'STILL' }).plan;
    expect(openingPlan.decisions.every((decision) => decision.speakerAssociation.endsWith('_UPPER'))).toBe(true);
    expect(openingPlan.decisions[0]?.visibleStaticCast).toHaveLength(4);

    const threat = dialogues.get('pre_opening_trail')!;
    const threatPlan = new DialogueStagingDirector(threat, applyFinalDialoguePresentationPlan(threat, FOREST_THREAT_TABLEAU), { mediaMode: 'STILL' }).plan;
    expect(threatPlan.decisions.map((decision) => decision.speakerAssociation)).toEqual([
      'SPEAKER_LEFT_UPPER',
      'SPEAKER_CENTER_UPPER',
      'SPEAKER_RIGHT_UPPER',
    ]);
  });

  it('ends requested video presentation before rendering the complete Audience tableau', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const plan = new DialogueStagingDirector(sequence, applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU), { mediaMode: 'VIDEO', hasMovingMedia: true }).plan;
    const first = plan.decisions.find((decision) => decision.stepId === '1a')!;
    expect(first).toMatchObject({
      castOwnership: 'STAGE_OWNS_CAST',
      visibleStaticCast: ['alistair', 'sage_seraphine', 'maelor', 'alaric'],
      layoutPlacement: 'RIGHT_UPPER',
      speakerAssociation: 'SPEAKER_RIGHT_UPPER',
      dialogueSurfaceMode: 'STATIC_TABLEAU',
      segmentMode: 'STATIC_TABLEAU',
      transitionFromPrevious: 'VIDEO_TO_TABLEAU',
      addressedTo: 'alistair',
      speakerFacing: 'LEFT',
    });
  });

  it('locks stronger cast-count-aware presence and equal speaker/listener transforms', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8');
    expect(css).toContain('.narrative-scene-surface__cast[data-cast-count="4"] .narrative-cast__actor[data-screen-position="FAR_LEFT"] { left:16%; }');
    expect(css).not.toContain('.narrative-scene-surface__cast[data-cast-count="6"] .narrative-cast__actor {');
    expect(css).toMatch(/data-narrative-placement="CENTER_UPPER"\] \.dialogue__box \{[^}]*top:14vh;[^}]*width:clamp\(560px,42vw,820px\);[^}]*min-height:190px;/);
    expect(resolveNarrativeCastDensityScale(4)).toBeGreaterThan(1);
    const actorRule = css.match(/\.narrative-cast__actor \{([^}]*)\}/)?.[1] ?? '';
    expect(actorRule).toMatch(/width:min\(36vw,66vh,700px\)/);
    expect(actorRule).toMatch(/opacity:\.5/);
    expect(actorRule).not.toMatch(/blur/);
    const speakingRule = css.match(/\.narrative-cast__actor\.is-speaking \{([^}]*)\}/)?.[1] ?? '';
    expect(speakingRule).not.toMatch(/scale|translate/);
    expect(speakingRule).toMatch(/opacity:1/);
  });
});
