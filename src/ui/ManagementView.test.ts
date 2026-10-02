// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { getResolvedSkills, isSkillUnlockedForHero, itemById } from '../game/catalog';
import { equipWeapon } from '../game/management';
import { skillById } from '../game/skills';
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

it('provides a native inventory details button and restores it after dismissal without changing truth', async () => {
  const { state, root, view } = setup(); state.inventory.weapons.steel_greatsword = 1;
  const before = JSON.stringify(state), closed = view.open('inventory');
  const details = root.querySelector<HTMLButtonElement>('[data-item-details="steel_greatsword"]')!;
  expect(details.tagName).toBe('BUTTON'); expect(details.type).toBe('button');
  expect(details.getAttribute('aria-label')).toContain(itemById.get('steel_greatsword')!.name);
  details.focus(); details.click(); key('Escape');
  expect((document.activeElement as HTMLElement).dataset.itemDetails).toBe('steel_greatsword');
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});

it('returns from equipment preview to the same replacement and preserves the outer slot focus', async () => {
  const { state, root, view } = setup(); state.inventory.weapons.steel_greatsword = 1;
  const before = JSON.stringify(state), closed = view.open();
  const slot = root.querySelector<HTMLButtonElement>('[data-equip-slot="weapon"]')!;
  slot.focus(); slot.click();
  const replacement = root.querySelector<HTMLButtonElement>('[data-preview-item="steel_greatsword"]')!;
  replacement.focus(); replacement.click();
  const back = root.querySelector<HTMLButtonElement>('[data-preview-back]')!; back.focus(); back.click();
  expect((document.activeElement as HTMLElement).dataset.previewItem).toBe('steel_greatsword');
  key('Escape'); expect((document.activeElement as HTMLElement).dataset.equipSlot).toBe('weapon');
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});

it('names weapon transactions and keeps their clicks separate from details', async () => {
  const { state, root, view } = setup(); state.gold = 10000;
  const closed = view.open('shop', 'valmir', 'permanent');
  const buy = root.querySelector<HTMLButtonElement>('[data-trade="buy"][data-item="steel_greatsword"]')!;
  expect(buy.getAttribute('aria-label')).toContain('Acheter');
  expect(buy.getAttribute('aria-label')).toContain(itemById.get('steel_greatsword')!.name);
  expect(buy.closest('[data-item-details]')).toBeNull();
  buy.focus(); buy.click(); expect(root.querySelector('.item-modal')).toBeNull();
  expect(state.inventory.weapons.steel_greatsword).toBe(1);
  view.close(); await closed;
});

it('names unlocked upgrades by skill and unit, preserves rerender focus and stops at the owner cap', async () => {
  const { state, root, view } = setup(); const unit = state.clan.members[0]!;
  state.inventory.weapons.steel_greatsword = 1; state.inventory.materials.red_gem = 3;
  expect(equipWeapon(state, unit.id, 'steel_greatsword')).toBe(true);
  const skillId = getResolvedSkills(unit).find(id => isSkillUnlockedForHero(unit, id))!;
  const closed = view.open('skills');
  const selector = `[data-upgrade-skill="${skillId}"]`;
  const button = root.querySelector<HTMLButtonElement>(selector)!;
  expect(button.getAttribute('aria-label')).toContain(skillById.get(skillId)!.name);
  expect(button.getAttribute('aria-label')).toContain(unit.name);
  button.focus(); button.click();
  expect(unit.skillUpgrades[skillId]).toBe(1);
  expect((document.activeElement as HTMLElement).dataset.upgradeSkill).toBe(skillId);
  root.querySelector<HTMLButtonElement>(selector)!.click();
  expect(unit.skillUpgrades[skillId]).toBe(2); expect(state.inventory.materials.red_gem).toBe(0);
  expect(root.querySelector<HTMLButtonElement>(selector)!.disabled).toBe(true);
  expect(root.querySelector(selector)!.getAttribute('aria-label')).toContain('maximal');
  expect(document.activeElement?.closest('.management')).not.toBeNull();
  view.close(); await closed;
});

it('names consumable target and use controls from the catalog', async () => {
  const { state, root, view } = setup(); state.clan.members[0]!.currentHealth = 10;
  const closed = view.open('inventory');
  for (const selector of ['[data-use-unit="potion"]', '[data-use-item="potion"]']) {
    expect(root.querySelector(selector)!.getAttribute('aria-label')).toContain(itemById.get('potion')!.name);
  }
  view.close(); await closed;
});
