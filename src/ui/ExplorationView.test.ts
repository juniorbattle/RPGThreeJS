// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { CampaignStatusHud, selectCampaignStatus } from './CampaignStatusHud';
import { ExplorationView } from './ExplorationView';
import type { RefugePresentation } from './RefugePresentation';

afterEach(() => document.body.replaceChildren());

const first: RefugePresentation = {
  nodeId: 'lion-first-refuge', title: 'Refuge du Lion', eyebrow: 'Halte de run',
  description: 'Le camp du Lion.', environmentContext: 'dialogue:first_refuge_gathering',
  environmentRole: 'STATIC_TABLEAU',
  background: '/assets/refuge-first-test.png', visualFamily: 'FIRST_REFUGE',
  gatheringDialogueId: 'first_refuge_gathering',
};

it('renders five unchanged action IDs, truthful healthy Rest, and the one movable HUD', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const view = new ExplorationView({ root: document.body, statusHud: hud });
  const action = view.open(first, 'Neutre', 25, { cost: 0, woundedCount: 0, canRest: false });
  const hub = document.querySelector<HTMLElement>('.exploration-stop')!;
  expect(hub.dataset.refugeNode).toBe('lion-first-refuge');
  expect(hub.dataset.environmentContext).toBe('dialogue:first_refuge_gathering');
  expect(hub.style.getPropertyValue('--refuge-background')).toContain(first.background);
  expect(hub.querySelector('h2')?.textContent).toBe(first.title);
  expect([...hub.querySelectorAll<HTMLButtonElement>('[data-action]')].map(button => button.dataset.action))
    .toEqual(['clan', 'shop', 'skills', 'rest', 'continue']);
  expect(hub.querySelector<HTMLButtonElement>('[data-action="rest"]')!.disabled).toBe(true);
  expect(hub.textContent).toContain('Compagnie en pleine forme');
  expect(hub.textContent).toContain('+25 or placé dans le coffre');
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  expect(hub.contains(hud.element)).toBe(true);
  hub.querySelector<HTMLButtonElement>('[data-action="clan"]')!.click();
  expect(await action).toBe('clan');
  expect(document.querySelectorAll('.exploration-stop, .campaign-status-hud')).toHaveLength(0);
});

it('rebuilds the same refuge with the same HUD after management and after Rest', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const view = new ExplorationView({ root: document.body, statusHud: hud });
  const wounded = view.open(first, 'Neutre', 0, { cost: 30, woundedCount: 2, canRest: true });
  expect(document.body.textContent).toContain('2 unités blessées · 30 or');
  document.querySelector<HTMLButtonElement>('[data-action="rest"]')!.click();
  expect(await wounded).toBe('rest');
  const afterRest = view.open(first, 'Neutre', 0, {
    cost: 0, woundedCount: 0, canRest: false, message: 'Repos effectué : 30 or dépensé.',
  });
  expect(document.querySelectorAll('.exploration-stop')).toHaveLength(1);
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  expect(document.querySelector('.campaign-status-hud')).toBe(hud.element);
  expect(document.body.textContent).toContain('Repos effectué : 30 or dépensé.');
  expect(document.body.textContent).toContain('+0 or placé dans le coffre');
  expect(document.querySelector<HTMLButtonElement>('[data-action="rest"]')!.disabled).toBe(true);
  document.querySelector<HTMLButtonElement>('[data-action="shop"]')!.click();
  expect(await afterRest).toBe('shop');
  const afterManagement = view.open(first, 'Neutre', 0, { cost: 0, woundedCount: 0, canRest: false });
  expect(document.querySelectorAll('.exploration-stop')).toHaveLength(1);
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  expect(document.querySelector('.campaign-status-hud')).toBe(hud.element);
  expect(document.querySelector<HTMLElement>('.exploration-stop')!.dataset.environmentContext).toBe(first.environmentContext);
  expect(document.querySelector('.travel-view')).toBeNull();
  document.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(await afterManagement).toBe('continue');
});

it('disables Rest and explains the actual gold shortfall', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const view = new ExplorationView({ root: document.body, statusHud: hud });
  const action = view.open(first, 'Neutre', 0, { cost: 45, woundedCount: 3, canRest: false });
  const rest = document.querySelector<HTMLButtonElement>('[data-action="rest"]')!;
  expect(rest.disabled).toBe(true);
  expect(rest.textContent).toContain('45 or requis · or insuffisant');
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  document.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(await action).toBe('continue');
});
