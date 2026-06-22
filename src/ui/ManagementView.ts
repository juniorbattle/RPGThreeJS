import { getFinalStats, itemById, items, unitById, weaponById, weapons } from '../game/catalog';
import { buyItem, equipAccessory, equipWeapon, excludeUnit, sellItem } from '../game/management';
import { getReputationRule, getShopPrice } from '../game/reputation';
import type { GameState, ItemCategory, UnitInstance } from '../game/types';

type ManagementTab = 'clan' | 'inventory' | 'shop';

interface ManagementViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  onChange: () => void;
}

const categoryLabels: Record<ItemCategory, string> = {
  consumables: 'Consommables',
  accessories: 'Accessoires',
  materials: 'Matériaux',
  weapons: 'Armes',
};

export class ManagementView {
  private overlay: HTMLElement | null = null;
  private selectedUnitId = '';
  private tab: ManagementTab = 'clan';
  private shopId = 'valmir';
  private shopMode: 'buy' | 'sell' = 'buy';
  private shopEnabled = false;
  private shopWallet: 'temporary' | 'permanent' = 'temporary';

  constructor(private readonly options: ManagementViewOptions) {}

  open(initialTab: ManagementTab = 'clan', shopId?: string, shopWallet: 'temporary' | 'permanent' = 'temporary'): Promise<void> {
    this.close();
    this.shopEnabled = shopId !== undefined;
    this.tab = initialTab === 'shop' && !this.shopEnabled ? 'clan' : initialTab;
    this.shopId = shopId ?? 'valmir';
    this.shopWallet = shopWallet;
    this.selectedUnitId = this.options.getState().clan.members[0]?.id ?? '';
    this.overlay = document.createElement('section');
    this.overlay.className = 'management';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.options.root.append(this.overlay);
    this.render();
    return new Promise((resolve) => {
      this.overlay?.addEventListener('management:close', () => resolve(), { once: true });
    });
  }

  close(): void {
    if (!this.overlay) return;
    this.overlay.dispatchEvent(new Event('management:close'));
    this.overlay.remove();
    this.overlay = null;
  }

  private render(): void {
    if (!this.overlay) return;
    const state = this.options.getState();
    this.overlay.innerHTML = `
      <div class="management__veil"></div>
      <div class="management__shell">
        <header class="management__header">
          <div><p class="eyebrow">Camp du Lion</p><h2>Registre de compagnie</h2></div>
          <div class="management__wealth"><span>BUTIN / COFFRE</span><strong>${state.run.temporaryLoot.gold} / ${state.gold}</strong></div>
          <button class="icon-button" type="button" data-action="close" aria-label="Fermer">×</button>
        </header>
        <nav class="management__tabs">
          ${this.tabButton('clan', 'Clan')}
          ${this.tabButton('inventory', 'Inventaire')}
          ${this.shopEnabled ? this.tabButton('shop', 'Boutique') : ''}
        </nav>
        <div class="management__content">${this.renderContent()}</div>
      </div>
    `;
    this.bind();
  }

  private tabButton(tab: ManagementTab, label: string): string {
    return `<button type="button" data-tab="${tab}" class="${this.tab === tab ? 'is-active' : ''}">${label}</button>`;
  }

  private renderContent(): string {
    if (this.tab === 'inventory') return this.renderInventory();
    if (this.tab === 'shop') return this.renderShop();
    return this.renderClan();
  }

