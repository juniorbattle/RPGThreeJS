/**
 * Set 1.20.0, post-demo Lot 4, canon since OD-2026-11-09-A — the final act on its final images (OD-2026-11-11-F, F1):
 * every scene, the refuge, the atlas, the Tournament's board and the chronicle end show the act's own images with no
 * provisional mark, its characters stand on their own masters (the Wolf's champion and Maelor on the ones they already
 * had), and the staging keeps at most four actors with the company facing the plateau's people.
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
import { greedJudgementState, perfectHonourJudgementState } from '../../../game/reputationBounds';
import { isDraftContent, POST_DEMO_DIALOGUES, postDemoSceneIds, provisionalMark, resolvePostDemoDialogue } from '../../../game/postDemoContent';
import { resolveRefugePresentation } from '../../../ui/RefugePresentation';
import { FINALE_POI_ATLAS, poiAtlasForNode } from '../plateauAtlas';
import { FINALE_ROUTE } from './finaleTopology';
import {
  FINALE_ATLAS_REGIONS, FINALE_CHRONICLE_END_IMAGE, FINALE_MOMENTS, FINALE_PROVISIONAL_ACTORS, FINALE_PROVISIONAL_ENEMIES, FINALE_PROVISIONAL_SCENES,
  FINALE_PROVISIONAL_SURFACES, FINALE_REFUGE_PRESENTATION, FINALE_TOURNAMENT_BOARD_IMAGE, finaleMomentPlays,
} from './finalePresentation';
import { EPILOGUE_CONTENT_IDS } from './finaleEpilogues';
import { setClanRelation } from '../../../game/runSystem';

const publicFile = (url: string) => existsSync(join(process.cwd(), 'public', url));
const FINAL_CHARACTERS = '/assets/characters/pixel/post-demo/finale';

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
const epilogueSceneIds = finaleSceneIds.filter((id) => EPILOGUE_CONTENT_IDS.has(id));
/** Every clan on the company's side, as the saved relations say: the endings' fullest cast. */
function alliedEverywhere(): ReturnType<typeof perfectHonourJudgementState> {
  const state = finaleHonourState();
  for (const clan of ['lion', 'bear', 'dragon', 'scorpion', 'raven', 'wolf', 'phoenix'] as const) setClanRelation(state, clan, 'ally', 'qa');
  Object.assign(state.flags, { finaleCiviliansProtected: true, finaleFearLastStand: true, finaleLastStandWon: true });
  return state;
}

