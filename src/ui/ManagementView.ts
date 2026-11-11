import {
  describeItemSkillEffects, getFinalStats, getInnateGift, getLockedSkillReason, getResolvedSkills, getWeaponOpenedSkill, getWeaponProfileLabel, getWeaponSkillUnlockLabel, WEAPON_TIER_RULE, weaponTierLabel,
  craftRecipeById, isSkillUnlockedForHero, itemById, items, resolveInitialSkillId, unitById, weaponById, weapons,
} from '../game/catalog';
import {
  buyItems, craftItem, equipAccessory, equipWeapon, excludeUnit, getBuyUnitPrice, getForgeIngredients, getForgeRecipes,
  getMaxBuyQuantity, getMaxSellQuantity, getSellUnitPrice, getSkillUpgradeCost, sellItems, upgradeSkill, useConsumable,
} from '../game/management';
import { candidateWearers, currentWearers, freeAccessorySlot, previewCraft, previewEquip, type CraftPreview, type HeroChange } from './shopPreview';
import {
  filterForgeEntries, filterShopEntries, forgeEntries, forgeFilterCounts, SHOP_CATEGORY_LABELS, shopEntries, shopFilterCounts,
  type ForgeEntry, type ForgeFilter, type ShopFilter,
} from './shopFilters';
import { getReputationRule, getShopPrice } from '../game/reputation';
import { assets } from '../render/assetManifest';
import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import { skills as SKILL_DEFS, skillById } from '../game/skills';
import { describeSkillFactsAt } from '../game/skillFacts';
import type { GameState, InnateGiftModifier, ItemCategory, ItemDefinition, UnitDefinition, UnitInstance, WeaponDefinition } from '../game/types';
import type { UiSoundFeedback } from './UiSoundPlayer';
import { prefersReducedMotion } from './ReducedMotion';

type ManagementTab = 'clan' | 'inventory' | 'shop' | 'skills';
type ControlFocusKey = { tag: string; attributes: Array<[string, string]> };
/** The fiche a shop line or a forge recipe opens: preview, confirmation, then the result (playtest 2026-11-07). */
interface TradeOutcome { title: string; lines: string[]; change: HeroChange | null; changeHeading: string; equipped: boolean }
/** `quantity` is how many units a purchase or a sale covers, chosen on the fiche and confirmed once (playtest 2026-11-11). */
interface TradeState { kind: 'buy' | 'sell' | 'craft'; id: string; stage: 'preview' | 'confirm' | 'done'; outcome: TradeOutcome | null; revision: number; quantity: number }

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const STATUS_LABELS: Record<string, string> = {
  burn: 'Brûlure',
  poison: 'Poison',
  slow: 'Ralenti',
  root: 'Entravé',
  blind: 'Aveuglement',
  weak: 'Affaibli',
  curse: 'Malédiction',
};

function formatWeaponAffix(weapon: WeaponDefinition): string | null {
  const affix = weapon.basicAttackStatus;
  if (!affix) return null;
  const label = STATUS_LABELS[affix.status] ?? affix.status;
  return `${Math.round(affix.chance * 100)}% ${label} (attaque basique, ${affix.turns}T)`;
}

function formatWeaponAffixShort(weapon: WeaponDefinition): string | null {
  const affix = weapon.basicAttackStatus;
  if (!affix) return null;
  const label = STATUS_LABELS[affix.status] ?? affix.status;
  return `${Math.round(affix.chance * 100)}% ${label}`;
}

interface ManagementViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  onChange: () => void;
  onSound?: UiSoundFeedback;
}

const categoryLabels: Record<ItemCategory, string> = {
  consumables: 'Consommables',
  accessories: 'Accessoires',
  materials: 'Matériaux',
  weapons: 'Armes',
};

interface CharacterAssetProfile {
  full: string;
  ui: string;
  uiCropMode: string;
}

function characterProfile(definition: UnitDefinition): CharacterAssetProfile | undefined {
  const profiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
  return profiles[definition.visualProfileId];
}

function unitFullPortrait(definition: UnitDefinition): string {
  return characterProfile(definition)?.full ?? definition.portrait;
}

function unitUiPortrait(definition: UnitDefinition): string {
  return characterProfile(definition)?.ui ?? definition.portrait;
}

function unitUiCropMode(definition: UnitDefinition): string {
  return characterProfile(definition)?.uiCropMode ?? 'contain';
}

const skillPresentation: Record<string, { name: string; description: string; ap?: number }> = Object.fromEntries(
  SKILL_DEFS.map((s) => [s.id, { name: s.name, description: s.description, ap: s.ap }]),
);
// Legacy fallbacks for enemy/boss skills still used in combat
Object.assign(skillPresentation, {
  whirl: { name: 'Coup Tournoyant', ap: 2, description: 'Frappe en cercle autour de soi.' },
  bulwark: { name: 'Rempart', ap: 2, description: 'Renforce les alliés proches avec une barrière défensive.' },
  provoke: { name: 'Provocation', ap: 1, description: 'Force les ennemis proches à concentrer leur attention.' },
  weaken: { name: 'Flèche Affaiblissante', ap: 1, description: 'Tir précis qui ralentit la cible.' },
  blind_shot: { name: 'Tir Aveuglant', ap: 2, description: 'Réduit la précision de la cible.' },
  pierce_shot: { name: 'Tir Perçant', ap: 2, description: 'Flèche traversante alignée sur la cible.' },
  fireball: { name: 'Boule de Feu', ap: 3, description: 'Explosion magique de feu en zone.' },
  flame_wave: { name: 'Vague de Flammes', ap: 3, description: 'Cône de feu devant le lanceur.' },
  bolt: { name: 'Éclair Sombre', ap: 3, description: 'Décharge magique en zone.' },
  curse: { name: 'Malédiction', ap: 2, description: 'Affaiblit la défense des ennemis touchés.' },
  heal: { name: 'Lumière Salvatrice', ap: 2, description: 'Soigne les alliés dans la zone.' },
  regen: { name: 'Régénération', ap: 2, description: 'Régénère les PV des alliés chaque tour.' },
  bless: { name: 'Bénédiction', ap: 2, description: 'Augmente la force et la magie des alliés.' },
  revive: { name: 'Résurrection', ap: 4, description: 'Relève un allié tombé au combat.' },
  heavy: { name: 'Coup Lourd', ap: 2, description: 'Choc puissant qui peut ralentir.' },
  blink: { name: 'Clignotement', ap: 2, description: 'Repositionnement instantané sur une case libre.' },
  leap: { name: 'Bond', ap: 1, description: 'Déplacement rapide vers une case libre.' },
  charge: { name: 'Charge', ap: 2, description: 'Fonce en ligne droite et perturbe l\u2019arrivée.' },
});

/** The basic attack as the combat runtime resolves it: three levels of élan and a surcharge for each repeat (getSpec). */
const BASIC_ATTACK_TEXT = 'Frappe avec l’arme équipée. Élan : 1, 2 ou 3 PA pour des dégâts ×1, ×1,4 ou ×1,6 (au niveau 3, +10 % de précision et 50 % de la défense ignorée). Chaque attaque de plus dans le même tour coûte 1 PA de plus, jusqu’à une élimination.';
/** A long spear's basic attack reaches the adjacent cells, diagonals included, whatever the weapon's listed range. */
const LONG_SPEAR_REACH = '1 (diagonales comprises)';

function skillFactsFor(skillId: string, level: number): string {
  const def = skillById.get(skillId);
  return def ? describeSkillFactsAt(def, level) : '';
}

function withFacts(text: string, facts: string): string {
  return facts ? `${text}<small class="skill-card__facts">${facts}</small>` : text;
}

export class ManagementView {
  private overlay: HTMLElement | null = null;
  private selectedUnitId = '';
  private activeItemId: string | null = null;
  private activeEquipSlot: { type: 'weapon' | 'accessory'; slot: number } | null = null;
  private previewItemId: string | null = null;
  private trade: TradeState | null = null;
  private renderedTradeKey: string | null = null;
  private tab: ManagementTab = 'clan';
  private shopId = 'valmir';
  private shopMode: 'buy' | 'sell' | 'craft' = 'buy';
  /** View-only list filters (playtest 2026-11-11); never saved, reset each time the register opens. */
  private shopFilters: Record<'buy' | 'sell', ShopFilter> = { buy: 'all', sell: 'all' };
  private forgeFilter: ForgeFilter = 'all';
  private forgeReadyOnly = false;
  private shopEnabled = false;
  private shopOnly = false;
  private skillsEnabled = false;
  private shopWallet: 'temporary' | 'permanent' = 'temporary';
  private returnFocus: HTMLElement | null = null;
  private readonly inertSiblings = new Map<HTMLElement, boolean>();
  private modalReturnFocus: ControlFocusKey | null = null;

  constructor(private readonly options: ManagementViewOptions) {}

  open(initialTab: ManagementTab = 'clan', shopId?: string, shopWallet: 'temporary' | 'permanent' = 'temporary'): Promise<void> {
    this.close();
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.shopEnabled = shopId !== undefined;
    this.shopOnly = initialTab === 'shop' && this.shopEnabled;
    this.skillsEnabled = initialTab === 'skills';
    this.tab = initialTab === 'shop' && !this.shopEnabled
      ? 'clan'
      : initialTab === 'skills' && !this.skillsEnabled
        ? 'clan'
        : initialTab;
    this.shopId = shopId ?? 'valmir';
    this.shopWallet = shopWallet;
    this.shopFilters = { buy: 'all', sell: 'all' };
    this.forgeFilter = 'all';
    this.forgeReadyOnly = false;
    this.selectedUnitId = this.options.getState().clan.members[0]?.id ?? '';
    this.overlay = document.createElement('section');
    this.overlay.className = `management ui-screen ui-screen--dialog${this.shopOnly ? ' management--shop-only' : ''}`;
    applyScreenEnvironment(this.overlay, 'management');
    this.overlay.dataset.reducedMotion = String(prefersReducedMotion(this.options.getState().settings.reducedGraphics));
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Registre de Compagnie');
    this.options.root.append(this.overlay);
    for (const sibling of this.options.root.children) {
      if (sibling instanceof HTMLElement && sibling !== this.overlay) {
        this.inertSiblings.set(sibling, sibling.inert);
        sibling.inert = true;
      }
    }
    this.overlay.addEventListener('keydown', (event) => this.handleKeydown(event));
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
    for (const [sibling, wasInert] of this.inertSiblings) sibling.inert = wasInert;
    this.inertSiblings.clear();
    if (this.returnFocus?.isConnected && !this.returnFocus.closest('[inert]')) this.returnFocus.focus({ preventScroll: true });
    this.returnFocus = null;
    this.activeItemId = null;
    this.activeEquipSlot = null;
    this.previewItemId = null;
    this.trade = null;
    this.renderedTradeKey = null;
    this.modalReturnFocus = null;
  }

