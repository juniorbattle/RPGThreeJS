import type { CampaignStatusHud } from './CampaignStatusHud';
import { createCampaignIcon, type CampaignIcon } from './design-system/CampaignUi';
import type { RefugePresentation } from './RefugePresentation';

interface ExplorationViewOptions {
  root: HTMLElement;
  statusHud: CampaignStatusHud;
}

export type ExplorationAction = 'continue' | 'shop' | 'clan' | 'skills' | 'rest';

interface RestSummary {
  cost: number;
  woundedCount: number;
  canRest: boolean;
  message?: string;
}

export class ExplorationView {
  private element: HTMLElement | null = null;

  constructor(private readonly options: ExplorationViewOptions) {}

  open(presentation: RefugePresentation, reputationLabel: string, securedGold: number, rest: RestSummary): Promise<ExplorationAction> {
    this.close();
    const restHint = rest.woundedCount <= 0
      ? 'Compagnie en pleine forme'
      : rest.canRest
        ? `${rest.woundedCount} unit&eacute;${rest.woundedCount > 1 ? 's' : ''} bless&eacute;e${rest.woundedCount > 1 ? 's' : ''} &middot; ${rest.cost} or`
        : `${rest.cost} or requis &middot; or insuffisant`;
    const section = document.createElement('section');
    section.className = 'exploration-stop';
    section.dataset.refugeNode = presentation.nodeId;
    section.dataset.visualFamily = presentation.visualFamily;
    section.dataset.environmentContext = presentation.environmentContext;
    section.style.setProperty('--refuge-background', `url("${presentation.background}")`);
    section.innerHTML = `
      <div class="exploration-stop__veil"></div>
      <header>
        <p class="eyebrow"></p>
        <h2></h2>
        <p class="exploration-stop__description"></p>
        <strong class="exploration-stop__secured">+${securedGold} or plac&eacute; dans le coffre</strong>
        ${rest.message ? `<em class="exploration-stop__feedback">${rest.message}</em>` : ''}
      </header>
      <div class="exploration-stop__hotspots">
        <button type="button" data-action="clan"><b>Clan</b><small>G&eacute;rer la compagnie</small></button>
        <button type="button" data-action="shop"><b>Shop</b><small>&Eacute;changer avec le marchand</small></button>
        <button type="button" data-action="skills"><b>Am&eacute;lioration</b><small>Renforcer les comp&eacute;tences</small></button>
        <button type="button" data-action="rest" ${rest.canRest ? '' : 'disabled'}><b>Repos</b><small>${restHint}</small></button>
        <button type="button" data-action="continue" class="exploration-stop__continue"><b>Reprendre la route</b><small>Quitter le refuge</small></button>
      </div>
    `;
    section.querySelector<HTMLElement>('.eyebrow')!.textContent = `${presentation.eyebrow} · ${reputationLabel}`;
    section.querySelector<HTMLElement>('h2')!.textContent = presentation.title;
    section.querySelector<HTMLElement>('.exploration-stop__description')!.textContent = presentation.description;
    const icons: Record<ExplorationAction, CampaignIcon> = {
      clan: 'clan', shop: 'merchant', skills: 'upgrade', rest: 'rest', continue: 'destination',
    };
    section.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.prepend(createCampaignIcon(icons[button.dataset.action as ExplorationAction]));
    });
    this.options.root.append(section);
    this.element = section;
    this.options.statusHud.show(section);
    return new Promise((resolve) => {
      section.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.dataset.action as ExplorationAction;
          this.close();
          resolve(action);
        });
      });
    });
  }

  close(): void {
    if (this.element) this.options.statusHud.hide(this.element);
    this.element?.remove();
    this.element = null;
  }
}
