/**
 * Set 1.20.0, post-demo Lot 3, canon since OD-2026-11-08-D — the Scorpion on its final images (OD-2026-11-11-F, F1):
 * every scene, refuge, atlas and the chronicle end show the plateau's own images with no provisional mark, the nine
 * new characters stand on their own masters, and the staging keeps at most four actors with the company facing the
 * plateau's people.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyFinalDialoguePresentationPlan, resolveFinalDialoguePresentationPlan } from '../../../cinematics/DialoguePresentationSegments';
import { createGenericNarrativeTableau, resolveNarrativeBoundaryTableau, resolveNarrativeDialogueTableau } from '../../../cinematics/NarrativeTableau';
import { DRAFT_VISIBLE_ACTOR_CAP } from '../../../cinematics/PostDemoPresentationPlans';
import { resolvePixelSheet } from '../../../combat/pixel/PixelSpriteSheets';
import { assets } from '../../../render/assetManifest';
import { demoEnvironmentPlateForContext } from '../../../render/demoEnvironmentPack';
import { resolveCharacterVisualProfile } from '../../../render/CharacterVisualRegistry';
import { createInitialState } from '../../../game/store';
import { greedPlateauState, perfectHonourPlateauState } from '../../../game/reputationBounds';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, provisionalMark, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { resolveRefugePresentation } from '../../../ui/RefugePresentation';
import { SCORPION_POI_ATLAS, poiAtlasForNode } from '../plateauAtlas';
import { SCORPION_ROUTE } from './scorpionTopology';
import {
  SCORPION_ATLAS_REGIONS, SCORPION_CHRONICLE_END_IMAGE, SCORPION_PROVISIONAL_ACTORS, SCORPION_PROVISIONAL_ENEMIES, SCORPION_PROVISIONAL_SCENES,
  SCORPION_PROVISIONAL_SURFACES, SCORPION_REFUGE_PRESENTATION,
} from './scorpionPresentation';

const publicFile = (url: string) => existsSync(join(process.cwd(), 'public', url));

const scorpionSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('scorpion')])].filter((id) => id.startsWith('scorpion_'));

describe('Scorpion scenes on their final tableaux (set 1.20.0, Lot 2, canon since OD-2026-11-08-C; final images OD-2026-11-11-F)', () => {
  it('lists every Scorpion scene, and only them, with the approved tableau it replaced and its brief', () => {
    expect(Object.keys(SCORPION_PROVISIONAL_SCENES).sort()).toEqual([...scorpionSceneIds].sort());
    for (const [id, scene] of Object.entries(SCORPION_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
      expect(scene.awaitedFinal, id).toMatch(/^Tableau : /);
    }
    for (const entry of [...SCORPION_ATLAS_REGIONS, ...SCORPION_PROVISIONAL_ACTORS, ...SCORPION_PROVISIONAL_ENEMIES, ...SCORPION_PROVISIONAL_SURFACES,
      ...Object.values(SCORPION_REFUGE_PRESENTATION), ...Object.values(SCORPION_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
  });

  it('stages every Scorpion scene on its final tableau, canon, with no provisional mark', () => {
    const state = createInitialState();
    for (const id of scorpionSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      const image = SCORPION_PROVISIONAL_SCENES[id]!.image!;
      expect(isDraftContent(id), id).toBe(false);
      expect(provisionalMark(id), id).toBeNull();
      expect(image, id).toBe(`/assets/generated/post-demo/scorpion/scenes/${id}.webp`);
      expect(publicFile(image), id).toBe(true);
      expect(createGenericNarrativeTableau(sequence).stillImage, id).toBe(image);
      expect(resolveNarrativeDialogueTableau(id, sequence)?.dialogueId, id).toBe(id);
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

  it('shows the Scorpion’s final refuges, atlases and chronicle end, unmarked', () => {
    expect(SCORPION_POI_ATLAS.provisional).toBe(false);
    expect(poiAtlasForNode('scorpion-camp').provisional).toBe(false);
    expect(poiAtlasForNode('scorpion-camp').regions.map((region) => region.shortTitle)).toEqual(['I · Les dunes', 'II · Les ruines', 'III · Le sanctuaire']);
    for (const region of SCORPION_ATLAS_REGIONS) {
      expect(region.provisional, region.shortTitle).toBe(false);
      expect(publicFile(region.image), region.image).toBe(true);
    }
    expect(publicFile(SCORPION_CHRONICLE_END_IMAGE)).toBe(true);
    expect(SCORPION_PROVISIONAL_SURFACES.map((surface) => surface.image)).toEqual([SCORPION_CHRONICLE_END_IMAGE]);
    const end = resolveNarrativeBoundaryTableau('node:scorpion-judgement:arrival')!;
    expect(end.stillImage).toBe(SCORPION_CHRONICLE_END_IMAGE);
    expect(end.sceneCastPlacement).toEqual(resolveNarrativeBoundaryTableau('node:lion-final-judgement:arrival')!.sceneCastPlacement);
    for (const node of SCORPION_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      const image = (SCORPION_REFUGE_PRESENTATION as Record<string, { image?: string }>)[node.id]!.image!;
      expect(presentation.provisional, node.id).toBeUndefined();
      expect(presentation.draft ?? false, node.id).toBe(false);
      expect(presentation.background, node.id).toBe(image);
      expect(publicFile(image), node.id).toBe(true);
    }
  });

  it('shows the Scorpion’s characters on their own masters: dialogue portrait, staged figure and combat sheet', () => {
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    for (const actor of SCORPION_PROVISIONAL_ACTORS) {
      expect(actor.master, actor.actorId).toBe(`/assets/characters/pixel/post-demo/scorpion/${actor.actorId}.png`);
      expect(publicFile(actor.master!), actor.actorId).toBe(true);
      // No stand-in alias any more: the asset manifest carries the master.
      expect(resolveCharacterVisualProfile(actor.actorId), actor.actorId).toBeUndefined();
      expect(dialogueActors[actor.actorId], actor.actorId).toBe(actor.master);
      expect(resolvePixelSheet(actor.master)?.unitId, actor.actorId).toBe(actor.actorId);
    }
    for (const enemy of SCORPION_PROVISIONAL_ENEMIES) {
      expect(enemy.master, enemy.unitId).toBe(`/assets/characters/pixel/post-demo/scorpion/${enemy.unitId}.png`);
      expect(publicFile(enemy.master!), enemy.unitId).toBe(true);
      expect(resolvePixelSheet(enemy.master)?.unitId, enemy.unitId).toBe(enemy.unitId);
      // OD-2026-11-13-A: each fighter of the Scorpion has its four combat poses, its master as prepare plus dash, attack and cast.
      expect(resolvePixelSheet(enemy.master)?.masterOnly, enemy.unitId).toBeUndefined();
      expect(resolvePixelSheet(enemy.master)?.cells, enemy.unitId).toEqual(['idle', 'idle_b', 'dash', 'attack', 'cast']);
    }
  });
});