  private render(): void {
    if (!this.overlay) return;
    const active = document.activeElement;
    const focusKey = active instanceof HTMLElement && this.overlay.contains(active)
      ? this.controlFocusKey(active) : null;
    const hadModal = Boolean(this.overlay.querySelector('.item-modal'));
    const scrollEls = this.overlay.querySelectorAll<HTMLElement>('.ui-scroll-panel, .shop-view, .inventory-grid, .inventory-view');
    const savedScrolls = Array.from(scrollEls).map((el) => el.scrollTop);
    const state = this.options.getState();
    // The game's motion setting, or the OS request, turns off the register's transitions (UI contract, reduced motion).
    this.overlay.dataset.reducedMotion = String(prefersReducedMotion(state.settings.reducedGraphics));
    const gems = state.inventory.materials.red_gem ?? 0;
    this.overlay.innerHTML = `
      <div class="management__veil"></div>
      <div class="ui-environment-layer ui-environment-layer--fog" aria-hidden="true"></div>
      <div class="management__shell ui-shell ui-shell--management ui-panel">
        <header class="management__header ui-hud">
          <div class="management__brand">
            <span class="management__sigil" aria-hidden="true">✥</span>
            <div><p class="eyebrow ui-eyebrow">Camp du Lion</p><h2>Registre de Compagnie</h2><small>Organisation, équipement et préparation de la compagnie.</small></div>
          </div>
          <div class="management__resources">
            <div class="management__resource ui-chip"><span>Or</span><strong>${state.gold}</strong></div>
            <div class="management__resource ui-chip"><span>Gemmes</span><strong>${gems}</strong></div>
            <div class="management__resource ui-chip"><span>Capacité</span><strong>${state.clan.members.length}/${state.clan.maxSize}</strong></div>
          </div>
          <button class="icon-button ui-icon-button" type="button" data-action="close" aria-label="Fermer">×</button>
        </header>
        <nav class="management__tabs">
          ${this.skillsEnabled
            ? this.tabButton('skills', 'Amélioration')
            : `${this.tabButton('clan', 'Compagnie')}
              ${this.tabButton('inventory', 'Inventaire')}
              ${this.shopEnabled ? this.tabButton('shop', 'Échoppe') : ''}`}
        </nav>
        <div class="management__content">${this.renderContent()}</div>
      </div>
      ${this.activeItemId ? this.renderItemModal() : ''}
      ${this.activeEquipSlot ? this.renderEquipSlotModal() : ''}
      ${this.trade ? this.renderTradeModal() : ''}
    `;
    this.bind();
    this.overlay.querySelectorAll<HTMLElement>('.ui-scroll-panel, .shop-view, .inventory-grid, .inventory-view')
      .forEach((el, i) => { if (savedScrolls[i] !== undefined) el.scrollTop = savedScrolls[i]; });
    const hasModal = Boolean(this.overlay.querySelector('.item-modal'));
    if (hasModal && !hadModal) this.modalReturnFocus = focusKey;
    const shell = this.overlay.querySelector<HTMLElement>('.management__shell');
    if (shell) shell.inert = hasModal;
    const restoreKey = hadModal && !hasModal ? this.modalReturnFocus : focusKey;
    const controls = this.focusableControls();
    const restore = restoreKey && controls.find(control => control.tagName === restoreKey.tag
      && restoreKey.attributes.every(([name, value]) => control.getAttribute(name) === value));
    const tradeKey = this.trade ? `${this.trade.kind}:${this.trade.id}:${this.trade.stage}:${this.trade.revision}` : null;
    const autofocus = tradeKey && tradeKey !== this.renderedTradeKey
      ? this.overlay.querySelector<HTMLElement>('.item-modal [data-autofocus]:not(:disabled)') : null;
    this.renderedTradeKey = tradeKey;
    const listFallback = hadModal && !hasModal && !restore
      ? this.overlay.querySelector<HTMLElement>('.shop-list [data-trade], .craft-list [data-craft]') : null;
    (autofocus || restore || listFallback || controls[0])?.focus({ preventScroll: true });
    if (!hasModal) this.modalReturnFocus = null;
  }

  private controlFocusKey(control: HTMLElement): ControlFocusKey | null {
    const attributes = [...control.attributes].filter(attribute => attribute.name.startsWith('data-'))
      .map(attribute => [attribute.name, attribute.value] as [string, string]);
    return attributes.length ? { tag: control.tagName, attributes } : null;
  }

  private focusableControls(): HTMLElement[] {
    const scope = this.overlay?.querySelector<HTMLElement>('.item-modal') ?? this.overlay;
    return [...scope?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]') ?? []]
      .filter(control => control.tabIndex >= 0 && !control.matches(':disabled') && !control.closest('[inert]')
        && !control.hidden && getComputedStyle(control).display !== 'none' && getComputedStyle(control).visibility !== 'hidden');
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      this.options.onSound?.('back');
      if (this.trade) {
        if (this.trade.stage === 'confirm') { this.trade.stage = 'preview'; this.trade.revision += 1; } else this.trade = null;
        this.render();
      } else if (this.activeEquipSlot) { this.activeEquipSlot = null; this.previewItemId = null; this.render(); }
      else if (this.activeItemId) { this.activeItemId = null; this.render(); }
      else this.close();
      return;
    }
    if ((event.key === '+' || event.key === '-') && this.trade?.stage === 'preview' && this.trade.kind !== 'craft'
      && this.overlay?.querySelector('[data-trade-qty]')) {
      event.preventDefault();
      this.changeTradeQuantity(event.key === '+' ? 'more' : 'less');
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = this.focusableControls();
    const first = controls[0], last = controls.at(-1);
    if (!first || !last) { event.preventDefault(); return; }
    const active = document.activeElement;
    if (!controls.includes(active as HTMLElement) || event.shiftKey && active === first || !event.shiftKey && active === last) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  }

  private tabButton(tab: ManagementTab, label: string): string {
    return `<button type="button" data-tab="${tab}" class="ui-tab ${this.tab === tab ? 'is-active' : ''}">${label}</button>`;
  }

  private renderContent(): string {
    if (this.tab === 'inventory') return this.renderInventory();
    if (this.tab === 'shop') return this.renderShop();
    if (this.tab === 'skills') return this.renderSkillUpgrades();
    return this.renderClan();
  }

  private renderClan(): string {
    const state = this.options.getState();
    const selected = state.clan.members.find((unit) => unit.id === this.selectedUnitId) ?? state.clan.members[0];
    if (!selected) return '<p class="empty-copy">Aucune unité.</p>';
    const definition = unitById.get(selected.definitionId)!;
    const stats = getFinalStats(selected);
    const roster = state.clan.members.map((unit) => {
      const def = unitById.get(unit.definitionId)!;
      const maxHp = getFinalStats(unit).maxHealth;
      const hpClass = unit.currentHealth === 0 ? ' is-fallen' : unit.currentHealth < maxHp ? ' is-wounded' : '';
      return `
        <button type="button" class="roster-card ui-panel ui-panel--dense${hpClass} ${unit.id === selected.id ? 'is-active' : ''}" data-unit="${unit.id}">
          <span class="roster-card__portrait" data-ui-crop="${unitUiCropMode(def)}"><img src="${unitUiPortrait(def)}" alt=""></span>
          <span class="roster-card__body"><strong>${unit.name}</strong><small>${def.className}</small></span>
          <span class="roster-card__hp">${unit.currentHealth}/${maxHp}</span>
          ${unit.narrativeLocked ? '<i title="Unité narrative">◆</i>' : ''}
        </button>`;
    }).join('');
    return `
      <div class="clan-layout ui-split">
        <aside class="roster ui-scroll-panel">
          <div class="roster__header"><div class="section-title ui-section-title">Compagnie</div><span>Membres ${state.clan.members.length}/${state.clan.maxSize}</span></div>
          <div class="roster__list">${roster}</div>
        </aside>
        <section class="unit-stage" data-feature-presentation="MASTER_SHOWCASE" aria-label="Personnage sélectionné">
          <div class="unit-stage__banner" aria-hidden="true"><span>⚜</span></div>
          <div class="unit-stage__aura" aria-hidden="true"></div>
          <div class="unit-stage__figure" data-asset-ownership="MASTER_FULL_BODY"><img src="${unitFullPortrait(definition)}" alt="${selected.name}"></div>
          <div class="unit-stage__base" aria-hidden="true"></div>
          <div class="unit-stage__caption"><span>Unité active</span><strong>${selected.name}</strong></div>
        </section>
        <article class="unit-sheet ui-scroll-panel">
          <div class="unit-sheet__identity">
            <p class="eyebrow ui-eyebrow">${definition.className}</p>
            <h3>${selected.name}</h3>
            <p class="unit-sheet__description">${this.unitDescription(definition)}</p>
          </div>
          <div class="stat-grid">
            ${this.stat('PV', `${selected.currentHealth}/${stats.maxHealth}`)}${this.stat('FOR', stats.strength)}${this.stat('MAG', stats.magic)}
            ${this.stat('END', stats.endurance)}${this.stat('DEX', stats.dexterity)}${this.stat('CHA', stats.charisma)}
            ${this.stat('DÉPL.', stats.moveRange)}
          </div>
          <div class="equipment">
            <div class="section-title ui-section-title">Équipement</div>
            ${this.equipmentSlot(selected, 'weapon', 0)}
            ${([0, 1] as const).map((slot) => this.equipmentSlot(selected, 'accessory', slot)).join('')}
          </div>
          <div class="skills">
            <div class="section-title ui-section-title">Capacités de combat</div>
            ${this.renderSkills(selected)}
          </div>
        </article>
      </div>`;
  }

  private equipmentSlot(unit: UnitInstance, type: 'weapon' | 'accessory', slot: number): string {
    const currentId = type === 'weapon'
      ? unit.equipment.weaponIds[slot]!
      : unit.equipment.accessoryIds[slot as 0 | 1] ?? null;
    const item = currentId ? itemById.get(currentId) : null;
    const weaponTier = type === 'weapon' && currentId ? weaponById.get(currentId)?.tier : undefined;
    const label = type === 'weapon' ? `Arme${weaponTier !== undefined ? ` · ${weaponTierLabel(weaponTier)}` : ''}` : `Accessoire ${slot + 1}`;
    const icon = item?.icon ?? (type === 'weapon' ? '⚔' : '◇');
    const name = item?.name ?? 'Emplacement vide';
    return `<button type="button" class="equipment-slot ui-panel ui-panel--dense" data-equip-slot="${type}" data-equip-slot-index="${slot}">
      <span class="equipment-slot__icon">${icon}</span>
      <span class="equipment-slot__body"><span class="equipment-slot__label">${label}</span><strong>${name}</strong></span>
      ${item ? `<span class="equipment-slot__hint">⚙</span>` : '<span class="equipment-slot__hint">+</span>'}
    </button>`;
  }

