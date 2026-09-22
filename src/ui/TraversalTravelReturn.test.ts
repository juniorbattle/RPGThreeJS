// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { createInitialState } from '../game/store';
import { bypassTraversalNode, selectTraversalBranch, enterRunNode } from '../game/runSystem';
import { TravelView } from './TravelView';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.useRealTimers(); });

it.each(['lion-first-trial-event', 'lion-first-trial-combat'])('offers Refuge in TravelView after the chosen %s is entered', async branch => {
  vi.useFakeTimers();
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-opening-ambush';
  bypassTraversalNode(state.run, 'T0', 'lion-nomad-crossroads');
  bypassTraversalNode(state.run, 'T0', 'lion-refugees');
  selectTraversalBranch(state.run, 'T0', branch);
  expect(bypassTraversalNode(state.run, 'T0', branch)).toBe(false);
  expect(enterRunNode(state.run, branch)?.id).toBe(branch);
  state.currentNodeId = branch;
  const choose = vi.fn(async () => undefined);
  const view = new TravelView({ root: document.body, getState: () => state,
    onSelect: choose, onOpenClan: vi.fn(), onOpenMenu: vi.fn(), onSave: vi.fn() });
  expect(() => view.open()).not.toThrow();
  const button = document.querySelector<HTMLButtonElement>('[data-node="lion-first-refuge"]');
  expect(button).not.toBeNull();
  expect(choose).not.toHaveBeenCalled();
  expect(state.run.visitedNodeIds).toContain(branch);
  button!.click();
  await vi.advanceTimersByTimeAsync(420);
  expect(choose).toHaveBeenCalledWith(expect.objectContaining({ id: 'lion-first-refuge' }));
  view.close();
});
