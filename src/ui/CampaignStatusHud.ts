import type { GameState } from '../game/types';
import { getReputationRule } from '../game/reputation';
import { createCampaignIcon, decorateCampaignFrame } from './design-system/CampaignUi';

export function selectCampaignStatus(state: GameState) {
  return {
    gold: state.gold,
    routeGold: state.run.temporaryLoot.gold,
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

    const items = document.createElement('div');
    items.className = 'campaign-status-hud__items';

    const appendItem = (kind: 'gold' | 'reputation', label: string, amount: string, route = 0) => {
      const item = document.createElement('div');
      item.className = `campaign-status-hud__item campaign-status-hud__item--${kind}`;

      const icon = createCampaignIcon(kind);
      icon.classList.add('campaign-status-hud__icon');

      const copy = document.createElement('span');
      copy.className = 'campaign-status-hud__copy';
      const name = document.createElement('small');
      name.classList.add('campaign-ui-type--eyebrow');
      name.textContent = label;
      const amountNode = document.createElement('strong');
      amountNode.classList.add('campaign-ui-type--value');
      amountNode.textContent = amount;
      copy.append(name, amountNode);

      if (route) {
        const pending = document.createElement('em');
        pending.classList.add('campaign-ui-type--metadata');
        pending.textContent = `+${route} route`;
        copy.append(pending);
      }

      item.append(icon, copy);
      items.append(item);
    };

    appendItem('gold', 'Or', String(value.gold), value.routeGold);
    appendItem('reputation', 'Réputation', `${value.reputation} · ${value.reputationLabel}`);
    this.element.append(items);
    decorateCampaignFrame(this.element, 'compact');
  }
}
