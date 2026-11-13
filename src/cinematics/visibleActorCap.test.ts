// @vitest-environment happy-dom
/**
 * PRESENTATION_AND_MEDIA « Cast »: at most four visible narrative actors per composition. Every dialogue of the game, the
 * Lion's and the post-demo's (state-built scenes under several states, the combat forks' reopened scenes included), is
 * staged as GameApp stages it: its tableau, then its presentation plan. A refuge gathering adds company members around
 * its speakers only up to four, as GameApp does. The speaker's portrait in the dialogue card is interface, not an actor.
 */
import { describe, expect, it } from 'vitest';
import { POST_DEMO_REFUGE_GATHERINGS } from '../campaign/plateaux/postDemoRefuges';
import { dialogues } from '../game/content';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { builtPlateauScenes, POST_DEMO_DIALOGUES } from '../game/postDemoContent';
import { createInitialState } from '../game/store';
import type { DialogueSequence } from '../game/types';
import { applyFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { createGenericNarrativeTableau, resolveNarrativeDialogueTableau, type NarrativeTableauSpec } from './NarrativeTableau';

const CAP = 4;

function overCap(sequence: DialogueSequence, tableau: NarrativeTableauSpec): string[] {
  const staged = applyFinalDialoguePresentationPlan(sequence, tableau);
  return (staged.phases ?? []).filter((phase) => phase.staticCast.length > CAP)
    .map((phase) => `${sequence.id}:${phase.id} (${phase.staticCast.map((actor) => actor.actorId).join(', ')})`);
}

function states() {
  const fresh = createInitialState();
  const marked = createInitialState();
  for (const flag of ['bearConvoyEscortDefeated', 'dragonVillageRaidRepelled', 'scorpionScholarsDefeated', 'missionGreed', 'silencedWitnesses',
    'bearRavenPact', 'dragonWolfPact', 'scorpionPhoenixOath', 'serpentGeneralDefeated', 'bearMinersRescued', 'dragonVillageProtected']) {
    marked.flags[flag] = true;
  }
  return [fresh, marked];
}

describe('never more than four visible narrative actors in a composition', () => {
  it('holds for every Lion dialogue', () => {
    const state = createInitialState();
    const sequences = [...dialogues.keys()].map((id) => resolveGameDialogue(id, state)?.sequence).filter((sequence): sequence is DialogueSequence => Boolean(sequence));
    expect(sequences.length).toBeGreaterThan(50);
    expect(sequences.flatMap((sequence) => overCap(sequence, resolveNarrativeDialogueTableau(sequence.id, sequence)!))).toEqual([]);
  });

  it('holds for every post-demo dialogue, authored or built from the state', () => {
    const sequences = [...POST_DEMO_DIALOGUES.values(), ...(['bear', 'dragon', 'scorpion', 'finale'] as const).flatMap((chapter) => builtPlateauScenes(chapter, states()))];
    expect(sequences.length).toBeGreaterThan(100);
    expect(sequences.flatMap((sequence) => overCap(sequence, resolveNarrativeDialogueTableau(sequence.id, sequence)!))).toEqual([]);
  });

  it('holds for a refuge gathering joined by the company, as GameApp adds its members', () => {
    const company = ['alistair', 'white_mage', 'dark_mage', 'archer', 'rogue', 'lancer', 'paladin', 'red_mage'];
    const ids = Object.values(POST_DEMO_REFUGE_GATHERINGS).flatMap((byNode) => Object.values(byNode ?? {}));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const sequence = resolveGameDialogue(id, createInitialState())!.sequence;
      const speaking = new Set(sequence.steps.map((step) => step.actorId).filter(Boolean));
      const members = company.filter((member) => !speaking.has(member)).slice(0, Math.max(0, CAP - speaking.size));
      expect(overCap(sequence, createGenericNarrativeTableau(sequence, members)), id).toEqual([]);
    }
  });
});
