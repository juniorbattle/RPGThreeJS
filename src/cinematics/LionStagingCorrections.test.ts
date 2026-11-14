/**
 * The three Lion segments restaged on the operator's « Oui, corrige-les » (2026-11-13) keep exactly the placement
 * validated then. Since 2026-11-14 the generator writes it into the lock (`STAGING_CORRECTED_SEGMENTS` in
 * `tools/cinematics/dialoguePresentationLock.ts`); the game shows the lock as written, with no runtime correction.
 */
import { describe, expect, it } from 'vitest';
import { FINAL_DIALOGUE_PRESENTATION_PLANS, FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';
import { resolveFinalDialoguePresentationPlan, type FinalDialoguePresentationPlan, type FinalDialoguePresentationSegment } from './DialoguePresentationSegments';
import { STAGING_CORRECTED_SEGMENTS } from '../../tools/cinematics/dialoguePresentationLock';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { createInitialState } from '../game/store';
import type { GameState } from '../game/types';

const canonical = FINAL_DIALOGUE_PRESENTATION_PLANS as unknown as Record<string, FinalDialoguePresentationPlan>;
const runtime = FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS as unknown as Record<string, Record<string, FinalDialoguePresentationPlan>>;

/** `actor@position/facing/group/side>lookTarget`, left to right. */
function placement(segment: FinalDialoguePresentationSegment): string[] {
  return segment.actors.map((actor) => `${actor.actorId}@${actor.screenPosition}/${actor.facing}/${actor.group}/${actor.dramaticSide}>${actor.lookTarget}`);
}

/** `step:speaker>addressee/facing`, in line order. */
function directions(segment: FinalDialoguePresentationSegment): string[] {
  return segment.stepDirections.map((direction) => `${direction.stepId}:${direction.speakerId}>${direction.addressedTo}/${direction.facing}`);
}

function played(dialogueId: string, flags: GameState['flags'] = {}): FinalDialoguePresentationSegment {
  const state = createInitialState();
  state.flags = { ...state.flags, ...flags };
  const sequence = resolveGameDialogue(dialogueId, state)!.sequence;
  return resolveFinalDialoguePresentationPlan(dialogueId, sequence)!.segments.find((segment) => segment.id === `${dialogueId}:segment-1`)!;
}

const VALIDATED = {
  villageRequest: {
    placement: [
      'marian@FAR_LEFT/RIGHT/PLAYER_COMPANY/LEFT>villageoise',
      'kestrel@CENTER_LEFT/RIGHT/PLAYER_COMPANY/LEFT>villageoise',
      'villageoise@CENTER/LEFT/LOCAL_CIVILIAN/CENTER>kestrel',
      'serpent_raider@RIGHT/LEFT/ANTAGONIST/RIGHT>kestrel',
    ],
    directions: ['1:villageoise>marian/LEFT', '1a:marian>villageoise/RIGHT', '2:serpent_raider>marian/LEFT', '2a:kestrel>serpent_raider/RIGHT'],
  },
  villageRequestWithCedric: {
    placement: [
      'marian@FAR_LEFT/RIGHT/PLAYER_COMPANY/LEFT>villageoise',
      'cedric@CENTER_LEFT/RIGHT/PLAYER_COMPANY/LEFT>villageoise',
      'villageoise@CENTER/LEFT/LOCAL_CIVILIAN/CENTER>cedric',
      'serpent_raider@RIGHT/LEFT/ANTAGONIST/RIGHT>cedric',
    ],
    directions: ['1:villageoise>marian/LEFT', '1a:marian>villageoise/RIGHT', '2:serpent_raider>marian/LEFT', '2a:cedric>serpent_raider/RIGHT'],
  },
  trollCrossing: {
    placement: [
      'sage_seraphine@FAR_LEFT/RIGHT/PLAYER_COMPANY/LEFT>forest_troll_elite',
      'maelor@CENTER_LEFT/RIGHT/PLAYER_COMPANY/LEFT>forest_troll_elite',
      'forest_troll_elite@RIGHT/LEFT/ANTAGONIST/RIGHT>maelor',
    ],
    directions: ['1:forest_troll_elite>sage_seraphine/LEFT', '2:sage_seraphine>forest_troll_elite/RIGHT', '3:maelor>sage_seraphine/LEFT'],
  },
  shrine: {
    placement: [
      'sage_seraphine@FAR_LEFT/RIGHT/PLAYER_COMPANY/LEFT>shrine_apparition',
      'maelor@CENTER_LEFT/RIGHT/PLAYER_COMPANY/LEFT>shrine_apparition',
      'shrine_apparition@RIGHT/LEFT/NEUTRAL/RIGHT>maelor',
    ],
    directions: ['1:shrine_apparition>sage_seraphine/LEFT', '2:sage_seraphine>shrine_apparition/RIGHT', '3:maelor>sage_seraphine/LEFT'],
  },
};

describe('the Lion segments restaged on the operator’s « Oui, corrige-les »', () => {
  it('names the same three segments in the generator', () => {
    expect(STAGING_CORRECTED_SEGMENTS).toEqual(['village_choice:segment-1', 'mystery_troll_crossing:segment-1', 'mystery_shrine:segment-1']);
  });

  it('shows the Bois-Clair request with the company left, the villager between and the raider alone on the right', () => {
    expect(placement(played('village_choice'))).toEqual(VALIDATED.villageRequest.placement);
    expect(directions(played('village_choice'))).toEqual(VALIDATED.villageRequest.directions);
  });

  it('moves Cédric to the left with the company when he speaks for it', () => {
    const segment = played('village_choice', { recruitedCedric: true });
    expect(placement(segment)).toEqual(VALIDATED.villageRequestWithCedric.placement);
    expect(directions(segment)).toEqual(VALIDATED.villageRequestWithCedric.directions);
    expect(segment.exits.map((exit) => `${exit.actorId}:${exit.effect}`)).toEqual(['marian:SLIDE_OUT_LEFT', 'serpent_raider:SLIDE_OUT_RIGHT', 'cedric:SLIDE_OUT_LEFT']);
  });

  it('shows the troll and the shrine’s apparition alone on the right, facing Séraphine and Maelor', () => {
    expect(placement(played('mystery_troll_crossing'))).toEqual(VALIDATED.trollCrossing.placement);
    expect(directions(played('mystery_troll_crossing'))).toEqual(VALIDATED.trollCrossing.directions);
    expect(placement(played('mystery_shrine'))).toEqual(VALIDATED.shrine.placement);
    expect(directions(played('mystery_shrine'))).toEqual(VALIDATED.shrine.directions);
  });

  it('is written in the lock itself, in every shape of the three dialogues', () => {
    const lockSegment = (plan: FinalDialoguePresentationPlan, id: string) => plan.segments.find((segment) => segment.id === id)!;
    expect(placement(lockSegment(canonical.village_choice!, 'village_choice:segment-1'))).toEqual(VALIDATED.villageRequest.placement);
    expect(placement(lockSegment(canonical.mystery_troll_crossing!, 'mystery_troll_crossing:segment-1'))).toEqual(VALIDATED.trollCrossing.placement);
    expect(placement(lockSegment(canonical.mystery_shrine!, 'mystery_shrine:segment-1'))).toEqual(VALIDATED.shrine.placement);
    const variants = Object.values(runtime.village_choice ?? {});
    expect(variants).toHaveLength(1);
    expect(placement(lockSegment(variants[0]!, 'village_choice:segment-1'))).toEqual(VALIDATED.villageRequestWithCedric.placement);
    expect(runtime.mystery_troll_crossing).toBeUndefined();
    expect(runtime.mystery_shrine).toBeUndefined();
  });

  it('is shown as the lock writes it, with no runtime correction', () => {
    for (const id of ['village_choice', 'mystery_troll_crossing', 'mystery_shrine']) {
      expect(resolveFinalDialoguePresentationPlan(id)).toBe(canonical[id]);
    }
  });

  it('marks only these segments as corrected in the lock', () => {
    const marked = [...Object.values(canonical), ...Object.values(runtime).flatMap((byShape) => Object.values(byShape))]
      .flatMap((plan) => plan.segments)
      .filter((segment) => segment.rationale.includes('Corrected (operator, 2026-11-13)'))
      .map((segment) => segment.id);
    expect([...new Set(marked)].sort()).toEqual([...STAGING_CORRECTED_SEGMENTS].sort());
  });
});
