// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('GameApp Route Reward authority', () => {
  it('accepts a T0 pickup through temporary loot and refreshes the shared HUD', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = new GameApp(root, document.createElement('canvas'));
    const authority = app as unknown as {
      state: { gold: number; run: { temporaryLoot: { gold: number }; visitedNodeIds: string[] };
        resolvedNodeIds: string[] };
      activeTraversal: { session: { legId: string; phase: string } } | null;
      statusHud: { show(owner: HTMLElement, layout: 'traversal'): void;
        refresh(): void; element: HTMLElement };
      acceptTraversalRouteReward(reward: { id: string; gold: number }): boolean;
    };
    const before = { gold: authority.state.gold, temporary: authority.state.run.temporaryLoot.gold,
      visited: [...authority.state.run.visitedNodeIds], resolved: [...authority.state.resolvedNodeIds] };
    authority.activeTraversal = { session: { legId: 'T0', phase: 'RUNNING' } };
    authority.statusHud.show(root, 'traversal');
    const refresh = vi.spyOn(authority.statusHud, 'refresh');
    expect(authority.acceptTraversalRouteReward({ id: 't0:r1:reward-1', gold: 5 })).toBe(true);
    expect(authority.state.run.temporaryLoot.gold).toBe(before.temporary + 5);
    expect(authority.state.gold).toBe(before.gold);
    expect(authority.state.run.visitedNodeIds).toEqual(before.visited);
    expect(authority.state.resolvedNodeIds).toEqual(before.resolved);
    expect(refresh).toHaveBeenCalledOnce();
    expect(authority.statusHud.element.textContent).toContain(`+${before.temporary + 5} route`);
    authority.activeTraversal = null;
    expect(authority.acceptTraversalRouteReward({ id: 't0:r1:reward-1', gold: 5 })).toBe(false);
    expect(authority.state.run.temporaryLoot.gold).toBe(before.temporary + 5);
    app.dispose();
  });
});
