// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { createInitialState } from '../game/store';
import { getResolvedSkills, isSkillUnlockedForHero, itemById } from '../game/catalog';
import { equipWeapon } from '../game/management';
import { skillById } from '../game/skills';
import { ManagementView } from './ManagementView';

afterEach(() => document.body.replaceChildren());
function setup(onSound = vi.fn()) {
  const state = createInitialState();
  const root = document.createElement('div'); document.body.append(root);
  const opener = document.createElement('button'); opener.textContent = 'Compagnie'; root.append(opener); opener.focus();
  const view = new ManagementView({ root, getState: () => state, onChange: () => undefined, onSound });
  return { state, root, opener, view, onSound };
}
it('sounds intentional equipment/detail open and close exactly once, with silent focus and unchanged truth', async () => {
  const { state, root, view, onSound } = setup(); state.inventory.weapons.steel_greatsword = 1;
  const before = JSON.stringify(state), closed = view.open();
  const slot = root.querySelector<HTMLButtonElement>('[data-equip-slot="weapon"]')!;
  slot.focus(); expect(onSound).not.toHaveBeenCalled(); slot.click();
  expect(onSound.mock.calls).toEqual([['confirm']]);
  root.querySelector<HTMLButtonElement>('[data-equip-slot-close]')!.click();
  expect(onSound.mock.calls).toEqual([['confirm'], ['back']]);
  root.querySelector<HTMLButtonElement>('[data-tab="inventory"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-item-details="steel_greatsword"]')!.click();
  key('Escape');
  expect(onSound.mock.calls.slice(2)).toEqual([['navigate'], ['confirm'], ['back']]);
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});
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
  expect(root.querySelector('.item-modal')?.textContent).toContain('Disponible : Brise-Garde — 2 PA');
  expect(root.querySelector('.item-modal')?.textContent).not.toContain('Aucune compétence active débloquée');
  expect(root.querySelector<HTMLElement>('.management__shell')!.inert).toBe(true);
  key('Tab', true); expect(document.activeElement?.closest('.item-modal')).not.toBeNull();
  key('Escape');
  expect(root.querySelector('.item-modal')).toBeNull();
  expect((document.activeElement as HTMLElement).dataset.equipSlot).toBe('weapon');
  expect(root.querySelector<HTMLElement>('.management__shell')!.inert).toBe(false);
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});
it('buys only after the fiche is confirmed, then returns focus to the shop line (playtest 2026-11-07)', async () => {
  const { state, root, view, onSound } = setup(); state.gold = 10000; state.shops.valmir!.stock.potion = 2;
  const before = state.inventory.consumables.potion ?? 0, untouched = JSON.stringify(state);
  const closed = view.open('shop', 'valmir', 'permanent');
  const line = root.querySelector<HTMLButtonElement>('[data-trade="buy"][data-item="potion"]')!;
  line.focus(); line.click();
  // The line opens the fiche; nothing is bought yet, and focus lands on the fiche's primary action.
  expect(JSON.stringify(state)).toBe(untouched);
  expect(root.querySelector('.trade-modal')?.getAttribute('aria-label')).toBe('Achat · Potion légère');
  expect((document.activeElement as HTMLElement).dataset.tradeStep).toBe('confirm');
  expect(root.querySelector('.trade-summary')?.textContent).toContain('10000 → 9983');
  (document.activeElement as HTMLButtonElement).click();
  expect(JSON.stringify(state)).toBe(untouched);
  expect(root.querySelector('.trade-confirm')?.textContent).toContain('Confirmer l’achat de Potion légère pour 17 or');
  key('Escape');
  expect(root.querySelector('[data-trade-stage]')?.getAttribute('data-trade-stage')).toBe('preview');
  root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-trade-confirm]')!.click();
  expect(state.inventory.consumables.potion).toBe(before + 1);
  expect(state.shops.valmir!.stock.potion).toBe(1);
  expect(root.querySelector('.trade-done')?.textContent).toContain('Acheté : Potion légère');
  // One more goes back through the confirmation.
  root.querySelector<HTMLButtonElement>('.trade-footer [data-trade-step="confirm"]')!.click();
  expect(root.querySelector('[data-trade-confirm]')).not.toBeNull();
  expect(state.inventory.consumables.potion).toBe(before + 1);
  key('Escape'); key('Escape');
  expect(root.querySelector('.trade-modal')).toBeNull();
  expect((document.activeElement as HTMLElement).dataset.item).toBe('potion');
  expect(onSound.mock.calls.filter(([cue]) => cue === 'confirm')).toHaveLength(2);
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

it('previews a weapon for the hero who wields it, buys it on confirmation and equips it from the fiche (playtest 2026-11-07)', async () => {
  const { state, root, view } = setup(); state.gold = 10000;
  const closed = view.open('shop', 'valmir', 'permanent');
  const line = root.querySelector<HTMLButtonElement>('[data-trade="buy"][data-item="steel_greatsword"]')!;
  expect(line.getAttribute('aria-label')).toContain('acheter');
  expect(line.getAttribute('aria-label')).toContain(itemById.get('steel_greatsword')!.name);
  line.click();
  const fiche = root.querySelector('.trade-modal')!.textContent!;
  expect(fiche).toContain('Si Alistair la prend · remplace Espadon novice');
  expect(fiche).toContain('20 → 25');
  expect(fiche).toContain('Nouvelle compétence : Charge (3 PA)');
  expect(state.inventory.weapons.steel_greatsword ?? 0).toBe(0);
  root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-trade-confirm]')!.click();
  expect(state.inventory.weapons.steel_greatsword).toBe(1);
  const equip = root.querySelector<HTMLButtonElement>('[data-trade-equip="warrior"]')!;
  expect(document.activeElement).toBe(equip);
  expect(equip.textContent).toContain('Équiper sur Alistair');
  equip.click();
  const alistair = state.clan.members.find(unit => unit.id === 'warrior')!;
  expect(alistair.equipment.weaponIds).toEqual(['steel_greatsword']);
  expect(state.inventory.weapons.novice_greatsword).toBe(1);
  expect(root.querySelector('.trade-done')?.textContent).toContain("Alistair porte maintenant : Espadon d'acier. Espadon novice retourne dans le sac.");
  expect(root.querySelector('[data-trade-equip]')).toBeNull();
  expect((document.activeElement as HTMLElement).dataset.tradeClose).toBe('');
  view.close(); await closed;
});

