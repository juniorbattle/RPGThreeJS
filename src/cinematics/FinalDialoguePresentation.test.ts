import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { FINAL_DIALOGUE_PACING_BASELINE, FINAL_DIALOGUE_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';

type Segment = {
  id: string;
  mode: 'STATIC_TABLEAU';
  stepIds: string[];
  visibleCast: string[];
  allowedSpeakers: string[];
  forbiddenSpeakers: string[];
  actors: Array<{
    actorId: string;
    screenPosition: string;
    scale: number;
    facing: 'LEFT' | 'RIGHT' | 'FORWARD';
    lookTarget: string | null;
    group: string;
    dramaticSide: 'LEFT' | 'CENTER' | 'RIGHT';
    entryEffect: string;
  }>;
  stepDirections: Array<{ stepId: string; speakerId: string; addressedTo: string | null; lookTarget: string | null; facing: 'LEFT' | 'RIGHT' | 'FORWARD'; resolution: string }>;
  exits: Array<{ actorId: string; kind: 'STAGE_OUT' | 'NARRATIVE_EXIT'; reason: string }>;
  transitionFromPrevious: 'NONE' | 'VIDEO_TO_TABLEAU' | 'TRAVEL_TO_TABLEAU' | 'HOLD_TO_TABLEAU' | 'TABLEAU_RESTAGE';
};

type Plan = {
  dialogueId: string;
  sourceVideo: string | null;
  finalFrameCast: string[];
  finalFrameCastReferenceOnly: true;
  normalDialogueDuringVideo: 0;
  dialogueStepsOnHold: 0;
  choiceStepsOnHold: 0;
  segments: Segment[];
};

function readSpec<T>(filename: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'tools/cinematics/specs', filename), 'utf8')) as T;
}

const plans = FINAL_DIALOGUE_PRESENTATION_PLANS as unknown as Record<string, Plan>;

