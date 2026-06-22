interface ExplorationViewOptions {
  root: HTMLElement;
}

export type ExplorationAction = 'continue' | 'shop' | 'clan';

export class ExplorationView {
  private element: HTMLElement | null = null;

  constructor(private readonly options: ExplorationViewOptions) {}

  open(reputationLabel: string, securedGold: number): Promise<ExplorationAction> {
    this.close();
    const section = document.createElement('section');
    section.className = 'exploration-stop';
    section.innerHTML = `
      <div class="exploration-stop__veil"></div>
      <header>
        <p class="eyebrow">Halte de run · ${reputationLabel}</p>
        <h2>Refuge du Lion</h2>
        <p>Le butin est désormais sécurisé. Les feux du camp repoussent la brume.</p>
        <strong>+${securedGold} or placé dans le coffre</strong>
      </header>
      <div class="exploration-stop__hotspots">
        <button type="button" data-action="clan"><span>♟</span><b>Intendant</b><small>Préparer la compagnie</small></button>
        <button type="button" data-action="shop"><span>¤</span><b>Marchand</b><small>Échanger avec le butin sécurisé</small></button>
        <button type="button" data-action="continue"><span>➜</span><b>Reprendre la route</b><small>Quitter le refuge</small></button>
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

