// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { POST_NODE_ATE } from './content';
import { getFinalStats } from './catalog';
import { createInitialState } from './store';
import { CampaignStatusHud, selectCampaignStatus } from '../ui/CampaignStatusHud';

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

it('keeps the same first refuge and route state through management and Rest; only Continue resolves it', async () => {
  const state = createInitialState();
  const node = state.run.graph.nodes.find(candidate => candidate.id === 'lion-first-refuge')!;
  state.run.currentNodeId = state.currentNodeId = node.id;
  state.run.temporaryLoot.gold = 25;
  state.gold = 100;
  state.clan.members[0]!.currentHealth = getFinalStats(state.clan.members[0]!).maxHealth - 10;
  const originalStep = state.stepCounter;
  const originalVisited = [...state.run.visitedNodeIds];
  const originalNode = state.run.currentNodeId;
  const actions = ['clan', 'shop', 'skills', 'rest', 'continue'] as const;
  const opens: Array<{ presentation: any; securedGold: number; rest: any; gold: number }> = [];
  const management = vi.fn(async () => {
    expect(state.resolvedNodeIds).not.toContain(node.id);
    expect(state.run.currentNodeId).toBe(originalNode);
    expect(state.stepCounter).toBe(originalStep);
  });
  const app = Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'RESULT', activeNarrativeStage: null,
    statusHud: new CampaignStatusHud(() => selectCampaignStatus(state)),
    playJourneyCinematic: vi.fn(async () => undefined),
    playDialogue: vi.fn(async () => undefined),
    exploration: { prepareBackground: vi.fn(async () => undefined), open: vi.fn(async (presentation: any, _reputation: string, securedGold: number, rest: any) => {
      expect(state.resolvedNodeIds).not.toContain(node.id);
      expect(state.run.currentNodeId).toBe(originalNode);
      expect(state.stepCounter).toBe(originalStep);
      opens.push({ presentation, securedGold, rest: { ...rest }, gold: state.gold });
      return actions[opens.length - 1];
    }) },
    openManagement: management,
    playPostNodeNarrative: vi.fn(async () => {
      expect(state.resolvedNodeIds).toContain(node.id);
      return false;
    }),
    enterCampaignPresentation: vi.fn(async () => undefined),
  });
  await app.resolveRunNode(node, false);
  expect(app.exploration.prepareBackground).toHaveBeenCalledExactlyOnceWith(
    '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/first-refuge-tableau.png',
  );
  expect(opens).toHaveLength(5);
  expect(opens.map(open => open.presentation)).toEqual(Array(5).fill(opens[0]!.presentation));
  expect(opens[0]!.presentation).toMatchObject({ nodeId: node.id, title: node.label,
    visualFamily: 'FIRST_REFUGE', environmentContext: 'dialogue:first_refuge_gathering' });
  expect(opens.map(open => open.securedGold)).toEqual([25, 0, 0, 0, 0]);
  expect(opens[0]!.rest).toMatchObject({ cost: 15, woundedCount: 1, canRest: true });
  expect(opens[4]!.rest).toMatchObject({ cost: 0, woundedCount: 0, canRest: false });
  expect(opens[4]!.rest.message).toContain('Repos effectu&eacute; : 15 or d&eacute;pens&eacute;.');
  expect(state.gold).toBe(110);
  expect(state.run.temporaryLoot.gold).toBe(0);
  expect(state.run.currentNodeId).toBe(originalNode);
  expect(state.run.visitedNodeIds).toEqual(originalVisited);
  expect(state.stepCounter).toBe(originalStep);
  expect(state.resolvedNodeIds.filter(id => id === node.id)).toHaveLength(1);
  expect(management.mock.calls).toEqual([
    ['clan', undefined, 'temporary', false],
    ['shop', 'valmir', 'permanent', false],
    ['skills', undefined, 'temporary', false],
  ]);
  expect(app.enterCampaignPresentation).toHaveBeenCalledOnce();
});

it('keeps the second refuge interactive without moving its post-node ATE before management', async () => {
  const state = createInitialState();
  const node = state.run.graph.nodes.find(candidate => candidate.id === 'lion-second-refuge')!;
  state.run.currentNodeId = state.currentNodeId = node.id;
  const order: string[] = [];
  const app = Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'RESULT', activeNarrativeStage: null,
    statusHud: new CampaignStatusHud(() => selectCampaignStatus(state)),
    playJourneyCinematic: vi.fn(async () => { order.push('arrival'); }),
    playDialogue: vi.fn(async () => { order.push('gathering'); }),
    exploration: { prepareBackground: vi.fn(async () => undefined), open: vi.fn(async (presentation: any) => {
      expect(presentation).toMatchObject({ nodeId: node.id, title: 'Dernier feu du Lion', visualFamily: 'SECOND_REFUGE' });
      order.push('hub');
      return order.filter(item => item === 'hub').length === 1 ? 'shop' : 'continue';
    }) },
    openManagement: vi.fn(async () => { order.push('management'); }),
    playPostNodeNarrative: vi.fn(async () => { order.push('post-node'); return false; }),
    enterCampaignPresentation: vi.fn(async () => undefined),
  });
  await app.resolveRunNode(node, false);
  expect(app.exploration.prepareBackground).toHaveBeenCalledExactlyOnceWith(
    '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/second-refuge-night-tableau.png',
  );
  expect(order).toEqual(['arrival', 'hub', 'management', 'hub', 'post-node']);
  expect(POST_NODE_ATE[node.id]).toContain('ate_bois_clair_night_watch');
  expect(app.playDialogue).not.toHaveBeenCalled();
  expect(state.resolvedNodeIds).toContain(node.id);
});

it('keeps lion-final-refuge story-only and never opens the refuge hub', async () => {
  const state = createInitialState();
  const node = state.run.graph.nodes.find(candidate => candidate.id === 'lion-final-refuge')!;
  const exploration = { open: vi.fn() };
  const app = Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'RESULT', pendingCombatId: null,
    exploration, playDialogue: vi.fn(async () => undefined),
    playPostNodeNarrative: vi.fn(async () => false),
    enterCampaignPresentation: vi.fn(async () => undefined),
  });
  expect(node.type).toBe('story');
  await app.resolveRunNode(node, false);
  expect(app.playDialogue).toHaveBeenCalledWith(node.contentId, node.label);
  expect(exploration.open).not.toHaveBeenCalled();
});
