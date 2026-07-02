interface ExplorationViewOptions {
  root: HTMLElement;
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

  open(reputationLabel: string, securedGold: number, rest: RestSummary): Promise<ExplorationAction> {
    this.close();
    const restHint = rest.woundedCount <= 0
      ? 'Compagnie en pleine forme'
      : rest.canRest
        ? `${rest.woundedCount} unit&eacute;${rest.woundedCount > 1 ? 's' : ''} bless&eacute;e${rest.woundedCount > 1 ? 's' : ''} &middot; ${rest.cost} or`
        : `${rest.cost} or requis &middot; or insuffisant`;
    const section = document.createElement('section');
    section.className = 'exploration-stop';
    section.innerHTML = `
      <div class="exploration-stop__veil"></div>
      <header>
        <p class="eyebrow">Halte de run &middot; ${reputationLabel}</p>
        <h2>Refuge du Lion</h2>
        <p>Le butin est d&eacute;sormais s&eacute;curis&eacute;. Les feux du camp repoussent la brume.</p>
        <strong>+${securedGold} or plac&eacute; dans le coffre</strong>
        ${rest.message ? `<em class="exploration-stop__feedback">${rest.message}</em>` : ''}
      </header>
      <div class="exploration-stop__hotspots">
        <button type="button" data-action="clan"><span>&#9817;</span><b>Intendant</b><small>Pr&eacute;parer la compagnie</small></button>
        <button type="button" data-action="shop"><span>&curren;</span><b>Marchand</b><small>&Eacute;changer avec le butin s&eacute;curis&eacute;</small></button>
        <button type="button" data-action="skills"><span>&#10022;</span><b>Am&eacute;lioration</b><small>Renforcer les comp&eacute;tences</small></button>
        <button type="button" data-action="rest" ${rest.canRest ? '' : 'disabled'}><span>&#10010;</span><b>Repos</b><small>${restHint}</small></button>
        <button type="button" data-action="continue" class="exploration-stop__continue"><span>&#10140;</span><b>Reprendre la route</b><small>Quitter le refuge</small></button>
      </div>
    `;
    this.options.root.append(section);
    this.element = section;
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
    this.element?.remove();
    this.element = null;
  }
}