  private renderEquipSlotModal(): string {
    const slot = this.activeEquipSlot!;
    const state = this.options.getState();
    const unit = state.clan.members.find((u) => u.id === this.selectedUnitId);
    if (!unit) return '';
    const currentId = slot.type === 'weapon'
      ? unit.equipment.weaponIds[slot.slot]!
      : unit.equipment.accessoryIds[slot.slot as 0 | 1] ?? null;
    const currentItem = currentId ? itemById.get(currentId) : null;
    const currentWeapon = currentItem?.category === 'weapons' ? weaponById.get(currentItem.id) ?? null : null;
    const previewItem = this.previewItemId ? itemById.get(this.previewItemId) : null;
    const available = this.getAvailableItemsForSlot(unit, slot.type, currentId);
    const isWeaponSlot = slot.type === 'weapon';
    const slotLabel = isWeaponSlot ? 'Arme' : `Accessoire ${slot.slot + 1}`;
    const statsClass = (item: ItemDefinition) => item.category === 'weapons' ? 'item-modal__weapon-details' : 'item-modal__stats';
    return `<div class="item-modal-overlay" data-equip-slot-close>
      <div class="item-modal ui-panel weapon-modal" role="dialog" aria-modal="true" aria-label="Équipement">
        <button type="button" class="icon-button ui-icon-button" data-equip-slot-close aria-label="Fermer">×</button>
        ${previewItem ? `
          <div class="weapon-modal__header">
            <span class="item-row__icon ui-chip">${previewItem.icon}</span>
            <div class="weapon-modal__title-block">
              <h3 class="weapon-modal__title">${previewItem.name}</h3>
              <small class="weapon-modal__subtitle">${previewItem.description}</small>
            </div>
          </div>
          <div class="${statsClass(previewItem)}">${this.itemStatRows(previewItem, currentWeapon ?? undefined, unit)}</div>
          <div class="weapon-modal__actions">
            <button type="button" class="ui-button ui-button--secondary" data-preview-back>← Retour</button>
            <button type="button" class="ui-button" data-equip-confirm="${previewItem.id}" aria-label="${escapeAttribute(`Équiper ${previewItem.name} pour ${unit.name}`)}">Équiper</button>
          </div>
        ` : `
          <div class="weapon-modal__header">
            <span class="item-row__icon ui-chip">${currentItem?.icon ?? '◇'}</span>
            <div class="weapon-modal__title-block">
              <h3 class="weapon-modal__title">${currentItem ? currentItem.name : slotLabel}</h3>
              ${currentItem
                ? `<small class="weapon-modal__status">${isWeaponSlot ? 'Arme équipée' : 'Accessoire équipé'}</small>`
                : '<small class="weapon-modal__subtitle">Emplacement vide</small>'}
            </div>
          </div>
          ${currentItem ? `<div class="${statsClass(currentItem)}">${this.itemStatRows(currentItem, undefined, unit)}</div>` : '<p class="empty-copy">Aucun objet équipé.</p>'}
          ${!isWeaponSlot && currentItem ? `<button type="button" class="ui-button ui-button--secondary" data-equip-unequip="${slot.type}" data-equip-unequip-slot="${slot.slot}">Retirer</button>` : ''}
          <div class="weapon-modal__replacement-section">
            <div class="weapon-modal__section-title">Remplacer par</div>
            ${available.length > 0
              ? `<div class="weapon-replacement-list">${available.map((item) => this.renderReplacementCard(item, currentWeapon, unit)).join('')}</div>`
              : `<p class="empty-copy">${isWeaponSlot ? `Aucune autre arme pour ${unit.name} dans le sac.` : 'Aucun autre accessoire dans le sac.'} L’échoppe et la forge du refuge en proposent ; une arme forgée à partir de celle que porte le héros est équipée aussitôt.</p>`}
          </div>
        `}
      </div>
    </div>`;
  }

  private weaponStatRow(label: string, value: string, delta?: number): string {
    const deltaHtml = delta !== undefined && delta !== 0
      ? `<span class="weapon-modal__stat-delta ${delta > 0 ? 'weapon-modal__stat-delta--positive' : 'weapon-modal__stat-delta--negative'}">${delta > 0 ? '+' : ''}${delta}</span>`
      : '';
    return `<div class="weapon-modal__stat-row"><span class="weapon-modal__stat-label">${label}</span><span class="weapon-modal__stat-value">${value}</span>${deltaHtml}</div>`;
  }

  private getWeaponProgressionLabel(weapon: WeaponDefinition, unit?: UnitInstance): string {
    const opened = unit ? getWeaponOpenedSkill(weapon, unit) : null;
    if (opened) return `${weapon.tier <= 0 ? 'Disponible' : 'Débloque'} : ${opened.name} — ${opened.ap} PA`;
    if (!unit) {
      const named = describeItemSkillEffects(weapon.id).join(' · ');
      if (named) return named;
    }
    return getWeaponSkillUnlockLabel(weapon);
  }

  private renderReplacementCard(item: ItemDefinition, currentWeapon: WeaponDefinition | null, unit: UnitInstance | null): string {
    if (item.category === 'weapons' && unit) {
      const weapon = weaponById.get(item.id);
      if (!weapon) return '';
      const tierLabel = weaponTierLabel(weapon.tier ?? 0);
      const profileLabel = getWeaponProfileLabel(weapon);
      const opened = getWeaponOpenedSkill(weapon, unit);
      const skillShort = opened ? `${opened.name} ${opened.ap} PA` : getWeaponSkillUnlockLabel(weapon);
      const metaParts: string[] = [`${tierLabel} · ${profileLabel}`];
      if (skillShort) metaParts.push(skillShort);
      if (currentWeapon) {
        const dDmg = weapon.damage - currentWeapon.damage;
        const dHp = (weapon.healthBonus ?? 0) - (currentWeapon.healthBonus ?? 0);
        const dAcc = weapon.accuracyBonus - currentWeapon.accuracyBonus;
        if (dDmg !== 0) metaParts.push(`${dDmg > 0 ? '+' : ''}${dDmg} Puiss.`);
        if (dHp !== 0) metaParts.push(`${dHp > 0 ? '+' : ''}${dHp} PV`);
        if (dAcc !== 0) metaParts.push(`${dAcc > 0 ? '+' : ''}${dAcc} Précis.`);
      }
      const affixShort = formatWeaponAffixShort(weapon);
      if (affixShort) metaParts.push(affixShort);
      return `<button type="button" class="weapon-replacement-row" data-preview-item="${item.id}">
        <span class="item-row__icon ui-chip">${item.icon}</span>
        <span class="weapon-replacement-main">
          <strong>${item.name}</strong>
          <small class="weapon-replacement-meta">${metaParts.join(' · ')}</small>
        </span>
      </button>`;
    }
    if (item.category === 'accessories') {
      const metaParts: string[] = [];
      const modifiers = item.modifiers ?? {};
      const labels: Record<string, string> = { maxHealth: 'PV', strength: 'FOR', magic: 'MAG', endurance: 'END', dexterity: 'DEX', charisma: 'CHA', moveRange: 'DÉPL.' };
      for (const [key, value] of Object.entries(modifiers)) {
        metaParts.push(`+${value} ${labels[key] ?? key}`);
      }
      const granted = item.skillModifier?.grants ?? [];
      if (granted.length > 0) {
        metaParts.push(granted.map((id) => skillPresentation[id]?.name ?? id).join(', '));
      }
      const swap = this.skillSwapLabel(item, unit);
      if (swap) metaParts.push(swap);
      if (item.innateGiftModifier) {
        metaParts.push(`Améliore ${item.innateGiftModifier.label}`);
      }
      return `<button type="button" class="weapon-replacement-row" data-preview-item="${item.id}">
        <span class="item-row__icon ui-chip">${item.icon}</span>
        <span class="weapon-replacement-main">
          <strong>${item.name}</strong>
          <small class="weapon-replacement-meta">${metaParts.join(' · ') || 'Aucun bonus'}</small>
        </span>
      </button>`;
    }
    return `<button type="button" class="weapon-replacement-row" data-preview-item="${item.id}"><span class="item-row__icon ui-chip">${item.icon}</span><span class="weapon-replacement-main"><strong>${item.name}</strong><small class="weapon-replacement-meta">${item.description}</small></span></button>`;
  }

  private getAvailableItemsForSlot(unit: UnitInstance, type: 'weapon' | 'accessory', currentId: string | null): ItemDefinition[] {
    const state = this.options.getState();
    if (type === 'weapon') {
      const definition = unitById.get(unit.definitionId)!;
      const equipped = new Set(unit.equipment.weaponIds);
      return weapons.filter((w) =>
        definition.allowedWeaponIds.includes(w.id)
        && !equipped.has(w.id)
        && (state.inventory.weapons[w.id] ?? 0) > 0);
    }
    return items.filter((item) =>
      item.category === 'accessories'
      && item.id !== currentId
      && (state.inventory.accessories[item.id] ?? 0) > 0);
  }

  private stat(label: string, value: number | string): string {
    return `<div class="ui-stat"><span>${label}</span><strong>${value}</strong></div>`;
  }

  private renderSkills(unit: UnitInstance): string {
    const skillIds = getResolvedSkills(unit);
    const apt = getInnateGift(unit.definitionId);

    const activeSkills = skillIds.filter((id) => {
      const s = skillPresentation[id];
      return s && s.ap !== undefined && s.ap < 5 && isSkillUnlockedForHero(unit, id);
    }).sort((a, b) => (skillPresentation[a]?.ap ?? 0) - (skillPresentation[b]?.ap ?? 0));
    const actionsSection = `<div class="unit-skill-section">
      <div class="unit-skill-section__title">Action de base</div>
      <div class="skill-list">
        <article class="skill-card skill-card--active" tabindex="0" aria-label="${escapeAttribute(`Attaque de base, 1 à 3 PA. ${BASIC_ATTACK_TEXT}`)}"><div><strong>Attaque de base</strong><span>1-3 PA</span></div><p>${BASIC_ATTACK_TEXT}</p></article>
      </div>
    </div>`;

    const innateSection = apt ? `<div class="unit-skill-section">
      <div class="unit-skill-section__title">Don inné</div>
      <article class="skill-card skill-card--passive" tabindex="0" aria-label="${escapeAttribute(`Don inné : ${apt.name}. ${apt.description}`)}">
        <div><strong>${apt.name}</strong><span class="skill-badge--passive">Passif</span></div>
        <p>${apt.description}</p>
        <small class="skill-card__hint">Disponible dès le début</small>
      </article>
    </div>` : '';

    const lockedSkills = skillIds.filter((id) => {
      const s = skillPresentation[id];
      return s && s.ap !== undefined && s.ap < 5 && !isSkillUnlockedForHero(unit, id);
    }).sort((a, b) => (skillPresentation[a]?.ap ?? 0) - (skillPresentation[b]?.ap ?? 0));
    const lockedRows = lockedSkills.map((id) => {
      const s = skillPresentation[id]!;
      const reason = getLockedSkillReason(unit, id);
      return `<div class="unit-skill-locked-row" tabindex="0" aria-label="${escapeAttribute(`${s.name}, ${s.ap} PA, ${reason}`)}"><strong>${s.name}</strong><span>${s.ap} PA</span><small>${reason}</small></div>`;
    }).join('');
    // Every entry of the sheet takes focus, so a keyboard or a gamepad reaches and scrolls to it (OD-2026-11-07-B note).
    const unlockedCards = activeSkills.map((id) => {
      const s = skillPresentation[id]!;
      const facts = skillFactsFor(id, unit.skillUpgrades[id] ?? 0);
      return `<article class="skill-card skill-card--active" tabindex="0" aria-label="${escapeAttribute(`${s.name}, ${s.ap} PA, disponible. ${s.description} ${facts}`)}"><div><strong>${s.name}</strong><span>${s.ap} PA</span></div><p>${s.description}</p>${facts ? `<small class="skill-card__facts">${facts}</small>` : ''}</article>`;
    }).join('');
    const hasTechniques = activeSkills.length > 0 || lockedSkills.length > 0;
    const techniquesSection = hasTechniques ? `<div class="unit-skill-section">
      <div class="unit-skill-section__title">Compétences</div>
      <small class="unit-skill-section__hint">${WEAPON_TIER_RULE}</small>
      ${activeSkills.length > 0 ? `<div class="skill-list">${unlockedCards}</div>` : ''}
      ${lockedSkills.length > 0 ? `<div class="unit-skill-locked-list">${lockedRows}</div>` : ''}
    </div>` : '';

    const ultimateSkills = skillIds.filter((id) => {
      const s = skillPresentation[id];
      return s && s.ap !== undefined && s.ap >= 5;
    });
    const ultimateCards = ultimateSkills.map((id) => {
      const s = skillPresentation[id]!;
      return `<article class="skill-card skill-card--ultimate" tabindex="0" aria-label="${escapeAttribute(`${s.name}, ${s.ap} PA, éveil spécial requis. ${s.description}`)}"><div><strong>${s.name}</strong><span>${s.ap} PA</span></div><p>${s.description}</p><small class="skill-card__lock">Éveil spécial requis</small></article>`;
    }).join('');
    const ultimateSection = ultimateSkills.length > 0 ? `<div class="unit-skill-section">
      <div class="unit-skill-section__title">Ultime</div>
      <div class="skill-list">${ultimateCards}</div>
    </div>` : '';

    return actionsSection + innateSection + techniquesSection + ultimateSection;
  }

