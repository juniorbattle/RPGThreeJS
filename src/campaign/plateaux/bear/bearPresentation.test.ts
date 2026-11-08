/**
 * Set 1.20.0, post-demo Lot 1 — DRAFT: every Bear scene can be staged. Each one borrows an approved Lion tableau,
 * listed with the final image it awaits, so the narrative stage never meets a scene without a still image.
 */
import { describe, expect, it } from 'vitest';
import { createGenericNarrativeTableau, resolveNarrativeDialogueTableau } from '../../../cinematics/NarrativeTableau';
import { demoEnvironmentPlateForContext } from '../../../render/demoEnvironmentPack';
import { createInitialState } from '../../../game/store';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { applyFinalDialoguePresentationPlan, resolveFinalDialoguePresentationPlan } from '../../../cinematics/DialoguePresentationSegments';
import { DRAFT_VISIBLE_ACTOR_CAP } from '../../../cinematics/PostDemoPresentationPlans';
import { greedPlateauState, perfectHonourPlateauState } from '../../../game/reputationBounds';
import { BEAR_PROVISIONAL_SCENES } from './bearPresentation';

const bearSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('bear')])].filter((id) => id.startsWith('bear_'));

describe('Bear scenes on provisional tableaux (set 1.20.0, Lot 1 draft)', () => {
  it('lists every Bear scene, and only Bear scenes, with an approved tableau and its awaited final image', () => {
    expect(Object.keys(BEAR_PROVISIONAL_SCENES).sort()).toEqual([...bearSceneIds].sort());
    for (const [id, scene] of Object.entries(BEAR_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
      expect(scene.awaitedFinal, id).toMatch(/^Tableau : /);
    }
  });

  it('stages every Bear scene with a still image, and marks it as draft content', () => {
    const state = createInitialState();
    for (const id of bearSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      expect(isDraftContent(id), id).toBe(true);
      expect(createGenericNarrativeTableau(sequence).stillImage, id)
        .toBe(demoEnvironmentPlateForContext(BEAR_PROVISIONAL_SCENES[id]!.environmentContext, 'STATIC_TABLEAU').publicUrl);
      expect(resolveNarrativeDialogueTableau(id, sequence)?.dialogueId, id).toBe(id);
    }
  });

  it('stages every Bear scene, under honour and greed, with at most four visible actors and every speaker on stage', () => {
    for (const state of [createInitialState(), perfectHonourPlateauState('bear'), greedPlateauState('bear')]) {
      for (const id of bearSceneIds) {
        const sequence = resolvePostDemoDialogue(id, state)!;
        const plan = resolveFinalDialoguePresentationPlan(id, sequence)!;
        expect(plan.segments.flatMap((segment) => segment.stepIds), id).toEqual(sequence.steps.map((step) => step.id));
        for (const segment of plan.segments) {
          expect(segment.visibleCast.length, `${id}:${segment.id}`).toBeLessThanOrEqual(DRAFT_VISIBLE_ACTOR_CAP);
          for (const stepId of segment.stepIds) {
            const speaker = sequence.steps.find((step) => step.id === stepId)!.actorId;
            if (speaker) expect(segment.visibleCast, `${id}:${stepId}`).toContain(speaker);
          }
          // Facing the plateau's people, the company holds the left; the Raven never stands with it.
          const facesOthers = segment.actors.some((actor) => actor.group !== 'PLAYER_COMPANY');
          for (const actor of segment.actors) {
            if (actor.group === 'PLAYER_COMPANY' && facesOthers) expect(actor.dramaticSide, `${id}:${actor.actorId}`).not.toBe('RIGHT');
            if (actor.group === 'ANTAGONIST') expect(actor.dramaticSide, `${id}:${actor.actorId}`).not.toBe('LEFT');
          }
        }
        expect(() => applyFinalDialoguePresentationPlan(sequence), id).not.toThrow();
      }
    }
  });

  it('keeps the demo strict: a Lion scene without a reviewed plan for its shape is still refused', () => {
    const sequence = { id: 'lion_briefing', steps: [{ id: 'x', speaker: 'A', actorId: 'alaric', text: 'x', tag: '', expression: 'neutral' as const,
      portrait: '', side: 'center' as const, next: null, effects: [], choices: [] }] };
    expect(() => resolveFinalDialoguePresentationPlan('lion_briefing', sequence)).toThrow(/No authoritative runtime presentation plan/);
  });
});