it('says the forge equips the hero whose weapon it takes, and lists what a recipe still misses (playtest 2026-11-07)', async () => {
  const { state, root, view } = setup(); state.gold = 1000; state.inventory.materials.iron_ore = 2;
  const closed = view.open('shop', 'valmir', 'permanent');
  root.querySelector<HTMLButtonElement>('[data-shop-mode="craft"]')!.click();
  const card = root.querySelector('[data-craft="craft_steel_greatsword"]')!.closest('.craft-recipe')!;
  expect(card.textContent).toContain('Prêt à forger');
  expect(card.textContent).toContain('Espadon novice 1/1');
  expect(card.textContent).toContain('sur Alistair');
  root.querySelector<HTMLButtonElement>('[data-craft="craft_steel_greatsword"]')!.click();
  expect(root.querySelector('.trade-modal')!.textContent).toContain('Alistair l’équipera aussitôt · remplace Espadon novice');
  expect(state.inventory.materials.iron_ore).toBe(2);
  root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.click();
  expect(root.querySelector('.trade-confirm')!.textContent).toContain('1 Espadon novice (sur Alistair)');
  root.querySelector<HTMLButtonElement>('[data-trade-confirm]')!.click();
  expect(state.clan.members.find(unit => unit.id === 'warrior')!.equipment.weaponIds).toEqual(['steel_greatsword']);
  expect(root.querySelector('.trade-done')!.textContent).toContain("Alistair porte maintenant : Espadon d'acier.");
  expect(root.querySelector('.trade-done')!.textContent).toContain('La forge a utilisé : Espadon novice.');
  key('Escape');
  // The ore is spent: the next recipe still opens its fiche, says what is missing and cannot be confirmed.
  root.querySelector<HTMLButtonElement>('[data-craft="craft_sacred_crosier"]')!.click();
  expect(root.querySelector('.trade-warning')!.textContent).toContain('Minerai de fer ×2 (en vente à l’échoppe)');
  expect(root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.disabled).toBe(true);
  expect((document.activeElement as HTMLElement).dataset.tradeClose).toBe('');
  view.close(); await closed;
});

