/**
 * Authored staging corrections over the locked Lion plans (operator, 2026-11-13: « Oui, corrige-les »). The company
 * holds the left, a threatened civilian stands between, the one faced holds the right, in every shape of the corrected
 * dialogues; no other locked plan changes.
 */
import { describe, expect, it } from 'vitest';
import { FINAL_DIALOGUE_PRESENTATION_PLANS, FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';
import type { FinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { resolveFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { correctLockedStaging, LOCKED_STAGING_CORRECTED_SEGMENTS } from './LockedStagingCorrections';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { createInitialState } from '../game/store';

const LEFT = ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'];
const RIGHT = ['CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'];
const canonical = FINAL_DIALOGUE_PRESENTATION_PLANS as unknown as Record<string, FinalDialoguePresentationPlan>;
const runtime = FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS as unknown as Record<string, Record<string, FinalDialoguePresentationPlan>>;
const allPlans = (): [string, FinalDialoguePresentationPlan][] => [
  ...Object.entries(canonical).map(([id, plan]) => [`${id}`, plan] as [string, FinalDialoguePresentationPlan]),
  ...Object.entries(runtime).flatMap(([id, shapes]) => Object.entries(shapes).map(([shape, plan]) => [`${id} ${shape}`, plan] as [string, FinalDialoguePresentationPlan])),
];
const shapesOf = (dialogueId: string) => allPlans().filter(([key]) => key === dialogueId || key.startsWith(`${dialogueId} `));
const corrected = (plan: FinalDialoguePresentationPlan, segmentId: string) => correctLockedStaging(plan).segments.find((segment) => segment.id === segmentId)!;
const at = (segment: ReturnType<typeof corrected>, actorId: string) => segment.actors.find((actor) => actor.actorId === actorId)!;

describe('the Bois-Clair request (village_choice, segment 1)', () => {
  it('keeps the company left, the villager between and the raider alone on the right, in every shape', () => {
    const shapes = shapesOf('village_choice');
    expect(shapes.length).toBeGreaterThanOrEqual(2);
    for (const [, plan] of shapes) {
      const before = plan.segments.find((segment) => segment.id === 'village_choice:segment-1')!;
      const segment = corrected(plan, 'village_choice:segment-1');
      expect(segment.visibleCast).toEqual(before.visibleCast);
      expect(segment.actors.map((actor) => actor.actorId).sort()).toEqual(before.actors.map((actor) => actor.actorId).sort());
      for (const actor of segment.actors) {
        if (['marian', 'kestrel', 'cedric'].includes(actor.actorId)) {
          expect(LEFT).toContain(actor.screenPosition);
          expect(actor).toMatchObject({ facing: 'RIGHT', group: 'PLAYER_COMPANY' });
        }
      }
      expect(at(segment, 'villageoise')).toMatchObject({ screenPosition: 'CENTER', facing: 'LEFT', dramaticSide: 'CENTER' });
      expect(RIGHT).toContain(at(segment, 'serpent_raider').screenPosition);
      expect(segment.actors.filter((actor) => RIGHT.includes(actor.screenPosition)).map((actor) => actor.actorId)).toEqual(['serpent_raider']);
      // Each speaker turns toward the one the line addresses.
      const facingOf = (stepId: string) => segment.stepDirections.find((direction) => direction.stepId === stepId)!.facing;
      expect([facingOf('1'), facingOf('1a'), facingOf('2'), facingOf('2a')]).toEqual(['LEFT', 'RIGHT', 'LEFT', 'RIGHT']);
    }
  });

  it('places Cédric with the company when he speaks for it', () => {
    const cedric = shapesOf('village_choice').map(([, plan]) => corrected(plan, 'village_choice:segment-1'))
      .find((segment) => segment.visibleCast.includes('cedric'))!;
    expect(cedric).toBeDefined();
    expect(LEFT).toContain(at(cedric, 'cedric').screenPosition);
  });
});

describe('the creatures faced by the company (troll crossing, shrine)', () => {
  for (const [dialogueId, creature, group] of [['mystery_troll_crossing', 'forest_troll_elite', 'ANTAGONIST'], ['mystery_shrine', 'shrine_apparition', 'NEUTRAL']] as const) {
    it(`keeps Séraphine and Maelor on the left and ${creature} alone on the right`, () => {
      for (const [, plan] of shapesOf(dialogueId)) {
        const segment = corrected(plan, `${dialogueId}:segment-1`);
        expect(at(segment, 'sage_seraphine')).toMatchObject({ screenPosition: 'FAR_LEFT', facing: 'RIGHT' });
        expect(at(segment, 'maelor')).toMatchObject({ screenPosition: 'CENTER_LEFT', facing: 'RIGHT' });
        expect(at(segment, creature)).toMatchObject({ screenPosition: 'RIGHT', facing: 'LEFT', group });
        const facingOf = (stepId: string) => segment.stepDirections.find((direction) => direction.stepId === stepId)!.facing;
        expect([facingOf('1'), facingOf('2')]).toEqual(['LEFT', 'RIGHT']);
      }
    });
  }
});

describe('the scope of the corrections', () => {
  it('returns every other locked plan untouched', () => {
    for (const [key, plan] of allPlans()) {
      if (plan.segments.some((segment) => LOCKED_STAGING_CORRECTED_SEGMENTS.includes(segment.id))) continue;
      expect(correctLockedStaging(plan), key).toBe(plan);
    }
  });

  it('leaves the other segments of a corrected dialogue as they are', () => {
    const plan = canonical.village_choice!;
    const result = correctLockedStaging(plan);
    plan.segments.forEach((segment, index) => {
      if (segment.id !== 'village_choice:segment-1') expect(result.segments[index]).toBe(segment);
    });
  });

  it('applies when the game resolves the plan of the played dialogue', () => {
    const sequence = resolveGameDialogue('village_choice', createInitialState())!.sequence;
    const segment = resolveFinalDialoguePresentationPlan('village_choice', sequence)!.segments.find((candidate) => candidate.id === 'village_choice:segment-1')!;
    expect(segment.actors.find((actor) => actor.actorId === 'villageoise')!.screenPosition).toBe('CENTER');
  });
});
