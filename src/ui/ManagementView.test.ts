// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { ManagementView } from './ManagementView';

afterEach(() => document.body.replaceChildren());
function setup() {
  const state = createInitialState();
  const root = document.createElement('div'); document.body.append(root);
  const opener = document.createElement('button'); opener.textContent = 'Compagnie'; root.append(opener); opener.focus();
  const view = new ManagementView({ root, getState: () => state, onChange: () => undefined });
  return { state, root, opener, view };
}
function key(value: string, shiftKey = false) {
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true }));
}
it('owns a named modal, preserves focus through a tab rebuild, and restores its opener without changing game truth', async () => {
  const { state, root, opener, view } = setup(); const before = JSON.stringify(state);
  const closed = view.open();
  expect(root.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Registre de Compagnie');
  expect((document.activeElement as HTMLElement).dataset.action).toBe('close');
  expect(opener.inert).toBe(true);
  const inventory = root.querySelector<HTMLButtonElement>('[data-tab="inventory"]')!;
  inventory.focus(); inventory.click();
  expect((document.activeElement as HTMLElement).dataset.tab).toBe('inventory');
  key('Escape'); await closed;
  expect(document.activeElement).toBe(opener); expect(opener.inert).toBe(false);
  expect(root.querySelector('.management')).toBeNull(); expect(JSON.stringify(state)).toBe(before);
});
it('contains Tab in the current dialog and returns from equipment details to their opener', async () => {
  const { state, root, view } = setup(); const before = JSON.stringify(state);
  const closed = view.open();
  const close = root.querySelector<HTMLButtonElement>('[data-action="close"]')!;
  close.focus(); key('Tab', true);
  expect(document.activeElement).not.toBe(close); expect(document.activeElement?.closest('.management')).not.toBeNull();
  key('Tab'); expect(document.activeElement).toBe(close);
  const slot = root.querySelector<HTMLButtonElement>('[data-equip-slot="weapon"]')!;
  slot.focus(); slot.click();
  expect(document.activeElement?.closest('.item-modal')).not.toBeNull();
  expect(root.querySelector<HTMLElement>('.management__shell')!.inert).toBe(true);
  key('Tab', true); expect(document.activeElement?.closest('.item-modal')).not.toBeNull();
  key('Escape');
  expect(root.querySelector('.item-modal')).toBeNull();
  expect((document.activeElement as HTMLElement).dataset.equipSlot).toBe('weapon');
  expect(root.querySelector<HTMLElement>('.management__shell')!.inert).toBe(false);
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});
it('preserves the native trade button after one owner-resolved purchase rerenders the shop', async () => {
  const { state, root, view } = setup(); state.gold = 10000; state.shops.valmir!.stock.potion = 2;
  const before = state.inventory.consumables.potion ?? 0;
  const closed = view.open('shop', 'valmir', 'permanent');
  const buy = root.querySelector<HTMLButtonElement>('[data-trade="buy"][data-item="potion"]')!;
  buy.focus(); buy.click();
  expect(state.inventory.consumables.potion).toBe(before + 1);
  expect(state.shops.valmir!.stock.potion).toBe(1);
  expect((document.activeElement as HTMLElement).dataset.trade).toBe('buy');
  expect((document.activeElement as HTMLElement).dataset.item).toBe('potion');
  view.close(); await closed;
});
