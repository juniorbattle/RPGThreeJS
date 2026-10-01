// @vitest-environment happy-dom
import fs from 'node:fs';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { addTemporaryLoot, createRunState, enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { combatConfigs } from '../game/content';
import { TraversalT1Scene } from './TraversalT1Scene';
import { T1_ROAD_AUTHORING } from './TraversalT1Authoring';
import { resolveT1RouteSegment } from './TraversalT1CheckpointRoute';
import { auditTraversalRouteAuthoring } from './TraversalCheckpointRoute';
import { hasAuthoredTraversalPresentation } from './TraversalPresentation';
import { isTraversalProductionEnabledForLeg } from './TraversalFeaturePolicy';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T1')!;

describe('T1 production authoring', () => {
  it('has byte-verified side-on checkpoint media and retains its source references', () => {
    const manifest = JSON.parse(fs.readFileSync('public/assets/generated/lion-phase/traversal/t1/asset-manifest.json', 'utf8'));
    for (const asset of manifest.assets) {
      const bytes = fs.readFileSync(`public${asset.path}`);
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1536, 1024]);
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.laneGroundingPercent).toEqual([65, 81]);
    }
    for (const reference of manifest.references) {
      expect(crypto.createHash('sha256').update(fs.readFileSync(reference.path)).digest('hex')).toBe(reference.sha256);
    }
  });

  it.each([42, 43])('matches existing stages and seeded combat actors for seed %s', seed => {
    const state = createInitialState(); state.run = createRunState(seed);
    const route = T1_ROAD_AUTHORING.resolveRoute(leg, state);
    expect(auditTraversalRouteAuthoring(leg, route, T1_ROAD_AUTHORING.routeSegments,
      new Set(T1_ROAD_AUTHORING.world.checkpointSections.map(section => section.id)))).toEqual([]);
    expect(route.beats.filter(beat => !beat.branchNodeId).map(beat => beat.campaignNodeIds)).toEqual(leg.stages.map(stage => stage.nodeIds));
    expect(route.beats.filter(beat => beat.type !== 'fork').every(beat => beat.characterId && beat.visualAsset)).toBe(true);
    expect(() => resolveT1RouteSegment(3)).toThrow('canonical RunSystem');
    expect(() => resolveT1RouteSegment(3, 'lion-first-trial-event')).toThrow('canonical RunSystem');
    expect(hasAuthoredTraversalPresentation('T1')).toBe(true);
    expect(isTraversalProductionEnabledForLeg('T1')).toBe(true);
  });

  it.each(['troll_crossing', 'serpent_checkpoint', 'serpent_duelist_trial'])(
    'presents the persisted adaptive combat assignment %s at the fork', contentId => {
      const state = createInitialState();
      state.run.currentNodeId = state.currentNodeId = 'lion-valmir-road';
      state.mysteryAssignments['lion-second-trial-combat'] = contentId;
      const beat = T1_ROAD_AUTHORING.resolveRoute(leg, state).beats
        .find(candidate => candidate.branchNodeId === 'lion-second-trial-combat')!;
      expect(beat.formation).toEqual(combatConfigs.get(contentId)!.enemyVisualIds);
      expect(beat.characterId).toBe(combatConfigs.get(contentId)!.enemyVisualIds![0]);
      expect(state.mysteryAssignments['lion-second-trial-combat']).toBe(contentId);
      expect(state.run.visitedNodeIds).not.toContain('lion-second-trial-combat');
    });

  it.each(['lion-second-trial-event', 'lion-second-trial-combat'])(
    'completes real T1 node/branch/loot handoffs through %s without entering Bois-Clair', async branch => {
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
      const state = createInitialState(); state.run.currentNodeId = state.currentNodeId = leg.originNodeId;
      const handoffs: string[] = [];
      const collected: string[] = [];
      const securedGold = state.gold;
      const arrival = vi.fn();
      const scene = new TraversalT1Scene({ root: document.body, leg, getState: () => state,
        getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: node => {
          expect(enterRunNode(state.run, node.id)?.id).toBe(node.id);
          handoffs.push(node.id); scene.beginNodeResolution(node.id); scene.resumeNode(node.id);
        }, onRouteRewardPickup: reward => {
          expect(collected).not.toContain(reward.id); collected.push(reward.id);
          addTemporaryLoot(state.run, { gold: reward.gold }); return true;
        }, onArrival: arrival, onMenu: vi.fn() });
      const clock = scene as unknown as { advance(n: number): void; advanceTransition(n: number): void; advanceArrival(n: number): void };
      const settle = async () => { clock.advanceTransition(1); await Promise.resolve(); await Promise.resolve(); clock.advanceTransition(1); };
      scene.open(); await settle();
      const roads = new Set<string>();
      let chosen = false;
      for (let frame = 0; frame < 1100 && !arrival.mock.calls.length; frame++) {
        await settle();
        if (scene.element.dataset.view === 'route') roads.add(scene.element.dataset.routeSegment!);
        if (scene.session.phase === 'ARRIVING') clock.advanceArrival(.1); else clock.advance(.1);
        if (scene.session.phase === 'FORK_OVERLAY' && !chosen) {
          chosen = true;
          scene.element.querySelector<HTMLButtonElement>(`[data-traversal-fork-choice="${branch}"]`)!.click();
          expect(state.run.traversalBranches?.T1).toBeUndefined();
        }
      }
      expect(handoffs).toEqual(['lion-reserve-trail', 'lion-valmir-road', branch]);
      expect(roads).toEqual(new Set(['t1-route-1', 't1-route-2', 't1-route-3',
        branch.endsWith('event') ? 't1-route-4a' : 't1-route-4b', 't1-route-5']));
      expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-village-choice');
      expect(state.run.currentNodeId).toBe(branch); expect(state.run.visitedNodeIds).not.toContain('lion-village-choice');
      expect(state.gold).toBe(securedGold);
      expect(collected.length).toBeGreaterThan(0); expect(state.run.temporaryLoot.gold).toBe(collected.length * 5);
      const before = structuredClone(state); scene.completeArrival(); expect(state).toEqual(before);
      expect(scene.session.phase).toBe('COMPLETE'); scene.dispose();
    }, 30000);
});
