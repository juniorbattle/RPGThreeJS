import { unitById } from '../game/catalog';
import { getAvailableRunNodes } from '../game/runSystem';
import type { GameState, RunNode } from '../game/types';

interface TravelViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  onSelect: (node: RunNode) => Promise<void>;
  onOpenMap: () => void;
  onOpenClan: () => void;
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
    section.innerHTML = `
      <div class="travel-view__sky"></div>
      <div class="travel-view__mist"></div>
      <div class="travel-view__road"></div>
      <header class="travel-view__hud">
        <div><p class="eyebrow">Run · ${state.run.regionId}</p><strong>Choisissez la prochaine étape</strong></div>
        <div class="travel-view__resources">
          <span>Butin ${state.run.temporaryLoot.gold}</span>
          <span>Réputation ${state.reputation}</span>
        </div>
        <div>
          <button type="button" data-action="clan">Compagnie</button>
          <button type="button" data-action="map">Carte stratégique</button>
        </div>
      </header>
      <div class="travel-view__choices">
        ${choices.map((node) => `
          <button type="button" class="route-choice" data-node="${node.id}">
            <span>${node.icon}</span>
            <small>${node.type}</small>
            <strong>${node.label}</strong>
          </button>
        `).join('') || '<p class="travel-view__end">La route s’achève ici.</p>'}
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
      <div class="travel-view__foreground"></div>
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
        section.classList.add('is-travelling');
        section.querySelectorAll('button').forEach((candidate) => { candidate.disabled = true; });
        await new Promise((resolve) => window.setTimeout(resolve, 720));
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

