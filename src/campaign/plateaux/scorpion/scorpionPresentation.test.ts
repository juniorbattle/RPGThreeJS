/**
 * Set 1.20.0, post-demo Lot 3 — DRAFT: every Scorpion scene can be staged on a provisional tableau, every provisional
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
import { SCORPION_ROUTE } from './scorpionTopology';
import {
  SCORPION_ATLAS_REGIONS, SCORPION_PROVISIONAL_ACTORS, SCORPION_PROVISIONAL_ENEMIES, SCORPION_PROVISIONAL_SCENES, SCORPION_PROVISIONAL_SURFACES,
  SCORPION_REFUGE_PRESENTATION,
} from './scorpionPresentation';

const scorpionSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('scorpion')])].filter((id) => id.startsWith('scorpion_'));

describe('Scorpion scenes on provisional tableaux (set 1.20.0, Lot 3 draft)', () => {
  it('lists every Scorpion scene, and only them, with an approved tableau and its awaited final image', () => {
    expect(Object.keys(SCORPION_PROVISIONAL_SCENES).sort()).toEqual([...scorpionSceneIds].sort());
    for (const [id, scene] of Object.entries(SCORPION_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
    }
    for (const entry of [...SCORPION_ATLAS_REGIONS, ...SCORPION_PROVISIONAL_ACTORS, ...SCORPION_PROVISIONAL_ENEMIES, ...SCORPION_PROVISIONAL_SURFACES,
      ...Object.values(SCORPION_REFUGE_PRESENTATION), ...Object.values(SCORPION_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
  });

  it('stands every new Scorpion character in with an existing silhouette', () => {
    for (const actor of SCORPION_PROVISIONAL_ACTORS) expect(resolveCharacterUnitId(actor.actorId), actor.actorId).toBe(actor.standInUnitId);
  });

  it('marks every Scorpion scene as a draft on provisional images, with a still image', () => {
    const state = createInitialState();
    for (const id of scorpionSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      expect(isDraftContent(id), id).toBe(true);
      expect(provisionalMark(id), id).toBe('Brouillon · image provisoire');
      expect(createGenericNarrativeTableau(sequence).stillImage, id)
        .toBe(demoEnvironmentPlateForContext(SCORPION_PROVISIONAL_SCENES[id]!.environmentContext, 'STATIC_TABLEAU').publicUrl);
    }
  });

  it('stages every Scorpion scene with at most four visible actors, the company facing the plateau’s people', () => {
    for (const state of [createInitialState(), perfectHonourPlateauState('scorpion'), greedPlateauState('scorpion')]) {
      for (const id of scorpionSceneIds) {
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

  it('marks the Scorpion’s refuges as drafts on provisional art, and its map as provisional', () => {
    for (const node of SCORPION_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      expect([presentation.provisional, presentation.draft], node.id).toEqual([true, true]);
    }
    expect(poiAtlasForNode('scorpion-camp').provisional).toBe(true);
    expect(poiAtlasForNode('scorpion-camp').regions.map((region) => region.shortTitle)).toEqual(['I · Les dunes', 'II · Les ruines', 'III · Le sanctuaire']);
  });
});
