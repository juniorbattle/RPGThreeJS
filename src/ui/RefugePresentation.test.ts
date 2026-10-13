import { expect, it } from 'vitest';
import { CAMPAIGN_GRAMMAR_PRESENTATIONS, CLAN_ANCHOR_DIALOGUES } from '../game/campaignGrammarContent';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import { createGenericNarrativeTableau } from '../cinematics/NarrativeTableau';
import { demoEnvironmentPlateForContext } from '../render/demoEnvironmentPack';
import { resolveRefugePresentation } from './RefugePresentation';

const node = (id: string) => createInitialState().run.graph.nodes.find(candidate => candidate.id === id)!;

it('gives first and second interactive refuges their own canonical identity and environment', () => {
  const first = resolveRefugePresentation(node('lion-first-refuge'))!;
  const second = resolveRefugePresentation(node('lion-second-refuge'))!;
  expect(first).toMatchObject({ nodeId: 'lion-first-refuge', title: 'Refuge du Lion',
    visualFamily: 'FIRST_REFUGE', gatheringDialogueId: 'first_refuge_gathering' });
  expect(second).toMatchObject({ nodeId: 'lion-second-refuge', title: 'Dernier feu du Lion',
    visualFamily: 'SECOND_REFUGE' });
  expect(second.gatheringDialogueId).toBeUndefined();
  expect(second.background).not.toBe(first.background);
  expect(first.background).toBe(demoEnvironmentPlateForContext('dialogue:first_refuge_gathering', 'STATIC_TABLEAU').publicUrl);
  expect(second.background).toBe(demoEnvironmentPlateForContext('node:lion-second-refuge', 'HOLD_SOURCE').publicUrl);
});

it('uses the exact same clean first-refuge plate for gathering and hub without changing other first-refuge beats', () => {
  const first = resolveRefugePresentation(node('lion-first-refuge'))!;
  const gathering = createGenericNarrativeTableau(dialogues.get('first_refuge_gathering')!);
  expect(CLAN_ANCHOR_DIALOGUES[first.nodeId]).toBe('first_refuge_gathering');
  expect(CAMPAIGN_GRAMMAR_PRESENTATIONS.first_refuge_gathering?.environmentContext).toBe(first.environmentContext);
  expect(gathering.tableauBackgroundId).toBe('first_refuge_gathering_environment');
  expect(gathering.stillImage).toBe(first.background);
  expect(first.background).toBe('/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/first-refuge-tableau.png');
  expect(demoEnvironmentPlateForContext('dialogue:ate_first_refuge_watch', 'STATIC_TABLEAU').assetId).toBe('first_refuge_tableau');
});

it('excludes the final story refuge regardless of its label', () => {
  const final = node('lion-final-refuge');
  expect(final.type).toBe('story');
  expect(resolveRefugePresentation(final)).toBeNull();
});
