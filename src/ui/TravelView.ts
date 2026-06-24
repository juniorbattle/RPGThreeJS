import { unitById } from '../game/catalog';
import { getAvailableRunNodes } from '../game/runSystem';
import { assets } from '../render/assetManifest';
import type { GameState, RunNode, RunNodeType } from '../game/types';

interface TravelViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  onSelect: (node: RunNode) => Promise<void>;
  onOpenMap: () => void;
  onOpenClan: () => void;
}

// Presentation-only mapping. Risk/reward are derived from the node type so the
// cards read clearly; this never alters RunSystem data or outcomes.
const NODE_PRESENTATION: Record<RunNodeType, { label: string; risk: number; reward: number }> = {
  combat: { label: 'Combat', risk: 2, reward: 3 },
  event: { label: 'Événement', risk: 1, reward: 3 },
  mystery: { label: 'Mystère', risk: 2, reward: 2 },
  recruitment: { label: 'Recrutement', risk: 1, reward: 2 },
  shop: { label: 'Marchand', risk: 0, reward: 1 },
  refuge: { label: 'Refuge', risk: 0, reward: 1 },
  story: { label: 'Récit', risk: 1, reward: 2 },
  boss: { label: 'Boss', risk: 3, reward: 3 },
};

function ratingDots(value: number, max = 3): string {
  const filled = Math.max(0, Math.min(max, value));
  return (
    '<b>' + '◆'.repeat(filled) + '</b>' + '<em>' + '◇'.repeat(max - filled) + '</em>'
  );
}

function particleLayer(count = 10): string {
  let motes = '';
  for (let i = 0; i < count; i += 1) {
    const left = Math.round(Math.random() * 100);
    const delay = (Math.random() * 12).toFixed(2);
    const duration = (14 + Math.random() * 10).toFixed(2);
    const drift = (Math.random() * 24 - 12).toFixed(1);
    const scale = (0.45 + Math.random() * 0.4).toFixed(2);
    const alpha = (0.28 + Math.random() * 0.22).toFixed(2);
    motes += `<i style="--x:${left}%;--delay:${delay}s;--dur:${duration}s;--drift:${drift}px;--scale:${scale};--alpha:${alpha}"></i>`;
  }
  return motes;
}

export class TravelView {
  private element: HTMLElement | null = null;
  private busy = false;

  constructor(private readonly options: TravelViewOptions) {}

  open(): void {
    this.close();
    const state = this.options.getState();
    const choices = getAvailableRunNodes(state.run);
    const deployed = state.deployment.unitIds
      .map((id) => state.clan.members.find((unit) => unit.id === id))
      .filter((unit) => Boolean(unit))
      .slice(0, 4);
    const section = document.createElement('section');
    section.className = 'travel-view';
    section.style.setProperty('--travel-sky', `url('${assets.screens.travel.sky}')`);
    section.style.setProperty('--travel-mist', `url('${assets.screens.travel.mist}')`);
    section.innerHTML = `
      <div class="travel-view__sky"></div>
      <div class="travel-view__mist"></div>
      <div class="travel-view__glow"></div>
      <div class="travel-view__particles" aria-hidden="true">${particleLayer()}</div>
      <div class="travel-view__vignette"></div>
      <div class="travel-view__scene-dim" aria-hidden="true"></div>
      <header class="travel-view__hud">
        <div><p class="eyebrow">Run · ${state.run.regionId}</p><strong>Choisissez la prochaine étape</strong></div>
        <div class="travel-view__resources">
          <span>🪙 Butin ${state.run.temporaryLoot.gold}</span>
          <span>✶ Réputation ${state.reputation}</span>
        </div>
        <div class="travel-view__hud-actions">
          <button type="button" data-action="clan">Compagnie</button>
          <button type="button" data-action="map">Carte stratégique</button>
        </div>
      </header>
      <div class="travel-view__choices">
        ${choices.map((node) => {
          const meta = NODE_PRESENTATION[node.type];
          return `
          <button type="button" class="route-choice route-choice--${node.type}" data-node="${node.id}">
            <span class="route-choice__type">${meta.label}</span>
            <span class="route-choice__icon">${node.icon}</span>
            <strong class="route-choice__title">${node.label}</strong>
            <span class="route-choice__meta">
              <span class="route-choice__stat route-choice__stat--risk"><small>Risque</small><span class="dots">${ratingDots(meta.risk)}</span></span>
              <span class="route-choice__stat route-choice__stat--reward"><small>Récompense</small><span class="dots">${ratingDots(meta.reward)}</span></span>
            </span>
          </button>
        `;
        }).join('') || '<p class="travel-view__end">La route s’achève ici.</p>'}
      </div>
      <div class="travel-party" aria-label="Compagnie en marche">
        ${deployed.map((unit, index) => {
          const definition = unitById.get(unit!.definitionId);
          return `<div class="travel-hero" style="--hero-index:${index}">
            <img src="${definition?.portrait ?? ''}" alt="${unit!.name}">
            <span>${unit!.name}</span>
          </div>`;
        }).join('')}
      </div>
    `;
    this.options.root.append(section);
    this.element = section;
    section.querySelector('[data-action="map"]')?.addEventListener('click', () => this.options.onOpenMap());
    section.querySelector('[data-action="clan"]')?.addEventListener('click', () => this.options.onOpenClan());
    section.querySelectorAll<HTMLButtonElement>('[data-node]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (this.busy) return;
        const node = choices.find((candidate) => candidate.id === button.dataset.node);
        if (!node) return;
        this.busy = true;
        button.classList.add('is-selected');
        section.classList.add('is-travelling');
        section.querySelectorAll('button').forEach((candidate) => {
          candidate.disabled = true;
          candidate.setAttribute('aria-disabled', 'true');
        });
        await new Promise((resolve) => window.setTimeout(resolve, 420));
        this.close();
        await this.options.onSelect(node);
      });
    });
  }

  close(): void {
    this.element?.remove();
    this.element = null;
    this.busy = false;
  }
}