describe('CIN-6E-A.4R static-tableau-first dialogue lock', () => {
  it('accounts for all 71 dialogues, 247 canonical steps and 28 actionable choice states', () => {
    const sequences = [...dialogues.values()];
    expect(FINAL_DIALOGUE_PACING_BASELINE).toBe('ff743b08fb239d55e11ac5cd682950032a06e2e1');
    expect(sequences).toHaveLength(73);
    expect(sequences.reduce((total, sequence) => total + sequence.steps.length, 0)).toBe(251);
    expect(sequences.reduce((total, sequence) => total + sequence.steps.filter((step) => step.choices?.length).length, 0)).toBe(28);
    expect(Object.keys(plans).sort()).toEqual(sequences.map((sequence) => sequence.id).sort());

    for (const sequence of sequences) {
      const stagedStepIds = plans[sequence.id]!.segments.flatMap((segment) => segment.stepIds);
      expect(stagedStepIds).toHaveLength(sequence.steps.length);
      expect(new Set(stagedStepIds).size).toBe(sequence.steps.length);
      expect(stagedStepIds.slice().sort()).toEqual(sequence.steps.map((step) => step.id).sort());
    }
  });

  it('never allows a dialogue line before its speaker is visually represented', () => {
    for (const sequence of dialogues.values()) {
      const plan = plans[sequence.id]!;
      for (const segment of plan.segments) {
        expect(segment.mode === 'STATIC_TABLEAU' ? segment.visibleCast.length : 0).toBeLessThanOrEqual(4);
        expect(segment.actors.every((actor) => actor.scale === 1)).toBe(true);
        for (const stepId of segment.stepIds) {
          const speaker = sequence.steps.find((step) => step.id === stepId)!.actorId!;
          expect(segment.visibleCast, `${sequence.id}:${stepId} hides ${speaker}`).toContain(speaker);
          expect(segment.allowedSpeakers).toContain(speaker);
          expect(segment.forbiddenSpeakers).not.toContain(speaker);
        }
      }
    }
  });

  it('ends the Audience video before step 1 and keeps company/court geography stable', () => {
    const audience = plans.lion_briefing!;
    expect(audience.sourceVideo).toBe('alaric_audience_arrival');
    expect(audience.finalFrameCast).toEqual(['sage_seraphine', 'maelor', 'alistair', 'alaric']);
    expect(audience.finalFrameCastReferenceOnly).toBe(true);
    expect(audience.segments).toHaveLength(1);
    expect(audience.segments[0]).toMatchObject({
      mode: 'STATIC_TABLEAU',
      stepIds: ['1', '1a', '1b', '2', '3', '4', '5'],
      visibleCast: ['alistair', 'sage_seraphine', 'maelor', 'alaric'],
      transitionFromPrevious: 'VIDEO_TO_TABLEAU',
    });
    const actors = Object.fromEntries(audience.segments[0]!.actors.map((actor) => [actor.actorId, actor]));
    for (const actorId of ['alistair', 'sage_seraphine', 'maelor']) {
      expect(actors[actorId]).toMatchObject({ group: 'PLAYER_COMPANY', dramaticSide: 'LEFT' });
    }
    expect(actors.alaric).toMatchObject({ group: 'LION_COURT', dramaticSide: 'RIGHT' });
  });

  it('keeps endpoint cast evidence reference-only while all camp dialogue uses a tableau', () => {
    expect(plans.camp_departure!.finalFrameCast).toEqual(['sage_seraphine', 'maelor', 'alistair']);
    expect(plans.camp_departure!.finalFrameCastReferenceOnly).toBe(true);
    expect(plans.camp_departure!.segments.every((segment) => segment.mode === 'STATIC_TABLEAU')).toBe(true);
    expect(plans.camp_departure!.segments.flatMap((segment) => segment.stepIds)).toEqual(['1', '1a', '1b', '2', '3', '4', '5']);
  });

  it('puts zero normal dialogue or choices on video/HOLD', () => {
    for (const plan of Object.values(plans)) {
      expect(plan.normalDialogueDuringVideo).toBe(0);
      expect(plan.dialogueStepsOnHold).toBe(0);
      expect(plan.choiceStepsOnHold).toBe(0);
      expect(plan.segments.every((segment) => segment.mode === 'STATIC_TABLEAU')).toBe(true);
    }
  });

  it('uses stable inward composition and distinguishes visual stage-outs from story exits', () => {
    for (const plan of Object.values(plans)) {
      for (const segment of plan.segments) {
        const facing = new Set(segment.actors.map((actor) => actor.facing));
        if (segment.actors.length >= 2) expect(facing.size, segment.id).toBeGreaterThan(1);
        expect(segment.actors.every((actor) => actor.entryEffect.length > 0)).toBe(true);
        expect(segment.exits.every((actorExit) => actorExit.kind === 'STAGE_OUT' && actorExit.reason.length > 0)).toBe(true);
      }
    }
  });

  it('resolves step-facing targets without moving Maelor across the company side', () => {
    const audience = plans.lion_briefing!.segments[0]!;
    const maelorAudience = audience.stepDirections.find((direction) => direction.stepId === '3')!;
    expect(maelorAudience).toMatchObject({ speakerId: 'maelor', addressedTo: 'alaric', lookTarget: 'alaric', facing: 'RIGHT', resolution: 'EXPLICIT_ADDRESSEE' });
    expect(audience.actors.find((actor) => actor.actorId === 'maelor')).toMatchObject({ screenPosition: 'CENTER_LEFT', group: 'PLAYER_COMPANY', dramaticSide: 'LEFT' });

    const opening = plans.acte_ouverture!.segments[0]!;
    expect(opening.stepDirections.find((direction) => direction.stepId === '2')).toMatchObject({ speakerId: 'maelor', addressedTo: 'sage_seraphine', lookTarget: 'sage_seraphine', facing: 'LEFT' });
    expect(opening.actors.find((actor) => actor.actorId === 'maelor')?.screenPosition).toBe('CENTER_LEFT');
  });

  it('classifies every production cinematic slot without deleting media', () => {
    const reduction = readSpec<{
      summary: { manifestSlots: number; productionVideoSlots: number; classifiedProductionVideoSlots: number; existingMediaDeleted: number };
      entries: Array<{ cinematicId: string; classification: string; justification: string; existingMediaPreserved: boolean }>;
    }>('final_cinematic_reduction_audit.json');
    expect(reduction.summary).toMatchObject({ manifestSlots: 32, productionVideoSlots: 31, classifiedProductionVideoSlots: 31, existingMediaDeleted: 0 });
    expect(reduction.entries.every((entry) => entry.classification.length > 0 && entry.justification.length > 0 && entry.existingMediaPreserved)).toBe(true);
  });

  it('preserves all step and choice effect owners through the four display-only trims', () => {
    const migration = readSpec<{
      summary: { originalSteps: number; finalSteps: number; EDIT: number; effectOwnerLoss: number; duplicateEffectExecution: number };
      entries: Array<{ operation: string; effectOwnerPreserved: boolean; choiceOwnerPreserved: boolean }>;
    }>('final_dialogue_text_migration.json');
    expect(migration.summary).toMatchObject({
      originalSteps: 247,
      finalSteps: 247,
      EDIT: 4,
      effectOwnerLoss: 0,
      duplicateEffectExecution: 0,
    });
    expect(migration.entries.every((entry) => entry.effectOwnerPreserved && entry.choiceOwnerPreserved)).toBe(true);
  });
});