  private renderClan(): string {
    const state = this.options.getState();
    const selected = state.clan.members.find((unit) => unit.id === this.selectedUnitId) ?? state.clan.members[0];
    if (!selected) return '<p>Aucune unité.</p>';
    const definition = unitById.get(selected.definitionId)!;
    const stats = getFinalStats(selected);
    const roster = state.clan.members.map((unit) => {
      const def = unitById.get(unit.definitionId)!;
      return `
        <button type="button" class="roster-card ${unit.id === selected.id ? 'is-active' : ''}" data-unit="${unit.id}">
          <img src="${def.portrait}" alt="">
          <span><strong>${unit.name}</strong><small>${def.className}</small></span>
          ${unit.narrativeLocked ? '<i title="Unité narrative">◆</i>' : ''}
        </button>`;
    }).join('');
    return `
      <div class="clan-layout">
        <aside class="roster"><div class="section-title">Membres ${state.clan.members.length}/${state.clan.maxSize}</div>${roster}</aside>
        <article class="unit-sheet">
          <div class="unit-sheet__hero">
            <img src="${definition.portrait}" alt="${selected.name}">
            <div><p class="eyebrow">${definition.className}</p><h3>${selected.name}</h3><span>Progression par équipement</span></div>
          </div>
          <div class="stat-grid">
            ${this.stat('PV', stats.maxHealth)}${this.stat('FOR', stats.strength)}
            ${this.stat('MAG', stats.magic)}${this.stat('END', stats.endurance)}
            ${this.stat('DEX', stats.dexterity)}${this.stat('CHA', stats.charisma)}
          </div>
          <div class="equipment">
            <div class="section-title">Équipement</div>
            ${Array.from({ length: definition.weaponSlotCount }, (_, slot) =>
              this.weaponSelect(selected, slot as 0 | 1)).join('')}
            ${([0, 1] as const).map((slot) => this.accessorySelect(selected, slot)).join('')}
          </div>
          <div class="unit-sheet__actions">
            <button type="button" class="danger-button" data-action="exclude" ${selected.narrativeLocked ? 'disabled' : ''}>
              ${selected.narrativeLocked ? 'Lié à la chronique' : 'Exclure du clan'}
            </button>
          </div>
        </article>
      </div>`;
  }

  private weaponSelect(unit: UnitInstance, slot: 0 | 1): string {
    const state = this.options.getState();
    const definition = unitById.get(unit.definitionId)!;
    const currentId = unit.equipment.weaponIds[slot]!;
    const current = weaponById.get(currentId);
    const equipped = new Set(unit.equipment.weaponIds);
    const available = weapons.filter((candidate) =>
      definition.allowedWeaponIds.includes(candidate.id)
      && !equipped.has(candidate.id)
      && (state.inventory.weapons[candidate.id] ?? 0) > 0);
    return `<label>Arme ${definition.weaponSlotCount > 1 ? slot + 1 : ''}
      <select data-equip="weapon" data-slot="${slot}">
        <option value="${currentId}">${current?.name ?? currentId} — équipée</option>
        ${available.map((candidate) =>
          `<option value="${candidate.id}">${candidate.name} · ${candidate.damage} puissance</option>`).join('')}
      </select>
    </label>`;
  }

  private accessorySelect(unit: UnitInstance, slot: 0 | 1): string {
    const state = this.options.getState();
    const currentId = unit.equipment.accessoryIds[slot];
    const current = currentId ? itemById.get(currentId) : null;
    const available = items.filter((item) =>
      item.category === 'accessories' && item.id !== currentId && (state.inventory.accessories[item.id] ?? 0) > 0);
    return `<label>Accessoire ${slot + 1}
      <select data-equip="accessory" data-slot="${slot}">
        <option value="${currentId ?? ''}">${current?.name ?? 'Emplacement vide'}</option>
        ${currentId ? '<option value="">Retirer</option>' : ''}
        ${available.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}
      </select>
    </label>`;
  }

  private stat(label: string, value: number): string {
    return `<div><span>${label}</span><strong>${value}</strong></div>`;
  }

  private renderInventory(): string {
    const state = this.options.getState();
    return `<div class="inventory-view">${(Object.keys(categoryLabels) as ItemCategory[]).map((category) => {
      const rows = Object.entries(state.inventory[category]).filter(([, quantity]) => quantity > 0);
      return `<section class="inventory-group"><div class="section-title">${categoryLabels[category]}</div>
        ${rows.length ? rows.map(([id, quantity]) => this.itemRow(id, quantity)).join('') : '<p class="empty-copy">Aucun objet.</p>'}
      </section>`;
    }).join('')}</div>`;
  }