  private renderSkillUpgrades(): string {
    const state = this.options.getState();
    const selected = state.clan.members.find((unit) => unit.id === this.selectedUnitId) ?? state.clan.members[0];
    if (!selected) return '<p class="empty-copy">Aucune unité.</p>';
    const definition = unitById.get(selected.definitionId)!;
    const skills = getResolvedSkills(selected).filter((id) => isSkillUnlockedForHero(selected, id));
    const gems = state.inventory.materials.red_gem ?? 0;
    const rows = skills.map((skillId) => {
      const skill = skillPresentation[skillId] ?? { name: skillId, description: 'Compétence disponible en combat.' };
      const level = Math.max(0, Math.min(2, selected.skillUpgrades[skillId] ?? 0));
      const cost = getSkillUpgradeCost(level);
      const disabled = cost === null || gems < cost;
      const effect = withFacts(this.skillUpgradeEffect(skillId, level), skillFactsFor(skillId, level));
      const next = cost === null ? 'Niveau maximal atteint.' : withFacts(this.skillUpgradeEffect(skillId, level + 1), skillFactsFor(skillId, level + 1));
      return `<article class="skill-upgrade-card ui-panel ui-panel--soft">
        <div class="skill-upgrade-card__head">
          <div><strong>${skill.name}</strong><small>${skill.description}</small></div>
          <span class="ui-chip">Niv. ${level}/2</span>
        </div>
        <div class="skill-upgrade-card__body">
          <p><b>Actuel</b> ${effect}</p>
          <p><b>Prochain</b> ${next}</p>
        </div>
        <button type="button" class="ui-button ui-button--secondary" data-upgrade-skill="${skillId}" aria-label="${escapeAttribute(`Améliorer ${skill.name} pour ${selected.name} · ${cost === null ? 'niveau maximal atteint' : `${cost} gemme${cost > 1 ? 's' : ''}`}`)}" ${disabled ? 'disabled' : ''}>
          ${cost === null ? 'Amélioration max' : `Améliorer · ${cost} gemme${cost > 1 ? 's' : ''}`}
        </button>
      </article>`;
    }).join('');
    return `<div class="skills-view">
      <aside class="roster ui-scroll-panel">
        <div class="roster__header"><div class="section-title ui-section-title">Compagnie</div><span>Gemmes ${gems}</span></div>
        <div class="roster__list">${state.clan.members.map((unit) => {
          const def = unitById.get(unit.definitionId)!;
          return `<button type="button" class="roster-card ui-panel ui-panel--dense ${unit.id === selected.id ? 'is-active' : ''}" data-unit="${unit.id}">
            <span class="roster-card__portrait" data-ui-crop="${unitUiCropMode(def)}"><img src="${unitUiPortrait(def)}" alt=""></span>
            <span class="roster-card__body"><strong>${unit.name}</strong><small>${def.className}</small></span>
          </button>`;
        }).join('')}</div>
      </aside>
      <section class="skills-view__tree ui-scroll-panel">
        <div class="unit-sheet__identity">
          <p class="eyebrow ui-eyebrow">${definition.className}</p>
          <h3>${selected.name}</h3>
          <p class="unit-sheet__description">Dépensez des gemmes rouges pour renforcer les compétences ouvertes de ce héros. Une arme de palier supérieur en ouvre d’autres.</p>
        </div>
        <div class="skill-upgrade-list">${rows || '<p class="empty-copy">Aucune compétence à améliorer.</p>'}</div>
      </section>
    </div>`;
  }

  private skillUpgradeEffect(skillId: string, level: number): string {
    if (level <= 0) return 'Effet de base.';
    const def = SKILL_DEFS.find((s) => s.id === skillId);
    if (def) {
      const up = level === 1 ? def.upgradeLevel1 : def.upgradeLevel2;
      if (up) return up.description;
    }
    // Legacy fallback
    const damageSkills = new Set(['whirl', 'weaken', 'blind_shot', 'pierce_shot', 'fireball', 'flame_wave', 'bolt', 'heavy', 'charge']);
    if (damageSkills.has(skillId)) return `Puissance +${level === 1 ? 2 : 4}.`;
    if (skillId === 'heal') return `Soins +${level === 1 ? 10 : 20}%.`;
    if (skillId === 'revive') return `Relève à ${level === 1 ? 60 : 70}% PV.`;
    if (['blink', 'leap'].includes(skillId)) return `Portée maximale +${level}${level >= 2 ? ', coût optimisé si possible' : ''}.`;
    return level === 1 ? 'Durée +1 tour si applicable.' : 'Durée +1 tour et efficacité légèrement renforcée.';
  }

  private unitDescription(definition: UnitDefinition): string {
    const descriptions: Record<UnitDefinition['combatKind'], string> = {
      knight: 'Combattant de première ligne robuste et défenseur loyal. Protège ses alliés et contrôle le champ de bataille.',
      cleric: 'Soutien spirituel de la compagnie. Préserve l’escouade et renforce les lignes fragiles.',
      mage: 'Arcaniste à haute pression. Excelle dans les dégâts magiques et le contrôle tactique.',
      archer: 'Tireur mobile et précis. Harcèle les cibles clés depuis les lignes sûres.',
      rogue: 'Éclaireur furtif à dextérité supérieure. Repère, affaiblit et frappe les cibles vulnérables.',
    };
    return descriptions[definition.combatKind];
  }

  private renderInventory(): string {
    const state = this.options.getState();
    return `<div class="inventory-view">${(Object.keys(categoryLabels) as ItemCategory[]).map((category) => {
      const rows = Object.entries(state.inventory[category]).filter(([, quantity]) => quantity > 0);
      return `<section class="inventory-group ui-panel ui-panel--soft"><div class="section-title ui-section-title">${categoryLabels[category]}</div>
        ${rows.length ? rows.map(([id, quantity]) => this.itemRow(id, quantity, category === 'consumables' ? this.consumableAction(id) : '')).join('') : `<p class="empty-copy">Aucun objet dans le sac.${category === 'weapons' || category === 'accessories' ? ' Les objets équipés figurent sur la fiche de chaque héros (onglet Compagnie).' : ''}</p>`}
      </section>`;
    }).join('')}</div>`;
  }

  private consumableAction(itemId: string): string {
    const state = this.options.getState();
    if (itemId === 'revive_vial') {
      const fallen = state.clan.members.filter((unit) => unit.currentHealth === 0);
      if (fallen.length === 0) return '';
      const options = fallen.map((unit) => {
        const maxHealth = getFinalStats(unit).maxHealth;
        return `<option value="${unit.id}">${unit.name} (0/${maxHealth})</option>`;
      }).join('');
      return `<span class="item-row__action"><select data-use-unit="${itemId}" aria-label="Unité à ranimer avec ${escapeAttribute(itemById.get(itemId)!.name)}"><option value="">— Ranimer —</option>${options}</select><button type="button" class="ui-button ui-button--secondary" data-use-item="${itemId}" aria-label="Utiliser ${escapeAttribute(itemById.get(itemId)!.name)} sur l’unité sélectionnée">Utiliser</button></span>`;
    }
    if (itemId === 'potion') {
      const wounded = state.clan.members.filter((unit) => unit.currentHealth > 0 && unit.currentHealth < getFinalStats(unit).maxHealth);
      if (wounded.length === 0) return '';
      const options = wounded.map((unit) => {
        const maxHealth = getFinalStats(unit).maxHealth;
        return `<option value="${unit.id}">${unit.name} (${unit.currentHealth}/${maxHealth})</option>`;
      }).join('');
      return `<span class="item-row__action"><select data-use-unit="${itemId}" aria-label="Unité à soigner avec ${escapeAttribute(itemById.get(itemId)!.name)}"><option value="">— Soigner —</option>${options}</select><button type="button" class="ui-button ui-button--secondary" data-use-item="${itemId}" aria-label="Utiliser ${escapeAttribute(itemById.get(itemId)!.name)} sur l’unité sélectionnée">Utiliser</button></span>`;
    }
    return '';
  }

  private itemRow(id: string, quantity: number, action = ''): string {
    const item = itemById.get(id);
    if (!item) return '';
    const hasDetails = item.category === 'weapons' || item.category === 'accessories';
    const detailsClass = hasDetails ? ' item-row--details' : '';
    const tier = item.category === 'weapons' ? weaponById.get(id)?.tier : undefined;
    const skillLine = hasDetails ? describeItemSkillEffects(id).join(' · ') : '';
    const content = `<span class="item-row__icon ui-chip" aria-hidden="true">${item.icon}</span>
      <span class="item-row__body"><strong>${item.name}${tier !== undefined ? ` <span class="item-row__tier">${weaponTierLabel(tier)}</span>` : ''}</strong><small>${item.description}</small>${skillLine ? `<small class="item-row__skill">${skillLine}</small>` : ''}</span>`;
    return `<div class="item-row ui-panel ui-panel--dense${detailsClass}">
      ${hasDetails ? `<button type="button" class="item-row__details" data-item-details="${id}" aria-label="${escapeAttribute(`Voir les détails de ${item.name}`)}">${content}</button>` : content}
      <b>×${quantity}</b>${action}
    </div>`;
  }

  private renderItemModal(): string {
    const item = this.activeItemId ? itemById.get(this.activeItemId) : null;
    if (!item) return '';
    return `<div class="item-modal-overlay" data-item-modal-close>
      <div class="item-modal ui-panel weapon-modal" role="dialog" aria-modal="true" aria-label="Détails de l’objet">
        <button type="button" class="icon-button ui-icon-button" data-item-modal-close aria-label="Fermer">×</button>
        <div class="weapon-modal__header">
          <span class="item-row__icon ui-chip">${item.icon}</span>
          <div class="weapon-modal__title-block">
            <h3 class="weapon-modal__title">${item.name}</h3>
            <small class="weapon-modal__subtitle">${item.description}</small>
          </div>
        </div>
        <div class="${item.category === 'weapons' ? 'item-modal__weapon-details' : 'item-modal__stats'}">
          ${this.itemStatRows(item)}
        </div>
      </div>
    </div>`;
  }

  private itemStatRows(item: ItemDefinition, comparisonWeapon?: WeaponDefinition, unit?: UnitInstance): string {
    if (item.category === 'weapons') {
      return this.renderWeaponDetails(item, comparisonWeapon, unit);
    }
    if (item.category === 'accessories') {
      return this.renderAccessoryDetails(item, unit);
    }
    return '';
  }

  /** An item's skill swaps, limited to the skills this hero has: "Brise-Garde devient Lame Maudite". */
  private skillSwapLabel(item: ItemDefinition, unit?: UnitInstance | null): string {
    const base = unit ? unitById.get(unit.definitionId)?.skillIds ?? [] : null;
    return Object.entries(item.skillModifier?.replaces ?? {})
      .filter(([source]) => (!base || base.includes(source)) && (skillPresentation[source]?.ap ?? 0) < 5)
      .map(([source, replacement]) => `${skillPresentation[source]?.name ?? source} devient ${skillPresentation[replacement]?.name ?? replacement}`)
      .join(', ');
  }

