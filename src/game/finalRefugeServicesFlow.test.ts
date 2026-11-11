// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { getFinalStats } from './catalog';
import { getRunNode } from './runSystem';
import { createInitialState } from './store';
import type { GameState, RunNode } from './types';
import { sceneTransition } from '../ui/SceneTransition';
import type { ExplorationView } from '../ui/ExplorationView';

afterEach(() => { document.body.replaceChildren(); localStorage.clear(); vi.restoreAllMocks(); });

type Owner = {
  state: GameState; exploration: ExplorationView; journeyUnavailable: boolean;
  enterCampaignPresentation(): Promise<void>; resolveRunNode(node: RunNode, initial: boolean): Promise<void>;
  openManagement(...args: unknown[]): Promise<void>; enterJourney(): Promise<void>; showPoiMap(focusId?: string): void;
  playDialogue(...args: unknown[]): Promise<void>; playPostNodeNarrative(...args: unknown[]): Promise<boolean>;
};

function fixture(actions: readonly string[] = ['continue']) {
  const root = document.createElement('div'); document.body.append(root);
  const app = new GameApp(root, document.createElement('canvas'));
  const owner = app as unknown as Owner;
  owner.state = createInitialState();
  const order: string[] = [];
  const opens: Array<{ presentation: any; securedGold: number; rest: any }> = [];
  const transition = vi.spyOn(sceneTransition, 'run').mockImplementation(async options => { await options.task(); return true; });
  vi.spyOn(owner.exploration, 'prepareBackground').mockResolvedValue({ backgroundUrl: '', backgroundReady: true, naturalWidth: 1, naturalHeight: 1 });
  vi.spyOn(owner.exploration, 'waitUntilSurfaceReady').mockResolvedValue();
  const open = vi.spyOn(owner.exploration, 'open').mockImplementation(async (presentation, _reputation, securedGold, rest) => {
    order.push('services');
    opens.push({ presentation, securedGold, rest: { ...rest } });
    return (actions[opens.length - 1] ?? 'continue') as never;
  });
  const management = vi.spyOn(owner, 'openManagement').mockResolvedValue();
  const preparation = vi.spyOn(owner, 'enterJourney').mockImplementation(async () => { order.push('preparation'); });
  const map = vi.spyOn(owner, 'showPoiMap').mockImplementation(() => { order.push('map'); });
  return { app, owner, order, opens, transition, open, management, preparation, map };
}

const placeAtFinalRefuge = (state: GameState, resolved = true) => {
  state.run.currentNodeId = state.currentNodeId = 'lion-final-refuge';
  if (resolved) state.resolvedNodeIds.push('lion-final-refuge');
};

it('opens the existing refuge services at the resolved final refuge, then the existing preparation, with no new saved fact (set 1.15.0)', async () => {
  const { app, owner, order, opens, transition, management, preparation, map } = fixture(['shop', 'rest', 'skills', 'continue']);
  const state = owner.state;
  placeAtFinalRefuge(state);
  state.gold = 200;
  state.clan.members[0]!.currentHealth = getFinalStats(state.clan.members[0]!).maxHealth - 10;
  const before = structuredClone(state);
  await owner.enterCampaignPresentation();
  // One curtain carries the halt in; the mocked preparation would bring its own.
  expect(transition).toHaveBeenCalledOnce();
  expect(transition.mock.calls[0]![0]).toMatchObject({ variant: 'travel', label: 'Refuge avant le Sceau' });
  expect(order).toEqual(['services', 'services', 'services', 'services', 'preparation']);
  expect(opens[0]!.presentation).toMatchObject({ nodeId: 'lion-final-refuge', visualFamily: 'FINAL_REFUGE', securesLoot: false,
    description: 'Rassembler le dossier complet avant de comparaître devant Alaric.' });
  expect(opens.map(entry => entry.securedGold)).toEqual([0, 0, 0, 0]);
  expect(opens[1]!.rest).toMatchObject({ cost: 15, woundedCount: 1, canRest: true });
  expect(opens[2]!.rest.message).toContain('15 or d&eacute;pens&eacute;');
  // The same owners as the two refuges: shared shop stock and forge, skills, paid rest.
  expect(management.mock.calls).toEqual([['shop', 'valmir', 'permanent', false], ['skills', undefined, 'temporary', false]]);
  expect(state.gold).toBe(185);
  expect(preparation).toHaveBeenCalledOnce();
  expect(map).not.toHaveBeenCalled();
  // Nothing secured, no checkpoint, flag, resolution or node change: only the rest the player paid for.
  expect(state.run.checkpointNodeId).toBe(before.run.checkpointNodeId);
  expect(state.run.temporaryLoot).toEqual(before.run.temporaryLoot);
  expect(state.flags).toEqual(before.flags);
  expect(state.resolvedNodeIds).toEqual(before.resolvedNodeIds);
  expect(state.shops).toEqual(before.shops);
  expect(getRunNode(state.run, 'lion-final-refuge')!.type).toBe('story');
  app.dispose();
});

it('plays the unchanged final refuge dialogue first, then the services, then the preparation', async () => {
  const { app, owner, order } = fixture();
  placeAtFinalRefuge(owner.state, false);
  vi.spyOn(owner, 'playDialogue').mockImplementation(async () => { order.push('dialogue'); });
  vi.spyOn(owner, 'playPostNodeNarrative').mockImplementation(async () => { order.push('post-node'); return false; });
  await owner.resolveRunNode(getRunNode(owner.state.run, 'lion-final-refuge')!, false);
  expect(order).toEqual(['dialogue', 'post-node', 'services', 'preparation']);
  expect(owner.state.resolvedNodeIds).toContain('lion-final-refuge');
  app.dispose();
});

it('reopens the services on each return before the judgement without replaying the dialogue', async () => {
  const { app, owner, order } = fixture();
  placeAtFinalRefuge(owner.state);
  const dialogue = vi.spyOn(owner, 'playDialogue').mockResolvedValue();
  await owner.resolveRunNode(getRunNode(owner.state.run, 'lion-final-refuge')!, false);
  await owner.enterCampaignPresentation();
  expect(dialogue).not.toHaveBeenCalled();
  expect(order).toEqual(['services', 'preparation', 'services', 'preparation']);
  app.dispose();
});

it('keeps the services closed once the judgement has begun', async () => {
  const { app, owner, order, open } = fixture();
  placeAtFinalRefuge(owner.state);
  owner.state.run.visitedNodeIds.push('lion-final-judgement');
  await owner.enterCampaignPresentation();
  expect(open).not.toHaveBeenCalled();
  expect(order).toEqual(['preparation']);
  app.dispose();
});

it('still offers the services when the Journey boundary is unavailable, then returns to the map', async () => {
  const { app, owner, order } = fixture();
  placeAtFinalRefuge(owner.state);
  owner.journeyUnavailable = true;
  await owner.enterCampaignPresentation();
  expect(order).toEqual(['services', 'map']);
  app.dispose();
});
