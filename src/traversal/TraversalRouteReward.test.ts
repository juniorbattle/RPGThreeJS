// @vitest-environment happy-dom
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addTemporaryLoot } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { CampaignStatusHud, selectCampaignStatus } from '../ui/CampaignStatusHud';
import { advanceRouteRun, createRouteRun, forecastRouteDistance, resetRouteSpeed } from './TraversalRouteRun';
import { createRouteReward, resolveRouteReward } from './TraversalRouteReward';
import { ROUTE_REWARD_POUCH, TraversalRouteRewardRenderer } from './TraversalRouteRewardRenderer';
import { createRouteRisk, resolveRouteRisk } from './TraversalRouteRisk';
import { resolveT0RouteSegment } from './TraversalT0CheckpointRoute';
import { T0_ROUTE_HAZARDS, t0RouteHazards } from './TraversalT0Risk';
import { T0_ROUTE_PICKUPS, t0RoutePickups } from './TraversalT0Reward';

describe('T0 Route Reward', () => {
  it('uses the single approved RGBA pouch asset registered in the T0 manifest', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(),
      'public/assets/generated/lion-phase/traversal/t0/asset-manifest.json'), 'utf8')) as {
        assets: { path: string; role: string; width: number; height: number; sha256: string }[];
      };
    const bytes = readFileSync(resolve(process.cwd(), 'public', ROUTE_REWARD_POUCH.slice(1)));
    const entry = manifest.assets.find(asset => asset.path === ROUTE_REWARD_POUCH);
    expect(entry).toMatchObject({ role: 'reward', width: 512, height: 459,
      sha256: createHash('sha256').update(bytes).digest('hex') });
    expect(manifest.assets.filter(asset => asset.role === 'reward')).toHaveLength(1);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.readUInt32BE(16)).toBe(512);
    expect(bytes.readUInt32BE(20)).toBe(459);
    expect(bytes[25]).toBe(6); // PNG RGBA
    const renderer = new TraversalRouteRewardRenderer();
    for (const segment of ['route-1', 'route-2', 'route-3', 'route-4', 'route-5a', 'route-5b', 'route-6']) {
      const pickups = t0RoutePickups(segment);
      renderer.reset(pickups);
      const images = [...renderer.element.querySelectorAll<HTMLImageElement>('[data-reward-pickup] img')];
      expect(images).toHaveLength(pickups.length);
      expect(images.every(image => image.getAttribute('src') === ROUTE_REWARD_POUCH)).toBe(true);
    }
    expect(renderer.element.textContent).not.toContain('DEV');
  });

  it('authors stable lane pickups with equal branch value and safe hazard spacing', () => {
    const counts = { 'route-1': 1, 'route-2': 1, 'route-3': 2, 'route-4': 2,
      'route-5a': 2, 'route-5b': 2, 'route-6': 1 };
    expect(new Set(T0_ROUTE_PICKUPS.map(pickup => pickup.id)).size).toBe(T0_ROUTE_PICKUPS.length);
    expect(t0RoutePickups('route-1')).toEqual(t0RoutePickups('route-1'));
    for (const [segment, count] of Object.entries(counts)) {
      const pickups = t0RoutePickups(segment);
      expect(pickups).toHaveLength(count);
      expect(pickups.every(pickup => pickup.gold === 5 && [0, 1].includes(pickup.lane)
        && pickup.progress01 >= .15 && pickup.progress01 <= .88)).toBe(true);
      for (const pickup of pickups) {
        expect(pickup.id).toMatch(/^t0:r(?:[1-6]|5[ab]):reward-\d$/);
        expect(T0_ROUTE_HAZARDS.filter(hazard => hazard.segmentId === segment)
          .every(hazard => Math.abs(hazard.progress01 - pickup.progress01) >= .10 - 1e-9)).toBe(true);
      }
    }
    for (const branch of ['route-5a', 'route-5b']) {
      expect(T0_ROUTE_PICKUPS.filter(pickup => pickup.segmentId !== 'route-5a'
        && pickup.segmentId !== 'route-5b' || pickup.segmentId === branch)
        .reduce((sum, pickup) => sum + pickup.gold, 0)).toBe(45);
    }
    expect(t0RoutePickups('route-1')[0]?.progress01).toBe(.65);
    expect(t0RoutePickups('route-6')[0]?.progress01).toBe(.88);
  });

  it('collects or misses once at crossing without mutating prior state', () => {
    const pickup = t0RoutePickups('route-1')[0]!;
    const initial = createRouteReward('route-1');
    expect(resolveRouteReward(initial, [pickup], .6, .7, 1, false).state).toBe(initial);
    expect(resolveRouteReward(initial, [pickup], .6, .64, 1, true).outcomes).toEqual([]);
    expect(resolveRouteReward(initial, [pickup], .6, .7, 1, true).outcomes[0]?.result).toBe('COLLECTED');
    const collected = resolveRouteReward(initial, [pickup], .6, .7, 1, true);
    expect(collected.state).toMatchObject({ resolvedPickupIds: [pickup.id],
      collectedPickupIds: [pickup.id], collectedGold: 5 });
    expect(resolveRouteReward(collected.state, [pickup], .6, .8, 1, true).outcomes).toEqual([]);
    expect(initial).toMatchObject({ resolvedPickupIds: [], collectedPickupIds: [], collectedGold: 0 });
    const missed = resolveRouteReward(initial, [pickup], .6, .7, 0, true);
    expect(missed.outcomes[0]?.result).toBe('MISSED');
    expect(missed.state).toMatchObject({ resolvedPickupIds: [pickup.id],
      collectedPickupIds: [], collectedGold: 0 });
    expect(resolveRouteReward(initial, [pickup], .6, .7, 1, true).state).not.toBe(initial);
    expect(resolveRouteReward(createRouteReward('route-2'), [pickup], .6, .7, 1, true).outcomes).toEqual([]);
  });

  it('keeps Reward and Risk independent through collision and recovery', () => {
    const economy = createInitialState();
    const temporaryBefore = economy.run.temporaryLoot.gold;
    const segment = resolveT0RouteSegment(0);
    const before = advanceRouteRun(createRouteRun(segment, 0), segment, 4200);
    const after = advanceRouteRun(before, segment, 450);
    const risk = resolveRouteRisk(createRouteRisk(segment.id), t0RouteHazards(segment.id),
      before.progress01, after.progress01, 0, true);
    expect(risk.state.collisionCount).toBe(1);
    const slowed = resetRouteSpeed(after, segment);
    const prePickup = advanceRouteRun(slowed, segment, 2900);
    const postPickup = advanceRouteRun(prePickup, segment, 800);
    const reward = resolveRouteReward(createRouteReward(segment.id), t0RoutePickups(segment.id),
      prePickup.progress01, postPickup.progress01, 1, true);
    expect(reward.outcomes.map(outcome => outcome.result)).toEqual(['COLLECTED']);
    expect(postPickup.progress01).toBe(advanceRouteRun(after, segment, 3700).progress01);
    expect(postPickup.speedResetAtMs).toBe(after.elapsedMs);
    expect(risk.state.collisionCount).toBe(1);
    expect(economy.run.temporaryLoot.gold).toBe(temporaryBefore);
  });

  it('holds visible road contact across speed reset and clears at checkpoint', () => {
    const segment = resolveT0RouteSegment(0);
    const pickup = t0RoutePickups(segment.id)[0]!;
    const renderer = new TraversalRouteRewardRenderer();
    renderer.reset([pickup]);
    const initial = advanceRouteRun(createRouteRun(segment, 0), segment, 5500);
    const forecast = (progress: number) => forecastRouteDistance(initial, segment, progress);
    renderer.update([pickup], createRouteReward(segment.id), initial.progress01,
      initial.elapsedMs, segment.durationMs, 100, 1000, true, forecast);
    const mark = renderer.element.querySelector<HTMLElement>('[data-reward-pickup]')!;
    expect(mark.hidden).toBe(false);
    const stored = (renderer as unknown as { contactDistances: Map<string, number> }).contactDistances.get(pickup.id);
    const slowed = resetRouteSpeed(initial, segment);
    renderer.reforecastUnseen(100, 1000);
    expect((renderer as unknown as { contactDistances: Map<string, number> }).contactDistances.get(pickup.id)).toBe(stored);
    renderer.update([pickup], createRouteReward(segment.id), .55, 6600, segment.durationMs,
      200, 1000, true, progress => forecastRouteDistance(slowed, segment, progress));
    expect((renderer as unknown as { contactDistances: Map<string, number> }).contactDistances.get(pickup.id)).toBe(stored);
    renderer.collect(pickup, 7800);
    expect(mark.hidden).toBe(true);
    expect(renderer.element.querySelector('.traversal-route-reward__feedback')?.classList.contains('is-active')).toBe(true);
    renderer.update([pickup], createRouteReward(segment.id), .7, 8000, segment.durationMs,
      200, 1000, false, () => 0);
    expect(renderer.element.hidden).toBe(true);
    renderer.reset(t0RoutePickups('route-2'));
    expect(renderer.element.querySelector('[data-reward-pickup="t0:r1:reward-1"]')).toBeNull();
  });

  it('leaves economy with RunSystem and HUD, without persistent gold mutation', () => {
    const state = createInitialState();
    state.gold = 150;
    const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
    hud.show(document.body, 'traversal');
    const beforeGold = state.gold;
    const beforeTemporary = state.run.temporaryLoot.gold;
    addTemporaryLoot(state.run, { gold: 5 });
    hud.refresh();
    expect(state.gold).toBe(beforeGold);
    expect(state.run.temporaryLoot.gold).toBe(beforeTemporary + 5);
    expect(hud.element.textContent).toContain('+5 route');
    hud.hide();
    for (const name of ['TraversalRouteReward.ts', 'TraversalT0Reward.ts', 'TraversalRouteRewardRenderer.ts']) {
      const source = readFileSync(resolve(process.cwd(), 'src/traversal', name), 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*(?:game|campaign|save)[^'"]*['"]/i);
    }
  });
});