  private renderAccessoryDetails(item: ItemDefinition, unit?: UnitInstance): string {
    const modifiers = item.modifiers ?? {};
    const labels: Record<string, string> = {
      maxHealth: 'PV', strength: 'FOR', magic: 'MAG', endurance: 'END',
      dexterity: 'DEX', charisma: 'CHA', moveRange: 'DÉPL.',
    };
    const statRows = Object.entries(modifiers).map(([key, value]) =>
      this.weaponStatRow(labels[key] ?? key, `+${value}`)
    ).join('');
    const granted = item.skillModifier?.grants ?? [];
    const grantedLabel = [
      granted.map((id) => skillPresentation[id]?.name ?? id).join(', '),
      this.skillSwapLabel(item, unit),
    ].filter(Boolean).join(' · ');
    const innate = item.innateGiftModifier;
    return `<div class="weapon-modal__body">
      ${statRows ? `<div class="weapon-modal__stat-list">${statRows}</div>` : '<p class="empty-copy">Aucun bonus statistique.</p>'}
      ${grantedLabel ? `<div class="weapon-modal__progression"><span class="weapon-modal__progression-label">Effet spécial</span><p>${grantedLabel}</p></div>` : ''}
      ${innate ? this.renderInnateGiftModifierSection(innate) : ''}
    </div>`;
  }

  private renderInnateGiftModifierSection(modifier: InnateGiftModifier): string {
    return `<div class="weapon-modal__innate-modifier">
      <span class="weapon-modal__innate-modifier-label">Améliore le don inné</span>
      <strong>${modifier.label}</strong>
      <p>${modifier.description}</p>
    </div>`;
  }

  private renderWeaponDetails(item: ItemDefinition, comparisonWeapon?: WeaponDefinition, unit?: UnitInstance): string {
    const weapon = weaponById.get(item.id);
    if (!weapon) return '';
    const tierLabel = weaponTierLabel(weapon.tier ?? 0);
    const profileLabel = getWeaponProfileLabel(weapon);
    const progressionLabel = this.getWeaponProgressionLabel(weapon, unit);
    const rangeLabel = weapon.type === 'long_spear' ? LONG_SPEAR_REACH : weapon.minRange ? `${weapon.minRange}–${weapon.range}` : `${weapon.range}`;
    const showRange = weapon.range > 1 || weapon.minRange;
    const cmp = comparisonWeapon;
    const statRows = [
      this.weaponStatRow('Puissance', `${weapon.damage}`, cmp ? weapon.damage - cmp.damage : undefined),
      weapon.healthBonus ? this.weaponStatRow('PV', `+${weapon.healthBonus}`, cmp ? weapon.healthBonus - (cmp.healthBonus ?? 0) : undefined) : '',
      showRange ? this.weaponStatRow('Portée', rangeLabel) : '',
      this.weaponStatRow('Précision', `+${weapon.accuracyBonus}`, cmp ? weapon.accuracyBonus - cmp.accuracyBonus : undefined),
      this.weaponStatRow('Critique', `+${weapon.critBonus}`, cmp ? weapon.critBonus - cmp.critBonus : undefined),
    ].filter(Boolean).join('');
    const affixText = formatWeaponAffix(weapon);
    const swapText = this.skillSwapLabel(item, unit);
    return `<div class="weapon-modal__body">
      <div class="weapon-modal__badges">
        <span class="weapon-modal__tier-badge">${tierLabel}</span>
        <span class="weapon-modal__profile-badge">${profileLabel}</span>
      </div>
      <div class="weapon-modal__stat-list">${statRows}</div>
      ${affixText ? `<div class="weapon-modal__affix"><span class="weapon-modal__progression-label">Altération</span><p>${affixText}</p></div>` : ''}
      ${swapText ? `<div class="weapon-modal__progression"><span class="weapon-modal__progression-label">Effet spécial</span><p>${swapText}</p></div>` : ''}
      <div class="weapon-modal__progression">
        <span class="weapon-modal__progression-label">Progression</span>
        <p>${progressionLabel}</p>
        <small class="weapon-modal__tier-rule">${WEAPON_TIER_RULE}</small>
      </div>
    </div>`;
  }

  private shopToggle(): string {
    const tab = (mode: 'buy' | 'sell' | 'craft', label: string) =>
      `<button type="button" data-shop-mode="${mode}" class="ui-tab ${this.shopMode === mode ? 'is-active' : ''}">${label}</button>`;
    return `<div class="shop-toggle">${tab('buy', 'Acheter')}${tab('sell', 'Vendre')}${tab('craft', 'Forge')}</div>`;
  }

  private renderShop(): string {
    const state = this.options.getState();
    if (this.shopMode === 'craft') return this.renderForge();
    const mode = this.shopMode;
    const buying = mode === 'buy';
    // OD-2026-11-05-D: the shop offers only what the company can use; selling still lists everything carried.
    const entries = shopEntries(state, this.shopId, mode);
    const filter = this.shopFilters[mode];
    const shown = filterShopEntries(entries, filter);
    const groups = filter === 'all'
      ? [...new Set(shown.map((entry) => entry.category))].map((category) => ({ category, rows: shown.filter((entry) => entry.category === category) }))
      : [{ category: filter, rows: shown }];
    const rows = groups.map(({ category, rows: lines }) => lines.length ? `<section class="shop-group" aria-label="${escapeAttribute(`${SHOP_CATEGORY_LABELS[category]} · ${lines.length}`)}">
        ${filter === 'all' ? `<p class="shop-group__title">${SHOP_CATEGORY_LABELS[category]} <span>${lines.length}</span></p>` : ''}
        ${lines.map((entry) => this.shopRow(entry.id, entry.quantity)).join('')}
      </section>` : '').join('');
    const chips = shopFilterCounts(entries, filter).map(({ filter: value, count }) =>
      this.filterChip('data-shop-filter', value, value === 'all' ? 'Tout' : SHOP_CATEGORY_LABELS[value], count, filter === value, 'article')).join('');
    const intro = buying
      ? `Choisissez un article : sa fiche montre ce qu’il change pour chaque héros, la quantité à prendre et le prix total, puis vous confirmez l’achat. ${WEAPON_TIER_RULE}`
      : 'Choisissez un objet du sac : sa fiche montre le prix de vente et la quantité à vendre, puis vous confirmez la vente.';
    const empty = entries.length ? 'Aucun article de ce type.' : buying ? 'Aucun article disponible.' : 'Le sac est vide.';
    return `<div class="shop-view">
      <div class="shop-view__intro"><div><p class="eyebrow ui-eyebrow">Échoppe du refuge · ${getReputationRule(state.reputation).label}</p><h3>Le Comptoir du Cerf</h3><small>${intro}</small></div>
        ${this.shopToggle()}
      </div>
      <div class="shop-filters" role="group" aria-label="${buying ? 'Filtrer les articles par type' : 'Filtrer le sac par type'}">${chips}</div>
      <div class="shop-list">${rows || `<p class="empty-copy">${empty}</p>`}</div>
    </div>`;
  }

  /** One filter button: a toggle that says what it shows and how many lines, never an action on game truth. */
  private filterChip(attribute: string, value: string, label: string, count: number, pressed: boolean, noun: string): string {
    const spoken = `${label} · ${count} ${noun}${count > 1 ? 's' : ''}`;
    return `<button type="button" class="shop-filter${pressed ? ' is-active' : ''}" ${attribute}="${value}" aria-pressed="${pressed}" aria-label="${escapeAttribute(spoken)}">${label} <span class="shop-filter__count">${count}</span></button>`;
  }

  /** One shop line. It opens the item's fiche; nothing is bought or sold before the fiche's confirmation (playtest 2026-11-07). */
  private shopRow(id: string, quantity: number): string {
    const state = this.options.getState();
    const item = itemById.get(id);
    if (!item) return '';
    const buying = this.shopMode === 'buy';
    const price = buying ? getShopPrice(item.price, state.reputation) : Math.floor(item.price / 2);
    const tier = item.category === 'weapons' ? weaponById.get(id)?.tier : undefined;
    const skillLine = item.category === 'weapons' || item.category === 'accessories' ? describeItemSkillEffects(id).join(' · ') : '';
    const owned = state.inventory[item.category][id] ?? 0;
    const tags: string[] = [];
    if (buying && state.gold < price) tags.push('<em class="shop-row__tag is-short">Or insuffisant</em>');
    if (buying && owned > 0) tags.push(`<em class="shop-row__tag">Dans le sac : ${owned}</em>`);
    const wearers = buying ? currentWearers(state, id).map((unit) => unit.name) : [];
    if (wearers.length) tags.push(`<em class="shop-row__tag">Équipé : ${wearers.join(', ')}</em>`);
    const label = `${item.name} · ${buying ? `${price} or · voir et acheter` : `vente ${price} or · voir et vendre`}`;
    return `<button type="button" class="shop-row" data-trade="${this.shopMode}" data-item="${id}" aria-label="${escapeAttribute(label)}">
      <span class="item-row__icon ui-chip" aria-hidden="true">${item.icon}</span>
      <span class="shop-row__body"><strong>${item.name}${tier !== undefined ? ` <span class="item-row__tier">${weaponTierLabel(tier)}</span>` : ''}</strong><small>${item.description}</small>${skillLine ? `<small class="item-row__skill">${skillLine}</small>` : ''}${tags.length ? `<span class="shop-row__tags">${tags.join('')}</span>` : ''}</span>
      <span class="shop-row__side"><small>${buying ? 'En stock' : 'Dans le sac'} ×${quantity}</small><span class="shop-row__price">${buying ? '' : '+'}${price} or</span></span>
    </button>`;
  }

  private renderForge(): string {
    const state = this.options.getState();
    const entries = forgeEntries(state);
    const { ready, later } = filterForgeEntries(entries, this.forgeFilter, this.forgeReadyOnly);
    const group = (title: string, list: ForgeEntry[], modifier: string) => list.length
      ? `<section class="craft-group craft-group--${modifier}" aria-label="${escapeAttribute(`${title} · ${list.length}`)}">
          <p class="shop-group__title">${title} <span>${list.length}</span></p>
          <div class="craft-list">${list.map((entry) => this.craftCard(entry.recipe.id)).join('')}</div>
        </section>`
      : '';
    const labels: Record<ForgeFilter, string> = { all: 'Tout', weapons: 'Armes', accessories: 'Accessoires' };
    const chips = forgeFilterCounts(entries, this.forgeReadyOnly).map(({ filter, count }) =>
      this.filterChip('data-forge-filter', filter, labels[filter], count, this.forgeFilter === filter, 'recette')).join('');
    const readyCount = filterForgeEntries(entries, this.forgeFilter, true).ready.length;
    const readyToggle = `<button type="button" class="shop-filter shop-filter--toggle${this.forgeReadyOnly ? ' is-active' : ''}" data-forge-ready aria-pressed="${this.forgeReadyOnly}" aria-label="${escapeAttribute(`Seulement ce qui est forgeable maintenant · ${readyCount} recette${readyCount > 1 ? 's' : ''}`)}"><span aria-hidden="true">${this.forgeReadyOnly ? '☑' : '☐'}</span> Forgeable maintenant <span class="shop-filter__count">${readyCount}</span></button>`;
    const body = group('Forgeable maintenant', ready, 'ready') + group('Pas encore forgeable', later, 'later');
    const empty = this.forgeReadyOnly && entries.length
      ? 'Rien n’est forgeable maintenant avec ce filtre : décochez « Forgeable maintenant » pour voir ce qu’il manque.'
      : entries.length ? 'Aucune recette de ce type.' : 'Aucune recette utile à la compagnie.';
    return `<div class="shop-view shop-view--forge">
      <div class="shop-view__intro"><div><p class="eyebrow ui-eyebrow">Forge du refuge · ${getReputationRule(state.reputation).label}</p><h3>Artisan du refuge</h3><small>La forge prend d’abord le sac, puis l’objet que porte un héros, qui équipe aussitôt le résultat. Chaque recette montre ce qu’elle prend et ce qu’elle donne ; vous confirmez avant de forger. Prix selon la réputation. ${WEAPON_TIER_RULE}</small></div>
        ${this.shopToggle()}
      </div>
      <div class="shop-filters" role="group" aria-label="Filtrer les recettes par type de résultat">${chips}${readyToggle}</div>
      ${body || `<p class="empty-copy">${empty}</p>`}
    </div>`;
  }

