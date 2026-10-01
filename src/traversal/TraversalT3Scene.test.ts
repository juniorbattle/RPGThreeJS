// @vitest-environment happy-dom
import fs from 'node:fs';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { addTemporaryLoot, createRunState, enterRunNode, getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { combatConfigs } from '../game/content';
import { TraversalT3Scene } from './TraversalT3Scene';
import { createT3RoadAuthoring } from './TraversalT3Authoring';
import { resolveT3RouteSegment } from './TraversalT3CheckpointRoute';
import { auditTraversalRouteAuthoring } from './TraversalCheckpointRoute';
import { hasAuthoredTraversalPresentation } from './TraversalPresentation';
import { isTraversalProductionEnabledForLeg } from './TraversalFeaturePolicy';
import { resolveTraversalT3World, TRAVERSAL_T3_WORLD_ASSETS } from './TraversalT3World';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T3')!;

describe('T3 candidate authoring', () => {
  it.each([
    ['mystery_dragon_roost', 'young_dragon_elite', TRAVERSAL_T3_WORLD_ASSETS.dragon],
    ['mystery_shrine', 'shrine_apparition', TRAVERSAL_T3_WORLD_ASSETS.ruins],
    ['serpent_informant', 'serpent_oracle', TRAVERSAL_T3_WORLD_ASSETS.ruins],
    ['mystery_lancer_recruit', 'lancer', TRAVERSAL_T3_WORLD_ASSETS.witnesses],
  ])('keeps owner-assigned %s actor/world coherent, including legacy saves', (contentId, actor, asset) => {
    const state = createInitialState();
    const authored = createT3RoadAuthoring(() => state);
    state.run.currentNodeId = state.currentNodeId = 'lion-witnesses';
    state.mysteryAssignments['lion-final-trial-event'] = contentId!;
    const route = authored.resolveRoute(leg, state);
    expect(route.beats.find(beat => beat.branchNodeId === 'lion-final-trial-event')?.characterId).toBe(actor);
    expect(route.beats.find(beat => beat.campaignNodeIds[0] === 'lion-witnesses')?.characterId).toBe('survivor');
    const before = structuredClone(state);
    expect(authored.world.resolveWorld('lion-final-trial-event').find(section => section.id === 't3-selected-route')?.asset).toBe(asset);
    expect(state).toEqual(before);
    expect(state.run.visitedNodeIds).not.toContain('lion-final-trial-event');
  });

  it('rejects unknown selected content but accepts the renderer pre-fork sentinel', () => {
    expect(resolveTraversalT3World('main')).toHaveLength(8);
    expect(() => resolveTraversalT3World('lion-final-trial-event', 'invented')).toThrow('Unknown canonical');
    expect(() => resolveTraversalT3World('lion-first-trial-event', 'mystery_dragon_roost')).toThrow('Unknown canonical');
  });

  it('has byte-verified side-on checkpoint media and retains its source references', () => {
    const manifest = JSON.parse(fs.readFileSync('public/assets/generated/lion-phase/traversal/t3/asset-manifest.json', 'utf8'));
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
    const route = createT3RoadAuthoring(() => state).resolveRoute(leg, state);
    expect(auditTraversalRouteAuthoring(leg, route, createT3RoadAuthoring(() => state).routeSegments,
      new Set(createT3RoadAuthoring(() => state).world.checkpointSections.map(section => section.id)))).toEqual([]);
    expect(route.beats.filter(beat => !beat.branchNodeId).map(beat => beat.campaignNodeIds)).toEqual(leg.stages.map(stage => stage.nodeIds));
    expect(route.beats.filter(beat => beat.type !== 'fork').every(beat => beat.characterId && beat.visualAsset)).toBe(true);
    expect(() => resolveT3RouteSegment(3)).toThrow('canonical RunSystem');
    expect(() => resolveT3RouteSegment(3, 'lion-first-trial-event')).toThrow('canonical RunSystem');
    expect(hasAuthoredTraversalPresentation('T3')).toBe(false);
    expect(isTraversalProductionEnabledForLeg('T3')).toBe(false);
  });

  it.each(['ruins_guardians', 'serpent_hunters'])(
    'presents the persisted adaptive combat assignment %s at the fork', contentId => {
      const state = createInitialState();
      state.run.currentNodeId = state.currentNodeId = 'lion-witnesses';
      state.mysteryAssignments['lion-final-trial-combat'] = contentId;
      const beat = createT3RoadAuthoring(() => state).resolveRoute(leg, state).beats
        .find(candidate => candidate.branchNodeId === 'lion-final-trial-combat')!;
      expect(beat.formation).toEqual(combatConfigs.get(contentId)!.enemyVisualIds);
      expect(beat.characterId).toBe(combatConfigs.get(contentId)!.enemyVisualIds![0]);
      expect(state.mysteryAssignments['lion-final-trial-combat']).toBe(contentId);
      expect(state.run.visitedNodeIds).not.toContain('lion-final-trial-combat');
    });

  it.each(['lion-final-trial-event', 'lion-final-trial-combat'])(
    'completes real T3 node/branch/loot handoffs through %s without entering Shadow Ruins', async branch => {
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
      const state = createInitialState(); state.run.currentNodeId = state.currentNodeId = leg.originNodeId;
      const handoffs: string[] = [];
      const collected: string[] = [];
      const securedGold = state.gold;
      const arrival = vi.fn();
      const scene = new TraversalT3Scene({ root: document.body, leg, getState: () => state,
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
          expect(state.run.traversalBranches?.T3).toBeUndefined();
        }
      }
      expect(handoffs).toEqual(['lion-lancer-recruit', 'lion-witnesses', branch]);
      expect(roads).toEqual(new Set(['t3-route-1', 't3-route-2', 't3-route-3',
        branch.endsWith('event') ? 't3-route-4a' : 't3-route-4b', 't3-route-5']));
      expect(arrival).toHaveBeenCalledExactlyOnceWith('lion-shadow-signs');
      expect(state.run.currentNodeId).toBe(branch); expect(state.run.visitedNodeIds).not.toContain('lion-shadow-signs');
      expect(state.gold).toBe(securedGold);
      expect(collected.length).toBeGreaterThan(0); expect(state.run.temporaryLoot.gold).toBe(collected.length * 5);
      const before = structuredClone(state); scene.completeArrival(); expect(state).toEqual(before);
      expect(scene.session.phase).toBe('COMPLETE'); scene.dispose();
    }, 30000);
});
