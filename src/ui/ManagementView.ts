import { craftRecipes, getFinalStats, getResolvedSkills, itemById, items, unitById, weaponById, weapons } from '../game/catalog';
import {
  buyItem, canCraftItem, craftItem, equipAccessory, equipWeapon, excludeUnit,
  getSkillUpgradeCost, sellItem, upgradeSkill, useConsumable,
} from '../game/management';
import { getReputationRule, getShopPrice } from '../game/reputation';
import { assets } from '../render/assetManifest';
import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import type { GameState, ItemCategory, UnitDefinition, UnitInstance } from '../game/types';

type ManagementTab = 'clan' | 'inventory' | 'shop' | 'skills';

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

interface CharacterAssetProfile {
  full: string;
  ui: string;
}

function characterProfileFromPortrait(portrait: string): CharacterAssetProfile | undefined {
  const match = /\/([^/]+)\.png$/.exec(portrait);
  const key = match?.[1];
  if (!key) return undefined;
  const profiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
  return profiles[key];
}

function unitFullPortrait(definition: UnitDefinition): string {
  return characterProfileFromPortrait(definition.portrait)?.full ?? definition.portrait;
}

function unitUiPortrait(definition: UnitDefinition): string {
  return characterProfileFromPortrait(definition.portrait)?.ui ?? definition.portrait;
}

const skillPresentation: Record<string, { name: string; description: string; ap?: number }> = {
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
  heavy: { name: 'Coup Lourd', ap: 2, description: 'Choc puissant qui peut étourdir.' },
  blink: { name: 'Clignotement', ap: 2, description: 'Repositionnement instantané sur une case libre.' },
  leap: { name: 'Bond', ap: 1, description: 'Déplacement rapide vers une case libre.' },
  charge: { name: 'Charge', ap: 2, description: 'Fonce en ligne droite et perturbe l’arrivée.' },
};

export class ManagementView {
  private overlay: HTMLElement | null = null;
  private selectedUnitId = '';
  private tab: ManagementTab = 'clan';
  private shopId = 'valmir';
  private shopMode: 'buy' | 'sell' | 'craft' = 'buy';
  private shopEnabled = false;
  private shopOnly = false;
  private skillsEnabled = false;
  private shopWallet: 'temporary' | 'permanent' = 'temporary';

  constructor(private readonly options: ManagementViewOptions) {}