  private itemRow(id: string, quantity: number, action = ''): string {
    const item = itemById.get(id);
    if (!item) return '';
    return `<div class="item-row">
      <span class="item-row__icon">${item.icon}</span>
      <span><strong>${item.name}</strong><small>${item.description}</small></span>
      <b>×${quantity}</b>${action}
    </div>`;
  }

  private renderShop(): string {
    const state = this.options.getState();
    const source = this.shopMode === 'buy'
      ? Object.entries(state.shops[this.shopId]?.stock ?? {})
      : (Object.keys(categoryLabels) as ItemCategory[]).flatMap((category) => Object.entries(state.inventory[category]));
    const rows = source.filter(([, quantity]) => quantity > 0).map(([id, quantity]) => {
      const item = itemById.get(id);
      if (!item) return '';
      const price = this.shopMode === 'buy' ? getShopPrice(item.price, state.reputation) : Math.floor(item.price / 2);
      const availableGold = this.shopWallet === 'temporary' ? state.run.temporaryLoot.gold : state.gold;
      const disabled = this.shopMode === 'buy' && availableGold < price;
      const action = `<button type="button" data-trade="${this.shopMode}" data-item="${id}" ${disabled ? 'disabled' : ''}>${price} or</button>`;
      return this.itemRow(id, quantity, action);
    }).join('');
    return `<div class="shop-view">
      <div class="shop-view__intro"><div><p class="eyebrow">Échoppe de Valmir · ${getReputationRule(state.reputation).label}</p><h3>Le Comptoir du Cerf</h3><small>Les achats utilisent ${this.shopWallet === 'temporary' ? 'le butin non sécurisé' : 'le coffre permanent'}.</small></div>
        <div class="shop-toggle">
          <button type="button" data-shop-mode="buy" class="${this.shopMode === 'buy' ? 'is-active' : ''}">Acheter</button>
          <button type="button" data-shop-mode="sell" class="${this.shopMode === 'sell' ? 'is-active' : ''}">Vendre</button>
        </div>
      </div>
      <div class="shop-list">${rows || '<p class="empty-copy">Aucun article disponible.</p>'}</div>
    </div>`;
  }

  private bind(): void {
    if (!this.overlay) return;
    this.overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => this.close());
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        this.tab = button.dataset.tab as ManagementTab;
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedUnitId = button.dataset.unit ?? '';
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLSelectElement>('[data-equip="weapon"]').forEach((select) => {
      select.addEventListener('change', () => {
        const slot = Number(select.dataset.slot) as 0 | 1;
        if (equipWeapon(this.options.getState(), this.selectedUnitId, slot, select.value)) this.changed();
      });
    });
    this.overlay.querySelectorAll<HTMLSelectElement>('[data-equip="accessory"]').forEach((select) => {
      select.addEventListener('change', () => {
        const slot = Number(select.dataset.slot) as 0 | 1;
        if (equipAccessory(this.options.getState(), this.selectedUnitId, slot, select.value || null)) this.changed();
      });
    });
    this.overlay.querySelector('[data-action="exclude"]')?.addEventListener('click', () => {
      const unit = this.options.getState().clan.members.find((candidate) => candidate.id === this.selectedUnitId);
      if (!unit || !window.confirm(`Exclure ${unit.name} du clan ? Son équipement retournera à l’inventaire.`)) return;
      if (excludeUnit(this.options.getState(), unit.id)) {
        this.selectedUnitId = this.options.getState().clan.members[0]?.id ?? '';
        this.changed();
      }
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-shop-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        this.shopMode = button.dataset.shopMode as 'buy' | 'sell';
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-trade]').forEach((button) => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.item ?? '';
        const ok = button.dataset.trade === 'buy'
          ? buyItem(this.options.getState(), this.shopId, itemId, this.shopWallet === 'temporary')
          : sellItem(this.options.getState(), this.shopId, itemId, this.shopWallet === 'temporary');
        if (ok) this.changed();
      });
    });
  }

  private changed(): void {
    this.options.onChange();
    this.render();
  }
}
