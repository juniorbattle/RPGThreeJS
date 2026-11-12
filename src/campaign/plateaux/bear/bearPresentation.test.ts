/**
 * Set 1.20.0, post-demo Lot 1: every Bear scene can be staged. Since OD-2026-11-11-F (accepted 2026-11-12) each one
 * shows its final tableau; the approved Lion tableau it replaced stays listed with the brief it was made from.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createGenericNarrativeTableau, resolveNarrativeBoundaryTableau, resolveNarrativeDialogueTableau } from '../../../cinematics/NarrativeTableau';
import { resolvePixelSheet } from '../../../combat/pixel/PixelSpriteSheets';
import { assets } from '../../../render/assetManifest';
import { resolveCharacterVisualProfile } from '../../../render/CharacterVisualRegistry';
import { BEAR_POI_ATLAS } from '../plateauAtlas';
import { demoEnvironmentPlateForContext } from '../../../render/demoEnvironmentPack';
import { createInitialState } from '../../../game/store';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, provisionalMark, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { applyFinalDialoguePresentationPlan, resolveFinalDialoguePresentationPlan } from '../../../cinematics/DialoguePresentationSegments';
import { DRAFT_VISIBLE_ACTOR_CAP } from '../../../cinematics/PostDemoPresentationPlans';
import { greedPlateauState, perfectHonourPlateauState } from '../../../game/reputationBounds';
import { resolveRefugePresentation } from '../../../ui/RefugePresentation';
import { BEAR_ROUTE } from './bearTopology';
import { BEAR_ATLAS_REGIONS, BEAR_CHRONICLE_END_IMAGE, BEAR_PROVISIONAL_ACTORS, BEAR_PROVISIONAL_ENEMIES, BEAR_PROVISIONAL_SCENES, BEAR_PROVISIONAL_SURFACES, BEAR_REFUGE_PRESENTATION } from './bearPresentation';

const publicFile = (url: string) => existsSync(join(process.cwd(), 'public', url));

const bearSceneIds = [...new Set([...POST_DEMO_DIALOGUES.keys(), ...postDemoSceneIds('bear')])].filter((id) => id.startsWith('bear_'));

describe('Bear scenes on their final tableaux (set 1.20.0, Lot 1, canon since OD-2026-11-08-B; final images OD-2026-11-11-F)', () => {
  it('lists every Bear scene, and only Bear scenes, with an approved tableau and its awaited final image', () => {
    expect(Object.keys(BEAR_PROVISIONAL_SCENES).sort()).toEqual([...bearSceneIds].sort());
    for (const [id, scene] of Object.entries(BEAR_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
      expect(scene.awaitedFinal, id).toMatch(/^Tableau : /);
    }
  });

  it('stages every Bear scene on its final tableau, canon, with no provisional mark', () => {
    const state = createInitialState();
    for (const id of bearSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      const image = BEAR_PROVISIONAL_SCENES[id]!.image!;
      expect(isDraftContent(id), id).toBe(false);
      expect(provisionalMark(id), id).toBeNull();
      expect(image, id).toBe(`/assets/generated/post-demo/bear/scenes/${id}.webp`);
      expect(publicFile(image), id).toBe(true);
      expect(createGenericNarrativeTableau(sequence).stillImage, id).toBe(image);
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

  it('keeps every Bear image listed with its brief, and shows the final refuges, atlases and chronicle end unmarked', () => {
    for (const entry of [...BEAR_ATLAS_REGIONS, ...BEAR_PROVISIONAL_ACTORS, ...BEAR_PROVISIONAL_ENEMIES, ...BEAR_PROVISIONAL_SURFACES,
      ...Object.values(BEAR_REFUGE_PRESENTATION), ...Object.values(BEAR_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
    expect(BEAR_POI_ATLAS.provisional).toBe(false);
    for (const region of BEAR_ATLAS_REGIONS) {
      expect(region.provisional, region.shortTitle).toBe(false);
      expect(publicFile(region.image), region.image).toBe(true);
    }
    expect(publicFile(BEAR_CHRONICLE_END_IMAGE)).toBe(true);
    expect(BEAR_PROVISIONAL_SURFACES.map((surface) => surface.image)).toEqual([BEAR_CHRONICLE_END_IMAGE]);
    const end = resolveNarrativeBoundaryTableau('node:bear-judgement:arrival')!;
    expect(end.stillImage).toBe(BEAR_CHRONICLE_END_IMAGE);
    expect(end.sceneCastPlacement).toEqual(resolveNarrativeBoundaryTableau('node:lion-final-judgement:arrival')!.sceneCastPlacement);
    expect(resolveNarrativeBoundaryTableau('node:dragon-judgement:arrival')).toBeUndefined();
    for (const node of BEAR_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      const image = (BEAR_REFUGE_PRESENTATION as Record<string, { image?: string }>)[node.id]!.image!;
      expect(presentation.provisional, node.id).toBeUndefined();
      expect(presentation.background, node.id).toBe(image);
      expect(publicFile(image), node.id).toBe(true);
      expect(presentation.gatheringDialogueId ?? null, node.id).toBe((BEAR_REFUGE_PRESENTATION as Record<string, { gatheringDialogueId?: string }>)[node.id]?.gatheringDialogueId ?? null);
    }
  });

  it('shows the Bear’s characters on their own masters: dialogue portrait, staged figure and combat sheet', () => {
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    for (const actor of BEAR_PROVISIONAL_ACTORS) {
      expect(actor.master, actor.actorId).toBe(`/assets/characters/pixel/post-demo/bear/${actor.actorId}.png`);
      expect(publicFile(actor.master!), actor.actorId).toBe(true);
      // No stand-in alias any more: the asset manifest carries the master.
      expect(resolveCharacterVisualProfile(actor.actorId), actor.actorId).toBeUndefined();
      expect(dialogueActors[actor.actorId], actor.actorId).toBe(actor.master);
      expect(resolvePixelSheet(actor.master)?.unitId, actor.actorId).toBe(actor.actorId);
    }
    for (const enemy of BEAR_PROVISIONAL_ENEMIES) {
      expect(publicFile(enemy.master!), enemy.unitId).toBe(true);
      expect(resolvePixelSheet(enemy.master)?.unitId, enemy.unitId).toBe(enemy.unitId);
      expect(resolvePixelSheet(enemy.master)?.masterOnly, enemy.unitId).toBe(true);
    }
  });
});