describe('final-act scenes on their final tableaux (set 1.20.0, Lot 4; final images OD-2026-11-11-F)', () => {
  it('lists every final-act scene, and only them, with the approved tableau it replaced and its brief', () => {
    expect(Object.keys(FINALE_PROVISIONAL_SCENES).sort()).toEqual([...finaleSceneIds].sort());
    for (const [id, scene] of Object.entries(FINALE_PROVISIONAL_SCENES)) {
      expect(demoEnvironmentPlateForContext(scene.environmentContext, 'STATIC_TABLEAU').publicUrl, id).toMatch(/^\//);
      expect(scene.awaitedFinal, id).toMatch(/^Tableau( vivant)? : /);
    }
    for (const entry of [...FINALE_ATLAS_REGIONS, ...FINALE_PROVISIONAL_ACTORS, ...FINALE_PROVISIONAL_ENEMIES, ...FINALE_PROVISIONAL_SURFACES,
      ...Object.values(FINALE_REFUGE_PRESENTATION), ...Object.values(FINALE_PROVISIONAL_SCENES)]) {
      expect(entry.awaitedFinal.length, JSON.stringify(entry)).toBeGreaterThan(10);
    }
  });

  it('stages every final-act scene and ending on its final tableau, canon, with no provisional mark', () => {
    const state = createInitialState();
    expect(epilogueSceneIds.sort()).toEqual(['finale_epilogue_balance', 'finale_epilogue_fear', 'finale_epilogue_respect', 'finale_fear_close']);
    for (const id of finaleSceneIds) {
      const sequence = resolvePostDemoDialogue(id, state)!;
      const image = FINALE_PROVISIONAL_SCENES[id]!.image!;
      expect(isDraftContent(id), id).toBe(false);
      expect(provisionalMark(id), id).toBeNull();
      expect(image, id).toBe(`/assets/generated/post-demo/finale/scenes/${id}.webp`);
      expect(publicFile(image), id).toBe(true);
      expect(createGenericNarrativeTableau(sequence).stillImage, id).toBe(image);
      expect(resolveNarrativeDialogueTableau(id, sequence)?.dialogueId, id).toBe(id);
    }
    // The last stand of the Fear ending is a fight of the final act: no mark either.
    expect([isDraftContent('finale_last_stand'), provisionalMark('finale_last_stand')]).toEqual([false, null]);
  });

  it('holds the moment table of the betrayal and the three epilogues, held to the contract and on approved tableaux', () => {
    expect(FINALE_MOMENTS.map((moment) => moment.beforeDialogueId)).toEqual(['finale_betrayal', 'finale_epilogue_respect', 'finale_epilogue_fear', 'finale_epilogue_balance']);
    for (const moment of FINALE_MOMENTS) {
      expect(resolvePostDemoDialogue(moment.beforeDialogueId, createInitialState()), moment.id).toBeDefined();
      expect(moment.facts.length, moment.id).toBeGreaterThan(0);
      // The painted tableaux are integrated and the table was validated on 2026-11-13: each moment may play once registered.
      expect([moment.status, moment.tableau, finaleMomentPlays(moment)], moment.id).toEqual(['approved', 'approved', true]);
      expect(publicFile(FINALE_PROVISIONAL_SCENES[moment.sceneId]!.image!), moment.id).toBe(true);
    }
    expect(finaleMomentPlays({ ...FINALE_MOMENTS[1]!, status: 'proposed', tableau: 'approved' })).toBe(false);
    expect(finaleMomentPlays({ ...FINALE_MOMENTS[1]!, status: 'approved', tableau: 'approved' })).toBe(true);
  });

  it('stages every final-act scene with at most four visible actors, the company facing the plateau’s people', () => {
    for (const state of [createInitialState(), finaleHonourState(), finaleGreedState(), alliedEverywhere()]) {
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

  it('shows the final act’s refuge, single map, board and chronicle end on their final images, unmarked', () => {
    expect(FINALE_POI_ATLAS.provisional).toBe(false);
    expect(poiAtlasForNode('finale-arena-gate').provisional).toBe(false);
    expect(poiAtlasForNode('finale-arena-gate').regions.map((region) => region.shortTitle)).toEqual(['La capitale corrompue']);
    for (const region of FINALE_ATLAS_REGIONS) {
      expect(region.provisional, region.shortTitle).toBe(false);
      expect(region.image).toBe('/assets/generated/post-demo/finale/atlases/region-1.webp');
      expect(publicFile(region.image), region.image).toBe(true);
    }
    for (const node of FINALE_ROUTE.filter((candidate) => candidate.type === 'refuge')) {
      const presentation = resolveRefugePresentation({ ...node, links: [...node.links], x: 0, z: 0 } as never)!;
      const image = (FINALE_REFUGE_PRESENTATION as Record<string, { image?: string }>)[node.id]!.image!;
      expect(presentation.provisional, node.id).toBeUndefined();
      expect(presentation.draft ?? false, node.id).toBe(false);
      expect(presentation.background, node.id).toBe(image);
      expect(publicFile(image), node.id).toBe(true);
    }
    expect(FINALE_PROVISIONAL_SURFACES.map((surface) => surface.image)).toEqual([FINALE_TOURNAMENT_BOARD_IMAGE, FINALE_CHRONICLE_END_IMAGE]);
    for (const image of [FINALE_TOURNAMENT_BOARD_IMAGE, FINALE_CHRONICLE_END_IMAGE]) expect(publicFile(image), image).toBe(true);
    // The act's chronicle ends at the breach, on the Lion's chronicle-end staging.
    const end = resolveNarrativeBoundaryTableau('node:finale-breach:arrival')!;
    expect(end.stillImage).toBe(FINALE_CHRONICLE_END_IMAGE);
    expect(end.sceneCastPlacement).toEqual(resolveNarrativeBoundaryTableau('node:lion-final-judgement:arrival')!.sceneCastPlacement);
  });

  it('shows the final act’s characters on their own masters: dialogue portrait, staged figure and combat sheet', () => {
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    // Each champion speaks with the master of his combat sprite; the Wolf's with the Dragon's champion.
    const sheets: Record<string, string> = {
      finale_raven_champion: 'raven_champion', finale_wolf_champion: 'wolf_champion', finale_phoenix_champion: 'phoenix_champion',
      finale_serpent_champion: 'serpent_champion', finale_civilian: 'finale_civilian', finale_citizen: 'finale_citizen',
    };
    for (const actor of FINALE_PROVISIONAL_ACTORS) {
      expect(actor.master, actor.actorId).toBe(actor.actorId === 'finale_wolf_champion'
        ? '/assets/characters/pixel/post-demo/dragon/wolf_champion.png' : `${FINAL_CHARACTERS}/${sheets[actor.actorId]}.png`);
      expect(publicFile(actor.master!), actor.actorId).toBe(true);
      // No stand-in alias any more: the asset manifest carries the master.
      expect(resolveCharacterVisualProfile(actor.actorId), actor.actorId).toBeUndefined();
      expect(dialogueActors[actor.actorId], actor.actorId).toBe(actor.master);
      expect(resolvePixelSheet(actor.master)?.unitId, actor.actorId).toBe(sheets[actor.actorId]);
    }
    for (const enemy of FINALE_PROVISIONAL_ENEMIES) {
      if (enemy.unitId === 'maelor_traitor') {
        // Maelor keeps his approved master at the breach (postDemoCombatRuntime.test.ts), which now carries his first combat
        // sheet, with its four poses (OD-2026-11-13-A), instead of the bare master.
        expect(enemy.master).toBe('/assets/characters/pixel/masters/maelor.png');
        expect(publicFile(enemy.master!)).toBe(true);
        expect(resolvePixelSheet(enemy.master)?.unitId).toBe('maelor');
        expect(resolvePixelSheet(enemy.master)?.cells).toEqual(['idle', 'idle_b', 'dash', 'attack', 'cast']);
        continue;
      }
      expect(enemy.master, enemy.unitId).toBe(`${FINAL_CHARACTERS}/${enemy.unitId}.png`);
      expect(publicFile(enemy.master!), enemy.unitId).toBe(true);
      expect(resolvePixelSheet(enemy.master)?.unitId, enemy.unitId).toBe(enemy.unitId);
      // OD-2026-11-13-A: each fighter of the final act has its four combat poses, its master as prepare plus dash, attack and cast.
      expect(resolvePixelSheet(enemy.master)?.masterOnly, enemy.unitId).toBeUndefined();
      expect(resolvePixelSheet(enemy.master)?.cells, enemy.unitId).toEqual(['idle', 'idle_b', 'dash', 'attack', 'cast']);
    }
  });
});
