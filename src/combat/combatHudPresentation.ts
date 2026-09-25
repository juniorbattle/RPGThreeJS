/** Markup only. All values and availability are supplied by the combat runtime. */
import { assets } from '../render/assetManifest';
import { resolveCharacterVisualProfile } from '../render/CharacterVisualRegistry';

export type CombatPortraitCrop = 'upper-body' | 'creature' | 'contain';
export function combatPortraitCrop(portrait: string | undefined): CombatPortraitCrop {
  if (!portrait) return 'contain';
  const profile = Object.values(assets.characterProfiles).find(value => value.ui === portrait);
  if (profile?.uiCropMode === 'upper-body') return 'upper-body';
  if (resolveCharacterVisualProfile(portrait)?.scaleFamily === 'SMALL_CREATURE') return 'creature';
  return 'contain';
}

export const combatHudEscape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character);

export interface CombatHudStatus {
  label: string;
  shortCode: string;
  turns?: number;
  color: string;
  borderColor: string;
  indicatorUrl?: string;
}

export interface CombatHudUnit {
  name: string;
  className?: string;
  team: 'player' | 'foe';
  portrait?: string;
  portraitCrop?: CombatPortraitCrop;
  level?: number;
  hp: number;
  maxhp: number;
  ap: number;
  maxap: number;
  alive: boolean;
  aptitude?: { name: string; desc: string } | null;
  statuses: readonly CombatHudStatus[];
}

export function renderCombatStatuses(statuses: readonly CombatHudStatus[], alive = true): string {
  if (!alive) return '<div class="status-row"><span class="status-chip status-chip--ko">K.O.</span></div>';
  if (!statuses.length) return '';
  return '<div class="status-row" aria-label="Altérations">' + statuses.map(status => {
    const name = combatHudEscape(status.label);
    const turns = status.turns ? `<span class="status-chip__turns">${status.turns}</span>` : '';
    const icon = status.indicatorUrl
      ? `<img src="${combatHudEscape(status.indicatorUrl)}" alt="" />`
      : `<span class="status-chip__code" aria-hidden="true">${combatHudEscape(status.shortCode)}</span>`;
    return `<span class="status-chip" title="${name}${status.turns ? ` · ${status.turns} tours` : ''}" aria-label="${name}${status.turns ? `, ${status.turns} tours` : ''}" style="--status-color:${combatHudEscape(status.color)};--status-border:${combatHudEscape(status.borderColor)}">${icon}${turns}</span>`;
  }).join('') + '</div>';
}

export function renderCombatUnitCard(unit: CombatHudUnit, statsHtml: string): string {
  const portrait = unit.portrait
    ? `<img class="combat-portrait--${unit.portraitCrop ?? combatPortraitCrop(unit.portrait)}" src="${combatHudEscape(unit.portrait)}" alt="" />`
    : `<span>${combatHudEscape(unit.name.charAt(0))}</span>`;
  const hpPercent = unit.maxhp > 0 ? Math.max(0, Math.min(100, Math.round(unit.hp / unit.maxhp * 100))) : 0;
  const apPips = Array.from({ length: Math.max(0, unit.maxap) }, (_, index) => `<i class="${index < unit.ap ? 'on' : ''}" aria-hidden="true"></i>`).join('');
  const aptitude = unit.aptitude
    ? `<div class="du-aptitude"><span class="du-aptitude__label">Don inné</span><strong>${combatHudEscape(unit.aptitude.name)}</strong><small>${combatHudEscape(unit.aptitude.desc)}</small></div>`
    : '';
  const level = Number.isFinite(unit.level) ? `<span class="du-level">Niv. ${unit.level}</span>` : '';
  return `<div class="details-unit"><div class="du-top"><div class="du-portrait">${portrait}</div><div class="du-id"><div class="nm">${combatHudEscape(unit.name)}</div><div class="du-role">${combatHudEscape(unit.className || '')}${level}</div></div><div class="du-team"><b class="team-badge">${unit.team === 'player' ? 'Allié' : 'Ennemi'}</b></div></div>` +
    `<div class="du-vitals"><div class="du-hp"><div class="unit-row"><span>PV</span><b>${unit.hp} / ${unit.maxhp}</b></div><div class="bar" role="meter" aria-label="Points de vie" aria-valuemin="0" aria-valuemax="${unit.maxhp}" aria-valuenow="${unit.hp}"><i style="width:${hpPercent}%"></i></div></div><div class="du-ap"><span>PA</span><div class="du-ap__pips" aria-label="${unit.ap} sur ${unit.maxap} points d'action">${apPips}</div></div></div>` +
    renderCombatStatuses(unit.statuses, unit.alive) + aptitude + statsHtml + '</div>';
}

export interface CombatHudTurnUnit { name: string; team: 'player' | 'foe'; portrait?: string; portraitCrop?: CombatPortraitCrop; alive: boolean; active: boolean }
export function renderCombatTurnOrder(order: readonly CombatHudTurnUnit[], round: number, step: string): string {
  const chips = order.map(unit => {
    const portrait = unit.portrait ? `<img class="combat-portrait--${unit.portraitCrop ?? combatPortraitCrop(unit.portrait)}" src="${combatHudEscape(unit.portrait)}" alt="" />` : `<span>${combatHudEscape(unit.name.charAt(0))}</span>`;
    return `<div class="chip ${unit.team === 'player' ? 'ally' : 'foe'}${unit.active ? ' active' : ''}${unit.alive ? '' : ' dead'}" title="${combatHudEscape(unit.name)}" aria-label="${combatHudEscape(unit.name)}${unit.active ? ', actif' : ''}"><div class="chip__portrait">${portrait}</div><div class="chip__name">${combatHudEscape(unit.name)}</div></div>`;
  }).join('');
  return `<div class="turn-center"><span>Manche</span><b>${round}</b><em>${combatHudEscape(step)}</em></div><div class="turn-sequence"><div class="turn-chips">${chips}</div></div>`;
}