  /** One recipe card of the forge list; its button opens the recipe's fiche. */
  private craftCard(recipeId: string): string {
    const state = this.options.getState();
    const recipe = craftRecipeById.get(recipeId);
    if (!recipe) return '';
    const output = itemById.get(recipe.output.itemId);
    const preview = previewCraft(state, recipe.id, this.shopId);
    if (!output || !preview) return '';
    const tier = output.category === 'weapons' ? weaponById.get(output.id)?.tier : undefined;
    const named = describeItemSkillEffects(recipe.output.itemId).join(' · ');
    const effect = preview.wearer && preview.wearer.stats.length
      ? `${preview.wearer.name}, qui l’équipera aussitôt : ${this.statSummary(preview.wearer)}`
      : recipe.preview;
    const missing = preview.missing.map((entry) => entry.itemId === 'gold' ? `${entry.need - entry.have} or` : `${entry.name} ×${entry.need - entry.have}`);
    return `<article class="craft-recipe ui-panel ui-panel--soft${preview.ready ? ' is-ready' : ''}">
      <div class="craft-recipe__output">
        <span class="item-row__icon ui-chip" aria-hidden="true">${output.icon}</span>
        <div><strong>${recipe.name}</strong><small>Donne : ${output.name}${tier !== undefined ? ` <span class="item-row__tier">${weaponTierLabel(tier)}</span>` : ''}</small></div>
      </div>
      <div class="craft-recipe__meta">
        <p><b>Effet</b> ${effect}</p>
        ${named ? `<p class="craft-recipe__skill"><b>Compétences</b> ${named}</p>` : ''}
      </div>
      <ul class="craft-recipe__needs trade-needs">${this.craftNeeds(recipe.id, preview)}</ul>
      <p class="craft-recipe__status${preview.ready ? ' is-ready' : ''}">${preview.ready ? 'Prêt à forger' : `Il manque : ${missing.join(', ')}`}</p>
      <button type="button" class="ui-button${preview.ready ? '' : ' ui-button--secondary'}" data-craft="${recipe.id}" aria-label="${escapeAttribute(`${preview.ready ? 'Forger' : 'Voir ce qu’il manque pour forger'} ${output.name} · ${preview.gold} or`)}">${preview.ready ? 'Forger…' : 'Voir ce qu’il manque'}</button>
    </article>`;
  }

  /** Each ingredient and the gold a recipe takes, met or missing, and where it comes from. */
  private craftNeeds(recipeId: string, preview: CraftPreview): string {
    const state = this.options.getState();
    const recipe = craftRecipeById.get(recipeId);
    if (!recipe) return '';
    const lines = getForgeIngredients(state, recipe).map((ingredient) => {
      const consumed = preview.consumed.find((entry) => entry.itemId === ingredient.itemId);
      const lack = preview.missing.find((entry) => entry.itemId === ingredient.itemId);
      const sources = [
        consumed && consumed.fromBag > 0 ? 'dans le sac' : '',
        consumed?.wornBy.length ? `sur ${consumed.wornBy.join(', ')}` : '',
        lack ? (lack.inShop ? 'en vente à l’échoppe' : 'gagné en combat') : '',
      ].filter(Boolean).join(' · ');
      return this.needLine(!lack, `${itemById.get(ingredient.itemId)?.name ?? ingredient.itemId} ${ingredient.carried + ingredient.worn}/${ingredient.quantity}`, sources);
    });
    const enough = state.gold >= preview.gold;
    lines.push(this.needLine(enough, `${preview.gold} or`, enough ? `vous avez ${state.gold} or` : `il manque ${preview.gold - state.gold} or`));
    return lines.join('');
  }

  private needLine(met: boolean, label: string, detail: string): string {
    return `<li class="${met ? 'is-ok' : 'is-missing'}"><span><i aria-hidden="true">${met ? '✓' : '✗'}</i> ${label}</span>${detail ? `<small>${detail}</small>` : ''}</li>`;
  }

  /** "Puissance 20 → 25 · PV 145 → 170": the stats a change moves. */
  private statSummary(change: HeroChange): string {
    return change.stats.map((stat) => `${stat.label} ${stat.before} → ${stat.after}`).join(' · ');
  }

  /** What one hero gains or loses: stats before and after, skills opened or closed. */
  private heroChangeBlock(change: HeroChange, heading: string): string {
    const rows = change.stats.map((stat) => this.weaponStatRow(stat.label, `${stat.before} → ${stat.after}`, stat.after - stat.before)).join('');
    const skills = [
      ...change.gained.map((label) => `<li class="trade-skill is-gained">Nouvelle compétence : ${label}</li>`),
      ...change.swapped.map((label) => `<li class="trade-skill is-gained">${label}</li>`),
      ...change.lost.map((label) => `<li class="trade-skill is-lost">Compétence perdue : ${label}</li>`),
      change.innate ? `<li class="trade-skill is-gained">Améliore le don inné : ${change.innate}</li>` : '',
    ].join('');
    return `<section class="trade-hero" aria-label="${escapeAttribute(heading)}">
      <p class="trade-hero__heading">${heading}</p>
      ${rows ? `<div class="weapon-modal__stat-list">${rows}</div>` : '<p class="trade-hero__none">Aucune statistique ne change.</p>'}
      ${skills ? `<ul class="trade-skills">${skills}</ul>` : '<p class="trade-hero__none">Compétences inchangées.</p>'}
    </section>`;
  }

  private changeHeading(change: HeroChange): string {
    return `${change.name} · ${change.replacedName ? `remplace ${change.replacedName}` : `${change.slotLabel} libre`}`;
  }

  /** What an item would do for the company, before it is bought or sold. */
  private itemEffectSection(item: ItemDefinition): string {
    const state = this.options.getState();
    if (item.category === 'weapons') {
      const blocks = candidateWearers(state, item.id)
        .map((unit) => previewEquip(state, unit.id, item.id))
        .filter((change): change is HeroChange => Boolean(change))
        .map((change) => this.heroChangeBlock(change, `Si ${change.name} la prend · remplace ${change.replacedName ?? 'rien'}`));
      const wearers = currentWearers(state, item.id).map((unit) => unit.name);
      return `<section class="trade-section"><p class="trade-section__title">Ce qu’elle change</p>
        ${blocks.join('') || `<p class="trade-hero__none">${wearers.length ? `Déjà portée par ${wearers.join(', ')}.` : 'Aucun héros de la compagnie ne la manie.'}</p>`}
        <small class="weapon-modal__tier-rule">${WEAPON_TIER_RULE}</small>
      </section>`;
    }
    if (item.category === 'accessories') {
      const labels: Record<string, string> = { maxHealth: 'PV', strength: 'FOR', magic: 'MAG', endurance: 'END', dexterity: 'DEX', charisma: 'CHA', moveRange: 'DÉPL.' };
      const bonuses = Object.entries(item.modifiers ?? {}).map(([key, value]) => `+${value} ${labels[key] ?? key}`).join(' · ');
      const skills = describeItemSkillEffects(item.id);
      return `<section class="trade-section"><p class="trade-section__title">Ce qu’il change</p>
        <p class="trade-hero__line">Pour le héros qui le porte : <strong>${bonuses || 'aucun bonus de statistique'}</strong>. Chaque héros a deux emplacements d’accessoire.</p>
        ${skills.length ? `<ul class="trade-skills">${skills.map((line) => `<li class="trade-skill is-gained">${line}</li>`).join('')}</ul>` : ''}
      </section>`;
    }
    const uses = item.category === 'materials'
      ? item.id === 'red_gem'
        ? 'Sert à améliorer les compétences (Amélioration, au refuge).'
        : (() => {
          const count = getForgeRecipes(state).filter((recipe) => recipe.inputs.materials?.[item.id]).length;
          return count ? `Sert à la forge : ${count} recette${count > 1 ? 's' : ''} l’utilisent.` : '';
        })()
      : '';
    return `<section class="trade-section"><p class="trade-section__title">Effet</p><p class="trade-hero__line">${item.description}${uses ? ` ${uses}` : ''}</p></section>`;
  }

  /** After a purchase or a forge that left the item in the bag: equip it on a hero right here. */
  private tradeEquipSection(itemId: string, autofocus = false): string {
    const state = this.options.getState();
    const item = itemById.get(itemId);
    if (!item || (item.category !== 'weapons' && item.category !== 'accessories') || (state.inventory[item.category][itemId] ?? 0) < 1) return '';
    const buttons: string[] = [];
    const notes: string[] = [];
    for (const unit of candidateWearers(state, itemId)) {
      const slot = item.category === 'accessories' ? freeAccessorySlot(unit) : undefined;
      if (item.category === 'accessories' && slot === null) { notes.push(unit.name); continue; }
      const change = previewEquip(state, unit.id, itemId, slot ?? undefined);
      if (!change) continue;
      const meta = [this.statSummary(change), ...change.gained.map((label) => `débloque ${label}`), ...change.swapped].filter(Boolean).join(' · ');
      buttons.push(`<button type="button" class="ui-button ui-button--secondary trade-equip__button"${autofocus && !buttons.length ? ' data-autofocus' : ''} data-trade-equip="${unit.id}"${slot !== undefined && slot !== null ? ` data-trade-equip-slot="${slot}"` : ''} aria-label="${escapeAttribute(`Équiper ${item.name} sur ${unit.name}${meta ? ` : ${meta}` : ''}`)}">
        <span>Équiper sur ${unit.name}</span>${meta ? `<small>${meta}</small>` : ''}</button>`);
    }
    if (!buttons.length && !notes.length) return '';
    return `<section class="trade-section trade-equip"><p class="trade-section__title">Équiper maintenant ?</p>
      ${buttons.join('')}
      ${notes.length ? `<p class="trade-hero__none">${notes.join(', ')} : deux accessoires déjà portés, à changer depuis la fiche du héros (Compagnie).</p>` : ''}
    </section>`;
  }