it('confirms a sale and refuses a purchase the company cannot afford (playtest 2026-11-07)', async () => {
  const { state, root, view } = setup(); state.gold = 5; state.inventory.materials.iron_ore = 3;
  const closed = view.open('shop', 'valmir', 'permanent');
  root.querySelector<HTMLButtonElement>('[data-trade="buy"][data-item="potion"]')!.click();
  expect(root.querySelector('.trade-warning')!.textContent).toContain('Il vous manque');
  expect(root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.disabled).toBe(true);
  key('Escape');
  root.querySelector<HTMLButtonElement>('[data-shop-mode="sell"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-trade="sell"][data-item="iron_ore"]')!.click();
  expect(state.inventory.materials.iron_ore).toBe(3);
  root.querySelector<HTMLButtonElement>('[data-trade-step="confirm"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-trade-confirm]')!.click();
  expect(state.inventory.materials.iron_ore).toBe(2);
  expect(state.gold).toBe(7);
  expect(root.querySelector('.trade-done')!.textContent).toContain('Vendu : Minerai de fer');
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

it('shows the skill an accessory swaps for this hero in its row and its details (playtest 2026-11-06)', async () => {
  const { state, root, view } = setup(); state.inventory.accessories.strength_ring = 1;
  const before = JSON.stringify(state), closed = view.open();
  root.querySelector<HTMLButtonElement>('[data-equip-slot="accessory"][data-equip-slot-index="0"]')!.click();
  const row = root.querySelector<HTMLButtonElement>('[data-preview-item="strength_ring"]')!;
  expect(row.querySelector('.weapon-replacement-meta')!.textContent).toContain('+5 FOR · Brise-Garde devient Lame Maudite');
  row.click();
  expect(root.textContent).toContain('Effet spécial');
  expect(root.textContent).toContain('Brise-Garde devient Lame Maudite');
  expect(JSON.stringify(state)).toBe(before); view.close(); await closed;
});

it('names the skill each weapon opens on the sheet, in the inventory, the shop and the forge, and lets every sheet entry take focus (OD-2026-11-07-B)', async () => {
  const { state, root, view } = setup();
  state.inventory.weapons.steel_greatsword = 1;
  const before = JSON.stringify(state);
  let closed = view.open();
  expect(root.querySelector('[data-equip-slot="weapon"] .equipment-slot__label')?.textContent).toBe('Arme · T1');
  expect(root.querySelector('.unit-skill-section__hint')?.textContent).toContain('T2 celle à 3 PA');
  const locked = [...root.querySelectorAll<HTMLElement>('.unit-skill-locked-row')];
  expect(locked.map(row => row.getAttribute('aria-label'))).toEqual(['Charge, 3 PA, Débloquée avec arme T2', 'Tourbillon d\'Acier, 4 PA, Débloquée avec arme T3']);
  expect(locked.every(row => row.tabIndex === 0)).toBe(true);
  expect([...root.querySelectorAll<HTMLElement>('.skill-card')].every(card => card.tabIndex === 0)).toBe(true);
  root.querySelector<HTMLButtonElement>('[data-tab="inventory"]')!.click();
  const row = root.querySelector('[data-item-details="steel_greatsword"]')!;
  expect(row.querySelector('.item-row__tier')?.textContent).toBe('T2');
  expect(row.querySelector('.item-row__skill')?.textContent).toBe('Alistair : débloque Charge (3 PA)');
  view.close(); await closed;
  closed = view.open('shop', 'valmir', 'permanent');
  root.querySelector<HTMLButtonElement>('[data-shop-mode="craft"]')!.click();
  const forge = root.querySelector('.craft-list')!.textContent!;
  expect(forge).toContain('Compétences Alistair : débloque Charge (3 PA)');
  expect(forge).toContain('Alistair : débloque Rempart du Serment (4 PA), Tourbillon d\'Acier devient Rempart du Serment');
  expect(forge).not.toContain('accorde Rempart');
  expect(forge).not.toContain('débloque les compétences à 3 PA');
  view.close(); await closed;
  expect(JSON.stringify(state)).toBe(before);
});

it('states each open skill in numbers at the hero level, the élan of the basic attack and both upgrade levels (skills pass 2026-11-11)', async () => {
  const { state, root, view } = setup(); const unit = state.clan.members[0]!;
  unit.skillUpgrades.w_break_guard = 2; state.inventory.materials.red_gem = 0;
  const before = JSON.stringify(state);
  let closed = view.open();
  const card = [...root.querySelectorAll<HTMLElement>('.skill-card--active')].find(entry => entry.textContent!.includes('Brise-Garde'))!;
  expect(card.querySelector('.skill-card__facts')!.textContent).toBe('Portée 1 · Dégâts physiques, puissance 12 · Malédiction 3 tours (END −30 %)');
  expect(card.getAttribute('aria-label')).toContain('Malédiction 3 tours');
  const basic = [...root.querySelectorAll<HTMLElement>('.skill-card--active')].find(entry => entry.textContent!.includes('Attaque de base'))!;
  expect(basic.textContent).toContain('1-3 PA');
  expect(basic.textContent).toContain('Élan : 1, 2 ou 3 PA');
  view.close(); await closed;
  unit.skillUpgrades.w_break_guard = 1;
  closed = view.open('skills');
  const upgrade = root.querySelector<HTMLButtonElement>('[data-upgrade-skill="w_break_guard"]')!.closest('.skill-upgrade-card')!;
  const [current, next] = [...upgrade.querySelectorAll('.skill-upgrade-card__body p')].map(p => p.textContent!);
  expect(current).toContain('Puissance +2.');
  expect(current).toContain('Portée 1 · Dégâts physiques, puissance 12 · Malédiction 2 tours');
  expect(next).toContain('Malédiction prolongée d’un tour.');
  expect(next).toContain('Malédiction 3 tours');
  view.close(); await closed;
  unit.skillUpgrades.w_break_guard = 2;
  expect(JSON.stringify(state)).toBe(before);
});

it('gives a long spear the reach its basic attack really has (skills pass 2026-11-11)', async () => {
  const { state, root, view } = setup(); state.inventory.weapons.steel_spear = 1; state.inventory.weapons.longbow = 1;
  const closed = view.open('inventory');
  root.querySelector<HTMLButtonElement>('[data-item-details="steel_spear"]')!.click();
  expect(root.textContent).toContain('Portée1 (diagonales comprises)');
  key('Escape');
  root.querySelector<HTMLButtonElement>('[data-item-details="longbow"]')!.click();
  expect(root.textContent).toContain('Portée2–4');
  view.close(); await closed;
});
