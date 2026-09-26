// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { CampaignStatusHud, selectCampaignStatus } from './CampaignStatusHud';
import { ExplorationView } from './ExplorationView';
import type { RefugeBackgroundReadiness } from './RefugeBackgroundReadiness';
import type { RefugePresentation } from './RefugePresentation';

afterEach(() => document.body.replaceChildren());

const first: RefugePresentation = {
  nodeId: 'lion-first-refuge', title: 'Refuge du Lion', eyebrow: 'Halte de run',
  description: 'Le camp du Lion.', environmentContext: 'dialogue:first_refuge_gathering',
  environmentRole: 'STATIC_TABLEAU',
  background: '/assets/refuge-first-test.png', visualFamily: 'FIRST_REFUGE',
  gatheringDialogueId: 'first_refuge_gathering',
};

const second: RefugePresentation = {
  ...first, nodeId: 'lion-second-refuge', title: 'Dernier feu du Lion',
  background: '/assets/refuge-second-test.png', visualFamily: 'SECOND_REFUGE',
};

const decoded = (backgroundUrl: string): RefugeBackgroundReadiness => ({
  backgroundUrl, backgroundReady: true, naturalWidth: 2048, naturalHeight: 1152,
});
const readyBackground = async (backgroundUrl: string) => decoded(backgroundUrl);
const settledHub = async () => { await Promise.resolve(); };

it('renders five unchanged action IDs, truthful healthy Rest, and the one movable HUD', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const view = new ExplorationView({ root: document.body, statusHud: hud, backgroundPreloader: readyBackground });
  const action = view.open(first, 'Neutre', 25, { cost: 0, woundedCount: 0, canRest: false });
  await settledHub();
  const hub = document.querySelector<HTMLElement>('.exploration-stop')!;
  expect(hub.dataset.refugeNode).toBe('lion-first-refuge');
  expect(hub.dataset.environmentContext).toBe('dialogue:first_refuge_gathering');
  expect(hub.style.getPropertyValue('--refuge-background')).toContain(first.background);
  expect(hub.dataset.backgroundReady).toBe('true');
  expect(hub.dataset.backgroundNaturalWidth).toBe('2048');
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
  const view = new ExplorationView({ root: document.body, statusHud: hud, backgroundPreloader: readyBackground });
  const wounded = view.open(first, 'Neutre', 0, { cost: 30, woundedCount: 2, canRest: true });
  await settledHub();
  expect(document.body.textContent).toContain('2 unités blessées · 30 or');
  document.querySelector<HTMLButtonElement>('[data-action="rest"]')!.click();
  expect(await wounded).toBe('rest');
  const afterRest = view.open(first, 'Neutre', 0, {
    cost: 0, woundedCount: 0, canRest: false, message: 'Repos effectué : 30 or dépensé.',
  });
  await settledHub();
  expect(document.querySelectorAll('.exploration-stop')).toHaveLength(1);
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  expect(document.querySelector('.campaign-status-hud')).toBe(hud.element);
  expect(document.body.textContent).toContain('Repos effectué : 30 or dépensé.');
  expect(document.body.textContent).toContain('+0 or placé dans le coffre');
  expect(document.querySelector<HTMLButtonElement>('[data-action="rest"]')!.disabled).toBe(true);
  document.querySelector<HTMLButtonElement>('[data-action="shop"]')!.click();
  expect(await afterRest).toBe('shop');
  const afterManagement = view.open(first, 'Neutre', 0, { cost: 0, woundedCount: 0, canRest: false });
  await settledHub();
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
  const view = new ExplorationView({ root: document.body, statusHud: hud, backgroundPreloader: readyBackground });
  const action = view.open(first, 'Neutre', 0, { cost: 45, woundedCount: 3, canRest: false });
  await settledHub();
  const rest = document.querySelector<HTMLButtonElement>('[data-action="rest"]')!;
  expect(rest.disabled).toBe(true);
  expect(rest.textContent).toContain('45 or requis · or insuffisant');
  expect(document.querySelectorAll('.campaign-status-hud')).toHaveLength(1);
  document.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(await action).toBe('continue');
});

it('preloads both refuge plates and keeps the hub hidden until the image is decoded', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const pending = new Map<string, (readiness: RefugeBackgroundReadiness) => void>();
  const view = new ExplorationView({
    root: document.body, statusHud: hud,
    backgroundPreloader: backgroundUrl => new Promise(resolve => pending.set(backgroundUrl, resolve)),
  });
  const firstReady = view.prepareBackground(first.background);
  const firstAction = view.open(first, 'Neutre', 0, { cost: 0, woundedCount: 0, canRest: false });
  const firstHub = document.querySelector<HTMLElement>('.exploration-stop')!;
  expect(firstHub.dataset.backgroundReady).toBe('pending');
  expect(firstHub.style.visibility).toBe('hidden');
  expect(firstHub.inert).toBe(true);
  firstHub.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(firstHub.isConnected).toBe(true);
  pending.get(first.background)!(decoded(first.background));
  await firstReady;
  await settledHub();
  expect(firstHub.dataset.backgroundReady).toBe('true');
  expect(firstHub.style.visibility).toBe('visible');
  firstHub.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(await firstAction).toBe('continue');

  const secondReady = view.prepareBackground(second.background);
  const secondAction = view.open(second, 'Neutre', 0, { cost: 0, woundedCount: 0, canRest: false });
  pending.get(second.background)!(decoded(second.background));
  await secondReady;
  await settledHub();
  const secondHub = document.querySelector<HTMLElement>('.exploration-stop')!;
  expect(secondHub.dataset.backgroundUrl).toBe(second.background);
  expect(secondHub.dataset.backgroundReady).toBe('true');
  secondHub.querySelector<HTMLButtonElement>('[data-action="continue"]')!.click();
  expect(await secondAction).toBe('continue');
});

it('reveals the dark fallback and leaves actions usable if background decoding fails', async () => {
  const state = createInitialState();
  const hud = new CampaignStatusHud(() => selectCampaignStatus(state));
  const view = new ExplorationView({
    root: document.body, statusHud: hud,
    backgroundPreloader: async backgroundUrl => ({
      backgroundUrl, backgroundReady: false, naturalWidth: 0, naturalHeight: 0, error: 'Decode failed',
    }),
  });
  const action = view.open(second, 'Neutre', 0, { cost: 0, woundedCount: 0, canRest: false });
  await settledHub();
  const hub = document.querySelector<HTMLElement>('.exploration-stop')!;
  expect(hub.dataset.backgroundReady).toBe('false');
  expect(hub.dataset.backgroundError).toBe('Decode failed');
  expect(hub.style.getPropertyValue('--refuge-background')).toBe('none');
  expect(hub.style.visibility).toBe('visible');
  hub.querySelector<HTMLButtonElement>('[data-action="clan"]')!.click();
  expect(await action).toBe('clan');
});
