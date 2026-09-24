// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState } from './store';
import { dialogues, POST_NODE_ATE } from './content';
import { bypassTraversalNode, enterRunNode, getAvailableRunNodes, selectTraversalBranch } from './runSystem';
import { resolveTraversalIgnoreConsequence } from './TraversalOptionalConsequencePolicy';
import { CampaignStatusHud, selectCampaignStatus } from '../ui/CampaignStatusHud';
import { createGenericNarrativeTableau } from '../cinematics/NarrativeTableau';
import { resolveCharacterVisualProfile } from '../render/CharacterVisualRegistry';
import { sceneTransition } from '../ui/SceneTransition';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

function ignoreHarness() {
  const state = createInitialState();
  state.run.currentNodeId = 'lion-nomad-crossroads';
  const statusHud = new CampaignStatusHud(() => selectCampaignStatus(state));
  statusHud.show(document.body);
  const app = Object.assign(Object.create(GameApp.prototype), { state, statusHud,
    activeTraversal: { session: { legId: 'T0', phase: 'RUNNING' }, route: { beats: [
      { campaignNodeIds: ['lion-nomad-crossroads'] }, { campaignNodeIds: ['lion-refugees'] },
      { campaignNodeIds: ['lion-first-trial-event'] },
    ] } }, saves: { saveAuto: vi.fn() },
  });
  return { app, state, statusHud };
}

it('applies refugee ignore only after accepted bypass, once, without visits, resolution or saves', () => {
  const { app, state, statusHud } = ignoreHarness();
  expect(app.ignoreTraversalOptionalNode('lion-nomad-crossroads')).toEqual({ accepted: false });
  const before = state.reputation;
  expect(app.ignoreTraversalOptionalNode('lion-refugees')).toEqual({ accepted: true, feedback: 'Réputation -2' });
  expect(app.ignoreTraversalOptionalNode('lion-refugees')).toEqual({ accepted: false });
  expect(state.reputation).toBe(before - 2);
  expect(state.flags.ignoredRefugees).toBe(true);
  expect(state.run.visitedNodeIds).not.toContain('lion-refugees');
  expect(state.resolvedNodeIds).not.toContain('lion-refugees');
  expect(state.run.bypassedRouteNodeIds?.filter(id => id === 'lion-refugees')).toHaveLength(1);
  expect(statusHud.element.textContent).toContain(String(before - 2));
  expect(app.saves.saveAuto).not.toHaveBeenCalled();
});

it.each(['mystery_help', 'mystery_treasure'])('uses actual adaptive content %s for bypass semantics', contentId => {
  const { app, state } = ignoreHarness();
  bypassTraversalNode(state.run, 'T0', 'lion-nomad-crossroads');
  bypassTraversalNode(state.run, 'T0', 'lion-refugees');
  state.mysteryAssignments['lion-first-trial-event'] = contentId;
  expect(selectTraversalBranch(state.run, 'T0', 'lion-first-trial-event')).toBe(true);
  const before = state.reputation;
  expect(app.ignoreTraversalOptionalNode('lion-first-trial-event').accepted).toBe(true);
  expect(app.ignoreTraversalOptionalNode('lion-first-trial-event').accepted).toBe(false);
  expect(state.reputation).toBe(before - (contentId === 'mystery_help' ? 2 : 0));
  expect(Boolean(state.flags.abandonedMerchant)).toBe(contentId === 'mystery_help');
  expect(state.run.visitedNodeIds).not.toContain('lion-first-trial-event');
});

it.each(['lion-refugees', 'lion-first-trial-event'])('entered %s keeps dialogue effects as sole authority', nodeId => {
  const { app, state } = ignoreHarness();
  bypassTraversalNode(state.run, 'T0', 'lion-nomad-crossroads');
  if (nodeId === 'lion-first-trial-event') {
    bypassTraversalNode(state.run, 'T0', 'lion-refugees');
    selectTraversalBranch(state.run, 'T0', nodeId);
  }
  enterRunNode(state.run, nodeId);
  const before = structuredClone(state);
  expect(app.ignoreTraversalOptionalNode(nodeId)).toEqual({ accepted: false });
  expect(state).toEqual(before);
  expect(dialogues.get('mystery_help')!.steps[0]!.choices![1]!.effects).toEqual([
    { type: 'addReputation', amount: -2 }, { type: 'setFlag', key: 'abandonedMerchant', value: true },
  ]);
});

