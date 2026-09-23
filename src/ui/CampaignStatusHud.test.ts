// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { CampaignStatusHud, selectCampaignStatus } from './CampaignStatusHud';

afterEach(() => document.body.replaceChildren());
it('reads secured and route resources separately and refreshes without mutating state', () => {
  const state = createInitialState();
  state.gold = 150; state.inventory.materials.red_gem = 2;
  state.run.temporaryLoot.gold = 40; state.run.temporaryLoot.inventory.materials.red_gem = 1;
  state.reputation = 56;
  const before = structuredClone(state);
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  hud.show(document.body);
  expect(selectCampaignStatus(state)).toEqual({ gold: 150, routeGold: 40,
    reputation: 56, reputationLabel: 'Neutre' });
  expect(hud.element.textContent).toContain('+40 route');
  expect(hud.element.textContent).not.toContain('Gemmes');
  expect(hud.element.textContent).not.toContain('+1 route');
  expect(hud.element.querySelectorAll('.campaign-status-hud__item')).toHaveLength(2);
  expect(hud.element.querySelector('.campaign-status-hud__crest')).toBeNull();
  expect(hud.element.children).toHaveLength(1);
  expect(state).toEqual(before);
  state.reputation = 38; state.gold = 151; state.run.temporaryLoot.gold = 0;
  hud.refresh();
  expect(hud.element.textContent).toContain('38 · Méfiant');
  expect(hud.element.textContent).toContain('151');
  expect(hud.element.textContent).not.toContain('+0 route');
});

it('moves the one HUD through surfaces and ignores stale cleanup', () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const journey = document.createElement('section'), road = document.createElement('section');
  document.body.append(journey, road);
  hud.show(journey); hud.show(road, 'traversal'); hud.hide(journey);
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  expect(road.contains(hud.element)).toBe(true);
  hud.show(journey); hud.hide(road);
  expect(journey.contains(hud.element)).toBe(true);
  hud.hide(journey);
  expect(document.querySelector('.campaign-status-hud')).toBeNull();
});