  private renderTradeModal(): string {
    const trade = this.trade;
    if (!trade) return '';
    const state = this.options.getState();
    const recipe = trade.kind === 'craft' ? craftRecipeById.get(trade.id) : undefined;
    const item = itemById.get(recipe ? recipe.output.itemId : trade.id);
    if (!item || (trade.kind === 'craft' && !recipe)) return '';
    const tier = item.category === 'weapons' ? weaponById.get(item.id)?.tier : undefined;
    const verb = trade.kind === 'buy' ? 'Achat' : trade.kind === 'sell' ? 'Vente' : 'Forge';
    const title = recipe ? recipe.name : item.name;
    const subtitle = recipe ? `Donne : ${item.name}` : item.description;
    const body = trade.kind === 'craft' ? this.craftTradeBody(trade, recipe!.id) : this.shopTradeBody(trade, item);
    return `<div class="item-modal-overlay" data-trade-close>
      <div class="item-modal ui-panel weapon-modal trade-modal" role="dialog" aria-modal="true" aria-label="${escapeAttribute(`${verb} · ${item.name}`)}" data-trade-stage="${trade.stage}">
        <button type="button" class="icon-button ui-icon-button" data-trade-close aria-label="Fermer">×</button>
        <div class="weapon-modal__header">
          <span class="item-row__icon ui-chip" aria-hidden="true">${item.icon}</span>
          <div class="weapon-modal__title-block">
            <p class="trade-modal__eyebrow">${verb}${tier !== undefined ? ` · arme ${weaponTierLabel(tier)}` : ''}</p>
            <h3 class="weapon-modal__title">${title}</h3>
            <small class="weapon-modal__subtitle">${subtitle}</small>
          </div>
        </div>
        ${body}
      </div>
    </div>`;
  }

  /**
   * Prices and limits of a purchase or sale, read from the owner (management.ts): unit price at today's reputation,
   * how many the stock, the gold or the bag allow, and the fiche's quantity kept within them.
   */
  private tradeQuantity(trade: TradeState, item: ItemDefinition): { unit: number; max: number; quantity: number; total: number; reason: string } {
    const state = this.options.getState();
    const buying = trade.kind === 'buy';
    const unit = (buying ? getBuyUnitPrice(state, item.id) : getSellUnitPrice(item.id)) ?? 0;
    const max = buying ? getMaxBuyQuantity(state, this.shopId, item.id) : getMaxSellQuantity(state, this.shopId, item.id);
    const stock = state.shops[this.shopId]?.stock[item.id] ?? 0;
    const quantity = Math.max(1, Math.min(trade.quantity, Math.max(1, max)));
    const reason = !buying ? 'tout ce que porte le sac' : max >= stock ? 'tout le stock' : `votre or (${state.gold})`;
    return { unit, max, quantity, total: unit * quantity, reason };
  }

  /** The quantity picker of a buy or sell fiche: minus, plus and maximum, each a plain button reachable by keyboard and pad. */
  private quantityPicker(trade: TradeState, item: ItemDefinition): string {
    const { max, quantity, total, reason } = this.tradeQuantity(trade, item);
    if (max <= 1) return '';
    const verb = trade.kind === 'buy' ? 'acheter' : 'vendre';
    return `<section class="trade-section trade-quantity" role="group" aria-label="${escapeAttribute(`Quantité à ${verb}`)}">
      <p class="trade-section__title">Quantité à ${verb}</p>
      <div class="trade-quantity__row">
        <button type="button" class="ui-button ui-button--secondary trade-quantity__step" data-trade-qty="less"${quantity <= 1 ? ' disabled' : ''} aria-label="${escapeAttribute(`Un de moins · quantité ${quantity}`)}">−</button>
        <output class="trade-quantity__value" aria-live="polite" aria-label="${escapeAttribute(`Quantité ${quantity} sur ${max}, total ${total} or`)}">${quantity}</output>
        <button type="button" class="ui-button ui-button--secondary trade-quantity__step" data-trade-qty="more"${quantity >= max ? ' disabled' : ''} aria-label="${escapeAttribute(`Un de plus · quantité ${quantity}`)}">+</button>
        <button type="button" class="ui-button ui-button--secondary trade-quantity__max" data-trade-qty="max"${quantity >= max ? ' disabled' : ''} aria-label="${escapeAttribute(`Le maximum · ${max}`)}">Max ×${max}</button>
      </div>
      <small class="trade-quantity__limit">Jusqu’à ${max} : ${reason}. Touches + et − du clavier aussi.</small>
    </section>`;
  }

  private shopTradeBody(trade: TradeState, item: ItemDefinition): string {
    const state = this.options.getState();
    const buying = trade.kind === 'buy';
    const { unit: price, max, quantity, total } = this.tradeQuantity(trade, item);
    const owned = state.inventory[item.category][item.id] ?? 0;
    const stock = state.shops[this.shopId]?.stock[item.id] ?? 0;
    const able = max > 0;
    const named = `${quantity > 1 ? `${quantity} × ` : ''}${item.name}`;
    if (trade.stage === 'done') {
      const again = item.category === 'consumables' || item.category === 'materials' ? able : false;
      const equipFirst = buying && !trade.outcome?.equipped && Boolean(this.tradeEquipSection(item.id));
      return `${this.tradeDone(trade)}
        ${buying ? this.tradeEquipSection(item.id, equipFirst) : ''}
        <div class="trade-footer"><div class="weapon-modal__actions">
          ${again ? `<button type="button" class="ui-button ui-button--secondary" data-trade-step="confirm" aria-label="${escapeAttribute(`${buying ? 'En acheter encore' : 'En vendre encore'} ${named} · ${total} or`)}">${buying ? 'En acheter encore' : 'En vendre encore'}${quantity > 1 ? ` ×${quantity}` : ''} · ${total} or</button>` : ''}
          <button type="button" class="ui-button" data-trade-close${equipFirst ? '' : ' data-autofocus'}>Continuer</button>
        </div></div>`;
    }
    const goldAfter = buying ? state.gold - total : state.gold + total;
    const summary = `<dl class="trade-summary">
      <div><dt>${buying ? 'Prix unitaire' : 'Prix de vente'}</dt><dd>${price} or</dd></div>
      ${max > 1 || quantity > 1 ? `<div><dt>Total ×${quantity}</dt><dd>${total} or</dd></div>` : ''}
      <div><dt>Votre or</dt><dd>${state.gold} → ${goldAfter}</dd></div>
      <div><dt>Dans le sac</dt><dd>${owned} → ${buying ? owned + quantity : Math.max(0, owned - quantity)}</dd></div>
      ${buying ? `<div><dt>En stock</dt><dd>${stock} → ${Math.max(0, stock - quantity)}</dd></div>` : ''}
    </dl>`;
    const warning = buying && stock > 0 && state.gold < price ? `<p class="trade-warning" role="note">Il vous manque ${price - state.gold} or.</p>` : '';
    const action = buying ? 'Acheter' : 'Vendre';
    const footer = trade.stage === 'confirm'
      ? `<div class="trade-confirm" role="group" aria-label="Confirmation">
          <p>Confirmer ${buying ? 'l’achat' : 'la vente'} de <strong>${named}</strong> pour <strong>${total} or</strong> ? Votre or passera de ${state.gold} à ${goldAfter}.</p>
          <div class="weapon-modal__actions">
            <button type="button" class="ui-button ui-button--secondary" data-trade-step="preview">Annuler</button>
            <button type="button" class="ui-button" data-trade-confirm data-autofocus>${buying ? 'Confirmer l’achat' : 'Confirmer la vente'}</button>
          </div>
        </div>`
      : `<div class="weapon-modal__actions">
          <button type="button" class="ui-button ui-button--secondary" data-trade-close${able ? '' : ' data-autofocus'}>Retour</button>
          <button type="button" class="ui-button" data-trade-step="confirm"${able ? ' data-autofocus' : ' disabled'} aria-label="${escapeAttribute(`${action} ${named} · ${total} or`)}">${action}${quantity > 1 ? ` ×${quantity}` : ''} · ${total} or</button>
        </div>`;
    return `${buying ? this.itemEffectSection(item) : this.sellNote(item)}
      ${trade.stage === 'preview' && able ? this.quantityPicker(trade, item) : ''}
      ${summary}${warning}
      <div class="trade-footer">${footer}</div>`;
  }

  private sellNote(item: ItemDefinition): string {
    const state = this.options.getState();
    const wearers = currentWearers(state, item.id).map((unit) => unit.name);
    return `<section class="trade-section"><p class="trade-section__title">Vente</p>
      <p class="trade-hero__line">Seuls les exemplaires du sac se vendent${wearers.length ? ` ; l’exemplaire équipé sur ${wearers.join(', ')} le reste` : ''}. L’échoppe reprend l’objet à moitié prix.</p>
    </section>`;
  }

  private craftTradeBody(trade: TradeState, recipeId: string): string {
    const state = this.options.getState();
    const preview = previewCraft(state, recipeId, this.shopId);
    if (!preview) return '';
    if (trade.stage === 'done') {
      const equipFirst = !trade.outcome?.equipped && Boolean(this.tradeEquipSection(preview.outputId));
      return `${this.tradeDone(trade)}${this.tradeEquipSection(preview.outputId, equipFirst)}
        <div class="trade-footer"><div class="weapon-modal__actions">
          <button type="button" class="ui-button" data-trade-close${equipFirst ? '' : ' data-autofocus'}>Continuer</button>
        </div></div>`;
    }
    const output = itemById.get(preview.outputId)!;
    const gives = preview.wearer
      ? this.heroChangeBlock(preview.wearer, `${preview.wearer.name} l’équipera aussitôt · remplace ${preview.wearer.replacedName ?? 'rien'}`)
      : `<p class="trade-hero__line">${output.name} ira dans le sac : vous pourrez l’équiper juste après.</p>`;
    // The wearer's block already names the skills; without one, the skill each hero would get is listed.
    const named = preview.wearer ? [] : describeItemSkillEffects(preview.outputId);
    const missing = preview.missing.map((entry) => entry.itemId === 'gold'
      ? `${entry.need - entry.have} or`
      : `${entry.name} ×${entry.need - entry.have}${entry.inShop ? ' (en vente à l’échoppe)' : ''}`);
    const consumedText = preview.consumed.map((entry) => `${entry.quantity} ${entry.name}${entry.wornBy.length ? ` (sur ${entry.wornBy.join(', ')})` : ''}`).join(', ');
    const goldAfter = state.gold - preview.gold;
    const footer = trade.stage === 'confirm'
      ? `<div class="trade-confirm" role="group" aria-label="Confirmation">
          <p>Confirmer la forge ? Elle prendra ${consumedText} et <strong>${preview.gold} or</strong>. Votre or passera de ${state.gold} à ${goldAfter}.</p>
          <div class="weapon-modal__actions">
            <button type="button" class="ui-button ui-button--secondary" data-trade-step="preview">Annuler</button>
            <button type="button" class="ui-button" data-trade-confirm data-autofocus>Confirmer la forge</button>
          </div>
        </div>`
      : `<div class="weapon-modal__actions">
          <button type="button" class="ui-button ui-button--secondary" data-trade-close${preview.ready ? '' : ' data-autofocus'}>Retour</button>
          <button type="button" class="ui-button" data-trade-step="confirm"${preview.ready ? ' data-autofocus' : ' disabled'} aria-label="${escapeAttribute(`Forger ${output.name} · ${preview.gold} or`)}">Forger · ${preview.gold} or</button>
        </div>`;
    return `<section class="trade-section"><p class="trade-section__title">Ce que la forge prend</p><ul class="trade-needs">${this.craftNeeds(recipeId, preview)}</ul></section>
      <section class="trade-section"><p class="trade-section__title">Ce qu’elle donne</p>${gives}
        ${named.length ? `<ul class="trade-skills">${named.map((line) => `<li class="trade-skill">${line}</li>`).join('')}</ul>` : ''}
      </section>
      ${missing.length ? `<p class="trade-warning" role="note">Il manque : ${missing.join(', ')}.</p>` : ''}
      <dl class="trade-summary"><div><dt>Coût</dt><dd>${preview.gold} or</dd></div><div><dt>Votre or</dt><dd>${state.gold} → ${preview.ready ? goldAfter : '—'}</dd></div></dl>
      <div class="trade-footer">${footer}</div>`;
  }

