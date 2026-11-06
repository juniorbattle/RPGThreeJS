import { expect, it } from 'vitest';
import { CAMPAIGN_GRAMMAR_PRESENTATIONS, CLAN_ANCHOR_DIALOGUES } from '../game/campaignGrammarContent';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import { createGenericNarrativeTableau } from '../cinematics/NarrativeTableau';
import { demoEnvironmentPlateForContext } from '../render/demoEnvironmentPack';
import { resolveFinalRefugeServicesPresentation, resolveRefugePresentation } from './RefugePresentation';

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

it('keeps the final story refuge out of the refuge-node hubs regardless of its label', () => {
  const final = node('lion-final-refuge');
  expect(final.type).toBe('story');
  expect(resolveRefugePresentation(final)).toBeNull();
});

it('lends the existing refuge services to the final story refuge on its own plate, label and hint (set 1.15.0)', () => {
  const final = node('lion-final-refuge');
  const presentation = resolveFinalRefugeServicesPresentation(final)!;
  expect(final.type).toBe('story');
  expect(presentation).toMatchObject({
    nodeId: 'lion-final-refuge', title: final.label, description: final.hint,
    visualFamily: 'FINAL_REFUGE', environmentContext: 'node:lion-final-refuge', securesLoot: false,
  });
  expect(presentation.gatheringDialogueId).toBeUndefined();
  expect(presentation.background).toBe('/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/final-refuge-tableau.png');
  expect(presentation.background).toBe(demoEnvironmentPlateForContext('dialogue:final_refuge', 'STATIC_TABLEAU').publicUrl);
  expect(resolveFinalRefugeServicesPresentation(node('lion-second-refuge'))).toBeNull();
  expect(resolveRefugePresentation(node('lion-first-refuge'))!.securesLoot).toBe(true);
});