export type CombatHudActionKey = 'move' | 'undo' | 'attack' | 'skill' | 'item' | 'wait';
export interface CombatHudAction { key: CombatHudActionKey; label: string; icon: string; detail: string; disabled: boolean; weaponIndex?: number }
export function selectedCombatAction(mode: string, pendingKey?: string, menuKind?: string): CombatHudActionKey | null {
  if (mode === 'move') return 'move';
  if (mode === 'target') return pendingKey === 'attack' ? 'attack' : pendingKey === 'item' ? 'item' : 'skill';
  if (menuKind === 'attack' || menuKind === 'skill' || menuKind === 'item') return menuKind;
  return null;
}
export function renderCombatActionDock(actions: readonly CombatHudAction[], selected: CombatHudActionKey | null): string {
  return actions.map(action => {
    const isSelected = selected === action.key;
    return `<button type="button" class="ico action-${action.key} campaign-ui-button campaign-ui-button--${action.disabled ? 'disabled' : 'secondary'}${action.disabled ? ' dis' : ''}${isSelected ? ' is-selected' : ''}" data-a="${action.key}"${action.weaponIndex == null ? '' : ` data-wi="${action.weaponIndex}"`} aria-pressed="${isSelected}" title="${combatHudEscape(action.detail)}"${action.disabled ? ' disabled' : ''}><span class="c" aria-hidden="true">${combatHudEscape(action.icon)}</span><span class="tx"><b>${combatHudEscape(action.label)}</b><small>${combatHudEscape(action.detail)}</small></span></button>`;
  }).join('');
}

export interface CombatHudSkill { id: string; name: string; cost: number; description: string; icon?: string; disabled: boolean; upgradeLevel?: number }
export function renderCombatSkillRows(skills: readonly CombatHudSkill[]): string {
  return skills.map(skill => `<button type="button" class="btn combat-skill campaign-ui-button campaign-ui-button--${skill.disabled ? 'disabled' : 'secondary'}${skill.disabled ? ' dis' : ''}" data-s="${combatHudEscape(skill.id)}"${skill.disabled ? ' disabled' : ''} title="${combatHudEscape(skill.description)}"><span class="combat-skill__icon" aria-hidden="true">${combatHudEscape(skill.icon || '✦')}</span><span class="combat-skill__copy"><b>${combatHudEscape(skill.name)}${skill.upgradeLevel ? ` +${skill.upgradeLevel}` : ''}</b><small>${combatHudEscape(skill.description)}</small></span><span class="combat-skill__cost">${skill.cost} PA</span></button>`).join('');
}

export interface CombatHudPreview { attacker: string; action: string; target: string; targetCount: number; helpful: boolean; cost?: number; accuracy?: number | null; estimate?: number; valueLabel?: string; alliesHit?: number }
export function renderCombatActionPreview(preview: CombatHudPreview): string {
  const metric = [preview.accuracy != null && !preview.helpful ? `${preview.accuracy}%` : '', preview.estimate ? `${combatHudEscape(preview.valueLabel || 'Dégâts')} ~${preview.estimate}` : '', preview.cost != null ? `${preview.cost} PA` : ''].filter(Boolean).join(' · ');
  return `<div class="action-preview__route"><span>${combatHudEscape(preview.attacker)}</span><i>→</i><strong>${combatHudEscape(preview.action)}</strong><i>→</i><span>${combatHudEscape(preview.target)}${preview.targetCount > 1 ? ` ×${preview.targetCount}` : ''}</span></div>` +
    (metric ? `<div class="action-preview__metrics">${metric}</div>` : '') +
    (preview.alliesHit ? `<strong class="action-preview__warning">⚠ ${preview.alliesHit} allié${preview.alliesHit > 1 ? 's' : ''} touché${preview.alliesHit > 1 ? 's' : ''}</strong>` : '');
}

export interface CombatHudObjective { title: string; condition: string; round: string; foesDone: number; foesTotal: number; squadLabel: string; squadValue: string; expanded: boolean }
export function renderCombatObjective(objective: CombatHudObjective): string {
  return `<details${objective.expanded ? ' open' : ''}><summary><span class="obj__eyebrow">Objectif</span><span class="obj__label">${combatHudEscape(objective.title)}</span><span class="obj__summary"><b>${objective.foesDone} / ${objective.foesTotal}</b><i>${combatHudEscape(objective.round)}</i></span><i class="obj__chevron" aria-hidden="true"></i></summary><div class="obj__body"><p class="obj__text">${combatHudEscape(objective.condition)}</p><div class="obj__sub"><span>Ennemis neutralisés</span><b>${objective.foesDone} / ${objective.foesTotal}</b></div><div class="obj__sub"><span>${combatHudEscape(objective.squadLabel)}</span><b>${combatHudEscape(objective.squadValue)}</b></div></div></details>`;
}

/** Widens the visible tactical field as narrow HUD rails consume the sides. */
export function combatHudCameraFov(viewportWidth: number, baseFov: number): number {
  return Math.max(baseFov, Math.min(60, baseFov + Math.max(0, 700 - viewportWidth) * 0.087));
}
