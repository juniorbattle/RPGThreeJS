import type { GameState } from '../game/types';
import { getReputationRule } from '../game/reputation';

export function selectCampaignStatus(state: GameState) {
  return {
    gold: state.gold,
    routeGold: state.run.temporaryLoot.gold,
    gems: state.inventory.materials.red_gem ?? 0,
    routeGems: state.run.temporaryLoot.inventory.materials.red_gem ?? 0,
    reputation: state.reputation,
    reputationLabel: getReputationRule(state.reputation).label,
  };
}
export type CampaignStatusSnapshot = ReturnType<typeof selectCampaignStatus>;

/** One movable, read-only view. Surface ownership prevents stale cleanup hiding its successor. */
export class CampaignStatusHud {
  readonly element = document.createElement('aside');
  private owner: HTMLElement | null = null;

  constructor(private readonly snapshot: () => CampaignStatusSnapshot) {
    this.element.className = 'campaign-status-hud';
    this.element.setAttribute('aria-label', 'État de la compagnie');
  }

  show(owner: HTMLElement, layout: 'journey' | 'traversal' = 'journey'): void {
    this.owner = owner;
    this.element.dataset.layout = layout;
    owner.append(this.element);
    this.refresh();
  }

  hide(owner?: HTMLElement): void {
    if (owner && owner !== this.owner) return;
    this.owner = null;
    this.element.remove();
  }

  refresh(): void {
    const value = this.snapshot();
    this.element.replaceChildren();
    for (const [label, secured, route] of [
      ['Or', value.gold, value.routeGold], ['Gemmes', value.gems, value.routeGems],
      ['Réputation', `${value.reputation} · ${value.reputationLabel}`, 0],
    ] as const) {
      const item = document.createElement('div');
      const name = document.createElement('small');
      name.textContent = label;
      const amount = document.createElement('span');
      amount.textContent = String(secured);
      item.append(name, amount);
      if (route) {
        const pending = document.createElement('em');
        pending.textContent = `+${route} route`;
        item.append(pending);
      }
      this.element.append(item);
    }
  }
}