  private tradeDone(trade: TradeState): string {
    const outcome = trade.outcome;
    if (!outcome) return '';
    return `<div class="trade-done" role="status">
        <p class="trade-done__title"><span aria-hidden="true">✓</span> ${outcome.title}</p>
        ${outcome.lines.map((line) => `<p>${line}</p>`).join('')}
      </div>
      ${outcome.change ? this.heroChangeBlock(outcome.change, outcome.changeHeading) : ''}`;
  }

  /** Runs the confirmed trade through its owner (buyItem, sellItem, craftItem) and keeps the fiche open on the result. */
  private confirmTrade(): void {
    const trade = this.trade;
    if (!trade) return;
    const state = this.options.getState();
    if (trade.kind === 'craft') {
      const preview = previewCraft(state, trade.id, this.shopId);
      if (!preview?.ready || !craftItem(state, trade.id)) { this.options.onSound?.('refused'); return; }
      const wearer = preview.wearer;
      trade.outcome = {
        title: `Forgé : ${preview.outputName}`,
        lines: wearer
          ? [`${wearer.name} porte maintenant : ${preview.outputName}.`, ...(wearer.replacedName ? [`La forge a utilisé : ${wearer.replacedName}.`] : [])]
          : [`Dans le sac : ${state.inventory[itemById.get(preview.outputId)!.category][preview.outputId] ?? 0}.`],
        change: wearer,
        changeHeading: wearer ? `${wearer.name} · ${wearer.slotLabel}` : '',
        equipped: Boolean(wearer),
      };
    } else {
      const item = itemById.get(trade.id);
      if (!item) return;
      // One confirmation covers the whole quantity; the owner buys or sells all of it or nothing.
      const { quantity, total } = this.tradeQuantity(trade, item);
      const ok = trade.kind === 'buy'
        ? buyItems(state, this.shopId, item.id, quantity)
        : sellItems(state, this.shopId, item.id, quantity);
      if (!ok) { this.options.onSound?.('refused'); return; }
      trade.quantity = quantity;
      const owned = state.inventory[item.category][item.id] ?? 0;
      const named = `${quantity > 1 ? `${quantity} × ` : ''}${item.name}`;
      trade.outcome = trade.kind === 'buy'
        ? { title: `Acheté : ${named}`, lines: [`${quantity > 1 ? `${total} or payés. ` : ''}Dans le sac : ${owned}. Votre or : ${state.gold}.`], change: null, changeHeading: '', equipped: false }
        : { title: `Vendu : ${named}`, lines: [`+${total} or. Votre or : ${state.gold}. Il en reste ${owned} dans le sac.`], change: null, changeHeading: '', equipped: false };
    }
    trade.stage = 'done';
    trade.revision += 1;
    this.changed();
  }

  /**
   * Moves the fiche's quantity within what the owner allows; nothing is bought or sold here. When the pressed button
   * reaches its limit and turns off, focus moves to the fiche's main action rather than being lost.
   */
  private changeTradeQuantity(step: 'less' | 'more' | 'max'): void {
    const trade = this.trade;
    const item = trade && trade.kind !== 'craft' && trade.stage === 'preview' ? itemById.get(trade.id) : undefined;
    if (!trade || !item) return;
    const { max, quantity } = this.tradeQuantity(trade, item);
    const next = step === 'max' ? max : Math.max(1, Math.min(max, quantity + (step === 'more' ? 1 : -1)));
    if (max < 1 || next === quantity) { this.options.onSound?.('refused'); return; }
    trade.quantity = next;
    this.options.onSound?.('navigate');
    this.render();
    const pressed = this.overlay?.querySelector<HTMLButtonElement>(`[data-trade-qty="${step}"]`);
    if (pressed && !pressed.disabled) pressed.focus({ preventScroll: true });
    else this.overlay?.querySelector<HTMLButtonElement>(step === 'less' ? '[data-trade-qty="more"]:not(:disabled)' : '.trade-footer [data-trade-step="confirm"]:not(:disabled)')?.focus({ preventScroll: true });
  }

  /** Equips the item the fiche just bought or forged, through equipWeapon or equipAccessory. */
  private equipFromTrade(unitId: string, slot: 0 | 1 | undefined): void {
    const trade = this.trade;
    if (!trade?.outcome) return;
    const state = this.options.getState();
    const itemId = trade.kind === 'craft' ? craftRecipeById.get(trade.id)?.output.itemId ?? '' : trade.id;
    const item = itemById.get(itemId);
    const unit = state.clan.members.find((candidate) => candidate.id === unitId);
    const change = item && unit ? previewEquip(state, unitId, itemId, slot) : null;
    const ok = Boolean(change) && (item?.category === 'weapons'
      ? equipWeapon(state, unitId, itemId)
      : slot !== undefined && equipAccessory(state, unitId, slot, itemId));
    if (!ok || !change || !item) { this.options.onSound?.('refused'); return; }
    trade.outcome.lines = [...trade.outcome.lines, `${change.name} porte maintenant : ${item.name}.${change.replacedName ? ` ${change.replacedName} retourne dans le sac.` : ''}`];
    trade.outcome.change = change;
    trade.outcome.changeHeading = this.changeHeading(change);
    trade.outcome.equipped = true;
    trade.revision += 1;
    this.changed();
  }

  private bind(): void {
    if (!this.overlay) return;
    this.overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => { this.options.onSound?.('back'); this.close(); });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        if(this.tab !== button.dataset.tab) this.options.onSound?.('navigate');
        this.tab = button.dataset.tab as ManagementTab;
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach((button) => {
      button.addEventListener('click', () => {
        if(this.selectedUnitId !== button.dataset.unit) this.options.onSound?.('navigate');
        this.selectedUnitId = button.dataset.unit ?? '';
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-equip-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        this.options.onSound?.('confirm');
        this.activeEquipSlot = {
          type: button.dataset.equipSlot as 'weapon' | 'accessory',
          slot: Number(button.dataset.equipSlotIndex),
        };
        this.previewItemId = null;
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLElement>('[data-equip-slot-close]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.options.onSound?.('back');
          this.activeEquipSlot = null;
          this.previewItemId = null;
          this.render();
        }
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-equip-unequip]').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = button.dataset.equipUnequip as 'weapon' | 'accessory';
        const slot = Number(button.dataset.equipUnequipSlot);
        if (type === 'accessory') {
          if (equipAccessory(this.options.getState(), this.selectedUnitId, slot as 0 | 1, null)) {
            this.activeEquipSlot = null;
            this.previewItemId = null;
            this.changed();
          }
        }
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-preview-item]').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previewItemId = button.dataset.previewItem ?? null;
        this.options.onSound?.('confirm');
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-preview-back]').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = this.previewItemId;
        this.options.onSound?.('back');
        this.previewItemId = null;
        this.render();
        const replacement = [...this.overlay?.querySelectorAll<HTMLButtonElement>('[data-preview-item]') ?? []]
          .find(control => control.dataset.previewItem === itemId);
        replacement?.focus();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-equip-confirm]').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = button.dataset.equipConfirm ?? '';
        const slot = this.activeEquipSlot!;
        if (slot.type === 'weapon') {
          if (equipWeapon(this.options.getState(), this.selectedUnitId, itemId)) {
            this.activeEquipSlot = null;
            this.previewItemId = null;
            this.changed();
          }
        } else {
          if (equipAccessory(this.options.getState(), this.selectedUnitId, slot.slot as 0 | 1, itemId)) {
            this.activeEquipSlot = null;
            this.previewItemId = null;
            this.changed();
          }
        }
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
        if(this.shopMode !== button.dataset.shopMode) this.options.onSound?.('navigate');
        this.shopMode = button.dataset.shopMode as 'buy' | 'sell' | 'craft';
        this.trade = null;
        this.render();
      });
    });
    // List filters change only what the list shows (playtest 2026-11-11); focus stays on the pressed filter.
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-shop-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        if (this.shopMode === 'craft') return;
        const filter = button.dataset.shopFilter as ShopFilter;
        if (this.shopFilters[this.shopMode] !== filter) this.options.onSound?.('navigate');
        this.shopFilters[this.shopMode] = filter;
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-forge-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.forgeFilter as ForgeFilter;
        if (this.forgeFilter !== filter) this.options.onSound?.('navigate');
        this.forgeFilter = filter;
        this.render();
      });
    });
    this.overlay.querySelector<HTMLButtonElement>('[data-forge-ready]')?.addEventListener('click', () => {
      this.forgeReadyOnly = !this.forgeReadyOnly;
      this.options.onSound?.('navigate');
      this.render();
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-trade-qty]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.changeTradeQuantity(button.dataset.tradeQty as 'less' | 'more' | 'max');
      });
    });
    // A shop line or a recipe opens its fiche; the owner action runs only on the fiche's confirmation.
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-trade], [data-craft]').forEach((button) => {
      button.addEventListener('click', () => {
        const craft = button.dataset.craft;
        this.trade = { kind: craft ? 'craft' : button.dataset.trade as 'buy' | 'sell', id: craft ?? button.dataset.item ?? '', stage: 'preview', outcome: null, revision: 0, quantity: 1 };
        this.options.onSound?.('confirm');
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLElement>('[data-trade-close]').forEach((el) => {
      el.addEventListener('click', (event) => {
        if (event.target !== el) return;
        this.options.onSound?.('back');
        this.trade = null;
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-trade-step]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!this.trade) return;
        const stage = button.dataset.tradeStep as 'preview' | 'confirm';
        if (this.trade.stage === 'done') this.trade.outcome = null;
        this.trade.stage = stage;
        this.trade.revision += 1;
        this.options.onSound?.(stage === 'confirm' ? 'navigate' : 'back');
        this.render();
      });
    });
    this.overlay.querySelector<HTMLButtonElement>('[data-trade-confirm]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.confirmTrade();
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-trade-equip]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const slot = button.dataset.tradeEquipSlot;
        this.equipFromTrade(button.dataset.tradeEquip ?? '', slot === '0' ? 0 : slot === '1' ? 1 : undefined);
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-upgrade-skill]').forEach((button) => {
      button.addEventListener('click', () => {
        const skillId = button.dataset.upgradeSkill ?? '';
        if (upgradeSkill(this.options.getState(), this.selectedUnitId, skillId)) this.changed();
      });
    });
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-use-item]').forEach((button) => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.useItem ?? '';
        const select = this.overlay?.querySelector<HTMLSelectElement>(`[data-use-unit="${itemId}"]`);
        const unitId = select?.value ?? '';
        if (!unitId) return;
        if (useConsumable(this.options.getState(), unitId, itemId)) this.changed('recover');
      });
    });
    this.overlay.querySelectorAll<HTMLElement>('[data-item-details]').forEach((row) => {
      row.addEventListener('click', () => {
        this.activeItemId = row.dataset.itemDetails ?? null;
        this.options.onSound?.('confirm');
        this.render();
      });
    });
    this.overlay.querySelectorAll<HTMLElement>('[data-item-modal-close]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.options.onSound?.('back');
          this.activeItemId = null;
          this.render();
        }
      });
    });
  }

  private changed(sound: 'confirm' | 'recover' = 'confirm'): void {
    this.options.onChange();
    this.render();
    this.options.onSound?.(sound);
  }
}
