/**
 * Set 1.20.0, post-demo Lot 4 — DRAFT: every final-act scene can be staged on a provisional tableau, every provisional image
 * is listed with the final image it awaits, the scenes and refuges say their images are provisional (canon since
 * OD-2026-11-08-D), and the staging keeps at
 * most four actors with the company facing the plateau's people.
 */
import { describe, expect, it } from 'vitest';
import { applyFinalDialoguePresentationPlan, resolveFinalDialoguePresentationPlan } from '../../../cinematics/DialoguePresentationSegments';
import { createGenericNarrativeTableau } from '../../../cinematics/NarrativeTableau';
import { DRAFT_VISIBLE_ACTOR_CAP } from '../../../cinematics/PostDemoPresentationPlans';
import { demoEnvironmentPlateForContext } from '../../../render/demoEnvironmentPack';
import { resolveCharacterUnitId } from '../../../render/CharacterVisualRegistry';
import { createInitialState } from '../../../game/store';
import { greedJudgementState, perfectHonourJudgementState } from '../../../game/reputationBounds';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, provisionalMark, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { resolveRefugePresentation } from '../../../ui/RefugePresentation';
import { poiAtlasForNode } from '../plateauAtlas';
import { FINALE_ROUTE } from './finaleTopology';
import {
  FINALE_ATLAS_REGIONS, FINALE_PROVISIONAL_ACTORS, FINALE_PROVISIONAL_ENEMIES, FINALE_PROVISIONAL_SCENES, FINALE_PROVISIONAL_SURFACES,
  FINALE_REFUGE_PRESENTATION,
} from './finalePresentation';

/** An honourable company and a greedy one at the final act, every evidence and verdict set, to build its scenes. */
function finaleHonourState(): ReturnType<typeof perfectHonourJudgementState> {
  const state = perfectHonourJudgementState();
  // Every chief and every rival on the company's side: the rally's fullest cast.
  Object.assign(state.flags, { serpentGeneralDefeated: true, bearMasterSpyDefeated: true, dragonShadowShamanDefeated: true,
    scorpionShadowProphetDefeated: true, finaleRavenSpared: true, finaleWolfSpared: true, finalePhoenixSpared: true });
  return state;
}
function finaleGreedState(): ReturnType<typeof greedJudgementState> {
  const state = greedJudgementState();
  Object.assign(state.flags, { lionTrialWon: true, bearTrialWon: true, dragonTrialWon: true, scorpionTrialWon: true,
    finaleRavenHumiliated: true, finaleWolfHumiliated: true, finalePhoenixHumiliated: true });
  return state;
}
const finaleSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('finale')])].filter((id) => id.startsWith('finale_'));

describe('final-act scenes on provisional tableaux (set 1.20.0, Lot 4 draft)', () => {
  it('lists every final-act scene, and only them, with an approved tableau and its awaited final image', () => {
    expect(Object.keys(FINALE_PROVISIONAL_SCENES).sort()).toEqual([...finaleSceneIds].sort());
    for (const [id, scene] of Object.entries(FINALE_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
    }
    for (const entry of [...FINALE_ATLAS_REGIONS, ...FINALE_PROVISIONAL_ACTORS, ...FINALE_PROVISIONAL_ENEMIES, ...FINALE_PROVISIONAL_SURFACES,
      ...Object.values(FINALE_REFUGE_PRESENTATION), ...Object.values(FINALE_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
  });

  it('stands every new final-act character in with an existing silhouette', () => {
    for (const actor of FINALE_PROVISIONAL_ACTORS) expect(resolveCharacterUnitId(actor.actorId), actor.actorId).toBe(actor.standInUnitId);
  });

  it('marks every final-act scene as a draft on provisional images, with a still image', () => {
    const state = createInitialState();
    for (const id of finaleSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      expect(isDraftContent(id), id).toBe(true);
      expect(provisionalMark(id), id).toBe('Brouillon · image provisoire');
      expect(createGenericNarrativeTableau(sequence).stillImage, id)
        .toBe(demoEnvironmentPlateForContext(FINALE_PROVISIONAL_SCENES[id]!.environmentContext, 'STATIC_TABLEAU').publicUrl);
    }
  });

  it('stages every final-act scene with at most four visible actors, the company facing the plateau’s people', () => {
    for (const state of [createInitialState(), finaleHonourState(), finaleGreedState()]) {
      for (const id of finaleSceneIds) {
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

  it('marks the final act’s refuge as a draft on provisional art, and its single map as provisional', () => {
    for (const node of FINALE_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      expect([presentation.provisional, presentation.draft], node.id).toEqual([true, true]);
    }
    expect(poiAtlasForNode('finale-arena-gate').provisional).toBe(true);
    expect(poiAtlasForNode('finale-arena-gate').regions.map((region) => region.shortTitle)).toEqual(['La capitale corrompue']);
  });
});
