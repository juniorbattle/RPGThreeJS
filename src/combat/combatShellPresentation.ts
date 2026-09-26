/** Combat shell markup. Rules, callbacks and state stay in legacyCombatRuntime. */
import { combatHudEscape as esc, combatPortraitFraming } from './combatHudPresentation';

interface PortraitUnit { name: string; className?: string; portrait?: string }
export interface DeploymentPreviewUnit extends PortraitUnit {
  hp: number; maxhp?: number; str?: number; mag?: number; end?: number; dex?: number; mov?: number;
}
export interface ResultParticipant { name: string; alive: boolean }
export interface ResultRewards { gold?: number; materials?: Record<string, number>; reputation?: number }
export interface ResultPresentation {
  tone: 'victory' | 'defeat' | 'wave'; title: string; subtitle: string; detailLabel: string;
  detail: string; buttonLabel: string; participants: readonly ResultParticipant[];
  rewards?: ResultRewards;
}

function portrait(unit: PortraitUnit): string {
  if (!unit.portrait) return `<span class="combat-shell-portrait__initial">${esc(unit.name.charAt(0))}</span>`;
  const framing = combatPortraitFraming(unit.portrait);
  return `<img class="combat-portrait--${framing.crop}" src="${esc(unit.portrait)}" alt=""${framing.style}>`;
}

export function renderDeploymentCard(unit: PortraitUnit, id: string, selected: boolean, deployed: boolean): string {
  return `<button type="button" class="deploy-card${selected ? ' is-selected' : ''}${deployed ? ' is-deployed' : ''}" data-unit="${esc(id)}" aria-pressed="${selected}" aria-label="${esc(unit.name)}${deployed ? ', déployé' : ''}">` +
    `<span class="deploy-card__portrait combat-shell-portrait">${portrait(unit)}</span><span class="deploy-card__copy"><b>${esc(unit.name)}</b><small>${esc(unit.className || '')}</small></span>` +
    `<i class="deploy-card__state" aria-hidden="true">${deployed ? 'En jeu' : 'Réserve'}</i></button>`;
}

export function renderDeploymentPreview(unit: DeploymentPreviewUnit, deployed: boolean): string {
  const maxhp = unit.maxhp ?? unit.hp;
  const hp = Math.max(0, unit.hp);
  const percent = maxhp > 0 ? Math.max(0, Math.min(100, Math.round(hp / maxhp * 100))) : 0;
  const stats: [string, number | undefined][] = [['FOR', unit.str], ['MAG', unit.mag], ['END', unit.end], ['DEX', unit.dex], ['MOV', unit.mov]];
  return `<div class="deploy-preview__eyebrow">${deployed ? 'Dans la formation' : 'Unité sélectionnée'}</div>` +
    `<div class="deploy-preview__identity"><div class="deploy-preview__portrait combat-shell-portrait">${portrait(unit)}</div><div><strong>${esc(unit.name)}</strong><span>${esc(unit.className || '')}</span></div></div>` +
    `<div class="deploy-preview__health"><span>PV</span><b>${hp} / ${maxhp}</b><div class="deploy-preview__bar" role="meter" aria-label="Points de vie" aria-valuemin="0" aria-valuemax="${maxhp}" aria-valuenow="${hp}"><i style="width:${percent}%"></i></div></div>` +
    `<div class="deploy-preview__stats">${stats.filter(([, value]) => Number.isFinite(value)).map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join('')}</div>`;
}

export function resultRewardRows(rewards?: ResultRewards): string {
  if (!rewards) return '';
  const rows: [string, string][] = [];
  if (rewards.gold) rows.push(['Or', `+${rewards.gold}`]);
  for (const [key, amount] of Object.entries(rewards.materials ?? {})) {
    if (amount) rows.push([key === 'red_gem' ? 'Gemmes rouges' : key.replaceAll('_', ' '), `+${amount}`]);
  }
  if (rewards.reputation) rows.push(['Réputation', `${rewards.reputation > 0 ? '+' : ''}${rewards.reputation}`]);
  return rows.length ? `<div class="combat-result__rewards"><h2>Récompenses</h2><div class="combat-result__reward-list">${rows.map(([label, value]) => `<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div></div>` : '';
}

export function renderCombatResult(presentation: ResultPresentation): string {
  const { tone, title, subtitle, detailLabel, detail, buttonLabel, participants, rewards } = presentation;
  const squad = tone === 'wave' ? '' : `<div class="combat-result__company"><h2>État de la compagnie</h2><ul class="combat-result__squad">${participants.map(unit => `<li class="combat-result__unit${unit.alive ? '' : ' is-ko'}"><span>${esc(unit.name)}</span><b>${unit.alive ? 'Debout' : 'K.O.'}</b></li>`).join('')}</ul></div>`;
  return `<section class="combat-result-card panel" role="dialog" aria-modal="true" aria-labelledby="combat-result-title"><div class="combat-result__ornament" aria-hidden="true">✦</div>` +
    `<p class="combat-result__kicker">${tone === 'defeat' ? 'Route brisée' : tone === 'wave' ? 'Escarmouche' : 'Chronique victorieuse'}</p>` +
    `<h1 id="combat-result-title">${esc(title)}</h1><p class="combat-result__subtitle">${esc(subtitle)}</p>` +
    `<div class="combat-result__body"><div class="combat-result__meta"><span>${esc(detailLabel)}</span><b>${esc(detail)}</b></div>${tone === 'victory' ? resultRewardRows(rewards) : ''}${squad}</div>` +
    `<button class="btn combat-result__button" id="combat-result-action" type="button">${esc(buttonLabel)}</button></section>`;
}
