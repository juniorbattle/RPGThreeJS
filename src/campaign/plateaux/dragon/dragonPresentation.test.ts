/**
 * Set 1.20.0, post-demo Lot 2 — DRAFT: every Dragon scene can be staged on a provisional tableau, every provisional
 * image is listed with the final image it awaits, the scenes and refuges say they are drafts, and the staging keeps at
 * most four actors with the company facing the plateau's people.
 */
import { describe, expect, it } from 'vitest';
import { applyFinalDialoguePresentationPlan, resolveFinalDialoguePresentationPlan } from '../../../cinematics/DialoguePresentationSegments';
import { createGenericNarrativeTableau } from '../../../cinematics/NarrativeTableau';
import { DRAFT_VISIBLE_ACTOR_CAP } from '../../../cinematics/PostDemoPresentationPlans';
import { demoEnvironmentPlateForContext } from '../../../render/demoEnvironmentPack';
import { resolveCharacterUnitId } from '../../../render/CharacterVisualRegistry';
import { createInitialState } from '../../../game/store';
import { greedPlateauState, perfectHonourPlateauState } from '../../../game/reputationBounds';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, provisionalMark, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { resolveRefugePresentation } from '../../../ui/RefugePresentation';
import { poiAtlasForNode } from '../plateauAtlas';
import { DRAGON_ROUTE } from './dragonTopology';
import {
  DRAGON_ATLAS_REGIONS, DRAGON_PROVISIONAL_ACTORS, DRAGON_PROVISIONAL_ENEMIES, DRAGON_PROVISIONAL_SCENES, DRAGON_PROVISIONAL_SURFACES,
  DRAGON_REFUGE_PRESENTATION,
} from './dragonPresentation';

const dragonSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('dragon')])].filter((id) => id.startsWith('dragon_'));

describe('Dragon scenes on provisional tableaux (set 1.20.0, Lot 2 draft)', () => {
  it('lists every Dragon scene, and only them, with an approved tableau and its awaited final image', () => {
    expect(Object.keys(DRAGON_PROVISIONAL_SCENES).sort()).toEqual([...dragonSceneIds].sort());
    for (const [id, scene] of Object.entries(DRAGON_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
    }
    for (const entry of [...DRAGON_ATLAS_REGIONS, ...DRAGON_PROVISIONAL_ACTORS, ...DRAGON_PROVISIONAL_ENEMIES, ...DRAGON_PROVISIONAL_SURFACES,
      ...Object.values(DRAGON_REFUGE_PRESENTATION), ...Object.values(DRAGON_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
  });

  it('stands every new Dragon character in with an existing silhouette', () => {
    for (const actor of DRAGON_PROVISIONAL_ACTORS) expect(resolveCharacterUnitId(actor.actorId), actor.actorId).toBe(actor.standInUnitId);
  });

  it('marks every Dragon scene as canon on provisional images (OD-2026-11-08-C), with a still image', () => {
    const state = createInitialState();
    for (const id of dragonSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      expect(isDraftContent(id), id).toBe(false);
      expect(provisionalMark(id), id).toBe('Image provisoire');
      expect(createGenericNarrativeTableau(sequence).stillImage, id)
        .toBe(demoEnvironmentPlateForContext(DRAGON_PROVISIONAL_SCENES[id]!.environmentContext, 'STATIC_TABLEAU').publicUrl);
    }
  });

  it('stages every Dragon scene with at most four visible actors, the company facing the plateau’s people', () => {
    for (const state of [createInitialState(), perfectHonourPlateauState('dragon'), greedPlateauState('dragon')]) {
      for (const id of dragonSceneIds) {
        const sequence = resolvePostDemoDialogue(id, state)!;
        const plan = resolveFinalDialoguePresentationPlan(id, sequence)!;
        expect(plan.segments.flatMap((segment) => segment.stepIds), id).toEqual(sequence.steps.map((step) => step.id));
        for (const segment of plan.segments) {
          expect(segment.visibleCast.length, `${id}:${segment.id}`).toBeLessThanOrEqual(DRAFT_VISIBLE_ACTOR_CAP);
          const facesOthers = segment.actors.some((actor) => actor.group !== 'PLAYER_COMPANY');
          for (const actor of segment.actors) {
            if (actor.group === 'PLAYER_COMPANY' && facesOthers) expect(actor.dramaticSide, `${id}:${actor.actorId}`).not.toBe('RIGHT');
          }
        }
        expect(() => applyFinalDialoguePresentationPlan(sequence), id).not.toThrow();
      }
    }
  });

  it('marks the Dragon’s refuges and map as provisional art, no longer as drafts', () => {
    for (const node of DRAGON_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      expect([presentation.provisional, presentation.draft], node.id).toEqual([true, false]);
    }
    expect(poiAtlasForNode('dragon-camp').provisional).toBe(true);
    expect(poiAtlasForNode('dragon-camp').regions.map((region) => region.shortTitle)).toEqual(['I · Les contreforts', 'II · Les terrasses', 'III · Les cimes']);
  });
});