  open(initialTab: ManagementTab = 'clan', shopId?: string, shopWallet: 'temporary' | 'permanent' = 'temporary'): Promise<void> {
    this.close();
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
    this.selectedUnitId = this.options.getState().clan.members[0]?.id ?? '';
    this.overlay = document.createElement('section');
    this.overlay.className = `management ui-screen ui-screen--dialog${this.shopOnly ? ' management--shop-only' : ''}`;
    applyScreenEnvironment(this.overlay, 'management');
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
            : `${this.tabButton('clan', 'Clan')}
              ${this.tabButton('inventory', 'Inventaire')}
              ${this.shopEnabled ? this.tabButton('shop', 'Boutique') : ''}`}
        </nav>
        <div class="management__content">${this.renderContent()}</div>
      </div>
    `;
    this.bind();
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
          <span class="roster-card__portrait"><img src="${unitUiPortrait(def)}" alt=""></span>
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
        <section class="unit-stage" aria-label="Personnage sélectionné">
          <div class="unit-stage__banner" aria-hidden="true"><span>⚜</span></div>
          <div class="unit-stage__aura" aria-hidden="true"></div>
          <div class="unit-stage__figure"><img src="${unitFullPortrait(definition)}" alt="${selected.name}"></div>
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
            ${this.stat('DÉPLAC.', stats.moveRange)}
          </div>
          <div class="skills">
            <div class="section-title ui-section-title">Compétences</div>
            <div class="skill-list">${this.renderSkills(selected)}</div>
          </div>
          <div class="equipment">
            <div class="section-title ui-section-title">Équipement</div>
            ${this.weaponSelect(selected, 0)}
            ${([0, 1, 2] as const).map((slot) => this.accessorySelect(selected, slot)).join('')}
          </div>
          <div class="unit-sheet__actions">
            <button type="button" class="danger-button ui-button ui-button--danger" data-action="exclude" ${selected.narrativeLocked ? 'disabled' : ''}>
              ${selected.narrativeLocked ? 'Lié à la chronique' : 'Exclure du clan'}
            </button>
          </div>
        </article>
      </div>`;
  }

  private weaponSelect(unit: UnitInstance, slot: 0): string {
    const state = this.options.getState();
    const definition = unitById.get(unit.definitionId)!;
    const currentId = unit.equipment.weaponIds[slot]!;
    const current = weaponById.get(currentId);
    const equipped = new Set(unit.equipment.weaponIds);
    const available = weapons.filter((candidate) =>
      definition.allowedWeaponIds.includes(candidate.id)
      && !equipped.has(candidate.id)
      && (state.inventory.weapons[candidate.id] ?? 0) > 0);
    return `<label class="equipment-slot"><span class="equipment-slot__label">Arme ${slot + 1}</span>
      <span class="equipment-slot__control"><span class="equipment-slot__icon">${current?.icon ?? '⚔'}</span><select data-equip="weapon" data-slot="${slot}">
        <option value="${currentId}">${current?.name ?? currentId} — équipée</option>
        ${available.map((candidate) =>
          `<option value="${candidate.id}">${candidate.name} · ${candidate.damage} puissance</option>`).join('')}
      </select></span>
    </label>`;
  }

  private accessorySelect(unit: UnitInstance, slot: 0 | 1 | 2): string {
    const state = this.options.getState();
    const currentId = unit.equipment.accessoryIds[slot];
    const current = currentId ? itemById.get(currentId) : null;
    const available = items.filter((item) =>
      item.category === 'accessories' && item.id !== currentId && (state.inventory.accessories[item.id] ?? 0) > 0);
    return `<label class="equipment-slot"><span class="equipment-slot__label">Accessoire ${slot + 1}</span>
      <span class="equipment-slot__control"><span class="equipment-slot__icon">${current?.icon ?? '◇'}</span><select data-equip="accessory" data-slot="${slot}">
        <option value="${currentId ?? ''}">${current?.name ?? 'Emplacement vide'}</option>
        ${currentId ? '<option value="">Retirer</option>' : ''}
        ${available.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}
      </select></span>
    </label>`;
  }

  private stat(label: string, value: number | string): string {
    return `<div class="ui-stat"><span>${label}</span><strong>${value}</strong></div>`;
  }

  private renderSkills(unit: UnitInstance): string {
    const skillIds = getResolvedSkills(unit);
    if (skillIds.length === 0) return '<p class="empty-copy">Aucune compétence.</p>';
    return skillIds.map((skillId) => {
      const skill = skillPresentation[skillId] ?? { name: skillId, description: 'Compétence disponible en combat.' };
      const cost = skill.ap === undefined ? '' : `<span>${skill.ap} PA</span>`;
      return `<article class="skill-card"><div><strong>${skill.name}</strong>${cost}</div><p>${skill.description}</p></article>`;
    }).join('');
  }

  private renderSkillUpgrades(): string {
    const state = this.options.getState();
    const selected = state.clan.members.find((unit) => unit.id === this.selectedUnitId) ?? state.clan.members[0];
    if (!selected) return '<p class="empty-copy">Aucune unité.</p>';
    const definition = unitById.get(selected.definitionId)!;
    const skills = getResolvedSkills(selected);
    const gems = state.inventory.materials.red_gem ?? 0;
    const rows = skills.map((skillId) => {
      const skill = skillPresentation[skillId] ?? { name: skillId, description: 'Compétence disponible en combat.' };
      const level = Math.max(0, Math.min(2, selected.skillUpgrades[skillId] ?? 0));
      const cost = getSkillUpgradeCost(level);
      const disabled = cost === null || gems < cost;
      const effect = this.skillUpgradeEffect(skillId, level);
      const next = cost === null ? 'Niveau maximal atteint.' : this.skillUpgradeEffect(skillId, level + 1);
      return `<article class="skill-upgrade-card ui-panel ui-panel--soft">
        <div class="skill-upgrade-card__head">
          <div><strong>${skill.name}</strong><small>${skill.description}</small></div>
          <span class="ui-chip">Niv. ${level}/2</span>
        </div>
        <div class="skill-upgrade-card__body">
          <p><b>Actuel</b> ${effect}</p>
          <p><b>Prochain</b> ${next}</p>
        </div>
        <button type="button" class="ui-button ui-button--secondary" data-upgrade-skill="${skillId}" ${disabled ? 'disabled' : ''}>
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
            <span class="roster-card__portrait"><img src="${unitUiPortrait(def)}" alt=""></span>
            <span class="roster-card__body"><strong>${unit.name}</strong><small>${def.className}</small></span>
          </button>`;
        }).join('')}</div>
      </aside>
      <section class="skills-view__tree ui-scroll-panel">
        <div class="unit-sheet__identity">
          <p class="eyebrow ui-eyebrow">${definition.className}</p>
          <h3>${selected.name}</h3>
          <p class="unit-sheet__description">Dépense des gemmes rouges pour renforcer les compétences résolues par la classe et l’équipement.</p>
        </div>
        <div class="skill-upgrade-list">${rows || '<p class="empty-copy">Aucune compétence à améliorer.</p>'}</div>
      </section>
    </div>`;
  }

  private skillUpgradeEffect(skillId: string, level: number): string {
    if (level <= 0) return 'Effet de base.';
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
        ${rows.length ? rows.map(([id, quantity]) => this.itemRow(id, quantity, category === 'consumables' ? this.consumableAction(id) : '')).join('') : '<p class="empty-copy">Aucun objet.</p>'}
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
      return `<span class="item-row__action"><select data-use-unit="${itemId}"><option value="">— Ranimer —</option>${options}</select><button type="button" class="ui-button ui-button--secondary" data-use-item="${itemId}">Utiliser</button></span>`;
    }
    if (itemId === 'potion') {
      const wounded = state.clan.members.filter((unit) => unit.currentHealth > 0 && unit.currentHealth < getFinalStats(unit).maxHealth);
      if (wounded.length === 0) return '';
      const options = wounded.map((unit) => {
        const maxHealth = getFinalStats(unit).maxHealth;
        return `<option value="${unit.id}">${unit.name} (${unit.currentHealth}/${maxHealth})</option>`;
      }).join('');
      return `<span class="item-row__action"><select data-use-unit="${itemId}"><option value="">— Soigner —</option>${options}</select><button type="button" class="ui-button ui-button--secondary" data-use-item="${itemId}">Utiliser</button></span>`;
    }
    return '';
  }

  private itemRow(id: string, quantity: number, action = ''): string {
    const item = itemById.get(id);
    if (!item) return '';
    return `<div class="item-row ui-panel ui-panel--dense">
      <span class="item-row__icon ui-chip">${item.icon}</span>
      <span><strong>${item.name}</strong><small>${item.description}</small></span>
      <b>×${quantity}</b>${action}
    </div>`;
  }

  private renderShop(): string {
    const state = this.options.getState();
    if (this.shopMode === 'craft') return this.renderForge();
    const source = this.shopMode === 'buy'
      ? Object.entries(state.shops[this.shopId]?.stock ?? {})
      : (Object.keys(categoryLabels) as ItemCategory[]).flatMap((category) => Object.entries(state.inventory[category]));
    const rows = source.filter(([, quantity]) => quantity > 0).map(([id, quantity]) => {
      const item = itemById.get(id);
      if (!item) return '';
      const price = this.shopMode === 'buy' ? getShopPrice(item.price, state.reputation) : Math.floor(item.price / 2);
      const availableGold = this.shopWallet === 'temporary' ? state.run.temporaryLoot.gold : state.gold;
      const disabled = this.shopMode === 'buy' && availableGold < price;
      const action = `<button type="button" class="ui-button ui-button--secondary" data-trade="${this.shopMode}" data-item="${id}" ${disabled ? 'disabled' : ''}>${price} or</button>`;
      return this.itemRow(id, quantity, action);
    }).join('');
    return `<div class="shop-view">
      <div class="shop-view__intro"><div><p class="eyebrow ui-eyebrow">Échoppe de Valmir · ${getReputationRule(state.reputation).label}</p><h3>Le Comptoir du Cerf</h3><small>Les achats utilisent ${this.shopWallet === 'temporary' ? 'le butin non sécurisé' : 'le coffre permanent'}.</small></div>
        <div class="shop-toggle">
          <button type="button" data-shop-mode="buy" class="ui-tab ${this.shopMode === 'buy' ? 'is-active' : ''}">Acheter</button>
          <button type="button" data-shop-mode="sell" class="ui-tab ${this.shopMode === 'sell' ? 'is-active' : ''}">Vendre</button>
          <button type="button" data-shop-mode="craft" class="ui-tab">Forge</button>
        </div>
      </div>
      <div class="shop-list">${rows || '<p class="empty-copy">Aucun article disponible.</p>'}</div>
    </div>`;
  }

  private renderForge(): string {
    const state = this.options.getState();
    const rows = craftRecipes.map((recipe) => {
      const output = itemById.get(recipe.output.itemId);
      const disabled = !canCraftItem(state, recipe.id);
      const ingredients = [
        ...Object.entries(recipe.inputs.weapons ?? {}).map(([id, quantity]) => this.ingredientLabel('weapons', id, quantity)),
        ...Object.entries(recipe.inputs.accessories ?? {}).map(([id, quantity]) => this.ingredientLabel('accessories', id, quantity)),
      ].join('');
      return `<article class="craft-recipe ui-panel ui-panel--soft">
        <div class="craft-recipe__output">
          <span class="item-row__icon ui-chip">${output?.icon ?? '✦'}</span>
          <div>
            <strong>${recipe.name}</strong>
            <small>${recipe.description}</small>
          </div>
        </div>
        <div class="craft-recipe__meta">
          <p><b>Créé</b> ${output?.name ?? recipe.output.itemId} ×${recipe.output.quantity}</p>
          <p><b>Effet</b> ${recipe.preview}</p>
        </div>
        <div class="craft-recipe__ingredients">${ingredients}<span class="ui-chip">${recipe.inputs.gold} or</span></div>
        <button type="button" class="ui-button ui-button--secondary" data-craft="${recipe.id}" ${disabled ? 'disabled' : ''}>Forger</button>
      </article>`;
    }).join('');
    return `<div class="shop-view shop-view--forge">
      <div class="shop-view__intro"><div><p class="eyebrow ui-eyebrow">Forge de Valmir · ${getReputationRule(state.reputation).label}</p><h3>Artisan du refuge</h3><small>Les recettes consomment vos objets permanents et l’or du coffre.</small></div>
        <div class="shop-toggle">
          <button type="button" data-shop-mode="buy" class="ui-tab ${this.shopMode === 'buy' ? 'is-active' : ''}">Acheter</button>
          <button type="button" data-shop-mode="sell" class="ui-tab ${this.shopMode === 'sell' ? 'is-active' : ''}">Vendre</button>
          <button type="button" data-shop-mode="craft" class="ui-tab ${this.shopMode === 'craft' ? 'is-active' : ''}">Forge</button>
        </div>
      </div>
      <div class="craft-list">${rows}</div>
    </div>`;
  }

  private ingredientLabel(category: 'weapons' | 'accessories', itemId: string, quantity: number): string {
    const state = this.options.getState();
    const item = itemById.get(itemId);
    const owned = state.inventory[category][itemId] ?? 0;
    return `<span class="ui-chip ${owned >= quantity ? '' : 'is-missing'}">${item?.name ?? itemId} ${owned}/${quantity}</span>`;
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
        const slot = 0;
        if (equipWeapon(this.options.getState(), this.selectedUnitId, select.value)) this.changed();
      });
    });
    this.overlay.querySelectorAll<HTMLSelectElement>('[data-equip="accessory"]').forEach((select) => {
      select.addEventListener('change', () => {
        const slot = Number(select.dataset.slot) as 0 | 1 | 2;
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
        this.shopMode = button.dataset.shopMode as 'buy' | 'sell' | 'craft';
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
    this.overlay.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach((button) => {
      button.addEventListener('click', () => {
        const recipeId = button.dataset.craft ?? '';
        if (craftItem(this.options.getState(), recipeId)) this.changed();
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
        if (useConsumable(this.options.getState(), unitId, itemId)) this.changed();
      });
    });
  }

  private changed(): void {
    this.options.onChange();
    this.render();
  }
}