it('applies the existing wounded-merchant abandonment choice once with no extra ignore effect', async () => {
  const { app, state } = ignoreHarness();
  state.run.visitedNodeIds.push('lion-first-trial-event');
  const before = state.reputation;
  await app.applyEffects(dialogues.get('mystery_help')!.steps[0]!.choices![1]!.effects);
  expect(app.ignoreTraversalOptionalNode('lion-first-trial-event')).toEqual({ accepted: false });
  expect(state.reputation).toBe(before - 2);
  expect(state.flags.abandonedMerchant).toBe(true);
  expect(app.saves.saveAuto).not.toHaveBeenCalled();
});

it.each(['mystery_recruit', 'roadside_peddler', 'wolf_pack', 'chest', 'gold', 'ward', 'obstacle', 'mystery_treasure'])(
  'does not infer a penalty for %s', contentId => {
    expect(resolveTraversalIgnoreConsequence('T0', { id: contentId, contentId })).toBeNull();
  },
);

it('secures loot, stages actual clan, gathers once, then opens management and preserves later ATE', async () => {
  const state = createInitialState();
  state.run.temporaryLoot.gold = 40;
  state.run.temporaryLoot.inventory.materials.red_gem = 2;
  const gold = state.gold, gems = state.inventory.materials.red_gem ?? 0;
  const order: string[] = [];
  const app = Object.assign(Object.create(GameApp.prototype), { state, mode: 'RESULT',
    activeNarrativeStage: null, statusHud: new CampaignStatusHud(() => selectCampaignStatus(state)),
    playJourneyCinematic: vi.fn(async (id: string) => { order.push(id); }),
    playDialogue: vi.fn(async (id: string, _label: string, options: any) => {
      order.push(id);
      expect(state.gold).toBe(gold + 40);
      expect(state.inventory.materials.red_gem).toBe(gems + 2);
      expect(state.run.temporaryLoot.gold).toBe(0);
      const cast = options.tableau.phases[0].staticCast.map((actor: any) => actor.actorId);
      for (const member of state.clan.members) expect(cast).toContain(resolveCharacterVisualProfile(member.definitionId)!.unitId);
      expect(options.tableau.tableauBackgroundId).toBe('clan_anchor_environment');
    }),
    exploration: { open: vi.fn(async () => { order.push('management'); return 'continue'; }) },
    playPostNodeNarrative: vi.fn(async () => { order.push('later-narrative'); return false; }),
    enterCampaignPresentation: vi.fn(async () => undefined),
  });
  const refuge = state.run.graph.nodes.find(node => node.id === 'lion-first-refuge')!;
  await app.resolveRunNode(refuge, false);
  expect(order).toEqual(['first_refuge_arrival', 'first_refuge_gathering', 'management', 'later-narrative']);
  await app.resolveRunNode(refuge, false);
  expect(app.playDialogue).toHaveBeenCalledOnce();
  expect(state.gold).toBe(gold + 40);
  expect(POST_NODE_ATE['lion-first-refuge']).toContain('ate_first_refuge_watch');
});

it('borrows a covered local dialogue and returns the same road without campaign mutation or save', async () => {
  const state = createInitialState(), before = structuredClone(state);
  const traversal = { session: { phase: 'LOCAL_INTERACTION', pendingBeatId: 't0:npc:roadside-merchant' } };
  const order: string[] = [];
  vi.spyOn(sceneTransition, 'run').mockImplementation(async options => { order.push('cover'); await options.task(); });
  const app = Object.assign(Object.create(GameApp.prototype), { state, activeTraversal: traversal,
    playDialogue: vi.fn(async (id: string) => {
      order.push(id);
      const sequence = dialogues.get(id)!;
      expect(sequence.steps).toHaveLength(3);
      expect(sequence.steps.some(step => step.actorId === 'wounded_merchant')).toBe(false);
      expect(createGenericNarrativeTableau(sequence).stillImage).toBeTruthy();
    }),
    activeNarrativeStage: null, saves: { saveAuto: vi.fn() },
  });
  await app.playTraversalLocalNarrative('t0:npc:roadside-merchant');
  expect(order).toEqual(['cover', 'roadside_peddler', 'cover']);
  expect(app.activeTraversal).toBe(traversal);
  expect(state).toEqual(before);
  expect(app.saves.saveAuto).not.toHaveBeenCalled();
});
